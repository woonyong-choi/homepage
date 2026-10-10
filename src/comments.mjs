// 문서의 이름과 위치가 바뀌어도 토론 연결은 고정 ID를 유지한다.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { escape } from './markdown.mjs';
import { repositoryUrl } from './repository-links.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const THEME_PATH = 'src/vendor/theme/assets/giscus.css';

export function commentThemeUrl(config, { origin = '', themeHash } = {}) {
  if (origin.startsWith('https://')) return `${origin}/theme/assets/giscus.css?v=${themeHash}`;
  if (config.comments?.themeUrl !== undefined) {
    let url;
    try { url = new URL(config.comments.themeUrl); } catch { throw new Error('comments.themeUrl must be an HTTPS URL'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('comments.themeUrl must be an HTTPS URL without credentials');
    return url.href;
  }
  repositoryUrl(config.repository);
  const options = { cwd: ROOT, timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] };
  let revision;
  try {
    revision = execFileSync('git', ['log', '-1', '--format=%H', '--', THEME_PATH], { ...options, encoding: 'utf8' }).trim();
    if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('missing comments CSS revision');
    const committed = execFileSync('git', ['show', `${revision}:${THEME_PATH}`], options);
    if (!committed.equals(readFileSync(join(ROOT, THEME_PATH)))) throw new Error('uncommitted comments CSS');
  } catch (cause) {
    throw new Error('cannot resolve a public revision for comments CSS; set comments.themeUrl to a matching public HTTPS stylesheet', { cause });
  }
  return `https://cdn.jsdelivr.net/gh/${config.repository}@${revision}/${THEME_PATH}`;
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
  const expand = preview ? `<button class="app-comments-expand" type="button" data-comments-expand aria-expanded="false" aria-controls="${escape(contentId)}" hidden><span class="app-sr">${escape(page.title)} 댓글 전체 펼치기</span></button>` : '';
  return `<section class="app-comments" id="${escape(id)}" data-comments ${data} data-comments-route="${escape(page.route ?? '')}" data-comments-return="${escape(returnRoute)}" data-comments-description="${escape(page.description ?? '')}">${heading}<p class="app-comments-status" role="status" data-comments-status>GitHub 계정으로 로그인하면 댓글을 작성할 수 있습니다.</p><div class="app-comments-viewport"><div id="${escape(contentId)}" data-comments-content></div>${expand}</div><button class="app-inline-button" type="button" data-comments-retry hidden>댓글 다시 불러오기</button><p class="app-caption" data-comments-fallback hidden><a data-discussion-link href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열기</a></p><noscript><p>댓글을 쓰려면 JavaScript를 켜거나 <a href="${discussionSearch}" target="_blank" rel="noopener noreferrer">GitHub에서 열어 주세요.</a></p></noscript></section>`;
}
