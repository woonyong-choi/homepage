// 검색 조건 해제 동작은 docs/design/publication.md의 검색 계약을 따른다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

import { JSDOM } from 'jsdom';


import { readSearchState, searchUrl } from './search-model.mjs';
import { renderResults, renderSuggestions, showSearchError } from './search-view.mjs';

test('search_filter_links_keep_remaining_conditions_or_return_to_entry', () => {
  const cases = [
    { query: '', tags: ['python'], expected: ['/search/'] },
    { query: 'copy', tags: ['python'], expected: ['/search/?tag=python', '/search/?q=copy'] },
    { query: '', tags: ['python', 'os'], expected: ['/search/?tag=os', '/search/?tag=python'] },
    { query: 'copy', tags: ['python', 'os'], expected: ['/search/?tag=python&tag=os', '/search/?q=copy&tag=os', '/search/?q=copy&tag=python'] },
  ];
  for (const item of cases) {
    const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div>');
    globalThis.document = dom.window.document;
    try {
      renderResults(document.body, { entries: [], totalPages: 1, page: 1 }, { ...item, page: 3 }, { python: { label: 'Python' }, os: { label: 'OS' } });
      const links = [...document.querySelectorAll('[data-filter-summary] a')];
      assert.deepEqual(links.map(link => link.getAttribute('href')), [...item.expected, '/search/']);
    } finally {
      delete globalThis.document;
      dom.window.close();
    }
  }
});

test('result_tags_add_to_the_current_search_without_duplicates', () => {
  const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div>');
  dom.window.document.body.dataset.card = JSON.stringify({ title: true, description: true, media: 'image', tags: true, date: true, comments: true });
  globalThis.document = dom.window.document;
  try {
    const selected = { query: '주문', tags: ['concurrency'], page: 3 };
    const entry = { route: '/blog/orders/', title: '주문 처리', description: '동시 요청 처리', iconUrl: '/theme/assets/icons/documents/search.svg', tags: ['concurrency', 'testing'] };
    renderResults(document.body, { entries: [entry], totalPages: 1, page: 1 }, selected, { concurrency: { label: '동시성' }, testing: { label: '테스트' } });
    const links = [...document.querySelectorAll('.app-blog-card-tags a')];
    const filters = links.map(link => readSearchState(new URL(link.getAttribute('href'), 'https://example.com').search));
    assert.deepEqual(filters, [
      { ...selected, page: 1 },
      { ...selected, tags: ['concurrency', 'testing'], page: 1 },
    ]);
    assert.equal(document.querySelector('.app-blog-card-link').getAttribute('href'), '/blog/orders/');
  } finally {
    delete globalThis.document;
    dom.window.close();
  }
});

// #179: 공통 접기 안에서 읽거나 조작 중인 정적 태그 목록은 검색 결과가 도착해도 유지한다.


test('history_navigation_restores_query_after_browser_form_state', () => {
  for (const [persisted, query] of [[false, 'Python'], [true, 'Python'], [true, '']]) {
    const browser = searchBrowser(`/search/?q=${query}&tag=python`);
    try {
      browser.dom.window.dispatchEvent(new browser.dom.window.PageTransitionEvent('pageshow', { persisted }));
      browser.input.form.reset();
      assert.equal(browser.input.value, query, `pageshow persisted=${persisted}, query=${query}`);
      assert.equal(browser.clear.hidden, !query);
    } finally { browser.dom.window.close(); }
  }
});

test('typing_with_tags_keeps_the_intersection_and_resets_pagination', () => {
  for (const [route, tag] of [['/search/?tag=concurrency&tag=testing&page=2', '']]) {
    const browser = searchBrowser(route, true, tag);
    try {
      browser.requests.length = 0;
      browser.input.value = '주문';
      browser.input.dispatchEvent(new browser.dom.window.Event('input', { bubbles: true }));
      assert.equal(browser.requests.length, 1);
      assert.equal(browser.requests[0].state.query, '주문');
      assert.deepEqual([...browser.requests[0].state.tags].sort(), ['concurrency', 'testing']);
      assert.equal(browser.requests[0].state.page, 1);
      browser.input.form.reset();
      assert.equal(browser.input.value, '주문');
    } finally { browser.dom.window.close(); }
  }
});


