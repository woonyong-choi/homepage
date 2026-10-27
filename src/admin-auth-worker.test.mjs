import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handle } from '../workers/admin-auth/worker.js';

const env = { GITHUB_CLIENT_ID: 'client', GITHUB_CLIENT_SECRET: 'secret', ALLOWED_LOGINS: 'woonyong-choi', ADMIN_ORIGINS: 'https://woonyong.com,http://localhost:8796' };
const json = (body, ok = true) => ({ ok, json: async () => body });

async function start(origin = 'https://woonyong.com') {
  const response = await handle(new Request(`https://auth.example.workers.dev/auth?origin=${encodeURIComponent(origin)}`), env);
  const location = new URL(response.headers.get('location'));
  return { response, state: location.searchParams.get('state'), location };
}

test('admin_auth_starts_github_login_only_for_allowed_admin_origins', async () => {
  const { response, state, location } = await start();
  assert.equal(response.status, 302);
  assert.equal(location.origin + location.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(location.searchParams.get('redirect_uri'), 'https://auth.example.workers.dev/callback');
  assert.equal(location.searchParams.get('scope'), 'repo');
  assert.match(response.headers.get('set-cookie'), new RegExp(`admin_auth_state=${state.replace(/[.]/g, '\\.')};.*HttpOnly; Secure`));
  assert.equal((await handle(new Request('https://auth.example.workers.dev/auth?origin=https://evil.example'), env)).status, 400);
});

test('admin_auth_returns_token_only_to_allowed_login_and_matching_state', async () => {
  const { state } = await start();
  const calls = [];
  const fetcher = async (url, init) => { calls.push([url, init]); return url.includes('access_token') ? json({ access_token: 'gho_token' }) : json({ login: 'Woonyong-Choi' }); };
  const callback = (value, cookie = value) => new Request(`https://auth.example.workers.dev/callback?code=abc&state=${encodeURIComponent(value)}`, { headers: { cookie: `admin_auth_state=${cookie}` } });
  const page = await (await handle(callback(state), env, fetcher)).text();
  assert.match(page, /"token":"gho_token"/);
  assert.match(page, /postMessage\(.*, "https:\/\/woonyong\.com"\)/);
  assert.equal(JSON.parse(calls[0][1].body).client_secret, 'secret');
  const stranger = async url => url.includes('access_token') ? json({ access_token: 'gho_token' }) : json({ login: 'someone' });
  const denied = await (await handle(callback(state), env, stranger)).text();
  assert.doesNotMatch(denied, /gho_token/);
  assert.match(denied, /글을 쓸 수 없습니다/);
  const mismatch = await (await handle(callback(state, 'other'), env, fetcher)).text();
  assert.doesNotMatch(mismatch, /gho_token/);
  assert.equal(calls.length, 2);
});
