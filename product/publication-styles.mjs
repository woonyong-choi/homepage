// 정본 선언은 보존하고 실제 발행 화면과 동적 상태에 필요한 선택자만 내보낸다.
import { PurgeCSS } from 'purgecss';

export async function publicationStyles(css, pages, scripts) {
  const content = [
    ...[...pages.values()].map(raw => ({ raw, extension: 'html' })),
    ...[...scripts.values()].map(raw => ({ raw, extension: 'js' })),
  ];
  const [result] = await new PurgeCSS().purge({
    content, css: [{ raw: css }], rejected: true,
    fontFace: false, keyframes: false, variables: false,
    safelist: [/^is-/, /^has-/],
    // 속성 값은 펼치기·선택·오류·키보드 조작 중 바뀔 수 있다.
    dynamicAttributes: [...new Set([...css.matchAll(/\[([\w-]+)/g)].map(match => match[1]))],
  });
  return { css: result.css, removed: result.rejected.length };
}
