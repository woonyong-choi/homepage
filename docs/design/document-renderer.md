# 문서 렌더러

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 위치 | `src/document` |

## 요약

Markdown 원문을 토큰과 진단으로 바꾸는 해석(`parser/`)과, 해석 결과에 테마를 적용해 HTML을 만드는 출력(`renderer/`)을 나눈 내부 모듈이다. 해석기는 HTML·테마·DOM을 모르고, 출력은 해석된 토큰을 그리기만 한다. 자산 조회, 파일 저장, front matter, 화면 연결은 호출자(`src/content/article.js`, `src/admin/editor.js`)가 맡는다.

## 사용 예

```js
import { documentEngine } from './src/document/index.js';

const document = await documentEngine.parseDocument('# 시작\n\n본문.\n', { id: 'example.md', pageId: 'example' });
const output = await documentEngine.renderDocument(document);
console.log(output.html, output.diagnostics);
```

## 폴더

| 위치 | 내용 |
|---|---|
| `parser/` | markdown-it 설정, `:::` 블록·인라인 표기(`directive-blocks.js`, `directives.js`), `ui:` 펜스 명세(`ui-fences.js`), 진단 |
| `renderer/` | HTML 출력, 블록 출력표(`directive-render.js`), 코드 강조(`code-highlight.js`), 수식 자산(`math-assets.js`), 미리보기 출력(`render-preview.js`) |
| `theme/` | 기본 테마. `src/design/dist/`의 구성 요소를 불러와 연결 |
| `preview/` | 관리 화면 브라우저 번들용 진입점 |

## 진입점

| 진입점 | 내보내는 것 |
|---|---|
| `src/document/index.js` | `parseDocument`(비동기), `renderDocument`, `documentEngine`, `mathAssets`, `MATH_STYLESHEET`, `usesMath`, `ThemeError`, `DEFAULT_THEME_FILES` |
| `src/document/parser/index.js` | `parseDocumentSync` |
| `src/document/preview/index.js` | `parseDocumentSync`, `renderPreview` |

루트 `parseDocument`는 아이콘 카탈로그, 주소 정책, 폭·카드 모양 목록(`WIDTHS`, `CARD_VARIANTS`)을 기본 테마에서 채운 뒤 `parseDocumentSync`를 부른다. `parseDocumentSync`는 테마 없이 동기로 해석하며 주지 않은 검사는 건너뛴다.

`renderPreview(document, { ui, icons?, svg?, assets?, codeAliases? })`는 작성 화면 미리보기용 동기 출력이다. `renderDocument`와 같은 규칙과 구성 요소를 쓰지만 코드 강조와 수식 자산 파일은 다루지 않아 Node 모듈 없이 브라우저 번들(`admin-editor.js`)에 들어간다.

## 해석 문맥

| 필드 | 뜻 |
|---|---|
| `id` | 문서 식별자. 진단에 붙는다. 없으면 `TypeError` |
| `pageId` | 구성 요소·제목·각주 ID 접두사. `[\w-]+` |
| `assets.exists(name)` | 자산이 있는지 |
| `icons.has(name)` | 아이콘이 카탈로그에 있는지 |
| `urls.isSafe(url)` | 쓸 수 있는 주소인지 |
| `vocabulary.widths`, `vocabulary.cardVariants` | `width`, `variant` 값 목록 |

## 해석 결과

`tokens`와 `env`는 markdown-it 토큰을 그대로 쓴다. 토큰의 `map`이 원문 줄 범위다.

| 필드 | 뜻 |
|---|---|
| `metadata.headings` | `{ id, title, level, line }` 목록 |
| `metadata.links` | `{ kind, target, line }` 목록. `kind`는 `link` 또는 `image` |
| `diagnostics` | `{ document, severity, stage, message, line, directive, nestedLine? }` 목록 |

문법 오류는 던지지 않고 진단으로 돌려준다. 오류 블록은 오류 토큰 하나가 되고 나머지 문서는 유지한다. 호출자인 `src/content/article.js`는 진단이 있으면 발행을 멈춘다. 렌더러는 현재 문법만 받으며 옛 형식(네 콜론 블록, 탭 문법, 약칭 옵션)은 일반 진단으로 돌려준다.

