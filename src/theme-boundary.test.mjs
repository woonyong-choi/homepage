import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { readDocument, parseContent } from './content-model.mjs';
import { readPost } from './blog-model.mjs';
import { readContentFile } from './content-files.mjs';
import { getIconCatalog } from '@woonyong-choi/design-tokens/ui/build/icons.mjs';
import { THEME_ROOT } from './design-package.mjs';

const product = fileURLToPath(new URL('./', import.meta.url));
const TAGS = JSON.parse(readFileSync(join(product, '../config/tags.json'), 'utf8'));
const TOPICS = readContentFile(join(product, '../content/pages/tech.md')).metadata.topics;
const PAINT = /\s(?:color|fill|stroke|stop-color|flood-color)=["']([^"']*)["']/g;

test('design_is_an_installed_package_pinned_to_a_commit_without_a_copy', () => {
  const pkg = JSON.parse(readFileSync(join(product, '../package.json'), 'utf8'));
  for (const name of ['@woonyong-choi/design-tokens', 'diagramplay', 'document-engine']) {
    assert.match(pkg.devDependencies[name], /^github:woonyong-choi\/[\w.-]+#[a-f0-9]{40}$/, name);
  }
  assert.equal(pkg.devDependencies.thinkflow, undefined);
  assert.equal(pkg.devDependencies.torso, undefined);
  assert.equal(existsSync(join(product, 'vendor/theme')), false, '디자인 사본을 두지 않고 설치한 패키지를 읽는다');
  assert.ok(existsSync(join(THEME_ROOT, 'ui/index.mjs')));
});

const ARTICLE_FIXTURES = ['document-composition.md', 'markdown-guide.md', 'preview-article.md'];

async function corpus() {
  const read = source => parseContent(source).metadata.type === 'wiki' ? readDocument(source, TAGS, new Date('2026-10-19'), TOPICS) : readPost(source, { includeUnpublished: true });
  const pages = ARTICLE_FIXTURES.map(name => read(readFileSync(join(product, 'fixtures', name), 'utf8')));
  const all = await Promise.all(pages.map(async page => Object.assign(page, await renderArticle(page))));
  const specimen = (await renderArticle({ id: 'specimen', description: '', body: readFileSync(join(product, 'fixtures/syntax-specimen.md'), 'utf8') })).html;
  return [...all.map(page => articlePage(page, { topics: TOPICS, tags: TAGS })), specimen];
}

test('rendered_markdown_pages_carry_no_consumer_presentation', async () => {
  const pages = await corpus();
  const iconPaint = new Set();
  for (const file of new Set(Object.values(getIconCatalog().icons).map(icon => icon.file))) {
    const svg = readFileSync(join(THEME_ROOT, 'assets/icons', file), 'utf8');
    for (const [, value] of svg.matchAll(PAINT)) iconPaint.add(value);
  }
  assert.ok(!iconPaint.has('#010203'));
  assert.throws(() => assertThemePaint('<svg><path fill="#010203"/></svg>', iconPaint), /#010203/);
  assert.equal(pages.length, ARTICLE_FIXTURES.length + 1);
  const corpusDocument = new JSDOM(pages.join('')).window.document;
  for (const selector of ['.app-tabs', '.app-code', '.katex', '.footnotes', '.app-related-grid']) assert.ok(corpusDocument.querySelector(selector), selector);
  for (const html of pages) {
    // 수식 조판이 계산한 기하(KaTeX 출력)만 style 속성을 가질 수 있다.
    const styled = [...new JSDOM(`<body>${html}</body>`).window.document.querySelectorAll('[style]')].filter(node => !node.closest('.katex, .katex-error'));
    assert.deepEqual(styled.map(node => node.outerHTML.slice(0, 80)), [], '인라인 style 속성');
    assert.doesNotMatch(html, /<style[\s>]|<link[^>]+stylesheet/i, '소비자 스타일시트');
    // 정본 SVG의 원본색과 mask 색은 보존하고 소비자가 덧붙인 색은 거부한다.
    assertThemePaint(html, iconPaint);
    // 크기 속성은 이미지·영상의 데이터와 아이콘 도형 좌표의 숫자만 허용한다. 수식(.katex)의 em 크기는 조판기가 계산한다.
    for (const node of new JSDOM(`<body>${html}</body>`).window.document.querySelectorAll('[width], [height]')) {
      if (node.closest('.katex')) continue;
      for (const name of ['width', 'height']) if (node.hasAttribute(name)) {
        const value = node.getAttribute(name);
        if (node.closest('svg')) assert.match(value, /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:px|%)?$/i, node.outerHTML.slice(0, 80));
        else assert.match(`${node.localName}:${value}`, /^(?:img|video|source):\d+$/, node.outerHTML.slice(0, 80));
      }
    }
  }
});

function assertThemePaint(html, iconPaint) {
  for (const [, value] of html.matchAll(PAINT)) {
    assert.ok(/^(?:none|currentColor|var\(--[\w-]+\))$/.test(value) || iconPaint.has(value), value);
  }
}

test('copy_buttons_expose_name_and_live_status_without_visible_text_styling', async () => {
  for (const html of await corpus()) {
    const document = new JSDOM(html).window.document;
    for (const block of document.querySelectorAll('.app-code')) {
      const button = block.querySelector('[data-tool="copy"]');
      assert.ok(button.getAttribute('aria-label'));
      assert.ok(button.hidden);
      assert.ok(block.querySelector('[data-tool-status][role=status][aria-live=polite]'));
    }
  }
});

test('token_audit_passes_for_consumer_sources_and_generated_outputs', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-design.mjs'], { cwd: join(product, '..'), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /total 0/);
});

