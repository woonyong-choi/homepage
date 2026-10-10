// 공개 승인한 원문의 해시와 일치하는 사본만 홈페이지 입력으로 내보낸다.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readContentFile } from './content-files.mjs';
import { isDocumentId } from './content-model.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const APPROVALS = 'config/homepage-approvals.json';
const SNAPSHOT = 'src/approved-content.json';
const SOURCES = Object.freeze({
  'documents/wiki/': 'src/publication/',
  'documents/examples/': 'src/examples/',
});

// cost: time O(b+n*(d+log n)), heap O(b+n), stack O(1), io O(n*d)
// vars: b = 승인 원문과 목록의 전체 바이트 수, n = 승인 파일 수, d = 최대 경로 깊이
// basis: estimate
export function approveContent(sourceRoot, sources) {
  if (!sources.length) throw new Error('explicit source files are required');
  const approvals = readApprovals(sourceRoot, { allowMissing: true });
  const entries = new Map(approvals.files.map(entry => [entry.source, entry]));
  for (const source of sources) {
    targetFor(source);
    const file = safeFile(sourceRoot, source);
    validatePublication(source, file);
    entries.set(source, { source, sha256: digest(readFileSync(file)) });
  }
  writeJson(safeFile(sourceRoot, APPROVALS), { version: 1, files: [...entries.values()].sort((a, b) => a.source.localeCompare(b.source)) });
}

export function revokeContent(sourceRoot, sources) {
  if (!sources.length) throw new Error('explicit source files are required');
  sources.forEach(targetFor);
  const approvals = readApprovals(sourceRoot);
  if (sources.some(source => !approvals.files.some(entry => entry.source === source))) throw new Error('source is not approved');
  writeJson(safeFile(sourceRoot, APPROVALS), { version: 1, files: approvals.files.filter(entry => !sources.includes(entry.source)) });
}

// cost: time O(b+n*(d+log n)), heap O(b+n), stack O(d), io O(n*d)
// vars: b = 승인 원문과 기존 사본의 전체 바이트 수, n = 검증할 파일 수, d = 최대 경로 깊이
// basis: estimate
export function syncApprovedContent(sourceRoot, siteRoot = ROOT) {
  const approvals = readApprovals(sourceRoot);
  const files = {};
  const copies = [];
  const documents = [];
  // 전체 승인과 기존 사본 검증을 먼저 끝내야 중간 실패로 공개 입력이 바뀌지 않는다.
  for (const entry of approvals.files) {
    const target = targetFor(entry.source);
    const source = safeFile(sourceRoot, entry.source);
    const metadata = validatePublication(entry.source, source);
    const content = readFileSync(source);
    if (digest(content) !== entry.sha256) throw new Error(`source changed after approval: ${entry.source}`);
    files[target] = entry.sha256;
    copies.push({ target: safeFile(siteRoot, target), content });
    if (target.startsWith('src/publication/')) documents.push({ id: metadata.id, slug: metadata.slug, file: target.slice('src/publication/'.length), sourceUrl: metadata.sourceUrl, sourceHash: metadata.sourceHash });
  }
  const snapshot = safeFile(siteRoot, SNAPSHOT);
  const previous = existsSync(snapshot) ? verifyApprovedContent(siteRoot) : {};
  if (!existsSync(snapshot)) {
    for (const file of managedFiles(siteRoot)) {
      if (!files[file] || digest(readFileSync(safeFile(siteRoot, file))) !== files[file]) throw new Error(`unmanaged existing content: ${file}`);
    }
  }
  const manifestPath = safeFile(siteRoot, 'src/publication-manifest.json');
  const manifest = createPublicationManifest(manifestPath, documents);
  for (const { target, content } of copies) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  for (const file of Object.keys(previous)) if (!Object.hasOwn(files, file)) unlinkSync(safeFile(siteRoot, file));
  writeJson(snapshot, { version: 1, files });
  writeJson(manifestPath, manifest);
  verifyApprovedContent(siteRoot);
  return copies.length;
}

