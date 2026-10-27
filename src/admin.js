// 모든 페이지에 붙는 작은 관리 로더. 관리자 로그인 토큰이 없으면 아무것도 하지 않고, 있으면 글 관리 기능을 불러온다.
// /admin/ 로그인 화면에서는 GitHub 로그인 창을 열고 받은 토큰을 이 브라우저에 저장한다.
import { TOKEN_KEY } from './admin-token.mjs';

const DEMO_KEY = 'admin-demo';

function read(storage) {
  try { return storage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
}

export function initAdminLogin(root, settings, { storage = localStorage, openWindow = (...args) => window.open(...args) } = {}) {
  const view = root.ownerDocument.defaultView;
  const status = root.querySelector('[data-admin-status]');
  const signin = root.querySelector('[data-action=signin]');
  const signout = root.querySelector('[data-action=signout]');
  const signed = root.querySelector('[data-admin-signed]');
  const demoStart = root.querySelector('[data-action=demo-start]');
  const demoEnd = root.querySelector('[data-action=demo-end]');
  const demoOn = () => { try { return view.sessionStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } };
  const show = () => {
    const on = Boolean(read(storage));
    if (signin) signin.hidden = on;
    if (signout) signout.hidden = !on;
    if (signed) signed.hidden = !on;
    if (demoStart) demoStart.hidden = demoOn();
    if (demoEnd) demoEnd.hidden = !demoOn();
  };
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'signin') {
      const url = new URL('/auth', settings.authUrl);
      url.searchParams.set('origin', view.location.origin);
      openWindow(String(url), 'admin-auth', 'width=600,height=720');
      status.textContent = 'GitHub 로그인 창에서 허용해 주세요.';
    } else if (action === 'demo-start') {
      try { view.sessionStorage.setItem(DEMO_KEY, '1'); } catch { status.textContent = '이 브라우저에서는 체험 모드를 켤 수 없습니다.'; return; }
      view.location.assign('/');
    } else if (action === 'demo-end') {
      try { view.sessionStorage.removeItem(DEMO_KEY); } catch { /* 이미 꺼진 상태다. */ }
      status.textContent = '체험 모드를 끝냈습니다.';
      show();
    } else if (action === 'signout') {
      try { storage.removeItem(TOKEN_KEY); } catch { /* 저장소를 쓸 수 없으면 이미 로그아웃 상태다. */ }
      status.textContent = '로그아웃했습니다.';
      show();
    }
  });
  view.addEventListener('message', event => {
    if (!settings.authUrl || event.origin !== new URL(settings.authUrl).origin || event.data?.type !== 'admin-auth') return;
    if (!event.data.token) { status.textContent = event.data.error ?? '로그인하지 못했습니다.'; return; }
    try { storage.setItem(TOKEN_KEY, event.data.token); } catch { status.textContent = '이 브라우저에 로그인 정보를 저장할 수 없습니다.'; return; }
    status.textContent = `${event.data.login ?? ''} 계정으로 로그인했습니다. 홈으로 이동합니다.`.trim();
    show();
    view.setTimeout(() => view.location.assign('/'), 800);
  });
  show();
}

const meta = typeof document === 'undefined' ? null : document.querySelector('meta[name="admin-settings"]');
if (meta) {
  const settings = JSON.parse(meta.content);
  const login = document.querySelector('[data-admin-login]');
  if (login) initAdminLogin(login, settings);
  else if (read(localStorage)) import(settings.editor).then(module => module.startAdmin(settings, read(localStorage)));
  else if ((() => { try { return sessionStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } })()) import(settings.editor).then(module => module.startAdmin({ ...settings, demo: true }, 'demo', { fetcher: module.demoFetcher(), storage: sessionStorage }));
}
