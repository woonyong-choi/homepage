// 홈 설정의 섹션 종류마다 독립된 HTML 구성 요소를 만든다.
import { controlImage } from './controls.mjs';
import { escape } from './markdown.mjs';
import * as ui from './vendor/theme/assets/components.mjs';
import { href } from './home-config.mjs';
import { interviewCards, publicInterviews } from './interviews.mjs';
import { socialIcon } from './publication-footer.mjs';

const paragraphs = value => value.split(/\n\s*\n/).map(part => `<p>${escape(part.replace(/\s*\n\s*/g, ' ').trim())}</p>`).join('');
const { trusted } = ui;
const picture = (image, className = '', loading = 'lazy') => `<img${className ? ` class="${className}"` : ''} src="${escape(image.src)}" alt="${escape(image.alt)}" loading="${loading}" decoding="async">`;

function heroAction(hero) {
  const label = hero.action?.label ?? '프로젝트 영상 보기';
  if (hero.action?.href) return `<a class="app-hero-link" href="${escape(hero.action.href)}">${escape(label)} <span aria-hidden="true">${hero.action.href.startsWith('#') ? '↓' : '→'}</span></a>`;
  if (!hero.video) return '';
  return String(ui.RemoteLink({ id: `${hero.id}-player`, href: `#${hero.id}-video`, label, icon: trusted(controlImage('play', '', '')) }));
}

function heroShowcase({ id, video, image }) {
  if (video) return String(ui.ProjectShowcase({ id, title: video.title, src: video.src, poster: video.poster }));
  return image ? String(ui.Panorama({ id, label: image.alt || '히어로 이미지', image: trusted(picture(image)) })) : '';
}

export function heroSection(hero) {
  const action = heroAction(hero);
  return `<section id="${escape(hero.id)}" class="app-landing-hero"><div class="app-shell"><div class="app-hero-copy">${hero.icon ? picture({ ...hero.icon, alt: hero.icon.alt || hero.title || '' }, 'app-hero-logo', 'eager') : hero.title ? `<p class="app-hero-title" aria-hidden="true">${escape(hero.title)}</p>` : ''}<p class="app-hero-description">${escape(hero.description)}</p>${action ? `<p class="app-hero-description">${action}</p>` : ''}</div></div></section>${heroShowcase(hero)}`;
}

// 프로젝트, 기술, 인터뷰, 구독이 함께 쓰는 섹션 머리: 아이콘, 제목, 설명, 링크 행, 동작 링크.
function sectionIntro({ icon, title, titleId, description, links = [], action }) {
  return String(ui.SectionIntro({ id: titleId, icon: icon ? trusted(picture(icon)) : undefined, title, description: description ? trusted(paragraphs(description)) : undefined, links: links.length ? trusted(links.map(socialLink).join('')) : undefined, action }));
}

// href가 없는 항목은 아이콘만 보이는 자리표시이며 링크로 읽히지 않고 클릭되지 않는다.
function socialLink(item) {
  const icon = linkIcon(item);
  return String(ui.SocialLink({ href: item.href, label: item.label, icon: item.icon ? trusted(icon) : undefined }));
}

function linkIcon({ icon }) {
  if (!icon) return '';
  return icon.startsWith('/') ? picture({ src: icon, alt: '' }) : socialIcon(icon, 'app-landing-symbol');
}

export function projectsSection({ id, items }) {
  if (!items.length) return '';
  const slices = items.map(project => `<section class="app-landing-section app-landing-features"><div class="app-shell">${sectionIntro({ ...project, action: project.link })}${project.image ? `<div class="app-landing-collage">${picture(project.image)}</div>` : ''}</div></section>`).join('');
  return `<div id="${escape(id)}">${slices}</div>`;
}

const flowRail = (options, items) => String(ui.FlowRail({ ...options, items: trusted(items) }));

