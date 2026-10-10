---
id: example-document-composition
slug: document-composition
type: wiki
title: 기기마다 다른 안내를 한 문서로 쓰는 법
description: 기기별 탭, 단계 목록, 영상, 질문과 답, 관련 글 카드를 Markdown 블록만으로 한 문서에 구성하는 예시입니다.
tags: []
field: cs
contentIcon:
  name: document
visibility: public
comments: false
example: true
category: software-design
---

기기별 탭, 단계 목록, 영상, 질문과 답, 관련 글 카드를 Markdown 블록만으로 한 문서에 구성하는 예시입니다.

이 글은 가상의 할 일 앱 안내서를 쓰는 척하며 구성 문법을 하나씩 보여 줍니다. 앱의 기능이나 화면은 설명하지 않고, 실제 작성에 쓰는 원문 구조에 집중합니다. 아래 블록은 모두 이 파일의 원문을 그대로 복사해 고쳐 쓸 수 있습니다.

## 기기를 먼저 고르게 하기

같은 작업도 기기에 따라 순서가 다릅니다. `:::platform`으로 기기 탭을 만들고, 탭마다 단계와 영상을 넣습니다. 한 문서에 기기 탭이 여럿이면 한 곳에서 고른 기기가 아래 탭에도 따라갑니다. 탭은 `@tab 이름`으로 나누고 묶음은 `:::end`로 닫습니다.

:::platform
@tab Mac
:::steps
1. 메뉴 막대에서 :menu[파일]을 열고 :menu[새 목록]을 고릅니다.
2. 이름을 입력하고 :kbd[⌘ Return]을 누릅니다.
3. 사이드바에서 :icon[document] 표시가 붙은 항목이 새 목록입니다.
:::end

::video src=3-upcoming-mac-2.mp4 poster=3-upcoming-mac-2.png alt="Mac에서 예정 목록을 쓰는 화면"

:::fineprint
:kbd[⌘ Return] 대신 화면의 완료 버튼을 눌러도 됩니다.
:::end
@tab iPhone & iPad
:::steps
1. 목록 화면에서 오른쪽 아래의 더하기 버튼을 누릅니다.
2. 이름을 입력하고 키보드의 완료를 누릅니다.
3. 목록 상단의 :icon[document] 표시로 새 목록을 구분합니다.
:::end

::video src=3-upcoming-iphone.mp4 poster=3-upcoming-iphone.png alt="iPhone에서 예정 목록을 쓰는 화면" frame-iphone

:::note[알아 두기]
가로 모드에서는 목록과 상세가 나란히 보입니다. 단계는 같습니다.
:::end
@tab Watch
Watch에서는 목록을 만들지 않고 iPhone에서 만든 목록을 읽기만 합니다. 위의 **iPhone & iPad** 탭을 먼저 따라 하세요.
:::end

## 변경 전후를 탭으로 비교하기

`:::tabs` 뒤에 `@tab 이름` 줄마다 탭을 나누고 `:::end`로 닫습니다. 옵션을 쓰지 않으면 상자 없이 둥근 단추 줄이 패널 아래에 옵니다. 기본을 벗어나는 모양만 공백으로 구분한 옵션으로 적습니다. 탭 본문은 일반 Markdown입니다.

옵션 없는 기본 모양입니다. 이름은 단추 크기에 맞게 늘어납니다.

:::tabs
@tab Mac

메뉴 막대에서 새 목록을 만듭니다.

@tab iPhone & iPad

목록 화면에서 더하기 버튼을 누릅니다.

@tab Watch

iPhone에서 만든 목록을 읽기만 합니다.

:::end

`segmented`는 분할 선택 줄입니다. 같은 크기의 그림 두 장과 캡션 문단으로 만든 예시입니다.

:::tabs segmented
@tab 변경 전

![변경 전 화면](/things/assets/repeating-comparison-1-io80.png)

기존 화면입니다.

@tab 변경 후

![변경 후 화면](/things/assets/repeating-comparison-2-io80.png)

개선한 화면입니다.

:::end

이 탭의 원문입니다.

````markdown
:::tabs segmented
@tab 변경 전

![변경 전 화면](/things/assets/repeating-comparison-1-io80.png)

기존 화면입니다.

@tab 변경 후

![변경 후 화면](/things/assets/repeating-comparison-2-io80.png)

개선한 화면입니다.

:::end
````

이름 길이가 달라도 각 이름은 자기 길이만큼 자리를 차지하고, 긴 이름은 줄바꿈됩니다.

:::tabs segmented
@tab 변경 전

![변경 전 화면](/things/assets/repeating-comparison-1-io80.png)

기존 화면입니다.

@tab 변경 변경 변경 후

![변경 후 화면](/things/assets/repeating-comparison-2-io80.png)

개선한 화면입니다.

:::end

탭이 셋일 때도 이름마다 길이가 다릅니다. 내용 높이도 달라서 선택 줄은 지금 보이는 내용 바로 아래에 있습니다.

:::tabs segmented
@tab 요약

![변경 전 화면](/things/assets/repeating-comparison-1-io80.png)

그림이 있는 탭입니다.

@tab 자세한 변경 내용과 이유

![변경 후 화면](/things/assets/repeating-comparison-2-io80.png)

같은 크기의 그림이지만 이름이 깁니다.

@tab 문제가 생겼을 때 되돌리는 방법

그림이 없는 탭은 높이가 낮습니다. 선택 줄이 내용 바로 아래로 올라오는지 확인해 보세요.

:::end

