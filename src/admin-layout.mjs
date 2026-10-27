// /admin/: 관리자 로그인 화면. 로그인하면 사이트 화면 위에 글 관리 단추가 붙는다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

export function adminPage(config) {
  const ready = Boolean(config.authUrl);
  const body = ready
    ? '<p>GitHub 계정으로 로그인하면 사이트 오른쪽 아래에 새 글 단추와 임시 글 목록이 생기고, 글 화면에서 바로 수정하거나 삭제할 수 있습니다.</p><p data-admin-signed hidden>이 브라우저는 로그인되어 있습니다. 사이트 어디서나 오른쪽 아래 단추로 글을 쓸 수 있습니다.</p>'
    : '<p>로그인 서버를 연결하면 GitHub 계정으로 로그인해 사이트에서 바로 글을 쓰고 고칠 수 있습니다.</p><p>지금은 로그인 없이 체험해 볼 수 있습니다. 체험 중 저장·삭제는 이 탭 안에서만 흉내 내고 실제 글은 바뀌지 않습니다.</p>';
  const login = ready ? [ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' }), ui.Button({ label: '로그아웃', action: 'signout', hidden: true })] : [];
  // 체험하기는 로그인 없이 이 탭에서만 글 관리 화면을 눌러 보게 한다. 실제 저장소와 사이트는 바뀌지 않는다.
  const demo = [ui.Button({ label: '로그인 없이 체험하기', variant: ready ? 'secondary' : 'primary', action: 'demo-start' }), ui.Button({ label: '체험 끝내기', action: 'demo-end', hidden: true })];
  const actions = ui.trusted([...login, ...demo].map(String).join(''));
  const status = ui.trusted('<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>');
  return `<main id="main" class="app-shell" data-admin-login>${ui.AdminLogin({ title: '글 관리', body: ui.trusted(body), actions, status })}</main>`;
}
