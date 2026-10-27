// 발행 글이 있을 때만 실행되는 피드·사이트맵·페이지 나눔·본문 링크 재작성을 임시 입력으로 검사한다.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { buildPublication, blogFeedXml } from './build-publication.mjs';
import { loadBlogLayout } from './layout-config.mjs';

const ORIGIN = 'https://example.test';

function post({ id, title, date, body = '본문', extra = '' }) {
  return `---\nid: ${id}\nslug: ${id}\ntype: blog\ntitle: ${title}\ndescription: ${title} 설명 & 요약\ntags: [기술]\nvisibility: public\npublishedAt: ${date}\n${extra}---\n\n${body}\n`;
}

function workspace(t) {
  const root = fileURLToPath(new URL(`../dist/test/build-${randomUUID()}/`, import.meta.url));
  const blog = join(root, 'blog');
  mkdirSync(blog, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const posts = [
    post({ id: 'first-post', title: '첫 글', date: '2026-01-01', body: '## 첫 절\n\n[두 번째 글](/articles/second-post/)과 [절 이동](/articles/second-post/#second-heading), [위키](/wiki/outside-note/), [첫 절로](#첫-절).' }),
    post({ id: 'second-post', title: '두 번째 글', date: '2026-01-02', body: '## Second heading\n\n두 번째 본문.' }),
    post({ id: 'third-post', title: '세 번째 글', date: '2026-01-03' }),
    post({ id: 'fourth-post', title: '네 번째 글', date: '2026-01-04' }),
    post({ id: 'fifth-post', title: '다섯 번째 <글>', date: '2026-01-05' }),
    post({ id: 'example-post', title: '예시 글', date: '2026-01-06', extra: 'example: true\n' }),
    post({ id: 'draft-post', title: '초안', date: '2026-01-07', extra: '' }).replace('visibility: public', 'visibility: draft'),
  ];
  posts.forEach((source, index) => writeFileSync(join(blog, `${index}.md`), source));
  return { blog, output: join(root, 'site') };
}

const read = (root, path) => readFileSync(join(root, path), 'utf8');

test('blog_feed_xml_escapes_and_orders_items', () => {
  const xml = blogFeedXml([
    { id: 'b', route: '/blog/b/', title: 'B & <C>', description: '"설명"', publishedAt: '2026-01-02' },
    { id: 'a', route: '/blog/a/', title: 'A', description: 'a', publishedAt: '2026-01-01' },
  ], { title: '사이트 & 기록', description: '소개', origin: ORIGIN });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?><rss version="2.0"><channel><title>사이트 &amp; 기록<\/title><link>https:\/\/example.test\/blog\/<\/link>/);
  assert.match(xml, /<item><title>B &amp; &lt;C&gt;<\/title><link>https:\/\/example.test\/blog\/b\/<\/link><guid isPermaLink="false">b<\/guid><pubDate>Fri, 02 Jan 2026 00:00:00 GMT<\/pubDate>/);
  assert.ok(xml.indexOf('/blog/b/') < xml.indexOf('/blog/a/'));
  assert.ok(xml.endsWith('</channel></rss>'));
});

