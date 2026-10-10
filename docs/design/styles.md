# 스타일 수정 지도

이 사이트의 화면 스타일은 design-tokens 저장소의 simple 테마가 정본이다. 여기서는 어떤 변경이 어느 저장소의 어느 단계에서 끝나는지만 정한다. 모듈 소유 표, 덮어쓰기 순서, `@import` 평탄화 규칙은 design-tokens의 `docs/styles.md`가 정본이다.

## 단계

| 하고 싶은 일 | 고치는 곳 | 저장소 |
|---|---|---|
| 색·간격·글자 크기 | `themes/base/simple/tokens.json` | design-tokens |
| 공통 조각(카드·본문·검색·입력)의 모양 | `themes/base/simple/styles/{cards,prose,search,forms,...}.css` | design-tokens |
| 한 화면의 배치와 변형 | `styles/{landing,blog,article,support,features,pages,status}.css` | design-tokens |
| 홈 섹션 구성·순서·문구 | `product/home.config.yaml` | blog |
| 글의 구성 요소 | Markdown의 ` ```ui:이름 ` 블록과 `:::이름` 블록 | blog |
| 새 마크업이 필요한 클래스 | `product/*-layout.mjs`, `home-sections.mjs`, `markdown.mjs`에서 기존 클래스를 조합 | blog |

- `product/vendor/theme/`는 가져온 완성본이다. 직접 고치지 않는다. 스타일을 바꾸면 design-tokens에서 `npm run build` 후 이 저장소에서 `npm run theme:product -- <design-tokens 경로>`로 다시 가져온다.
- 완성본의 `styles.css`는 모듈을 이미 한 파일로 합친 결과다. 요청 수와 URL은 분리 전과 같다.
- 새 변형은 선택자를 더 길게 만들어 기존 규칙을 이기지 않고, 소유 조각의 수식 클래스와 토큰으로 만든다. 현재 남은 맥락 선택자는 호환 규칙이다.
- 새 클래스를 마크업에 쓰려면 먼저 같은 역할의 기존 클래스(`app-help-card`, `app-landing-heading`, `app-prose` 아래 요소)로 표현할 수 있는지 본다. 없을 때만 design-tokens에 규칙을 추가한다.

## 콘텐츠에서 스타일까지

홈은 `type` 하나가 마크업 묶음과 클래스를 고른다.

| `type` | 마크업(`home-sections.mjs`) | 스타일 모듈 |
|---|---|---|
| `hero` | `.app-landing-hero`, `.app-hero-copy`, `.app-cinema` | landing, media, controls |
| `projects` | `.app-landing-features`, `.app-landing-heading`, `.app-landing-collage` | landing |
| `technologies` | `.app-landing-technologies`, `.app-flow-viewport`, `.app-technology` | landing, icons |
| `interviews` | `.app-landing-interviews`, `.app-interview-card` | landing |
| `contact` | `.app-home-contact` 또는 `.app-landing-newsletter` | landing, forms |

섹션을 끄는 `enabled: false`는 마크업을 만들지 않으므로 스타일을 바꾸지 않는다. 기존 `type`의 항목을 늘리는 것은 `home.config.yaml`만 고친다. 새 `type`은 설정만으로 만들 수 없고 `home-config.mjs` 검증, `home-sections.mjs` 마크업, 필요하면 design-tokens의 수식 클래스 규칙과 토큰을 함께 바꾼다(design-tokens `docs/styles.md` 참고). 마크업이 내보내지 않는 클래스에 규칙만 추가하지 않는다.

글의 `ui:*` 블록과 클래스의 대응은 design-tokens `docs/styles.md`의 "콘텐츠 문법과 클래스"에 있다. 지원 문법 자체는 [Markdown 글 작성](markdown.md)을 따른다.

## 확인

스타일을 바꾼 변경은 다음을 모두 실행하고, 규칙 순서나 모듈을 옮겼다면 대표 화면(홈, 글, 위키)의 계산 스타일을 브라우저에서 변경 전과 비교한다.

```sh
npm run theme:product -- <design-tokens 경로>
npm run check:product
node build.mjs
npm run build:site
```
