---
id: demo-python-notes
slug: demo-python-notes
title: 파이썬으로 작은 목록 다루기
description: 한 번에 이해할 수 있는 목록 예제를 적었습니다.
tags:
- python
- 설계
publishedAt: '2026-09-20'
visibility: public
comments: false
example: true
---
한 번에 이해할 수 있는 목록 예제를 적었습니다.

## 기록

이 글은 블로그 화면을 확인하기 위해 만든 예시입니다.

```python
items = ["책", "산책"]
for item in items:
    print(item)
```

<details>
<summary>예제 설명 펼치기</summary>

목록의 항목을 하나씩 읽습니다.

</details>

## 코드 배경과 구문 색

아래 코드는 실행 결과를 주장하지 않는 테마 검수용 합성 예제입니다. 코드 언어, 문자열, 주석과 긴 줄을 비교합니다.

```sql
SELECT id, title, published_at
FROM posts
WHERE visibility = 'public'
ORDER BY published_at DESC
LIMIT 12;
```

```typescript
type Post = { title: string; tags: string[] };
const published: Post[] = [{ title: "작은 목록", tags: ["독서"] }];
const titles = published.map(post => post.title);
console.log(titles);
```

```bash
npm run build:demo
curl --fail http://127.0.0.1:8799/search/
```

```json
{
  "title": "테마 검수용 합성 예제",
  "published": true,
  "tags": ["Python", "설계"],
  "description": "긴 코드 문자열이 좁은 화면에서도 상자 밖으로 넘치지 않고 읽히는지 확인하기 위한 예시입니다."
}
```

## Torso 요청 흐름

요청이 애플리케이션을 거쳐 저장소로 이동하는 합성 예제입니다. 기본 면, 파란 강조 면과 번호가 붙은 선을 비교합니다.

```thinkflow
thinkflow
title "요청이 애플리케이션을 거쳐 저장소로 이동한다"
box client "브라우저" badge="EXT"
box api "애플리케이션" badge="APP" tone=blue appearance=filled
store database "저장소" badge="DATA"
client -> api no=1
api -> database no=2
scene "구조"
scene "요청" mode=loop for=3s
  track client -> api -> database every=1s time=500ms
```

## Torso 요청과 응답

같은 세 참여자가 요청과 응답을 주고받는 예제입니다. 실선과 점선, 메시지 글자의 배경 대비를 비교합니다.

```thinkflow
thinkflow
title "사용자와 앱과 서버가 요청과 응답을 주고받는다"
person user "사용자"
box app "앱"
box server "서버"
view sequence {
  user app server
}
scene "요청과 응답"
  user -> app "조회"
  app -> server "GET /posts"
  server -> app "글 목록" dashed
  app -> user "목록 표시"
```

## Torso 작업 상태

작업의 정상 완료와 재시도를 비교하는 예제입니다. 장면 탭과 선택 상태도 함께 확인합니다.

```thinkflow
thinkflow
title "작업이 완료되거나 실패 후 다시 대기한다"
state queued "대기"
state running "실행 중"
state done "완료"
state failed "실패"
start queued
final done
queued -> running "시작"
running -> done "성공"
running -> failed "오류"
failed -> queued "재시도" dashed
scene "정상"
  queued -> running time=700ms
  running -> done time=700ms
scene "재시도"
  queued -> running time=700ms
  running -> failed time=700ms
  failed -> queued time=700ms
```
