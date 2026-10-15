// 같은 발행 글 전체를 설정한 미리보기, 카드 목록과 본문 피드로 나누어 보여준다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { dateLine, searchBox, tagLinks, subjectIcon } from './publication-layout.mjs';
import { paginate, dateLabel } from './content-model.mjs';
import { LAYOUT, gridSize } from './layout-config.mjs';
import { collectionNavigation } from './collection-navigation.mjs';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import { postArticle, thumbnailImage } from './post-article.mjs';
import { commentsSection } from './comments.mjs';

export function blogCard(page, tags = {}, level = 3, card = LAYOUT.blog.card) {
  const cover = card.media === 'image' ? ui.trusted(thumbnailImage(page)) : card.media === 'icon' ? ui.trusted(subjectIcon(page.contentIcon)) : undefined;
  const description = card.description ? page.description : '';
  const hasMedia = card.media === 'icon' || (card.media === 'image' && page.thumbnail);
  return String(ui.BlogCard({ href: page.route, title: page.title, showTitle: card.title || (!hasMedia && !description), level, cover, description, tagItems: (card.tags ? page.tags ?? [] : []).map(id => ({ href: `/tags/${id}/`, label: tags[id]?.label ?? id })), publishedAt: card.date ? page.publishedAt : undefined, dateLabel: dateLabel(page.publishedAt), commentsHref: card.comments && page.comments ? `${page.route}#comments` : undefined, commentCount: page.commentCount }));
}

export function recentBlog(posts, tags, layout = LAYOUT) {
  if (!posts.length) return '';
  const area = layout.blog;
  const limit = gridSize(area.preview);
  const cards = posts.slice(0, limit).map(page => ui.trusted(blogCard(page, tags, 3, area.card)));
  return String(ui.ContentGroup({ collection: true, body: ui.trusted(`<h2 class="app-page-heading">${escape(area.title)}</h2>${area.description ? `<p>${escape(area.description)}</p>` : ''}${ui.CardGroup({ columns: area.preview.columns, cards })}${posts.length > limit ? `<p>${ui.NavigationLink({ href: '/blog/all/', text: layout.search.allLabel })}</p>` : ''}`) }));
}

export function blogArchive(posts, tags, page, { layout = LAYOUT } = {}) {
  const area = layout.blog;
  const result = paginate(posts, page, gridSize(area.collection));
  return `<main id="main" class="app-shell">${searchBox({ large: true, config: layout.search.box })}${ui.CollectionHeader({ title: area.archiveTitle, backHref: '/docs/', backLabel: layout.search.backLabel, action: { href: '/blog/', label: area.feedLabel } })}${posts.length ? `<div${area.autoLoad ? ' data-blog-list' : ''}>${ui.CardGroup({ columns: area.collection.columns, cards: result.items.map(post => ui.trusted(blogCard(post, tags, 2, area.card))) })}${pagination(result, '/blog/all/')}<p class="app-caption" data-blog-status role="status"></p></div>` : emptyBlog()}</main>`;
}

export function blogFeed(posts, tags, page, { commentConfig, commentTheme, layout = LAYOUT } = {}) {
  const result = paginate(posts, page, layout.blog.feedSize);
  const returnRoute = result.page === 1 ? '/blog/' : `/blog/page/${result.page}/`;
  return `<main id="main"><h1 class="app-sr">${escape(layout.blog.title)}</h1>${posts.length ? `<div${layout.blog.autoLoad ? ' data-blog-list="feed"' : ''}><div class="app-blog-feed-items">${result.items.map(post => feedArticle(post, tags, commentConfig, commentTheme, returnRoute)).join('')}</div><div class="app-shell">${pagination(result, '/blog/', true)}<p class="app-caption" data-blog-status role="status"></p></div></div>` : `<div class="app-shell">${emptyBlog()}</div>`}${posts.length ? `<div class="app-shell">${ui.ListLink({ href: '/blog/all/', text: layout.blog.archiveLabel })}</div>` : ''}</main>`;
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
  return '<p class="app-empty">아직 발행한 글이 없습니다. <a href="/docs/">문서에서 기록 읽기</a></p>';
}
