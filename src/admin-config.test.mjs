import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { parseAdminConfig } from './admin-config.mjs';
import { adminPage } from './admin-layout.mjs';
import { initAdminLogin } from './admin.js';
import { documentShell } from './publication-layout.mjs';
import { loadBlogLayout } from './layout-config.mjs';

const base = { repository: 'woonyong-choi/vault', branch: 'main', posts: 'publish', assets: 'assets' };

test('admin_config_accepts_repository_folders_deploy_and_https_login_server_only', () => {
  assert.deepEqual(parseAdminConfig({ ...base, deploy: 'woonyong-choi/homepage/deploy.yml', authUrl: 'https://auth.example.workers.dev/' }), { ...base, deploy: 'woonyong-choi/homepage/deploy.yml', authUrl: 'https://auth.example.workers.dev' });
  assert.equal(parseAdminConfig(base).authUrl, '');
  assert.equal(parseAdminConfig(base).deploy, '');
  assert.equal(parseAdminConfig({ ...base, authUrl: 'http://localhost:8787' }).authUrl, 'http://localhost:8787');
  for (const [key, value] of [['repository', 'vault'], ['posts', '../publish'], ['assets', '/assets'], ['branch', 'a..b'], ['deploy', 'homepage/deploy.yml'], ['authUrl', 'http://auth.example.com'], ['authUrl', 'https://auth.example.com/auth']]) {
    assert.throws(() => parseAdminConfig({ ...base, [key]: value }), new RegExp(`config/admin.json.${key}`));
  }
  assert.throws(() => parseAdminConfig({ ...base, token: 'x' }), /알 수 없는 설정/);
});

test('admin_login_page_is_logo_and_login_only', () => {
  const config = { title: 'Who Knows', logo: { src: '/assets/who-knows.svg', alt: 'Who Knows' } };
  const context = { readAsset: () => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>') };
  const oauth = new JSDOM(adminPage(config, context, { ...base, authUrl: 'https://auth.example.workers.dev' })).window.document;
  assert.equal(oauth.querySelector('.app-admin-login h1.app-sr').textContent, '로그인');
  assert.equal(oauth.querySelector('.app-admin-login-logo').getAttribute('aria-label'), 'Who Knows 홈');
  assert.deepEqual([...oauth.querySelectorAll('[data-action]')].map(node => node.dataset.action), ['signin', 'signout']);
  // 로그인 서버가 없으면 토큰을 붙여 넣어 로그인한다. 토큰 만들기는 권한을 미리 채운 GitHub 화면이다.
  const token = new JSDOM(adminPage(config, context, base)).window.document;
  assert.equal(token.querySelector('#admin-token').type, 'password');
  assert.deepEqual([...token.querySelectorAll('[data-action]')].map(node => node.dataset.action), ['token-signin', 'signout']);
  const help = new URL(token.querySelector('a[target=_blank]').href);
  assert.equal(help.origin + help.pathname, 'https://github.com/settings/personal-access-tokens/new');
  assert.equal(help.searchParams.get('contents'), 'write');
  assert.equal(help.searchParams.get('actions'), 'write');
});

test('token_login_requires_owner_token_that_can_write_both_vault_and_site_repositories', async () => {
  const settings = { ...base, deploy: 'woonyong-choi/homepage/deploy.yml' };
  const page = adminPage({ title: 'Who Knows' }, {}, settings);
  const attempt = async push => {
    const dom = new JSDOM(page, { url: 'https://woonyong.com/admin/' });
    const root = dom.window.document.querySelector('[data-admin-login]');
    const saved = new Map();
    const storage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
    const reply = body => ({ ok: true, json: async () => body });
    const fetcher = async url => url.endsWith('/user') ? reply({ login: 'woonyong-choi' }) : reply({ permissions: { push: push[url.split('/').pop()] } });
    initAdminLogin(root, settings, { storage, fetcher });
    root.querySelector('#admin-token').value = 'token';
    root.querySelector('[data-action=token-signin]').click();
    await new Promise(resolve => setTimeout(resolve, 20));
    const result = { status: root.querySelector('[data-admin-status]').textContent, saved: saved.size };
    dom.window.close();
    return result;
  };
  const vaultOnly = await attempt({ vault: true, homepage: false });
  assert.equal(vaultOnly.saved, 0);
  assert.match(vaultOnly.status, /homepage 저장소 쓰기 권한이 없습니다.*vault와 homepage 저장소를 모두 골라/);
  const both = await attempt({ vault: true, homepage: true });
  assert.equal(both.saved, 1);
  assert.match(both.status, /woonyong-choi 계정으로 로그인했습니다/);
});

test('every_page_gets_small_admin_loader_with_settings_only_when_admin_is_configured', () => {
  const context = { config: { name: '최우녕', title: 'Who Knows', description: '', github: 'https://github.com/woonyong-choi', linkedin: 'https://www.linkedin.com/in/woonyong-choi' }, themeHash: 't', scriptHash: 's', scriptHashes: { 'admin-editor.js': 'e' }, layout: loadBlogLayout() };
  const plain = documentShell({ route: '/blog/', title: 'Blog' }, '<main></main>', context);
  assert.doesNotMatch(plain, /admin/);
  const html = documentShell({ route: '/blog/', title: 'Blog' }, '<main></main>', { ...context, admin: { ...base, deploy: '', authUrl: '', author: { name: '최우녕' } } });
  const { document } = new JSDOM(html).window;
  const settings = JSON.parse(document.querySelector('meta[name="admin-settings"]').content);
  assert.equal(settings.editor, '/admin-editor.js?v=e');
  assert.equal(settings.repository, 'woonyong-choi/vault');
  assert.ok(document.querySelector('script[src^="/admin.js?v="]'));
  assert.equal(document.querySelector('script[src^="/admin-editor.js"]'), null);
});
