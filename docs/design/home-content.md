# 홈 원고 가이드

홈은 `content/home.md`의 `sections` 순서로 조립한다. 홈 소개·영상·연락은 이 파일에서 고치고, 기술 링크와 분야 카드는 `content/tech.md`, 동료평가 소개와 카드는 `content/interviews.md`에서 고친다. 제목과 소개는 Markdown 본문을 읽으며, 같은 내용을 JSON이나 YAML 필드에 중복해서 적지 않는다. 각 항목의 `enabled: false`는 그 섹션을 끄고 HTML·자산·스크립트에서 제외한다.

기본 설정의 projects는 꺼져 있다. 두 예시 항목과 섹션 렌더러는 재사용을 위해 남긴다. 실제 프로젝트의 제목·설명·링크·이미지로 바꾼 뒤 해당 섹션의 `enabled`를 `true`로 설정하면 표시한다.

```sh
npm run build:site        # 설정을 검증하고 dist/site를 만든다
npm run check:product     # 계약 테스트
```

잘못된 설정은 `home.md sections[1].items[0].link.href: ...`처럼 틀린 경로를 포함한 오류로 빌드를 멈춘다.

공개 전 인터뷰 검토에는 Git에서 제외되는 `content/interviews.local.md`를 연결한다. 파일은 `---`로 감싼 YAML의 `items` 카드 목록만 가지고 본문은 비워 둔다. 미리보기 빌드에서만 활성 인터뷰 섹션 하나의 `items`를 대체하고 같은 검증을 적용한다. 공개 빌드(`npm run build:site -- --production`)는 이 파일을 읽지 않는다. 원본 답변·연락처·비공개 출처는 사이트 입력으로 복사하지 않는다. 공개 범위가 확인된 카드만 `content/interviews.md`의 `items`에 옮긴다.

비공개 자료 저장소의 검토용 Markdown을 `content/interviews.local.md` 심볼릭 링크로 연결할 수 있다. 새 worktree에는 Git에서 제외한 이 연결이 생기지 않으므로, 이전 화면을 검수할 때 같은 검토 입력을 연결한다. 원문은 복사하거나 커밋하지 않는다. 미리보기에서 참조하는 회사 로고는 실제 사용 자산이며, 발행 HTML에서 사용한 로고와 출처 고지만 함께 수집한다. 미사용 자산을 정리할 때 공개 설정뿐 아니라 로컬 미리보기 입력의 참조도 대조한다.

회사 로고는 원본 비율과 색을 유지한다. 로고를 추가할 때는 출처 고지와 `src/publication-assets.mjs`의 고지 의존성도 함께 추가한다. 해당 로고를 사용하는 빌드에만 출처 고지를 포함한다.

인터뷰 하단은 회사 아이콘·회사명·직무로 구성하며 이름을 표시하지 않는다. 회사명은 더 짧은 공식 영문 표기를 사용할 수 있다. 직무는 클라이언트 개발자·소프트웨어 개발자·3D 디자이너·대표처럼 담당 분야가 드러나는 명칭을 쓴다. 확인되지 않은 직무는 생략한다. 제공받은 로고는 여백까지 포함한 원본 전체를 같은 크기의 이미지 영역에 비율대로 표시한다. 배경이 필요한 로고만 원본 크기를 유지한 배경 합성본을 별도 파일로 둔다.

본문은 인사팀이 읽는 동료 레퍼런스를 기준으로 고른다. 포트폴리오·취업 준비 배경을 덜고, 동료가 직접 본 업무 수행·문제 해결·협업 결과·신뢰를 남긴다. 원문 발췌와 카드 문구를 대조하고 맞춤법·띄어쓰기·어색한 연결만 고친다. 원문에 없는 장점이나 확신을 덧붙이지 않는다.

완결된 소개 문장과 인터뷰 요약은 마침표로 끝낸다. 섹션 제목, 버튼 문구, 회사명과 직무 같은 짧은 표기에는 마침표를 넣지 않는다.

## 공통 필드

