// ThinkFlow 문법과 배치는 발행할 때만 실행한다. 같은 원본은 한 번 만들고 모든 페이지에서 재사용한다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { compileDiagram } from 'document-engine';
import { assertInstalledEngine } from './document-engine-pin.mjs';

export async function compileDiagrams(sources) {
  assertInstalledEngine();
  const shared = JSON.parse(readFileSync(new URL('./vendor/theme/manifest.json', import.meta.url)));
  const renderer = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('thinkflow/design-manifest.json')));
  if (shared.contentHash !== renderer.contentHash) throw new Error('ThinkFlow와 홈페이지의 공통 디자인 버전이 다릅니다.');
  const diagrams = new Map();
  const assets = new Map();
  for (const [source, page] of sources) {
    try {
      const { html, ...diagram } = await compileDiagram(source);
      diagrams.set(source, diagram);
      assets.set(diagram.src, html);
    } catch (error) {
      throw new Error(`${page}: ThinkFlow 도표를 만들 수 없습니다. ${error.message}`, { cause: error });
    }
  }
  return { diagrams, assets };
}
