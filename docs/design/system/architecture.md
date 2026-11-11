# 아키텍처

> 이 문서의 경로(`tokens/`, `styles/`, `ui/`, `assets/`, `scripts/`, `test/`, `dist/`)는 모두 홈페이지 저장소의 `src/design/` 기준이다. 생성 결과 `dist/`는 Git 밖이며 `npm run build:design`이 만든다. 도표 도구(DiagramPlay)와 다크 모드 발행은 홈페이지에서 제거했다.

`src/design/`은 홈페이지의 토큰, 아이콘, CSS, 정적 HTML 구성 요소와 브라우저 동작의 정본이다. 값과 UI 구조는 여기서 정의하고 화면 코드는 콘텐츠와 서비스 정책을 연결한다.

## 코드 지도

| 위치 | 책임 |
|---|---|
| `tokens/` | 공통 기본값과 다크 모드의 의미 값 차이 |
| `styles/`, `assets/` | 공통 웹 CSS와 아이콘·글꼴·자산 |
| `ui/` | 신뢰 경계가 있는 HTML 조각·패턴·레이아웃과 공통 런타임 |
| `scripts/lib/` | 토큰 참조, CSS 평탄화와 생성 |
| `scripts/build.mjs` | 정본을 읽어 `dist/`를 만들거나(`--check`로) 일치를 검사 |
| `dist/` | Git 밖 생성물. `npm ci`·`npm run build:design`이 만든다. 수동 수정 금지 |
| `test/` | 참조·대비·구성 요소·산출물·축소 계약 검사 |

## 한 방향의 생성

1. `scripts/build.mjs`가 `tokens/`, `styles/`, `assets/`, `ui/`를 읽고 `dist/`를 생성한다.
2. 화면 코드와 문서 렌더러는 `#design/*`로 생성물을 읽는다.
3. 사이트 정적 빌드는 페이지에 쓰인 CSS와 스크립트를 축소한다. 발행 페이지나 축소 파일을 정본으로 역수입하지 않는다.

아이콘 정본과 전체 배포 카탈로그는 기술·서비스 브랜드 SVG 34개를 중앙 관리한다. 일반 SVG 50개와 일반 역할·별칭은 실제 사용 범위만 유지한다. 전체 패키지의 브랜드 카탈로그와 `readIcon`은 브랜드 전체를 제공하며, 브라우저 HTML 데이터는 사용하는 역할의 도형만 담는다. 글 형식 매핑 `kinds`는 빈 객체이며, 기본 도움말 역할은 `question`이다.

토큰은 DTCG의 `$type`, `$value`와 경로 참조를 사용한다. 색은 hex 문자열이고 치수·시간은 값과 단위를 가진 객체다. DTCG 색 객체 전체를 구현했다고 표시하지 않는다.

`dist/manifest.json`은 생성 파일과 내용 해시를 기록한다. 시험이 원본에서 다시 만든 결과와 비교하고, 내용 해시(`contentHash`)는 발행 파일 주소의 캐시 무효화 값으로 쓴다.

## 경계

공통 HTML은 텍스트와 URL을 검증하고, HTML 슬롯에는 명시적으로 신뢰한 출력만 받는다. 브라우저에서 React나 템플릿 엔진을 실행하지 않는다. 향후 프레임워크 래퍼가 필요해도 토큰과 구조의 정본을 복제하지 않는다.

검색 색인·라우팅·공개 승인·댓글 서비스·문서 메타데이터는 홈페이지에 남는다.

## 불변 조건

- 토큰 값과 CSS 역할은 정본에 한 번만 정의한다.
- 생성물은 원본에서 재생성하며 해시와 CI로 일치를 검사한다.
- 기존 소비자의 렌더러 계약은 사용처 확인 없이 삭제하지 않는다.
- 일반 텍스트와 검증된 HTML 슬롯을 구분한다.
- 다른 저장소에 파일을 밀어 넣는 자동 전달을 두지 않는다. 각 저장소는 자기 파일만 검사한다.
- 불필요한 시안·감사 사본은 활성 소스나 배포물에 포함하지 않는다.

## 배포 경로

homepage 화면 코드와 내부 문서 렌더러는 같은 `src/design/dist/`를 읽는다. 외부 패키지로 배포하지 않는다.

## README 흐름 그림

[그림 원본](assets/build-flow.diagramplay)은 디자인 원본, 빌드, 패키지, 소비 앱을 네 단계로 보여 준다. 생성한 SVG를 직접 고치지 않고 원본과 함께 갱신한다.

생성 도구는 DiagramPlay의 `ebdc3e9c84c3d5443af7f1b6b5d9b2a18e5002ca` 커밋이다. 해당 소스와 의존성을 준비한 뒤 이 저장소 루트에서 실행한다. `DIAGRAMPLAY_PATH`는 준비한 DiagramPlay 저장소 경로다.

```sh
node "$DIAGRAMPLAY_PATH/src/cli.js" check docs/assets/build-flow.diagramplay --strict
node "$DIAGRAMPLAY_PATH/src/cli.js" render docs/assets/build-flow.diagramplay --static --strict
```

같은 버전으로 다시 생성했을 때 `docs/assets/build-flow.svg`의 바이트가 같아야 한다. README에서는 정지 그림으로 표시하며 단계별 책임은 위 코드 지도와 생성 절차를 따른다.
