import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { relatedPosts } from './blog-model.mjs';
import { articlePage } from './publication-layout.mjs';
import { privateWikiArticle } from './private-wiki-layout.mjs';

// 합성 원고. 발행된 블로그 글이 없어도 선정 규칙과 표시를 확인한다.
const post = (id, publishedAt, { category = 'design', tags = [], type = 'blog' } = {}) => ({
  id, slug: id, route: `/blog/${id}/`, type, title: `${id} 제목`, description: `${id} 설명`, category, tags,
  contentIcon: { name: 'document' }, publishedAt, html: '<p>본문</p>', leadHtml: `${id} 설명`, comments: false,
});
const topics = { python: { label: 'Python' }, queue: { label: 'Queue' } };

test('related_posts_share_a_category_or_tag_and_put_the_latest_first_up_to_four', () => {
  const current = post('current', '2026-05-01', { category: 'design', tags: ['python'] });
  const posts = [
    current,
    post('same-category-old', '2026-01-01'),
    post('shared-tag-new', '2026-04-01', { category: 'other', tags: ['python'] }),
    post('unrelated-newest', '2026-06-01', { category: 'other', tags: ['queue'] }),
    post('same-day-b', '2026-03-01'),
    post('same-day-a', '2026-03-01'),
    post('latest-tag', '2026-07-01', { tags: ['python'] }),
    post('wiki', '2026-08-01', { type: 'wiki' }),
  ];
  assert.deepEqual(relatedPosts(current, posts).map(item => item.id), ['latest-tag', 'shared-tag-new']);
  assert.deepEqual(relatedPosts(current, posts, 10).map(item => item.id), ['latest-tag', 'shared-tag-new']);
  // 관련 없는 글로 빈자리를 채우지 않는다.
  assert.deepEqual(relatedPosts(post('alone', '2026-05-01', { category: 'solo', tags: ['queue'] }), [post('a', '2026-01-01')]), []);
});

test('blog_detail_shows_related_cards_after_the_body_and_hides_the_section_without_candidates', () => {
  const current = post('current', '2026-05-01', { tags: ['python'] });
  current.related = [post('first', '2026-04-01'), post('second', '2026-03-01')];
  const document = new JSDOM(articlePage(current, { topics })).window.document;
  const heading = document.querySelector('.app-feed-body h2#current-related-posts');
  assert.equal(heading.textContent, '관련 글');
  assert.ok(heading.classList.contains('app-heading-2'));
  const cards = [...heading.nextElementSibling.querySelectorAll(':scope > a.app-help-card.app-related-link')];
  assert.ok(heading.nextElementSibling.classList.contains('app-related-grid'));
  assert.deepEqual(cards.map(card => [card.getAttribute('href'), card.textContent.trim()]), [['/blog/first/', 'first 제목'], ['/blog/second/', 'second 제목']]);
  assert.ok(cards.every(card => !card.querySelector(':scope > .app-content-icon.is-small')));
  // 본문 다음, 댓글 앞이다.
  const html = articlePage(current, { topics }, '<section id="comments">댓글</section>');
  assert.ok(html.indexOf('<p>본문</p>') < html.indexOf('current-related-posts') && html.indexOf('current-related-posts') < html.indexOf('id="comments"'));

  const lonely = post('lonely', '2026-05-01');
  for (const related of [undefined, []]) {
    const page = articlePage({ ...lonely, related }, { topics });
    assert.doesNotMatch(page, /관련 글|app-related-grid/);
  }
});

test('feed_and_wiki_pages_do_not_show_related_posts', () => {
  const current = post('current', '2026-05-01');
  current.related = [post('first', '2026-04-01')];
  const wiki = privateWikiArticle({ ...current, type: 'wiki', headings: [] }, { topics });
  assert.doesNotMatch(wiki, /관련 글|related-posts/);
});
