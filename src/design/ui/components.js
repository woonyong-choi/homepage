import { escape, safeUrl, slot, id, out } from './html.js';
import { ToolButton, Toolbar, ToolHeader } from './toolbar.js';
import { ControlIcon } from './icons.js';
export const CARD_VARIANTS = ['centered', 'grouped', 'inline', 'related', 'summary'];

export const WIDTHS = ['content', 'narrow', 'wide'];
export function contentWidth(props = {}) {
  for (const key of ['wide', 'size']) {
    if (Object.hasOwn(props, key)) throw new Error(`Use width instead of ${key}`);
  }
  const { width } = props;
  if (width !== undefined && !WIDTHS.includes(width)) throw new Error(`Unknown width: ${width}`);
  return width ?? 'content';
}
export const widthClass = (props) => { const width = contentWidth(props); return width === 'content' ? '' : ` app-width-${width}`; };

export function CopyButton({ label = '코드 복사' } = {}) {
  return ToolButton({ action: 'copy', label, icon: 'copy', hidden: true });
}

export const SYNTAX_ROLES = Object.freeze(['keyword', 'string', 'number', 'function', 'type', 'property', 'parameter', 'variable', 'constant', 'comment', 'operator', 'punctuation', 'annotation']);

export function syntaxClass(role) {
  if (role === undefined) return '';
  if (!SYNTAX_ROLES.includes(role)) throw new Error(`Unknown syntax role: ${role}`);
  return `app-syntax-${role}`;
}

export function SyntaxToken({ text, role }) {
  const name = syntaxClass(role);
  return out(name ? `<span class="${name}">${escape(text)}</span>` : escape(text));
}

export function CodeBlock({ code, label = '코드 복사', language = '', filename = '', width }) {
  const toolbar = Toolbar({ label: '코드 도구', buttons: [CopyButton({ label })] });
  const lang = language ? ` data-language="${escape(language)}"` : '';
  return out(`<div class="app-code app-tool-surface${widthClass({ width })}"${lang}>${ToolHeader({ label: filename, toolbar })}<pre>${slot(code, 'code')}</pre></div>`);
}

export function Callout({ title, tone, fineprint = false, body }) {
  return out(`${Callout.open({ title, tone, fineprint })}${slot(body, 'body')}${Callout.close()}`);
}
export const CALLOUT_TONES = Object.freeze(['success', 'warning', 'error']);
Callout.open = ({ title, tone, fineprint = false }) => {
  if (tone !== undefined && !CALLOUT_TONES.includes(tone)) throw new Error(`Unknown callout tone: ${tone}`);
  return `<aside class="app-callout${tone ? ` is-${tone}` : ''}${fineprint ? ' is-fineprint' : ''}"><strong>${escape(title)}</strong>`;
};
Callout.close = () => '</aside>';

export function TooltipTrigger({ id: target, label }) {
  return out(`<button class="app-tooltip" type="button" popovertarget="${id(target)}" data-tooltip-trigger>${escape(label)}</button>`);
}
export function TooltipBubble({ id: target, text, body }) {
  return out(body === undefined
    ? `<span class="app-tooltip-bubble" id="${id(target)}" role="tooltip" popover>${escape(text)}</span>`
    : `<div class="app-tooltip-bubble" id="${id(target)}" popover>${slot(body, 'body')}</div>`);
}
export const Tooltip = ({ id: target, label, text }) => out(`${TooltipTrigger({ id: target, label })}${TooltipBubble({ id: target, text })}`);
export const TooltipBlock = ({ id: target, label, body }) => out(`<p>${TooltipTrigger({ id: target, label })}</p>${TooltipBubble({ id: target, body })}`);

export const TAB_SELECTORS = ['buttons', 'segmented', 'numbers'];
export function TabList({ id: group, label = '탭', labels, selector = 'buttons', selected = 0, controls, inlineCode = false, afterPanel = false }) {
  id(group);
  if (!TAB_SELECTORS.includes(selector)) throw new Error(`Unknown tabs selector: ${selector}`);
  const numbers = selector === 'numbers';
  const content = text => inlineCode ? String(text).split('`').map((part, at) => at % 2 ? `<code>${escape(part)}</code>` : escape(part)).join('') : escape(text);
  return out(`<div class="app-tablist${afterPanel ? ' is-after-panel' : ''}${selector === 'buttons' ? '' : ` is-${selector}`}" role="tablist" aria-label="${escape(label)}">${labels.map((text, index) => `<button type="button" id="${group}-tab-${index}" role="tab" aria-selected="${index === selected}" aria-controls="${id(controls?.[index] ?? `${group}-panel-${index}`)}" tabindex="${index === selected ? '0' : '-1'}"${numbers ? ` aria-label="${escape(text ?? `탭 ${index + 1}`)}"` : ''}>${numbers ? index + 1 : content(text)}</button>`).join('')}</div>`);
}

