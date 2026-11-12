import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';

import { collectPosts, postTags, searchEntry, relatedPosts, keywordRanking } from '../content/posts.js';
import { escape } from '#design/ui/index.js';
import * as ui from '#design/ui/index.js';
import { parseArticle, renderArticle } from '../content/article.js';
import { pageShell, homePage, articlePage, notFoundPage } from '../layouts/page.js';
import { searchListing, blogFeed } from '../layouts/blog.js';
import { commentsSection, commentThemeUrl } from '../layouts/comments.js';
import { readCommentCounts } from './comment-counts.js';
import { brandNames } from '../content/brands.js';
import { serviceTagCatalog, serviceTagInventory } from '../content/services.js';
import { collectAssets } from './assets.js';
import { responsiveImages } from './images.js';
import { writeOutput, NOT_FOUND_FILE } from './output.js';
import { loadHomeContent } from '../content/home.js';
import { bundleScripts } from './scripts.js';
import { mathAssets } from '../document/index.js';
import { compileStyles as compileSiteStyles } from '../design/build/styles.js';
import { THEME_ROOT as THEME, THEME_MANIFEST as MANIFEST } from './theme.js';
import { siteOrigin, siteTitle, SITE_ICON } from './metadata.js';
import { siteIdentity } from './favicons.js';
import { markdownFiles } from '../content/files.js';
import { loadBlogLayout, loadSiteConfig } from '../content/settings.js';
import { loadAdminConfig } from '../admin/config.js';
import { adminPage } from '../admin/page.js';
import { ADMIN_STYLES_VERSION } from '../layouts/page.js';

const ADMIN_ROUTE = '/admin/';
const ADMIN_EDITOR = 'admin-editor.js';
import { sha256 as digest } from '../lib/sha256.js';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const SETTINGS = fileURLToPath(new URL('../../config/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../../dist/site/', import.meta.url));

export async function buildSite({ origin, mode = 'preview', blogRoot = join(CONTENT, 'blog'), outputRoot = OUTPUT } = {}) {
  if (!['preview', 'production'].includes(mode)) throw new Error('invalid build mode');
  const config = loadSiteConfig();
  const knownTags = JSON.parse(readFileSync(join(SETTINGS, 'tags.json')));
  const preview = mode !== 'production';
  origin = siteOrigin(origin ?? (preview ? '' : config.url), preview);
  const posts = collectPosts(markdownFiles(blogRoot).map(file => readFileSync(file, 'utf8')));
  const tags = postTags(posts, knownTags);
  const layout = loadBlogLayout(config);
  const tagLabels = new Set(Object.values(tags).map(tag => tag.label.normalize('NFC').toLowerCase()));
  const recommendations = keywordRanking(posts, knownTags).filter(item => !tagLabels.has(item.keyword.normalize('NFC').toLowerCase())).slice(0, 3);
  layout.search.box.suggestions = recommendations.map(item => item.keyword);
  const comments = readCommentCounts(posts, config);
  for (const post of posts) {
    post.commentCount = comments.counts.get(post.id);
    post.related = relatedPosts(post, posts);
  }
  const parsed = new Map();
  for (const page of posts) {
    const document = await parseArticle(page);
    parsed.set(page.id, document);
  }
  await renderDocuments(posts, { parsed });
  const scripts = bundleScripts();
  const identity = siteIdentity(readFileSync(join(THEME, SITE_ICON.slice('/theme/'.length))));
  const context = { config, layout, tags, knownTags, recommendations, origin, preview, mode, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
  const admin = loadAdminConfig(config);
  if (admin) context.admin = { ...admin, author: layout.blog.card.author };
  context.home = loadHomeContent(brandNames(), CONTENT, { preview });
  context.services = serviceTagCatalog(knownTags);
  const output = new Map();
  context.hiddenRoutes = new Set();
  const add = (route, title, body, metadata = {}) => {
    if (output.has(route)) throw new Error(`duplicate route: ${route}`);
    if (metadata.noindex) context.hiddenRoutes.add(route);
    output.set(route, pageShell({ route, title, ...metadata }, body, context));
  };
  add('/', context.home.find(section => section.type === 'hero')?.title ?? siteTitle(config), homePage(context));
  add('/search/', layout.search.title, searchListing(posts, tags, { layout }), { description: `${config.name}의 글을 검색어와 태그로 찾습니다.` });
  const commentTheme = commentThemeUrl(config, { origin, themeHash: MANIFEST.contentHash });
  const commentConfig = { ...config.comments, repo: config.repository };
  for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / layout.blog.feedSize)); page++) {
    add(page === 1 ? '/blog/' : `/blog/page/${page}/`, page === 1 ? layout.blog.title : `${layout.blog.title} ${page}쪽`, blogFeed(posts, tags, page, { commentConfig, commentTheme, layout }), { description: `${config.name}의 글을 최신순으로 이어 읽습니다.` });
  }
  for (const page of posts) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  if (context.admin) add('/admin/', '로그인', adminPage(config, context, context.admin), { noindex: true, bare: true });
  const notFound = pageShell({ route: NOT_FOUND_FILE, title: '페이지를 찾을 수 없습니다', description: '요청한 주소의 페이지가 없습니다. 홈, 블로그, 검색으로 이동할 수 있습니다.', noindex: true }, notFoundPage(), context);
  await writeSite(output, posts, context, scripts, notFound, outputRoot);
  return { pages: output.size, documents: posts.length, themeHash: MANIFEST.contentHash };
}

