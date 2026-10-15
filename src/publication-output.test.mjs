import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { publicationAssets } from './publication-assets.mjs';
import { replacePublication, NOT_FOUND_FILE } from './publication-output.mjs';

function fixture(t) {
  const root = fileURLToPath(new URL(`../dist/test/output-${randomUUID()}/`, import.meta.url));
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'index.html'), 'previous publication');
  writeFileSync(join(root, 'stale.png'), 'previous asset');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function previousPublicationIsIntact(root) {
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), 'previous publication');
  assert.equal(readFileSync(join(root, 'stale.png'), 'utf8'), 'previous asset');
}

test('missing_assets_do_not_replace_the_existing_publication', t => {
  const root = fixture(t);
  const pages = new Map([['/', '<img src="/assets/missing.png">']]);
  assert.throws(() => {
    const files = publicationAssets(pages, [], path => { throw new Error(`missing asset: ${path}`); });
    replacePublication(root, pages, files);
  }, /missing asset: \/assets\/missing.png/);
  previousPublicationIsIntact(root);
});

test('broken_links_anchors_and_duplicate_ids_preserve_the_previous_publication', t => {
  const root = fixture(t);
  for (const [html, error] of [
    ['<a href="/missing/">누락</a>', /broken link/],
    ['<nav><a href="../private/">비공개</a></nav>', /broken link/],
    ['<img src="/stale.png">', /broken link/],
    ['<video poster="/stale.png"></video>', /broken link/],
    ['<a href="#missing">누락</a>', /broken anchor/],
    ['<p id="same"></p><p id="same"></p>', /duplicate HTML id/],
  ]) {
    assert.throws(() => replacePublication(root, new Map([['/', html]]), new Map()), error);
    previousPublicationIsIntact(root);
  }
});

test('valid_planned_pages_assets_and_scripts_replace_stale_output', t => {
  const root = fixture(t);
  const pages = new Map([
    ['/', '<main id="main"><a href="/docs/#part">문서</a><a href="/docs/index.html">원래 문서 파일</a><img src="/assets/image.png"><script src="/publication.js?v=hash"></script></main>'],
    ['/docs/', '<h1 id="part">문서</h1><a href="#part">절</a><a href="/">홈</a>'],
  ]);
  const files = new Map([['/assets/image.png', Buffer.from('image')], ['/publication.js', 'export {};']]);
  replacePublication(root, pages, files);
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), pages.get('/'));
  assert.equal(readFileSync(join(root, 'docs/index.html'), 'utf8'), pages.get('/docs/'));
  assert.equal(readFileSync(join(root, 'assets/image.png'), 'utf8'), 'image');
  assert.equal(readFileSync(join(root, 'publication.js'), 'utf8'), 'export {};');
  assert.equal(existsSync(join(root, 'stale.png')), false);
});

test('output_collisions_and_path_escape_fail_before_replacement', t => {
  const root = fixture(t);
  for (const [files, error] of [
    [new Map([['/index.html', 'collision']]), /duplicate publication file/],
    [new Map([['/../escape', 'escape']]), /invalid publication file/],
    [new Map([['/assets', 'file'], ['/assets-other', 'separate'], ['/assets/image.png', 'image']]), /publication path conflict/],
    [new Map([['/assets//image.png', 'image']]), /invalid publication file/],
    [new Map([['/assets\\escape', 'escape']]), /invalid publication file/],
  ]) {
    assert.throws(() => replacePublication(root, new Map([['/', '<main></main>']]), files), error);
    previousPublicationIsIntact(root);
  }
});

test('not_found_document_is_written_at_the_root_and_its_links_are_validated', t => {
  const root = fixture(t);
  assert.throws(() => replacePublication(root, new Map([['/', '<main></main>']]), new Map([[NOT_FOUND_FILE, '<a href="/missing/">누락</a>']])), /broken link: \/404\.html/);
  previousPublicationIsIntact(root);
  replacePublication(root, new Map([['/', '<main></main>']]), new Map([[NOT_FOUND_FILE, '<a href="/">홈</a>']]));
  assert.equal(readFileSync(join(root, '404.html'), 'utf8'), '<a href="/">홈</a>');
});
