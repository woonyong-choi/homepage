import test from 'node:test';
import assert from 'node:assert/strict';
import { commentsSection } from './comments.mjs';
import { articlePage } from './publication-layout.mjs';
import { repositoryUrl } from './repository-links.mjs';

const config = { repo: 'owner/blog', repoId: 'repo-id', category: 'Comments', categoryId: 'category-id' };
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
  const html = articlePage(page, [page], { topics: {} });
  assert.doesNotMatch(html, /issues\/new|수정 제안/);
});

test('repository_links_reject_paths_queries_and_missing_identifiers', () => {
  for (const value of [undefined, '', 'owner', 'owner/..', 'owner/.', '../repo', 'owner/repo/extra', 'owner/repo?tab=x', 'owner/repo#part', 'owner\\repo', 'owner/%2e%2e', 'https://github.com/owner/repo']) {
    assert.throws(() => repositoryUrl(value), /invalid publication repository/);
  }
});
