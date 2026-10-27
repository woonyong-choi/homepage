// /admin/: 관리자 로그인 화면. 빈 화면 가운데에 사이트 로고와 로그인 단추만 둔다.
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { renderContentSvg } from './content-icons.mjs';

export function adminPage(config, context) {
  const logo = config.logo ? ui.trusted(renderContentSvg(config.logo.src, '', context.readAsset)) : ui.trusted(ui.escape(config.title ?? config.name ?? ''));
  const actions = ui.trusted(`${ui.Button({ label: 'GitHub로 로그인', variant: 'primary', action: 'signin' })}${ui.Button({ label: '로그아웃', action: 'signout', hidden: true })}`);
  const status = ui.trusted('<p class="app-caption" data-admin-status role="status" aria-live="polite"></p>');
  return `<main id="main" data-admin-login>${ui.AdminLogin({ title: '로그인', logo, homeLabel: `${config.logo?.alt || config.title || '사이트'} 홈`, actions, status })}</main>`;
}
