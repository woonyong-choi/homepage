import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMarkdown } from './markdown.mjs';
import { mathAssets, usesMath, MATH_STYLESHEET } from './math-assets.mjs';
import { publicationAssets } from './publication-assets.mjs';
import { documentShell } from './publication-layout.mjs';

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

test('katex_assets_are_selected_only_for_pages_with_math', () => {
  const math = mathAssets();
  const css = math.assets.get(MATH_STYLESHEET).toString();
  assert.doesNotMatch(css, /https?:|\.woff\b|\.ttf|@import/);
  const fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]);
  assert.ok(fonts.length >= 15);
  for (const font of fonts) assert.ok(math.assets.has(`/katex/${font}`), font);
  const context = { config: { name: '이름', description: '소개', github: 'https://github.com/example' }, themeHash: 'theme', scriptHash: 'client', math };
  const plain = documentShell({ route: '/a/', title: '글' }, '<main><p>본문</p></main>', context);
  const withMath = documentShell({ route: '/b/', title: '글' }, render('$x$'), context);
  assert.doesNotMatch(plain, /katex|mermaid/);
  assert.match(withMath, new RegExp(`<link rel="stylesheet" href="${MATH_STYLESHEET}\\?v=${math.hash}">`));
  assert.doesNotMatch(withMath, /mermaid/);
  const pages = new Map([['/a/', plain], ['/b/', withMath]]);
  const files = publicationAssets(pages, [], path => (path.startsWith('/katex/') ? math.assets.get(path) : Buffer.from('')));
  assert.ok(files.has(MATH_STYLESHEET) && files.has('/katex/LICENSE') && [...files.keys()].some(path => path.startsWith('/katex/fonts/')));
  const withoutMath = publicationAssets(new Map([['/a/', plain]]), [], () => Buffer.from(''));
  assert.ok(![...withoutMath.keys()].some(path => path.startsWith('/katex/')));
});


test('mermaid_is_copyable_plain_code_and_never_loads_a_renderer', () => {
  const html = render('```mermaid\nflowchart LR\n  A["<script>alert(1)</script>"] --> B\n```');
  assert.match(html, /class="language-plaintext"/);
  assert.match(html, /flowchart LR/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /data-mermaid|<script|<iframe/);
});
