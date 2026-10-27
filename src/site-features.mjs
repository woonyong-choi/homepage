// 선택 문법 스위치. 템플릿 기본값은 일반 Markdown만 쓰도록 모두 꺼짐이고, config/features.json에서 켠다.
import { existsSync, readFileSync } from 'node:fs';

export const FEATURE_NAMES = Object.freeze(['tabs', 'diagrams']);

export function parseFeatures(value = {}) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('config/features.json: 객체여야 합니다');
  for (const [name, flag] of Object.entries(value)) {
    if (!FEATURE_NAMES.includes(name)) throw new Error(`config/features.json: 알 수 없는 기능입니다: ${name}`);
    if (typeof flag !== 'boolean') throw new Error(`config/features.json: ${name}은 true 또는 false여야 합니다`);
  }
  return Object.freeze(Object.fromEntries(FEATURE_NAMES.map(name => [name, value[name] === true])));
}

export function loadFeatures(configRoot = new URL('../config/', import.meta.url)) {
  const file = new URL('features.json', configRoot);
  return parseFeatures(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {});
}

export const SITE_FEATURES = loadFeatures();
