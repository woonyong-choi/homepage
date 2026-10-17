# homepage

Markdown 기반 개인 블로그와 사이트

개인 소개, 기술 문서, 블로그를 정적 HTML로 발행합니다. 공개 승인된 원고와 설정을 읽고 공통 디자인 구성 요소, ThinkFlow 도표, 문서 엔진을 조립합니다. 운영 사이트 주소는 [woonyong.com](https://woonyong.com)입니다.

> [!NOTE]
> 개발 중입니다. 배포판은 없고 소스에서 빌드해 실행합니다.

## 목차

- [빠른 시작](#빠른-시작)
- [해결하는 문제](#해결하는-문제)
- [작동 방식](#작동-방식)
- [상태](#상태)
- [문서](#문서)
- [개발](#개발)

## 빠른 시작

Node.js 22.13 이상인 22.x 버전과 npm, Git이 필요합니다. CI는 Node.js 20과 22에서 검사합니다.

```sh
npm ci
npm run dev
```

[로컬 미리보기](http://localhost:8796/)에서 홈을 엽니다. `/docs/`는 문서와 블로그의 검색 입구이고 `/blog/all/`은 블로그 카드 목록입니다. `npm run dev`는 사이트를 한 번 빌드한 뒤 서버를 시작합니다. 파일을 바꾸면 명령을 다시 실행하세요. 생성 파일은 `dist/site/`에 있습니다.

저장소의 승인 사본과 공개 Git 의존성만으로 빌드할 수 있습니다. 원고와 작성 설정을 갱신할 때는 비공개 Vault의 승인된 발행 목록이 필요합니다. GitHub 댓글 수를 가져오려면 GitHub CLI 인증이 필요하며, 인증이 없으면 숫자 대신 댓글 링크를 표시합니다.

## 해결하는 문제

소개와 글을 한 사이트에서 보여 주면서 비공개 원고의 공개 범위를 지켜야 합니다. 발행 목록에 있는 파일과 해시를 검사하고, 승인되지 않은 변경이 있으면 빌드를 중단합니다. 문서의 고정 ID와 URL은 파일 위치와 분리합니다.

## 작동 방식

1. Vault에서 승인한 원고·작성 설정·자산을 발행 목록으로 가져옵니다.
2. 공통 문서 엔진이 Markdown을 해석하고 ThinkFlow가 도표를 컴파일합니다.
3. 홈페이지가 탐색·검색·댓글과 페이지를 조립하고 링크·자산을 검사합니다.
4. 검사를 통과한 파일을 `dist/site/`에 씁니다.

`content/home.md`, `content/pages/tech.md`, `content/interviews/index.md`, `content/docs/`, `content/blog/`는 승인 사본입니다. `config/approved-content.json`에 기록된 작성 설정과 자산도 직접 수정하지 않습니다. 원문과 공개 승인을 갱신한 뒤 동기화합니다.

```sh
npm run content:sync-vault -- <vault-root>
npm run content:check
```

`<vault-root>`는 승인된 `tooling/dist/publication.json`이 있는 Vault 루트입니다. 동기화·복구·이관 조건은 [개인 사이트 발행](docs/design/publication.md#vault-발행-입력)에 있습니다. `content/projects/`의 외부 문서는 원본 저장소에서 관리합니다.

## 상태

| 구분 | 범위 |
|---|---|
| 구현 | 홈, 문서 계층, 검색·태그, 블로그 목록·피드, 댓글 연결, Markdown·도표 발행 |
| 제한 | 발행 화면은 라이트 테마 고정, 코드 실행 환경 없음, 구독 전송 주소 미설정 |
| 검증 범위 | 자동 검사는 입력·출력·동작 계약을 확인하며 실제 화면 검수와 운영 배포는 별도 |

개인 사이트용 구현이며 콘텐츠 형식과 명령의 하위 호환을 보장하지 않습니다. 현재 작업은 [GitHub 이슈](https://github.com/woonyong-choi/homepage/issues)에서 확인합니다.

## 문서

[전체 문서](docs/README.md)에서 홈 구성, 글 작성, 발행 조건과 디자인 갱신 방법을 찾을 수 있습니다.

## 개발

```sh
npm run build:site
npm run check:product
npm run check:tokens
```

`src/`는 콘텐츠 해석 연결·검색·댓글·페이지 조립을, `scripts/`는 디자인 검사와 프로젝트 문서 동기화를 담당합니다. 공통 디자인·ThinkFlow·문서 엔진은 `package.json`의 고정 커밋을 설치합니다. 설치본을 직접 고치지 않고 각 원본 저장소를 수정한 뒤 의존성을 갱신합니다. [스타일 수정 지도](docs/design/styles.md#갱신)에 갱신 명령이 있습니다.

운영용 파일은 `SITE_ORIGIN=https://woonyong.com npm run build:site -- --production`으로 만듭니다. GitHub Actions의 `Deploy woonyong.com`을 `main`에서 수동 실행하면 검사를 거쳐 GitHub Pages에 배포합니다. 로컬 빌드만으로 운영 사이트가 바뀌지는 않습니다.
