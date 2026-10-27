# 글 작성 화면

`/admin/`은 브라우저에서 Blog 글을 쓰고 고치는 화면이다. 사이트는 서버 없는 정적 사이트이므로 로그인은 GitHub 계정으로 하고, 저장은 글 원본 저장소에 커밋하는 것으로 대신한다.

## 구성

| 부분 | 위치 | 역할 |
|---|---|---|
| 설정 | `config/admin.json` | 글 원본 저장소, 브랜치, 글·그림 폴더, 로그인 서버 주소. 파일이 없으면 `/admin/`을 만들지 않는다 |
| 화면 틀 | `src/admin-layout.mjs` | 공통 `Button`·`TextInput`·`TextArea`·`Select`·`Field`·`EditorLayout`·`Tabs`로 조립한다 |
| 동작 | `src/admin.js` | GitHub API로 글 목록을 읽고, 글 머리와 본문을 고쳐 커밋한다 |
| 글 변환 | `src/admin-model.mjs` | 글 머리(YAML)의 고친 항목만 바꾸고 다른 항목과 따옴표 모양은 유지한다 |
| 로그인 서버 | `workers/admin-auth/` | GitHub OAuth 코드를 토큰으로 바꾸는 Cloudflare Worker |

## 로그인

1. 어드민의 "GitHub로 로그인"이 로그인 서버의 `/auth?origin=<어드민 주소>`를 새 창으로 연다.
2. 로그인 서버는 허용한 어드민 주소(`ADMIN_ORIGINS`)인지 확인하고, 일회용 상태 값을 쿠키에 둔 채 GitHub 승인 화면으로 보낸다.
3. GitHub가 `/callback`으로 돌아오면 상태 값을 대조하고, 비밀 값(`GITHUB_CLIENT_SECRET`)으로 코드를 토큰으로 바꾼다.
4. 토큰 주인이 허용한 계정(`ALLOWED_LOGINS`)이면 연 창에만 정한 출처로 토큰을 보낸다. 그 밖에는 오류 문구만 보낸다.
5. 어드민은 로그인 서버 출처에서 온 메시지만 받고, 토큰을 그 탭의 `sessionStorage`에만 둔다. 탭을 닫으면 다시 로그인한다.

토큰 범위는 비공개 저장소를 쓰기 위해 `repo`다. 로그인 서버는 토큰을 저장하지 않는다.

## 글 저장

- 목록은 `posts` 폴더의 `type: blog` Markdown이다. 발행일 최신순으로 보인다.
- 공개 여부 하나가 글 머리의 `visibility`·`status`·`publish`를 함께 정한다. 초안은 `draft`·`draft`·`false`, 공개는 `public`·`published`·`true`다.
- 새 글 파일 이름은 `YY-MM-DD-주소-이름.md`이고 `id`·`slug`는 주소 이름이다. 주소 이름은 새 글에서만 정한다.
- 저장은 `docs(publish): 제목 추가|수정` 커밋 하나다. 다른 곳에서 먼저 바뀌었으면 덮어쓰지 않고 다시 불러오라고 안내한다.
- 그림 넣기는 PNG·JPG·GIF·WebP를 `assets` 폴더에 `YYMMDD-이름.확장자`로 커밋하고 본문 커서 위치에 `![설명](../assets/파일)`을 넣는다.
- 미리보기는 사이트와 같은 문서 엔진 해석기로 문법 오류를 보여 주고 본문 글자 모양을 공통 `app-prose`로 그린다. 탭·도표 같은 전용 블록은 사이트 배포 뒤 확인한다.

저장한 글이 사이트에 보이려면 지금처럼 Vault 발행 동기화(`npm run content:sync-vault`)와 배포를 거친다.

## 검색 제외

`/admin/`은 `noindex`이며 사이트맵에 넣지 않고 `robots.txt`에서 막는다. 공개 페이지가 아니지만 화면 자체에는 비밀 값이 없다. 글을 읽고 쓰는 권한은 GitHub 로그인으로만 생긴다.

## 로그인 서버 준비

GitHub OAuth 앱을 만든다. Homepage URL은 사이트 주소, Authorization callback URL은 `https://<Worker 주소>/callback`이다. 그다음 `workers/admin-auth`에서 비밀 값을 넣고 배포한다.

```sh
cd workers/admin-auth
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

배포한 Worker 주소를 `config/admin.json`의 `authUrl`에 넣고 사이트를 다시 배포한다. 허용 계정과 어드민 주소는 `wrangler.toml`의 `ALLOWED_LOGINS`, `ADMIN_ORIGINS`(쉼표 구분)에서 바꾼다.
