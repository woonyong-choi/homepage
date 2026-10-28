# Markdown 글 작성

| 항목 | 값 |
|---|---|
| 상태 | 구현 |

## 요약

승인한 Markdown 원고를 내부 문서 렌더러(`src/document`)로 렌더한다. 일반 Markdown과 선택 구성 블록의 문법, 메타데이터, 오류·호환 조건을 정한다.

## 해결하는 문제

글마다 HTML과 CSS를 넣으면 글 상세와 미리보기의 출력이 달라진다. 작성자는 문서 구조와 내용만 적고 문서 렌더러와 디자인 구성 요소가 출력을 담당한다.

## 사용 예

### 사용 장면

일반 글은 Markdown으로 작성한다. 같은 도표의 단계를 비교할 때는 DiagramPlay `scene`을 쓴다. 서로 다른 글·그림·코드는 탭으로 묶지 않고 문단 한 줄로 소개한 뒤 차례로 둔다. 문서 탭 문법은 헷갈리고 Obsidian에서 쓰기 어려워 두지 않는다.

## 작동 방식

### 입력과 구성

글은 `.md` 파일 하나이며 일반 Markdown만으로 쓴다. `ui:` 구성 요소는 구조화된 입력을 위한 선택 기능이고 일반 글 작성에는 필요하지 않다. 작성 중인 원고는 Vault 미리보기로 확인한다. 예시는 운영용 발행 목록에 포함하지 않는다.

### 파일과 메타데이터

