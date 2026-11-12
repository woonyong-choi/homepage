<h1 align="center">homepage</h1>

<p align="center">
  Markdown으로 쓰는 정적 블로그와 개인 홈<br>
  <a href="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml"><img src="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml/badge.svg?branch=main" alt="Validate 상태"></a><br>
  한국어 | <a href="README.en.md">English</a>
</p>

개인 소개 홈과 Blog를 Markdown과 JSON 설정에서 정적 HTML로 만들어 GitHub Pages에 배포한다. [woonyong.com](https://woonyong.com)의 소스다. 서버 없이 검색, 태그 필터, RSS, 댓글(giscus), 관리자용 글 작성 화면을 제공한다. Markdown 해석은 내부 문서 렌더러(`src/document`), 화면 값과 공통 마크업은 내부 디자인 시스템(`src/design`)이 맡는다. 자세한 안내는 [문서 목록](docs/README.md)에 있다.

![승인된 입력을 해석하고 링크와 자산 검사를 통과한 결과만 정적 사이트로 발행한다](docs/assets/publication-flow.svg)

## 요구 사항

- Node.js 22와 npm
- Git
- 선택: 인증된 GitHub CLI(`gh`). 있으면 빌드가 글 목록의 댓글 수를 읽고, 없으면 댓글 링크만 표시한다.

## 빠른 시작

```sh
npm ci
npm run dev
```

`npm ci`가 디자인 생성 결과(`src/design/dist/`)를 만들고, `npm run dev`가 사이트를 `dist/site/`에 빌드한 뒤 http://127.0.0.1:8796 에서 띄운다. 파일을 고친 뒤에는 `npm run dev`를 다시 실행한다. 주소와 포트는 `node src/build/serve.js --host <host> --port <port>`로 바꾼다. 주요 주소는 홈 `/`, 전체 글·검색 `/search/`, 본문 피드 `/blog/`, 글 `/blog/<slug>/`, RSS `/blog/feed.xml`, 관리자 `/admin/`이다.

## 글 쓰기

글은 `content/blog/` 아래의 `.md` 파일 하나다. 폴더와 파일 이름은 주소에 영향을 주지 않는다. 맨 위에 YAML front matter를 둔다.

```markdown
---
id: first-post
slug: first-post
title: "첫 글"
description: "목록과 검색 결과에 보이는 요약"
tags: [기록, javascript]
publishedAt: "2026-01-15"
visibility: public
comments: true
---

본문을 Markdown으로 쓴다.
```

| 필드 | 필수 | 내용 |
|---|---|---|
| `id` | 예 | 고정 ID. 소문자·숫자를 하이픈으로 연결한다. 댓글 연결에 쓴다 |
| `slug` | 예 | 주소 `/blog/<slug>/`. `id`와 같은 형식이며 `all`, `page`, `feed`는 쓸 수 없다 |
| `title`, `description` | 예 | 제목과 요약 |
| `publishedAt` | 예 | 발행일 `YYYY-MM-DD`. 한국 날짜 기준 오늘 이후면 싣지 않는다 |
| `visibility` | 예 | `public`, `draft`, `private`. `public`만 싣는다 |
| `updatedAt` | 아니오 | 수정일 `YYYY-MM-DD`. 발행일보다 앞설 수 없다 |
| `tags`, `keywords` | 아니오 | 문자열 배열. 태그는 자유 문자열이며 `config/tags.json`은 표시 이름과 별칭만 정한다 |
| `thumbnail` | 아니오 | `{ src, alt, position? }`. `src`는 `/assets/`·`/media/` 아래 그림이나 HTTPS 주소 |
| `comments` | 아니오 | 댓글 표시. 기본 `false` |
| `example` | 아니오 | `true`면 싣지 않는다 |

`publish: false` 또는 `status: draft`도 글을 제외한다. 같은 `id`나 `slug`, 잘못된 날짜는 빌드 오류다. 그림과 영상은 `content/assets/`, `content/media/`에 둔다. 지원 문법은 [Markdown 글 작성](docs/design/markdown.md)에 있다.

이 저장소의 `content/blog/`는 비공개 Vault에서 승인해 가져온 사본이다. 직접 고치지 않고 `npm run content:sync -- <vault-root>`로 가져온다. 자세한 흐름은 [발행](docs/design/publication.md)에 있다.

## 설정

| 파일 | 내용 |
|---|---|
| `config/site.json` | 사이트 이름, 작성자, 로고, 설명, GitHub·LinkedIn, 프로젝트, 저장소, 댓글(giscus) 설정 |
| `config/blog.json` | Blog 제목, 목록 열·행, 카드 표시 항목, 피드 한 쪽의 글 수 |
| `config/search.json` | Search 제목과 검색창 문구 |
| `config/tags.json` | 태그의 표시 이름과 검색 별칭 |
| `config/admin.json` | 관리 화면의 글 저장소, 배포 워크플로, 로그인 서버 주소 |
| `config/approved-content.json` | 승인 사본의 파일 목록과 SHA-256. 동기화가 갱신한다 |
| `config/assets.json` | 콘텐츠 자산의 출처와 라이선스 기록 |
| `config/image-sizes.json` | 외부 그림의 가로·세로 크기 |
| `config/publication-manifest.json` | Vault 동기화가 기록하는 문서 출처 목록 |
| `config/cs.json`, `config/tech.json` | Vault 동기화 호환 입력. 사이트 코드는 읽지 않는다 |

홈 화면은 `content/home.md`, `content/pages/tech.md`, `content/interviews/index.md`에서 조립한다. 형식은 [홈 원고](docs/design/home-content.md)에 있다.

## 폴더 구조

```text
config/          작성 설정과 승인 목록
content/         홈 원고, Blog 글, 그림·영상
src/build/       사이트 빌드 진입점(index.js)과 미리보기 서버(serve.js)
src/content/     글·홈·설정 읽기와 검증
src/layouts/     페이지 조립
src/client/      브라우저 스크립트(검색, 댓글, 피드)
src/admin/       관리자 글 작성 화면
src/vault/       Vault 승인 사본 동기화
src/document/    Markdown 문서 렌더러
src/design/      토큰, CSS, 공통 구성 요소, 아이콘
test/            node:test 시험
workers/         관리자 OAuth 로그인 중계(Cloudflare Worker)
docs/            설계와 사용 안내
```

## 명령

| 명령 | 내용 |
|---|---|
| `npm run dev` | 빌드 후 http://127.0.0.1:8796 에서 미리보기 |
| `npm run build` | 디자인을 생성하고 사이트를 `dist/site/`에 빌드 |
| `npm test` | 디자인을 생성하고 `test/*.test.js` 실행 |
| `npm run content:sync -- <vault-root>` | Vault 발행 목록의 승인 파일을 가져온다 |
| `npm run content:check` | 승인 사본과 해시가 일치하는지 검사 |

`npm run build -- --production`은 운영 빌드다. `SITE_ORIGIN`에 HTTPS 주소를 주면 정식 주소, 사이트맵, 공유 메타데이터를 만든다. `--production` 없이 만든 미리보기는 검색엔진 수집을 막는다.

## 배포

`.github/workflows/validate.yml`은 push와 PR마다 `npm ci`, `npm test`를 실행한다. `.github/workflows/deploy.yml`은 `main`에서 수동으로 실행하며, `npm test` 뒤 `SITE_ORIGIN`을 지정해 `npm run build -- --production`으로 빌드하고 `dist/site`를 GitHub Pages에 올린다. 저장소 비밀 값 `VAULT_TOKEN`이 있으면 Vault의 `publish`·`assets`를 받아 `--blog-root .vault/publish`로 빌드한다.

## 라이선스

저장소 전체에 적용하는 LICENSE 파일은 없다. 콘텐츠 자산의 출처와 라이선스는 `config/assets.json`, 아이콘·글꼴의 출처는 `src/design/assets/sources.json`과 각 고지 파일에 있다.
