// 같은 문서 도형에서 브라우저·공유용 크기만 생성한다. 실행 화면에는 렌더러를 배포하지 않는다.
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';

export function siteIdentity(svg, license) {
  const assets = new Map([['/media/site-icon-LICENSE.txt', Buffer.from(license)]]);
  const images = {};
  for (const [role, size] of [['favicon', 32], ['touch', 180], ['share', 512]]) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { loadSystemFonts: false } }).render().asPng();
    const hash = createHash('sha256').update(png).digest('hex').slice(0, 16);
    const path = `/media/site-icon-${size}-${hash}.png`;
    assets.set(path, png);
    images[role] = path;
  }
  return { ...images, assets };
}
