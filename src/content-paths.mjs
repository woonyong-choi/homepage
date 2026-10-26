// 모든 발행·미리보기 입력은 정해진 루트 안의 경로만 사용한다.
import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export function validatePath(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.includes('\0') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('invalid content path');
}

export function safeFile(root, path) {
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

// 미리보기 입력은 루트 안의 상대 경로만 허용한다. 심볼릭 링크는 실제 위치도 루트 안이어야 한다.
export function within(root, name) {
  if (typeof name !== 'string' || !name || isAbsolute(name)) throw new Error('preview path must be relative');
  const target = resolve(root, name);
  const path = relative(root, target);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) throw new Error('preview path escapes input root');
  return target;
}

export function containedFile(root, name) {
  const target = realpathSync(within(root, name));
  within(root, relative(root, target));
  return target;
}
