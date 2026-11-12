# 홈 원고

| 항목 | 값 |
|---|---|
| 상태 | 구현 |
| 코드 | `src/content/home.js`, `src/content/services.js`, `src/layouts/home.js`, `src/layouts/interviews.js` |

## 요약

홈(`/`)은 소개·영상, 프로젝트, 기술 로고, 동료평가, 연락 구간을 원고 순서대로 조립한다. 문구와 순서는 원고에서 바꾸고 모양은 `src/design/ui/`의 공통 구성 요소(Hero, Section, SectionIntro, ProjectShowcase, FlowRail, LogoItem, QuoteCard, SiteHeader, SiteFooter)가 정한다.

## 입력 파일

| 파일 | 내용 |
|---|---|
| `content/home.md` | 구간 순서(`sections`)와 hero의 제목·소개 |
| `content/pages/tech.md` | 기술 구간의 제목·소개와 로고 목록 |
| `content/interviews/index.md` | 동료평가 구간의 제목·소개와 카드 |
| `content/interviews.local.md` | 선택. Git 밖의 검토용 카드. 미리보기 빌드만 읽는다 |

세 원고는 이 저장소에서 직접 고친다. 제목과 소개는 Markdown 본문의 첫 제목과 그 아래 문단에서 읽는다. 잘못된 값은 `home.md sections[1].items[0].link.href: ...`처럼 경로가 붙은 오류로 빌드를 멈춘다.

