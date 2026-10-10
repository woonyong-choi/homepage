import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { createMarkdown } from './markdown.mjs';

test('appended_code_and_tabs_initialize_without_duplicate_handlers_on_existing_elements', async () => {
  const md = createMarkdown();
  const dom = new JSDOM('<main></main>', { url: 'https://example.com/blog/', runScripts: 'outside-only' });
  const { window } = dom;
  const writes = [];
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async value => writes.push(value) } });
  window.eval(readFileSync(new URL('./document.js', import.meta.url), 'utf8'));
  const main = window.document.querySelector('main');
  main.innerHTML = md.render('```js\nconst appended = true;\n```\n\n:::tabs\n@tab 첫째\n하나\n@tab 둘째\n둘\n:::end');
  for (let i = 0; i < 2; i++) window.document.dispatchEvent(new window.CustomEvent('content-added', { detail: main }));
  const copy = main.querySelector('[data-copy]');
  assert.equal(copy.hidden, false);
  copy.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(writes, ['const appended = true;\n']);
  const buttons = main.querySelectorAll('[role=tab]');
  buttons[1].click();
  assert.equal(buttons[1].getAttribute('aria-selected'), 'true');
  assert.equal(main.querySelectorAll('[role=tabpanel]')[0].hidden, true);
  dom.window.close();
});
