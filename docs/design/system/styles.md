# 스타일 구조

> 이 문서의 경로(`tokens/`, `styles/`, `ui/`, `assets/`, `scripts/`, `test/`, `dist/`)는 모두 홈페이지 저장소의 `src/design/` 기준이다. 생성 결과 `dist/`는 Git 밖이며 `npm run build:design`이 만든다. 도표 도구(DiagramPlay)와 다크 모드 발행은 홈페이지에서 제거했다.

공통 토큰·구성 요소·CSS·런타임을 한 정본에서 조합한다. 소비자는 표시 값이나 구성 요소의 HTML을 다시 정의하지 않는다.

## 소유와 변경 순서

| 단계 | 위치 | 책임 |
|---|---|---|
| 토큰 | `tokens/tokens.json` | 색·글자·간격·곡률·시간 값과 기본값 참조 |
| 구성 요소 | `ui/` | 검증된 속성에서 HTML과 접근성 연결을 생성 |
| 스타일 | `styles/` | 클래스의 기본 모양과 맥락별 배치 |
| 동작 | `ui/runtime/` | 복사·선택 줄(갤러리·장면)·툴팁·문서 탐색·영상·흐름 |
| 콘텐츠 | 소비자의 설정과 Markdown | 제목·설명·링크·목록·노출 정책 |

값 변경은 토큰에서, 재사용 구조 변경은 구성 요소에서 처리한다. 페이지마다 같은 조각을 복사해 고치지 않는다. 상세 속성과 신뢰 경계는 [공통 구성 요소](components.md)를 따른다.

사이트 글꼴은 Things 공식 사이트와 같은 시스템 글꼴 스택이다. 일반 글꼴 `font.sans`는 `ui-sans-serif, -apple-system, BlinkMacSystemFont, Roboto, sans-serif`, 코드 글꼴 `font.mono`는 `ui-monospace, SFMono-Regular, Menlo, "Andale Mono", Consolas, Monaco, monospace`이고 한글은 각 OS의 기본 한글 글꼴로 대체된다(사용자 결정). 도표는 글꼴 파일로 글 폭을 재서 배치하므로 도표 글꼴 `font.diagram-sans`(Pretendard)와 `font.diagram-mono`(JetBrains Mono)를 따로 둔다. `styles/diagram/` 문서의 `body`가 `--font-sans`·`--font-mono`를 이 두 값으로 바꾸므로 도표 문서 안의 탭·도구 막대도 Pretendard를 읽는다. 그림 글자의 `font.figure-sans`·`font.figure-mono`는 바뀌지 않는다. Pretendard 공식 동적 부분 집합(`assets/fonts/pretendard-variable/`, pretendard 1.3.9의 `woff2-dynamic-subset` 92개)과 JetBrains Mono의 `@font-face`는 `fonts.css`에 남아 있지만 사이트 글꼴 스택이 이름을 부르지 않아 사이트에서는 내려받지 않는다. 로고 글자 이미지의 Inter Display Black은 그대로다.

굵기는 Tailwind 이름인 `font-weight.normal`(400), `medium`(500), `semibold`(600), `bold`(700)로 고른다. 도표의 `figure-sans`·`figure-mono`는 내보내기에 포함하는 부분 글꼴의 등록 이름이며 웹 글꼴의 별칭이 아니다.

본문 글자는 `color.ink`, 보조 글자는 `color.ui-muted`, 중립 카드 면은 `color.ui-card`, 코드 구문은 `color.syntax-*`를 웹과 도표가 함께 읽는다. 같은 역할을 제품별 이름으로 다시 정의하지 않는다. 값이 같더라도 글자 크기·아이콘 크기·곡률처럼 따로 바뀌어야 하는 역할은 서로 참조하지 않는다.

웹 조작과 인라인 카드의 작은 모서리는 `radius.md`, 묶음 도움말 카드는 `radius.help-grouped-radius`, 설명 팝오버는 `radius.tooltip-radius`를 사용한다. 곡률에서 간격 토큰을 참조하지 않는다. 기본 간격 단계와 공통 본문 위계를 사용하거나 각 역할의 기본값을 정의한다.

미사용 판단에는 두 소비자의 JavaScript 참조, CSS 변수, 템플릿으로 조합하는 이름과 라이트·다크의 참조 경로를 포함한다. `color.paint`처럼 문법의 색 이름에서 변수를 만드는 역할을 단순 문자열 검색 결과로 삭제하지 않는다. 정의를 삭제하거나 이름을 바꾸면 생성물과 소비자 참조를 함께 갱신하고, 이전 이름을 호환용 별칭으로 남기지 않는다.

## 문서 앱 역할

`font.ui`는 시스템 UI 서체이며 문서 본문의 `font.sans`와 분리한다. 조작부는 `text.tool`(13px), `spacing.tool-icon`(16px), `spacing.tool-target`(28px), `spacing.toolbar`(40px)를 사용한다. 크기는 승인된 데스크톱 앱 설계값이며 Things의 측정값이 아니다. 터치 환경의 목표 크기를 이 값으로 제한하지 않는다.

`color.workspace.sidebar`, `document`, `toolbar`는 탐색·문서·도구 표면이다. `hover`와 `selected`는 중립 상태 면이고 글자는 `color.ink`를 사용한다. 모두 기존 회색 단계를 참조하며 라이트·다크에서 본문과 탐색 영역을 구분한다. 소비자는 제품명으로 별도 팔레트를 만들지 않는다. 이 토큰은 기존 웹 구성 요소의 모양을 자동으로 바꾸지 않는다.

다크 카드의 면은 `color.ui-card`, 제목은 `color.ink`, 설명은 `color.body`를 읽는다. 선택과 눌림의 배경에서도 글자 대비를 유지한다. grouped와 related 카드는 다크 모드에서 자체 중립 면을 가져 밝은 페이지 안에서도 글자가 사라지지 않는다. 페이지 배경과 일반 링크색은 바꾸지 않는다. 카드 배경을 공유하는 문서 목차의 호버·선택 글자는 `color.document-nav-active-ink`로 분리해 같은 배경에서 읽히게 한다.

텍스트 입력은 `TextInput`과 `.app-input` 하나로 구현한다. 일반 입력·검색·구독이 모두 이 구성 요소를 조립하며 다른 모듈은 입력의 모양을 정의하지 않는다. 기본은 Things 입력 칸이다: 옅은 회색 면(`color.input-background`, `#eceef0`, 다크는 반투명 흰 면), 1px 선(`color.input-border` = `color.ui-line`, `#dfe3e8`), 반경 `radius.input-radius`(.4em)이고 높이(`spacing.input-height`)는 탭 높이와 안쪽 여백 두 배의 합이다. 글자는 `color.input-ink`, 안내 문구는 `color.input-placeholder`이며 다크의 안내 문구는 `color.gray.212`로 반투명 면 위 4.5:1 이상을 유지한다. 입력 칸(검색, 구독, `.app-input`, `.app-textarea`, 댓글 입력)은 초점에서도 외곽선·그림자·테두리 강조를 두지 않는다(사용자 결정). 단추·링크의 키보드 초점 선은 그대로다.

변형은 크기와 면, 앞 아이콘 칸뿐이다. 크기 `medium`·`large`는 검색의 본문·강조 크기(`article-search-*`, `search-input-*`)이고 여백에 앞 아이콘 칸과 뒤 지우기 칸이 들어 있다. `control`은 구독 폼 크기다.

면 `field`는 검색의 불투명 면(`color.search-bg`)과 기존 검색 안내 문구 색 `color.input-field-placeholder`(`#757575`)를 쓰고, `card`는 `color.ui-card` 면과 `color.ui-line` 테두리를 쓴다. 앞 아이콘은 `.app-input-field` 안의 `.app-input-icon`이며 강조 크기에서만 검색 아이콘 크기를 쓴다.

