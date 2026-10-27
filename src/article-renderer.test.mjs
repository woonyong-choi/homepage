import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderArticle } from './article-renderer.mjs';
import { articlePage } from './publication-layout.mjs';
import { privateWikiArticle } from './private-wiki-layout.mjs';

test('duplicate_introduction_moves_once_with_links_formatting_and_footnote_backlinks', async () => {
  const page = { id: 'a', description: 'Python 이름과 값.', body: '[Python](/wiki/python/) **이름**과 `값`.[^note]\n\n## 본문\n설명\n\n## 본문\n다음\n\n[^note]: 출처' };
  const original = (await renderArticle({ ...page, description: '' })).html;
  const rendered = (await renderArticle(page));
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

test('only_the_complete_first_paragraph_can_be_promoted', async () => {
  for (const body of ['설명. 추가 설명.', '> 설명.', '- 설명.', '## 제목\n\n설명.', '![설명.](image.png)', ':kbd[설명.]']) {
    const page = { id: 'a', description: '설명.', body };
    assert.equal((await renderArticle(page)).html, (await renderArticle({ ...page, description: '' })).html);
  }
  assert.equal((await renderArticle({ id: 'a', description: '설명 내용', body: '설명\n내용\n\n다음 문단' })).html, '<p>다음 문단</p>\n');
});

test('detail_and_feed_share_the_lead_without_prose_rules_on_the_title_or_empty_related_sections', async () => {
  const page = { id: 'a', slug: 'a', route: '/articles/a/', title: '제목', description: '설명', body: '**설명**\n\n## 본문\n내용', type: 'wiki', tags: ['python'], contentIcon: { name: 'python' }, comments: true, publishedAt: '2026-01-01' };
  Object.assign(page, (await renderArticle(page)));
  const topics = { python: { label: 'Python' } };
  const detail = privateWikiArticle(page, { topics });
  assert.doesNotMatch(detail, /class="app-document app-prose"|함께 읽기/);
  assert.match(detail, /app-document-lead"><strong>설명<\/strong>/);
  const post = { ...page, type: 'blog' };
  const blog = articlePage(post, { topics });
  assert.match(blog, /app-article-lead"><strong>설명<\/strong>/);
  assert.doesNotMatch(detail, /app-related|app-search-entry/);
});

test('engine_diagnostics_and_failed_diagrams_stop_publication', async () => {
  await assert.rejects(renderArticle({ id: 'broken', description: '', body: ':::note\n닫히지 않음\n' }), /broken 본문/);
  const source = 'diagramplay\nbox a "A"\n';
  await assert.rejects(renderArticle({ id: 'failed-diagram', description: '', body: '```diagramplay\n' + source + '```' }, { diagrams: new Map([[source, { error: 'invalid diagram' }]]) }), /failed-diagram/);
});

test('separate_articles_keep_unique_footnote_targets_in_a_shared_feed', async () => {
  const body = '설명.[^n]\n\n[^n]: 각주';
  const first = await renderArticle({ id: 'first', description: '설명.', body });
  const second = await renderArticle({ id: 'second', description: '설명.', body });
  const joined = first.leadHtml + first.html + second.leadHtml + second.html;
  const ids = [...joined.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, target] of joined.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target));
});

test('article_content_keeps_headings_images_and_user_details', async () => {
  const body = '# 본문 제목\n\n![흐름](usage-request.svg)<!-- thinkflow -->\n\n<details>\n<summary>내 설명</summary>\n\n![장면](usage-trace.svg)\n\n</details>\n\n뒤 문단\n';
  const rendered = await renderArticle({ id: 'article', description: '', body });
  assert.match(rendered.html, /<h1\b/);
  assert.match(rendered.html, /src="usage-request\.svg"/);
  assert.match(rendered.html, /<details/);
  assert.match(rendered.html, /내 설명/);
  assert.match(rendered.html, /src="usage-trace\.svg"/);
  assert.match(rendered.html, /뒤 문단/);
  assert.equal(rendered.headings[0].id, 'article-본문-제목');
});

test('article_content_keeps_generated_scene_markers_in_code_examples', async () => {
  const body = '```text\n<!-- thinkflow scenes v1 name=flow -->\n<details>\n<summary>장면</summary>\n\n![장면](usage-trace.svg)<!-- thinkflow -->\n\n</details>\n<!-- /thinkflow scenes v1 name=flow -->\n```\n';
  const rendered = await renderArticle({ id: 'example', description: '', body });
  assert.match(rendered.html, /thinkflow scenes v1 name=flow/);
  assert.match(rendered.html, /usage-trace\.svg/);
});
