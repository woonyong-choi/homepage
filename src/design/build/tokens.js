import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenError';
  }
}

export function readTokens(root) {
  return JSON.parse(readFileSync(join(root, 'tokens', 'tokens.json'), 'utf8'));
}

export function flattenTokens(node, path = [], inheritedType = undefined, out = new Map()) {
  const type = node.$type ?? inheritedType;
  if ('$value' in node) {
    const name = path.join('.');
    out.set(name, { name, value: node.$value, type });
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) flattenTokens(child, [...path, key], type, out);
  }
  return out;
}
