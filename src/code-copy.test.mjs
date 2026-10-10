import { fileURLToPath } from 'node:url';
import { browserScripts } from './browser-scripts.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createMarkdown } from './markdown.mjs';

const script = browserScripts(fileURLToPath(new URL('./', import.meta.url))).get('document.js');

function element(attributes = {}, text = '') {
  const listeners = new Map();
  return { attributes: { ...attributes }, dataset: {}, textContent: text, hidden: true, listeners,
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, callback) { listeners.set(type, callback); } };
}

// 렌더된 블록의 구조(버튼, 상태 영역, 코드)만 가짜 문서로 옮겨 실제 document.js의 복사 처리를 실행한다.
function mount(clipboard, source = 'const a = 1; // 주석\n\t탭과 공백  \n') {
  const html = createMarkdown().render('```js\n' + source + '```\n');
  const code = element({}, html.match(/<code[^>]*>([\s\S]*?)<\/code>/)[1].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  const status = element({ role: 'status' });
  const button = element({ 'aria-label': '코드 복사' }, '복사');
  const block = { querySelector: selector => ({ code, '[data-copy-status]': status })[selector === 'code' ? 'code' : selector] };
  button.closest = selector => (selector === '.app-code' ? block : null);
  const timers = [];
  const document = { addEventListener() {}, querySelectorAll: selector => (selector === '[data-copy]' ? [button] : []) };
  runInNewContext(script, { getComputedStyle: () => ({ getPropertyValue: () => '2400ms' }), document, navigator: { clipboard }, setTimeout: (callback, delay) => timers.push({ callback, delay }), clearTimeout: () => timers.splice(0) });
  return { button, status, code, timers, click: () => button.listeners.get('click')() };
}

test('copy_button_appears_only_after_the_script_runs_and_writes_the_exact_source', async () => {
  const written = [];
  const source = '// 주석\n\tfunction a() {  \n\t}\n\n';
  const view = mount({ writeText: async value => { written.push(value); } }, source);
  assert.equal(view.button.hidden, false);
  await view.click();
  assert.deepEqual(written, [source]);
  assert.equal(view.button.textContent, '복사됨');
  assert.equal(view.button.getAttribute('aria-label'), '코드 복사됨');
  assert.equal(view.status.textContent, '코드 복사를 완료했습니다.');
  assert.equal(view.button.dataset.state, 'copied');
  assert.equal(view.timers.at(-1).delay, 2400);
  assert.equal(view.button.getAttribute('aria-disabled'), null);
});

test('copy_failure_is_announced_and_can_be_retried_then_labels_reset', async () => {
  let fail = true;
  const view = mount({ writeText: async () => { if (fail) throw new Error('denied'); } });
  await view.click();
  assert.equal(view.button.textContent, '복사 실패');
  assert.match(view.button.getAttribute('aria-label'), /실패\. 다시 시도/);
  assert.match(view.status.textContent, /실패했습니다/);
  assert.equal(view.button.dataset.state, 'failed');
  assert.equal(view.button.getAttribute('aria-disabled'), null);
  fail = false;
  await view.click();
  assert.equal(view.button.textContent, '복사됨');
  view.timers.at(-1).callback();
  assert.equal(view.button.textContent, '복사');
  assert.equal(view.button.dataset.state, undefined);
  assert.equal(view.button.getAttribute('aria-label'), '코드 복사');
});

test('copy_ignores_clicks_while_a_copy_is_pending_and_survives_a_missing_clipboard', async () => {
  let release;
  let calls = 0;
  const view = mount({ writeText: () => { calls += 1; return new Promise(resolve => { release = resolve; }); } });
  const first = view.click();
  await view.click();
  assert.equal(view.button.getAttribute('aria-disabled'), 'true');
  assert.equal(calls, 1);
  release();
  await first;
  assert.equal(view.button.textContent, '복사됨');
  const missing = mount(undefined);
  await missing.click();
  assert.equal(missing.button.textContent, '복사 실패');
});
