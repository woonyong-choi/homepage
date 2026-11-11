# 공통 아이콘

> 이 문서의 경로(`tokens/`, `styles/`, `ui/`, `assets/`, `scripts/`, `test/`, `dist/`)는 모두 홈페이지 저장소의 `src/design/` 기준이다. 생성 결과 `dist/`는 Git 밖이며 `npm run build:design`이 만든다. 도표 도구(DiagramPlay)와 다크 모드 발행은 홈페이지에서 제거했다.

유형 선택과 시각적 합격 판정은 [아이콘 유형별 설계·검수](../../../src/design/assets/icons/AGENTS.md)를 따른다. 기본 외곽 유형 하나, 해당하는 모든 추가 유형, 공통 필수 조건을 함께 적용한다. Things 웹 원본의 측정값은 비교를 시작하는 근거이며 공식 규격이나 자동 합격 범위가 아니다. 이 문서는 소스·카탈로그·표현·렌더러의 구현 계약과 기술 의미의 근거를 관리한다. 기준 변경 전 관찰은 새 유형별 검수를 대신하지 않는다.

## 기술 로고의 선택과 보존

기술 이름은 해당 프로젝트·재단·제작자가 배포한 로고로 표시한다. 공식 배포본 안에서 배경 없는 심벌과 평면형을 우선 선택하고 원래 색·도형·비례를 보존한다. 같은 표시 크기에서 실제 도형의 크기와 중심을 비례 변환으로 맞춘다. 독자 제작 콘텐츠 아이콘의 Things 조형 규칙을 기술 로고의 재디자인 지시로 적용하지 않는다.

기술·서비스 브랜드 원본과 출처는 소비자 수와 관계없이 이 저장소의 `assets/icons/brands/`와 `assets/icons/catalog.json`의 `brands`에서 관리한다. 전체 Git 패키지는 기존 공통 브랜드 6개, 홈페이지에서 이관한 기술 로고 11개, AWS 서비스 아이콘 17개를 제공한다. 각 항목에 배포 출처·변형·원본 해시·변환 결과 해시·권리 안내를 기록한다. Linux는 공식 배포본이 아니라 Devicon v2.17.0의 Tux 변형이며, JavaScript는 원제작자가 배포한 커뮤니티 로고다.

소비자는 이 정본을 읽으며 브랜드 SVG와 출처 목록을 따로 복제하지 않는다. `test/asset-provenance.test.js`는 브랜드 원본과 카탈로그의 대응, 해시·출처·고지 연결을 검사한다. 브랜드를 추가해도 공통 HTML 역할이나 도표 선택 집합에 자동으로 넣지 않는다.

정본 SVG 이름·경로·viewBox를 유지한다. 임시·구형·레거시 SVG나 소비자별 복제본을 디자인 정본에 남기지 않는다. 원배포 다운로드·비교 캡처·실패 시안은 저장소 밖의 검수 영역에서만 다룬다. 기본형·상세형과 `npm run build:design`이 생성하는 `dist/`는 기존 계약을 따른다.

원본 도형을 다시 그리지 않는다. 기존 렌더러가 지원하지 않는 색 표현을 정적 벡터로 변환했다면 원래 도형·팔레트·그라디언트 함수와 변환 사실을 기록하고, 같은 크기의 원배포 렌더와 픽셀·시각 대조한다. 이 호환 변환을 원본 파일의 바이트 그대로라고 설명하지 않는다. 출처·권리 고지는 카탈로그가 연결한 `assets/icons/licenses/`의 각 고지를 따른다.

아이콘 원본은 `assets/icons/<의미>/<이름>.svg` 한 곳에서 편집한다. 홈페이지와 DiagramPlay는 같은 배포본과 렌더러를 사용한다. `icons` 안의 깊이는 의미 폴더와 파일까지 2단계다. 이 제한은 홈페이지 원고에는 적용하지 않는다.


## 고치는 곳

