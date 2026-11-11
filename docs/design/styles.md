# 스타일 수정 지도

| 항목 | 값 |
|---|---|
| 상태 | 구현 |

## 요약

디자인 정본은 이 저장소의 `src/design/`이 소유하고 화면 코드는 콘텐츠와 경로를 조립한다. 수정 위치와 생성·검수 절차를 정한다.

## 해결하는 문제

같은 구성 요소를 제품마다 다시 만들면 색·간격·상태 동작이 달라진다. 홈페이지(내부 문서 렌더러 포함)는 `src/design/`에서 생성한 디자인 한 벌을 사용한다. 다른 저장소의 디자인 패키지에 의존하지 않는다.

## 사용 예

### 사용 장면

공통 카드의 간격을 바꾸려면 `src/design/tokens/tokens.json`의 토큰이나 `src/design/ui/`의 구성 요소를 수정한다. 같은 PR에서 검사와 실제 화면을 확인한다.

## 작동 방식

### 입력과 구성

디자인 정본은 `src/design/`이 소유하고 화면 코드는 콘텐츠와 경로를 조립한다. 정본의 세부 계약은 [디자인 시스템 문서](system/styles.md), [구성 요소](system/components.md), [구조](system/architecture.md), [아이콘](system/content-icons.md)에 있다.

| 변경 | 정본 |
|---|---|
| 색·간격·글자 크기·시간 | `src/design/tokens/tokens.json` |
| 공통 CSS | `src/design/styles/` |
| 카드·검색·본문·홈 구성 요소 | `src/design/ui/` |
| 복사·선택 줄(갤러리·장면)·영상·흐름 동작 | `src/design/ui/runtime/` |
| 아이콘·글꼴·조작 도형 | `src/design/assets/`, `src/design/ui/icons.mjs` |
| 생성(토큰 CSS·JS, CSS 평탄화, 아이콘 목록, 매니페스트) | `src/design/scripts/` |
| CSS 축소와 토큰 검사 | `src/design/ui/build/` |
| 콘텐츠·문구·노출 순서 | Vault 원문. 홈페이지는 `content/home.md`, `content/pages/tech.md`, `content/interviews/index.md`의 승인 사본을 사용 |
| Markdown·검색·댓글·문서 식별자 | 홈페이지의 `src/`(문서 렌더러는 `src/document/`) |

`npm run build:design`(`src/design/scripts/build.mjs`)이 정본에서 `src/design/dist/`를 만든다. 생성 결과는 Git에 넣지 않으며 `npm ci`(`prepare`)와 `build:site`·`check:product`·`check:tokens`가 먼저 다시 만든다. 화면 코드는 `package.json`의 `imports`로 `#design/*`(= `src/design/dist/*`)를 읽고, `src/design-package.mjs`가 생성 결과 위치와 내용 해시를 알려 준다. 생성 결과를 직접 고치지 않고 정본에서 고친다. 공통 UI는 이름 있는 구성 요소와 검증된 HTML 슬롯으로 조립한다. 값은 Tailwind의 color·text·spacing·radius·font·duration 이름 계열로 정의한다.

발행할 때 실제 HTML과 JavaScript에서 쓰는 CSS 선택자를 모으고, 거기서 참조하는 CSS 변수의 의존 관계를 따라 필요한 값만 남긴다. 모든 모드와 동적 상태를 보존하며 최종 파일을 압축한다. 생성 결과 파일은 이 최적화로 변경하지 않는다. 브라우저 동작은 필요한 페이지에서만 읽고 검색 색인은 별도로 내려받는다.

### 발행 테마

홈페이지 발행 문서는 `data-theme="light"`와 `color-scheme: light`를 지정한다. 시스템 테마를 자동으로 따르거나 테마 선택 UI를 제공하지 않는다. 정본에 남은 다크 토큰은 생성 단계에서 쓰지만 발행 CSS에서는 밝은 테마 밖의 블록을 뺀다.

### 디자인 수정

```sh
# src/design/의 tokens·styles·ui·assets를 고친 뒤
npm run build:design
npm run check:tokens
npm run check:product
npm run build:site
```

디자인 변경은 화면 변경과 같은 홈페이지 PR에 담는다. 시험은 `src/design/test/`(토큰 참조·대비·구성 요소·검사기·아이콘 출처)와 `src/*.test.mjs`(사이트 조립)가 나눠 맡는다. 내부 문서 렌더러는 같은 생성 결과를 읽고, 다른 위치를 읽으면 빌드가 실패한다. 운영 빌드의 댓글 테마는 사이트의 `/theme/assets/giscus.css`를 쓰고, 공개 HTTPS 주소가 없는 미리보기는 `comments.themeUrl`이 없으면 giscus 기본 `light` 테마를 쓴다. `src/design/assets/giscus.css`를 고치면 `src/design/assets/sources.json`의 sha256과 bytes도 갱신한다.

공개 글의 제목·본문·카드는 공통 구성 요소의 배치를 사용하며 장식 글 아이콘은 넣지 않는다. 홈 제목의 SVG는 `ContentIconImage`로, PNG는 원본 그림으로 공통 `SectionIntro` 자리에 조립한다. 코드 블록 배경은 유지하며 도구 모음은 별도 흰색 면·테두리·그림자를 만들지 않는다. 버튼의 hover·키보드 초점·복사 상태는 공통 동작을 사용한다.

CI의 Node.js 검사 행렬은 `.github/workflows/validate.yml`이 정한다. DOM 검사와 수식 렌더러의 버전·전이 의존성은 `package.json`과 `package-lock.json`에서 관리한다.

### 요구사항

| 요구사항 | 검증 계획 |
|---|---|
| 공통 표현값과 구성 요소의 소유권을 유지한다. | [`audit-design.test.mjs`](../../src/audit-design.test.mjs) |
| 발행 CSS가 사용한 선택자와 동적 상태를 보존한다. | [`publication-styles.test.mjs`](../../src/publication-styles.test.mjs) |
