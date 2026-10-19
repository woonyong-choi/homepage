import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { getIconCatalog } from '@woonyong-choi/design-tokens/ui/build/icons.mjs';
import { brandIcon, brandNames } from './brand-icons.mjs';
import { contentIcon } from './content-icons.mjs';
import { readContentFile } from './content-files.mjs';
import { publicationAssets } from './publication-assets.mjs';
import { THEME_ROOT } from './design-package.mjs';

const root = new URL('../', import.meta.url);
const migrated = ['c', 'csharp', 'python', 'typescript', 'javascript', 'kotlin', 'kubernetes', 'docker', 'nodejs', 'spring', 'linux'];

test('brands_resolve_only_to_the_shared_catalog_including_the_eleven_migrated_names', () => {
  const catalog = getIconCatalog();
  assert.deepEqual(brandNames(), new Set(Object.keys(catalog.brands)));
  for (const [name, brand] of Object.entries(catalog.brands)) {
    assert.deepEqual(brandIcon(name), { label: brand.label, src: `/theme/assets/icons/${brand.file}` });
  }
  for (const name of migrated) {
    assert.ok(brandNames().has(name), name);
    assert.equal(existsSync(new URL(`content/assets/brands/${name}.svg`, root)), false);
    assert.match(contentIcon(name), new RegExp(`<img src="/theme/assets/icons/brands/${name}\\.svg"`));
  }
  for (const name of ['document', 'missing-brand']) assert.equal(brandIcon(name), undefined);
  assert.match(contentIcon('document'), /<svg/);
  assert.throws(() => contentIcon('missing-brand'), /unknown icon/);
});

test('every_logo_named_by_the_shipped_tech_page_resolves', () => {
  const { metadata } = readContentFile(new URL('content/pages/tech.md', root).pathname);
  const names = [...metadata.items, ...Object.values(metadata.topics).map(topic => topic.icon)].filter(name => brandNames().has(name));
  assert.ok(names.length >= metadata.items.length);
  for (const name of names) assert.ok(brandIcon(name).src, name);
});

test('publication_keeps_shared_brand_notices_without_homepage_logo_sources', () => {
  const src = brandIcon('python').src;
  const assets = publicationAssets(new Map([['/', `<img src="${src}">`]]), [], path => readFileSync(`${THEME_ROOT}/${path.slice('/theme/'.length)}`));
  assert.ok(assets.has(src));
  for (const brand of Object.values(getIconCatalog().brands)) {
    if (brand.notice) assert.ok(assets.has(`/theme/assets/icons/${brand.notice}`));
  }
  assert.equal([...assets.keys()].some(path => path.startsWith('/assets/brands/')), false);
  const sources = JSON.parse(readFileSync(new URL('config/assets.json', root), 'utf8'));
  assert.equal(sources.some(entry => entry.file.startsWith('assets/brands/')), false);
});
