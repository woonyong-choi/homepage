import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { LAYOUT, parseLayoutConfig } from './layout-config.mjs';
import { parseHomeNavigation } from './home-content.mjs';
import { documentShell, wikiLanding } from './publication-layout.mjs';
import { recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';

const document = html => JSDOM.fragment(html);
const posts = Array.from({ length: 7 }, (_, i) => ({ id: `post-${i}`, title: `글 ${i}`, route: `/blog/post-${i}/`, description: '요약', publishedAt: '2026-10-01', contentIcon: { name: 'processor' }, tags: [], html: '<p>내용</p>' }));
const topics = Object.fromEntries(['a', 'b', 'c'].map(id => [id, { group: 'cs', field: 'cs', label: id, icon: 'processor', description: `${id} 설명` }]));
const articles = Object.keys(topics).map(id => ({ id, slug: id, title: id, category: id, type: 'wiki', route: `/docs/${id}/` }));

test('layout_changes_reorder_sections_and_paginate_every_topic_without_losing_entries', () => {
  const layout = structuredClone(LAYOUT);
  layout.search.sections = [{ id: 'cs', enabled: true }, { id: 'blog', enabled: true }, { id: 'tech', enabled: false }];
  layout.cs.title = '기초 <분야>';
  layout.cs.order = ['c', 'a'];
  layout.cs.preview = { columns: 1, rows: 1 };
  layout.cs.collection = { columns: 1, rows: 2 };
  layout.cs.card = { title: true, description: false, media: 'none' };
  const html = wikiLanding(articles, { topics, layout }, undefined, recentBlog(posts, {}, layout));
  const page = document(html);
  assert.deepEqual([...page.querySelectorAll('.app-support-group > h2')].map(node => node.textContent), ['기초 <분야>', 'Blog']);
  assert.deepEqual([...page.querySelectorAll('.app-help-card strong')].map(node => node.textContent), ['c']);
  assert.equal(page.querySelector('.app-help-card .app-content-icon'), null);
  assert.equal(page.querySelector('.app-help-card p'), null);
  assert.equal(page.querySelector('.app-support-grid').className, 'app-support-grid is-single');
  const pages = [1, 2].map(page => document(wikiLanding(articles, { topics, layout }, 'cs', '', page)));
  assert.deepEqual(pages.flatMap(page => [...page.querySelectorAll('.app-help-card strong')].map(node => node.textContent)), ['c', 'a', 'b']);
  assert.equal(pages[0].querySelector('[rel=next]').getAttribute('href'), '/docs/topics/cs/page/2/');
  assert.equal(pages[1].querySelector('[rel=prev]').getAttribute('href'), '/docs/topics/cs/');
  layout.cs.order = ['missing'];
  assert.throws(() => wikiLanding(articles, { topics, layout }, 'cs'), /config\/cs.json.order.*missing/);
});

test('blog_display_settings_change_previews_and_pages_but_keep_the_same_complete_collection', () => {
  const layout = structuredClone(LAYOUT);
  layout.blog.preview = { columns: 1, rows: 1 };
  layout.blog.collection = { columns: 2, rows: 1 };
  layout.blog.feedSize = 3;
  layout.blog.autoLoad = false;
  layout.blog.card = { title: false, description: false, media: 'icon', tags: false, date: false, comments: false };
  const preview = document(recentBlog(posts, {}, layout));
  assert.equal(preview.querySelectorAll('.app-blog-card').length, 1);
  assert.equal(preview.querySelector('.app-blog-card-link').getAttribute('aria-label'), '글 0');
  assert.ok(preview.querySelector('.app-blog-card-title.app-sr'));
  assert.ok(preview.querySelector('.app-blog-cover .app-content-icon'));
  assert.equal(preview.querySelector('.app-card-summary, .app-blog-card-meta, .app-blog-card-tags'), null);
  const pages = [1, 2, 3, 4].map(page => document(blogArchive(posts, {}, page, { layout })));
  assert.ok(pages.every(page => !page.querySelector('[data-blog-list]')));
  assert.equal(pages[0].querySelector('[rel=next]').getAttribute('href'), '/blog/all/page/2/');
  assert.deepEqual(pages.flatMap(page => [...page.querySelectorAll('.app-blog-card-link')].map(link => link.getAttribute('href'))), posts.map(post => post.route));
  assert.equal(document(blogFeed(posts, {}, 1, { layout })).querySelectorAll('.app-blog-slice').length, 3);
  layout.blog.card = { ...layout.blog.card, title: true, media: 'none' };
  assert.equal(document(recentBlog(posts, {}, layout)).querySelector('.app-blog-cover'), null);
});

test('layout_validation_reports_setting_paths_instead_of_ignoring_typographical_errors', () => {
  assert.deepEqual(parseLayoutConfig(LAYOUT), LAYOUT);
  for (const [change, expected] of [
    [value => { value.cs.preview.columns = 0; }, /config\/cs.json.preview.columns/],
    [value => { value.tech.collection.rows = -1; }, /config\/tech.json.collection.rows/],
    [value => { value.blog.card.title = 'false'; }, /config\/blog.json.card.title/],
    [value => { value.cs.card.media = 'video'; }, /config\/cs.json.card.media/],
    [value => { value.cs.card = { title: false, description: false, media: 'none' }; }, /config\/cs.json.card/],
    [value => { value.search.sections.push(value.search.sections[0]); }, /config\/search.json.sections/],
    [value => { value.search.box.lables = {}; }, /config\/search.json.box.lables/],
  ]) {
    const value = structuredClone(LAYOUT);
    change(value);
    assert.throws(() => parseLayoutConfig(value), expected);
  }
});

test('home_navigation_owns_labels_order_targets_and_active_page_matching', () => {
  const navigation = parseHomeNavigation([
    { label: '기록', href: '/blog/' },
    { label: '찾기', href: '/docs/', match: ['/docs/', '/search/', '/tags/'] },
  ]);
  const html = documentShell({ route: '/tags/python/', title: 'Python' }, '<main id="main"></main>', { navigation, config: { name: '사이트', github: 'https://github.com/example', linkedin: 'https://www.linkedin.com/in/example' } });
  const page = document(html);
  assert.ok(html.indexOf('>기록<') < html.indexOf('>찾기<'));
  assert.equal(page.querySelector('[aria-current=page]').textContent, '찾기');
  assert.throws(() => parseHomeNavigation([{ label: '실행', href: 'javascript:alert(1)' }]), /navigation\[0\].href/);
  assert.throws(() => parseHomeNavigation([{ label: '홈', href: '/' }, { label: '홈 2', href: '/' }]), /중복 메뉴/);
});
