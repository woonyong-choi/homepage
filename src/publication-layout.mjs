import { dateLabel } from './content-model.mjs';
import { personalFooter } from './publication-footer.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { brandIcon } from './brand-icons.mjs';
import { renderContentSvg } from './content-icons.mjs';
import { loadBlogLayout } from './layout-config.mjs';
import { searchUrl } from './search-model.mjs';
import { clientEntrypoints } from './publication-assets.mjs';
import { heroSection, projectsSection, technologySection, interviewsSection, contactSection } from './home-sections.mjs';
import { postArticle } from './post-article.mjs';
import { publicationMetadata, siteTitle } from './publication-metadata.mjs';
import { usesMath, MATH_STYLESHEET } from 'document-engine';

const NAVIGATION = Object.freeze([{ href: '/search/', label: 'Search', match: ['/search/'] }, { href: '/blog/', label: 'Blog', match: ['/blog/'] }]);

export function documentShell(page, body, context) {
  const { config, themeHash, scriptHash, scriptHashes = {}, math, colorScheme = 'light' } = context;
  if (!['light', 'dark'].includes(colorScheme)) throw new Error('invalid page color scheme');
  const hashOf = file => scriptHashes[file] ?? scriptHash;
  const navigation = context.navigation ?? NAVIGATION;
  const active = navigation.flatMap(item => item.match.filter(prefix => prefix === '/' ? page.route === '/' : page.route.startsWith(prefix)).map(prefix => ({ href: item.href, length: prefix.length }))).sort((a, b) => b.length - a.length)[0]?.href;
  const footer = personalFooter(config);
  const entries = clientEntrypoints(body + footer);
  const searchScript = entries.includes('publication.js') ? `<script type="module" async src="/publication.js?v=${hashOf('publication.js')}"></script>` : '';
  const scripts = entries.filter(file => file !== 'publication.js').map(file => `<script type="module" src="/${file}?v=${hashOf(file)}"></script>`).join('');
  const logo = config.logo ? ui.trusted(renderContentSvg(config.logo.src, '', context.readAsset)) : undefined;
  return `<!doctype html><html lang="ko" data-theme="${colorScheme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="${colorScheme}">${publicationMetadata(page, context)}<link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/feed.xml"><link rel="stylesheet" href="/theme/tokens.css?v=${themeHash}"><link rel="stylesheet" href="/theme/styles.css?v=${themeHash}">${usesMath(body) && math ? `<link rel="stylesheet" href="${MATH_STYLESHEET}?v=${math.hash}">` : ''}${scripts}</head><body class="app-publication${page.route === '/' ? ' app-canvas' : ''}"><a class="app-skip" href="#main">본문으로 이동</a>${ui.SiteHeader({ label: '주요 메뉴', title: siteTitle(config), homeLabel: `${config.logo?.alt || siteTitle(config)} 홈`, logo, items: navigation, active })}${body}${footer}${searchScript}</body></html>`;
}

export function searchBox({ large = false, query = '', combobox = true, action = '/search/', config = loadBlogLayout().search.box } = {}) {
  return String(ui.SearchBox({ large, query, combobox, action, labels: config.labels, suggestions: large ? config.suggestions : [], fallback: ui.trusted('<p class="app-caption">검색과 태그 필터는 JavaScript가 필요합니다. <a href="/search/">전체 글</a>은 바로 읽을 수 있습니다.</p>') }));
}

export function tagLinks(page, tags, limit = Infinity, url = searchUrl, size = 'medium') {
  if (!page.tags?.length) return '';
  return String(ui.TagList({ tags: page.tags.map(id => ({ href: url({ tags: [id] }), label: tags[id]?.label ?? id })), limit, size }));
}

// 설정 목록의 순서가 곧 홈의 섹션 순서다.
const HOME_SECTIONS = {
  hero: heroSection,
  projects: projectsSection,
  technologies: section => technologySection(section, brandIcon),
  interviews: (section, context) => interviewsSection(section, { preview: context.preview }),
  contact: contactSection,
};

export function personalHome(context) {
  const title = context.home.find(section => section.type === 'hero')?.title ?? context.config.name;
  return `<main id="main" class="app-landing"><h1 class="app-sr">${escape(title)}</h1>${context.home.map(section => HOME_SECTIONS[section.type](section, context)).join('')}</main>`;
}

export function articlePage(page, context, comments = '') {
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? dateLine({ updatedAt: page.updatedAt }) : '';
  const example = page.example ? '<p class="app-example-notice">화면 검증을 위한 예시 글입니다.</p>' : '';
  return `<main id="main" class="app-shell">${postArticle({ ...page, html: page.html + relatedPostsSection(page) }, { detail: true, tags: tagLinks(page, context.tags ?? {}), footer: `${updated}${example}`, after: comments })}</main>`;
}

export function relatedPostsSection(page) {
  const posts = page.related ?? [];
  if (!posts.length) return '';
  const cards = posts.map(post => ui.Card({ href: post.route, title: post.title, variant: 'related' }));
  return `<h2 id="${escape(page.id)}-related-posts">관련 글</h2>${ui.CardGroup({ variant: 'related', cards })}`;
}

// 없는 주소의 응답. 어느 경로에서든 읽히므로 링크는 모두 루트 기준이다.
export function notFoundPage() {
  return `<main class="app-shell app-body" id="main">${searchBox()}${ui.PageHeading({ title: '페이지를 찾을 수 없습니다' })}<p class="app-empty">주소가 바뀌었거나 없는 페이지입니다. <a href="/">홈</a>이나 <a href="/search/">글 목록</a>에서 찾거나 검색해 주세요.</p></main>`;
}

export function dateLine(page) {
  const published = page.publishedAt ? `<time datetime="${page.publishedAt}">${dateLabel(page.publishedAt)}</time>` : '';
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? `<span>수정 <time datetime="${page.updatedAt}">${dateLabel(page.updatedAt)}</time></span>` : '';
  return published || updated ? `<p class="app-document-dates">${published}${updated}</p>` : '';
}