test('clear_query_respects_entry_and_remaining_tag', () => {
  const cases = [
    { route: '/search/', page: false, query: 'copy', expectedVisits: [], expectedTags: undefined },
    { route: '/search/?q=copy&page=2', page: true, query: 'copy', expectedVisits: [], expectedTags: [] },
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
    href: url.href, origin: url.origin, search: url.search, pathname: url.pathname,
    assign: href => visits.push({ method: 'assign', href }),
    replace: href => visits.push({ method: 'replace', href }),
  };
  const history = { state: null, pushState(state, _title, value) { this.replaceState(state, _title, value); }, replaceState(state, _title, value) {
    this.state = state;
    if (!value) return;
    const next = new URL(value, location.href);
    location.href = next.href; location.search = next.search;
  } };
  const source = readFileSync(new URL('./publication.js', import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
  runInNewContext(source, {
    document: dom.window.document, window: dom.window, location, history, URL,
    requestAnimationFrame() {},
    readSearchState, searchUrl,
    queryIndex(action, state) { requests.push({ action, state }); return options.queryIndex ? options.queryIndex(action, state) : new Promise(() => {}); },
    showResultsLoading() {}, renderResults() {}, renderSuggestions() {}, showSearchError() {},
  });
  return { dom, visits, requests, history, input: dom.window.document.querySelector('input'), clear: dom.window.document.querySelector('button') };
}

// #275: 아이콘이 없는 문서도 결과·제안에 표시하고 오류의 재시도 조작을 유지한다.
test('search_view_optional_icon_and_retry_keep_content_and_actions', () => {
  const dom = new JSDOM('<div data-filter-summary></div><div data-full-results></div><div id="suggestions" role="listbox"></div>');
  globalThis.document = dom.window.document;
  try {
    const entry = { route: '/blog/plain.md', title: '일반 문서', description: '본문 설명', tags: [] };
    const state = { query: '문서', tags: [], page: 1 };
    renderResults(document.body, { entries: [entry], totalPages: 1, page: 1 }, state, {});
    assert.equal(document.querySelector('[data-full-results] img'), null);
    assert.match(document.querySelector('[data-full-results]').textContent, /일반 문서/);
    const output = document.querySelector('#suggestions');
    renderSuggestions(output, { queries: [], tags: [], entries: [entry], count: 1 }, state);
    assert.equal(output.querySelector('img'), null);
    assert.equal(output.querySelector('.app-search-result-link').getAttribute('href'), '/blog/plain.md');
    let retries = 0;
    showSearchError(output, () => { retries++; });
    assert.equal(output.querySelector('p').innerHTML, '검색 자료를 불러오지 못했습니다.<br>연결을 확인해 주세요.');
    const button = output.querySelector('button');
    assert.equal(button.getAttribute('role'), 'option');
    button.click();
    assert.equal(retries, 1);
  } finally { delete globalThis.document; dom.window.close(); }
});

// #275: 입구에서 Enter를 누르면 자동완성 개수와 무관하게 전체 결과를 연다.
test('search_submit_opens_full_results_and_preserves_composition', () => {
  for (const composing of [false, true]) {
    const browser = searchBrowser('/search/', false);
    try {
      browser.input.value = 'Promise';
      if (composing) browser.input.dispatchEvent(new browser.dom.window.CompositionEvent('compositionstart'));
      browser.input.form.dispatchEvent(new browser.dom.window.Event('submit', { cancelable: true }));
      assert.deepEqual(browser.visits, composing ? [] : [{ method: 'assign', href: '/search/?q=Promise' }]);
    } finally { browser.dom.window.close(); }
  }
});

// #275: 호스트가 전체 로컬 검색을 /blog/에 연결해도 빈 검색 재로드를 반복하지 않는다.
test('docs_results_page_empty_query_lists_entries_without_reloading', () => {
  const browser = searchBrowser('/search/', true);
  try {
    assert.deepEqual(browser.visits, []);
    assert.equal(browser.requests.length, 1);
    assert.equal(browser.requests[0].state.query, '');
    browser.input.value = 'Promise';
    browser.clear.click();
    assert.deepEqual(browser.visits, []);
    assert.equal(browser.requests.length, 2);
    assert.equal(browser.requests[1].state.query, '');
  } finally { browser.dom.window.close(); }
});

// #275: 로컬 전체목록의 빈 조건 쪽 이동만 /blog/의 page 값을 보존한다.

test('private_search_keeps_host_routes_and_returns_to_docs_for_empty_conditions', () => {
  for (const item of [
    { route: '/search/?q=copy&tag=독서&page=2', query: '책', expected: '/search/?q=%EC%B1%85&tag=%EB%8F%85%EC%84%9C', baseRoute: '/search/' },
    { route: '/docs/?q=copy&tag=독서&page=2', query: '책', expected: '/docs/?q=%EC%B1%85&tag=%EB%8F%85%EC%84%9C', baseRoute: '/docs/' },
  ]) {
    const browser = searchBrowser(item.route, true, '', { html: '<section data-public-search><form action="/search/"><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section><div data-search-page data-search-home="/docs/"></div>' });
    try {
      browser.input.value = item.query;
      browser.input.dispatchEvent(new browser.dom.window.Event('input', { bubbles: true }));
      assert.equal(browser.requests.at(-1).state.baseRoute, item.baseRoute);
      assert.equal(searchUrl(browser.requests.at(-1).state), item.expected);
    } finally { browser.dom.window.close(); }
  }
  const browser = searchBrowser('/search/?q=copy', true, '', { html: '<section data-public-search><form action="/search/"><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section><div data-search-page data-search-home="/docs/"></div>' });
  try {
    browser.clear.click();
    assert.deepEqual(browser.visits, [{ method: 'assign', href: '/docs/' }]);
  } finally { browser.dom.window.close(); }
  assert.equal(searchUrl({ query: '', tags: [], page: 3, baseRoute: '/docs/' }), '/docs/?page=3');
  assert.equal(searchUrl({ query: '', tags: [], page: 3, baseRoute: '/search/', homeRoute: '/docs/' }), '/docs/');
});

test('all_rows_reaches_the_search_model_without_falling_back_to_twelve', () => {
  const browser = searchBrowser('/search/', true, '', { html: '<section data-public-search><form><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section><div data-search-page data-page-size="all"></div>' });
  try { assert.equal(browser.requests[0].state.pageSize, 'all'); }
  finally { browser.dom.window.close(); }
});

test('search_cards_preserve_every_display_setting_on_rerender', () => {
  const dom = new JSDOM('<div data-search-page><div data-filter-summary></div><div data-full-results></div></div>');
  globalThis.document = dom.window.document;
  try {
    const root = document.querySelector('[data-search-page]');
    const entry = { route: '/blog/book/', title: '책', description: '독서 설명', tags: ['독서'], date: '2026-10-01', comments: true, commentCount: 3, thumbnail: { src: '/media/cover.png', alt: '책 표지' } };
    for (const enabled of [false, true]) {
      root.dataset.card = JSON.stringify({ title: enabled, description: enabled, media: enabled ? 'image' : 'none', tags: enabled, date: enabled, comments: enabled });
      renderResults(root, { entries: [entry], totalPages: 1, page: 1 }, { query: '', tags: [], page: 1 }, { 독서: { label: '독서' } });
      const card = root.querySelector('.app-blog-card');
      assert.equal(card.querySelector('.app-blog-card-title').classList.contains('app-sr'), !enabled);
      for (const selector of ['img', '.app-card-summary', '.app-blog-card-tags', 'time', '.app-blog-card-comments']) assert.equal(Boolean(card.querySelector(selector)), enabled, selector);
      assert.equal(card.querySelector('a').getAttribute('aria-label'), '책');
    }
  } finally { delete globalThis.document; dom.window.close(); }
});


test('public_tag_filters_keep_only_matching_candidates_and_selected_tags_without_summary', () => {
  const dom = new JSDOM('<main><section data-public-search><input></section><div data-tag-filter></div><div data-full-results></div></main>');
  globalThis.document = dom.window.document;
  const root = document.querySelector('main');
  const tags = { 設計: { label: '설계' }, python: { label: 'Python' }, reading: { label: '독서' }, walking: { label: '산책' } };
  const state = { query: '', tags: ['設計'], page: 1 };
  const draw = (tagIds, selected = state.tags) => renderResults(root, { entries: [], tagIds, totalPages: 1, page: 1 }, { ...state, tags: selected }, tags);
  try {
    draw(['設計', 'python', 'reading']);
    assert.deepEqual([...root.querySelectorAll('[data-tag-toggle]')].map(e => e.dataset.tagToggle), ['設計', 'python', 'reading']);
    assert.equal(root.querySelector('[data-tag-filter]').lastElementChild.textContent, '초기화');
    assert.equal(root.querySelector('[data-tag-reset]').tagName, 'A');
    assert.equal(root.querySelector('[data-tag-reset]').getAttribute('href'), '/search/');
    const selected = root.querySelector('[aria-pressed="true"]');
    assert.equal(selected.textContent, '설계');
    selected.focus();
    draw([], ['設計', 'missing']);
    assert.deepEqual([...root.querySelectorAll('[data-tag-toggle]')].map(e => e.dataset.tagToggle), ['設計', 'missing']);
    assert.equal(document.activeElement.dataset.tagToggle, '設計');
    root.querySelector('input').focus();
    draw(['python'], []);
    assert.equal(root.querySelector('[data-tag-reset]'), null);
    assert.equal(document.activeElement.tagName, 'INPUT');
    root.querySelector('[data-tag-toggle]').focus();
    draw([], []);
    assert.equal(document.activeElement.tagName, 'INPUT');
    assert.equal(root.querySelector('[data-filter-summary]'), null);
  } finally { delete globalThis.document; dom.window.close(); }
});

test('tag_toggle_preserves_query_resets_page_and_popstate_restores_previous_selection', () => {
  const browser = searchBrowser('/search/?q=주문&tag=설계&page=2', true, '', { html: '<main data-search-page><section data-public-search><form><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section><button type="button" data-tag-toggle="python" aria-pressed="false">Python</button><button type="button" data-tag-toggle="설계" aria-pressed="true">설계</button></main>' });
  try {
    browser.dom.window.document.querySelector('[data-tag-toggle="python"]').click();
    const next = browser.requests.at(-1).state;
    assert.equal(next.query, '주문');
    assert.deepEqual([...next.tags], ['설계', 'python']);
    assert.equal(next.page, 1);
    browser.dom.window.document.querySelector('[data-tag-toggle="설계"]').click();
    assert.deepEqual([...browser.requests.at(-1).state.tags], ['python']);
    browser.history.replaceState(null, '', '/search/?q=주문&tag=설계&page=2');
    browser.dom.window.dispatchEvent(new browser.dom.window.PopStateEvent('popstate'));
    assert.deepEqual([...browser.requests.at(-1).state.tags], ['설계']);
    assert.equal(browser.requests.at(-1).state.page, 2);
    assert.equal(browser.requests.at(-1).state.query, '주문');
  } finally { browser.dom.window.close(); }
});


test('tag_reset_clears_query_selection_and_page_together', () => {
  const browser = searchBrowser('/search/?q=주문&tag=설계&tag=python&page=2', true, '', { html: '<main data-search-page><section data-public-search><form><input><button type="button" data-clear-query></button></form><div role="listbox" hidden></div><p data-search-status></p></section><a href="/search/" data-tag-reset>초기화</a></main>' });
  try {
    browser.dom.window.document.querySelector('[data-tag-reset]').click();
    const next = browser.requests.at(-1).state;
    assert.equal(next.query, '');
    assert.deepEqual([...next.tags], []);
    assert.equal(next.page, 1);
    assert.equal(browser.input.value, '');
    assert.equal(searchUrl(next), '/search/');
  } finally { browser.dom.window.close(); }
});
