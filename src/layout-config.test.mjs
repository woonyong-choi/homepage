import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { loadBlogLayout } from './layout-config.mjs';
import { parseHomeNavigation } from './home-content.mjs';
import { documentShell } from './publication-layout.mjs';
const CONFIG = Object.fromEntries(['blog', 'search'].map(name => [name, JSON.parse(fs.readFileSync(new URL(`../config/${name}.json`, import.meta.url), 'utf8'))]));
const LAYOUT = loadBlogLayout();

const document = html => JSDOM.fragment(html);

test('blog_layout_reports_setting_paths_instead_of_ignoring_typographical_errors', t => {
  for (const [change, expected] of [
    [value => { value.blog.collection.columns = 0; }, /config\/blog.json.collection.columns/],
    [value => { value.blog.collection.rows = -1; }, /config\/blog.json.collection.rows/],
    [value => { value.blog.card.title = 'false'; }, /config\/blog.json.card.title/],
    [value => { value.blog.card.media = 'video'; }, /config\/blog.json.card.media/],
    [value => { value.blog.card.icon = true; }, /config\/blog.json.card.icon/],
    [value => { value.search.box.labels.input = ''; }, /config\/search.json.box.labels.input/],
  ]) {
    const input = structuredClone(CONFIG);
    change(input);
    const readFile = t.mock.method(fs, 'readFileSync', url => JSON.stringify(input[url.pathname.split('/').at(-1).replace('.json', '')]));
    syncBuiltinESMExports();
    try { assert.throws(() => loadBlogLayout(), expected); } finally { readFile.mock.restore(); syncBuiltinESMExports(); }
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

test('blog_layout_rejects_icon_cards_without_title_or_description', t => {
  const input = structuredClone(CONFIG);
  const readFile = t.mock.method(fs, 'readFileSync', url => JSON.stringify(input[url.pathname.split('/').at(-1).replace('.json', '')]));
  syncBuiltinESMExports();
  try {
    for (const media of ['icon', 'none']) {
      input.blog.card = { media, title: false, description: false, tags: false, date: false, comments: false };
      assert.throws(() => loadBlogLayout(), /config\/blog.json.card/);
      for (const field of ['title', 'description']) {
        input.blog.card[field] = true;
        assert.deepEqual(loadBlogLayout().blog.card, input.blog.card);
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
    writeFileSync(join(root, 'blog.json'), JSON.stringify({ title: 'Blog', feedSize: 4, autoLoad: true, archiveLabel: '전체 글 보기', collection: { columns: 3, rows: 2 }, card: { ...LAYOUT.blog.card, author: true } }));
    writeFileSync(join(root, 'site.json'), JSON.stringify({ name: '글쓴이' }));
    writeFileSync(join(root, 'search.json'), JSON.stringify({ title: 'Search', box: LAYOUT.search.box }));
    const layout = loadBlogLayout(pathToFileURL(root + '/'));
    assert.equal(layout.blog.collection.rows, 2);
    assert.deepEqual(layout.blog.card.author, { name: '글쓴이' });
    assert.equal(Object.hasOwn(layout, 'cs'), false);
    assert.equal(Object.hasOwn(layout.search, 'sections'), false);
  } finally { rmSync(root, { recursive: true }); }
});
