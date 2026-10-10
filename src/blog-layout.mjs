// 같은 발행 글을 네 편 미리보기, 카드 목록, 네 편 본문 피드로 보여준다.
import * as ui from './vendor/theme/ui/index.mjs';
import { dateLine, searchBox, tagLinks } from './publication-layout.mjs';
import { PAGE_SIZES, paginate } from './content-model.mjs';
import { postArticle, thumbnailImage } from './post-article.mjs';
import { commentsSection } from './comments.mjs';

export function blogCard(page, tags = {}, level = 3) {
  const cover = thumbnailImage(page);
  const dateLabel = page.publishedAt ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(page.publishedAt)) : undefined;
  return String(ui.BlogCard({ href: page.route, title: page.title, level, cover: ui.trusted(cover), description: page.description, tagItems: (page.tags ?? []).map(id => ({ href: `/tags/${id}/`, label: tags[id]?.label ?? id })), publishedAt: page.publishedAt, dateLabel, commentsHref: page.comments ? `${page.route}#comments` : undefined, commentCount: page.commentCount }));
}

export function recentBlog(posts, tags) {
  if (!posts.length) return '';
  const cards = posts.slice(0, PAGE_SIZES.preview).map(page => ui.trusted(blogCard(page, tags)));
  return `<section class="app-knowledge-section app-support-group"><h2 class="app-page-heading">Blog</h2>${ui.CardGroup({ columns: 2, cards })}${posts.length > PAGE_SIZES.preview ? `<p>${ui.NavigationLink({ href: '/blog/all/', text: '전체 보기' })}</p>` : ''}</section>`;
}

export function blogArchive(posts, tags, page) {
  const result = paginate(posts, page, PAGE_SIZES.cards);
  return `<main id="main" class="app-shell">${searchBox({ large: true })}${ui.CollectionHeader({ title: '모든 글', backHref: '/docs/', backLabel: '돌아가기', action: { href: '/blog/', label: '본문 이어 읽기' } })}${posts.length ? `<div data-blog-list>${ui.CardGroup({ columns: 3, cards: result.items.map(post => ui.trusted(blogCard(post, tags, 2))) })}${pagination(result, '/blog/all/')}<p class="app-caption" data-blog-status role="status"></p></div>` : emptyBlog()}</main>`;
}

export function blogFeed(posts, tags, page, { commentConfig, commentTheme } = {}) {
  const result = paginate(posts, page, PAGE_SIZES.feed);
  const returnRoute = result.page === 1 ? '/blog/' : `/blog/page/${result.page}/`;
  return `<main id="main"><h1 class="app-sr">Blog</h1>${posts.length ? `<div data-blog-list="feed"><div class="app-blog-feed-items">${result.items.map(post => feedArticle(post, tags, commentConfig, commentTheme, returnRoute)).join('')}</div><div class="app-shell">${pagination(result, '/blog/', true)}<p class="app-caption" data-blog-status role="status"></p></div></div>` : `<div class="app-shell">${emptyBlog()}</div>`}${posts.length ? `<div class="app-shell">${ui.ListLink({ href: '/blog/all/', text: '전체 글 보기' })}</div>` : ''}</main>`;
}

export function pagination(result, route, feed = false) {
  if (result.totalPages <= 1) return '';
  const href = page => page === 1 ? route : `${route}page/${page}/`;
  const before = result.page > 1 ? { href: href(result.page - 1), text: `← ${feed ? '최신 글' : '이전'}` } : undefined;
  const after = result.page < result.totalPages ? { href: href(result.page + 1), text: `${feed ? '이전 글' : '다음'} →` } : undefined;
  const numbers = Array.from({ length: result.totalPages }, (_, i) => ({ page: i + 1, href: href(i + 1), current: i + 1 === result.page }));
  return String(ui.PageLinks({ label: '블로그 페이지', before, after, numbers, summary: feed ? `${result.page} / ${result.totalPages}` : undefined }));
}

function feedArticle(post, tags, commentConfig, commentTheme, returnRoute) {
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt ? dateLine({ updatedAt: post.updatedAt }) : '';
  const comments = commentsSection(post, commentConfig, commentTheme, { preview: true, returnRoute });
  return `<div class="app-blog-slice"><div class="app-shell">${postArticle(post, { tags: tagLinks(post, tags), footer: updated, after: comments })}</div></div>`;
}

function emptyBlog() {
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/docs/">문서에서 기록 읽기</a></p>';
}
