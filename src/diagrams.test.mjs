import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createMarkdown } from './markdown.mjs';
import { compileDiagrams } from './diagrams.mjs';
import { bindTabs } from './vendor/theme/ui/runtime/tabs.js';

const source = 'thinkflow\nbox a "서버" icon=server\nbox b "저장소" icon=db\na -> b\nscene "구조"\nscene "트래픽" mode=loop for=3s\n  track a -> b every=1s time=500ms\n';

test('nested_diagrams_are_built_once_and_embed_static_html_with_original_source', async () => {
  const md = createMarkdown();
  const input = `:::tabs\n@tab 도표\n\n\`\`\`thinkflow\n${source}\`\`\`\n@tab 같은 도표\n\n\`\`\`thinkflow\n${source}\`\`\`\n:::end\n`;
  const sources = new Map();
  md.render(input, { pageId: 'diagrams', diagramSources: sources });
  assert.equal(sources.size, 1);
  const { diagrams, assets } = await compileDiagrams(sources);
  assert.equal(assets.size, 1);
  const dom = new JSDOM(md.render(input, { pageId: 'diagrams', diagrams }));
  const frames = [...dom.window.document.querySelectorAll('iframe[data-diagram]')];
  assert.equal(frames.length, 2);
  assert.equal(frames[0].src, frames[1].src);
  const built = new JSDOM(assets.values().next().value.toString());
  assert.equal(JSON.parse(built.window.document.querySelector('.fl-source').textContent), source);
  assert.deepEqual([...built.window.document.querySelectorAll('[role=tab]')].map(tab => tab.textContent), ['구조', '트래픽']);
  built.window.close();
  dom.window.close();
});

test('diagram_width_uses_the_same_fence_options_without_recompiling_the_source', () => {
  const md = createMarkdown();
  const sources = new Map();
  const diagrams = new Map([[source, { src: '/diagrams/example.html', title: '도표', dimensions: { width: 800, height: 500 } }]]);
  for (const [option, suffix] of [['', ''], ['w-wide', ' app-width-wide'], ['w-narrow', ' app-width-narrow']]) {
    const input = '```thinkflow ' + option + '\n' + source + '```\n';
    const html = md.render(input, { diagramSources: sources, diagrams });
    assert.ok(html.includes('class="app-diagram' + suffix + '"'));
  }
  assert.equal(sources.size, 1);
  for (const option of ['w-wide w-narrow', 'filename=x', 'unknown']) {
    assert.throws(() => md.render('```thinkflow ' + option + '\n' + source + '```\n', { diagrams }));
  }
});

test('embedded_sources_reject_external_files_with_the_page_location', async () => {
  for (const text of [
    'thinkflow\nicons local "private"\nbox a "A" icon=local:secret\n',
    'thinkflow\nchart c "C" bar {\n  x "count"\n  data "private.json"\n  series n "N"\n}\n',
  ]) await assert.rejects(compileDiagrams(new Map([[text, 'private-page']])), /private-page:.*file-based/);
});

const single = 'thinkflow\nbox a "서버" icon=server\nbox b "저장소" icon=db\na -> b\n';
const tabsOf = (diagram, options = '') => `:::tabs${options}\n@tab 도표\n\n\`\`\`thinkflow\n${diagram}\`\`\`\n@tab 글\n\n본문\n:::end\n`;

test('multi_scene_diagram_tabs_fill_only_omitted_position_and_selector', async () => {
  const md = createMarkdown();
  const sources = new Map();
  for (const text of [source, single]) md.render(tabsOf(text), { pageId: 'scenes', diagramSources: sources });
  const { diagrams } = await compileDiagrams(sources);
  assert.equal(diagrams.get(source).scenes, 2);
  assert.ok(diagrams.get(single).scenes < 2);
  const render = (text, options = '', known = diagrams) => md.render(tabsOf(text, options), { pageId: 'scenes', diagrams: known });
  assert.equal(render(source), render(source, ' top segmented'));
  assert.notEqual(render(source), render(single));
  const unscened = new Map([...diagrams].map(([text, diagram]) => [text, { ...diagram, scenes: undefined }]));
  assert.equal(render(single), render(single, '', unscened));
  assert.notEqual(render(source, '', unscened), render(source));
  assert.equal(render(source, ' numbers'), render(source, ' top numbers'));
  assert.equal(render(source, ' box'), render(source, ' box top segmented'));
  assert.equal(render(source, ' selector=buttons'), render(source, ' top selector=buttons'));
  assert.equal(render(source, ' position=bottom'), render(source, ' position=bottom segmented'));
  assert.notEqual(render(source, ' box'), render(source));
});

test('platform_tabs_keep_their_behavior_with_multi_scene_diagrams_and_decisions_do_not_leak', async () => {
  const md = createMarkdown();
  const sources = new Map([[source, 'p']]);
  const { diagrams } = await compileDiagrams(sources);
  const fence = `\`\`\`thinkflow\n${source}\`\`\`\n`;
  const platformNew = `:::platform\n@tab Mac\n\n${fence}@tab Win\n\n본문\n:::end\n`;
  const platformLegacy = `::::platform\n:::tab[Mac]\n${fence}:::\n:::tab[Win]\n본문\n:::\n::::\n`;
  const plain = tabsOf(single);
  for (const input of [platformNew, platformLegacy]) {
    const html = md.render(input, { pageId: 'p', diagrams });
    assert.match(html, /^<section class="app-tabs is-platform" data-tabs data-platform>/);
    assert.equal(html, md.render(input, { pageId: 'p', diagrams: new Map([[source, { ...diagrams.get(source), scenes: undefined }]]) }));
  }
  const first = md.render(tabsOf(source) + plain, { pageId: 'p', diagrams });
  const sections = first.split('<section').slice(1);
  assert.equal(sections.length, 2);
  const alone = md.render(plain, { pageId: 'p', diagrams });
  assert.equal(`<section${sections[1]}`.replace(/component-p-\d+/g, 'X'), alone.replace(/component-p-\d+/g, 'X'));
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
