// Markdown과 명시적인 문서 구성 요소를 정적 HTML로 변환한다.
import { controlImage } from './controls.mjs';
import { existsSync, readFileSync } from 'node:fs';
import MarkdownIt from './vendor/markdown-it/markdown-it.mjs';
import footnote from 'markdown-it-footnote';
import deflist from 'markdown-it-deflist';
import mathPlugin from '@vscode/markdown-it-katex';
import katex from 'katex';
import taskLists from 'markdown-it-task-lists';
import { parse } from 'yaml';
import { contentIcon } from './content-icons.mjs';
import { installDirectives } from './directives.mjs';
import { DirectiveError, parseOptions, WIDTH_OPTION } from './directive-syntax.mjs';
import { codeLanguage, highlightCode } from './code-highlight.mjs';
import * as ui from './vendor/theme/ui/index.mjs';

const IMAGE_SIZES = JSON.parse(readFileSync(new URL('./image-sizes.json', import.meta.url)));
// HTML 모양과 변형은 가져온 테마의 구성 요소가 정의한다. 아래 함수는 입력을 정리해 그 구성 요소에 넘기는 어댑터다.
const { escape, safeUrl, trusted } = ui;
export { escape, safeUrl };
export function asset(name) {
  if (typeof name !== 'string' || !/^[\w.-]+$/.test(name)) throw new Error(`Invalid asset: ${name}`);
  return `/assets/${name}`;
}
const CODE_ATTRIBUTES = Object.freeze({ width: WIDTH_OPTION, filename: { type: 'text' } });
const DIAGRAM_ATTRIBUTES = Object.freeze({ width: WIDTH_OPTION });
export { codeLanguage };
const codeBlock = (code, options) => String(ui.CodeBlock({ code: trusted(code), ...options }));

