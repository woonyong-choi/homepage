// /admin/: 관리자 로그인 화면. 로그인하면 사이트 화면 위에 글 관리 단추가 붙는다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

export function adminPage() {
  const actions = ui.trusted(`${ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' })}${ui.Button({ label: '로그아웃', action: 'signout', hidden: true })}`);
  const status = ui.trusted('<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>');
  return `<main id="main" class="app-shell" data-admin-login>${ui.AdminLogin({ title: '로그인', actions, status })}</main>`;
}
