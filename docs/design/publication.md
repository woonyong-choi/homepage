# 발행

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 코드 | `src/build/` |

## 요약

`content/`의 글·원고·자산과 `config/`의 설정을 정적 사이트 `dist/site/`로 만든다. 빌드는 링크·앵커·자산 검사를 통과한 결과로만 이전 발행 폴더를 교체한다.

## 흐름

1. `content/`와 `config/`를 이 저장소에서 직접 고친다. 관리 화면에서 출간한 글은 사이트 저장소에 바로 커밋된다([글 관리](admin.md)).
2. `npm run build`(미리보기) 또는 `npm run build -- --production`(운영)으로 빌드한다.
3. `main`에서 Deploy 워크플로를 실행해 GitHub Pages에 올린다.

## 빌드 모드

| 모드 | 명령 | 결과 |
|---|---|---|
| `preview` | `npm run build` | 미리보기 빌드. `robots.txt`가 모든 수집을 막는다 |
| `production` | `npm run build -- --production` | 같은 입력으로 빌드하고 사이트맵을 가리키는 수집 허용 `robots.txt`를 만든다 |

글은 `content/blog/`에서 읽는다. 어느 모드든 `example: true` 글, 초안, 미래 날짜 글은 싣지 않는다.

운영 빌드의 origin은 환경 변수 `SITE_ORIGIN`, 없으면 `config/site.json`의 `url`이다. HTTPS origin(예 `https://example.com`)이어야 하며 사용자 정보·경로·쿼리·해시·후행 슬래시가 있으면 거부한다. origin이 있으면 정식 주소와 Open Graph·Twitter 메타데이터를 만들고 사이트맵에 절대 주소를 적는다. 미리보기는 `SITE_ORIGIN`이 없으면 origin 없이 빌드한다.

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

자산은 HTML의 그림·링크·poster와 CSS의 `url()`을 따라 모은다. 참조한 파일과 필요한 고지만 싣고(콘텐츠 자산의 고지는 `config/assets.json` 항목의 `notice`), 없는 자산이나 경로 이탈은 오류다. 폭 720px보다 큰 정지 그림은 720·1360px webp 사본을 만들어 `srcset`으로 고르게 하고, GIF는 더 작아질 때만 webp로 바꾼다(`src/build/images.js`).

## 메타데이터

글의 공유 그림은 썸네일 또는 본문 첫 그림이며 없으면 사이트 아이콘을 쓴다. 글은 `BlogPosting`, 홈은 `WebSite`와 작성자 `Person` 구조화 데이터를 싣는다. 사이트맵의 `lastmod`는 수정일, 없으면 발행일이다. 없는 주소는 `404.html`로 안내하며 미리보기 서버도 404 상태를 돌려준다.

## 댓글

댓글은 giscus로 `config/site.json`의 저장소·Comments 분류에 고정 글 ID를 연결한다. 글의 `comments: true`일 때만 표시한다. 글 상세는 페이지가 한가할 때 iframe을 만들고, Blog 피드는 `댓글 N개` 단추를 누를 때만 펼친다. 운영 빌드의 댓글 테마는 사이트의 `/theme/assets/giscus.css`이고, HTTPS origin이 없는 미리보기는 `comments.themeUrl`이 없으면 giscus 기본 `light` 테마를 쓴다(`src/layouts/comments.js`의 `commentThemeUrl`).

## Vault 글 가져오기

동기화 스크립트는 없다. 비공개 Vault의 글을 실으려면 AI 에이전트에게 요청해 Vault의 `publish/*.md`를 `content/blog/`에, 글이 쓰는 `assets/*`를 `content/assets/`에 복사하고 `config/assets.json`에 출처 기록을 더한 뒤 빌드한다. 절차는 [AGENTS.md](../../AGENTS.md)에 있다.

## 배포

`.github/workflows/deploy.yml`은 `main`에서 수동 실행한다. `npm ci`, `npm test`, `npm run build -- --production`을 실행하고 `dist/site`를 GitHub Pages에 올린다. 로컬 빌드 성공은 배포 완료가 아니다.
