import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { loadLayoutConfig, loadBlogLayout, parseLayoutConfig } from './layout-config.mjs';
import { parseHomeNavigation } from './home-content.mjs';
import { documentShell } from './publication-layout.mjs';
const LAYOUT = loadLayoutConfig();

const document = html => JSDOM.fragment(html);
const posts = Array.from({ length: 7 }, (_, i) => ({ id: `post-${i}`, title: `글 ${i}`, route: `/blog/post-${i}/`, description: '요약', publishedAt: '2026-10-01', contentIcon: { name: 'processor' }, tags: [], html: '<p>내용</p>' }));
const topics = Object.fromEntries(['a', 'b', 'c'].map(id => [id, { group: 'cs', field: 'cs', label: id, icon: 'processor', description: `${id} 설명` }]));
const articles = Object.keys(topics).map(id => ({ id, slug: id, title: id, category: id, type: 'wiki', route: `/docs/${id}/` }));



test('layout_validation_reports_setting_paths_instead_of_ignoring_typographical_errors', () => {
  assert.deepEqual(parseLayoutConfig(LAYOUT), LAYOUT);
  for (const [change, expected] of [
    [value => { value.cs.preview.columns = 0; }, /config\/cs.json.preview.columns/],
    [value => { value.tech.collection.rows = -1; }, /config\/tech.json.collection.rows/],
    [value => { value.blog.card.title = 'false'; }, /config\/blog.json.card.title/],
    [value => { value.cs.card.media = 'video'; }, /config\/cs.json.card.media/],
    [value => { value.cs.card = { title: false, description: false, media: 'none' }; }, /config\/cs.json.card/],
    [value => { value.cs.card = { title: false, description: false, media: 'icon' }; }, /config\/cs.json.card/],
    [value => { value.tech.card = { title: false, description: false, media: 'icon' }; }, /config\/tech.json.card/],
    [value => { value.search.sections.push(value.search.sections[0]); }, /config\/search.json.sections/],
    [value => { value.search.box.lables = {}; }, /config\/search.json.box.lables/],
  ]) {
    const value = structuredClone(LAYOUT);
    change(value);
    assert.throws(() => parseLayoutConfig(value), expected);
  }
});

test('home_navigation_owns_labels_order_targets_and_active_page_matching', () => {
  const navigation = parseHomeNavigation([
    { label: '기록', href: '/blog/' },
    { label: '찾기', href: '/docs/', match: ['/docs/', '/search/', '/tags/'] },
  ]);
  const html = documentShell({ route: '/tags/python/', title: 'Python' }, '<main id="main"></main>', { navigation, config: { name: '사이트', github: 'https://github.com/example', linkedin: 'https://www.linkedin.com/in/example' } });
  const page = document(html);
  assert.ok(html.indexOf('>기록<') < html.indexOf('>찾기<'));
  assert.equal(page.querySelector('[aria-current=page]').textContent, '찾기');
  assert.throws(() => parseHomeNavigation([{ label: '실행', href: 'javascript:alert(1)' }]), /navigation\[0\].href/);
  assert.throws(() => parseHomeNavigation([{ label: '홈', href: '/' }, { label: '홈 2', href: '/' }]), /중복 메뉴/);
});

test('layout_loaders_reject_icon_cards_without_title_or_description', t => {
  const input = structuredClone(LAYOUT);
  const readFile = t.mock.method(fs, 'readFileSync', url => JSON.stringify(input[url.pathname.split('/').at(-1).replace('.json', '')]));
  syncBuiltinESMExports();
  try {
    for (const media of ['icon', 'none']) {
      input.blog.card = { media, title: false, description: false, tags: false, date: false, comments: false };
      for (const load of [loadLayoutConfig, loadBlogLayout]) {
        assert.throws(() => load(), /config\/blog.json.card/);
      }
      for (const field of ['title', 'description']) {
        input.blog.card[field] = true;
        for (const load of [loadLayoutConfig, loadBlogLayout]) assert.deepEqual(load().blog.card, input.blog.card);
        input.blog.card[field] = false;
      }
    }
    input.blog.card.media = 'image';
    assert.deepEqual(loadBlogLayout().blog.card, input.blog.card);
  } finally {
    readFile.mock.restore();
    syncBuiltinESMExports();
  }
  assert.deepEqual(loadBlogLayout().blog.card, LAYOUT.blog.card);
});

test('public_blog_layout_needs_only_blog_settings_and_search_box', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { pathToFileURL } = await import('node:url');
  const root = mkdtempSync(join(tmpdir(), 'homepage-layout-'));
  try {
    writeFileSync(join(root, 'blog.json'), JSON.stringify({ title: 'Blog', feedSize: 4, autoLoad: true, archiveLabel: '전체 글 보기', collection: { columns: 3, rows: 2 }, card: LAYOUT.blog.card }));
    writeFileSync(join(root, 'search.json'), JSON.stringify({ title: 'Search', box: LAYOUT.search.box }));
    const layout = loadBlogLayout(pathToFileURL(root + '/'));
    assert.equal(layout.blog.collection.rows, 2);
    assert.equal(Object.hasOwn(layout, 'cs'), false);
    assert.equal(Object.hasOwn(layout.search, 'sections'), false);
  } finally { rmSync(root, { recursive: true }); }
});