// cost: time O(b+n*(d+log n)), heap O(b+n*d), stack O(d), io O(n*d)
// vars: b = 공개 사본과 목록의 전체 바이트 수, n = 검증할 파일 수, d = 최대 경로 깊이
// basis: estimate
export function verifyApprovedContent(siteRoot = ROOT) {
  const snapshot = JSON.parse(readFileSync(safeFile(siteRoot, SNAPSHOT), 'utf8'));
  if (snapshot.version !== 1 || !snapshot.files || typeof snapshot.files !== 'object' || Array.isArray(snapshot.files)) throw new Error('invalid content snapshot');
  const expected = Object.keys(snapshot.files).sort();
  if (JSON.stringify(expected) !== JSON.stringify(managedFiles(siteRoot))) throw new Error('unapproved, missing or renamed public content');
  for (const [file, hash] of Object.entries(snapshot.files)) {
    if (!/^[a-f0-9]{64}$/.test(hash) || digest(readFileSync(safeFile(siteRoot, file))) !== hash) throw new Error(`public content changed outside approval: ${file}`);
  }
  return snapshot.files;
}

// cost: time O(b), heap O(b), stack O(1), io O(1)
// vars: b = 승인 목록의 바이트 수
// basis: estimate
function readApprovals(root, { allowMissing = false } = {}) {
  const path = safeFile(root, APPROVALS);
  if (allowMissing && !existsSync(path)) return { version: 1, files: [] };
  const approvals = JSON.parse(readFileSync(path, 'utf8'));
  if (approvals.version !== 1 || !Array.isArray(approvals.files)) throw new Error('invalid approval list');
  const seen = new Set();
  for (const entry of approvals.files) {
    targetFor(entry.source);
    if (seen.has(entry.source) || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('duplicate or invalid approval');
    seen.add(entry.source);
  }
  return approvals;
}

function targetFor(source) {
  if (typeof source !== 'string' || !source.endsWith('.md')) throw new Error('only explicit document sources can be published');
  const prefix = Object.keys(SOURCES).find(prefix => source.startsWith(prefix));
  if (!prefix) throw new Error('archive and review files cannot be published');
  validatePath(source);
  return SOURCES[prefix] + source.slice(prefix.length);
}

function validatePath(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.includes('\0') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('invalid content path');
}

function safeFile(root, path) {
  validatePath(path);
  let cursor = resolve(root);
  if (!lstatSync(cursor).isDirectory() || lstatSync(cursor).isSymbolicLink()) throw new Error('invalid content root');
  for (const part of path.split('/')) {
    cursor = join(cursor, part);
    // 끊어진 심볼릭 링크도 거부한다.
    try {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error('symbolic links are not content sources');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return cursor;
}

function validatePublication(source, file) {
  if (!source.startsWith('documents/wiki/') && !source.startsWith('documents/examples/')) return;
  const { metadata } = readContentFile(file);
  if (metadata.visibility !== 'public' || (metadata.publishedAt && metadata.publishedAt > new Date().toISOString().slice(0, 10))) throw new Error(`draft or scheduled source cannot be exported: ${source}`);
  return metadata;
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
  Object.values(SOURCES).forEach(prefix => visit(prefix.slice(0, -1)));
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
// cost: time O(b), heap O(b), stack O(d), io O(1)
// vars: b = 직렬화한 JSON의 바이트 수, d = JSON의 최대 중첩 깊이
// basis: estimate
function writeJson(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(value, null, 2) + '\n'); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, sourceRoot, ...sources] = process.argv.slice(2);
  if (command === 'check') console.log(`Verified ${Object.keys(verifyApprovedContent()).length} approved content files`);
  else if (!sourceRoot) throw new Error('usage: approved-content.mjs <approve|revoke|sync> <assets-root> [source-files...]');
  else if (command === 'approve') approveContent(resolve(sourceRoot), sources);
  else if (command === 'revoke') revokeContent(resolve(sourceRoot), sources);
  else if (command === 'sync') console.log(`Exported ${syncApprovedContent(resolve(sourceRoot))} approved content files`);
  else throw new Error('unknown content command');
}
