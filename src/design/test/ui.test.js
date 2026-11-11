import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as ui from '../dist/ui/index.mjs';

const { trusted } = ui;
const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
const html = (value) => String(value);

test('outline_levels_reject_attribute_injection', () => {
  for (const level of ['2" onclick="alert(1)', '2', 0, 7, 1.5, undefined]) {
    assert.throws(() => ui.DocumentOutline({ sections: [{ id: 'a', title: 'A', level }] }), /heading level/);
  }
  assert.match(html(ui.DocumentOutline({ sections: [{ id: 'a', title: 'A', level: 2 }] })), /data-heading-level="2"/);
});

test('tables_escape_names_preserve_semantic_rows_and_share_the_stream_wrapper', () => {
  const body = trusted('<tbody><tr><th scope="row">A</th><td>7</td></tr></tbody>');
  const props = { caption: '<원자료>', label: 'A & B' };
  const rendered = html(ui.Table({ ...props, body }));
  assert.equal(rendered, ui.Table.open(props) + body + ui.Table.close());
  assert.match(rendered, /role="region" aria-label="A &amp; B"/);
  assert.match(rendered, /class="app-table"><caption>&lt;원자료&gt;<\/caption>/);
  assert.ok(rendered.includes(String(body)));
  assert.throws(() => ui.Table({ body: '<tr>unchecked</tr>' }), /must be trusted/);
});

test('details_share_stream_wrappers_and_preserve_text_and_body_boundaries', () => {
  const title = '<중요> & "확인"';
  const body = trusted('<p>본문</p><pre><code>&lt;/details&gt;</code></pre>');
  for (const open of [false, true]) {
    const rendered = html(ui.Details({ title, open, body }));
    const stream = ui.Details.open({ open }) + ui.Details.summaryOpen() + ui.escape(title)
      + ui.Details.summaryClose() + body + ui.Details.close();
    assert.equal(rendered, stream);
    assert.match(rendered, /^<details class="app-details"(?: open)?><summary>&lt;중요&gt; &amp; &quot;확인&quot;<\/summary>/);
    assert.equal(rendered.includes(' open>'), open);
    assert.ok(rendered.includes(String(body)));
  }
  const nested = ui.Details({ title: '안쪽', body: trusted('<p>중첩 본문</p>') });
  const summary = trusted('<strong>요약</strong> <code>details</code>');
  assert.equal(ui.Details.open() + ui.Details.summaryOpen() + summary + ui.Details.summaryClose() + nested + ui.Details.close(),
    '<details class="app-details"><summary><strong>요약</strong> <code>details</code></summary><details class="app-details"><summary>안쪽</summary><p>중첩 본문</p></details></details>');
  assert.equal(ui.Details.open() + body + ui.Details.close(), '<details class="app-details"><p>본문</p><pre><code>&lt;/details&gt;</code></pre></details>');
  assert.throws(() => ui.Details({ title, body: '<p>unchecked</p>' }), /must be trusted/);
  assert.ok(ui.isTrusted(ui.Details({ title, body })));
  assert.ok(ui.OWNED_CLASSES.includes('app-details'));
});

test('shared_components_are_generated_from_the_source_and_imported_through_one_alias', () => {
  assert.equal(read('../dist/ui/index.mjs'), read('../ui/index.mjs'));
  assert.equal(JSON.parse(read('../../../package.json')).imports['#design/*'], './src/design/dist/*');
  assert.ok(Object.hasOwn(JSON.parse(read('../dist/manifest.json')).files, 'ui/index.mjs'));
});

test('slots_require_trusted_html_and_text_and_urls_are_handled_by_the_component', () => {
  assert.throws(() => ui.Callout({ title: 't', body: '<b>raw</b>' }), /must be trusted/);
  assert.throws(() => ui.Card({ href: 'javascript:alert(1)', title: 't' }), /Unsupported URL/);
  assert.throws(() => ui.Card({ href: '//evil.example/', title: 't' }), /Unsupported URL/);
  assert.throws(() => ui.Gallery({ id: 'a b', slides: [{ image: trusted('') }] }), /Invalid id/);
  const card = html(ui.Card({ href: '/a/?x=1&y="2"', title: '<i>제목</i>', description: 'a & b' }));
  assert.match(card, /href="\/a\/\?x=1&amp;y=&quot;2&quot;"/);
  assert.match(card, /<strong>&lt;i&gt;제목&lt;\/i&gt;<\/strong><p>a &amp; b<\/p>/);
  assert.match(html(ui.Callout({ title: 'T', tone: 'warning', fineprint: true, body: trusted('<p>본문</p>') })), /^<aside class="app-callout is-warning is-fineprint"><strong>T<\/strong><p>본문<\/p><\/aside>$/);
});

// 문서 탭(`Tabs`, platform 동기화)은 없앴다. 패널 묶음과 선택 줄은 갤러리와 도표 장면만 쓴다.
test('document_tabs_are_not_exported', () => {
  for (const name of ['Tabs', 'TAB_FRAMES', 'TAB_POSITIONS']) assert.equal(ui[name], undefined, name);
  assert.deepEqual(ui.TAB_SELECTORS, ['buttons', 'segmented', 'numbers']);
  const runtime = read('../ui/runtime/document.js');
  assert.doesNotMatch(runtime, /platform/);
});

