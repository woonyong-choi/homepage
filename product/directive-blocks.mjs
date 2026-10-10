// 디렉티브 블록과 인라인 표기의 정의. 각 항목이 허용 속성, 놓을 수 있는 자리, 본문 규칙, 출력을 정한다.
// 출력 HTML은 기존 `ui:` 구성 요소가 쓰는 클래스를 그대로 쓴다.
import { TAB_ATTRIBUTES, WIDTH_OPTION } from './directive-syntax.mjs';

const PLACES = ['root', 'tab'];

const checkWidth = (attrs, { ui }) => ui.contentWidth(attrs);

// 옛 `::::tabs`+`:::tab[이름]` 형식은 선택 줄이 위에 오는 분할 모양이다. 새 `@tab` 형식은 meta.options(없으면 테마 기본값)를 쓴다.
const LEGACY_TABS = Object.freeze({ position: 'top', selector: 'segmented' });

const tabOptions = (meta, platform) => meta.options ?? { ...(platform ? {} : LEGACY_TABS), ...meta.attrs };

function tabSet(platform) {
  return {
    label: 'optional',
    attrs: TAB_ATTRIBUTES,
    within: ['root'],
    body: { only: ['directive:tab'], min: 1 },
    prepare(meta, children, { fail, nextId }) {
      meta.id = nextId();
      const seen = new Set();
      children.forEach((child, index) => {
        const key = child.meta.label.toLowerCase();
        if (seen.has(key)) fail(`탭 이름이 겹칩니다: ${child.meta.label}`, child.map?.[0] + 1);
        seen.add(key);
        Object.assign(child.meta, { group: meta.id, index });
      });
      meta.tabs = children.map(child => child.meta.label);
    },
    open: (meta, { ui }) => ui.Tabs.open({ id: meta.id, label: meta.label, platform, labels: meta.tabs, ...tabOptions(meta, platform) }),
    close: (meta, { ui }) => ui.Tabs.close({ id: meta.id, label: meta.label, platform, labels: meta.tabs, ...tabOptions(meta, platform) }),
  };
}

const callout = (tone, title) => ({
  label: 'optional',
  attrs: {},
  within: PLACES,
  body: { min: 1, except: ['directive'] },
  open: (meta, { ui }) => ui.Callout.open({ title: meta.label ?? title, tone }),
  close: (meta, { ui }) => ui.Callout.close(),
});

const LIST = ['bullet_list', 'ordered_list'];

