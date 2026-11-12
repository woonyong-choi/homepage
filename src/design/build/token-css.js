// 테마 토큰을 검증하고 CSS 변수와 계산용 값으로 변환한다.
import { flattenTokens, TokenError } from './tokens.js';

const REFS = /\{([\w.-]+)\}/g;
const EXACT = /^\{([\w.-]+)\}$/;
export const cssName = (name) => `--${name.replaceAll('.', '-')}`;

export function themeTable(source) {
  const table = flattenTokens(source);
  for (const [name, token] of [...table]) {
    if (token.type !== 'typography') continue;
    table.delete(name);
    for (const [part, value] of Object.entries(token.value)) table.set(`${name}.${part}`, { name: `${name}.${part}`, value });
  }
  const names = new Set();
  for (const name of table.keys()) {
    if (names.has(cssName(name))) throw new TokenError(`css name collision: ${name}`);
    names.add(cssName(name));
    resolveValue(table, name);
  }
  return table;
}

/** 모든 참조를 추적한다. 식 안의 참조도 존재와 순환을 검사한다. */
export function resolveValue(table, name, seen = []) {
  if (seen.includes(name)) throw new TokenError(`token reference cycle: ${[...seen, name].join(' -> ')}`);
  const token = table.get(name);
  if (!token) throw new TokenError(`unknown token reference: ${name}`);
  if (typeof token.value !== 'string') return plain(token.value, token.type);
  const exact = token.value.match(EXACT);
  if (exact) return resolveValue(table, exact[1], [...seen, name]);
  return token.value.replace(REFS, (_, target) => resolveValue(table, target, [...seen, name]));
}

function plain(value, type) {
  if (value && typeof value === 'object' && 'unit' in value) return `${value.value}${value.unit}`;
  if (Array.isArray(value)) return type === 'cubicBezier' ? `cubic-bezier(${value.join(', ')})` : value.map((v) => v.includes(' ') ? JSON.stringify(v) : v).join(', ');
  if (typeof value === 'number') return `${value}${({dimension:'px',duration:'ms'})[type] ?? ''}`;
  if (typeof value === 'string') return value;
  throw new TokenError(`unsupported token value: ${JSON.stringify(value)}`);
}

function declarations(source) {
  const table = themeTable(source);
  const fallbacks = source.$extensions?.theme?.fontFallbacks ?? {};
  return [...table].map(([name, token]) => {
    let value = plain(token.value, token.type).replace(REFS, (_, target) => `var(${cssName(target)})`);
    const fallback = fallbacks[name.replace('font.', '')];
    if (fallback && typeof token.value === 'string' && !EXACT.test(token.value)) value = [token.value, ...fallback].map((v) => v.includes(' ') ? JSON.stringify(v) : v).join(', ');
    return `  ${cssName(name)}: ${value};`;
  }).join('\n');
}

/** 토큰 전체를 :root의 CSS 변수로 쓴다. 사이트는 라이트 화면 하나만 쓴다. */
export function tokensCss(source) {
  const faces = source.$extensions?.theme?.fontFaces ?? [];
  return `/* tokens/tokens.json: 생성물, 손으로 고치지 않음 */\n:root {\n${declarations(source)}\n  color-scheme: light;\n}\n${faces.join('\n')}`.trimEnd() + '\n';
}
