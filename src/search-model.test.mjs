import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuery, prepareIndex, searchDocuments, readSearchState, searchUrl, suggestions } from './search-model.mjs';

const source = [
  { id: 'a', type: 'wiki', title: 'JavaScript 검색', description: '문서 검색', text: '최신 상태', keywords: ['JS'], tags: ['javascript', 'search'], date: '2026-10-01' },
  { id: 'b', type: 'blog', title: '검색을 설계하기', description: 'JavaScript 사례', text: '오래된 결과', keywords: ['JS'], tags: ['javascript', 'search'], date: '2026-10-02' },
  { id: 'c', type: 'wiki', title: 'Python', description: '복사', text: '메모리', keywords: ['파이썬'], tags: ['python'], date: '2026-10-03' },
];
const index = prepareIndex([...source, source[0]]);
const state = { query: '', tags: [], page: 1 };


test('검색어와 태그는 AND로 결합하고 별칭과 한글 정규화를 적용한다', () => {
  assert.equal(searchDocuments(index, { ...state, query: 'JS 최신', tags: ['javascript', 'search'] }).entries[0].id, 'a');
  assert.equal(searchDocuments(index, { ...state, tags: ['python', 'search'] }).entries.length, 0);
  assert.equal(normalizeQuery('  한글  검색 '.normalize('NFD')), '한글 검색');
  assert.equal(searchDocuments(index, { ...state, query: '파이썬' }).entries[0].id, 'c');
});

test('검색 URL에서 검색어·태그·페이지를 복원한다', () => {
  const selected = { ...state, query: 'JS 검색', tags: ['javascript', 'search'], page: 2 };
  assert.deepEqual(readSearchState(searchUrl(selected).split('?')[1]), selected);
  assert.equal(readSearchState('?page=-2&type=unknown').page, 1);
  assert.deepEqual(readSearchState('?tag=javascript', 'javascript').tags, ['javascript']);
});

test('추천은 존재하는 제목·별칭·태그와 필터에 맞는 글만 제공한다', () => {
  const result = suggestions(index, { javascript: { label: 'JavaScript', aliases: ['JS'] } }, { ...state, query: 'JS' });
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[0].type, 'blog');
  assert.equal(result.tags[0][0], 'javascript');
  assert.deepEqual(suggestions(index, {}, state).entries, []);
});

test('본문에서만 일치하면 실제 일치 부분을 결과 설명으로 보여준다', () => {
  const result = searchDocuments(index, { ...state, query: '메모리' });
  assert.equal(result.entries[0].excerpt, '메모리');
  assert.equal(result.entries[0].description, '복사');
});

test('search_pages_keep_twelve_results_and_clamp_the_last_page_without_losing_entries', () => {
  const entries = prepareIndex(Array.from({ length: 25 }, (_, id) => ({ ...source[0], id: `document-${String(id).padStart(2, '0')}` })));
  const pages = [1, 2, 3].map(page => searchDocuments(entries, { ...state, page }));
  assert.deepEqual(pages.map(result => result.entries.length), [12, 12, 1]);
  assert.deepEqual(pages.flatMap(result => result.entries.map(entry => entry.id)), entries.map(entry => entry.id));
  const last = searchDocuments(entries, { ...state, page: 100 });
  assert.equal(last.page, 3);
  assert.equal(last.totalPages, 3);
  assert.deepEqual(last.entries.map(entry => entry.id), ['document-24']);
});

// 이전 유형 URL도 검색과 태그에서 같은 글 집합을 보여야 한다.

test('unlimited_rows_keeps_more_than_twelve_results_on_one_page', () => {
  const entries = prepareIndex(Array.from({ length: 25 }, (_, id) => ({ ...source[0], id: `document-${id}` })));
  const result = searchDocuments(entries, { ...state, page: 5, pageSize: 'all' });
  assert.equal(result.entries.length, 25);
  assert.equal(result.page, 1);
  assert.equal(result.totalPages, 1);
});