export function icon(name = 'question') {
  if (typeof name === 'object' && name !== null) return contentIcon(name);
  if (typeof name === 'string' && name.startsWith('content:')) return contentIcon(name.slice(8));
  return String(ui.ArticleIcon(name));
}
export function image(name, alt = '', className = '') {
  const size = IMAGE_SIZES[name];
  return `<img${size ? ` width="${size[0]}" height="${size[1]}"` : ''} class="${className}" src="${asset(name)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
}

export const player = (data, id, controls = false) => String(ui.Player({ id, src: asset(data.src), poster: asset(data.poster), title: data.title, width: data.width, height: data.height, controls, overlay: data.overlay, wide: data.wide }));
export const remote = (id, src = '') => String(ui.RemoteButton({ id, src: src ? asset(src) : undefined, icon: trusted(controlImage('play')) }));

// 영상 입력을 구성 요소 속성으로 옮긴다. ui:video(`width`·`height`·`wide`는 플레이어 값)와 ::video(`width`는 블록 폭)가 같이 쓴다.
export const videoOf = (data, id) => String(ui.Video({ id, src: asset(data.src), poster: asset(data.poster), title: data.title, caption: data.caption ?? '', frame: data.frame === 'iphone' ? 'iphone' : undefined, playerWidth: data.playerWidth, playerHeight: data.playerHeight, playerWide: data.playerWide, width: data.width, wide: data.wide, size: data.size, deviceOverlay: trusted(image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')) }));

// 같은 낱말 표식 `::강조::`, `==강조==`로 mark를 만든다. 공백으로 시작하거나 끝나는 표식은 글자 그대로 둔다.
function markRule(marker) {
  return (state, silent) => {
    const start = state.pos;
    const first = state.src[start + marker.length] ?? ' ';
    if (state.src.slice(start, start + marker.length) !== marker || /\s/.test(first) || first === marker[0]) return false;
    let end = start + marker.length;
    while ((end = state.src.indexOf(marker, end)) !== -1) {
      let escapes = 0;
      for (let at = end - 1; at >= 0 && state.src[at] === String.fromCharCode(92); at -= 1) escapes += 1;
      if (escapes % 2 === 0) break;
      end += marker.length;
    }
    if (end < 0 || /\s/.test(state.src[end - 1]) || state.src.slice(start + marker.length, end).includes('\n')) return false;
    if (!silent) {
      state.push('mark_open', 'mark', 1);
      const children = [];
      state.md.inline.parse(state.src.slice(start + marker.length, end), state.md, state.env, children);
      state.tokens.push(...children);
      state.push('mark_close', 'mark', -1);
    }
    state.pos = end + marker.length;
    return true;
  };
}

// `H~2~O`, `x^2^`: 공백 없는 짧은 낱말만 아래·위 첨자로 만든다. `~~취소선~~`과 `^[각주]`는 건드리지 않는다.
function scriptRule(marker, tag) {
  return (state, silent) => {
    const { src, pos: start } = state;
    if (src[start] !== marker || src[start + 1] === marker || src[start + 1] === '[') return false;
    let end = start + 1;
    while (end < src.length && src[end] !== marker) {
      if (/\s/.test(src[end])) return false;
      end += src[end] === String.fromCharCode(92) ? 2 : 1;
    }
    if (end >= src.length || end === start + 1) return false;
    if (!silent) {
      state.push(`${tag}_open`, tag, 1);
      const children = [];
      state.md.inline.parse(src.slice(start + 1, end), state.md, state.env, children);
      state.tokens.push(...children);
      state.push(`${tag}_close`, tag, -1);
    }
    state.pos = end + 1;
    return true;
  };
}

const DETAILS_OPEN = /^<details(\s+open)?>\s*$/i;
const DETAILS_SUMMARY = /^<summary>([^<>\n]+)<\/summary>\s*$/i;
const DETAILS_CLOSE = /^<\/details>\s*$/i;
// 속성이 없는 `<details>`와 글자만 있는 `<summary>`만 접힘 블록으로 받아들이고 나머지 HTML은 계속 글자로 둔다.
function detailsBlock(state, startLine, endLine, silent) {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const line = index => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);
  const opening = DETAILS_OPEN.exec(line(startLine));
  if (!opening) return false;
  let depth = 1;
  let fence = null;
  let close = startLine + 1;
  for (; close < endLine; close += 1) {
    const text = line(close);
    const indented = state.sCount[close] - state.blkIndent >= 4;
    const marker = indented ? undefined : /^(`{3,}|~{3,})/.exec(text)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length && text.slice(marker.length).trim() === '') fence = null;
      continue;
    }
    if (indented) continue;
    if (marker) fence = marker;
    else if (DETAILS_OPEN.test(text)) depth += 1;
    else if (DETAILS_CLOSE.test(text) && (depth -= 1) === 0) break;
  }
  if (close >= endLine) return false;
  if (silent) return true;
  const summary = DETAILS_SUMMARY.exec(line(startLine + 1));
  const open = state.push('details_open', 'details', 1);
  open.map = [startLine, close];
  if (opening[1]) open.attrSet('open', '');
  open.attrJoin('class', 'app-details');
  if (summary) {
    state.push('summary_open', 'summary', 1);
    const inline = state.push('inline', '', 0);
    inline.content = summary[1].trim();
    inline.children = [];
    state.push('summary_close', 'summary', -1);
  }
  const [oldMax, oldParent] = [state.lineMax, state.parentType];
  state.parentType = 'details';
  state.lineMax = close;
  state.md.block.tokenize(state, startLine + (summary ? 2 : 1), close);
  state.lineMax = oldMax;
  state.parentType = oldParent;
  state.push('details_close', 'details', -1);
  state.line = close + 1;
  return true;
}

// 수식은 빌드 때 KaTeX가 HTML과 MathML로 만든다. 믿을 수 없는 명령(\\href, \\includegraphics 등)은 실행하지 않고, 틀린 수식은 원문을 그대로 보여 준다.
const MATH_OPTIONS = Object.freeze({ katex, throwOnError: false, errorColor: 'inherit', strict: 'ignore', trust: false, output: 'htmlAndMathml' });

