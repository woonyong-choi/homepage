# Homepage

Markdown 기반 개인 홈페이지입니다. 소개·프로젝트·문서·블로그를 함께 제공합니다.

소스와 콘텐츠는 이 저장소에서 관리하며, 공통 디자인은 design-tokens 저장소에서 가져옵니다.

## 홈페이지 실행

```sh
cd /Users/woonyong/workspace/homepage/homepage
npm ci
npm run dev:site
```

브라우저에서 <http://localhost:8796/>을 엽니다. `npm run build:site`는 검색 제외 미리보기를 생성합니다. 운영 주소와 배포는 별도로 설정합니다. 현재 홈페이지의 구성과 발행 방식은 [개인 사이트 발행](docs/design/publication.md)을 따릅니다. 아래의 문서 UI와 메인 시안은 이전 구현 기록입니다.

## 문서 원문과 공개 사본

문서 원문은 비공개 자료 저장소에서 관리합니다. 이 저장소의 문서 사본은 직접 편집하지 않습니다. 원문을 수정한 뒤 `npm run content:approve -- <assets-root> <source-file>`로 공개할 내용을 승인하고 `npm run content:sync -- <assets-root>`로 가져옵니다. 새 문서와 바뀐 원문은 재승인 전까지 공개되지 않습니다. [원문과 공개 승인](docs/design/publication.md#원문과-공개-승인)에 내보내기와 승인 해제 절차를 설명합니다.

## 이전 메인 시안

`preview/index.html`은 기존 위키 메인의 CSS와 배치를 그대로 사용하고 소개, 프로젝트, 글, 위키와 실제 기술 로고로 내용을 교체한 시안이다. 항목은 예시 상세 대화상자로 연결되며 실제 이력서·위키 원문을 공개하지 않는다. 기존 메인은 유지한다.

`node scripts/build-preview.mjs <output-directory>`는 시안 HTML·스크립트·공통 CSS·필요한 글꼴과 아이콘만 내보낸다. 해당 출력 폴더만 정적 서버로 제공한다. 공개 미리보기에는 검색 제외 표시를 넣으며 개인정보 보호 수단으로 간주하지 않는다.

## 이전 문서 UI 실행

```sh
cd /Users/woonyong/workspace/homepage/homepage
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

디자인 값은 `tokens.json`에서만 정의한다. `theme.css`는 이 정본에서 생성하며 홈과 모든 내부 페이지에서 직접 로드한다. `styles.source.css`는 배치와 상태를 토큰 참조로 작성하는 파일이고 `styles.css`는 반응형 기준까지 치환한 생성물이다. 이전 `variables.css`와 별도 확장 토큰 파일은 사용하지 않는다.

기존 색상·간격·반지름은 먼저 재사용한다. 작은 간격은 8px 기본 단위에서 계산하고, 글자 크기와 굵기는 원본 타이포그래피 단계에 연결한다. 본문은 16px, 보조 문구는 14px, 목차와 코드 표시는 12px 척도를 사용한다. 문서 레이아웃 치수·동작 시간·외부 로고 고유색은 기존 토큰으로 표현할 수 없어 사용 근거를 정본에 기록한다. 원본에 있던 잘못된 5자리 HEX는 기존 charcoal 참조로 교정한다.

Circular 폰트 파일은 제공되지 않았다. 현재 로컬 Manrope·Inter를 제목·문서 스택에 사용하고 Circular 및 시스템 글꼴을 폴백에 둔다. 폰트 파일과 등록 정보도 `tokens.json`에서 관리한다. 로고와 아이콘은 정본에서 계산한 색상 선언을 SVG 안에 삽입하므로 외부 이미지로 로드해도 동일하게 표시된다.

`node build.mjs`는 토큰 생성과 하드코딩 검사 후 문서를 만든다. `python3 scripts/audit-tokens.py`는 생성물 재현성, 제삼자 배포본 보존, UI 하드코딩을 검사한다. 도형 좌표와 문서 안 코드 예제는 UI 디자인 값과 구분한다. GitHub CI도 같은 검사를 실행한다.


## 검증과 참조 자료

레이아웃·스크롤 검증은 `VALIDATION.md`, 완료 조건은 `INTERIOR-ISSUE.md`에 기록했다. 후속 수정은 GitHub Issues에서 관리한다. `INTERIOR-ISSUE.md`는 저장소 이전 전의 검증 기록이다.

JavaScript 참조 메뉴의 계층은 `content/javascript-navigation.json`에서 관리한다. 추가한 메서드 본문은 공개 참조 페이지에서 렌더링된 설명과 기본 예제를 Markdown으로 옮긴 것이다. 원본의 모든 예제 탭과 로그인 후 기능까지 복제한 자료는 아니다. Next.js와 Installing을 화면 대조 기준으로 사용한다. 다른 빠른 시작과 튜토리얼에는 정적 문서 연결을 확인하기 위한 간결한 예제 본문이 포함된다.

공개 Supabase 문서의 라이선스·출처는 `assets/vendor/supabase-LICENSE`, `assets/vendor/supabase-NOTICE.md`에 보존했다. 구문 강조에는 로컬 Prism을 사용한다.

## 함께 수정하는 흐름

수정 요청은 GitHub 이슈로 만들고 완료 조건을 정합니다. 이슈별 작업 브랜치에서 수정한 뒤 빌드·화면 검증 결과를 PR에 첨부합니다. 사용자 확인 후 병합합니다. 구현 결과의 검증 범위는 `VALIDATION.md`에서 확인할 수 있습니다.

토큰 이름은 특정 브랜드·프로젝트에 의존하지 않는다. 글꼴 역할은 `font.sans`·`font.mono`, 그림 색상 원본은 `illustration.paint.<색 계열>-<단계>`, SVG 참조는 `asset.paint.symbol-layer-<번호>`를 사용한다. 단계는 해당 계열 내 명도 순서이며 서로 다른 색 계열 사이의 같은 번호는 같은 밝기를 보장하지 않는다. SVG 레이어 번호는 자산의 기존 참조를 구별하는 식별자이며 색의 우선순위가 아니다. 실제 글꼴명과 자산 경로는 원래 식별자를 유지한다.

## 공유 테마 갱신

디자인 정본은 design-tokens의 `themes/base`다. `theme.config.json`에서 사용할 테마를 지정하고, 빌드된 저장소 경로를 전달해 가져온다.

```sh
npm run theme:sync -- --from <design-tokens-root>
node build.mjs
```

`vendor/design-theme`는 해시가 있는 완성본이다. 루트의 tokens.json, styles.source.css와 글꼴은 가져온 사본이며 직접 수정하지 않는다. 변경은 공통 정본에서 진행한다. 가져오기와 빌드는 사본의 해시와 일치 여부를 검사한다. 갱신 결과를 검토하고 소비자 저장소에 함께 커밋해야 반영된다. base의 라이트·다크 디자인을 시스템 모드에 맞춰 표시한다. 본문·제목은 Pretendard, 코드는 JetBrains Mono를 쓴다.

전체 페이지 검사는 `python3 scripts/check-pages.py`로 실행하며 빌드에도 포함된다. 제목·중복 ID·내부 링크·자산·공통 스타일 로드를 확인한다. 스타일과 JavaScript URL에는 내용 해시가 붙어 새 페이지와 오래된 캐시가 섞이지 않는다.
