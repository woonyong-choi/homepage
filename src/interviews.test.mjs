import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readContentFile } from './content-files.mjs';
import { publicInterviews, interviewCards, summaryParts } from './interviews.mjs';
import { href } from './home-content.mjs';

const examples = readContentFile(new URL('../content/interviews.md', import.meta.url)).metadata.items;

test('interview_examples_are_five_static_company_placeholders_shown_only_in_preview', () => {
  assert.equal(publicInterviews(examples, true).length, 5);
  assert.deepEqual(publicInterviews(examples), []);
  for (const entry of examples) {
    assert.equal(entry.example, true);
    assert.deepEqual([entry.profile.title, entry.profile.subtitle], ['회사명', '직무']);
  }
  assert.ok(examples.some(entry => entry.profile.image) && examples.some(entry => !entry.profile.image));
});

test('profile_values_are_escaped_and_the_card_link_has_a_descriptive_label', () => {
  const html = interviewCards([{ id: 'a', summary: '<요약> & 내용', url: 'https://example.com/a?x=1&y=2', profile: { image: { src: '/assets/a.png', alt: '"로고"' }, title: '<회사>', subtitle: '직무 & 팀' } }], href);
  assert.match(html, /&lt;요약&gt; &amp; 내용/);
  assert.match(html, /<a class="app-interview-card-link" href="https:\/\/example\.com\/a\?x=1&amp;y=2" aria-label="&lt;회사&gt; 직무 &amp; 팀 인터뷰 보기"><\/a>/);
  assert.match(html, /<strong>&lt;회사&gt;<\/strong>/);
  assert.match(html, /alt="&quot;로고&quot;"/);
  assert.match(html, /<span>직무 &amp; 팀<\/span>/);
  assert.equal((html.match(/<a /g) ?? []).length, 1);
});

test('cards_without_image_or_profile_leave_no_empty_slot', () => {
  const [titleOnly, summaryOnly] = interviewCards([{ id: 'a', summary: 's', profile: { title: '제목' } }, { id: 'b', summary: 's' }], href).split('</li>');
  assert.match(titleOnly, /<div class="app-interview-meta"><div class="app-interview-lines"><strong>제목<\/strong><\/div><\/div>/);
  assert.doesNotMatch(titleOnly, /app-interview-avatar|<span>|undefined/);
  assert.doesNotMatch(titleOnly, /<a /);
  assert.doesNotMatch(summaryOnly, /app-interview-meta|undefined/);
});

test('summary_links_are_the_only_markup_and_unsafe_or_plain_mentions_never_become_links', () => {
  const render = summary => interviewCards([{ id: 'a', summary }], href);
  assert.match(render('[@만난 곳](/docs/)에서 [@커뮤니티](https://example.com/c?a=1&b=2) 함께'), /<a href="\/docs\/">@만난 곳<\/a>에서 <a href="https:\/\/example\.com\/c\?a=1&amp;b=2">@커뮤니티<\/a> 함께/);
  assert.doesNotMatch(render('@만난 곳에서 함께'), /<a /);
  assert.match(render('\\[대괄호\\](/docs/) [a\\]b](/x/)'), /^<li[^>]*><p class="app-interview-summary">\[대괄호\]\(\/docs\/\) <a href="\/x\/">a\]b<\/a><\/p>/);
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.example.com', 'http://example.com']) assert.doesNotMatch(render(`[@x](${url})`), /<a |href=/);
  assert.match(render('[<b>](https://example.com) <i>x</i> ![img](/a.png)'), /<a href="https:\/\/example\.com">&lt;b&gt;<\/a> &lt;i&gt;x&lt;\/i&gt; !<a href="\/a\.png">img<\/a>/);
  assert.deepEqual(summaryParts('앞 [a](/b/) 뒤'), [{ text: '앞 ' }, { label: 'a', url: '/b/' }, { text: ' 뒤' }]);
});

test('the_first_example_links_a_meeting_place_to_a_site_path', () => {
  assert.match(interviewCards([examples[0]], href), /<a href="\/docs\/">@만난 곳<\/a>에서 함께한 동료평가 내용을 작성하세요\./);
});
