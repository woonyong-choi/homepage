// 테마 토큰을 검증하고 CSS 변수와 계산용 값으로 변환한다.
import { flattenTokens, TokenError } from './tokens.mjs';

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

/** Tailwind v4가 읽는 분류만 노출한다. 구성 요소 전용 복합 값은 일반 CSS 변수로 유지한다. */
export function tailwindCss(theme) {
  const allowed = /^(?:color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate)-/;
  const rows = declarations(theme.sources[theme.meta.defaultMode]).split('\n').filter(line => allowed.test(line.trim().slice(2)) && !/^\s*--spacing-\d/.test(line));
  if (themeTable(theme.sources[theme.meta.defaultMode]).has('spacing.unit')) rows.push('  --spacing: var(--spacing-unit);');
  return `/* 생성물, 손으로 고치지 않음 */\n@import './tokens.css';\n@theme inline {\n${rows.join('\n')}\n}\n`;
}

/** 공통 값을 한 번 정의하고 모드에서 달라지는 속성만 재정의한다. */
export function themeCss(theme) {
  const { meta, sources } = theme;
  const light = declarations(sources.light).split('\n');
  const dark = declarations(sources.dark).split('\n');
  const changed = dark.map((line, index) => line !== light[index]);
  const delta = (rows, mode) => `${rows.filter((_, index) => changed[index]).join('\n')}\n  color-scheme: ${mode};`;
  let css = `/* tokens/tokens.json: 생성물, 손으로 고치지 않음 */\n:root {\n${light.join('\n')}\n  color-scheme: light;\n}\n`;
  css += `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme='light']):not([data-theme='dark']) {\n${delta(dark, 'dark')}\n  }\n}\n`;
  css += `[data-theme='dark'] {\n${delta(dark, 'dark')}\n}\n[data-theme='light'] {\n${delta(light, 'light')}\n}\n`;
  const faces = sources[meta.defaultMode].$extensions?.theme?.fontFaces ?? [];
  if (meta.fonts !== 'bundled-by-renderer') css += faces.join('\n') + '\n';
  return css.trimEnd() + '\n';
}
