// /admin 글 작성 화면의 정적 틀. 글 목록과 내용은 로그인 뒤 브라우저가 GitHub에서 읽어 채운다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

const STATES = [{ value: 'draft', label: '초안' }, { value: 'public', label: '공개' }];
const field = (control, hint, hintId) => ui.Field({ control, hint, hintId });

function signinPanel(config, siteTitle) {
  const body = config.authUrl
    ? `<p>GitHub 계정으로 로그인하면 글을 쓰고 고칠 수 있습니다. 저장하면 <code>${ui.escape(config.repository)}</code> 저장소에 바로 커밋됩니다.</p>`
    : '<p>로그인 서버 주소가 아직 없습니다. 로그인 서버를 배포하고 <code>config/admin.json</code>의 <code>authUrl</code>에 주소를 넣으면 여기서 로그인할 수 있습니다.</p>';
  const actions = config.authUrl ? ui.EditorActions({ items: [ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' })] }) : undefined;
  const status = '<p class="app-caption" data-admin-signin-status role="status" aria-live="polite"></p>';
  return `<div data-admin-signin>${ui.EditorNotice({ title: '글 관리', body: ui.trusted(body + status), actions, footer: ui.trusted(`<a href="/">${ui.escape(siteTitle)} 홈으로</a>`) })}</div>`;
}

function editorForm() {
  const slug = `<div data-admin-slug>${field(ui.TextInput({ id: 'admin-slug', name: 'slug', label: '주소 이름', labelVisible: true, surface: 'field', describedBy: 'admin-slug-hint', placeholder: 'my-new-post' }), '영어 소문자·숫자와 - 만 씁니다. 글 주소가 /blog/주소-이름/이 되며 처음 저장할 때만 정합니다.', 'admin-slug-hint')}</div>`;
  const tags = field(ui.TextInput({ id: 'admin-tags', name: 'tags', label: '태그(쉼표로 구분)', labelVisible: true, surface: 'field', placeholder: 'SQL, Kubernetes' }));
  const meta = ui.FieldRow({ fields: [
    field(ui.TextInput({ id: 'admin-date', name: 'publishedAt', label: '발행일', type: 'date', labelVisible: true, surface: 'field' })),
    field(ui.Select({ id: 'admin-state', name: 'state', label: '공개 여부', options: STATES, value: 'draft' })),
  ] });
  const imageInput = ui.trusted('<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-admin-image hidden>');
  return `<form data-admin-form novalidate>${[
    ui.TextArea({ id: 'admin-title', name: 'title', label: '제목', variant: 'title', rows: 1, labelVisible: false, placeholder: '제목' }),
    ui.TextArea({ id: 'admin-description', name: 'description', label: '요약', variant: 'plain', rows: 2, labelVisible: false, placeholder: '목록 카드와 글 머리에 보이는 요약 한두 문장' }),
    tags, meta, slug,
    ui.EditorActions({ items: [ui.Button({ label: '그림 넣기', action: 'insert-image' }), imageInput] }),
    ui.TextArea({ id: 'admin-body', name: 'body', label: '본문(Markdown)', code: true, rows: 24, labelVisible: false, placeholder: '본문을 Markdown으로 씁니다.' }),
    '<div data-admin-problems role="alert"></div>',
  ].map(String).join('')}</form>`;
}

export function adminPage(config, { siteTitle = '사이트', author } = {}) {
  const settings = ui.escape(JSON.stringify({ ...config, author }));
  const bar = ui.EditorBar({
    title: '글 관리', home: { href: '/', label: siteTitle },
    status: ui.trusted('<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>'),
    actions: ui.EditorActions({ items: [
      ui.Button({ label: '목록', variant: 'quiet', action: 'view-list', pressed: false }),
      ui.Button({ label: '작성', variant: 'quiet', action: 'view-edit', pressed: true }),
      ui.Button({ label: '미리보기', variant: 'quiet', action: 'view-preview', pressed: false }),
      ui.Button({ label: '저장', variant: 'primary', action: 'save' }),
    ] }),
  });
  const aside = `${ui.Button({ label: '새 글', variant: 'primary', action: 'new-post' })}<div data-admin-list></div>${ui.Button({ label: '로그아웃', variant: 'quiet', action: 'signout' })}`;
  const editor = ui.EditorLayout({ label: '글 목록', bar, aside: ui.trusted(aside), main: ui.trusted(editorForm()), preview: ui.trusted('<div data-admin-preview></div>') });
  const prefetch = author?.avatar ? `<link rel="prefetch" href="${ui.escape(author.avatar)}">` : '';
  return `<main id="main" data-admin="${settings}">${prefetch}${signinPanel(config, siteTitle)}<div data-admin-editor hidden>${editor}</div></main>`;
}
