# 공통 구성 요소

> 이 문서의 경로(`tokens/`, `styles/`, `ui/`, `assets/`, `scripts/`, `test/`, `dist/`)는 모두 홈페이지 저장소의 `src/design/` 기준이다. 생성 결과 `dist/`는 Git 밖이며 `npm run build:design`이 만든다. 도표 도구(DiagramPlay)와 다크 모드 발행은 홈페이지에서 제거했다.

공통 UI는 `ui/index.mjs`에서 내보낸다. 소비자는 반환된 정적 HTML을 연결하며 브라우저에서 템플릿 엔진이나 React를 실행하지 않는다.

## 소유

| 모듈 | 책임 |
|---|---|
| `html.mjs` | 텍스트·URL·ID 검사와 신뢰된 HTML 슬롯 |
| `components.mjs` | 카드·코드·선택 줄·갤러리·이미지·영상·도구 설명 등 기본 조각 |
| `patterns.mjs` | 태그·검색·목록·문서 탐색·본문·반복 흐름 |
| `layout.mjs` | 헤더·푸터·소개·구간·인용·구독 폼 |
| `table.mjs` | 본문·단축키 표의 틀과 이름 |
| `document.mjs` | 문서의 접힘·단축키 표시·예제·기능 설명 |
| `icons.mjs` | 공통 카탈로그의 문서·소셜·조작 SVG |
| `runtime/` | 복사·선택 줄(갤러리·장면)·도구 설명·문서 탐색·영상·흐름 |
| `build/` | 토큰 검사와 정적 CSS 축소 |

콘텐츠, 공개 승인, 댓글 공급자, 검색 색인과 URL은 소비자의 책임이다. 같은 UI 구조나 색·간격·시간을 소비자에서 다시 정의하지 않는다. 새 표현은 기존 구성 요소의 속성 또는 이름 있는 새 구성 요소로 추가한다.

## 이름과 값

공통 이름은 Tailwind의 범주를 따른다. `spacing.unit`은 4px이고 `spacing.4`는 16px이다. `text`는 글자 크기, `leading`은 줄 높이, `radius`는 곡률이다. 복합 값은 `component` 아래 의미가 있는 이름을 사용한다.

`tailwind.css`는 `tokens.css`와 같은 값을 `@theme inline`으로 연결한다. 숫자 간격은 `--spacing` 단위로 계산하고 의미 있는 별칭은 해당 이름을 내보낸다. 별도로 손으로 관리하는 Tailwind 팔레트는 없다.

## 입력 경계

```js
import { Card, CardGroup } from '#design/ui/index.mjs';

const cards = [Card({
	title: 'Memory',
	href: '/docs/memory/',
	description: 'Address translation',
})];
const html = CardGroup({ columns: 4, cards });
```

일반 텍스트는 이스케이프한다. URL은 허용 프로토콜과 문자 범위를 검사한다. HTML 슬롯은 `trusted()` 표시가 없는 문자열을 거절한다. 이 표시는 sanitizer가 아니므로 소비자는 검증된 Markdown 출력과 구성 요소의 결과에만 사용한다.

`Details({ title, open, body })`는 제목을 이스케이프하고 검증된 본문을 접기 요소로 감싼다. Markdown 어댑터는 같은 `Details.open({ open })`·`Details.close()`와 `Details.summaryOpen()`·`Details.summaryClose()`로 태그를 조립한다. `open`은 생략하면 `false`다. 요약의 인라인 Markdown, 중첩 접기와 코드 블록은 소비자가 이미 분석한 토큰을 렌더하고 요약이 없으면 요약 태그를 생략한다. 공통 태그나 `app-details` 클래스를 소비자에서 다시 정의하지 않는다.

`Figure`·`Gallery`·`Video`의 표시 폭은 `width: 'content' | 'narrow' | 'wide'`로 지정하며 생략하면 `content`다. `contentWidth(props)`도 같은 문자열을 반환하고 폭 외의 콘텐츠 속성은 허용한다. 어댑터는 원래 블록 입력을 이 함수로 검사한 결과를 `width`에 전달한다. `wide`나 `size`가 자기 속성으로 존재하면 값이 `false`나 `undefined`여도 각각 `Use width instead of wide`·`Use width instead of size` 오류로 거부한다.

