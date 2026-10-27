// Vault가 명시한 파일의 동일 바이트를 검증하며 원고 트리를 탐색하지 않는다.
import { readFileSync } from 'node:fs';

import { parseContentSource } from './content-files.mjs';
import { safeFile, validatePath } from './content-paths.mjs';
import { isDocumentId } from './content-model.mjs';
import { publishDate } from './content-metadata.mjs';
import { sha256 } from './sha256.mjs';

export const VAULT_CONFIGS = Object.freeze(['site', 'tags', 'search', 'cs', 'tech', 'blog']);

export function readVaultPublication(root) {
  const manifest = JSON.parse(readFileSync(safeFile(root, 'tooling/dist/publication.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.files)) throw new Error('invalid Vault publication manifest');
  const sources = new Set();
  const targets = new Set();
  const identities = { id: new Set(), slug: new Set() };
  const entries = manifest.files.map(entry => {
    validateEntry(entry);
    if (sources.has(entry.source) || targets.has(entry.target)) throw new Error('duplicate Vault publication source or target');
    sources.add(entry.source);
    targets.add(entry.target);
    const content = readFileSync(safeFile(root, entry.source));
    if (sha256(content) !== entry.sha256) throw new Error(`Vault source changed after manifest: ${entry.source}`);
    const metadata = entry.source.endsWith('.md') ? parseContentSource(content.toString('utf8'), entry.source).metadata : undefined;
    if (metadata) validateMetadata(entry, metadata, identities);
    if (entry.target.startsWith('config/')) JSON.parse(content.toString('utf8'));
    return { ...entry, content, metadata };
  });
  for (const target of ['content/home.md', 'content/pages/tech.md', ...VAULT_CONFIGS.map(name => `config/${name}.json`)]) {
    if (!targets.has(target)) throw new Error(`missing Vault publication input: ${target}`);
  }
  const home = entries.find(entry => entry.target === 'content/home.md');
  for (const section of home.metadata.sections ?? []) {
    if (section.source !== undefined && !sources.has(`homepage/${section.source}`)) throw new Error(`unlisted homepage section: ${section.source}`);
  }
  return entries;
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object' || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('invalid Vault publication entry');
  validatePath(entry.source);
  validatePath(entry.target);
  let target;
  if (entry.source.startsWith('homepage/config/')) {
    const name = entry.source.slice('homepage/config/'.length);
    if (VAULT_CONFIGS.some(value => name === `${value}.json`)) target = `config/${name}`;
  } else if (/^homepage\/(?:home\.md|(?:pages|interviews)\/.+\.md)$/.test(entry.source)) {
    target = `content/${entry.source.slice('homepage/'.length)}`;
  } else if (/^(docs|publish)\/.+\.md$/.test(entry.source)) {
    target = entry.source.replace(/^docs\//, 'content/docs/').replace(/^publish\//, 'content/blog/');
  } else if (entry.source.startsWith('assets/') && /^content\/(assets|media)\/.+\.(?:png|jpe?g|gif|webp|svg|avif|mp4|webm|mp3|wav|ogg|pdf|woff2?|txt)$/i.test(entry.target)) {
    target = entry.target;
  }
  if (/\.txt$/i.test(entry.target) && !/-(?:NOTICE|LICENSE)\.txt$/.test(entry.target)) throw new Error(`disallowed asset text: ${entry.target}`);
  if (target !== entry.target) throw new Error(`disallowed Vault publication mapping: ${entry.source} -> ${entry.target}`);
}

function validateMetadata(entry, metadata, identities) {
  if (!metadata || typeof metadata !== 'object') throw new Error(`invalid Vault metadata: ${entry.source}`);
  const docs = entry.source.startsWith('docs/');
  const article = entry.source.startsWith('publish/');
  if ((docs && metadata.publish !== true) || metadata.publish === false || metadata.status === 'draft' || (metadata.visibility !== undefined && metadata.visibility !== 'public')) {
    throw new Error(`private or draft Vault source: ${entry.source}`);
  }
  if (metadata.publishedAt && metadata.publishedAt > publishDate()) throw new Error(`scheduled Vault source: ${entry.source}`);
  if (!docs && !article) return;
  for (const key of ['id', 'slug']) {
    if (!isDocumentId(metadata[key]) || identities[key].has(metadata[key])) throw new Error(`invalid or duplicate Vault document ${key}`);
    if (entry[key] !== undefined && entry[key] !== metadata[key]) throw new Error(`Vault document ${key} changed: ${entry.source}`);
    identities[key].add(metadata[key]);
  }
  if (metadata.type !== (article ? 'blog' : 'wiki')) throw new Error(`Vault document type conflicts with source: ${entry.source}`);
  const route = `/${article ? 'blog' : 'docs'}/${metadata.slug}/`;
  if (entry.url !== undefined && entry.url !== route && entry.url !== `https://woonyong.com${route}`) throw new Error(`Vault document URL changed: ${entry.source}`);
}

