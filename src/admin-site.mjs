// 관리 화면에서 출간·삭제한 공개 글을 사이트 저장소의 승인 사본에 한 커밋으로 맞춘다.
// 바꾸는 것: 글 사본(content/blog), 글이 쓰는 그림(content/assets)과 출처 기록(config/assets.json), 승인 목록 해시.
// 브라우저에서 GitHub API로만 동작하므로 파일 시스템을 쓰지 않는다. 요청 함수는 호출하는 쪽이 넣는다.
export const SITE_ATTEMPTS = 3;
const SNAPSHOT = 'config/approved-content.json';
const SOURCES = 'config/assets.json';
const ASSET_LICENSE = 'all rights reserved; site owner post image';

/** 다시 시도하면 풀릴 수 있는 실패(연결 끊김, 동시 변경, GitHub 일시 오류)인지 표시한 오류. */
export class SiteError extends Error {
  constructor(message, { retry = false } = {}) {
    super(message);
    this.retry = retry;
  }
}

/** 글 원문이 쓰는 그림 파일 이름. 본문의 `../assets/이름`과 글 머리의 `/assets/이름`을 모두 찾는다. */
export function assetNames(text) {
  return [...new Set([...String(text).matchAll(/(?:\.\.)?\/assets\/([\w.%-]+)/g)].map(match => decodeURIComponent(match[1])))];
}

const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const removal = path => ({ path, mode: '100644', type: 'blob', sha: null });

/**
 * @param {{
 *   request(path: string, init?: object): Promise<Response>,
 *   readVaultAsset(name: string): Promise<Uint8Array>,
 *   digest(bytes: Uint8Array): Promise<string>,
 *   encode(bytes: Uint8Array): string,
 *   decode(base64: string): string,
 *   wait(ms: number): Promise<void>,
 *   repo: string,
 * }} io request는 `https://api.github.com/repos/<repo>/<path>` 요청이다
 */
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
    if (response.status === 403 || response.status === 404) throw new SiteError(`토큰에 ${io.repo} 쓰기 권한이 없어 사이트에 반영하지 못했습니다. 글은 Vault에 저장됐습니다. /admin/에서 두 저장소를 고른 토큰으로 다시 로그인해 주세요.`);
    // 409·422는 그사이 사이트 저장소가 바뀐 경우(빨리 감기 아님)다. 5xx는 GitHub 일시 오류다.
    if (!response.ok) throw new SiteError(`사이트 저장소에 반영하지 못했습니다(${response.status}). 글은 Vault에 저장됐습니다.`, { retry: response.status === 409 || response.status === 422 || response.status >= 500 });
    return response.json();
  }
  async function readText(path) {
    const response = await call(`contents/${encodePath(path)}?ref=main`, { headers: { accept: 'application/vnd.github.raw' } });
    if (response.status === 404) return null;
    if (!response.ok) await json(response);
    return response.text();
  }
  async function readSnapshot() {
    const file = await json(await call(`contents/${SNAPSHOT}?ref=main`));
    return JSON.parse(io.decode(file.content));
  }

  /** 공개 글 중 사이트 사본이 없거나 내용이 다른 글. 사이트에 반영되지 않은 글이다. */
  async function pending(posts) {
    const snapshot = await readSnapshot();
    const result = [];
    for (const post of posts) {
      if (post.state !== 'public') continue;
      if (snapshot.files[`content/blog/${post.name}`] !== await io.digest(bytes(post.text))) result.push(post);
    }
    return result;
  }

  // 지금 사이트 저장소의 마지막 커밋 위에 바뀐 파일을 얹은 커밋 하나를 만든다. 바뀐 것이 없으면 커밋하지 않는다.
  async function commitOnce(changes) {
    const head = await json(await call('git/ref/heads/main'));
    const base = await json(await call(`git/commits/${head.object.sha}`));
    const snapshot = await readSnapshot();
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
      const before = Object.hasOwn(snapshot.files, target) ? await readText(target) : null;
      for (const name of assetNames(before ?? '')) dropped.add(name);
      if (remove) {
        if (!Object.hasOwn(snapshot.files, target)) continue;
        delete snapshot.files[target];
        tree.push(removal(target));
        continue;
      }
      const text = bytes(post.text);
      const hash = await io.digest(text);
      if (snapshot.files[target] !== hash) await put(target, text);
      snapshot.files[target] = hash;
      for (const name of assetNames(post.text)) {
        kept.add(name);
        const path = `content/assets/${name}`;
        const content = await io.readVaultAsset(name);
        const assetHash = await io.digest(content);
        if (snapshot.files[path] !== assetHash) await put(path, content);
        snapshot.files[path] = assetHash;
        if (!sources.some(source => source.file === `assets/${name}`)) sources.push({ file: `assets/${name}`, origin: 'user-provided', license: ASSET_LICENSE, note: '관리 화면에서 글과 함께 올린 그림.' });
      }
    }
    // 바뀐 글이 예전에 쓰던 그림 중 다른 어떤 공개 파일도 쓰지 않는 그림은 지운다.
    const unused = [...dropped].filter(name => !kept.has(name) && Object.hasOwn(snapshot.files, `content/assets/${name}`));
    if (unused.length) {
      const changed = new Set(changes.map(({ post }) => `content/blog/${post.name}`));
      const others = Object.keys(snapshot.files).filter(path => !changed.has(path) && /\.(md|json|ya?ml)$/.test(path));
      const texts = await Promise.all(others.map(readText));
      for (const name of unused) {
        if (texts.some(text => text?.includes(name))) continue;
        delete snapshot.files[`content/assets/${name}`];
        tree.push(removal(`content/assets/${name}`));
        const index = sources.findIndex(source => source.file === `assets/${name}`);
        if (index >= 0) sources.splice(index, 1);
      }
    }
    if (!tree.length) return false;
    snapshot.files = Object.fromEntries(Object.entries(snapshot.files).sort(([a], [b]) => a.localeCompare(b)));
    await put(SNAPSHOT, bytes(`${JSON.stringify(snapshot, null, 2)}\n`));
    await put(SOURCES, bytes(`${JSON.stringify(sources, null, 2)}\n`));
    const titles = changes.map(({ post }) => post.title);
    const verb = changes.every(change => change.remove) ? '삭제' : '반영';
    const message = titles.length === 1 ? `content(blog): ${titles[0]} ${verb}` : `content(blog): 글 ${titles.length}개 ${verb}`;
    const nextTree = await json(await call('git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) }));
    const commit = await json(await call('git/commits', { method: 'POST', body: JSON.stringify({ message, tree: nextTree.sha, parents: [head.object.sha] }) }));
    // 빨리 감기만 허용한다. 그사이 다른 커밋이 들어왔으면 422로 거절되고, 처음부터 다시 읽어 얹는다.
    await json(await call('git/refs/heads/main', { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) }));
    return true;
  }

  /**
   * 바뀐 글을 사이트 저장소에 반영한다. 연결 끊김·동시 변경·일시 오류는 최신 상태를 다시 읽어 SITE_ATTEMPTS번까지 시도한다.
   * @param {{ post: { name: string, title: string, text: string }, remove?: boolean }[]} changes
   * @returns {Promise<boolean>} 커밋을 만들었는지
   */
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