| 대상 | 위치 |
|---|---|
| 기본 도형 | `assets/icons/<의미>/<이름>.svg` |
| 상세 도형 | 같은 폴더의 `<이름>-detail.svg` |
| 원본 비트맵 | `assets/icons/communication/newsletter.png`, `testimonials.png`, `technology-thought.png` |
| 자산 출처·라이선스·해시 | `assets/sources.json` |
| 분류 설명·별칭·역할·브랜드 출처 | `assets/icons/catalog.json` |
| 외부 원본 고지 | `assets/icons/licenses/*.txt` |
| 색·표시 크기 | `tokens/tokens.json`의 `icon` 역할 |
| 배치·조립·안전한 SVG 삽입 | `styles/icons.css`, `ui/patterns.mjs`, `ui/svg.mjs` |

파일 이름은 소문자 kebab-case이고 카탈로그 전체에서 고유해야 한다. 기존 `-mono` 이름은 참조 호환성을 위해 유지하고, 상세 대안은 `-detail`을 사용한다. 색상과 단색을 따로 그려야 할 때는 같은 SVG 안의 두 표현 그룹을 사용한다. 크기별 폴더나 SVG를 변환한 PNG 사본은 만들지 않는다. 별칭은 검색어와 이름 해석을 연결하며 기존 직접 이미지 경로를 대체하지 않는다. 현재 소비자가 참조하지 않는 일반 도형·별칭·역할은 함께 제거한다. 중앙 브랜드 원본은 이 일반 도형 정리 조건과 별도로 관리한다.

현재 일반 SVG는 기본형·상세형을 합쳐 50개이며, 기술·서비스 브랜드 34개와 함께 총 84개를 배포한다. 사용 범위에는 공개 블로그(내부 문서 렌더러 포함)·DiagramPlay와 현재 등록된 비공개 미리보기의 메타데이터·이동 목록이 포함된다. 메타데이터는 기존 별칭과 `detail` 선택을 유지한다. 본문에서 수집한 7개 이름은 도표·인라인 토큰 검증이 끝나지 않아 해당 이름의 기본 도형만 보존한다. 이 보존을 본문 사용 검증 완료로 보지 않는다.

별칭 10개는 `admin`·`administrator` → `user-settings`, `apigw` → `gateway`, `architecture` → `hierarchy`, `deploy` → `box-up`, `incident` → `warning`, `model` → `brain-circuit`, `notify` → `event`, `person` → `user`, `processor` → `cpu`다. 역할은 조작부 20개·소셜 3개·도움말 `question`과 빈 `kinds`를 유지한다.

기술과 생각·구독·후기 PNG는 독자 제작물이며 128×128 RGBA 형식을 사용한다. 기술과 생각은 새 경로를 쓰고 구독·후기는 기존 경로를 유지한다. 빌드는 현재 바이트를 그대로 내보내며 소비자는 기존 이미지 `src` 슬롯을 사용한다. SVG 카탈로그·`readIcon`에는 넣지 않는다. 현재 제작 출처·크기·SHA-256은 출처 기록에 둔다. 구독·후기에서 교체 전 Things URL·해시는 `assets/sources.json`에서 분리한다. 교체 전 원본 파일은 저장소와 배포본 어디에도 두지 않고 URL·해시만 `comparison-only` 기록으로 남긴다. 현재 독자 제작물에는 저장소의 MIT 라이선스를 적용한다.

## 자산 출처 기록

`assets/`와 `dist/assets/`의 모든 파일은 `assets/sources.json`의 기록 하나에 대응한다. 단일 파일은 `file`, 같은 출처를 공유하는 묶음은 `files` 경로 패턴으로 적는다. `origin`은 `project-original`, `third-party`, `catalog`, `license-notice` 중 하나이고 `license`는 비울 수 없다. `third-party`는 원배포 `https` URL을 가지며 `catalog`는 `icons/catalog.json`의 라이브러리·브랜드 출처와 `icons/licenses/` 고지를 따른다. `sha256`·`bytes`를 적은 기록은 현재 파일과 일치해야 한다.

