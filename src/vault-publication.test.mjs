import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncVaultPublication, syncApprovedContent, verifyApprovedContent, publicationTopicsFile } from './approved-content.mjs';
import { VAULT_CONFIGS } from './vault-publication.mjs';

function fixture(t) {
  const root = fileURLToPath(new URL(`../dist/test/vault-${randomUUID()}/`, import.meta.url));
  const vault = join(root, 'vault');
  const site = join(root, 'site');
  mkdirSync(site, { recursive: true });
  const entries = [];
  const put = (source, target, text, extra = {}) => {
    const path = join(vault, source);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    const entry = { source, target, sha256: createHash('sha256').update(text).digest('hex'), ...extra };
    entries.push(entry);
    return entry;
  };
  const save = () => {
    const path = join(vault, 'tooling/dist/publication.json');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ version: 1, files: entries }));
  };
  put('homepage/home.md', 'content/home.md', '---\nsections: []\n---\n# Home\n');
  put('homepage/pages/tech.md', 'content/pages/tech.md', '---\ntopics: {}\n---\n');
  for (const name of VAULT_CONFIGS) put(`homepage/config/${name}.json`, `config/${name}.json`, '{}');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { vault, site, entries, put, save };
}
const doc = (extra = '') => `---\nid: entry\nslug: entry\ntype: wiki\npublish: true\n${extra}---\n# Public\n`;

test('syncVaultPublication_copies_only_listed_bytes_and_tracks_home_config_and_revocation', t => {
  const f = fixture(t);
  const entry = f.put('docs/topic/entry.md', 'content/docs/topic/entry.md', doc(), { id: 'entry', slug: 'entry', url: '/docs/entry/' });
  mkdirSync(join(f.vault, 'drafts'));
  writeFileSync(join(f.vault, 'drafts/private.md'), 'PRIVATE_CANARY');
  f.save();
  assert.equal(syncVaultPublication(f.vault, f.site), f.entries.length);
  assert.equal(readFileSync(join(f.site, entry.target), 'utf8'), doc());
  assert.equal(existsSync(join(f.site, 'drafts')), false);
  assert.equal(publicationTopicsFile(f.site), 'pages/tech.md');
  assert.equal(existsSync(join(f.site, 'content/tech.md')), false);
  assert.ok(verifyApprovedContent(f.site)['config/site.json']);
  f.entries.splice(f.entries.indexOf(entry), 1);
  f.save();
  syncVaultPublication(f.vault, f.site);
  assert.equal(existsSync(join(f.site, entry.target)), false);
  writeFileSync(join(f.site, 'content/home.md'), 'local edit');
  assert.throws(() => syncVaultPublication(f.vault, f.site), /changed outside approval/);
  assert.equal(readFileSync(join(f.site, 'content/home.md'), 'utf8'), 'local edit');
});

test('syncVaultPublication_rejects_policy_identity_and_hash_failures_before_changes', async t => {
  for (const [name, content, extra] of [
    ['private', doc().replace('publish: true', 'publish: false'), {}],
    ['missing publish', doc().replace('publish: true\n', ''), {}],
    ['draft', doc('status: draft\n'), {}],
    ['identity', doc(), { id: 'other' }],
    ['url', doc(), { url: '/docs/other/' }],
  ]) await t.test(name, t => {
    const f = fixture(t); f.save(); syncVaultPublication(f.vault, f.site);
    const before = readFileSync(join(f.site, 'config/approved-content.json'));
    f.put('docs/entry.md', 'content/docs/entry.md', content, extra); f.save();
    assert.throws(() => syncVaultPublication(f.vault, f.site));
    assert.deepEqual(readFileSync(join(f.site, 'config/approved-content.json')), before);
    assert.equal(existsSync(join(f.site, 'content/docs/entry.md')), false);
  });
});

test('syncVaultPublication_rejects_escape_duplicate_symlink_and_generated_config_inputs', async t => {
  for (const mode of ['escape', 'duplicate', 'symlink', 'config', 'hash']) await t.test(mode, t => {
    const f = fixture(t);
    const entry = f.put('docs/entry.md', 'content/docs/entry.md', doc());
    if (mode === 'escape') entry.target = '../secret.md';
    if (mode === 'duplicate') f.entries.push({ ...entry });
    if (mode === 'symlink') { rmSync(join(f.vault, entry.source)); symlinkSync(join(f.vault, 'homepage/home.md'), join(f.vault, entry.source)); }
    if (mode === 'config') f.put('homepage/config/assets.json', 'config/assets.json', '{}');
    if (mode === 'hash') writeFileSync(join(f.vault, entry.source), doc() + 'changed');
    f.save();
    assert.throws(() => syncVaultPublication(f.vault, f.site));
    assert.equal(existsSync(join(f.site, 'content/home.md')), false);
  });
});


