import { readPost } from './post-file.js';
import { postAssets } from './post-assets.js';

export const SITE_ATTEMPTS = 3;
const SOURCES = 'config/assets.json';
const ASSET_LICENSE = 'all rights reserved; site owner post image';

export class SiteError extends Error {
  constructor(message, { retry = false } = {}) {
    super(message);
    this.retry = retry;
  }
}

const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const removal = path => ({ path, mode: '100644', type: 'blob', sha: null });

export function createSiteSync(io) {
  const bytes = text => new TextEncoder().encode(text);

  async function call(path, init) {
    try {
      return await io.request(path, init);
    } catch (error) {
      if (error?.message === 'unauthorized') throw error;
      throw new SiteError('사이트 저장소에 연결하지 못했습니다.', { retry: true });
    }
  }
  async function json(response) {
    if (response.status === 403 || response.status === 404) throw new SiteError(`토큰에 ${io.repo} 쓰기 권한이 없어 사이트에 반영하지 못했습니다. 글은 글 저장소에 저장됐습니다. /admin/에서 두 저장소를 고른 토큰으로 다시 로그인해 주세요.`);
    if (!response.ok) throw new SiteError(`사이트 저장소에 반영하지 못했습니다(${response.status}). 글은 글 저장소에 저장됐습니다.`, { retry: response.status === 409 || response.status === 422 || response.status >= 500 });
    return response.json();
  }
  async function readText(path) {
    const response = await call(`contents/${encodePath(path)}?ref=main`, { headers: { accept: 'application/vnd.github.raw' } });
    if (response.status === 404) return null;
    if (!response.ok) await json(response);
    return response.text();
  }
  async function readTree(ref = 'main') {
    const tree = await json(await call(`git/trees/${ref}?recursive=1`));
    return { files: Object.fromEntries(tree.tree.filter(item => item.type === 'blob').map(item => [item.path, item.sha])) };
  }

  async function pending(posts) {
    const remote = await readTree();
    const byName = new Map(posts.map(post => [post.name, post]));
    const publicSlugs = new Set(posts.filter(post => post.state === 'public').map(post => post.slug));
    const publish = [];
    for (const post of posts) {
      if (post.state !== 'public') continue;
      if (remote.files[`content/blog/${post.name}`] !== await io.digest(bytes(post.text))) publish.push(post);
    }
    const remove = [];
    for (const path of Object.keys(remote.files)) {
      if (!path.startsWith('content/blog/')) continue;
      const name = path.slice('content/blog/'.length);
      const post = byName.get(name);
      if (post) {
        if (post.state !== 'public') remove.push({ name, slug: post.slug, title: post.title || name });
        continue;
      }
      const text = await readText(path);
      const copy = text === null ? null : readPost(text);
      if (copy && publicSlugs.has(copy.slug)) remove.push({ name, slug: copy.slug, title: copy.title || name });
    }
    return { publish, remove };
  }

  async function commitOnce(changes) {
    const head = await json(await call('git/ref/heads/main'));
    const base = await json(await call(`git/commits/${head.object.sha}`));
    const remote = await readTree(base.tree.sha);
    const sources = JSON.parse(await readText(SOURCES) ?? '[]');
    const tree = [];
    const put = async (path, content) => {
      const blob = await json(await call('git/blobs', { method: 'POST', body: JSON.stringify({ content: io.encode(content), encoding: 'base64' }) }));
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    };
    const dropped = new Set();
    const kept = new Set();
    for (const { post, remove = false } of changes) {
      const target = `content/blog/${post.name}`;
      const before = Object.hasOwn(remote.files, target) ? await readText(target) : null;
      for (const name of (before === null ? [] : postAssets(before))) dropped.add(name);
      if (remove) {
        if (!Object.hasOwn(remote.files, target)) continue;
        delete remote.files[target];
        tree.push(removal(target));
        continue;
      }
      const text = bytes(post.text);
      const hash = await io.digest(text);
      if (remote.files[target] !== hash) await put(target, text);
      remote.files[target] = hash;
      for (const name of postAssets(post.text)) {
        kept.add(name);
        const path = `content/assets/${name}`;
        let content;
        try { content = await io.readSourceAsset(name); } catch { throw new SiteError(`「${post.title}」이(가) 쓰는 그림을 글 저장소에서 찾지 못했습니다: ${name}`); }
        const assetHash = await io.digest(content);
        if (remote.files[path] !== assetHash) await put(path, content);
        remote.files[path] = assetHash;
        if (!sources.some(source => source.file === `assets/${name}`)) sources.push({ file: `assets/${name}`, origin: 'user-provided', license: ASSET_LICENSE, note: '관리 화면에서 글과 함께 올린 그림.' });
      }
    }
    const unused = [...dropped].filter(name => !kept.has(name) && Object.hasOwn(remote.files, `content/assets/${name}`));
    if (unused.length) {
      const changed = new Set(changes.map(({ post }) => `content/blog/${post.name}`));
      const others = Object.keys(remote.files).filter(path => !changed.has(path) && /^(content|config)\//.test(path) && /\.(md|json|ya?ml)$/.test(path));
      const texts = await Promise.all(others.map(readText));
      for (const name of unused) {
        if (texts.some(text => text?.includes(name))) continue;
        delete remote.files[`content/assets/${name}`];
        tree.push(removal(`content/assets/${name}`));
        const index = sources.findIndex(source => source.file === `assets/${name}`);
        if (index >= 0) sources.splice(index, 1);
      }
    }
    if (!tree.length) return false;
    await put(SOURCES, bytes(`${JSON.stringify(sources, null, 2)}\n`));
    const titles = changes.map(({ post }) => post.title);
    const verb = changes.every(change => change.remove) ? '삭제' : '반영';
    const message = titles.length === 1 ? `content(blog): ${titles[0]} ${verb}` : `content(blog): 글 ${titles.length}개 ${verb}`;
    const nextTree = await json(await call('git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) }));
    const commit = await json(await call('git/commits', { method: 'POST', body: JSON.stringify({ message, tree: nextTree.sha, parents: [head.object.sha] }) }));
    await json(await call('git/refs/heads/main', { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) }));
    return true;
  }

  async function apply(changes) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await commitOnce(changes);
      } catch (error) {
        if (!(error instanceof SiteError) || !error.retry || attempt >= SITE_ATTEMPTS) throw error;
        await io.wait(1000 * attempt);
      }
    }
  }

  return { apply, pending };
}
