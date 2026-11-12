import { lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function validatePath(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.includes('\0') || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('invalid content path');
}

export function safeFile(root, path) {
  validatePath(path);
  let cursor = resolve(root);
  if (!lstatSync(cursor).isDirectory() || lstatSync(cursor).isSymbolicLink()) throw new Error('invalid content root');
  for (const part of path.split('/')) {
    cursor = join(cursor, part);
    try {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error('symbolic links are not content sources');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return cursor;
}
