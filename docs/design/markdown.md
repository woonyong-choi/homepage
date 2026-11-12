# Markdown 글 작성

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 코드 | `src/content/posts.js`, `src/content/front-matter.js`, `src/content/article.js`, `src/document/` |

## 요약

글은 `content/blog/` 아래의 `.md` 파일 하나다. 일반 Markdown으로 쓰고, 단계·안내·카드·갤러리·영상이 필요할 때만 `:::` 구성 블록을 쓴다. 해석과 HTML 출력은 내부 문서 렌더러(`src/document`)가 맡는다. 글에 HTML이나 CSS를 넣지 않는다.

## 파일과 front matter

맨 위에 `---`로 감싼 YAML을 두고 아래에 본문을 쓴다. 폴더는 작성 편의용이며 공개 주소는 `/blog/<slug>/`다. 글은 `content/blog/`에서 직접 고친다.

| 필드 | 필수 | 내용 |
|---|---|---|
| `id`, `slug` | 예 | 소문자·숫자를 하이픈으로 연결한 고정 ID와 주소. 중복이면 빌드 오류. slug `all`, `page`, `feed`는 예약어 |
| `title`, `description` | 예 | 제목과 목록·검색·도입문에 쓰는 요약 |
| `publishedAt` | 예 | 최초 발행일 `YYYY-MM-DD`. 한국 날짜(`Asia/Seoul`)로 오늘 이후면 싣지 않는다 |
| `visibility` | 예 | `public`, `draft`, `private`. `public`만 싣는다 |
| `updatedAt` | 아니오 | 수정일 `YYYY-MM-DD`. `publishedAt`보다 앞설 수 없다 |
| `tags` | 아니오 | 자유 문자열 배열. 생략하면 빈 배열 |
| `keywords` | 아니오 | 태그 외 검색어 배열 |
| `thumbnail` | 아니오 | `src`, `alt` 필수, 선택 `position: { x, y }`(0~100) |
| `comments` | 아니오 | 댓글 표시. 기본 `false` |
| `example` | 아니오 | `true`면 싣지 않는다 |
| `type` | 아니오 | 쓰면 `blog`여야 한다 |

- `publish: false`나 `status: draft`도 글을 제외한다.
- 태그는 앞뒤 공백을 지우고 NFC로 맞춘 뒤 비어 있거나 겹치면 오류다.
- 썸네일 `src`는 `/media/`·`/assets/` 아래 png·jpg·jpeg·gif·webp·svg 또는 자격 정보 없는 HTTPS 주소다.
- 공개 글의 형식 오류는 빌드를 멈춘다. 초안·비공개 글의 형식 오류는 공개 글 빌드를 막지 않는다.
- 본문 첫 문단이 `description`과 같으면 그 문단을 도입문으로 옮긴다. 다르면 `description`이 도입문이 되고 본문은 그대로다.

## 화면 구조

