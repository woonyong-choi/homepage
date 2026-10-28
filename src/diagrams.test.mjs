import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { renderArticle } from './article-renderer.mjs';
const renderMarkup = async (body, options = {}) => (await renderArticle({ id: options.pageId ?? 'diagram', description: '', body }, options)).html;
import { compileDiagrams } from './diagrams.mjs';
import { bindTabs } from '@woonyong-choi/design-tokens/ui/runtime/tabs.js';

const source = 'diagramplay\nbox a "서버" badge="APP"\nbox b "저장소" badge="DATA"\na -> b\nscene "구조"\nscene "트래픽" mode=loop for=3s\n  track a -> b every=1s time=500ms\n';

test('repeated_diagrams_are_built_once_and_embed_static_html_with_original_source', async () => {
  const input = `\`\`\`diagramplay\n${source}\`\`\`\n\n:::note\n같은 도표를 다시 넣어도 한 번만 만든다.\n:::\n\n\`\`\`diagramplay name=again\n${source}\`\`\`\n`;
  const sources = new Map();
  await renderMarkup(input, { pageId: 'diagrams', diagramSources: sources });
  assert.equal(sources.size, 1);
  const { diagrams, assets } = await compileDiagrams(sources);
  assert.equal(assets.size, 1);
  const dom = new JSDOM(await renderMarkup(input, { pageId: 'diagrams', diagrams }));
  const frames = [...dom.window.document.querySelectorAll('iframe[data-diagram]')];
  assert.equal(frames.length, 2);
  assert.equal(frames[0].src, frames[1].src);
  const built = new JSDOM(assets.values().next().value.toString());
  assert.equal(JSON.parse(built.window.document.querySelector('.fl-source').textContent), source);
  assert.deepEqual([...built.window.document.querySelectorAll('[role=tab]')].map(tab => tab.textContent), ['구조', '트래픽']);
  built.window.close();
  dom.window.close();
});

test('diagram_width_uses_the_same_fence_options_without_recompiling_the_source', async () => {
  const sources = new Map();
  const diagrams = new Map([[source, { src: '/diagrams/example.html', title: '도표', dimensions: { width: 800, height: 500 } }]]);
  for (const [option, suffix] of [['', ''], ['width=wide', ' app-width-wide'], ['width=narrow', ' app-width-narrow']]) {
    const input = '```diagramplay ' + option + '\n' + source + '```\n';
    const html = await renderMarkup(input, { diagramSources: sources, diagrams });
    assert.ok(html.includes('class="app-diagram' + suffix + '"'));
  }
  assert.equal(sources.size, 1);
  for (const option of ['w-wide w-narrow', 'filename=x', 'unknown']) {
    await assert.rejects(async () => await renderMarkup('```diagramplay ' + option + '\n' + source + '```\n', { diagrams }));
  }
});

test('embedded_sources_reject_external_files_with_the_page_location', async () => {
  for (const text of [
    'diagramplay\nicons local "private"\nbox a "A" icon=local:secret\n',
    'diagramplay\nchart c "C" bar {\n  x "count"\n  data "private.json"\n  series n "N"\n}\n',
  ]) await assert.rejects(compileDiagrams(new Map([[text, 'private-page']])), /private-page:.*file-based/);
});

test('shared_tabs_wrap_keyboard_navigation_and_leave_one_tab_stop', () => {
  const dom = new JSDOM('<div role="tablist"><button role="tab">A</button><button role="tab">B</button><button role="tab">C</button></div>');
  const { window } = dom;
  const selected = [];
  const controller = bindTabs(window.document.querySelector('[role=tablist]'), index => selected.push(index));
  controller.select(0);
  controller.buttons[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.deepEqual(selected, [2]);
  assert.equal(window.document.activeElement, controller.buttons[2]);
  assert.deepEqual(controller.buttons.map(button => button.tabIndex), [-1, -1, 0]);
  controller.buttons[2].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.deepEqual(selected, [2, 0]);
  assert.deepEqual(controller.buttons.map(button => button.getAttribute('aria-selected')), ['true', 'false', 'false']);
  dom.window.close();
});