- `box`: 탭 묶음 둘레에 상자를 둡니다(기본은 상자 없음)
- `top`: 선택 줄을 패널 위에 둡니다(기본은 아래)
- `segmented`, `numbers`: 선택 줄 모양(기본은 둥근 단추). 번호 모양은 `@tab` 이름을 생략할 수 있습니다.
- `w-wide`: 탭 묶음 전체를 넓은 미디어 폭으로 펼칩니다. 바깥 문단은 본문 폭입니다.

옵션은 모든 구성 블록과 코드 펜스에서 공백으로 조합합니다. 기본값은 생략하고, 주소나 제목 같은 내용은 `src=파일`, `alt="화면 설명"`처럼 적습니다. 이 이름들은 이 문서 문법의 옵션이고 실제 Tailwind 클래스가 아닙니다.

## 화면을 차례로 보여 주기

번호 선택 줄(`numbers`)은 갤러리처럼 쓸 수 있습니다. 자동으로 넘어가지 않고, 단추를 누르거나 키보드 화살표·Home·End로 고릅니다. 그림 높이가 달라도 보이는 그림만 자리를 차지합니다.

:::tabs numbers
@tab 오늘 목록

::figure src=2-today-mac.png alt="오늘 목록 화면" caption="오늘 할 일을 한곳에 모읍니다."

@tab 예정 목록

::figure src=3-upcoming-mac-2.png alt="예정 목록 화면" caption="날짜가 정해진 항목을 날짜순으로 봅니다."

@tab 소제목

::figure src=4-headings-mac.png alt="소제목으로 나눈 목록" caption="긴 목록은 소제목으로 나눕니다."

@tab 체크리스트

::figure src=5-checklists-mac-2.png alt="체크리스트 화면" caption="항목 안에 세부 단계를 둡니다."

@tab 빠른 찾기

::figure src=7-quickfind-mac.png alt="빠른 찾기 화면" caption="이름을 입력해 바로 이동합니다."

:::end

## 폭을 맞춰 보여 주기

그림, 영상, 탭, 코드는 폭을 고를 수 있습니다. 문단은 항상 본문 폭입니다.

폭 옵션을 생략하면 본문 폭입니다.

::figure src=2-today-mac.png alt="본문 폭 그림" caption="폭 옵션 생략: 본문 폭"

`w-narrow`는 본문보다 좁게 가운데에 둡니다.

::figure src=4-headings-mac.png alt="좁은 그림" caption="w-narrow" w-narrow

`w-wide`는 본문 밖으로 넓게 펼칩니다. 그림·영상·탭·코드블록 모두 같은 옵션을 씁니다.

:::tabs numbers w-wide
@tab 예정 목록

::figure src=3-upcoming-mac-2.png alt="예정 목록" caption="w-wide 탭"

@tab 체크리스트

::figure src=5-checklists-mac-2.png alt="체크리스트" caption="같은 폭 규칙"

:::end

```bash w-wide
curl --silent --show-error --location --header "Accept: application/json" "https://example.com/api/lists/today/items?include=reminders&sort=due&limit=200&cursor=ZXhhbXBsZS1jdXJzb3ItdmFsdWUtdGhhdC1pcy1jb21wbGV0ZWx5LXVubGlrZWx5LXRvLWZpdC1vbi1vbmUtbGluZS1vbi1hLXBob25l"
```

코드는 가로 스크롤 없이 폭에 맞춰 줄바꿈하고, 공백 없는 긴 낱말도 잘리지 않습니다. 복사하면 줄바꿈 없는 원문이 그대로 들어갑니다.

```text w-narrow
ThisIsAnUnbrokenIdentifierThatKeepsGoingAndGoingWithoutAnySpacesToProveThatLongTokensWrapInsideTheBlockInsteadOfScrolling_0123456789_0123456789_0123456789
```

## 문장 안에서 짧게 설명하기

메뉴 경로는 :menu[설정] → :menu[동기화]처럼 쓰고, 단축키는 :kbd[⌘ ,]처럼 씁니다. 길게 설명하면 흐름이 끊기는 낱말에는 :tip[동기화 상태]{text="오프라인에서 바꾼 내용은 연결되면 합쳐집니다. 같은 항목을 양쪽에서 고치면 나중에 저장한 쪽이 남습니다."}처럼 설명을 숨겨 둘 수 있습니다. 눌러 열고 Esc로 닫습니다.

:::warning
동기화를 끄고 앱을 지우면 기기에만 있던 항목은 복구할 수 없습니다.
:::end

설정은 아래와 같이 JSON으로도 내보낼 수 있습니다. 오른쪽 위의 복사 버튼은 코드 원문을 그대로 복사합니다.

```json filename=settings.json
{
  "list": "오늘 할 일",
  "sync": true,
  "reminder": { "time": "09:00", "repeat": "weekdays" }
}
```

## 자주 묻는 질문

:::qa
동기화가 안 되는 것 같아요.
: 두 기기에서 같은 계정으로 로그인했는지 먼저 확인합니다. 그래도 같으면 :menu[설정] → :menu[동기화]에서 한 번 껐다 켭니다.

기기를 바꾸면 항목이 사라지나요?
: 사라지지 않습니다. 새 기기에서 같은 계정으로 로그인하면 목록이 내려받아집니다.

영상이 재생되지 않아요.
: 영상 안의 재생 버튼을 누르세요. 재생 전에는 미리보기 그림을 보여 줍니다.
:::end

## 이어서 읽을 글

:::cards related
::card title="Markdown 문법 전체 보기" href=/articles/markdown-guide/ icon=document
::card title="큐에 경계 두기" href=/articles/bounded-queue/ icon=queue
::card title="증거로 원인 좁히기" href=/articles/diagnosis-evidence/ icon=search
:::end
