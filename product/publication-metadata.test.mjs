import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { publicationMetadata, siteOrigin } from './publication-metadata.mjs';
import { siteIdentity } from './site-identity.mjs';

const context = {
  config: { name: '이름', description: '사이트 소개' }, origin: 'https://example.invalid', themeHash: 'hash', preview: false,
  identity: { favicon: '/media/icon-32.png', touch: '/media/icon-180.png', share: '/media/icon-512.png' },
  topics: { javascript: { label: '언어 분류' } },
  tags: { javascript: { label: 'JavaScript' } },
};

test('metadata_uses_one_home_name_and_keeps_preview_without_an_invented_origin', () => {
  const home = publicationMetadata({ title: '이름', route: '/' }, { ...context, origin: '', preview: true });
  assert.match(home, /<title>이름<\/title>/);
  assert.match(home, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(home, /canonical|og:url|example\.invalid/);
  assert.match(home, /rel="icon" type="image\/svg\+xml"/);
});

test('article_metadata_shares_identity_and_escapes_content_without_exposing_logical_type', () => {
  const page = { id: 'stable', title: '제목 "<>&', description: '설명 "<>&', route: '/articles/example/', publishedAt: '2026-01-01', updatedAt: '2026-02-01', tags: ['javascript'] };
  const wiki = publicationMetadata({ ...page, type: 'wiki' }, context);
  assert.equal(wiki, publicationMetadata({ ...page, type: 'blog' }, context));
  assert.match(wiki, /property="og:type" content="article"/);
  assert.match(wiki, /property="og:title" content="제목 &quot;&lt;&gt;&amp;"/);
  assert.match(wiki, /property="og:url" content="https:\/\/example\.invalid\/articles\/example\/"/);
  assert.match(wiki, /property="og:image" content="https:\/\/example\.invalid\/media\/icon-512.png"/);
  assert.match(wiki, /property="article:published_time" content="2026-01-01"/);
  assert.match(wiki, /property="article:tag" content="JavaScript"/);
  assert.doesNotMatch(wiki, /noindex|content="wiki"|content="blog"/);
});

test('archive_metadata_is_a_website_and_does_not_invent_article_dates', () => {
  const html = publicationMetadata({ title: 'Blog', route: '/blog/', type: 'blog' }, context);
  assert.match(html, /property="og:type" content="website"/);
  assert.doesNotMatch(html, /article:(published|modified)_time/);
});

test('site_origin_rejects_credentials_paths_queries_and_insecure_publication', () => {
  assert.equal(siteOrigin('', true), '');
  assert.equal(siteOrigin('http://localhost:8796', true), 'http://localhost:8796');
  assert.equal(siteOrigin('https://[::1]:9443', false), 'https://[::1]:9443');
  for (const value of ['', 'http://example.invalid']) assert.throws(() => siteOrigin(value, false), /production build requires/);
  for (const value of ['https://user:password@example.invalid', 'https://example.invalid/path', 'https://example.invalid/?q=a', 'https://example.invalid#fragment', 'https://example.invalid\\path', ' https://example.invalid', 'https://example.invalid:99999', 'data:text/plain,hello']) {
    assert.throws(() => siteOrigin(value, true), /invalid site origin/);
  }
});

test('identity_pngs_are_reproducible_from_the_exported_icon_without_system_fonts', () => {
  const svg = readFileSync(new URL('./vendor/theme/assets/icons/small/document.svg', import.meta.url));
  const notice = readFileSync(new URL('./vendor/theme/assets/controls/LICENSE', import.meta.url));
  const first = siteIdentity(svg, notice);
  const second = siteIdentity(svg, notice);
  for (const [role, size] of [['favicon', 32], ['touch', 180], ['share', 512]]) {
    assert.equal(first[role], second[role]);
    const png = first.assets.get(first[role]);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.ok(png.equals(second.assets.get(second[role])));
  }
  assert.ok(first.assets.get('/media/site-icon-LICENSE.txt').equals(notice));
  assert.throws(() => siteIdentity('invalid SVG', notice));
});
