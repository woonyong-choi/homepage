// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { collectPosts, postTags, searchEntry, relatedPosts } from './blog-model.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { parseArticle, renderArticle } from './article-renderer.mjs';
import { documentShell, personalHome, articlePage, notFoundPage } from './publication-layout.mjs';
import { searchListing, blogFeed } from './blog-layout.mjs';
import { commentsSection, commentThemeUrl } from './comments.mjs';
import { readCommentCounts } from './comment-counts.mjs';
import { brandNames } from './brand-icons.mjs';
import { publicationAssets, normalizePublicationAssets } from './publication-assets.mjs';
import { replacePublication, NOT_FOUND_FILE } from './publication-output.mjs';
import { loadHomeContent } from './home-content.mjs';
import { browserScripts } from './browser-scripts.mjs';
import { mathAssets } from 'document-engine';
import { compileDiagrams } from './diagrams.mjs';
import { compileStyles as publicationStyles } from '@woonyong-choi/design-tokens/ui/build/styles.mjs';
import { THEME_ROOT as THEME, THEME_MANIFEST as MANIFEST } from './design-package.mjs';
import { siteOrigin, siteTitle, SITE_ICON } from './publication-metadata.mjs';
import { siteIdentity } from './site-identity.mjs';
import { markdownFiles } from './content-files.mjs';
import { loadBlogLayout } from './layout-config.mjs';
import { verifyApprovedContent } from './approved-content.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const CONTENT = fileURLToPath(new URL('../content/', import.meta.url));
const SETTINGS = fileURLToPath(new URL('../config/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../dist/site/', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');

export async function buildPublication({ origin = '', mode = 'approved-preview' } = {}) {
  if (!['demo', 'approved-preview', 'production'].includes(mode)) throw new Error('invalid publication mode');
  const approved = verifyApprovedContent();
  const config = JSON.parse(readFileSync(join(SETTINGS, 'site.json')));
  const knownTags = JSON.parse(readFileSync(join(SETTINGS, 'tags.json')));
  if (mode !== 'demo' && Object.keys(approved).some(path => path.startsWith('content/docs/'))) throw new Error('legacy wiki content requires explicit blog migration approval');
  const preview = mode !== 'production';
  origin = siteOrigin(origin, preview);
  const root = mode === 'demo' ? join(ROOT, 'fixtures/blog-demo') : join(CONTENT, 'blog');
  const posts = collectPosts(markdownFiles(root).map(file => readFileSync(file, 'utf8')), { includeExamples: mode === 'demo' });
  if (mode === 'demo' && posts.some(post => !post.example)) throw new Error('demo posts must be examples');
  const documents = posts;
  const tags = postTags(posts, knownTags);
  const layout = loadBlogLayout();
  const comments = readCommentCounts(posts, config);
  for (const post of posts) {
    post.commentCount = post.example && !post.comments ? 0 : comments.counts.get(post.id);
    post.related = relatedPosts(post, posts);
  }
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
  const context = { config, layout, tags, origin, preview, mode, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
  context.diagrams = diagrams.assets;
  context.home = loadHomeContent(brandNames(), CONTENT, { preview });
  const output = new Map();
  const add = (route, title, body, metadata = {}) => {
    if (output.has(route)) throw new Error(`duplicate publication route: ${route}`);
    output.set(route, documentShell({ route, title, ...metadata }, body, context));
  };
  add('/', context.home.find(section => section.type === 'hero')?.title ?? siteTitle(config), personalHome(context));
  add('/search/', layout.search.title, searchListing(posts, tags, { layout, demo: mode === 'demo' }));
  const commentTheme = commentThemeUrl(config, { origin, themeHash: MANIFEST.contentHash });
  const commentConfig = { ...config.comments, repo: config.repository };
  for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / layout.blog.feedSize)); page++) {
    add(page === 1 ? '/blog/' : `/blog/page/${page}/`, layout.blog.title, blogFeed(posts, tags, page, { commentConfig, commentTheme, layout }));
  }
  for (const page of posts) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  const notFound = documentShell({ route: NOT_FOUND_FILE, title: '페이지를 찾을 수 없습니다', noindex: true }, notFoundPage(), context);
  await writeSite(output, documents, context, scripts, notFound);
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
    }).replace(/href="#([^" ]+)"/g, (original, fragment) => {
      if ((page.leadHtml + page.html).includes(`id="${fragment}"`)) return original;
      const prefixed = `${page.id}-${decodeURIComponent(fragment)}`;
      return (page.leadHtml + page.html).includes(`id="${prefixed}"`) ? `href="#${prefixed}"` : original;
    });
    page.leadHtml = normalizePublicationAssets(rewrite(page.leadHtml));
    page.html = normalizePublicationAssets(rewrite(page.html));
  }
}

async function writeSite(output, documents, context, scripts, notFound) {
  // 404 문서는 경로가 아닌 파일로 싣지만 스타일 선별과 자산 수집에는 다른 페이지처럼 포함한다.
  const rendered = new Map([...output, [NOT_FOUND_FILE, notFound]]);
  const sourceStyles = readFileSync(join(THEME, 'styles.css'), 'utf8');
  const styles = await publicationStyles(sourceStyles, rendered, scripts, readFileSync(join(THEME, 'tokens.css'), 'utf8'));
  const stylePath = '/theme/publication.css';
  const styleHash = digest(styles.css);
  for (const [route, html] of rendered) {
    rendered.set(route, html.replace(`/theme/styles.css?v=${context.themeHash}`, `${stylePath}?v=${styleHash}`));
  }
  for (const route of output.keys()) output.set(route, rendered.get(route));
  const files = new Map([...scripts].map(([file, source]) => [`/${file}`, source]));
  const index = { entries: documents.map(page => searchEntry(page, context.tags)), tags: context.tags };
  const assets = new Map([...context.identity.assets, ...publicationAssets(rendered, index.entries, path => context.identity.assets.get(path) ?? context.math.assets.get(path) ?? (path === '/theme/tokens.css' ? Buffer.from(styles.theme) : path === stylePath ? Buffer.from(styles.css) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  for (const [path, content] of context.diagrams) assets.set(path, content);
  for (const [path, content] of assets) files.set(path, content);
  const indexJson = JSON.stringify(index);
  files.set('/search-version.json', JSON.stringify({ revision: digest(indexJson) }));
  files.set('/search-index.json', indexJson);
  files.set('/search-index.json.gz', gzipSync(indexJson, { level: 9 }));
  const posts = documents.filter(page => !page.example);
  files.set('/blog/feed.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(siteTitle(context.config))}</title><link>${escape(context.origin + '/blog/')}</link><description>${escape(context.config.description)}</description>${posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(context.origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('')}</channel></rss>`);
  files.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  files.set('/build-report.json', JSON.stringify({ pages: output.size, documents: documents.length, examples: documents.filter(page => page.example).length, preview: context.preview, mode: context.mode, commentsStatus: context.commentsStatus, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(styles.css), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  files.set(NOT_FOUND_FILE, rendered.get(NOT_FOUND_FILE));
  files.set('/robots.txt', context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
  replacePublication(OUTPUT, output, files);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--demo') && process.argv.includes('--production')) throw new Error('demo and production modes cannot be combined');
  const mode = process.argv.includes('--demo') ? 'demo' : process.argv.includes('--production') ? 'production' : 'approved-preview';
  console.log(await buildPublication({ origin: process.env.SITE_ORIGIN ?? '', mode }));
}