test('build_with_posts_writes_feed_sitemap_pages_and_rewritten_links', { timeout: 300000 }, async t => {
  const { blog, output } = workspace(t);
  const { feedSize } = loadBlogLayout().blog;
  const pages = Math.ceil(5 / feedSize);
  assert.ok(pages >= 2, '페이지 나눔을 검사하려면 쪽 크기보다 글이 많아야 함');
  const result = await buildPublication({ blogRoot: blog, outputRoot: output });
  assert.equal(result.documents, 5);

  const report = JSON.parse(read(output, 'build-report.json'));
  const slugs = ['fifth-post', 'fourth-post', 'third-post', 'second-post', 'first-post'];
  for (const slug of slugs) assert.ok(report.routes.includes(`/blog/${slug}/`), slug);
  for (let page = 2; page <= pages; page++) assert.ok(existsSync(join(output, `blog/page/${page}/index.html`)), `page ${page}`);
  assert.ok(!existsSync(join(output, `blog/page/${pages + 1}`)));
  assert.ok(!report.routes.some(route => /example-post|draft-post/.test(route)));

  const feed = read(output, 'blog/feed.xml');
  assert.deepEqual([...feed.matchAll(/<guid isPermaLink="false">([^<]+)<\/guid>/g)].map(match => match[1]), slugs);
  assert.match(feed, /<title>다섯 번째 &lt;글&gt;<\/title>/);
  assert.match(feed, /<link>\/blog\/first-post\/<\/link>/);

  const sitemap = read(output, 'sitemap.xml');
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(match => match[1]), report.routes);
  assert.equal(read(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

  const article = read(output, 'blog/first-post/index.html');
  assert.match(article, /href="\/blog\/second-post\/"/);
  assert.match(article, /href="\/blog\/second-post\/#second-post-second-heading"/);
  assert.match(article, /href="https:\/\/docs\.woonyong\.com\/wiki\/outside-note\/"/);
  assert.doesNotMatch(article, /href="\/(articles|wiki)\//);
  assert.match(article, /href="#first-post-첫-절"/);
  assert.match(article, /id="first-post-첫-절"/);

  const second = read(output, `blog/page/2/index.html`);
  assert.match(second, /\/blog\/first-post\//);
});

test('production_build_uses_site_origin_and_allows_robots', { timeout: 300000 }, async t => {
  const { blog, output } = workspace(t);
  await assert.rejects(buildPublication({ blogRoot: blog, outputRoot: output, mode: 'production' }), /SITE_ORIGIN/);
  await buildPublication({ blogRoot: blog, outputRoot: output, mode: 'production', origin: ORIGIN });
  assert.equal(read(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`);
  const feed = read(output, 'blog/feed.xml');
  assert.match(feed, /<link>https:\/\/example\.test\/blog\/<\/link>/);
  assert.match(feed, /<link>https:\/\/example\.test\/blog\/first-post\/<\/link>/);
  const sitemap = read(output, 'sitemap.xml');
  assert.match(sitemap, /<loc>https:\/\/example\.test\/blog\/page\/2\/<\/loc>/);
  assert.match(read(output, 'blog/first-post/index.html'), /<link rel="canonical" href="https:\/\/example\.test\/blog\/first-post\/">/);
});

// Vault 원고는 publish/ 기준 ../assets/ 주소로 그림과 첨부를 가리킨다. 어느 경로에서 읽어도 같은 공개 자산을 가리켜야 한다.
test('vault_relative_asset_links_and_images_resolve_to_public_assets', async () => {
  const { assetLinks } = await import('./build-publication.mjs');
  const html = '<p><img src="../assets/a.png" alt=""><a href="../assets/png/b-light.png">밝은 화면</a><a href="assets/c.gif">c</a><a href="../assets/d.png#x">d</a><a href="/assets/e.png">e</a><a href="https://example.test/assets/f.png">f</a></p>';
  assert.equal(assetLinks(html), '<p><img src="/assets/a.png" alt=""><a href="/assets/png/b-light.png">밝은 화면</a><a href="/assets/c.gif">c</a><a href="../assets/d.png#x">d</a><a href="/assets/e.png">e</a><a href="https://example.test/assets/f.png">f</a></p>');
});

// 대표 이미지가 없는 글은 본문의 첫 공개 그림을 목록 카드 표지로 쓴다. 외부 그림은 쓰지 않는다.
test('card_image_uses_first_public_image_in_body', async () => {
  const { firstImage } = await import('./build-publication.mjs');
  assert.deepEqual(firstImage('<p><img src="https://example.test/x.png" alt="외부"><img src="/assets/a&amp;b.png" alt="&quot;검색&quot; 창"></p>'), { src: '/assets/a&b.png', alt: '"검색" 창', position: { x: 0, y: 0 } });
  assert.equal(firstImage('<p>그림 없음</p>'), undefined);
});
