// 가져온 테마의 토큰 사슬을 따라 본문 치수를 계산해 원본 실측값과 대조한다.
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('./vendor/theme/theme.css', import.meta.url), 'utf8');
const DEFINITIONS = new Map([...CSS.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));

export function token(name) {
  let value = DEFINITIONS.get(name);
  if (value === undefined) throw new Error(`undefined token: ${name}`);
  for (let depth = 0; depth < 12; depth += 1) {
    const next = value.replace(/var\((--[\w-]+)\)/g, (_, inner) => DEFINITIONS.get(inner) ?? inner);
    if (next === value) return value;
    value = next;
  }
  throw new Error(`token cycle: ${name}`);
}

// 길이를 px로 바꾼다. em은 기준 글자 크기를 곱하고, 단위 없는 값은 그대로 둔다.
export function px(value, em = 18) {
  const match = /^(-?[\d.]+)(px|em|%)?$/.exec(value.trim());
  if (!match) throw new Error(`not a length: ${value}`);
  const number = Number(match[1]);
  return match[2] === 'em' ? number * em : number;
}

export function box(value, em = 18) {
  return value.trim().split(/\s+/).map(part => (part === 'auto' ? part : px(part, em)));
}
