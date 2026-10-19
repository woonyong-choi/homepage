import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { markdownFiles, documentPaths, readContentFile } from './content-files.mjs';
import { readDocument, parseContent } from './content-model.mjs';
import { mergePublicationMetadata, findTopic } from './import-publication.mjs';

const page = (slug, parent, category = 'os') => ({ id: slug, slug, parent, category, type: 'wiki' });

// #141: 경로는 프런트매터에서 파생하며 다른 분류의 부모도 연결한다.
test('document_paths_mirror_parent_relations_without_changing_identifiers', () => {
  const pages = [page('os'), page('memory', 'os'), page('virtual-memory', 'memory', 'systems'), page('orphan', 'unpublished')];
  assert.deepEqual([...documentPaths(pages)], [['os', 'os/index.md'], ['memory', 'os/memory/index.md'], ['virtual-memory', 'os/memory/virtual-memory.md'], ['orphan', 'os/orphan.md']]);
  assert.equal(pages[2].parent, 'memory');
  assert.throws(() => documentPaths([page('a', 'b'), page('b', 'a')]), /cyclic/);
  assert.throws(() => documentPaths([page('../escape')]), /invalid document path/);
  assert.throws(() => documentPaths([page('same'), page('same')]), /duplicate/);
});

// #141: 원문을 재수입해도 사이트에서 정한 주소와 분류·부모·태그를 덮어쓰지 않는다.
test('import_preserves_site_metadata_and_refreshes_source_content_fields', () => {
  const original = { ...page('original'), title: '새 제목', tags: [], sourceHash: 'new' };
  const existing = { ...page('stable', 'parent', 'other'), tags: ['memory'], sourceHash: 'old' };
  const imported = mergePublicationMetadata(original, existing);
  assert.deepEqual([imported.slug, imported.parent, imported.category, imported.tags, imported.sourceHash, imported.title], ['stable', 'parent', 'other', ['memory'], 'new', '새 제목']);
  assert.deepEqual(mergePublicationMetadata(original), original);
});

// #141: 실제 하위 폴더의 공개 문서를 모두 읽고 URL은 slug로만 만든다.
test('nested_publication_files_keep_the_manifest_identity_and_routes', () => {
  const root = fileURLToPath(new URL('../content/docs/', import.meta.url));
  const tags = JSON.parse(readFileSync(new URL('../config/tags.json', import.meta.url)));
  const categories = readContentFile(new URL('../content/pages/tech.md', import.meta.url)).metadata.topics;
  const manifest = JSON.parse(readFileSync(new URL('../config/publication-manifest.json', import.meta.url)));
  const pages = markdownFiles(root).map(file => readDocument(readFileSync(file, 'utf8'), tags, new Date(), categories));
  assert.equal(pages.length, manifest.documents.length);
  for (const entry of manifest.documents) {
    const page = pages.find(page => page.id === entry.id);
    assert.equal(page.route, `/docs/${entry.slug}/`);
    assert.equal(page.sourceHash, entry.sourceHash);
  }
});

test('publication_topics_follow_canonical_aliases_and_entry_articles', () => {
  const topics = readContentFile(new URL('../content/pages/tech.md', import.meta.url)).metadata.topics;
  for (const slug of ['ml', 'llm']) {
    const root = { slug, projection_id: slug };
    const child = { slug: 'lesson', projection_id: 'child', public_parent_id: slug };
    const byId = new Map([[slug, root], ['child', child]]);
    for (const page of [root, child]) {
      const topic = topics[findTopic(page, byId, topics)];
      assert.deepEqual([topic.field, topic.icon], ['cs', 'brain-circuit']);
    }
  }
  assert.equal(findTopic({ slug: topics.os.article }, new Map(), topics), 'os');
  assert.equal(findTopic({ slug: 'unclassified' }, new Map(), topics), 'computer-science');
});


test('shared_content_parser_preserves_body_line_endings_and_rejects_yaml_aliases', () => {
  for (const newline of ['\n', '\r\n']) {
    const body = `본문${newline}---${newline}끝${newline}`;
    assert.deepEqual(parseContent(`---${newline}id: sample${newline}---${newline}${body}`), { metadata: { id: 'sample' }, body });
  }
  assert.throws(() => parseContent('본문', 'missing projection metadata: sample'), /missing projection metadata: sample/);
  assert.throws(() => parseContent('---\nid: &id sample\nslug: *id\n---\n본문'), /alias/i);
  assert.throws(() => documentPaths([page(123)]), /invalid document path metadata/);
});

// #327: Git은 비어 있는 공개 폴더를 보존하지 않는다.
test('markdownFiles_missing_publication_roots_return_empty_and_other_errors_propagate', t => {
  const root = fileURLToPath(new URL(`../dist/test/content-files-${randomUUID()}/`, import.meta.url));
  mkdirSync(root, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = join(root, 'document.md');
  writeFileSync(file, '본문');

  for (const folder of ['docs', 'blog']) assert.deepEqual(markdownFiles(join(root, folder)), []);
  assert.throws(() => markdownFiles(file), { code: 'ENOTDIR' });
});
