import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromBase64, imageFileName, imageMarkdown, parseTags, postFileName, readPost, toBase64, writePost } from './admin-model.mjs';

const source = `---
id: sample
slug: sample
type: blog
title: "샘플: 글"
description: "설명"
tags: [SQL, B+Tree]
publishedAt: "2026-10-19"
visibility: draft
status: draft
publish: false
comments: false
series: keep
---

본문 첫 줄

## 절
`;

test('admin_round_trip_changes_only_edited_front_matter_fields', () => {
  const post = readPost(source);
  assert.deepEqual([post.title, post.tags, post.state, post.publishedAt, post.slug], ['샘플: 글', ['SQL', 'B+Tree'], 'draft', '2026-10-19', 'sample']);
  assert.equal(writePost(source, post), source);
  const published = writePost(source, { ...post, state: 'public', tags: ['SQL'] });
  assert.match(published, /visibility: public\nstatus: published\npublish: true\n/);
  assert.match(published, /tags: \[SQL\]\n/);
  assert.match(published, /series: keep\n/);
  assert.equal(readPost(published).body, post.body);
  // 비공개는 다 쓴 글이지만 사이트에 싣지 않는다.
  const hidden = writePost(source, { ...post, state: 'private' });
  assert.match(hidden, /visibility: private\nstatus: published\npublish: false\n/);
  assert.equal(readPost(hidden).state, 'private');
});

test('admin_new_post_uses_vault_front_matter_defaults', () => {
  const text = writePost(undefined, { slug: 'new-post', title: '새 글', description: '', tags: ['a'], publishedAt: '2026-10-27', state: 'draft', body: '본문' });
  assert.equal(text, '---\nid: new-post\nslug: new-post\ntype: blog\ntitle: "새 글"\ndescription: ""\ntags: [a]\npublishedAt: "2026-10-27"\nvisibility: draft\nstatus: draft\npublish: false\ncomments: false\n---\n\n본문\n');
  assert.equal(readPost(text).publishedAt, '2026-10-27');
});

test('admin_names_and_encoding_reject_unsafe_values', () => {
  assert.equal(postFileName('new-post', '2026-10-27'), '26-10-27-new-post.md');
  assert.throws(() => postFileName('../x', '2026-10-27'), /주소 이름/);
  assert.equal(imageFileName('화면 Shot (1).PNG', 'image/png', '2026-10-27'), '261027-shot-1.png');
  assert.equal(imageFileName('그림.png', 'image/png', '2026-10-27'), '261027-image.png');
  assert.throws(() => imageFileName('a.svg', 'image/svg+xml', '2026-10-27'), /그림만/);
  assert.equal(imageMarkdown('결과 [화면]', 'a.png'), '![결과  화면](../assets/a.png)');
  assert.deepEqual(parseTags(' SQL, , C,SQL '), ['SQL', 'C']);
  assert.equal(fromBase64(toBase64('한글 ✓')), '한글 ✓');
});
