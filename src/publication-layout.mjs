// 개인 사이트의 탐색과 본문을 하나의 테마와 문서 식별자로 조합한다.
import { personalFooter } from './publication-footer.mjs';
import { readFileSync } from 'node:fs';
import { escape } from './markdown.mjs';
import * as ui from './vendor/theme/ui/index.mjs';
import { contentIcon } from './content-icons.mjs';
import { TOPIC_GROUPS } from './content-model.mjs';
import { clientEntrypoints } from './publication-assets.mjs';
import { heroSection, projectsSection, technologySection, interviewsSection, contactSection } from './home-sections.mjs';
import { documentNavigation, documentOutline, documentPager } from './document-navigation.mjs';
import { postArticle, shiftHeadings, detailLevels } from './post-article.mjs';
import { publicationMetadata } from './publication-metadata.mjs';
import { usesMath, MATH_STYLESHEET } from './math-assets.mjs';

const BRANDS = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url))).icons;
export const FIELD_NAMES = Object.freeze({ tech: 'Tech', languages: 'Languages', cs: 'CS', frameworks: 'Frameworks', infrastructure: 'Infrastructure' });

export function iconUrl(spec, size = 'small') {
  const name = typeof spec === 'string' ? spec : spec.name;
  return `/theme/assets/icons/${BRANDS.some(item => item.file === `${name}.svg`) ? 'brands' : size === 'small' ? 'small' : 'detail'}/${name}.svg`;
}

export function subjectIcon(spec, size = 'card') {
  const name = typeof spec === 'string' ? spec : spec.name;
  const brand = BRANDS.find(item => item.file === `${name}.svg`);
  if (brand) return String(ui.ContentIconImage({ src: `/theme/assets/icons/brands/${brand.file}`, size }));
  return contentIcon(spec, size, 'detail');
}

export function documentShell(page, body, context) {
  const { config, themeHash, scriptHash, scriptHashes = {}, math } = context;
  const hashOf = file => scriptHashes[file] ?? scriptHash;
  const navigation = [['Search', '/docs/'], ['Blog', '/blog/']];
  const searching = page.type === 'wiki' || page.route.startsWith('/docs/') || page.route === '/search/' || page.route.startsWith('/tags/');
  const active = page.type === 'blog' ? '/blog/' : searching ? '/docs/' : page.route;
  const footer = personalFooter(config);
  const entries = clientEntrypoints(body + footer);
  const searchScript = entries.includes('publication.js') ? `<script type="module" async src="/publication.js?v=${hashOf('publication.js')}"></script>` : '';
  const scripts = entries.filter(file => file !== 'publication.js').map(file => `<script type="module" src="/${file}?v=${hashOf(file)}"></script>`).join('');
  return `<!doctype html><html lang="ko" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light">${publicationMetadata(page, context)}<link rel="alternate" type="application/rss+xml" title="Blog" href="/blog/feed.xml"><link rel="stylesheet" href="/theme/tokens.css?v=${themeHash}"><link rel="stylesheet" href="/theme/styles.css?v=${themeHash}">${usesMath(body) && math ? `<link rel="stylesheet" href="${MATH_STYLESHEET}?v=${math.hash}">` : ''}${scripts}</head><body class="app-publication${page.route === '/' ? ' app-canvas' : ''}"><a class="app-skip" href="#main">본문으로 이동</a>${ui.SiteHeader({ label: '주요 메뉴', homeLabel: '홈 · Things 임시 로고', items: navigation.map(([label, href]) => ({ label, href })), active })}${body}${footer}${searchScript}</body></html>`;
}

export function searchBox({ large = false, query = '' } = {}) {
  return String(ui.SearchBox({ large, query, action: '/search/', labels: { region: '통합 검색', input: '글 검색', placeholder: '어떤 내용을 찾으세요?', clear: '검색어 지우기', suggestions: '추천 검색어:' }, suggestions: large ? ['Python', 'Kubernetes', '운영체제', 'LLM'] : [], fallback: ui.trusted('<p class="app-caption">검색은 JavaScript가 필요합니다. <a href="/docs/">주제별 목록</a>과 <a href="/blog/all/">전체 글</a>은 바로 읽을 수 있습니다.</p>') }));
}

export function tagLinks(page, tags, limit = Infinity) {
  if (!page.tags?.length) return '';
  return String(ui.TagList({ tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })), limit }));
}

export function documentCard(page, title = page.title, level = 3, variant) {
  return String(ui.Card({ href: page.route, title, description: page.description, icon: ui.trusted(subjectIcon(page.contentIcon)), headingLevel: level, variant }));
}

function categoryEntries(documents, topics, field) {
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  return Object.entries(topics).filter(([, topic]) => topic.group && (TOPIC_GROUPS.includes(field) ? topic.group === field : topic.field === field)).map(([id, topic]) => {
      const article = bySlug.get(topic.article) ?? documents.filter(page => page.category === id && page.type === 'wiki').sort((a, b) => a.id.localeCompare(b.id))[0];
      return article ? { ...topic, page: { ...article, description: topic.group === 'tech' ? '' : topic.description ?? article.description, contentIcon: { name: topic.icon } } } : null;
    }).filter(Boolean);
}

