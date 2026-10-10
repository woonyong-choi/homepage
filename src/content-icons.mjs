// 가져온 테마의 아이콘 목록을 Markdown과 검토 화면에서 함께 사용한다.
import { readFileSync } from 'node:fs';
import { ContentIcon, trusted } from './vendor/theme/ui/index.mjs';
import { renderContentIcon, validateIconCatalog } from './vendor/theme/assets/icons/render.mjs';

const CATALOG = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/catalog.json', import.meta.url)));
const DETAIL = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/catalog-detail.json', import.meta.url)));
validateIconCatalog(CATALOG);
validateIconCatalog(DETAIL);

export function contentIcon(spec, size = 'card', variant = 'default') {
  if (!['default', 'detail'].includes(variant)) throw new Error(`invalid icon variant: ${variant}`);
  if (!['small','medium','card','proof'].includes(size)) throw new Error(`invalid icon size: ${size}`);
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
  return String(ContentIcon({ size, graphic: trusted(renderContentIcon(variant === 'detail' ? DETAIL : CATALOG, name, size === 'small' ? undefined : kind, size)) }));
}
