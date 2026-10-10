import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readCommentCounts } from './comment-counts.mjs';

const CONFIG = { repository: 'owner/blog', comments: { categoryId: 'category' } };
const POSTS = [{ id: 'first', comments: true }, { id: 'second', comments: true }];
const hash = id => createHash('sha1').update(id).digest('hex');
const page = (nodes, totalCount = nodes.length, endCursor = null) => ({ nodes, totalCount, pageInfo: { hasNextPage: Boolean(endCursor), endCursor } });
const discussion = id => ({ id, body: `<!-- sha1: ${hash(id)} -->` });

test('comment_counts_match_stable_ids_and_include_all_comment_and_reply_pages', () => {
  const requested = [];
  const result = readCommentCounts(POSTS, CONFIG, (query, variables) => {
    requested.push(variables);
    if ('repo' in variables) return { repository: { discussions: variables.cursor ? page([discussion('first')], 2) : page([discussion('unrelated')], 2, 'next-discussion') } };
    return { node: { comments: variables.after ? page([{ replies: { totalCount: 3 } }], 2) : page([{ replies: { totalCount: 2 } }], 2, 'next-comment') } };
  });
  assert.equal(result.status, 'available');
  assert.equal(result.counts.get('first'), 7);
  assert.equal(result.counts.get('second'), 0);
  assert.equal(requested.length, 4);
});

test('comment_counts_leave_network_errors_partial_pages_and_ambiguity_unknown', () => {
  const cases = [
    () => { throw new Error('offline'); },
    () => ({ repository: { discussions: page([], 1) } }),
    () => ({ repository: { discussions: page([], 1, 'same') } }),
    (query, variables) => 'repo' in variables ? { repository: { discussions: page([discussion('first'), discussion('first')]) } } : { node: { comments: page([]) } },
    (query, variables) => 'repo' in variables ? { repository: { discussions: page([discussion('first')]) } } : { node: { comments: page([{ replies: { totalCount: -1 } }]) } },
  ];
  for (const query of cases) {
    const result = readCommentCounts(POSTS, CONFIG, query);
    assert.equal(result.status, 'unavailable');
    assert.equal(result.counts.size, 0);
  }
});

test('comment_counts_distinguish_no_discussions_from_no_comment_enabled_posts', () => {
  const empty = readCommentCounts(POSTS, CONFIG, () => ({ repository: { discussions: page([]) } }));
  assert.equal(empty.status, 'available');
  assert.deepEqual([...empty.counts.values()], [0, 0]);
  const unused = readCommentCounts([{ id: 'wiki' }], CONFIG, () => { throw new Error('must not request'); });
  assert.equal(unused.status, 'empty');
});
