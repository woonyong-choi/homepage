# 제품 소개와 지원 문서 예시

Things의 화면 구성을 참고한 검토용 정적 사이트다. 본문은 새로 작성한 더미 콘텐츠다. 개인 소개·블로그·포트폴리오 정보 설계는 이 구현을 검토한 다음 진행한다.

## 실행

```sh
npm ci
npm run build:product
npm run dev -- --host 127.0.0.1 --port 8794
```

- 홈: `/things/`
- 기능: `/things/features/`
- 지원: `/things/support/`
- 전체 문법: `/things/style-guide/`
- 블로그: `/things/blog/`

`dist/things/`을 정적 서버의 `/things/`에 배치한다. 기존 문서 사이트 빌드인 `npm run build`와 출력 위치를 분리한다.

외부 미리보기도 영상 탐색을 위해 HTTP Range 요청을 지원해야 한다. 여러 미리보기를 담은 기존 폴더를 제공할 때는 `node product/serve.mjs --port 8792 --root /absolute/preview-root`를 사용한다. `--root`를 지정하면 루트의 기존 `index.html`도 유지한다.

## 정본

| 경로 | 역할 |
|---|---|
| `content/*.md` | 페이지 메타데이터와 본문 정본 |
| `markdown.mjs` | Markdown와 문서 구성 요소 변환 |
| `layout.mjs` | 내비게이션·검색·문서·블로그 레이아웃 |
| `home.mjs` | 홈 메타데이터를 제품·후기·인용문 섹션으로 조합 |
| `site.js` | 검색·탭·슬라이드·영상·복사·폼 동작 |
| `theme.config.json` | 사용하는 테마 ID |
| `vendor/theme/` | 디자인 토큰 저장소에서 가져온 해시 검증 사본 |
| `assets.json` | 참고 자산의 원본 URL·해시 |
| `assets/` | 로컬 참고 자산. 원본의 고유 색과 도형을 보존 |

스타일 정본은 design-tokens의 `themes/base/simple/`이다. 수정 위치는 [스타일 수정 지도](../docs/design/styles.md)를 따른다. `base`를 상속하고 단일 라이트 모드를 제공한다. 첨부한 토큰·CSS·디자인 설명은 그 안의 `reference/`에 보존한다. 이 사이트에서 임의로 스타일 값을 추가하지 않는다.

```sh
npm run theme:product -- /path/to/design-tokens
npm run build:product
```

동기화는 변조된 사본을 덮어쓰지 않는다. 기본 테마 갱신 후 이 명령으로 완성본을 다시 가져온다. 배포된 사이트는 원격 저장소의 미검증 변경을 자동 적용하지 않는다.

## 문서 작성

```markdown
---
title: 문서 제목
route: /things/support/articles/my-guide/
layout: article
icon: markdown
description: 문서의 짧은 소개
---
## 첫 번째 단계

본문을 작성합니다.
```

메타데이터는 YAML 또는 JSON이다. `route`는 `/things/` 아래의 소문자 영문·숫자·하이픈 경로이며 끝에 `/`를 둔다. 중복 경로, 빠진 자산, 깨진 내부 링크·목차, 중복 HTML ID는 빌드 오류다. `layout`은 home, support, features, article, post, blog다. post는 ISO 날짜 문자열 `date`를 지정한다.

기본 문법은 제목 1–6, 문단, 줄바꿈, 강조, 취소선, 인용, 목록·중첩 목록, 정적 체크 목록, 링크·참조 링크·자동 링크, 이미지, 구분선, 정렬 표, 코드·구문 강조, 각주다. HTML과 스크립트는 실행하지 않는다.

구성 요소는 `ui:이름` 코드 펜스에 YAML 또는 JSON으로 작성한다. `syntax: true`인 페이지는 구성 요소 아래에 작성 문법과 복사 버튼을 함께 표시한다. 실제 전체 예시는 `content/syntax-specimen.md`다.

