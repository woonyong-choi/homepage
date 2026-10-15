// 기술 이름의 로고를 찾는다. 홈페이지가 싣는 로고가 먼저이고, 없으면 공통 카탈로그의 브랜드 표식을 쓴다.
import { readFileSync } from 'node:fs';

import { getIconCatalog, iconFile } from './vendor/theme/ui/build/icons.mjs';

const CONTENT = new URL('../content/', import.meta.url);
const SOURCES = JSON.parse(readFileSync(new URL('../config/assets.json', import.meta.url), 'utf8'));
const OWNED = new Map(SOURCES.filter(entry => entry.brand).map(entry => [entry.brand.name, Object.freeze({ label: entry.brand.label, src: `/${entry.file}`, notice: `/${entry.notice}` })]));

/** 홈페이지 로고 → 공통 카탈로그 브랜드 순서로 이름을 찾는다. 브랜드가 아니면 undefined다. */
export function brandIcon(name) {
  if (OWNED.has(name)) return OWNED.get(name);
  const brand = getIconCatalog().brands[name];
  return brand && Object.freeze({ label: brand.label, src: `/theme/assets/icons/${iconFile(name)}` });
}

/** 기술 줄과 문서 아이콘이 받는 브랜드 이름 전체. */
export function brandNames() {
  return new Set([...OWNED.keys(), ...Object.keys(getIconCatalog().brands)]);
}

/** 홈페이지 로고 파일과 그 고지. 발행본은 화면에서 요청하지 않는 고지도 함께 싣는다. */
export const BRAND_NOTICES = new Map([...OWNED.values()].map(brand => [brand.src, brand.notice]));

/** 원고 폴더와 관계없이 홈페이지가 싣는 로고 파일을 읽는다. 다른 경로는 undefined다. */
export function readBrandAsset(path) {
  const owned = [...OWNED.values()].find(brand => brand.src === path || brand.notice === path);
  return owned && readFileSync(new URL(path.slice(1), CONTENT));
}
