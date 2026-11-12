# homepage

Markdown 글과 JSON 설정으로 개인 홈과 Blog를 정적 HTML로 만들어 GitHub Pages에 배포하는 저장소다. 원문은 비공개 Vault에 있고 이 저장소에는 승인 사본만 있다. 설계와 사용 안내는 [문서 목록](docs/README.md)에 있다.

## 구성

- `config/`: 작성 설정(`site`, `blog`, `search`, `tags`, `admin`)과 승인·자산 목록
- `content/`: 홈 원고(`home.md`, `pages/tech.md`, `interviews/index.md`), Blog 글(`blog/`), 그림·영상(`assets/`, `media/`)
- `src/build/`: 빌드 진입점 `index.js`(`buildSite`), 출력·링크·자산·그림·스크립트·메타데이터, 미리보기 서버 `serve.js`
- `src/content/`: 글·front matter·홈·설정 읽기와 검증
- `src/layouts/`: 페이지 조립
- `src/client/`: 브라우저 스크립트(`site.js`, `comments.js`, `blog-list.js`, `search/`)
- `src/admin/`: 관리자 로더와 글 작성 화면
- `src/vault/`: Vault 승인 사본 동기화와 검사
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
npm run content:sync -- <vault-root>    # Vault 승인 파일 가져오기
npm run content:check                   # 승인 사본 해시 검사
```

CI는 Node 22에서 `npm ci`, `npm test`를 실행한다(`.github/workflows/validate.yml`). 배포는 `.github/workflows/deploy.yml`이다.

## 규칙

- 한국어로 소통하고 이모지를 쓰지 않는다.
- 커밋은 `type(scope): 한글 설명` 형식과 사용자 Git 작성자를 사용한다. 커밋, 트레일러, 주석 어디에도 AI 작성 흔적을 남기지 않는다.
- `content/blog/`와 Vault 승인 사본(홈 원고, `config/`의 작성 설정, 승인 목록)은 직접 수정하지 않는다. Vault 원문을 고치고 승인한 뒤 `npm run content:sync`로 가져온다.
- 사이트는 라이트 모드로 고정한다. 다크 모드와 도표 기능을 다시 넣지 않는다. 도표는 그림으로 넣는다.
- 색·글꼴·간격·시간 같은 화면 값은 `src/design/tokens/tokens.json`의 토큰으로만 쓴다. 공통 마크업은 `src/design/ui/`의 구성 요소로 만들고 화면 코드에서 다시 구현하지 않는다.
- 화면 변경은 실제 브라우저에서 1440, 1100, 390, 320px 폭으로 확인하고 작업용 탭을 닫는다.
- 커밋 전 `npm test`를 통과한다.
