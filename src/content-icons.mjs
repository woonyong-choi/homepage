// 공통 목록의 이름과 문서 표식을 같은 아이콘 구성 요소에 연결한다.
import { ContentIcon, trusted } from './vendor/theme/ui/index.mjs';
import { getIconCatalog, readIcon } from './vendor/theme/ui/build/icons.mjs';
import { renderSvgIcon } from './vendor/theme/ui/svg.mjs';

export function contentIcon(spec, size = 'card', variant = 'default') {
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
  let badge;
  if (kind !== undefined && size !== 'small') {
    const kinds = getIconCatalog().kinds;
    if (!Object.hasOwn(kinds, kind)) throw new Error(`unknown icon kind: ${kind}`);
    badge = trusted(renderSvgIcon(readIcon(kinds[kind])));
  }
  return String(ContentIcon({ size, graphic: trusted(renderSvgIcon(readIcon(name, { variant }))), badge }));
}