영상 재생기의 비율은 `Player.wide`와 `Video.playerWide`, 원본 크기는 `Video.playerWidth`·`playerHeight`로 지정한다. 그림 격자의 `FigureGrid.size`와 카드의 `Card.compact`도 각 구성 요소의 별도 역할이다.

`CardGroup.columns`는 1~5 정수나 정수 문자열로 넓은 화면의 열 수를 정한다. 생략하면 3열이며 좁은 화면에서는 공통 분기점에 따라 줄어든다. 1열은 좁은 화면에서도 유지한다. `Card`와 `BlogCard`의 `showTitle: false`는 제목을 화면에서 숨기되 접근 가능한 이름과 제목 구조를 보존한다. `BlogCard.cover`를 생략하면 표지 자리도 생략한다. `automaticCover: true`이면 제목으로 표지를 만들며 명시한 `cover`는 빈 슬롯도 자동 표지보다 우선한다. `TitleCover({ title })`는 같은 제목 표지를 별도로 조립한다. 표지는 장식이고 카드 링크의 전체 제목은 접근 가능한 이름으로 유지한다.

`Video`와 `ProjectShowcase`는 첫 재생 시도부터 브라우저 기본 영상 조작부를 표시한다. 재생에 실패해도 같은 조작부로 다시 시도할 수 있으며, 기본 조작부나 외부 재생 버튼으로 재생에 성공하면 오류 안내를 지운다.

재생 중인 외부 영상 조작부의 일시정지 아이콘은 `color.control-playing-ink`를 사용한다. 로고용 반투명도를 적용하지 않고 흰 기호와 밝음·다크 배경 면에서 구별되는 대비를 유지한다.

`Device`와 `Video.frame: 'iphone'`의 기기 틀은 이미지 없이 CSS로 그린다. 몸체는 `icon.device-case`, 곡률은 `radius.device-radius`, 화면 안쪽 여백은 `component.device-pad`, 화면 곡률은 `radius.device-screen-radius`를 사용한다. `overlay` 슬롯은 선택 사항이며 비어 있어도 틀이 완성된다.

영상 재생 단추는 공통 `ControlIcon`의 재생 아이콘을 안에 넣고 `color.control-link`를 상속한다. 원은 공통 링크 색, 삼각형은 원본의 흰색을 유지한다.

## 정적 빌드

공통 CSS는 소유 모듈에서 한 번 정의하고 빌드가 `@import`를 평탄화한다. 소비자는 `compileStyles`에 전체 HTML과 브라우저 스크립트를 넘긴다. 사용 선택자, 동적 상태, CSS 변수의 전이 참조와 모든 모드를 보존한 뒤 축소한다. 스크립트는 `manifest.mjs`의 기능별 조건으로 필요한 페이지에만 포함한다.

코드 복사의 성공·실패 표시 시간은 `duration.notice`에서 읽는다. 복사 버튼의 hover·focus·active와 태그 hover는 공통 조작 색을 사용한다. 콘텐츠 아이콘의 도형 좌표, 미디어 원본 크기, 배치 계산의 숫자는 화면 토큰과 다른 데이터다.

## 헤더와 구독 폼

