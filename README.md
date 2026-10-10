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

## 수정할 위치

| 수정할 내용 | 파일·폴더 |
|---|---|
| 홈 소개·영상·구간 순서 | [`content/home.md`](content/home.md) |
| 동료평가 소개·공개 카드 | [`content/interviews.md`](content/interviews.md) |
| 기술 링크·분야 이름·카드 설명 | [`content/tech.md`](content/tech.md) |
| 분야별 문서 | `content/docs/<분야>/`의 승인 사본 |
| 블로그 원고 | `content/blog/`의 승인 사본 |
| 이미지·영상·출처 고지 | `content/assets/`, `content/media/` |
| 사이트·댓글·태그·승인 목록 | `config/` |
| 해석·검색·댓글·페이지 조립 | `src/` |
| 공통 디자인 | `src/vendor/theme/`의 해시 검증 사본 |
| 설계·작성 안내와 검사 | `docs/`, `scripts/` |
| 생성된 사이트 | `dist/site/` — 빌드가 다시 생성 |

홈의 세 Markdown 파일은 직접 편집한다. 제목과 소개는 본문에, 카드·링크·영상 속성은 맨 위 YAML에 작성한다. 같은 내용을 JSON에 다시 적지 않는다. 분야별 문서와 블로그는 비공개 원본을 수정하고 승인한 뒤 아래 명령으로 가져온다. 비공개 인터뷰 미리보기 연결은 [홈 원고 가이드](docs/design/home-content.md)를 따른다.

색·간격·글꼴·아이콘·공통 마크업·동작은 디자인 저장소에서 관리한다. 홈페이지는 가져온 `src/vendor/theme/ui/index.mjs`의 구성 요소에 콘텐츠와 경로를 넘긴다. `src/vendor/theme/`를 직접 수정하지 않는다.

## 콘텐츠 승인

원본과 인터뷰 자료는 비공개 자료 저장소에서 관리한다. 명시적으로 승인한 경로와 SHA-256만 공개 사본으로 가져온다. 승인 이후 변경된 원문은 다시 승인하기 전까지 반영하지 않는다.

```sh
npm run content:check
npm run content:sync -- <assets-root>
```

`<assets-root>`는 승인 목록이 있는 비공개 원문 저장소의 루트다. 승인·회수 명령, 폴더와 프런트매터의 관계는 [개인 사이트 발행](docs/design/publication.md)에 있다.

## 디자인 갱신

로컬 디자인 변경을 검토할 때만 정본 경로를 지정한다.

```sh
npm run design:sync -- /path/to/design-tokens
```

정본의 `main` 변경은 Daphnis 검증을 거쳐 같은 디자인 사본과 고정된 렌더러 커밋으로 전달된다. 홈페이지는 `build/repo-design-tokens` 브랜치에서 디자인 해시 일치와 전체 빌드·테스트를 확인하고 PR을 만든다. 사용자 명의 `DESIGN_AUTOMATION_TOKEN`이 등록된 경우에만 검증한 커밋을 자동 병합한다. 토큰이 없으면 검증된 PR까지 준비한다. 허용된 디자인 사본·렌더러 의존성 이외의 변경은 자동 병합하지 않는다. 인증과 갱신 경계는 [스타일 수정 지도](docs/design/styles.md)에 정리한다.

토큰 파일은 그대로 보관하고 발행 CSS는 실제 HTML과 동작이 참조하는 선택자·변수만 남긴다.

## 문서

문서는 한국어로 작성한다. [전체 문서](docs/README.md)에서 홈 원고, Markdown 문법, 발행 경계와 스타일 수정 위치를 찾는다.
