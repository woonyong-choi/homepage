// 파일 위치는 작성 편의를 위한 정보다. 주소와 문서 계층은 프런트매터에서만 읽는다.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent } from './content-model.mjs';

export function markdownFiles(root) {
  let entries;
  try { entries = readdirSync(root, { recursive: true, withFileTypes: true }); }
  catch (error) {
    if (error.code === 'ENOENT' && error.path === root) return [];
    throw error;
  }
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => join(entry.parentPath, entry.name)).sort();
}

export function readContentFile(file) {
  return parseContentSource(readFileSync(file, 'utf8'), file);
}

export function parseContentSource(source, file) {
  return { ...parseContent(source, `missing document metadata: ${file}`), file };
}
