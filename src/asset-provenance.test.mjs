import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

// 공통 디자인(설치한 @woonyong-choi/design-tokens)의 출처는 design-tokens가 검사한다. 여기서는 홈페이지가 직접 싣는 파일만 본다.
const root = new URL('../', import.meta.url).pathname;
const SKIP = new Set(['node_modules', '.git', 'dist', '.content-sync.lock']);
const ORIGINS = new Set(['project-original', 'third-party', 'user-provided']);
const THIRD_PARTY_NAMES = [/-io\d{2}\.[a-z0-9]+$/i, /^fancysection-/i, /^arrivals-/i, /^bezel-/i];
const BLOCKED_LINK = /(?:url\(|src=|poster=|!\[[^\]]*\]\()["']?https?:\/\/([^/"')\s]*\.)?culturedcode\.com\//i;
const TEXT = /\.(m?js|css|html|svg|json|md|ya?ml)$/i;
const sources = JSON.parse(readFileSync(root + 'config/assets.json', 'utf8'));

const walk = dir => readdirSync(root + dir, { withFileTypes: true }).flatMap(entry => {
  const path = dir ? `${dir}/${entry.name}` : entry.name;
  if (SKIP.has(entry.name) || SKIP.has(path) || entry.name.startsWith('.content-sync-')) return [];
  return entry.isDirectory() ? walk(path) : [path];
});
const files = walk('');

test('published_content_assets_have_a_recorded_origin_and_license', () => {
  const published = files.filter(path => /^content\/(assets|media)\//.test(path)).map(path => path.slice('content/'.length));
  assert.ok(published.length > 0);
  for (const name of published) {
    const entry = sources.find(source => source.file === name);
    assert.ok(entry, `${name}: config/assets.json에 출처 기록이 없다`);
    assert.ok(ORIGINS.has(entry.origin), name);
    assert.ok(entry.license, name);
    if (entry.origin === 'third-party') assert.match(entry.url ?? '', /^https:\/\//, name);
    if (entry.notice) assert.ok(published.includes(entry.notice), `${name}: ${entry.notice}`);
  }
  for (const entry of sources) {
    assert.ok(published.includes(entry.file), entry.file);
    for (const url of [entry.url, entry.source].filter(Boolean)) assert.doesNotMatch(new URL(url).hostname, /(^|\.)culturedcode\.com$/i, entry.file);
  }
});

test('own_files_have_no_third_party_site_names_or_embedded_asset_links', () => {
  for (const path of files) {
    const name = path.split('/').pop();
    for (const rule of THIRD_PARTY_NAMES) assert.doesNotMatch(name, rule, path);
    if (TEXT.test(path) && existsSync(root + path)) assert.doesNotMatch(readFileSync(root + path, 'utf8'), BLOCKED_LINK, path);
  }
});