| 필드 | 설명 |
|---|---|
| `id` | 필수. 소문자로 시작하는 소문자, 숫자, `-`. 섹션 DOM id가 되며 `main`이나 다른 섹션과 겹치면 오류 |
| `type` | 필수. `hero`, `projects`, `technologies`, `interviews`, `contact` |
| `enabled` | 선택. 기본 `true` |

같은 종류를 여러 번 둘 수 있다. hero는 `<id>-video`, `<id>-player`, contact는 `<id>-title` 등 파생 id도 중복 검사에 포함한다.

## 홈 원고 예

`content/home.md`의 첫 제목과 그 아래 문단이 hero의 제목·소개다. `source`는 같은 `content/` 폴더의 Markdown 파일 이름만 허용하며 해당 항목에 다른 속성을 함께 쓰지 않는다. 연결한 파일은 첫 제목과 소개 문단이 필요하다.

```markdown
---
sections:
  - id: hero
    type: hero
    video: { src: /media/intro.mp4, poster: /media/poster.png, title: 소개 영상 }
    action: { label: 영상 보기 }
  - id: projects
    type: projects
    items:
      - title: 프로젝트 이름
        description: |
          첫 문단.

          빈 줄로 나누면 둘째 문단.
        link: { label: 자세히 보기, href: https://example.com }
        icon: project
        image: { src: /media/project.png, alt: 화면 모음 }
  - source: tech.md
  - source: interviews.md
  - id: contact
    type: contact
    email: me@example.com
---

# 내 이름

소개 문장입니다.
```

`content/tech.md`의 YAML에는 `id`, `type: technologies`, `icon`, 기술 이름 목록인 `items`, 분야 목록인 `topics`를 둔다. `topics`의 키는 문서 `category`와 연결되고 표시 이름·카드 설명·아이콘·영역(`group`)을 관리한다. 홈의 기술 흐름은 `items` 순서를 사용한다. 첫 제목과 문단은 기술 구간의 소개다.

`content/interviews.md`도 YAML의 `id`, `type: interviews`, `icon`, `links`, `items`와 첫 제목·소개 문단으로 구성한다. `example: true`인 카드는 미리보기에서만 보인다. 빈 `items`에는 자동으로 예시를 추가하지 않는다.

## 섹션

머리 `icon`은 공통 카탈로그 이름(`technology`, `project`) 또는 `{src, alt}` 이미지다. 공통 이름은 정본 `iconFile()`로 경로를 해석한다. 구독과 동료 평가 머리는 공통 자산의 `newsletter.png`, `testimonials.png`를 쓴다. 홈 히어로는 `icon`이 없으면 원고의 제목을 표시한다.

상단 글자이미지는 `config/site.json`의 `logo`에 `{src, alt}`로 지정한다. `alt`는 홈페이지 이동 링크의 접근성 이름에 쓰고 저자와 메타데이터의 `name`은 별도로 유지한다. 히어로 글자이미지는 `hero.icon.src`로 지정하며 홈 본문 제목을 스크린리더용 제목으로 남긴다. 콘텐츠 SVG는 공통 정적 SVG 렌더러로 인라인 조립해 공통 글자색을 상속한다.

| 종류 | 필드 |
|---|---|
| hero | 홈 본문의 제목과 소개를 사용한다. 제목은 페이지 제목과 아이콘 대체 글이며 `icon`이 없으면 화면에 표시한다. 나머지 속성: `icon`, `image`(`{src, alt}`), `video`(`{src, title}` 필수, `poster` 선택), `action`(`{label, href}`) |
| projects | `items` 목록. 항목마다 `title`, `description` 필수와 `enabled`, `link`(`{label, href}`), `icon`, `image` |
| technologies | 본문의 제목·소개와 머리 `icon`. `items`는 아이콘 카탈로그 이름 목록이며 같은 이름의 태그 글로 연결 |
| interviews | 본문의 제목·소개와 머리 `icon`, `links`(`{label, href?, icon?}`). `items`: `id`, `summary` 필수, `profile`(`{image?, title, subtitle?}`), `url`, `example` 선택 |
| contact | `mode`: `email` 또는 `newsletter`. 공통 속성: `icon`, `title`, `description`, `button`, `email` |

