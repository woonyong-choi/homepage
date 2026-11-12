# Blog와 Search

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 코드 | `src/layouts/blog.js`, `src/content/settings.js`, `src/client/blog-list.js`, `src/client/search/`, `src/lib/search.js` |

## 요약

공개 글은 Blog 하나다. Search(`/search/`)에서 전체 글을 검색·태그로 찾고, Blog(`/blog/`)에서 최근 글 본문을 차례로 읽는다. 폴더는 작성 편의용이며 주소나 분류를 정하지 않는다.

## 주소

| 주소 | 용도 |
|---|---|
| `/search/` | 전체 글 카드 목록, 검색, 태그 필터 |
| `/blog/` | 최근 글 본문 피드 |
| `/blog/page/<번호>/` | 이전 글 본문 피드 |
| `/blog/<slug>/` | 글 상세 |
| `/blog/feed.xml` | RSS(요약 피드) |

`/docs/`, `/projects/`, `/tags/`, `/blog/all/`은 만들지 않는다. 글은 최초 발행일 내림차순, 같은 날짜는 ID 순서다.

## 검색 조건

검색 조건은 `q`, 반복 가능한 `tag`, `page`로 URL에 저장한다. `/search/?q=기록&tag=독서&tag=회고&page=2`는 검색어와 두 태그를 모두 만족하는 글의 둘째 쪽이다. 검색어의 낱말과 태그는 모두 AND다. 태그를 켜거나 끄면 검색어와 다른 태그를 유지하고 첫 쪽으로 간다. 모든 조건을 지우면 전체 목록이다. 뒤로 가기는 URL 조건과 입력·결과를 복원한다.

- 태그 필터는 검색창 아래, 제목 위의 알약 토글이다. 후보는 현재 검색 결과 전체의 태그이며 선택한 태그는 결과가 없어도 남는다. 태그를 선택하면 줄 끝에 초기화 링크가 생긴다.
- 검색어를 입력하면 입력 칸 아래에 추천 목록(`role=listbox`: 연관 검색어, 태그, 글, 전체 결과 보기)이 뜬다. 화살표로 옮기고 Enter로 열며 Esc나 바깥 누름으로 닫는다. 한글 조합 중에는 제출하지 않는다.
- 추천 검색어 세 개는 빌드마다 발행 글의 태그와 `keywords`를 집계해 고른다. 표시 이름과 별칭은 같은 키워드로 묶고 같은 글에서는 한 번만 센다.
- 검색은 `search-worker.js`(Web Worker)에서 실행하고 Worker를 쓸 수 없으면 화면 스레드에서 같은 모델로 처리한다. 색인은 `/search-index.json`과 `/search-index.json.gz`를 같은 데이터로 만들고 gzip 해제가 안 되면 JSON을 읽는다.
- 색인 본문은 렌더링한 HTML에서 읽는 글자만 담는다. Markdown 기호, 수식 내부 표기, 단추 글자는 넣지 않는다.

## 태그

태그는 등록 목록에 묶이지 않는 문자열이다. `config/tags.json`은 표시 이름과 검색 별칭만 정한다.

```json
{ "javascript": { "label": "JavaScript", "aliases": ["JS"] } }
```

글 상세의 태그는 `/search/?tag=<태그>`로 연결한다. 글 상세 아래의 관련 글은 태그를 하나 이상 공유하는 글을 최신순으로 최대 4편 고르며 없으면 생략한다.

## 설정

`src/content/settings.js`의 `loadBlogLayout`이 `config/site.json`의 `blog`·`search`에서 다음 값을 읽고 검증한다.

| 파일·필드 | 내용 |
|---|---|
| `blog.title` | Blog 제목 |
| `collection.columns`, `collection.rows` | Search 목록의 열(1~5)과 쪽당 행. `rows: null`이면 한 쪽에 전부 |
| `card.title`, `description`, `tags`, `date`, `comments` | 카드에 보일 항목(참거짓) |
| `card.media` | `image`, `icon`, `none` |
| `card.author` | 선택. `true`면 `config/site.json`의 `name`과 `avatar`를 글쓴이 줄에 표시 |
| `feedSize` | Blog 피드 한 쪽의 글 수 |
| `autoLoad` | 피드 끝에서 다음 쪽을 자동으로 불러올지 |
| `archiveLabel` | Blog에서 Search 전체 글로 가는 링크 문구 |
| `search.title` | Search 제목 |
| `search.labels` | 검색창의 `region`, `input`, `placeholder`, `clear`, `suggestions` 문구 |

카드 설정은 표시만 바꾸고 글 포함 여부는 바꾸지 않는다.

## 카드 표지

`card.media: image`이면 front matter의 `thumbnail`, 본문 첫 그림, 제목으로 만든 표지 순서로 정한다. 제목 표지는 HTML과 CSS로 그리며 그림 파일을 만들지 않고 카드에만 표시한다. `thumbnail.position`(`x`, `y`, 0~100)은 카드 자르기 위치다.

## 댓글 수

빌드가 GitHub CLI(`gh api graphql`)로 `config/site.json`의 저장소·분류에 있는 토론을 읽어 글 ID별 댓글 수를 센다. 인증이 없거나 조회가 실패하면 숫자 대신 댓글 링크를 표시하고 빌드는 계속한다. 결과는 `build-report.json`의 `commentsStatus`에 남는다.

## 모양

카드 배치, 그림 비율, 말줄임, 호버·초점, 좁은 화면 배치는 `src/design/ui/`의 `BlogCard`, `TagFilter`, `TagList`와 `src/design/styles/`가 정한다. 바꿀 위치는 [디자인 시스템](styles.md)에 있다.
