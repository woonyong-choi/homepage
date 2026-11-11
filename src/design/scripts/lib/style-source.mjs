// 테마 스타일 진입점의 로컬 @import를 한 파일로 평탄화한다. 배포 CSS에는 @import가 남지 않는다.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { TokenError } from './tokens.mjs';

const SPECIFIER = /^(?:"([^"\\]*)"|'([^'\\]*)'|url\(\s*(?:"([^"\\]*)"|'([^'\\]*)'|([^\s"'()]+))\s*\))\s*$/;

/** 주석과 문자열 밖에서 @import가 나오는 위치를 찾는다. */
function nextImport(text, from) {
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new TokenError('unterminated CSS comment');
      i = end + 1;
    } else if (c === '"' || c === "'") {
      i++;
      while (i < text.length && text[i] !== c) i += text[i] === '\\' ? 2 : 1;
    } else if (c === '@' && text.slice(i, i + 7).toLowerCase() === '@import' && !/[\w-]/.test(text[i + 7] ?? '')) return i;
  }
  return -1;
}

/** 문장 끝의 세미콜론 위치. 따옴표 문자열 안은 건너뛴다. */
function statementEnd(text, from, file) {
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'") { i++; while (i < text.length && text[i] !== c) i += text[i] === '\\' ? 2 : 1; }
    else if (c === ';') return i;
    else if (c === '{') break;
  }
  throw new TokenError(`unterminated @import: ${file}`);
}

function hasOnlyCommentsBefore(text, end) {
  return text.slice(0, end).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import\s[^;]*;/gi, '').trim() === '';
}

function inside(boundary, path) {
  const rel = relative(boundary, path);
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && !rel.split(sep).includes('..');
}

/**
 * entry의 @import를 재귀적으로 펼친다.
 * 허용: 같은 테마 폴더 안의 상대 경로 `.css`, 규칙보다 앞선 위치, 파일당 한 번.
 * 거부: 외부 주소, 절대 경로, 폴더 밖 경로, 조건(media/layer/supports), 순환, 중복, 없는 파일, 규칙 뒤의 @import.
 * @param {string} entry 진입점 파일 경로
 * @param {string} boundary 가져올 수 있는 최상위 폴더(테마 폴더)
 * @returns {string} 평탄화한 CSS
 */
export function flattenStyle(entry, boundary) {
  const root = realpathSync(boundary);
  const seen = new Set();
  const label = file => relative(root, file) || file;

  function load(file, stack) {
    const real = realpathSync(file);
    if (stack.includes(real)) throw new TokenError(`css import cycle: ${[...stack, real].map(label).join(' -> ')}`);
    if (seen.has(real)) throw new TokenError(`duplicate css import: ${label(real)}`);
    seen.add(real);
    const text = readFileSync(real, 'utf8');
    let out = '';
    let cursor = 0;
    for (let at = nextImport(text, 0); at >= 0; at = nextImport(text, cursor)) {
      const end = statementEnd(text, at, label(real));
      if (!hasOnlyCommentsBefore(text, at)) throw new TokenError(`@import must precede all rules: ${label(real)}`);
      const match = SPECIFIER.exec(text.slice(at + 7, end).trim());
      if (!match) throw new TokenError(`unsupported @import (conditions are not allowed): ${text.slice(at, end + 1).trim()} in ${label(real)}`);
      const specifier = match.slice(1).find(value => value !== undefined);
      if (!specifier || /^[a-z][a-z0-9+.-]*:|^\/\//i.test(specifier) || isAbsolute(specifier)) throw new TokenError(`external css import: ${specifier} in ${label(real)}`);
      if (!specifier.endsWith('.css')) throw new TokenError(`css import must be a .css file: ${specifier} in ${label(real)}`);
      const target = resolve(dirname(real), specifier);
      if (!inside(root, target)) throw new TokenError(`css import outside theme folder: ${specifier} in ${label(real)}`);
      if (!existsSync(target)) throw new TokenError(`missing css import: ${specifier} in ${label(real)}`);
      const resolved = realpathSync(target);
      if (!inside(root, resolved)) throw new TokenError(`css import outside theme folder: ${specifier} in ${label(real)}`);
      out += text.slice(cursor, at) + load(resolved, [...stack, real]).replace(/\n+$/, '\n');
      cursor = text[end + 1] === '\n' ? end + 2 : end + 1;
    }
    return out + text.slice(cursor);
  }

  return load(entry, []);
}