글 상세는 날짜, 제목, 도입문, 태그, 선택 대표 그림, 본문, 댓글 순서다. 그림이 없으면 빈 영역을 만들지 않는다. 본문 제목은 페이지 제목과 겹치지 않게 단계를 내리고 원래 단계는 `app-heading-N` 클래스로 남는다. h2·h3가 있으면 넓은 화면에서는 오른쪽 고정 목차, 좁은 화면에서는 본문 위 접기 목차를 둔다(`DocumentLayout`, `DocumentOutline`). 관련 글 선정은 [Blog와 Search](blog-search.md#태그)에 있다.

## 지원 문법

| 구분 | 문법 | 비고 |
|---|---|---|
| 제목 | `#`~`######` | 제목 ID는 글 ID를 앞에 붙이고 겹치면 번호를 올린다 |
| 문단·줄바꿈 | 빈 줄, 줄 끝 공백 둘 또는 `\` | |
| 강조 | `*기울임*` `**굵게**` `~~취소선~~` | |
| 표시 | `==표시==` `::표시::` | `<mark>` |
| 첨자 | `H~2~O` `x^2^` | 공백 없는 낱말만 |
| 인라인 코드 | `` `코드` `` | |
| 링크 | `[글](주소)` `[글][참조]` `<주소>` | `http(s)`, `mailto`, 사이트 경로, 앵커만 링크가 된다 |
| 그림 | `![대체](경로 "제목")` | 지연 로딩. 누르면 확대 창 |
| 인용, 목록 | `>`, `-` `*` `+` `1.` | 중첩 가능 |
| 작업 목록 | `- [ ]` `- [x]` `- [~]` | 읽기 전용. `[~]`는 취소 |
| 표 | GFM 표와 정렬 | 좁은 화면에서 표만 가로 스크롤 |
| 구분선 | `---` `***` `___` | |
| 각주 | `[^이름]` `[^이름]: 본문` `^[인라인]` | 글마다 ID가 분리된다 |
| 정의 목록 | 용어 줄 다음 `: 설명` | `markdown-it-deflist` |
| 접기 | `<details>`(`open` 선택), `<summary>글자</summary>` | 이 두 태그만 구조로 받는다 |
| 수식 | `$...$`, `$$...$$` | KaTeX |
| 키·메뉴 | `:kbd[⌘ K]` `:menu[파일]` | |
| 아이콘·설명 | `:icon[search]` `:tip[글]{text="설명"}` | |
| 구성 블록 | `:::note` `:::steps` 등 | 아래 절 |
| 코드 블록 | 펜스와 언어, 4칸 들여쓰기 | 아래 절 |

그 밖의 HTML은 글자로 출력하고 실행하지 않는다. 임의 HTML, 인라인 스타일, 스크립트, iframe, ` ```math ` 펜스는 지원하지 않는다. 도표는 그림 파일로 넣는다.

### 수식

빌드할 때 `@vscode/markdown-it-katex`와 KaTeX가 HTML·MathML을 만든다. 읽는 쪽에서 스크립트를 실행하지 않는다. `$5` 같은 숫자 앞 `$`, 코드 안의 `$`, `\$`는 수식이 아니다. 틀린 수식은 빌드를 멈추지 않고 원문을 `katex-error`로 보여 준다. `trust`가 꺼져 있어 `\href`, `\includegraphics` 같은 명령은 글자로 남는다. 수식이 있는 페이지만 `/katex/katex.css`와 필요한 woff2 글꼴을 싣는다.

## 구성 블록

````markdown
:::steps
1. :menu[파일]을 열고 :kbd[⌘ N]을 누른다.
2. 사이드바의 :icon[document] 표시를 확인한다.
:::

::video src=sample.mp4 poster=sample.png alt="화면 설명" caption="목록을 만드는 과정"

:::note[제목]
일반 Markdown **안내문**
:::
````

| 형태 | 의미 |
|---|---|
| `:::이름 옵션` … `:::` | 본문이 있는 블록. 안쪽은 일반 Markdown |
| `::이름 옵션` | 본문이 없는 한 줄 블록 |
| `:이름[글]{속성}` | 문장 안 표기 |

- 옵션은 `이름=값`을 공백으로 잇는다. 값에 공백이 있으면 큰따옴표를 쓴다. 값 없는 이름은 참거짓 옵션(`rounded`, `controls`)만 쓴다.
- 이름은 소문자 영문·숫자·`-`다. 블록 줄은 줄 맨 앞에서 시작하고, `:::`는 가장 안쪽 블록을 닫는다.
- 라벨은 `:::note[제목]`처럼 붙이며 한 줄 1~80자다.
- 코드 펜스와 들여쓴 코드 안은 해석하지 않는다.
- 탭 문법(`:::tabs`, `:::platform`)은 없다.

| 블록 | 속성 | 놓는 곳 | 본문 |
|---|---|---|---|
| `note`, `warning` | 라벨 선택(기본 "참고", "주의") | 문서 바로 아래 | Markdown |
| `fineprint` | 없음 | 문서 바로 아래 | 문단만. 작은 글씨 |
| `steps` | 없음 | 문서 바로 아래 | 목록만 |
| `qa` | 없음 | 문서 바로 아래 | 정의 목록만 |
| `cards` | `variant`(`related`, `centered`, `grouped`, `inline`, `summary`), `columns`(`1`, `2`) | 문서 바로 아래 | `card`만 |
| `card` | `title`·`href` 필수, `description`, `icon` | `cards` 안 | 없음 |
| `gallery` | `title`, `width` | 문서 바로 아래 | `slide`만 |
| `slide` | `src`·`alt` 필수, `caption` | `gallery` 안 | 없음 |
| `figure` | `src`·`alt` 필수, `caption`, `href`, `rounded`, `width` | 문서 바로 아래 | 없음 |
| `video` | `src`·`poster`·`alt` 필수, `caption`, `controls`, `frame`(`none`, `iphone`), `width` | 문서 바로 아래 | 없음 |

- `src`, `poster`는 `content/assets/`에 있는 파일 이름만 쓴다. 경로, `..`, 없는 파일은 오류다.
- `href`는 `https://`, `mailto:`, `#`, `/`로 시작하는 사이트 경로만 받는다.
- `width`는 `content`(기본), `narrow`, `wide`다. 그림·영상·갤러리·코드 블록에 쓴다.
- `video`는 `content/assets/`의 로컬 파일만 받는다. `controls=false`는 오류다. YouTube 주소는 일반 링크로 둔다.
- 문장 안 표기 중 속성은 `tip`의 `text`만 받는다. 목록에 없는 `:이름[...]`은 글자로 남는다.

` ```ui:이름 ` YAML 펜스 구성 요소(`callout`, `details`, `figure`, `figure-grid`, `fineprint`, `video`, `gallery`, `cards`, `definitions`, `group`, `feature`, `feature-list`, `feature-pair`, `syntax-examples`, `device`, `demos`, `speech`, `keys`, `tooltip`)도 쓸 수 있다. 명세는 `src/document/parser/ui-fences.js`에 있다.

### 오류

잘못된 블록은 빌드를 멈추고 `문서ID 본문 N줄 :이름: 내용` 형식으로 알린다. 줄 번호는 본문 첫 줄이 1이다. 닫히지 않은 블록, 알 수 없는 이름, 허용하지 않거나 겹치는 속성, 필수 속성 누락, 잘못된 주소, 없는 자산·아이콘, 놓을 수 없는 자리가 모두 같은 형식이다.

## 코드 블록

펜스 첫 낱말이 언어다. TextMate 문법이 있는 언어는 빌드 때 Shiki로, 나머지 등록 언어는 highlight.js로 강조한다. 등록되지 않은 언어, 언어 없는 블록, `text`는 강조 없이 원문을 이스케이프한다. 대표 언어: `js`, `ts`, `py`, `c`, `cpp`, `cs`, `java`, `kt`, `rs`, `go`, `swift`, `sh`, `sql`, `json`, `yml`, `html`, `css`, `dockerfile`, `md`.

- 강조 결과는 `app-syntax-*` 클래스로 출력하고 색은 토큰 `color.syntax-*`가 정한다. 브라우저는 강조기를 내려받지 않는다.
- 블록 하나의 분석이 500ms(`HIGHLIGHT_TIME_LIMIT_MS`)를 넘으면 그 블록은 강조 없이 출력한다.
- 언어 이름은 화면에 보이지 않고 `data-language` 속성으로 남는다. 복사 단추는 블록 오른쪽 위에 있다.
- 정보 문자열에 `filename=main.ts`를 덧붙이면 이름표 줄에 파일 이름을 보인다.
- 긴 줄은 블록 안에서 가로로 스크롤한다. 안쪽 펜스를 보일 때는 바깥 펜스를 더 길게 쓴다.

## 코드 위치

| 역할 | 위치 |
|---|---|
| front matter 검증, 공개 여부 | `src/content/posts.js`, `src/content/front-matter.js` |
| 문서 렌더러 호출, 도입문 분리 | `src/content/article.js`, `src/content/summary.js` |
| 블록 정의 | `src/document/parser/directive-blocks.js` |
| 블록 출력 | `src/document/renderer/directive-render.js` |
| 구성 요소 HTML | `src/design/ui/`(`#design/ui/index.js`) |
| 글 상세 조립 | `src/layouts/post.js`, `src/layouts/outline.js`, `src/layouts/page.js` |

새 블록은 정의표에 허용 속성·놓을 자리·본문 규칙을, 출력 표에 출력을 한 항목씩 더한다. 렌더러 계약은 [문서 렌더러](document-renderer.md)에 있다. 렌더링 결과는 `test/markdown.test.js`가 확인하며 화면 모양은 브라우저에서 직접 확인한다.
