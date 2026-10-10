---
id: example-request-flow
slug: request-flow
type: wiki
title: 요청 하나를 구조·순서·데이터로 설명하기
description: 주문 요청 하나를 따라가며 구성 요소, 메시지 순서, 상태, 데이터 관계와 관측값을 같은 문서 안에서 구분합니다.
tags:
  - concurrency
  - sql
  - testing
field: cs
contentIcon:
  name: architecture
visibility: public
comments: false
example: true
category: software-design
---

주문 요청 하나를 따라가며 구성 요소, 메시지 순서, 상태, 데이터 관계와 관측값을 같은 문서 안에서 구분합니다.

구성도 한 장에 모든 정보를 넣으면 선이 무엇을 뜻하는지부터 해석해야 합니다. 여기서는 가상의 주문 서비스를 같은 이름의 구성 요소로 설명하되, 문단마다 답하려는 질문에 맞춰 그림을 나눕니다. 그림의 값은 설명을 위한 예시입니다.

## 연결 구조와 요청의 이동

구성도는 사용자, 주문 API, 저장소의 경계를 보여 줍니다. 선은 연결 관계이고 움직이는 점은 그 관계를 따라가는 요청입니다. **요청 흐름** 탭을 선택하면 같은 경로에 여러 요청이 겹쳐 이동하는 모습을 볼 수 있습니다.

```thinkflow w-wide
thinkflow
title "주문 API가 요청을 받아 저장소에 기록한다"

person user "사용자"
box api "주문 API" icon=server
store db "주문 저장소" icon=db
user -> api "주문"
api -> db "저장"
view graph down

scene "구성" mode=static

scene "요청 흐름" mode=loop for=8s
  track user -> api -> db every=1500ms time=2500ms
```

정적인 문서에서는 **구성**을 읽고, 요청이 어디로 이동하는지 설명할 때만 **요청 흐름**을 선택합니다. 장면마다 카드를 다시 선언하지 않고 한 번 선언한 구조를 사용합니다.

## 응답을 보내는 순서

구성도에는 저장이 끝나기 전에 성공을 응답하는지 나타나지 않습니다. 순서 그림은 위에서 아래로 메시지를 배치합니다. 이 예제는 저장 완료를 받은 뒤 사용자에게 주문 번호를 돌려줍니다.

```thinkflow
thinkflow
title "저장 완료를 받은 뒤 주문 번호를 응답한다"

person user "사용자"
box api "주문 API"
store db "저장소"
view sequence {
  user api db
}

scene "주문 접수"
  user -> api "주문 요청"
  api -> db "주문 기록"
  db -> api "저장 완료" dashed
  api -> user "주문 번호" dashed
```

순서 보기에는 참여자의 가로 순서를 적고 메시지는 장면 안에 적습니다. 구성도에서 연결 관계를 선언하던 `->`와 같은 기호를 사용하지만, 이곳의 줄은 각각 실제로 그릴 메시지입니다.

## 요청이 끝나도 작업은 남는다

주문 접수의 성공과 후속 처리의 완료는 구분합니다. 상태 그림의 카드는 서버가 아니라 작업의 상태입니다. 재시도 장면을 고르면 처리 도중 실패한 작업이 재시도 대기로 돌아가는 경로를 보여 줍니다.

```thinkflow w-narrow
thinkflow
title "실패한 작업은 대기로 돌아가 다시 처리한다"

state queued "대기"
state running "처리 중"
state done "완료"
start queued
final done
queued -> running "시작"
running -> done "성공"
running -> queued "오류 후 재시도" dashed
view graph down

scene "정상 처리"
  queued -> running
  running -> done

scene "재시도"
  queued -> running
  running -> queued
  queued -> running
  running -> done
```

재시도 횟수와 중복 방지 정책은 이 상태 그림만으로 정해지지 않습니다. 여기서는 성공과 재시도의 경로만 표현하며, 실제 구현에서는 같은 주문을 다시 처리할 때의 규칙을 별도로 정해야 합니다.

