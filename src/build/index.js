// 공개 입력을 정적 페이지와 검색 색인으로 만들며 깨진 내부 연결을 차단한다.
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';

import { collectPosts, postTags, searchEntry, relatedPosts, keywordRanking } from '../content/posts.js';
import { escape } from '#design/ui/index.js';
import * as ui from '#design/ui/index.js';
import { parseArticle, renderArticle } from '../content/article.js';
import { documentShell, personalHome, articlePage, notFoundPage } from '../layouts/page.js';
import { searchListing, blogFeed } from '../layouts/blog.js';
import { commentsSection, commentThemeUrl } from '../layouts/comments.js';
import { readCommentCounts } from './comment-counts.js';
import { brandNames } from '../content/brands.js';
import { serviceTagCatalog, serviceTagInventory } from '../content/services.js';
import { publicationAssets } from './assets.js';
import { responsiveImages } from './images.js';
import { replacePublication, NOT_FOUND_FILE } from './output.js';
import { loadHomeContent } from '../content/home.js';
import { browserScripts } from './scripts.js';
import { mathAssets } from '../document/index.js';
import { compileStyles as publicationStyles } from '../design/build/styles.js';
import { THEME_ROOT as THEME, THEME_MANIFEST as MANIFEST } from './theme.js';
import { siteOrigin, siteTitle, SITE_ICON } from './metadata.js';
import { siteIdentity } from './favicons.js';
import { markdownFiles } from '../content/files.js';
import { loadBlogLayout } from '../content/settings.js';
import { loadAdminConfig } from '../admin/config.js';
import { adminPage } from '../admin/page.js';
import { ADMIN_STYLES_VERSION } from '../layouts/page.js';

const ADMIN_ROUTE = '/admin/';
const ADMIN_EDITOR = 'admin-editor.js';
import { verifyApprovedContent } from '../vault/approved.js';
import { sha256 as digest } from '../lib/sha256.js';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const SETTINGS = fileURLToPath(new URL('../../config/', import.meta.url));
const OUTPUT = fileURLToPath(new URL('../../dist/site/', import.meta.url));

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
  const parsed = new Map();
  for (const page of posts) {
    const document = await parseArticle(page);
    parsed.set(page.id, document);
  }
  await renderDocuments(posts, { parsed });
  const scripts = browserScripts();
  const identity = siteIdentity(readFileSync(join(THEME, SITE_ICON.slice('/theme/'.length))));
  const context = { config, layout, tags, knownTags, recommendations, origin, preview, mode, identity, commentsStatus: comments.status, themeHash: MANIFEST.contentHash, scriptHash: digest([...scripts.values()].join('\n')), math: mathAssets() };
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
  // 목록 페이지도 검색 결과와 공유 카드에 페이지 성격에 맞는 설명을 쓴다. 쪽 번호가 있는 피드는 제목에 쪽을 붙여 제목이 겹치지 않게 한다.
  add('/search/', layout.search.title, searchListing(posts, tags, { layout }), { description: `${config.name}의 글을 검색어와 태그로 찾습니다.` });
  const commentTheme = commentThemeUrl(config, { origin, themeHash: MANIFEST.contentHash });
  const commentConfig = { ...config.comments, repo: config.repository };
  for (let page = 1; page <= Math.max(1, Math.ceil(posts.length / layout.blog.feedSize)); page++) {
    add(page === 1 ? '/blog/' : `/blog/page/${page}/`, page === 1 ? layout.blog.title : `${layout.blog.title} ${page}쪽`, blogFeed(posts, tags, page, { commentConfig, commentTheme, layout }), { description: `${config.name}의 글을 최신순으로 이어 읽습니다.` });
  }
  for (const page of posts) add(page.route, page.title, articlePage(page, context, commentsSection(page, commentConfig, commentTheme)), page);
  // 관리자 로그인 화면은 설정이 있을 때만 만들고 검색 엔진과 사이트맵에서 뺀다.
  if (context.admin) add('/admin/', '로그인', adminPage(config, context, context.admin), { noindex: true, bare: true });
  const notFound = documentShell({ route: NOT_FOUND_FILE, title: '페이지를 찾을 수 없습니다', description: '요청한 주소의 페이지가 없습니다. 홈, 블로그, 검색으로 이동할 수 있습니다.', noindex: true }, notFoundPage(), context);
  await writeSite(output, posts, context, scripts, notFound, outputRoot);
  return { pages: output.size, documents: posts.length, themeHash: MANIFEST.contentHash };
}

