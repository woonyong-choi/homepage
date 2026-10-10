// 수식이 나오는 글만 KaTeX 스타일과 woff2 글꼴을 싣는다. 글꼴은 모두 로컬이고 외부 주소는 허용하지 않는다.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const DIST = join(dirname(createRequire(import.meta.url).resolve('katex/package.json')), 'dist');
export const MATH_STYLESHEET = '/katex/katex.css';

export const usesMath = html => /<span class="katex(?:-display|-error)?"/.test(html);

export function mathAssets() {
  // 최신 브라우저는 woff2만 쓰므로 woff·ttf 대체 원본은 배포하지 않는다.
  const css = readFileSync(join(DIST, 'katex-swap.min.css'), 'utf8').replace(/,url\([^)]+\) format\("(?:woff|truetype)"\)/g, '');
  const fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]);
  if (!fonts.length || fonts.some(url => !/^fonts\/KaTeX_[\w-]+\.woff2$/.test(url))) throw new Error('KaTeX stylesheet references a non-local or non-woff2 font');
  const assets = new Map([[MATH_STYLESHEET, Buffer.from(css)], ['/katex/LICENSE', readFileSync(join(DIST, '..', 'LICENSE'))]]);
  for (const name of readdirSync(join(DIST, 'fonts')).filter(name => name.endsWith('.woff2'))) assets.set(`/katex/fonts/${name}`, readFileSync(join(DIST, 'fonts', name)));
  for (const url of fonts) if (!assets.has(`/katex/${url}`)) throw new Error(`missing KaTeX font: ${url}`);
  return { assets, hash: createHash('sha256').update(css).digest('hex') };
}