출처나 라이선스 기록이 없는 그림과 Things 웹사이트(culturedcode.com)에서 가져온 파일은 두지 않는다. `-io50`·`-io70`·`-io80`, `fancysection-`, `arrivals-`, `bezel-` 같은 해당 사이트의 파일 이름 형식도 저장소에 두지 않는다. `previousSource`는 교체 전 원본의 URL·해시 기록이며 같은 해시의 파일이 저장소에 없을 때만 유지한다. `test/asset-provenance.test.js`가 이 계약을 `npm run check:product`에서 검사한다.

재생·일시정지는 기존 컬러 표현으로 검수한다. 필수 조작부는 기본·누름·재생 상태의 실제 불투명도와 인접색으로 대비를 검사한다. 기호 주변에 대비 경계를 추가한 경우 실제 작은 크기에서도 기호와 틈이 남아야 한다. 한 상태에서의 개선이 다른 상태의 대비를 낮추면 통과시키지 않는다.

## 의미별 분류

| 폴더 | 찾을 대상 |
|---|---|
| `documents/` | 책·문서·메모·보고서 등 읽고 기록하는 자료 |
| `files-io/` | 파일·폴더·저장 장치의 입출력과 관리 |
| `actions/` | 일반 명령·선택 결과·상태·찾기·확인 동작 |
| `navigation/` | 이동·방향·탐색·경로 안내 |
| `editing/` | 글자·그림·도형·색·선택 영역 편집 |
| `layout/` | 화면·패널·목록·표·입력 요소의 배치 |
| `media/` | 사진·영상·음악·오디오와 재생·촬영 |
| `communication/` | 메시지·메일·통화·알림·대화·공유 |
| `people/` | 사람·관계·직업·표정·몸짓·사용자 |
| `brands/` | 이름이 특정 서비스·제품·브랜드를 가리키는 표식 |
| `backend-api/` | 서버·API·HTTP·백엔드 서비스 |
| `networking/` | 통신망·연결·무선 신호·네트워크 구성 |
| `programming/` | 소스 코드·개발 도구·언어·버전 관리 |
| `databases/` | 데이터베이스·스키마·관계·질의 |
| `algorithms/` | 흐름·분기·반복·문제 해결 절차 |
| `operating-systems/` | 운영체제·터미널·시스템 실행과 관리 |
| `computer-architecture/` | 프로세서·회로·논리 게이트·컴퓨터 하드웨어 구조 |
| `security/` | 인증·신원·권한·보안·보호 |

브랜드 로고는 이름으로 특정 제품·서비스를 가리킬 때만 선택한다. 일반 글의 주제를 나타낼 때는 해당 의미 폴더를 쓴다. 원배포 고지와 색·도형을 보존하고 공식 변형 선택·비례 확대·호환 변환은 카탈로그의 `treatment`에 기록한다. PostgreSQL은 공식 3색형을 사용하며 배경에 따라 임의로 명도를 바꾸지 않는다.

GitHub 원본은 공식 Invertocat 도형과 검정·흰색 변형을 `icon.brand.github`에 연결한다. 정적 배포 SVG는 아래 빌드 계약에 따라 검정으로 고정되므로 원본의 다크 토큰만으로 어두운 배경 적합성을 보장하지 않는다. 기존 단색 API는 호출자의 `currentColor`를 따른다.

LinkedIn과 NGINX는 공식 SVG에서 독립 심벌 그룹을 선택하고 워드마크·별도 등록 기호를 아이콘 칸에 넣지 않는다.

제공된 수집본 전체의 고지는 `licenses/collected-icons.txt`에 있고, 파일별 원 제공자가 확인되지 않은 항목을 특정 라이브러리나 자체 제작물로 단정하지 않는다.

