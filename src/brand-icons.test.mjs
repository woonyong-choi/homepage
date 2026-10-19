import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { BRAND_NOTICES, brandIcon, brandNames, readBrandAsset } from './brand-icons.mjs';
import { contentIcon } from './content-icons.mjs';
import { readContentFile } from './content-files.mjs';
import { publicationAssets } from './publication-assets.mjs';

const root = new URL('../', import.meta.url);
const sources = JSON.parse(readFileSync(new URL('config/assets.json', root), 'utf8'));
const owned = sources.filter(entry => entry.brand);
const sha256 = value => createHash('sha256').update(value).digest('hex');

test('every_homepage_logo_is_a_recorded_third_party_mark_with_its_notice_and_bytes', () => {
  const files = readdirSync(new URL('content/assets/brands/', root)).filter(name => name.endsWith('.svg')).map(name => `assets/brands/${name}`).sort();
  assert.deepEqual(owned.map(entry => entry.file).sort(), files);
  for (const entry of owned) {
    assert.equal(entry.file, `assets/brands/${entry.brand.name}.svg`);
    assert.equal(entry.origin, 'third-party', entry.file);
    assert.match(entry.license, /identification only/, entry.file);
    assert.match(entry.url, /^https:\/\//, entry.file);
    assert.equal(entry.notice, 'assets/brands/technology-logos-NOTICE.txt', entry.file);
    assert.equal(sha256(readFileSync(new URL(`content/${entry.file}`, root))), entry.sha256, entry.file);
    assert.match(readFileSync(new URL(`content/${entry.notice}`, root), 'utf8'), new RegExp(`^${entry.brand.label.replace(/[+#.]/g, '\\$&')}[: ]`, 'm'), entry.file);
  }
});

test('homepage_logos_resolve_before_the_shared_catalog_and_shared_marks_still_resolve', () => {
  for (const { brand, file } of owned) assert.deepEqual({ ...brandIcon(brand.name) }, { label: brand.label, src: `/${file}`, notice: '/assets/brands/technology-logos-NOTICE.txt' });
  for (const name of ['github', 'linkedin', 'git', 'postgresql', 'redis', 'nginx']) assert.match(brandIcon(name).src, new RegExp(`^/theme/assets/icons/brands/${name}\\.svg$`));
  assert.equal(brandIcon('document'), undefined);
  assert.match(contentIcon('python'), /<img src="\/assets\/brands\/python\.svg"/);
  assert.match(contentIcon('document'), /<svg/);
});

test('every_logo_named_by_the_shipped_tech_page_resolves', () => {
  const { metadata } = readContentFile(new URL('content/pages/tech.md', root).pathname);
  const names = [...metadata.items, ...Object.values(metadata.topics).map(topic => topic.icon)].filter(name => brandNames().has(name));
  assert.ok(names.length >= metadata.items.length);
  for (const name of names) assert.ok(brandIcon(name).src, name);
});

test('a_published_logo_carries_its_notice_and_preview_reads_it_from_the_homepage', () => {
  const [[src, notice]] = BRAND_NOTICES;
  const assets = publicationAssets(new Map([['/', `<img src="${src}">`]]), [], path => path.startsWith('/theme/') ? '' : readBrandAsset(path));
  assert.ok(assets.has(src));
  assert.ok(assets.has(notice));
  assert.equal(readBrandAsset('/assets/company-nexon.png'), undefined);
});