test('card_variants_group_wrappers_and_related_have_one_definition', () => {
  const icon = trusted('<span class="app-content-icon"></span>');
  const base = { href: '/x/', title: 'T', description: 'D', icon };
  assert.match(html(ui.Card({ ...base, variant: 'centered' })), /^<a class="app-help-card is-centered" href="\/x\/"><span class="app-content-icon"><\/span><strong>T<\/strong><p>D<\/p><\/a>$/);
  assert.match(html(ui.Card({ ...base, compact: true })), /app-help-card is-compact has-no-icon/);
  assert.match(html(ui.Card({ ...base, horizontal: true })), /app-help-card is-horizontal"/);
  // 이어서 읽을 글 카드: 작은 아이콘 + 제목 한 줄, 설명은 그리지 않는다.
  assert.equal(html(ui.Card({ ...base, variant: 'related' })), '<a class="app-help-card app-related-link" href="/x/"><span class="app-content-icon"></span><strong>T</strong></a>');
  assert.doesNotMatch(html(ui.Card({ ...base, description: '<긴 설명>', variant: 'related' })), /긴 설명|<p>|<span>/);
  assert.match(html(ui.Card({ href: '/x/', title: 'T', variant: 'related' })), /app-related-link has-no-icon/);
  assert.throws(() => ui.Card({ ...base, variant: 'huge' }), /Unknown card variant/);
  assert.match(html(ui.Card({ ...base, variant: 'summary' })), /class="app-help-card is-summary"/);
  assert.match(html(ui.Card({ ...base, variant: 'summary' })), /<p class="app-card-summary">D<\/p>/);
  assert.match(html(ui.Card({ ...base, headingLevel: 3 })), /<strong role="heading" aria-level="3">T<\/strong>/);
  const cards = [ui.Card({ ...base }), ui.Card({ ...base })];
  assert.match(html(ui.CardGroup({ variant: 'related', cards })), /^<div class="app-related-grid">/);
  assert.match(html(ui.CardGroup({ variant: 'inline', cards })), /^<div class="app-inline-links">.*<\/a> <a /);
  assert.match(html(ui.CardGroup({ columns: 2, cards })), /^<div class="app-support-grid is-pair">/);
  assert.match(html(ui.CardGroup({ columns: 4, cards })), /^<div class="app-support-grid is-four">/);
  assert.match(html(ui.CardGroup({ columns: 5, cards })), /^<div class="app-support-grid is-five">/);
  assert.match(html(ui.CardGroup({ split: true, cards })), /^<div class="app-support-split"><a .*<div class="app-support-links"><a /);
  assert.equal(ui.CardGroup.open({ variant: 'related' }) + ui.CardGroup.close(), '<div class="app-related-grid"></div>');
});

test('card_display_options_preserve_names_without_forcing_media_or_multiple_columns', () => {
  assert.match(html(ui.Card({ href: '/x/', title: '<제목>', showTitle: false, headingLevel: 3 })), /<strong class="app-sr" role="heading" aria-level="3">&lt;제목&gt;<\/strong>/);
  const card = html(ui.BlogCard({ href: '/x/', title: '<제목>', showTitle: false }));
  assert.match(card, /aria-label="&lt;제목&gt;"/);
  assert.match(card, /class="app-blog-card-title app-sr">&lt;제목&gt;/);
  assert.doesNotMatch(card, /app-blog-cover/);
  assert.match(html(ui.BlogCard({ href: '/x/', title: '제목', cover: trusted('') })), /<div class="app-blog-cover"><\/div>/);
  for (const columns of [1, '1']) assert.equal(ui.CardGroup.open({ columns }), '<div class="app-support-grid is-single">');
  for (const columns of [0, 6, 1.5, {}, 'constructor']) assert.throws(() => ui.CardGroup.open({ columns }), /CardGroup columns/);
});

test('automatic_card_covers_escape_titles_and_preserve_explicit_cover_slots', () => {
  const title = '읽은 내용을 바로 이해하지 못해도 괜찮다는 생각과 한글 👨‍👩‍👧‍👦 제목 <script>&';
  const card = html(ui.BlogCard({ href: '/x/', title, automaticCover: true, showTitle: false }));
  assert.match(card, /class="app-title-cover is-long" aria-hidden="true"/);
  // 본문 제목이 보이면 같은 제목을 표지로 한 번 더 그리지 않는다.
  assert.match(html(ui.BlogCard({ href: '/x/', title, automaticCover: true })), /app-title-cover/);
  assert.match(card, /aria-label="읽은 내용을 바로 이해하지 못해도 괜찮다는 생각과 한글 👨‍👩‍👧‍👦 제목 &lt;script&gt;&amp;"/);
  assert.doesNotMatch(card, /<script>/);
  assert.match(html(ui.TitleCover({ title: '<짧은 제목>' })), /class="app-title-cover" aria-hidden="true".*&lt;짧은 제목&gt;/);
  const manual = html(ui.BlogCard({ href: '/x/', title, automaticCover: true, cover: trusted('<img src="/photo.jpg" alt="">') }));
  assert.match(manual, /src="\/photo.jpg"/);
  assert.doesNotMatch(manual, /app-title-cover/);
  const empty = html(ui.BlogCard({ href: '/x/', title, automaticCover: true, cover: trusted('') }));
  assert.match(empty, /<div class="app-blog-cover"><\/div>/);
  assert.doesNotMatch(empty, /app-title-cover/);
});

test('tag_sizes_preserve_default_markup_and_apply_to_overflow', () => {
  assert.equal(html(ui.Tag({ href: '/search/', label: '산책' })), '<a class="app-tag" href="/search/">산책</a>');
  const tags = [{ href: '/search/?tag=a', label: '산책', size: 'small' }, { href: '/search/?tag=b', label: '독서' }];
  const medium = html(ui.TagList({ tags, size: 'medium', limit: 1 }));
  assert.equal((medium.match(/class="app-tag is-medium"/g) ?? []).length, 2);
  assert.match(medium, /<summary class="is-medium">\+1<\/summary>/);
  assert.throws(() => ui.TagList({ tags: [], size: 'large' }), /Unknown tag size/);
  assert.throws(() => ui.Tag({ href: '/search/', label: '산책', size: 'large' }), /Unknown tag size/);
});

test('card_comment_counts_without_a_thread_are_text_and_unknown_counts_are_not_zero', () => {
  const base = { href: '/x/', title: '제목', publishedAt: '2026-10-19' };
  const zero = html(ui.BlogCard({ ...base, commentCount: 0 }));
  assert.match(zero, /<span class="app-blog-card-comments">댓글 · 0<\/span>/);
  assert.doesNotMatch(zero, /<svg|data-control-icon="comment"/);
  assert.doesNotMatch(zero, /<a class="app-blog-card-comments"/);
  const unknown = html(ui.BlogCard({ ...base, commentsHref: '/x/#comments' }));
  assert.match(unknown, /<a class="app-blog-card-comments" href="\/x\/#comments">댓글 보기<\/a>/);
  assert.doesNotMatch(unknown, /<svg|data-control-icon="comment"|댓글 · 0/);
  assert.doesNotMatch(html(ui.BlogCard(base)), /app-blog-card-comments/);
});

test('page_heading_uses_a_trusted_decorative_icon_and_escapes_the_title', () => {
  assert.equal(html(ui.PageHeading({ title: '<Search>' })), '<h1 class="app-page-heading">&lt;Search&gt;</h1>');
  assert.match(html(ui.PageHeading({ title: 'Search', icon: ui.ArticleIcon('question') })), /class="app-page-heading has-icon"><span class="app-page-heading-icon" aria-hidden="true"><svg/);
  assert.throws(() => ui.PageHeading({ title: 'Search', icon: '<svg/>' }), /trusted/);
});

test('gallery_links_panels_to_a_numbers_or_names_tab_list_and_only_the_selected_slide_is_visible', () => {
  const slides = [1, 2, 3].map((n) => ({ image: trusted(`<img alt="${n}">`), caption: n === 1 ? '첫째' : undefined }));
  const gallery = html(ui.Gallery({ id: 'gal', title: '둘러보기', slides }));
  assert.match(gallery, /^<section class="app-tabs" data-tabs><div class="app-tabpanel" id="gal-panel-0"/);
  for (const index of [0, 1, 2]) {
    assert.match(gallery, new RegExp(`id="gal-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="gal-panel-${index}" tabindex="${index ? '-1' : '0'}"`));
    assert.match(gallery, new RegExp(`id="gal-panel-${index}" role="tabpanel" aria-labelledby="gal-tab-${index}" tabindex="0"${index ? ' hidden' : ''}>`));
  }
  assert.match(gallery, /<div class="app-tablist is-after-panel is-numbers" role="tablist" aria-label="둘러보기">/);
  assert.match(gallery, /aria-controls="gal-panel-1" tabindex="-1" aria-label="슬라이드 2">2<\/button>/);
  assert.match(gallery, /id="gal-panel-0" role="tabpanel" aria-labelledby="gal-tab-0" tabindex="0"><figure class="app-figure"><img alt="1"><figcaption>첫째<\/figcaption><\/figure>/);
  // 보이지 않는 장은 hidden이라 높이를 차지하지 않는다. 선택 줄은 마지막 패널 뒤에 있다.
  assert.equal((gallery.match(/role="tabpanel"[^>]* hidden>/g) ?? []).length, 2);
  assert.ok(gallery.indexOf('role="tablist"') > gallery.lastIndexOf('role="tabpanel"'));
  // 선택한 장
  const second = html(ui.Gallery({ id: 'g', selected: 1, slides }));
  assert.match(second, /id="g-tab-1" role="tab" aria-selected="true"/);
  assert.match(second, /id="g-panel-1" role="tabpanel" aria-labelledby="g-tab-1" tabindex="0"><figure/);
  assert.match(second, /id="g-panel-0" role="tabpanel" aria-labelledby="g-tab-0" tabindex="0" hidden>/);
  // 이름이 모두 있으면 분할 줄
  assert.match(html(ui.Gallery({ id: 'g', slides: slides.map((s, i) => ({ ...s, label: `L${i}` })) })), /class="app-tablist is-after-panel is-segmented"/);
  assert.throws(() => ui.Gallery({ id: 'g', selected: 3, slides }), /out of range/);
  assert.throws(() => ui.Gallery({ id: 'g', slides: [] }), /requires slides/);
});

test('code_block_and_tooltip_keep_accessible_name_status_and_popover_links', () => {
  const block = html(ui.CodeBlock({ code: trusted('<code>x</code>'), language: 'C<>', filename: 'a&b.c' }));
  // 언어 이름은 머리줄로 보이지 않고 속성으로만 남는다. 파일 이름만 이름표가 된다.
  assert.match(block, /data-language="C&lt;&gt;"/);
  assert.match(block, /<span class="app-tool-label">a&amp;b.c<\/span>/);
  const plain = html(ui.CodeBlock({ code: trusted('<code>x</code>'), language: 'js' }));
  assert.doesNotMatch(plain, /app-tool-label/);
  assert.match(plain, /<div class="app-tool-header"><div class="app-toolbar"/);
  assert.match(block, /data-tool="copy" aria-label="코드 복사" title="코드 복사" hidden/);
  assert.match(block, /class="app-tool-status app-sr" data-tool-status role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(read('../dist/styles/toolbar.css'), /\.app-sr\s*\{/);
  assert.match(block, /<pre><code>x<\/code><\/pre><\/div>$/);
  assert.throws(() => ui.CodeBlock({ code: '<code>x</code>' }), /must be trusted/);
  const inline = html(ui.Tooltip({ id: 't1', label: '<뜻>', text: 'a & "b"' }));
  assert.match(inline, /popovertarget="t1" data-tooltip-trigger>&lt;뜻&gt;<\/button><span class="app-tooltip-bubble" id="t1" role="tooltip" popover>a &amp; &quot;b&quot;<\/span>/);
  assert.match(html(ui.TooltipBlock({ id: 't2', label: 'L', body: trusted('<p>내용</p>') })), /^<p><button class="app-tooltip".*<\/button><\/p><div class="app-tooltip-bubble" id="t2" popover><p>내용<\/p><\/div>$/);
});

// 코드 구문 계약: 소비자는 원문과 역할만 전달하고 테마가 안전한 마크업을 만든다.
test('syntax_tokens_share_one_role_contract_and_escape_code', () => {
  assert.equal(html(ui.SyntaxToken({ text: '<script>&', role: 'function' })), '<span class="app-syntax-function">&lt;script&gt;&amp;</span>');
  assert.equal(html(ui.SyntaxToken({ text: '<value>' })), '&lt;value&gt;');
  assert.throws(() => ui.SyntaxToken({ text: 'x', role: 'invented' }), /Unknown syntax role/);
  const css = read('../dist/styles.css');
  for (const role of ui.SYNTAX_ROLES) assert.ok(css.includes(`.${ui.syntaxClass(role)} {`), role);
});

// 스타일 규칙 없이 상태·위치만 알리는 클래스. 목록을 고정해 새 클래스가 몰래 늘지 않게 한다.
const HOOK_ONLY = new Set(['app-sr', 'app-project-showcase', 'is-detail', 'app-technologies', 'app-interviews', 'app-document-body', 'app-syntax-examples']);
test('shared_components_only_emit_classes_the_stylesheet_defines', () => {
  const css = read('../dist/styles.css');
  const source = ['components', 'patterns', 'layout', 'document', 'icons'].map(name => read(`../ui/${name}.mjs`)).join('\n');
  const classes = new Set([...source.matchAll(/class="([^"$]*)/g)].flatMap((match) => match[1].split(/\s+/)).concat([...source.matchAll(/ (is-[\w-]+|has-no-icon|app-breakout)/g)].map((match) => match[1])).filter(Boolean));
  assert.ok(classes.size > 25);
  const missing = [...classes].filter((name) => !css.includes(`.${name}`) && !HOOK_ONLY.has(name));
  assert.deepEqual(missing, []);
  for (const name of ui.OWNED_CLASSES) assert.ok(css.includes(`.${name}`) || HOOK_ONLY.has(name), name);
});

test('content_width_contract_is_shared_by_figure_gallery_video_and_code', () => {
  assert.equal(ui.contentWidth(), 'content');
  assert.equal(ui.contentWidth({}), 'content');
  for (const width of ui.WIDTHS) assert.equal(ui.contentWidth({ width, title: '본문' }), width);
  assert.throws(() => ui.contentWidth({ width: 'huge' }), /Unknown width/);
  const media = trusted('<img alt="">');
  const renderers = {
    contentWidth: props => ui.contentWidth(props),
    Figure: props => ui.Figure({ media, ...props }),
    Gallery: props => ui.Gallery({ id: 'g', slides: [{ image: media }], ...props }),
    Video: props => ui.Video({ id: 'v', src: '/a.mp4', poster: '/a.png', ...props }),
  };
  for (const [name, render] of Object.entries(renderers)) {
    for (const [key, values] of [['wide', [true, false, undefined]], ['size', ['compact', 'big', undefined]]]) {
      for (const value of values) assert.throws(() => render({ width: 'wide', [key]: value }), new RegExp(`Use width instead of ${key}`), `${name}.${key}: ${String(value)}`);
    }
  }
  assert.match(html(ui.Figure({ media, width: 'narrow' })), /^<figure class="app-figure app-width-narrow">/);
  assert.match(html(ui.Figure({ media, width: 'wide' })), /^<figure class="app-figure app-width-wide">/);
  assert.match(html(ui.Figure({ media })), /^<figure class="app-figure"><img alt=""><\/figure>$/);
  assert.match(html(ui.Gallery({ id: 'g', width: 'wide', slides: [{ image: media }] })), /^<section class="app-tabs app-width-wide"/);
  assert.match(html(ui.CodeBlock({ code: trusted('<code>x</code>'), width: 'wide' })), /^<div class="app-code app-tool-surface app-width-wide">/);
  assert.match(html(ui.Video({ id: 'v', src: '/a.mp4', poster: '/a.png', width: 'wide', remoteIcon: media })), /^<figure class="app-figure app-width-wide">/);
  const video = html(ui.Video({ id: 'ratio', src: '/a.mp4', poster: '/a.png', width: 'narrow', playerWide: true, playerWidth: 960, playerHeight: 540 }));
  assert.match(video, /^<figure class="app-figure app-width-narrow"><div class="app-player is-wide has-controls"/);
  assert.match(video, /width="960" height="540"/);
  assert.match(html(ui.Player({ id: 'p', src: '/a.mp4', poster: '/a.png', wide: true })), /^<div class="app-player is-wide"/);
  assert.throws(() => ui.CodeBlock({ code: trusted(''), width: 'x' }), /Unknown width/);
});

test('figure_video_device_and_small_prose_shapes_have_one_definition', () => {
  const media = trusted('<img alt="a">');
  assert.equal(html(ui.Figure({ media, href: '/x/', caption: '<c>' })), '<figure class="app-figure"><a href="/x/"><img alt="a"></a><figcaption>&lt;c&gt;</figcaption></figure>');
  assert.throws(() => ui.Figure({ media, href: 'javascript:1' }), /Unsupported URL/);
  assert.match(html(ui.FigureGrid({ columns: 2, size: 'small', figures: [ui.Figure({ media })] })), /^<div class="app-figure-grid is-small has-two-columns"><div class="app-figure-grid-item"><figure/);
  assert.match(read('../styles/prose.css'), /\.app-figure-grid-item > \.app-figure \{ margin: 0; \}/, 'grid cells drop the default figure margins');
  assert.throws(() => ui.FigureGrid({ columns: 'constructor', figures: [ui.Figure({ media })] }), /Invalid columns/);
  const video = html(ui.Video({ id: 'v1', src: '/a.mp4', poster: '/a.png', title: '제목', caption: '설명', controls: true, frame: 'iphone', remoteIcon: trusted('<img>'), deviceOverlay: trusted('<i></i>') }));
  assert.match(video, /<div class="app-device"><div class="app-device-screen"><div class="app-player has-controls" data-player id="v1">/);
  assert.match(video, /<figcaption>설명<\/figcaption>/);
  assert.equal(html(ui.Device({ screen: media })), '<div class="app-device"><div class="app-device-screen"><img alt="a"></div></div>');
  assert.doesNotMatch(video, /data-remote|app-media-controls/);
  const plainVideo = html(ui.Video({ id: 'v2', src: '/a.mp4', poster: '/a.png' }));
  assert.match(plainVideo, /data-native-controls/);
  assert.match(plainVideo, /data-player-play/);
  assert.doesNotMatch(plainVideo, /figcaption|data-remote/);
  assert.match(html(ui.Player({ id: 'p', src: '/a.mp4', poster: '/a.png' })), /playsinline muted preload="none"/);
  assert.throws(() => ui.Player({ id: 'p', src: 'javascript:1', poster: '/a.png' }), /Unsupported URL/);
  assert.equal(html(ui.Fineprint({ text: trusted('<b>x</b>') })), '<p class="app-fineprint"><b>x</b></p>');
  assert.equal(html(ui.Steps({ body: trusted('<ol></ol>') })), '<div class="app-steps"><ol></ol></div>');
  assert.equal(html(ui.Definitions({ items: [{ term: 'Q<', body: trusted('A') }] })), '<dl class="app-definitions"><dt>Q&lt;</dt><dd>A</dd></dl>');
  assert.equal(html(ui.Kbd({ text: '⌘ <' })), '<kbd>⌘ &lt;</kbd>');
  assert.equal(html(ui.Menu({ text: '파일' })), '<b class="app-menu-label">파일</b>');
  assert.equal(html(ui.InlineIcon({ icon: trusted('<svg></svg>') })), '<span class="app-inline-icon"><svg></svg></span>');
  assert.equal(html(ui.CancelledTask()), '<span class="app-cancelled-task" role="img" aria-label="취소된 작업"></span>');
});

test('code_blocks_scroll_long_lines_and_widths_use_shared_tokens', () => {
  const css = read('../styles/prose.css') + read('../styles/media.css');
  // 긴 줄은 줄을 바꾸지 않고 코드 블록 안에서 가로로 옮겨 본다. 페이지 폭은 늘지 않는다.
  const pre = /\.app-code pre \{([^}]*)\}/.exec(css)[1];
  assert.match(pre, /white-space: pre;/);
  assert.match(pre, /overflow-x: auto/);
  assert.match(/\.app-code \{([^}]*)\}/.exec(css)[1], /overflow: hidden/);
  assert.match(css, /\.app-width-narrow \{[^}]*var\(--spacing-width-narrow\)/);
  assert.match(css, /\.app-width-wide \{[^}]*var\(--component-width-wide\)[^}]*calc\(\(100% - var\(--component-width-wide\)\) \/ 2\)/);
  assert.doesNotMatch(css, /app-breakout/);
  for (const [, body] of css.matchAll(/\.app-width-\w+ \{([^}]*)\}/g)) assert.doesNotMatch(body, /transform|100vw/);
});

