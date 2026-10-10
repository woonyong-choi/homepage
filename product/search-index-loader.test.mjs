import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

import { loadSearchIndex } from './search-index-loader.mjs';

// #63: 압축 전송의 성패와 관계없이 본문이 포함된 같은 색인을 반환한다.
const INDEX = { entries: [{ id: 'a', title: '검색', text: '본문만의 키워드', tags: ['search'] }], tags: { search: { label: '검색' } } };

test('loadSearchIndex_gzip_or_host_decoded_returns_complete_index', async context => {
  for (const body of [gzipSync(JSON.stringify(INDEX)), JSON.stringify(INDEX)]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(body));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    assert.equal(fetchMock.mock.calls.length, 1);
    assert.equal(fetchMock.mock.calls[0].arguments[0], '/search-index.json.gz');
    fetchMock.mock.restore();
  }
});

test('loadSearchIndex_failed_compressed_response_falls_back_with_same_deadline', async context => {
  for (const response of [new Response('', { status: 404 }), new Response(new Uint8Array([0x1f, 0x8b, 0])), new Response('{}')]) {
    const fetchMock = context.mock.method(globalThis, 'fetch', async url => url.endsWith('.gz') ? response : new Response(JSON.stringify(INDEX)));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    const calls = fetchMock.mock.calls;
    assert.deepEqual(calls.map(call => call.arguments[0]), ['/search-index.json.gz', '/search-index.json']);
    assert.equal(calls[0].arguments[1].signal, calls[1].arguments[1].signal);
    fetchMock.mock.restore();
  }
});

test('loadSearchIndex_unsupported_browser_requests_json_directly', async context => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'DecompressionStream');
  Object.defineProperty(globalThis, 'DecompressionStream', { configurable: true, value: undefined });
  try {
    const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(INDEX)));
    assert.deepEqual(await loadSearchIndex(), INDEX);
    assert.deepEqual(fetchMock.mock.calls.map(call => call.arguments[0]), ['/search-index.json']);
  } finally {
    Object.defineProperty(globalThis, 'DecompressionStream', descriptor);
  }
});

test('loadSearchIndex_total_failure_rejects_and_next_attempt_can_succeed', async context => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network failed'); });
  await assert.rejects(loadSearchIndex(), /network failed/);
  assert.equal(fetchMock.mock.calls.length, 2);
  fetchMock.mock.restore();
  context.mock.method(globalThis, 'fetch', async () => new Response(gzipSync(JSON.stringify(INDEX))));
  assert.deepEqual(await loadSearchIndex(), INDEX);
});

test('loadSearchIndex_abort_during_body_does_not_start_fallback', async context => {
  const controller = new AbortController();
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    async arrayBuffer() { controller.abort(); throw controller.signal.reason; },
  }));
  await assert.rejects(loadSearchIndex(controller.signal), { name: 'AbortError' });
  assert.equal(fetchMock.mock.calls.length, 1);
});

function cacheFixture(context, { denyOpen = false, denyWrite = false } = {}) {
  const entries = new Map();
  const cache = {
    async match(key) { return entries.get(key)?.clone(); },
    async put(key, response) { if (denyWrite) throw new Error('quota exceeded'); entries.set(key, response.clone()); },
    async delete(key) { return entries.delete(typeof key === 'string' ? key : new URL(key.url).pathname + new URL(key.url).search); },
    async keys() { return [...entries.keys()].map(key => ({ url: `https://site.example${key}` })); },
  };
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { async open(name) {
    assert.equal(name, 'publication-search-v1');
    if (denyOpen) throw new Error('storage denied');
    return cache;
  } } });
  context.after(() => { if (previous) Object.defineProperty(globalThis, 'caches', previous); else delete globalThis.caches; });
  return entries;
}

function revisionOf(data) { return createHash('sha256').update(JSON.stringify(data)).digest('hex'); }

