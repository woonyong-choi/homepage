import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

import { browserScripts } from './browser-scripts.mjs';

test('bundled_worker_searches_body_and_retries_without_module_requests', async () => {
  const scripts = browserScripts(fileURLToPath(new URL('.', import.meta.url)));
  const data = { tags: { js: { label: 'JavaScript', aliases: ['JS'] } }, entries: [{
    id: 'one', title: '비동기 작업', description: '실행 순서', text: '본문에서만 Promise를 설명한다.',
    type: 'wiki', tags: ['js'], keywords: ['JavaScript', 'JS'], date: '', route: '/articles/one/',
  }] };
  let listener;
  let fail = true;
  const messages = [];
  runInNewContext(scripts.get('search-worker.mjs'), {
    self: { addEventListener: (_type, callback) => { listener = callback; }, postMessage: value => messages.push(value) },
    fetch: async () => new Response(fail ? '' : JSON.stringify(data), { status: fail ? 503 : 200 }),
    AbortSignal, Response, TextDecoder, Uint8Array,
  });
  const state = { query: 'Promise', type: 'all', tags: [], page: 1 };
  await listener({ data: { id: 1, action: 'results', state } });
  assert.equal(messages[0].error, true);
  fail = false;
  await listener({ data: { id: 2, action: 'results', state } });
  assert.equal(messages[1].result.counts.all, 1);
  assert.match(messages[1].result.entries[0].excerpt, /Promise/);
  assert.equal(messages[1].result.entries[0].text, undefined);
  await listener({ data: { id: 3, action: 'suggest', state: { ...state, query: 'JS' } } });
  assert.equal(messages[2].result.tags[0][0], 'js');
  assert.ok(scripts.has('diagram.js'));
  assert.ok(!scripts.has('tabs.js'), 'shared tab helper is bundled into its entrypoint');
  assert.ok(scripts.has('blog-list.js'));
});