비공개 Vault의 원문을 수정·승인한 뒤 `content:sync-vault`로 `content/blog/`에 가져온다. 승인 사본은 직접 수정하지 않는다. 폴더는 작성 편의용이며 공개 주소는 `/blog/<slug>/`다. 공개 글에 `type`, `field`, `category`, `parent`, `contentIcon`을 요구하지 않는다. 개인 위키 미리보기의 기존 메타데이터는 [별도 API 계약](publication.md#저장-전-페이지-미리보기)으로 유지한다.

맨 위에 `---`로 감싼 YAML 또는 JSON을 쓰고 아래에 본문을 쓴다.

| 필드 | 필수 | 내용 |
|---|---|---|
| `id`, `slug` | 예 | 소문자 영문·숫자를 하이픈으로 연결한 고정 ID와 주소. 중복이면 빌드 오류 |
| `title`, `description` | 예 | 제목과 목록·검색·도입문에 쓰는 설명 |
| `tags` | 아니오 | 임의 문자열 배열. 생략하면 빈 배열. `python`, `산책`, `독서`, `회고` 같은 태그 사용 |
| `publishedAt` | 예 | 최초 발행일. `YYYY-MM-DD` |
| `visibility` | 예 | `public` 또는 `draft` |
| `updatedAt` | 아니오 | 수정일. `YYYY-MM-DD` |
| `keywords` | 아니오 | 태그 외 검색 키워드의 문자열 배열 |
| `thumbnail` | 아니오 | `src`, `alt`, 선택 `position` |
| `comments` | 아니오 | 댓글 표시 여부. 기본 `false` |
| `example` | 아니오 | 기본 `false`. `true`면 운영 발행에서 제외 |

slug `all`, `page`, `feed`는 예약어다. 태그는 양끝 공백 제거와 Unicode NFC 정규화 후 비어 있거나 중복이면 오류다. `updatedAt`은 `publishedAt`보다 앞설 수 없다. 썸네일은 `/media/` 아래 png·jpg·webp·svg 또는 자격 정보 없는 HTTPS URL을 사용하며 `alt`가 필요하다. 선택 `position.x`, `position.y`는 0~100의 백분율이다.

`config/tags.json`은 표시 이름과 별칭을 보완하며 태그 허용 목록이 아니다. 초안·미래 발행 글은 공개 출력에서 제외한다. `example` 글은 운영 빌드에서 제외하며 합성 데모 입력은 명시적인 데모 모드에서만 사용한다. 빌드 모드는 [개인 사이트 발행](publication.md#실행과-댓글)에 있다.

본문의 첫 문단이 `description`과 같으면 그 문단이 도입문이 된다. 다르면 `description`이 도입문이고 본문은 그대로 이어진다.

### 화면 구조

글 상세는 날짜, 제목, 도입문, 태그, 선택 대표 이미지, 본문 순서로 조립하고 댓글은 본문 뒤에 둔다. 글의 장식 아이콘이나 필수 썸네일은 없다. 이미지가 없으면 상세와 피드에 빈 영역을 만들지 않는다. Search 카드는 제목 표지를 자동으로 표시하며 별도 이미지를 준비하지 않아도 된다. 카드 태그는 숨기고 본문 태그와 검색 필터는 유지한다. 태그와 글 링크는 독립적으로 동작한다. 카드·본문·조작의 표현과 반응형 배치는 [공통 디자인](styles.md)이 소유한다.

본문의 제목은 페이지 제목과 충돌하지 않도록 조정한다. 쓴 단계는 `app-heading-N` 클래스로 남아 공통 크기와 여백을 사용한다. 개인 위키 미리보기의 본문 목차는 공개 Blog와 분리한다. 작성자가 넣는 관련 글 카드는 `cards related`를 사용한다. Blog 상세의 자동 관련 글은 [선정 기준](publication.md#문서와-블로그-탐색)을 따른다.

목차를 사용하는 개인 미리보기에서 목차는 제목의 읽을 글자만 표시한다. 인라인 코드·강조·링크의 문법 표식과 링크 주소는 제외하고 이미지 대체 글자·키와 메뉴의 이름·수식 원문은 남긴다. 이스케이프한 문자와 코드 안의 기호는 그대로 표시하며 HTML로 실행하지 않는다. 대체 글자가 없는 이미지만 쓴 제목은 빈 링크가 되지 않게 원문을 유지한다. 제목 ID는 원문 기준을 유지하므로 기존 앵커 주소는 바뀌지 않는다.

### 지원 문법

| 구분 | 문법 | 비고 |
|---|---|---|
| 제목 | `#`~`######` | 제목 ID는 글 ID를 앞에 붙이고 겹치면 번호를 올린다 |
| 문단·줄바꿈 | 빈 줄, 줄 끝 공백 둘 또는 `\` | |
| 강조 | `*기울임*` `**굵게**` `***둘 다***` `~~취소선~~` | |
| 표시 | `==표시==` `::표시::` | `<mark>` |
| 첨자 | `H~2~O` `x^2^` | 공백 없는 낱말만. `~5분 ~10분`처럼 공백이 끼면 글자 그대로 |
| 인라인 코드 | `` `코드` `` | 백틱이 있으면 바깥에 둘 |
| 링크 | `[글](주소 "제목")` `[글][참조]` `<주소>` 본문 주소 | `http(s)`, `mailto`, 사이트 안 경로, 앵커만. `javascript:`·`data:`·`vbscript:`·`file:`은 링크가 되지 않는다 |
| 이미지 | `![대체](경로 "제목")` | 지연 로딩, 본문 폭 제한 |
| 인용 | `>` | 중첩 가능 |
| 목록 | `-` `*` `+` `1.` | 중첩·문단 포함 가능 |
| 작업 목록 | `- [ ]` `- [x]` `- [~]` | 읽기 전용, `[~]`는 취소 |
| 표 | GFM 표, `:--` `:-:` `--:` 정렬 | 좁은 화면에서 표만 가로 스크롤 |
| 구분선 | `---` `***` `___` | |
| 이스케이프 | `\*` `\_` `\#` 등 | |
| 각주 | `[^이름]` `[^이름]: 본문` `^[인라인]` | 글마다 ID가 분리된다 |
| 정의 목록 | 용어 줄 다음 `: 설명` | `markdown-it-deflist`의 의미를 따른다. 여러 문단과 블록 포함 가능 |
| 접기 | `<details>`(`open` 선택), `<summary>글자</summary>` | `details`는 `open`만, `summary`는 속성 없이 사용한다. 요약의 인라인 서식과 본문은 Markdown이며 펜스 코드 안의 `</details>`는 짝이 아니다 |
| 수식 | `$...$`, `$$...$$` | KaTeX. 아래 절 |
| 도표 | ` ```diagramplay ` | DiagramPlay. 아래 절 |
| 키·메뉴 | `:kbd[⌘ K]` `:menu[파일]` | |
| 아이콘·설명 | `:icon[search]` `:tip[글]{text="설명"}` | 아래 "구성 블록" 절 |
| 구성 블록 | `:::note` `:::steps` 등 | 아래 "구성 블록" 절 |
| 코드 블록 | 펜스와 언어, 4칸 들여쓰기 | 아래 절. 들여쓴 블록은 plaintext로 같은 머리글·복사 |

HTML은 글자로 출력하고 실행하지 않는다. `<details>`와 `<summary>`만 위 조건에서 구조로 받아들인다. `open` 외 속성이 있거나 닫히지 않은 `<details>`, 속성이나 HTML 태그가 섞인 `<summary>`는 글자로 남는다. 요약의 Markdown 강조·링크·인라인 코드는 지원한다.

#### 원본 글 요소

Things 블로그 글의 작은 글씨 문단과 이미지 묶음은 선택 구성 요소로 쓴다. 임의 HTML은 받지 않는다.

- `ui:fineprint`: `body` 한 문단(인라인 Markdown 허용). 원본 `p.fineprint` 값을 쓴다.
- `ui:figure-grid`: `items`의 `src`, `alt`, `caption`, `href`, `rounded`. `columns`(1~6)와 `size`(`small`, `large`)는 원본 `newgrid`의 `has-N-columns`, `is-small`, `is-large`와 같다. 지정하지 않으면 공통 이미지 묶음의 반응형 배치를 사용한다.
- 링크 `href`는 `https://`, `mailto:`, `#`, 또는 `/blog/foo/`처럼 `/`로 시작하는 사이트 경로만 받는다. `//`로 시작하는 주소, 역슬래시, 공백·제어 문자, `javascript:`는 빌드 오류다.

````markdown
```ui:fineprint
body: 이 글은 평소보다 기술적입니다. [요약](#summary)만 읽어도 됩니다.
```

```ui:figure-grid
columns: 2
items:
  - { src: sample-a.png, alt: 오늘 화면, caption: 첫 캡션, href: /blog/foo/, rounded: true }
  - { src: sample-b.png, alt: 알림 화면, caption: 둘째 캡션 }
```
````

- `ui:figure`도 `href`와 `rounded`를 받는다. `rounded` 이미지는 공통 그림의 곡률을 사용한다.

#### 수식

`:kbd[Ctrl] 수식 $x^2$`처럼 키·메뉴·아이콘·설명 뒤에 수식을 쓸 수 있다. 지시어는 완결된 인라인 요소이므로 뒤의 수식을 HTML 내부로 취급하지 않는다. 제목과 문단에 같은 규칙을 적용하고, 목차에서는 지시어의 원본 라벨과 수식 내용을 사용한다. 이미지 대체 텍스트에도 지시어의 원본 라벨을 남긴다.

`$...$`(한 줄)와 `$$...$$`(블록)를 쓴다. 빌드할 때 `@vscode/markdown-it-katex`와 KaTeX가 HTML과 MathML로 만들어 두므로 읽는 쪽에서 스크립트를 실행하지 않는다. 숫자 앞의 `$5`, 공백으로 끝나는 `$` 쌍, 코드 범위와 코드 블록 안의 `$`, `\$`는 수식이 아니다. 틀린 수식은 빌드를 멈추지 않고 원문을 흐린 점선 밑줄(`katex-error`)로 보여 준다. `trust`를 끄고 있어 `\href`, `\includegraphics`, `\htmlClass` 등은 링크나 요소를 만들지 못하고 글자로 남는다. 긴 수식은 `.katex-block` 안에서 가로로 스크롤한다. 수식이 있는 페이지만 `/katex/katex.css`(font-display swap)와 필요한 woff2 글꼴을 싣는다. 글꼴은 모두 로컬이고 woff·ttf는 배포하지 않는다.

#### 선택 기능

DiagramPlay 도표(` ```diagramplay `)는 선택 기능이다. `config/features.json`에서 켜며, 파일이 없거나 값을 생략하면 꺼짐이라 일반 Markdown 블로그로 동작한다. 꺼진 기능을 글에 쓰면 해당 줄 번호와 켜는 설정 이름이 담긴 오류로 빌드가 멈춘다. 없앤 `tabs` 키를 적으면 알 수 없는 기능 오류다.

```json
{ "diagrams": true }
```

`config/features.json`은 홈페이지가 소유하는 설정이며 Vault 동기화 대상이 아니다. 개인 미리보기도 같은 설정 폴더의 값을 읽는다.

#### 도표

`diagramplay` 펜스에는 첫 줄에 `diagramplay`만 적은 원본을 넣는다. 버전 숫자는 붙이지 않는다. 문서 빌드가 DiagramPlay 공개 API로 도표 HTML을 미리 만들고 `DiagramEmbed`로 삽입한다. 같은 결과는 내용 해시로 한 파일만 배포한다.

카드·선은 한 번 선언하고 `scene "이름"`으로 장면을 나눈다. 빈 장면은 정지, 이동이 있는 장면은 한 번 재생이 기본이다. 반복은 `mode=loop`, 배속은 `speed=`, 연속 트래픽은 `track … every= …`로 표현한다. 장면 선택 줄은 갤러리 선택 줄과 같은 공통 부품이다.

작성 기준은 하나다. 같은 카드와 선이 단계별로 바뀌면 DiagramPlay `scene`으로 쓰고, 서로 다른 그림·글·코드는 문단으로 소개해 차례로 둔다. 문법 복사·HTML 다운로드·전체화면은 도표 프레임에서 제공한다.

차트의 외부 data 파일과 사용자 아이콘 폴더는 문서 삽입에서 허용하지 않는다. 오류는 문서 경로와 함께 빌드를 실패시킨다. 브라우저는 레이아웃을 계산하지 않고 시간표를 재생하며, 필요한 페이지에만 프레임 크기·테마 연결 코드를 싣는다. `mermaid`는 일반 코드 블록으로 표시한다.

#### 지원하지 않는 것

- 임의 HTML, 인라인 스타일, 스크립트, iframe.
- KaTeX가 신뢰하지 않는 명령과 임의의 실행 코드.
- ` ```math ` 펜스(수식은 `$$`로 쓴다), 도표의 외부 데이터·아이콘 파일 로딩.

### 구성 블록

단계, 영상, 안내, 질문과 답, 카드 링크는 `:::` 블록으로 쓴다. 안쪽은 일반 Markdown이라 JSON이나 이스케이프한 문자열이 필요 없다. 기존 ` ```ui:이름 ` 블록은 그대로 동작하고 둘을 섞어 쓸 수 있다. 조립한 본문은 Vault 미리보기에서 확인한다. 기기마다 다른 안내는 기기 이름을 밝힌 문단 한 줄 뒤에 차례로 쓴다.

````markdown
Mac에서는 메뉴 막대에서 시작합니다.

:::steps
1. :menu[파일]을 열고 :kbd[⌘ N]을 누릅니다.
2. 사이드바의 :icon[document] 표시를 확인합니다.
:::

::video src=sample-c.mp4 poster=sample-c.png alt="Mac 화면" caption="목록을 만드는 과정"

:::note
일반 Markdown **안내문**
:::
````

#### 문법

| 형태 | 의미 |
|---|---|
| `:::이름 옵션`과 `:::` | 본문이 있는 블록. 안쪽에 일반 Markdown을 쓴다 |
| `::이름 옵션` | 본문이 없는 한 줄 블록. 이미지·영상·카드의 내용 속성을 같은 줄에 쓴다 |
| `:이름[글]{속성}` | 문장 안 표기. 중괄호는 뒤 문장과 내용 속성을 구분한다 |

- 표시 옵션은 `이름=값`을 공백으로 조합한다. 폭은 `width=narrow`, `width=wide`, 카드는 `variant=centered columns=2`처럼 쓴다. 값 없는 이름은 참거짓 옵션(`rounded`, `controls`)만 쓴다. 임의의 CSS 클래스나 값은 받지 않는다.
- 기본값은 생략한다. 주소·제목·대체 글·캡션·파일 이름은 표시 옵션이 아닌 내용이므로 `src=파일`, `alt="화면 설명"`, `filename=main.ts`처럼 쓴다.
- 표시 옵션과 내용 속성의 순서는 자유다. 같은 옵션을 여러 번 쓰거나 같은 역할에 다른 값을 지정하면 오류다. 해당 구성 요소가 지원하지 않는 옵션도 오류다.
- 이름은 소문자 영문·숫자·`-`. 블록 줄은 줄 맨 앞에서 시작하고 들여쓰기 4칸 이상은 코드다.
- 제목이 필요한 블록은 `:::note[제목]`처럼 라벨을 붙인다. 라벨은 한 줄 1~80자이고 `]`를 넣을 수 없다.
- 내용 값에 공백이 있으면 큰따옴표를 쓴다. 그 안의 따옴표는 `\"`, 역슬래시는 `\\`로 쓴다. 옵션과 속성은 한 줄에 합계 12개, 값은 300자까지다.
- `:::`는 가장 안쪽 열린 블록을 닫는다. `::이름{속성}` 한 줄 블록은 함께 쓸 수 있다. 탭 문법(`:::tabs`·`:::platform`·`@tab`·`:::end`, `ui:tabs`·`ui:platform`)은 없앴다. `:::tabs`·`:::platform`·`:::end`는 다른 알 수 없는 블록과 같은 오류이고 `@tab` 줄은 일반 문단이다. 옛 `::::tabs`+`:::tab[이름]`, 콜론 수를 맞춘 닫는 줄, `w-wide`·`box`·`top` 같은 약칭 옵션도 받지 않는다.
- 코드 펜스와 4칸 이상 들여쓴 코드 안의 구성 문법은 해석하지 않는다. `::표시::` 강조 표기는 그대로다.

| 표시 역할 | 권장 옵션 | 적용 대상 |
|---|---|---|
| 폭 | `width=narrow`, `width=wide` | 그림·영상·갤러리·코드블록·DiagramPlay |
| 카드 모양 | `variant=related`, `variant=centered`, `variant=grouped`, `variant=inline` | 카드 목록 |
| 카드 열 수 | `columns=1`, `columns=2` | 기본·가운데·그룹 카드 목록 |
| 그림 모서리 | `rounded` | 그림 |
| 기기 프레임 | `frame-iphone` | 영상. 틀은 공통 CSS가 그리며 별도 그림을 쓰지 않는다 |

내용 속성과 표시 옵션은 `parseOptions` 하나에서 읽고 각 블록의 속성 명세로 검사한다. 폭 값은 테마의 `WIDTHS`를 공유한다. 스타일 값을 글마다 직접 지정하지 않는다.

#### 블록

| 블록 | 라벨 | 속성 | 놓는 곳 | 본문 |
|---|---|---|---|---|
| `note`, `warning` | 선택(기본 "참고", "주의") | 없음 | 문서 바로 아래 | Markdown. 다른 블록은 둘 수 없음 |
| `fineprint` | 없음 | 없음 | 문서 바로 아래 | 문단만. 작은 글씨 |
| `steps` | 없음 | 없음 | 문서 바로 아래 | 목록만. 항목 사이를 넓힌다 |
| `qa` | 없음 | 없음 | 문서 바로 아래 | 정의 목록(`질문` 다음 줄 `: 답`)만 |
| `cards` | 없음 | `variant=related`, `variant=centered`, `variant=grouped`, `variant=inline`, `columns=1`, `columns=2` | 문서 바로 아래 | `card`만 1개 이상 |
| `card`(리프) | 없음 | `title`·`href` 필수, `description`, `icon` | `cards` 안 | 없음 |
| `gallery` | 없음 | `title`(접근성 이름), 폭 옵션 | 문서 바로 아래 | `slide`만 1개 이상. 라벨이 없으면 번호 선택 줄이다. `ui:gallery`와 같은 마크업·스크립트 |
| `slide`(리프) | 없음 | `src`·`alt` 필수, `caption` | `gallery` 안 | 없음 |
| `figure`(리프) | 없음 | `src`·`alt` 필수, `caption`, `href`, `rounded`, 폭 옵션 | 문서 바로 아래 | 없음 |
| `video`(리프) | 없음 | `src`·`poster`·`alt` 필수, `caption`, `frame-iphone`, 폭 옵션 | 문서 바로 아래 | 없음 |

- 블록은 문서 바로 아래에만 둔다. 안에 다른 블록을 두는 것은 `cards` > `card`, `gallery` > `slide`뿐이다. 목록과 인용 안에서는 블록을 쓸 수 없다.
- `note`, `warning` 안에서는 제목, 각주, 코드 블록, 이미지 등 일반 Markdown을 쓸 수 있다. `fineprint`, `steps`, `qa`, `cards`는 위 표의 본문 제한을 따른다. 제목과 각주 ID는 글 전체에서 겹치지 않는다.
- `src`와 `poster`는 `content/assets/`에 있는 파일 이름만 쓴다. 경로, `..`, 없는 파일은 오류다.
- `href`는 위 "원본 글 요소"와 같은 규칙이다(`https://`, `mailto:`, `#`, `/`로 시작하는 사이트 경로).
- `cards`의 글 끝 "이어서 읽을 글"에는 `related`를 쓴다. 작은 아이콘, 제목 한 줄, 갈매기표로 된 한 줄 카드이고 `description`은 그려지지 않는다. 긴 제목은 말줄임으로 줄이고(전체 글은 읽기 도구가 읽는다) 좁은 화면에서는 한 열이다. 글 하단에 자동으로 붙는 "함께 읽기"와 "이 문서의 수정 제안" 링크는 없다. 나머지 변형은 다른 용도의 기존 표현이다.
- 선택 카드의 `icon`은 공통 카탈로그 이름이다. 본문 카드 문법의 선택 기능이며 공개 글 메타데이터에 장식 아이콘을 요구하지 않는다.

#### 블록 폭

그림, 영상, 갤러리, 코드블록은 같은 폭 옵션을 쓴다. 문단은 본문 폭이다.

| 옵션 | 폭 |
|---|---|
| 생략 | 본문 폭 |
| `width=narrow` | 좁은 미디어 폭(`width-narrow`) 이하로 가운데 배치 |
| `width=wide` | 공통 넓은 미디어 폭(`width-wide`)으로 본문 밖까지 확장. 좁은 화면은 공통 여백 유지 |

````markdown
::figure width=narrow rounded src=sample-a.png alt="오늘 화면"

::video width=wide src=sample-c.mp4 poster=sample-c.png alt="Mac 화면"

```js width=wide filename=main.js
const message = "넓은 코드블록";
```
````

- 갤러리도 `:::gallery{width=wide}`로 쓴다. 같은 규칙이 갤러리 전체에 적용된다.
- 블록 폭은 `width` 하나로 정한다. 기본값 `width=content`는 생략과 같다. 같은 폭을 중복 지정하거나 다른 폭을 함께 지정하면 오류다. 옛 블록 속성 `wide`와 `size=compact`는 받지 않는다. `ui:video`의 플레이어 치수·비율(`width`, `height`, `wide`), 그림 격자의 `size`, 카드의 `compact`는 블록 폭과 다른 속성으로 유지한다.
- DiagramPlay도 `diagramplay`, `diagramplay width=wide`, `diagramplay width=narrow`로 같은 폭 규칙을 사용한다. 도표의 측정 크기는 초기 iframe 크기에만 쓰며 최종 표시 폭은 본문 블록이 정한다. 높이는 내용에 맞춰 갱신해 본문 도표에 별도 세로 스크롤을 만들지 않는다. 전체화면으로 확대했을 때는 그림 안에서 이동할 수 있다.
- 폭은 공통 구성 요소가 클래스(`app-width-narrow`, `app-width-wide`)로 정하고 값은 테마 토큰이다. CSS나 픽셀 값을 글마다 직접 넣지 않는다.

#### 미디어 지원 범위

| 입력 | 현재 동작 |
|---|---|
| `![대체 글](주소)` | Markdown 이미지. 대체 글을 캡션으로 표시하지 않는다 |
| `::figure src=파일 alt="설명"` | 로컬 이미지. `caption`을 쓴 경우에만 아래 설명 표시 |
| `::video src=영상.mp4 poster=미리보기.png alt="설명"` | 로컬 MP4 재생. 승인한 영상과 미리보기 파일을 자산으로 동기화 |
| 영상의 `caption` | 작성한 설명을 영상 아래에 표시. 생략하면 설명 없음 |
| 영상의 재생 조작 | 영상 안에서 시작·일시정지·탐색. 재생이 시작되면 브라우저 재생 막대 표시 |
| 영상 아래 Play 버튼 | 본문 영상에는 없음. 홈의 프로젝트 영상 보기 링크는 별도 구성 요소로 유지 |
| YouTube URL | 일반 링크. 플레이어로 자동 변환하지 않는다 |
| YouTube·Vimeo 삽입, 원격 동영상 URL | 전용 구성 요소 없음. `::video`의 파일 검사에서 거부 |
| 임의 `<iframe>` | 실행하지 않고 글자로 표시 |
| 파일 업로드·미리보기 자동 생성 | 작성 도구 없음. 저장소의 파일을 작성자가 준비 |

본문 영상은 외부 재생 버튼 없이 영상 내부에서 조작한다. `caption`을 생략하면 설명이나 빈 캡션 공간이 없다. 기존 `controls`와 `controls=true`는 호환하며 생략과 같다. `::video controls=false`는 오류다. 홈의 프로젝트 영상 보기 링크는 이 규칙의 대상이 아니다.

영상 형식은 MP4로 고정되어 있다. 오디오 플레이어, 자막 파일, 재생 속도·시작 시간·자동 반복·자동 재생을 지정하는 Markdown 옵션은 없다. 브라우저 기본 재생 막대가 제공하는 기능과 문법으로 지정할 수 있는 옵션은 구분한다.

#### 문장 안 표기

| 표기 | 출력 |
|---|---|
| `:kbd[⌘ K]`, `:menu[파일]` | 키캡, 메뉴 이름 |
| `:icon[이름]` | 문장 속 작은 콘텐츠 아이콘. 장식이라 읽어 주지 않으므로 뜻을 글로도 쓴다 |
| `:tip[글]{text="설명"}` | 글 아래 점선, 누르면 열리는 설명. 키보드로 열 수 있고 Esc나 바깥 누름으로 닫힌다. 설명은 글자만(Markdown 없음) |

속성은 `icon`·`tip`만 받는다. 이름이 목록에 없는 `:이름[...]`은 그대로 글자로 남는다. 코드 범위와 코드 블록 안은 해석하지 않는다.

#### 오류

잘못된 블록은 빌드를 멈추고 `문서ID 본문 N줄 :이름: 내용` 형식으로 알린다. 줄은 글 본문의 첫 줄이 1이다. 닫히지 않은 블록, 여는 줄 없는 닫는 줄, 기존 형식의 콜론 수 불일치, 알 수 없는 이름, 허용하지 않거나 겹치는 속성, 필수 속성 누락, 잘못된 주소, 없는 자산·아이콘, 놓을 수 없는 자리, 본문에 둘 수 없는 요소가 모두 같은 형식이다. 없앤 `:::tabs`·`:::platform`·`:::end`도 알 수 없는 이름으로 같은 형식의 오류다. 블록처럼 보이는 줄(`:::`로 시작)이 형식에 맞지 않아도 글자로 두지 않고 오류로 알린다.

#### 호환성

`:::` 블록은 같은 `app-*` 클래스와 마크업을 낸다. 단계 목록과 인라인 아이콘은 공통 테마의 `.app-steps`, `.app-inline-icon`을 사용한다. 동작은 기존 `document.js`(갤러리 선택 줄의 화살표·Home·End, 팝오버 설명)와 `video.js`를 그대로 쓴다. `ui:` 블록은 변경이 없고 `:::` 블록 안에서도, 반대로도 쓸 수 있다.

강조 상자, 카드, 갤러리, 코드 블록, 설명의 HTML은 테마의 구성 요소 모듈(`@woonyong-choi/design-tokens/ui/index.mjs`, 정의는 design-tokens `docs/styles.md`의 "구성 요소 모듈")이 한 번만 정의하고, `ui:` 호환 블록과 `:::` 블록이 같은 함수를 가져다 쓴다. 본문의 문법 해석과 구성 요소 조립은 문서 렌더러(`src/document`)가 맡고, `article-renderer.mjs`는 프로젝트 문서 정리와 소개 문단 분리를 연결한다. 페이지 조립은 `publication-layout.mjs`, `blog-layout.mjs`, `home-sections.mjs`, `post-article.mjs`, `document-navigation.mjs`가 맡는다. 홈 히어로 영상, 섹션 머리, 가로 흐름 목록, 블로그 카드, 쪽 이동, 태그 목록, 목차, 글 틀, 검색 결과 줄은 서버와 브라우저(`search-view.mjs`)가 같은 모듈을 쓰고, 브라우저는 구성 요소 출력만 `<template>`로 DOM에 옮긴다. 소비자에 남은 것의 분류는 design-tokens `docs/styles.md`의 "소비자가 소유하는 것"에 있다.

블록·인라인 규칙, 속성 검사, 블록 정의표는 문서 렌더러(`src/document/parser/directive-blocks.js`)가 소유한다. 다른 Markdown 해석기를 두지 않는다. 새 블록은 정의표에 허용 속성, 놓을 자리, 본문 규칙을, 출력 표(`src/document/renderer/directive-render.js`)에 출력을 한 항목씩 추가한다. 계약은 [문서 렌더러](document-renderer.md)에 있다.

### 코드 블록

펜스 첫 낱말이 언어이며 대소문자를 구분하지 않는다. 문서 렌더러가 등록한 highlight.js 언어와 별칭을 지원한다. TextMate 문법이 있는 언어는 빌드 때 Shiki로 분석하고, 나머지는 highlight.js로 분석한다. 정적 빌드에서는 한 줄 분석 시간 제한을 해제해 scope와 토큰이 서로 다른 위치에서 잘리는 것을 방지한다. 대표 언어는 JavaScript(`js`), TypeScript(`ts`), Python(`py`), C, C++(`cpp`, `c++`), C#(`cs`, `c#`), Java, Kotlin(`kt`), Rust(`rs`), Go(`golang`), Swift, Bash(`sh`, `zsh`), SQL, JSON, YAML(`yml`), HTML(`xml`), CSS, Dockerfile(`docker`), Markdown(`md`)이다. 등록되지 않은 언어, 언어 없는 블록, `text`는 `plaintext`로 원문을 이스케이프해 보여 준다.

승인 원문에서 가져온 `run-python`, `run-c`, `run-javascript`, `run-sql`, `run-shell`, `run-web` 펜스는 각각 Python, C, JavaScript, SQL, Bash, HTML 코드로 표시한다. 언어 이름 뒤에 `실행 미지원`을 붙여 원문의 Run·Preview 설명과 이 사이트의 기능을 구분한다. 실행 버튼이나 결과 영역은 만들지 않으며 코드 본문과 복사 원문은 바꾸지 않는다. 등록되지 않은 `run-*`도 다른 알 수 없는 언어처럼 Plain text로 표시한다.

#### 구문 역할과 색

[IntelliJ Language Defaults](https://plugins.jetbrains.com/docs/intellij/color-scheme-management.html)의 공통 역할을 참고한다. IntelliJ 테마의 색·글꼴을 가져오지 않는다. 문서 렌더러의 코드 강조는 문법 분석 결과의 scope를 역할에 연결하고, 테마의 `SyntaxToken`이 `app-syntax-*` 클래스를 출력한다. 색·굵기는 공통 테마의 `color.syntax-*`와 기존 글꼴 토큰이 정한다. 분석기의 인라인 색과 외부 테마 CSS는 출력하지 않는다. 브라우저는 분석기를 내려받지 않는다.

| 역할 | 연결 대상 | 테마 토큰 |
|---|---|---|
| `function` | 함수·메서드 선언과 호출, 셸 명령 | `color.syntax-function` |
| `type` | 클래스·인터페이스·타입 이름 | `color.syntax-type` |
| `property` | 프로퍼티·필드, JSON 키, 마크업 속성 | `color.syntax-property` |
| `parameter` | 문법이 식별한 매개변수 | `color.syntax-parameter` |
| `variable` | 문법이 식별한 변수 | `color.syntax-variable` |
| `constant` | 문법이 식별한 상수 | `color.syntax-constant` |
| `keyword` | 예약어, 불리언·null 리터럴 | `color.syntax-keyword` |
| `string`, `number`, `comment` | 문자열·숫자·주석 | 같은 이름의 `color.syntax-*` |
| `operator`, `punctuation`, `annotation` | 연산자·구분자·애노테이션 | 같은 이름의 `color.syntax-*` |

Java의 필드 선언과 지역 변수는 문법의 클래스·메서드 범위로 구분한다. Python의 호출·속성 접근과 JSON 키는 해당 문법의 scope를 연결한다. 코드 문자열에 별도 정규식을 덧씌워 함수나 변수를 추정하지 않는다.

IntelliJ의 PSI·심볼 해석을 실행하는 것은 아니다. 외부 타입, 오버로드, 상속, 같은 이름의 서로 다른 변수까지 해석하지 않는다. Kotlin 문법이 매개변수와 지역 변수를 분류하지 않는 자리, 그 밖에 scope가 없는 이름은 기본 글자색으로 남는다. 불완전한 코드도 가능한 범위에서 표시하고 원문을 보존한다.

#### 코드 표시와 복사

블록 안 머리글에 언어 이름이 왼쪽, 공통 도구 막대의 복사 단추가 오른쪽에 있다(이름은 `aria-label`, 결과는 상태 영역과 `data-state`로 알린다). 구문 색은 테마의 의미 색(`syntax-*`)을 따른다. 코드는 블록 폭에 맞춰 줄바꿈하고(`pre-wrap`, 공백 없는 긴 낱말은 `overflow-wrap: anywhere`) 가로 스크롤은 없다. 줄바꿈은 화면 표시일 뿐이라 복사 원문에는 영향이 없다. 머리글은 `pre` 밖에 있어 항상 고정이고 탭 너비는 4다. 복사는 렌더된 코드의 텍스트를 그대로 쓰므로 주석, 탭, 줄 끝 공백, 빈 줄이 보존된다. 스크립트가 없으면 버튼은 숨겨진 채 남는다. 복사에 실패하면 버튼과 상태 영역이 실패와 재시도를 알린다.

파일 이름이 꼭 필요할 때만 정보 문자열에 `filename=이름` 또는 `filename="공백 있는 이름"`을 덧붙이면 언어 이름 옆에 `TypeScript · main.ts`로 표시한다. 코드를 서버에서 실행하지 않는다.

안쪽 펜스를 보여 줄 때는 바깥 펜스를 더 길게 쓴다. ` ```ui:이름 ` 구성 요소와 안쪽 코드 블록도 같은 규칙을 따른다.

### 검증

문법 해석과 HTML 출력(CommonMark·GFM 구성 요소, 확장 문법, URL·HTML 이스케이프, plaintext 대체, 등록 언어와 별칭, 구성 블록의 중첩·속성 검사·오류 위치, 각주·제목 ID)은 `src/document/test`가 확인한다. `npm run check:product`가 이 시험과 그 출력을 쓰는 쪽의 시험을 함께 실행한다. 소개 문단 분리와 목차, 복사 원문과 동적 본문의 초기화, 갤러리 동작, 글 상세 구조, 예시 글의 코드 블록 원문 왕복과 ID 중복(`article-rendering.test.mjs`, `article-renderer.test.mjs`), 테마 토큰이 만드는 본문 치수, 수식 오류 복구와 자산의 페이지별 선택, 도표 원문 보존과 ID, 도표 렌더러의 보안 설정과 로더 상태 전환이 대상이다. 브라우저에서 보이는 모양은 이 시험이 보장하지 않으며 해당 URL에서 직접 확인한다.

코드와 도표는 공통 `ToolHeader`·`Toolbar`·`ToolButton`의 크기·아이콘·호버·초점·상태 알림을 사용한다. 복사 성공·실패·재시도는 공통 디자인의 `bindToolbar`와 그 시험이 소유한다. 도표의 대체 전체화면은 공통 `bindDiagramHost`가 송신자와 출처를 확인해 처리하고 전체화면 중 높이 알림은 무시한다. 소비자에서 별도 보정 CSS를 추가하지 않는다.

본문의 Markdown 표는 공통 `Table.open`·`Table.close`를 사용한다. 공통 디자인의 면·구분선·글자색·안쪽 여백을 상속하고 열 정렬은 문서의 지정값을 유지한다.

### 요구사항

| 요구사항 | 검증 계획 |
|---|---|
| 소개 문단은 전체 첫 문단이 일치할 때만 한 번 이동한다. | [`article-renderer.test.mjs`](../../src/article-renderer.test.mjs)의 `only_the_complete_first_paragraph_can_be_promoted` |
| 문서 렌더러 오류와 실패한 도표는 발행을 중단한다. | [`article-renderer.test.mjs`](../../src/article-renderer.test.mjs)의 `engine_diagnostics_and_failed_diagrams_stop_publication` |
