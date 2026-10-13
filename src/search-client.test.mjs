// #275: 격리 환경의 Worker 실패에도 동일한 검색 결과와 재시도를 보존한다.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { buildSync } from 'esbuild';

const state = { query: 'Promise', type: 'all', tags: [], page: 1 };
const index = { tags: { js: { label: 'JavaScript', aliases: ['JS'] } }, entries: [{
  id: 'one', title: '비동기 작업', description: '실행 순서', text: '본문에서만 Promise를 설명한다.',
  type: 'wiki', tags: ['js'], keywords: ['JavaScript', 'JS'], date: '', route: '/articles/one/',
}] };
const source = buildSync({ entryPoints: [new URL('./search-client.mjs', import.meta.url).pathname], bundle: true, write: false, format: 'iife', globalName: 'client', define: { 'import.meta.url': '"https://example.com/publication.js"' } }).outputFiles[0].text;

function clientWith(Worker) {
  let fail = false;
  const context = { Worker, URL, AbortSignal, Response, TextDecoder, Uint8Array, fetch: async () => new Response(fail ? '' : JSON.stringify(index), { status: fail ? 503 : 200 }) };
  runInNewContext(source, context);
  return { ...context.client, fail(value) { fail = value; } };
}

test('queryIndex_worker_unavailable_keeps_results_suggestions_and_retry', async () => {
  for (const Worker of [undefined, class { constructor() { throw new DOMException('blocked', 'SecurityError'); } }, class { addEventListener() {} postMessage() { throw new Error('worker transport closed'); } terminate() {} }]) {
    const client = clientWith(Worker);
    client.fail(true);
    await assert.rejects(async () => client.queryIndex('results', state));
    client.fail(false);
    const result = await client.queryIndex('results', state);
    assert.equal(result.result.counts.all, 1);
    assert.match(result.result.entries[0].excerpt, /Promise/);
    assert.equal(result.result.entries[0].text, undefined);
    const suggest = await client.queryIndex('suggest', { ...state, query: 'JS' });
    assert.equal(suggest.result.tags[0][0], 'js');
    assert.notEqual(result.id, suggest.id);
  }
});

test('queryIndex_worker_error_replays_concurrent_requests_and_ignores_late_messages', async () => {
  for (const event of ['error', 'messageerror']) {
    let worker;
    class Worker {
      listeners = {}; messages = []; terminated = false;
      constructor() { worker = this; }
      addEventListener(type, fn) { this.listeners[type] = fn; }
      postMessage(value) { this.messages.push(value); }
      terminate() { this.terminated = true; }
    }
    const client = clientWith(Worker);
    const first = client.queryIndex('results', state);
    const second = client.queryIndex('suggest', { ...state, query: 'JS' });
    worker.listeners[event]({ preventDefault() {} });
    worker.listeners.message({ data: { id: worker.messages[0].id, result: 'stale' } });
    const results = await Promise.all([first, second]);
    assert.equal(worker.terminated, true);
    assert.equal(results[0].result.counts.all, 1);
    assert.equal(results[1].result.tags[0][0], 'js');
    assert.equal((await client.queryIndex('results', state)).result.counts.all, 1);
    assert.equal(worker.messages.length, 2);
  }
});

test('queryIndex_normal_worker_keeps_message_transport', async () => {
  let listener;
  const client = clientWith(class {
    addEventListener(type, fn) { if (type === 'message') listener = fn; }
    postMessage({ id }) { listener({ data: { id, result: 'worker result' } }); }
  });
  assert.equal((await client.queryIndex('results', state)).result, 'worker result');
});
