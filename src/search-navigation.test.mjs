// 검색 조건 해제 동작은 docs/design/publication.md의 검색 계약을 따른다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { JSDOM } from 'jsdom';

import { tagPage } from './publication-layout.mjs';
import { readSearchState, searchUrl } from './search-model.mjs';
import { renderResults } from './search-view.mjs';

test('search_filter_links_keep_remaining_conditions_or_return_to_entry', () => {
  const cases = [
    { query: '', tags: ['python'], expected: ['/docs/'] },
    { query: 'copy', tags: ['python'], expected: ['/search/?q=copy'] },
    { query: '', tags: ['python', 'os'], expected: ['/search/?tag=os', '/search/?tag=python'] },
    { query: 'copy', tags: ['python', 'os'], expected: ['/search/?q=copy&tag=os', '/search/?q=copy&tag=python'] },
  ];
  for (const item of cases) {
    const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div>');
    globalThis.document = dom.window.document;
    try {
      renderResults(document.body, { entries: [], totalPages: 1, page: 1 }, { ...item, page: 3, type: 'all' }, { python: { label: 'Python' }, os: { label: 'OS' } });
      const links = [...document.querySelectorAll('[data-filter-summary] a')];
      assert.deepEqual(links.map(link => link.getAttribute('href')), [...item.expected, '/docs/']);
    } finally {
      delete globalThis.document;
      dom.window.close();
    }
  }
});

test('result_tags_add_to_the_current_search_without_duplicates', () => {
  const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div>');
  globalThis.document = dom.window.document;
  try {
    const selected = { query: '주문', tags: ['concurrency'], page: 3, type: 'all' };
    const entry = { route: '/blog/orders/', title: '주문 처리', description: '동시 요청 처리', iconUrl: '/theme/assets/icons/documents/search.svg', tags: ['concurrency', 'testing'] };
    renderResults(document.body, { entries: [entry], totalPages: 1, page: 1 }, selected, { concurrency: { label: '동시성' }, testing: { label: '테스트' } });
    const links = [...document.querySelectorAll('.app-search-result-tags a')];
    const filters = links.map(link => readSearchState(new URL(link.getAttribute('href'), 'https://example.com').search));
    assert.deepEqual(filters, [
      { ...selected, page: 1 },
      { ...selected, tags: ['concurrency', 'testing'], page: 1 },
    ]);
    assert.equal(document.querySelector('.app-search-result-link').getAttribute('href'), '/blog/orders/');
  } finally {
    delete globalThis.document;
    dom.window.close();
  }
});

// #179: 공통 접기 안에서 읽거나 조작 중인 정적 태그 목록은 검색 결과가 도착해도 유지한다.
test('tag_fallback_stays_visible_when_open_or_focused', () => {
  const tags = { python: { label: 'Python' } };
  for (const state of ['closed', 'open', 'focused']) {
    const dom = new JSDOM(tagPage('python', [], tags));
    globalThis.document = dom.window.document;
    try {
      const fallback = document.querySelector('[data-search-fallback]');
      const details = fallback.querySelector('details');
      details.open = state === 'open';
      if (state === 'focused') details.querySelector('summary').focus();

      renderResults(document.querySelector('[data-search-page]'), { entries: [], totalPages: 1, page: 1 }, { query: '', tags: ['python'], page: 1, type: 'all' }, tags);

      assert.equal(fallback.hidden, state === 'closed', state);
      assert.equal(details.open, state === 'open', state);
    } finally {
      delete globalThis.document;
      dom.window.close();
    }
  }
});

test('tag_fallback_reappears_when_search_request_fails', async () => {
  const browser = searchBrowser('/tags/python/', true, 'python', {
    html: tagPage('python', [], { python: { label: 'Python' } }),
    queryIndex: () => Promise.reject(new Error('search unavailable')),
  });
  try {
    const fallback = browser.dom.window.document.querySelector('[data-search-fallback]');
    fallback.hidden = true;

    await new Promise(resolve => setImmediate(resolve));

    assert.equal(fallback.hidden, false);
    assert.equal(fallback.querySelector('details').open, false);
    assert.match(browser.dom.window.document.querySelector('[data-search-status]').textContent, /검색 자료를 불러오지 못했습니다/);
  } finally { browser.dom.window.close(); }
});

