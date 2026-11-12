import { attemptComponent } from './call.js';

export const CALLOUT_TITLE = '참고';

const CALLOUTS = Object.freeze({
  note: { title: CALLOUT_TITLE },
  warning: { tone: 'warning', title: '주의' },
});

const BLOCKS = Object.freeze({
  __proto__: null,
  note: {
    open: (meta, call) => call('callout', 'open', calloutProps(meta)),
    close: (meta, call) => call('callout', 'close', {}),
  },
  warning: {
    open: (meta, call) => call('callout', 'open', calloutProps(meta)),
    close: (meta, call) => call('callout', 'close', {}),
  },
  fineprint: { open: () => '', close: () => '' },
  steps: {
    open: (meta, call) => call('steps', 'open', {}),
    close: (meta, call) => call('steps', 'close', {}),
  },
  qa: { open: () => '', close: () => '' },
  cards: {
    open: (meta, call) =>
      call('cards', 'open', { variant: meta.attrs.variant, columns: meta.attrs.columns }),
    close: (meta, call) => call('cards', 'close', { variant: meta.attrs.variant }),
  },
  card: {
    render: (meta, call) =>
      call('card', undefined, {
        ...meta.attrs,
        icon: meta.attrs.icon ? `content:${meta.attrs.icon}` : false,
        variant: meta.variant,
      }) + call('cards', 'gap', { variant: meta.variant }),
  },
  gallery: {
    open: (meta, call) =>
      call('gallery', undefined, {
        id: meta.id,
        title: meta.attrs.title,
        width: meta.attrs.width,
        slides: meta.slides,
      }),
    close: () => '',
  },
  slide: { render: () => '' },
  figure: { render: (meta, call) => call('figure', undefined, meta.attrs) },
  video: {
    render: (meta, call) =>
      call('video', undefined, { ...meta.attrs, title: meta.attrs.alt, id: meta.id }),
  },
});

const INLINES = Object.freeze({
  __proto__: null,
  kbd: (meta, call) => call('kbd', undefined, { label: meta.label }),
  menu: (meta, call) => call('menu', undefined, { label: meta.label }),
  icon: (meta, call) => call('icon', undefined, { label: meta.label }),
  tip: (meta, call) =>
    call('tip', undefined, { label: meta.label, text: meta.attrs.text, id: meta.id }),
});

function calloutProps(meta) {
  const callout = CALLOUTS[meta.name];
  return { title: meta.label ?? callout.title, tone: callout.tone };
}

function callerOf(render, line) {
  const state = { failed: false };
  const call = (name, method, props) => {
    const result = attemptComponent(render, name, method, props, line);
    state.failed ||= result.failed;
    return result.html;
  };
  return { call, state };
}

export function renderDirective(render, token, line) {
  const { meta } = token;
  const { call, state } = callerOf(render, line);
  if (token.type === 'directive_close') {
    return render.failedOpens.has(meta) ? '' : BLOCKS[meta.name].close(meta, call);
  }
  const output = BLOCKS[meta.name][token.type === 'directive_open' ? 'open' : 'render'](meta, call);
  if (token.type === 'directive_open' && state.failed) render.failedOpens.add(meta);
  return output;
}

export function renderInlineDirective(render, token, line) {
  return INLINES[token.meta.name](token.meta, callerOf(render, line).call);
}
