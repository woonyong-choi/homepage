import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { approveContent, revokeContent, syncApprovedContent, verifyApprovedContent } from './approved-content.mjs';

function fixture(t) {
  const root = fileURLToPath(new URL(`../dist/test/approval-${randomUUID()}/`, import.meta.url));
  const source = join(root, 'assets');
  const site = join(root, 'site');
  mkdirSync(join(source, 'documents/examples'), { recursive: true });
  mkdirSync(join(source, 'archive'), { recursive: true });
  mkdirSync(site, { recursive: true });
  const file = 'documents/examples/public.md';
  writeFileSync(join(source, file), '---\nvisibility: public\n---\n# Approved\n');
  writeFileSync(join(source, 'archive/private.md'), 'PRIVATE_CANARY');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { source, site, file, output: join(site, 'src/examples/public.md') };
}

test('syncApprovedContent_exports_only_approved_bytes_and_requires_reapproval_after_changes', t => {
  const f = fixture(t);
  approveContent(f.source, [f.file]);
  assert.equal(syncApprovedContent(f.source, f.site), 1);
  assert.equal(readFileSync(f.output, 'utf8'), '---\nvisibility: public\n---\n# Approved\n');
  assert.deepEqual(Object.keys(verifyApprovedContent(f.site)), ['src/examples/public.md']);
  writeFileSync(join(f.source, f.file), '---\nvisibility: public\n---\n# Changed\n');
  assert.throws(() => syncApprovedContent(f.source, f.site), /changed after approval/);
  assert.equal(readFileSync(f.output, 'utf8'), '---\nvisibility: public\n---\n# Approved\n');
  approveContent(f.source, [f.file]);
  syncApprovedContent(f.source, f.site);
  assert.equal(readFileSync(f.output, 'utf8'), '---\nvisibility: public\n---\n# Changed\n');
  revokeContent(f.source, [f.file]);
  syncApprovedContent(f.source, f.site);
  assert.equal(existsSync(f.output), false);
});

test('syncApprovedContent_does_not_overwrite_unapproved_public_edits_or_accept_wrong_source_root', t => {
  const f = fixture(t);
  assert.throws(() => syncApprovedContent(f.source, f.site), /ENOENT/);
  approveContent(f.source, [f.file]);
  syncApprovedContent(f.source, f.site);
  writeFileSync(f.output, 'local edit');
  assert.throws(() => syncApprovedContent(f.source, f.site), /changed outside approval/);
  assert.equal(readFileSync(f.output, 'utf8'), 'local edit');
  writeFileSync(f.output, '---\nvisibility: public\n---\n# Approved\n');
  writeFileSync(join(f.site, 'src/examples/unapproved.md'), 'unexpected');
  assert.throws(() => verifyApprovedContent(f.site), /unapproved/);
});

