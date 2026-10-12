// 검증된 공개 투영만 가져오고 원문과 공개 출처의 해시를 함께 보존한다.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseContent } from './content-model.mjs';
import { resolveTopicId } from './topic-navigation.mjs';
import { markdownFiles, readContentFile, writeContentFiles } from './content-files.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
export function importPublication(sourceRoot, assetsRoot) {
  if (!assetsRoot || resolve(assetsRoot).startsWith(resolve(ROOT, '..'))) throw new Error('a separate private assets root is required');
  const validator = join(sourceRoot, 'scripts/check-public-projection.mjs');
  if (!existsSync(validator)) throw new Error('missing public projection validator');
  const checked = spawnSync(process.execPath, [validator], { cwd: sourceRoot, encoding: 'utf8' });
  if (checked.status !== 0) throw new Error(`public projection validation failed: ${checked.stderr}`);
  const input = join(sourceRoot, 'generated/public-content');
  const output = join(assetsRoot, 'documents/wiki');
  const existing = existsSync(output) ? markdownFiles(output).map(readContentFile) : [];
  const existingById = new Map(existing.map(entry => [entry.metadata.id, entry.metadata]));
  const documents = readdirSync(input).filter(name => name.endsWith('.md') && name !== 'README.md').map(name => {
    const source = readFileSync(join(input, name), 'utf8');
    const { metadata, body } = parseContent(source, `missing projection metadata: ${name}`);
    if (metadata.publication_state !== 'publish' || !/^[a-f0-9]{64}$/.test(metadata.projection_sha256)) throw new Error(`unapproved projection: ${name}`);
    if (/(?:file:\/\/|\/Users\/|source_session_ids?\s*:)/.test(source)) throw new Error(`private data in projection: ${name}`);
    return { ...metadata, name, source, body, slug: metadata.permalink.split('/').filter(Boolean).at(-1) };
  });
  const byId = new Map(documents.map(page => [page.projection_id, page]));
  const topics = readContentFile(join(ROOT, '../content/tech.md')).metadata.topics;
  const manifest = { source: 'https://docs.woonyong.com', documents: [] };
  mkdirSync(output, { recursive: true });
  const entries = [];
  for (const page of documents) {
    if (page.content_status === 'planned') continue;
    const topic = findTopic(page, byId, topics);
    if (!topics[topic]?.field || !topics[topic]?.icon) throw new Error(`missing topic metadata: ${topic} (${page.slug})`);
    const body = page.body.replace(/^\s*# [^\n]+\n/, '').replace(/^\{: [^\n]+\}\s*$/gm, '').trim();
    const paragraph = body.split(/\n\s*\n/).find(part => !/^(?:#|\||`|>|-|\{)/.test(part.trim())) ?? page.title;
    const id = createHash('sha256').update(page.projection_id).digest('hex').slice(0, 20);
    const parent = byId.get(page.public_parent_id);
    const parentId = parent && createHash('sha256').update(parent.projection_id).digest('hex').slice(0, 20);
    const metadata = mergePublicationMetadata({ id, slug: page.slug,
      type: 'wiki', title: page.title, description: excerpt(plainText(paragraph)), tags: [],
      field: topics[topic].field, category: topic, contentIcon: { name: topics[topic].icon }, visibility: 'public', comments: false,
      sourceUrl: `https://docs.woonyong.com${page.permalink}`, sourceHash: createHash('sha256').update(page.source).digest('hex'),
      parent: existingById.get(parentId)?.slug ?? parent?.slug ?? null }, existingById.get(id));
    entries.push({ metadata, body: `\n${body}\n` });
  }
  const previousPath = join(assetsRoot, 'imports/publication-manifest.json');
  const previous = existsSync(previousPath) ? JSON.parse(readFileSync(previousPath)).documents : [];
  const imported = new Set(previous.map(page => page.id));
  const incoming = new Set(entries.map(entry => entry.metadata.id));
  const manual = existing.filter(entry => !imported.has(entry.metadata.id) && !incoming.has(entry.metadata.id));
  const paths = writeContentFiles(output, [...entries, ...manual], existing);
  for (const { metadata } of entries) {
    manifest.documents.push({ id: metadata.id, slug: metadata.slug, file: paths.get(metadata.id), sourceUrl: metadata.sourceUrl, sourceHash: metadata.sourceHash });
  }
  mkdirSync(join(assetsRoot, 'imports'), { recursive: true });
  writeFileSync(join(assetsRoot, 'imports/topics.json'), JSON.stringify(topics, null, 2) + '\n');
  writeFileSync(previousPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest.documents.length;
}

export function mergePublicationMetadata(imported, existing) {
  if (!existing) return imported;
  const retained = {};
  for (const key of ['slug', 'category', 'parent', 'tags']) {
    if (Object.hasOwn(existing, key)) retained[key] = existing[key];
  }
  return { ...imported, ...retained };
}

export function findTopic(page, byId, topics) {
  const visited = new Set();
  let cursor = page;
  while (cursor && !visited.has(cursor.projection_id)) {
    if (topics[cursor.slug]) return resolveTopicId(cursor.slug, topics);
    const entry = Object.entries(topics).find(([, topic]) => topic.article === cursor.slug);
    if (entry) return entry[0];
    visited.add(cursor.projection_id);
    cursor = byId.get(cursor.public_parent_id);
  }
  const prefix = Object.keys(topics).find(key => page.slug.startsWith(`${key}-`));
  return resolveTopicId(prefix ?? 'computer-science', topics);
}

function plainText(value) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`#]/g, '').replace(/\s+/g, ' ').trim();
}

function excerpt(value) {
  if (value.length <= 180) return value;
  const first = value.match(/^.{50,180}?[.!?](?:\s|$)/)?.[0]?.trim();
  if (first) return first;
  return value.slice(0, 177).replace(/\s+\S*$/, '') + '…';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !process.argv[3]) throw new Error('usage: import-publication.mjs <approved-public-site-root> <private-assets-root>');
  console.log(`Imported ${importPublication(resolve(process.argv[2]), resolve(process.argv[3]))} sources for review; no homepage approval was changed`);
}
