import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { paginate, dateLabel } from './content-model.mjs';
import { loadBlogLayout } from './layout-config.mjs';
import { dateLine, tagLinks, searchBox } from './publication-layout.mjs';
import { searchUrl } from './search-model.mjs';
import { postArticle, thumbnailImage } from './post-article.mjs';
import { commentsSection } from './comments.mjs';
import { collectionNavigation } from './collection-navigation.mjs';

export function blogCard(post, tags = {}, level = 2, card = loadBlogLayout().blog.card) {
  const cover = card.media === 'image' && post.thumbnail ? ui.trusted(thumbnailImage(post)) : undefined;
  return String(ui.BlogCard({ href: post.route, title: post.title, showTitle: card.title, level, cover, automaticCover: card.media === 'image', description: card.description ? post.description : '', tagItems: (card.tags ? post.tags : []).map(tag => ({ href: searchUrl({ tags: [tag] }), label: tags[tag]?.label ?? tag })), publishedAt: card.date ? post.publishedAt : undefined, dateLabel: dateLabel(post.publishedAt), commentsHref: card.comments && post.comments ? `${post.route}#comments` : undefined, commentCount: card.comments ? post.commentCount : undefined }));
}

export function searchListing(posts, tags, { layout = loadBlogLayout(), demo = false } = {}) {
  const cards = ui.CardGroup({ columns: layout.blog.collection.columns, cards: posts.map(post => ui.trusted(blogCard(post, tags, 2, layout.blog.card))) });
  const filters = ui.TagList({ tags: Object.entries(tags).map(([tag, value]) => ({ href: searchUrl({ tags: [tag] }), label: value.label })) });
  return `<main id="main" class="app-shell">${searchBox({ large: true, combobox: false, config: layout.search.box })}${ui.PageHeading({ title: layout.search.title, icon: ui.ArticleIcon('search') })}${demo ? '<p class="app-caption">화면을 확인하기 위한 합성 예시 글입니다.</p>' : ''}<div data-search-page data-columns="${layout.blog.collection.columns}" data-page-size="${layout.blog.collection.rows === null ? 'all' : layout.blog.collection.columns * layout.blog.collection.rows}" data-card="${ui.escape(JSON.stringify(layout.blog.card))}"><nav aria-label="글 태그" data-blog-tags>${filters}</nav><div class="app-filter-summary" data-filter-summary></div><div data-full-results>${posts.length ? cards : '<p class="app-empty">아직 발행한 글이 없습니다.</p>'}</div>${ui.PageLinks({ label: '블로그 페이지', resultPages: true })}</div></main>`;
}

export function blogFeed(posts, tags, page, { commentConfig, commentTheme, layout = loadBlogLayout() } = {}) {
  const result = paginate(posts, page, layout.blog.feedSize);
  const returnRoute = result.page === 1 ? '/blog/' : `/blog/page/${result.page}/`;
  return `<main id="main"><h1 class="app-sr">${ui.escape(layout.blog.title)}</h1>${posts.length ? `<div${layout.blog.autoLoad ? ' data-blog-list="feed"' : ''}><div class="app-blog-feed-items">${result.items.map(post => feedArticle(post, tags, commentConfig, commentTheme, returnRoute)).join('')}</div><div class="app-shell">${pagination(result, '/blog/', true)}<p class="app-caption" data-blog-status role="status"></p></div></div>` : `<div class="app-shell">${emptyBlog()}</div>`}${posts.length ? `<div class="app-shell">${ui.ListLink({ href: '/search/', text: layout.blog.archiveLabel })}</div>` : ''}</main>`;
}

export function pagination(result, route, feed = false) {
  return collectionNavigation(result, route, {
    label: '블로그 페이지', before: feed ? '최신 글' : '이전', after: feed ? '이전 글' : '다음',
    summary: feed ? `${result.page} / ${result.totalPages}` : undefined,
  });
}

function feedArticle(post, tags, commentConfig, commentTheme, returnRoute) {
  const updated = post.updatedAt && post.updatedAt !== post.publishedAt ? dateLine({ updatedAt: post.updatedAt }) : '';
  const comments = commentsSection(post, commentConfig, commentTheme, { preview: true, returnRoute });
  return `<div class="app-blog-slice"><div class="app-shell">${postArticle(post, { tags: tagLinks(post, tags), footer: updated, after: comments })}</div></div>`;
}

function emptyBlog() {
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/search/">전체 글 보기</a></p>';
}
