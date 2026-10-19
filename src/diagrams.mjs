// 디자인 일치는 문서 엔진이 확인한다: 엔진과 DiagramPlay가 홈페이지가 설치한 같은 디자인 패키지를 읽어야 도표를 만든다.
import { compileDiagram } from 'document-engine';

export async function compileDiagrams(sources) {
  const diagrams = new Map();
  const assets = new Map();
  for (const [source, page] of sources) {
    try {
      const { html, ...diagram } = await compileDiagram(source);
      diagrams.set(source, diagram);
      assets.set(diagram.src, html);
    } catch (error) {
      throw new Error(`${page}: DiagramPlay 도표를 만들 수 없습니다. ${error.message}`, { cause: error });
    }
  }
  return { diagrams, assets };
}
