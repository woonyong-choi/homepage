# blog

## 목적

현재 Markdown 문서 UI를 개인 블로그와 사이트로 발전시킨다. 소스와 콘텐츠는 이 저장소에서 수정한다.

## 작업 규칙

- 한국어로 소통하고 이모지를 쓰지 않는다. 저장소 관리 문서의 작업 언어는 한국어다.
- 새 수정은 GitHub 이슈에 기대 동작과 검증 가능한 완료 조건을 먼저 정한다. 진행 상태는 GitHub에서 관리한다.
- 이슈 하나당 작업 브랜치와 PR 하나를 사용한다. 후속 변경은 기본 브랜치에 직접 커밋하거나 push하지 않는다.
- 커밋은 `type(scope): 한글 설명` 형식으로 작성하고 기존 사용자 Git 작성자 설정을 사용한다. 작성 도구를 나타내는 메시지나 트레일러를 추가하지 않는다.
- 사용자의 요청 없이 PR을 병합하지 않는다.
- 제공된 `tokens.json`, `variables.css`, `theme.css`, `DESIGN.md`는 명시적 변경 요청 전까지 보존한다.
- Markdown은 `content/`, 메뉴는 `content/navigation.json`과 `content/javascript-navigation.json`에서 관리한다.
- `pages/`와 `search-index.json`은 생성물이므로 직접 수정하거나 커밋하지 않는다.
- `node build.mjs`와 변경한 JavaScript의 `node --check`를 실행한다. 화면 변경은 해당 내부 URL에서 브라우저로 확인한다.
- 실제 검증 범위를 넘어서 완료나 원본과의 동일성을 주장하지 않는다.
