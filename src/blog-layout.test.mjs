import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blogCard, searchListing, blogFeed } from './blog-layout.mjs';
import { loadBlogLayout } from './layout-config.mjs';
import { JSDOM } from 'jsdom';

const TAGS = { os: { label: '운영체제' } };
function posts(count) {
  return Array.from({ length: count }, (_, id) => ({ id: `post-${id}`, route: `/articles/post-${id}/`, title: `글 ${id}`, description: '설명', publishedAt: '2026-10-01', type: 'blog', tags: ['os'], contentIcon: { name: 'operating-system' }, html: `<h2 id="post-${id}-section">절</h2><p>본문</p>` }));
}

test('blog_cards_keep_post_and_tag_links_independent', () => {
  const post = { ...posts(1)[0], comments: true, commentCount: 2, cardAuthor: { name: '작성자', href: '/author/' }, thumbnail: { src: '/media/cover.webp', alt: '상단의 "검색" 입력창', position: { x: 37.5, y: 0 } } };
  const layout = loadBlogLayout();
  layout.blog.card.tags = true;
  for (const html of [blogCard(post, TAGS, 2, layout.blog.card), searchListing([post], TAGS, { layout })]) {
    assert.match(html, /object-position:37\.5% 0%/);
    assert.match(html, /alt="상단의 &quot;검색&quot; 입력창"/);
    assert.match(html, /<a class="app-blog-card-link"[^>]+><div class="app-blog-cover"><img[^>]+><\/div>/);
    const card = html.match(/<article class="app-blog-card">[\s\S]*?<\/article>/)[0];
    assert.equal((card.match(/<a /g) ?? []).length, 3);
    const { document } = new JSDOM(card).window;
    assert.equal(document.querySelector('.app-blog-card-tags .app-tag').getAttribute('href'), '/search/?tag=os');
    assert.equal(document.querySelector('.app-blog-card-link .app-tag'), null);
    assert.equal((card.match(/<a class="app-blog-card-link"/g) ?? []).length, 1);
    assert.match(card, /<a class="app-blog-card-link" href="\/articles\/post-0\/"/);
    assert.match(card, /<p class="app-card-summary">설명<\/p><\/div><\/a><div class="app-blog-card-tags"[\s\S]*?<div class="app-blog-card-meta">.*<time class="app-blog-card-date" datetime="2026-10-01">2026년 10월 1일<\/time>/);
    assert.match(card, /<a class="app-blog-card-comments" href="\/articles\/post-0\/#comments">댓글 2개<\/a><\/div><\/article>$/);
    assert.doesNotMatch(card, /app-blog-card-author|app-blog-card-avatar|작성자/);
    assert.doesNotMatch(card, /href="\/author\/"/);
    assert.doesNotMatch(card, /app-blog-card-footer/);
    assert.match(html, /app-card-summary/);
    assert.match(html, /app-blog-card-tags/);
  }
  const centered = blogCard({ ...post, thumbnail: { src: post.thumbnail.src, alt: '' } }, TAGS);
  assert.doesNotMatch(centered, /object-position/);
  const fallback = blogCard({ ...post, thumbnail: undefined }, TAGS);
  assert.doesNotMatch(fallback, /app-content-icon/);
  assert.doesNotMatch(fallback, /cover.webp|object-position/);
  assert.match(blogCard({ ...post, commentCount: undefined }), />댓글 보기<\/a>/);
  assert.match(blogCard({ ...post, commentCount: 0 }), />댓글 0개<\/a>/);
});

test('blog_listing_keeps_all_static_cards_and_offers_only_used_tags_without_subject_icons', () => {
  const entries = posts(14).map((post, i) => ({ ...post, route: `/blog/post-${i}/`, tags: i === 0 ? [] : ['산책'] }));
  const dom = new JSDOM(searchListing(entries, { 산책: { label: '산책' } }, { demo: true }));
  const document = dom.window.document;
  assert.equal(document.querySelectorAll('.app-blog-card').length, 14);
  assert.equal(document.querySelectorAll('.app-title-cover').length, 14);
  assert.equal(document.querySelectorAll('.app-blog-card-tags, .app-content-icon').length, 0);
  assert.equal(document.querySelectorAll('[data-blog-tags] .app-tag.is-medium').length, 0);
  assert.equal(document.querySelector('form').getAttribute('action'), '/search/');
  assert.equal(document.querySelector('[data-blog-tags] a').getAttribute('href'), '/search/?tag=%EC%82%B0%EC%B1%85');
  assert.match(document.querySelector('main').textContent, /합성 예시/);
  assert.equal(document.querySelectorAll('[data-blog-list]').length, 0);
  dom.window.close();
});

test('static_blog_cards_apply_display_settings_and_all_rows_boundary', () => {
  const layout = loadBlogLayout();
  layout.blog.collection.rows = null;
  layout.blog.card = { title: false, description: false, media: 'none', tags: false, date: false, comments: false };
  const post = { ...posts(1)[0], comments: true, thumbnail: { src: '/media/cover.png', alt: '책' } };
  const dom = new JSDOM(searchListing([post], TAGS, { layout }));
  const { document } = dom.window;
  const card = document.querySelector('.app-blog-card');
  assert.equal(document.querySelector('[data-search-page]').dataset.pageSize, 'all');
  assert.deepEqual(JSON.parse(document.querySelector('[data-search-page]').dataset.card), layout.blog.card);
  assert.equal(card.querySelector('.app-blog-card-title').classList.contains('app-sr'), true);
  for (const selector of ['img', '.app-title-cover', '.app-card-summary', '.app-blog-card-tags', 'time', '.app-blog-card-comments']) assert.equal(card.querySelector(selector), null);
  dom.window.close();
});

test('search_and_recent_blog_share_posts_but_keep_distinct_views', () => {
  const entries = posts(10).map((post, index) => ({ ...post, route: `/blog/post-${index}/` }));
  const search = new JSDOM(searchListing(entries, TAGS)).window.document;
  const feed = new JSDOM(blogFeed(entries, TAGS, 1)).window.document;
  assert.equal(search.querySelectorAll('.app-blog-card').length, 10);
  assert.equal(search.querySelector('form').getAttribute('action'), '/search/');
  assert.equal(feed.querySelectorAll('.app-blog-post').length, 4);
  assert.equal(feed.querySelectorAll('.app-blog-card, .app-title-cover, form').length, 0);
  assert.equal(feed.querySelectorAll('.app-blog-post .app-tag.is-medium').length, 4);
  assert.equal(feed.querySelector('[rel=next]').getAttribute('href'), '/blog/page/2/');
  assert.equal(feed.querySelector('.app-list-link'), null);
  assert.ok(feed.querySelector('a[href="/search/"]'));
  assert.match(feed.querySelector('.app-blog-post').textContent, /본문/);
  assert.equal(new JSDOM(blogFeed(entries, TAGS, 3)).window.document.querySelectorAll('.app-blog-post').length, 2);
});
