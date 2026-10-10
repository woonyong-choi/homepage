import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMarkdown, safeUrl, asset } from './markdown.mjs';

const fence = (name, data) => '```ui:' + name + '\n' + JSON.stringify(data) + '\n```';
test('HTML and script URLs cannot execute in document content', () => {
  const md = createMarkdown();
  const html = md.render('<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  for (const url of ['javascript:alert(1)', '//evil.test', '/things/\nfoo', '/articles/\\evil', '/a\u0000b', '/a b', ' /articles/', 'data:text/html,hi', 'JavaScript:alert(1)']) assert.throws(() => safeUrl(url), url);
  for (const url of ['/articles/foo/', '/wiki/', '/things/', '#top', 'https://example.com/']) assert.equal(safeUrl(url), url);
  assert.throws(() => asset('../outside.svg'));
});
test('nested components preserve unique IDs and do not duplicate footnotes', () => {
  const md = createMarkdown();
  const source = '## Repeated\n\nNote[^1]\n\n[^1]: Explanation\n\n' + fence('tabs',{items:[{label:'Mac',body:'## Repeated\n'+fence('callout',{title:'Note',body:'Body'})},{label:'iOS',body:'## Repeated'}]});
  const html = md.render(source,{});
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m)=>m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/id="fn1"/g) ?? []).length, 1);
  assert.ok(html.includes('role="tab"'));
  assert.ok(html.includes('id="repeated-3"'));
});
test('unknown component and malformed data fail the build', () => {
  const md = createMarkdown();
  assert.throws(()=>md.render(fence('unknown',{body:'text'})));
  assert.throws(()=>md.render(fence('gallery',{slides:[]})));
  assert.throws(()=>md.render(fence('cards',{variant:'unknown',items:[]})));
  assert.throws(()=>md.render(fence('cards',{items:[{variant:'unknown',title:'Invalid',href:'/things/'}]})));
  assert.throws(()=>md.render('```ui:tabs\nitems: [\n```'));
});
test('specimen renders every declared document component', () => {
  const source=readFileSync(new URL('./fixtures/syntax-specimen.md',import.meta.url),'utf8');
  const html=createMarkdown().render(source,{});
  for (const kind of ['group','feature','syntax-examples','feature-list','device','demos','feature-pair','callout','details','figure','fineprint','figure-grid','video','gallery','platform','tabs','cards','definitions','speech','keys','tooltip','keyboard','status-board','contact-form','form']) assert.ok(source.includes('ui:' + kind), 'missing specimen: ' + kind);
  for(const marker of ['<table class="app-table">','<blockquote>','task-list-item','language-javascript','app-callout','app-help-card is-centered','app-help-card is-grouped','app-inline-links','data-tabs','<video','<details','<dl','<kbd','popover','data-demo-form','footnote-ref']) assert.ok(html.includes(marker),marker);
});