## 빌드와 사용

`npm run build:design`이 의미 폴더를 읽어 배포 카탈로그의 `icons` 목록을 생성한다. 소스 JSON에는 개별 SVG 파일 목록을 다시 적지 않는다. `getIconCatalog().icons`에서 빌드한 목록을 읽는다. 빌드는 잘못된 깊이, 중복 이름, 없는 별칭·역할·고지, 미해결 토큰과 허용하지 않은 SVG를 거부한다. 좌표와 도형 내부 획은 원본 기하이고 화면의 표시 크기와 일반 아이콘 색은 공통 토큰을 따른다. 브랜드 컬러는 원배포 자산의 식별 색을 유지한다.

`dist/assets/icons`의 독립 SVG는 색 변수를 밝음 값으로 치환한다. `readIcon`도 이 정적 SVG를 반환한다. 역할용 `dist/ui/icon-data.mjs`는 같은 빌드 입력의 원본 변수를 보존하며 공통 토큰 CSS의 현재 테마를 따른다. 단색 역할은 기존처럼 `currentColor`를 사용하고 mask 내부의 색은 보존한다. 독립 SVG는 실제 밝고 어두운 소비 배경에서, inline 역할은 두 테마의 기본·호버·선택 상태에서 검수한다. 필수 외곽·연결에는 양 배경의 대비를 확보하는 고정 중성 역할 `icon.structure-edge`를, 밝은 물체 안의 필수 기호에는 인접색을 확인한 고정 잉크 역할을 사용한다. 기존 테마값 전체를 바꾸거나 소비자 CSS로 결함을 가리지 않는다.

```js
import { getIconCatalog, iconFile, readIcon } from '#design/ui/build/icons.mjs';
import { renderSvgIcon } from '#design/ui/svg.mjs';
import { ContentIcon, trusted } from '#design/ui/index.mjs';

const graphic = trusted(renderSvgIcon(readIcon('document')));
const icon = ContentIcon({ graphic, size: 'small' });
const path = iconFile('document', { variant: 'detail' });
const roles = getIconCatalog().controls;
```

화면 코드는 `#design/ui/build/icons.mjs`와 `#design/ui/svg.mjs`로 같은 함수를 가져온다. 파일을 읽는 `icons`는 Node 진입점이고 SVG 함수는 브라우저에서도 동작한다. `iconFile`은 `documents/document.svg`처럼 카탈로그 루트 기준 상대 경로를, `readIcon`은 해당 파일의 SVG 문자열을 반환한다. `variant`는 `default` 또는 `detail`이며 상세 파일이 없으면 기본 도형을 쓴다. 모르는 이름·경로·변형은 오류다.

`ContentIcon`은 작은 문서 아이콘부터 카드까지 같은 배치를 쓴다. `ControlIcon`, `ArticleIcon`, `SocialIcon`, `ToolIcon`도 같은 카탈로그 역할을 조립한다. `controls`는 댓글 `comment` → `chat`을 포함한 공통 조작 역할, `social`은 GitHub·RSS·LinkedIn, `articles`는 기본 도움말 `question`만 유지한다. 실제 소비자가 쓰지 않는 글 형식 매핑 `kinds`는 빈 객체다. 브라우저용 모듈에는 이 역할들이 사용하는 도형만 넣는다.

SVG 안의 mask ID는 삽입마다 분리한다. 결정적 출력이 필요한 빌드는 서로 다른 `prefix`를 전달한다. 스크립트·이벤트·외부 이미지·외부 URL은 허용하지 않는다. 원본을 직접 바꾸는 대신 화면별 도형이나 CSS 보정을 만드는 것은 금지다.

토큰을 직접 해석하는 원본의 중성 glyph는 `icon.neutral`을 따르고 다크 모드에서 밝은 값으로 바뀐다. 단색 렌더러가 내보내는 `currentColor`는 소비자의 전경색을 상속한다. 종이나 밝은 색면 안의 숫자처럼 어두운 잉크를 유지해야 하는 표식은 `icon.neutral-edge`를 사용한다.

