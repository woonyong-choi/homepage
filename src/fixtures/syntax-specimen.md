이 문서는 Markdown 렌더러와 공통 구성 요소의 계약 테스트 입력입니다. 발행 페이지에는 포함하지 않습니다.

## Text and headings

::하이라이트::와 ::**굵은 강조**::를 조합할 수 있습니다.

일반 문단입니다. **굵은 글씨**, *기울임*, ***굵은 기울임***, ~~취소선~~, `inline code`와 [내부 링크](/docs/)를 함께 사용할 수 있습니다.
줄 끝 공백 두 개로  
강제 줄바꿈을 만들 수 있습니다.

### Third-level heading
#### Fourth-level heading
##### Fifth-level heading
###### Sixth-level heading

# First-level heading specimen

문서의 페이지 제목과 별개로 Markdown의 1단계 제목도 지원합니다.

## Lists and tasks

- [~] 취소된 작업도 별도 상태로 표시합니다.

- 첫 번째 항목
- 두 번째 항목
  - 중첩 항목
  - 또 다른 항목

1. 자료를 읽습니다.
2. 내용을 정리합니다.
   1. 작은 단계로 나눕니다.
   2. 결과를 확인합니다.

- [x] 완료한 작업
- [ ] 남은 작업

체크 목록은 문서 작성 상태를 표시합니다. 브라우저에서 임의로 바뀌지 않습니다.

## Quotes and separators

> 인용문의 예시입니다.
>
> 두 문단을 한 인용 블록에 넣을 수 있습니다.
> > 중첩된 인용도 지원합니다.

---

위는 문단 구분선입니다.

## Tables

| 항목 | 가운데 | 오른쪽 |
| :--- | :---: | ---: |
| 일반 텍스트 | **강조** | 100 |
| `코드` | [링크](/docs/) | 200 |

## Code blocks

```javascript
const task = { title: "Read a document", done: false };
function complete(item) {
  return { ...item, done: true };
}
console.log(complete(task));
```

```python
def summarize(items):
    return [item["title"] for item in items if not item["done"]]
```

```shell
npm run build:site
```

```text
알 수 없는 언어도 안전한 일반 텍스트로 표시합니다.
<script>여기 있는 태그는 실행하지 않습니다.</script>
```

## Links and footnotes

[참조 링크][docs]와 자동 링크 <https://github.com/woonyong-choi/homepage>를 사용할 수 있습니다. 설명을 각주로 분리할 수도 있습니다.[^sample]

[docs]: /docs/ "문서 목록"
[^sample]: 문서 하단으로 이동하고 다시 본문으로 돌아오는 각주 예시입니다.

## Images and captions

![문서 아이콘](/theme/assets/icons/small/document.svg)

```ui:figure
{
  "src": "2-today-mac.png",
  "alt": "캡션이 있는 이미지 예시",
  "caption": "캡션이 있는 이미지 예시",
  "wide": false
}
```

## Fineprint and figure grid

```ui:fineprint
{ "body": "작은 글씨 문단 예시입니다." }
```

```ui:figure-grid
{
  "columns": 2,
  "items": [
    { "src": "2-today-mac.png", "alt": "첫 이미지", "caption": "첫 캡션", "rounded": true },
    { "src": "10-reminders-mac.png", "alt": "둘째 이미지", "caption": "둘째 캡션" }
  ]
}
```

## Notes and warnings

```ui:callout
{
  "title": "Note",
  "fineprint": true,
  "body": "**강조**와 [내부 링크](/docs/)를 넣을 수 있습니다."
}
```

```ui:callout
{
  "tone": "warning",
  "title": "Important",
  "body": "주의할 내용을 별도 배경으로 표시합니다."
}
```

## Platform tabs

