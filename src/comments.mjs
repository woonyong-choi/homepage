// 문서의 이름과 위치가 바뀌어도 토론 연결은 고정 ID를 유지한다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Button, escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import { repositoryUrl } from './repository-links.mjs';
import { DESIGN_PACKAGE } from './design-package.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const THEME_PATH = 'dist/assets/giscus.css';

export function commentThemeUrl(config, { origin = '', themeHash } = {}) {
  if (origin.startsWith('https://')) return `${origin}/theme/assets/giscus.css?v=${themeHash}`;
  if (config.comments?.themeUrl !== undefined) {
    let url;
    try { url = new URL(config.comments.themeUrl); } catch { throw new Error('comments.themeUrl must be an HTTPS URL'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('comments.themeUrl must be an HTTPS URL without credentials');
    return url.href;
  }
  // 운영 주소가 없으면 설치한 디자인 패키지의 고정 commit에 있는 같은 파일을 공개 CDN에서 읽는다.
  const spec = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).devDependencies?.[DESIGN_PACKAGE] ?? '';
  const pinned = /^github:([\w.-]+\/[\w.-]+)#([a-f0-9]{40})$/.exec(spec);
  if (!pinned) throw new Error('cannot resolve a public revision for comments CSS; set comments.themeUrl to a matching public HTTPS stylesheet');
  return `https://cdn.jsdelivr.net/gh/${pinned[1]}@${pinned[2]}/${THEME_PATH}`;
}

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
  // 블로그 피드에서는 댓글 창을 바로 불러오지 않고 "더 보기" 같은 링크 단추만 둔다. 누르면 그 자리에서 댓글 창을 펼친다.
  // 개수는 배포할 때 센 값이라 그 뒤 달린 댓글을 모른다. 0이거나 모르면 개수 없이 "댓글"로 둔다.
  const count = Number.isInteger(page.commentCount) && page.commentCount > 0 ? page.commentCount : 0;
  const expand = preview ? String(Button({ label: count ? `댓글 ${count}개` : '댓글', variant: 'link', action: 'comments-expand', controls: contentId, context: page.title, hidden: true })) : '';
  // giscus 창 안에는 수정·삭제가 없다. 댓글의 시간을 누르면 GitHub 토론에서 고칠 수 있다.
  const help = '<p class="app-caption" data-comments-help>댓글 수정·삭제는 댓글의 시간을 눌러 GitHub에서 할 수 있습니다.</p>';
  return `<section class="app-comments" id="${escape(id)}" data-comments ${data} data-comments-route="${escape(page.route ?? '')}" data-comments-return="${escape(returnRoute)}" data-comments-description="${escape(page.description ?? '')}">${heading}<p class="app-comments-status" role="status" data-comments-status>GitHub 계정으로 로그인하면 댓글을 작성할 수 있습니다.</p>${expand}<div class="app-comments-viewport"><div id="${escape(contentId)}" data-comments-content></div>${help}</div><button class="app-inline-button" type="button" data-comments-retry hidden>댓글 다시 불러오기</button><p class="app-caption" data-comments-fallback hidden><a data-discussion-link href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열기</a></p><noscript><p>댓글을 쓰려면 JavaScript를 켜거나 <a href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열어 주세요.</a></p></noscript></section>`;
}
