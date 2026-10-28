---
publish: true
id: example-document-composition
slug: document-composition
type: wiki
title: 기기마다 다른 안내를 한 문서로 쓰는 법
description: 단계 목록, 작은 글씨, 안내문, 질문과 답, 관련 글 카드를 Markdown 블록만으로 한 문서에 구성하는 예시입니다.
tags: []
field: cs
contentIcon:
  name: document
visibility: public
comments: false
example: true
category: software-design
---

단계 목록, 작은 글씨, 안내문, 질문과 답, 관련 글 카드를 Markdown 블록만으로 한 문서에 구성하는 예시입니다.

이 글은 가상의 할 일 앱 안내서를 쓰는 척하며 구성 문법을 하나씩 보여 줍니다. 앱의 기능이나 화면은 설명하지 않고, 실제 작성에 쓰는 원문 구조에 집중합니다. 아래 블록은 모두 이 파일의 원문을 그대로 복사해 고쳐 쓸 수 있습니다.

## 단계를 차례로 안내하기

같은 작업도 기기에 따라 순서가 다릅니다. 기기마다 소제목 없이 문단 한 줄로 기기를 밝히고, 이어서 `:::steps`로 단계를 적습니다. 블록은 `:::`로 닫습니다.

Mac에서는 메뉴 막대에서 시작합니다.

:::steps
1. 메뉴 막대에서 :menu[파일]을 열고 :menu[새 목록]을 고릅니다.
2. 이름을 입력하고 :kbd[⌘ Return]을 누릅니다.
3. 사이드바에서 :icon[document] 표시가 붙은 항목이 새 목록입니다.
:::

:::fineprint
:kbd[⌘ Return] 대신 화면의 완료 버튼을 눌러도 됩니다.
:::

iPhone과 iPad에서는 목록 화면에서 시작합니다.

:::steps
1. 목록 화면에서 오른쪽 아래의 더하기 버튼을 누릅니다.
2. 이름을 입력하고 키보드의 완료를 누릅니다.
3. 목록 상단의 :icon[document] 표시로 새 목록을 구분합니다.
:::

:::note[알아 두기]
가로 모드에서는 목록과 상세가 나란히 보입니다. 단계는 같습니다.
:::

## 폭을 맞춰 보여 주기

그림, 영상, 갤러리, 코드는 폭을 고를 수 있습니다. 문단은 항상 본문 폭입니다.

폭 옵션을 생략하면 본문 폭이고, `width=narrow`는 본문보다 좁게 가운데에 두며, `width=wide`는 본문 밖으로 넓게 펼칩니다. 그림·영상·갤러리·코드블록 모두 같은 옵션을 씁니다.

````markdown
::figure src=screen-1.png alt="본문 폭 그림" caption="폭 옵션 생략: 본문 폭"

::figure src=screen-1.png alt="좁은 그림" caption="width=narrow" width=narrow
````

```bash width=wide
curl --silent --show-error --location --header "Accept: application/json" "https://example.com/api/lists/today/items?include=reminders&sort=due&limit=200&cursor=ZXhhbXBsZS1jdXJzb3ItdmFsdWUtdGhhdC1pcy1jb21wbGV0ZWx5LXVubGlrZWx5LXRvLWZpdC1vbi1vbmUtbGluZS1vbi1hLXBob25l"
```

코드는 가로 스크롤 없이 폭에 맞춰 줄바꿈하고, 공백 없는 긴 낱말도 잘리지 않습니다. 복사하면 줄바꿈 없는 원문이 그대로 들어갑니다.

```text width=narrow
ThisIsAnUnbrokenIdentifierThatKeepsGoingAndGoingWithoutAnySpacesToProveThatLongTokensWrapInsideTheBlockInsteadOfScrolling_0123456789_0123456789_0123456789
```

## 문장 안에서 짧게 설명하기

메뉴 경로는 :menu[설정] → :menu[동기화]처럼 쓰고, 단축키는 :kbd[⌘ ,]처럼 씁니다. 길게 설명하면 흐름이 끊기는 낱말에는 :tip[동기화 상태]{text="오프라인에서 바꾼 내용은 연결되면 합쳐집니다. 같은 항목을 양쪽에서 고치면 나중에 저장한 쪽이 남습니다."}처럼 설명을 숨겨 둘 수 있습니다. 눌러 열고 Esc로 닫습니다.

:::warning
동기화를 끄고 앱을 지우면 기기에만 있던 항목은 복구할 수 없습니다.
:::

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
:::

## 이어서 읽을 글

:::cards variant=related
::card title="Markdown 문법 전체 보기" href=/articles/markdown-guide/ icon=document
::card title="큐에 경계 두기" href=/articles/bounded-queue/
::card title="증거로 원인 좁히기" href=/articles/diagnosis-evidence/
:::