test('block_components_leave_inline_margins_to_the_shared_width_layer', () => {
  const dir = 'styles/';
  const roots = ['.app-figure', '.app-tabs', '.app-code'];
  let checked = 0;
  for (const file of ['media.css', 'prose.css', 'article.css', 'blog.css', 'cards.css', 'shell.css', 'controls.css']) {
    for (const [, selector, body] of read(`../${dir}${file}`).matchAll(/(?:^|\n)([^\n{}]+)\{([^}\n]*)\}/g)) {
      const targets = selector.split(',').map((part) => part.trim()).filter((part) => roots.some((root) => new RegExp(`^${root.replace('.', '\\.')}(?:[.:\\[]|$)`).test(part.split(/\s+/).at(-1)) && part.split(/\s+/).length === 1));
      checked += targets.length;
      if (targets.length) assert.doesNotMatch(body, /(?:^|[;\s])margin\s*:/, `${file}: ${selector.trim()} must use margin-block, margin-inline belongs to .app-width-*`);
    }
  }
  assert.ok(checked >= 3, 'root rules were not found');
  const css = read('../dist/styles.css');
  assert.match(css, /\.app-width-wide \{[^}]*margin-inline: calc\(\(100% - var\(--component-width-wide\)\) \/ 2\)/);
  assert.match(read('../dist/tokens.css'), /--component-width-wide: max\(100%, min\(var\(--primitive-reference-width\), calc\(100vw - 2 \* var\(--primitive-gutter\)\)\)\)/);
});