// Vault 원고는 publish/ 기준 상대 주소(../assets/파일)로 그림과 첨부를 가리킨다. 문서 렌더러는 이 주소를 그대로 두므로
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
    // 다른 글의 절로 가는 링크는 렌더러가 글 ID를 붙인 제목 ID로 맞춘다.
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
  // 404 문서는 경로가 아닌 파일로 싣지만 스타일 선별과 자산 수집에는 다른 페이지처럼 포함한다.
  const rendered = new Map([...output, [NOT_FOUND_FILE, notFound]]);
  const sourceStyles = readFileSync(join(THEME, 'styles.css'), 'utf8');
  const theme = readFileSync(join(THEME, 'tokens.css'), 'utf8');
  // 관리 화면 스타일(작성·출간 화면)은 관리자만 쓰므로 공개 CSS에서 빼고 관리 CSS로 따로 싣는다.
  // 관리 CSS는 전체 페이지와 스크립트 기준이라 공개 CSS를 모두 포함하고, 관리 로더가 로그인한 뒤에만 불러온다.
  const full = await publicationStyles(sourceStyles, rendered, scripts, theme);
  const styles = context.admin
    ? await publicationStyles(sourceStyles, new Map([...rendered].filter(([route]) => route !== ADMIN_ROUTE)), new Map([...scripts].filter(([file]) => file !== ADMIN_EDITOR)), theme)
    : full;
  // 토큰과 스타일을 한 파일로 합쳐 첫 화면을 막는 CSS 요청을 하나로 줄인다. 공개 CSS는 공개 페이지가 쓰는 토큰만 담는다.
  const publicSheet = styles.theme + styles.css;
  const adminSheet = full.theme + full.css;
  const stylePath = '/theme/publication.css';
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
  const assets = new Map([...context.identity.assets, ...publicationAssets(rendered, index.entries, path => context.identity.assets.get(path) ?? context.math.assets.get(path) ?? (path === stylePath ? Buffer.from(publicSheet) : path === adminStylePath ? Buffer.from(adminSheet) : readFileSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(CONTENT, path))))]);
  // 글 관리의 미리보기는 글이 없어도 글쓴이 사진을 쓴다.
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
  // 글 주소에는 마지막 수정일(없으면 발행일)을 적어 검색 엔진이 바뀐 글만 다시 읽게 한다.
  const modified = new Map(posts.map(page => [page.route, page.updatedAt ?? page.publishedAt]));
  files.set('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...output.keys()].filter(route => !context.hiddenRoutes.has(route)).map(route => `<url><loc>${escape(context.origin + route)}</loc>${modified.get(route) ? `<lastmod>${modified.get(route)}</lastmod>` : ''}</url>`).join('')}</urlset>`);
  files.set('/build-report.json', JSON.stringify({ pages: output.size, documents: posts.length, examples: posts.filter(page => page.example).length, preview: context.preview, mode: context.mode, commentsStatus: context.commentsStatus, recommendations: context.recommendations, themeHash: context.themeHash, styles: { sourceBytes: Buffer.byteLength(sourceStyles), bytes: Buffer.byteLength(publicSheet), removedSelectors: styles.removed, hash: styleHash }, assets: { files: assets.size, bytes: [...assets.values()].reduce((sum, content) => sum + content.length, 0) }, routes: [...output.keys()] }, null, 2));
  files.set(NOT_FOUND_FILE, rendered.get(NOT_FOUND_FILE));
  files.set('/robots.txt', context.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\n${[...context.hiddenRoutes].map(route => `Disallow: ${route}\n`).join('')}Allow: /\nSitemap: ${context.origin}/sitemap.xml\n`);
  replacePublication(outputRoot, output, files);
}

export function blogFeedXml(posts, { title, description, origin }) {
  const items = posts.map(page => `<item><title>${escape(page.title)}</title><link>${escape(origin + page.route)}</link><guid isPermaLink="false">${page.id}</guid><pubDate>${new Date(page.publishedAt).toUTCString()}</pubDate><description>${escape(page.description)}</description></item>`).join('');
  // 구독기가 피드 주소와 갱신 시각을 알 수 있게 자기 주소(atom:link)와 마지막 글 날짜를 적는다.
  const updated = posts.map(page => page.updatedAt ?? page.publishedAt).sort().at(-1);
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escape(title)}</title><link>${escape(origin + '/blog/')}</link><atom:link href="${escape(origin + '/blog/feed.xml')}" rel="self" type="application/rss+xml"/><description>${escape(description)}</description><language>ko</language>${updated ? `<lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>` : ''}${items}</channel></rss>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // --blog-root: 글 원본 폴더. 배포는 비공개 Vault의 publish 폴더를 넘겨 공개 글만 싣는다.
  const { values } = parseArgs({ options: { production: { type: 'boolean', default: false }, 'blog-root': { type: 'string' } } });
  const mode = values.production ? 'production' : 'approved-preview';
  console.log(await buildPublication({ origin: process.env.SITE_ORIGIN ?? '', mode, ...(values['blog-root'] ? { blogRoot: resolve(values['blog-root']) } : {}) }));
}
