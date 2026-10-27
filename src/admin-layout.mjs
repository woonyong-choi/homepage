// /admin 글 작성 화면의 정적 틀. 글 목록과 내용은 로그인 뒤 브라우저가 GitHub에서 읽어 채운다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

const STATES = [{ value: 'draft', label: '초안(사이트에 안 보임)' }, { value: 'public', label: '공개' }];
const field = (control, hint, hintId) => String(ui.Field({ control, hint, hintId }));

export function adminPage(config) {
  const settings = ui.escape(JSON.stringify(config));
  const signin = config.authUrl
    ? `<p>GitHub 계정으로 로그인하면 <code>${ui.escape(config.repository)}</code> 저장소의 <code>${ui.escape(config.posts)}</code> 폴더 글을 쓰고 고칠 수 있습니다.</p>${ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' })}`
    : '<p>로그인 서버 주소(<code>config/admin.json</code>의 <code>authUrl</code>)가 아직 없습니다. 로그인 서버를 배포한 뒤 주소를 넣으면 이 화면에서 로그인할 수 있습니다.</p>';
  const imageInput = ui.trusted('<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-admin-image hidden>');
  const write = String(ui.EditorPanel({ body: ui.trusted(`${ui.EditorActions({ items: [ui.Button({ label: '그림 넣기', action: 'insert-image' }), imageInput] })}${field(ui.TextArea({ id: 'admin-body', name: 'body', label: '본문(Markdown)', rows: 24, code: true }))}`) }));
  const preview = '<div class="app-prose" data-admin-preview></div>';
  const form = `<form data-admin-form novalidate>${[
    field(ui.TextInput({ id: 'admin-title', name: 'title', label: '제목', labelVisible: true, surface: 'field', required: true })),
    field(ui.TextInput({ id: 'admin-slug', name: 'slug', label: '주소 이름', labelVisible: true, surface: 'field', describedBy: 'admin-slug-hint', required: true }), '영어 소문자·숫자와 - 만 씁니다. 글 주소가 /blog/주소-이름/이 되며 새 글에서만 정합니다.', 'admin-slug-hint'),
    field(ui.TextArea({ id: 'admin-description', name: 'description', label: '요약', rows: 3, describedBy: 'admin-description-hint' }), '목록 카드와 글 머리에 보이는 한두 문장입니다.', 'admin-description-hint'),
    field(ui.TextInput({ id: 'admin-tags', name: 'tags', label: '태그', labelVisible: true, surface: 'field', describedBy: 'admin-tags-hint' }), '쉼표로 구분합니다. 예: SQL, Kubernetes', 'admin-tags-hint'),
    field(ui.TextInput({ id: 'admin-date', name: 'publishedAt', label: '발행일', type: 'date', labelVisible: true, surface: 'field', required: true })),
    field(ui.Select({ id: 'admin-state', name: 'state', label: '공개 여부', options: STATES, value: 'draft' })),
    String(ui.Tabs({ id: 'admin-body-tabs', label: '본문', selector: 'segmented', position: 'top', tabs: [{ label: '작성', body: ui.trusted(write) }, { label: '미리보기', body: ui.trusted(preview) }] })),
    '<div data-admin-problems role="alert"></div>',
    String(ui.EditorActions({ items: [ui.Button({ label: '저장', variant: 'primary', type: 'submit', action: 'save' }), ui.trusted('<span class="app-caption" data-admin-saved></span>')] })),
  ].join('')}</form>`;
  const aside = `${ui.EditorActions({ items: [ui.Button({ label: '새 글', variant: 'primary', action: 'new-post' }), ui.Button({ label: '로그아웃', action: 'signout' })] })}<div data-admin-list></div>`;
  const editor = ui.EditorLayout({ label: '글 목록', aside: ui.trusted(aside), main: ui.trusted(form) });
  return `<main id="main" class="app-shell" data-admin="${settings}">${ui.PageHeading({ title: '글 관리' })}<p class="app-caption" data-admin-status role="status" aria-live="polite"></p><section data-admin-signin>${signin}</section><div data-admin-editor hidden>${editor}</div></main>`;
}
