import assert from 'node:assert/strict';
import test from 'node:test';
import { AdminDock, AdminDrafts, AdminLogin, Button, LinkButton, Dialog, Field, PostOwnerActions, PublishScreen, TagInput, TextArea, TextInput, Toast, WriteScreen, WriteToolbar, trusted } from '../dist/ui/index.mjs';

test('editor_controls_escape_text_and_reject_unknown_values', () => {
  assert.equal(String(Button({ label: '<저장>', variant: 'primary', action: 'save' })), '<button type="button" class="app-button is-primary" data-action="save">&lt;저장&gt;</button>');
  assert.throws(() => Button({ label: 'x', variant: 'danger' }), /variant/);
  assert.equal(String(Button({ label: '댓글 보기', action: 'comments-expand', controls: 'comments-a', context: '<글>', hidden: true })), '<button type="button" class="app-button" data-action="comments-expand" aria-controls="comments-a" aria-expanded="false" hidden>댓글 보기<span class="app-sr"> · &lt;글&gt;</span></button>');
  assert.equal(String(LinkButton({ label: '토큰 만들기', href: 'https://github.com/settings', variant: 'quiet', external: true })), '<a class="app-button is-quiet" href="https://github.com/settings" target="_blank" rel="noopener noreferrer">토큰 만들기</a>');
  assert.throws(() => LinkButton({ label: 'x', href: 'javascript:alert(1)' }), /Unsupported URL/);
  assert.equal(String(LinkButton({ label: '홈으로', href: '/', variant: 'quiet', hidden: true })), '<a class="app-button is-quiet" href="/" hidden>홈으로</a>');
  assert.match(String(TextInput({ id: 'token', label: '토큰', type: 'password' })), /type="password"/);
  assert.throws(() => Button({ label: 'x', action: 'Save()' }), /action/);
  assert.match(String(TextArea({ id: 'body', label: '본문', value: '</textarea><b>', variant: 'source', labelVisible: false })), /^<label class="app-sr" for="body">본문<\/label><textarea class="app-textarea is-source"[^>]*spellcheck="false">&lt;\/textarea&gt;&lt;b&gt;<\/textarea>$/);
  assert.match(String(TextArea({ id: 'd', label: '요약', maxLength: 150 })), /maxlength="150"/);
  assert.throws(() => TextArea({ id: 'x', label: 'x', variant: 'rich' }), /variant/);
  assert.throws(() => Field({ control: trusted(''), hint: '도움말' }), /hintId/);
  assert.match(String(TextInput({ id: 'tag', label: '태그', surface: 'bare' })), /class="app-input is-bare"/);
  assert.equal(String(AdminLogin({ title: '로그인', logo: trusted('<svg></svg>'), homeLabel: 'Who Knows 홈', actions: Button({ label: '로그인' }) })), '<section class="app-admin-login"><h1 class="app-sr">로그인</h1><a class="app-admin-login-logo" href="/" aria-label="Who Knows 홈"><svg></svg></a><div class="app-admin-login-actions"><button type="button" class="app-button">로그인</button></div></section>');
});

test('admin_dock_drafts_and_owner_actions_use_actions_scripts_find', () => {
  const dock = String(AdminDock({ count: 3 }));
  assert.match(dock, /data-action="open-drafts" aria-expanded="false" aria-controls="admin-drafts">임시·비공개<span class="app-admin-count" data-admin-count>3<\/span>/);
  assert.match(dock, /class="app-admin-fab" data-action="new-post" aria-label="새 글 쓰기"/);
  assert.throws(() => AdminDock({ count: -1 }), /count/);
  assert.match(String(AdminDrafts({ items: [{ id: 'publish/a.md', title: '<가>', date: '2026-10-27' }] })), /data-item="publish\/a.md"><span class="app-admin-item-title">&lt;가&gt;<\/span><span class="app-admin-item-meta">2026-10-27 임시저장<\/span>/);
  assert.match(String(AdminDrafts({ items: [{ id: 'publish/b.md', title: '나', date: '2026-10-27', label: '비공개' }] })), /<span class="app-admin-item-meta">2026-10-27 비공개<\/span>/);
  assert.match(String(AdminDrafts({ items: [] })), /임시저장하거나 비공개한 글이 없습니다/);
  assert.equal(String(PostOwnerActions()), '<span class="app-post-owner"><button type="button" data-action="edit-post">수정</button><button type="button" data-action="delete-post">삭제</button></span>');
});

