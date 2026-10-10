import { fileURLToPath } from 'node:url';
import { browserScripts } from './browser-scripts.mjs';
import { parse } from 'yaml';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { createMarkdown } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { DirectiveError, parseAttributes } from './directive-syntax.mjs';

const md = createMarkdown();
const render = (source, env = {}) => md.render(source, { pageId: 'p', ...env });
const dom = html => new JSDOM(`<body>${html}</body>`).window.document;
const ids = html => [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const failure = source => { try { render(source); } catch (error) { return error; } assert.fail(`오류가 나야 합니다:\n${source}`); };

const PROPOSAL = [
  '::::tabs', ':::tab[macOS]', '1. :menu[설정]을 엽니다.', '2. :kbd[⌘ K]를 누릅니다.', '',
  ':::note', '일반 Markdown **안내문**', ':::', ':::', ':::tab[Windows]', '설명', ':::', '::::', '',
].join('\n');

test('tabs_with_nested_tab_note_and_list_render_the_existing_tab_structure', () => {
  const document = dom(render(PROPOSAL));
  const tabs = document.querySelector('section.app-tabs[data-tabs]');
  const buttons = [...tabs.querySelectorAll(':scope > .app-tablist[role=tablist] > button[role=tab]')];
  const panels = [...tabs.querySelectorAll(':scope > .app-tabpanel[role=tabpanel]')];
  assert.deepEqual(buttons.map(button => button.textContent), ['macOS', 'Windows']);
  assert.deepEqual(buttons.map(button => [button.getAttribute('aria-selected'), button.tabIndex]), [['true', 0], ['false', -1]]);
  assert.equal(panels.length, 2);
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);
  buttons.forEach((button, index) => {
    assert.equal(button.getAttribute('aria-controls'), panels[index].id);
    assert.equal(panels[index].getAttribute('aria-labelledby'), button.id);
  });
  assert.equal(panels[0].querySelectorAll('ol > li').length, 2);
  assert.equal(panels[0].querySelector('li b.app-menu-label').textContent, '설정');
  assert.equal(panels[0].querySelector('li kbd').textContent, '⌘ K');
  const note = panels[0].querySelector('aside.app-callout');
  assert.equal(note.querySelector('strong').textContent, '참고');
  assert.equal(note.querySelector('p strong').textContent, '안내문');
  assert.equal(panels[1].textContent.trim(), '설명');
});

test('platform_uses_the_platform_variant_and_warning_note_the_warning_tone', () => {
  const document = dom(render('::::platform[기기]\n:::tab[Mac]\n:::warning[조심]\n내용\n:::\n:::\n::::\n'));
  const tabs = document.querySelector('.app-tabs');
  assert.ok(tabs.classList.contains('is-platform') && tabs.hasAttribute('data-platform'));
  assert.equal(tabs.querySelector('[role=tablist]').getAttribute('aria-label'), '기기');
  assert.ok(tabs.querySelector('.app-callout.is-warning'));
  assert.equal(tabs.querySelector('.app-callout strong').textContent, '조심');
});

test('tab_bodies_keep_code_images_footnotes_and_ui_components_working', () => {
  const html = render([
    '::::tabs', ':::tab[코드]', '```bash', 'echo ":::tab[가짜]"', ':::', '```', '',
    '~~~md', '::::', '~~~', '',
    '    :::note', '', '![스크린샷](/assets/2-today-mac.png "제목")', '',
    '각주[^a]', '', '```ui:callout', 'title: 호환', 'body: ui 블록도 그대로', '```', ':::', ':::tab[둘째]', '둘째 각주[^b]', ':::', '::::', '',
    '[^a]: 첫째', '[^b]: 둘째', '',
  ].join('\n'));
  const document = dom(html);
  assert.equal(document.querySelectorAll('[role=tab]').length, 2);
  const panel = document.querySelector('[role=tabpanel]');
  assert.equal(panel.querySelectorAll('.app-code').length, 3);
  assert.ok(panel.querySelector('.app-code [data-copy]'));
  assert.match(panel.querySelector('.app-code code').textContent, /echo ":::tab\[가짜\]"\n:::/);
  assert.equal(panel.querySelector('img').getAttribute('alt'), '스크린샷');
  assert.ok(panel.querySelector('.app-callout'));
  assert.equal(document.querySelectorAll('.footnote-item').length, 2);
  for (const reference of document.querySelectorAll('.footnote-ref a')) assert.ok(document.getElementById(reference.getAttribute('href').slice(1)), '각주 정의가 있어야 합니다');
  const all = ids(html);
  assert.equal(new Set(all).size, all.length, `겹치는 ID: ${all}`);
});

test('headings_and_ids_stay_unique_across_blocks_and_documents', () => {
  const source = '## 설정\n\n::::tabs\n:::tab[A]\n## 설정\n\n### 설정\n:::\n:::tab[B]\n## 설정\n:::\n::::\n';
  const html = render(source);
  const all = ids(html);
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.filter(id => id.startsWith('p-설정')).length, 4);
  const first = renderArticle(md, { id: 'a', description: '', body: source });
  const second = renderArticle(md, { id: 'b', description: '', body: source });
  const merged = ids(first.html + second.html);
  assert.equal(new Set(merged).size, merged.length);
});

test('steps_fineprint_and_qa_reuse_list_paragraph_and_definition_markup', () => {
  const document = dom(render([
    ':::steps', '1. 하나', '2. 둘', ':::', '', ':::fineprint', '첫 문단', '', '둘째 *문단*', ':::', '',
    ':::qa', '질문 하나', ': 답 하나', '', '질문 둘', ': 답 둘', ':::', '',
  ].join('\n')));
  assert.equal(document.querySelectorAll('.app-steps > ol > li').length, 2);
  assert.deepEqual([...document.querySelectorAll('p.app-fineprint')].map(node => node.textContent), ['첫 문단', '둘째 문단']);
  const list = document.querySelector('dl.app-definitions');
  assert.deepEqual([...list.children].map(node => node.tagName), ['DT', 'DD', 'DT', 'DD']);
});

