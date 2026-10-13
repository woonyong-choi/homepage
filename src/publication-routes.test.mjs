import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { legacyRoutes, redirectPage, publicationLinks, documentRoute } from './publication-routes.mjs';

test('legacy_routes_keep_one_target_and_noindex_the_old_document', () => {
  const routes = legacyRoutes([{ slug: 'one', route: '/docs/one/' }, { slug: 'two', route: '/blog/two/' }], ['cs', 'tech']);
  assert.equal(routes.get('/wiki/'), '/docs/');
  assert.equal(routes.get('/wiki/tech/'), '/docs/topics/tech/');
  assert.equal(routes.get('/articles/one/'), '/docs/one/');
  assert.equal(routes.get('/articles/two/'), '/blog/two/');
  const html = redirectPage('/docs/one/', 'https://example.com');
  assert.match(html, /rel="canonical" href="https:\/\/example.com\/docs\/one\/"/);
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /<noscript><meta http-equiv="refresh"/);
});

test('redirect_preserves_query_and_hash_without_allowing_an_external_destination', () => {
  const script = readFileSync(new URL('./redirect.js', import.meta.url), 'utf8');
  const visited = [];
  for (const target of ['/docs/one/', '/blog/two/', 'https://other.example/']) {
    runInNewContext(script, { URL, document: { querySelector: () => ({ dataset: { redirect: target } }) },
      location: { origin: 'https://example.com', search: '?q=python', hash: '#comments', replace: value => visited.push(value) } });
  }
  assert.deepEqual(visited, ['https://example.com/docs/one/?q=python#comments', 'https://example.com/blog/two/?q=python#comments']);
});

test('rendered_links_cover_navigation_relative_paths_and_html_entities', () => {
  const links = publicationLinks('<nav><a href="../private/">비공개</a></nav><a href="/wiki/entry/?a=1&amp;b=2#part">글</a><area href="https://outside.test/docs/entry/">', '/docs/public/');
  assert.deepEqual(links, ['/docs/private/', '/wiki/entry/?a=1&b=2#part', 'https://outside.test/docs/entry/']);
  assert.deepEqual(documentRoute(links[0]), { kind: 'docs', slug: 'private', fragment: '' });
  assert.deepEqual(documentRoute('../entry/#part', '/blog/current/'), { kind: 'blog', slug: 'entry', fragment: 'part' });
  assert.equal(documentRoute('/docs/private-slug').slug, 'private-slug');
  assert.throws(() => publicationLinks('<a href="https://[invalid">bad</a>', '/'), /Invalid URL/);
  for (const kind of ['docs', 'blog', 'wiki', 'articles']) assert.equal(documentRoute(`/${kind}/entry/`).slug, 'entry');
  for (const value of ['/docs/', '/docs/topics/', '/docs/topics/os/', '/blog/all/', '/docs/a%2Fb/', '/docs/%ZZ/', 'https://[invalid', links[2]]) assert.equal(documentRoute(value), null);
});
