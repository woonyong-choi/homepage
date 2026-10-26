// 공개 승인한 원문의 해시와 일치하는 사본만 홈페이지 입력으로 내보낸다.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDocumentId } from './content-model.mjs';
import { updateContent } from './content-update.mjs';
import { safeFile } from './content-paths.mjs';
import { readVaultPublication, VAULT_CONFIGS } from './vault-publication.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SNAPSHOT = 'config/approved-content.json';
const DOCUMENT_ROOTS = ['content/docs', 'content/blog'];

/** 명시한 발행 입력만 기존 복구 가능한 동기화 경로로 전달한다. */
export function syncVaultPublication(sourceRoot, siteRoot = ROOT) {
  return updateContent(siteRoot, root => {
    const entries = readVaultPublication(sourceRoot);
    const snapshot = safeFile(root, SNAPSHOT);
    const previous = existsSync(snapshot) ? verifyApprovedContent(root) : {};
    const hashes = Object.fromEntries(entries.map(entry => [entry.target, entry.sha256]));
    for (const entry of entries) {
      const target = safeFile(root, entry.target);
      if (!Object.hasOwn(previous, entry.target) && existsSync(target) && digest(readFileSync(target)) !== entry.sha256) {
        throw new Error(`unmanaged existing content: ${entry.target}`);
      }
    }
    const updates = new Map(entries.map(entry => [safeFile(root, entry.target), entry.content]));
    for (const file of Object.keys(previous)) if (!Object.hasOwn(hashes, file)) updates.set(safeFile(root, file), null);
    const documents = entries.filter(entry => entry.target.startsWith('content/docs/')).map(entry => ({
      id: entry.metadata.id, slug: entry.metadata.slug, file: entry.target.slice('content/docs/'.length),
      sourceUrl: entry.metadata.sourceUrl, sourceHash: entry.metadata.sourceHash,
    }));
    const manifest = safeFile(root, 'config/publication-manifest.json');
    updates.set(manifest, JSON.stringify(createPublicationManifest(manifest, documents), null, 2) + '\n');
    updates.set(snapshot, JSON.stringify({ version: 1, origin: 'vault', files: hashes }, null, 2) + '\n');
    return { files: updates, result: entries.length };
  }, verifyApprovedContent);
}

// cost: time O(b+n*(d+log n)), heap O(b+n*d), stack O(d), io O(n*d)
// vars: b = 공개 사본과 목록의 전체 바이트 수, n = 검증할 파일 수, d = 최대 경로 깊이
// basis: estimate
export function verifyApprovedContent(siteRoot = ROOT) {
  const snapshot = JSON.parse(readFileSync(safeFile(siteRoot, SNAPSHOT), 'utf8'));
  if (snapshot.version !== 1 || !snapshot.files || typeof snapshot.files !== 'object' || Array.isArray(snapshot.files)) throw new Error('invalid content snapshot');
  if (snapshot.origin !== 'vault') throw new Error('invalid content snapshot origin');
  const expected = Object.keys(snapshot.files).sort();
  if (JSON.stringify(expected) !== JSON.stringify([...managedFiles(siteRoot), ...expected.filter(path => /^content\/(assets|media)\//.test(path))].sort())) throw new Error('unapproved, missing or renamed public content');
  for (const [file, hash] of Object.entries(snapshot.files)) {
    if (!/^[a-f0-9]{64}$/.test(hash) || digest(readFileSync(safeFile(siteRoot, file))) !== hash) throw new Error(`public content changed outside approval: ${file}`);
  }
  return snapshot.files;
}

// cost: time O(n*(d+log n)), heap O(n*d), stack O(d), io O(n*d)
// vars: n = 관리 경로의 파일과 폴더 수, d = 최대 경로 깊이
// basis: estimate
function managedFiles(root) {
  const result = [];
  // cost: time O(n*d), heap O(n*d), stack O(d), io O(n*d)
  // vars: n = 현재 경로 아래 파일과 폴더 수, d = 최대 경로 깊이
  // basis: estimate
  function visit(path) {
    const file = safeFile(root, path);
    if (!existsSync(file)) return;
    for (const entry of readdirSync(file, { withFileTypes: true })) {
      const child = `${path}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error('symbolic links are not public content');
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && entry.name.endsWith('.md')) result.push(child);
    }
  }
  for (const dir of [...DOCUMENT_ROOTS, 'content/pages', 'content/interviews']) visit(dir);
  for (const file of ['content/home.md', ...VAULT_CONFIGS.map(name => `config/${name}.json`)]) {
    if (existsSync(safeFile(root, file))) result.push(file);
  }
  return result.sort();
}

// cost: time O(b+n*log n), heap O(b+n), stack O(1), io O(1)
// vars: b = 기존 발행 목록의 바이트 수, n = 기존 항목과 새 항목 수
// basis: estimate
function createPublicationManifest(path, documents) {
  for (const key of ['id', 'slug']) {
    const values = documents.map(document => document[key]);
    if (values.some(value => !isDocumentId(value))) throw new Error(`invalid publication ${key}`);
    if (new Set(values).size !== values.length) throw new Error(`duplicate publication ${key}`);
  }
  const manifest = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { source: 'https://docs.woonyong.com' };
  const order = new Map((manifest.documents ?? []).map((document, index) => [document.id, index]));
  manifest.documents = documents.sort((left, right) => (order.get(left.id) ?? Infinity) - (order.get(right.id) ?? Infinity) || left.id.localeCompare(right.id));
  return manifest;
}

function digest(content) { return createHash('sha256').update(content).digest('hex'); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, sourceRoot] = process.argv.slice(2);
  if (command === 'check') console.log(`Verified ${Object.keys(verifyApprovedContent()).length} approved content files`);
  else if (!sourceRoot) throw new Error('usage: approved-content.mjs <check|sync-vault <vault-root>>');
  else if (command === 'sync-vault') console.log(`Exported ${syncVaultPublication(resolve(sourceRoot))} Vault input files`);
  else throw new Error('unknown content command');
}
