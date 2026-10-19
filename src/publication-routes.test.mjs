import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { publicationLinks, documentRoute } from './publication-routes.mjs';



test('rendered_links_cover_navigation_relative_paths_and_html_entities', () => {
  const links = publicationLinks('<nav><a href="../private/">비공개</a></nav><a href="/wiki/entry/?a=1&amp;b=2#part">글</a><area href="https://outside.test/docs/entry/">', '/docs/public/');
  assert.deepEqual(links, ['/docs/private/', '/wiki/entry/?a=1&b=2#part', 'https://outside.test/docs/entry/']);
  assert.deepEqual(documentRoute(links[0]), { kind: 'docs', slug: 'private', fragment: '' });
  assert.deepEqual(documentRoute('../entry/#part', '/blog/current/'), { kind: 'blog', slug: 'entry', fragment: 'part' });
  assert.equal(documentRoute('/docs/private-slug').slug, 'private-slug');
  assert.deepEqual(publicationLinks('<a href="//example.test/docs/private/">글</a>', '/', 'https://example.test'), ['/docs/private/']);
  assert.throws(() => publicationLinks('<a href="https://[invalid">bad</a>', '/'), /Invalid URL/);
  for (const kind of ['docs', 'blog', 'wiki', 'articles']) assert.equal(documentRoute(`/${kind}/entry/`).slug, 'entry');
  for (const value of ['/docs/', '/docs/topics/', '/docs/topics/os/', '/blog/all/', '/docs/a%2Fb/', '/docs/%ZZ/', 'https://[invalid', links[2]]) assert.equal(documentRoute(value), null);
});

test('legacy_article_routes_keep_valid_blog_slugs_and_wiki_returns_candidates', () => {
  for (const slug of ['topics', 'all', 'page', 'feed']) assert.equal(documentRoute(`/articles/${slug}/`).slug, slug);
  assert.equal(documentRoute('/wiki/cs/'), null);
  assert.equal(documentRoute('/wiki/software-design/').slug, 'software-design');
});
