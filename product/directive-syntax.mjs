// Markdown 구성 블록과 코드 펜스가 공유하는 옵션 문법.
import { WIDTHS } from './vendor/theme/assets/components.mjs';
export const MAX_DEPTH = 3;

export class DirectiveError extends Error {
  constructor(message, { page, line, name } = {}) {
    const where = [page, line ? `본문 ${line}줄` : '', name ? `:${name}` : ''].filter(Boolean).join(' ');
    super(where ? `${where}: ${message}` : message);
    this.name = 'DirectiveError';
    Object.assign(this, { page, line, directive: name, detail: message });
  }
}

const NAME = '[a-z][a-z0-9-]{0,23}';
const OPEN = new RegExp(`^(:{3,})(${NAME})(?:\\[([^\\]\\n]*)\\])?(?:\\{(.*)\\})?\\s*$`);
const LEAF = new RegExp(`^::(${NAME})(?:\\[([^\\]\\n]*)\\])?\\{(.*)\\}\\s*$`);
const CLOSE = /^(:{3,})\s*$/;
const END = /^:::end\s*$/;
const FLAT = new RegExp(`^(:{2,})(${NAME})(?:\\[([^\\]\\n]*)\\])?[ \\t]+(?![\\[{])(\\S.*?)\\s*$`);
const TAB_LINE = /^@tab(?:[ \t]+(.*?))?\s*$/;
const KEY = /^[a-z][a-z0-9-]{0,23}/;
const BARE = /^[^\s"'{}=\\]+/;
const CONTROL = /[\u0000-\u001f\u007f]/u;
const LIMITS = { attributes: 12, value: 300, label: 80 };

// 한 줄을 여는 줄, 닫는 줄, 리프 줄로 나눈다. 블록 줄처럼 보이지만 형식이 틀리면 'invalid'다.
export function classifyLine(text) {
  if (!text.startsWith('::')) return { kind: 'text' };
  if (END.test(text)) return { kind: 'end' };
  let match = OPEN.exec(text);
  if (match) return { kind: 'open', colons: match[1].length, name: match[2], label: match[3], source: match[4] };
  match = CLOSE.exec(text);
  if (match) return { kind: 'close', colons: match[1].length };
  match = LEAF.exec(text);
  if (match) return { kind: 'leaf', name: match[1], label: match[2], source: match[3] };
  match = FLAT.exec(text);
  if (match) return { kind: match[1].length === 2 ? 'leaf' : 'open', colons: match[1].length, name: match[2], label: match[3], source: match[4], flat: true };
  return text.startsWith(':::') ? { kind: 'invalid' } : { kind: 'text' };
}

export function parseLabel(label, fail) {
  if (label === undefined) return undefined;
  const value = label.trim();
  if (!value || value.length > LIMITS.label || CONTROL.test(value)) fail(`라벨은 1~${LIMITS.label}자의 한 줄이어야 합니다`);
  return value;
}

// `key=값 key="공백 있는 값" flag` 형식. 값은 따옴표 안에서만 `\"`와 `\\`를 쓴다. 중복 키와 제어 문자는 거부한다.
export function parseAttributes(source = '', fail) {
  const attrs = Object.create(null);
  let at = 0;
  while (true) {
    while (source[at] === ' ' || source[at] === '\t') at += 1;
    if (at >= source.length) break;
    const key = KEY.exec(source.slice(at))?.[0];
    if (!key) fail(`속성 이름이 잘못되었습니다: ${JSON.stringify(source.slice(at, at + 12))}`);
    if (attrs[key] !== undefined) fail(`속성이 겹칩니다: ${key}`);
    if (Object.keys(attrs).length >= LIMITS.attributes) fail(`속성은 ${LIMITS.attributes}개까지 쓸 수 있습니다`);
    at += key.length;
    if (source[at] !== '=') { attrs[key] = true; continue; }
    at += 1;
    let value = '';
    if (source[at] === '"') {
      at += 1;
      for (; ; at += 1) {
        if (at >= source.length) fail(`따옴표가 닫히지 않았습니다: ${key}`);
        const char = source[at];
        if (char === '"') { at += 1; break; }
        if (char === '\\') {
          at += 1;
          if (source[at] !== '"' && source[at] !== '\\') fail(`따옴표 안에서는 \\" 와 \\\\ 만 이스케이프할 수 있습니다: ${key}`);
          value += source[at];
        } else value += char;
      }
    } else {
      value = BARE.exec(source.slice(at))?.[0] ?? '';
      if (!value) fail(`값이 비었습니다: ${key}`);
      at += value.length;
    }
    if (source[at] !== undefined && source[at] !== ' ' && source[at] !== '\t') fail(`속성 사이에는 공백이 필요합니다: ${key}`);
    if (CONTROL.test(value) || value.length > LIMITS.value) fail(`값이 너무 길거나 제어 문자가 있습니다: ${key}`);
    attrs[key] = value;
  }
  return attrs;
}

// 인라인 `{...}`의 끝을 따옴표를 고려해 찾는다. 닫는 위치(`}`의 다음 인덱스)를 돌려준다.
export function attributeEnd(text, start) {
  let quoted = false;
  for (let at = start + 1; at < text.length && text[at] !== '\n'; at += 1) {
    if (quoted && text[at] === '\\') at += 1;
    else if (text[at] === '"') quoted = !quoted;
    else if (text[at] === '}' && !quoted) return at + 1;
  }
  return -1;
}

// 속성 명세({ 이름: { type, required, values, min, max } })로 값을 검사해 새 객체를 만든다. 명세에 없는 속성은 거부한다.
export function validateAttributes(raw, spec, fail, checks) {
  const result = Object.create(null);
  for (const key of Object.keys(raw)) {
    if (!Object.hasOwn(spec, key)) fail(`허용하지 않는 속성입니다: ${key} (허용: ${Object.keys(spec).join(', ') || '없음'})`);
  }
  for (const [key, rule] of Object.entries(spec)) {
    const value = raw[key];
    if (value === undefined) {
      if (rule.required) fail(`필수 속성이 없습니다: ${key}`);
      continue;
    }
    if (rule.type === 'bool') {
      if (value !== true && value !== 'true' && value !== 'false') fail(`${key}는 true 또는 false여야 합니다`);
      result[key] = value === true || value === 'true';
      continue;
    }
    if (value === true) fail(`값이 필요한 속성입니다: ${key}`);
    if (rule.type === 'enum') {
      if (!rule.values.includes(value)) fail(`${key}는 ${rule.values.join(', ')} 중 하나여야 합니다`);
    } else if (rule.type === 'int') {
      if (!/^\d{1,4}$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) fail(`${key}는 ${rule.min}~${rule.max}의 정수여야 합니다`);
    } else if (rule.type === 'asset' || rule.type === 'url' || rule.type === 'icon') {
      const problem = checks[rule.type](value);
      if (problem) fail(`${key}: ${problem}`);
    }
    result[key] = value;
  }
  return result;
}

// `@tab 라벨` 줄. 라벨이 없으면 `{ label: undefined }`, 탭 줄이 아니면 null이다.
export function parseTabLine(text) {
  const match = TAB_LINE.exec(text);
  return match ? { label: match[1] || undefined } : null;
}

export const WIDTH_OPTION = Object.freeze({ type: 'enum', values: WIDTHS });
export const TAB_ATTRIBUTES = Object.freeze({
  frame: { type: 'enum', values: ['none', 'panel'] },
  position: { type: 'enum', values: ['bottom', 'top'] },
  selector: { type: 'enum', values: ['buttons', 'segmented', 'numbers'] },
  width: WIDTH_OPTION,
});

// 표시 옵션은 구성 요소별 속성 명세를 거쳐 같은 의미와 값으로 정규화한다.
const UTILITIES = Object.freeze({
  'w-narrow': ['width', 'narrow'],
  'w-wide': ['width', 'wide'],
  box: ['frame', 'panel'],
  top: ['position', 'top'],
  segmented: ['selector', 'segmented'],
  numbers: ['selector', 'numbers'],
  centered: ['variant', 'centered'],
  grouped: ['variant', 'grouped'],
  inline: ['variant', 'inline'],
  related: ['variant', 'related'],
  'cols-1': ['columns', '1'],
  'cols-2': ['columns', '2'],
  'frame-iphone': ['frame', 'iphone'],
});

function optionEntry(key, value, spec) {
  if (value !== true) return [key, value];
  if (Object.hasOwn(UTILITIES, key)) return UTILITIES[key];
  const legacy = /^(frame|position|selector|width)-([a-z]+)$/.exec(key);
  if (legacy && spec[legacy[1]]?.values?.includes(legacy[2])) return legacy.slice(1);
  return [key, value];
}

export function parseOptions(source, spec, fail, checks = {}) {
  const attrs = Object.create(null);
  const given = Object.create(null);
  for (const [token, value] of Object.entries(parseAttributes(source, fail))) {
    const [key, resolved] = optionEntry(token, value, spec);
    if (Object.hasOwn(attrs, key)) fail(`옵션이 ${attrs[key] === resolved ? '겹칩니다' : '충돌합니다'}: ${given[key]}, ${token}`);
    attrs[key] = resolved;
    given[key] = token;
  }
  return validateAttributes(attrs, spec, fail, checks);
}

export const parseTabOptions = (source, fail) => parseOptions(source, TAB_ATTRIBUTES, fail);