test('figure_video_and_cards_use_explicit_attributes', () => {
  const document = dom(render([
    '::figure{src=2-today-mac.png alt="오늘 화면" caption="캡션 \\"인용\\"" href=/articles/markdown-guide/ rounded}',
    '::video{src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt="아이폰" caption=설명 frame=iphone controls}',
    '::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt="맥"}',
    ':::cards{variant=centered columns=2}',
    '::card{title="제목" description="설명" href=/articles/bounded-queue/ icon=document}',
    '::card{title="둘째" href=https://example.com/}',
    ':::',
    ':::cards{variant=inline}', '::card{title="링크" href=#top}', ':::', '',
  ].join('\n')));
  const figure = document.querySelector('figure.app-figure');
  assert.equal(figure.querySelector('a').getAttribute('href'), '/articles/markdown-guide/');
  assert.ok(figure.querySelector('img.is-rounded'));
  assert.equal(figure.querySelector('figcaption').textContent, '캡션 "인용"');
  const videos = [...document.querySelectorAll('[data-player]')];
  assert.equal(videos.length, 2);
  assert.ok(videos[0].closest('.app-device'));
  assert.ok(videos.every(video => video.classList.contains('has-controls')));
  assert.equal(videos[0].querySelector('video').getAttribute('poster'), '/assets/3-upcoming-iphone.png');
  assert.equal(document.querySelectorAll('[data-remote]').length, 0);
  assert.ok(videos.every(video => video.querySelector('video[data-native-controls]') && video.querySelector('[data-player-play]')));
  const cards = [...document.querySelectorAll('.app-support-grid.is-pair > a.app-help-card.is-centered')];
  assert.equal(cards.length, 2);
  assert.ok(cards[0].querySelector('.app-content-icon') && cards[1].classList.contains('has-no-icon'));
  assert.equal(document.querySelectorAll('.app-inline-links > a.app-help-card.is-inline').length, 1);
});

test('inline_icon_tip_kbd_and_menu_render_inside_sentences', () => {
  const html = render('열기 :icon[search] 누르기 :kbd[⌘ K] 메뉴 :menu[파일] 설명 :tip[단어 <b>]{text="뜻 \\"하나\\" <script>x</script> & 둘"}를 읽습니다. ::표시:: :nope[x]');
  const document = dom(html);
  const paragraph = document.querySelector('p');
  assert.ok(paragraph.querySelector('.app-inline-icon > .app-content-icon.is-small svg'));
  assert.equal(paragraph.querySelector('kbd').textContent, '⌘ K');
  const trigger = paragraph.querySelector('button.app-tooltip[data-tooltip-trigger][popovertarget]');
  const bubble = paragraph.querySelector('.app-tooltip-bubble[popover]');
  assert.equal(trigger.getAttribute('popovertarget'), bubble.id);
  assert.equal(trigger.textContent, '단어 <b>');
  assert.equal(bubble.textContent, '뜻 "하나" <script>x</script> & 둘');
  assert.equal(paragraph.querySelectorAll('script, b:not(.app-menu-label)').length, 0);
  assert.equal(paragraph.querySelector('mark').textContent, '표시');
  assert.match(paragraph.textContent, /:nope\[x\]$/);
});

test('tooltip_ids_stay_unique_inside_ui_components_and_repeated_sentences', () => {
  const html = render('가 :tip[하나]{text=a} 나 :tip[둘]{text=b}\n\n```ui:callout\ntitle: x\nbody: ":tip[셋]{text=c} :tip[넷]{text=d}"\n```\n');
  const all = ids(html);
  assert.equal(all.filter(id => id.endsWith('-tip')).length, 4);
  assert.equal(new Set(all).size, all.length);
});

test('markers_inside_code_spans_and_blocks_stay_literal', () => {
  const html = render('`:tip[x]{text=y}` 와 `:::tabs`\n\n```md\n:::tabs\n:tip[a]{}\n```\n');
  assert.doesNotMatch(html, /app-tabs|data-tooltip-trigger/);
  assert.match(html, /:tip\[x\]\{text=y\}/);
});