export function knowledgeFields(documents, topics, field) {
  const groups = field ? [field] : TOPIC_GROUPS;
  return groups.map(value => {
    const entries = categoryEntries(documents, topics, value);
    if (!entries.length) return '';
    const limit = value === 'tech' ? 8 : 6;
    const previewColumns = value === 'tech' ? 4 : 3;
    const columns = field ? previewColumns + 1 : previewColumns;
    const shown = field ? entries : entries.slice(0, limit);
    const level = field ? 1 : 2;
    return `<section class="app-support-group">${field ? '' : `<h2>${FIELD_NAMES[value]}</h2>`}${ui.CardGroup({ columns, cards: shown.map(topic => ui.trusted(documentCard(topic.page, topic.label, level + 1, 'summary'))) })}${!field && entries.length > limit ? `<p>${ui.NavigationLink({ href: `/docs/topics/${value}/`, text: '전체 보기' })}</p>` : ''}</section>`;
  }).join('');
}

// 설정 목록의 순서가 곧 홈의 섹션 순서다.
const HOME_SECTIONS = {
  hero: heroSection,
  projects: projectsSection,
  technologies: section => technologySection(section, BRANDS),
  interviews: (section, context) => interviewsSection(section, { preview: context.preview }),
  contact: contactSection,
};

export function personalHome(context) {
  const title = context.home.find(section => section.type === 'hero')?.title ?? context.config.name;
  return `<main id="main" class="app-landing"><h1 class="app-sr">${escape(title)}</h1>${context.home.map(section => HOME_SECTIONS[section.type](section, context)).join('')}</main>`;
}

export function wikiLanding(documents, context, field, recent = '') {
  const fields = knowledgeFields(documents, context.topics, field);
  const projects = !field && context.config?.notes?.projects === true ? projectSection(context.config.projects) : '';
  if (field) return `<main id="main" class="app-shell">${searchBox({ large: true })}${ui.CollectionHeader({ title: FIELD_NAMES[field], backHref: '/docs/', backLabel: '돌아가기' })}${fields}</main>`;
  return `<main id="main" class="app-shell app-body">${searchBox({ large: true })}<h1 class="app-sr">Search</h1>${recent}${projects}${fields}</main>`;
}

export function projectSection(projects) {
  return `<section class="app-knowledge-section"><div class="app-section-heading"><h2>개발 프로젝트</h2></div><div class="app-project-grid">${projects.map(project => `<article class="app-project-entry"><a class="app-knowledge-card" href="${escape(project.href)}">${subjectIcon(project.icon)}<h3>${escape(project.title)}</h3><p>${escape(project.description)}</p></a><div class="app-project-links">${project.links.map(link => `<a href="${escape(link.href)}">${escape(link.title)} →</a>`).join('')}</div></article>`).join('')}</div></section>`;
}

export function articlePage(page, context, comments = '') {
  const source = `${page.sourceUrl ? `<p class="app-source-link"><a href="${escape(page.sourceUrl)}">공개 원문</a></p>` : ''}`;
  const tail = `${source}${comments}`;
  const example = page.example ? '<p class="app-example-notice">화면 검증을 위한 예시 글입니다. 실제 운영 성과를 나타내지 않습니다.</p>' : '';
  if (page.type === 'blog') {
    const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? dateLine({ updatedAt: page.updatedAt }) : '';
    return `<main id="main" class="app-shell">${postArticle(page, { detail: true, tags: tagLinks(page, context.tags ?? context.topics), footer: `${updated}${example}`, after: tail })}</main>`;
  }
  const pager = documentPager(page, context);
  const content = ui.DocumentArticle({ title: page.title, icon: ui.trusted(subjectIcon(page.contentIcon, 'medium')), lead: ui.trusted(page.leadHtml ?? escape(page.description)), metadata: ui.trusted(dateLine(page) + tagLinks(page, context.tags ?? context.topics) + example), body: ui.trusted(shiftHeadings(page.html, detailLevels)), after: ui.trusted(source + pager + comments) });
  return `<main id="main" class="app-shell app-document-shell">${searchBox()}${ui.DocumentLayout({ navigation: documentNavigation(page, context), outline: documentOutline(page.headings), content })}</main>`;
}

export function resultRow(page, tags) {
  return String(ui.SearchResult({ href: page.route, icon: ui.trusted(subjectIcon(page.contentIcon, 'small')), title: page.title, example: page.example, description: page.description, tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })) }));
}

export function tagPage(tag, entries, tags) {
  const fallback = entries.length ? entries.map(page => resultRow(page, tags)).join('') : '<p>이 태그로 발행한 글이 없습니다.</p>';
  return `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-page-heading">${escape(tags[tag].label)}</h1><div data-search-page data-tag="${tag}"><div class="app-filter-summary" data-filter-summary></div><div data-full-results></div><details class="app-details" data-search-fallback><summary>이 태그의 모든 글 보기</summary><p class="app-caption">검색어를 적용하지 않은 이 태그의 전체 목록입니다.</p>${fallback}</details></div></main>`;
}

export function dateLine(page) {
  const published = page.publishedAt ? `<time datetime="${page.publishedAt}">${page.publishedAt}</time>` : '';
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? `<span>수정 <time datetime="${page.updatedAt}">${page.updatedAt}</time></span>` : '';
  return published || updated ? `<p class="app-document-dates">${published}${updated}</p>` : '';
}
