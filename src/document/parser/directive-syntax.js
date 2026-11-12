export const MAX_DEPTH = 3;

const NAME = '[a-z][a-z0-9-]{0,23}';
const OPEN = new RegExp(`^(:{3})(${NAME})(?:\\[([^\\]\\n]*)\\])?(?:\\{(.*)\\})?\\s*$`);
const LEAF = new RegExp(`^::(${NAME})(?:\\[([^\\]\\n]*)\\])?\\{(.*)\\}\\s*$`);
const CLOSE = /^:::\s*$/;
const FLAT = new RegExp(`^(:{2,3})(${NAME})(?:\\[([^\\]\\n]*)\\])?[ \\t]+(?![\\[{])(\\S.*?)\\s*$`);
const KEY = /^[a-z][a-z0-9-]{0,23}/;
const BARE = /^[^\s"'{}=\\]+/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f]/u;
const LIMITS = { attributes: 12, value: 300, label: 80 };

export function classifyLine(text) {
  if (!text.startsWith('::')) return { kind: 'text' };
  let match = OPEN.exec(text);
  if (match) {
    return {
      kind: 'open',
      name: match[2],
      label: match[3],
      source: match[4],
    };
  }
  if (CLOSE.test(text)) return { kind: 'close' };
  match = LEAF.exec(text);
  if (match) return { kind: 'leaf', name: match[1], label: match[2], source: match[3] };
  match = FLAT.exec(text);
  if (match) {
    return {
      kind: match[1].length === 2 ? 'leaf' : 'open',
      name: match[2],
      label: match[3],
      source: match[4],
      flat: true,
    };
  }
  return text.startsWith(':::') ? { kind: 'invalid' } : { kind: 'text' };
}

export function parseLabel(label, fail) {
  if (label === undefined) return undefined;
  const value = label.trim();
  if (!value || value.length > LIMITS.label || CONTROL.test(value)) {
    fail(`라벨은 1~${LIMITS.label}자의 한 줄이어야 합니다`);
  }
  return value;
}

function parseAttributes(source = '', fail) {
  const attrs = Object.create(null);
  let at = skipBlanks(source, 0);
  while (at < source.length) {
    at = skipBlanks(source, readAttribute(source, at, attrs, fail));
  }
  return attrs;
}

function readAttribute(source, from, attrs, fail) {
  const key = KEY.exec(source.slice(from))?.[0];
  if (!key) fail(`속성 이름이 잘못되었습니다: ${JSON.stringify(source.slice(from, from + 12))}`);
  if (attrs[key] !== undefined) fail(`속성이 겹칩니다: ${key}`);
  if (Object.keys(attrs).length >= LIMITS.attributes) {
    fail(`속성은 ${LIMITS.attributes}개까지 쓸 수 있습니다`);
  }
  const at = from + key.length;
  if (source[at] !== '=') {
    attrs[key] = true;
    return at;
  }
  const read =
    source[at + 1] === '"'
      ? readQuoted(source, at + 2, key, fail)
      : readBare(source, at + 1, key, fail);
  if (source[read.end] !== undefined && source[read.end] !== ' ' && source[read.end] !== '\t') {
    fail(`속성 사이에는 공백이 필요합니다: ${key}`);
  }
  if (CONTROL.test(read.value) || read.value.length > LIMITS.value) {
    fail(`값이 너무 길거나 제어 문자가 있습니다: ${key}`);
  }
  attrs[key] = read.value;
  return read.end;
}

function skipBlanks(source, from) {
  let at = from;
  while (source[at] === ' ' || source[at] === '\t') at += 1;
  return at;
}

function readQuoted(source, from, key, fail) {
  let value = '';
  for (let at = from; ; at += 1) {
    if (at >= source.length) fail(`따옴표가 닫히지 않았습니다: ${key}`);
    const char = source[at];
    if (char === '"') return { value, end: at + 1 };
    if (char !== '\\') {
      value += char;
      continue;
    }
    at += 1;
    if (source[at] !== '"' && source[at] !== '\\') {
      fail(`따옴표 안에서는 \\" 와 \\\\ 만 이스케이프할 수 있습니다: ${key}`);
    }
    value += source[at];
  }
}

function readBare(source, from, key, fail) {
  const value = BARE.exec(source.slice(from))?.[0] ?? '';
  if (!value) fail(`값이 비었습니다: ${key}`);
  return { value, end: from + value.length };
}

export function attributeEnd(text, start) {
  let quoted = false;
  for (let at = start + 1; at < text.length && text[at] !== '\n'; at += 1) {
    if (quoted && text[at] === '\\') at += 1;
    else if (text[at] === '"') quoted = !quoted;
    else if (text[at] === '}' && !quoted) return at + 1;
  }
  return -1;
}

function validateAttributes(raw, spec, fail, checks) {
  const result = Object.create(null);
  for (const key of Object.keys(raw)) {
    if (!Object.hasOwn(spec, key)) {
      fail(`허용하지 않는 속성입니다: ${key} (허용: ${Object.keys(spec).join(', ') || '없음'})`);
    }
  }
  for (const [key, rule] of Object.entries(spec)) {
    const value = raw[key];
    if (value === undefined) {
      if (rule.required) fail(`필수 속성이 없습니다: ${key}`);
      continue;
    }
    result[key] =
      rule.type === 'bool'
        ? checkBool(key, value, fail)
        : checkValue(key, rule, value, fail, checks);
  }
  return result;
}

function checkBool(key, value, fail) {
  if (value !== true && value !== 'true' && value !== 'false')
    fail(`${key}는 true 또는 false여야 합니다`);
  return value === true || value === 'true';
}

function checkValue(key, rule, value, fail, checks) {
  if (value === true) fail(`값이 필요한 속성입니다: ${key}`);
  if (rule.type === 'enum') {
    const values = enumValues(rule, checks);
    if (values && !values.includes(value)) fail(`${key}는 ${values.join(', ')} 중 하나여야 합니다`);
  } else if (rule.type === 'int') {
    if (!/^\d{1,4}$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) {
      fail(`${key}는 ${rule.min}~${rule.max}의 정수여야 합니다`);
    }
  } else if (rule.type === 'asset' || rule.type === 'url' || rule.type === 'icon') {
    const problem = checks[rule.type](value);
    if (problem) fail(`${key}: ${problem}`);
  }
  return value;
}

function enumValues(rule, checks = {}) {
  if (typeof rule.values !== 'string') return rule.values;
  const values = checks.vocabulary?.[rule.values];
  return Array.isArray(values) ? values : undefined;
}

export const WIDTH_OPTION = Object.freeze({ type: 'enum', values: 'widths' });

export function parseOptions(source, spec, fail, checks = {}) {
  return validateAttributes(parseAttributes(source, fail), spec, fail, checks);
}
