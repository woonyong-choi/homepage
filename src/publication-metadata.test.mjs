import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { Resvg } from '@resvg/resvg-js';
import { readIcon } from '@woonyong-choi/design-tokens/ui/build/icons.mjs';
import { publicationMetadata, siteOrigin } from './publication-metadata.mjs';
import { documentShell, notFoundPage } from './publication-layout.mjs';
import { siteIdentity } from './site-identity.mjs';

const context = {
  config: { name: '이름', description: '사이트 소개' }, origin: 'https://example.invalid', themeHash: 'hash', preview: false,
  identity: { touch: '/media/icon-180.png', share: '/media/icon-512.png' },
  topics: { javascript: { label: '언어 분류' } },
  tags: { javascript: { label: 'JavaScript' } },
};

test('favicon_reuses_only_the_original_w_and_paints_a_static_mark', () => {
  const original = readFileSync(new URL('../content/assets/who-knows.svg', import.meta.url), 'utf8');
  const svg = readFileSync(new URL('../content/assets/site-icon.svg', import.meta.url), 'utf8');
  const document = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
  const paths = document.querySelectorAll('path');

  assert.equal(paths.length, 1);
  assert.equal(paths[0].getAttribute('d'), original.match(/ d="([^Z]+Z)/)[1]);
  assert.notEqual(svg, original);
  assert.equal(document.documentElement.getAttribute('viewBox'), '0 -317 2124 2124');
  assert.equal(paths[0].getAttribute('fill'), 'CanvasText');
  assert.equal(document.querySelector('script, foreignObject, image, use, animate'), null);
  for (const size of [16, 32]) {
    const pixels = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().pixels;
    assert.ok(pixels.some((value, index) => index % 4 === 3 && value > 0));
    assert.ok(pixels.some((value, index) => index % 4 === 3 && value === 0));
  }
});

test('metadata_uses_one_home_name_and_keeps_preview_without_an_invented_origin', () => {
  const home = publicationMetadata({ title: '이름', route: '/' }, { ...context, origin: '', preview: true });
  assert.match(home, /<title>이름<\/title>/);
  assert.match(home, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(home, /canonical|og:url|example\.invalid/);
  const favicon = readFileSync(new URL('../content/assets/site-icon.svg', import.meta.url));
  const hash = createHash('sha256').update(favicon).digest('hex');
  assert.equal(new JSDOM(home).window.document.querySelector('link[rel="icon"]').getAttribute('href'), `/assets/site-icon.svg?v=${hash}`);
  assert.equal(new JSDOM(home).window.document.querySelectorAll('link[rel="icon"]').length, 1);
  const config = { ...context.config, name: '이름 & 글', github: 'https://github.com/example' };
  const page = documentShell({ title: config.name, route: '/' }, '', { ...context, config });
  const logo = new JSDOM(page).window.document.querySelector('.app-logo');
  assert.equal(logo.getAttribute('href'), '/');
  assert.equal(logo.getAttribute('aria-label'), `${config.name} 홈`);
  assert.equal(logo.querySelector('[data-control-icon]'), null);
  assert.equal(logo.textContent, config.name);
  const branded = { ...config, title: 'Who Knows', logo: { src: '/assets/who-knows.svg', alt: 'Who Knows' } };
  const brandedPage = documentShell({ title: config.name, route: '/' }, '', { ...context, config: branded });
  const brandedLogo = new JSDOM(brandedPage).window.document.querySelector('.app-logo');
  assert.equal(brandedLogo.getAttribute('aria-label'), 'Who Knows 홈');
  assert.equal(brandedLogo.querySelector('svg').getAttribute('aria-hidden'), 'true');
  assert.equal(brandedLogo.querySelector('img'), null);
  assert.equal(brandedLogo.querySelector('[data-control-icon]'), null);
  assert.equal(brandedLogo.textContent, '');
  assert.match(brandedPage, /<title>이름 &amp; 글 · Who Knows<\/title>/);
  assert.match(brandedPage, /property="og:site_name" content="Who Knows"/);
  assert.match(brandedPage, /content="이름 &amp; 글의 기록을 나타내는 문서 아이콘"/);
  assert.match(publicationMetadata({ title: '글 제목', route: '/articles/example/' }, { ...context, config: branded }), /<title>글 제목 · Who Knows<\/title>/);
  assert.throws(() => documentShell({ title: config.name, route: '/' }, '', { ...context, config: { ...branded, logo: { src: '/assets/../secret.svg' } } }), /content SVG must be a file under \/assets/);
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
  const svg = readIcon('document');
  const first = siteIdentity(svg);
  const second = siteIdentity(svg);
  for (const [role, size] of [['touch', 180], ['share', 512]]) {
    assert.equal(first[role], second[role]);
    const png = first.assets.get(first[role]);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.ok(png.equals(second.assets.get(second[role])));
  }
  assert.throws(() => siteIdentity('invalid SVG'));
});

test('not_found_document_keeps_the_site_shell_and_is_excluded_from_indexing', () => {
  const html = documentShell({ route: '/404.html', title: '페이지를 찾을 수 없습니다', noindex: true }, notFoundPage(), { ...context, config: { ...context.config, github: 'https://github.com/example', linkedin: 'https://www.linkedin.com/in/example' } });
  const document = new JSDOM(html).window.document;
  assert.equal(document.title, '페이지를 찾을 수 없습니다 · 이름');
  assert.equal(document.querySelector('meta[name=robots]').content, 'noindex,nofollow');
  assert.equal(document.querySelector('link[rel=canonical], meta[property="og:url"]'), null);
  assert.ok(document.querySelector('header nav'), '사이트 메뉴');
  assert.ok(document.querySelector('main#main form[action="/search/"]'), '검색');
  assert.equal(document.querySelector('main h1').textContent, '페이지를 찾을 수 없습니다');
  // 어느 경로에서 읽혀도 같은 대상을 가리키도록 모든 내부 주소는 루트 기준이다.
  for (const node of document.querySelectorAll('[href], [src]')) {
    const value = node.getAttribute('href') ?? node.getAttribute('src');
    assert.match(value, /^(?:\/|#|https?:|data:|mailto:)/, value);
  }
});
