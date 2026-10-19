import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectPosts, postTags, readPost, relatedPosts, searchEntry } from './blog-model.mjs';
import { readDocument } from './content-model.mjs';
import { searchUrl, prepareIndex, readSearchState, searchDocuments } from './search-model.mjs';

const NOW = new Date('2026-10-19T00:00:00Z');
function source(changes = {}) {
  return `---\n${JSON.stringify({ id: 'plain', slug: 'plain', title: '일상 기록', description: '책과 산책', visibility: 'public', publishedAt: '2026-10-01', ...changes })}\n---\n산책하며 책 이야기를 생각했다.`;
}

test('readPost_accepts_iconless_uncategorized_posts_and_returns_only_the_public_contract', () => {
  const post = readPost(source({ type: 'blog', category: 'old', field: 'cs', parent: 'old', contentIcon: { name: 'old' }, tags: [' 산책 ', '독서'.normalize('NFD'), 'python', '__proto__', 'constructor', 'toString'] }), { now: NOW });
  assert.deepEqual(Object.keys(post).sort(), ['id', 'slug', 'title', 'description', 'tags', 'publishedAt', 'comments', 'example', 'body', 'route'].sort());
  assert.deepEqual(post.tags, ['산책', '독서', 'python', '__proto__', 'constructor', 'toString']);
  assert.equal(post.comments, false);
  assert.equal(post.example, false);
  assert.equal(post.route, '/blog/plain/');
  const tags = postTags([post], { python: { label: 'Python', aliases: ['파이썬'] }, unused: { label: '쓰지 않은 태그' } });
  assert.deepEqual(Object.keys(tags).sort(), post.tags.toSorted());
  assert.equal(tags.__proto__.label, '__proto__');
  assert.equal(tags.constructor.label, 'constructor');
  assert.equal(tags.toString.label, 'toString');
  assert.equal(tags.python.label, 'Python');
  const entry = searchEntry(post, tags);
  assert.equal(entry.keywords.includes('파이썬'), true);
  for (const key of ['type', 'field', 'category', 'contentIcon', 'iconUrl']) assert.equal(Object.hasOwn(entry, key), false);
  assert.deepEqual(readPost(source(), { now: NOW }).tags, []);
});

test('readPost_requires_explicit_publication_and_rejects_invalid_metadata', () => {
  for (const changes of [{ visibility: undefined }, { type: 'wiki' }, { tags: ['독서', '독서'.normalize('NFD')] }, { tags: [' '] }, { comments: 'true' }, { example: 'false' }, { publishedAt: '2026-02-30' }, { thumbnail: { src: 'javascript:alert(1)', alt: '' } }]) assert.throws(() => readPost(source(changes), { now: NOW }));
  for (const changes of [{ visibility: 'draft' }, { publishedAt: '2027-01-01' }, { publish: false }, { status: 'draft' }]) {
    assert.equal(readPost(source(changes), { now: NOW }), null);
    assert.equal(readPost(source(changes), { now: NOW, includeUnpublished: true }).id, 'plain');
  }
  assert.deepEqual(collectPosts([source({ example: true })], { now: NOW }), []);
  assert.equal(collectPosts([source({ example: true })], { now: NOW, includeExamples: true }).length, 1);
  assert.throws(() => collectPosts([source(), source({ visibility: 'draft' })], { now: NOW }), /duplicate post id/);
});

test('readDocument_keeps_the_external_host_blog_adapter_without_requiring_legacy_classification', () => {
  const post = readDocument(source({ type: 'blog' }), {}, NOW, {});
  assert.deepEqual([post.type, post.visibility, post.published, post.route], ['blog', 'public', true, '/blog/plain/']);
  assert.equal(readDocument(source({ type: 'blog', visibility: 'draft' }), {}, NOW, {}).published, false);
});

test('blog_query_preserves_arbitrary_tags_and_sorts_matched_posts_by_publication_date', () => {
  const posts = collectPosts([source({ id: 'older', slug: 'older', title: '산책', tags: ['산책', '독서'] }), source({ id: 'newer', slug: 'newer', publishedAt: '2026-10-02', tags: ['산책', '독서'] })], { now: NOW });
  const tags = postTags(posts);
  const index = prepareIndex(posts.map(post => searchEntry(post, tags)));
  const state = { query: '산책', tags: ['산책', '독서'], page: 1 };
  assert.deepEqual(readSearchState(new URL(searchUrl(state), 'https://example.com').search), state);
  assert.deepEqual(searchDocuments(index, state).entries.map(post => post.id), ['newer', 'older']);
  assert.equal(searchDocuments(index, { ...state, tags: ['산책', '없는 태그'] }).total, 0);
  const unusual = ['C++', 'a&b', '밑줄_태그', '__proto__', 'constructor', 'toString'];
  assert.deepEqual(readSearchState(new URL(searchUrl({ tags: unusual }), 'https://example.com').search).tags, unusual);
  assert.deepEqual(relatedPosts({ id: 'current', tags: [] }, posts), []);
});
