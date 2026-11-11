import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { flattenStyle } from '../scripts/lib/style-source.mjs';
import { buildDesign } from '../scripts/lib/design-build.mjs';

const root = new URL('..', import.meta.url).pathname;

function withFolder(files, run) {
  const folder = mkdtempSync(join(tmpdir(), 'style-source-'));
  try {
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(join(folder, name, '..'), { recursive: true });
      writeFileSync(join(folder, name), text);
    }
    return run(folder);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}
const flatten = files => withFolder(files, folder => flattenStyle(join(folder, 'styles.css'), folder));

test('import_is_replaced_by_file_content_in_written_order', () => {
  const css = flatten({
    'styles.css': '/* 진입점 */\n@import "parts/a.css";\n@import url(parts/b.css);\n@import \'parts/c.css\';\n.last { color: red; }\n',
    'parts/a.css': '.a { color: red; }\n',
    'parts/b.css': '.b { color: red; }\n',
    'parts/c.css': '.c { color: red; }\n',
  });
  assert.doesNotMatch(css, /@import/);
  assert.deepEqual(css.match(/\.\w+(?= \{)/g), ['.a', '.b', '.c', '.last']);
  assert.match(css, /^\/\* 진입점 \*\//);
});

test('nested_imports_resolve_from_the_importing_file', () => {
  const css = flatten({
    'styles.css': '@import "parts/a.css";\n.z { color: red; }\n',
    'parts/a.css': '@import "deep/b.css";\n.a { color: red; }\n',
    'parts/deep/b.css': '.b { color: red; }\n',
  });
  assert.deepEqual(css.match(/\.\w+(?= \{)/g), ['.b', '.a', '.z']);
});

test('import_text_inside_comments_and_strings_is_not_a_statement', () => {
  const css = flatten({ 'styles.css': '/* @import "missing.css"; */\n.a::before { content: "@import x"; }\n' });
  assert.match(css, /@import "missing.css"/);
  assert.match(css, /content: "@import x"/);
});

test('invalid_imports_fail_with_a_named_reason', () => {
  const cases = [
    ['missing css import', { 'styles.css': '@import "none.css";' }],
    ['css import cycle', { 'styles.css': '@import "a.css";', 'a.css': '@import "b.css";', 'b.css': '@import "a.css";' }],
    ['css import cycle', { 'styles.css': '@import "styles.css";' }],
    ['duplicate css import', { 'styles.css': '@import "a.css";\n@import "a.css";', 'a.css': '.a { color: red; }' }],
    ['duplicate css import', { 'styles.css': '@import "a.css";\n@import "b.css";', 'a.css': '@import "c.css";', 'b.css': '@import "c.css";', 'c.css': '.c { color: red; }' }],
    ['external css import', { 'styles.css': '@import url("https://example.com/a.css");' }],
    ['external css import', { 'styles.css': '@import "//example.com/a.css";' }],
    ['external css import', { 'styles.css': '@import "/etc/a.css";' }],
    ['outside theme folder', { 'styles.css': '@import "../outside.css";' }],
    ['must be a .css file', { 'styles.css': '@import "a.txt";', 'a.txt': 'x' }],
    ['conditions are not allowed', { 'styles.css': '@import "a.css" screen;', 'a.css': '.a { color: red; }' }],
    ['conditions are not allowed', { 'styles.css': '@import "a.css" layer(base);', 'a.css': '.a { color: red; }' }],
    ['must precede all rules', { 'styles.css': '.a { color: red; }\n@import "b.css";', 'b.css': '.b { color: red; }' }],
    ['unterminated @import', { 'styles.css': '@import "a.css"' }],
  ];
  for (const [message, files] of cases) assert.throws(() => flatten(files), new RegExp(message), message);
});

test('symlink_leaving_the_theme_folder_is_rejected', () => {
  const outside = mkdtempSync(join(tmpdir(), 'style-outside-'));
  try {
    writeFileSync(join(outside, 'x.css'), '.x { color: red; }');
    const message = withFolder({ 'styles.css': '@import "link.css";' }, folder => {
      symlinkSync(join(outside, 'x.css'), join(folder, 'link.css'));
      try { flattenStyle(join(folder, 'styles.css'), folder); } catch (error) { return error.message; }
    });
    assert.match(message, /outside theme folder/);
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
});

test('one_stylesheet_flattens_all_web_modules_in_order', () => {
  const folder = join(root, 'styles');
  const entry = readFileSync(join(folder, 'index.css'), 'utf8');
  const imported = [...entry.matchAll(/^@import ['"](?:\.\/)?([\w-]+\.css)['"];$/gm)].map(match => match[1]);
  assert.deepEqual(imported.sort(), readdirSync(folder).filter(name => name.endsWith('.css') && name !== 'index.css').sort());
  const files = buildDesign(root);
  assert.doesNotMatch(files['styles.css'].replace(/\/\*[\s\S]*?\*\//g, ''), /@import/);
  assert.match(files['styles.css'], /\.app-shell/);
  assert.ok(!files['styles.css'].includes('breakpoint('));
});