## 출력 결과

| 필드 | 뜻 |
|---|---|
| `html` | 본문 HTML |
| `headings` | 제목 목록 |
| `diagnostics` | 해석 진단과 출력 진단(`stage: render`) |
| `assets` | 구성 요소가 조회한 `{ name, url }` 목록. 존재 확인 결과는 아니다 |
| `runtime` | 필요한 공통 런타임 파일 이름(`document.js`, `video.js` 등) |
| `math` | 수식이 있으면 `true` |
| `theme` | 적용한 테마 이름 |

출력 문맥으로 `assets.url(name)`, `assets.size(name)`, `deviceOverlay`, `codeAliases`를 받을 수 있다. `assets.url`이 없으면 `/assets/<name>`을 쓴다. 일반 Markdown 그림 주소는 원문을 그대로 쓰며 `assets`에 모으지 않는다.

## 코드 강조

언어 이름과 별칭은 highlight.js 목록이 기준이다. 같은 이름의 TextMate 문법이 Shiki에 있으면 Shiki로, 없으면 highlight.js로 분석하고, 결과는 같은 구문 역할 클래스(`app-syntax-*`)로 출력한다. 문서에 쓰인 언어의 문법만 불러온다. 블록 하나가 `HIGHLIGHT_TIME_LIMIT_MS`(500ms)를 넘기면 그 블록만 강조 없이 출력한다.

## 구성 요소 교체

테마는 구성 요소 출력 함수를 바꿀 수 있다. 교체 함수는 `(props, kit)`을 받아 HTML 문자열이나 `kit.ui.isTrusted`가 인정하는 값을 돌려준다. props는 호출마다 깊게 복사한다. 원문 글 props는 교체 함수가 `kit.escape`, `kit.safeUrl`로 처리해야 한다.

| 이름 | 형태 |
|---|---|
| `callout`, `steps`, `table` | open·close |
| `cards` | open·close·gap |
| `details` | open·close·summaryOpen·summaryClose |
| `card`, `gallery`, `figure`, `video`, `code`, `kbd`, `menu`, `icon`, `tip` | 단일 함수 |

지원하지 않는 이름이나 함수가 아닌 값은 `ThemeError`로 거부한다. 교체 함수가 실패하면 그 자리에 오류 블록을 내고 `stage: render` 진단을 남기며 나머지 출력은 계속한다. 이름 목록은 `src/document/theme/components.js`의 `COMPONENT_SHAPES`에 있다.

## 기본 테마

기본 테마는 `src/design/dist/`의 생성 결과를 읽는다(`#design/ui/index.js`, `#design/ui/svg.js`, `#design/ui/manifest.js`, `src/design/build/icons.js`). `DEFAULT_THEME_FILES`는 `root`(`src/design/dist/`)와 `tokens.css`, `styles.css`, `ui/runtime/`, `assets/icons/catalog.json` 위치를 알려 준다. `src/content/article.js`는 이 `root`가 빌드의 디자인 위치(`src/build/theme.js`의 `THEME_ROOT`)와 같은지 확인한다.

## 의존성

`markdown-it`, `markdown-it-deflist`, `markdown-it-footnote`, `@vscode/markdown-it-katex`, `katex`, `highlight.js`, `shiki`, `yaml`은 `package.json`의 `devDependencies`에 있다. `katex`는 `overrides`로 한 판만 설치해 수식 출력과 `mathAssets()`의 스타일·글꼴 판을 맞춘다.

## 한계

- front matter는 처리하지 않는다. 호출자가 본문과 분리해 넘긴다.
- 신뢰할 수 없는 교체 함수의 격리 실행은 호출자가 맡는다.
- 아이콘 SVG ID는 프로세스 전체 카운터로 만들어 호출 순서에 따라 숫자가 달라진다.

## 확인

`test/markdown.test.js`가 제목, 코드, 수식, 각주 출력을 확인한다. `npm test`로 실행한다.
