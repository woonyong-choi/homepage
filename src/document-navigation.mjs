// 개인 위키 미리보기의 본문 목차를 공통 구성 요소에 연결한다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

export function documentOutline(headings) {
  if (!headings.some(heading => heading.level <= 3)) return undefined;
  return ui.DocumentOutline({ sections: headings.filter(heading => heading.level <= 3)
    .map(heading => ({ ...heading, level: Math.max(2, heading.level) })) });
}
