import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { createMarkdown } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { readDocument } from './content-model.mjs';
import { markdownFiles } from './content-files.mjs';

const product = fileURLToPath(new URL('./', import.meta.url));
const vendor = join(product, 'vendor/theme');
const sha = value => createHash('sha256').update(value).digest('hex');
const files = folder => readdirSync(folder, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(folder.length + 1)).sort();
const TAGS = JSON.parse(readFileSync(join(product, 'tags.json'), 'utf8'));
const TOPICS = JSON.parse(readFileSync(join(product, 'topics.json'), 'utf8'));

test('vendored_theme_is_exactly_the_manifest_and_matches_canonical_output_when_present', t => {
  const manifest = JSON.parse(readFileSync(join(vendor, 'theme.json'), 'utf8'));
  const listed = Object.keys(manifest.files).sort();
  for (const name of listed) assert.equal(sha(readFileSync(join(vendor, name))), manifest.files[name], name);
  const extra = files(vendor).filter(name => name !== 'theme.json' && !listed.includes(name));
  assert.deepEqual(extra, [], '소비자가 가져온 테마 폴더에 정본에 없는 파일을 두면 안 된다');
  const canonical = fileURLToPath(new URL('../../../design-tokens/design-tokens/dist/simple/', import.meta.url));
  if (!existsSync(canonical)) return t.skip('design-tokens 작업본이 없어 정본 비교는 건너뜀');
  assert.equal(sha(readFileSync(join(vendor, 'theme.json'))), sha(readFileSync(join(canonical, 'theme.json'))), '가져온 테마가 정본의 현재 빌드와 다르다. npm run theme:product로 다시 가져온다');
});

// 예시, 구성 요소 견본, 공개 글 한 편을 실제 렌더 경로(마크다운 → 글 페이지)로 렌더해 소비자가 표현 값을 더하지 않는지 본다.
function corpus() {
  const md = createMarkdown();
  const pages = ['examples', 'publication'].flatMap(folder => markdownFiles(join(product, folder)).slice(0, folder === 'examples' ? undefined : 3).map(file => readDocument(readFileSync(file, 'utf8'), TAGS, new Date(), TOPICS)));
  const all = pages.map(page => Object.assign(page, renderArticle(md, page)));
  const specimen = md.render(readFileSync(join(product, 'content/syntax-specimen.md'), 'utf8').replace(/^---[\s\S]*?\n---\n/, ''), { pageId: 'specimen' });
  return [...all.map(page => articlePage(page, all, { topics: TOPICS, tags: TAGS })), specimen];
}

test('rendered_markdown_pages_carry_no_consumer_presentation', () => {
  const pages = corpus();
  assert.ok(pages.length > 8);
  for (const html of pages) {
    // 수식 조판이 계산한 기하(KaTeX 출력)만 style 속성을 가질 수 있다.
    const styled = [...new JSDOM(`<body>${html}</body>`).window.document.querySelectorAll('[style]')].filter(node => !node.closest('.katex, .katex-error'));
    assert.deepEqual(styled.map(node => node.outerHTML.slice(0, 80)), [], '인라인 style 속성');
    assert.doesNotMatch(html, /<style[\s>]|<link[^>]+stylesheet/i, '소비자 스타일시트');
    // 인라인 SVG는 테마 변수만 쓴다. 속성에 적은 색 값이 없어야 한다.
    for (const [, value] of html.matchAll(/\s(?:fill|stroke|stop-color|flood-color)="([^"]*)"/g)) assert.match(value, /^(?:none|currentColor|var\(--[\w-]+\))$/, value);
    // 크기 속성은 이미지·영상의 데이터와 아이콘 도형 좌표의 숫자만 허용한다. 수식(.katex)의 em 크기는 조판기가 계산한다.
    for (const node of new JSDOM(`<body>${html}</body>`).window.document.querySelectorAll('[width], [height]')) {
      if (node.closest('.katex')) continue;
      for (const name of ['width', 'height']) if (node.hasAttribute(name)) assert.match(`${node.localName}:${node.getAttribute(name)}`, /^(?:img|video|svg|source|rect|circle|ellipse):\d+$/, node.outerHTML.slice(0, 80));
    }
  }
});