test('home_and_list_components_have_one_definition_with_escaped_text_and_checked_urls', () => {
  const icon = trusted('<img alt="">');
  const header = html(ui.SiteHeader({ label: '메뉴', homeLabel: '홈', title: 'A<B', icon, items: [] }));
  assert.match(header, /<span class="app-logo-icon"><img alt=""><\/span>A&lt;B<\/a>/);
  assert.throws(() => ui.SiteHeader({ label: '메뉴', homeLabel: '홈', icon: '<svg/>', items: [] }), /must be trusted/);
  const logo = trusted('<svg viewBox="0 0 10 2" aria-hidden="true"><path fill="currentColor"/></svg>');
  const branded = html(ui.SiteHeader({ label: '메뉴', homeLabel: '홈 <이동>', title: '텍스트 이름', icon, logo, items: [] }));
  assert.match(branded, /aria-label="홈 &lt;이동&gt;"><span class="app-logo-brand"><svg/);
  assert.doesNotMatch(branded, /텍스트 이름|app-logo-icon/);
  assert.throws(() => ui.SiteHeader({ label: '메뉴', homeLabel: '홈', logo: '<svg/>', items: [] }), /logo must be trusted/);
  const newsletter = { id: 'subscribe', field: 'email', label: '<이메일>', placeholder: 'me@example.com', button: '구독 & 신청', note: trusted('<p id="subscribe-state" class="app-newsletter-note">안내</p>') };
  const disabledForm = html(ui.EmailForm(newsletter));
  assert.match(disabledForm, /for="subscribe-email">&lt;이메일&gt;<\/label>/);
  assert.match(disabledForm, /autocomplete="email" disabled aria-describedby="subscribe-state"/);
  assert.match(disabledForm, /<button type="submit" disabled>구독 &amp; 신청<\/button>/);
  assert.doesNotMatch(disabledForm, / action=| method=| required/);
  const activeForm = html(ui.EmailForm({ ...newsletter, action: 'https://example.com/subscribe' }));
  assert.match(activeForm, /method="post" action="https:\/\/example.com\/subscribe"/);
  assert.match(activeForm, /autocomplete="email" required/);
  assert.doesNotMatch(activeForm, /disabled/);
  assert.throws(() => ui.EmailForm({ ...newsletter, action: 'javascript:1' }), /Unsupported URL/);
  assert.throws(() => ui.EmailForm({ ...newsletter, id: 'a b' }), /Invalid id/);
  assert.throws(() => ui.EmailForm({ ...newsletter, note: '<p>안내</p>' }), /note must be trusted/);
  assert.match(html(ui.Section({ variant: 'form', content: ui.EmailForm(newsletter) })), /app-landing-section app-landing-newsletter/);
  assert.ok(ui.OWNED_CLASSES.includes('app-newsletter'));
  const input = html(ui.TextInput({ id: 'title', label: '<제목>', placeholder: '이름 & 설명', describedBy: 'title-note' }));
  assert.equal(input, '<label class="app-sr" for="title">&lt;제목&gt;</label><input class="app-input" type="text" id="title" name="title" placeholder="이름 &amp; 설명" aria-describedby="title-note">');
  assert.match(html(ui.TextInput({ id: 'mail', name: 'email', label: '메일', type: 'email', value: 'a"b', required: true, disabled: true })), /type="email" id="mail" name="email" value="a&quot;b" required disabled>$/);
  assert.throws(() => ui.TextInput({ id: 'a b', label: 'x' }), /Invalid id/);
  assert.throws(() => ui.TextInput({ id: 'x', label: 'x', type: 'search' }), /Unknown input type/);
  assert.ok(ui.OWNED_CLASSES.includes('app-input'));
  const inputIcon = trusted('<svg class="app-input-icon"></svg>');
  const field = html(ui.TextInput({ id: 'q', label: '검색어', size: 'large', surface: 'field', icon: inputIcon, action: trusted('<button type="button"></button>'), role: 'combobox', controls: 'list' }));
  assert.equal(field, '<label class="app-sr" for="q">검색어</label><div class="app-input-field"><svg class="app-input-icon"></svg><input class="app-input is-large is-field" type="text" id="q" name="q" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="list"><button type="button"></button></div>');
  assert.match(html(ui.TextInput({ id: 'm', label: 'x', size: 'control', surface: 'card' })), /class="app-input is-control is-card"/);
  assert.throws(() => ui.TextInput({ id: 'x', label: 'x', size: 'huge' }), /Unknown input size/);
  assert.throws(() => ui.TextInput({ id: 'x', label: 'x', surface: 'glass' }), /Unknown input surface/);
  assert.throws(() => ui.TextInput({ id: 'x', label: 'x', role: 'combobox' }), /combobox requires controls/);
  assert.throws(() => ui.TextInput({ id: 'x', label: 'x', icon: '<svg/>' }), /icon must be trusted/);
  const forms = read('../styles/forms.css');
  for (const token of ['--color-input-background', '--color-input-border', '--radius-input-radius', '--spacing-input-height', '--color-input-placeholder']) assert.match(forms, new RegExp(`var\\(${token}\\)`), token);
  // 사용자 결정: 입력 칸은 초점에서 강조선(outline·box-shadow)을 두지 않는다.
  assert.match(forms, /\.app-input:is\(:focus, :focus-visible\) \{ outline: 0; box-shadow: none; \}/);
  assert.doesNotMatch(forms, /input-focus/);
  const intro = html(ui.SectionIntro({ id: 'a-title', icon, title: 'T<', description: trusted('<p>d</p>'), links: trusted('<a href="/x/">x</a>'), action: { href: '/more/', label: '더 보기' } }));
  assert.equal(intro, '<div class="app-landing-heading"><h2 id="a-title"><span class="app-landing-icon"><img alt=""></span> T&lt;</h2><p>d</p><p class="app-landing-social"><a href="/x/">x</a></p><p><a class="app-landing-action" href="/more/">더 보기</a></p></div>');
  assert.match(html(ui.SectionIntro({ level: 1, title: trusted('A<br>B') })), /^<div class="app-landing-heading"><h1>A<br>B<\/h1><\/div>$/);
  assert.throws(() => ui.SectionIntro({ level: 7, title: 't' }), /Invalid heading level/);
  assert.throws(() => ui.SectionIntro({ title: 't', action: { href: 'javascript:1', label: 'x' } }), /Unsupported URL/);
  assert.match(html(ui.SocialLink({ label: 'GitHub', icon })), /^<span role="img" aria-label="GitHub · 주소 준비 중"><img alt=""><\/span>$/);
  assert.equal(html(ui.SocialLink({ href: 'https://e.com/', label: 'E' })), '<a href="https://e.com/">E</a>');
  assert.equal(html(ui.SocialLink({ href: 'https://e.com/', label: 'E', icon })), '<a href="https://e.com/" aria-label="E"><img alt=""></a>');

  const rail = html(ui.FlowRail({ kind: 'interviews', direction: 'right', label: '인터뷰', ariaLabel: '카드', items: trusted('<li></li>') }));
  assert.equal(rail, '<div class="app-interviews" data-flow-rail data-flow-direction="right" data-flow-label="인터뷰"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="카드"><div class="app-flow-track" data-flow-track><ul class="app-flow-group" data-flow-group><li></li></ul></div></div></div>');
  assert.throws(() => ui.FlowRail({ kind: 'x', label: 'a', ariaLabel: 'b', items: trusted('') }), /Unknown rail/);

  const remote = html(ui.RemoteLink({ id: 'hero-player', href: '#hero-video', label: '영상', icon }));
  assert.match(remote, /^<a class="app-remote" href="#hero-video" data-remote="hero-player" data-scroll="down" data-label="영상" aria-label="영상"><img alt=""><span>영상<\/span><\/a>$/);
  const showcase = html(ui.ProjectShowcase({ id: 'hero', title: '제목"', src: '/v.mp4', poster: '/p.png' }));
  assert.match(showcase, /<section id="hero-video" class="app-project-showcase" aria-label="제목&quot;">.*id="hero-player" data-player><video controls playsinline preload="none" data-native-controls aria-label="제목&quot;" poster="\/p.png"><source src="\/v.mp4">제목&quot; · <a href="\/v.mp4">영상 파일 열기<\/a><\/video><button class="app-player-button" type="button" data-player-play aria-label="제목&quot; 영상 재생" hidden><svg data-control-icon="play"[^>]*>.*<\/svg><\/button>/);
  assert.throws(() => ui.ProjectShowcase({ id: 'hero', title: 't', src: 'javascript:1' }), /Unsupported URL/);

  const blog = html(ui.BlogCard({ href: '/a/', title: 'A&', level: 2, cover: icon, tags: trusted('<div></div>') }));
  assert.equal(blog, '<article class="app-blog-card"><a class="app-blog-card-link" href="/a/" aria-label="A&amp;"><div class="app-blog-cover"><img alt=""></div><div class="app-blog-card-body"><h2 class="app-blog-card-title">A&amp;</h2></div></a><div></div></article>');
  assert.match(html(ui.BlogCard({ href: '/a/', title: 'A', cover: icon, tags: trusted('') })), /<h3 class="app-blog-card-title">/);

  const metadataCard = html(ui.BlogCard({ href: '/a/', title: 'A', cover: icon, description: '<설명>', publishedAt: '2026-10-08', commentsHref: '/a/#comments', commentCount: 2, author: { name: '<저자>', href: '/author/', avatar: '/avatar.png' } }));
  assert.match(metadataCard, /<p class="app-card-summary">&lt;설명&gt;<\/p><\/div><\/a><div class="app-blog-card-meta">.*<time class="app-blog-card-date" datetime="2026-10-08">2026-10-08<\/time>/);
  assert.match(metadataCard, /<a class="app-blog-card-comments" href="\/a\/#comments">댓글 · 2<\/a>/);
  assert.doesNotMatch(metadataCard, /<svg|data-control-icon="comment"/);
  assert.equal((metadataCard.match(/<a /g) ?? []).length, 2);
  assert.doesNotMatch(metadataCard, /href="\/author\/"/);
  assert.match(metadataCard, /<span>&lt;저자&gt;<\/span>/);
  assert.match(html(ui.BlogCard({ href: '/a/', title: 'A', cover: icon, commentsHref: '/a/#comments' })), />댓글 보기<\/a>/);
  // #77: 태그 링크는 글 링크 밖에 있고 이름과 주소를 검증한다.
  const taggedCard = html(ui.BlogCard({ href: '/a/', title: 'A', cover: icon, description: '소개', tagItems: [{ href: '/tags/python/', label: 'Python' }, { href: '/tags/reference/', label: '<참조>' }], publishedAt: '2026-10-08' }));
  assert.match(taggedCard, /app-card-summary[^>]*>소개<\/p><\/div><\/a><div class="app-blog-card-tags"[^>]*><a class="app-tag" href="\/tags\/python\/">Python<\/a> <a class="app-tag" href="\/tags\/reference\/">&lt;참조&gt;<\/a>/);
  assert.equal((taggedCard.match(/<a /g) ?? []).length, 3);
  assert.throws(() => ui.BlogCard({ href: '/a/', title: 'A', cover: icon, tagItems: [{ href: 'javascript:1', label: '태그' }] }), /Unsupported URL/);
  const pages = html(ui.PageLinks({ label: '쪽', before: { href: '/p/', text: '이전' }, after: { href: '/p/3/', text: '다음' }, numbers: [{ page: 1, href: '/p/' }, { page: 2, href: '/p/2/', current: true }] }));
  assert.equal(pages, '<nav class="app-page-links" aria-label="쪽"><a class="app-navigation-link is-back" rel="prev" href="/p/">이전</a><a href="/p/" aria-label="1페이지">1</a><span aria-current="page">2</span><a class="app-navigation-link" rel="next" href="/p/3/">다음</a></nav>');
  assert.match(html(ui.PageLinks({ label: '쪽', summary: '2 / 3', numbers: [{ page: 1, href: '/' }] })), /<span>2 \/ 3<\/span>/);
  assert.match(html(ui.PageLinks({ label: '검색', resultPages: true })), /^<nav class="app-page-links" data-result-pages aria-label="검색"><\/nav>$/);
  assert.equal(html(ui.ListLink({ href: '/all/', text: '모두' })), '<p class="app-page-links"><a class="app-navigation-link" href="/all/">모두</a></p>');

  const tags = [1, 2, 3, 4].map((n) => ({ href: `/tags/t${n}/`, label: `T${n}<` }));
  assert.match(html(ui.TagList({ tags, limit: 3 })), /^<div class="app-tags" role="group" aria-label="태그"><a class="app-tag" href="\/tags\/t1\/">T1&lt;<\/a>.*<details class="app-tags-more"><summary>\+1<\/summary><div class="app-tags"><a class="app-tag" href="\/tags\/t4\/">T4&lt;<\/a><\/div><\/details><\/div>$/);
  assert.doesNotMatch(html(ui.TagList({ tags })), /details/);

  const outline = html(ui.DocumentOutline({ sections: [{ id: 's-1', title: 'A&', level: 2 }] }));
  assert.match(outline, /^<details class="app-document-nav" data-document-panel><summary aria-label="본문 목차"><span>목차<\/span><\/summary><nav aria-label="본문 목차"><ol>/);
  // 좁은 화면에서 본문 위를 차지하지 않도록 문서 탐색과 같은 접기 패널 하나만 쓴다.
  assert.equal((outline.match(/<details/g) ?? []).length, 1);
  assert.doesNotMatch(outline, /svg/);
  assert.match(outline, /href="#s-1" data-heading-level="2">A&amp;<\/a>/);

  const taggedPost = html(ui.PostArticle({ id: 'tagged', href: '/a/', title: 'T', date: '2026-10-01', lead: trusted('소개'), tags: ui.TagList({ tags: [{ href: '/tags/python/', label: 'Python' }] }), body: trusted('<p>본문</p>') }));
  assert.match(taggedPost, /소개<\/p><div class="app-tags"[\s\S]*<\/div><p>본문<\/p>/);
  const post = html(ui.PostArticle({ id: 'post-1', detail: false, href: '/a/', title: 'T', date: '2026-10-01', dateNote: ' · 예시 글', lead: trusted('도입'), body: trusted('<p>본문</p>'), author: '저자', footer: trusted('<i></i>'), after: trusted('<aside></aside>') }));
  assert.equal(post, '<article class="app-blog-post" aria-labelledby="post-1"><header class="app-post-header"><time class="app-post-date" datetime="2026-10-01">2026-10-01 · 예시 글</time><h2 class="app-post-title" id="post-1"><a href="/a/">T</a></h2></header><div class="app-prose app-feed-body"><p class="app-article-lead">도입</p><p>본문</p></div><footer class="app-post-footer"><p class="app-post-author">저자</p><i></i></footer><aside></aside></article>');
  assert.match(html(ui.PostArticle({ id: 'post-1', detail: true, title: 'T', date: 'd', lead: trusted(''), body: trusted('') })), /^<article class="app-blog-post is-detail" aria-labelledby="post-1">.*<h1 class="app-post-title" id="post-1">T<\/h1>/);
  assert.match(html(ui.PostArticle({ id: 'post-1', detail: true, title: 'T', date: '2026-10-01', dateLabel: '2026년 10월 1일', lead: trusted(''), body: trusted('') })), /datetime="2026-10-01">2026년 10월 1일<\/time>/);
  // 요약이 비면 머리글 문단을 만들지 않는다.
  assert.doesNotMatch(html(ui.PostArticle({ id: 'post-1', detail: true, title: 'T', date: 'd', lead: trusted(''), body: trusted('<p>본문</p>') })), /app-article-lead/);
  assert.match(html(ui.PostArticle({ id: 'post-1', detail: true, title: 'T', date: 'd', lead: trusted('도입'), body: trusted('') })), /<p class="app-article-lead">도입<\/p>/);

  const result = html(ui.SearchResultLink({ href: '/a/', icon, title: 'T<', example: true, description: 'd&' }));
  assert.equal(result, '<a class="app-search-result-link" href="/a/"><img alt=""><strong>T&lt;</strong><span class="app-search-result-note"> 예시</span><p>d&amp;</p></a>');
});

