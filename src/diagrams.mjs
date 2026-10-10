// Daphnis 문법과 배치는 발행할 때만 실행한다. 같은 원본은 한 번 만들고 모든 페이지에서 재사용한다.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { buildFigure, toHtml } from 'daphnis';

export async function compileDiagrams(sources) {
  const shared = JSON.parse(readFileSync(new URL('./vendor/theme/manifest.json', import.meta.url)));
  const renderer = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('daphnis/design-manifest.json')));
  if (shared.contentHash !== renderer.contentHash) throw new Error('Daphnis와 홈페이지의 공통 디자인 버전이 다릅니다.');
  const diagrams = new Map();
  const assets = new Map();
  for (const [source, page] of sources) {
    try {
      const result = await buildFigure(source, { allowFileAccess: false });
      const title = result.figure.title ?? '도표';
      const html = Buffer.from(await toHtml(result, title));
      const hash = createHash('sha256').update(html).digest('hex');
      const src = `/diagrams/${hash}.html`;
      diagrams.set(source, { src, title, width: result.scene.width, height: result.scene.height });
      assets.set(src, html);
    } catch (error) {
      throw new Error(`${page}: Daphnis 도표를 만들 수 없습니다. ${error.message}`, { cause: error });
    }
  }
  return { diagrams, assets };
}