// #164: 발행 목록 해석과 새 항목 생성은 공개 사본을 바꾸기 전에 끝나야 한다.
test('syncApprovedContent_manifest_error_preserves_approved_inputs', async t => {
  const cases = [
    ['invalid JSON', null],
    ['missing id', [{ slug: 'wiki' }]],
    ['missing slug', [{ id: 'wiki' }]],
    ['non-string id', [{ id: 123, slug: 'wiki' }]],
    ['invalid slug', [{ id: 'wiki', slug: '../wiki' }]],
    ['duplicate id', [{ id: 'wiki', slug: 'first' }, { id: 'wiki', slug: 'second' }]],
    ['duplicate slug', [{ id: 'first', slug: 'wiki' }, { id: 'second', slug: 'wiki' }]],
  ];
  for (const [problem, identities] of cases) {
    await t.test(problem, t => {
      const f = fixture(t);
      approveContent(f.source, [f.file]);
      syncApprovedContent(f.source, f.site);
      const snapshot = join(f.site, 'src/approved-content.json');
      const manifest = join(f.site, 'src/publication-manifest.json');
      const previous = [readFileSync(f.output), readFileSync(snapshot)];
      writeFileSync(join(f.source, f.file), '---\nvisibility: public\n---\n# Changed\n');
      const sources = [f.file];
      if (!identities) writeFileSync(manifest, '{');
      else {
        mkdirSync(join(f.source, 'documents/wiki'));
        for (const [index, identity] of identities.entries()) {
          const source = `documents/wiki/entry-${index}.md`;
          writeFileSync(join(f.source, source), `---\n${JSON.stringify({ visibility: 'public', ...identity })}\n---\n# Wiki\n`);
          sources.push(source);
        }
      }
      approveContent(f.source, sources);
      const previousManifest = readFileSync(manifest);

      assert.throws(() => syncApprovedContent(f.source, f.site), identities ? /(?:invalid|duplicate) publication (?:id|slug)/ : SyntaxError);

      assert.deepEqual(readFileSync(f.output), previous[0]);
      assert.deepEqual(readFileSync(snapshot), previous[1]);
      assert.deepEqual(readFileSync(manifest), previousManifest);
      assert.equal(existsSync(join(f.site, 'src/publication/entry-0.md')), false);
      assert.equal(existsSync(join(f.site, 'src/publication/entry-1.md')), false);
    });
  }
});

// #164: 사전 목록 생성은 기존 순서와 승인 원문의 식별자·출처를 유지한다.
test('syncApprovedContent_valid_manifest_preserves_identity_provenance_and_order', t => {
  const f = fixture(t);
  const entries = [
    { id: 'first', slug: 'first-page', sourceUrl: 'https://docs.example.com/first/', sourceHash: 'a'.repeat(64) },
    { id: 'second', slug: 'second-page' },
  ];
  mkdirSync(join(f.source, 'documents/wiki'));
  for (const entry of entries) writeFileSync(join(f.source, `documents/wiki/${entry.id}.md`), `---\n${JSON.stringify({ visibility: 'public', ...entry })}\n---\n# Wiki\n`);
  approveContent(f.source, entries.map(entry => `documents/wiki/${entry.id}.md`));
  mkdirSync(join(f.site, 'src'));
  const manifest = join(f.site, 'src/publication-manifest.json');
  writeFileSync(manifest, JSON.stringify({ source: 'https://docs.example.com', documents: [{ id: 'second' }, { id: 'first' }] }));

  assert.equal(syncApprovedContent(f.source, f.site), 2);

  assert.deepEqual(JSON.parse(readFileSync(manifest)), { source: 'https://docs.example.com', documents: entries.toReversed().map(entry => ({ ...entry, file: `${entry.id}.md` })) });
  assert.equal(Object.keys(verifyApprovedContent(f.site)).length, 2);
});

test('approveContent_rejects_private_paths_traversal_symlinks_drafts_and_duplicate_approvals', t => {
  const f = fixture(t);
  for (const path of ['archive/private.md', '../private.md', 'documents/examples/../../archive/private.md', '/documents/examples/a.md']) {
    assert.throws(() => approveContent(f.source, [path]));
  }
  symlinkSync(join(f.source, 'archive/private.md'), join(f.source, 'documents/examples/link.md'));
  assert.throws(() => approveContent(f.source, ['documents/examples/link.md']), /symbolic links/);
  mkdirSync(join(f.source, 'documents/wiki'));
  writeFileSync(join(f.source, 'documents/wiki/draft.md'), '---\nvisibility: draft\n---\nPrivate');
  assert.throws(() => approveContent(f.source, ['documents/wiki/draft.md']), /draft or scheduled/);
  approveContent(f.source, [f.file]);
  const path = join(f.source, 'config/homepage-approvals.json');
  const approvals = JSON.parse(readFileSync(path));
  approvals.files.push(approvals.files[0]);
  writeFileSync(path, JSON.stringify(approvals));
  assert.throws(() => syncApprovedContent(f.source, f.site), /duplicate/);
});
