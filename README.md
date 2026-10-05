# Blog

개인 사이트로 발전시키는 Markdown 기반 블로그입니다. 현재 화면은 Supabase Docs를 참고한 문서 UI이며, 메뉴·본문은 예제 콘텐츠를 포함합니다.

## 실행

```sh
cd /Users/woonyong/workspace/local/blog
node build.mjs
python3 -m http.server 8768 --bind 127.0.0.1
```

브라우저에서 <http://127.0.0.1:8768/>을 연다. `node build.mjs`는 Markdown 문서마다 `pages/<id>/index.html`을 만들고 `search-index.json`을 갱신한다. 생성된 HTML에는 문서 본문, 왼쪽 계층 메뉴, 오른쪽 목차가 들어 있어 해당 URL을 직접 열 수 있다. 배포할 때는 루트의 정적 파일과 `pages/`를 함께 올린다.

## Markdown 문서 작성

문서 메뉴와 라우트는 [`content/navigation.json`](content/navigation.json)에서 관리한다. 메뉴 항목을 추가할 때 `groups[].pages`에 다음 값을 넣는다.

```json
{ "id": "guides/example", "title": "Example", "summary": "Short introduction", "source": "https://supabase.com/docs/guides/example" }
```

이어서 `content/guides/example.md`를 작성하고 `node build.mjs`를 다시 실행한다. `id`와 Markdown 파일 경로가 일치해야 한다. 내부 링크는 `[다음 문서](#/guides/another-page)` 형식을 사용한다. 빌드 시 해당 링크가 정적 문서 URL로 변환된다. Markdown의 제목(`##`, `###`)으로 오른쪽 목차와 모바일 목차가 생성된다. 코드 블록에는 구문 강조, 파일 이름, 줄 번호, 줄 바꿈, 복사 버튼이 붙는다. 메뉴와 검색 색인에도 새 문서가 반영된다. 검색은 제목·요약·본문을 대상으로 한다.

설치 명령처럼 탭이 필요한 곳에는 `tabs` 코드 펜스 안에 `{ "npm": "npm install ...", "Yarn": "yarn add ..." }` 형식의 JSON을 넣는다. 접을 수 있는 에이전트 프롬프트는 `prompt` 코드 펜스를 사용한다. `> [!NOTE]` 인용문은 안내 상자로 렌더링한다. JavaScript 참조와 프레임워크 빠른 시작은 같은 Markdown 빌드에서 각각 맞춤 탐색·본문 배치를 사용한다.

현재 홈의 문서 카드와 메뉴가 가리키는 309개 정적 문서를 포함한다. 각 페이지는 독립된 Markdown 파일로 작성한다. 기술별 상세 절차는 간결하게 구성했으며, 버전별 최신 명령과 옵션은 각 문서의 공식 링크에서 확인할 수 있다.

## 구성

- `index.html`, `main.js`, `styles.css`: 홈, 탐색, 검색, 상호작용과 레이아웃
- `build.mjs`: Markdown을 문서별 정적 HTML과 검색 색인으로 빌드
- `doc-page.js`: 정적 문서의 검색, 모바일 메뉴, 코드 복사
- `content/navigation.json`, `content/**/*.md`: 문서 구조와 본문 원본
- `pages/`, `search-index.json`: 빌드 결과
- `assets/vendor/markdown-it.mjs`: 로컬 Markdown 렌더러. 라이선스는 `assets/vendor/markdown-it-LICENSE`에 보존

제공된 `tokens.json`, `variables.css`, `theme.css`, `DESIGN.md`는 바이트 단위로 복사했고 수정하지 않았다. `styles.css`는 `variables.css`의 값을 사용한다. `theme.css`는 제공된 Tailwind 참조 파일로 보존한다. 로고, 아이콘, Manrope·Inter·Source Code Pro 글꼴은 공개 문서 사이트에서 로컬로 저장해 미리보기가 외부 정적 자산에 의존하지 않도록 했다.


## 검증과 참조 자료

레이아웃·스크롤 검증은 `VALIDATION.md`, 완료 조건은 `INTERIOR-ISSUE.md`에 기록했다. 후속 수정은 GitHub Issues에서 관리한다. `INTERIOR-ISSUE.md`는 저장소 이전 전의 검증 기록이다.

JavaScript 참조 메뉴의 계층은 `content/javascript-navigation.json`에서 관리한다. 추가한 메서드 본문은 공개 참조 페이지에서 렌더링된 설명과 기본 예제를 Markdown으로 옮긴 것이다. 원본의 모든 예제 탭과 로그인 후 기능까지 복제한 자료는 아니다. Next.js와 Installing을 화면 대조 기준으로 사용한다. 다른 빠른 시작과 튜토리얼에는 정적 문서 연결을 확인하기 위한 간결한 예제 본문이 포함된다.

공개 Supabase 문서의 라이선스·출처는 `assets/vendor/supabase-LICENSE`, `assets/vendor/supabase-NOTICE.md`에 보존했다. 구문 강조에는 로컬 Prism을 사용한다.

## 함께 수정하는 흐름

수정 요청은 GitHub 이슈로 만들고 완료 조건을 정합니다. 이슈별 작업 브랜치에서 수정한 뒤 빌드·화면 검증 결과를 PR에 첨부합니다. 사용자 확인 후 병합합니다. 구현 결과의 검증 범위는 `VALIDATION.md`에서 확인할 수 있습니다.
