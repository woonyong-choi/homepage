// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { verifyDesign } from './vendor/theme/ui/build/verify.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { readDocument, publicDocuments, searchEntry, FIELDS, TOPIC_GROUPS, blogDocuments, PAGE_SIZES } from './content-model.mjs';
import { createMarkdown, escape } from './markdown.mjs';
import * as ui from './vendor/theme/ui/index.mjs';
import { renderArticle } from './article-renderer.mjs';
import { documentShell, personalHome, wikiLanding, articlePage, projectSection, searchBox, tagPage, iconUrl, FIELD_NAMES } from './publication-layout.mjs';
import { recentBlog, blogArchive, blogFeed } from './blog-layout.mjs';
import { commentsSection } from './comments.mjs';
import { readCommentCounts } from './comment-counts.mjs';
import { iconAuditPages } from './icon-audit.mjs';
import { publicationAssets, clientEntrypoints } from './publication-assets.mjs';
import { loadHomeContent } from './home-content.mjs';
import { createTopicTrees } from './topic-navigation.mjs';
import { browserScripts } from './browser-scripts.mjs';
import { mathAssets } from './math-assets.mjs';
import { compileDiagrams } from './diagrams.mjs';
import { compileStyles as publicationStyles } from './vendor/theme/ui/build/styles.mjs';
import { siteOrigin, SITE_ICON } from './publication-metadata.mjs';
import { siteIdentity } from './site-identity.mjs';
import { legacyRoutes, redirectPage } from './publication-routes.mjs';
import { markdownFiles, readContentFile } from './content-files.mjs';
import { verifyApprovedContent } from './approved-content.mjs';

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
const BRAND_NAMES = JSON.parse(readFileSync(join(THEME, 'assets/icons/brands/catalog.json'))).icons.map(item => item.name);
const digest = value => createHash('sha256').update(value).digest('hex');

export async function buildPublication({ origin = '', preview = true } = {}) {
  origin = siteOrigin(origin, preview);
  verifyDesign(THEME);
  const entries = ['docs', 'blog'].flatMap(folder => markdownFiles(join(CONTENT, folder)))
    .sort().map(file => readDocument(readFileSync(file, 'utf8'), TAGS, new Date(), TOPICS));
  entries.sort((left, right) => Number(Boolean(left.example)) - Number(Boolean(right.example)));
  const documents = publicDocuments(entries, { includeExamples: preview });
  const posts = blogDocuments(documents);
  const comments = readCommentCounts(posts, CONFIG);
  for (const post of posts) {
    post.commentCount = comments.counts.get(post.id);
  }
  const topicTrees = createTopicTrees(documents);
  const diagramSources = new Map();
  renderDocuments(documents, { diagramSources });
  const diagrams = await compileDiagrams(diagramSources);
  if (diagrams.diagrams.size) renderDocuments(documents, { diagrams: diagrams.diagrams });
  const scripts = browserScripts(ROOT);
  const identity = siteIdentity(readFileSync(join(THEME, SITE_ICON.slice('/theme/'.length))), readFileSync(join(THEME, 'assets/controls/LICENSE')));
  const context = { config: CONFIG, topics: TOPICS, tags: TAGS, topicTrees, origin, preview, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
  context.diagrams = diagrams.assets;
  context.home = loadHomeContent(new Set(BRAND_NAMES), CONTENT, { preview });
  const output = new Map();
  const add = (route, title, body, metadata = {}) => {
    if (output.has(route)) throw new Error(`duplicate publication route: ${route}`);
    output.set(route, documentShell({ route, title, ...metadata }, body, context));
  };
  add('/', CONFIG.name, personalHome(context));
  add('/docs/', 'Search', wikiLanding(documents, context, undefined, recentBlog(posts, TAGS)));
  const fields = [...new Set([...TOPIC_GROUPS, ...FIELDS])];
  for (const field of fields) add(`/docs/topics/${field}/`, FIELD_NAMES[field], wikiLanding(documents, context, field));
  add('/projects/', 'Projects', `<main class="app-shell" id="main"><h1 class="app-page-heading">Projects</h1>${projectSection(CONFIG.projects)}</main>`);
  if (preview) for (const page of iconAuditPages()) add(page.route, '아이콘 검증', page.body);
  const commentTheme = origin ? `${origin}/theme/assets/giscus.css?v=${MANIFEST.contentHash}` : 'light';
  const commentConfig = { ...CONFIG.comments, repo: CONFIG.repository };
  for (const page of documents) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  for (const [tagId, tag] of Object.entries(TAGS)) {
    const entries = documents.filter(page => page.tags.includes(tagId));
    add(`/tags/${tagId}/`, tag.label, tagPage(tagId, entries, TAGS));
  }
  add('/search/', '검색', `<main class="app-shell app-body" id="main">${searchBox()}<h1 class="app-sr">검색</h1><div data-search-page><div class="app-filter-summary" data-filter-summary></div><div data-full-results><p class="app-empty">검색어를 입력하거나 주제를 선택해 주세요.</p></div>${ui.PageLinks({ label: '검색 페이지', resultPages: true })}</div></main>`);
  for (const [base, size, render] of [['/blog/', PAGE_SIZES.feed, blogFeed], ['/blog/all/', PAGE_SIZES.cards, blogArchive]]) {
    for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / size)); page++) add(page === 1 ? base : `${base}page/${page}/`, 'Blog', render(posts, TAGS, page, { commentConfig, commentTheme }), { type: 'blog' });
  }
  context.redirects = legacyRoutes(documents, fields);
  for (const [old, target] of context.redirects) {
    if (output.has(old) || !output.has(target)) throw new Error(`invalid publication redirect: ${old}`);
    output.set(old, redirectPage(target, origin));
  }
  await writeSite(output, documents, context, scripts);
  return { pages: output.size, documents: documents.length, themeHash: MANIFEST.contentHash };
}

