import { dateLabel } from './content-model.mjs';
// 개인 사이트의 탐색과 본문을 하나의 테마와 문서 식별자로 조합한다.
import { personalFooter } from './publication-footer.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { iconFile } from '@woonyong-choi/design-tokens/ui/build/icons.mjs';
import { brandIcon } from './brand-icons.mjs';
import { contentIcon, renderContentSvg } from './content-icons.mjs';
import { TOPIC_GROUPS, paginate } from './content-model.mjs';
import { LAYOUT, gridSize } from './layout-config.mjs';
import { loadHomeNavigation } from './home-content.mjs';
import { collectionNavigation } from './collection-navigation.mjs';
import { clientEntrypoints } from './publication-assets.mjs';
import { heroSection, projectsSection, technologySection, interviewsSection, contactSection } from './home-sections.mjs';
import { documentNavigation, documentOutline, documentPager } from './document-navigation.mjs';
import { postArticle, shiftHeadings, detailLevels } from './post-article.mjs';
import { publicationMetadata, siteTitle } from './publication-metadata.mjs';
import { usesMath, MATH_STYLESHEET } from 'document-engine';

const NAVIGATION = loadHomeNavigation();
export const FIELD_NAMES = Object.freeze({ tech: 'Tech', languages: 'Languages', cs: 'CS', frameworks: 'Frameworks', infrastructure: 'Infrastructure' });

export function iconUrl(spec, size = 'small') {
  const name = typeof spec === 'string' ? spec : spec.name;
  return brandIcon(name)?.src ?? `/theme/assets/icons/${iconFile(name, { variant: size === 'small' ? 'default' : 'detail' })}`;
}

export function subjectIcon(spec, size = 'card') {
  return contentIcon(spec, size, 'detail');
}

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

export function searchBox({ large = false, query = '', combobox = true, config = LAYOUT.search.box } = {}) {
  return String(ui.SearchBox({ large, query, combobox, action: '/search/', labels: config.labels, suggestions: large ? config.suggestions : [], fallback: ui.trusted('<p class="app-caption">검색은 JavaScript가 필요합니다. <a href="/docs/">주제별 목록</a>과 <a href="/blog/all/">전체 글</a>은 바로 읽을 수 있습니다.</p>') }));
}

export function tagLinks(page, tags, limit = Infinity) {
  if (!page.tags?.length) return '';
  return String(ui.TagList({ tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })), limit }));
}

export function documentCard(page, title = page.title, level = 3, variant, card = LAYOUT.cs.card) {
  const icon = card.media === 'icon' ? ui.trusted(subjectIcon(page.contentIcon)) : card.media === 'image' && page.thumbnail ? ui.ContentIconImage({ src: page.thumbnail.src, size: 'card' }) : undefined;
  const description = card.description ? page.description : '';
  return String(ui.Card({ href: page.route, title, showTitle: card.title || (!icon && !description), description, icon, headingLevel: level, variant }));
}

export function categoryEntries(documents, topics, field, order = []) {
  for (const id of order) if (!topics[id] || (TOPIC_GROUPS.includes(field) && topics[id].group !== field)) throw new Error(`config/${field}.json.order: 영역에 없는 주제입니다: ${id}`);
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  const ordered = [...order, ...Object.keys(topics).filter(id => !order.includes(id))];
  return ordered.filter(id => topics[id].group && (TOPIC_GROUPS.includes(field) ? topics[id].group === field : topics[id].field === field)).map(id => {
    const topic = topics[id];
    const article = bySlug.get(topic.article) ?? documents.filter(page => (page.topic ?? page.category) === id && page.type === 'wiki').sort((a, b) => a.id.localeCompare(b.id))[0];
    return article ? { ...topic, page: { ...article, description: topic.description ?? article.description, contentIcon: { name: topic.icon } } } : null;
  }).filter(Boolean);
}

