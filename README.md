<h1 align="center">homepage</h1>

<p align="center">
  Markdown 기반 개인 블로그와 사이트<br>
  <a href="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml"><img src="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml/badge.svg?branch=main" alt="빌드와 제품 검사 상태"></a><br>
  한국어 | <a href="README.en.md">English</a>
</p>

[woonyong.com](https://woonyong.com)의 소스입니다. 개인 소개와 Blog 글을 Markdown으로 작성하고 정적 HTML로 발행합니다. 공개를 승인한 원고만 가져오며, 디자인·도표는 공통 패키지를 쓰고 Markdown 해석은 내부 문서 렌더러(`src/document`)가 맡습니다.

> [!NOTE]
> 개발 중입니다. 배포판은 없고 소스에서 빌드해 실행합니다.

## 빠른 시작

Node.js 22.13 이상인 22.x 버전과 npm, Git이 필요합니다. 저장소를 받은 뒤 다음 명령을 실행하세요.

```sh
npm ci
npm run dev
```

[로컬 미리보기](http://localhost:8796/)에서 홈을 엽니다. `/search/`에서 전체 글을 검색·태그로 찾고 `/blog/`에서 최근 글 본문을 읽습니다. 파일을 바꾸면 명령을 다시 실행하세요. 빌드 결과는 `dist/site/`에 있습니다. 기본 빌드는 승인 사본을 읽고 검색엔진 수집을 막는 미리보기입니다. 공개할 실제 글이 없으면 목록은 빈 상태로 표시합니다.

저장소에 포함된 승인 사본과 공개 Git 의존성으로 실행할 수 있습니다. 새 원고를 가져올 때는 비공개 Vault의 발행 목록이 필요합니다. GitHub CLI를 설치·인증하지 않았거나 조회에 실패하면 댓글 수 대신 댓글 링크를 표시합니다.

## 해결하는 문제

비공개 노트에서 공개할 글을 고르고, 승인된 파일만 사이트에 반영합니다. 발행 목록의 파일과 해시가 다르면 빌드를 중단합니다. 글의 고정 ID와 URL을 파일 위치에서 분리해 원고를 옮겨도 공개 주소를 유지합니다. 기술·산책·독서·회고를 같은 Blog에 쓰고 임의의 태그로 묶습니다.

Search 카드는 대표 이미지가 없으면 제목 표지를 자동으로 표시합니다. 카드의 태그는 숨기고 검색 필터와 본문에 남깁니다. 본문 태그는 읽기 쉬운 크기로 표시합니다. 자동 표지는 별도 이미지 파일을 생성하지 않으며 Blog 본문에는 반복하지 않습니다.

공개 글만 쓰는 블로그라면 별도의 승인 목록이 없는 정적 사이트 도구로도 충분합니다.

## 작동 방식

1. 승인된 Blog Markdown·작성 설정·자산을 읽고 발행 목록과 대조합니다.
2. 내부 문서 렌더러(`src/document`)가 본문을 해석하고 DiagramPlay가 도표를 컴파일합니다.
3. 홈페이지가 페이지를 조립하고 내부 링크·앵커·자산을 검사합니다.
4. 검사를 통과하면 `dist/site/`의 발행 결과를 교체합니다.

![승인된 입력을 해석하고 링크와 자산 검사를 통과한 결과만 정적 사이트로 발행합니다](docs/assets/publication-flow.svg)

동기화·복구·미리보기·배포 조건은 [개인 사이트 발행](docs/design/publication.md)에 있습니다. 공개 글은 `content/blog/`에서만 읽습니다. 승인된 `content/docs/` 입력이 있으면 공개 빌드를 중단합니다. 개인 Vault의 위키 미리보기·동기화 계약은 별도로 유지합니다. 원고와 설정의 승인 사본은 직접 고치지 않습니다. 원문과 승인을 갱신한 뒤 다음 명령으로 가져옵니다.

```sh
npm run content:sync-vault -- <vault-root>
npm run content:check
```

`<vault-root>`는 승인된 `tooling/dist/publication.json`이 있는 Vault 루트입니다. 외부 프로젝트 문서는 원본 저장소에서 관리합니다.

## 상태

| 구분 | 범위 |
|---|---|
| 구현 | 개인 소개, Search 목록·검색·태그, Blog 최근 본문 피드, RSS, 댓글, Markdown·도표 발행, 관리자에게만 보이는 글 작성·출간·수정(`/admin/`) |
| 제한 | 발행 화면은 라이트 테마 고정, 코드 실행 환경 없음, 구독 전송 주소 미설정 |
| 다음 | [전체 검수](https://github.com/woonyong-choi/homepage/issues/215), [통합 검증](https://github.com/woonyong-choi/homepage/issues/28), [사이트 표식](https://github.com/woonyong-choi/homepage/issues/303) |

자동 검사와 실제 화면·운영 배포의 확인 범위는 각 이슈에 남깁니다. 개인 사이트용 구현이며 콘텐츠 형식과 명령의 하위 호환을 보장하지 않습니다.

## 문서

- [개인 랜딩 페이지](docs/design/personal-landing.md)
  - [기록 탐색과 화면 구성](docs/design/knowledge-navigation.md)
  - [홈 원고 가이드](docs/design/home-content.md)
  - [영역 설정](docs/design/layout-settings.md)
- [Markdown 글 작성](docs/design/markdown.md)
  - [글 관리](docs/design/admin.md)
- [개인 사이트 발행](docs/design/publication.md)
  - [스타일 수정 지도](docs/design/styles.md)

[전체 문서](docs/README.md)

## 개발

```sh
npm run build:site
npm run check:product
npm run check:tokens
```

CI는 Node.js 22에서 설치·토큰 검사·제품 검사·빌드를 실행합니다. 디자인·DiagramPlay는 고정 커밋으로 설치합니다. 문서 렌더러는 이 저장소의 `src/document`에 있습니다. 공통 구성 요소를 고치려면 원본 저장소를 수정한 뒤 [스타일 수정 지도](docs/design/styles.md#갱신)에 따라 의존성을 갱신합니다.

발행 흐름 그림은 설치한 DiagramPlay로 다시 만듭니다.

```sh
node node_modules/diagramplay/src/cli.js render docs/assets/publication-flow.diagramplay --strict --static
```

운영용 빌드는 `SITE_ORIGIN=https://woonyong.com npm run build:site -- --production`으로 만듭니다. GitHub Actions의 `Deploy woonyong.com`을 `main`에서 수동 실행하면 검사 후 GitHub Pages에 배포합니다.
