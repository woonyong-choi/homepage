import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { assetNames, createSiteSync, SITE_ATTEMPTS } from './admin-site.mjs';

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
  const vault = { 'a.png': 'PNG-A', 'b.png': 'PNG-B' };
  const sync = createSiteSync({
    repo: 'owner/homepage', request: site.request, readVaultAsset: async name => new TextEncoder().encode(vault[name]),
    digest: async bytes => sha(Buffer.from(bytes)), encode: bytes => Buffer.from(bytes).toString('base64'), decode: text => Buffer.from(text, 'base64').toString(), wait: async () => {},
  });
  const approved = () => JSON.parse(site.files()['config/approved-content.json']).files;
  const sources = () => JSON.parse(site.files()['config/assets.json']).map(source => source.file);
  return { site, sync, approved, sources };
}
const post = (name, body, state = 'public') => ({ name, title: name, state, text: `---\nid: ${name}\n---\n\n${body}\n` });

test('asset_names_cover_body_images_and_front_matter_thumbnails', () => {
  assert.deepEqual(assetNames('![a](../assets/a.png)\nthumbnail: { src: /assets/b%20c.png }\n![a](../assets/a.png)'), ['a.png', 'b c.png']);
});

test('publish_copies_post_images_their_origin_and_hashes_in_one_commit_and_clears_pending', async () => {
  const { site, sync, approved, sources } = setup();
  const item = post('26-10-28-a.md', '![그림](../assets/a.png)');
  assert.deepEqual(await sync.pending([item, post('draft.md', '', 'draft')]), [item]);
  assert.equal(await sync.apply([{ post: item }]), true);
  assert.equal(site.files()['content/blog/26-10-28-a.md'], item.text);
  assert.equal(site.files()['content/assets/a.png'], 'PNG-A');
  assert.equal(approved()['content/assets/a.png'], sha('PNG-A'));
  assert.ok(sources().includes('assets/a.png'));
  assert.equal(site.message(), 'content(blog): 26-10-28-a.md 반영');
  assert.deepEqual(await sync.pending([item]), []);
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