export function knowledgeFields(documents, topics, field, { layout = LAYOUT, groups = TOPIC_GROUPS, page = 1 } = {}) {
  return (field ? [field] : groups).map(value => {
    const area = layout[value] ?? layout.cs;
    const entries = categoryEntries(documents, topics, value, TOPIC_GROUPS.includes(value) ? area.order : []);
    if (!entries.length) return '';
    const grid = field ? area.collection : area.preview;
    const limit = gridSize(grid);
    const result = paginate(entries, field ? page : 1, limit);
    const level = field ? 2 : 3;
    const title = layout[value]?.title ?? FIELD_NAMES[value];
    const intro = `${field ? '' : `<h2>${escape(title)}</h2>`}${area.description ? `<p>${escape(area.description)}</p>` : ''}`;
    const cards = result.items.map(topic => ui.trusted(documentCard(topic.page, topic.label, level, 'summary', area.card)));
    const next = field ? collectionNavigation(result, `/docs/topics/${value}/`) : entries.length > limit ? `<p>${ui.NavigationLink({ href: `/docs/topics/${value}/`, text: layout.search.allLabel })}</p>` : '';
    return String(ui.ContentGroup({ body: ui.trusted(`${intro}${ui.CardGroup({ columns: grid.columns, cards })}${next}`) }));
  }).join('');
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

export function wikiLanding(documents, context, field, recent = '', page = 1) {
  const layout = context.layout ?? LAYOUT;
  const search = searchBox({ large: true, config: layout.search.box });
  if (field) return `<main id="main" class="app-shell">${search}${ui.CollectionHeader({ title: layout[field]?.title ?? FIELD_NAMES[field], backHref: '/docs/', backLabel: layout.search.backLabel })}${knowledgeFields(documents, context.topics, field, { layout, page })}</main>`;
  const sections = layout.search.sections.filter(section => section.enabled).map(section => {
    if (section.id === 'blog') return recent;
    if (section.id === 'projects') return projectSection(context.config?.projects ?? [], layout.search.projectsTitle);
    if (section.id === 'guides') return guideSections(context.config?.guides ?? []);
    return knowledgeFields(documents, context.topics, undefined, { layout, groups: [section.id] });
  });
  return `<main id="main" class="app-shell app-body">${search}<h1 class="app-sr">${escape(layout.search.title)}</h1>${sections.join('')}</main>`;
}

function guideSections(guides) {
  return guides.map(guide => {
    const cards = guide.items.map((item, index) => ui.Card({
      ...item, headingLevel: 3, compact: index > 0,
      icon: index === 0 ? ui.trusted(subjectIcon(guide.icon)) : undefined,
    }));
    return String(ui.ContentGroup({ title: guide.title, body: ui.CardGroup({ split: true, cards }) }));
  }).join('');
}

export function projectSection(projects, title = LAYOUT.search.projectsTitle) {
  return String(ui.ProjectList({ title, projects: projects.map(project => ({ ...project, icon: ui.trusted(subjectIcon(project.icon)) })) }));
}

export function articlePage(page, context, comments = '') {
  const source = `${page.sourceUrl ? `<p class="app-source-link"><a href="${ui.safeUrl(page.sourceUrl)}">공개 원문</a></p>` : ''}`;
  const tail = `${source}${comments}`;
  const example = page.example ? '<p class="app-example-notice">화면 검증을 위한 예시 글입니다. 실제 운영 성과를 나타내지 않습니다.</p>' : '';
  if (page.type === 'blog') {
    const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? dateLine({ updatedAt: page.updatedAt }) : '';
    return `<main id="main" class="app-shell">${postArticle(page, { detail: true, tags: tagLinks(page, context.tags ?? context.topics), footer: `${updated}${example}`, after: tail })}</main>`;
  }
  const pager = documentPager(page, context, candidate => ui.trusted(subjectIcon(candidate.contentIcon, 'small')));
  const content = ui.DocumentArticle({ title: page.title, icon: ui.trusted(subjectIcon(page.contentIcon, 'medium')), lead: ui.trusted(page.leadHtml ?? escape(page.description)), metadata: ui.trusted(dateLine(page) + tagLinks(page, context.tags ?? context.topics) + example), body: ui.trusted(shiftHeadings(page.html, detailLevels)), after: ui.trusted(source + pager + comments) });
  return `<main id="main" class="app-shell app-document-shell">${searchBox({ config: (context.layout ?? LAYOUT).search.box })}${ui.DocumentLayout({ navigation: documentNavigation(page, context), outline: documentOutline(page.headings), content })}</main>`;
}

export function resultRow(page, tags) {
  return String(ui.SearchResult({ href: page.route, icon: ui.trusted(subjectIcon(page.contentIcon, 'small')), title: page.title, example: page.example, description: page.description, tags: page.tags.map(id => ({ href: `/tags/${id}/`, label: tags[id].label })) }));
}

export function searchPage() {
  return `<main class="app-shell app-body" id="main">${searchBox({ combobox: false })}<h1 class="app-sr">검색</h1><div data-search-page><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 주제를 선택해 주세요.</p></div>${ui.PageLinks({ label: '검색 페이지', resultPages: true })}</div></main>`;
}

// 없는 주소의 응답. 어느 경로에서든 읽히므로 링크는 모두 루트 기준이다.
export function notFoundPage() {
  return `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-page-heading">페이지를 찾을 수 없습니다</h1><p class="app-empty">주소가 바뀌었거나 없는 페이지입니다. <a href="/">홈</a>이나 <a href="/docs/">주제별 목록</a>에서 찾거나 검색해 주세요.</p></main>`;
}

export function tagPage(tag, entries, tags) {
  const fallback = entries.length ? entries.map(page => resultRow(page, tags)).join('') : '<p>이 태그로 발행한 글이 없습니다.</p>';
  return `<main class="app-shell app-body" id="main">${searchBox({ combobox: false })}<h1 class="app-page-heading">${escape(tags[tag].label)}</h1><div data-search-page data-tag="${tag}"><div class="app-filter-summary" data-filter-summary></div><div data-full-results></div><div data-search-fallback>${ui.Details({ title: '이 태그의 모든 글 보기', body: ui.trusted(`<p class="app-caption">검색어를 적용하지 않은 이 태그의 전체 목록입니다.</p>${fallback}`) })}</div></div></main>`;
}

export function dateLine(page) {
  const published = page.publishedAt ? `<time datetime="${page.publishedAt}">${dateLabel(page.publishedAt)}</time>` : '';
  const updated = page.updatedAt && page.updatedAt !== page.publishedAt ? `<span>수정 <time datetime="${page.updatedAt}">${dateLabel(page.updatedAt)}</time></span>` : '';
  return published || updated ? `<p class="app-document-dates">${published}${updated}</p>` : '';
}
