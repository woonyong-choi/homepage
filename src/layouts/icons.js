import { readFileSync } from 'node:fs';

import { ContentIcon, ContentIconImage, trusted } from '#design/ui/index.js';
import { getIconCatalog, readIcon } from '../design/build/icons.js';
import { renderSvgIcon } from '#design/ui/svg.js';
import { brandIcon } from '../content/brands.js';

export function renderContentSvg(source, className = '', readAsset) {
  if (typeof source !== 'string' || !/^\/assets\/[a-z0-9-]+\.svg$/.test(source)) throw new Error('content SVG must be a file under /assets');
  return renderSvgIcon(readAsset ? readAsset(source).toString() : readFileSync(new URL(`../../content${source}`, import.meta.url), 'utf8'), { className });
}

export function contentIcon(spec, size = 'card', variant = 'default') {
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
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