NGINX는 공식 로고의 독립 N 심벌 도형과 고유 녹색을 보존한다. NGINX의 N과 Redis의 내부 흰 표식은 색상 표현에서 불투명하게 유지하며, 단색 표현에서만 음각으로 바꾼다. 흰 배경에서 같아 보여도 두 표현을 합치지 않는다.

공통 대비 검사는 테마별 중성 전경·브랜드 색 토큰의 페이지 대비 3:1, 어두운 잉크와 종이 사이 4.5:1 이상을 확인한다.

이 토큰 검사는 고정 원색을 쓰는 공식 PostgreSQL 로고의 실제 대비를 보증하지 않는다. 공식 자산은 실제 배경에서 별도로 시각 검수한다.

문서·편집기의 불투명한 밝은 표면은 `icon.sheet`, 흰 기호는 `icon.paper`를 사용한다. 두 역할을 분리해 표면색 보정이 흰 기호색을 바꾸지 않게 한다. 색 값의 정본은 [토큰 원본](../../tokens/tokens.json)이다.

### 색상과 단색 표현

불투명 종이면이나 흰 표식이 필요한 색상 도형과, 내부가 비어야 읽히는 단색 도형을 같은 파일에 둔다.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g data-name="color">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="var(--icon-sheet)" stroke="var(--icon-outline)"/>
    <path d="M8 8H16M8 12H16" fill="none" stroke="var(--icon-detail)"/>
  </g>
  <g data-name="monochrome" display="none">
    <rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="currentColor"/>
    <path d="M8 8H16M8 12H16" fill="none" stroke="currentColor"/>
  </g>
