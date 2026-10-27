// 모든 페이지에 붙는 작은 관리 로더. 관리자 로그인 토큰이 없으면 아무것도 하지 않고, 있으면 글 관리 기능을 불러온다.
// /admin/ 로그인 화면에서는 GitHub 로그인 창을 열고 받은 토큰을 이 브라우저에 저장한다.
import { TOKEN_KEY } from './admin-token.mjs';

function read(storage) {
  try { return storage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
}

export function initAdminLogin(root, settings, { storage = localStorage, openWindow = (...args) => window.open(...args), fetcher = (...args) => fetch(...args) } = {}) {
  const view = root.ownerDocument.defaultView;
  const status = root.querySelector('[data-admin-status]');
  const signin = root.querySelector('[data-action=signin]');
  const signout = root.querySelector('[data-action=signout]');
  const tokenForm = root.querySelector('[data-admin-token-form]');
  const tokenSignin = root.querySelector('[data-action=token-signin]');
  const tokenHelp = root.querySelector('a[target=_blank]');
  const home = root.querySelector('a[href="/"]:not(.app-admin-login-logo)');
  const show = () => {
    const on = Boolean(read(storage));
    for (const node of [signin, tokenForm, tokenSignin, tokenHelp]) if (node) node.hidden = on;
    for (const node of [signout, home]) if (node) node.hidden = !on;
    status.textContent = '';
  };
  const saveToken = (token, login) => {
    try { storage.setItem(TOKEN_KEY, token); } catch { status.textContent = '이 브라우저에 로그인 정보를 저장할 수 없습니다.'; return; }
    show();
    status.textContent = `${login} 계정으로 로그인했습니다. 홈으로 이동합니다.`;
    view.setTimeout(() => view.location.assign('/'), 800);
  };
  // 붙여 넣은 토큰이 사이트 주인의 것이고 글 저장소에 쓸 수 있는지 GitHub에 확인한 뒤 저장한다.
  async function tokenLogin() {
    const token = root.querySelector('#admin-token').value.trim();
    if (!token) { status.textContent = 'GitHub 토큰을 붙여 넣어 주세요.'; return; }
    status.textContent = '토큰을 확인하는 중입니다.';
    const headers = { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' };
    const [user, repo] = await Promise.all([fetcher('https://api.github.com/user', { headers }), fetcher(`https://api.github.com/repos/${settings.repository}`, { headers })]);
    const profile = user.ok ? await user.json() : {};
    const owner = settings.repository.split('/')[0].toLowerCase();
    if (!user.ok) { status.textContent = '토큰이 올바르지 않거나 만료됐습니다.'; return; }
    if (String(profile.login).toLowerCase() !== owner) { status.textContent = '이 사이트 주인의 토큰이 아닙니다.'; return; }
    // 글은 Vault에, 출간한 글은 사이트 저장소에도 커밋한다. 두 저장소 모두 쓸 수 있어야 한다.
    const repositories = [settings.repository, ...(settings.deploy ? [settings.deploy.split('/').slice(0, 2).join('/')] : [])];
    const responses = [repo, ...await Promise.all(repositories.slice(1).map(name => fetcher(`https://api.github.com/repos/${name}`, { headers })))];
    const missing = [];
    for (const [index, response] of responses.entries()) if (!(response.ok ? (await response.json()).permissions : null)?.push) missing.push(repositories[index].split('/')[1]);
    if (missing.length) { status.textContent = `토큰에 ${missing.join('·')} 저장소 쓰기 권한이 없습니다. 토큰 만들기에서 ${repositories.map(name => name.split('/')[1]).join('와 ')} 저장소를 모두 골라 주세요.`; return; }
    root.querySelector('#admin-token').value = '';
    saveToken(token, profile.login);
  }
  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'signin') {
      if (!settings.authUrl) { status.textContent = '로그인 서버가 아직 연결되지 않았습니다.'; return; }
      const url = new URL('/auth', settings.authUrl);
      url.searchParams.set('origin', view.location.origin);
      openWindow(String(url), 'admin-auth', 'width=600,height=720');
      status.textContent = 'GitHub 로그인 창에서 허용해 주세요.';
    } else if (action === 'token-signin') {
      tokenLogin().catch(() => { status.textContent = 'GitHub에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'; });
    } else if (action === 'signout') {
      try { storage.removeItem(TOKEN_KEY); } catch { /* 저장소를 쓸 수 없으면 이미 로그아웃 상태다. */ }
      show();
      status.textContent = '로그아웃했습니다.';
    }
  });
  view.addEventListener('message', event => {
    if (!settings.authUrl || event.origin !== new URL(settings.authUrl).origin || event.data?.type !== 'admin-auth') return;
    if (!event.data.token) { status.textContent = event.data.error ?? '로그인하지 못했습니다.'; return; }
    saveToken(event.data.token, event.data.login ?? '');
  });
  root.querySelector('[data-admin-token-form]')?.addEventListener('submit', event => { event.preventDefault(); tokenLogin().catch(() => { status.textContent = 'GitHub에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'; }); });
  show();
}

const meta = typeof document === 'undefined' ? null : document.querySelector('meta[name="admin-settings"]');
if (meta) {
  const settings = JSON.parse(meta.content);
  const login = document.querySelector('[data-admin-login]');
  if (login) initAdminLogin(login, settings);
  else if (read(localStorage)) import(settings.editor).then(module => module.startAdmin(settings, read(localStorage)));
}
