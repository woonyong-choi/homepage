# homepage

개인 사이트의 콘텐츠와 조립 코드만 소유한다. 원문은 비공개 자료 저장소, 범용 디자인은 design-tokens가 정본이다.

설계와 작성 안내는 [문서 목록](docs/README.md)에 있다.

## 필수 디자인 제약

- homepage와 DiagramPlay는 design-tokens의 같은 토큰·CSS·아이콘·공통 구성 요소·동작을 상속한다. 화면 표현값의 하드코딩과 요소별 마크업·CSS·상태 처리의 재구현은 금지다. 같은 토큰을 읽는 복사 구현도 허용하지 않는다.
- 새 공통 표현은 design-tokens의 소유 구성 요소에서 구현한 뒤 가져와 조립한다. 제품 차이는 그 구성 요소의 속성·변형으로 필요한 부분만 재정의한다. 페이지별 보정이나 검사 예외로 결함을 숨기지 않는다.
- 문서 탭과 DiagramPlay 장면 탭의 선택·호버·초점·키보드·전환·움직임 줄이기는 같은 계약을 사용한다. 도표의 문법을 홈페이지에서 다시 해석하지 않고 DiagramPlay의 정본 렌더러를 사용한다.
- DiagramPlay의 애니메이션과 트래픽 효과는 기술 문서의 필수 표현이다. 문서 안에서도 장면·동시 이동·반복·값 변화·강조의 공통 동작을 유지하고 실제 화면에서 검수한다.
- Things의 대응 요소, 홈페이지와 삽입한 DiagramPlay를 실제 크기로 비교해 글자·아이콘·정렬·간격·애니메이션이 자연스럽게 이어지는지 검수한다. 의도된 제품 차이 외의 불일치는 공통 소유 지점에서 수정한다. 자동 검사만으로 디자인 완료를 선언하지 않는다.

## 구성

- `content/home.md`, `content/interviews/index.md`, `content/pages/tech.md`: Vault에서 승인받아 가져오는 홈 원고
- `config/`: 승인된 작성 설정과 빌드가 관리하는 승인·자산 목록
- `src/`: 콘텐츠 해석, 검색·댓글, 경로와 페이지 조립
- `package.json`: 디자인(`@woonyong-choi/design-tokens`)·DiagramPlay·문서 엔진의 고정 commit Git 의존성. 사본을 두지 않는다
- `content/blog/`: 공개 Blog의 승인 사본. 직접 수정 금지
- `content/docs/`: 개인 미리보기·동기화 호환 입력. 공개 빌드는 발행하지 않으며 승인된 문서가 있으면 중단
- `src/fixtures/blog-demo/`: 명시적인 데모 모드에서만 사용하는 합성 글
- `content/assets/`, `content/media/`: 사용 중인 콘텐츠 자산과 고지
- `docs/`: 현재 구현의 설계와 사용 안내
- `scripts/`: 검사. 산출물은 Git 밖 `dist/site/`

## 명령

```sh
npm run build:site
npm run check:product
npm run check:tokens
```

## 규칙

- 한국어로 소통하고 이모지를 쓰지 않는다. 저장소 관리 문서의 작업 언어는 한국어다.
- GitHub 이슈에 완료 조건을 정하고 이슈당 브랜치와 PR 하나를 사용한다. 사용자의 병합 권한 안에서 작업한다.
- 커밋은 `type(scope): 한글 설명` 형식과 사용자 Git 작성자를 사용한다. 작성 도구 표시나 트레일러를 남기지 않는다.
- 색·글꼴·간격·시간·공통 CSS·아이콘·UI 구성 요소·공통 동작은 design-tokens에서 정의한다. 같은 요소를 홈페이지에서 다시 구현하지 않는다.
- 컴포넌트는 `@woonyong-choi/design-tokens/ui/index.mjs`에서 가져온다. 공통 마크업이 필요하면 정본에 구성 요소를 추가한다.
- 디자인 이름은 Tailwind의 `color`, `text`, `spacing`, `radius`, `font`, `duration` 계열을 따른다. 프로젝트 이름을 토큰 이름으로 쓰지 않는다.
- 비공개 Vault 원문을 수정하고 명시적으로 승인한 뒤 `content:sync-vault`로 가져온다. 홈 원고와 승인 목록의 작성 설정·자산도 사본이며 직접 수정하지 않는다. 승인 목록에 없는 파일은 공개하지 않는다.
- 공개 글은 Blog 하나다. 목록·검색·태그는 `/search/`, 최근 본문 피드는 `/blog/`, 상세는 `/blog/<slug>/`, RSS는 `/blog/feed.xml`이다. 공개 분류·문서 계층·글 아이콘을 요구하지 않는다.
- 태그는 기술·산책·독서·회고 같은 임의 문자열이다. `config/tags.json`은 표시 이름·별칭이며 허용 목록이 아니다.
- 개인 Vault의 `renderPagePreview`, `documentRoute`, `publicationLinks`와 승인·해시·동기화 트랜잭션 계약을 유지한다. 개인 위키의 `category`, `parent`는 공개 Blog 모델과 분리한다.
- 루트에는 도구가 요구하는 메타데이터와 README·AGENTS·문서 색인만 둔다. 미사용 코드·자산·산출물은 보관용 폴더를 만들어 남기지 않는다.
- 커밋 전 명령 절의 검사를 모두 통과한다. 화면 변경은 실제 내부 URL에서 확인하고 작업용 Chrome 탭을 닫는다.
- Things와의 비교는 공식 화면의 실제 동작을 근거로 한다. 개인 사이트의 의도된 확장을 원본 기능으로 설명하지 않는다.
