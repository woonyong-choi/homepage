import assert from 'node:assert/strict';
import { test } from 'node:test';
import { knowledgeFields, wikiLanding, tagPage } from './publication-layout.mjs';

test('a_published_topic_stays_reachable_when_its_overview_is_unpublished', () => {
  const topics = { javascript: { label: 'JavaScript', field: 'languages', group: 'tech', icon: 'javascript', article: 'javascript' } };
  const documents = [{ id: 'b', slug: 'promises', route: '/articles/promises/', category: 'javascript', type: 'wiki', title: 'Promise', description: '비동기 작업', contentIcon: { name: 'runtime' } }];
  const html = knowledgeFields(documents, topics);
  assert.match(html, /href="\/articles\/promises\/"/);
  assert.match(html, /role="heading" aria-level="3">JavaScript<\/strong>/);
  assert.doesNotMatch(html, /href="\/articles\/javascript\/"/);
});

// #67: 전체 태그 목록은 아직 조건을 계산하지 않은 검색 결과와 분리한다.
test('tag_page_keeps_static_reading_separate_from_filtered_results', () => {
  const tags = { javascript: { label: 'JavaScript' } };
  const entry = { route: '/articles/promises/', title: 'Promise', description: '비동기 작업', type: 'wiki', tags: ['javascript'], contentIcon: { name: 'runtime' } };
  const html = tagPage('javascript', [entry], tags);
  assert.match(html, /<div data-full-results><\/div>/);
  assert.match(html, /<div data-search-fallback><details class="app-details"><summary>이 태그의 모든 글 보기<\/summary>/);
  const fallback = html.slice(html.indexOf('<div data-search-fallback>'));
  assert.match(fallback, /href="\/articles\/promises\/"/);
  assert.doesNotMatch(html.slice(0, html.indexOf('<div data-search-fallback>')), /href="\/articles\/promises\/"/);
  assert.match(tagPage('javascript', [], tags), /이 태그로 발행한 글이 없습니다/);
});

test('topic_preview_keeps_two_rows_and_the_same_entry_width_for_cs_and_tech', () => {
  for (const [group, limit] of [['cs', 6], ['tech', 8]]) for (const count of [0, 1, limit, limit + 1]) {
    const documents = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, slug: `p${i}`, route: `/articles/p${i}/`, category: `t${i}`, type: 'wiki', title: `주제 ${i}`, description: '내용', contentIcon: { name: 'processor' } }));
    const topics = Object.fromEntries(documents.map((p, i) => [`t${i}`, { field: 'cs', group, icon: 'processor', label: p.title, article: p.slug }]));
    const preview = wikiLanding(documents, { topics });
    assert.equal((preview.match(/class="app-help-card is-summary"/g) ?? []).length, Math.min(count, limit));
    assert.equal(preview.includes(`href="/docs/topics/${group}/"`), count > limit);
    assert.match(preview, /<main id="main" class="app-shell app-body">/);
    assert.doesNotMatch(preview, /wiki-heading|>Wiki<|is-pair/);
    const all = wikiLanding(documents, { topics }, group);
    assert.equal((all.match(/class="app-help-card is-summary"/g) ?? []).length, count);
    assert.doesNotMatch(all, /<h2>CS<\/h2>/);
    assert.ok(all.indexOf('app-page-heading') < all.indexOf('app-navigation-link is-back'));
    assert.ok(all.indexOf('app-page-heading') < all.indexOf('app-support-grid') || count === 0);
    assert.match(all, /class="app-shell"/);
    if (count) {
      if (group === 'tech') {
        assert.match(preview, /class="app-support-grid is-four"/);
        assert.match(all, /class="app-support-grid is-five"/);
      } else {
        assert.match(preview, /class="app-support-grid"/);
        assert.match(all, /class="app-support-grid is-four"/);
      }
    }
  }
});

// #110: 기술은 로고와 이름, 개념은 설명까지 표시하며 프로젝트는 입구에서 제외한다.
test('tech_and_cs_group_topics_by_navigation_without_changing_source_fields', () => {
  const topics = {
    python: { label: 'Python', field: 'languages', group: 'tech', icon: 'python' },
    redis: { label: 'Redis', field: 'infrastructure', group: 'tech', icon: 'redis' },
    data: { label: 'Data', field: 'infrastructure', group: 'cs', icon: 'database' },
    os: { label: 'OS', field: 'cs', group: 'cs', icon: 'operating-system' },
    projects: { label: 'Projects', field: 'cs', icon: 'project' },
  };
  const documents = Object.keys(topics).map(id => ({ id, slug: id, route: `/articles/${id}/`, category: id, type: 'wiki', title: id, description: '범위 설명' }));
  const html = knowledgeFields(documents, topics);
  assert.match(html, /<h2>Tech<\/h2>/);
  assert.match(html, /<h2>CS<\/h2>/);
  assert.doesNotMatch(html.split('<h2>Tech</h2>')[1], /범위 설명|<p/);
  assert.equal((html.match(/class="app-card-summary"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Projects|Languages|Infrastructure/);
  assert.ok(html.indexOf('<h2>CS</h2>') < html.indexOf('<h2>Tech</h2>'));
  const config = { notes: { projects: false }, projects: [{ title: '프로젝트 사례', href: '/projects/demo/', icon: 'project', description: '구현 사례', links: [] }] };
  assert.doesNotMatch(wikiLanding(documents, { topics, config }), /개발 프로젝트/);
  const active = wikiLanding(documents, { topics, config: { ...config, notes: { projects: true } } }, undefined, '<h2>Blog</h2>');
  assert.ok(active.indexOf('>Blog</h2>') < active.indexOf('개발 프로젝트'));
  assert.ok(active.indexOf('개발 프로젝트') < active.indexOf('<h2>CS</h2>'));
  const old = knowledgeFields(documents, topics, 'infrastructure');
  assert.match(old, /Redis/);
  assert.match(old, /Data/);
});
