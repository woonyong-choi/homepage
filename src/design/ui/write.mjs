// 사이트 위에 얹는 글 관리 조각. 관리자에게만 보이는 오른쪽 아래 단추, 임시 글 목록, 글 수정·삭제 줄,
// 벨로그식 작성 화면과 출간 화면, 확인 창, 알림을 만든다. 보이고 숨기는 일은 사용하는 쪽 스크립트가 맡는다.
import { escape, id, out, safeUrl, slot } from './html.mjs';
import { Button, Field, TextArea } from './editor.mjs';
import { TextInput } from './layout.mjs';

const FORMATS = [
  [['h1', 'H1', '제목 1'], ['h2', 'H2', '제목 2'], ['h3', 'H3', '제목 3'], ['h4', 'H4', '제목 4']],
  [['bold', 'B', '굵게'], ['italic', 'I', '기울임'], ['strike', 'S', '취소선']],
  [['quote', '인용', '인용'], ['link', '링크', '링크'], ['image', '그림', '그림 넣기'], ['code', '코드', '코드 블록']],
];

/** 관리자 단추 묶음: 위는 임시·비공개 글 목록 단추(개수 포함), 아래는 새 글을 여는 동그란 + 단추. */
export function AdminDock({ count = 0, panel = 'admin-drafts' } = {}) {
  if (!Number.isInteger(count) || count < 0) throw new Error('AdminDock count must be a non-negative integer');
  return out(`<div class="app-admin-dock"><button type="button" class="app-admin-drafts" data-action="open-drafts" aria-expanded="false" aria-controls="${id(panel)}">임시·비공개<span class="app-admin-count" data-admin-count>${count}</span></button><button type="button" class="app-admin-fab" data-action="new-post" aria-label="새 글 쓰기" title="새 글 쓰기"><span class="app-admin-fab-icon" aria-hidden="true"></span></button></div>`);
}

/** 임시·비공개 글 목록 패널. 항목은 `{ id, title, date, label? }`이며 label은 상태 이름(기본 임시저장)이다. 단추의 `data-item`으로 고른다. */
export function AdminDrafts({ id: panel = 'admin-drafts', items }) {
  const list = items.length
    ? `<ul class="app-admin-list">${items.map(item => `<li><button type="button" class="app-admin-item" data-item="${escape(item.id)}"><span class="app-admin-item-title">${escape(item.title)}</span>${item.date ? `<span class="app-admin-item-meta">${escape(item.date)} ${escape(item.label ?? '임시저장')}</span>` : ''}</button></li>`).join('')}</ul>`
    : '<p class="app-admin-empty">임시저장하거나 비공개한 글이 없습니다.</p>';
  return out(`<section class="app-admin-panel" id="${id(panel)}" aria-label="임시·비공개 글" hidden><h2 class="app-admin-panel-title">임시·비공개 글</h2>${list}</section>`);
}

/** 글 화면에서 관리자에게만 붙이는 수정·삭제 줄. */
export function PostOwnerActions() {
  return out(`<span class="app-post-owner"><button type="button" data-action="edit-post">수정</button><button type="button" data-action="delete-post">삭제</button></span>`);
}

/** 태그 입력: 앞에는 넣은 태그 칩(누르면 지움), 뒤에는 Enter·쉼표로 태그를 넣는 칸. */
export function TagInput({ id: name, label, tags = [], placeholder = '태그를 입력하세요' }) {
  const chips = tags.map(tag => `<button type="button" class="app-tag" data-tag="${escape(tag)}" title="눌러서 지우기">${escape(tag)}</button>`).join('');
  return out(`<div class="app-tag-entry" data-tag-entry>${chips}${TextInput({ id: name, label, placeholder, surface: 'bare', autocomplete: 'off' })}</div>`);
}

/** Markdown 서식 단추 줄. 각 단추의 `data-format`이 넣을 문법이다. */
export function WriteToolbar({ label = '서식' } = {}) {
  const groups = FORMATS.map(group => group.map(([format, text, name]) => `<button type="button" class="app-write-tool is-${format}" data-format="${format}" aria-label="${name}" title="${name}">${escape(text)}</button>`).join(''));
  return out(`<div class="app-write-toolbar" role="toolbar" aria-label="${escape(label)}">${groups.join('<span class="app-write-separator" aria-hidden="true"></span>')}</div>`);
}

/**
 * 벨로그식 작성 화면. 왼쪽에 제목·태그·서식·본문과 아래 막대(나가기·임시저장·출간하기), 오른쪽에 실시간 미리보기 칸이다.
 * 화면 전체를 덮는 창이며 처음에는 숨어 있다. `preview`는 미리보기 칸 안에 둘 슬롯이다.
 */
