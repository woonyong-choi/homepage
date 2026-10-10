import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { contentIcon } from './content-icons.mjs';
import { createMarkdown } from './markdown.mjs';
import { iconAuditPages } from './icon-audit.mjs';

test('small_icons_omit_article_badges_and_invalid_names_fail',()=>{
  assert.notEqual(contentIcon({name:'database',kind:'concept'}),contentIcon('database'));
  assert.equal(contentIcon({name:'database',kind:'concept'},'small'),contentIcon('database','small'));
  assert.throws(()=>contentIcon('absent'));
  assert.throws(()=>contentIcon({name:'database',kind:'absent'}));
});

// #55: 현재 검토 기록을 표시하는 항목이 누락되거나 중복되면 전수 검토가 아니다.
test('audit_pages_expose_every_current_review_once', () => {
  const review = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/current-review.json', import.meta.url)));
  const pages = iconAuditPages();
  const ids = pages.flatMap(page => [...page.body.matchAll(/data-audit-id="([^"]+)"/g)].map(match => match[1]));
  assert.equal(pages.length, 12);
  assert.equal(ids.length, 142);
  assert.deepEqual(ids.toSorted(), Object.keys(review.entries).toSorted());
  for (const [id, entry] of Object.entries(review.entries)) {
    assert.equal(pages.filter(page => page.body.includes(`data-audit-id="${id}" data-review-fingerprint="${entry.fingerprint}"`)).length, 1);
  }
  assert.match(pages[4].body, /펼친 책과 학습 내용을 나타내는 줄/);
  assert.match(pages[11].body, /24px에서는 표식 없이 같은 문서 도형/);
});
test('markdown_cards_accept_content_icons_without_changing_reference_icons',()=>{
  const md=createMarkdown();
  const html=md.render('```ui:cards\n'+JSON.stringify({items:[{title:'트랜잭션',href:'/things/icon-system/',icon:{name:'database',kind:'concept'}}]})+'\n```');
  assert.match(html,/<svg/);
  assert.match(html,/aria-hidden="true"/);
});
