// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';

import { collectPosts, postTags, searchEntry, relatedPosts, keywordRanking } from './blog-model.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { parseArticle, renderArticle } from './article-renderer.mjs';
import { documentShell, personalHome, articlePage, notFoundPage } from './publication-layout.mjs';
import { searchListing, blogFeed } from './blog-layout.mjs';
import { commentsSection, commentThemeUrl } from './comments.mjs';
import { readCommentCounts } from './comment-counts.mjs';
import { brandNames } from './brand-icons.mjs';
import { serviceTagCatalog, serviceTagInventory } from './service-tags.mjs';
import { publicationAssets } from './publication-assets.mjs';
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
import { loadAdminConfig } from './admin-config.mjs';
import { adminPage } from './admin-layout.mjs';
import { verifyApprovedContent } from './approved-content.mjs';
import { sha256 as digest } from './sha256.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const CONTENT = fileURLToPath(new URL('../content/', import.meta.url));
const SETTINGS = fileURLToPath(new URL('../config/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../dist/site/', import.meta.url));

// blogRoot·outputRoot는 통합 검사가 승인 사본 대신 임시 입력과 출력 위치를 주입하는 지점이다.
export async function buildPublication({ origin = '', mode = 'approved-preview', blogRoot = join(CONTENT, 'blog'), outputRoot = OUTPUT } = {}) {
  if (!['approved-preview', 'production'].includes(mode)) throw new Error('invalid publication mode');
  const approved = verifyApprovedContent();
  const config = JSON.parse(readFileSync(join(SETTINGS, 'site.json')));
  const knownTags = JSON.parse(readFileSync(join(SETTINGS, 'tags.json')));
  if (Object.keys(approved).some(path => path.startsWith('content/docs/'))) throw new Error('legacy wiki content requires explicit blog migration approval');
  const preview = mode !== 'production';
  origin = siteOrigin(origin, preview);
  const posts = collectPosts(markdownFiles(blogRoot).map(file => readFileSync(file, 'utf8')));
  const tags = postTags(posts, knownTags);
  const layout = loadBlogLayout();
  const recommendations = keywordRanking(posts, knownTags).slice(0, 3);
  layout.search.box.suggestions = recommendations.map(item => item.keyword);
  const comments = readCommentCounts(posts, config);
  for (const post of posts) {
    post.commentCount = comments.counts.get(post.id);
    post.related = relatedPosts(post, posts);
  }
  const diagramSources = new Map();
  const parsed = new Map();
  for (const page of posts) {
    const document = await parseArticle(page);
    parsed.set(page.id, document);
    for (const diagram of document.metadata.diagrams) diagramSources.set(diagram.source, page.id);
  }
  const diagrams = await compileDiagrams(diagramSources);
  await renderDocuments(posts, { diagrams: diagrams.diagrams, parsed });
  const scripts = browserScripts(ROOT);
  const identity = siteIdentity(readFileSync(join(THEME, SITE_ICON.slice('/theme/'.length))));
  const context = { config, layout, tags, knownTags, recommendations, origin, preview, mode, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
  context.diagrams = diagrams.assets;
  const admin = loadAdminConfig();
  if (admin) context.admin = { ...admin, author: layout.blog.card.author };
  context.home = loadHomeContent(brandNames(), CONTENT, { preview });
  context.services = serviceTagCatalog(knownTags);
  const output = new Map();
  context.hiddenRoutes = new Set();
  const add = (route, title, body, metadata = {}) => {
    if (output.has(route)) throw new Error(`duplicate publication route: ${route}`);
    if (metadata.noindex) context.hiddenRoutes.add(route);
    output.set(route, documentShell({ route, title, ...metadata }, body, context));
  };
  add('/', context.home.find(section => section.type === 'hero')?.title ?? siteTitle(config), personalHome(context));
  add('/search/', layout.search.title, searchListing(posts, tags, { layout }));
  const commentTheme = commentThemeUrl(config, { origin, themeHash: MANIFEST.contentHash });
  const commentConfig = { ...config.comments, repo: config.repository };
  for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / layout.blog.feedSize)); page++) {
    add(page === 1 ? '/blog/' : `/blog/page/${page}/`, layout.blog.title, blogFeed(posts, tags, page, { commentConfig, commentTheme, layout }));
  }
  for (const page of posts) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  // 관리자 로그인 화면은 설정이 있을 때만 만들고 검색 엔진과 사이트맵에서 뺀다.
  if (context.admin) add('/admin/', '로그인', adminPage(config, context, context.admin), { noindex: true, bare: true });
  const notFound = documentShell({ route: NOT_FOUND_FILE, title: '페이지를 찾을 수 없습니다', noindex: true }, notFoundPage(), context);
  await writeSite(output, posts, context, scripts, notFound, outputRoot);
  return { pages: output.size, documents: posts.length, themeHash: MANIFEST.contentHash };
}

