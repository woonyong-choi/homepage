// 콘텐츠 SVG와 공통 목록의 아이콘을 정본 렌더러에 연결한다.
import { readFileSync } from 'node:fs';

import { ContentIcon, ContentIconImage, trusted } from '@woonyong-choi/design-tokens/ui/index.mjs';
import { getIconCatalog, readIcon } from '@woonyong-choi/design-tokens/ui/build/icons.mjs';
import { renderSvgIcon } from '@woonyong-choi/design-tokens/ui/svg.mjs';
import { brandIcon } from './brand-icons.mjs';

export function renderContentSvg(source, className = '', readAsset) {
  if (typeof source !== 'string' || !/^\/assets\/[a-z0-9-]+\.svg$/.test(source)) throw new Error('content SVG must be a file under /assets');
  return renderSvgIcon(readAsset ? readAsset(source).toString() : readFileSync(new URL(`../content${source}`, import.meta.url), 'utf8'), { className });
}

export function contentIcon(spec, size = 'card', variant = 'default') {
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
  // 로고는 원본 색과 도형을 그대로 보이도록 파일 그림으로 싣는다.
  const brand = brandIcon(name);
  if (brand) return String(ContentIconImage({ src: brand.src, size }));
  let badge;
  if (kind !== undefined && size !== 'small') {
    const kinds = getIconCatalog().kinds;
    if (!Object.hasOwn(kinds, kind)) throw new Error(`unknown icon kind: ${kind}`);
    badge = trusted(renderSvgIcon(readIcon(kinds[kind])));
  }
  return String(ContentIcon({ size, graphic: trusted(renderSvgIcon(readIcon(name, { variant }))), badge }));
}
