# 영역 설정

| 항목 | 값 |
|---|---|
| 상태 | 구현 |

## 요약

공개 Blog의 문구와 카드 표시 정책을 작성 설정으로 관리한다. 색·글꼴·간격·반응형과 공통 동작은 design-tokens가 소유한다.

## 해결하는 문제

글의 표시 여부와 순서를 바꾸는 설정이 디자인 값을 중복하지 않게 한다. 공개 Blog 설정과 개인 위키 호스트의 기존 설정을 분리한다.

## 사용 예

### 사용 장면

썸네일이 없는 글도 제목 표지를 자동으로 표시한다. Search 카드는 제목·설명·날짜를 보여 주며 태그는 필터와 본문에서 사용한다.

## 작동 방식

### 승인 설정

설정은 Vault에서 수정·승인한 뒤 [발행 목록을 동기화](publication.md#vault-발행-입력)한다. `content/home.md`, `config/site.json`, `config/search.json`, `config/blog.json`, `config/tags.json`은 승인 사본이며 직접 수정하지 않는다.

`config/cs.json`, `config/tech.json`, `content/pages/tech.md`의 `topics`는 기존 개인 미리보기·동기화 호환 입력으로 보존한다. 공개 Blog의 필수 분류나 허용 목록으로 사용하지 않는다. 홈페이지에서 이 사본을 고쳐 새 공개 모델을 만들지 않는다.

### 홈과 Blog

공개 상단 탐색은 Search `/search/`와 Blog `/blog/`다. Search는 전체 글의 목록·검색·태그 필터이고 Blog는 같은 글을 최근 날짜순 본문으로 보여 준다. 홈 원고의 기존 탐색 값은 개인 미리보기 호환을 위해 보존하며 공개 페이지 조립이 목적지를 정한다. 홈의 기술 로고는 `/search/?tag=python`처럼 같은 목록의 태그 필터로 연결한다.

공개 로더 `loadBlogLayout`은 `config/blog.json`의 `title`, `collection`, `card`, `feedSize`, `autoLoad`, `archiveLabel`과 `config/search.json`의 `title`, `box`를 읽는다. `cs`, `tech`, 검색 입구의 `sections`를 필수 입력으로 요구하지 않는다. `feedSize`는 Blog의 페이지당 본문 수이고 `autoLoad`는 다음 페이지 자동 추가 여부다. `archiveLabel`은 Search 전체 글로 이동하는 문구다. 기존 `preview`, `archiveTitle`, `feedLabel`은 별도 공개 목록을 만들지 않는다.

`collection.columns`, `collection.rows`는 목록 배치와 한 페이지의 항목 수를 정한다. `rows: null`은 필터 결과 전체를 한 페이지로 표시한다. 카드의 `title`, `description`, `tags`, `date`, `comments`는 각 항목의 표시 여부다. `media: image`는 실제 썸네일을 우선하고 없으면 제목 표지를 표시한다. `icon`, `none`은 공개 글의 장식 이미지를 만들지 않는다. 같은 표시 정책을 정적 목록과 검색 뒤 다시 그린 목록에 적용한다. 실제 글 포함 여부는 승인·공개 상태·발행일·빌드 모드로 정하며 카드 설정 때문에 글을 제외하지 않는다. 자동 표지는 카드에만 표시한다.

검색어와 태그, 페이지는 `q`, 반복 `tag`, `page`로 `/search/`에 저장한다. 검색창은 공통 구성 요소를 사용하며 검색어와 태그의 AND 조건은 표시 설정으로 바뀌지 않는다. 목록·검색·태그는 같은 공개 글 집합을 사용한다. 분야별 목록은 만들지 않는다. Blog 본문 피드는 같은 글 집합과 `feedSize`, `autoLoad` 설정을 사용한다.

### 공통 디자인

카드 배치·이미지 비율·설명 줄 수·호버·초점·모바일 배치는 공통 카드 계약을 따른다. 홈페이지 문서에 CSS 치수를 복제하지 않는다. 바꿀 위치와 의존성 갱신은 [스타일 수정 지도](styles.md)에 있다.

Search 카드의 기본값은 `card.tags: false`다. `card.media: image`이면 직접 지정한 대표 이미지를 우선하고, 없으면 공통 제목 표지를 표시한다. `none`이면 표지를 생략한다. 카드 설명은 작은 보조 글자 크기를 사용하고 본문 태그는 `medium` 크기를 사용한다.

카드 제목은 한 줄, 설명은 두 줄을 넘으면 말줄임한다. 설명은 한글 어절을 묶지 않고 카드 폭을 사용한다. 날짜는 왼쪽, 댓글 수는 오른쪽 끝에 둔다. Search 제목은 본문에서 쓰는 공통 검색 아이콘을 사용한다.