export function Card({ href, title, showTitle = true, description = '', icon, variant, compact = false, horizontal = false, headingLevel, rel, label }) {
  if (variant !== undefined && !CARD_VARIANTS.includes(variant)) throw new Error(`Unknown card variant: ${variant}`);
  const link = safeUrl(href);
  const heading = `<strong${showTitle ? '' : ' class="app-sr"'}${headingLevel === undefined ? '' : ` role="heading" aria-level="${Number(headingLevel)}"`}>`;
  const mark = icon === undefined || icon === false ? '' : slot(icon, 'icon');
  if (variant === 'related') return out(`<a class="app-help-card app-related-link${mark ? '' : ' has-no-icon'}" href="${link}"${rel ? ` rel="${escape(rel)}"` : ''}${label ? ` aria-label="${escape(label)}"` : ''}>${mark}${heading}${escape(title)}</strong></a>`);
  const classes = variant ? ` is-${variant}` : compact ? ' is-compact' : horizontal ? ' is-horizontal' : '';
  const bare = !mark || (compact && !variant);
  return out(`<a class="app-help-card${classes}${bare ? ' has-no-icon' : ''}" href="${link}">${bare ? '' : mark}${heading}${escape(title)}</strong>${description ? `<p${variant === 'summary' ? ' class="app-card-summary"' : ''}>${escape(description)}</p>` : ''}</a>`);
}

export function CardGroup({ variant, columns, split = false, cards }) {
  const items = cards.map((card) => slot(card, 'card'));
  if (split && variant !== 'inline' && variant !== 'related') return out(`<div class="app-support-split">${items[0]}<div class="app-support-links">${items.slice(1).join('')}</div></div>`);
  return out(`${CardGroup.open({ variant, columns })}${items.join(CardGroup.gap(variant))}${CardGroup.close()}`);
}
CardGroup.open = ({ variant, columns }) => {
  if (columns !== undefined && (!['number', 'string'].includes(typeof columns) || !/^[1-5]$/.test(String(columns)))) throw new Error('CardGroup columns must be an integer from 1 to 5');
  return variant === 'related' ? '<div class="app-related-grid">' : variant === 'inline' ? '<div class="app-inline-links">' : `<div class="app-support-grid${({ 1: ' is-single', 2: ' is-pair', 4: ' is-four', 5: ' is-five' })[columns] ?? ''}">`;
};
CardGroup.close = () => '</div>';
CardGroup.gap = (variant) => variant === 'inline' ? ' ' : '';

export function Gallery(props) {
  const { id: group, title = '이미지 슬라이드', selected = 0, slides } = props;
  if (!Array.isArray(slides) || !slides.length) throw new Error('Gallery requires slides');
  if (!Number.isInteger(selected) || selected < 0 || selected >= slides.length) throw new Error('Gallery selected index is out of range');
  id(group);
  const labeled = slides.every((slide) => typeof slide.label === 'string');
  const panels = slides.map((slide, index) => `<div class="app-tabpanel" id="${group}-panel-${index}" role="tabpanel" aria-labelledby="${group}-tab-${index}" tabindex="0"${index === selected ? '' : ' hidden'}>${Figure({ media: slide.image, caption: slide.caption })}</div>`).join('');
  const labels = slides.map((slide, index) => slide.label ?? `슬라이드 ${index + 1}`);
  return out(`<section class="app-tabs${widthClass(props)}" data-tabs>${panels}${TabList({ id: group, label: title, labels, selector: labeled ? 'segmented' : 'numbers', selected, afterPanel: true })}</section>`);
}

export function Figure(props) {
  const { media, href, caption = '', controls } = props;
  const body = href === undefined ? slot(media, 'media') : `<a href="${safeUrl(href)}">${slot(media, 'media')}</a>`;
  return out(`<figure class="${FIGURE_CLASS}${widthClass(props)}">${body}${caption || controls ? `<figcaption>${escape(caption)}${controls === undefined ? '' : slot(controls, 'controls')}</figcaption>` : ''}</figure>`);
}

