import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTopicTrees } from './topic-navigation.mjs';
import { articlePage } from './publication-layout.mjs';
import { documentPager } from './document-navigation.mjs';
import { JSDOM } from 'jsdom';

function page(slug, parent, changes = {}) {
  return { id: slug, slug, parent, category: 'python', type: 'wiki', title: slug,
    route: `/articles/${slug}/`, tags: ['python'], description: '', html: '',
    headings: [], contentIcon: { name: 'python' }, ...changes };
}

// #57: 루트만 순회하면 순환 문서가 사라져도 정상 발행으로 처리된다.
test('createTopicTrees_rejects_self_mutual_and_disconnected_cycles', () => {
  for (const pages of [
    [page('a', 'a')],
    [page('a', 'b'), page('b', 'a')],
    [page('root'), page('a', 'b'), page('b', 'c'), page('c', 'a'), page('child', 'a')],
  ]) assert.throws(() => createTopicTrees(pages), /cyclic topic navigation: documents \(a/);
  assert.throws(() => createTopicTrees([page('a'), page('a')]), /duplicate navigation slug/);
});

test('createTopicTrees_keeps_parent_relations_and_excludes_blog_documents', () => {
  const pages = [page('a', 'unpublished'), page('b', 'a'),
    page('c', 'b', { type: 'blog' }), page('d', 'c'), page('e', 'b'),
    page('foreign', undefined, { category: 'javascript' }), page('f', 'foreign')];
  const topicTrees = createTopicTrees(pages);
  const tree = topicTrees.get('python');
  assert.deepEqual(tree.map(node => node.page.slug), ['a', 'd', 'foreign']);
  assert.equal(tree[2].children[0].page.slug, 'f');
  assert.deepEqual(tree[0].children[0].children.map(node => node.page.slug), ['e']);
  assert.strictEqual(tree[0].children[0].children[0].page, pages[4]);
  const html = articlePage(pages[1], pages, { topicTrees, topics: {
    python: { label: 'Python', group: 'tech', article: 'a' },
    javascript: { label: 'JavaScript', group: 'tech', article: 'foreign' },
  } });
  const navigation = html.match(/<details class="app-document-nav"[\s\S]*?<\/nav><\/details>/)[0];
  assert.match(navigation, /^<details class="app-document-nav" data-document-panel open>/);
  const treeDom = JSDOM.fragment(navigation);
  assert.deepEqual([...treeDom.querySelectorAll('nav summary > span, nav li > a')]
    .map(row => row.textContent), ['a', 'b', 'e', 'd', 'foreign', 'f']);
  assert.deepEqual([...treeDom.querySelectorAll('nav a')]
    .map(link => link.getAttribute('href')), ['/articles/e/', '/articles/d/', '/articles/f/']);
  assert.doesNotMatch(navigation, /JavaScript|>Tech<|>CS<|문서 목록|Search/);
  assert.equal((navigation.match(/aria-current="page"/g) ?? []).length, 1);
  assert.equal(pages[2].type, 'blog');
});

test('createTopicTrees_preserves_deep_input_without_using_the_call_stack', () => {
  const pages = Array.from({ length: 10000 }, (_, i) => page(`p-${i}`, i ? `p-${i - 1}` : null));
  let nodes = createTopicTrees(pages).get('python');
  for (const expected of pages) {
    assert.equal(nodes.length, 1);
    assert.strictEqual(nodes[0].page, expected);
    nodes = nodes[0].children;
  }
  assert.equal(nodes.length, 0);
});

test('document_pager_uses_sidebar_order_without_crossing_topics_or_including_blog_posts', () => {
  const pages = [page('orphan', 'private'), page('root'), page('child', 'root'),
    page('grandchild', 'child'), page('sibling', 'root'),
    page('post', 'child', { type: 'blog' }), page('other', null, { category: 'javascript' })];
  const context = { topicTrees: createTopicTrees(pages), topics: {
    python: { label: 'Python', article: 'root' }, javascript: { label: 'JavaScript', article: 'other' },
  } };
  const links = document => [...JSDOM.fragment(documentPager(document, context)).querySelectorAll('a')]
    .map(link => [link.rel, link.getAttribute('href')]);
  assert.deepEqual(links(pages[1]), [['next', '/articles/child/']]);
  assert.deepEqual(links(pages[2]), [['prev', '/articles/root/'], ['next', '/articles/grandchild/']]);
  assert.deepEqual(links(pages[3]), [['prev', '/articles/child/'], ['next', '/articles/sibling/']]);
  assert.deepEqual(links(pages[4]), [['prev', '/articles/grandchild/'], ['next', '/articles/orphan/']]);
  assert.deepEqual(links(pages[0]), [['prev', '/articles/sibling/']]);
  assert.equal(documentPager(pages[5], context), '');
  assert.equal(documentPager(pages[6], context), '');
  assert.equal(documentPager(page('missing'), context), '');
});

test('wiki_pager_follows_source_attribution_and_precedes_comments', () => {
  const root = page('root', null, { sourceUrl: 'https://example.com/source' });
  const pages = [root, page('child', 'root')];
  const html = articlePage(root, pages, { topicTrees: createTopicTrees(pages),
    topics: { python: { label: 'Python', article: 'root' } } }, '<section id="comments">댓글</section>');
  const positions = ['app-document-body', 'app-source-link', 'app-document-pager', 'id="comments"']
    .map(marker => html.indexOf(marker));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, positions.toSorted((a, b) => a - b));
});
