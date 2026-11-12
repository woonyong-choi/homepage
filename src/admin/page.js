import * as ui from '#design/ui/index.js';
import { renderContentSvg } from '../layouts/icons.js';

export function tokenUrl(config) {
  const url = new URL('https://github.com/settings/personal-access-tokens/new');
  const owner = config.repository.split('/')[0];
  for (const [key, value] of Object.entries({ name: '사이트 글 관리', description: `${config.repository}에 글을 저장하고 사이트를 배포합니다.`, target_name: owner, expires_in: 'none', contents: 'write', actions: 'write' })) url.searchParams.set(key, value);
  return String(url);
}

export function adminPage(config, context, admin) {
  const logo = config.logo ? ui.trusted(renderContentSvg(config.logo.src, '', context.readAsset)) : ui.trusted(ui.escape(config.title ?? config.name ?? ''));
  const signout = `${ui.Button({ label: '로그아웃', variant: 'primary', action: 'signout', hidden: true })}${ui.LinkButton({ label: '홈으로', href: '/', variant: 'quiet', hidden: true })}`;
  const login = admin.authUrl
    ? [ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' }), signout]
    : [ui.trusted(`<form data-admin-token-form>${ui.TextInput({ id: 'admin-token', name: 'token', label: 'GitHub 토큰', type: 'password', surface: 'field', placeholder: 'GitHub 토큰 붙여 넣기', autocomplete: 'off' })}</form>`), ui.Button({ label: '로그인', variant: 'primary', action: 'token-signin' }), ui.LinkButton({ label: '토큰 만들기', href: tokenUrl(admin), variant: 'quiet', external: true }), signout];
  const status = ui.trusted('<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>');
  return `<main id="main" data-admin-login>${ui.AdminLogin({ title: '로그인', logo, homeLabel: `${config.logo?.alt || config.title || '사이트'} 홈`, actions: ui.trusted(login.map(String).join('')), status })}</main>`;
}
