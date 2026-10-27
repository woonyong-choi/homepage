// /admin/: 관리자 로그인 화면. 로그인하면 사이트 화면 위에 글 관리 단추가 붙는다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

export function adminPage(config, { siteTitle = '사이트' } = {}) {
  const ready = Boolean(config.authUrl);
  const body = ready
    ? `<p>GitHub 계정으로 로그인하면 사이트 오른쪽 아래에 새 글 단추와 임시·비공개 글 목록이 보이고, 글 화면에서 수정·삭제할 수 있습니다.</p><p data-admin-signed hidden>이 브라우저는 이미 로그인되어 있습니다.</p>`
    : '<p>로그인 서버 주소가 아직 없습니다. 로그인 서버를 배포하고 <code>config/admin.json</code>의 <code>authUrl</code>에 주소를 넣으면 여기서 로그인할 수 있습니다.</p>';
  const status = '<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>';
  // 체험하기는 로그인 없이 이 탭에서만 글 관리 화면을 눌러 보게 한다. 실제 저장소와 사이트는 바뀌지 않는다.
  const login = ready ? `${ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' })}${ui.Button({ label: '로그아웃', variant: 'quiet', action: 'signout', hidden: true })}` : '';
  const actions = ui.trusted(`${login}${ui.Button({ label: '로그인 없이 체험하기', variant: ready ? 'secondary' : 'primary', action: 'demo-start' })}${ui.Button({ label: '체험 끝내기', variant: 'quiet', action: 'demo-end', hidden: true })}`);
  return `<main id="main" data-admin-login>${ui.EditorNotice({ title: '글 관리', body: ui.trusted(body + status), actions, footer: ui.trusted(`<a href="/">${ui.escape(siteTitle)} 홈으로</a>`) })}</main>`;
}