export const assetLinks = html => html.replace(/(href|src)="(?:\.\.\/)?assets\/([^"?#]+)"/g, '$1="/assets/$2"');

export function firstImage(html) {
  const tag = /<img\s[^>]*src="(\/(?:assets|media)\/[^"]+)"[^>]*>/.exec(html);
  if (!tag) return undefined;
  const decode = value => value.replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&#39;', "'").replaceAll('&amp;', '&');
  return { src: decode(tag[1]), alt: decode(/\salt="([^"]*)"/.exec(tag[0])?.[1] ?? ''), position: { x: 0, y: 0 } };
}

async function renderDocuments(documents, options) {
  for (const page of documents) {
    Object.assign(page, await renderArticle(page, { ...options, document: options.parsed.get(page.id) }));
  }
  const bySlug = new Map(documents.map(page => [page.slug, page]));
  for (const page of documents) {
    const rewrite = html => html.replace(/href="\/blog\/([^/"]+)\/#([^"?]+)"/g, (original, slug, fragment) => {
      const target = bySlug.get(slug);
      if (!target || (target.leadHtml + target.html).includes(`id="${decodeURIComponent(fragment)}"`)) return original;
      const id = `${target.id}-${decodeURIComponent(fragment)}`;
      return (target.leadHtml + target.html).includes(`id="${id}"`) ? `href="${target.route}#${id}"` : original;
    }).replace(/href="#([^" ]+)"/g, (original, fragment) => {
      if ((page.leadHtml + page.html).includes(`id="${fragment}"`)) return original;
      const prefixed = `${page.id}-${decodeURIComponent(fragment)}`;
      return (page.leadHtml + page.html).includes(`id="${prefixed}"`) ? `href="#${prefixed}"` : original;
    });
    page.leadHtml = rewrite(assetLinks(page.leadHtml));
    page.html = rewrite(assetLinks(page.html));
    page.cardImage = page.thumbnail ?? firstImage(page.html);
  }
}

