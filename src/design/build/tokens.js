// Reads the token source (tokens/tokens.json and tokens/tokens.dark.json) into flat tables and resolves references.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REFERENCE = /^\{([^{}]+)\}$/;

/** Error for a broken token source: unknown reference, reference cycle, or a dark token without a light counterpart. */
export class TokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * Reads both source files.
 * @param {string} root repository root
 * @returns {{ light: object, dark: object }}
 */
export function readSource(root) {
  const read = name => JSON.parse(readFileSync(join(root, 'tokens', name), 'utf8'));
  return { light: read('tokens.json'), dark: read('tokens.dark.json') };
}

/**
 * Flattens a source tree into a map of dotted name to `{ name, value, type, description }`. A group `$type` applies to the tokens inside it.
 * @param {object} node
 * @returns {Map<string, { name: string, value: unknown, type: string | undefined, description: string | undefined }>}
 */
export function flattenTokens(node, path = [], inheritedType = undefined, out = new Map()) {
  const type = node.$type ?? inheritedType;
  if ('$value' in node) {
    const name = path.join('.');
    out.set(name, { name, value: node.$value, type, description: node.$description });
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) flattenTokens(child, [...path, key], type, out);
  }
  return out;
}

/**
 * Builds the light table and the dark table. The dark table is the light table with the dark source laid over it.
 * @param {{ light: object, dark: object }} source
 * @returns {{ light: Map, dark: Map }}
 * @throws {TokenError} when a dark token has no light token or a different type
 */
export function buildTables(source) {
  const light = flattenTokens(source.light);
  const darkOnly = flattenTokens(source.dark);
  for (const [name, token] of darkOnly) {
    if (!light.has(name)) throw new TokenError(`tokens.dark.json has a token missing from tokens.json: ${name}`);
    if (light.get(name).type !== token.type) throw new TokenError(`dark token type differs from the light token: ${name}`);
  }
  return { light, dark: new Map([...light, ...darkOnly]) };
}

/** The referenced name of a `{a.b}` value, or null. */
export function referenceOf(value) {
  const match = typeof value === 'string' ? REFERENCE.exec(value) : null;
  return match ? match[1] : null;
}

/**
 * Follows references to the final value.
 * @param {Map} table
 * @param {string} name
 * @returns {{ value: unknown, type: string | undefined }}
 * @throws {TokenError} for an unknown reference or a reference cycle
 */
export function resolveToken(table, name) {
  const seen = [];
  let current = name;
  for (;;) {
    if (seen.includes(current)) throw new TokenError(`token reference cycle: ${[...seen, current].join(' -> ')}`);
    seen.push(current);
    const token = table.get(current);
    if (!token) throw new TokenError(`unknown token reference: ${seen.join(' -> ')}`);
    const target = referenceOf(token.value);
    if (!target) return { value: token.value, type: token.type };
    current = target;
  }
}

/** The final `#rrggbb` of a color token. */
export function resolveColor(table, name) {
  const { value } = resolveToken(table, name);
  if (!/^#[0-9a-f]{6}$/.test(value)) throw new TokenError(`${name} is not a #rrggbb color: ${value}`);
  return value;
}
