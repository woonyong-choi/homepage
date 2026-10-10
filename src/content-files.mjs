// 파일 위치는 작성 편의를 위한 정보다. 주소와 문서 계층은 프런트매터에서만 읽는다.
import { readdirSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, existsSync, rmdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { parse, stringify } from 'yaml';

export function markdownFiles(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => join(entry.parentPath, entry.name)).sort();
}

export function readContentFile(file) {
  const source = readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`missing document metadata: ${file}`);
  return { metadata: parse(match[1], { maxAliasCount: 0 }), body: match[2], file };
}

// cost: time O(n*d), heap O(n*d), stack O(1)
// vars: n = 문서 수, d = 최대 부모 깊이
// basis: estimate
export function documentPaths(pages) {
  const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const bySlug = new Map(pages.map(page => [page.slug, page]));
  if (bySlug.size !== pages.length) throw new Error('duplicate document slug');
  const parents = new Set(pages.filter(page => page.type === 'wiki').map(page => page.parent));
  const result = new Map();
  for (const page of pages) {
    if (!valid.test(page.slug ?? '') || !valid.test(page.category ?? '')) throw new Error('invalid document path metadata');
    if (page.type === 'blog') { result.set(page.id, join('blog', `${page.slug}.md`)); continue; }
    const chain = [];
    const visited = new Set();
    let cursor = page;
    let root = page;
    while (cursor?.type === 'wiki') {
      if (visited.has(cursor.slug)) throw new Error(`cyclic document parent: ${page.slug}`);
      visited.add(cursor.slug);
      chain.unshift(cursor.slug);
      root = cursor;
      cursor = bySlug.get(cursor.parent);
    }
    if (chain[0] !== root.category) chain.unshift(root.category);
    if (parents.has(page.slug)) chain.push('index.md');
    else chain[chain.length - 1] += '.md';
    result.set(page.id, join(...chain));
  }
  return result;
}

export function writeContentFiles(root, entries, previous = []) {
  const paths = documentPaths(entries.map(entry => entry.metadata));
  const ids = new Set(entries.map(entry => entry.metadata.id));
  if (ids.size !== entries.length) throw new Error('duplicate document id');
  for (const entry of entries) {
    const destination = join(root, paths.get(entry.metadata.id));
    if (existsSync(destination) && readContentFile(destination).metadata.id !== entry.metadata.id) throw new Error(`document path collision: ${destination}`);
  }
  for (const entry of entries) {
    const destination = join(root, paths.get(entry.metadata.id));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, `---\n${stringify(entry.metadata, { lineWidth: 0 })}---\n${entry.body}`);
  }
  for (const entry of previous) {
    if (relative(root, entry.file) === paths.get(entry.metadata.id)) continue;
    const path = relative(root, entry.file);
    if (path.startsWith('..') || !path || !existsSync(entry.file)) throw new Error('invalid previous document path');
    unlinkSync(entry.file);
    let folder = dirname(entry.file);
    while (folder !== root && readdirSync(folder).length === 0) { rmdirSync(folder); folder = dirname(folder); }
  }
  return paths;
}