// 따옴표로 묶은 모든 문자열에서 소유 클래스를 찾는다. class="..." 마크업뿐 아니라 className 대입, classList, createElement 뒤 클래스 인자, 템플릿 문자열을 모두 잡는다. 주석은 뺀다.
function ownedClassHits(source, owned) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  const hits = new Set();
  for (const [, , body] of code.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    for (const token of body.split(/[\s"'=<>]+/)) if (owned.includes(token)) hits.add(token);
  }
  return [...hits];
}

test('consumer_sources_never_write_markup_of_components_the_theme_owns', async () => {
  const { OWNED_CLASSES } = await import('@woonyong-choi/design-tokens/ui/index.mjs');
  const sources = readdirSync(product).filter(name => /\.(mjs|js)$/.test(name) && !name.endsWith('.test.mjs'));
  const offenders = sources.map(name => [name, ownedClassHits(readFileSync(join(product, name), 'utf8'), OWNED_CLASSES)]).filter(([, hits]) => hits.length);
  assert.deepEqual(offenders, [], '테마 구성 요소가 소유한 클래스를 소비자가 직접 출력한다. @woonyong-choi/design-tokens/ui/index.mjs를 가져다 쓴다');
  // 어댑터는 같은 하나의 구성 요소 모듈을 가져온다. 브라우저 검색 화면도 포함한다.
  for (const name of ['article-renderer.mjs', 'publication-layout.mjs', 'search-view.mjs', 'home-sections.mjs', 'blog-layout.mjs']) assert.match(readFileSync(join(product, name), 'utf8'), /from '@woonyong-choi\/design-tokens\/ui\/index\.mjs'/, name);
});

test('browser_search_view_renders_through_theme_components_and_only_converts_their_output', async () => {
  const source = readFileSync(join(product, 'search-view.mjs'), 'utf8');
  assert.match(source, /function nodeFrom\(component\) \{\s*if \(!ui\.isTrusted\(component\)\) throw/);
  // 구성 요소 출력 말고는 innerHTML에 넣지 않는다.
  assert.deepEqual([...source.matchAll(/(\w+)\.innerHTML\s*=\s*([^;]+);/g)].map(match => match[2]), ['component.html']);
  assert.doesNotMatch(source, /insertAdjacentHTML|outerHTML\s*=|document\.write/);
  const { JSDOM } = await import('jsdom');
  const window = new JSDOM('<body><div data-filter-summary></div><div data-full-results></div></body>').window;
  globalThis.document = window.document;
  try {
    const { renderResults } = await import('./search-view.mjs');
    const entry = { route: '/articles/a/', iconUrl: '/theme/assets/icons/documents/document.svg', title: '<img src=x onerror=alert(1)> 검색어', description: '설명 & "따옴표"', tags: ['t'], example: true };
    renderResults(window.document.body, { entries: [entry], totalPages: 3, page: 2 }, { query: '검색어', tags: [] }, { t: { label: '태그<' } });
    const result = window.document.querySelector('.app-blog-card');
    assert.equal(result.querySelector('h2 img'), null);
    assert.equal(result.querySelector('h2').textContent, '<img src=x onerror=alert(1)> 검색어');
    assert.equal(result.querySelector('.app-blog-card-link').getAttribute('href'), '/articles/a/');
    assert.equal(result.querySelector('.app-blog-card-tags'), null);
    assert.equal(result.querySelector('.app-blog-card-title').textContent, entry.title);
    assert.equal(result.querySelector('.app-title-cover'), null);
    const pages = window.document.querySelector('nav.app-page-links[data-result-pages]');
    assert.equal(pages.querySelector('[aria-current=page]').textContent, '2');
    assert.deepEqual([...pages.children].map(node => node.textContent), ['이전', '1', '2', '3', '다음']);
    // 주소가 안전하지 않으면 렌더하지 않는다.
    assert.throws(() => renderResults(window.document.body, { entries: [{ ...entry, route: 'javascript:alert(1)' }], totalPages: 1, page: 1 }, { query: '', tags: [] }, { t: { label: 't' } }), /Unsupported URL/);
  } finally { delete globalThis.document; }
});

test('component_slots_reject_untrusted_strings_from_consumer_adapters', async () => {
  const ui = await import('@woonyong-choi/design-tokens/ui/index.mjs');
  assert.throws(() => ui.Gallery({ id: 'g', slides: [{ image: '<img>' }] }), /must be trusted/);
  await assert.rejects(renderArticle({ id: 'bad id', description: '', body: ':::tabs\n@tab A\n\n본문\n\n:::end\n' }), /pageId must match/);
});