test('write_and_publish_screens_start_hidden_with_named_controls', () => {
  const write = String(WriteScreen({ preview: trusted('<div data-preview></div>') }));
  assert.match(write, /^<div class="app-write" id="write-screen" role="dialog" aria-modal="true" aria-label="글 쓰기" hidden>/);
  for (const name of ['write-screen-title', 'write-screen-tag', 'write-screen-body']) assert.match(write, new RegExp(`id="${name}"`));
  for (const action of ['close-write', 'delete-current', 'save-draft', 'open-publish']) assert.match(write, new RegExp(`data-action="${action}"`));
  assert.doesNotMatch(write, /app-write-rule/);
  // 삭제는 저장된 글을 열었을 때만 사용하는 쪽이 보인다.
  assert.match(write, /data-action="delete-current" hidden>삭제<\/button>/);
  assert.match(write, /<section class="app-write-preview" aria-label="미리보기"><div data-preview><\/div><\/section>/);
  const tools = String(WriteToolbar());
  assert.deepEqual([...tools.matchAll(/data-format="([a-z0-9]+)"/g)].map(match => match[1]), ['h1', 'h2', 'h3', 'h4', 'bold', 'italic', 'strike', 'quote', 'link', 'image', 'code']);
  assert.match(String(TagInput({ id: 'tag', label: '태그', tags: ['SQL', '<b>'] })), /<button type="button" class="app-tag" data-tag="SQL"[^>]*>SQL<\/button><button type="button" class="app-tag" data-tag="&lt;b&gt;"/);
  const publish = String(PublishScreen({ card: trusted('<article></article>') }));
  assert.match(publish, /role="dialog" aria-modal="true" aria-label="출간 설정" hidden/);
  assert.match(publish, /<div class="app-publish-card" data-publish-card><article><\/article><\/div>/);
  // 썸네일·요약은 본문에서 자동으로 정하므로 고르는 칸이 없다. 공개 설정은 두 단추 중 하나가 눌린 상태다.
  // 썸네일은 본문에서 자동으로 정한다. 요약은 카드에 보일 글로 직접 쓸 수 있고 150자까지다.
  assert.doesNotMatch(publish, /upload-thumbnail|remove-thumbnail/);
  assert.match(publish, /name="description"[^>]*maxlength="150"|maxlength="150"[^>]*name="description"/);
  assert.match(publish, /data-publish-count>0<\/span> \/ 150/);
  assert.match(publish, /<div class="app-publish-visibility" role="group" aria-label="공개 설정"><button[^>]+data-action="visibility-public" aria-pressed="true">전체 공개<\/button><button[^>]+data-action="visibility-private" aria-pressed="false">비공개<\/button><\/div>/);
  for (const action of ['close-publish', 'publish']) assert.match(publish, new RegExp(`data-action="${action}"`));
  assert.match(String(Dialog({ id: 'confirm', title: '삭제', body: '<글>을 지울까요?', actions: [Button({ label: '취소', action: 'cancel' })] })), /role="alertdialog"[^>]*hidden><div class="app-dialog-card"><h2 class="app-dialog-title" id="confirm-title">삭제<\/h2><p class="app-dialog-body" data-dialog-body>&lt;글&gt;을 지울까요\?<\/p>/);
  assert.equal(String(Toast()), '<div class="app-toast" role="status" aria-live="polite" hidden></div>');
});
