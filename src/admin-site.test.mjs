import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createSiteSync, SITE_ATTEMPTS } from './admin-site.mjs';
import { postAssets } from './post-assets.mjs';

const sha = text => createHash('sha256').update(text).digest('hex');
const SOURCES = [{ file: 'assets/logo.svg', origin: 'project-original', license: 'MIT' }];

// 사이트 저장소 main 하나를 흉내 내는 가짜 GitHub. 파일은 경로→내용(문자열)이다.
function fakeSite(files) {
  let serial = 0;
  const commits = new Map([['c0', { files: { ...files }, parent: null }]]);
  const trees = new Map();
  const blobs = new Map();
  const site = { head: 'c0', calls: [], beforePatch: null, failOnce: null };
  site.files = () => commits.get(site.head).files;
  site.commit = (change, message = 'other') => {
    const id = `c${++serial}`;
    commits.set(id, { files: { ...site.files(), ...change }, parent: site.head, message });
    site.head = id;
  };
  const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  site.request = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    site.calls.push(`${method} ${path}`);
    if (site.failOnce?.(method, path)) { site.failOnce = null; throw new TypeError('Failed to fetch'); }
    const body = init.body ? JSON.parse(init.body) : null;
    if (path === 'git/ref/heads/main') {
      if (method === 'GET') return reply(200, { object: { sha: site.head } });
      site.beforePatch?.(); site.beforePatch = null;
      if (commits.get(body.sha).parent !== site.head) return reply(422, { message: 'Update is not a fast forward' });
      site.head = body.sha;
      return reply(200, {});
    }
    if (path === 'git/refs/heads/main') return site.request('git/ref/heads/main', init);
    if (path.startsWith('git/commits/')) return reply(200, { tree: { sha: `t-${path.slice(12)}` } });
    if (path === 'git/blobs') { const id = `b${++serial}`; blobs.set(id, Buffer.from(body.content, 'base64').toString()); return reply(201, { sha: id }); }
    if (path === 'git/trees') {
      const next = { ...commits.get(body.base_tree.slice(2)).files };
      for (const entry of body.tree) entry.sha === null ? delete next[entry.path] : (next[entry.path] = blobs.get(entry.sha));
      const id = `t${++serial}`; trees.set(id, next); return reply(201, { sha: id });
    }
    if (path === 'git/commits') { const id = `c${++serial}`; commits.set(id, { files: trees.get(body.tree), parent: body.parents[0], message: body.message }); return reply(201, { sha: id }); }
    if (path.startsWith('contents/')) {
      const file = decodeURIComponent(path.slice(9).split('?')[0]);
      const text = site.files()[file];
      if (text === undefined) return reply(404, { message: 'Not Found' });
      return init.headers?.accept === 'application/vnd.github.raw' ? reply(200, text) : reply(200, { content: Buffer.from(text).toString('base64') });
    }
    throw new Error(`unexpected ${method} ${path}`);
  };
  site.message = () => commits.get(site.head).message;
  return site;
}

function setup(extra = {}) {
  const files = { 'content/home.md': '홈 ![로고](/assets/logo.svg)', 'content/assets/logo.svg': '<svg/>', 'config/assets.json': JSON.stringify(SOURCES), ...extra };
  const snapshot = { version: 1, origin: 'vault', files: Object.fromEntries(Object.entries(files).filter(([path]) => path.startsWith('content/')).map(([path, text]) => [path, sha(text)])) };
  const site = fakeSite({ ...files, 'config/approved-content.json': JSON.stringify(snapshot) });
  const vault = { 'a.png': 'PNG-A', 'b.png': 'PNG-B', '스크린샷 (1).png': 'PNG-K', 'sub/c.png': 'PNG-C' };
  const sync = createSiteSync({
    repo: 'owner/homepage', request: site.request, readVaultAsset: async name => { if (!(name in vault)) throw new Error('404'); return new TextEncoder().encode(vault[name]); },
    digest: async bytes => sha(Buffer.from(bytes)), encode: bytes => Buffer.from(bytes).toString('base64'), decode: text => Buffer.from(text, 'base64').toString(), wait: async () => {},
  });
  const approved = () => JSON.parse(site.files()['config/approved-content.json']).files;
  const sources = () => JSON.parse(site.files()['config/assets.json']).map(source => source.file);
  return { site, sync, approved, sources };
}
const post = (name, body, state = 'public', slug = name.replace(/\.md$/, '')) => ({ name, slug, title: name, state, text: `---\nid: ${slug}\nslug: ${slug}\n---\n\n${body}\n` });

