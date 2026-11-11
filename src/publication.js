// 정적 탐색 위에 검색 추천과 필터 결과를 연결한다.
import { readSearchState, searchUrl } from './search-model.mjs';
import { queryIndex } from './search-client.mjs';
import { renderResults, renderSuggestions, showSearchError } from './search-view.mjs';

for (const box of document.querySelectorAll('[data-public-search]')) {
  const form = box.querySelector('form');
  const input = form.querySelector('input');
  const clear = form.querySelector('[data-clear-query]');
  const output = box.querySelector('[role="listbox"]');
  const status = box.querySelector('[data-search-status]');
  const page = document.querySelector('[data-search-page]');
  const state = () => ({ ...readSearchState(location.search, page?.dataset.tag),
    pageSize: page?.dataset.pageSize === 'all' ? 'all' : Number(page?.dataset.pageSize) || undefined });
  let revision = 0; let resultRevision = 0; let composing = false; let active = -1; let resultStatus = '';
  const failureStatus = '검색 자료를 불러오지 못했습니다. 다시 시도해 주세요.';
  function close() { output.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; status.textContent = resultStatus; }
  function open() { output.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function restoreQuery(query) {
    input.defaultValue = query; if (input.value !== query) input.value = query; clear.hidden = !query;
  }
  function restorePosition() {
    const position = history.state?.searchPosition;
    if (page && position) requestAnimationFrame(() => window.scrollTo(position.x, position.y));
  }
  // 검색 페이지에서는 입력한 검색어를 주소에 반영하고 아래 결과 목록을 함께 갱신한다.
  function applyQuery() {
    const url = new URL(location.href); url.search = new URL(searchUrl({ ...state(), query: input.value, page: 1 }), location.origin).search;
    history.replaceState({ ...history.state, searchPosition: null }, '', url);
    results();
  }
  // 이전 추천은 새 추천이 올 때까지 그대로 두어 입력할 때마다 목록이 깜빡이지 않게 한다.
  async function propose() {
    const request = ++revision;
    clear.hidden = !input.value;
    if (page) applyQuery();
    if (!input.value.trim()) { close(); return; }
    try {
      const { result } = await queryIndex('suggest', { ...state(), query: input.value, page: 1 });
      if (request !== revision || composing) return;
      renderSuggestions(output, result, { ...state(), query: input.value });
      open(); active = -1; input.removeAttribute('aria-activedescendant');
      status.textContent = `검색 결과 ${result.count}개`;
    } catch { if (request === revision) { showSearchError(output, propose); open(); status.textContent = failureStatus; } }
  }
  // 결과가 올 때까지 지금 보이는 목록을 그대로 두고 aria-busy만 표시한다. 중간 안내 카드로 바꾸지 않는다.
  async function results() {
    if (!page) return;
    const request = ++resultRevision;
    const selected = state();
    restoreQuery(selected.query);
    page.setAttribute('aria-busy', 'true');
    try {
      const { result, tags } = await queryIndex('results', selected);
      if (request !== resultRevision) return;
      renderResults(page, result, selected, tags);
      resultStatus = `검색 결과 ${result.total}개`;
      if (output.hidden) status.textContent = resultStatus;
      restorePosition();
    } catch {
      if (request !== resultRevision) return;
      showSearchError(page.querySelector('[data-full-results]'), results);
      page.setAttribute('aria-busy', 'false');
      resultStatus = failureStatus; status.textContent = resultStatus;
    }
  }
  input.addEventListener('compositionstart', () => { composing = true; revision++; });
  input.addEventListener('compositionend', () => { composing = false; propose(); });
  input.addEventListener('input', event => { if (!composing && !event.isComposing) propose(); });
  input.addEventListener('focus', () => { if (output.hidden && input.value.trim() && output.childElementCount) open(); });
  clear.addEventListener('click', () => {
    revision++; input.value = ''; clear.hidden = true; close();
    if (page) applyQuery();
    input.focus();
  });
  input.addEventListener('keydown', event => {
    if (composing || event.isComposing) return;
    if (event.key === 'Escape') { if (!output.hidden) event.preventDefault(); revision++; close(); return; }
    const options = [...output.querySelectorAll('[role="option"]')];
    if (!output.hidden && options.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      active = active < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      for (const [index, option] of options.entries()) option.setAttribute('aria-selected', String(index === active));
      input.setAttribute('aria-activedescendant', options[active].id); options[active].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' && !output.hidden && active >= 0) { event.preventDefault(); options[active].click(); }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing) return;
    revision++; close();
    if (page) { applyQuery(); return; }
    location.assign(searchUrl({ ...state(), query: input.value, page: 1 }));
  });
  box.addEventListener('click', event => {
    const suggestion = event.target.closest('[data-query]');
    if (!suggestion) return;
    event.preventDefault(); input.value = suggestion.dataset.query; input.focus(); propose();
  });
  // 추천 목록 밖을 누르거나 초점이 검색 영역을 벗어나면 목록을 닫는다.
  document.addEventListener('pointerdown', event => { if (!output.hidden && !box.contains(event.target)) close(); });
  box.addEventListener('focusout', event => { if (!output.hidden && event.relatedTarget && !box.contains(event.relatedTarget)) close(); });
  window.addEventListener('pagehide', () => {
    if (page) history.replaceState({ ...history.state, searchPosition: { x: window.scrollX, y: window.scrollY } }, '');
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    revision++; close();
    if (page) {
      restoreQuery(state().query);
      if (page.getAttribute('aria-busy') === 'true') results();
      else restorePosition();
    }
  });
  page?.addEventListener('click', event => {
    const toggle = event.target.closest('[data-tag-toggle], [data-tag-reset]');
    if (toggle) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const selected = state();
      const tag = toggle.dataset.tagToggle;
      const reset = toggle.hasAttribute('data-tag-reset');
      const tags = reset ? [] : selected.tags.includes(tag) ? selected.tags.filter(value => value !== tag) : [...selected.tags, tag];
      history.replaceState({ ...history.state, searchPosition: { x: window.scrollX, y: window.scrollY } }, '');
      history.pushState({ searchPosition: null }, '', new URL(searchUrl({ ...selected, query: reset ? '' : selected.query, tags, page: 1 }), location.origin));
      revision++; close(); results();
      return;
    }
    const anchor = event.target.closest('a[href]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = new URL(anchor.href);
    if (target.origin !== location.origin || target.pathname !== '/search/') return;
    event.preventDefault();
    history.replaceState({ ...history.state, searchPosition: { x: window.scrollX, y: window.scrollY } }, '');
    history.pushState({ searchPosition: null }, '', target);
    revision++; close(); results();
  });
  window.addEventListener('popstate', () => { revision++; close(); results(); });
  results();
}