test('syncVaultPublication_adopts_only_hash_verified_previous_files_and_retires_explicit_paths', t => {
  const f = fixture(t);
  mkdirSync(join(f.site, 'content'), { recursive: true });
  const before = {};
  for (const file of ['content/home.md', 'content/tech.md', 'content/interviews.md']) {
    writeFileSync(join(f.site, file), 'previous');
    before[file] = createHash('sha256').update('previous').digest('hex');
  }
  f.save();
  assert.throws(() => syncVaultPublication(f.vault, f.site), /unmanaged existing/);
  const receipt = { version: 1, homepageAdoption: { sourceCommit: 'a'.repeat(40), before,
    retire: ['content/tech.md', 'content/interviews.md'], applied: false } };
  writeFileSync(join(f.vault, 'tooling/migration-receipt.json'), JSON.stringify(receipt));
  writeFileSync(join(f.site, 'content/tech.md'), 'local edit');
  assert.throws(() => syncVaultPublication(f.vault, f.site), /adoption target changed/);
  assert.equal(readFileSync(join(f.site, 'content/home.md'), 'utf8'), 'previous');
  writeFileSync(join(f.site, 'content/tech.md'), 'previous');
  syncVaultPublication(f.vault, f.site);
  assert.equal(existsSync(join(f.site, 'content/tech.md')), false);
  assert.equal(existsSync(join(f.site, 'content/interviews.md')), false);
  assert.equal(publicationTopicsFile(f.site), 'pages/tech.md');
  syncVaultPublication(f.vault, f.site);
  assert.throws(() => syncApprovedContent(f.vault, f.site), /cannot fall back/);
});

test('syncVaultPublication_rejects_unlisted_home_section', t => {
  const f = fixture(t);
  f.entries.shift();
  f.put('homepage/home.md', 'content/home.md', '---\nsections:\n  - source: interviews/private.md\n---\n');
  f.save();
  assert.throws(() => syncVaultPublication(f.vault, f.site), /unlisted homepage section/);
});


test('syncVaultPublication_publishes_publish_entries_but_rejects_explicit_private_or_draft', async t => {
  for (const extra of ['', 'publish: false\n', 'status: draft\n']) {
    await t.test(extra || 'public article', t => {
      const f = fixture(t);
      f.put('publish/entry.md', 'content/blog/entry.md', `---\nid: entry\nslug: entry\ntype: blog\n${extra}---\n# Article\n`);
      f.save();
      if (extra) assert.throws(() => syncVaultPublication(f.vault, f.site), /private or draft/);
      else {
        syncVaultPublication(f.vault, f.site);
        assert.match(readFileSync(join(f.site, 'content/blog/entry.md'), 'utf8'), /Article/);
      }
    });
  }
});


test('syncVaultPublication_limits_asset_text_to_license_notices', t => {
  const f = fixture(t);
  f.put('assets/icon-NOTICE.txt', 'content/assets/icon-NOTICE.txt', 'Attribution');
  f.save();
  syncVaultPublication(f.vault, f.site);
  f.put('assets/notes.txt', 'content/assets/notes.txt', 'Not a license');
  f.save();
  assert.throws(() => syncVaultPublication(f.vault, f.site), /disallowed asset text/);
  assert.equal(existsSync(join(f.site, 'content/assets/notes.txt')), false);
});

// #279: 입력 폴더 변경은 공개 주소와 별개이며 기존 메타데이터 검증을 유지한다.
test('syncVaultPublication_rejects_old_source_and_invalid_publish_metadata', async t => {
  for (const [source, metadata, url] of [
    ['articles/entry.md', 'id: entry\nslug: entry\ntype: blog', '/blog/entry/'],
    ['publish/entry.md', 'id: entry\nslug: entry\ntype: wiki', '/blog/entry/'],
    ['publish/entry.md', 'id: entry\nslug: entry\ntype: blog', '/docs/entry/'],
    ['publish/entry.md', 'slug: entry\ntype: blog', '/blog/entry/'],
  ]) await t.test(`${source} ${metadata} ${url}`, t => {
    const f = fixture(t);
    f.put(source, 'content/blog/entry.md', `---\n${metadata}\n---\n# Entry\n`, { url });
    f.save();
    assert.throws(() => syncVaultPublication(f.vault, f.site));
    assert.equal(existsSync(join(f.site, 'content/home.md')), false);
  });
});