- hero: 영상이 있고 `action.href`가 없으면 재생 버튼(`action.label`은 처음 문구)이 된다. `href`를 쓰면 그 링크가 된다. 현재 홈은 사용자가 선택한 인터뷰 영상의 로컬 MP4를 사용한다. 프로젝트 영상 보기에서 같은 페이지 안의 영상 영역이 펼쳐지며 0초부터 재생한다. 출처와 웹 변환 정보는 `content/media/README.md`에 기록한다. `image`는 영상이 없을 때 소개 아래에 크게 보인다. 재생 버튼의 문구는 항상 `action.label`로 고정이고 아이콘만 재생과 일시정지 두 가지다. 영상이 끝나면 재생 아이콘으로 돌아가며 다시 누르면 처음부터 재생한다. 영상은 크롬 등에서 색이 어긋나지 않도록 `yuv420p`, BT.709 H.264로 둔다(변환 방법은 `content/media/README.md`).
- projects: 링크 문구는 `link.label`, 이동 주소는 `link.href`이며 둘 다 직접 정한다(예: `label: 기능 보기`, `href: /docs/`). 기본 예시는 `자세히 보기`다. 항목 하나가 제목 → 소개 → 링크 → 큰 이미지 구간 하나다. 항목을 추가한 만큼 구간이 늘고, 목록이 비면 섹션이 없다. 기본 예시 두 항목은 큰 그림 `project-placeholder.svg`와 공통 `project` 아이콘을 쓴다.
- technologies, interviews, contact는 projects와 같은 머리(아이콘, 제목, 설명)를 쓴다. 기술·인터뷰는 그 아래에 흐르는 목록을, contact는 모드에 따라 이메일 연락 링크나 구독 입력을 둔다. 머리 바탕과 간격은 공통 섹션이 정한다.
- interviews: `links`는 제목 아래의 링크 행이다. `icon`은 내장 이름(`github`, `rss`, `linkedin`) 또는 이미지 파일이고 생략하면 `label`을 글자로 표시한다. 내장 아이콘은 `href`를 비워 둘 수 있으며 그러면 아이콘만 보이고 링크도 클릭도 없다(`aria-label`은 `<label> · 주소 준비 중`). 주소가 생기면 `href`만 채운다. 어떤 계정 주소도 추정해 넣지 않는다.
- interviews 요약 링크: `summary` 안에서 `[@만난 곳](https://...)` 문법의 링크만 읽는다. 주소는 링크 `href`와 같은 규칙(HTTPS 또는 `/`로 시작하는 사이트 경로, `#` 페이지 안 연결)이고 `javascript:`, `data:`, `//host`는 설정 오류다. 라벨의 `@`는 글자 그대로이고 `@word`만 쓰면 링크도 주소 추정도 없다. 라벨 안의 `[`, `]`는 `\[`, `\]`로 쓰며 한 요약에 링크를 여러 개 넣을 수 있다. HTML, 이미지, 강조 등 다른 문법은 해석하지 않고 글자로 표시한다. 프로필 세 자리와 별개인 본문 기능이다.
- interviews 카드: 요약 아래는 `profile`의 이미지, 제목, 부제목 세 자리뿐이다. 회사형이면 회사 아이콘, 회사명, 직무이고 플랫폼형이면 프로필 이미지, 아이디, 날짜처럼 같은 자리를 바꿔 쓴다. 두 값을 겹쳐 쌓지 않으며 `title`, `subtitle`은 의미가 없는 문자열이다. `url`(HTTPS)이 있으면 카드 전체가 그 주소로 연결된다. 회사명과 직무는 링크가 아닌 일반 글자로 표시하며 별도 줄은 생기지 않는다. 본문에 별도 링크가 있으면 그 링크는 자기 주소로 열린다. `url`이 없는 카드는 클릭해도 이동하지 않는다. `image`가 없으면 그 자리는 비지 않고 왼쪽 여백도 없으며, `profile`이 없으면 요약만 보인다. `image`는 `/assets/`, `/media/` 또는 HTTPS 이미지다. 표시할 `items`가 없으면 구간을 제외한다. 외부 계정을 읽어 오지 않으므로 값은 직접 적는다.
- contact `email`: `email`의 주소를 `mailto:` 링크로 연결한다. 기본 제목은 `함께 만들어 볼까요?`, 설명은 `프로젝트와 협업에 관한 이야기를 기다립니다.`, 링크 문구는 `메일 보내기`이며 원고에서 바꿀 수 있다.
- contact `newsletter`: 홈에서 사용하는 구독 모드다. 기본 제목은 `소식 받아보기`, 설명은 `새 글과 프로젝트 소식을 이메일로 보내 드립니다.`, 버튼은 `구독`이다. `endpoint`, `field`(입력 이름, 기본 `email`), `note`, `privacy`(`{label, href}`)를 지정할 수 있고 `email`은 직접 문의 대안으로 쓴다. `endpoint`(HTTPS)가 없으면 입력과 버튼이 비활성이고 `구독 서비스를 준비 중입니다`를 보이며 어떤 주소도 저장하거나 전송하지 않는다. `endpoint`가 있으면 이메일을 그 주소로 form POST할 뿐이며 사이트는 성공 화면을 만들지 않는다. 실제 수신과 발송은 구독 서비스가 맡는다. `privacy`와 `note`는 적은 경우에만 보인다. 현재 홈은 endpoint를 설정하지 않은 상태다.