`SiteHeader({ title, homeLabel, icon, logo, items, label })`는 보이는 사이트 이름과 접근성 이름을 구분한다. `title`을 생략하면 `homeLabel`을 표시하고, `icon`은 선택적인 검증 HTML 슬롯이다. `logo`를 전달하면 검증한 이미지나 SVG가 `icon`과 `title`을 대신하며 `homeLabel`은 홈 링크의 접근성 이름으로 유지한다. SVG 글자 이미지는 기존 SVG 렌더러로 검증하고 `currentColor`로 제목색을 상속한다. `Hero.icon`도 같은 검증 슬롯이다. 소비자는 일반 로고에는 `app-hero-logo`, 글자 이미지에는 `app-hero-wordmark` 클래스를 선택하고 원본 비율을 유지한다. 글자 이미지의 높이·반응형 범위는 [스타일 계약](styles.md#구성-요소-계약)을 따른다.

`SectionIntro`의 `icon` 슬롯은 공통 제목 자리 안에 놓인다. 카탈로그 SVG 파일은 `ContentIconImage({ src, size: 'card' })`로 조립하며, 인라인 SVG는 `ContentIcon({ graphic, size: 'card' })`을 쓴다. 원본 PNG는 기존 이미지 슬롯으로 전달한다. 제목 자리는 두 표현을 가운데 놓고 소비자가 크기나 위치를 따로 보정하지 않는다.

`EmailForm({ id, action, field, label, placeholder, button, note })`는 이메일 입력과 제출 버튼을 조립한다. `action`이 있으면 이메일 유효성을 검사하는 기본 POST 폼이고, 없으면 입력과 버튼을 비활성화한다. 주소를 대신 만들거나 전송 성공을 흉내 내지 않는다. 공급자 주소·동의 문구·응답 처리는 소비자가 정한다. `note`는 검증한 HTML 슬롯이고 안내 ID는 `${id}-state`로 연결한다. 홈 구독은 `Section({ variant: 'form', ... })` 안에서 같은 폼을 쓴다.

## 텍스트 입력과 검색

`TextInput({ id, name, label, type, value, placeholder, autocomplete, describedBy, required, disabled, size, surface, icon, action, role, controls, labelVisible })`는 모든 텍스트 입력의 단일 구성 요소다. 보이지 않는 이름표와 `.app-input` 입력을 조립한다. `labelVisible: true`이면 이름표를 `.app-field-label`로 입력 위에 보인다. `type`은 `text`·`email`·`url`·`tel`·`date`·`password`, `size`는 `small`·`medium`·`large`·`control`, `surface`는 `track`·`field`·`card`·`bare`만 받는다. `name`의 기본값은 `id`다. `icon`과 `action`은 검증한 HTML 슬롯이며, 있으면 입력과 함께 `.app-input-field` 안에 앞 아이콘과 뒤 동작으로 놓인다. `role`은 `searchbox` 또는 `combobox`이고 `combobox`는 추천 목록 ID `controls`가 필요하다. `describedBy`와 `controls`는 ID로 검증하고 값과 안내 문구는 일반 텍스트로 이스케이프한다. `SearchBox`는 `large`가 참이면 `size: 'large'`, 아니면 `size: 'medium'`을 선택하고 `surface: 'field'`로, `EmailForm`은 `size: 'control'`, `surface: 'card'`로 이 구성 요소를 조립한다.

`SearchResultLink`의 `icon`을 생략하면 빈 아이콘 슬롯과 들여쓰기도 생략한다. `SearchMessage({ lines })`은 문자열 배열을 안전하게 줄바꿈하고 같은 중앙 정렬 영역에 소비자의 재시도 버튼을 추가할 수 있다. 소비자는 재시도 동작과 검색 색인을 소유한다. 공통 구성 요소는 검색 결과의 HTML만 만든다.

`SearchBox({ combobox: false, ... })`는 입력에 `searchbox` 역할을 사용하고 추천 팝업 ARIA를 붙이지 않는다. 기본값은 `combobox: true`다. `ContentGroup({ collection: true, ... })`는 글 목록 영역의 바깥 간격을 적용한다.

검색 결과의 유형 표시는 짧은 한 덩어리로 유지한다. 긴 제목은 줄바꿈할 수 있지만 제목 뒤의 유형 표시는 중간에서 갈라지지 않는다.

## 글 관리

사이트 화면 위에 얹는 글 관리 조각이다. 기본 조각은 `ui/editor.mjs`와 `styles/editor.css`, 관리 화면은 `ui/write.mjs`와 `styles/write.css`가 소유한다. 보이고 숨기는 일과 저장은 사용하는 쪽 스크립트가 맡는다. 글자 굵기와 크기는 블로그 카드·글 머리와 같은 단계를 쓴다.

- `Button({ label, variant, type, action, disabled, hidden, pressed, controls, context })`: `variant`는 `primary`·`secondary`·`quiet`·`link`다. `link`는 면 없는 링크색 글자이고, `controls`가 있으면 펼침 상태에 따라 아래·위 화살표를 붙인다. 높이는 입력과 같고, 좌우 안쪽 1em·곡률 .45em·호버의 옅은 그림자는 Things `.button` 값이다. `action`은 스크립트가 찾는 `data-action` 이름이며 소문자와 `-`만 받는다. `controls`는 단추가 펼치는 영역의 ID이며 `aria-expanded="false"`로 시작한다. `context`는 같은 이름의 단추가 여럿일 때 화면 읽기용 숨김 글로 덧붙이는 대상 이름이다. Blog 피드의 댓글 펼침 링크(`link`)가 이 둘을 쓴다.
- `LinkButton({ label, href, variant, external, hidden })`: 단추 모양의 링크다. `external: true`이면 새 창으로 열고, `hidden: true`이면 처음엔 숨긴다.
- `TextArea({ id, name, label, value, placeholder, rows, variant, labelVisible, maxLength, describedBy })`: `variant`는 `field`(회색 면)·`title`(글 제목 크기, 내용 높이만큼 늘어남)·`source`(본문 원문)다. 크기 조절 손잡이는 두지 않는다.
- `Field({ control, hint, hintId })`: 입력과 도움말 묶음이다.
- `AdminDock({ count, panel })`: 오른쪽 아래에 고정되는 관리자 단추 묶음이다. 위는 임시·비공개 글 수를 보이는 목록 단추(`open-drafts`), 아래는 새 글을 여는 동그란 + 단추(`new-post`)다. 크기는 `spacing.admin-fab`, 그림자는 `shadow.admin`이다.
- `AdminDrafts({ id, items })`: 단추 묶음 위에 뜨는 임시·비공개 글 목록 카드다. 항목은 `{ id, title, date, label }`이며 label은 상태 이름(기본 임시저장)이고 `data-item`으로 고른다.
- `PostOwnerActions()`: 글 화면의 글쓴이 줄 끝에 붙이는 수정(`edit-post`)·삭제(`delete-post`) 글자 단추다.
- `TagInput({ id, label, tags, placeholder })`: 사이트 태그 모양의 칩과 `surface: 'bare'` 입력이다. 칩의 `data-tag`가 태그 값이다.
- `WriteToolbar({ label })`: 제목 1~4, 굵게·기울임·취소선, 인용·링크·그림·코드 단추다. `data-format`이 넣을 문법이며 본문을 스크롤해도 위에 붙어 있다.
- `WriteScreen({ id, preview })`: 화면 전체를 덮는 작성 창이다. 왼쪽은 제목·태그·서식·본문과 아래 막대(나가기 `close-write`, 저장된 글에서만 보이는 삭제 `delete-current`(처음엔 숨김), 임시저장 `save-draft`, 출간하기 `open-publish`), 오른쪽은 사이트 글 화면과 같은 흰 면의 미리보기 칸이다. `feature-split`보다 좁으면 편집 칸만 보인다.
- `PublishScreen({ id, urlPrefix, card })`: 출간 설정 창이다. 왼쪽은 목록 카드 미리보기(`card` 슬롯, 사용하는 쪽이 `BlogCard`로 채움)과 요약 칸(`description`, 150자, 글자 수 `data-publish-count`, 비우면 사용하는 쪽이 본문 첫 문단으로 채움). 썸네일은 본문에서 자동으로 정한다., 오른쪽은 공개 설정(`visibility-public`·`visibility-private`, 고른 쪽 `aria-pressed="true"`는 주 단추 색으로 채움)·주소 이름·발행일과 취소(`close-publish`)·출간하기(`publish`)다. 폭은 `container.publish`다.
- `AdminLogin({ title, logo, home, homeLabel, actions, status })`: 사이트 머리·꼬리말 없는 빈 화면 가운데에 사이트 로고(`logo` 슬롯, 홈 링크)와 로그인 단추만 두는 로그인 화면이다. `title`은 화면 읽기용 제목이다. 단추 폭은 `container.admin-login`이다.
- `Dialog({ id, title, body, actions })`, `Toast()`: 확인 창과 화면 위 가운데의 짧은 알림이다. 알림은 클릭을 가로채지 않아 아래 단추를 가리지 않는다.

겹침 순서는 `z-index.admin` < `write` < `dialog` < `toast`다. 기본 단추는 Things 기본 단추(회청 면 `color.button.surface`, 진한 글자 `color.button.ink`, 굵기 600, 호버·누름 `color.button.hover`·`active`)이고, 주 단추는 Things 강한 단추(accent-1 면 `color.button-primary` `#4f91fb`, 흰 굵은 글자 `color.button-primary-ink`, 호버 `#649fff`, 누름 `#3c84f3`)다. 비활성은 투명도 `opacity.button-disabled`(.4)다.

## 소비 방식

화면 코드는 `#design/ui/index.mjs`로 가져온다. 생성과 검사 절차는 [스타일 수정 지도](../styles.md#디자인-수정)를 따른다.

## 선택 줄과 도표

문서 탭(`Tabs`, 기기별 안내 `platform`, 그 동기화)은 없앴다. 선택 줄은 갤러리와 도표 장면만 쓴다.

갤러리와 장면 선택 줄은 `TabList`의 `afterPanel: true`로 패널 아래 간격을 공유한다. 선택 줄은 `text.body-text`를 글자 기준으로 사용하므로 부모 글자 크기가 달라도 버튼의 글자·여백·곡률이 같다. 이 간격과 버튼의 상자 크기·안쪽 여백·시스템 글꼴은 `styles/tabs.css` 하나가 정하고 재생기 푸터에서 여백을 더하지 않는다.

`TabList`의 기본은 `selector: 'buttons'`(둥근 버튼)이며 `DiagramFrame`이 이 모양을 쓴다. 다른 모양은 `selector`에 `segmented` 또는 `numbers`를 명시한다. `Gallery`는 패널 묶음(`.app-tabs`, `data-tabs`)과 그 아래 `TabList`를 조립하며 라벨이 모두 있으면 `segmented`, 아니면 `numbers`를 선택한다. 갤러리의 장 선택은 `runtime/document.js`가 `bindTabs`로 연결한다.

`DiagramFrame`은 같은 `TabList`로 장면을 선택하고 `runtime/tabs.js`의 `bindTabs`로 aria-selected, Tab 정지점, 방향키·Home·End를 연결한다. 다이어그램의 시간표와 장면 선택 후 재생은 소비자가 맡는다. 선택 색·호버·전환 시간·움직임 줄이기는 `styles/tabs.css` 한 곳에서 정한다.

`DiagramEmbed({ src, title, dimensions: { width, height }, width })`는 빌드한 같은 출처 HTML을 iframe에 넣는다. 표시 폭 `width`는 코드·그림과 같은 `content`·`narrow`·`wide`이고 생략하면 본문 폭이다. `dimensions`는 도표의 측정값으로 초기 iframe 크기에만 쓰며 내용 높이를 받으면 갱신한다. 도표는 가용 폭을 꽉 채우고 가로로 스크롤하지 않는다. 본문에 삽입된 재생기와 일반 캔버스에는 별도 세로 스크롤을 만들지 않고 전체화면 확대 때 양쪽 축으로 이동한다. `runtime/diagram.js`는 출처·프레임을 확인한 높이 메시지와 부모 테마를 연결한다. 도표가 없는 페이지에는 이 동작을 싣지 않는다.

샌드박스의 실제 출처가 `null`이면 등록된 같은 URL 출처의 도표 창에만 `*`로 테마를 보내고, 그 창에서 온 `null` 출처의 높이 요청만 받는다. 일반 페이지는 실제 출처 일치를 요구한다. `allow-same-origin` 권한을 추가하지 않는다.

`chartMotionCss(growMs, dotAts)`는 HTML 차트의 성장·점·값 표시 스타일을 만든다. `CHART_GROWTH`는 SVG도 읽는 성장 모양의 정본이며 장면별 시작·끝 시각 계산은 소비자가 맡는다.

## 블록 조작부

`ToolButton({ action, label, icon })`은 이름 있는 아이콘 버튼, `Toolbar({ label, buttons, extra })`는 상태 알림과 버튼 묶음, `ToolHeader({ label, toolbar })`는 블록 안의 머리글이다. 버튼·추가 조작은 검증된 HTML 슬롯만 받는다. `ControlIcon(name, className)`과 `ToolIcon`의 이름은 공통 조작 아이콘 목록 안에서만 선택한다. `CodeBlock`과 `DiagramFrame`은 이 구성 요소를 조립한다. 소비자는 별도 버튼 CSS나 복사 피드백을 만들지 않는다. 결과 문구는 공통 화면 읽기용 숨김 클래스로 배치 흐름에서 제외하고 `aria-live`로 알린다. 버튼 아이콘과 `title`은 성공·실패를 나타내고 실패하면 재시도를 안내한다. 알림을 초기화할 때 원래 아이콘과 `title`로 복원한다.

`ControlIcon`의 댓글 역할은 말풍선의 하늘색 면과 파란 윤곽을 보존한다. 재생·일시정지와 함께 원본 색 역할을 사용하며, 나머지 조작 아이콘은 `currentColor`를 따른다. 인라인 역할은 공통 토큰 CSS의 현재 테마를 따르고, `readIcon`의 독립 SVG는 밝음 값으로 고정된다.

버튼 묶음은 별도 면 없이 코드·도표 블록 위에 놓인다. 코드 블록은 이름표 없는 머리(오른쪽 위 겹침)를, 도표 틀(`DiagramFrame`)은 `ToolHeader({ row: true })`의 단추 줄을 쓴다. `CodeBlock`의 `language`는 머리줄로 보이지 않고 `data-language` 속성으로 남으며, `filename`만 이름표가 된다. `Callout({ tone })`은 `success`, `warning`, `error`만 받는다. 호버·키보드 초점과 누르는 동안의 상태는 공통 스타일로 표시하며, 복사 성공·실패 상태색을 유지한다. 소비자는 버튼 개수나 동작만 조립한다.

## 표와 색상

`Table({ body, caption, label })`은 검증된 행·열 HTML을 받아 공통 표로 감싼다. Markdown 어댑터는 같은 `Table.open()`·`Table.close()`를 쓴다. 열 정렬은 공통 `is-center`·`is-right` 변형을 사용한다. 단축키 표도 이 구성 요소를 사용한다. 표가 넓으면 이름 있는 표 영역만 가로로 이동하며 Tab으로 초점을 두고 방향키로 마지막 열까지 읽을 수 있다. 본문이나 도표에 고정 높이를 주지 않는다. 셀의 폭과 긴 내용의 줄바꿈은 [본문과 코드](styles.md#본문과-코드)의 계약을 따른다.

도표의 범주 색은 `color.category`의 구분색 넷(주황, 파랑, 진한 회색, 연한 회색) 한 벌이다. 막대·원형 조각·시간 구간·이동 점·범례는 같은 `fill`을 쓰고, 넓은 면 전용 팔레트는 두지 않는다. 이름 있는 색의 글자와 도형의 옅은 면·테두리는 같은 계열의 `ink`·`tint`·`line` 역할을 사용한다. 단추·링크·켜진 경로는 메인 주황(`color.main`), 상태는 `color.status`의 상태색 아이콘이다. 값과 규칙은 [색 체계](styles.md#색-체계)에 있다.

빈 작업 큐의 면은 `color.figure.queue-empty`로 표시한다. 밝은 테마에서는 기존 `color.gray.59`를 참조해 채워진 항목보다 약하게 표시하며, 다크 테마는 같은 의미 토큰의 별도 참조를 사용한다.

`ContentIcon({ graphic, badge, size })`은 검증한 SVG 슬롯을 공통 크기와 배치로 감싼다. 선택적인 `badge`도 검증한 슬롯만 받으며 오른쪽 아래에 주 도형 절반 크기로 놓는다. 글 유형을 붙일지는 소비자의 콘텐츠 규칙으로 결정한다.

`BlogCard`의 자동 제목 표지(`automaticCover`)는 그림이 없는 글의 표지를 제목으로 만든다. 사이트 태그와 같은 파란 면에 제목을 왼쪽 아래로 놓는다. 카드는 위에서부터 표지, 태그, 제목, 요약, 글쓴이·날짜·댓글 순서로 놓인다. 제목은 `component.card-summary-lines` 줄, 요약은 `component.blog-card-summary-lines` 줄까지 보인다. `tagItems`는 앞에서부터 `tagLimit`(기본 3)개만 보인다. `author`는 `{ name, avatar }`이며 `avatar`는 선택 사진 주소다. 카드 여백·간격·곡률은 `spacing.blog-card-inset`, `spacing.blog-card-gap`, `radius.blog-card-radius`가 소유한다.

`BlogCard.commentsHref`는 카드의 글 링크와 분리된 댓글 링크다. 유효한 댓글 수가 있으면 `댓글 · N`을 표시하고, 댓글 주소만 있으면 `댓글 보기`를 표시한다. 보이는 텍스트가 접근 가능한 이름이며 아이콘은 사용하지 않는다.

## 확장

새 소비자의 프레임워크 래퍼는 실제 사용처가 생길 때 추가한다. 같은 정본을 상속하고 실제로 다른 속성만 재정의한다.

서비스 브랜드 아이콘 크기는 `spacing.figure.icon.brand`를 사용한다. 이 역할은 기본 node 아이콘 크기를 참조하며 도표 node·tile·store·group에서 같은 서비스 로고에 적용한다. 일반 tile 아이콘과 사람 아이콘의 별도 크기는 유지한다. 이 역할을 요구하는 소비자는 패키지 `0.2.0` 이상과 해당 Git commit을 사용한다. 이전 패키지의 누락 역할을 임의 크기로 채우지 않는다.

`TagFilter({ tags, reset })`는 `id`, `label`, `selected` 항목을 중앙 정렬한 태그 토글로 만든다. 토글은 실제 단추이며 `aria-pressed`로 선택 상태를 표시한다. 호스트는 `data-tag-toggle`의 태그 ID를 검색 상태에 반영한다. `SearchBox`의 선택 `filters` 슬롯으로 추천 검색어 아래에 배치한다. 후보 태그와 교집합 계산은 호스트 검색 모델이 맡는다.

`PageHeading({ title, icon })`는 선택적 장식 아이콘을 포함한 페이지 제목이다. `icon`은 검증된 슬롯이며 접근 가능한 제목은 일반 텍스트로 유지한다. `BlogCard`의 댓글 표시는 아이콘 없이 `댓글 · N` 텍스트를 사용한다. `commentCount`가 유효하고 `commentsHref`가 없으면 비대화형 텍스트를 표시한다. 댓글 주소만 있으면 숫자를 추측하지 않고 `댓글 보기` 링크를 표시한다.

`LogoItem({ href, label, src })`은 목적지가 있으면 기술 로고 링크를 만든다. 목적지가 없으면 같은 크기의 비대화형 `span`에 비활성 상태를 표시하고 공통 `opacity.dim`을 적용한다. 소비자는 `label`에 관련 글이 없는 상태를 설명한다. 비활성 항목은 탭 이동과 호버 동작을 갖지 않는다.

`Tag({ href, label, size })`와 `TagList({ tags, limit, size })`의 크기는 `small` 또는 `medium`이며 기본값은 `small`이다. 목록은 넘침 항목에도 같은 크기를 사용한다. `TagFilter`는 기본 하늘색, 진한 하늘색 호버, 파란색·흰 글자 선택 상태를 구분하며 선택된 태그가 있으면 끝에 파란 밑줄 초기화 링크를 표시한다.

`FlowRail`은 원본 목록의 자연 폭이 viewport의 padding과 border를 뺀 가용 폭보다 클 때만 복제 목록과 자동 이동·가장자리 페이드를 만든다. 폭이 같거나 작으면 원본만 표시하고 기술 로고 행을 중앙에 둔다. 크기나 원본 내용이 바뀌면 다시 측정하며 모두 들어오게 되면 애니메이션과 복제를 제거하고 스크롤 위치를 초기화한다. 인터뷰의 두 행은 실제로 넘치는 행만 이동하고, 둘 다 넘치면 기존의 같은 픽셀 속도를 유지한다. 키보드 초점·수동 스크롤·움직임 줄이기·페이지 가시성의 정지와 재개 계약은 유지한다.
