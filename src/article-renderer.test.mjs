import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMarkdown } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { blogFeed } from './blog-layout.mjs';

test('duplicate_introduction_moves_once_with_links_formatting_and_footnote_backlinks', () => {
  const md = createMarkdown();
  const page = { id: 'a', description: 'Python 이름과 값.', body: '[Python](/wiki/python/) **이름**과 `값`.[^note]\n\n## 본문\n설명\n\n## 본문\n다음\n\n[^note]: 출처' };
  const original = md.render(page.body, { pageId: page.id, docId: page.id });
  const rendered = renderArticle(md, page);
  assert.match(rendered.leadHtml, /href="\/wiki\/python\/"/);
  assert.match(rendered.leadHtml, /<strong>이름<\/strong>과 <code>값<\/code>/);
  const combined = rendered.leadHtml + rendered.html;
  assert.equal((combined.match(/>Python<\/a>/g) ?? []).length, 1);
  for (const [, id] of original.matchAll(/id="([^"]+)"/g)) assert.ok(combined.includes(`id="${id}"`), id);
  for (const [, id] of combined.matchAll(/href="#([^"]+)"/g)) assert.ok(combined.includes(`id="${id}"`), id);
  assert.deepEqual(rendered.headings.map(h => h.id), ['a-본문', 'a-본문-2']);
  assert.match(rendered.html, /출처/);
  assert.equal(page.body.startsWith('[Python]'), true);
});

test('only_the_complete_first_paragraph_can_be_promoted', () => {
  const md = createMarkdown();
  for (const body of ['설명. 추가 설명.', '> 설명.', '- 설명.', '## 제목\n\n설명.', '![설명.](image.png)', ':kbd[설명.]']) {
    const page = { id: 'a', description: '설명.', body };
    assert.equal(renderArticle(md, page).html, md.render(body, { pageId: 'a', docId: 'a' }));
  }
  assert.equal(renderArticle(md, { id: 'a', description: '설명 내용', body: '설명\n내용\n\n다음 문단' }).html, '<p>다음 문단</p>\n');
});

test('detail_and_feed_share_the_lead_without_prose_rules_on_the_title_or_empty_related_sections', () => {
  const page = { id: 'a', slug: 'a', route: '/articles/a/', title: '제목', description: '설명', body: '**설명**\n\n## 본문\n내용', type: 'wiki', tags: ['python'], contentIcon: { name: 'python' }, comments: true, publishedAt: '2026-01-01' };
  Object.assign(page, renderArticle(createMarkdown(), page));
  const topics = { python: { label: 'Python' } };
  const detail = articlePage(page, { topics });
  assert.doesNotMatch(detail, /class="app-document app-prose"|함께 읽기/);
  assert.match(detail, /app-document-lead"><strong>설명<\/strong>/);
  const post = { ...page, type: 'blog' };
  const blog = articlePage(post, { topics });
  assert.match(blog, /app-article-lead"><strong>설명<\/strong>/);
  const feed = blogFeed([post], topics, 1, { commentConfig: { repo: 'owner/blog', repoId: 'repo-id', category: 'Comments', categoryId: 'category-id' }, commentTheme: 'light' });
  assert.match(feed, /app-article-lead"><strong>설명<\/strong>/);
  assert.equal((feed.match(/<strong>설명<\/strong>/g) ?? []).length, 1);
  assert.doesNotMatch(detail, /app-related|app-search-entry/);
});
