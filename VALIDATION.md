# 화면 및 기능 검증

기준 페이지:

- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- https://supabase.com/docs/reference/javascript/installing

## 가로 배치

Chrome 개발자 도구의 DOM 경계와 계산된 스타일을 읽어 비교했다. 서로 다른 사이트에 저장된 확대 배율이 달라, 수치 비교는 CSS 화면 폭을 1920px로 맞춰 진행했다. 임시 화면 크기 설정은 검증 후 해제했다.

| 항목 | 원본 | 구현 |
|---|---:|---:|
| Next.js 본문 시작 x | 572.64px | 573.00px |
| 본문 너비 | 730.67px | 730.67px |
| 우측 목차 시작 x | 1412.64px | 1412.98px |
| 우측 목차 너비 | 264px | 263.99px |
| 제목 시작 y | 142px | 141.89px |
| 프롬프트 시작 y | 279.77px | 279.63px |
| 프롬프트 높이 | 186px | 185.99px |
| 첫 번째 절 제목 y | 509.77px | 509.62px |

원본 글꼴 파일과 글꼴 안티앨리어싱 설정을 반영했다. 제공받은 색상 토큰은 보존했다. Installing은 1104px 영역 안에서 설명과 코드를 520px씩 나누고 64px 간격을 둔다.

## 실제 동작 확인

- 본문 스크롤 1537.27px에서 왼쪽 메뉴 스크롤은 0px, 왼쪽 상단은 50px, 우측 상단은 98px를 유지했다.
- 왼쪽 메뉴를 710px 스크롤해도 본문은 1537.27px를 유지했다.
- 문서 끝 본문 스크롤 5500px에서 오른쪽 목차 위로 휠을 올려도 본문은 5500px를 유지했다.
- `Agent Skills` 선택 시 상위 `4. Set up AI tooling`과 함께 강조되며 표시선 높이는 약 44px였다.
- 문서 끝에서는 `Next steps`를 강조했다.
- Installing의 Yarn 탭에서 `yarn add @supabase/supabase-js`가 표시되고 복사 완료 상태를 확인했다.
- JavaScript의 `Using filters` 하위 목록에서 `eq` 내부 페이지로 이동했다.
- `getClaims` 검색이 새 Markdown 참조 문서를 찾았다.
- 에이전트 프롬프트 펼침·접힘·복사를 확인했다.
- 390px 모바일 화면의 문서 너비는 390px로, 가로 넘침이 없었다. 탐색 메뉴를 펼치고 내부 문서로 이동했다.
- 확인한 로컬 페이지에서 브라우저 오류 로그가 없었다.

## 빌드와 보존

- `node build.mjs`: 정적 문서 309개 생성.
- JavaScript 구문 검사 통과.
- 홈을 포함한 HTML 310개의 로컬 href/src 경로 검사: 누락 0개.
- 생성 문서의 하단 페이지네이션: 0개.
- `tokens.json`, `variables.css`, `theme.css`, `DESIGN.md`: 업로드 원본과 바이트 단위 동일.

## 범위

Markdown 정적 렌더링, 메뉴, 목차, 검색, 코드·탭·복사와 반응형 화면을 구현했다. 모든 페이지의 픽셀 단위 동일성을 검증한 것은 아니다. 일부 가이드 본문은 예제이고, 추가한 JavaScript 메서드 문서는 공개 페이지의 렌더링된 설명과 기본 예제를 옮겼다. 인증 뒤 프로젝트 정보, 외부 AI 서비스, 서버에 저장하는 피드백은 Supabase의 운영 백엔드를 복제하지 않는다.

## 캡처

- `preview-nextjs.png`: 문서 상단
- `preview-scroll-state.png`: 하위 목차 강조
- `preview-installing.png`: 참조 문서 2열 배치
