// 문서 엔진의 출력을 홈페이지의 글 렌더러·레이아웃·목차·브라우저 동작과 함께 확인한다.
// Markdown 문법 자체의 해석과 HTML 모양은 document-engine이 시험한다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { parse } from 'yaml';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { browserScripts } from './browser-scripts.mjs';
import { documentOutline } from './document-navigation.mjs';
import { shiftHeadings, feedLevels, detailLevels } from './post-article.mjs';

const render = async source => (await renderArticle({ id: 'p', description: '', body: source })).html;
const outline = async source => renderArticle({ id: 'p', description: '', body: source });
const dom = html => new JSDOM(`<body>${html}</body>`).window.document;
const ids = html => [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const text = html => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'").replace(/&amp;/g, '&');

test('headings_and_ids_stay_unique_across_blocks_and_documents', async () => {
  const source = '## 설정\n\n::::tabs\n:::tab[A]\n## 설정\n\n### 설정\n:::\n:::tab[B]\n## 설정\n:::\n::::\n';
  const html = await render(source);
  const all = ids(html);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.filter(id => id.startsWith('p-설정')).length, 4);
  const first = (await renderArticle({ id: 'a', description: '', body: source }));
  const second = (await renderArticle({ id: 'b', description: '', body: source }));
  const merged = ids(first.html + second.html);
  assert.equal(new Set(merged).size, merged.length);
});

test('article_lead_and_toc_are_unchanged_when_directives_follow_the_lead', async () => {
  const page = { id: 'x', description: '도입문입니다.', body: '도입문입니다.\n\n## 첫 절\n\n:::note\n본문\n:::\n' };
  const result = (await renderArticle(page));
  assert.equal(result.leadHtml, '도입문입니다.');
  assert.deepEqual(result.headings.map(heading => heading.title), ['첫 절']);
  assert.match(result.html, /app-callout/);
  await assert.rejects(async () => (await renderArticle({ id: 'bad-page', description: 'd', body: ':::note\n본문\n' })), /bad-page 본문 1줄 :note/);
});

