// 토큰 정본(tokens/tokens.json)을 읽어 이름이 점으로 이어진 평평한 표로 만든다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 깨진 토큰 정본(모르는 참조, 순환 참조, 지원하지 않는 값)을 알리는 오류. */
export class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenError';
  }
}

/** @param {string} root 디자인 폴더(src/design) */
export function readTokens(root) {
  return JSON.parse(readFileSync(join(root, 'tokens', 'tokens.json'), 'utf8'));
}

/**
 * 토큰 트리를 `점.이름 → { name, value, type }` 표로 편다. 그룹의 `$type`은 안쪽 토큰에 적용된다.
 * @returns {Map<string, { name: string, value: unknown, type: string | undefined }>}
 */
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