export const BLOCKS = Object.freeze({
  __proto__: null,
  tabs: tabSet(false),
  platform: tabSet(true),
  tab: {
    label: 'required',
    attrs: {},
    within: ['tabs', 'platform'],
    body: { min: 1 },
    open: (meta, { ui }) => ui.Tabs.panelOpen({ id: meta.group, index: meta.index }),
    close: (meta, { ui }) => ui.Tabs.panelClose(),
  },
  note: callout('', '참고'),
  warning: callout('warning', '주의'),
  fineprint: {
    label: 'none',
    attrs: {},
    within: PLACES,
    body: { only: ['paragraph'], min: 1 },
    prepare: (meta, children, { ui }) => children.forEach(child => child.attrJoin('class', ui.FINEPRINT_CLASS)),
    open: () => '',
    close: () => '',
  },
  steps: {
    label: 'none',
    attrs: {},
    within: PLACES,
    body: { only: LIST, min: 1 },
    open: (meta, { ui }) => ui.Steps.open(),
    close: (meta, { ui }) => ui.Steps.close(),
  },
  qa: {
    label: 'none',
    attrs: {},
    within: PLACES,
    body: { only: ['dl'], min: 1 },
    prepare: (meta, children, { ui }) => children.forEach(child => child.attrJoin('class', ui.DEFINITIONS_CLASS)),
    open: () => '',
    close: () => '',
  },
  cards: {
    label: 'none',
    attrs: { variant: { type: 'enum', values: ['centered', 'grouped', 'inline', 'related'] }, columns: { type: 'enum', values: ['1', '2'] } },
    within: PLACES,
    body: { only: ['directive:card'], min: 1 },
    prepare: (meta, children) => children.forEach(child => { child.meta.variant = meta.attrs.variant; }),
    open: (meta, { ui }) => ui.CardGroup.open({ variant: meta.attrs.variant, columns: meta.attrs.columns }),
    close: (meta, { ui }) => ui.CardGroup.close(),
  },
  card: {
    leaf: true,
    label: 'none',
    attrs: { title: { type: 'text', required: true }, href: { type: 'url', required: true }, description: { type: 'text' }, icon: { type: 'icon' } },
    within: ['cards'],
    render: (meta, { card, ui }) => `${card({ ...meta.attrs, icon: meta.attrs.icon ? `content:${meta.attrs.icon}` : false }, meta.variant)}${ui.CardGroup.gap(meta.variant)}`,
  },
  gallery: {
    label: 'none',
    attrs: { title: { type: 'text' }, width: WIDTH_OPTION, wide: { type: 'bool' } },
    check: checkWidth,
    within: PLACES,
    body: { only: ['directive:slide'], min: 1 },
    prepare(meta, children, { nextId }) {
      meta.id = nextId();
      meta.slides = children.map(child => ({ src: child.meta.attrs.src, alt: child.meta.attrs.alt, caption: child.meta.attrs.caption }));
    },
    open: ({ id, slides, attrs }, { gallery }) => gallery({ title: attrs.title, wide: attrs.wide, width: attrs.width, slides }, id),
    close: () => '',
  },
  slide: {
    leaf: true,
    label: 'none',
    attrs: { src: { type: 'asset', required: true }, alt: { type: 'text', required: true }, caption: { type: 'text' } },
    within: ['gallery'],
    render: () => '',
  },
  figure: {
    leaf: true,
    label: 'none',
    attrs: { src: { type: 'asset', required: true }, alt: { type: 'text', required: true }, caption: { type: 'text' }, href: { type: 'url' }, rounded: { type: 'bool' }, width: WIDTH_OPTION, size: { type: 'enum', values: ['compact'] }, wide: { type: 'bool' } },
    within: PLACES,
    check: checkWidth,
    render: ({ attrs }, { figureOf }) => String(figureOf(attrs)),
  },
  video: {
    leaf: true,
    label: 'none',
    attrs: { src: { type: 'asset', required: true }, poster: { type: 'asset', required: true }, alt: { type: 'text', required: true }, caption: { type: 'text' }, controls: { type: 'bool' }, frame: { type: 'enum', values: ['none', 'iphone'] }, width: WIDTH_OPTION, wide: { type: 'bool' } },
    within: PLACES,
    check(attrs, kit) {
      checkWidth(attrs, kit);
      if (attrs.controls === false) throw new Error('본문 영상의 재생 조작은 숨길 수 없습니다. controls 옵션을 생략하세요');
    },
    render: ({ attrs }, { videoOf, nextId }) => videoOf({ ...attrs, title: attrs.alt }, nextId()),
  },
});

// 한 줄 안에서 쓰는 `:이름[글]{속성}`. kbd와 menu는 기존 표기를 그대로 둔다.
export const INLINES = Object.freeze({
  __proto__: null,
  kbd: { attrs: {}, render: (label, attrs, { ui }) => String(ui.Kbd({ text: label })) },
  menu: { attrs: {}, render: (label, attrs, { ui }) => String(ui.Menu({ text: label })) },
  icon: { attrs: {}, label: 'icon', render: (label, attrs, { ui, trusted, contentIcon }) => String(ui.InlineIcon({ icon: trusted(contentIcon(label, 'small')) })) },
  tip: {
    attrs: { text: { type: 'text', required: true } },
    render: (label, attrs, { ui, nextId }) => String(ui.Tooltip({ id: `${nextId()}-tip`, label, text: attrs.text })),
  },
});
