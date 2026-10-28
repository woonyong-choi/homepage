import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDocumentSync } from 'document-engine/parser';
import { SUMMARY_LIMIT, splitLead, summaryOf } from './article-summary.mjs';

const tokens = body => parseDocumentSync(body, { id: 'a' }).tokens;

test('summary_is_the_first_text_paragraph_shortened_or_the_title', () => {
  assert.equal(summaryOf(tokens('첫 **문단**과 [링크](https://example.com)\n\n둘째 문단'), '제목'), '첫 문단과 링크');
  // 제목·그림·코드는 건너뛰고 인용 안의 글자 문단도 문단이다.
  assert.equal(summaryOf(tokens('# 머리\n\n![그림](../assets/a.png)\n\n```\n코드\n```\n\n> 인용 글\n'), '제목'), '인용 글');
  assert.equal(summaryOf(tokens('# 머리\n\n![그림](../assets/a.png)\n'), ' 제목 '), '제목');
  const long = summaryOf(tokens('가'.repeat(400)), '제목');
  assert.equal(long.length, SUMMARY_LIMIT);
  assert.ok(long.endsWith('…'));
});

test('lead_moves_the_matching_first_paragraph_and_never_repeats_body_text', () => {
  const first = tokens('요약 문단\n\n본문');
  assert.equal(splitLead(first, summaryOf(first, '제목'), '제목').kind, 'lead');
  const later = tokens('# 머리\n\n요약 문단은 길게 이어진다');
  assert.equal(splitLead(later, summaryOf(later, '제목'), '제목').kind, 'empty');
  const long = tokens(`# 머리\n\n${'나'.repeat(300)}`);
  assert.equal(splitLead(long, summaryOf(long, '제목'), '제목').kind, 'empty');
  assert.equal(splitLead(tokens('# 머리\n'), '제목', '제목').kind, 'empty');
  // 손으로 쓴 요약은 그대로 글 머리에 둔다.
  assert.equal(splitLead(tokens('본문'), '따로 쓴 설명', '제목').kind, 'summary');
});
