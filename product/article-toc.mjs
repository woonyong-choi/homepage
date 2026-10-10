// 개인 문서와 복각 검토가 같은 정적 목차 구조를 사용한다.
import * as ui from './vendor/theme/assets/components.mjs';

export function articleToc(headings, { title = '이 글에서', label = '이 글의 목차', minimum = 2 } = {}) {
  const sections = headings.filter(heading => heading.level === 2);
  if (sections.length < minimum) return '';
  return String(ui.Toc({ title, label, sections }));
}
