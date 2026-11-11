import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { markdownFiles, readContentFile } from './content-files.mjs';
import { parseContent } from './content-model.mjs';

test('shared_content_parser_preserves_body_line_endings_and_rejects_yaml_aliases', () => {
  for (const newline of ['\n', '\r\n']) {
    const body = `본문${newline}---${newline}끝${newline}`;
    assert.deepEqual(parseContent(`---${newline}id: sample${newline}---${newline}${body}`), { metadata: { id: 'sample' }, body });
  }
  assert.throws(() => parseContent('본문', 'missing projection metadata: sample'), /missing projection metadata: sample/);
  assert.throws(() => parseContent('---\nid: &id sample\nslug: *id\n---\n본문'), /alias/i);
});

// #327: Git은 비어 있는 공개 폴더를 보존하지 않는다.
test('markdownFiles_missing_publication_roots_return_empty_and_other_errors_propagate', t => {
  const root = fileURLToPath(new URL(`../dist/test/content-files-${randomUUID()}/`, import.meta.url));
  mkdirSync(root, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'document.md');
  writeFileSync(file, '본문');

  for (const folder of ['docs', 'blog']) assert.deepEqual(markdownFiles(join(root, folder)), []);
  assert.throws(() => markdownFiles(file), { code: 'ENOTDIR' });
});