test('search_result_parts_escape_every_field_and_highlight_only_with_mark', () => {
  const marked = html(ui.Highlight({ text: 'a<b>검색어&c 검색어', query: ' 검색어 ' }));
  assert.equal(marked, 'a&lt;b&gt;<mark>검색어</mark>&amp;c <mark>검색어</mark>');
  assert.equal(html(ui.Highlight({ text: '<x>', query: '' })), '&lt;x&gt;');
  assert.equal(html(ui.Highlight({ text: 'a.b', query: '.*' })), 'a.b');
  assert.equal(html(ui.Highlight({ text: 'C++', query: 'c++' })), '<mark>C++</mark>');
  const icon = ui.ContentIconImage({ src: '/theme/x.svg' });
  assert.equal(html(icon), '<span class="app-content-icon is-small"><img src="/theme/x.svg" alt="" decoding="async"></span>');
  assert.throws(() => ui.ContentIconImage({ src: 'javascript:1' }), /Unsupported URL/);
  assert.throws(() => ui.ContentIconImage({ src: '/x.svg', size: 'huge' }), /Unknown icon size/);
  const link = html(ui.SearchResultLink({ href: '/a/', icon, title: ui.Highlight({ text: '<T>', query: 't' }), description: '<d>' }));
  assert.match(link, /<strong>&lt;<mark>T<\/mark>&gt;<\/strong><p>&lt;d&gt;<\/p><\/a>$/);
  assert.throws(() => ui.SearchResultLink({ href: '//e.com/', icon, title: 't', description: 'd' }), /Unsupported URL/);
  assert.equal(html(ui.Tag({ href: '/tags/x/', label: 'X ×' })), '<a class="app-tag" href="/tags/x/">X ×</a>');
});

