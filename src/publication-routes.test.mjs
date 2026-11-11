import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { publicationLinks } from './publication-routes.mjs';



test('rendered_links_cover_navigation_relative_paths_and_html_entities', () => {
  const links = publicationLinks('<nav><a href="../private/">비공개</a></nav><a href="/wiki/entry/?a=1&amp;b=2#part">글</a><area href="https://outside.test/docs/entry/">', '/docs/public/');
  assert.deepEqual(links, ['/docs/private/', '/wiki/entry/?a=1&b=2#part', 'https://outside.test/docs/entry/']);
  assert.deepEqual(publicationLinks('<a href="//example.test/docs/private/">글</a>', '/', 'https://example.test'), ['/docs/private/']);
  assert.throws(() => publicationLinks('<a href="https://[invalid">bad</a>', '/'), /Invalid URL/);
});
