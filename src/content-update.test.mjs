import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { syncVaultPublication, verifyApprovedContent } from './approved-content.mjs';
import { VAULT_CONFIGS } from './vault-publication.mjs';

function fixture(t) {
  const root = fileURLToPath(new URL(`../dist/test/content-write-${randomUUID()}/`, import.meta.url));
  const source = join(root, 'vault');
  const site = join(root, 'site');
  mkdirSync(site, { recursive: true });
  const files = new Map([['homepage/home.md', ['content/home.md', '---\nsections: []\n---\n# Home\n']], ['homepage/pages/tech.md', ['content/pages/tech.md', '---\ntopics: {}\n---\n']],
    ...VAULT_CONFIGS.map(name => [`homepage/config/${name}.json`, [`config/${name}.json`, '{}']])]);
  const content = (id, title) => `---\nid: ${id}\nslug: ${id}\ntype: wiki\npublish: true\n---\n# ${title}\n`;
  const save = () => {
    for (const [file, [, text]] of files) { mkdirSync(dirname(join(source, file)), { recursive: true }); writeFileSync(join(source, file), text); }
    const entries = [...files].map(([file, [target, text]]) => ({ source: file, target, sha256: createHash('sha256').update(text).digest('hex') }));
    mkdirSync(join(source, 'tooling/dist'), { recursive: true });
    writeFileSync(join(source, 'tooling/dist/publication.json'), JSON.stringify({ version: 1, files: entries }));
  };
  for (const name of ['keep', 'remove']) files.set(`docs/${name}.md`, [`content/docs/${name}.md`, content(name, name)]);
  save();
  syncVaultPublication(source, site);
  const previous = new Map(['content/docs/keep.md', 'content/docs/remove.md', 'config/approved-content.json', 'config/publication-manifest.json'].map(file => [file, readFileSync(join(site, file))]));
  files.set('docs/keep.md', ['content/docs/keep.md', content('keep', 'changed')]);
  files.set('docs/new.md', ['content/docs/new.md', content('new', 'new')]);
  files.delete('docs/remove.md');
  save();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { source, site, previous };
}

const managedDocuments = site => Object.keys(verifyApprovedContent(site)).filter(file => file.startsWith('content/docs/')).sort();

function run(fixture, patch) {
  const script = `import fs from 'node:fs'; import { syncBuiltinESMExports } from 'node:module'; import { spawnSync } from 'node:child_process';
    const site = process.env.CONTENT_TEST_SITE;
    ${patch}
    syncBuiltinESMExports();
    const { syncVaultPublication } = await import('./src/approved-content.mjs');
    syncVaultPublication(process.env.CONTENT_TEST_SOURCE, site);`;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8',
    env: { ...process.env, CONTENT_TEST_SITE: fixture.site, CONTENT_TEST_SOURCE: fixture.source },
  });
}

function intact(fixture) {
  for (const [file, bytes] of fixture.previous) assert.deepEqual(readFileSync(join(fixture.site, file)), bytes, file);
  assert.equal(existsSync(join(fixture.site, 'content/docs/new.md')), false);
  assert.deepEqual(managedDocuments(fixture.site), ['content/docs/keep.md', 'content/docs/remove.md']);
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
      const other = spawnSync(process.execPath, ['--input-type=module', '--eval', "import { syncVaultPublication } from './src/approved-content.mjs'; syncVaultPublication(process.env.CONTENT_TEST_SOURCE, process.env.CONTENT_TEST_SITE);"], { encoding: 'utf8', env: process.env });
      if (other.status === 0 || !other.stderr.includes('content sync is already running')) throw new Error('competing sync was not rejected: ' + other.stderr);
    } return original(...args); };`);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(managedDocuments(fixtureValue.site), ['content/docs/keep.md', 'content/docs/new.md']);
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
  assert.throws(() => syncVaultPublication(fixtureValue.source, fixtureValue.site), /content sync is already running or needs recovery/);
});
