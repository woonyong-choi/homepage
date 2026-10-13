import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
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


test('renderPagePreview_applies_host_reader_to_edited_and_referenced_content_without_fallback', async () => {
  const files = new Map(['home.md', 'tech.md', 'interviews.md'].map(name => [name, saved(name)]));
  const reads = [];
  const readContent = (name, edited) => {
    reads.push(name);
    if (!files.has(name)) throw new Error(`content not allowed: ${name}`);
    return edited === undefined ? files.get(name) : edited + '\n\n호스트가 검사한 바이트\n';
  };
  const source = saved('home.md');
  const success = await renderPagePreview({ ...input, file: 'home.md', kind: 'home', source, readContent });
  assert.deepEqual(success.diagnostics, []);
  assert.match(success.html, /호스트가 검사한 바이트/);
  assert.equal(reads.filter(name => name === 'home.md').length, 1);
  const denied = await renderPagePreview({ ...input, file: 'home.md', kind: 'home', source: source.replace('interviews.md', 'drafts/private.md'), readContent });
  assert.match(denied.diagnostics[0].message, /content not allowed: drafts\/private.md/);
  assert.equal(denied.html, '');
  const edited = await renderPagePreview({ ...input, file: 'docs/private.md', source: saved('blog/bounded-queue.md'), readContent });
  assert.match(edited.diagnostics[0].message, /content not allowed: docs\/private.md/);
  const invalid = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home', readContent: () => undefined });
  assert.match(invalid.diagnostics[0].message, /reader must return a string/);
});


test('renderPagePreview_host_asset_sizes_do_not_require_generated_config', async t => {
  const root = siteRoot + 'dist/test/preview-' + randomUUID();
  mkdirSync(root + '/config', { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ['site', 'tags', 'search', 'cs', 'tech', 'blog']) {
    copyFileSync(siteRoot + 'config/' + name + '.json', root + '/config/' + name + '.json');
  }
  const result = await renderPagePreview({ ...input, siteRoot: root, file: 'home.md',
    source: saved('home.md'), kind: 'home', assets: { size: () => undefined } });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /app-landing/);
  assert.equal(existsSync(root + '/config/image-sizes.json'), false);
});