## 저장되는 관계를 열 단위로 보기

저장소를 상자 하나로 그리면 어떤 키로 사용자를 찾는지 빠집니다. 테이블 카드에서는 열과 키를 정의하고 외래 키로 관계를 연결합니다. **사용자 찾기**를 선택하면 주문의 `user_id`에서 사용자의 `id`로 이어지는 관계를 강조합니다.

```thinkflow
thinkflow
title "주문의 user_id가 사용자의 id를 참조한다"

table users "users" {
  id bigint pk
  name text required
}
table orders "orders" {
  id bigint pk
  user_id bigint fk=users.id required
  status text required
}
view graph down

scene "테이블" mode=static

scene "사용자 찾기"
  light orders.user_id users.id
  orders -> users
```

테이블의 관계는 `fk=`가 정합니다. 같은 관계를 별도의 선으로 한 번 더 선언하지 않습니다. 일반적인 정책 비교는 Markdown 표로, 열과 참조 관계는 이 테이블 카드로 구분해 쓰면 각 표현의 목적이 분명해집니다.

## 관측값은 구조와 분리해서 비교하기

요청이 성공한다는 사실만으로 사용자가 얼마나 기다리는지 알 수는 없습니다. 아래 값은 대기 시간과 처리 시간을 구분하기 위한 합성 데이터입니다. **순서대로 비교**를 선택하면 한 번에 모든 막대를 읽지 않고 두 계열을 차례로 볼 수 있습니다.

```thinkflow w-wide
thinkflow
title "요청의 대기 시간과 처리 시간을 따로 비교한다"

chart latency "요청별 시간" bar "설명용 합성 데이터" {
  x "시간(ms)"
  series waiting "대기" role=compare
  series processing "처리" role=main
  row "요청 A" waiting=20 processing=80
  row "요청 B" waiting=90 processing=85
  row "요청 C" waiting=160 processing=75
}

scene "전체 값" mode=static

scene "순서대로 비교"
  reveal latency.waiting
  wait 1s
  reveal latency.processing
```

이 그림은 세 요청의 값만 비교합니다. 전체 시스템의 성능이나 개선 효과를 주장하려면 측정 환경, 관측 구간과 표본 수를 함께 제시해야 합니다. 시간에 따른 변화에는 선·계단, 분포에는 히스토그램·상자, 구성비에는 누적·비율 차트를 사용할 수 있습니다. 각 입력 형식은 [ThinkFlow 차트 사용법](https://github.com/woonyong-choi/ThinkFlow/blob/main/docs/reference/charts.md)에 정리되어 있습니다.

## 문서에 넣는 방법

이 홈페이지에서는 Markdown의 `thinkflow` 코드 블록 하나가 그림 하나입니다. 폭은 코드·이미지와 똑같이 생략하면 본문 기본 폭, `thinkflow w-wide`는 넓게, `thinkflow w-narrow`는 작게 표시합니다. 모바일에서는 모두 화면 안으로 줄어듭니다. `thinkflow` 아래에 선언과 장면을 적으면 빌드 시 공통 렌더러가 그림을 만들고, 읽는 화면에서는 장면 탭과 원문 복사·HTML 내려받기·전체 화면 조작을 제공합니다. 글마다 스타일이나 재생 코드를 작성하지 않습니다.

작성할 때는 구성 요소와 연결을 먼저 적고, 정적인 그림으로 설명이 충분하지 않은 부분에 장면을 추가합니다. 설치, 문법과 실행 명령은 [ThinkFlow 문서](https://github.com/woonyong-choi/ThinkFlow/blob/main/docs/usage.md)에서 확인할 수 있습니다.

:::cards related
::card title="빠른 생산자와 느린 소비자 사이에 경계를 두기" href=/articles/bounded-queue/ icon=queue
::card title="Markdown으로 글 쓰는 법과 지원 문법" href=/articles/markdown-guide/ icon=document
:::end
