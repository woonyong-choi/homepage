# 스타일 수정 지도

범용 디자인은 design-tokens가 소유하고 홈페이지는 콘텐츠와 경로를 조립한다.

| 변경 | 정본 |
|---|---|
| 색·간격·글자 크기·시간 | `tokens/tokens.json` |
| 공통 CSS | `styles/` |
| 카드·검색·본문·홈 구성 요소 | `ui/` |
| 복사·탭·영상·흐름 동작 | `ui/runtime/` |
| 아이콘·조작 도형 | `assets/`, `ui/icons.mjs` |
| CSS 축소와 토큰 검사 | `ui/build/` |
| 콘텐츠·문구·노출 순서 | 홈페이지의 `content/home.md`, `content/tech.md`, `content/interviews.md` |
| Markdown·검색·댓글·문서 식별자 | 홈페이지의 `src/` |

가져온 `src/vendor/theme/`는 파일 목록과 SHA-256이 정본 manifest와 일치해야 한다. 여기서 직접 수정하면 동기화와 검증이 실패한다. 공통 UI는 이름 있는 구성 요소와 검증된 HTML 슬롯으로 조립한다. 값은 Tailwind의 color·text·spacing·radius·font·duration 이름 계열로 정의하고 기본 spacing 단위는 4px다.

발행할 때 실제 HTML과 JavaScript에서 쓰는 CSS 선택자를 모으고, 거기서 참조하는 CSS 변수의 의존 관계를 따라 필요한 값만 남긴다. 모든 모드와 동적 상태를 보존하며 최종 파일을 압축한다. 가져온 정본 파일은 이 최적화로 변경하지 않는다. 브라우저 동작은 필요한 페이지에서만 읽고 검색 색인은 별도로 내려받는다.

## 갱신

```sh
npm run design:sync -- /path/to/design-tokens
npm run check:tokens
npm run check:product
npm run build:site
```

정본 변경은 ThinkFlow 검증을 거친 뒤 같은 디자인 사본과 고정된 렌더러 커밋으로 전달된다. 홈페이지 빌드는 ThinkFlow와 디자인 해시가 다르면 실패한다. 자동 PR에는 가져온 디자인과 렌더러 의존성만 허용하며 검사를 통과한 커밋을 병합한다. 사용자 명의 자동 병합에는 이 저장소 범위의 `DESIGN_AUTOMATION_TOKEN`을 사용한다. fine-grained PAT의 Contents·Pull requests Read and write 권한이 필요하다. 등록되지 않으면 검증한 PR만 준비하며, 사용자 작성자가 아닌 PR은 인증 전환 뒤 사용자 작성 PR로 대체한다.

블로그 제목은 본문 폭을 사용하고 문서 제목 아이콘은 제목의 첫 줄과 정렬한다. 홈 제목의 SVG는 `ContentIconImage`로, PNG는 원본 그림으로 공통 `SectionIntro` 자리에 조립한다. 코드와 도표의 블록 배경은 유지하며 도구 모음은 별도 흰색 면·테두리·그림자를 만들지 않는다. 버튼의 hover·키보드 초점·복사 상태는 두 제품이 같은 공통 동작을 사용한다.