export function technologySection(section, brands) {
  if (!section.items.length) return '';
  const list = section.items.map(name => {
    const brand = brands.find(item => item.name === name);
    if (!brand) throw new Error(`unknown technology: ${name}`);
    return `<li class="app-technology"><a href="/tags/${encodeURIComponent(name)}/" aria-label="${escape(brand.label)} 태그 글 보기"><img src="/theme/assets/icons/brands/${escape(brand.file)}" alt="" decoding="async"><span class="app-sr">${escape(brand.label)}</span></a></li>`;
  }).join('');
  const id = escape(section.id);
  return `<section id="${id}" class="app-landing-section app-landing-technologies" aria-labelledby="${id}-title"><div class="app-shell">${sectionIntro({ ...section, titleId: `${section.id}-title` })}${flowRail({ kind: 'technologies', direction: 'right', label: '기술', ariaLabel: '기술 아이콘' }, list)}</div></section>`;
}

export function interviewsSection(section, { examples = [], preview = false } = {}) {
  const entries = publicInterviews(section.items.length ? section.items : examples, preview);
  if (!entries.length) return '';
  // 순서를 유지한 채 앞 절반을 위 줄, 나머지를 아래 줄에 둔다. 한 장이면 한 줄이다. 위 줄은 왼쪽, 아래 줄은 오른쪽으로 흐른다.
  const split = entries.length > 1 ? Math.ceil(entries.length / 2) : entries.length;
  const rows = [entries.slice(0, split), entries.slice(split)].filter(row => row.length);
  const rails = rows.map((row, index) => flowRail({ kind: 'interviews', direction: index ? 'right' : undefined, label: '인터뷰', ariaLabel: rows.length > 1 ? `인터뷰 카드 ${index + 1}행` : '인터뷰 카드' }, interviewCards(row, href))).join('');
  const body = rows.length > 1 ? String(ui.FlowRows({ rails: trusted(rails) })) : rails;
  const id = escape(section.id);
  return `<section id="${id}" class="app-landing-section app-landing-interviews" aria-labelledby="${id}-title"><div class="app-shell">${sectionIntro({ ...section, titleId: `${section.id}-title` })}${body}</div></section>`;
}

function newsletter(contact, id) {
  const ready = !!contact.endpoint;
  const heading = sectionIntro({ icon: contact.icon, title: contact.title, titleId: `${id}-title`, description: contact.description });
  const privacy = contact.privacy ? ` <a href="${escape(contact.privacy.href)}">${escape(contact.privacy.label)}</a>` : '';
  const state = ready
    ? (contact.note || privacy ? `<p class="app-newsletter-note" id="${id}-state">${escape(contact.note ?? '')}${privacy}</p>` : '')
    : `<p class="app-newsletter-note" id="${id}-state" role="status">구독 서비스를 준비 중입니다. 지금은 이메일 주소를 받지 않습니다.${privacy}</p>`;
  const disabled = ready ? '' : ' disabled';
  const form = `<form class="app-newsletter"${ready ? ` method="post" action="${escape(contact.endpoint)}"` : ''}><label class="app-sr" for="${id}-email">이메일 주소</label><input class="app-newsletter-email" type="email" id="${id}-email" name="${escape(contact.field)}" placeholder="me@example.com" autocomplete="email"${ready ? ' required' : ''}${disabled}${state ? ` aria-describedby="${id}-state"` : ''}>${state}<button type="submit"${disabled}>${escape(contact.button)}</button></form>`;
  const direct = contact.email ? `<p class="app-caption">메일로 직접 문의하려면 <a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a></p>` : '';
  return `<section id="${id}" class="app-landing-section app-landing-newsletter" aria-labelledby="${id}-title"><div class="app-shell">${heading}${form}${direct}</div></section>`;
}

export function contactSection(contact) {
  const id = escape(contact.id);
  if (contact.mode === 'newsletter') return newsletter(contact, id);
  return `<section id="${id}" class="app-home-contact" aria-labelledby="${id}-title"><h2 id="${id}-title">${escape(contact.title)}</h2><p>${escape(contact.description)}</p><a class="app-primary-action" href="mailto:${escape(contact.email)}">${escape(contact.button)} <span aria-hidden="true">→</span></a></section>`;
}
