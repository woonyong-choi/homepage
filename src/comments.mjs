// 문서의 이름과 위치가 바뀌어도 토론 연결은 고정 ID를 유지한다.
import { escape } from './markdown.mjs';
import { repositoryUrl } from './repository-links.mjs';

export function commentsSection(page, config = {}, themeUrl, { preview = false, returnRoute = '' } = {}) {
  if (!page.comments) return '';
  for (const name of ['repo', 'repoId', 'category', 'categoryId']) if (!config[name]) throw new Error(`missing comments configuration: ${name}`);
  const attributes = { repo: config.repo, repoId: config.repoId, category: config.category, categoryId: config.categoryId,
    mapping: 'specific', term: page.id, strict: '1', reactionsEnabled: '0', emitMetadata: '1', inputPosition: preview ? 'bottom' : 'top', theme: themeUrl, lang: 'ko' };
  const data = Object.entries(attributes).map(([key, value]) => `data-${key.replace(/[A-Z]/g, char => '-' + char.toLowerCase())}="${escape(value)}"`).join(' ');
  const discussionSearch = `${repositoryUrl(config.repo)}/discussions?discussions_q=${encodeURIComponent(`category:${JSON.stringify(config.category)} ${page.id}`)}`;
  const id = preview ? `comments-${page.id}` : 'comments';
  const contentId = `${id}-content`;
  const heading = preview ? '<h3 class="app-sr">댓글</h3>' : '<h2>댓글</h2>';
  const expand = preview ? `<button class="app-comments-expand" type="button" data-comments-expand aria-expanded="false" aria-controls="${escape(contentId)}" hidden><span class="app-sr">${escape(page.title)} 댓글 전체 펼치기</span></button>` : '';
  return `<section class="app-comments" id="${escape(id)}" data-comments ${data} data-comments-route="${escape(page.route ?? '')}" data-comments-return="${escape(returnRoute)}" data-comments-description="${escape(page.description ?? '')}">${heading}<p class="app-comments-status" role="status" data-comments-status>GitHub 계정으로 로그인하면 댓글을 작성할 수 있습니다.</p><div class="app-comments-viewport"><div id="${escape(contentId)}" data-comments-content></div>${expand}</div><button class="app-inline-button" type="button" data-comments-retry hidden>댓글 다시 불러오기</button><p class="app-caption" data-comments-fallback hidden><a data-discussion-link href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열기</a></p><noscript><p>댓글을 쓰려면 JavaScript를 켜거나 <a href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열어 주세요.</a></p></noscript></section>`;
}
