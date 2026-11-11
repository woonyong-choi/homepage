import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { parseIconSvg } from '../ui/svg.mjs';

const root = new URL('../', import.meta.url).pathname;
const sources = JSON.parse(readFileSync(root + 'assets/sources.json', 'utf8'));
const catalog = JSON.parse(readFileSync(root + 'assets/icons/catalog.json', 'utf8'));
const ORIGINS = new Set(['project-original', 'third-party', 'catalog', 'license-notice']);
// 제3자 웹사이트에서 가져온 그림의 이름 형식. 같은 이름을 다시 들이지 않는다.
const THIRD_PARTY_NAMES = [/-io\d{2}\.[a-z0-9]+$/i, /^fancysection-/i, /^arrivals-/i, /^bezel-/i];
const BLOCKED_HOST = /(^|\.)culturedcode\.com$/i;
const SKIP = new Set(['node_modules', '.git', '.local']);

const walk = dir => readdirSync(root + dir, { withFileTypes: true }).flatMap(entry => {
  if (SKIP.has(entry.name)) return [];
  const path = dir ? `${dir}/${entry.name}` : entry.name;
  return entry.isDirectory() ? walk(path) : [path];
});
const repository = walk('');
const filesUnder = dir => repository.filter(path => path.startsWith(dir + '/')).map(path => path.slice(dir.length + 1));
const sha256 = path => createHash('sha256').update(readFileSync(root + path)).digest('hex');
const blocked = url => { try { return BLOCKED_HOST.test(new URL(url).hostname); } catch { return true; } };
const pattern = glob => new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`);
const entriesFor = name => sources.filter(entry => entry.file === name || (entry.files && pattern(entry.files).test(name)));

test('every_asset_and_distributed_asset_has_one_source_with_origin_and_license', () => {
  for (const dir of ['assets', 'dist/assets']) {
    const names = filesUnder(dir);
    assert.ok(names.length > 0, dir);
    for (const name of names) {
      const entries = entriesFor(name);
      assert.equal(entries.length, 1, `${dir}/${name}: 출처 기록은 하나여야 한다`);
      const [entry] = entries;
      assert.ok(ORIGINS.has(entry.origin), `${dir}/${name}: origin`);
      assert.equal(typeof entry.license, 'string', `${dir}/${name}: license`);
      assert.ok(entry.license.trim(), `${dir}/${name}: license`);
    }
  }
});

test('source_records_point_to_existing_files_with_matching_hashes_and_allowed_origins', () => {
  for (const entry of sources) {
    const label = entry.file ?? entry.files;
    assert.ok(Boolean(entry.file) !== Boolean(entry.files), label);
    if (entry.file) {
      assert.ok(existsSync(root + 'assets/' + entry.file), label);
      if (entry.sha256) assert.equal(sha256('assets/' + entry.file), entry.sha256, label);
      if (entry.bytes !== undefined) assert.equal(readFileSync(root + 'assets/' + entry.file).length, entry.bytes, label);
    } else {
      assert.ok(filesUnder('assets').some(name => pattern(entry.files).test(name)), label);
    }
    if (entry.origin === 'third-party') {
      assert.match(entry.url ?? '', /^https:\/\//, label);
      assert.equal(blocked(entry.url), false, label);
    } else {
      assert.equal(entry.url, undefined, label);
    }
  }
});

test('comparison_only_history_keeps_no_copy_of_the_previous_third_party_file', () => {
  const hashes = new Set(repository.map(sha256));
  const previous = sources.filter(entry => entry.previousSource);
  for (const entry of previous) {
    assert.equal(entry.origin, 'project-original', entry.file);
    assert.equal(entry.previousSource.use, 'comparison-only', entry.file);
    assert.match(entry.previousSource.sha256, /^[0-9a-f]{64}$/, entry.file);
    assert.equal(hashes.has(entry.previousSource.sha256), false, `${entry.file}: 이전 제3자 원본 사본이 저장소에 있다`);
  }
});

test('icon_catalog_sources_have_notices_and_never_point_to_blocked_hosts', () => {
  for (const library of catalog.libraries) {
    assert.ok(existsSync(root + 'assets/icons/' + library.notice), library.name);
    if (library.source) assert.equal(blocked(library.source), false, library.name);
  }
  for (const [name, brand] of Object.entries(catalog.brands)) {
    assert.ok(brand.license, name);
    assert.ok(catalog.libraries.some(library => library.name === brand.library), name);
    assert.equal(blocked(brand.source), false, name);
  }
});

test('brand_marks_preserve_source_identity_result_hash_and_catalog_notice', () => {
  for (const [name, brand] of Object.entries(catalog.brands)) {
    assert.match(brand.file ?? '', /^brands\/[a-z0-9-]+\.svg$/, name);
    assert.ok(existsSync(root + 'assets/icons/' + brand.file), name);
    assert.match(brand.sourceSha256 ?? '', /^[0-9a-f]{64}$/, name);
    assert.ok(brand.variant, name);
    assert.ok(brand.guide, name);
    assert.ok(brand.treatment, name);
    assert.equal(sha256('assets/icons/' + brand.file), brand.sha256, name);
    assert.equal(brand.transformSha256, brand.sha256, name);
    assert.doesNotThrow(() => parseIconSvg(readFileSync(root + 'assets/icons/' + brand.file, 'utf8')), name);
    const library = catalog.libraries.find(item => item.name === brand.library);
    assert.ok(library, name);
    assert.ok(existsSync(root + 'assets/icons/' + (brand.notice ?? library.notice)), name);
  }
  const notices = new Set([...catalog.libraries, ...Object.values(catalog.brands)].map(item => item.notice).filter(Boolean));
  for (const name of filesUnder('assets/icons/licenses')) assert.ok(notices.has(`licenses/${name}`), `${name}: 카탈로그가 가리키지 않는 고지`);
});

test('repository_has_no_third_party_site_file_names_or_asset_links', () => {
  for (const path of repository) {
    const name = path.split('/').pop();
    for (const rule of THIRD_PARTY_NAMES) assert.doesNotMatch(name, rule, path);
  }
  const shipped = repository.filter(path => /^(styles|ui|tokens|dist)\//.test(path) && /\.(css|m?js|json|html|svg)$/.test(path) && !path.endsWith('assets/sources.json'));
  for (const path of shipped) assert.doesNotMatch(readFileSync(root + path, 'utf8'), /culturedcode\.com/i, path);
});
