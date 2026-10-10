import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDocument, publicDocuments, blogDocuments, paginate, PAGE_SIZES } from './content-model.mjs';

const TAGS = { javascript: { label: 'JavaScript', aliases: ['JS'] } };
function source(changes = {}) {
  const page = { id: 'a', slug: 'a', title: '글', description: '설명', type: 'blog', tags: ['javascript'], field: 'languages', category: 'javascript', contentIcon: { name: 'document' }, comments: true, visibility: 'public', publishedAt: '2026-01-01', ...changes };
  return `---\n${JSON.stringify(page)}\n---\n## 본문\n내용`;
}

test('publication_contract_excludes_drafts_and_future_posts', () => {
  const now = new Date('2026-10-08');
  const documents = [{}, { id: 'b', slug: 'b', visibility: 'draft' }, { id: 'c', slug: 'c', publishedAt: '2027-01-01' }].map(change => readDocument(source(change), TAGS, now));
  assert.deepEqual(publicDocuments(documents).map(page => page.id), ['a']);
  assert.throws(() => publicDocuments([documents[0], documents[0]]), /duplicate/);
  const example = readDocument(source({ example: true }), TAGS, now);
  assert.deepEqual(publicDocuments([example]), []);
  assert.deepEqual(publicDocuments([example], { includeExamples: true }).map(page => page.id), ['a']);
});

test('document_type_controls_the_public_route_without_changing_the_comment_identity', () => {
  const blog = readDocument(source(), TAGS);
  const wiki = readDocument(source({ type: 'wiki' }), TAGS);
  assert.deepEqual([blog.route, wiki.route], ['/blog/a/', '/docs/a/']);
  assert.equal(blog.id, wiki.id);
  for (const slug of ['all', 'page', 'feed']) assert.throws(() => readDocument(source({ slug }), TAGS), /reserved document slug/);
  assert.throws(() => readDocument(source({ type: 'wiki', slug: 'topics' }), TAGS), /reserved document slug/);
});

test('publication_contract_rejects_missing_comments_invalid_dates_and_tags', () => {
  for (const invalid of [{ comments: false }, { publishedAt: '2026-02-30' }, { tags: ['unknown'] }, { updatedAt: '2025-01-01' }, { thumbnail: { src: '/media/../secret.svg', alt: '' } }]) {
    assert.throws(() => readDocument(source(invalid), TAGS));
  }
});

test('publication_contract_accepts_only_optional_slug_parents', () => {
  for (const parent of [undefined, null, 'public-parent']) {
    assert.equal(readDocument(source({ parent }), TAGS).parent, parent);
  }
  for (const parent of ['', 12, {}, [], '../private', 'invalid parent']) {
    assert.throws(() => readDocument(source({ parent }), TAGS), /invalid parent: a/);
  }
});

// #65: 자르기 좌표는 콘텐츠 데이터이며 임의 CSS 문자열을 허용하지 않는다.
test('publication_contract_accepts_only_finite_thumbnail_coordinates', () => {
  const thumbnail = { src: '/media/cover.webp', alt: '검색 화면' };
  for (const position of [undefined, { x: 0, y: 100 }, { x: 50, y: 50 }, { x: 37.5, y: 60.49 }]) {
    assert.deepEqual(readDocument(source({ thumbnail: { ...thumbnail, position } }), TAGS).thumbnail.position, position);
  }
  for (const position of [null, {}, [], 'top', { x: 50 }, { x: -1, y: 50 }, { x: 50, y: 101 }, { x: '50', y: 50 }, { x: 50, y: Infinity }, { x: '0; color:red', y: 50 }]) {
    assert.throws(() => readDocument(source({ thumbnail: { ...thumbnail, position } }), TAGS), /invalid thumbnail position/);
  }
});

test('blog_pagination_keeps_all_posts_at_approved_boundaries', () => {
  assert.deepEqual(PAGE_SIZES, { preview: 4, cards: 12, feed: 4, search: 12 });
  for (const count of [0, 1, 3, 4, 5, 8, 9, 12, 13]) {
    const items = Array.from({ length: count }, (_, id) => id);
    for (const size of [4, 12]) {
      const result = Array.from({ length: Math.max(1, Math.ceil(count / size)) }, (_, i) => paginate(items, i + 1, size).items).flat();
      assert.deepEqual(result, items);
    }
  }
});

test('blog_order_uses_publication_date_instead_of_update_date', () => {
  const documents = [{ id: 'b', publishedAt: '2026-01-01', updatedAt: '2026-10-01' }, { id: 'a', publishedAt: '2026-01-01' }, { id: 'c', publishedAt: '2026-02-01' }].map(page => ({ type: 'blog', ...page }));
  assert.deepEqual(blogDocuments(documents).map(page => page.id), ['c', 'a', 'b']);
});

// 더미 이미지처럼 확장자가 없는 HTTPS 이미지도 쓸 수 있다.
test('thumbnail_accepts_https_without_credentials_and_rejects_unsafe_urls', () => {
  for (const src of ['https://picsum.photos/seed/demo/960/540', 'https://images.example.com/cover?w=960&h=540']) {
    assert.equal(readDocument(source({ thumbnail: { src, alt: '' } }), TAGS).thumbnail.src, src);
  }
  for (const src of ['javascript:alert(1)', 'data:image/png;base64,a', '//example.com/a', 'http://example.com/a', 'https://user:secret@example.com/a', 'https://', 123]) {
    assert.throws(() => readDocument(source({ thumbnail: { src, alt: '' } }), TAGS), /invalid thumbnail path/);
  }
});

// #141: 내부 분류와 공유 태그의 어휘가 서로 독립적이며 태그가 없는 글도 읽는다.
test('category_is_independent_from_optional_shared_tags', () => {
  const now = new Date('2026-10-10');
  const categories = { os: { label: 'OS' } };
  const wiki = readDocument(source({ type: 'wiki', category: 'os', tags: [] }), TAGS, now, categories);
  assert.deepEqual(wiki.tags, []);
  assert.equal(wiki.category, 'os');
  const tagged = readDocument(source({ category: 'os' }), TAGS, now, categories);
  assert.deepEqual(tagged.tags, ['javascript']);
  assert.throws(() => readDocument(source({ category: 'missing' }), TAGS, now, categories), /invalid category/);
});
