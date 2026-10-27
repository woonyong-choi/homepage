import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { parseAdminConfig } from './admin-config.mjs';
import { adminPage } from './admin-layout.mjs';
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

test('admin_login_page_offers_github_login_only_when_login_server_exists', () => {
  const { document } = new JSDOM(adminPage({ ...base, authUrl: 'https://auth.example.workers.dev' }, { siteTitle: 'Who Knows' })).window;
  assert.equal(document.querySelector('[data-action=signin]').textContent, 'GitHub로 로그인');
  assert.equal(document.querySelector('[data-action=signout]').hidden, true);
  assert.equal(document.querySelector('.app-editor-notice-footer a').textContent, 'Who Knows 홈으로');
  const setup = new JSDOM(adminPage(base)).window.document;
  assert.equal(setup.querySelector('[data-action=signin]'), null);
  assert.equal(setup.querySelector('[data-action=demo-start]').textContent, '로그인 없이 체험하기');
  assert.equal(setup.querySelector('[data-action=demo-end]').hidden, true);
  assert.match(setup.querySelector('[data-admin-login]').textContent, /authUrl/);
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
