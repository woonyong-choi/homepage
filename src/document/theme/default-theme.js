// 기본 테마. 디자인 정본의 구성 요소(ui)를 그대로 불러 쓰며 HTML·CSS·SVG를 새로 만들지 않는다.
// 디자인은 홈페이지가 소유한 src/design 하나이며 렌더러는 그 생성 결과(src/design/dist)를 읽는다.

import { createDefaultComponents } from './components.js';

const THEME_DIR = new URL('../../design/dist/', import.meta.url);
let loading;

/**
 * 기본 테마 파일의 위치. 호스트가 스타일·글꼴·runtime을 문서 화면에 연결할 때 쓴다.
 * root는 디자인 생성 결과(src/design/dist) 폴더이고 나머지는 그 안의 상대 위치다.
 */
export const DEFAULT_THEME_FILES = Object.freeze({
  root: THEME_DIR,
  tokens: 'tokens.css',
  styles: 'styles.css',
  runtimeDir: 'ui/runtime/',
  iconCatalog: 'assets/icons/catalog.json',
});

/** @returns {Promise<{ name: string, ui: object, icons: object, svg: object, runtimeFor: Function, components: object }>} */
export function loadDefaultTheme() {
  loading ??= importTheme();
  return loading;
}

async function importTheme() {
  // 구성 요소와 런타임 목록은 디자인 생성 결과(src/design/dist/ui), 아이콘 목록은 디자인 빌드 모듈에서 읽는다.
  const [ui, icons, svg, manifest] = await Promise.all([
    import('#design/ui/index.js'),
    import('../../design/build/icons.js'),
    import('#design/ui/svg.js'),
    import('#design/ui/manifest.js'),
  ]);
  return {
    name: 'default',
    ui,
    icons,
    svg,
    runtimeFor: manifest.runtimeEntrypoints,
    components: createDefaultComponents(),
  };
}