test('tab_panels_never_reserve_height_so_the_selector_follows_the_visible_content', () => {
  const css = read('../dist/styles.css');
  // 숨은 패널은 hidden 속성으로 사라지고, 패널을 겹쳐 쌓거나 높이를 예약하는 규칙이 없다.
  assert.match(css, /\[hidden\] \{[^}]*display: none/);
  const panelRules = [...css.matchAll(/(?:^|\n)([^\n{}]*\.app-tabpanel[^\n{}]*)\{([^}]*)\}/g)];
  assert.ok(panelRules.length >= 2);
  for (const [, selector, body] of panelRules) {
    assert.doesNotMatch(body, /visibility|grid-area|min-height|[^-]height:|position: absolute/, selector);
  }
  assert.match(css, /\.app-tabs \.app-tabpanel > :last-child \{ margin-bottom: 0; \}/);
  assert.doesNotMatch(css, /is-platform|is-frame-panel|is-position-top|is-split/);
});

test('related_cards_are_single_row_compact_links_with_ellipsis_titles_and_no_description_styles', () => {
  const css = read('../dist/styles.css');
  const rule = (selector) => new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css)[1];
  const card = rule('.app-help-card.app-related-link');
  assert.match(card, /display: flex; align-items: center/);
  assert.match(card, /padding: var\(--spacing-compact-inset\)/);
  assert.match(card, /font-size: var\(--text-compact-text\)/);
  assert.doesNotMatch(rule('.app-related-link strong'), /line-clamp/);
  assert.match(rule('.app-related-link strong'), /overflow: hidden; text-overflow: ellipsis; white-space: nowrap/);
  assert.match(rule('.app-related-link .app-content-icon'), /position: static/);
  // 열은 내용 줄 수와 무관하고 좁은 화면에서는 한 열이다. 관련 글의 요약 줄 수 제한과 자동 함께 읽기 섹션 스타일은 없다.
  assert.match(css, /@media \(max-width: 600px\) \{ \.app-related-grid \{ grid-template-columns: minmax\(0, 1fr\); \} \}/);
  assert.doesNotMatch(css, /related-summary-lines|\.app-related \{|\.app-related >/);
});

