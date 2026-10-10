// 결과 줄, 쪽 이동, 태그 칩은 테마 구성 요소가 이스케이프해 만든 출력만 DOM으로 옮긴다. 메시지, 제안 라벨, 선택 링크, 다시 시도 단추는 텍스트 노드로 만든다. 입력과 본문을 직접 HTML로 해석하지 않는다.
import { searchUrl } from './search-model.mjs';
import * as ui from './vendor/theme/ui/index.mjs';

// 구성 요소가 만든 결과만 DOM으로 바꾼다. 글자는 구성 요소가 이스케이프하고 주소는 검사하므로 임의의 HTML이 들어오지 않는다.
function nodeFrom(component) {
  if (!ui.isTrusted(component)) throw new TypeError('theme component output required');
  const template = document.createElement('template');
  template.innerHTML = component.html;
  return template.content.firstElementChild;
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function link(text, href, className) {
  const node = element('a', text, className);
  node.href = href;
  return node;
}

export function showResultsLoading(root, message = '검색 결과를 불러오는 중입니다.') {
  root.setAttribute('aria-busy', 'true');
  for (const node of root.querySelectorAll('[data-filter-summary], [data-result-pages]')) node.replaceChildren();
  const output = root.querySelector('[data-full-results]');
  output.classList.add('app-search-panel');
  output.replaceChildren(element('p', message, 'app-search-message'));
}

export function renderResults(root, result, state, tags) {
  const summary = root.querySelector('[data-filter-summary]');
  summary.replaceChildren(...state.tags.map(tag => nodeFrom(ui.Tag({ href: searchUrl({ ...state, tags: state.tags.filter(value => value !== tag), page: 1 }), label: `${tags[tag]?.label ?? tag} ×` }))));
  if (state.query || state.tags.length) summary.append(link('조건 초기화', '/docs/'));
  const output = root.querySelector('[data-full-results]');
  output.classList.add('app-search-panel');
  output.replaceChildren(...result.entries.map(entry => resultRow(entry, tags, state)));
  if (!result.entries.length) {
    output.append(element('p', '조건에 맞는 글이 없습니다. 검색어나 태그를 줄여 보세요.', 'app-search-message'));
  }
  const multiple = result.totalPages > 1;
  const pages = nodeFrom(ui.PageLinks({
    label: '검색 페이지',
    resultPages: true,
    before: multiple && result.page > 1 ? { href: searchUrl({ ...state, page: result.page - 1 }), text: '이전' } : undefined,
    after: multiple && result.page < result.totalPages ? { href: searchUrl({ ...state, page: result.page + 1 }), text: '다음' } : undefined,
    numbers: multiple ? Array.from({ length: result.totalPages }, (_, index) => ({ page: index + 1, href: searchUrl({ ...state, page: index + 1 }), current: index + 1 === result.page })) : [],
  }));
  const previous = root.querySelector('[data-result-pages]');
  if (previous) previous.replaceWith(pages); else output.after(pages);
  root.setAttribute('aria-busy', 'false');
  const fallback = root.querySelector('[data-search-fallback]');
  if (fallback) fallback.hidden = !fallback.open && !fallback.contains(document.activeElement);
}

function resultLink(entry, query) {
  return nodeFrom(ui.SearchResultLink({
    href: entry.route,
    icon: ui.ContentIconImage({ src: entry.iconUrl }),
    title: ui.Highlight({ text: entry.title, query }),
    example: entry.example,
    description: ui.Highlight({ text: entry.excerpt ?? entry.description, query }),
  }));
}

function resultRow(entry, tags, state) {
  return nodeFrom(ui.SearchResult({
    href: entry.route,
    icon: ui.ContentIconImage({ src: entry.iconUrl }),
    title: ui.Highlight({ text: entry.title, query: state.query }),
    example: entry.example,
    description: ui.Highlight({ text: entry.excerpt ?? entry.description, query: state.query }),
    tags: entry.tags.map(tag => ({ href: searchUrl({ ...state, tags: [...new Set([...state.tags, tag])], page: 1 }), label: tags[tag].label })),
  }));
}

export function renderSuggestions(output, result, state) {
  output.replaceChildren();
  const groups = [
    ['연관 검색어', result.queries.map(query => [query, searchUrl({ ...state, query, page: 1 })])],
    ['태그', result.tags.map(([id, tag]) => [tag.label, searchUrl({ ...state, tags: [...state.tags, id], page: 1 })])],
  ];
  let index = 0;
  for (const [label, links] of groups) {
    if (!links.length) continue;
    const group = element('div'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
    group.append(element('p', label, 'app-suggestion-label'));
    for (const [title, href] of links) { const node = link(title, href, 'app-search-choice'); if (label === '연관 검색어') node.dataset.query = title; node.setAttribute('role', 'option'); node.id = `suggestion-${index++}`; node.tabIndex = -1; group.append(node); }
    output.append(group);
  }
  const entries = element('div'); entries.setAttribute('role', 'group'); entries.setAttribute('aria-label', '글');
  for (const entry of result.entries) { const node = resultLink(entry, state.query); node.setAttribute('role', 'option'); node.id = `suggestion-${index++}`; node.tabIndex = -1; entries.append(node); }
  if (!result.count) entries.append(element('p', '일치하는 글이 없습니다. 다른 검색어를 입력해 보세요.', 'app-search-message'));
  output.append(entries);
  const all = link(`전체 검색 결과 ${result.count}개 보기`, searchUrl({ ...state, page: 1 }), 'app-search-choice');
  all.setAttribute('role', 'option'); all.id = `suggestion-${index}`; all.tabIndex = -1; output.append(all);
}

export function showSearchError(output, retry) {
  output.classList.add('app-search-panel');
  const button = element('button', '다시 시도', 'app-inline-button'); button.type = 'button'; button.addEventListener('click', retry);
  if (output.getAttribute('role') === 'listbox') { button.setAttribute('role', 'option'); button.id = `${output.id}-retry`; button.tabIndex = -1; }
  output.replaceChildren(element('p', '검색 자료를 불러오지 못했습니다. 연결을 확인해 주세요.', 'app-search-message'), button);
}
