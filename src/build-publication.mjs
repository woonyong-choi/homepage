// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { verifyDesign } from './vendor/theme/ui/build/verify.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { readDocument, publicDocuments, searchEntry, FIELDS, TOPIC_GROUPS, blogDocuments } from './content-model.mjs';
import { escape } from './vendor/theme/ui/index.mjs';
import * as ui from './vendor/theme/ui/index.mjs';
import { parseArticle, renderArticle } from './article-renderer.mjs';
import { documentShell, personalHome, wikiLanding, articlePage, projectSection, searchBox, tagPage, iconUrl, FIELD_NAMES, categoryEntries } from './publication-layout.mjs';
import { recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';
import { commentsSection, commentThemeUrl } from './comments.mjs';
import { readCommentCounts } from './comment-counts.mjs';
import { getIconCatalog } from './vendor/theme/ui/build/icons.mjs';
import { publicationAssets } from './publication-assets.mjs';
import { replacePublication } from './publication-output.mjs';
import { loadHomeContent, loadHomeNavigation } from './home-content.mjs';
import { createTopicTrees, navigationDocuments } from './topic-navigation.mjs';
import { browserScripts } from './browser-scripts.mjs';
import { mathAssets } from 'seorap-document';
import { compileDiagrams } from './diagrams.mjs';
import { compileStyles as publicationStyles } from './vendor/theme/ui/build/styles.mjs';
import { siteOrigin, siteTitle, SITE_ICON } from './publication-metadata.mjs';
import { siteIdentity } from './site-identity.mjs';
import { legacyRoutes, redirectPage } from './publication-routes.mjs';
import { markdownFiles, readContentFile } from './content-files.mjs';
import { LAYOUT, gridSize } from './layout-config.mjs';
import { verifyApprovedContent } from './approved-content.mjs';
import { readProjectDocuments } from './project-documents.mjs';

verifyApprovedContent();

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const CONTENT = fileURLToPath(new URL('../content/', import.meta.url));
const SETTINGS = fileURLToPath(new URL('../config/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../dist/site/', import.meta.url));
const CONFIG = JSON.parse(readFileSync(join(SETTINGS, 'site.json')));
const TOPICS = readContentFile(join(CONTENT, 'tech.md')).metadata.topics;
const TAGS = JSON.parse(readFileSync(join(SETTINGS, 'tags.json')));
const THEME = join(ROOT, 'vendor/theme');
const MANIFEST = JSON.parse(readFileSync(join(THEME, 'manifest.json')));
const BRAND_NAMES = Object.keys(getIconCatalog().brands);
const digest = value => createHash('sha256').update(value).digest('hex');

export async function buildPublication({ origin = '', preview = true } = {}) {
  origin = siteOrigin(origin, preview);
  verifyDesign(THEME);
  const entries = ['docs', 'blog'].flatMap(folder => markdownFiles(join(CONTENT, folder)))
    .sort().map(file => readDocument(readFileSync(file, 'utf8'), TAGS, new Date(), TOPICS));
  const projects = readProjectDocuments();
  entries.push(...projects.documents);
  entries.sort((left, right) => Number(Boolean(left.example)) - Number(Boolean(right.example)));
  const documents = navigationDocuments(publicDocuments(entries, { includeExamples: preview }), TOPICS);
  const posts = blogDocuments(documents);
  const comments = readCommentCounts(posts, CONFIG);
  for (const post of posts) {
    post.commentCount = comments.counts.get(post.id);
  }
  const topicTrees = createTopicTrees(documents);
  const diagramSources = new Map();
  const parsed = new Map();
  for (const page of documents) {
    const document = await parseArticle(page);
    parsed.set(page.id, document);
    for (const diagram of document.metadata.diagrams) diagramSources.set(diagram.source, page.id);
  }
  const diagrams = await compileDiagrams(diagramSources);
  await renderDocuments(documents, { diagrams: diagrams.diagrams, parsed });
  const scripts = browserScripts(ROOT);
  const identity = siteIdentity(readFileSync(join(THEME, SITE_ICON.slice('/theme/'.length))));
  const context = { config: CONFIG, layout: LAYOUT, navigation: loadHomeNavigation(CONTENT), topics: TOPICS, tags: TAGS, topicTrees, origin, preview, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
  context.diagrams = diagrams.assets;
  context.projectAssets = projects.assets;
  context.home = loadHomeContent(new Set(BRAND_NAMES), CONTENT, { preview });
  const output = new Map();
  const add = (route, title, body, metadata = {}) => {
    if (output.has(route)) throw new Error(`duplicate publication route: ${route}`);
    output.set(route, documentShell({ route, title, ...metadata }, body, context));
  };
  add('/', siteTitle(CONFIG), personalHome(context));
  add('/docs/', LAYOUT.search.title, wikiLanding(documents, context, undefined, recentBlog(posts, TAGS, LAYOUT)));
  const fields = [...new Set([...TOPIC_GROUPS, ...FIELDS])];
  for (const field of fields) {
    const area = LAYOUT[field] ?? LAYOUT.cs;
    const count = categoryEntries(documents, TOPICS, field, TOPIC_GROUPS.includes(field) ? area.order : []).length;
    const pages = Math.max(1, Math.ceil(count / gridSize(area.collection)));
    for (let page = 1; page <= pages; page++) add(`/docs/topics/${field}/${page === 1 ? '' : `page/${page}/`}`, LAYOUT[field]?.title ?? FIELD_NAMES[field], wikiLanding(documents, context, field, '', page));
  }
  add('/projects/', 'Projects', `<main class="app-shell" id="main"><h1 class="app-page-heading">Projects</h1>${projectSection(CONFIG.projects)}</main>`);
  const commentTheme = commentThemeUrl(CONFIG, { origin, themeHash: MANIFEST.contentHash });
  const commentConfig = { ...CONFIG.comments, repo: CONFIG.repository };
  for (const page of documents) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  for (const [tagId, tag] of Object.entries(TAGS)) {
    const entries = documents.filter(page => page.tags.includes(tagId));
    add(`/tags/${tagId}/`, tag.label, tagPage(tagId, entries, TAGS));
  }
  add('/search/', '검색', `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-sr">검색</h1><div data-search-page><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 주제를 선택해 주세요.</p></div>${ui.PageLinks({ label: '검색 페이지', resultPages: true })}</div></main>`);
  for (const [base, size, render] of [['/blog/', LAYOUT.blog.feedSize, blogFeed], ['/blog/all/', gridSize(LAYOUT.blog.collection), blogArchive]]) {
    for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / size)); page++) add(page === 1 ? base : `${base}page/${page}/`, LAYOUT.blog.title, render(posts, TAGS, page, { commentConfig, commentTheme, layout: LAYOUT }), { type: 'blog' });
  }
  context.redirects = legacyRoutes(documents, fields);
  for (const [old, target] of context.redirects) {
    if (output.has(old) || !output.has(target)) throw new Error(`invalid publication redirect: ${old}`);
    output.set(old, redirectPage(target, origin));
  }
  await writeSite(output, documents, context, scripts);
  return { pages: output.size, documents: documents.length, themeHash: MANIFEST.contentHash };
}

