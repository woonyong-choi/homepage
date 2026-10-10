// 빌드 시 공개 토론의 댓글과 답글만 읽으며 인증 정보는 브라우저로 보내지 않는다.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const COMMENTS = 'comments(first: 100, after: $after) { totalCount nodes { replies { totalCount } } pageInfo { hasNextPage endCursor } }';
const DISCUSSIONS = `query($owner: String!, $repo: String!, $category: ID!, $cursor: String) { repository(owner: $owner, name: $repo) { discussions(first: 100, categoryId: $category, after: $cursor) { totalCount nodes { id body } pageInfo { hasNextPage endCursor } } } }`;
const DISCUSSION_COMMENTS = `query($id: ID!, $after: String) { node(id: $id) { ... on Discussion { ${COMMENTS} } } }`;

export function readCommentCounts(pages, config, query = githubQuery) {
  const posts = pages.filter(page => page.comments);
  if (!posts.length) return { counts: new Map(), status: 'empty' };
  const hashes = new Map(posts.map(page => [createHash('sha1').update(page.id).digest('hex'), page.id]));
  try {
    const [owner, repo] = config.repository.split('/');
    const discussions = connectionPages(cursor => query(DISCUSSIONS, { owner, repo, category: config.comments.categoryId, cursor }).repository.discussions);
    const counts = new Map(posts.map(page => [page.id, 0]));
    const matched = new Set();
    for (const discussion of discussions) {
      const hash = [...hashes.keys()].find(value => discussion.body.includes(value));
      if (!hash) continue;
      const id = hashes.get(hash);
      if (matched.has(id)) throw new Error('ambiguous discussion');
      matched.add(id);
      const comments = connectionPages(after => query(DISCUSSION_COMMENTS, { id: discussion.id, after }).node.comments);
      counts.set(id, comments.reduce((count, comment) => {
        const replies = comment.replies.totalCount;
        if (!Number.isSafeInteger(replies) || replies < 0) throw new Error('invalid reply count');
        return count + 1 + replies;
      }, 0));
    }
    return { counts, status: 'available' };
  } catch {
    // 조회 실패나 일부 응답을 댓글 0개로 오인하지 않도록 숫자를 생략한다.
    return { counts: new Map(), status: 'unavailable' };
  }
}

function connectionPages(readPage) {
  const nodes = [];
  const cursors = new Set();
  let cursor;
  let total;
  do {
    const page = readPage(cursor);
    if (!Array.isArray(page?.nodes) || typeof page.pageInfo?.hasNextPage !== 'boolean') throw new Error('invalid discussion page');
    if (!Number.isSafeInteger(page.totalCount) || page.totalCount < 0 || total !== undefined && total !== page.totalCount) throw new Error('inconsistent discussion count');
    total = page.totalCount;
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) {
      if (nodes.length !== total) throw new Error('incomplete discussion page');
      return nodes;
    }
    cursor = page.pageInfo.endCursor;
    if (!cursor || cursors.has(cursor)) throw new Error('repeated discussion cursor');
    cursors.add(cursor);
  } while (cursor);
}

function githubQuery(query, variables) {
  const input = JSON.stringify({ query, variables });
  const response = JSON.parse(execFileSync('gh', ['api', 'graphql', '--input', '-'], { input, encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }));
  if (response.errors?.length || !response.data) throw new Error('discussion query failed');
  return response.data;
}
