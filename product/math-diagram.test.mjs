import { markdownFiles } from './content-files.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { buildSync } from 'esbuild';
import { createMarkdown } from './markdown.mjs';
import { mathAssets, usesMath, MATH_STYLESHEET } from './math-assets.mjs';
import { mermaidScripts } from './mermaid-scripts.mjs';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';
import { documentShell } from './publication-layout.mjs';
import { token } from './theme-measure.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const render = (source, env = {}) => createMarkdown().render(source, env);

test('inline_and_block_math_render_to_html_and_mathml_without_scripts', () => {
  const html = render('분수 $\\frac{1}{2}$ 와\n\n$$\n\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}\n$$\n');
  assert.match(html, /<span class="katex"><span class="katex-mathml"><math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML">/);
  assert.match(html, /<mfrac>/);
  assert.match(html, /<p class="katex-block"><span class="katex-display">/);
  assert.match(html, /<mtable/);
  assert.doesNotMatch(html, /<script|javascript:/);
  assert.equal(usesMath(html), true);
});

test('currency_code_escapes_and_plain_dollars_are_not_math', () => {
  const html = render('커피 $5, 케이크 $12 입니다. 변수 $HOME 과 $USER.\n\n`$x$` 와 \\$a\\$ 끝\n\n```latex\n$$ \\frac{a}{b} $$ $x^2$\n```\n');
  assert.equal(usesMath(html), false);
  assert.match(html, /커피 \$5, 케이크 \$12/);
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.match(html, /\$a\$ 끝/);
  const code = html.match(/<pre><code class="language-latex">([\s\S]*?)<\/code><\/pre>/)[1].replace(/<[^>]+>/g, '');
  assert.equal(code, '$$ \\frac{a}{b} $$ $x^2$\n');
});

test('invalid_math_keeps_the_source_and_untrusted_commands_cannot_inject_urls_or_html', () => {
  const broken = render('틀림 $\\frac{1$ 끝');
  assert.match(broken, /<span class="katex-error" title="[^"]*"[^>]*>\\frac\{1<\/span> 끝/);
  const hostile = render('$\\href{javascript:alert(1)}{x}$ $\\includegraphics{http://evil.test/a.png}$ $\\htmlClass{x}{y}$ $\\url{https://evil.test}$ $x<y$ <b>$a$</b>');
  assert.doesNotMatch(hostile, /href=|<img|<script|evil\.test[^<]*<\/a>|<b>|onerror|class="x"/);
  assert.match(render('$$\n\\text{<img src=x onerror=alert(1)>}\n$$'), /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(render('$$\n\\text{<img src=x onerror=alert(1)>}\n$$'), /<img/);
});

test('math_does_not_disturb_headings_footnotes_and_tables', () => {
  const html = render('## 식 $a$\n\n| 식 | 값 |\n|---|---|\n| $x^2$ | 4 |\n\n각주[^1]\n\n[^1]: $y$ 설명');
  assert.equal((html.match(/<annotation encoding="application\/x-tex">/g) ?? []).length, 3);
  assert.match(html, /<h2 id="[^"]+" class="app-heading-2">식 <span class="katex">/);
  assert.match(html, /class="footnote-item"/);
});

test('mermaid_fences_keep_raw_source_open_copyable_and_unique_ids_across_nesting', () => {
  const source = 'flowchart LR\n  A["<img src=x onerror=1>"] --> B\n';
  const html = render('```mermaid\n' + source + '```\n\n````ui:tabs\nitems:\n  - label: A\n    body: |\n      ```mermaid\n      sequenceDiagram\n        A->>B: hi\n      ```\n  - label: B\n    body: |\n      ```mermaid\n      graph TD\n        X-->Y\n      ```\n````\n', { pageId: 'p', docId: 'p' });
  const ids = [...html.matchAll(/data-mermaid-id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3);
  assert.equal((html.match(/<details class="app-details app-diagram-source" open>/g) ?? []).length, 3);
  assert.match(html, /aria-label="도표 원문 복사" hidden/);
  assert.match(html, /aria-label="flowchart 도표" hidden/);
  const code = html.match(/<code class="language-mermaid">([\s\S]*?)<\/code>/)[1];
  assert.equal(code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'), source);
  assert.doesNotMatch(html, /<img/);
  const other = render('```mermaid\ngraph TD\n A-->B\n```', { pageId: 'q', docId: 'q' });
  assert.ok(!ids.includes(other.match(/data-mermaid-id="([^"]+)"/)[1]));
});

test('katex_and_mermaid_assets_are_selected_per_page_with_local_files_and_per_path_hashes', () => {
  const math = mathAssets();
  const css = math.assets.get(MATH_STYLESHEET).toString();
  assert.doesNotMatch(css, /https?:|\.woff\b|\.ttf|@import/);
  const fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]);
  assert.ok(fonts.length >= 15);
  for (const font of fonts) assert.ok(math.assets.has(`/katex/${font}`), font);
  const context = { config: { name: '이름', description: '소개', github: 'https://github.com/example' }, themeHash: 'theme', scriptHash: 'client', scriptHashes: { 'mermaid-loader.js': 'loader' }, math };
  const plain = documentShell({ route: '/a/', title: '글' }, '<main><p>본문</p></main>', context);
  const withMath = documentShell({ route: '/b/', title: '글' }, render('$x$'), context);
  const withDiagram = documentShell({ route: '/c/', title: '글' }, render('```mermaid\ngraph TD\n A-->B\n```', { pageId: 'c', docId: 'c' }), context);
  assert.doesNotMatch(plain, /katex|mermaid/);
  assert.match(withMath, new RegExp(`<link rel="stylesheet" href="${MATH_STYLESHEET}\\?v=${math.hash}">`));
  assert.doesNotMatch(withMath, /mermaid/);
  assert.match(withDiagram, /<script type="module" src="\/mermaid-loader\.js\?v=loader">/);
  assert.match(withDiagram, /src="\/document\.js\?v=client"/);
  assert.doesNotMatch(withDiagram, /katex/);
  assert.deepEqual(clientEntrypoints(withDiagram).filter(file => file.startsWith('mermaid')), ['mermaid-loader.js']);
  const pages = new Map([['/a/', plain], ['/b/', withMath]]);
  const files = publicationAssets(pages, [], path => (path.startsWith('/katex/') ? math.assets.get(path) : Buffer.from('')));
  assert.ok(files.has(MATH_STYLESHEET) && files.has('/katex/LICENSE') && [...files.keys()].some(path => path.startsWith('/katex/fonts/')));
  const withoutMath = publicationAssets(new Map([['/a/', plain]]), [], () => Buffer.from(''));
  assert.ok(![...withoutMath.keys()].some(path => path.startsWith('/katex/')));
});

test('mermaid_bundle_is_local_split_and_hashes_follow_the_renderer', () => {
  const { files, hashes } = mermaidScripts(ROOT);
  const loader = files.get('mermaid-loader.js');
  assert.match(loader, /\/mermaid\/render\.js\?v=[0-9a-f]{64}/);
  assert.ok(files.size > 20 && files.has('mermaid/render.js'));
  assert.equal(typeof hashes['mermaid-loader.js'], 'string');
  const again = mermaidScripts(ROOT);
  assert.equal(again.hashes['mermaid-loader.js'], hashes['mermaid-loader.js']);
  for (const [file, source] of files) {
    if (!file.endsWith('.js')) continue;
    assert.doesNotMatch(source, /cdn\.jsdelivr|unpkg\.com|cdnjs|fonts\.googleapis|\.mermaid\.ink|mermaid\.live/i, file);
  }
  assert.doesNotMatch(loader, /https?:\/\//);
});

// jsdom은 레이아웃을 계산하지 못해 실제 SVG는 그릴 수 없다. 문법 검사와 보안 설정, 로더 상태 전환만 확인한다.
function useDom(html = '<!doctype html><body></body>') {
  const dom = new JSDOM(html);
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) });
  for (const key of ['DOMParser', 'Element', 'HTMLElement', 'SVGElement', 'Node']) globalThis[key] ??= dom.window[key];
  return dom;
}

test('every_mermaid_diagram_in_the_content_parses_with_the_bundled_mermaid', async () => {
  useDom();
  const { default: mermaid } = await import('mermaid');
  let count = 0;
  for (const folder of ['publication', 'examples']) {
    for (const name of markdownFiles(`${ROOT}${folder}`)) {
      for (const match of readFileSync(name, 'utf8').matchAll(/^(`{3,})mermaid[^\n]*\n([\s\S]*?)^\1/gm)) {
        await assert.doesNotReject(() => mermaid.parse(match[2]), `${folder}/${name}`);
        count += 1;
      }
    }
  }
  assert.ok(count >= 3);
});

test('renderer_configures_strict_security_and_ignores_init_directive_overrides', async () => {
  useDom();
  const colors = Object.fromEntries(['--site-ink', '--site-muted', '--site-soft', '--site-card'].map(name => [name, token(name)]));
  for (const [name, value] of Object.entries(colors)) document.body.style.setProperty(name, value);
  const { default: renderDiagram } = await import('./mermaid-render.js');
  await renderDiagram('check-config', 'graph TD\n A-->B').catch(() => {});
  const { default: mermaid } = await import('mermaid');
  const config = mermaid.mermaidAPI.getSiteConfig();
  assert.equal(config.securityLevel, 'strict');
  assert.equal(config.startOnLoad, false);
  assert.equal(config.suppressErrorRendering, true);
  assert.equal(config.theme, 'base');
  assert.equal(config.themeVariables.primaryColor, colors['--site-soft']);
  assert.equal(config.themeVariables.lineColor, colors['--site-muted']);
  assert.ok(config.secure.includes('securityLevel') && config.secure.includes('theme'));
  await mermaid.parse('%%{init: {"securityLevel": "loose", "theme": "dark"}}%%\ngraph TD\n A-->B');
  assert.equal(mermaid.mermaidAPI.getConfig().securityLevel, 'strict');
  assert.equal(mermaid.mermaidAPI.getConfig().theme, 'base');
});

test('loader_renders_when_visible_and_keeps_the_open_source_on_failure', async () => {
  const markup = render('```mermaid\ngraph TD\n A-->B\n```\n', { pageId: 'z', docId: 'z' });
  for (const mode of ['ok', 'fail']) {
    const dom = useDom(`<!doctype html><body>${markup}</body>`);
    delete dom.window.IntersectionObserver;
    const stub = mode === 'ok'
      ? 'export default async (id, source) => `<svg id="${id}" data-source="${source.length}"></svg>`;'
      : 'export default async () => { throw new Error("parse"); };';
    const url = `data:text/javascript;base64,${Buffer.from(stub).toString('base64')}`;
    const loader = buildSync({ entryPoints: [`${ROOT}mermaid-loader.js`], bundle: true, write: false, format: 'esm', define: { __MERMAID_RENDER__: JSON.stringify(url) } }).outputFiles[0].text;
    await import(`data:text/javascript;base64,${Buffer.from(loader + `\n// ${mode}`).toString('base64')}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    const figure = document.querySelector('[data-mermaid]');
    const source = figure.querySelector('.app-diagram-source');
    if (mode === 'ok') {
      assert.ok(figure.classList.contains('is-rendered'));
      assert.equal(figure.querySelector('[data-mermaid-view]').hidden, false);
      assert.match(figure.querySelector('[data-mermaid-view]').innerHTML, /<svg id="diagram-z-1"/);
      assert.equal(source.open, false);
    } else {
      assert.ok(figure.classList.contains('is-failed'));
      assert.equal(figure.querySelector('[data-mermaid-view]').hidden, true);
      assert.equal(source.open, true);
      assert.match(figure.querySelector('[data-mermaid-status]').textContent, /그리지 못했습니다/);
    }
  }
});
