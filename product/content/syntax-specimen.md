---
{
  "title": "문서 작성 문법 전체 보기",
  "route": "/things/style-guide/",
  "layout": "article",
  "syntax": true,
  "icon": "markdown",
  "description": "문단부터 영상과 슬라이드까지, 이 사이트에서 사용할 수 있는 모든 문법을 실제로 확인합니다.",
  "keywords": "문법 syntax markdown 표 코드 영상 탭",
  "toc": true
}
---
이 페이지는 실제로 빌드되는 문서 문법 모음입니다. 아래의 모든 요소는 하나의 Markdown 원본에서 생성됩니다. 페이지 아래에서 원문을 내려받을 수 있습니다.

## Text and headings

::하이라이트::와 ::**굵은 강조**::를 조합할 수 있습니다.

일반 문단입니다. **굵은 글씨**, *기울임*, ***굵은 기울임***, ~~취소선~~, `inline code`와 [내부 링크](/things/support/)를 함께 사용할 수 있습니다.
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
| `코드` | [링크](/things/support/) | 200 |

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
npm run build:product
```

```text
알 수 없는 언어도 안전한 일반 텍스트로 표시합니다.
<script>여기 있는 태그는 실행하지 않습니다.</script>
```

## Links and footnotes

[참조 링크][support]와 자동 링크 <https://culturedcode.com/things/>를 사용할 수 있습니다. 설명을 각주로 분리할 수도 있습니다.[^sample]

[support]: /things/support/ "지원 문서"
[^sample]: 문서 하단으로 이동하고 다시 본문으로 돌아오는 각주 예시입니다.

## Images and captions

![일정 아이콘](/things/assets/symbols-things3-today.svg)

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
  "body": "**강조**와 [내부 링크](/things/support/)를 넣을 수 있습니다."
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
      "src": "os27-siriai-1-io65.jpg",
      "alt": "음성 입력 단계 1"
    },
    {
      "src": "os27-siriai-2-io65.jpg",
      "alt": "음성 입력 단계 2"
    },
    {
      "src": "os27-siriai-3-io65.jpg",
      "alt": "음성 입력 단계 3"
    },
    {
      "src": "os27-siriai-4-io65.jpg",
      "alt": "음성 입력 단계 4"
    },
    {
      "src": "os27-siriai-5-io65.jpg",
      "alt": "음성 입력 단계 5"
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
  "src": "meettheallnewthings.mp4",
  "poster": "meettheallnewthings-poster-e.jpg",
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
      "title": "Talk to Siri",
      "href": "/things/support/articles/2877019/",
      "icon": "siri",
      "description": "말풍선과 슬라이드 예시"
    },
    {
      "title": "Things Cloud",
      "href": "/things/support/articles/2803586/",
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
body: "[지원 문서로 돌아가기](/things/support/)"
```

## Feature section

```ui:feature
title: A reusable feature
icon: fancysection-icon-design-io70.png
description: 기능 소개 페이지와 같은 문법으로 섹션을 작성합니다.
body: "[전체 기능 페이지](/things/features/)에서 영상과 기기 탭을 확인하세요."
left: 왼쪽 설명에는 기능의 목적을 적습니다.
right: 오른쪽 설명에는 사용 흐름을 적습니다.
```

## Device frame

```ui:device
src: 2-today-iphone.png
title: 실제 기기 프레임에 맞춘 화면
```

## Shared video controls

하나의 기기 화면에서 여러 동작을 재생합니다. 재생 중인 버튼만 일시정지 상태로 표시됩니다.