async function renderDocuments(documents, options) {
  for (const page of documents) {
    Object.assign(page, await renderArticle(page, { ...options, document: options.parsed.get(page.id) }));
  }
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  for (const page of documents) {
    const rewrite = html => html.replace(/href="\/(wiki|articles)\/([^/]+)\/(?:#([^"?]+))?"/g, (original, kind, slug, fragment) => {
      const target = bySlug.get(slug);
      if (!target) return kind === 'wiki' ? `href="https://docs.woonyong.com/wiki/${slug}/${fragment ? '#' + fragment : ''}"` : original;
      if (!fragment) return `href="${target.route}"`;
      if ((target.leadHtml + target.html).includes(`id="${decodeURIComponent(fragment)}"`)) return `href="${target.route}#${fragment}"`;
      const id = `${target.id}-${decodeURIComponent(fragment)}`;
      return (target.leadHtml + target.html).includes(`id="${id}"`) ? `href="${target.route}#${id}"` : `href="https://docs.woonyong.com/wiki/${slug}/#${fragment}"`;
    }).replace(/href="\/wiki\/(?=["?#])/g, 'href="/docs/').replace(/href="#([^" ]+)"/g, (original, fragment) => {
      if ((page.leadHtml + page.html).includes(`id="${fragment}"`)) return original;
      const prefixed = `${page.id}-${decodeURIComponent(fragment)}`;
      return (page.leadHtml + page.html).includes(`id="${prefixed}"`) ? `href="#${prefixed}"` : original;
    }).replaceAll('/things/assets/', '/assets/').replaceAll('/things/theme/', '/theme/');
    page.leadHtml = rewrite(page.leadHtml);
    page.html = rewrite(page.html);
  }
}



async function writeSite(output, documents, context, scripts) {
  const sourceStyles = readFileSync(join(THEME, 'styles.css'), 'utf8');
  const styles = await publicationStyles(sourceStyles, output, scripts, readFileSync(join(THEME, 'tokens.css'), 'utf8'));
  const stylePath = '/theme/publication.css';
  const styleHash = digest(styles.css);
  for (const [route, html] of output) {
    output.set(route, html.replace(`/theme/styles.css?v=${context.themeHash}`, `${stylePath}?v=${styleHash}`));
  }
  const files = new Map([...scripts].map(([file, source]) => [`/${file}`, source]));
  const index = { entries: documents.map(page => ({ ...searchEntry(page, TAGS), iconUrl: iconUrl(page.contentIcon), example: !!page.example })), tags: TAGS };
  const assets = new Map([...context.identity.assets, ...publicationAssets(output, index.entries, path => context.identity.assets.get(path) ?? context.projectAssets.get(path) ?? context.math.assets.get(path) ?? (path === '/theme/tokens.css' ? Buffer.from(styles.theme) : path === stylePath ? Buffer.from(styles.css) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  for (const [path, content] of context.diagrams) assets.set(path, content);
  for (const name of ['LICENSE', 'NOTICE']) {
    const path = '/assets/projects/thinkflow/' + name;
    assets.set(path, context.projectAssets.get(path));
  }
  for (const [path, content] of assets) files.set(path, content);
  const indexJson = JSON.stringify(index);
  files.set('/search-version.json', JSON.stringify({ revision: digest(indexJson) }));
  files.set('/search-index.json', indexJson);
  files.set('/search-index.json.gz', gzipSync(indexJson, { level: 9 }));
  const posts = blogDocuments(documents).filter(page => !page.example);
  files.set('/blog/feed.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(siteTitle(CONFIG))}</title><link>${escape(context.origin + '/blog/')}</link><description>${escape(CONFIG.description)}</description>${posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(context.origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`);
  files.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => route !== '/search/' && !context.redirects.has(route)).map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  files.set('/build-report.json', JSON.stringify({ pages: output.size, documents: documents.length, examples: documents.filter(page => page.example).length, preview: context.preview, commentsStatus: context.commentsStatus, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(styles.css), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  files.set('/robots.txt', context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
  replacePublication(OUTPUT, output, files);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await buildPublication({ origin: process.env.SITE_ORIGIN ?? '', preview: !process.argv.includes('--production') }));
