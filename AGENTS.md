# homepage

Markdown 글과 JSON 설정으로 개인 홈과 Blog를 정적 HTML로 만들어 GitHub Pages에 배포하는 저장소다. `content/`와 `config/`가 사이트의 원본이며 이 저장소에서 직접 고친다. 설계와 사용 안내는 [문서 목록](docs/README.md)에 있다.

## 구성

- `config/`: 사이트 설정 `site.json`(Blog·Search·관리 화면 포함), 태그 `tags.json`, 자산 출처 `assets.json`
- `content/`: 홈 원고(`home.md`, `pages/tech.md`, `interviews/index.md`), Blog 글(`blog/`), 그림·영상(`assets/`, `media/`)
- `src/build/`: 빌드 진입점 `index.js`(`buildSite`), 출력·링크·자산·그림·스크립트·메타데이터, 미리보기 서버 `serve.js`
- `src/content/`: 글·front matter·홈·설정 읽기와 검증
- `src/layouts/`: 페이지 조립
- `src/client/`: 브라우저 스크립트(`site.js`, `comments.js`, `blog-list.js`, `search/`)
- `src/admin/`: 관리자 로더와 글 작성 화면
- `src/lib/`: 형식·검색·해시·검증 공용 함수
- `src/document/`: Markdown 문서 렌더러(`parser/`, `renderer/`, `theme/`, `preview/`)
- `src/design/`: 디자인 시스템. `tokens/tokens.json`, `styles/`, `ui/`(구성 요소와 `runtime/`), `assets/`, `build/`(생성기). 생성 결과 `src/design/dist/`는 Git 밖이며 `npm ci`와 `npm run build`가 만든다. 코드는 `#design/ui/index.js`(`package.json`의 `imports`)로 읽는다
- `test/`: `build`, `markdown`, `posts`, `search` 시험
- `workers/admin-auth/`: 관리자 OAuth 로그인 중계
- `docs/`: 설계와 사용 안내

## 명령

```sh
npm ci                                  # 의존성 설치와 디자인 생성
npm run dev                             # 빌드 후 http://127.0.0.1:8796
npm run build                           # dist/site 생성. 운영은 -- --production
npm test                                # 디자인 생성 후 test/*.test.js
```

CI는 Node 22에서 `npm ci`, `npm test`를 실행한다(`.github/workflows/validate.yml`). 배포는 `.github/workflows/deploy.yml`이며 `npm ci`, `npm test`, `npm run build -- --production` 뒤 `dist/site`를 올린다.

## 규칙

- 한국어로 소통하고 이모지를 쓰지 않는다.
- 커밋은 `type(scope): 한글 설명` 형식과 사용자 Git 작성자를 사용한다. 커밋, 트레일러, 주석 어디에도 AI 작성 흔적을 남기지 않는다.
- 사이트는 라이트 모드로 고정한다. 다크 모드와 도표 기능을 다시 넣지 않는다. 도표는 그림으로 넣는다.
- 색·글꼴·간격·시간 같은 화면 값은 `src/design/tokens/tokens.json`의 토큰으로만 쓴다. 공통 마크업은 `src/design/ui/`의 구성 요소로 만들고 화면 코드에서 다시 구현하지 않는다.
- 화면 변경은 실제 브라우저에서 1440, 1100, 390, 320px 폭으로 확인하고 작업용 탭을 닫는다.
- 커밋 전 `npm test`를 통과한다.

## Vault 글 가져오기

사용자가 비공개 Vault의 글을 사이트에 싣도록 요청하면 다음을 직접 한다. 동기화 스크립트는 없다.

1. Vault의 `publish/*.md`를 `content/blog/`에 복사한다.
2. 글이 쓰는 Vault의 `assets/*`를 `content/assets/`에 복사하고, `config/assets.json`에 없는 파일은 출처 기록(`file`, `origin`, `license`)을 더한다.
3. `npm run build`와 `npm test`로 링크·자산 검사를 통과하는지 확인한다.
