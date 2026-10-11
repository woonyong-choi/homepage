# 영역 설정

설정을 바꾼 뒤 `npm run build:site`로 다시 만든다. 숫자·표시 여부·목록을 잘못 적거나 알 수 없는 키를 추가하면 파일과 필드 경로를 포함한 오류로 중단한다. 색·글꼴·간격·모바일 분기점은 공통 디자인 정본이 소유한다.

| 바꿀 내용 | 파일 |
|---|---|
| 홈 본문·섹션 순서·오른쪽 위 메뉴 | `content/home.md` |
| Search 제목·영역 순서·표시 여부·검색창 문구·추천 검색어 | `config/search.json` |
| CS 제목·설명·주제 순서·카드·목록 배치 | `config/cs.json` |
| Tech 제목·설명·주제 순서·카드·목록 배치 | `config/tech.json` |
| Blog 제목·설명·카드·미리보기·전체 목록·본문 피드 개수 | `config/blog.json` |
| 개별 주제의 이름·설명·아이콘·대표 글 | `content/tech.md`의 `topics` |

## 홈과 Search

홈의 `navigation`은 모든 화면의 상단 메뉴를 정한다. 기본 연결은 Search `/docs/`, Blog `/blog/`이며 설정 예는 [홈 원고 가이드](home-content.md#상단-메뉴)에 있다.

Search의 `sections`는 `blog`, `projects`, `cs`, `tech`, `guides`를 원하는 순서로 나열한다. `enabled: false`인 영역과 목록에 넣지 않은 영역은 입구에서 숨긴다. 영역을 숨겨도 직접 주소와 그 영역의 글은 계속 존재하고 검색된다. 같은 영역을 두 번 넣을 수 없다. 프로젝트 문구는 `projectsTitle`, 전체 보기와 돌아가기 문구는 `allLabel`, `backLabel`이다. 프로젝트 데이터와 공식 가이드 링크는 `config/site.json`에 있다.

`box.labels`는 검색창의 영역 이름(`region`), 입력 이름(`input`), 빈 입력 문구(`placeholder`), 지우기 이름(`clear`), 추천 목록 제목(`suggestions`)이다. `box.suggestions`에 추천 검색어를 배열로 적는다. 검색 대상·검색 결과 정렬과 태그 AND 조건은 표시 설정으로 바뀌지 않는다.

## 목록과 카드

CS·Tech·Blog는 다음 공통 필드를 사용한다.

| 필드 | 계약 |
|---|---|
| `title`, `description` | 영역의 제목과 설명. 빈 설명은 생략 |
| `preview.columns`, `preview.rows` | Search 미리보기의 넓은 화면 기준 열·행 수 |
| `collection.columns`, `collection.rows` | 전체 목록의 열·행 수. `rows: null`이면 한 페이지에 모두 표시 |
| `card.title` | 화면에 제목을 표시할지 결정. 숨겨도 접근 가능한 제목은 유지 |
| `card.description` | 카드의 요약 설명 표시 여부 |
| `card.media` | `icon`은 주제·글 아이콘, `image`는 대표 글·글의 `thumbnail`, `none`은 시각 자료 생략 |

열 수는 1~5, 행 수는 1~1000 정수다. 정적 페이지 한 장의 항목 수는 열×행이다. Blog의 `autoLoad: true`는 스크롤에 따라 다음 페이지를 이어 붙인다. 화면에서도 설정한 페이지 단위를 유지하려면 `autoLoad: false`로 바꾸면 번호·이전·다음 링크로 이동한다. 모바일에서 열은 공통 카드 규칙에 따라 줄어들며 항목 수를 유지하므로 세로 행은 늘어난다. 전체 목록에서 행 수를 정하면 다음 페이지가 생기며, 행 제한을 넘어선 글이나 주제를 삭제하지 않는다. CS·Tech의 다음 페이지 주소는 `/docs/topics/<영역>/page/<번호>/`, Blog는 `/blog/all/page/<번호>/`다.

예를 들어 CS에서 제목만 한 줄 목록으로 최대 6개 미리 보려면 다음 값을 쓴다.

```json
{
  "preview": { "columns": 1, "rows": 6 },
  "card": { "title": true, "description": false, "media": "none" }
}
```

위 예는 파일의 해당 필드만 교체한다. 제목·설명·미디어를 모두 끄는 설정은 거부한다. 선택한 이미지가 없는 주제 카드에서는 이미지 자리를 생략한다. Blog의 이미지 모드는 썸네일이 없으면 기존 비율의 빈 표지를 유지한다. 제목까지 끈 상태에서 실제 이미지와 설명이 모두 없으면 빈 링크를 막기 위해 제목을 표시한다. 요약의 줄 수·이미지 비율·호버와 초점 표현은 공통 카드 계약을 따른다.

CS·Tech의 `order`에는 먼저 보여 줄 `topics` 키를 배열로 적는다. 비어 있으면 원래 주제 순서다. 지정하지 않은 주제는 뒤에 원래 순서대로 남는다. 다른 영역의 키·없는 키·중복 키는 오류이며 미발행 주제는 화면에 생기지 않는다. 이름·설명·아이콘·대표 문서 연결은 기존 `topics` 한 곳에서 관리한다.

## Blog의 글 포함 기준

Blog는 공개 승인된 입력 중 `type: blog`인 발행 글 전체를 같은 모음으로 사용한다. Search의 Blog 미리보기, 전체 카드 목록, 본문 이어 읽기는 이 모음을 나눠 보여 준다. 미리보기 개수나 표시 설정 때문에 모음에서 글이 빠지지 않는다. 비공개 자료의 특정 외부 페이지를 직접 읽거나 새 원문을 자동 승인하는 기능은 없다. 원문의 승인·동기화 계약은 [발행](publication.md)에 있다.

`card.tags`, `card.date`, `card.comments`로 Blog 카드의 태그·날짜·댓글 안내를 각각 끈다. `feedSize`는 `/blog/` 본문 피드의 페이지당 글 수이며 1~1000이다. `archiveTitle`, `feedLabel`, `archiveLabel`은 전체 목록 제목, 본문 이어 읽기 링크, 전체 글 보기 링크의 문구다. 본문 피드는 글의 본문·태그·날짜와 댓글을 유지하며 카드 표시 설정을 적용하지 않는다.