test('post_assets_follow_the_site_build_and_skip_code_and_external_addresses', () => {
  const text = '---\nid: a\nthumbnail: { src: /assets/t.png, alt: x }\n---\n\n![](<../assets/스크린샷 (1).png>) ![](../assets/sub/c.png) ![](https://cdn.example.com/assets/logo.png)\n\n```js\nconst a = "/assets/app.js";\n```\n';
  assert.deepEqual(postAssets(text), ['스크린샷 (1).png', 'sub/c.png', 't.png']);
});

test('publish_copies_post_images_their_origin_and_hashes_in_one_commit_and_clears_pending', async () => {
  const { site, sync, approved, sources } = setup();
  const item = post('26-10-28-a.md', '![그림](../assets/a.png)');
  assert.deepEqual((await sync.pending([item, post('draft.md', '', 'draft')])).publish, [item]);
  assert.equal(await sync.apply([{ post: item }]), true);
  assert.equal(site.files()['content/blog/26-10-28-a.md'], item.text);
  assert.equal(site.files()['content/assets/a.png'], 'PNG-A');
  assert.equal(approved()['content/assets/a.png'], sha('PNG-A'));
  assert.ok(sources().includes('assets/a.png'));
  assert.equal(site.message(), 'content(blog): 26-10-28-a.md 반영');
  assert.deepEqual(await sync.pending([item]), { publish: [], remove: [] });
  // 같은 내용을 다시 반영하면 커밋하지 않는다.
  assert.equal(await sync.apply([{ post: item }]), false);
});

test('a_commit_landing_meanwhile_is_kept_and_the_post_is_stacked_on_top', async () => {
  const { site, sync } = setup();
  site.beforePatch = () => site.commit({ 'content/pages/tech.md': '다른 변경' });
  await sync.apply([{ post: post('a.md', '본문') }]);
  assert.equal(site.files()['content/pages/tech.md'], '다른 변경');
  assert.equal(site.files()['content/blog/a.md'], post('a.md', '본문').text);
  assert.equal(site.calls.filter(call => call === 'PATCH git/refs/heads/main').length, 2);
});

test('lost_connections_are_retried_but_missing_permission_is_not', async () => {
  const { site, sync } = setup();
  site.failOnce = method => method === 'POST';
  assert.equal(await sync.apply([{ post: post('a.md', '본문') }]), true);
  const denied = setup();
  let calls = 0;
  const original = denied.site.request;
  denied.site.request = async (path, init) => { if (path.startsWith('git/ref')) { calls++; return { ok: false, status: 403, json: async () => ({}) }; } return original(path, init); };
  const deniedSync = createSiteSync({ repo: 'owner/homepage', request: (...args) => denied.site.request(...args), readVaultAsset: async () => new Uint8Array(), digest: async () => '', encode: () => '', decode: text => Buffer.from(text, 'base64').toString(), wait: async () => {} });
  await assert.rejects(deniedSync.apply([{ post: post('a.md', '본문') }]), /쓰기 권한이 없어/);
  assert.equal(calls, 1);
  // 계속 실패하면 정해진 횟수까지만 다시 시도한다.
  let attempts = 0;
  const flaky = createSiteSync({ repo: 'owner/homepage', request: async () => { attempts++; throw new TypeError('offline'); }, readVaultAsset: async () => new Uint8Array(), digest: async () => '', encode: () => '', decode: () => '', wait: async () => {} });
  await assert.rejects(flaky.apply([{ post: post('a.md', '') }]), /연결하지 못했습니다/);
  assert.equal(attempts, SITE_ATTEMPTS);
});

