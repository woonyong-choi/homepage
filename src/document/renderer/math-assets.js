import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const MATH_STYLESHEET = '/katex/katex.css';

export const usesMath = (html) => /<span class="katex(?:-display|-error)?"/.test(html);

export function mathAssets() {
  const dist = join(dirname(createRequire(import.meta.url).resolve('katex/package.json')), 'dist');
  const css = readFileSync(join(dist, 'katex-swap.min.css'), 'utf8').replace(
    /,url\([^)]+\) format\("(?:woff|truetype)"\)/g,
    '',
  );
  const fonts = [...css.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1]);
  if (!fonts.length || fonts.some((url) => !/^fonts\/KaTeX_[\w-]+\.woff2$/.test(url))) {
    throw new Error('KaTeX stylesheet references a non-local or non-woff2 font');
  }
  const assets = new Map([
    [MATH_STYLESHEET, Buffer.from(css)],
    ['/katex/LICENSE', readFileSync(join(dist, '..', 'LICENSE'))],
  ]);
  for (const name of readdirSync(join(dist, 'fonts')).filter((file) => file.endsWith('.woff2'))) {
    assets.set(`/katex/fonts/${name}`, readFileSync(join(dist, 'fonts', name)));
  }
  for (const url of fonts) {
    if (!assets.has(`/katex/${url}`)) throw new Error(`missing KaTeX font: ${url}`);
  }
  return { assets, hash: createHash('sha256').update(css).digest('hex') };
}