## 인터뷰 항목 예

회사형과 플랫폼형은 같은 세 자리를 다르게 채울 뿐이다. 주소는 모두 자리 표시 값이다.

```yaml
links:
  - { label: GitHub, href: "https://github.com/github-id", icon: github }
  - { label: LinkedIn, icon: linkedin }   # href가 없으면 아이콘만 보인다
items:
  - id: company-card
    summary: "[@커뮤니티](https://example.com/community)에서 함께했습니다."
    profile: { image: { src: /assets/company.png, alt: "" }, title: 회사명, subtitle: 직무 }
  - id: platform-card
    summary: 선별해 정리한 요약문
    profile: { image: { src: /assets/profile.png, alt: "" }, title: "@github-id", subtitle: "2026-01-15" }
    url: https://github.com/github-id/repo/discussions/1
  - { id: summary-only, summary: 직접 들은 이야기의 요약 }
```

## 값 규칙

- 링크 `href`: HTTPS 주소, `/`로 시작하는 사이트 경로, `#`으로 시작하는 페이지 안 연결만 허용한다. `javascript:`, `data:`, `//host`, 공백은 거부한다.
- 이미지와 영상: `/assets/`, `/media/` 아래 파일(빌드 전에 존재 확인) 또는 HTTPS 주소. 파일은 `content/assets/`, `content/media/`에 둔다. 확장자는 이미지 png·jpg·webp·gif·svg·avif, 영상 mp4·webm.
- 문자열 값이 숫자나 날짜로 읽히는 경우 따옴표로 감싼다.

## 자산 출처

프로젝트 구간은 실제 내용을 채우기 전까지 꺼 둔다. 프로젝트 기본 그림은 공통 테마의 `assets/illustrations/`에서 가져온다. 사용 중인 외부 자산의 출처는 `config/assets.json`에 있다. 구간의 구조와 배치는 공통 `Section`, `SectionIntro` 구성 요소가 소유한다.

`content/assets/who-knows.svg`는 상단 브랜드, `content/assets/backend-engineer.svg`는 소개 제목이다. 공통 Pretendard Variable의 굵기 700과 글자 간격을 도형으로 변환한 콘텐츠 자산이며 외부 글꼴을 요청하지 않는다. 원본 글꼴의 SIL Open Font License는 공통 `assets/fonts/pretendard-license.txt`를 함께 발행한다.
