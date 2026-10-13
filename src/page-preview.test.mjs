import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderPagePreview } from './page-preview.mjs';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = siteRoot + 'content';
const input = { siteRoot, contentRoot };
const saved = file => readFileSync(`${contentRoot}/${file}`, 'utf8');
const output = siteRoot + 'dist/site/index.html';
const stamp = () => existsSync(output) ? [statSync(output).mtimeMs, readFileSync(output, 'utf8')] : null;

test('renderPagePreview_uses_unsaved_home_without_writing_source_or_publication', async () => {
  const original = saved('home.md');
  const before = stamp();
  const source = original + '\n\n저장 전 미리보기 문장\n';
  const result = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home' });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /저장 전 미리보기 문장/);
  assert.match(result.html, /app-landing/);
  assert.match(result.html, /noindex,nofollow/);
  assert.ok(result.assets.has('/theme/tokens.css'));
  assert.ok(result.assets.has('/theme/styles.css'));
  assert.equal(saved('home.md'), original);
  assert.deepEqual(stamp(), before);
});

test('renderPagePreview_renders_article_tabs_math_and_runtime_with_shared_page_shell', async () => {
  const source = saved('blog/bounded-queue.md') + '\n\n## 저장 전 문단\n\n수식 $x^2$.\n\n:::tabs\n@tab 첫째\n하나\n@tab 둘째\n둘\n:::end\n';
  const result = await renderPagePreview({ ...input, file: 'blog/bounded-queue.md', source });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /저장 전 문단/);
  assert.match(result.html, /role="tablist"/);
  assert.match(result.html, /katex/);
  assert.ok(result.assets.has('/katex/katex.css'));
  assert.ok(result.assets.has('/document.js'));
  for (const [, path] of result.html.matchAll(/<script[^>]+src="([^"?]+)/g)) assert.ok(result.assets.has(path), path);
});

test('renderPagePreview_reports_file_and_id_and_rejects_paths_outside_explicit_root', async () => {
  for (const file of ['../private.md', '/private.md']) {
    const result = await renderPagePreview({ ...input, file, source: '', id: 'draft' });
    assert.equal(result.html, '');
    assert.equal(result.assets.size, 0);
    assert.equal(result.diagnostics[0].file, file);
    assert.equal(result.diagnostics[0].id, 'draft');
    assert.match(result.diagnostics[0].message, /preview path/);
  }
  const result = await renderPagePreview({ ...input, file: 'unsaved.md', source: '잘못된 메타데이터', id: 'draft' });
  assert.equal(result.diagnostics[0].severity, 'error');
  assert.match(result.diagnostics[0].message, /metadata/);
});


test('renderPagePreview_compiles_diagrams_and_returns_iframe_bytes', async () => {
  const source = saved('blog/bounded-queue.md') + '\n\n```thinkflow\nthinkflow\nbox a "서버"\nbox b "저장소"\na -> b\n```\n';
  const result = await renderPagePreview({ ...input, file: 'blog/bounded-queue.md', source });
  assert.deepEqual(result.diagnostics, []);
  const path = /src="(\/diagrams\/[^"?]+)"/.exec(result.html)?.[1];
  assert.ok(path);
  assert.match(result.assets.get(path).toString(), /서버/);
  assert.ok(result.assets.has('/diagram.js'));
});


test('renderPagePreview_selects_shared_dark_tokens_and_keeps_light_as_default', async () => {
  const source = saved('home.md');
  const light = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home' });
  const dark = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home', colorScheme: 'dark' });
  assert.deepEqual(dark.diagnostics, []);
  assert.match(light.html, /data-theme="light"/);
  assert.match(dark.html, /data-theme="dark"/);
  assert.match(dark.html, /name="color-scheme" content="dark"/);
  assert.deepEqual(dark.assets, light.assets);
  const bad = await renderPagePreview({ ...input, file: 'home.md', source, colorScheme: 'unknown' });
  assert.match(bad.diagnostics[0].message, /color scheme/);
});
