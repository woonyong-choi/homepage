import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { parseAdminConfig } from './admin-config.mjs';
import { adminPage } from './admin-layout.mjs';
import { clientEntrypoints } from './publication-assets.mjs';

const base = { repository: 'woonyong-choi/vault', branch: 'main', posts: 'publish', assets: 'assets' };

test('admin_config_accepts_repository_folders_and_https_login_server_only', () => {
  assert.deepEqual(parseAdminConfig({ ...base, authUrl: 'https://auth.example.workers.dev/' }), { ...base, authUrl: 'https://auth.example.workers.dev' });
  assert.equal(parseAdminConfig(base).authUrl, '');
  assert.equal(parseAdminConfig({ ...base, authUrl: 'http://localhost:8787' }).authUrl, 'http://localhost:8787');
  for (const [key, value] of [['repository', 'vault'], ['posts', '../publish'], ['assets', '/assets'], ['branch', 'a..b'], ['authUrl', 'http://auth.example.com'], ['authUrl', 'https://auth.example.com/auth']]) {
    assert.throws(() => parseAdminConfig({ ...base, [key]: value }), new RegExp(`config/admin.json.${key}`));
  }
  assert.throws(() => parseAdminConfig({ ...base, token: 'x' }), /알 수 없는 설정/);
});

test('admin_page_hides_editor_until_login_and_loads_only_admin_script', () => {
  const html = adminPage({ ...base, authUrl: 'https://auth.example.workers.dev' });
  const { document } = new JSDOM(html).window;
  assert.equal(document.querySelector('[data-admin-editor]').hidden, true);
  assert.equal(document.querySelector('[data-action=signin]').textContent, 'GitHub로 로그인');
  assert.equal(JSON.parse(document.querySelector('[data-admin]').dataset.admin).repository, 'woonyong-choi/vault');
  assert.deepEqual(clientEntrypoints(html).filter(file => file !== 'document.js'), ['admin.js']);
  const setup = new JSDOM(adminPage(base)).window.document;
  assert.equal(setup.querySelector('[data-action=signin]'), null);
  assert.match(setup.querySelector('[data-admin-signin]').textContent, /authUrl/);
});
