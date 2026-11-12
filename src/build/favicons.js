import { Resvg } from '@resvg/resvg-js';

import { sha256 } from '../lib/sha256.js';

export function siteIdentity(svg) {
  const assets = new Map();
  const images = {};
  for (const [role, size] of [['touch', 180], ['share', 512]]) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();
    const hash = sha256(png).slice(0, 16);
    const path = `/media/site-icon-${size}-${hash}.png`;
    assets.set(path, png);
    images[role] = path;
  }
  return { ...images, assets };
}