test('copy_buttons_expose_name_and_live_status_without_visible_text_styling', () => {
  for (const html of corpus()) {
    for (const [, block] of html.matchAll(/<div class="app-code">([\s\S]*?)<\/div>(?=\s*<|$)/g)) {
      assert.match(block, /<button type="button" data-copy aria-label="[^"]+" hidden>/);
    }
    for (const [, block] of html.matchAll(/<div class="app-code">[\s\S]*?<\/pre>([\s\S]*?)<\/div>/g)) assert.match(block, /data-copy-status role="status" aria-live="polite"/);
  }
});

test('token_audit_passes_for_consumer_sources_and_generated_outputs', () => {
  const result = spawnSync('python3', ['scripts/audit-tokens.py'], { cwd: join(product, '..'), encoding: 'utf8' });
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
  const { OWNED_CLASSES } = await import('./vendor/theme/assets/components.mjs');
  const sources = readdirSync(product).filter(name => /\.(mjs|js)$/.test(name) && !name.endsWith('.test.mjs'));
  // 알려진 예외는 Things 복각 검토 화면(layout.mjs의 블로그 글, home.mjs의 히어로 파노라마)과 아이콘 검토 화면(icon-audit.mjs의 번호 링크)뿐이고 파일과 클래스를 고정한다.
  const KNOWN = {
    'layout.mjs': ['app-blog-post'],
    'home.mjs': ['app-hero-panorama'],
    'icon-audit.mjs': ['app-page-links'],
  };
  const found = Object.fromEntries(sources.map(name => [name, ownedClassHits(readFileSync(join(product, name), 'utf8'), OWNED_CLASSES)]).filter(([, hits]) => hits.length));
  const offenders = Object.entries(found).map(([name, hits]) => [name, hits.filter(hit => !(KNOWN[name] ?? []).includes(hit))]).filter(([, hits]) => hits.length);
  assert.deepEqual(offenders, [], '테마 구성 요소가 소유한 클래스를 소비자가 직접 출력한다. vendor/theme/assets/components.mjs를 가져다 쓴다');
  // 예외가 더는 필요 없으면 지워야 한다.
  for (const [name, classes] of Object.entries(KNOWN)) for (const owned of classes) assert.ok(found[name]?.includes(owned), `${name}의 예외 ${owned}가 더는 필요 없다`);
  // 어댑터는 같은 하나의 구성 요소 모듈을 가져온다. 브라우저 검색 화면도 포함한다.
  for (const name of ['markdown.mjs', 'publication-layout.mjs', 'search-view.mjs', 'home-sections.mjs', 'blog-layout.mjs']) assert.match(readFileSync(join(product, name), 'utf8'), /from '\.\/vendor\/theme\/assets\/components\.mjs'/, name);
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
    const entry = { route: '/articles/a/', iconUrl: '/theme/assets/icons/small/x.svg', title: '<img src=x onerror=alert(1)> 검색어', description: '설명 & "따옴표"', tags: ['t'], example: true };
    renderResults(window.document.body, { entries: [entry], totalPages: 3, page: 2 }, { query: '검색어', tags: [] }, { t: { label: '태그<' } });
    const result = window.document.querySelector('.app-search-entry');
    assert.equal(result.querySelector('strong img'), null);
    assert.equal(result.querySelector('strong').textContent, '<img src=x onerror=alert(1)> 검색어');
    assert.equal(result.querySelector('strong mark').textContent, '검색어');
    assert.equal(result.querySelector('.app-search-result-link').getAttribute('href'), '/articles/a/');
    assert.equal(result.querySelector('.app-search-result-tags a').textContent, '태그<');
    assert.ok(result.querySelector('.app-search-result-note'));
    const pages = window.document.querySelector('nav.app-page-links[data-result-pages]');
    assert.equal(pages.querySelector('[aria-current=page]').textContent, '2');
    assert.deepEqual([...pages.children].map(node => node.textContent), ['이전', '1', '2', '3', '다음']);
    // 주소가 안전하지 않으면 렌더하지 않는다.
    assert.throws(() => renderResults(window.document.body, { entries: [{ ...entry, route: 'javascript:alert(1)' }], totalPages: 1, page: 1 }, { query: '', tags: [] }, { t: { label: 't' } }), /Unsupported URL/);
  } finally { delete globalThis.document; }
});

test('component_slots_reject_untrusted_strings_from_consumer_adapters', async () => {
  const ui = await import('./vendor/theme/assets/components.mjs');
  assert.throws(() => ui.Gallery({ id: 'g', slides: [{ image: '<img>' }] }), /must be trusted/);
  assert.throws(() => createMarkdown().render('::::tabs\n:::tab[A]\n본문\n:::\n::::\n', { pageId: 'bad id' }), /Invalid id/);
});