test('directive_errors_name_the_page_line_and_block', () => {
  const cases = [
    ['닫히지', '문단\n\n:::note\n본문\n', /p 본문 3줄 :note: 닫는 ::: 줄이 없습니다/],
    ['닫히지-중첩', '::::tabs\n:::tab[A]\n본문\n::::\n', /본문 4줄.*콜론 수\(4\).*2줄/],
    ['여는줄 없음', '문단\n\n:::\n', /본문 3줄: 여는 줄 없이/],
    ['형식', ':::  note\n본문\n:::\n', /본문 1줄: 블록 줄 형식/],
    ['알 수 없는 이름', ':::danger\n본문\n:::\n', /본문 1줄 :danger: 알 수 없는 블록/],
    ['프로토타입 이름', ':::constructor\n본문\n:::\n', /알 수 없는 블록/],
    ['__proto__ 속성', '::figure{__proto__=x src=2-today-mac.png alt=a}\n', /속성 이름이 잘못/],
    ['허용 안 하는 속성', '::figure{src=2-today-mac.png alt=a onclick=x}\n', /허용하지 않는 속성입니다: onclick/],
    ['겹치는 속성', '::figure{src=2-today-mac.png src=2-today-mac.png alt=a}\n', /속성이 겹칩니다: src/],
    ['따옴표', '::figure{src=2-today-mac.png alt="열림}\n', /따옴표가 닫히지/],
    ['필수 속성', '::figure{src=2-today-mac.png}\n', /필수 속성이 없습니다: alt/],
    ['위험한 주소', '::figure{src=2-today-mac.png alt=a href="javascript:alert(1)"}\n', /href: https/],
    ['프로토콜 상대 주소', '::figure{src=2-today-mac.png alt=a href=//evil.example/}\n', /href: https/],
    ['경로 이탈 자산', '::figure{src=../secret.png alt=a}\n', /src: 파일 이름만/],
    ['없는 자산', '::figure{src=missing.png alt=a}\n', /src: 없는 자산입니다: missing.png/],
    ['없는 아이콘', ':::cards\n::card{title=a href=/x/ icon=nope}\n:::\n', /icon: 없는 아이콘/],
    ['열거형', ':::cards{variant=huge}\n::card{title=a href=/x/}\n:::\n', /variant는 centered, grouped, inline, related 중/],
    ['불리언', '::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt=a controls=maybe}\n', /controls는 true 또는 false/],
    ['라벨 필요', '::::tabs\n:::tab\n본문\n:::\n::::\n', /라벨이 필요합니다/],
    ['라벨 불가', ':::steps[제목]\n1. a\n:::\n', /라벨을 받지 않는 블록/],
    ['리프를 컨테이너로', ':::figure{src=2-today-mac.png alt=a}\n본문\n:::\n', /본문이 없는 블록입니다/],
    ['컨테이너를 리프로', '::note{x=1}\n', /본문이 있는 블록입니다/],
    ['탭이 밖에', ':::tab[A]\n본문\n:::\n', /문서 바로 아래에서는 쓸 수 없습니다/],
    ['탭 안의 문단', '::::tabs\n문단\n\n:::tab[A]\n본문\n:::\n::::\n', /:::tab만 둘 수 있습니다. 문단는 쓸 수 없습니다/],
    ['탭 이름 중복', '::::tabs\n:::tab[A]\n가\n:::\n:::tab[a]\n나\n:::\n::::\n', /탭 이름이 겹칩니다: a/],
    ['빈 탭', '::::tabs\n:::tab[A]\n:::\n::::\n', /본문이 비었습니다/],
    ['탭 중첩', '::::tabs\n:::tab[A]\n::::platform\n:::tab[B]\n본문\n:::\n::::\n:::\n::::\n', /:::tab 안에서는 쓸 수 없습니다/],
    ['메모 안의 블록', ':::note\n:::fineprint\n글\n:::\n:::\n', /본문 2줄 :fineprint: :::note 안에서는 쓸 수 없습니다/],
    ['steps 본문', ':::steps\n문단\n:::\n', /목록, 순서 목록만 둘 수 있습니다/],
    ['qa 본문', ':::qa\n- 목록\n:::\n', /정의 목록만/],
    ['카드 밖의 카드', '::card{title=a href=/x/}\n', /문서 바로 아래에서는 쓸 수 없습니다/],
    ['목록 안', '- 항목\n\n  :::note\n  본문\n  :::\n', /목록이나 인용 안에서는 블록을 쓸 수 없습니다/],
    ['인용 안', '> :::note\n> 본문\n> :::\n', /목록이나 인용 안에서는 블록을 쓸 수 없습니다/],
    ['인라인 속성 누락', '문단\n\n줄 :tip[단어]를 읽습니다.', /p 본문 3줄 :tip: 필수 속성이 없습니다: text/],
    ['인라인 알 수 없는 속성', ':tip[단어]{text=a style=x}', /허용하지 않는 속성입니다: style/],
    ['인라인 아이콘', ':icon[nope]', /없는 아이콘입니다: nope/],
    ['인라인 열림', ':tip[단어]{text="열림', /\{ 속성이 닫히지 않았습니다/],
  ];
  for (const [name, source, pattern] of cases) {
    const error = failure(source);
    assert.ok(error instanceof DirectiveError, `${name}: ${error.message}`);
    assert.match(error.message, pattern, name);
  }
});

test('indented_fence_with_block_markers_inside_a_list_item_stays_code', () => {
  const source = ':::note\n1. 항목\n\n    ```text\n    :::note\n    ```\n:::\n';
  const document = dom(render(source));
  assert.equal(document.querySelectorAll('.app-callout').length, 1);
  assert.equal(document.querySelector('.app-callout li'), document.querySelector('li'));
  assert.match(document.querySelector('.app-callout').textContent, /:::note/);
  assert.equal(document.querySelectorAll('.app-callout .app-callout').length, 0);
});

test('deeply_nested_input_fails_at_the_first_invalid_level_without_blowing_the_stack', () => {
  const nested = ':::note\n'.repeat(500) + '본문\n' + ':::\n'.repeat(500);
  assert.match(failure(nested).message, /본문 2줄 :note: :::note 안에서는 쓸 수 없습니다/);
  const tabs = '::::tabs\n:::tab[A]\n'.repeat(500) + '본문\n';
  assert.match(failure(tabs).message, /닫는 ::: 줄이 없습니다/);
  const wide = Array.from({ length: 2000 }, (_, index) => `:::note\n${index}\n:::\n`).join('\n');
  assert.equal((render(wide).match(/app-callout/g) ?? []).length, 2000);
});

test('attribute_parser_returns_null_prototype_objects_and_rejects_control_characters', () => {
  const fail = message => { throw new Error(message); };
  const attrs = parseAttributes('a=1 b="두 낱말" flag', fail);
  assert.equal(Object.getPrototypeOf(attrs), null);
  assert.deepEqual({ ...attrs }, { a: '1', b: '두 낱말', flag: true });
  assert.throws(() => parseAttributes('a="x\u0007y"', fail), /제어 문자/);
  assert.throws(() => parseAttributes('a="x"b=1', fail), /공백이 필요/);
  assert.throws(() => parseAttributes('a=', fail), /값이 비었습니다/);
  assert.throws(() => parseAttributes('a="\\n"', fail), /이스케이프/);
});

test('article_lead_and_toc_are_unchanged_when_directives_follow_the_lead', () => {
  const page = { id: 'x', description: '도입문입니다.', body: '도입문입니다.\n\n## 첫 절\n\n:::note\n본문\n:::\n' };
  const result = renderArticle(md, page);
  assert.equal(result.leadHtml, '도입문입니다.');
  assert.deepEqual(result.headings.map(heading => heading.title), ['첫 절']);
  assert.match(result.html, /app-callout/);
  assert.throws(() => renderArticle(md, { id: 'bad-page', description: 'd', body: ':::note\n본문\n' }), /bad-page 본문 1줄 :note/);
});

test('document_composition_example_renders_every_block_with_unique_ids', () => {
  const text = readFileSync(new URL('./examples/software-design/document-composition.md', import.meta.url), 'utf8');
  const meta = parse(/^---\n([\s\S]*?)\n---\n/.exec(text)[1]);
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
  assert.equal(meta.slug, 'document-composition');
  assert.equal(meta.example, true);
  const { html, leadHtml, headings } = renderArticle(md, { ...meta, body });
  assert.equal(leadHtml, meta.description);
  const document = dom(html);
  assert.equal(document.querySelectorAll('.app-tabs.is-platform [role=tab]').length, 3);
  assert.ok(document.querySelector('.app-steps li .app-inline-icon'));
  assert.ok(document.querySelector('.app-steps li kbd') && document.querySelector('.app-steps li .app-menu-label'));
  assert.equal(document.querySelectorAll('[data-player]').length, 2);
  assert.ok(document.querySelector('.app-device [data-player]'));
  assert.equal(document.querySelectorAll('.app-tabpanel [data-remote], .app-tabpanel figure:has(video) > figcaption').length, 0);
  assert.ok(document.querySelector('p.app-fineprint'));
  assert.ok(document.querySelector('.app-callout.is-warning') && document.querySelector('.app-tabpanel .app-callout'));
  assert.ok(document.querySelector('p button.app-tooltip + .app-tooltip-bubble'));
  assert.ok(document.querySelector('.app-code [data-copy]'));
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

test('related_cards_share_one_structure_without_tags_and_legacy_variants_stay', () => {
  const document = dom(render(':::cards{variant=related}\n::card{title=가 href=/a/ icon=document description=요약}\n::card{title=나 href=/b/}\n:::\n\n:::cards{variant=centered}\n::card{title=다 href=/c/ icon=document}\n:::\n'));
  const [withIcon, withoutIcon] = document.querySelectorAll('.app-related-grid > a.app-related-link');
  // 한 줄 카드: 작은 아이콘과 제목뿐이고 description은 그려지지 않는다.
  assert.deepEqual([...withIcon.children].map(node => node.tagName), ['SPAN', 'STRONG']);
  assert.equal(withIcon.querySelector('.app-content-icon').className, 'app-content-icon is-small');
  assert.doesNotMatch(withIcon.textContent, /요약/);
  assert.ok(withoutIcon.classList.contains('has-no-icon') && !withoutIcon.querySelector('span'));
  assert.ok(document.querySelector('.app-support-grid > a.app-help-card.is-centered .app-content-icon'));
});

test('article_pages_have_no_automatic_related_section_or_edit_suggestion_but_keep_manual_content_and_footnotes', () => {
  const body = '## 첫 절\n\n각주가 있는 문장입니다.[^n]\n\n## 이어서 읽을 글\n\n:::cards{variant=related}\n::card{title=직접 href=/articles/b/ icon=document}\n:::\n\n[^n]: 각주 본문\n';
  const mk = (type, extra = {}) => { const page = { id: 'a', slug: 'a', route: '/articles/a/', type, title: 'A', description: '설명', tags: ['python'], contentIcon: { name: 'document' }, body, comments: false, publishedAt: '2026-01-01', ...extra }; return Object.assign(page, renderArticle(md, page)); };
  const topics = { python: { label: 'Python' } };
  for (const type of ['wiki', 'blog']) {
    const page = mk(type);
    const other = { ...page, id: 'b', route: '/articles/b/', title: '같은 태그 글' };
    const html = articlePage(page, [page, other], { topics, repositoryUrl: 'https://github.com/example/repo' });
    assert.doesNotMatch(html, /함께 읽기|수정 제안|app-related"|issues\/new|같은 태그 글/, type);
    const document = dom(html);
    // 직접 쓴 목록과 각주는 그대로다.
    assert.equal(document.querySelectorAll('.app-related-grid > a.app-related-link').length, 1, type);
    assert.equal(document.querySelector('.app-related-link').textContent.trim(), '직접');
    assert.ok(document.querySelector('.footnote-item'), type);
    assert.ok([...document.querySelectorAll('h2')].some(node => node.textContent === '이어서 읽을 글'), type);
  }
});

test('gallery_block_and_ui_gallery_delegate_to_the_one_tabs_markup_with_numbered_buttons', () => {
  const slides = ['2-today-mac.png', '3-upcoming-mac-2.png', '4-headings-mac.png'];
  const source = `:::gallery{title="둘러보기"}\n${slides.map((src, index) => `::slide{src=${src} alt="화면 ${index + 1}"${index ? '' : ' caption=첫째'}}`).join('\n')}\n:::\n`;
  const document = dom(render(source));
  const gallery = document.querySelector('section.app-tabs[data-tabs]');
  assert.deepEqual([...gallery.classList], ['app-tabs', 'is-selector-numbers']);
  const list = gallery.querySelector(':scope > [role=tablist]');
  assert.equal(list.getAttribute('aria-label'), '둘러보기');
  const buttons = [...list.children];
  assert.deepEqual(buttons.map(button => button.textContent), ['1', '2', '3']);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-label')), ['슬라이드 1', '슬라이드 2', '슬라이드 3']);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-selected')), ['true', 'false', 'false']);
  const panels = [...gallery.querySelectorAll(':scope > [role=tabpanel]')];
  assert.deepEqual(panels.map(panel => panel.hidden), [false, true, true]);
  buttons.forEach((button, index) => assert.equal(button.getAttribute('aria-controls'), panels[index].id));
  assert.equal(panels[0].querySelector('figcaption').textContent, '첫째');
  assert.ok(panels.every(panel => list.compareDocumentPosition(panel) & 2), '선택 줄은 패널 뒤에 온다');
  assert.equal(document.querySelectorAll('[data-gallery], .app-gallery').length, 0);
  // ui:gallery도 같은 마크업이다.
  const legacy = dom(render('```ui:gallery\ntitle: 둘러보기\nslides:\n' + slides.map((src, index) => `  - { src: ${src}, alt: 화면 ${index + 1}${index ? '' : ', caption: 첫째'} }`).join('\n') + '\n```\n'));
  const normalize = html => html.replace(/component-p-\d+/g, 'c');
  assert.equal(normalize(legacy.querySelector('.app-tabs').outerHTML), normalize(gallery.outerHTML));
  // 이름이 모두 있으면 분할 선택 줄이다.
  const labeled = dom(render('```ui:gallery\nslides:\n  - { src: 2-today-mac.png, alt: a, label: 전 }\n  - { src: 3-upcoming-mac-2.png, alt: b, label: 후 }\n```\n'));
  assert.deepEqual([...labeled.querySelector('.app-tabs').classList], ['app-tabs', 'is-selector-segmented']);
  assert.deepEqual([...labeled.querySelectorAll('[role=tab]')].map(button => button.textContent), ['전', '후']);
});

test('gallery_errors_cover_missing_slides_places_and_assets', () => {
  assert.match(failure(':::gallery\n:::\n').message, /본문이 비었습니다/);
  assert.match(failure('::slide{src=2-today-mac.png alt=a}\n').message, /문서 바로 아래에서는 쓸 수 없습니다/);
  assert.match(failure(':::gallery\n문단\n:::\n').message, /:::slide만 둘 수 있습니다/);
  assert.match(failure(':::gallery\n::slide{src=nope.png alt=a}\n:::\n').message, /없는 자산입니다/);
  assert.match(failure(':::gallery\n::slide{src=2-today-mac.png}\n:::\n').message, /필수 속성이 없습니다: alt/);
});

test('cancelled_tasks_use_the_same_marker_box_as_open_and_done_tasks', () => {
  const html = render('- [ ] 열림\n- [x] 완료\n- [~] 취소\n');
  assert.match(html, /<span class="app-cancelled-task" role="img" aria-label="취소된 작업"><\/span>/);
  assert.equal((html.match(/task-list-item-checkbox/g) ?? []).length, 2);
  assert.equal((html.match(/disabled/g) ?? []).length, 2);
});

test('width_prop_maps_from_every_grammar_to_the_same_shared_classes_and_aliases_stay', () => {
  const html = render([
    '::figure{src=2-today-mac.png alt=a width=narrow}', '::figure{src=2-today-mac.png alt=b wide}', '::figure{src=2-today-mac.png alt=c size=compact}', '::figure{src=2-today-mac.png alt=d}',
    '::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt=v width=wide}',
    ':::gallery{width=wide}', '::slide{src=2-today-mac.png alt=s}', ':::', '',
    '```js width=narrow', 'const a = 1;', '```', '', '```js', 'const b = 2;', '```', '',
    '```ui:figure', 'src: 2-today-mac.png', 'alt: ui', 'wide: true', '```', '',
  ].join('\n'));
  const document = dom(html);
  const classes = selector => [...document.querySelectorAll(selector)].map(node => node.className);
  assert.deepEqual(classes('figure.app-figure').slice(0, 4), ['app-figure app-width-narrow', 'app-figure app-width-wide', 'app-figure app-width-narrow', 'app-figure']);
  assert.ok(document.querySelector('figure.app-figure.app-width-wide [data-player]'));
  assert.ok(document.querySelector('section.app-tabs.app-width-wide'));
  assert.deepEqual(classes('.app-code'), ['app-code app-width-narrow', 'app-code']);
  assert.equal(document.querySelectorAll('figure.app-figure.app-width-wide').length, 3);
  assert.doesNotMatch(html, /app-breakout|is-compact/);
});

test('width_errors_name_the_block_and_line', () => {
  assert.match(failure('::figure{src=2-today-mac.png alt=a width=huge}\n').message, /width는 content, narrow, wide 중 하나/);
  assert.match(failure('문단\n\n::figure{src=2-today-mac.png alt=a width=narrow wide}\n').message, /본문 3줄 :figure: Conflicting width/);
  assert.match(failure('::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt=a height=10}\n').message, /허용하지 않는 속성입니다: height/);
  assert.match(failure('문단\n\n```js width=huge\nx\n```\n').message, /본문 3줄 :code: width는 content, narrow, wide 중 하나/);
});

test('long_unbroken_code_keeps_the_exact_raw_text_for_copying', () => {
  const long = 'Token_' + '0123456789'.repeat(40) + '\n\t끝  \n';
  const document = dom(render('```text width=wide\n' + long + '```\n'));
  assert.equal(document.querySelector('.app-code code').textContent, long);
  assert.ok(document.querySelector('.app-code-header [data-copy]'));
  assert.equal(document.querySelector('.app-code pre').getAttribute('style'), null);
});

const REQUESTED = [
  ':::tabs selector-segmented',
  '@tab 변경 전', '', '![변경 전 화면](/assets/repeating-comparison-1-io80.png)', '', '기존 화면입니다.', '',
  '@tab 변경 후', '', '![변경 후 화면](/assets/repeating-comparison-2-io80.png)', '', '개선한 화면입니다.', '',
  ':::end', '',
].join('\n');

test('tabs_with_utility_header_and_at_tab_lines_render_the_one_shared_tabs_markup', () => {
  const document = dom(render(REQUESTED));
  const tabs = document.querySelector('section.app-tabs');
  // 기본(상자 없음, 아래, 단추, 본문 폭)은 클래스가 없고 벗어난 값만 클래스가 된다.
  assert.deepEqual([...tabs.classList], ['app-tabs', 'is-selector-segmented']);
  const panels = [...tabs.querySelectorAll(':scope > [role=tabpanel]')];
  const list = tabs.querySelector(':scope > [role=tablist]');
  assert.equal(panels.length, 2);
  assert.ok(panels.every(panel => list.compareDocumentPosition(panel) & 2), '탭 목록은 패널 뒤에 온다');
  assert.deepEqual([...list.children].map(button => button.textContent), ['변경 전', '변경 후']);
  panels.forEach((panel, index) => { assert.equal(panel.getAttribute('aria-labelledby'), list.children[index].id); assert.equal(list.children[index].getAttribute('aria-controls'), panel.id); });
  assert.equal(panels[0].hidden, false);
  assert.equal(panels[1].hidden, true);
  assert.equal(panels[0].querySelector('p > img').getAttribute('alt'), '변경 전 화면');
  assert.equal(panels[0].querySelector('img').getAttribute('src'), '/assets/repeating-comparison-1-io80.png');
  assert.equal(panels[0].querySelector('img').getAttribute('width'), '1360');
  assert.equal(panels[0].querySelectorAll('p')[1].textContent, '기존 화면입니다.');
  assert.equal(document.querySelectorAll('figure').length, 0);
});

test('tabs_defaults_normalize_explicit_default_tokens_and_options_stay_independent', () => {
  const body = '@tab A\n\n가\n\n@tab B\n\n나\n\n:::end\n';
  const plain = render(`:::tabs\n${body}`);
  const root = dom(plain).querySelector('.app-tabs');
  assert.deepEqual([...root.classList], ['app-tabs']);
  assert.equal(root.lastElementChild.getAttribute('role'), 'tablist');
  // 기본값을 적어도 쓰지 않은 것과 같고 쓸모없는 클래스가 없다.
  assert.equal(render(`:::tabs frame-none position-bottom selector-buttons width-content\n${body}`), plain);
  assert.equal(render(`:::tabs frame=none position=bottom selector=buttons width=content\n${body}`), plain);
  assert.doesNotMatch(plain, /is-frame-none|is-position-bottom|is-selector-buttons|width-content/);
  // 벗어난 값만 클래스, 호환 형식은 같은 결과, 순서는 상관없다.
  const classes = options => [...dom(render(`:::tabs ${options}\n${body}`)).querySelector('.app-tabs').classList];
  assert.deepEqual(classes('frame-panel'), ['app-tabs', 'is-frame-panel']);
  assert.deepEqual(classes('position-top'), ['app-tabs', 'is-position-top']);
  assert.deepEqual(classes('selector-numbers'), ['app-tabs', 'is-selector-numbers']);
  assert.deepEqual(classes('width-wide'), ['app-tabs', 'app-width-wide']);
  assert.deepEqual(classes('width-wide selector-numbers position-top frame-panel'), ['app-tabs', 'is-frame-panel', 'is-position-top', 'is-selector-numbers', 'app-width-wide']);
  assert.equal(render(`:::tabs width=wide selector=numbers\n${body}`), render(`:::tabs selector-numbers width-wide\n${body}`));
  // 위쪽이면 선택 줄이 먼저다.
  assert.equal(dom(render(`:::tabs position-top\n${body}`)).querySelector('.app-tabs').firstElementChild.getAttribute('role'), 'tablist');
  // 폭은 묶음 전체에만 걸리고 바깥 문단에는 걸리지 않는다.
  const page = dom(render(`바깥 문단\n\n:::tabs width-wide\n${body}\n뒤 문단\n`));
  assert.deepEqual([...page.querySelectorAll('.app-width-wide')].map(node => node.className), ['app-tabs app-width-wide']);
  assert.equal(page.querySelector('body > p').className, '');
});

test('numbers_selector_allows_unlabeled_tabs_with_numbered_buttons_and_accessible_names', () => {
  const document = dom(render(':::tabs selector-numbers\n@tab\n\n하나\n\n@tab 둘째\n\n둘\n\n@tab\n\n셋\n\n:::end\n'));
  const buttons = [...document.querySelectorAll('[role=tab]')];
  assert.deepEqual(buttons.map(button => button.textContent), ['1', '2', '3']);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-label')), ['탭 1', '둘째', '탭 3']);
});

test('tabs_grammar_rejects_unknown_conflicting_and_malformed_forms_with_lines', () => {
  const body = '@tab A\n\n가\n\n@tab B\n\n나\n\n';
  const cases = [
    [`:::tabs frame-box\n${body}:::end\n`, /본문 1줄 :tabs: 허용하지 않는 속성입니다: frame-box/],
    [`:::tabs position-left\n${body}:::end\n`, /허용하지 않는 속성입니다: position-left/],
    [`:::tabs selector-tiles\n${body}:::end\n`, /허용하지 않는 속성입니다: selector-tiles/],
    [`:::tabs border-none\n${body}:::end\n`, /허용하지 않는 속성입니다: border-none/],
    [`:::tabs width-huge\n${body}:::end\n`, /허용하지 않는 속성입니다: width-huge/],
    [`:::tabs width-wide width=content\n${body}:::end\n`, /옵션이 충돌합니다/],
    [`:::tabs frame-none frame-none\n${body}:::end\n`, /속성이 겹칩니다: frame-none/],
    [`:::tabs frame-none frame-panel\n${body}:::end\n`, /옵션이 충돌합니다: frame-none, frame-panel/],
    [`:::tabs frame-none frame=panel\n${body}:::end\n`, /옵션이 충돌합니다/],
    [`:::tabs frame-none\n${body}`, /본문 1줄 :tabs: 닫는 :::end 줄이 없습니다/],
    [`:::tabs frame-none\n${body}:::\n`, /1줄의 :tabs 묶음은 :::end 로 닫아야 합니다/],
    [':::tabs frame-none\n:::end\n', /@tab 줄이 하나도 없습니다/],
    [`:::tabs frame-none\n문단\n\n${body}:::end\n`, /첫 @tab 줄 앞에는 본문을 둘 수 없습니다/],
    [':::tabs\n@tab\n\n가\n\n@tab B\n\n나\n\n:::end\n', /본문 2줄 :tabs: @tab 라벨이 필요합니다/],
    [':::tabs\n@tab A\n\n@tab B\n\n나\n\n:::end\n', /본문 2줄 :tabs: 탭 본문이 비었습니다/],
    [':::tabs\n@tab A\n\n가\n\n@tab a\n\n나\n\n:::end\n', /탭 이름이 겹칩니다: a/],
    ['문단\n\n:::end\n', /본문 3줄: 여는 블록 없이 :::end 가 있습니다/],
    [`:::note\n:::tabs\n${body}:::end\n:::\n`, /문서 바로 아래에서는 쓸 수 없습니다|:::note 안에서는 쓸 수 없습니다/],
  ];
  for (const [source, pattern] of cases) {
    const error = failure(source);
    assert.ok(error instanceof DirectiveError, source);
    assert.match(error.message, pattern, source);
  }
});

test('at_tab_and_end_markers_inside_code_fences_and_nested_blocks_do_not_split_or_close', () => {
  const source = [
    ':::tabs frame-none',
    '@tab 원문', '', '```markdown', ':::tabs frame-none', '@tab 가짜', '', '내용', '', ':::end', '```', '',
    '~~~text', '@tab 틸드', ':::end', '~~~', '',
    '    @tab 들여쓴 코드', '',
    ':::note', '@tab 안쪽 본문', ':::', '',
    '@tab 두번째', '', '끝', '',
    ':::end', '',
  ].join('\n');
  const document = dom(render(source));
  assert.deepEqual([...document.querySelectorAll('[role=tab]')].map(button => button.textContent), ['원문', '두번째']);
  const first = document.querySelector('[role=tabpanel]');
  assert.match(first.querySelector('.app-code code').textContent, /^:::tabs frame-none\n@tab 가짜\n\n내용\n\n:::end\n$/);
  assert.match(first.textContent, /@tab 틸드/);
  assert.match(first.querySelector('.app-callout').textContent, /@tab 안쪽 본문/);
  assert.equal(document.querySelectorAll('.app-tabs').length, 1);
  // 코드 펜스 안에 있는 헤더는 아무것도 만들지 않는다.
  assert.equal(dom(render('```markdown\n' + REQUESTED + '```\n')).querySelectorAll('.app-tabs').length, 0);
});

test('legacy_tab_forms_use_explicit_top_segmented_options_and_platform_stays_bordered_top', () => {
  const legacy = render('::::tabs\n:::tab[A]\n가\n:::\n:::tab[B]\n나\n:::\n::::\n');
  assert.match(legacy, /^<section class="app-tabs is-position-top is-selector-segmented" data-tabs><div class="app-tablist is-segmented"/);
  const threeColons = render(':::tabs\n:::tab[A]\n가\n:::\n:::tab[B]\n나\n:::\n:::\n');
  assert.equal(threeColons.replace(/component-p-\d+/g, 'c'), legacy.replace(/component-p-\d+/g, 'c'));
  assert.match(render('::::platform\n:::tab[Mac]\n가\n:::\n::::\n'), /^<section class="app-tabs is-platform" data-tabs data-platform><div class="app-tablist"/);
  assert.match(render('```ui:tabs\nitems:\n  - { label: A, body: 가 }\n  - { label: B, body: 나 }\n```\n'), /^<section class="app-tabs is-position-top is-selector-segmented" data-tabs><div class="app-tablist is-segmented"/);
  assert.match(render('```ui:platform\nitems:\n  - { label: A, body: 가 }\n```\n'), /^<section class="app-tabs is-platform" data-tabs data-platform>/);
  const mixed = dom(render(`${REQUESTED}\n::::tabs\n:::tab[A]\n가\n:::\n::::\n`));
  assert.equal(mixed.querySelectorAll('.app-tabs').length, 2);
  const ids = [...mixed.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('bottom_selector_tabs_use_the_same_runtime_for_click_arrows_home_and_end', () => {
  const window = new JSDOM(`<body>${render(':::tabs position-bottom\n@tab A\n\n가\n\n@tab B\n\n나\n\n@tab C\n\n다\n\n:::end\n')}</body>`, { runScripts: 'outside-only', url: 'https://example.com/' }).window;
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

test('gallery_tabs_show_only_the_selected_panel_pause_hidden_videos_and_use_the_one_runtime', () => {
  const source = ':::tabs selector-numbers\n@tab 영상\n\n::video{src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt=영상 controls}\n\n@tab 그림\n\n::figure{src=2-today-mac.png alt=그림 caption=캡션}\n\n@tab 셋째\n\n짧은 글\n\n:::end\n';
  const window = new JSDOM(`<body>${render(source)}</body>`, { runScripts: 'outside-only', url: 'https://example.com/' }).window;
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

test('short_utility_aliases_resolve_through_the_same_option_registry_as_long_and_key_value_forms', () => {
  const body = '@tab A\n\n가\n\n@tab B\n\n나\n\n:::end\n';
  const out = options => render(`:::tabs ${options}\n${body}`);
  const classes = options => [...dom(out(options)).querySelector('.app-tabs').classList].slice(1);
  assert.deepEqual(classes('box'), ['is-frame-panel']);
  assert.deepEqual(classes('top'), ['is-position-top']);
  assert.deepEqual(classes('segmented'), ['is-selector-segmented']);
  assert.deepEqual(classes('numbers'), ['is-selector-numbers']);
  assert.deepEqual(classes('w-wide'), ['app-width-wide']);
  // 같은 결과: 짧은 이름 = 긴 이름 = 이름=값, 순서는 상관없다.
  assert.equal(out('box top segmented w-wide'), out('frame-panel position-top selector-segmented width-wide'));
  assert.equal(out('box top segmented w-wide'), out('frame=panel position=top selector=segmented width=wide'));
  assert.equal(out('w-wide numbers top'), out('top width-wide selector=numbers'));
  assert.deepEqual(classes('box top segmented w-wide'), ['is-frame-panel', 'is-position-top', 'is-selector-segmented', 'app-width-wide']);
  // 옵션이 없으면 그대로(기본)이고 기본값 긴 이름은 계속 받는다.
  assert.equal(out('frame-none position-bottom selector-buttons width-content'), render(`:::tabs\n${body}`));
  // 같은 묶음을 짧은 이름·긴 이름으로 섞어 두 번 쓰면 거부한다: 같은 값은 겹침, 다른 값은 충돌.
  const failures = [
    ['box frame-panel', /옵션이 겹칩니다: box, frame-panel/],
    ['segmented selector=segmented', /옵션이 겹칩니다: segmented, selector/],
    ['top top', /속성이 겹칩니다: top/],
    ['top position-bottom', /옵션이 충돌합니다: top, position-bottom/],
    ['box frame=none', /옵션이 충돌합니다: box, frame/],
    ['segmented numbers', /옵션이 충돌합니다: segmented, numbers/],
    ['numbers selector-buttons', /옵션이 충돌합니다: numbers, selector-buttons/],
    ['w-wide width-content', /옵션이 충돌합니다: w-wide, width-content/],
  ];
  for (const [options, pattern] of failures) assert.match(failure(`:::tabs ${options}\n${body}`).message, pattern, options);
  // 임의의 동의어는 만들지 않는다.
  for (const token of ['panel', 'bottom', 'buttons', 'wide', 'none', 'w-content', 'segment', 'number', 'w-wide=1']) {
    assert.match(failure(`:::tabs ${token}\n${body}`).message, new RegExp(`허용하지 않는 속성입니다: ${token.split('=')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} `), token);
  }
  assert.match(failure(`:::tabs bogus\n${body}`).message, /허용하지 않는 속성입니다: bogus/);
});

// #107: 표시 옵션은 같은 해석기를 쓰며 기존 Markdown 출력과 내용 값을 보존한다.
test('utility_options_across_components_preserve_legacy_output_and_content', () => {
  const pairs = [
    ['::figure w-narrow rounded src=2-today-mac.png alt="오늘 화면" caption="w-wide는 캡션의 글자"', '::figure{width=narrow rounded src=2-today-mac.png alt="오늘 화면" caption="w-wide는 캡션의 글자"}'],
    ['::video w-wide frame-iphone controls src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt="아이폰 화면"', '::video{width=wide frame=iphone controls src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt="아이폰 화면"}'],
    [':::cards centered cols-2\n::card title="제목 & <b>" href=/articles/markdown-guide/ icon=document\n:::end', ':::cards{variant=centered columns=2}\n::card{title="제목 & <b>" href=/articles/markdown-guide/ icon=document}\n:::'],
    [':::gallery w-narrow title="오늘 화면"\n::slide src=2-today-mac.png alt=오늘 caption="작은 그림"\n:::end', ':::gallery{width=narrow title="오늘 화면"}\n::slide{src=2-today-mac.png alt=오늘 caption="작은 그림"}\n:::'],
    ['```js w-wide filename="w-narrow file.js"\nconst value = "raw text";\n```', '```js width=wide filename="w-narrow file.js"\nconst value = "raw text";\n```'],
    [':::tabs w-narrow\n@tab 첫째\n본문\n:::end', ':::tabs width=narrow\n@tab 첫째\n본문\n:::end'],
    [':::platform[기기]\n@tab Mac\n:::note[제목]\n**본문**\n:::end\n@tab Watch\n다른 본문\n:::end', '::::platform[기기]\n:::tab[Mac]\n:::note[제목]\n**본문**\n:::\n:::\n:::tab[Watch]\n다른 본문\n:::\n::::'],
  ];
  for (const [source, legacy] of pairs) assert.equal(render(source), render(legacy), source);
  for (const variant of ['centered', 'grouped', 'inline', 'related']) {
    assert.equal(render(`:::cards ${variant}\n::card title=글 href=/articles/markdown-guide/\n:::end`), render(`:::cards{variant=${variant}}\n::card{title=글 href=/articles/markdown-guide/}\n:::`));
  }
  assert.equal(dom(render('::hello world::')).querySelector('mark').textContent, 'hello world');
});

test('shared_utility_validation_rejects_conflicts_unknowns_and_unsafe_values_with_location', () => {
  const cases = [
    ['::figure w-wide w-narrow src=2-today-mac.png alt=가', /옵션이 충돌합니다/],
    ['::figure w-wide width=wide src=2-today-mac.png alt=가', /옵션이 겹칩니다/],
    ['::figure numbers src=2-today-mac.png alt=가', /허용하지 않는 속성입니다: selector/],
    ['::figure w-full src=2-today-mac.png alt=가', /허용하지 않는 속성입니다: w-full/],
    ['::figure w-wide src=2-today-mac.png alt=가 href="javascript:alert(1)"', /href: https/],
    ['::video frame-iphone frame=none src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt=가', /옵션이 충돌합니다/],
    ['::video controls=false src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt=가', /재생 조작은 숨길 수 없습니다/],
    [':::cards cols-1 cols-2\n::card title=글 href=/x/\n:::end', /옵션이 충돌합니다/],
    ['```js w-wide w-narrow\nx\n```', /옵션이 충돌합니다/],
    ['```js w-wide width=wide\nx\n```', /옵션이 겹칩니다/],
    ['```js box\nx\n```', /허용하지 않는 속성입니다: frame/],
    ['```js w-full\nx\n```', /허용하지 않는 속성입니다: w-full/],
    ['```js filename="닫히지 않은 이름\nx\n```', /따옴표가 닫히지/],
  ];
  for (const [source, expected] of cases) {
    const error = failure(`문단\n\n${source}\n`);
    assert.ok(error instanceof DirectiveError, source);
    assert.equal(error.page, 'p');
    assert.equal(error.line, 3);
    assert.match(error.message, expected, source);
  }
});