test('related_card_group_and_its_heading_use_compact_spacing_tokens', () => {
  const css = read('../dist/styles.css');
  const rule = (selector) => new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(css)[1];
  assert.match(rule('.app-related-grid'), /gap: var\(--spacing-gap-xs\);/);
  assert.match(rule('.app-prose .app-related-grid'), /margin-bottom: var\(--spacing-gap-sm\)/);
  // 묶음 바로 앞의 제목만 좁은 위 여백을 갖고 시맨틱(제목 단계)과 다른 제목은 건드리지 않는다.
  assert.match(rule('.app-prose :is(.app-heading-2, .app-heading-3, .app-heading-4):has(+ .app-related-grid)'), /margin-block: var\(--spacing-gap\) var\(--spacing-gap-sm\)/);
  assert.doesNotMatch(css, /\.app-related-grid[^{]*\{[^}]*gap: var\(--spacing-gap\) /);
});


test('video_overlay_keeps_a_colored_inline_control_in_all_public_players', () => {
  const props = { id: 'v', src: '/v.mp4', poster: '/p.png' };
  const views = [ui.Player({ ...props, overlay: true }), ui.Video(props), ui.ProjectShowcase({ ...props, title: '영상 제목' })];
  for (const view of views) {
    const overlay = /<button class="app-player-button"[^>]*>(.*?)<\/button>/.exec(html(view));
    assert.ok(overlay, 'the player has a playback button');
    assert.match(overlay[0], /data-player-play aria-label="[^"]+"/);
    assert.match(overlay[1], /^<svg data-control-icon="play"[^>]*aria-hidden="true"[^>]*focusable="false"/);
    assert.match(overlay[1], /<circle[^>]*fill="currentColor"/);
    assert.match(overlay[1], /<path[^>]*fill="var\(--icon-paper\)"/);
    assert.doesNotMatch(overlay[1], /<svg[^>]*\scolor=/);
  }
  const css = read('../dist/styles.source.css');
  assert.match(css, /\.app-player-button \{[^}]*color: var\(--color-control-link\)/);
  assert.doesNotMatch(css, /url\([^)]*assets\/icons\/media\/play\.svg/);
});

test('search_box_role_matches_suggestion_mode_before_runtime', () => {
  const props = { action: '/search/', labels: { region: '검색', input: '검색어', placeholder: '입력', clear: '지우기' } };
  const search = html(ui.SearchBox({ ...props, combobox: false }));
  assert.match(search, /role="searchbox"/);
  assert.doesNotMatch(search, /aria-(?:autocomplete|expanded|controls)=/);
  const suggest = html(ui.SearchBox(props));
  assert.match(suggest, /role="combobox"/);
  assert.match(suggest, /aria-controls="search-suggestions"/);
});


test('search results omit absent icons and messages keep separate escaped lines', () => {
  const result = html(ui.SearchResultLink({ href: '/a/', title: 'T', description: 'D' }));
  assert.doesNotMatch(result, /app-content-icon|undefined/);
  assert.match(result, /<strong>T<\/strong>/);
  assert.equal(html(ui.SearchMessage({ lines: ['failed <', 'retry &'] })), '<div class="app-search-message"><p>failed &lt;<br>retry &amp;</p></div>');
});

// 텍스트 입력의 마크업·모양은 TextInput과 forms.css의 .app-input 한 곳만 소유한다.
test('text_inputs_have_one_implementation', () => {
  const sources = ['components', 'layout', 'patterns', 'document', 'table', 'toolbar', 'icons'].map(name => [name, read(`../ui/${name}.mjs`)]);
  const emitters = sources.flatMap(([name, text]) => [...text.matchAll(/<input\b/g)].map(() => name));
  assert.deepEqual(emitters, ['layout'], 'only TextInput writes an input element');
  const layout = read('../ui/layout.mjs');
  assert.ok(layout.indexOf('<input') > layout.indexOf('export function TextInput(') && layout.indexOf('<input') < layout.indexOf('export function EmailForm('), 'the input element belongs to TextInput');
  const labels = { region: '검색', input: '검색어', placeholder: '입력', clear: '지우기' };
  for (const output of [html(ui.SearchBox({ action: '/search/', labels })), html(ui.SearchBox({ action: '/search/', labels, large: true })), html(ui.EmailForm({ id: 's', field: 'email', label: '메일', placeholder: 'a', button: 'b' }))]) {
    assert.deepEqual([...output.matchAll(/<input class="([^"]+)"/g)].map(match => match[1].split(' ')[0]), ['app-input']);
  }
  const modules = read('../styles/index.css').match(/[\w-]+\.css/g).filter(name => name !== 'index.css');
  for (const name of modules) {
    const css = read(`../styles/${name}`);
    const inputClasses = [...css.matchAll(/\.(app-[\w-]*(?:input|email)[\w-]*)/g)].map(match => match[1]).filter(cls => !['app-input', 'app-input-field', 'app-input-icon'].includes(cls));
    assert.deepEqual(inputClasses, [], `${name} defines no separate input class`);
    if (name !== 'forms.css') {
      assert.doesNotMatch(css, /::placeholder/, `${name} leaves placeholder color to .app-input`);
      assert.doesNotMatch(css.replace(/button, input, textarea, select \{[^}]*\}/g, ''), /(?:^|[\s,>])input\b(?!-)/m, `${name} does not style input elements`);
    }
  }
});


test('tag_filters_use_pressed_buttons_and_a_trusted_search_slot', () => {
  const filter = ui.TagFilter({ tags: [{ id: '설계<', label: '설계<&', selected: true }, { id: 'python', label: 'Python', selected: false }], reset: { href: '/search/', label: '초기화<&' } });
  assert.match(html(filter), /data-tag-toggle="설계&lt;" aria-pressed="true">설계&lt;&amp;<\/button>/);
  assert.match(html(filter), /data-tag-toggle="python" aria-pressed="false">Python<\/button>/);
  assert.match(html(filter), /href="\/search\/" data-tag-reset>초기화&lt;&amp;<\/a><\/div>$/);
  assert.doesNotMatch(html(ui.TagFilter({ tags: [] })), /data-tag-reset/);
  assert.throws(() => ui.TagFilter({ tags: [], reset: { href: 'javascript:alert(1)', label: '초기화' } }), /Unsupported URL/);
  const props = { action: '/search/', labels: { region: '검색', input: '검색어', placeholder: '입력', clear: '지우기', suggestions: '추천' }, suggestions: ['설계'] };
  const output = html(ui.SearchBox({ ...props, filters: filter }));
  assert.ok(output.indexOf('app-search-frequent') < output.indexOf('data-tag-filter'));
  assert.ok(output.indexOf('data-tag-filter') < output.lastIndexOf('</section>'));
  assert.throws(() => ui.SearchBox({ ...props, filters: '<button>bad</button>' }), /must be trusted/);
});


test('logo_items_without_a_destination_are_disabled_and_not_keyboard_targets', () => {
  const props = { label: 'Python · 관련 글 없음', src: '/python.svg' };
  const disabled = html(ui.LogoItem(props));
  assert.match(disabled, /<span role="link" aria-disabled="true" aria-label="Python · 관련 글 없음">/);
  assert.doesNotMatch(disabled, /<a\b|href=|tabindex=|onclick=/);
  assert.match(html(ui.LogoItem({ ...props, href: '/search/?tag=Python' })), /<a href="\/search\/\?tag=Python"/);
  assert.match(read('../styles/landing.css'), /\.app-technology > \[aria-disabled="true"\] \{ opacity: var\(--opacity-dim\); filter: grayscale\(1\); \}/);
});