| 이름 | 입력 |
|---|---|
| callout | title, body, tone: warning, fineprint 선택 |
| details | title, body, open 선택 |
| figure | src, alt, caption, wide 선택 |
| video | src, poster, title, caption, width, height, controls, overlay 선택 |
| demos | poster, title, items: [{title, body, src}] |
| device | src, title, video: true와 poster 선택 |
| gallery | slides: [{src, alt, label, caption 선택}], wide, selected 선택 (0부터 시작) |
| platform | items: [{label, body}], 아래쪽 플랫폼 선택 동기화와 ?platform= 지원 |
| tabs | items: [{label, body}], title 선택 |
| cards | items: [{title, href, icon, description, compact 선택}], columns, split, horizontal 선택. icon: false는 아이콘 생략 |
| definitions | items: [{term, body}] |
| speech | body |
| keys | label, keys: 문자열 배열 |
| tooltip | label, description |
| form | label, message: true 선택 |
| group | title, body |
| feature | title, icon, description, body, left, right |
| feature-pair | media, items: [{title, body}], mediaFirst 선택 |

body는 다시 Markdown으로 해석한다. gallery의 label을 생략하면 번호 버튼이 되고, 지정하면 Before/Now처럼 비교 버튼이 된다. src와 poster에는 assets 폴더의 파일명을 쓴다. 일반 탭과 슬라이드는 독립적이다. 플랫폼 탭은 클릭과 방향키·Home·End 모두 선택한 기기를 뒤쪽 플랫폼 블록에 전달하며, 앞쪽 블록은 변경하지 않는다.

## 검증

```sh
npm run check:product
npm run build:product
npm run build
```

폼은 브라우저 입력 형식 검사와 확인 메시지만 제공한다. 구독·문의·구매·계정 변경은 외부로 전송하지 않는다. 소셜·플랫폼 링크는 원본의 외부 이동 경로에 연결한다. 체험판·보도 자료 다운로드는 실행 파일이 없는 검토용 파일이다. 원본 사이트의 전체 아카이브 내용이나 서버 기능을 구현했다는 의미는 아니다.

영상은 재생 전 포스터를 유지하고 Play 버튼으로 제어합니다. controls: true는 재생 후 기본 컨트롤을 표시합니다. demos는 하나의 기기 영상에 여러 재생 버튼을 연결합니다. 갤러리는 숨긴 패널도 높이 계산에 포함해 전환 시 문서가 흔들리지 않게 합니다.

## 홈과 기능 섹션

`content/home.md`의 `home` 메타데이터가 홈의 섹션을 정의한다. 제품 카드, 후기 묶음, 인용문, 뉴스레터 문구를 같은 파일에서 편집한다. 기능 페이지는 같은 제품 카드와 후기 데이터를 재사용한다.

`ui:feature`는 선택적 `icon`, `href`, `link`를 받는다. 아이콘이 없는 섹션도 같은 제목·본문 폭을 따른다. `ui:feature-list`의 `items`는 `title`과 Markdown `body`로 기능 설명을 나열한다.

스타일 링크에는 내보낸 테마 해시를, 동작 스크립트에는 파일 해시를 붙인다. 내용이 변경되면 브라우저가 새 파일을 받는다. 빌드는 사용하는 `--site-*` 변수가 내보낸 테마에 모두 정의되어 있는지도 확인한다.

일반 문서는 자동 목차를 표시하지 않는다. 메타데이터에 `toc: true`를 설정한 문서만 두 번째 단계 제목의 목차를 표시한다. `ui:syntax-examples`은 `title`, `source`, Markdown `body`를 가진 항목을 작성 형태 아래에 설명을 표시한다.

## 추가 페이지 유형

- `plain`: 문의 양식과 긴 문서를 렌더링한다. `variant: document`는 일반 안내 문서의 상단 여백을 적용한다.
- `about`: `panels`의 제목·ID·Markdown 본문을 배경 위의 패널로 렌더링한다. `lead: false`인 패널은 첫 문단도 일반 본문 크기로 표시한다.
- `contact`, `newsletter`, `status`: 문의 입구, 구독 입력, 상태 안내의 고유 화면을 렌더링한다.
- `redirect`: `target`에 지정한 정적 페이지 또는 외부 스토어로 이동한다. 가이드의 본문은 지원 문서 한 곳에 둔다.
- `ui:feature-pair`, `ui:feature-list`: 설명과 미디어 또는 두 열의 설명 목록을 구성한다.
- `ui:syntax-examples`: 입력 문법과 렌더링 설명을 연결한다.
- `ui:contact-form`, `ui:status-board`: 검토용 입력 양식과 상태·출시 목록을 만든다.

