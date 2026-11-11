// 페이지의 데이터·주소·문구를 받아 공통 배치만 조립한다.
import { escape, id, safeUrl, slot, out } from './html.mjs';
import { SocialIcon } from './icons.mjs';

export function SiteHeader({ label, homeLabel, title = homeLabel, icon, logo, homeHref = '/', items, active = '' }) {
  const brand = logo ? `<span class="app-logo-brand">${slot(logo, 'logo')}</span>` : `${icon ? `<span class="app-logo-icon">${slot(icon, 'icon')}</span>` : ''}${escape(title)}`;
  return out(`<div class="app-shell"><header class="app-header"><a class="app-logo" href="${safeUrl(homeHref)}" aria-label="${escape(homeLabel)}">${brand}</a><nav class="app-nav" aria-label="${escape(label)}">${items.map(({ label, href }) => `<span class="app-nav-item"><a href="${safeUrl(href)}"${active.startsWith(href) ? ' aria-current="page"' : ''}>${escape(label)}</a></span>`).join('')}</nav></header></div>`);
}

export function SiteFooter({ owner, year, links }) {
  return out(`<footer class="app-footer"><div class="app-shell"><div class="app-footer-bar"><p class="app-footer-copy">© <span data-current-year>${Number(year)}</span> ${escape(owner)}</p><div class="app-footer-links">${links.map(link => `<a href="${safeUrl(link.href)}" aria-label="${escape(link.label)}">${SocialIcon(link.icon)}</a>`).join('')}</div></div></div></footer>`);
}

export function QuoteCard({ profile, href, label, content }) {
  const link = href ? `<a class="app-interview-card-link" href="${safeUrl(href)}" aria-label="${escape(label)}"></a>` : '';
  const picture = profile?.image ? `<span class="app-interview-avatar"><img src="${safeUrl(profile.image.src)}" alt="${escape(profile.image.alt)}" loading="lazy" decoding="async"></span>` : '';
  const attribution = profile ? `<div class="app-interview-meta">${picture}<div class="app-interview-lines"><strong>${escape(profile.title)}</strong>${profile.subtitle ? `<span>${escape(profile.subtitle)}</span>` : ''}</div></div>` : '';
  return out(`<li class="app-interview-card">${link}<p class="app-interview-summary">${slot(content, 'content')}</p>${attribution}</li>`);
}

export function Hero({ id: name, title, description, icon, action, showcase }) {
  return out(`<section id="${id(name)}" class="app-landing-hero"><div class="app-shell"><div class="app-hero-copy">${icon ? slot(icon, 'icon') : title ? `<p class="app-hero-title" aria-hidden="true">${escape(title)}</p>` : ''}<p class="app-hero-description">${escape(description)}</p>${action ? `<p class="app-hero-description">${slot(action, 'action')}</p>` : ''}</div></div></section>${showcase ? slot(showcase, 'showcase') : ''}`);
}

const SECTIONS = { content: 'app-landing-features', icons: 'app-landing-technologies', quotes: 'app-landing-interviews', form: 'app-landing-newsletter' };
export function Section({ id: name, variant = 'content', labelledBy, heading, content }) {
  if (!Object.hasOwn(SECTIONS, variant)) throw new Error(`Unknown section: ${variant}`);
  return out(`<section${name ? ` id="${id(name)}"` : ''} class="app-landing-section ${SECTIONS[variant]}"${labelledBy ? ` aria-labelledby="${id(labelledBy)}"` : ''}><div class="app-shell">${heading ? slot(heading, 'heading') : ''}${slot(content, 'content')}</div></section>`);
}

export function LogoItem({ href, label, src }) {
  const content = `<img src="${safeUrl(src)}" alt="" decoding="async"><span class="app-sr">${escape(label)}</span>`;
  const item = href ? `<a href="${safeUrl(href)}" aria-label="${escape(label)}">${content}</a>` : `<span role="link" aria-disabled="true" aria-label="${escape(label)}">${content}</span>`;
  return out(`<li class="app-technology">${item}</li>`);
}

const INPUT_TYPES = ['text', 'email', 'url', 'tel', 'date', 'password'];
const INPUT_SIZES = ['small', 'medium', 'large', 'control'];
const INPUT_SURFACES = ['track', 'field', 'card', 'bare'];
const INPUT_ROLES = ['searchbox', 'combobox'];
/**
 * 모든 텍스트 입력의 단일 구성 요소. 보이지 않는 이름표와 `app-input` 입력을 조립한다.
 * `size`는 small(분할 탭 높이)·medium·large(검색)·control(구독 폼), `surface`는 track·field·card·bare(면 없이 글자만, 태그 입력 칸)다.
 * `icon`이 있으면 앞 아이콘 칸, `action`이 있으면 입력 뒤 동작(지우기 단추 등)을 같은 `app-input-field` 안에 둔다.
 * `role`은 searchbox 또는 combobox이며 combobox는 `controls`로 추천 목록 ID를 받는다.
 * `labelVisible: true`이면 이름표를 입력 위에 보이게 둔다(편집 화면의 입력 칸).
 */
export function TextInput({ id: name, name: field = name, label, type = 'text', value = '', placeholder = '', autocomplete, describedBy, required = false, disabled = false, size = 'small', surface = 'track', icon, action, role, controls, labelVisible = false }) {
  if (!INPUT_TYPES.includes(type)) throw new Error(`Unknown input type: ${type}`);
  if (!INPUT_SIZES.includes(size)) throw new Error(`Unknown input size: ${size}`);
  if (!INPUT_SURFACES.includes(surface)) throw new Error(`Unknown input surface: ${surface}`);
  if (role !== undefined && !INPUT_ROLES.includes(role)) throw new Error(`Unknown input role: ${role}`);
  if ((role === 'combobox') !== (controls !== undefined)) throw new Error('combobox requires controls');
  const classes = `app-input${size === 'small' ? '' : ` is-${size}`}${surface === 'track' ? '' : ` is-${surface}`}`;
  const aria = role === 'combobox' ? ` role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id(controls)}"` : role ? ` role="${role}"` : '';
  const input = `<input class="${classes}" type="${type}" id="${name}" name="${escape(field)}"${value ? ` value="${escape(value)}"` : ''}${placeholder ? ` placeholder="${escape(placeholder)}"` : ''}${autocomplete ? ` autocomplete="${escape(autocomplete)}"` : ''}${required ? ' required' : ''}${disabled ? ' disabled' : ''}${describedBy ? ` aria-describedby="${id(describedBy)}"` : ''}${aria}>`;
  const control = icon === undefined && action === undefined ? input : `<div class="app-input-field">${icon === undefined ? '' : slot(icon, 'icon')}${input}${action === undefined ? '' : slot(action, 'action')}</div>`;
  return out(`<label class="${labelVisible ? 'app-field-label' : 'app-sr'}" for="${id(name)}">${escape(label)}</label>${control}`);
}

export function EmailForm({ id: name, action, field, label, placeholder, button, note }) {
  const disabled = action ? '' : ' disabled';
  const input = TextInput({ id: `${id(name)}-email`, name: field, label, type: 'email', placeholder, autocomplete: 'email', required: Boolean(action), disabled: !action, describedBy: note ? `${name}-state` : undefined, size: 'control', surface: 'card' });
  return out(`<form class="app-newsletter"${action ? ` method="post" action="${safeUrl(action)}"` : ''}>${input}${note ? slot(note, 'note') : ''}<button type="submit"${disabled}>${escape(button)}</button></form>`);
}
