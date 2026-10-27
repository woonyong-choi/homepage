// 정적 사이트의 /admin 로그인을 GitHub OAuth로 중계한다.
// 이 Worker는 비밀 값으로 코드를 토큰으로 바꾸고, 허용한 계정의 토큰만 요청한 어드민 창으로 돌려준다. 토큰은 저장하지 않는다.

const AUTHORIZE = 'https://github.com/login/oauth/authorize';
const EXCHANGE = 'https://github.com/login/oauth/access_token';
const USER = 'https://api.github.com/user';
const STATE_COOKIE = 'admin_auth_state';
const SCOPE = 'repo';

const list = value => String(value ?? '').split(',').map(item => item.trim()).filter(Boolean);
const encode = value => btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const decode = value => atob(value.replaceAll('-', '+').replaceAll('_', '/'));

function nonce() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return encode(String.fromCharCode(...bytes));
}

function cookie(request, name) {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return '';
}

function text(status, message) {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}

// 결과는 연 창(opener)에만 정한 출처로 보낸다. 다른 출처의 창은 메시지를 받지 못한다.
export function resultPage(origin, payload) {
  const data = JSON.stringify({ type: 'admin-auth', ...payload }).replaceAll('<', '\\u003c');
  const target = JSON.stringify(origin);
  const html = `<!doctype html><meta charset="utf-8"><title>로그인</title><p>로그인 결과를 어드민 창으로 보냈습니다. 이 창은 닫아도 됩니다.</p><script>if (window.opener) window.opener.postMessage(${data}, ${target}); window.close();</script>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'",
      'set-cookie': `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

export async function handle(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  const origins = list(env.ADMIN_ORIGINS);
  if (url.pathname === '/auth') {
    const origin = url.searchParams.get('origin') ?? '';
    if (!origins.includes(origin)) return text(400, '허용하지 않은 어드민 주소입니다.');
    if (!env.GITHUB_CLIENT_ID) return text(500, 'GITHUB_CLIENT_ID가 설정되지 않았습니다.');
    const state = `${nonce()}.${encode(origin)}`;
    const target = new URL(AUTHORIZE);
    target.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${url.origin}/callback`, scope: SCOPE, state, allow_signup: 'false' });
    return new Response(null, { status: 302, headers: { location: String(target), 'cache-control': 'no-store', 'set-cookie': `${STATE_COOKIE}=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (url.pathname === '/callback') {
    const state = url.searchParams.get('state') ?? '';
    const code = url.searchParams.get('code') ?? '';
    const [, packed = ''] = state.split('.');
    let origin = '';
    try { origin = decode(packed); } catch { origin = ''; }
    if (!origins.includes(origin)) return text(400, '허용하지 않은 어드민 주소입니다.');
    if (!state || cookie(request, STATE_COOKIE) !== state) return resultPage(origin, { error: '로그인 요청이 만료됐거나 다른 창에서 시작됐습니다. 다시 로그인해 주세요.' });
    if (!code) return resultPage(origin, { error: 'GitHub에서 로그인을 취소했습니다.' });
    const exchange = await fetcher(EXCHANGE, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${url.origin}/callback` }),
    });
    const grant = await exchange.json().catch(() => ({}));
    if (!exchange.ok || !grant.access_token) return resultPage(origin, { error: 'GitHub 토큰을 받지 못했습니다. OAuth 앱 설정을 확인해 주세요.' });
    const user = await fetcher(USER, { headers: { authorization: `Bearer ${grant.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'woonyong-admin-auth' } });
    const profile = await user.json().catch(() => ({}));
    if (!user.ok || !list(env.ALLOWED_LOGINS).map(name => name.toLowerCase()).includes(String(profile.login ?? '').toLowerCase())) {
      return resultPage(origin, { error: '이 GitHub 계정은 글을 쓸 수 없습니다.' });
    }
    return resultPage(origin, { token: grant.access_token, login: profile.login });
  }
  return text(404, '없는 주소입니다.');
}

export default { fetch: (request, env) => handle(request, env) };