// Vault 원고는 publish/ 기준 상대 주소(../assets/파일)로 그림과 첨부를 가리킨다. 문서 엔진은 이 주소를 그대로 두므로
// /blog/<slug>/·/blog/page/2/ 같은 경로에서 깨지지 않게 같은 공개 자산 주소(/assets/파일)로 맞춘다.
export const assetLinks = html => html.replace(/(href|src)="(?:\.\.\/)?assets\/([^"?#]+)"/g, '$1="/assets/$2"');

// 대표 이미지를 지정하지 않은 글은 본문의 첫 공개 그림을 목록 카드에만 쓴다. 글 머리 표지로는 쓰지 않는다.
// 화면 캡처는 왼쪽 위에서 내용이 시작하므로 그 지점을 기준으로 자른다.
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
    page.leadHtml = rewrite(assetLinks(page.leadHtml));
    page.html = rewrite(assetLinks(page.html));
    page.cardImage = page.thumbnail ?? firstImage(page.html);
  }
}

async function writeSite(output, posts, context, scripts, notFound, outputRoot) {
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
  const index = { entries: posts.map(page => searchEntry(page, context.knownTags)), tags: context.tags };
  const assets = new Map([...context.identity.assets, ...publicationAssets(rendered, index.entries, path => context.identity.assets.get(path) ?? context.math.assets.get(path) ?? (path === '/theme/tokens.css' ? Buffer.from(styles.theme) : path === stylePath ? Buffer.from(styles.css) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  for (const [path, content] of context.diagrams) assets.set(path, content);
  // 글 관리의 미리보기는 글이 없어도 글쓴이 사진을 쓴다.
  const avatar = context.admin?.author?.avatar;
  if (avatar?.startsWith('/assets/') && !assets.has(avatar)) assets.set(avatar, readFileSync(join(CONTENT, avatar)));
  for (const [path, content] of assets) files.set(path, content);
  const indexJson = JSON.stringify(index);
  files.set('/service-tags.json', JSON.stringify({ version: 1, services: serviceTagInventory(context.services, context.tags, context.home) }, null, 2));
  files.set('/search-version.json', JSON.stringify({ revision: digest(indexJson) }));
  files.set('/search-index.json', indexJson);
  files.set('/search-index.json.gz', gzipSync(indexJson, { level: 9 }));
  files.set('/blog/feed.xml', blogFeedXml(posts, { title: siteTitle(context.config), description: context.config.description, origin: context.origin }));
  files.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => !context.hiddenRoutes.has(route)).map(route => `<url><loc>${escape(context.origin + route)}</loc></url>`).join('')}</urlset>`);
  files.set('/build-report.json', JSON.stringify({ pages: output.size, documents: posts.length, examples: posts.filter(page => page.example).length, preview: context.preview, mode: context.mode, commentsStatus: context.commentsStatus, recommendations: context.recommendations, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(styles.css), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  files.set(NOT_FOUND_FILE, rendered.get(NOT_FOUND_FILE));
  files.set('/robots.txt', context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\n${[...context.hiddenRoutes].map(route => `Disallow: ${route}\n`).join('')}Allow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
  replacePublication(outputRoot, output, files);
}

export function blogFeedXml(posts, { title, description, origin }) {
  const items = posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(title)}</title><link>${escape(origin + '/blog/')}</link><description>${escape(description)}</description>${items}</channel></rss>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // --blog-root: 글 원본 폴더. 배포는 비공개 Vault의 publish 폴더를 넘겨 공개 글만 싣는다.
  const { values } = parseArgs({ options: { production: { type: 'boolean', default: false }, 'blog-root': { type: 'string' } } });
  const mode = values.production ? 'production' : 'approved-preview';
  console.log(await buildPublication({ origin: process.env.SITE_ORIGIN ?? '', mode, ...(values['blog-root'] ? { blogRoot: resolve(values['blog-root']) } : {}) }));
}
