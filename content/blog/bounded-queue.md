---
id: example-bounded-queue
slug: bounded-queue
type: blog
title: 빠른 생산자와 느린 소비자 사이에 경계를 두기
description: 큐를 늘리는 대신 대기와 거부의 조건을 정해 처리 흐름을 안정시키는 예시입니다.
tags:
  - queue
  - backpressure
  - concurrency
field: cs
contentIcon:
  name: queue
visibility: public
comments: true
example: true
publishedAt: 2026-10-04
thumbnail:
  src: https://picsum.photos/seed/bounded-queue/960/540
  alt: ""
category: software-design
---

## 큐가 늘어나는 동안 성공처럼 보였다

요청을 받아 큐에 넣는 단계는 빠르지만 뒤의 처리는 느린 시스템을 가정합니다. 입력 응답만 측정하면 서비스가 정상으로 보일 수 있습니다. 하지만 큐에 머문 시간까지 포함하면 사용자가 기다리는 시간은 계속 늘어납니다.

이 글에서는 처리량 수치를 가정하지 않습니다. 큐의 역할과 관측 지표를 나누고, 입력을 계속 받을 수 없는 순간의 동작을 설계합니다.

## 메모리 대신 시간을 빌리는 구조

큐는 처리 능력을 무한히 늘리지 않습니다. 잠깐의 입력 증가를 흡수하지만, 평균 입력이 평균 처리 능력을 계속 넘으면 대기가 쌓입니다. 한도를 늘리기 전에 큐 길이, 가장 오래 기다린 항목, 처리 시간과 실패율을 함께 봐야 합니다.

```dap
daphnis 2
title "큐에 여유가 없으면 입력을 기다리게 한다"

box input "요청 접수" icon=apigw
queue jobs "대기 작업" slots=4 from=1
box worker "작업자" icon=server
box retry "재시도 안내" icon=notify
value done "처리 완료" on=worker
on worker done+1

input -> jobs
jobs -> worker
input -> retry quiet
view graph down

scene "구조" mode=static

scene "유입이 많을 때" mode=loop for=8s
  track input -> jobs every=1s time=700ms wait="jobs<4" timeout=1s else=retry reserve="jobs+1"
  track jobs -> worker at=500ms every=2s time=700ms wait="jobs>0" reserve="jobs-1" tone=green

scene "소비자가 회복되면" mode=loop for=8s set="jobs=4"
  track input -> jobs every=2500ms time=700ms wait="jobs<4" timeout=1s else=retry reserve="jobs+1"
  track jobs -> worker at=500ms every=1s time=700ms wait="jobs>0" reserve="jobs-1" tone=green
```

위 그림에서 **유입이 많을 때**를 고르면 큐가 차는 동안 요청이 들어오고, 빈자리를 기다리다 시간이 지나면 재시도 안내로 넘어갑니다. **소비자가 회복되면**에서는 작업자가 더 자주 꺼내 대기를 줄입니다. 재생 간격은 흐름을 구분하기 위한 설정이며 실제 처리량 측정값은 아닙니다.

가득 찼을 때의 동작을 정하지 않은 큐는 정책을 메모리 한계에 맡긴 셈입니다. 사용자에게 언제 다시 시도할지 알리거나, 중요한 작업과 덜 중요한 작업을 분리하는 선택이 필요합니다.

## 대기시키기와 거부하기의 차이

| 정책 | 장점 | 확인할 비용 |
|---|---|---|
| 입력 대기 | 짧은 변동을 흡수 | 연결과 대기 자원 유지 |
| 즉시 거부 | 과부하 경계를 명시 | 클라이언트 재시도 폭증 |
| 별도 저장 후 처리 | 요청과 실행 시간 분리 | 중복·복구·보관 정책 |

어떤 정책을 택해도 재시도에는 상한과 지연이 필요합니다. 모든 클라이언트가 같은 순간에 다시 요청하면 거부가 새로운 입력 폭증을 만들 수 있습니다.

## 정상 속도보다 복구 과정을 확인한다

테스트에서는 소비자를 느리게 만들고 큐가 한도에 도달하도록 합니다. 한도 이후의 입력 처리, 기존 작업의 손실 여부, 소비자가 회복된 뒤 대기가 줄어드는지를 따로 확인합니다.

다음 검증에서는 작업의 중요도와 만료 시간을 추가합니다. 오래 기다린 작업을 끝까지 처리하는 것이 사용자에게 여전히 유용한지 판단해야 합니다. 이 예시는 운영 성능 개선을 보고하는 글이 아니라 그 판단을 준비하는 설계입니다.