const GRID_COLUMNS = { 1: 'one-column', 2: 'two-columns', 3: 'three-columns', 4: 'four-columns', 5: 'five-columns', 6: 'six-columns' };
export function FigureGrid({ columns, size, figures }) {
  if (!Array.isArray(figures) || !figures.length) throw new Error('FigureGrid needs figures');
  if (columns !== undefined && !(['number', 'string'].includes(typeof columns) && Object.hasOwn(GRID_COLUMNS, columns))) throw new Error(`Invalid columns: ${columns}`);
  if (size !== undefined && !['small', 'large'].includes(size)) throw new Error(`Invalid size: ${size}`);
  return out(`<div class="app-figure-grid${size ? ` is-${size}` : ''}${columns === undefined ? '' : ` has-${GRID_COLUMNS[columns]}`}">${figures.map((figure) => `<div class="app-figure-grid-item">${slot(figure, 'figure')}</div>`).join('')}</div>`);
}

export function Player({ id: target, src, poster, title = '기능 소개 영상', width, height, controls = false, overlay = false, wide = false }) {
  return out(`<div class="app-player${wide ? ' is-wide' : ''}${controls ? ' has-controls' : ''}" data-player id="${id(target)}"><video${width ? ` width="${Number(width)}"` : ''}${height ? ` height="${Number(height)}"` : ''} playsinline${controls ? '' : ' muted'} preload="none" poster="${safeUrl(poster)}" aria-label="${escape(title)}"${controls ? ' data-native-controls' : ''}><source src="${safeUrl(src)}" type="video/mp4"></video>${overlay || controls ? `<button class="app-player-button" type="button" data-player-play aria-label="Play video">${ControlIcon('play')}</button>` : ''}<span class="app-sr" role="status"></span></div>`);
}
export function RemoteButton({ id: target, src, icon }) {
  return out(`<button class="app-remote" type="button" data-remote="${id(target)}"${src ? ` data-video-src="${safeUrl(src)}"` : ''} aria-label="Play video">${slot(icon, 'icon')}<span>Play</span></button>`);
}
export function Device({ screen, overlay, label, figure = false }) {
  const inner = `<div class="app-device-screen">${slot(screen, 'screen')}</div>${overlay === undefined ? '' : slot(overlay, 'overlay')}`;
  if (label !== undefined) return out(`<figure class="app-device" aria-label="${escape(label)}">${inner}</figure>`);
  return out(figure ? `<figure class="app-device">${inner}</figure>` : `<div class="app-device">${inner}</div>`);
}
export const MediaControls = ({ remote }) => out(`<div class="app-media-controls">${slot(remote, 'remote')}</div>`);
export function Video(props) {
  const { id: target, src, poster, title, caption, playerWidth, playerHeight, playerWide = false, frame, deviceOverlay } = props;
  const view = Player({ id: target, src, poster, title, width: playerWidth, height: playerHeight, controls: true, wide: playerWide });
  const media = frame === 'iphone' ? Device({ screen: view, overlay: deviceOverlay }) : view;
  return Figure({ media, caption, width: contentWidth(props) });
}

export const FIGURE_CLASS = 'app-figure';
export const FINEPRINT_CLASS = 'app-fineprint';
export const Fineprint = ({ text }) => out(`<p class="${FINEPRINT_CLASS}">${slot(text, 'text')}</p>`);
export const Steps = ({ body }) => out(`${Steps.open()}${slot(body, 'body')}${Steps.close()}`);
Steps.open = () => '<div class="app-steps">';
Steps.close = () => '</div>';
export const DEFINITIONS_CLASS = 'app-definitions';
export const Definitions = ({ items }) => out(`<dl class="${DEFINITIONS_CLASS}">${items.map((item) => `<dt>${escape(item.term)}</dt><dd>${slot(item.body, 'body')}</dd>`).join('')}</dl>`);

export const Kbd = ({ text }) => out(`<kbd>${escape(text)}</kbd>`);
export const Menu = ({ text }) => out(`<b class="app-menu-label">${escape(text)}</b>`);
export const InlineIcon = ({ icon }) => out(`<span class="app-inline-icon">${slot(icon, 'icon')}</span>`);
export const CancelledTask = () => out('<span class="app-cancelled-task" role="img" aria-label="취소된 작업"></span>');
