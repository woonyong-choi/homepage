import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { markdownFiles, documentPaths } from './content-files.mjs';
import { readDocument } from './content-model.mjs';
import { mergePublicationMetadata } from './import-publication.mjs';

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
  const root = fileURLToPath(new URL('./publication/', import.meta.url));
  const tags = JSON.parse(readFileSync(new URL('./tags.json', import.meta.url)));
  const categories = JSON.parse(readFileSync(new URL('./topics.json', import.meta.url)));
  const manifest = JSON.parse(readFileSync(new URL('./publication-manifest.json', import.meta.url)));
  const pages = markdownFiles(root).map(file => readDocument(readFileSync(file, 'utf8'), tags, new Date(), categories));
  assert.equal(pages.length, manifest.documents.length);
  for (const entry of manifest.documents) {
    const page = pages.find(page => page.id === entry.id);
    assert.equal(page.route, `/docs/${entry.slug}/`);
    assert.equal(page.sourceHash, entry.sourceHash);
  }
});