```ui:demos
title: 여러 동작의 공유 플레이어
poster: 6-magicplus-1.png
items:
  - title: Create To-Dos
    body: 첫 번째 동작을 선택합니다.
    src: 6-magicplus-1.mp4
  - title: Create Headings
    body: 같은 화면에서 다음 동작으로 전환합니다.
    src: 6-magicplus-2.mp4
  - title: Drop to Inbox
    body: 세 번째 동작을 재생합니다.
    src: 6-magicplus-3.mp4
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
media: "![화면](/things/assets/10-reminders-mac.png)"
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
    body: "변경 사항과 [관련 글](/things/blog/)을 연결합니다."
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

지원 문서와 카드에서 사용하는 아이콘 전체입니다. 아이콘 이름으로 같은 자산을 재사용합니다.

```ui:cards
{
  "items": [
    {
      "title": "add",
      "icon": "add",
      "href": "/things/support/"
    },
    {
      "title": "applewatch",
      "icon": "applewatch",
      "href": "/things/support/"
    },
    {
      "title": "appstore",
      "icon": "appstore",
      "href": "/things/support/"
    },
    {
      "title": "calendar",
      "icon": "calendar",
      "href": "/things/support/"
    },
    {
      "title": "cloud",
      "icon": "cloud",
      "href": "/things/support/"
    },
    {
      "title": "download",
      "icon": "download",
      "href": "/things/support/"
    },
    {
      "title": "firstaid",
      "icon": "firstaid",
      "href": "/things/support/"
    },
    {
      "title": "gestures",
      "icon": "gestures",
      "href": "/things/support/"
    },
    {
      "title": "idea",
      "icon": "idea",
      "href": "/things/support/"
    },
    {
      "title": "keyboard",
      "icon": "keyboard",
      "href": "/things/support/"
    },
    {
      "title": "mailtothings",
      "icon": "mailtothings",
      "href": "/things/support/"
    },
    {
      "title": "markdown",
      "icon": "markdown",
      "href": "/things/support/"
    },
    {
      "title": "notes",
      "icon": "notes",
      "href": "/things/support/"
    },
    {
      "title": "notifications",
      "icon": "notifications",
      "href": "/things/support/"
    },
    {
      "title": "question",
      "icon": "question",
      "href": "/things/support/"
    },
    {
      "title": "reminders",
      "icon": "reminders",
      "href": "/things/support/"
    },
    {
      "title": "repeating",
      "icon": "repeating",
      "href": "/things/support/"
    },
    {
      "title": "search",
      "icon": "search",
      "href": "/things/support/"
    },
    {
      "title": "shortcuts",
      "icon": "shortcuts",
      "href": "/things/support/"
    },
    {
      "title": "siri",
      "icon": "siri",
      "href": "/things/support/"
    },
    {
      "title": "tags",
      "icon": "tags",
      "href": "/things/support/"
    },
    {
      "title": "urlscheme",
      "icon": "urlscheme",
      "href": "/things/support/"
    },
    {
      "title": "when",
      "icon": "when",
      "href": "/things/support/"
    },
    {
      "title": "widgets",
      "icon": "widgets",
      "href": "/things/support/"
    },
    {
      "title": "warning",
      "icon": "warning",
      "href": "/things/support/"
    },
    {
      "title": "faq",
      "icon": "faq",
      "href": "/things/support/"
    },
    {
      "title": "mac",
      "icon": "mac",
      "href": "/things/support/"
    },
    {
      "title": "iphone",
      "icon": "iphone",
      "href": "/things/support/"
    },
    {
      "title": "ipad",
      "icon": "ipad",
      "href": "/things/support/"
    },
    {
      "title": "vision",
      "icon": "vision",
      "href": "/things/support/"
    },
    {
      "title": "iphone-and-watch",
      "icon": "iphone-and-watch",
      "href": "/things/support/"
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
      "body": "### 개요\n\n**일반 탭**의 첫 번째 내용입니다. [지원 문서](/things/support/)로 이어집니다."
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
      "href": "/things/support/"
    },
    {
      "title": "기록",
      "icon": "notes",
      "description": "같은 크기와 간격을 유지합니다.",
      "href": "/things/support/"
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
      "href": "/things/support/"
    },
    {
      "title": "간단한 항목",
      "compact": true,
      "href": "/things/support/"
    }
  ]
}
```


## Centered cards

```ui:cards
{"variant":"centered","columns":2,"items":[{"title":"기기에서 시작하기","icon":"mac","description":"아이콘과 설명을 가운데에 배치합니다.","href":"/things/support/"},{"title":"함께 살펴보기","icon":"faq","description":"관련 안내를 같은 형태로 연결합니다.","href":"/things/support/"}]}
```

## Grouped links

```ui:cards
{"variant":"grouped","columns":2,"items":[{"title":"일정 안내","icon":"calendar","href":"/things/support/"},{"title":"아이콘 없는 안내","icon":false,"href":"/things/support/"}]}
```

## Inline links

```ui:cards
{"variant":"inline","items":[{"title":"Mac","icon":"mac","href":"/things/support/"},{"title":"iPhone","icon":"iphone","href":"/things/support/"},{"title":"지원 문서","icon":false,"href":"/things/support/"}]}
```


## Inline interface labels

문장 안에서 :kbd[⌘ Cmd] :kbd[I]를 눌러 기울임을 적용하거나 :menu[Edit] → :menu[Markdown] 메뉴를 선택합니다.

```text
문장 안에서 :kbd[⌘ Cmd] :kbd[I]를 누릅니다.
:menu[Edit] → :menu[Markdown] 메뉴를 선택합니다.
```
