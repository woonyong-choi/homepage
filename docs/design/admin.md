# 글 관리

사이트 화면은 그대로 두고, 관리자로 로그인한 브라우저에만 글 관리 기능을 얹는다. 배치와 흐름은 벨로그의 작성 흐름을 따르고 색·글꼴·크기·곡률은 공통 디자인을 쓴다. 사이트는 서버 없는 정적 사이트이므로 로그인은 GitHub 계정, 저장은 글 원본 저장소(비공개 Vault)에 커밋하는 것으로 대신한다.

## 화면

| 위치 | 관리자에게 보이는 것 |
|---|---|
| 모든 페이지 오른쪽 아래 | 동그란 + 단추(새 글)와 그 위의 임시·비공개 글 단추(개수). 누르면 목록이 뜬다 |
| 글 화면 | 글쓴이 줄 끝의 수정·삭제 |
| 작성 화면 | 왼쪽은 제목, 태그 칩(Enter·쉼표로 추가, 누르면 삭제), 서식 단추, 본문. 오른쪽은 사이트 글 화면과 같은 `PostArticle` 실시간 미리보기. 아래 막대는 나가기·임시저장·출간하기 |
| 출간 화면 | 썸네일 올리기·제거(없으면 본문 첫 그림), 요약 150자, 전체 공개·비공개, 주소 이름, 발행일, 취소·출간하기 |
| `/admin/` | GitHub 로그인·로그아웃과 로그인 없이 체험하기 |

방문자에게는 1KB 남짓한 로더만 내려가고 아무것도 보이지 않는다. 작성 기능(`admin-editor.js`)은 로그인한 브라우저에서만 불러온다.

## 글 상태

| 상태 | 글 머리 | 사이트 |
|---|---|---|
| 임시 | `visibility: draft`, `status: draft`, `publish: false` | 싣지 않음 |
| 비공개 | `visibility: private`, `status: published`, `publish: false` | 싣지 않음 |
| 공개 | `visibility: public`, `status: published`, `publish: true` | 실음 |

- 임시저장은 주소가 없으면 `draft-날짜-임의값` 임시 주소로 저장한다. 출간할 때 정한 주소로 파일 이름과 `id`·`slug`를 바꾼다.
- 공개 글을 출간·수정·내리기·삭제하면 배포 작업(`config/admin.json`의 `deploy`)을 실행하고 끝날 때까지 알림으로 알린다. 임시·비공개 저장은 배포하지 않는다.
- 저장은 글 머리의 고친 항목만 바꾸고 다른 항목과 따옴표 모양은 유지한다(`src/admin-model.mjs`).
- 다른 곳에서 먼저 바뀐 글은 덮어쓰지 않고 새로고침을 안내한다. 삭제는 확인 창을 거친다.

## 배포

글 원본은 비공개 Vault 저장소에 있다. 홈페이지 저장소는 공개이므로 임시·비공개 글을 두지 않는다. 배포 작업은 저장소 비밀 값 `VAULT_TOKEN`이 있으면 Vault의 `publish`·`assets`만 받아 공개 글을 싣고, 없으면 이 저장소의 승인 사본(`content/blog`)으로 빌드한다. 임시·비공개 글의 형식 오류는 공개 글 배포를 막지 않는다.

## 로그인

1. `/admin/`의 "GitHub로 로그인"이 로그인 서버의 `/auth?origin=<사이트 주소>`를 새 창으로 연다.
2. 로그인 서버(`workers/admin-auth`)는 허용한 사이트 주소(`ADMIN_ORIGINS`)인지 확인하고 일회용 상태 값을 쿠키에 둔 채 GitHub 승인 화면으로 보낸다.
3. 돌아온 코드를 비밀 값(`GITHUB_CLIENT_SECRET`)으로 토큰으로 바꾸고, 토큰 주인이 허용한 계정(`ALLOWED_LOGINS`)이면 연 창에만 토큰을 보낸다.
4. 사이트는 로그인 서버 출처의 메시지만 받고 토큰을 이 브라우저의 `localStorage`에 둔다. `/admin/`의 로그아웃이 지운다.

토큰 범위는 비공개 저장소 쓰기와 배포 실행을 위해 `repo`다. 로그인 서버는 토큰을 저장하지 않는다.

## 체험 모드

`/admin/`의 "로그인 없이 체험하기"는 이 탭의 `sessionStorage`에 표시를 남기고, GitHub API 대신 메모리 안의 예시 글(`src/admin-demo.mjs`)로 같은 화면과 흐름을 연다. 저장·삭제·배포는 흉내만 내며 실제 저장소와 사이트는 바뀌지 않는다. 탭을 닫거나 "체험 끝내기"로 끝난다.

## 준비

1. `workers/admin-auth`에서 `npx wrangler deploy`로 로그인 서버를 배포한다.
2. GitHub OAuth 앱을 만든다. Homepage URL은 사이트 주소, Authorization callback URL은 `https://<로그인 서버 주소>/callback`이다.
3. `npx wrangler secret put GITHUB_CLIENT_ID`, `npx wrangler secret put GITHUB_CLIENT_SECRET`으로 비밀 값을 넣는다.
4. `config/admin.json`의 `authUrl`에 로그인 서버 주소를 넣는다.
5. 홈페이지 저장소 비밀 값 `VAULT_TOKEN`에 Vault 저장소 읽기 권한 토큰을 넣는다.
