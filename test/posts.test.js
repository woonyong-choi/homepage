import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectPosts } from '../src/content/posts.js';

const post = (fields = {}) => `---\n${Object.entries({ id: 'first-post', slug: 'first-post', title: '첫 글', description: '요약', visibility: 'public', publishedAt: '2026-01-01', tags: ['C'], ...fields }).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n본문\n`;

test('public posts become routes; drafts and future posts stay out', () => {
  const posts = collectPosts([post(), post({ id: 'draft', slug: 'draft', visibility: 'draft' }), post({ id: 'later', slug: 'later', publishedAt: '2999-01-01' })], { now: new Date('2026-06-01') });
  assert.deepEqual(posts.map(item => item.route), ['/blog/first-post/']);
});

test('invalid public posts stop the build', () => {
  assert.throws(() => collectPosts([post({ title: undefined })]), /missing title/);
  assert.throws(() => collectPosts([post({ slug: 'page' })]), /reserved post slug/);
  assert.throws(() => collectPosts([post(), post({ id: 'other' })]), /duplicate post slug/);
});