// #79: 페이지마다 새 Worker를 만들어도 버전 확인 뒤 같은 본문 색인을 재사용한다.
test('loadSearchIndex_reuses_verified_cache_and_refreshes_changed_content', async context => {
  const cached = cacheFixture(context);
  let current = INDEX;
  const fetchMock = context.mock.method(globalThis, 'fetch', async url => new Response(
    url === '/search-version.json' ? JSON.stringify({ revision: revisionOf(current) }) : gzipSync(JSON.stringify(current))));
  assert.deepEqual(await loadSearchIndex(), INDEX);
  assert.deepEqual(await loadSearchIndex(), INDEX);
  assert.equal(fetchMock.mock.calls.filter(call => call.arguments[0].includes('.gz')).length, 1);
  assert.equal(fetchMock.mock.calls.filter(call => call.arguments[0] === '/search-version.json').length, 2);
  assert.equal(fetchMock.mock.calls[0].arguments[1].cache, 'no-store');
  current = { entries: [], tags: INDEX.tags };
  assert.deepEqual(await loadSearchIndex(), current);
  assert.equal(fetchMock.mock.calls.filter(call => call.arguments[0].includes('.gz')).length, 2);
  assert.deepEqual([...cached.keys()], [`/search-index.json?revision=${revisionOf(current)}`]);
});

test('loadSearchIndex_corrupt_cache_recovers_and_storage_failures_do_not_block_results', async context => {
  const cached = cacheFixture(context);
  const key = `/search-index.json?revision=${revisionOf(INDEX)}`;
  cached.set(key, new Response(JSON.stringify({ ...INDEX, entries: [] })));
  const fetchMock = context.mock.method(globalThis, 'fetch', async url => new Response(
    url === '/search-version.json' ? JSON.stringify({ revision: revisionOf(INDEX) }) : gzipSync(JSON.stringify(INDEX))));
  assert.deepEqual(await loadSearchIndex(), INDEX);
  assert.equal(fetchMock.mock.calls.length, 2);
  assert.deepEqual(await cached.get(key).json(), INDEX);
});

test('loadSearchIndex_storage_open_or_write_denial_uses_network', async context => {
  for (const options of [{ denyOpen: true }, { denyWrite: true }]) {
    await context.test(JSON.stringify(options), async child => {
      const cached = cacheFixture(child, options);
      child.mock.method(globalThis, 'fetch', async url => new Response(url === '/search-version.json'
        ? JSON.stringify({ revision: revisionOf(INDEX) }) : gzipSync(JSON.stringify(INDEX))));
      assert.deepEqual(await loadSearchIndex(), INDEX);
      assert.equal(cached.size, 0);
    });
  }
});

test('loadSearchIndex_missing_version_falls_back_without_trusting_saved_content', async context => {
  cacheFixture(context);
  const fetchMock = context.mock.method(globalThis, 'fetch', async url => url === '/search-version.json'
    ? new Response('', { status: 404 }) : new Response(gzipSync(JSON.stringify(INDEX))));
  assert.deepEqual(await loadSearchIndex(), INDEX);
  assert.deepEqual(fetchMock.mock.calls.map(call => call.arguments[0]), ['/search-version.json', '/search-index.json.gz']);
});

test('loadSearchIndex_mismatched_network_version_is_not_cached_and_retry_reads_new_version', async context => {
  const cached = cacheFixture(context);
  let revision = '0'.repeat(64);
  context.mock.method(globalThis, 'fetch', async url => new Response(url === '/search-version.json'
    ? JSON.stringify({ revision }) : url.includes('.gz') ? gzipSync(JSON.stringify(INDEX)) : JSON.stringify(INDEX)));
  await assert.rejects(loadSearchIndex(), /version mismatch/);
  assert.equal(cached.size, 0);
  revision = revisionOf(INDEX);
  assert.deepEqual(await loadSearchIndex(), INDEX);
  assert.equal(cached.size, 1);
});
