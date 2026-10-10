# homepage

개인 소개, 기술 문서, 블로그를 Markdown과 공통 디자인 구성 요소로 만드는 정적 사이트다.

## 실행

```sh
npm ci
npm run check:tokens
npm run check:product
npm run build:site
npm run dev
```

미리보기는 `http://localhost:8796/`이다. `/docs/`에서 문서와 블로그를 함께 검색하고 `/blog/all/`에서 블로그 카드를 본다. `dist/site/`가 정적 산출물이다. 운영 발행은 확정된 HTTPS 주소를 `SITE_ORIGIN`으로 지정하고 `npm run build:site -- --production`을 실행한다. 운영 빌드는 예시 글과 비공개 입력을 제외한다.

## 구성

| 경로 | 역할 |
|---|---|
| `src/` | 콘텐츠 해석, 검색·댓글 연결, 페이지 조립 |
| `src/publication/`, `src/examples/` | 승인된 Markdown 사본 |
| `src/vendor/theme/` | 공통 디자인의 해시 검증 사본 |
| `src/assets/`, `src/media/` | 현재 화면·검증에 쓰는 콘텐츠 자산과 출처 |
| `scripts/` | 소스 경계 검사 |
| `docs/` | 현재 설계와 작성 안내 |
| `.github/` | 검증과 디자인 갱신 |

색·간격·글꼴·아이콘·공통 마크업·동작은 디자인 저장소에서 관리한다. 홈페이지는 가져온 `src/vendor/theme/ui/index.mjs`의 구성 요소에 콘텐츠와 경로를 넘긴다. `src/vendor/theme/`를 직접 수정하지 않는다.

## 콘텐츠 승인

원본과 인터뷰 자료는 비공개 자료 저장소에서 관리한다. 명시적으로 승인한 경로와 SHA-256만 공개 사본으로 가져온다. 승인 이후 변경된 원문은 다시 승인하기 전까지 반영하지 않는다.

```sh
npm run content:check
npm run content:sync
```

승인·회수 명령, 폴더와 프런트매터의 관계는 [개인 사이트 발행](docs/design/publication.md)에 있다.

## 디자인 갱신

로컬 디자인 변경을 검토할 때만 정본 경로를 지정한다.

```sh
npm run theme:product -- /path/to/design-tokens
```

정본의 `main` 변경은 검증 후 `build/repo-design-tokens` 브랜치로 전달된다. 홈페이지 검사까지 통과하면 디자인 폴더만 바뀐 PR을 만들고 병합한다. 실패하거나 다른 폴더가 섞이면 자동 병합하지 않는다. 토큰 파일은 그대로 보관하고 발행 CSS는 실제 HTML과 동작이 참조하는 선택자·변수만 남긴다.

## 문서

문서는 한국어로 작성한다. [전체 문서](docs/README.md)에서 홈 설정, Markdown 문법, 발행 경계와 스타일 수정 위치를 찾는다.