</svg>
```

`color`와 `monochrome`은 `data-name`의 예약값이다. 사용하면 두 그룹이 모두 있어야 하며 각각 루트 `svg`의 직계 `g` 하나여야 한다. `color`의 `display`는 생략하거나 `inline`으로 두고, `monochrome`은 `none`으로 둔다. 그룹 밖에는 `title`·`desc`만 둘 수 있다. 중첩·중복·한쪽 누락과 다른 위치의 `display`는 오류다.

일반 SVG 렌더러는 색상 그룹만 표시한다. 공통 `renderSvgIcon`과 `iconBody`는 기존 `monochrome` 옵션으로 한 그룹의 자손과 닫는 태그 전체를 선택하고 다른 그룹은 출력에서 제거한다. 선택 후 `data-name`과 `display`를 제거하므로 단색 그룹도 표시된다. `parseIconSvg`의 `body`는 색상 표현을 반환한다. 파일 이름·카탈로그 이름·공개 API는 바뀌지 않으며, `default`·`detail` 파일 선택과 색상·단색 표현 선택은 독립적이다.

렌더러는 숨겨진 그룹도 같은 규칙으로 전부 검증한다. ID는 파일 전체에서 고유해야 하고 mask는 같은 표현 안의 ID만 참조한다. 그룹 사이의 참조나 그룹 밖 공통 `defs`는 허용하지 않는다. 삽입 시 선택한 도형과 mask 참조에 같은 `prefix`를 붙인다.

단색 출력은 선택한 표현의 보이는 색을 `currentColor`로 바꾸고 mask 안의 흰색·검은색은 보존한다. 예약 그룹이 없는 SVG는 전체 도형에 기존 변환을 적용한다. 두 표현 그룹은 단색 변환을 위해 색상 도형의 불투명 면을 구멍으로 바꾸지 않도록 한다. 새 형식의 SVG와 이를 읽는 렌더러는 같은 빌드·배포본으로 전달한다.

### 디자인 근거와 적용 범위

Things의 [공식 기능 설명](https://culturedcode.com/things/features/)은 명료한 개념·콘텐츠 구조와 필요할 때 드러나는 세부 정보를 강조한다. [크기 조절 설명](https://culturedcode.com/things/blog/2023/09/things-big-and-small/)은 모든 아이콘의 벡터화와 문자·레이아웃의 동반 확장을 명시한다. [OS 26 설명](https://culturedcode.com/things/blog/2025/09/things-for-os-26/)은 익숙한 정체성을 유지하면서 곡률·여백·반응을 조정한 내용이다. 이 설명은 전체 아이콘에 같은 재질이나 배경을 적용하는 제작 규격이 아니다.

[지원 페이지](https://culturedcode.com/things/support/)의 아이콘에서는 밝은 불투명 면·흰 표식과 배경이 있는 그림·독립 실루엣을 관찰할 수 있다. 이는 원본 그림에서 확인하는 특징이며 공개된 수치 규격과 구별한다. 이 저장소의 기술 개념 도형과 색상·단색 분리는 해당 관찰을 참고한 독자 설계다. 지원 페이지의 원본 그래픽은 비교 자료로만 사용한다.

`icon.outline`·`icon.detail`·`icon.accent`·`icon.accent-soft`·`icon.accent-edge`와 `icon.sheet`의 색 값은 원본에서 관찰한 색을 바탕으로 정한 공통 역할이다. Cultured Code가 공개한 수치 규격이 아니며, 이 역할의 변경은 같은 토큰을 참조하는 아이콘 전체에 적용된다.

### 사용 범위와 변경 검수

아이콘을 추가하거나 바꾸기 전에 실제 사용처와 역할을 확인한다. 콘텐츠는 24·32·48px, 조작부는 16·20·24·32px와 실제 사용 크기에서 확인한다. 밝고 어두운 배경, 지원하는 색상·단색 표현과 상태를 각각 검수한다. 제작자와 별도 검수자는 실루엣·의미·광학적 무게·정렬·기호와 틈을 관찰한다. 빌드 성공은 시각적 승인이나 사용자 시험을 대신하지 않는다.

별칭은 이름 조회에만 적용되며 CSS와 문서의 직접 이미지 URL을 대신하지 않는다. 미사용 삭제는 소비자 참조와 역할을 대조하고 예제·카탈로그·배포본을 함께 갱신한다. 남은 원본의 도형을 다시 그리지 않는다. 파일 해시, 관련 색 토큰 또는 렌더러가 바뀌면 영향을 받은 관찰을 다시 확인한다.

## 변경 후 확인

`npm run build:design`, `npm run check:product`, `npm run check:tokens`로 파일 목록, 원본·출력 연결, 역할·별칭, 외부 고지, 안전한 SVG 삽입을 확인한다. 실제 소비 화면에서는 설계 판정 기준에 따라 밝고 어두운 배경, 색상·단색, 기본형·상세형과 사용 크기를 대조한다. 호버·초점·복사 결과·배지 가독성도 확인한다.

검수 기록에는 아이콘 이름, 소스 버전, 비교 근거, 크기·테마·표현, 사용 장면, 발견한 문제와 남은 한계를 적는다. 기준별 판단을 남기고 임의의 완성도 백분율이나 일괄 통과로 대체하지 않는다. 파일 검사·시각 검토·사용자 승인·병합·소비자 반영은 각각 구분한다. 일회성 검수 이미지와 기록은 제품 저장소에 쌓지 않는다.

에이전트나 제작자의 검토는 사용자 시험이 아니다. 사용자 시험에서는 대상 독자에게 이름 없는 그림의 형태를 설명하게 한 뒤, 실제 문맥에서 예상 의미와 선택 행동을 확인한다. 비교하는 시안의 위치와 라벨 조건을 유지하며 혼동과 선택 이유를 기록한다. 참여자 관찰 없이 인식률·과제 성공률을 주장하지 않는다. 사용자의 미적 선호 승인과 대상 독자의 의미 이해도도 별도로 기록한다.