async function writeSite(output, posts, context, scripts, notFound, outputRoot) {
  const rendered = new Map([...output, [NOT_FOUND_FILE, notFound]]);
  const sourceStyles = readFileSync(join(THEME, 'styles.css'), 'utf8');
  const theme = readFileSync(join(THEME, 'tokens.css'), 'utf8');
  const full = await compileSiteStyles(sourceStyles, rendered, scripts, theme);
  const styles = context.admin
    ? await compileSiteStyles(sourceStyles, new Map([...rendered].filter(([route]) => route !== ADMIN_ROUTE)), new Map([...scripts].filter(([file]) => file !== ADMIN_EDITOR)), theme)
    : full;
  const publicSheet = styles.theme + styles.css;
  const adminSheet = full.theme + full.css;
  const stylePath = '/theme/site.css';
  const styleHash = digest(publicSheet);
  const adminStylePath = '/theme/admin.css';
  const adminStyleHash = digest(adminSheet);
  const tokensLink = `<link rel="stylesheet" href="/theme/tokens.css?v=${context.themeHash}">`;
  for (const [route, html] of rendered) {
    const sheet = route === ADMIN_ROUTE ? `${adminStylePath}?v=${adminStyleHash}` : `${stylePath}?v=${styleHash}`;
    rendered.set(route, html.replace(tokensLink, '').replace(`/theme/styles.css?v=${context.themeHash}`, sheet).replaceAll(ADMIN_STYLES_VERSION, adminStyleHash));
  }
  for (const route of output.keys()) output.set(route, rendered.get(route));
  const files = new Map([...scripts].map(([file, source]) => [`/${file}`, source]));
  const index = { entries: posts.map(page => searchEntry(page, context.knownTags)), tags: context.tags };
  const assets = new Map([...context.identity.assets, ...collectAssets(rendered, index.entries, path => context.identity.assets.get(path) ?? context.math.assets.get(path) ?? (path === stylePath ? Buffer.from(publicSheet) : path === adminStylePath ? Buffer.from(adminSheet) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  const avatar = context.admin?.author?.avatar;
  if (avatar?.startsWith('/assets/') && !assets.has(avatar)) assets.set(avatar, readFileSync(join(CONTENT, avatar)));
  await responsiveImages(rendered, assets, index.entries);
  for (const route of output.keys()) output.set(route, rendered.get(route));
  for (const [path, content] of assets) files.set(path, content);
  const indexJson = JSON.stringify(index);
  files.set('/service-tags.json', JSON.stringify({ version: 1, services: serviceTagInventory(context.services, context.tags, context.home) }, null, 2));
  files.set('/search-version.json', JSON.stringify({ revision: digest(indexJson) }));
  files.set('/search-index.json', indexJson);
  files.set('/search-index.json.gz', gzipSync(indexJson, { level: 9 }));
  files.set('/blog/feed.xml', blogFeedXml(posts, { title: siteTitle(context.config), description: context.config.description, origin: context.origin }));
  const modified = new Map(posts.map(page => [page.route, page.updatedAt ?? page.publishedAt]));
  files.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => !context.hiddenRoutes.has(route)).map(route => `<url><loc>${escape(context.origin + route)}</loc>${modified.get(route) ? `<lastmod>${modified.get(route)}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  files.set('/build-report.json', JSON.stringify({ pages: output.size, documents: posts.length, examples: posts.filter(page => page.example).length, preview: context.preview, mode: context.mode, commentsStatus: context.commentsStatus, recommendations: context.recommendations, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(publicSheet), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  files.set(NOT_FOUND_FILE, rendered.get(NOT_FOUND_FILE));
  files.set('/robots.txt', context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\n${[...context.hiddenRoutes].map(route => `Disallow: ${route}\n`).join('')}Allow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
  writeOutput(outputRoot, output, files);
}

export function blogFeedXml(posts, { title, description, origin }) {
  const items = posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('');
  const updated = posts.map(page => page.updatedAt ?? page.publishedAt).sort().at(-1);
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(title)}</title><link>${escape(origin + '/blog/')}</link><atom:link href="${escape(origin + '/blog/feed.xml')}" rel="self" type="application/rss+xml"/><description>${escape(description)}</description><language>ko</language>${updated ? `<lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>` : ''}${items}</channel></rss>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { production: { type: 'boolean', default: false } } });
  const mode = values.production ? 'production' : 'preview';
  console.log(await buildSite({ origin: process.env.SITE_ORIGIN, mode }));
}
