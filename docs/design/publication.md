# 발행

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 코드 | `src/build/`, `src/vault/` |

## 요약

승인한 글·원고·설정·자산을 정적 사이트 `dist/site/`로 만든다. 빌드는 승인 목록의 해시를 검사하고, 링크·앵커·자산 검사를 통과한 결과로만 이전 발행 폴더를 교체한다.

## 흐름

1. Vault에서 원문을 고치고 승인한 뒤 발행 목록을 만든다.
2. `npm run content:sync -- <vault-root>`로 승인 파일을 이 저장소에 가져온다.
3. `npm run build`(미리보기) 또는 `npm run build -- --production`(운영)으로 빌드한다.
4. `main`에서 Deploy 워크플로를 실행해 GitHub Pages에 올린다.

## 빌드 모드

| 모드 | 명령 | 결과 |
|---|---|---|
| `approved-preview` | `npm run build` | 승인 사본으로 빌드. `robots.txt`가 모든 수집을 막는다 |
| `production` | `npm run build -- --production` | 같은 입력으로 빌드하고 사이트맵을 가리키는 수집 허용 `robots.txt`를 만든다 |

`--blog-root <폴더>`는 글을 `content/blog/` 대신 지정한 폴더에서 읽는다. 배포는 `VAULT_TOKEN`이 있을 때 `.vault/publish`를 넘긴다. 어느 모드든 `example: true` 글, 초안, 미래 날짜 글은 싣지 않는다. 승인 목록에 `content/docs/` 파일이 있으면 빌드를 멈춘다.

`SITE_ORIGIN`은 HTTPS origin(예 `https://example.com`)이어야 한다. 사용자 정보·경로·쿼리·해시·후행 슬래시가 있으면 거부한다. origin이 있으면 정식 주소와 Open Graph·Twitter 메타데이터를 만들고 사이트맵에 절대 주소를 적는다. 로컬 미리보기는 origin 없이 빌드한다.

## 출력

| 파일 | 내용 |
|---|---|
| 페이지 HTML | 홈, Search, Blog 피드, 글 상세, `404.html`, 관리 설정이 있으면 `/admin/` |
| `/theme/site.css` | 토큰과 공통 CSS 가운데 공개 페이지가 쓰는 선택자·변수만 남긴 한 파일 |
| `/theme/admin.css` | 관리 화면까지 포함한 CSS. 관리자 로그인 뒤에만 불러온다 |
| `site.js`, `search-worker.js`, `comments.js`, `blog-list.js` | 공개 페이지 스크립트. 쓰는 요소가 있는 페이지만 싣는다 |
| `admin.js`, `admin-editor.js` | 관리 로더와 작성 화면 |
| `/search-index.json`, `/search-index.json.gz`, `/search-version.json` | 검색 색인과 색인 버전 |
| `/blog/feed.xml`, `/sitemap.xml`, `/robots.txt` | RSS, 사이트맵, 수집 규칙 |
| `/service-tags.json` | 홈 기술 로고 후보와 활성 여부 |
| `/build-report.json` | 쪽 수, 글 수, 모드, 댓글 수 조회 결과, 추천 검색어, CSS·자산 크기, 경로 목록 |

스크립트는 `src/build/scripts.js`가 esbuild로 묶고, 주소에 내용 해시를 붙인다. 수식이 있는 페이지만 KaTeX CSS와 글꼴을 싣는다.

## 검사와 교체

빌드는 모든 페이지·스크립트·자산을 메모리에 준비한 뒤 내부 링크·앵커·중복 id·출력 경로를 검사한다(`src/build/links.js`, `src/build/output.js`). 실패하면 기존 `dist/site/`를 그대로 둔다. 통과하면 새 폴더에 쓰고 교체하며, 교체에 실패하면 이전 결과를 되돌린다. 같은 출력 경로는 `.lock` 폴더로 동시 실행을 막는다.

자산은 HTML의 그림·링크·poster와 CSS의 `url()`을 따라 모은다. 참조한 파일과 필요한 고지만 싣고, 없는 자산이나 경로 이탈은 오류다. 폭 720px보다 큰 정지 그림은 720·1360px webp 사본을 만들어 `srcset`으로 고르게 하고, GIF는 더 작아질 때만 webp로 바꾼다(`src/build/images.js`).

## 메타데이터

글의 공유 그림은 썸네일 또는 본문 첫 그림이며 없으면 사이트 아이콘을 쓴다. 글은 `BlogPosting`, 홈은 `WebSite`와 작성자 `Person` 구조화 데이터를 싣는다. 사이트맵의 `lastmod`는 수정일, 없으면 발행일이다. 없는 주소는 `404.html`로 안내하며 미리보기 서버도 404 상태를 돌려준다.

## 댓글

댓글은 giscus로 `config/site.json`의 저장소·Comments 분류에 고정 글 ID를 연결한다. 글의 `comments: true`일 때만 표시한다. 글 상세는 페이지가 한가할 때 iframe을 만들고, Blog 피드는 `댓글 N개` 단추를 누를 때만 펼친다. 운영 빌드의 댓글 테마는 사이트의 `/theme/assets/giscus.css`이고, HTTPS origin이 없는 미리보기는 `comments.themeUrl`이 없으면 giscus 기본 `light` 테마를 쓴다(`src/layouts/comments.js`의 `commentThemeUrl`).

## Vault 동기화

`npm run content:sync -- <vault-root>`는 `<vault-root>/tooling/dist/publication.json`(`version: 1`, `files`)에 적힌 파일만 가져온다. 항목마다 Vault 상대 `source`, 저장소 상대 `target`, `sha256`을 갖는다. 원고 트리를 탐색하지 않는다.

- 가져오는 대상: `content/home.md`, `content/pages/tech.md`, `content/interviews/`, `content/blog/`, `content/assets/`, `content/media/`, `config/`의 `site`, `tags`, `search`, `cs`, `tech`, `blog` JSON.
- 해시가 다른 입력, 중복 경로·ID·slug, 경로 이탈, 심볼릭 링크, 승인 없이 바뀐 기존 사본이 있으면 아무것도 바꾸지 않고 멈춘다.
- 목록에서 빠진 기존 사본은 같은 동기화에서 지운다.
- 결과로 `config/approved-content.json`(파일과 SHA-256)과 `config/publication-manifest.json`을 갱신한다.
- 동시 실행은 `.content-sync.lock`으로 막는다. 복원까지 실패하면 `.content-sync-*/recovery.json`, 이전 파일, 잠금을 남기고 위치를 오류에 적는다. 이때 기록된 파일을 대조해 복구한 뒤 `npm run content:check`를 실행한다.

`npm run content:check`는 승인 목록과 현재 파일 집합·해시가 일치하는지 검사한다. 빌드도 시작할 때 같은 검사를 한다.

## 배포

`.github/workflows/deploy.yml`은 `main`에서 수동 실행한다. `npm ci`, `npm test` 뒤 `SITE_ORIGIN`을 지정해 운영 빌드를 만들고 `dist/site`를 GitHub Pages에 올린다. `VAULT_TOKEN`이 있으면 Vault의 `publish`와 `assets`만 받아 `content/assets/`에 더하고 `--blog-root .vault/publish`로 빌드한다. 로컬 빌드 성공은 배포 완료가 아니다.
