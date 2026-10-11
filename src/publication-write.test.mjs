import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

function fixture(t) {
  const parent = fileURLToPath(new URL(`../dist/test/write-${randomUUID()}/`, import.meta.url));
  const root = join(parent, 'site');
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'index.html'), 'previous');
  writeFileSync(join(root, 'asset.txt'), 'previous asset');
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  return root;
}

function run(root, patch) {
  const script = `import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { spawnSync } from 'node:child_process';
    const root = process.env.PUBLICATION_TEST_ROOT;
    ${patch}
    syncBuiltinESMExports();
    const { replacePublication } = await import('./src/publication-output.mjs');
    replacePublication(root, new Map([['/', '<main>new</main>']]), new Map([['/asset.txt', 'new asset']]));`;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8',
    env: { ...process.env, PUBLICATION_TEST_ROOT: root },
  });
}

function previousIsIntact(root) {
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), 'previous');
  assert.equal(readFileSync(join(root, 'asset.txt'), 'utf8'), 'previous asset');
  assert.equal(existsSync(`${root}.lock`), false);
  assert.deepEqual(readdirSync(dirname(root)), ['site']);
}

test('write_failure_leaves_the_previous_publication_intact', t => {
  const root = fixture(t);
  const result = run(root, `const original = fs.writeFileSync; let writes = 0;
    fs.writeFileSync = (...args) => { if (++writes === 2) throw new Error('injected write failure'); return original(...args); };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /injected write failure/);
  previousIsIntact(root);
});

test('failed_directory_install_restores_the_previous_publication', t => {
  const root = fixture(t);
  const result = run(root, `const original = fs.renameSync; let failed = false;
    fs.renameSync = (source, destination) => {
      if (destination === root && !failed) { failed = true; throw new Error('injected install failure'); }
      return original(source, destination);
    };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /injected install failure/);
  previousIsIntact(root);
});

test('overlapping_writer_is_rejected_without_touching_the_active_build', t => {
  const root = fixture(t);
  const result = run(root, `const original = fs.writeFileSync; let checked = false;
    fs.writeFileSync = (...args) => {
      if (!checked) {
        checked = true;
        const second = spawnSync(process.execPath, ['--input-type=module', '--eval',
          "import { replacePublication } from './src/publication-output.mjs'; replacePublication(process.env.PUBLICATION_TEST_ROOT, new Map([['/', 'competitor']]), new Map());"],
          { encoding: 'utf8', env: process.env });
        if (second.status === 0 || !second.stderr.includes('publication is already locked')) throw new Error('competing writer was not rejected: ' + second.stderr);
        if (fs.readFileSync(root + '/index.html', 'utf8') !== 'previous') throw new Error('competing writer changed previous output');
      }
      return original(...args);
    };`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(root, 'index.html'), 'utf8'), '<main>new</main>');
  assert.equal(readFileSync(join(root, 'asset.txt'), 'utf8'), 'new asset');
  assert.equal(existsSync(`${root}.lock`), false);
  assert.deepEqual(readdirSync(dirname(root)), ['site']);
});

test('failed_restore_preserves_the_previous_directory_for_recovery', t => {
  const root = fixture(t);
  const result = run(root, `const original = fs.renameSync;
    fs.renameSync = (source, destination) => {
      if (destination === root) throw new Error('injected install and restore failure');
      return original(source, destination);
    };`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /publication restore failed; previous output remains at/);
  const names = readdirSync(dirname(root));
  assert.equal(names.length, 1);
  assert.match(names[0], /^site\.build-.+\.previous$/);
  assert.equal(readFileSync(join(dirname(root), names[0], 'index.html'), 'utf8'), 'previous');
  assert.equal(readFileSync(join(dirname(root), names[0], 'asset.txt'), 'utf8'), 'previous asset');
});