export function WriteScreen({ id: screen = 'write-screen', preview } = {}) {
  const editor = [
    TextArea({ id: `${screen}-title`, name: 'title', label: '제목', variant: 'title', rows: 1, labelVisible: false, placeholder: '제목을 입력하세요' }),
    TagInput({ id: `${screen}-tag`, label: '태그' }),
    WriteToolbar(),
    TextArea({ id: `${screen}-body`, name: 'body', label: '본문', variant: 'source', rows: 20, labelVisible: false, placeholder: '당신의 이야기를 적어 보세요...' }),
  ].map(String).join('');
  const footer = `<div class="app-write-footer">${Button({ label: '← 나가기', variant: 'quiet', action: 'close-write' })}<div class="app-write-footer-actions">${Button({ label: '삭제', variant: 'quiet', action: 'delete-current', hidden: true })}${Button({ label: '임시저장', variant: 'quiet', action: 'save-draft' })}${Button({ label: '출간하기', variant: 'primary', action: 'open-publish' })}</div></div>`;
  return out(`<div class="app-write" id="${id(screen)}" role="dialog" aria-modal="true" aria-label="글 쓰기" hidden><form class="app-write-editor" data-write-form novalidate><div class="app-write-fields">${editor}</div>${footer}</form><section class="app-write-preview" aria-label="미리보기">${preview === undefined ? '' : slot(preview, 'write preview')}</section></div>`);
}

/**
 * 출간 화면: 왼쪽은 목록 카드 미리보기(`card` 슬롯, 사용하는 쪽이 BlogCard로 채움)와 썸네일 바꾸기·요약 150자,
 * 오른쪽은 주소·발행일과 취소·출간하기. 썸네일을 고르지 않으면 본문 첫 그림, 그것도 없으면 제목 표지가 자동으로 쓰인다.
 */
export function PublishScreen({ id: screen = 'publish-screen', urlPrefix = '/blog/', card } = {}) {
  const left = `<section class="app-publish-section"><h3 class="app-publish-heading">목록 카드 미리보기</h3><div class="app-publish-card" data-publish-card>${card === undefined ? '' : slot(card, 'publish card')}</div>${TextArea({ id: `${screen}-description`, name: 'description', label: '요약', rows: 3, maxLength: 150, placeholder: '비워 두면 본문 첫 문단으로 채웁니다' })}<p class="app-publish-count"><span data-publish-count>0</span> / 150</p></section>`;
  const visibility = `<section class="app-publish-section"><h3 class="app-publish-heading">공개 설정</h3><div class="app-publish-visibility" role="group" aria-label="공개 설정">${Button({ label: '전체 공개', action: 'visibility-public', pressed: true })}${Button({ label: '비공개', action: 'visibility-private', pressed: false })}</div></section>`;
  const address = `<section class="app-publish-section"><h3 class="app-publish-heading">주소</h3><div class="app-publish-url"><span>${escape(urlPrefix)}</span>${TextInput({ id: `${screen}-slug`, name: 'slug', label: '주소 이름', surface: 'bare', autocomplete: 'off', describedBy: `${screen}-slug-hint` })}</div><p class="app-field-hint" id="${screen}-slug-hint">영어 소문자·숫자와 - 만 씁니다. 처음 출간할 때만 정합니다.</p></section>`;
  const date = `<section class="app-publish-section"><h3 class="app-publish-heading">발행일</h3>${Field({ control: TextInput({ id: `${screen}-date`, name: 'publishedAt', label: '발행일', type: 'date', surface: 'field' }) })}</section>`;
  const actions = `<div class="app-publish-actions">${Button({ label: '취소', variant: 'quiet', action: 'close-publish' })}${Button({ label: '출간하기', variant: 'primary', action: 'publish' })}</div>`;
  return out(`<div class="app-publish" id="${id(screen)}" role="dialog" aria-modal="true" aria-label="출간 설정" hidden><form class="app-publish-wrapper" data-publish-form novalidate><div class="app-publish-pane">${left}</div><div class="app-publish-divider" aria-hidden="true"></div><div class="app-publish-pane is-settings"><div>${visibility}${address}${date}</div>${actions}</div></form></div>`);
}

/**
 * 관리자 로그인 화면. 사이트 머리·꼬리말 없이 빈 화면 가운데에 사이트 로고와 로그인 단추만 둔다.
 * `logo`는 사이트 로고 슬롯, `home`은 로고가 가리킬 주소, `title`은 화면 읽기용 제목이다.
 */
export function AdminLogin({ title, logo, home = '/', homeLabel = '홈', actions, status }) {
  return out(`<section class="app-admin-login"><h1 class="app-sr">${escape(title)}</h1><a class="app-admin-login-logo" href="${safeUrl(home)}" aria-label="${escape(homeLabel)}">${slot(logo, 'login logo')}</a>${actions === undefined ? '' : `<div class="app-admin-login-actions">${slot(actions, 'login actions')}</div>`}${status === undefined ? '' : slot(status, 'login status')}</section>`);
}

/** 확인 창. `actions`는 Button 슬롯 목록이다. */
export function Dialog({ id: dialog, title, body, actions }) {
  return out(`<div class="app-dialog" id="${id(dialog)}" role="alertdialog" aria-modal="true" aria-labelledby="${dialog}-title" hidden><div class="app-dialog-card"><h2 class="app-dialog-title" id="${dialog}-title">${escape(title)}</h2><p class="app-dialog-body" data-dialog-body>${escape(body)}</p><div class="app-dialog-actions">${actions.map(item => slot(item, 'dialog action')).join('')}</div></div></div>`);
}

/** 화면 위 가운데에 잠깐 뜨는 알림. 클릭은 아래 요소로 통과한다. 글자는 스크립트가 채운다. */
export const Toast = () => out('<div class="app-toast" role="status" aria-live="polite" hidden></div>');
