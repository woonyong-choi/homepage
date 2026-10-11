import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { approveContent, revokeContent, syncApprovedContent, verifyApprovedContent } from './approved-content.mjs';

function fixture(t) {
  const root = fileURLToPath(new URL(`../dist/test/content-write-${randomUUID()}/`, import.meta.url));
  const source = join(root, 'source');
  const site = join(root, 'site');
  mkdirSync(join(source, 'documents/examples'), { recursive: true });
  mkdirSync(site);
  const content = title => `---\nvisibility: public\n---\n# ${title}\n`;
  for (const name of ['keep', 'remove']) writeFileSync(join(source, `documents/examples/${name}.md`), content(name));
  approveContent(source, ['documents/examples/keep.md', 'documents/examples/remove.md']);
  syncApprovedContent(source, site);
  const previous = new Map(['content/docs/keep.md', 'content/docs/remove.md', 'config/approved-content.json', 'config/publication-manifest.json'].map(file => [file, readFileSync(join(site, file))]));
  writeFileSync(join(source, 'documents/examples/keep.md'), content('changed'));
  writeFileSync(join(source, 'documents/examples/new.md'), content('new'));
  revokeContent(source, ['documents/examples/remove.md']);
  approveContent(source, ['documents/examples/keep.md', 'documents/examples/new.md']);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { source, site, previous };
}

function run(fixture, patch) {
  const script = `import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module'; import { spawnSync } from 'node:child_process';
    const site = process.env.CONTENT_TEST_SITE;
    ${patch}
    syncBuiltinESMExports();
    const { syncApprovedContent } = await import('./src/approved-content.mjs');
    syncApprovedContent(process.env.CONTENT_TEST_SOURCE, site);`;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8',
    env: { ...process.env, CONTENT_TEST_SITE: fixture.site, CONTENT_TEST_SOURCE: fixture.source },
  });
}

function intact(fixture) {
  for (const [file, bytes] of fixture.previous) assert.deepEqual(readFileSync(join(fixture.site, file)), bytes, file);
  assert.equal(existsSync(join(fixture.site, 'content/docs/new.md')), false);
  assert.deepEqual(Object.keys(verifyApprovedContent(fixture.site)).sort(), ['content/docs/keep.md', 'content/docs/remove.md']);
  assert.equal(readdirSync(fixture.site).some(name => name.startsWith('.content-sync')), false);
}

test('failed_preparation_keeps_copies_and_both_manifests_intact', t => {
  const fixtureValue = fixture(t);
  const result = run(fixtureValue, `const original = fs.writeFileSync; let count = 0;
    fs.writeFileSync = (...args) => { if (++count === 4) throw new Error('injected write failure'); return original(...args); };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /injected write failure/);
  intact(fixtureValue);
});

test('failed_manifest_install_restores_changed_deleted_and_new_files', t => {
  const fixtureValue = fixture(t);
  const result = run(fixtureValue, `const original = fs.renameSync; let failed = false;
    fs.renameSync = (source, target) => { if (target === site + '/config/approved-content.json' && !failed) { failed = true; throw new Error('injected install failure'); } return original(source, target); };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /injected install failure/);
  intact(fixtureValue);
});

test('concurrent_sync_cannot_enter_the_same_content_update', t => {
  const fixtureValue = fixture(t);
  const result = run(fixtureValue, `const original = fs.writeFileSync; let checked = false;
    fs.writeFileSync = (...args) => { if (!checked) { checked = true;
      const other = spawnSync(process.execPath, ['--input-type=module', '--eval', "import { syncApprovedContent } from './src/approved-content.mjs'; syncApprovedContent(process.env.CONTENT_TEST_SOURCE, process.env.CONTENT_TEST_SITE);"], { encoding: 'utf8', env: process.env });
      if (other.status === 0 || !other.stderr.includes('content sync is already running')) throw new Error('competing sync was not rejected: ' + other.stderr);
    } return original(...args); };`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(Object.keys(verifyApprovedContent(fixtureValue.site)).sort(), ['content/docs/keep.md', 'content/docs/new.md']);
  assert.equal(readdirSync(fixtureValue.site).some(name => name.startsWith('.content-sync')), false);
});

test('failed_restore_preserves_backup_and_lock_for_explicit_recovery', t => {
  const fixtureValue = fixture(t);
  const result = run(fixtureValue, `const original = fs.renameSync;
    fs.renameSync = (source, target) => { if (target === site + '/config/approved-content.json') throw new Error('injected install and restore failure'); return original(source, target); };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /content recovery required; preserved files/);
  assert.ok(existsSync(join(fixtureValue.site, '.content-sync.lock')));
  const directory = readdirSync(fixtureValue.site).find(name => name.startsWith('.content-sync-'));
  const records = JSON.parse(readFileSync(join(fixtureValue.site, directory, 'recovery.json')));
  const snapshot = records.find(record => record.target.endsWith('/config/approved-content.json'));
  assert.deepEqual(readFileSync(snapshot.backup), fixtureValue.previous.get('config/approved-content.json'));
  assert.throws(() => syncApprovedContent(fixtureValue.source, fixtureValue.site), /content sync is already running or needs recovery/);
});
