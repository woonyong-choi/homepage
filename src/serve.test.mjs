import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

async function preview(t, files) {
  const root = fileURLToPath(new URL(`../dist/test/serve-${randomUUID()}/`, import.meta.url));
  mkdirSync(root, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
  const child = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url)), '--port', '0', '--root', root]);
  t.after(() => { child.kill(); rmSync(root, { recursive: true, force: true }); });
  const origin = await new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => { const match = String(chunk).match(/Preview: (http:\/\/[^/\s]+)/); if (match) resolve(match[1]); });
    child.on('exit', code => reject(new Error(`preview exited: ${code}`)));
  });
  return origin;
}

test('missing_paths_return_the_built_not_found_document_with_status_404', async t => {
  const origin = await preview(t, { 'index.html': '<main>홈</main>', '404.html': '<main>페이지를 찾을 수 없습니다</main>' });
  const home = await fetch(`${origin}/`);
  assert.equal(home.status, 200);
  for (const path of ['/missing/', '/docs/missing/page/', '/%2e%2e/secret']) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.equal(await response.text(), '<main>페이지를 찾을 수 없습니다</main>');
  }
  const head = await fetch(`${origin}/missing/`, { method: 'HEAD' });
  assert.equal(head.status, 404);
  assert.equal(await head.text(), '');
});

test('missing_paths_fall_back_to_text_when_no_not_found_document_was_built', async t => {
  const origin = await preview(t, { 'index.html': '<main>홈</main>' });
  const response = await fetch(`${origin}/missing/`);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
});