```ui:platform
{
  "items": [
    {
      "label": "Mac",
      "body": "### Mac instructions\n\n1. 목록을 엽니다.\n2. 작업을 추가합니다.\n\n```ui:keys\n{\n  \"keys\": [\n    \"⌘\",\n    \"N\"\n  ]\n}\n```\n"
    },
    {
      "label": "iPhone & iPad",
      "body": "### Mobile instructions\n\n1. 추가 버튼을 누릅니다.\n2. 제목을 입력합니다."
    }
  ]
}
```

위에서 선택한 기기는 아래 안내에도 반영됩니다. 아래 블록만 전환하면 위쪽 선택은 유지됩니다.

```ui:platform
{
  "title": "이어서 확인할 기기별 안내",
  "items": [
    {"label": "Mac", "body": "**Mac 후속 안내**입니다. 메뉴에서 다음 단계를 선택합니다."},
    {"label": "iPhone & iPad", "body": "**모바일 후속 안내**입니다. 화면에서 다음 단계를 선택합니다."}
  ]
}
```

## Numbered slideshow

```ui:gallery
{
  "wide": true,
  "title": "다섯 단계 예시",
  "slides": [
    {
      "src": "2-today-mac.png",
      "alt": "앱 화면 1"
    },
    {
      "src": "3-upcoming-mac-2.png",
      "alt": "앱 화면 2"
    },
    {
      "src": "4-headings-mac.png",
      "alt": "앱 화면 3"
    },
    {
      "src": "5-checklists-mac-2.png",
      "alt": "앱 화면 4"
    },
    {
      "src": "7-quickfind-mac.png",
      "alt": "앱 화면 5"
    }
  ]
}
```

## Before and after

```ui:gallery
{
  "selected": 1,
  "slides": [
    {
      "src": "repeating-comparison-1-io80.png",
      "label": "Before",
      "alt": "변경 전 반복 작업",
      "caption": "변경 전에는 반복 작업의 표시가 달랐습니다."
    },
    {
      "src": "repeating-comparison-2-io80.png",
      "label": "Now",
      "alt": "변경 후 반복 작업",
      "caption": "변경 후에는 체크 상자가 함께 표시됩니다."
    }
  ]
}
```

## Video player

```ui:video
{
  "src": "3-upcoming-mac-2.mp4",
  "poster": "3-upcoming-mac-2.png",
  "title": "기능 소개 영상"
}
```

## Details and definitions

```ui:details
{
  "title": "펼쳐서 설명 보기",
  "body": "접힌 영역 안에도 **Markdown**을 사용할 수 있습니다.\n\n- 첫 번째 조건\n- 두 번째 조건"
}
```

```ui:definitions
{
  "items": [
    {
      "term": "정적 페이지",
      "body": "빌드 시 HTML로 생성하는 페이지입니다."
    },
    {
      "term": "구성 요소",
      "body": "자주 쓰는 문서 표현을 일정한 문법으로 재사용합니다."
    }
  ]
}
```

## Keyboard and tooltip

```ui:keys
{
  "label": "명령 실행",
  "keys": [
    "⌘",
    "Shift",
    "K"
  ]
}
```

```ui:tooltip
{
  "label": "Markdown",
  "description": "텍스트에 간단한 표시를 붙여 구조를 표현하는 문법입니다."
}
```

## Related article cards

```ui:cards
{
  "columns": 2,
  "items": [
    {
      "title": "문서 목록",
      "href": "/docs/",
      "icon": "siri",
      "description": "말풍선과 슬라이드 예시"
    },
    {
      "title": "블로그 목록",
      "href": "/blog/",
      "icon": "cloud",
      "description": "링크 카드와 정의 목록 예시"
    }
  ]
}
```

## Form validation

```ui:form
{
  "message": true,
  "label": "Validate example"
}
```

## Component syntax

구성 요소는 `ui:종류` 코드 펜스에 YAML 또는 JSON으로 작성합니다. 아래는 실행되지 않는 문법 설명용 코드입니다.

````markdown

```ui:callout
{
  "title": "Note",
  "body": "이곳에 **Markdown**을 작성합니다."
}
```
````

지원 구성 요소: `callout`, `details`, `figure`, `video`, `gallery`, `tabs`, `cards`, `definitions`, `speech`, `keys`, `tooltip`, `form`, `group`, `feature`. HTML 원문과 스크립트는 실행하지 않습니다.


## Speech and grouped sections

```ui:speech
body: "Hey Siri, create a sample task."
```

```ui:group
title: Related reading
body: "[문서 목록으로 돌아가기](/docs/)"
```

## Feature section

```ui:feature
title: A reusable feature
icon: fancysection-icon-whatpeoplearesaying-io70.png
description: 공통 구성 요소의 문법으로 소개 구간을 작성합니다.
body: "[프로젝트 목록](/projects/)으로 이동하는 링크를 함께 표시합니다."
left: 왼쪽 설명에는 기능의 목적을 적습니다.
right: 오른쪽 설명에는 사용 흐름을 적습니다.
```

## Device frame

```ui:device
src: 3-upcoming-iphone.png
title: 실제 기기 프레임에 맞춘 화면
```

## Shared video controls

하나의 기기 화면에서 여러 동작을 재생합니다. 재생 중인 버튼만 일시정지 상태로 표시됩니다.

```ui:demos
title: 여러 동작의 공유 플레이어
poster: 3-upcoming-iphone.png
items:
  - title: iPhone
    body: 첫 번째 동작을 선택합니다.
    src: 3-upcoming-iphone.mp4
  - title: Mac
    body: 같은 화면에서 다음 동작으로 전환합니다.
    src: 3-upcoming-mac-2.mp4