검색 입력 글자는 웹 본문과 같은 `color.body`를 사용한다. 브라우저 기본 입력 색에 의존하지 않아 라이트·다크 모두 본문 위계를 유지한다.

## 모듈과 생성

기초 초기화와 초점 링은 `base.css`가 소유한다. 일반 초점 링은 `outline-width.focus`와 `color.ui.focus`를 사용하며, 잘리는 내부 링크는 해당 구성 요소가 안쪽 오프셋만 지정한다. 페이지 전체 스크롤바와 내부 도표 스크롤바는 각각 `spacing.scrollbar`, `spacing.figure-scrollbar` 역할을 사용한다.

`styles/index.css`는 `styles/*.css`를 순서대로 가져온다. 기본 요소는 base·shell·tabs·toolbar·table·controls·forms·editor·write·icons·search·cards·prose·media, 맥락 배치는 article·support·blog·landing·features·pages가 소유한다. 한 클래스의 정본은 한 모듈에 두고 다른 모듈은 부모 맥락에서만 재정의한다.

빌드는 로컬 CSS import를 평탄화한다. 외부·절대 경로, 폴더 탈출, 순환·중복 import와 조건부 import는 거부한다. `url()`은 배포 CSS 기준 `./assets/...`를 사용한다. `breakpoint(이름)`은 토큰 값으로 바뀐다. 웹과 도표는 `styles/tabs.css`를 함께 읽어 탭을 다시 정의하지 않는다.

소비자의 `compileStyles`는 전체 HTML·스크립트의 사용처, 동적 상태와 변수 참조를 보존한 뒤 축소한다. `:focus-visible`, 숨김 상태와 움직임 줄이기 규칙을 빠뜨리지 않는다. 배포물의 축소 결과를 정본 CSS에 역반영하지 않는다. 다섯째 인자 `{ scheme: 'light' }`를 넘기면 라이트로 고정한 사이트로 보고 다크 미디어 질의, `[data-theme=dark]`, `:root`를 되풀이하는 `[data-theme=light]` 토큰 블록과 그 블록만 쓰던 값을 뺀다(`fixThemeScheme`). 지원하는 고정 테마는 라이트 하나다.

`ui/build/styles.mjs`는 홈페이지 `package.json`의 개발 의존성 `postcss`·`purgecss`를 직접 불러온다. 따로 묶은 배포 모듈은 만들지 않는다. `pruneTokens`는 같은 모듈을 공유하며 `compileStyles`의 입력과 반환값은 유지한다.

상위 도구를 갱신할 때 `npm audit`, 전체 계약 시험과 발행 CSS·토큰 축소 결과를 확인한다.

## 구성 요소 계약

| 구성 요소 | 스타일 계약 |
|---|---|
| SiteHeader, SiteFooter | `.app-shell`, `.app-header`, `.app-nav`, `.app-logo`, `.app-logo-brand`, `.app-footer` |
| EmailForm | `.app-newsletter`, `.app-newsletter-note` |
| TextInput | `.app-input`, `.app-input-field`, `.app-input-icon` |
| Hero, Section, SectionIntro, QuoteCard | `.app-hero-copy`, `.app-hero-logo`, `.app-hero-wordmark`, `.app-landing-section`, `.app-landing-heading`, `.app-landing-icon`, `.app-interview-summary` |
| Card, CardGroup | `.app-help-card`, `.app-card-summary`, `.app-support-grid` |
| BlogCard | `.app-blog-card`, `.app-blog-card-link`, `.app-blog-cover`, `.app-blog-card-tags`, `.app-blog-card-body`, `.app-blog-card-meta`, `.app-blog-card-author` |
| Tag, TagList | `.app-tag`, `.app-tags` |
| SearchBox, SearchResultLink | `.app-search-clear`, `.app-search-result-link` |
| DocumentArticle, PostArticle | `.app-prose`, `.app-blog-post`, `.app-article-lead` |
| CodeBlock, CopyButton | `.app-code`, `.app-tool-header`, `.app-tool-label` |
| Table | `.app-table-scroll`, `.app-table` |
| TabList, Gallery | `.app-tabs`(갤러리 패널 묶음), `.app-tablist` |
| Figure, Player | `.app-figure`, `.app-player` |
| Details, 문서 안내 | `.app-details`, `.app-callout` |
| DocumentNavigation, DocumentPager | `.app-document-nav`, `.app-related-grid` |

`Player`는 `.app-player` 안에 기본 `video` 요소를 출력한다. 재생 버튼은 `.app-player-button`, 로드 실패 안내는 `.app-video-error`로 구분한다.

`RemoteLink`의 재생 링크는 기본·호버·키보드 초점에서 밑줄 없이 공통 조작 면과 초점 표시를 사용한다. 헤더의 제목 이미지는 본문 글자 크기에 맞추고 히어로 제목 이미지는 원본 비율과 공통 제목색을 유지한다. 히어로 위 여백은 기존 위 여백에 작은 간격 한 단계를 더한다.

`SiteHeader.logo`의 `.app-logo-brand`는 기존 `spacing.1-5`로 좌우 안쪽 여백 6px을 둔다. 링크 배경과 제목 이미지 사이의 간격을 확보하며 일반 아이콘·텍스트 헤더에는 적용하지 않는다. 링크의 기본·호버 불투명도와 배경은 기존 상태 규칙을 따른다.

홈 발행 변형 `.app-publication.app-canvas`와 `Hero`, 후기 구획은 `color.ui-card`를 사용하며 밝은 테마에서 흰색이다. 후기·구독 구획과 푸터도 `color.ui-card`를 사용해 본문과 같은 흰색으로 이어진다. 일반 `.app-canvas`만 `color.canvas`를 유지한다. 홈 식별 클래스를 보존하므로 로고의 기본·호버 불투명도는 바뀌지 않는다.

기술 로고의 링크는 아이콘 크기에 양쪽 안쪽 여백을 더한 정사각형이다. 슬롯 가운데에 아이콘을 놓고 평소·호버·키보드 초점에서 같은 가로·세로 비율을 유지한다.

`SectionIntro`의 `.app-landing-icon`은 제목의 기준선에 놓인 공통 크기의 자리다. 직계 아이콘을 자리 안에서 절대 배치해 가운데 놓으므로 자식 SVG·PNG의 기준선 차이가 제목 줄 높이에 영향을 주지 않는다. 기존 아이콘 크기와 여백은 유지한다.

히어로의 일반 이미지 로고는 `.app-hero-logo`, 글자 이미지는 `.app-hero-wordmark`를 사용한다. 일반 이미지의 최대 폭은 `spacing.hero-logo-max`로 본문 폭의 75%를 유지한다. 글자 이미지는 `text.5xl`의 48px 높이를 기준으로 하며 `intro-compact` 이하에서는 기존 `text.heading`의 36px을 쓴다. 가용 폭 안에서 원본 비율을 유지하고 로고와 같은 제목색·아래 여백을 공유한다. `text.5xl`은 기존 `spacing.12` 기본 단계를 참조한다.

