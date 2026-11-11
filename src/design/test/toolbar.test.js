import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { bindToolbar } from '../dist/ui/runtime/toolbar.js';
import { cssTimeMs } from '../dist/ui/runtime/time.js';
import { ToolIcon } from '../dist/ui/toolbar.mjs';

function toolbar({ write, download, duration = '2400ms', source = '줄\r\n\t값 <>&' } = {}) {
  const buttons = Object.fromEntries(['copy', 'download'].map(action => [action, {
    dataset: {}, innerHTML: ToolIcon(action), attrs: {}, hidden: true,
    title: action === 'copy' ? '코드 복사' : 'HTML 다운로드',
    setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; },
    addEventListener(_, handler) { this.click = handler; },
  }]));
  const status = { textContent: '' };
  const root = { querySelector: selector => selector === '[data-tool-status]' ? status : buttons[selector.match(/"(\w+)"/)[1]], append() {} };
  const timers = [];
  const document = { createElement: () => ({ setAttribute() {}, select() {}, remove() {} }), addEventListener() {}, removeEventListener() {}, execCommand: () => false };
  runInNewContext(`(${bindToolbar.toString()})(root, options)`, {
    root, options: { source, download }, ToolIcon, cssTimeMs, document, isSecureContext: true,
    navigator: { clipboard: write ? { writeText: write } : undefined },
    getComputedStyle: () => ({ getPropertyValue: () => duration }),
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); }, clearTimeout() {},
  });
  return { ...buttons, status, reset: () => timers.at(-1).callback(), delay: () => timers.at(-1).delay };
}

test('shared_toolbar_waits_for_exact_copy_and_ignores_concurrent_clicks', async () => {
  const writes = []; let finish;
  const view = toolbar({ write: text => { writes.push(text); return new Promise(resolve => { finish = resolve; }); } });
  const pending = view.copy.click();
  await view.copy.click();
  assert.deepEqual(writes, ['줄\r\n\t값 <>&']);
  assert.equal(view.copy.dataset.state, undefined);
  assert.equal(view.copy.attrs['aria-disabled'], 'true');
  finish(); await pending;
  assert.equal(view.copy.dataset.state, 'done');
  assert.equal(view.status.textContent, '복사했습니다');
  assert.equal(view.copy.title, '복사했습니다');
  view.reset();
  assert.equal(view.copy.innerHTML, ToolIcon('copy'));
  assert.equal(view.status.textContent, '');
  assert.equal(view.copy.title, '코드 복사');
});

test('shared_toolbar_keeps_feedback_duration_after_css_minification', async () => {
  for (const duration of ['2400ms', ' 2.4s ']) {
    const view = toolbar({ write: async () => {}, duration });
    await view.copy.click();
    assert.equal(view.delay(), 2400);
  }
});

test('shared_toolbar_reports_failed_copy_and_allows_retry_without_false_success', async () => {
  let fail = true;
  const view = toolbar({ write: async () => { if (fail) throw Error('denied'); } });
  await view.copy.click();
  assert.equal(view.copy.dataset.state, 'failed');
  assert.equal(view.status.textContent, '복사하지 못했습니다');
  assert.equal(view.copy.title, '복사하지 못했습니다. 다시 시도하세요');
  fail = false; await view.copy.click();
  assert.equal(view.copy.dataset.state, 'done');
  assert.equal(view.copy.attrs['aria-disabled'], undefined);
  view.reset();
  assert.equal(view.copy.title, '코드 복사');
  const missing = toolbar(); await missing.copy.click();
  assert.equal(missing.copy.dataset.state, 'failed');
});

test('shared_toolbar_hides_unavailable_actions_and_announces_download_start', async () => {
  assert.equal(toolbar().download.hidden, true);
  const view = toolbar({ download: () => {} });
  assert.equal(view.download.hidden, false);
  await view.download.click();
  assert.equal(view.status.textContent, '다운로드를 시작했습니다');
  assert.equal(view.download.title, '다운로드를 시작했습니다');
  view.reset();
  assert.equal(view.download.title, 'HTML 다운로드');
  const failed = toolbar({ download: () => false });
  await failed.download.click();
  assert.equal(failed.status.textContent, '다운로드하지 못했습니다');
  assert.equal(failed.download.title, '다운로드하지 못했습니다. 다시 시도하세요');
});

