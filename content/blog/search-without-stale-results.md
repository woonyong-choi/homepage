---
id: example-search-without-stale-results
slug: search-without-stale-results
type: blog
title: 검색 결과가 입력을 뒤쫓지 않게 만들기
description: 빠른 입력과 느린 응답이 겹칠 때, 화면에 남아야 하는 결과의 기준을 정합니다.
tags:
  - javascript
  - async
  - concurrency
  - error-handling
  - testing
field: languages
contentIcon:
  name: search
visibility: public
comments: true
example: true
publishedAt: 2026-10-08
thumbnail:
  src: https://picsum.photos/seed/search-without-stale-results/960/540
  alt: ""
category: javascript
---

## 입력은 앞으로 가는데 결과는 뒤로 돌아갔다

사용자가 `ca`를 입력한 뒤 곧바로 `cache`까지 입력했다고 가정하겠습니다. 첫 요청이 두 번째 요청보다 늦게 끝나면 화면은 더 오래된 검색어의 결과로 돌아갈 수 있습니다. 요청이 성공했는지와 지금 화면에 반영해도 되는지는 서로 다른 질문입니다.

이 예시에서는 검색어와 선택한 태그를 하나의 검색 상태로 취급합니다. 같은 검색어라도 태그를 바꾸면 결과 집합이 달라지므로 새로운 요청으로 구분해야 합니다.

## 요청을 줄이는 것만으로 해결되지 않는다

입력 후 잠시 기다리는 debounce는 호출 횟수를 줄입니다. 하지만 이미 시작한 요청의 완료 순서는 보장하지 않습니다. 이전 요청을 취소하는 방식도 유용하지만, 취소할 수 없는 작업이나 이미 도착한 응답을 다룰 기준이 따로 필요합니다.

| 선택 | 해결하는 문제 | 남는 조건 |
|---|---|---|
| Debounce | 연속 입력의 호출 횟수 | 완료 순서는 별도 확인 |
| 요청 취소 | 불필요한 네트워크 작업 | 취소 실패와 이미 끝난 요청 |
| 상태 버전 확인 | 오래된 결과의 화면 반영 | 작업 자체는 끝날 수 있음 |

## 화면의 소유권을 버전으로 표현한다

새 입력을 받을 때마다 버전을 올립니다. 검색을 시작할 때 기억한 버전이 현재 버전과 같을 때만 결과를 반영합니다. 성공뿐 아니라 오류 표시에도 같은 규칙을 적용해야 합니다.

```javascript
let revision = 0;

async function search(query) {
  const current = ++revision;
  try {
    const results = await loadResults(query);
    if (current !== revision) return;
    renderResults(results);
  } catch (error) {
    if (current !== revision) return;
    renderRetry(error);
  }
}
```

입력창을 비우는 동작도 버전을 올려야 합니다. 그렇지 않으면 빈 화면을 만든 뒤 이전 요청이 도착해 결과를 다시 채울 수 있습니다. 한글 조합 중에는 완성되지 않은 입력으로 검색하지 않고, 조합이 끝났을 때 마지막 상태를 요청합니다.

## 빠른 성공보다 늦은 실패를 먼저 시험한다

검증에서는 두 번째 요청을 먼저 성공시키고 첫 번째 요청을 나중에 실패시킵니다. 화면에는 두 번째 결과가 남아야 하며 오류 안내로 바뀌면 안 됩니다. 입력 지우기, 태그 변경, 뒤로가기에도 같은 시나리오를 적용합니다.

이 글은 검증용 설계 예시이며 실제 서비스의 응답 시간 개선을 측정한 결과는 아닙니다. 다음 단계에서는 요청 취소를 더해 낭비를 줄이되, 화면 반영의 버전 규칙은 그대로 유지합니다.