test('fineprint and figure grid map to the reference DOM without raw html', () => {
  const md = createMarkdown();
  assert.equal(md.render(fence('fineprint', { body: '작은 *글씨* [링크](https://example.com/)' })), '<p class="app-fineprint">작은 <em>글씨</em> <a href="https://example.com/">링크</a></p>');
  const html = md.render(fence('figure-grid', { columns: 2, items: [{ src: '2-today-mac.png', alt: 'a', caption: 'one', rounded: true, href: 'https://example.com/' }, { src: '10-reminders-mac.png', alt: 'b', caption: 'two' }] }));
  assert.match(html, /^<div class="app-figure-grid has-two-columns"><div class="app-figure-grid-item"><figure class="app-figure"><a href="https:\/\/example.com\/"><img [^>]*class="is-rounded"/);
  assert.equal((html.match(/<figcaption>/g) ?? []).length, 2);
  assert.match(md.render(fence('figure-grid', { size: 'large', items: [{ src: '2-today-mac.png', alt: 'a' }] })), /app-figure-grid is-large"/);
  assert.throws(() => md.render(fence('figure-grid', { columns: 7, items: [{ src: '2-today-mac.png', alt: 'a' }] })));
  assert.match(md.render(fence('figure-grid', { columns: '3', items: [{ src: '2-today-mac.png', alt: 'a' }] })), /has-three-columns/);
  for (const columns of ['constructor', '__proto__', 'toString', 'hasOwnProperty', ['2'], { 2: 1 }, null, 0]) assert.throws(() => md.render(fence('figure-grid', { columns, items: [{ src: '2-today-mac.png', alt: 'a' }] })), /Invalid columns/, String(columns));
  assert.throws(() => md.render(fence('figure-grid', { items: [] })));
  assert.match(md.render(fence('fineprint', { body: '<script>x</script>' })), /&lt;script&gt;x&lt;\/script&gt;/);
});

test('highlight and cancelled tasks preserve escaping, code and nested formatting', () => {
  const md = createMarkdown();
  const html = md.render('::**focus**:: and `::literal::`\n\n- [~] **cancelled**\n- [x] complete\n\n::unsafe <script>alert(1)</script>::');
  assert.ok(html.includes('<mark><strong>focus</strong></mark>'));
  assert.ok(html.includes('<code>::literal::</code>'));
  assert.ok(html.includes('aria-label="취소된 작업"'));
  assert.ok(html.includes('<strong>cancelled</strong>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!md.render('\\::escaped::').includes('<mark>'));
});

test('task_labels_preserve_inline_content_and_exclude_nested_tasks', () => {
  const source = '- [ ] **상위** [링크](#target) `<code>`\n  - [x] 하위 & <script>\n- [~] 취소\n';
  const html = createMarkdown().render(source);
  assert.match(html, /<label><input[^>]*disabled=""[^>]*> <strong>상위<\/strong> <a href="#target">링크<\/a> <code>&lt;code&gt;<\/code><\/label>\n<ul/);
  assert.match(html, /<label><input[^>]*checked=""[^>]*disabled=""[^>]*> 하위 &amp; &lt;script&gt;<\/label>/);
  assert.equal((html.match(/<label>/g) ?? []).length, 2);
  assert.match(html, /aria-label="취소된 작업"/);
  assert.equal(html, createMarkdown().render(source));
});

test('gallery preserves selected slide, captions and validates its initial index', () => {
  const md = createMarkdown();
  const slides = [{src:'repeating-comparison-1-io80.png',label:'Before',caption:'<before>'},{src:'repeating-comparison-2-io80.png',label:'Now',caption:'after'}];
  const html = md.render(fence('gallery',{selected:1,slides}));
  assert.match(html, /app-tabs is-selector-segmented/);
  assert.match(html, /id="[^"]*-tab-1" role="tab" aria-selected="true"/);
  assert.match(html, /role="tabpanel"[^>]*tabindex="0"><figure class="app-figure"><img[^>]*repeating-comparison-2/);
  assert.doesNotMatch(html, /data-gallery|app-gallery/);
  assert.ok(html.includes('<figcaption>&lt;before&gt;</figcaption>'));
  assert.throws(() => md.render(fence('gallery',{selected:2,slides})));
  assert.throws(() => md.render(fence('gallery',{selected:-1,slides})));
});

test('inline interface labels escape HTML and preserve code and literal syntax', () => {
  const md = createMarkdown();
  const html = md.render('Press :kbd[⌘ Cmd] :kbd[I] in :menu[Edit]. :kbd[<script>] `:kbd[literal]`');
  assert.ok(html.includes('<kbd>⌘ Cmd</kbd> <kbd>I</kbd>'));
  assert.ok(html.includes('<b class="app-menu-label">Edit</b>'));
  assert.ok(html.includes('<kbd>&lt;script&gt;</kbd>'));
  assert.ok(html.includes('<code>:kbd[literal]</code>'));
  assert.ok(!md.render(String.raw`\:kbd[literal]`).includes('<kbd>'));
});

test('code_and_syntax_copy_controls_start_hidden_with_independent_status_regions', () => {
  const source = '```javascript\nconst value = "한글 < >";\n```\n\n' + fence('keys', { keys: ['⌘', 'C'] });
  const html = createMarkdown().render(source, { showSyntax: true });
  assert.equal((html.match(/data-tool="copy" aria-label="[^"]+" title="[^"]+" hidden/g) ?? []).length, 2);
  assert.equal((html.match(/data-tool-status role="status" aria-live="polite" aria-atomic="true"/g) ?? []).length, 2);
  assert.match(html, /aria-label="코드 복사"/);
  assert.match(html, /aria-label="작성 문법 복사"/);
  assert.match(html, /한글 &lt; &gt;/);
});

test('standalone_top_level_images_render_as_figures_and_everything_else_stays_a_paragraph', () => {
  const md = createMarkdown();
  assert.equal(md.render('![알림](/a.png)\n').trim(), '<figure class="app-figure"><img src="/a.png" alt="알림" loading="lazy" decoding="async"></figure>');
  assert.equal(md.render('[![알림](/a.png)](https://example.com/)\n').trim(), '<figure class="app-figure"><a href="https://example.com/"><img src="/a.png" alt="알림" loading="lazy" decoding="async"></a></figure>');
  for (const source of ['앞 글 ![알림](/a.png)\n', '![알림](/a.png) 뒤 글\n', '![하나](/a.png)![둘](/b.png)\n', '[글 ![알림](/a.png)](https://example.com/)\n', '> ![알림](/a.png)\n', '- ![알림](/a.png)\n', '- ![알림](/a.png)\n\n  본문\n', '1. ![알림](/a.png)\n']) assert.doesNotMatch(md.render(source), /<figure/, source);
  assert.match(md.render('- ![알림](/a.png)\n\n- 둘째\n'), /<li>\s*<p><img /);
  const callout = md.render('```ui:callout\ntitle: 알림\nbody: "![알림](/a.png)"\n```\n');
  assert.doesNotMatch(callout, /<figure/);
  assert.match(callout, /<p><img /);
});
