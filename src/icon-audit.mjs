// 공통 검토 화면에 가져온 목록과 홈페이지 렌더러를 연결한다.
import { readFileSync } from 'node:fs';
import { IconAuditPages, trusted } from './vendor/theme/ui/index.mjs';
import { values } from './vendor/theme/tokens.js';
import { contentIcon } from './content-icons.mjs';

export function iconAuditPages() {
  const root = new URL('./vendor/theme/assets/icons/', import.meta.url);
  const read = name => JSON.parse(readFileSync(new URL(name, root)));
  return IconAuditPages({
    catalog: read('catalog.json'), detail: read('catalog-detail.json'),
    brands: read('brands/catalog.json'), review: read('current-review.json'),
    sizes: Object.fromEntries(['card', 'medium', 'small'].map(size => [size, values.icon[`size-${size}`]])),
    renderIcon: (spec, size, variant) => trusted(contentIcon(spec, size, variant)),
  });
}
