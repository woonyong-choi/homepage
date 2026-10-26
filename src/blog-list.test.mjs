import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { initBlogList } from './blog-list.js';
import { blogFeed } from './blog-layout.mjs';
import { MATH_STYLESHEET } from 'document-engine';
import { RUNTIMES } from '@woonyong-choi/design-tokens/ui/manifest.mjs';

const posts = Array.from({ length: 6 }, (_, id) => ({ route: `/blog/p${id}/`, title: `글 ${id}`, description: '요약' }));
const tick = () => new Promise(resolve => setImmediate(resolve));
const response = html => ({ ok: true, text: async () => html });

test('feed_appends_full_posts_once_and_announces_new_content_to_document_controls', async () => {
  const entries = posts.slice(0, 6).map((post, index) => ({ ...post, id: `p${index}`, tags: [], publishedAt: '2026-10-01', html: `<p>본문 ${index}</p>` }));
  const dom = new JSDOM(blogFeed(entries, {}, 1), { url: 'https://example.com/blog/' });
  const root = dom.window.document.querySelector('[data-blog-list]');
  let additions = 0;
  dom.window.document.addEventListener('content-added', event => {
    additions += 1;
    assert.equal(event.detail.querySelectorAll('.app-blog-post').length, 6);
  });
  initBlogList(root, { Observer: null, fetchPage: async () => response(blogFeed(entries, {}, 2)) });
  root.querySelector('[rel=next]').click();
  await tick();
  assert.deepEqual([...root.querySelectorAll('.app-post-title')].map(title => title.textContent), entries.map(post => post.title));
  assert.equal(root.querySelector('.app-page-links').hidden, true);
  assert.equal(additions, 1);
  assert.match(root.textContent, /본문 5/);
  assert.equal(dom.window.document.activeElement.textContent, '글 4');
  dom.window.close();
});


test('feed_retry_preserves_content_and_keyboard_navigation', async () => {
  const entries = posts.map((post, index) => ({ ...post, id: `p${index}`, tags: [], publishedAt: '2026-10-01', html: `<p>본문 ${index}</p>` }));
  const dom = new JSDOM(blogFeed(entries, {}, 1), { url: 'https://example.com/blog/' });
  const root = dom.window.document.querySelector('[data-blog-list]');
  let calls = 0;
  initBlogList(root, { Observer: null, fetchPage: async () => {
    if (++calls === 1) throw new Error('offline');
    return response(blogFeed(entries, {}, 2));
  } });
  const link = root.querySelector('[rel=next]');
  link.click(); await tick();
  assert.equal(root.querySelectorAll('.app-blog-post').length, 4);
  assert.match(root.querySelector('[role=status]').textContent, /불러오지 못했습니다/);
  link.click(); await tick();
  assert.equal(root.querySelectorAll('.app-blog-post').length, 6);
  assert.equal(calls, 2);
  assert.equal(dom.window.document.activeElement.textContent, '글 4');
  dom.window.close();
});

test('appended_page_loads_every_shared_runtime_and_math_stylesheet_once', async () => {
  const entries = posts.map((post, index) => ({ ...post, id: `p${index}`, tags: [], publishedAt: '2026-10-01', html: `<p>본문 ${index}</p>` }));
  const dom = new JSDOM(blogFeed(entries, {}, 1), { url: 'https://example.com/blog/' });
  const root = dom.window.document.querySelector('[data-blog-list]');
  const runtimes = [...Object.keys(RUNTIMES), 'comments.js'];
  const head = [...runtimes, 'publication.js', 'footer-year.js'].map(file => `<script type="module" src="/${file}?v=1"></script>`).join('')
    + `<script type="module" src="https://other.example/flows.js"></script><link rel="stylesheet" href="${MATH_STYLESHEET}?v=2" data-math-stylesheet>`;
  const loaded = [];
  initBlogList(root, { Observer: null, loadModule: async url => { loaded.push(url); }, fetchPage: async () => response(`<html><head>${head}</head><body>${blogFeed(entries, {}, 2)}</body></html>`) });
  root.querySelector('[rel=next]').click();
  await tick();
  assert.ok(runtimes.includes('flows.js') && runtimes.includes('document-navigation.js'));
  assert.deepEqual(loaded, runtimes.map(file => `https://example.com/${file}?v=1`));
  const math = dom.window.document.head.querySelectorAll('link[data-math-stylesheet]');
  assert.equal(math.length, 1);
  assert.equal(math[0].getAttribute('href'), `${MATH_STYLESHEET}?v=2`);
  dom.window.close();
});