```


## 기능 설명 목록

```ui:feature-list
{
  "items": [
    { "title": "입력", "body": "생각을 **간단한 항목**으로 기록합니다." },
    { "title": "정리", "body": "목록을 나누고 다음 행동을 고릅니다." }
  ]
}
```

## 문법 설명 행

```ui:syntax-examples
{"items":[{"title":"강조","source":"**bold**","body":"별표 두 개로 감싸 **굵게** 표시합니다."}]}
```

## 설명과 미디어 묶음

```ui:feature-pair
items:
  - title: 선택하기
    body: 설명과 기기 화면을 나란히 배치합니다.
media: "![화면](/assets/10-reminders-mac.png)"
```

## 문의 입력 양식

```ui:contact-form
privacy: 문의 내용을 처리하는 방식을 설명하는 예시입니다.
availability: 입력 검증만 실행하며 외부로 전송하지 않습니다.
```

## 상태와 출시 목록

```ui:status-board
updated: Example status
message: 상태 표시 예시입니다.
history: 지난 기록의 예시입니다.
items:
  - title: Example release
    body: "변경 사항과 [관련 글](/blog/)을 연결합니다."
    status: Released
    date: October 6, 2026
```

## 키보드 배열별 단축키

```ui:keyboard
{
  "languages": [
    {
      "value": "en-us",
      "label": "English (US)"
    },
    {
      "value": "en-gb",
      "label": "English (Great Britain)"
    },
    {
      "value": "en-int",
      "label": "English (International)"
    },
    {
      "value": "ar",
      "label": "Arabic"
    },
    {
      "value": "zh-pinyin",
      "label": "Chinese (Pinyin)"
    },
    {
      "value": "zh-zhuyin",
      "label": "Chinese (Zhuyin)"
    },
    {
      "value": "da",
      "label": "Danish"
    },
    {
      "value": "nl",
      "label": "Dutch"
    },
    {
      "value": "fi",
      "label": "Finnish"
    },
    {
      "value": "fr",
      "label": "French"
    },
    {
      "value": "fr-ch",
      "label": "French (Swiss)"
    },
    {
      "value": "fr-ca",
      "label": "French (Canada)"
    },
    {
      "value": "de",
      "label": "German"
    },
    {
      "value": "de-ch",
      "label": "German (Swiss)"
    },
    {
      "value": "hu",
      "label": "Hungarian"
    },
    {
      "value": "it",
      "label": "Italian"
    },
    {
      "value": "ja-kana",
      "label": "Japanese (Kana)"
    },
    {
      "value": "ja-romaji",
      "label": "Japanese (Romaji)"
    },
    {
      "value": "ko",
      "label": "Korean (2-set)"
    },
    {
      "value": "pt",
      "label": "Portuguese"
    },
    {
      "value": "es",
      "label": "Spanish"
    },
    {
      "value": "es-la",
      "label": "Spanish (Latin America)"
    },
    {
      "value": "ru",
      "label": "Russian"
    },
    {
      "value": "sv",
      "label": "Swedish"
    },
    {
      "value": "tr-q",
      "label": "Turkish Q"
    },
    {
      "value": "tr-f",
      "label": "Turkish F"
    },
    {
      "value": "other",
      "label": "Other"
    }
  ],
  "help": "키보드 배열에 따른 표시 전환 예시입니다. 단축키 데이터는 Markdown에서 언어별로 정의합니다.",
  "groups": [
    {
      "title": "Example",
      "rows": [
        {
          "label": "예시 작업 1 — 항목을 선택하고 동작합니다.",
          "keys": {
            "en-us": [
              "⌘ Cmd",
              "N"
            ],
            "ko": [
              "⌘ Cmd",
              "N (ㅜ)"
            ],
            "fr": [
              "⌘ Cmd",
              "N"
            ]
          }
        },
        {
          "label": "예시 작업 2 — 항목을 선택하고 동작합니다.",
          "keys": {
            "en-us": [
              "⌘ Cmd",
              "Return"
            ]
          }
        }
      ]
    }
  ]
}
```

## Icon catalog

문서 목록과 카드에서 사용하는 아이콘 전체입니다. 아이콘 이름으로 같은 자산을 재사용합니다.

```ui:cards
{
  "items": [
    {
      "title": "add",
      "icon": "add",
      "href": "/docs/"
    },
    {
      "title": "applewatch",
      "icon": "applewatch",
      "href": "/docs/"
    },
    {
      "title": "appstore",
      "icon": "appstore",
      "href": "/docs/"
    },
    {
      "title": "calendar",
      "icon": "calendar",
      "href": "/docs/"
    },
    {
      "title": "cloud",
      "icon": "cloud",
      "href": "/docs/"
    },
    {
      "title": "download",
      "icon": "download",
      "href": "/docs/"
    },
    {
      "title": "firstaid",
      "icon": "firstaid",
      "href": "/docs/"
    },
    {
      "title": "gestures",
      "icon": "gestures",
      "href": "/docs/"
    },
    {
      "title": "idea",
      "icon": "idea",
      "href": "/docs/"
    },
    {
      "title": "keyboard",
      "icon": "keyboard",
      "href": "/docs/"
    },
    {
      "title": "mailtothings",
      "icon": "mailtothings",
      "href": "/docs/"
    },
    {
      "title": "markdown",
      "icon": "markdown",
      "href": "/docs/"
    },
    {
      "title": "notes",
      "icon": "notes",
      "href": "/docs/"
    },
    {
      "title": "notifications",
      "icon": "notifications",
      "href": "/docs/"
    },
    {
      "title": "question",
      "icon": "question",
      "href": "/docs/"
    },
    {
      "title": "reminders",
      "icon": "reminders",
      "href": "/docs/"
    },
    {
      "title": "repeating",
      "icon": "repeating",
      "href": "/docs/"
    },
    {
      "title": "search",
      "icon": "search",
      "href": "/docs/"
    },
    {
      "title": "shortcuts",
      "icon": "shortcuts",
      "href": "/docs/"
    },
    {
      "title": "siri",
      "icon": "siri",
      "href": "/docs/"
    },
    {
      "title": "tags",
      "icon": "tags",
      "href": "/docs/"
    },
    {
      "title": "urlscheme",
      "icon": "urlscheme",
      "href": "/docs/"
    },
    {
      "title": "when",
      "icon": "when",
      "href": "/docs/"
    },
    {
      "title": "widgets",
      "icon": "widgets",
      "href": "/docs/"
    },
    {
      "title": "warning",
      "icon": "warning",
      "href": "/docs/"
    },
    {
      "title": "faq",
      "icon": "faq",
      "href": "/docs/"
    },
    {
      "title": "mac",
      "icon": "mac",
      "href": "/docs/"
    },
    {
      "title": "iphone",
      "icon": "iphone",
      "href": "/docs/"
    },
    {
      "title": "ipad",
      "icon": "ipad",
      "href": "/docs/"
    },
    {
      "title": "vision",
      "icon": "vision",
      "href": "/docs/"
    },
    {
      "title": "iphone-and-watch",
      "icon": "iphone-and-watch",
      "href": "/docs/"
    }
  ]
}
```

## Independent tabs

다른 탭의 선택과 연결되지 않는 일반 탭입니다.

```ui:tabs
{
  "title": "일반 탭 예제",
  "items": [
    {
      "label": "Overview",
      "body": "### 개요\n\n**일반 탭**의 첫 번째 내용입니다. [문서 목록](/docs/)로 이어집니다."
    },
    {
      "label": "Details",
      "body": "### 상세\n\n1. 내용을 선택합니다.\n2. 필요한 정보를 확인합니다."
    }
  ]
}
```

## Card variants

아이콘과 설명이 나란히 놓인 카드입니다.

```ui:cards
{
  "horizontal": true,
  "columns": 2,
  "items": [
    {
      "title": "일정",
      "icon": "calendar",
      "description": "아이콘과 설명을 가로로 배치합니다.",
      "href": "/docs/"
    },
    {
      "title": "기록",
      "icon": "notes",
      "description": "같은 크기와 간격을 유지합니다.",
      "href": "/docs/"
    }
  ]
}
```

아이콘을 생략한 링크와 간단한 항목입니다.

```ui:cards
{
  "columns": 2,
  "items": [
    {
      "title": "아이콘 없는 항목",
      "icon": false,
      "href": "/docs/"
    },
    {
      "title": "간단한 항목",
      "compact": true,
      "href": "/docs/"
    }
  ]
}
```


## Centered cards

```ui:cards
{"variant":"centered","columns":2,"items":[{"title":"기기에서 시작하기","icon":"mac","description":"아이콘과 설명을 가운데에 배치합니다.","href":"/docs/"},{"title":"함께 살펴보기","icon":"faq","description":"관련 안내를 같은 형태로 연결합니다.","href":"/docs/"}]}
```

## Grouped links

```ui:cards
{"variant":"grouped","columns":2,"items":[{"title":"일정 안내","icon":"calendar","href":"/docs/"},{"title":"아이콘 없는 안내","icon":false,"href":"/docs/"}]}
```

## Inline links

```ui:cards
{"variant":"inline","items":[{"title":"Mac","icon":"mac","href":"/docs/"},{"title":"iPhone","icon":"iphone","href":"/docs/"},{"title":"문서 목록","icon":false,"href":"/docs/"}]}
```


## Inline interface labels

문장 안에서 :kbd[⌘ Cmd] :kbd[I]를 눌러 기울임을 적용하거나 :menu[Edit] → :menu[Markdown] 메뉴를 선택합니다.

```text
문장 안에서 :kbd[⌘ Cmd] :kbd[I]를 누릅니다.
:menu[Edit] → :menu[Markdown] 메뉴를 선택합니다.
```
