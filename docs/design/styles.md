# 스타일 수정 지도

| 항목 | 값 |
|---|---|
| 상태 | 구현 |

## 요약

공통 디자인은 design-tokens에서 관리하고 홈페이지는 콘텐츠와 경로를 조립한다. 수정 위치와 의존성 갱신 절차를 정한다.

## 해결하는 문제

같은 구성 요소를 제품마다 다시 만들면 색·간격·상태 동작이 달라진다. 홈페이지와 ThinkFlow·문서 엔진은 홈페이지가 고정한 디자인 패키지 한 벌을 사용한다.

## 사용 예

### 사용 장면

공통 카드의 간격을 바꾸려면 design-tokens의 토큰이나 구성 요소를 수정한다. 홈페이지에서 새 커밋을 설치한 뒤 제품 검사와 실제 화면을 확인한다.

## 작동 방식

### 입력과 구성

범용 디자인은 design-tokens가 소유하고 홈페이지는 콘텐츠와 경로를 조립한다.

| 변경 | 정본 |
|---|---|
| 색·간격·글자 크기·시간 | `tokens/tokens.json` |
| 공통 CSS | `styles/` |
| 카드·검색·본문·홈 구성 요소 | `ui/` |
| 복사·탭·영상·흐름 동작 | `ui/runtime/` |
| 아이콘·조작 도형 | `assets/`, `ui/icons.mjs` |
| CSS 축소와 토큰 검사 | `ui/build/` |
| 콘텐츠·문구·노출 순서 | Vault 원문. 홈페이지는 `content/home.md`, `content/pages/tech.md`, `content/interviews/index.md`의 승인 사본을 사용 |
| Markdown·검색·댓글·문서 식별자 | 홈페이지의 `src/` |

공통 디자인은 고정 commit의 Git 의존성으로 설치한 `@woonyong-choi/design-tokens`다(`src/design-package.mjs`가 설치 위치를 찾는다). 설치본을 직접 수정하지 않고 정본에서 고친다. 공통 UI는 이름 있는 구성 요소와 검증된 HTML 슬롯으로 조립한다. 값은 Tailwind의 color·text·spacing·radius·font·duration 이름 계열로 정의하고 기본 spacing 단위는 4px다.

발행할 때 실제 HTML과 JavaScript에서 쓰는 CSS 선택자를 모으고, 거기서 참조하는 CSS 변수의 의존 관계를 따라 필요한 값만 남긴다. 모든 모드와 동적 상태를 보존하며 최종 파일을 압축한다. 가져온 정본 파일은 이 최적화로 변경하지 않는다. 브라우저 동작은 필요한 페이지에서만 읽고 검색 색인은 별도로 내려받는다.

### 발행 테마

홈페이지 발행 문서는 `data-theme="light"`와 `color-scheme: light`를 지정한다. 시스템 테마를 자동으로 따르거나 테마 선택 UI를 제공하지 않는다. 공통 디자인의 다크 토큰 보유와 홈페이지의 다크 모드 지원은 구분한다. 독립 ThinkFlow 재생기는 자체 테마 계약을 사용하며 삽입된 도표는 호스트가 전달하는 테마를 따른다. 홈페이지의 다크 모드 전환은 전체 페이지와 삽입 도표의 화면 검수가 필요한 별도 변경이다.

### 갱신

```sh
npm install --save-dev github:woonyong-choi/design-tokens#<commit>
npm install --save-dev github:woonyong-choi/thinkflow#<commit>
npm install --save-dev github:woonyong-choi/document-engine#<commit>
npm run check:tokens
npm run check:product
npm run build:site
```

`<commit>`은 선택한 전체 커밋 해시다. 바꾸는 패키지의 설치 명령만 실행한다.

디자인 커밋은 홈페이지의 `package.json`이 정한다. ThinkFlow와 문서 엔진은 디자인을 peer 의존성으로 받으므로 홈페이지가 설치한 한 벌을 함께 읽고, 서로 다른 디자인 패키지를 읽으면 빌드가 실패한다. 의존성 갱신은 홈페이지의 PR로 반영한다. 미리보기 댓글 테마는 고정 commit의 `dist/assets/giscus.css`를 jsDelivr에서 읽고, 운영 빌드는 사이트의 `/theme/assets/giscus.css`를 쓴다.

블로그 제목은 본문 폭을 사용하고 문서 제목 아이콘은 제목의 첫 줄과 정렬한다. 홈 제목의 SVG는 `ContentIconImage`로, PNG는 원본 그림으로 공통 `SectionIntro` 자리에 조립한다. 코드와 도표의 블록 배경은 유지하며 도구 모음은 별도 흰색 면·테두리·그림자를 만들지 않는다. 버튼의 hover·키보드 초점·복사 상태는 두 제품이 같은 공통 동작을 사용한다.

CI의 Node.js 검사 행렬은 `.github/workflows/validate.yml`이 정한다. DOM 검사와 수식 렌더러의 버전·전이 의존성은 `package.json`과 `package-lock.json`에서 관리한다.

### 요구사항

| 요구사항 | 검증 계획 |
|---|---|
| 공통 표현값과 구성 요소의 소유권을 유지한다. | [`audit-design.test.mjs`](../../src/audit-design.test.mjs) |
| 발행 CSS가 사용한 선택자와 동적 상태를 보존한다. | [`publication-styles.test.mjs`](../../src/publication-styles.test.mjs) |
