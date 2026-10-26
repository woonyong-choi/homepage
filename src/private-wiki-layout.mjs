import { searchUrl } from './search-model.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import { contentIcon } from './content-icons.mjs';
import { dateLine, tagLinks, searchBox } from './publication-layout.mjs';
import { loadBlogLayout } from './layout-config.mjs';
import { documentOutline } from './document-navigation.mjs';
import { shiftHeadings, detailLevels } from './post-article.mjs';

export function privateWikiArticle(page, context, comments = '') {
  const source = page.sourceUrl ? `<p class="app-source-link"><a href="${ui.safeUrl(page.sourceUrl)}">공개 원문</a></p>` : '';
  const content = ui.DocumentArticle({ title: page.title, icon: ui.trusted(contentIcon(page.contentIcon, 'medium', 'detail')), lead: ui.trusted(page.leadHtml ?? escape(page.description)), metadata: ui.trusted(dateLine(page) + tagLinks(page, context.tags ?? context.topics, Infinity, state => searchUrl({ ...state, baseRoute: '/search/' }), 'small')), body: ui.trusted(shiftHeadings(page.html, detailLevels)), after: ui.trusted(source + comments) });
  return `<main id="main" class="app-shell app-document-shell">${searchBox({ action: '/search/', config: (context.layout ?? loadBlogLayout()).search.box })}${ui.DocumentLayout({ outline: documentOutline(page.headings), content })}</main>`;
}

export function privateWikiSearch(layout) {
  return `<main class="app-shell app-body" id="main">${searchBox({ combobox: false, action: '/search/', config: layout.search.box })}<h1 class="app-sr">검색</h1><div data-search-page data-search-home="/docs/"><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 태그를 선택해 주세요.</p></div>${ui.PageLinks({ label: '검색 페이지', resultPages: true })}</div></main>`;
}