const CARD_VARIANTS = ['centered', 'grouped', 'inline', 'related'];
// 그림 입력(`src`, `alt`, `href`, `rounded`, `caption`, 폭)을 구성 요소 속성으로 옮긴다. ui:figure와 :::figure가 같이 쓴다.
export function figureOf(item) {
  return ui.Figure({ media: trusted(image(item.src, item.alt, item.rounded ? 'is-rounded' : '')), href: item.href, caption: item.caption ?? '', width: item.width, wide: item.wide, size: item.size });
}
// 카드 입력(`icon`: 스프라이트 이름, `content:이름`, false)을 구성 요소의 속성으로 옮긴다. 이어서 읽을 글(`related`) 카드는 콘텐츠 아이콘만 쓰고 설명은 그리지 않는다.
function cardSlot(item, parentVariant) {
  const variant = item.variant ?? parentVariant;
  if (variant && !CARD_VARIANTS.includes(variant)) throw new Error(`Unknown card variant: ${variant}`);
  const contentName = typeof item.icon === 'string' && item.icon.startsWith('content:') ? item.icon.slice(8) : undefined;
  const mark = variant === 'related' ? (contentName ? contentIcon(contentName, 'small') : '') : item.icon === false ? '' : icon(item.icon);
  return ui.Card({ href: item.href, title: item.title, description: item.description, icon: mark ? trusted(mark) : undefined, variant, compact: item.compact, horizontal: item.horizontal, headingLevel: item.headingLevel });
}
export function renderGallery(data, id) {
  const slides = Array.isArray(data.slides) ? data.slides.map(slide => ({ image: trusted(image(slide.src, slide.alt ?? slide.label)), caption: slide.caption, label: slide.label })) : data.slides;
  return String(ui.Gallery({ id, title: data.title, wide: data.wide, width: data.width, selected: data.selected, slides }));
}
const DIRECTIVE_KIT = Object.freeze({ escape, safeUrl, image, contentIcon, trusted, controlImage, card: cardSlot, figureOf, videoOf, asset, gallery: renderGallery, ui, assetExists: name => existsSync(new URL(`./assets/${name}`, import.meta.url)) });

function fenceOptions(info, token, env, attributes = CODE_ATTRIBUTES) {
  const source = info.replace(/^\S+\s*/, '');
  const fail = message => { throw new DirectiveError(message, { page: env.pageId, line: (token.map?.[0] ?? 0) + 1, name: 'code' }); };
  return parseOptions(source, attributes, fail);
}

export function createMarkdown() {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true }).use(footnote).use(deflist).use(mathPlugin.default ?? mathPlugin, MATH_OPTIONS).use(taskLists, { label: true });
  installDirectives(md, DIRECTIVE_KIT);
  md.inline.ruler.before('emphasis', 'highlight', markRule('::'));
  md.inline.ruler.before('emphasis', 'equals-highlight', markRule('=='));
  md.inline.ruler.before('emphasis', 'subscript', scriptRule('~', 'sub'));
  md.inline.ruler.before('emphasis', 'superscript', scriptRule('^', 'sup'));
  md.block.ruler.before('html_block', 'details', detailsBlock, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.core.ruler.after('github-task-lists', 'cancelled-task-lists', state => {
    for (let index = 2; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== 'inline' || state.tokens[index - 1].type !== 'paragraph_open' || state.tokens[index - 2].type !== 'list_item_open' || !token.content.startsWith('[~] ')) continue;
      state.tokens[index - 2].attrJoin('class', 'task-list-item is-cancelled');
      token.content = token.content.slice(4);
      token.children[0].content = token.children[0].content.slice(4);
      const marker = new state.Token('html_inline', '', 0);
      marker.content = `${ui.CancelledTask()} `;
      token.children.unshift(marker);
    }
  });
  const defaultImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index];
    token.attrSet('loading', 'lazy');
    token.attrSet('decoding', 'async');
    const src = token.attrGet('src');
    const size = src?.startsWith('/assets/') ? IMAGE_SIZES[src.split('/').at(-1)] : undefined;
    if (size) { token.attrSet('width', size[0]); token.attrSet('height', size[1]); }
    return defaultImage(tokens, index, options, env, self);
  };
  md.renderer.rules.table_open = () => ui.Table.open();
  md.renderer.rules.table_close = () => ui.Table.close();
  for (const tag of ['th_open', 'td_open']) md.renderer.rules[tag] = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const alignment = token.attrGet('style');
    if (alignment) { token.attrs = token.attrs.filter(([key]) => key !== 'style'); token.attrSet('class', `is-${alignment.split(':')[1]}`); }
    return self.renderToken(tokens, index, options);
  };
  md.renderer.rules.code_block = (tokens, index) => codeBlock(`<code class="language-plaintext">${escape(tokens[index].content)}</code>`, { language: codeLanguage().label });
  md.renderer.rules.fence = (tokens, index, options, env) => {
    const token = tokens[index];
    const kind = token.info.trim();
    if (/^dap(?:\s|$)/.test(kind)) {
      const diagramOptions = fenceOptions(kind, token, env, DIAGRAM_ATTRIBUTES);
      env.diagramSources?.set(token.content, env.pageId);
      const diagram = env.diagrams?.get(token.content);
      if (diagram) return String(ui.DiagramEmbed({ ...diagram, ...diagramOptions }));
    }
    if (kind.startsWith('ui:')) {
      const data = parse(token.content, { maxAliasCount: 0 });
      if (!data || typeof data !== 'object') throw new Error(`Invalid ${kind} data`);
      const html = component(kind.slice(3), data, md, env);
      if (!env.showSyntax) return html;
      return html + `<details class="app-source-example"><summary>작성 문법 보기: ${escape(kind)}</summary>${codeBlock(`<code>${escape('```' + kind + '\n' + token.content + '```')}</code>`, { label: '작성 문법 복사', language: 'Markdown' })}</details>`;
    }
    const { id, label } = codeLanguage(kind);
    const codeOptions = fenceOptions(kind, token, env);
    const value = highlightCode(token.content, id);
    return codeBlock(`<code class="language-${id}">${value}</code>`, { language: label, ...codeOptions });
  };
  // 문서 최상위에서 이미지 하나(또는 링크로 감싼 이미지 하나)만 있는 문단은 원본 글처럼 figure로 그린다.
  md.core.ruler.after('inline', 'standalone-figure', (state) => {
    if (state.env.nested) return;
    const { tokens } = state;
    for (let index = 0; index + 2 < tokens.length; index += 1) {
      const [open, inline, close] = [tokens[index], tokens[index + 1], tokens[index + 2]];
      if (open.type !== 'paragraph_open' || open.level !== 0 || open.hidden || inline.type !== 'inline' || close.type !== 'paragraph_close') continue;
      const kinds = inline.children.map(child => child.type).join();
      if (kinds !== 'image' && kinds !== 'link_open,image,link_close') continue;
      open.tag = close.tag = 'figure';
      open.attrJoin('class', ui.FIGURE_CLASS);
    }
  });
  md.core.ruler.push('heading-ids', (state) => {
    state.env.headings ??= [];
    state.env.headingIds ??= new Map();
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== 'heading_open') continue;
      const title = state.tokens[index + 1].content;
      const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
      // 다른 제목의 `제목-2` 같은 글자와 겹치지 않도록 예약된 ID는 건너뛴다.
      let count = state.env.headingIds.get(slug) ?? 0;
      let localId;
      do localId = ++count === 1 ? slug : `${slug}-${count}`; while (state.env.headingIds.has(`#${localId}`));
      state.env.headingIds.set(slug, count);
      state.env.headingIds.set(`#${localId}`, 1);
      const id = state.env.pageId ? `${state.env.pageId}-${localId}` : localId;
      token.attrSet('id', id);
      token.attrJoin('class', `app-heading-${token.tag.slice(1)}`);
      state.env.headings.push({ id, title, level: Number(token.tag.slice(1)) });
    }
  });
  return md;
}