test('images_no_longer_used_by_any_public_file_are_removed_with_their_origin', async () => {
  const { site, sync, approved, sources } = setup();
  await sync.apply([{ post: post('a.md', '![](../assets/a.png) ![](../assets/b.png)') }, { post: post('b.md', '![](../assets/b.png)') }]);
  assert.equal(site.message(), 'content(blog): 글 2개 반영');
  // a.md에서 두 그림을 뺀다. a.png는 아무도 안 쓰므로 지우고, b.png는 b.md가 쓰므로 남긴다.
  await sync.apply([{ post: post('a.md', '그림 없음') }]);
  assert.equal(site.files()['content/assets/a.png'], undefined);
  assert.equal(approved()['content/assets/a.png'], undefined);
  assert.ok(!sources().includes('assets/a.png'));
  assert.equal(site.files()['content/assets/b.png'], 'PNG-B');
  // 글을 지우면 그 글만 쓰던 그림도 지운다. 홈 원고가 쓰는 로고는 남는다.
  await sync.apply([{ post: post('b.md', ''), remove: true }]);
  assert.equal(site.files()['content/blog/b.md'], undefined);
  assert.equal(site.files()['content/assets/b.png'], undefined);
  assert.deepEqual(sources(), ['assets/logo.svg']);
  assert.equal(site.files()['content/assets/logo.svg'], '<svg/>');
});

test('korean_and_folder_image_names_are_copied_and_a_missing_vault_image_fails_without_retry', async () => {
  const { site, sync, sources } = setup();
  await sync.apply([{ post: post('k.md', '![](<../assets/스크린샷 (1).png>) ![](../assets/sub/c.png)') }]);
  assert.equal(site.files()['content/assets/스크린샷 (1).png'], 'PNG-K');
  assert.equal(site.files()['content/assets/sub/c.png'], 'PNG-C');
  assert.ok(sources().includes('assets/sub/c.png'));
  const before = site.calls.length;
  await assert.rejects(sync.apply([{ post: post('m.md', '![](../assets/없는.png)') }]), /Vault에서 찾지 못했습니다: 없는.png/);
  assert.equal(site.calls.filter(call => call === 'GET git/ref/heads/main').length, site.calls.slice(0, before).filter(call => call === 'GET git/ref/heads/main').length + 1);
});

test('site_copies_of_unpublished_or_renamed_posts_are_found_for_removal', async () => {
  const { sync } = setup();
  await sync.apply([{ post: post('26-10-01-a.md', '가', 'public', 'a') }, { post: post('26-10-01-b.md', '나', 'public', 'b') }, { post: post('26-10-01-other.md', '다', 'public', 'keep') }]);
  // a는 Vault에서 비공개가 됐고, b는 다른 날짜 파일 이름으로 옮겨졌다. other는 Vault에 없어 다른 경로로 올린 사본일 수 있으니 둔다.
  // 옛 사본은 파일 이름이 아니라 글 머리의 주소로 판단한다. 파일 이름이 foo여도 주소가 other면 foo 글과 무관하다.
  await sync.apply([{ post: { ...post('26-10-01-foo.md', '라'), text: '---\nid: other\nslug: other\n---\n\n라\n' } }]);
  const vault = [post('26-10-01-a.md', '가', 'private', 'a'), post('26-10-02-b.md', '나', 'public', 'b'), post('26-10-03-foo.md', '마', 'public', 'foo')];
  const { publish, remove } = await sync.pending(vault);
  assert.deepEqual(publish.map(item => item.name).sort(), ['26-10-02-b.md', '26-10-03-foo.md']);
  assert.deepEqual(remove.map(item => item.name).sort(), ['26-10-01-a.md', '26-10-01-b.md']);
  assert.deepEqual(remove.map(item => item.slug).sort(), ['a', 'b']);
  // 이름을 바꾼 글의 새 사본과 옛 사본 내리기를 한 커밋으로 반영하면 같은 주소가 하나만 남는다.
  await sync.apply([{ post: vault[1] }, { post: remove.find(item => item.slug === 'b'), remove: true }]);
  assert.deepEqual((await sync.pending(vault)).remove.map(item => item.slug), ['a']);
});
