// 검증된 공개 투영만 가져오고 원문과 공개 출처의 해시를 함께 보존한다.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { markdownFiles, readContentFile, writeContentFiles } from './content-files.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const TOPICS = [
  ['python', 'languages', 'python', ['파이썬']], ['javascript', 'languages', 'javascript', ['JS']],
  ['nodejs', 'languages', 'nodejs', ['Node.js']], ['programming-languages-runtime', 'languages', 'terminal', ['프로그래밍', '런타임']],
  ['os', 'cs', 'operating-system', ['운영체제', 'OS']], ['network', 'cs', 'network', ['네트워크']],
  ['algorithm', 'cs', 'algorithm', ['알고리즘']], ['data-structure', 'cs', 'data-structures', ['자료구조']],
  ['software-design', 'cs', 'architecture', ['설계', '시스템 설계']], ['ml', 'cs', 'model', ['머신러닝', 'ML']],
  ['llm', 'cs', 'model', ['LLM', '언어 모델']], ['computer-science', 'cs', 'processor', ['CS', '컴퓨터 과학']],
  ['spring-boot', 'frameworks', 'spring', ['Spring']], ['frontend', 'frameworks', 'components', ['프론트엔드']],
  ['backend-services', 'frameworks', 'api', ['백엔드']], ['database', 'infrastructure', 'database', ['DB', '데이터베이스']],
  ['redis', 'infrastructure', 'redis', ['캐시']], ['kubernetes', 'infrastructure', 'kubernetes', ['K8s']],
  ['linux', 'infrastructure', 'linux', ['리눅스']], ['security', 'infrastructure', 'security', ['보안']],
  ['platform-delivery-operations', 'infrastructure', 'deploy', ['DevOps', '인프라']],
  ['data', 'infrastructure', 'database', ['데이터']], ['projects', 'cs', 'project', ['프로젝트']],
];

export function importPublication(sourceRoot, assetsRoot) {
  if (!assetsRoot || resolve(assetsRoot).startsWith(resolve(ROOT, '..'))) throw new Error('a separate private assets root is required');
  const validator = join(sourceRoot, 'scripts/check-public-projection.mjs');
  if (!existsSync(validator)) throw new Error('missing public projection validator');
  const checked = spawnSync(process.execPath, [validator], { cwd: sourceRoot, encoding: 'utf8' });
  if (checked.status !== 0) throw new Error(`public projection validation failed: ${checked.stderr}`);
  const input = join(sourceRoot, 'generated/public-content');
  const output = join(assetsRoot, 'wiki');
  const existing = existsSync(output) ? markdownFiles(output).map(readContentFile) : [];
  const existingById = new Map(existing.map(entry => [entry.metadata.id, entry.metadata]));
  const documents = readdirSync(input).filter(name => name.endsWith('.md') && name !== 'README.md').map(name => {
    const source = readFileSync(join(input, name), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error(`missing projection metadata: ${name}`);
    const metadata = parse(match[1], { maxAliasCount: 0 });
    if (metadata.publication_state !== 'publish' || !/^[a-f0-9]{64}$/.test(metadata.projection_sha256)) throw new Error(`unapproved projection: ${name}`);
    if (/(?:file:\/\/|\/Users\/|source_session_ids?\s*:)/.test(source)) throw new Error(`private data in projection: ${name}`);
    return { ...metadata, name, source, body: match[2], slug: metadata.permalink.split('/').filter(Boolean).at(-1) };
  });
  const byId = new Map(documents.map(page => [page.projection_id, page]));
  const available = new Map(documents.map(page => [page.slug, page]));
  const display = JSON.parse(readFileSync(join(ROOT, 'topics.json'), 'utf8'));
  const topics = { ...display, ...Object.fromEntries(TOPICS.filter(([slug]) => available.has(slug)).map(([slug, field, icon, aliases]) => [slug, { label: display[slug]?.label ?? available.get(slug).title, field, icon, aliases, article: slug, ...(display[slug]?.group ? { group: display[slug].group } : {}), ...(display[slug]?.description ? { description: display[slug].description } : {}) }])) };
  const manifest = { source: 'https://docs.woonyong.com', documents: [] };
  mkdirSync(output, { recursive: true });
  const entries = [];
  for (const page of documents) {
    if (page.content_status === 'planned') continue;
    const topic = findTopic(page, byId, topics);
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

function findTopic(page, byId, topics) {
  const visited = new Set();
  let cursor = page;
  while (cursor && !visited.has(cursor.projection_id)) {
    if (topics[cursor.slug]) return cursor.slug;
    visited.add(cursor.projection_id);
    cursor = byId.get(cursor.public_parent_id);
  }
  const prefix = Object.keys(topics).find(key => page.slug.startsWith(`${key}-`));
  return prefix ?? 'computer-science';
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
