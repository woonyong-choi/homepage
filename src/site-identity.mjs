// 같은 문서 도형에서 브라우저·공유용 크기만 생성한다. 실행 화면에는 렌더러를 배포하지 않는다.
import { Resvg } from '@resvg/resvg-js';

import { sha256 } from './sha256.mjs';

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
