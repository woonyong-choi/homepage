---
id: example-python-copy
slug: python-copy
type: blog
title: 복사한 리스트를 바꿨는데 원본도 달라진 이유
description: 이름의 연결과 객체의 복사를 구분해 중첩 자료구조의 변경 범위를 확인합니다.
tags:
  - python
  - object-copy
  - reference
  - memory
field: languages
contentIcon:
  name: memory
visibility: public
comments: true
example: true
publishedAt: 2026-10-05
thumbnail:
  src: https://picsum.photos/seed/python-copy/1200/500
  alt: ""
category: python
---

## 바뀐 것은 바깥 리스트뿐이었다

리스트를 복사한 뒤 내부 값을 수정했는데 원본에서도 같은 변경이 보인다고 가정하겠습니다. 복사가 실패한 것인지 판단하려면 바깥 Container와 그 안에 들어 있는 객체를 따로 봐야 합니다.

얕은 복사는 새 바깥 객체를 만들지만 내부 객체의 참조를 공유할 수 있습니다. 같은 값을 출력한다는 사실만으로 서로 다른 객체인지 판단할 수는 없습니다.

## 값과 동일성을 함께 확인한다

```python
original = [[1], [2]]
copied = original.copy()

assert copied is not original
assert copied[0] is original[0]

copied[0].append(3)
assert original[0] == [1, 3]
```

첫 번째 단언은 바깥 리스트가 다르다는 점을 보여줍니다. 두 번째 단언은 안쪽 리스트가 같다는 점을 보여줍니다. 이후 변경은 그 공유된 안쪽 객체에 일어나므로 두 경로에서 모두 관측됩니다.

## 깊게 복사하면 끝나는가

| 필요 | 선택의 출발점 |
|---|---|
| 항목의 순서만 독립적으로 바꾸기 | 바깥 Container 복사 |
| 중첩 값의 변경까지 분리하기 | 복사할 객체 그래프의 범위 정의 |
| 공유 자원이나 파일을 포함하기 | 자원 소유권과 재생성 정책 정의 |

깊은 복사를 무조건 사용하는 대신, 어떤 변경을 격리해야 하는지 먼저 정합니다. 데이터와 외부 자원이 섞여 있으면 객체 복사만으로 자원의 독립성이 생기는 것은 아닙니다.

## 변경이 전파되는 경로를 시험한다

테스트에서는 값의 같음과 객체의 동일성을 따로 확인합니다. 안쪽 리스트의 변경, 바깥 항목 교체, 불변 값의 재대입을 나눠 실행하면 어느 단계에서 공유가 끊기는지 드러납니다.

이 예시는 작은 객체 그래프를 설명합니다. 실제 모델에 적용할 때는 순환 참조와 사용자 정의 복사 동작도 확인해야 합니다. 복사의 비용은 데이터 크기와 연결 구조를 고정한 뒤 측정합니다.