function component(kind, data, md, env) {
  env.componentCount = (env.componentCount ?? 0) + 1;
  const id = `component-${env.pageId ?? 'page'}-${env.componentCount}`;
  let nestedIndex = 0;
  const render = (text = '') => {
    const nested = { ...env, docId: `${id}-${++nestedIndex}`, nested: true };
    delete nested.footnotes;
    const html = md.render(String(text), nested);
    env.componentCount = nested.componentCount;
    return html;
  };
  const nestedEnv = () => {
    const nested = { ...env, docId: `${id}-${++nestedIndex}`, nested: true };
    delete nested.footnotes;
    return nested;
  };
  switch (kind) {
    case 'group':
      return String(ui.ContentGroup({ title: data.title, body: trusted(render(data.body)) }));
    case 'feature':
      return String(ui.FeatureSection({ tone: data.tone, split: data.split, heading: ui.SectionIntro({ icon: data.icon ? trusted(image(data.icon, '')) : undefined, title: data.title, description: trusted(`<p>${escape(data.description)}</p>`), action: data.href ? { href: data.href, label: data.link } : undefined }), body: trusted(render(data.body)), descriptions: data.left || data.right ? [{ title: data.leftTitle, body: data.left }, { title: data.rightTitle, body: data.right }] : [] }));
    case 'syntax-examples':
      return String(ui.SyntaxExamples({ items: data.items.map(item => ({ ...item, body: trusted(render(item.body)) })) }));
    case 'feature-list':
      return String(ui.FeatureList({ items: data.items.map(item => ({ ...item, body: trusted(render(item.body)) })) }));
    case 'device':
      return `${ui.Device({ screen: trusted(data.video ? player(data, id) : image(data.src, data.title ?? '기기 화면')), overlay: trusted(image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')), label: data.title ?? 'iPhone 화면' })}${data.video ? ui.MediaControls({ remote: trusted(remote(id)) }) : ''}`;
    case 'demos':
      return String(ui.FeatureDemos({ items: data.items.map(item => ({ title: item.title, body: trusted(render(item.body)), action: data.singleControl ? undefined : trusted(remote(id, item.src)) })), media: trusted(`${ui.Device({ screen: trusted(player({ ...data, src: data.src ?? data.items[0].src }, id)), overlay: trusted(image('bezel-iphone6-overlay.svg', '', 'app-device-overlay')), figure: true })}${data.singleControl ? ui.MediaControls({ remote: trusted(remote(id)) }) : ''}`), after: data.after ? trusted(render(data.after)) : undefined }));
    case 'feature-pair':
      return String(ui.FeatureDemos({ items: data.items.map(item => ({ ...item, body: trusted(render(item.body)) })), media: trusted(render(data.media)), mediaFirst: data.mediaFirst }));
    case 'callout':
      return String(ui.Callout({ title: data.title ?? 'Note', tone: data.tone, fineprint: data.fineprint, body: trusted(render(data.body)) }));
    case 'details':
      return String(ui.Details({ title: data.title, open: data.open, body: trusted(render(data.body)) }));
    case 'figure':
      return String(figureOf(data));
    case 'fineprint':
      return String(ui.Fineprint({ text: trusted(md.renderInline(String(data.body ?? ''), nestedEnv())) }));
    case 'figure-grid': {
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('ui:figure-grid needs items');
      return String(ui.FigureGrid({ columns: data.columns, size: data.size, figures: data.items.map(item => figureOf(item)) }));
    }
    case 'video':
      return videoOf({ src: data.src, poster: data.poster, title: data.title, caption: data.caption, playerWidth: data.width, playerHeight: data.height, playerWide: data.wide }, id);
    case 'gallery': return renderGallery(data, id);
    case 'platform':
    case 'tabs': {
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('Tabs require items');
      return String(ui.Tabs({ id, label: data.title ?? '기기별 안내', platform: kind === 'platform', ...(kind === 'platform' ? {} : { position: 'top', selector: 'segmented' }), tabs: data.items.map(item => ({ label: item.label, body: trusted(render(item.body)) })) }));
    }
    case 'cards': {
      if (data.variant && !CARD_VARIANTS.includes(data.variant)) throw new Error(`Unknown card variant: ${data.variant}`);
      return String(ui.CardGroup({ variant: data.variant, columns: data.columns, split: data.split, cards: data.items.map(item => cardSlot({ horizontal: data.horizontal, ...item }, data.variant)) }));
    }
    case 'definitions':
      return String(ui.Definitions({ items: data.items.map(item => ({ term: item.term, body: trusted(render(item.body)) })) }));
    case 'speech':
      return String(ui.Speech({ text: data.body }));
    case 'keys':
      return String(ui.Shortcut({ label: data.label, keys: data.keys }));
    case 'tooltip': return String(ui.TooltipBlock({ id: `${id}-tip`, label: data.label, body: trusted(render(data.description)) }));
    case 'keyboard':
      return String(ui.Keyboard({ id, image: trusted(image('keycommand-keyboard-io40.png', '키보드')), label: '키보드 언어', helpLabel: '도움말', help: trusted(render(data.help)), languages: data.languages, groups: data.groups.map(group => ({ ...group, rows: group.rows.map(row => ({ ...row, label: trusted(render(row.label)), note: row.note ? trusted(render(row.note)) : undefined })) })) }));
    case 'status-board':
      return String(ui.StatusBoard({ ...data, id, historyLabel: data.historyLabel ?? '지난 기록', title: data.title ?? '업데이트', items: data.items.map(item => ({ ...item, body: trusted(render(item.body)) })) }));
    case 'contact-form':
      return String(ui.ContactForm({ ...data, id, labels: { subject: '제목', message: '내용', kind: '문의 종류', email: '이메일', product: '관련 항목', privacy: '개인정보', verification: '입력 확인', verify: '검토용 입력 확인', submit: '보내기', ...data.labels } }));
    case 'form':
      return String(ui.DemoForm({ ...data, id, label: data.label ?? '구독', notice: '입력 동작 예시입니다. 내용은 전송·저장되지 않습니다.', emailLabel: '이메일', messageLabel: '내용' }));
    default: throw new Error(`Unknown document component: ${kind}`);
  }
}
