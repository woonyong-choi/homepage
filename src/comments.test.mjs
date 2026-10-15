import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { commentsSection, commentThemeUrl } from './comments.mjs';
import { articlePage } from './publication-layout.mjs';
import { repositoryUrl } from './repository-links.mjs';

const config = { repo: 'owner/blog', repoId: 'repo-id', category: 'Comments', categoryId: 'category-id' };
test('comment_theme_keeps_https_origin_and_requires_https_preview_overrides', () => {
  const site = { repository: 'owner/blog', comments: { themeUrl: 'https://static.example.com/comments.css' } };
  assert.equal(commentThemeUrl(site, { origin: 'https://example.com', themeHash: 'theme-hash' }), 'https://example.com/theme/assets/giscus.css?v=theme-hash');
  for (const origin of ['', 'http://localhost:8796']) assert.equal(commentThemeUrl(site, { origin }), site.comments.themeUrl);
  for (const themeUrl of ['', 'light', '/theme.css', 'http://example.com/theme.css', 'https://user:password@example.com/theme.css']) {
    assert.throws(() => commentThemeUrl({ ...site, comments: { themeUrl } }), /comments\.themeUrl must be an HTTPS URL/);
  }
});

test('preview_comment_theme_reads_the_installed_design_commit_from_a_public_cdn', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const spec = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).devDependencies['@woonyong-choi/design-tokens'];
  const [, repository, revision] = /^github:([\w.-]+\/[\w.-]+)#([a-f0-9]{40})$/.exec(spec);
  const themeUrl = commentThemeUrl({ repository: 'owner/blog' });
  assert.equal(themeUrl, `https://cdn.jsdelivr.net/gh/${repository}@${revision}/dist/assets/giscus.css`);
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.match(lock.packages['node_modules/@woonyong-choi/design-tokens'].resolved, new RegExp(`#${revision}$`));
  assert.ok(readFileSync(new URL('assets/giscus.css', `file://${root}node_modules/@woonyong-choi/design-tokens/dist/`)).length > 0);
  assert.match(commentsSection({ id: 'stable-id', comments: true }, config, themeUrl), /data-theme="https:\/\/cdn\.jsdelivr\.net\/gh\//);
});

test('댓글은 글 제목과 URL이 바뀌어도 고정 문서 ID로 연결한다', () => {
  const original = commentsSection({ id: 'stable-id', title: '제목', comments: true }, config, 'https://example.com/theme.css');
  const moved = commentsSection({ id: 'stable-id', title: '바뀐 제목', route: '/new/', comments: true }, config, 'https://example.com/theme.css');
  assert.equal(original.match(/data-term="([^"]+)"/)[1], moved.match(/data-term="([^"]+)"/)[1]);
  assert.match(original, /data-mapping="specific" data-term="stable-id" data-strict="1"/);
  assert.match(original, /data-reactions-enabled="0"/);
  assert.equal(commentsSection({ comments: false }, config, ''), '');
  assert.throws(() => commentsSection({ comments: true }, {}, ''), /missing comments/);
});

test('repository_and_category_changes_reach_comments_and_correction_links', () => {
  const repository = 'new-owner/new.repo';
  const page = { id: 'stable-id', slug: 'example', title: '제목 & 확인', description: '설명', tags: [], headings: [], html: '', contentIcon: { name: 'project' } };
  const comments = commentsSection({ ...page, comments: true }, { ...config, repo: repository, category: 'Product Feedback' }, 'https://example.com/theme.css');
  const discussion = new URL(comments.match(/data-discussion-link href="([^"]+)"/)[1]);
  assert.equal(discussion.pathname, `/${repository}/discussions`);
  assert.equal(discussion.searchParams.get('discussions_q'), 'category:"Product Feedback" stable-id');
  assert.ok(comments.includes(`data-repo="${repository}"`));
  const html = articlePage(page, { topics: {} });
  assert.doesNotMatch(html, /issues\/new|수정 제안/);
});

test('repository_links_reject_paths_queries_and_missing_identifiers', () => {
  for (const value of [undefined, '', 'owner', 'owner/..', 'owner/.', '../repo', 'owner/repo/extra', 'owner/repo?tab=x', 'owner/repo#part', 'owner\\repo', 'owner/%2e%2e', 'https://github.com/owner/repo']) {
    assert.throws(() => repositoryUrl(value), /invalid publication repository/);
  }
});
