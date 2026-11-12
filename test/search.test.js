import assert from 'node:assert/strict';
import { test } from 'node:test';

import { prepareIndex, readSearchState, searchDocuments, searchUrl, suggestions } from '../src/lib/search.js';

const entries = prepareIndex([
  { id: 'a', title: 'B+트리 저장소', description: '디스크 페이지', text: '노드 분할과 병합', keywords: ['index'], tags: ['C', 'storage'], date: '2026-01-02' },
  { id: 'b', title: 'SQL 해석기', description: '문장을 실행 계획으로', text: 'SELECT 처리', keywords: [], tags: ['SQL'], date: '2026-01-03' },
]);
const tags = { C: { label: 'C' }, SQL: { label: 'SQL' }, storage: { label: 'storage' } };

test('query and tag filters narrow the results, newest first', () => {
  assert.deepEqual(searchDocuments(entries, { query: '', tags: [], page: 1 }).entries.map(entry => entry.id), ['b', 'a']);
  assert.deepEqual(searchDocuments(entries, { query: '분할', tags: [], page: 1 }).entries.map(entry => entry.id), ['a']);
  assert.deepEqual(searchDocuments(entries, { query: '', tags: ['SQL'], page: 1 }).entries.map(entry => entry.id), ['b']);
  assert.equal(searchDocuments(entries, { query: '없는말', tags: [], page: 1 }).total, 0);
});

test('search state round-trips through the URL', () => {
  const url = searchUrl({ query: 'b 트리', tags: ['C', 'C'], page: 2 });
  assert.equal(url, '/search/?q=b+%ED%8A%B8%EB%A6%AC&tag=C&page=2');
  assert.deepEqual(readSearchState(url.split('?')[1]), { query: 'b 트리', tags: ['C'], page: 2 });
});

test('suggestions offer matching posts and tags', () => {
  const result = suggestions(entries, tags, { query: 'sql', tags: [], page: 1 });
  assert.deepEqual(result.entries.map(entry => entry.id), ['b']);
  assert.deepEqual(result.tags.map(([id]) => id), ['SQL']);
});

test('related queries skip case variants and words already shown as tags', () => {
  const index = prepareIndex([{ id: 'c', title: 'sql 문법', description: '', text: '', keywords: ['SQL', 'Sql 튜닝'], tags: ['SQL'], date: '2026-01-04' }]);
  const result = suggestions(index, tags, { query: 'sql', tags: [], page: 1 });
  assert.deepEqual(result.tags.map(([id]) => id), ['SQL']);
  assert.deepEqual(result.queries, ['sql 문법', 'Sql 튜닝']);
});
