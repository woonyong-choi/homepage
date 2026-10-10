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