test('document_composition_example_renders_every_block_with_unique_ids', async () => {
  const text = readFileSync(new URL('./fixtures/document-composition.md', import.meta.url), 'utf8');
  const meta = parse(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  assert.equal(meta.slug, 'document-composition');
  assert.equal(meta.example, true);
  const { html, leadHtml, headings } = (await renderArticle({ ...meta, body }));
  assert.equal(leadHtml, meta.description);
  const document = dom(html);
  assert.equal(document.querySelectorAll('.app-tabs.is-platform [role=tab]').length, 3);
  assert.ok(document.querySelector('.app-steps li .app-inline-icon'));
  assert.ok(document.querySelector('.app-steps li kbd') && document.querySelector('.app-steps li .app-menu-label'));
  assert.equal(document.querySelectorAll('[data-player], .app-device').length, 0);
  assert.equal(document.querySelectorAll('.app-tabpanel [data-remote], .app-tabpanel figure:has(video) > figcaption').length, 0);
  assert.ok(document.querySelector('p.app-fineprint'));
  assert.ok(document.querySelector('.app-callout.is-warning') && document.querySelector('.app-tabpanel .app-callout'));
  assert.ok(document.querySelector('p button.app-tooltip + .app-tooltip-bubble'));
  assert.ok(document.querySelector('.app-code [data-tool="copy"]'));
  assert.ok(document.querySelector('dl.app-definitions'));
  const related = [...document.querySelectorAll('.app-related-grid > a.app-help-card.app-related-link')];
  assert.equal(related.length, 3);
  assert.ok(related.every(card => card.querySelector(':scope > .app-content-icon.is-small') && card.querySelector(':scope > strong') && !card.querySelector('span:not(.app-content-icon), p')));
  assert.deepEqual(related.map(card => card.textContent.trim()), ['Markdown 문법 전체 보기', '큐에 경계 두기', '증거로 원인 좁히기']);
  assert.equal(document.querySelectorAll('.is-centered, .app-inline-links').length, 0);
  assert.equal(headings.length, 7);
  const groups = [...document.querySelectorAll('.app-tabs.is-selector-numbers')];
  assert.deepEqual(groups.map(group => group.querySelectorAll('[role=tab]').length), [5, 2]);
  assert.ok(groups[1].classList.contains('app-width-wide'));
  assert.equal(document.querySelectorAll('.app-gallery, [data-gallery]').length, 0);
  assert.ok(document.querySelector('.app-tabs:not([class*=is-]) > [role=tablist]'), '옵션 없는 기본 탭');
  const labels = [...document.querySelectorAll('.app-tabs.is-selector-segmented')].map(group => [...group.querySelectorAll('[role=tab]')].map(button => button.textContent));
  assert.deepEqual(labels.map(group => group.length), [2, 2, 3]);
  assert.ok(labels.some(group => group.includes('변경 변경 변경 후')) && labels.some(group => group.includes('문제가 생겼을 때 되돌리는 방법')));
  const all = ids(html);
  assert.equal(new Set(all).size, all.length);
});

test('article_pages_have_no_automatic_related_section_or_edit_suggestion_but_keep_manual_content_and_footnotes', async () => {
  const body = '## 첫 절\n\n각주가 있는 문장입니다.[^n]\n\n## 이어서 읽을 글\n\n:::cards{variant=related}\n::card{title=직접 href=/articles/b/ icon=document}\n:::\n\n[^n]: 각주 본문\n';
  const mk = async (type, extra = {}) => { const page = { id: 'a', slug: 'a', route: '/articles/a/', type, title: 'A', description: '설명', tags: ['python'], contentIcon: { name: 'document' }, body, comments: false, publishedAt: '2026-01-01', ...extra }; return Object.assign(page, (await renderArticle(page))); };
  const topics = { python: { label: 'Python' } };
  for (const type of ['wiki', 'blog']) {
    const page = await mk(type);
    const html = articlePage(page, { topics, repositoryUrl: 'https://github.com/example/repo' });
    assert.doesNotMatch(html, /함께 읽기|수정 제안|app-related"|issues\/new/, type);
    const document = dom(html);
    // 직접 쓴 목록과 각주는 그대로다.
    assert.equal(document.querySelectorAll('.app-related-grid > a.app-related-link').length, 1, type);
    assert.equal(document.querySelector('.app-related-link').textContent.trim(), '직접');
    assert.ok(document.querySelector('.footnote-item'), type);
    assert.ok([...document.querySelectorAll('h2')].some(node => node.textContent === '이어서 읽을 글'), type);
  }
});

test('bottom_selector_tabs_use_the_same_runtime_for_click_arrows_home_and_end', async () => {
  const window = new JSDOM(`<body>${await render(':::tabs position-bottom\n@tab A\n\n가\n\n@tab B\n\n나\n\n@tab C\n\n다\n\n:::end\n')}</body>`, { runScripts: 'outside-only', url: 'https://example.com/' }).window;
  window.eval(browserScripts(fileURLToPath(new URL('./', import.meta.url))).get('document.js'));
  const buttons = [...window.document.querySelectorAll('[role=tab]')];
  const visible = () => [...window.document.querySelectorAll('[role=tabpanel]')].findIndex(panel => !panel.hidden);
  const press = (button, key) => button.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
  assert.equal(visible(), 0);
  buttons[1].click();
  assert.equal(visible(), 1);
  assert.equal(buttons[1].getAttribute('aria-selected'), 'true');
  assert.equal(buttons[1].tabIndex, 0);
  press(buttons[1], 'ArrowRight');
  assert.equal(visible(), 2);
  press(buttons[2], 'ArrowRight');
  assert.equal(visible(), 0);
  press(buttons[0], 'End');
  assert.equal(visible(), 2);
  press(buttons[2], 'Home');
  assert.equal(visible(), 0);
  assert.equal(window.document.activeElement, buttons[0]);
});

test('gallery_tabs_show_only_the_selected_panel_pause_hidden_videos_and_use_the_one_runtime', async () => {
  const source = ':::tabs selector-numbers\n@tab 영상\n\n::video{src=who-knows.svg poster=who-knows.svg alt=영상 controls}\n\n@tab 그림\n\n::figure{src=who-knows.svg alt=그림 caption=캡션}\n\n@tab 셋째\n\n짧은 글\n\n:::end\n';
  const window = new JSDOM(`<body>${await render(source)}</body>`, { runScripts: 'outside-only', url: 'https://example.com/' }).window;
  const paused = [];
  window.HTMLMediaElement.prototype.pause = function pause() { paused.push(this); };
  window.eval(browserScripts(fileURLToPath(new URL('./', import.meta.url))).get('document.js'));
  const panels = [...window.document.querySelectorAll('[role=tabpanel]')];
  const buttons = [...window.document.querySelectorAll('[role=tab]')];
  // 한 번에 한 패널만 보이고 나머지는 hidden이라 높이를 차지하지 않는다(예약 높이 없음).
  const visible = () => panels.map(panel => !panel.hidden);
  assert.deepEqual(visible(), [true, false, false]);
  assert.deepEqual(buttons.map(button => button.textContent), ['1', '2', '3']);
  buttons[1].click();
  assert.deepEqual(visible(), [false, true, false]);
  assert.equal(paused.length, 1, '숨겨진 패널의 영상은 멈춘다');
  assert.equal(paused[0].closest('[role=tabpanel]'), panels[0]);
  buttons[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.deepEqual(visible(), [false, false, true]);
  assert.equal(buttons[2].getAttribute('aria-selected'), 'true');
  assert.equal(buttons[1].tabIndex, -1);
});

test('heading_outline_uses_readable_text_and_keeps_existing_fragment_ids', async () => {
  const source = '## **안내** `clue diagnose` [설치](/install/)';
  const env = await renderArticle({ id: 'sample', description: '', body: `${source}\n\n${source}` });
  const { html } = env;

  assert.deepEqual(env.headings.map(({ id, title, level }) => ({ id, title, level })), [
    { id: 'sample-안내-clue-diagnose-설치-install', title: '안내 clue diagnose 설치', level: 2 },
    { id: 'sample-안내-clue-diagnose-설치-install-2', title: '안내 clue diagnose 설치', level: 2 },
  ]);
  assert.match(html, /<strong>안내<\/strong> <code>clue diagnose<\/code> <a href="\/install\/">설치<\/a>/);
  const document = new JSDOM(`${documentOutline(env.headings)}${html}`).window.document;
  for (const link of document.querySelectorAll('nav a')) {
    assert.equal(link.textContent, '안내 clue diagnose 설치');
    assert.ok(document.getElementById(link.getAttribute('href').slice(1)));
  }
});

test('heading_outline_preserves_literal_math_image_and_interface_label_text_safely', async () => {
  const env = await outline('## 수식 $x^2$ 키 :kbd[Ctrl] :tip[단어 <b>]{text="설명"} 이미지 ![**대체** `x`](/a.png) \\`문자\\` &amp; `<svg onload=bad>`');

  const title = '수식 x^2 키 Ctrl 단어 <b> 이미지 대체 x `문자` & <svg onload=bad>';
  assert.equal(env.headings[0].title, title);
  const document = new JSDOM(String(documentOutline(env.headings))).window.document;
  assert.equal(document.querySelector('a').textContent, title);
  assert.equal(document.querySelectorAll('svg, b, img, kbd').length, 0);
});

test('heading_outline_keeps_a_label_when_an_image_has_no_alternative_text', async () => {
  const env = await outline('## ![](/image.png)');

  const document = new JSDOM(String(documentOutline(env.headings))).window.document;
  assert.equal(document.querySelector('a').textContent, '![](/image.png)');
});

test('detail_and_feed_move_heading_tags_without_losing_the_written_level', async () => {
  const html = await render('# 가\n\n## 나\n\n### 다\n\n###### 라');
  assert.deepEqual([...shiftHeadings(html, detailLevels).matchAll(/<h(\d) [^>]*class="app-heading-(\d)"/g)].map(m => [m[1], m[2]]), [['2', '1'], ['2', '2'], ['3', '3'], ['6', '6']]);
  assert.deepEqual([...shiftHeadings(html, feedLevels).matchAll(/<h(\d) [^>]*class="app-heading-(\d)"/g)].map(m => [m[1], m[2]]), [['2', '1'], ['3', '2'], ['4', '3'], ['6', '6']]);
  const legacy = shiftHeadings('<h2 id="x">절</h2>', feedLevels);
  assert.equal(legacy, '<h3 class="app-heading-2" id="x">절</h3>');
  assert.equal(shiftHeadings(shiftHeadings(html, feedLevels), feedLevels).match(/class="/g).length, 4);
});

test('the_markdown_guide_example_renders_every_supported_construct_and_round_trips_code', async () => {
  const source = readFileSync(new URL('./fixtures/markdown-guide.md', import.meta.url), 'utf8');
  assert.match(source, /example: true/);
  const body = source.split('\n---\n').slice(1).join('\n---\n');
  const meta = parse(source.slice(4, source.indexOf('\n---\n')));
  const page = { ...meta, body: body.replace(/^\n/, '') };
  const rendered = (await renderArticle(page));
  const fences = [...page.body.matchAll(/^(`{3,})([^\n]*)\n([\s\S]*?)^\1\s*$/gm)].filter(match => !match[2].startsWith('ui:'));
  const blocks = [...rendered.html.matchAll(/<pre><code class="language-[^"]*">([\s\S]*?)<\/code><\/pre>/g)].map(match => text(match[1]));
  assert.equal(blocks.length, fences.length);
  fences.forEach((match, index) => assert.equal(blocks[index], match[3], `fence ${index}: ${match[2]}`));
  const labels = new Set([...rendered.html.matchAll(/class="app-tool-label">([^<]*)</g)].map(match => match[1].split(' · ')[0]));
  for (const label of ['JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'C#', 'Java', 'Kotlin', 'Rust', 'Go', 'Swift', 'Bash', 'SQL', 'JSON', 'YAML', 'HTML, XML', 'CSS', 'Dockerfile', 'Markdown', 'Plain text']) assert.ok(labels.has(label), label);
  for (const marker of ['app-heading-1', 'app-heading-6', '<s>', '<mark>', '<sub>', '<sup>', '<kbd>', '<dl>', '<details', 'class="footnotes"', 'is-center', 'is-right', 'contains-task-list', 'is-cancelled', '<hr>', '<blockquote>', '<img ']) assert.ok(rendered.html.includes(marker), marker);
  assert.doesNotMatch(rendered.html, /<script|href="javascript|onerror=alert\(1\)>/);
  const ids = [...(rendered.leadHtml + rendered.html).matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(rendered.leadHtml, '일반 Markdown만으로 글을 쓰는 방법과 지원하는 문법, 코드 블록 언어를 한 글에서 확인합니다.');
});