test('typing_with_tags_keeps_the_intersection_and_resets_pagination', () => {
  for (const [route, tag] of [['/search/?tag=concurrency&tag=testing&page=2', ''], ['/tags/concurrency/?tag=testing', 'concurrency']]) {
    const browser = searchBrowser(route, true, tag);
    try {
      browser.requests.length = 0;
      browser.input.value = '주문';
      browser.input.dispatchEvent(new browser.dom.window.Event('input', { bubbles: true }));
      assert.equal(browser.requests.length, 1);
      assert.equal(browser.requests[0].state.query, '주문');
      assert.deepEqual([...browser.requests[0].state.tags].sort(), ['concurrency', 'testing']);
      assert.equal(browser.requests[0].state.page, 1);
    } finally { browser.dom.window.close(); }
  }
});

test('empty_search_entry_replaces_location_without_querying_index', () => {
  for (const query of ['', '?page=2', '?q=%20%20&page=2', '?type=wiki&page=2']) {
    const browser = searchBrowser(`/search/${query}`);
    try {
      assert.deepEqual(browser.visits, [{ method: 'replace', href: '/docs/' }]);
      assert.equal(browser.requests.length, 0);
    } finally { browser.dom.window.close(); }
  }
});

test('clear_query_respects_entry_and_remaining_tag', () => {
  const cases = [
    { route: '/docs/', page: false, query: 'copy', expectedVisits: [], expectedTags: undefined },
    { route: '/search/?q=copy&page=2', page: true, query: 'copy', expectedVisits: [{ method: 'assign', href: '/docs/' }], expectedTags: undefined },
    { route: '/search/?q=copy&tag=python&page=2', page: true, query: 'copy', expectedVisits: [], expectedTags: ['python'] },
    { route: '/search/?q=copy&tag=python&tag=os&page=2', page: true, query: 'copy', expectedVisits: [], expectedTags: ['python', 'os'] },
  ];
  for (const item of cases) {
    const browser = searchBrowser(item.route, item.page);
    try {
      browser.input.value = item.query;
      browser.requests.length = 0;
      browser.clear.click();
      assert.equal(browser.input.value, '');
      assert.deepEqual(browser.visits, item.expectedVisits);
      if (item.expectedTags) {
        assert.equal(browser.requests.length, 1);
        assert.equal(browser.requests[0].state.query, '');
        assert.deepEqual(browser.requests[0].state.tags, item.expectedTags);
        assert.equal(browser.requests[0].state.page, 1);
      } else assert.equal(browser.requests.length, 0);
    } finally { browser.dom.window.close(); }
  }
});

function searchBrowser(route, page = true, tag = '', options = {}) {
  const dom = new JSDOM(options.html ?? `<section data-public-search><form><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section>${page ? `<div data-search-page data-tag="${tag}"></div>` : ''}`);
  const visits = [];
  const requests = [];
  const url = new URL(route, 'https://example.com');
  const location = {
    href: url.href, origin: url.origin, search: url.search,
    assign: href => visits.push({ method: 'assign', href }),
    replace: href => visits.push({ method: 'replace', href }),
  };
  const history = { state: null, replaceState(state, _title, value) {
    this.state = state;
    if (!value) return;
    const next = new URL(value, location.href);
    location.href = next.href; location.search = next.search;
  } };
  const source = readFileSync(new URL('./publication.js', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
  runInNewContext(source, {
    document: dom.window.document, window: dom.window, location, history, URL,
    readSearchState, searchUrl,
    queryIndex(action, state) { requests.push({ action, state }); return options.queryIndex ? options.queryIndex(action, state) : new Promise(() => {}); },
    showResultsLoading() {}, renderResults() {}, renderSuggestions() {}, showSearchError() {},
  });
  return { dom, visits, requests, input: dom.window.document.querySelector('input'), clear: dom.window.document.querySelector('button') };
}
