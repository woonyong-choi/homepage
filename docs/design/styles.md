# 스타일 수정 지도

범용 디자인은 design-tokens가 소유하고 홈페이지는 콘텐츠와 경로를 조립한다.

| 변경 | 정본 |
|---|---|
| 색·간격·글자 크기·시간 | `tokens/tokens.json` |
| 공통 CSS | `styles/` |
| 카드·검색·본문·홈 구성 요소 | `ui/` |
| 복사·탭·영상·흐름 동작 | `ui/runtime/` |
| 아이콘·조작 도형 | `assets/`, `ui/icons.mjs` |
| CSS 축소와 토큰 검사 | `ui/build/` |
| 콘텐츠·문구·노출 순서 | 홈페이지의 `content/home.md`, `content/tech.md`, `content/interviews.md` |
| Markdown·검색·댓글·문서 식별자 | 홈페이지의 `src/` |

공통 디자인은 고정 commit의 Git 의존성으로 설치한 `@woonyong-choi/design-tokens`다(`src/design-package.mjs`가 설치 위치를 찾는다). 설치본을 직접 수정하지 않고 정본에서 고친다. 공통 UI는 이름 있는 구성 요소와 검증된 HTML 슬롯으로 조립한다. 값은 Tailwind의 color·text·spacing·radius·font·duration 이름 계열로 정의하고 기본 spacing 단위는 4px다.

발행할 때 실제 HTML과 JavaScript에서 쓰는 CSS 선택자를 모으고, 거기서 참조하는 CSS 변수의 의존 관계를 따라 필요한 값만 남긴다. 모든 모드와 동적 상태를 보존하며 최종 파일을 압축한다. 가져온 정본 파일은 이 최적화로 변경하지 않는다. 브라우저 동작은 필요한 페이지에서만 읽고 검색 색인은 별도로 내려받는다.

## 발행 테마

현재 홈페이지 발행 문서는 `data-theme="light"`와 `color-scheme: light`를 지정한다. 시스템 테마를 자동으로 따르거나 테마 선택 UI를 제공하지 않는다. 공통 디자인의 다크 토큰 보유와 홈페이지의 다크 모드 지원은 구분한다. 독립 ThinkFlow 재생기는 자체 테마 계약을 사용하며 삽입된 도표는 호스트가 전달하는 테마를 따른다. 홈페이지의 다크 모드 전환은 전체 페이지와 삽입 도표의 화면 검수가 필요한 별도 변경이다.

## 갱신

```sh
npm install --save-dev github:woonyong-choi/design-tokens#<commit>
npm run check:tokens
npm run check:product
npm run build:site
```

디자인 commit은 홈페이지의 `package.json`이 정한다. ThinkFlow와 문서 엔진은 디자인을 peer 의존성으로 받으므로 홈페이지가 설치한 한 벌을 함께 읽고, 서로 다른 디자인 패키지를 읽으면 빌드가 실패한다. 디자인 해시 사본 검사나 다른 저장소가 밀어 넣는 자동 PR은 없다. 미리보기 댓글 테마는 고정 commit의 `dist/assets/giscus.css`를 jsDelivr에서 읽고, 운영 빌드는 사이트의 `/theme/assets/giscus.css`를 쓴다.

블로그 제목은 본문 폭을 사용하고 문서 제목 아이콘은 제목의 첫 줄과 정렬한다. 홈 제목의 SVG는 `ContentIconImage`로, PNG는 원본 그림으로 공통 `SectionIntro` 자리에 조립한다. 코드와 도표의 블록 배경은 유지하며 도구 모음은 별도 흰색 면·테두리·그림자를 만들지 않는다. 버튼의 hover·키보드 초점·복사 상태는 두 제품이 같은 공통 동작을 사용한다.

제품 검사는 Node.js 20·22의 최신 패치 버전에서 실행한다. DOM 검사용 jsdom은 두 버전을 지원하는 29.1.1을 사용한다. 수식 렌더러 KaTeX 0.19는 유지하고 CLI에서만 사용하는 Commander를 Node.js 20 호환 14.0.3으로 고정한다. Markdown 수식과 KaTeX CLI를 함께 확인한다.