`assets/fonts/inter-display-black.woff2`는 글자 이미지 재제작 입력이다. 공식 [Inter 원본](https://github.com/rsms/inter/blob/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/InterDisplay-Black.woff2)을 그대로 보존하며 출처·해시는 `assets/sources.json`, OFL 1.1 고지는 `assets/fonts/inter-license.txt`에 있다. 이 파일은 웹폰트로 등록하지 않으며 일반 본문 글꼴은 바뀌지 않는다. Inter Display Black을 Things 로고의 실제 서체로 단정하지 않는다.

`SectionIntro`의 아이콘 자리는 `spacing.landing-icon`의 64px이다. 카탈로그 SVG는 그 안에서 기존 `ContentIcon` 카드 역할인 48px로 가운데 정렬하고, 원본 PNG는 64px 이미지 표시를 유지한다. 아이콘 도형과 원본 여백을 고치거나 이름별 CSS 배율을 만들지 않는다.

`Card`·`DocumentArticle`·`PostArticle` 제목과 목록·안내 쪽 제목(`.app-page-heading`)은 `word-break: keep-all`로 한국어 어절을 지키고 가용 폭보다 긴 단어는 `overflow-wrap: anywhere`로 넘침을 막는다. 관련 글 제목은 기존 한 줄 말줄임을 유지한다. 문서 제목은 인라인 흐름에서 첫 줄에 아이콘을 놓고 `ContentIcon`의 기존 수직 정렬을 사용한다. 블로그 글 제목은 좌우 폭을 별도로 줄이지 않아 본문 폭을 모두 사용한다.

본문(`.app-prose`)은 `word-break: normal`이라 한국어도 음절 단위로 줄을 바꿔 줄 끝이 단 폭까지 찬다. 본문 안 제목(h1~h6)만 `keep-all`로 낱말 단위를 지킨다.

본문 그림(`.app-figure > img`, 문단 안 그림)은 누르거나 Enter·Space를 누르면 화면 크기의 확대 창(`.app-image-viewer`, 모달 `dialog`)이 열린다. 창 어디든 다시 누르거나 Esc를 누르면 닫히고 초점은 그림으로 돌아온다. 링크·단추 안의 그림은 제외한다. 동작은 `ui/runtime/document.js`가 소유한다.

### 강제하는 것

토큰 검사기는 CSS·조작 SVG·UI 모듈·런타임의 직접 표현 값과 정의되지 않은 변수를 검사한다. `--anchor-x`, `--anchor-y`는 실제 요소 위치에서 계산하는 툴팁 좌표다. SVG 도형의 좌표나 원본 미디어 크기는 UI 토큰과 다른 콘텐츠 데이터다.

`node ui/build/check-tokens.mjs <대상> --tokens tokens/tokens.json`은 파일·폴더를 검사한다. 대상이 없거나 검사할 소스가 없거나 토큰 정본을 읽지 못하면 종료 코드 2로 실패한다. `--tokens`를 생략하면 현재 폴더와 상위의 `tokens.json`·`tokens/tokens.json`만 찾으며 `.git` 파일이나 폴더에서 멈춘다. 시험 fixture나 다른 저장소의 정본을 대신 고르지 않는다. 위반은 종료 코드 1, 위반 없는 검사는 0이다.

`var()` 이름은 선택한 토큰 정본, 검사기와 함께 배포된 공통 CSS의 선언, 아래 런타임 입력 계약에 있어야 한다. 소비자 파일에 선언을 추가해도 공통 변수로 등록되지 않는다. fallback이 있어도 이름의 오타를 검사하며, fallback 안의 중첩 참조도 검사한다. CSS 주석과 문자열의 가짜 선언은 등록하지 않는다. 정본에서는 `styles/`를, 배포본에서는 `styles.source.css`와 `styles/`를 검사기 위치 기준으로 읽는다.

| 런타임 입력 | 설정 주체와 값 | 생략 |
|---|---|---|
| `--anchor-x`, `--anchor-y` | `ui/runtime/document.js`가 툴팁 위치를 px로 계산 | 툴팁 표시 시 필수 |
| `--s` | DiagramPlay `chart/heatmap.js`의 칸 강도 0~1 | 열지도 칸에서 필수 |
| `--view-w`, `--panel-w` | DiagramPlay `html.js`, `player/play.js`의 단위 없는 SVG 폭 | 판 배치에서 필수 |
| `--figure-canvas` | DiagramPlay `html.js`의 넓은 캔버스 길이(px) | 기본 캔버스 토큰 사용 |
| `--bundle-w`, `--fit-w`, `--zoom` | DiagramPlay `player/view.js`의 묶음 폭·맞춤 길이(px)·확대 배율 | 문서 폭·100%·1 사용 |
| `--pill-tint` | DiagramPlay `player/stage.js`의 라벨 강조 강도 0~1 | 중립 상태 0 사용 |
| `--pulse-effect` | DiagramPlay `chart/pulse-overlay.js`가 전달하는 표식 계열의 효과색 | 갱신 겹침에서 필수 |
| `--pulse-width` | 같은 표식의 원래 선 굵기 | 면은 tag, 선은 edge 두께 사용; 글자 후광은 casing 사용 |
| `--chart-boundary` | DiagramPlay `chart/metrics.js`가 전달하는 밝은 계열의 점 윤곽색 | 차트가 놓인 면의 currentColor 사용 |
| `--chart-area` | DiagramPlay `chart/line.js`가 전달하는 면적 차트 계열 면색 | 면적 차트 면에서 필수 |

HTML·SVG·Vue·Svelte에서는 `style` 요소·속성과 색·글꼴·획·불투명도 등 표현 속성을 검사한다. 일반 글자·주소·도형 좌표·viewBox·미디어 원본 크기는 제외한다. 예외는 같은 줄의 실제 주석에 사유를 적은 `tokens-allow:`만 인정한다. 문자열 속 표기와 빈 사유는 검사를 끄지 않는다.

표현 속성의 이름 색, 색 혼합·라이트/다크 함수 안의 이름 색, 전환·애니메이션의 직접 이징, `font-weight` 키워드와 `%`·`deg`·`ch`를 포함한 크기 단위를 검사한다. 단위의 대소문자는 구분하지 않는다. 전체 크기·가운데 정렬·출발점에 쓰는 100%·50%·0%와 반대 방향 이동의 -100%·-50%는 허용한다. 일반 글자와 문법 안내의 색 이름·백분율은 표현 값으로 보지 않는다. JavaScript에서 이름을 조립하는 `var()`는 완성된 이름을 이 정적 검사만으로 검증할 수 없으므로 생성 결과 검사가 필요하다.

시험은 위 표의 클래스가 스타일 정본에 존재하는지, 텍스트·주소·HTML 슬롯의 신뢰 경계, 탭 ID와 역할 연결, 코드 구문 역할 및 대비, 생성물 일치와 CSS 축소를 확인한다. 도표는 라이트·다크 토큰을 지원하며 실제 페이지의 테마 선택은 소비자가 맡는다.

## 색 체계

사이트의 색·글 위계·단추는 Things 3 공식 사이트(culturedcode.com/things, 블로그 공통 CSS)를 따른다(사용자 결정). 바탕과 대부분의 요소는 흰색과 무채색이고 강조색은 둘이다. 값은 `tokens/tokens.json`, 다크 차이는 `tokens/tokens.dark.json`에 있고 화면 코드에 색 값을 적지 않는다. 모든 역할은 다크 값을 토큰으로 함께 둔다.

| 역할 | 토큰 | 라이트 | 다크 | 쓰는 곳 |
|---|---|---|---|---|
| accent-1 링크 | `color.accent-1.link`, `color.ui.link`, `color.action-link`, `color.link`, `color.accent` | `#2576eb` | `#649fff` | 링크(밑줄 없음, 호버 밑줄), 초점 선(`component.action-focus` `0 0 0 2px rgba(37,118,235,.5)`), 도구 단추 호버 아이콘, 목차 현재 항목 글자 |
| accent-1 누른 링크 | `color.accent-1.link-active`, `color.prose-link-active` | `#114691` | `#92bbfe` | 본문 링크 누름, 다크 목차 현재 항목 글자(면 없이 글자만) |
| accent-1 강한 단추 | `color.accent-1.strong`·`strong-hover`·`pressed`, `color.button-primary(-hover, -active)` | `#4f91fb`·`#649fff`·`#3c84f3`, 흰 글자 700 | 같음 | 주요 단추, 구독 단추, 댓글 로그인·등록 |
| accent-1 선택 면 | `color.feature-tab-selected`, `color.feature-tab-ink` | `#3c84f3`, 흰 글자 | `#649fff`, `#111111` 글자 | 선택 탭, 분할 탭 선택 |
| accent-1 메뉴 | `color.accent-1.menu`, `color.control-link` | `#5c9cf5` | 같음 | 재생 링크, 툴팁 단어, 로고 호버 아이콘 |
| 기본 단추 | `color.button.{surface,hover,active,ink}` | `#cfd8e6`·`#c6d0de`·`#bec8d6`, 글자 `rgba(0,8,19,.74)` | 흰 12%·16%·20% 면, 글자 `color.ink` | 기본 탭, 일반 단추, 댓글 탭·취소 단추 |
| accent-2 주황 | `color.accent-2.*`, `color.data.main`, `color.state.active` | `#ff6900`(Tailwind orange-500) | `#ff8904`(orange-400) | 도표의 켜진 경로·이동 점, 열지도, 코드 키워드·형식 |
| 구분색 1 주황 | `color.category.orange.{fill,line,ink}` | `#ff6900` | `#ff8904` | 첫 계열, 이름 있는 색 `orange`(accent-2와 같은 색, 면 위 글자 흰색) |
| 구분색 2 보조 파랑 | `color.category.blue.{fill,line,ink}` | `#2b7fff`(blue-500)·`#2b7fff`·글자 `#155dfc`(blue-600), 면 `#eff6ff` | `#51a2ff`(blue-400), 면 `#333c4a` | 두 번째 계열과 경로, 코드 문자열, 이름 있는 색 `blue`(면 위 글자 흰색) |
| 구분색 3 진한 회색 | `color.category.gray.{fill,line,ink}` | `#8b8f95`·`#8b8f95`·`#62666c` | `#a0a2a7` | 세 번째 계열, 도표 구조(윤곽·선) |
| 구분색 4 연한 회색 | `color.category.silver.{fill,line,ink}` | `#c4c8cd`·`#b4b8bd`·`#62666c` | `#6e7075`·`#6e7075`·`#94969b` | 네 번째 계열, 인용 줄 |
| 성공 | `color.status.success.{ink,surface}` | `#00c950`(green-500), 면 `#f0fdf4` | `#05df72`(green-400), 면 `#2c423c` | 상태 아이콘과 상태 상자 |
| 경고 | `color.status.warning.{ink,surface}` | `#ff6900`, 면 `#fff7ed` | `#ff8904`, 면 `#453a31` | accent-2와 같은 값(경고 아이콘으로 구분) |
| 오류 | `color.status.error.{ink,surface}` | `#fb2c36`(red-500), 면 `#fef2f2` | `#ff6467`(red-400), 면 `#45363b` | 상태 아이콘과 상태 상자 |

- 글자색 위계도 Things 값이다: 본문·제목 `color.ink`(`#303336`, 다크 `#f0f0f0`, `color.body`는 같은 값을 참조), 날짜 `color.post-date-color`(`#989fa8`), 그림 설명·작은 글 `color.prose-caption-color`(`rgba(4,15,26,.5)`, 다크 `rgba(239,246,255,.49)`), 목록 표식 `color.prose-marker`(`rgba(0,15,36,.46)`, 다크 `rgba(219,234,255,.51)`), 구분선 `color.prose-rule-color`(`rgba(0,20,49,.18)`, 다크 `rgba(227,239,255,.25)`), 인라인 코드 글자·면·선 `rgba(0,4,10,.69)`·`rgba(0,34,77,.05)`·`rgba(0,48,111,.04)`(다크 `rgba(252,253,255,.73)`·`rgba(240,246,255,.09)`·`rgba(213,230,255,.04)`).
- 구분색은 순서(주황, 파랑, 진한 회색, 연한 회색)가 고정이다. 첫 계열은 accent-2와 같다. `color.data.category-*`의 번호가 이 순서이고 판은 1판 하나다. 넷을 넘는 계열은 기존 무늬(`category-pattern`)와 직접 라벨로 구분한다. DiagramPlay가 읽는 색 이름(`orange`, `blue`, `gray`, `silver`)과 순서는 바뀌지 않는다.
- 3·4번은 색만으로 구분하지 않는다. 선 모양(`color.data.category-dash`: 실선, 실선, 점선, 점점선)과 직접 라벨(`category-label` required)을 함께 쓴다.
- 라이트 상태 면은 Tailwind 50 단계, 다크 상태 면과 파랑 옅은 면은 해당 색 10%를 다크 카드 `#303136`에 섞은 값이다. 상태 상자는 옅은 면, 본문색 글자, 같은 아이콘 묶음(`actions/check`, `warning`, `close`)의 상태색 아이콘이고 테두리나 색 줄이 없다.
- 보라 계열은 토큰, 이름 있는 색, 차트 계열, 코드 강조 어디에도 없다. 노랑·청록도 없고 빨강·초록은 상태 전용이다. 아이콘 고유색(`icon.*`)은 아이콘 검수 기준을 따른다.
- 태그는 무채색이다: 옅은 회색 면(`color.prose-soft`, 다크 `color.soft`)에 본문색 글자, 호버는 한 단계 진한 회색 면에 진한 글자, 선택(검색 태그 필터)은 진한 글자색 면에 페이지 면 색 글자다.
- 카드·검색 결과·관련 글의 호버와 누름 면은 무채색(`#eff0f2`, `#e6e8eb`, 테두리 `#e3e5e8`, 다크 `#3e3f44`)이다. 카드의 댓글 링크도 무채색이다. 홈 소셜 아이콘은 사이트 링크와 같은 accent-1 링크색이다. 도표의 강조 깜빡임(`color.figure.flash`)은 accent-2의 옅은 면이다.
- accent-2 면 위 글자는 두 테마 모두 흰색(`color.accent-2.on-solid`)이다(사용자 결정). 흰 글자 대비는 `#ff6900` 위 2.89:1, `#ff8904` 위 2.3:1로 4.5:1에 못 미치며 시험 예외로 기록한다.
- 대비: 구분색 면 위 글자(`on`)와 이름 있는 색 글자(`ink`)는 페이지 위 4.5:1 이상을 시험한다. 다크 연한 회색 글자 `#94969b`는 확정값이라 페이지 위 4.38:1이고 직접 라벨이 필요한 계열로만 쓴다(시험 예외).
- Things 값은 대비를 맞추려고 바꾸지 않는다(사용자 결정). 링크 `#2576eb`는 흰 면 4.31:1·옅은 면 4.03:1, 그림 설명은 3.62:1(다크 4.15:1), 날짜 `#989fa8`는 흰 면 2.67:1, 선택 면 `#3c84f3`·강한 단추 `#4f91fb` 위 흰 굵은 글자는 3.63:1·3.10:1, 분할 탭 바탕 위 선택 면은 2.77~2.96:1이다. 시험 예외로 기록하며 접근성 기준 충족이라고 쓰지 않는다.
- accent-2·보조 파랑·상태색은 사용자가 정한 Tailwind 값이라 대비를 맞추려고 바꾸지 않는다. 흰 면 위 대비는 오류 `#fb2c36` 3.81:1, 파랑 `#2b7fff` 3.76:1, 성공 `#00c950` 2.22:1이고 도표 면의 누름 면 위 성공은 약 1.7:1이다. 시험 예외로 기록하고 상태 아이콘 모양과 글자 라벨로 보완한다. 파랑 글자는 코드 면 위 본문 대비를 위해 한 단계 진한 `#155dfc`를 쓴다.

## 카드·태그·검색

도형의 기본 면과 외부 도형·그룹·관계선의 점선은 공통 CSS가 소유한다. 외부 도형의 도착 후광도 같은 점선을 유지하며, 생명선과 메모·격자 구분선의 별도 점선 역할은 보존한다. 도형은 `color.ui-card` 면을 유지하고 기본 윤곽·그룹 경계·관계선은 구분색 진한 회색(`color.figure.outline`, `color.line`)이다. 두 테마에서 윤곽과 카드 면의 대비를 3:1 이상으로 검사한다. 색을 지정한 윤곽과 재생 중 강조 역할은 유지한다.

카드 이미지·제목·설명은 글 링크에, 태그는 독립 링크에 둔다. 글 링크의 가상 요소가 카드 전체를 덮고 태그는 그 위에서 동작한다. 검색 결과도 태그 행과 여백까지 하나의 호버 영역이다. 수정키 클릭과 키보드 탐색은 일반 링크 동작을 유지한다.

피드 글 끝의 댓글 펼침 링크 단추(`.app-button.is-link`)는 접혀 있을 때 "더 보기"처럼 가운데에 둔다. 카드의 댓글 링크(`댓글 · N`, `댓글 보기`)는 반복되는 보조 동작이라 메타 글자색이고 호버에서 기본 글자색이 된다. 태그는 카드·본문·검색에서 같은 알약(`text.tiny-text` 13, 줄 높이 1.4, 굵기 400, 안쪽 2·10, 끝까지 둥근 모서리)과 배경을 사용한다. `is-medium`은 같은 모양에 글자만 `text.small-text`(15)다. 외곽선이 없으며 hover와 focus는 `color.tag-hover`와 `color.on-action`을 사용한다. 카드 태그는 한 줄을 넘으면 말줄임하며 키보드 초점이 이동하면 해당 링크를 볼 수 있다. 날짜·작성자·댓글의 노출 여부는 소비자 데이터가 정한다.

태그의 hover·focus와 탭 글자는 실제 합성 배경에서 4.5:1 이상을 유지한다. 기본 탭은 Things 기본 단추다: 단추 글 크기(`text.platform-text`, .89em, 600, 줄 높이 1.3), 안쪽 .5em·1em, 반경 `radius.prose-pre-radius`(.5em), 선 없음, 회청 면(`color.button.surface`)과 진한 글자(`color.button.ink`), 호버 `color.button.hover`와 작은 그림자, 누름 `color.button.active`. 선택은 accent-1 선택 면(`color.feature-tab-selected`, 라이트 `#3c84f3`에 흰 글자, 다크 `#649fff`에 `#111111` 글자)이다. 선택 면 대비는 색 체계의 Things 예외를 따른다. 재생기의 장면 탭과 댓글의 정렬·작성 탭도 같은 규칙을 읽는다. 숫자 탭은 두 테마 모두 무채색의 `color.gallery-selected`와 `color.gallery-selected-ink`를 사용하며, 다크 모드에서 밝은 면과 어두운 숫자로 명암을 뒤집는다.

전체 보기·돌아가기·본문 이어 읽기는 `NavigationLink`의 글꼴·크기·색과 꺾쇠를 공유한다. 카드 열 개수는 묶음의 속성이고 바깥 컨테이너 폭과 분리한다. 홈페이지의 넓은 CS 4열·Tech 5열은 소비자의 구성이다.

영상 재생·일시정지 제어는 버튼 색을 따르는 채운 원과 흰색 기호를 사용한다. `ControlIcon`은 두 제어의 배색을 보존하고 다른 제어의 단색 변환을 유지한다.

검색 결과 페이지도 기본 `combobox` 계약의 `SearchBox`를 쓴다. 입력하는 동안의 추천 목록(`role=listbox`)은 입력 칸 바로 아래에 겹쳐 떠서 아래 결과를 밀지 않고, `spacing.search-suggestions-max`(360, 화면 높이의 60%를 넘지 않음)를 넘는 항목은 목록 안에서 스크롤한다. `SearchBox({ combobox: false })`는 추천 목록 없이 `searchbox` 역할만 쓰는 입력이다. `ContentGroup`의 `collection` 변형은 글 목록 절의 바깥 간격을 함께 소유한다.

카드 변형 목록은 `CARD_VARIANTS`, 선택 줄 모양 목록은 `TAB_SELECTORS`를 가져와 입력 검사에 사용한다. 페이지 이전·다음 링크는 공통 탐색 꺾쇠를 사용하므로 소비자가 라벨에 화살표 글자를 붙이지 않는다.

## 페이지와 영상

프로젝트 영상의 초기 접힘은 CSS가 소유한다. 초기화 클래스 없이 숨기고, 재생 후에는 기존 `has-played` 상태로 연다. 스크립트가 실행되지 않으면 명시적 영상 링크의 `:target`에서만 기본 컨트롤을 표시한다.

랜딩의 제목·설명·후기 보조 글자·구독 안내와 구역 표면은 다크 의미 토큰을 사용한다. 구독 입력의 안내 문구는 `color.ui-muted`, 활성 버튼 글자는 `color.control-paper`를 사용한다. 비활성 입력·버튼은 전체 투명도로 글자까지 흐리지 않으며 버튼을 `color.ui-line` 표면과 `color.body` 글자로 구분한다.

다크 `color.canvas`는 `color.prose-pre-background`를 참조한다. 일반 `.app-canvas`와 본문 `color.ui-card`의 구역 차이를 유지하며 새 색을 만들지 않는다.

머리글 메뉴(`color.nav-color`), 푸터 글자(`color.landing-footer-ink`), 구독 안내(`color.landing-newsletter-note-ink`)는 밝은 테마에서 `primitive.muted`를 사용해 흰 배경과 4.5:1 이상의 명도 대비를 유지한다.

인쇄(`@media print`)는 `base.css`가 소유한다. 머리·꼬리말, 검색, 목차, 댓글, 쪽 이동, 코드 도구, 관리자 단추를 숨기고 그림·코드·표·인용이 쪽 사이에서 잘리지 않게 한다.

## 본문과 코드

본문의 Markdown 표와 단축키 표는 `Table`과 `styles/table.css`를 공유한다. 표를 감싼 상자(`.app-table-scroll`)가 블록 틀(1px `color.prose-block-line`, 반경 8)을 갖고 표 자체에는 테두리가 없다. 상자는 Things 표처럼 내용 폭만큼만 차지하고, 본문보다 넓으면 상자 안에서 가로로 넘긴다. 글자는 본문 크기와 줄 높이를 그대로 물려받고, 칸 안쪽은 Things 표의 .3em·.5em, 머리줄은 굵기 700만 다르고 면이 없으며, 줄 구분은 같은 선 1px이다(모두 Things 표와 같음). 문서가 지정한 열 정렬은 유지한다.

표는 내용의 고유 폭을 확보해 코드 옆의 짧은 설명이 한두 글자씩 세로로 눌리지 않게 한다. 긴 셀은 기존 본문 읽기 폭인 `container.body-width` 안에서 줄바꿈한다. 좁은 화면에서는 표 영역 안에서 가로로 이동하고 페이지 전체 폭은 늘리지 않는다.

### 글 단계

본문은 `app-prose` 위계를 사용한다. 크기·굵기·색·줄 높이는 Things 블로그 공통 CSS(기준 18px)의 값이고 글꼴만 사이트 글꼴 스택이다. 좁은 화면에서도 글 크기는 바뀌지 않는다(Things와 같음). 도표 iframe은 본문 CSS를 읽지 않아 그림 글자는 바뀌지 않는다.

| 역할 | 토큰 | 크기 / 줄 높이 / 굵기 | 색 |
|---|---|---|---|
| 본문(문단, 목록, 인용, 접기) | `text.body-text`, `leading.feature-body-line` | 18 / 1.4 / 400 | `color.body`(= `color.ink`, `#303336`) |
| 글 제목 | `text.post-title-size`, `leading.post-title-line` | 37.8 / 1.15 / 700 | `color.ink` |
| 도입 | `text.post-lead-size`, `leading.line-intro` | 22.5 / 1.25 / 400 | `color.body` |
| h1 | `text.section-title`, `leading.prose-heading-line` | 36 / 1.1 / 700 | `color.ink` |
| h2 | `text.subtitle`, `leading.line-intro` | 27 / 1.25 / 700 | `color.ink` |
| h3 | `text.feature-intro`, `leading.feature-body-line` | 20.25 / 1.4 / 700 | `color.ink` |
| h4 | 본문 크기 | 18 / 1.4 / 700 | `color.ink` |
| 날짜·글쓴이 | `text.post-date-size` | 16 / 1.4 / 400(이름 500) | `color.post-date-color`(`#989fa8`), 이름 `color.ink` |
| 그림 설명·작은 글·fineprint | `text.post-date-size`, `leading.caption-line` | 16 / 1.36 / 400 | `color.prose-caption-color` |
| 인라인 코드·코드 블록 | `text.prose-code-size`, `leading.feature-body-line` | .85em / 1.4 | 인라인은 Things 코드 색, 블록은 아래 코드 블록 |
| 태그 | `text.tiny-text`, `leading.line-body` | 13 / 1.4 / 400 | 무채색 태그 |
| 각주 | `text.small-text` | 15 | `color.ui-muted` |
| 글 카드 제목·요약·메타 | `text.intro-text`·`text.compact-text`·`text.small-text` | 24 / 1.35 / 700, 17.1 / 1.5, 15 | 제목 `color.ink`, 요약 `color.body`, 날짜 `color.post-date-color` |

- 굵기는 400 본문, 500 글쓴이 이름, 600 단추·탭·요약 제목, 700 제목·표 머리·굵게·강한 단추다.
- 간격은 Things의 em 값이다: 문단·목록·정의 목록 아래 1.4em(`spacing.prose-paragraph-gap`, 25.2), h2 앞 2.5625em·뒤 .854em(69·23), h3 앞 2.683em·뒤 .894em(54·18), 제목 바로 뒤의 아래 단계 제목은 앞 간격 0, 목록 들여쓰기 1.5em(`spacing.prose-list-inset`)이고 항목 사이 간격은 없다. 구분선은 본문 폭의 62%를 가운데 두고 위아래 2.8em이다. 블록(코드·표·그림·도표·접기) 위아래는 24(`spacing.prose-block`)다.
- 글 머리: 위 48(좁은 화면 32), 제목 → 24 → 도입 → 24 → 글쓴이 줄(사진 28, 이름, 날짜) → 16 → 태그 → 48(좁은 화면 40) → 본문. 제목은 왼쪽 정렬이다(Things는 가운데 정렬, 사이트 배치 유지).
- 글 카드: 카드 사이 32, 반경 16, 1px 선, 안쪽 32(좁은 화면 24, 제목 20.25), 태그 → 12 → 제목 → 8 → 요약 → 24 → 메타(사진 28, 이름, 가운뎃점, 날짜).

### 블록 요소

- 블록 틀: 코드·표·도표·접기는 반경 `radius.prose-block-radius`(8, Things pre·표 .5em의 고정값)를 쓴다. 선이 있는 표·도표·접기는 Things 표 선 `color.prose-block-line`(라이트 `#eceef0`) 1px이고, 코드는 아래 코드 규칙의 면과 선을 쓴다. 본문 그림은 기본으로 모서리를 깎지 않고, 작성자가 rounded 옵션(`img.is-rounded`)을 고르면 코드 블록과 같은 반경으로 자른다(사용자 결정). 링크로 감싼 그림과 그림 격자 안도 같다.
- 인용은 Things처럼 기울이고 양옆 2em(좁은 화면 .75em)을 들여 쓴다. 줄이나 면은 없다.
- 인라인 코드와 코드 블록은 Things `shared.css`의 `code`·`pre` 값을 쓴다. 크기 .85em, 인라인 안쪽 0·.25em과 반경 .25em, 블록 안쪽 .4em·.8em(`component.prose-pre-padding`)이다. 면 `rgba(0,34,77,.05)`, 선 `rgba(0,48,111,.04)`, 글자 `rgba(0,4,10,.69)`(`color.code-*`, `color.prose-code-*`)라 본문보다 한 단계 옅다. 다크 인라인 코드는 Things 다크 값이고, 다크 코드 블록은 주석 대비를 지키려고 깊은 면(`#1c1c1e`)을 유지한다. 형광펜(`mark`)만 노란 면이다.
- 표는 Things 표처럼 칸 안쪽 .3em·.5em(`component.table-padding`), 머리 칸은 굵기만 다르고 면을 칠하지 않는다.
- 링크는 accent-1 링크색(`color.action-link`, 라이트 `#2576eb`, 다크 `#649fff`)이고 밑줄이 없으며 호버에서 밑줄이 생긴다. 누르는 동안은 `color.prose-link-active`다.
- 접기(`.app-details`)는 블록 틀과 안쪽 12·16, 요약 600, 펼치면 요약 아래 8이다.
- 각주는 15와 `color.ui-muted`, 위 구분선 48·16이다.

### 코드 블록

코드 블록은 테마를 따른다. 라이트는 옅은 회색 면(`color.prose-soft`)에 진한 글자(`color.ink`), 다크는 무채색 `#1c1c1e` 면에 밝은 글자(`#d8dde4`)이고 두 테마 모두 1px `color.ui-line` 틀이다. 안쪽은 24(좁은 화면 16), 글자는 Things 코드 크기(.85em, 줄 높이 1.4)다. 언어 이름 머리줄은 없고 언어는 `data-language` 속성으로만 남는다. 파일 이름을 주면 이름표 줄이 생긴다. 복사 단추만 오른쪽 위에 겹치고, 긴 줄은 줄을 바꾸지 않고 블록 안에서 가로로 옮겨 본다(페이지 폭은 늘지 않는다).

강조는 정한 색만 쓴다: 키워드·형식은 accent-2 주황(`color.syntax-keyword` = `color.accent-2.light-ink`, 라이트 `#ff6900`, 다크 `#ff8904`), 문자열은 구분색 파랑 글자(`color.category.blue.ink`, 라이트 `#155dfc`, 다크 `#51a2ff`), 주석은 구분색 회색 글자(`color.category.gray.ink`, 라이트 `#62666c`, 다크 `#a0a2a7`, 기울임 없음)다. 숫자·상수·함수 이름은 기본 글자색 굵게(700)이고 나머지 역할은 기본 글자색이다. 색 체계 밖의 색은 쓰지 않는다. 라이트 키워드의 accent-2 주황은 옅은 회색 면 위 대비가 낮지만 정한 값 그대로 쓰는 예외이고, 나머지 역할은 코드 면 위 4.5:1 이상인지 시험한다.

본문 링크, 코드, 표, 인용문, 수식, 그림과 캡션이 공통 역할을 참조한다.

제목의 원래 단계는 `app-heading-N`으로 유지한다.

안내 상자(`Callout`)는 `tone`으로 `success`, `warning`, `error`를 받고 그 밖의 값은 오류다. 상태가 없는 안내 상자는 `color.prose-soft` 면이다. 본문 `mark` 배경 `color.prose-mark-background`는 Things의 형광펜 값(라이트 `#fcf9cf`, 다크 `rgba(255,214,3,.32)`)이다.

그림 격자 칸 안의 `.app-figure`는 바깥 여백이 없어 이미지가 칸 폭을 채우며 칸 사이는 격자의 `spacing.gap`만 둔다.

코드 구문 역할은 `SYNTAX_ROLES`와 `SyntaxToken`으로 연결하며 분석기는 소비자가 선택한다.

본문 그림은 기본으로 모서리를 깎지 않는다. `rounded` 옵션으로 붙는 `img.is-rounded`만 코드 블록(`.app-code`)과 같은 곡률 `radius.prose-block-radius`(8px)로 자른다. 글자 크기에 따라 바뀌는 em 값이 아닌 고정값이라 둘의 모서리가 같다. 대표 이미지(`.app-post-cover`)는 이 옵션과 상관없이 기존 곡률을 유지한다. 그림 상자(`.app-figure`)는 브라우저 기본 좌우 여백(40px)을 없애 본문 폭을 그대로 쓴다. 그래서 본문보다 큰 그림은 코드 블록과 같은 폭으로 줄고, 본문보다 작은 그림은 원래 크기로 가운데에 놓인다(늘려서 흐려지지 않게).

코드 블록과 도표는 `ToolHeader`, `Toolbar`, `ToolButton`을 조립한다. 이름표(`.app-tool-label`)가 있는 머리글은 버튼 높이를 차지해 콘텐츠와 겹치지 않는다. 이름표 없는 머리글(코드)은 자리를 차지하지 않고 면 오른쪽 위 8에 겹쳐 놓여, 숨은 도구 막대가 콘텐츠 위에 빈 띠를 만들지 않는다. `ToolHeader({ row: true })`(`.app-tool-header.is-row`, 도표)는 이름표 없이도 내용 위에 단추 줄을 차지해 어떤 폭에서도 그림을 덮지 않고, 자리가 늘 있으므로 단추도 늘 보인다.

아이콘은 공통 조작 자산, 32px 버튼(`spacing.8`, 반경 `radius.lg`)·호버·초점은 `styles/toolbar.css` 하나가 정한다. 평소 아이콘은 진한 회색(`color.figure.outline`)이고 어두운 코드 면 위에서는 `color.syntax-comment`다. 도구 막대와 확대 버튼 묶음은 별도 배경·테두리·그림자를 두지 않는다. 호버와 키보드 초점의 아이콘은 `color.accent`, 배경은 `color.control-hover`를 사용하고 누르는 동안만 `color.control-active` 배경을 적용한다. 초점 테두리를 유지하며 성공·실패의 상태색은 조작 중에도 덮지 않는다. 마우스에서는 블록 호버·키보드 초점·결과 알림 동안 보이고 터치에서는 항상 보인다.

복사와 다운로드의 대기·성공·실패·재시도·알림 초기화는 `bindToolbar`가 맡고 소비자는 원본과 다운로드 작업만 제공한다.

알림 시간은 `duration.notice`이다. 결과 문구는 `.app-sr`로 시각적으로 숨겨 도구 막대와 버튼의 크기·위치를 유지한다.

문구가 화면에 보이지 않아도 알림 동안 도구 막대를 계속 노출한다. `.app-sr`의 한 정의도 도구 막대 CSS에 포함되어 독립 도표와 전체 문서가 함께 사용한다.

삽입 도표의 높이·테마·대체 전체화면은 `bindDiagramHost`가 맡는다. 등록된 iframe의 출처와 메시지 송신자를 확인하고 전체화면 중에는 자연 높이 알림을 적용하지 않는다. Escape는 해당 재생기에 종료 요청을 보내고 종료 뒤 자연 높이로 돌아온다. 홈페이지와 갤러리는 같은 삽입 계약을 사용한다.

도표 재생기의 `.dp-panels`는 그림 면의 폭을 차지하고, 각 판 SVG는 보기 폭에 대한 판 폭 비율(`--panel-w` / `--view-w`)로 그리되 자연 크기보다 커지지 않는다. 자연 크기는 SVG 좌표 한 단위를 `spacing.figure.svg-unit`(1px)으로 본 길이(`--panel-w` × `svg-unit`)다. 좁은 도표는 넓은 틀에서 자기 크기 그대로 가운데 놓이므로, 같은 글 역할은 그림 크기와 관계없이 같은 화면 크기다.

가용 폭보다 넓은 도표는 글자와 함께 줄지만, 그림의 가장 작은 글 역할(`text.caption`, 13px)이 가장 작은 글 토큰(`text.figure.9`, `text.figure` 묶음의 최솟값)이 되는 배율(9/13) 밑으로는 줄지 않는다. 하한은 `calc()` 안에서 두 토큰의 비로 계산하며 숫자를 CSS에 적지 않는다. DiagramPlay 그림 검사 10번(문서 폭에서 읽힘)이 캔버스 폭으로 줄인 가장 작은 글을 같은 최솟값과 비교하므로, 표시 하한과 작성 경고가 한 기준을 쓴다. 두 크기의 나눗셈은 CSS 형식 산술(Chrome 140, Safari 26, Firefox 158 이상)이 필요하고, 지원하지 않는 브라우저는 `min-width` 선언을 버려 이전처럼 비율 폭으로 줄어든다.

하한 폭이 틀보다 넓으면 `.fl-canvas` 안에서만 가로로 옮겨 보고(`overflow-x: auto`) 페이지 폭은 늘리지 않는다. 이 영역은 공통 `DiagramFrame`이 `tabindex="0"`과 `role="tabpanel"`을 주어 키보드 초점과 방향키로 이동하며, 스크롤바 두께는 `spacing.figure-scrollbar`다. 여러 판은 같은 배율이라 판끼리의 폭 비율이 유지되고, 판 묶음도 가장 넓은 판(`--view-w`)의 하한 폭을 지켜 좁은 판이 넓은 판 위 가운데에 남는다. 옮겨 볼 부분이 남은 쪽 가장자리는 `spacing.6` 폭만큼 마스크로 흐려져 그림이 틀 밖으로 이어진다는 것을 보인다. 흐림 폭은 스크롤 위치를 따르는 시간표(`animation-timeline: scroll(self inline)`)가 정하므로, 처음에는 오른쪽만, 끝까지 옮기면 왼쪽만 흐리고, 넘치지 않는 틀은 시간표가 비활성이라 흐림이 없다. 스크롤 시간표를 지원하지 않는 브라우저는 `@supports`로 흐림을 쓰지 않고 스크롤바만 보인다. 마스크는 알파만 읽으므로 색 값을 쓰지 않는다. 문서의 세로 흐름과 장면·움직임은 유지한다. 전체화면에서는 흐림을 끄고 자연 크기 상한과 하한을 쓰지 않고 기존 fit·확대 비율과 끌기를 적용한다.

목차가 있는 세 열 배치의 본문 열은 본문 폭(`container.body-width`)이고 넓은 그림(`app-width-wide`)도 본문 열 폭까지만 쓴다. 문서 계층과 목차의 폭·접힘·현재 항목은 공통 문서 구성 요소가 맡고(목차도 문서 계층과 같은 `data-document-panel` 접기 패널이라 세 열 배치에서는 펼친 채 고정하고 본문 위에 쌓이는 좁은 화면에서는 접는다), 계층·이전·다음·heading ID는 소비자가 전달한다. 댓글 iframe의 디자인은 공통 `assets/giscus.css`에 있다. 댓글은 바로 게시하므로 작성·미리보기 탭은 숨기고, 정렬 단추는 사이트 선택 줄과 같은 역할 토큰(Things 기본 단추 면, 선택은 accent-1 선택 면)이고, 로그인은 GitHub 아이콘과 '로그인'만 보이는 주요 단추(Things 강한 단추 `color.button-primary`, 흰 굵은 글자, 접근 이름은 공급자 원문)이고, 댓글 등록도 주요 단추(비어 있으면 투명도 .4), 답글 취소는 기본 단추, 로그아웃은 조용한 단추이며, 반응 호버는 무채색이다. 댓글 입력 칸은 초점 강조선이 없고 단추·링크만 초점 선을 쓴다. 공급자 URL·허용 도메인·연결 실패 처리는 홈페이지가 맡는다.

댓글 스타일은 light 토큰으로 생성한다. iframe 문서 루트에 `color-scheme: light`, `color.ui-card` 배경과 `color.body` 글자색을 함께 적용해 OS가 어둡게 설정되어도 light 토큰의 글자와 캔버스의 대비를 유지한다. 공급자의 `light dark` 메타 설정이 바탕만 어둡게 바꾸지 않도록 한다.

공통 도구 막대의 바탕은 사용하는 면이 소유한다. 코드 블록은 `color.code-surface`, 도표 틀은 면을 칠하지 않는다. 일반 카드·탭·탐색의 전환은 `ease.reveal`을 사용하며 아이콘 전용 역할을 빌리지 않는다.

## 도표 정보 역할

도표 틀(`.fl-surface`)은 표·접기와 같은 블록 틀(1px `color.prose-block-line`, 반경 8)이고 회색 면을 칠하지 않는다(`color.figure.canvas`는 페이지 면). 도구 단추 줄은 틀 밖 바로 위(틀과 8 간격)의 자기 줄이고 그림은 틀 안, 장면 탭은 틀 아래 12에 놓인다. 단추가 틀 안에 들어가 그림 자리를 줄이거나 그림을 덮지 않는다. 스키마와 격자의 경계는 상시 표시하며, 표 머리는 옅은 면으로 구분한다.

도표 글자는 본문 단계에 묶인다. 그림·그룹 제목과 차트 제목(`.frame`)은 작은 글 15/600, 그 밖의 모든 글(상자 이름, 부제, 선 라벨, 카드 줄, 번호, 태그, 표식, 키, 배지, 눈금, 상태 글자)은 설명 13이다. 11px와 22px 단계는 없고 도넛 가운데 합계는 title-3(24)이다. DiagramPlay의 측정(`measure/texts.js` STYLE, `measure/pills.js`, `chart/metrics.js`)이 같은 토큰으로 재므로 잰 값이 그린 값이다. 13px 글이 들어가도록 알약 높이(`spacing.figure.pill.height`)는 20, 태그 높이는 18이다.

구조는 회색이다: 상자 윤곽, 그룹 경계, 관계선, 화살촉은 진한 회색이고 관계선 굵기는 `border-width.edge`(1.5)다. 경로 역할만 주황(켜진 경로·이동 점은 accent-2 주황)과 파랑(두 번째 경로)이고, 같은 그림에 상태를 쓰면 두 번째 경로는 회색을 쓴다. 상태는 색 상자가 아니라 회색 알약 위의 상태색 아이콘(`status.css`)으로 알린다. 이름–값 카드 내부는 평소 여백과 정렬로 구분하고 값 갱신 때만 강조 면을 표시한다.

기본 강조는 accent-2 주황이며 다른 색은 작성자가 의미를 구분할 때 사용한다. 차트 면과 이동 라벨은 `color.data.category`/`category-on`(구분색의 `fill`/`on`)에서 같은 색 쌍을 읽는다. 구분색 면 위 글자는 검정이고, 주황 면(사용자 결정)과 다크 연한 회색 면만 흰 글자다. 별도 흐름 팔레트는 두지 않는다. 선 차트와 범례 선분은 3번 계열이 점선(`chart-dashed`), 4번 계열이 점점선(`chart-dotted`)이다. 실제 계열의 점은 원이며 범례와 이름으로 구분한다. 목표는 `color.data.reference`의 중립색, 선형 차트에서는 점 표식 없는 점선이다. 스키마 내부 선·목표·신뢰구간은 축과 같은 `color.data.grid`의 옅은 회색이다. 히스토그램은 구간 폭과 기준선을 유지하고 위쪽 모서리에만 공통 작은 곡률을 적용한다.

차트 그림 폭(`spacing.figure.chart.width`)은 본문 단 폭(`primitive.body-width`, 680)을 참조한다. 본문 단에서 차트가 줄지 않고 시간축 끝 글자가 그림 밖으로 나가지 않는다.

열지도 칸 색은 옅은 끝(`color.data.heat-low`, accent-2의 옅은 면)에서 진한 끝(`heat-high`, accent-2)까지 OKLCH로 보간한다. 한 색상 안의 밝기 차이로 값을 읽는다. 이 두 값은 열지도 칸에만 쓰고 카드·판·선·계열 색은 바꾸지 않는다.

도표의 바탕과 빈 화살촉·소멸 표식은 `color.figure.canvas`(페이지 면)를 사용한다. SVG 정지·움직임 층의 미디어 규칙도 `diagram/figure.css`가 소유한다.

도표의 순간 강조는 `color.figure.flash`, 켜진 카드 면은 `color.figure.active-surface`를 읽는다. 검색·도움말의 hover 역할과 독립적으로 조정하며 라이트·다크 값은 토큰 정본에서 정의한다.

차트 갱신 겹침은 `fl-mark-pulse`와 `is-line`·`is-text`·`has-ring` 역할을 사용한다. 소비자는 원래 기하와 `--pulse-effect` 계열색, 필요할 때 `--pulse-width` 표식 두께만 전달한다. 면 투명도와 글자 후광 두께는 정본 CSS가 정한다.

가로 성장의 기준점은 `.grow`가 왼쪽, `.grow.from-end`가 오른쪽이다. 소비자는 계산된 진행 방향만 변형으로 넘긴다. 히스토그램의 실제 축 기준점처럼 배치가 계산한 좌표는 소비자가 전달한다.

큐의 빈 칸·찬 칸과 카드 내용 면도 `figure.css`가 칠을 소유한다. 소비자는 같은 칸 윤곽을 재사용하고 값에 따른 칸 수와 표시 시각만 정한다.

## 확인

`npm run build:design`, `npm run check:product`, `npm run check:tokens`로 계약과 생성물을 검사한다. 구조·스타일을 바꾼 경우 소비자의 실제 검색·태그·복사·문서 탐색을 넓은 화면과 모바일에서 확인한다. 제공된 Things 기준에서 의도적으로 확장한 기능을 제거해 외형만 맞추지 않는다.

표의 렌더링 회귀 검사는 설치된 Chrome과 별도 `playwright-core` 모듈을 사용한다. `node test/table-browser.mjs <playwright-core의 index.mjs 경로>`로 모바일·데스크톱, 라이트·다크에서 설명 열·긴 코드·긴 문장·다열 표와 키보드 가로 이동을 확인한다. 선택적인 마지막 인수에 기록 파일의 경로 접두사를 주면 측정 JSON과 화면을 저장한다.

`node test/giscus-browser.mjs <playwright-core의 index.mjs 경로>`는 공급자와 같은 `light dark` 메타 설정의 독립 iframe에서 OS light/dark와 두 화면 폭의 댓글·답글·입력란 대비 및 키보드 초점을 확인한다. 선택적인 마지막 인수에 기록 경로 접두사를 주면 JSON과 화면을 저장한다. 공급자의 실제 댓글 연결·펼침은 소비자 화면에서 따로 확인한다.

`node test/diagram-frame-browser.mjs <playwright-core의 index.mjs 경로>`는 합성 그림(좁은 판 하나, 표준 판 하나, 폭이 다른 두 판)을 공통 `DiagramFrame`과 배포 CSS로 1280·390·320px에서 열어, 판이 자연 크기보다 커지지 않고 하한 배율 밑으로 줄지 않으며 판끼리 같은 배율·같은 가운데이고 페이지 가로 넘침이 없는지 잰다. 390px의 넓은 그림은 그림 영역에 초점을 두고 방향키로 오른쪽 끝까지 옮겨지는지, 옮길 부분이 남은 쪽 가장자리만 흐린지(처음 오른쪽, 끝에서 왼쪽, 넘치지 않는 그림은 없음), 전체화면은 하한 없이 영역에 맞는지 본다.

## 글 읽기 간격

목록 카드(`BlogCard`)는 한 줄 3장에 맞춘 크기다: 표지 2:1, 안쪽 16, 제목 18/700 한 줄(넘치면 말줄임), 요약 15 두 줄, 글쓴이 줄 13 한 줄. 블로그 본문(`.app-prose`)의 줄 높이는 Things와 같은 1.4(`leading.feature-body-line`, 18px에서 25.2)다. 글 머리의 날짜·제목은 왼쪽 정렬이고 도입 문단은 22.5/1.25다. 검색 위·아래 여백(`spacing.search-top`, `spacing.search-bottom`)과 글 위쪽 여백(`component.post-padding`)은 48px다.