## 원고 예

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
        description: 첫 문단.
        link: { label: 자세히 보기, href: https://example.com }
        image: { src: /media/project.png, alt: 화면 모음 }
  - source: pages/tech.md
  - source: interviews/index.md
  - id: contact
    type: contact
    email: me@example.com
---

# 내 이름

소개 문장.
```

`source`는 `content/` 안의 상대 Markdown 경로만 받고 같은 항목에 다른 속성을 함께 쓰지 않는다. 연결한 파일은 YAML에 구간 속성을, 본문에 첫 제목과 소개 문단을 둔다. hero 구간은 반드시 하나 있어야 한다.

## 공통 필드

| 필드 | 설명 |
|---|---|
| `id` | 필수. 소문자로 시작하는 소문자·숫자·`-`. 구간 DOM id가 되며 `main`이나 다른 id와 겹치면 오류 |
| `type` | 필수. `hero`, `projects`, `technologies`, `interviews`, `contact` |
| `enabled` | 선택. 기본 `true`. `false`면 HTML·자산·스크립트에서 제외 |

파생 id(`<id>-video`, `<id>-player`, `<id>-title` 등)도 중복 검사에 포함한다.

## 구간별 필드

| 종류 | 필드 |
|---|---|
| hero | `icon`, `wordmark`(`{src, alt}`), `image`(`{src, alt}`), `video`(`{src, title}` 필수, `poster` 선택), `action`(`{label, href?}`). `icon`과 `wordmark`는 함께 쓸 수 없다 |
| projects | `items`. 항목마다 `title`, `description` 필수와 `enabled`, `link`(`{label, href}`), `icon`, `image` |
| technologies | `icon`, `items`(기술 로고 이름 목록) |
| interviews | `icon`, `links`(`{label, href?, icon?}`), `items`(`id`, `summary` 필수, `profile`(`{image?, title, subtitle?}`), `url`, `example`) |
| contact | `mode`(`email` 기본 또는 `newsletter`), `icon`, `title`, `description`, `button`, `email`. `newsletter`는 `endpoint`, `field`, `note`, `privacy`(`{label, href}`)도 받는다 |

- hero: 영상이 있고 `action.href`가 없으면 `action`은 재생 단추가 된다. 누르면 같은 페이지에서 영상이 펼쳐지고 처음부터 재생한다. `image`는 영상이 없을 때 소개 아래에 보인다. 영상 변환 방법과 출처는 `content/media/README.md`에 있다.
- projects: 항목 하나가 제목, 소개, 링크, 큰 그림으로 된 구간 하나다. 목록이 비면 구간이 없다.
- technologies: 로고는 발행 글에 같은 태그가 있을 때 `/search/?tag=<태그>`로 연결하고, 없으면 링크 없이 비활성으로 표시한다. 태그는 서비스 키, 표시 이름, 대소문자 무시, 별칭 순으로 하나를 고른다. 로고 묶음이 화면 폭보다 넓을 때만 흐르고, 좁으면 가운데 고정한다.
- interviews: `links`의 `icon`은 `github`, `rss`, `linkedin` 또는 그림이다. `href`가 없으면 아이콘만 보인다. `summary` 안의 `[@이름](https://...)` 링크만 해석하고 다른 문법은 글자로 둔다. `url`이 있으면 카드 전체가 그 주소로 연결되며 이때 `profile.title`이 필요하다. `example: true` 카드는 미리보기에서만 보인다. 두 줄 흐름은 마우스 호버로 멈추지 않고, 키보드 초점·터치·움직임 줄이기 설정에서 멈춘다.
- contact `email`: `mailto:` 링크를 둔다.
- contact `newsletter`: `endpoint`(HTTPS)가 없으면 입력과 단추를 비활성화하고 아무것도 전송하지 않는다. 있으면 그 주소로 form POST만 한다.

## 값 규칙

- 링크 `href`: HTTPS 주소, `/`로 시작하는 사이트 경로, `#` 페이지 안 연결만 받는다. `javascript:`, `data:`, `//host`는 오류다.
- 그림·영상: `/assets/`, `/media/`, `/theme/assets/` 아래 파일 또는 HTTPS 주소. 파일은 빌드 전에 존재를 확인한다. 그림은 png·jpg·jpeg·webp·gif·svg·avif, 영상은 mp4·webm.
- 숫자나 날짜로 읽힐 문자열은 따옴표로 감싼다.
- 아이콘 이름은 공통 아이콘 카탈로그(`src/design/assets/icons/catalog.json`)의 이름이다.

## 사이트 이름과 로고

`config/site.json`의 `title`은 탭·공유 정보·RSS의 사이트 이름, `name`은 작성자 이름, `copyright`는 바닥글 `© 연도 <copyright>`의 이름(없으면 `name`)이다. 상단 로고는 `logo: {src, alt}`로 정한다. 상단 메뉴는 Search(`/search/`)와 Blog(`/blog/`)로 고정이며, `content/home.md`의 `navigation`은 형식만 검사한다.

## 기술 로고

기술 로고는 디자인 시스템의 브랜드 카탈로그(`src/design/assets/icons/catalog.json`, 원본 `src/design/assets/icons/brands/`)에 있다. 홈은 `src/content/brands.js`로 이름을 찾고 `/theme/assets/icons/`로 발행한 파일과 고지를 싣는다. 새 로고는 `src/design/assets/icons/`에 출처·고지와 함께 추가한다. 빌드 결과 `/service-tags.json`에 로고 후보와 활성 여부가 기록된다.

## 자산 출처

`content/assets/`, `content/media/`의 파일은 `config/assets.json`에 출처(`origin`)와 라이선스(`license`)를 기록한다. 제3자 파일은 원본 주소를 적고 `notice`에 `-NOTICE.txt` 고지 파일을 지정한다. 빌드는 이 `notice`로 자산과 고지를 묶는다. 빌드는 발행 HTML이 실제로 참조한 자산과 그 고지만 싣는다.

## 검토용 인터뷰

`content/interviews.local.md`는 `---`로 감싼 YAML의 `items`만 갖는다. 미리보기 빌드에서만 활성 인터뷰 구간의 `items`를 대체하고 같은 검증을 적용한다. `--production` 빌드는 이 파일을 읽지 않는다. 공개할 카드는 `content/interviews/index.md`에 반영한다.

## 확인

홈을 넓은 화면과 좁은 화면에서 열어 영상의 포스터·재생·접힘, 흐름의 정지와 재개, 링크 초점, 메일 링크 주소를 확인한다.
