# 디자인 시스템

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 위치 | `src/design/` |

## 요약

색·글꼴·간격·시간 같은 화면 값, 공통 CSS, HTML 구성 요소, 브라우저 동작, 아이콘·글꼴을 `src/design/` 한 곳에서 정의한다. 페이지 조립(`src/layouts/`, `src/admin/`, `src/client/`)과 문서 렌더러는 그 생성 결과를 가져다 쓰며 같은 모양을 다시 만들지 않는다. 사이트는 라이트 모드 하나로 고정한다.

## 폴더

| 위치 | 내용 |
|---|---|
| `tokens/tokens.json` | 토큰 정본. DTCG 형식(`$type`, `$value`, `{경로}` 참조). 라이트 테마 하나 |
| `styles/` | 공통 CSS 모듈. 진입점 `styles/index.css`가 가져오기 순서를 정한다 |
| `ui/` | HTML 구성 요소(`components.js`, `patterns.js`, `layout.js`, `document.js`, `editor.js`, `write.js`, `toolbar.js`, `table.js`), 신뢰 경계(`html.js`), 아이콘(`icons.js`, `svg.js`), 런타임 목록(`manifest.js`). 진입점은 `ui/index.js` |
| `ui/runtime/` | 브라우저 동작: 복사 도구 막대, 갤러리 선택 줄, 툴팁·그림 확대, 문서 목차, 영상, 흐르는 목록, 시간 표시 |
| `assets/` | 아이콘(`icons/`, 카탈로그 `icons/catalog.json`), 글꼴(`fonts/`), 댓글 테마 `giscus.css`, 출처 기록 `sources.json` |
| `build/` | 생성기. 토큰 검증·CSS 변수 변환(`tokens.js`, `token-css.js`), CSS 평탄화(`style-source.js`), 아이콘(`icons.js`), 배포본 생성(`design.js`, `index.js`), 발행 CSS 축소(`styles.js`, `prune-tokens.js`) |
| `dist/` | 생성 결과. Git 밖이며 직접 고치지 않는다 |

## 생성과 사용

1. `node src/design/build/index.js`가 `tokens/`, `styles/`, `ui/`, `assets/`를 읽어 `dist/`에 `tokens.css`, `styles.css`, `ui/`, `assets/`, `manifest.json`을 만든다. `npm ci`(prepare), `npm run build`, `npm test`가 먼저 실행한다. `--check`를 주면 쓰지 않고 현재 `dist/`와 비교만 한다.
2. 코드는 `package.json`의 `imports`로 `#design/*`(= `src/design/dist/*`)를 읽는다. 구성 요소는 `#design/ui/index.js`에서 가져온다.
3. 사이트 빌드는 `src/design/build/styles.js`의 `compileStyles`로 실제 HTML·스크립트가 쓰는 선택자와 그 선택자가 참조하는 CSS 변수만 남겨 `/theme/site.css`와 `/theme/admin.css`를 만든다. `:focus-visible`, 숨김·동적 상태, 움직임 줄이기 규칙은 보존한다.
4. `dist/manifest.json`의 `contentHash`가 발행 파일 주소의 캐시 무효화 값이 된다.

생성 결과나 발행 CSS를 정본으로 되돌려 넣지 않는다.

## 바꿀 곳

| 바꿀 것 | 위치 |
|---|---|
| 색·글꼴·글자 크기·간격·곡률·그림자·시간·중단점 | `tokens/tokens.json` |
| 클래스의 모양과 배치 | `styles/`의 해당 모듈 |
| 재사용 마크업과 접근성 연결 | `ui/`의 구성 요소 |
| 브라우저 동작 | `ui/runtime/` |
| 아이콘·글꼴·댓글 테마 | `assets/` |
| 콘텐츠·문구·노출 순서 | `content/`, `config/`(Vault 원문) |
| Markdown 문법 | `src/document/` |

값은 토큰에서, 구조는 구성 요소에서 바꾼다. 페이지마다 같은 조각을 복사하거나 화면 코드에 색·크기 값을 직접 쓰지 않는다. 토큰을 지우거나 이름을 바꾸면 사용처를 함께 고치고 옛 이름을 별칭으로 남기지 않는다.

## 토큰

