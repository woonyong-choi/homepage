// 콘텐츠 SVG와 공통 목록의 아이콘을 정본 렌더러에 연결한다.
import { readFileSync } from 'node:fs';

import { ContentIcon, trusted } from './vendor/theme/ui/index.mjs';
import { getIconCatalog, readIcon } from './vendor/theme/ui/build/icons.mjs';
import { renderSvgIcon } from './vendor/theme/ui/svg.mjs';

export function renderContentSvg(source, className = '') {
  if (typeof source !== 'string' || !/^\/assets\/[a-z0-9-]+\.svg$/.test(source)) throw new Error('content SVG must be a file under /assets');
  return renderSvgIcon(readFileSync(new URL(`../content${source}`, import.meta.url), 'utf8'), { className });
}

export function contentIcon(spec, size = 'card', variant = 'default') {
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
  let badge;
  if (kind !== undefined && size !== 'small') {
    const kinds = getIconCatalog().kinds;
    if (!Object.hasOwn(kinds, kind)) throw new Error(`unknown icon kind: ${kind}`);
    badge = trusted(renderSvgIcon(readIcon(kinds[kind])));
  }
  return String(ContentIcon({ size, graphic: trusted(renderSvgIcon(readIcon(name, { variant }))), badge }));
}