문의·구독은 입력 형식을 확인한 뒤 화면에 결과만 표시한다. 개인정보 전송과 실제 구독은 실행하지 않는다. 전체 구성 요소는 `/things/style-guide/`에서 작성 문법과 함께 확인한다.

`ui:keyboard`는 `languages`와 `groups[].rows[]`로 선택기와 표를 만든다. 각 행의 `keys`는 언어 ID별 키 배열이며, 해당 언어 정의가 없으면 `en-us`를 사용한다. `label`, `note`는 Markdown이다. 예시 문서에 들어 있는 키는 실제 앱 단축키 명세가 아니다.

`ui:tooltip`은 버튼으로 도움말을 열고 Escape 또는 바깥 클릭으로 닫는다. 본문은 Markdown으로 작성하며, 팝오버는 화면 경계를 기준으로 위아래 위치를 선택한다.

기본 Markdown 외에 `::하이라이트::`와 `- [~] 취소된 작업`을 지원한다. 코드 안과 이스케이프된 구분자는 문자 그대로 표시한다. 원시 HTML 실행은 허용하지 않는다.

`pricing`은 홈과 제품 카드 데이터를 공유하며 가격·요구사항·체험 버튼을 생략한 간단한 카드를 표시한다. `plain`의 `variant: actions`는 내려받기와 문의 같은 동작 링크의 버튼 스타일을 적용한다. 무료 체험과 보도 자료 다운로드는 실행 파일이 없는 검토용 ZIP을 사용한다.

`ui:feature-pair`의 `mediaFirst: true`는 미디어를 설명보다 먼저 배치한다. 기기마다 설명 수가 다르면 `ui:tabs`의 각 항목 안에 `ui:feature-pair`를 둔다. `ui:cards`의 `horizontal: true`는 아이콘이 왼쪽에 오는 카드를 만들며, `icon: false`는 아이콘을 생략한다. 기사 메타데이터의 `icon: false`도 제목 아이콘을 생략한다.

`cards.variant`는 `centered`, `grouped`, `inline`을 지원한다. 개별 항목의 `variant`로도 지정할 수 있다. `inline` 묶음은 문장 높이의 링크를 나란히 배치한다. `icon: false`로 아이콘을 생략한다.

문장 안 키캡은 `:kbd[⌘ Cmd]`, 메뉴 이름은 `:menu[Edit]`로 작성한다. 대괄호 안 내용은 일반 텍스트로 이스케이프하며 코드 구간에서는 변환하지 않는다.

## 콘텐츠 아이콘

`/things/icon-system/`에서 카드, 썸네일 없는 글, 사람과 시스템, 크기별 아이콘을 검토한다. SVG 원본 목록과 표현 토큰은 design-tokens의 `themes/base/simple`이 정본이다. `product/vendor/theme`는 내보낸 사본이다.

기존 참고 아이콘 이름은 유지한다. `ui:cards`의 `icon`에 `content:network` 또는 `{name: database, kind: concept}`를 지정하면 새 SVG를 렌더링한다. 글 frontmatter의 `contentIcon`도 같은 객체를 받는다.

```yaml
contentIcon:
  name: database
  kind: troubleshooting
```

글 유형은 concept, build, troubleshooting, experiment, retrospective 중 하나다. 주 아이콘은 글의 핵심 대상으로 직접 선택한다. 종류나 아이콘 이름이 없으면 빌드를 실패시킨다. 작은 24px 표시는 보조 표식을 생략한다. 현재 예시는 검토 페이지에 있으며 기존 글의 그림을 일괄 변경하지 않는다.

제작 기준과 Daphnis 대응은 [디자인 정본 문서](https://github.com/woonyong-choi/design-tokens/blob/feat/16-repo-content-icons/docs/design/content-icons.md)에 있다.