`tokens.json`의 최상위 묶음은 `color`, `font`, `font-weight`, `text`, `leading`, `spacing`, `radius`, `shadow`, `border-width`, `outline-width`, `opacity`, `z-index`, `duration`, `ease`, `breakpoint`, `container`, `aspect`, `icon`, `component`, `primitive`다. 빌드는 모르는 참조, 순환 참조, 지원하지 않는 값을 오류로 멈춘다. CSS에서는 `var(--이름)`으로, 미디어 질의에서는 `breakpoint(이름)`으로 읽는다.

- 글꼴 `font.sans`, `font.mono`는 시스템 글꼴 스택이다. 한글은 OS 기본 글꼴로 대체된다.
- 코드 구문 색은 `color.syntax-*`(function, type, property, parameter, keyword, string, number 등)다.
- 상단 로고 글자 그림은 `content/assets/who-knows.svg`이며 `assets/fonts/inter-display-black.woff2`에서 윤곽을 딴 도형이다. 이 글꼴은 웹폰트로 싣지 않는다.

## CSS 모듈

`styles/index.css`는 `fonts.css` 다음에 기초(`base`), 공통 조각(`shell`, `tabs`, `toolbar`, `table`, `controls`, `forms`, `editor`, `write`, `icons`, `search`, `cards`, `prose`, `media`), 화면 묶음(`article`, `support`, `blog`, `landing`, `features`) 순서로 가져온다. 순서가 덮어쓰기 계약이다. 한 클래스의 기본 모양은 한 모듈에 두고 다른 모듈은 부모 맥락에서만 재정의한다. 빌드는 로컬 `@import`를 한 파일로 평탄화하며 외부 경로, 폴더 탈출, 순환·중복 import는 거부한다.

## 구성 요소

| 구성 요소 | 쓰는 곳 |
|---|---|
| `SiteHeader`, `SiteFooter` | 모든 페이지 |
| `Hero`, `Section`, `SectionIntro`, `ProjectShowcase`, `FlowRail`, `LogoItem`, `QuoteCard`, `EmailForm` | 홈 |
| `BlogCard`, `TagList`, `TagFilter`, `TextInput`, 검색 결과 줄 | Search, Blog |
| `PostArticle`, `DocumentLayout`, `DocumentOutline` | 글 상세, 관리 미리보기 |
| `CodeBlock`, `Table`, `Figure`, `Gallery`, `Player`, `Details`, 안내 상자, 카드 | 문서 렌더러 출력 |
| 관리 단추·목록·작성·출간·대화 상자 조각 | 관리 화면(`ui/write.js`, `ui/editor.js`) |

구성 요소는 글자와 주소를 스스로 이스케이프·검사하고, HTML 슬롯에는 `trusted()`로 표시한 출력만 받는다(`ui/html.js`). 브라우저 스크립트(`src/client/search/view.js` 등)도 같은 구성 요소의 출력만 DOM으로 옮긴다. 새 공통 마크업은 `ui/`에 구성 요소로 추가하고 `ui/index.js`의 `OWNED_CLASSES`에 클래스를 등록한다.

## 아이콘

`assets/icons/catalog.json`이 범주별 아이콘, 조작 아이콘(`controls`), 소셜 아이콘(`social`), 기술 로고(`brands`)와 라이브러리 고지를 관리한다. 파일 출처·크기·해시는 `assets/sources.json`, 라이선스 고지는 `assets/icons/licenses/`에 있다. 새 아이콘은 파일, 카탈로그 항목, 출처 기록을 함께 추가한다. 발행은 실제 사용한 아이콘과 그 고지만 `/theme/assets/icons/`에 싣는다.

## 댓글 테마

`assets/giscus.css`는 giscus iframe에 적용하는 테마다. 운영 빌드는 `/theme/assets/giscus.css`로 발행한다. 이 파일을 고치면 `assets/sources.json`의 `sha256`과 `bytes`도 갱신한다.

## 확인

`npm test`가 디자인을 다시 생성하고 시험을 실행한다. 자동 시험은 모양을 보장하지 않으므로 화면 변경은 `npm run dev`로 띄운 사이트를 1440, 1100, 390, 320px 폭에서 키보드 초점·호버·움직임 줄이기까지 확인한다.