function renderDocuments(documents, options) {
  const md = createMarkdown();
  for (const page of documents) {
    Object.assign(page, renderArticle(md, page, options));
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
  rmSync(OUTPUT, { recursive: true, force: true });
  mkdirSync(OUTPUT, { recursive: true });
  for (const [file, source] of scripts) {
    writeFileSync(join(OUTPUT, file), source);
  }
  const index = { entries: documents.map(page => ({ ...searchEntry(page, TAGS), iconUrl: iconUrl(page.contentIcon), example: !!page.example })), tags: TAGS };
  const assets = new Map([...context.identity.assets, ...publicationAssets(output, index.entries, path => context.identity.assets.get(path) ?? context.math.assets.get(path) ?? (path === '/theme/tokens.css' ? Buffer.from(styles.theme) : path === stylePath ? Buffer.from(styles.css) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  for (const [path, content] of context.diagrams) assets.set(path, content);
  for (const [path, content] of assets) {
    const destination = join(OUTPUT, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  for (const [route, html] of output) {
    const destination = join(OUTPUT, route, 'index.html');
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, html);
  }
  const indexJson = JSON.stringify(index);
  writeFileSync(join(OUTPUT, 'search-version.json'), JSON.stringify({ revision: digest(indexJson) }));
  writeFileSync(join(OUTPUT, 'search-index.json'), indexJson);
  writeFileSync(join(OUTPUT, 'search-index.json.gz'), gzipSync(indexJson, { level: 9 }));
  mkdirSync(join(OUTPUT, 'blog'), { recursive: true });
  const posts = blogDocuments(documents).filter(page => !page.example);
  writeFileSync(join(OUTPUT, 'blog/feed.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(CONFIG.name)}</title><link>${escape(context.origin + '/blog/')}</link><description>${escape(CONFIG.description)}</description>${posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(context.origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`);
  writeFileSync(join(OUTPUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => route !== '/search/' && !context.redirects.has(route)).map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  validateOutput(output);
  writeFileSync(join(OUTPUT, 'build-report.json'), JSON.stringify({ pages: output.size, documents: documents.length, examples: documents.filter(page => page.example).length, preview: context.preview, commentsStatus: context.commentsStatus, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(styles.css), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  writeFileSync(join(OUTPUT, 'robots.txt'), context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
}

function validateOutput(output) {
  for (const [route, html] of output) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) throw new Error(`duplicate HTML id: ${route}`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!url.startsWith('/') && !url.startsWith('#')) continue;
      const [path, fragment] = url.split('#');
      const target = path.split('?')[0] || route;
      if (!output.has(target) && !existsSync(join(OUTPUT, target))) throw new Error(`broken link: ${route} -> ${url}`);
      if (fragment && output.has(target) && !output.get(target).includes(`id="${decodeURIComponent(fragment)}"`)) throw new Error(`broken anchor: ${route} -> ${url}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(await buildPublication({ origin: process.env.SITE_ORIGIN ?? '', preview: !process.argv.includes('--production') }));
