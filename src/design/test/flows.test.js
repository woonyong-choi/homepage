import test from 'node:test';
import assert from 'node:assert/strict';

let importCount = 0;

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(name, listener) {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    },
    dispatch(name, event = {}) {
      for (const listener of listeners.get(name) ?? []) listener(event);
    },
  };
}

function flowRow({ width = 300, groupWidth = 300, count = 3, gap = 16, reverse = false, padding = 1, border = 0 } = {}) {
  const classes = new Set();
  const viewport = {
    ...eventTarget(), width, scrollLeft: 0,
    style: { paddingLeft: `${padding}px`, paddingRight: `${padding}px`, borderLeftWidth: `${border}px`, borderRightWidth: `${border}px` },
    classList: { contains: name => classes.has(name), toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
    getBoundingClientRect() { return { width: this.width }; },
    querySelector: () => null,
    matches: () => false,
  };
  const clones = [];
  const group = {
    width: groupWidth, children: Array.from({ length: count }, () => ({})),
    getBoundingClientRect() { return { width: this.width }; },
    querySelector: () => null,
    cloneNode() {
      const link = { tabIndex: 0 };
      return {
        attributes: new Map([['data-flow-group', '']]), link,
        removeAttribute(name) { this.attributes.delete(name); },
        setAttribute(name, value) { this.attributes.set(name, value); },
        querySelectorAll: () => [link],
        remove() { clones.splice(clones.indexOf(this), 1); },
      };
    },
  };
  const animations = [];
  const track = {
    style: { columnGap: `${gap}px` },
    append: clone => clones.push(clone),
    animate(keyframes, options) {
      const animation = {
        keyframes, options, currentTime: 0, playState: 'running',
        effect: { getComputedTiming: () => ({ progress: (animation.currentTime / options.duration) % 1 }) },
        pause() { this.playState = 'paused'; },
        play() { this.playState = 'running'; },
        cancel() { this.playState = 'idle'; },
      };
      animations.push(animation);
      return animation;
    },
  };
  const rail = {
    dataset: { flowDirection: reverse ? 'right' : 'left' },
    hasAttribute: () => false,
    closest: () => null,
    querySelector: selector => ({ '[data-flow-viewport]': viewport, '[data-flow-track]': track, '[data-flow-group]': group })[selector],
  };
  return { rail, viewport, group, track, clones, animations };
}

async function loadFlows(t, rows, { shared = false, reduced = false } = {}) {
  const names = ['document', 'window', 'matchMedia', 'getComputedStyle', 'ResizeObserver', 'IntersectionObserver'];
  const previous = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  const scope = { ...eventTarget(), hasAttribute: () => true, querySelector: () => null, matches: () => false };
  if (shared) for (const row of rows) row.rail.closest = () => scope;
  const document = { ...eventTarget(), hidden: false, querySelectorAll: () => rows.map(row => row.rail) };
  const window = eventTarget();
  const media = { ...eventTarget(), matches: reduced };
  const resizes = [];
  const intersections = [];
  Object.assign(globalThis, {
    document, window, matchMedia: () => media,
    getComputedStyle: element => ({ ...element.style, getPropertyValue: () => '10s' }),
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.observed = []; resizes.push(this); }
      observe(element) { this.observed.push(element); }
    },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; intersections.push(this); }
      observe(element) { this.element = element; }
    },
  });
  await import(`../ui/runtime/flows.js?test=${++importCount}`);
  const resize = () => resizes.forEach(observer => observer.callback());
  const visible = value => intersections.forEach(observer => observer.callback([{ target: observer.element, isIntersecting: value }]));
  resize();
  visible(true);
  return { resize, visible, resizes, media, document, window, area: shared ? scope : rows[0].viewport };
}

function assertStationary(row) {
  assert.equal(row.viewport.classList.contains('has-flow'), false);
  assert.equal(row.clones.length, 0);
  assert.equal(row.viewport.scrollLeft, 0);
  assert.equal(row.animations.filter(animation => animation.playState !== 'idle').length, 0);
}

test('flowRail_fractional_content_box_only_flows_when_original_exceeds_available_width', async t => {
  const rows = [199.5, 200, 200.25].map(groupWidth => flowRow({ width: 204.5, groupWidth, padding: 1.5, border: 0.75 }));
  await loadFlows(t, rows);

  assertStationary(rows[0]);
  assertStationary(rows[1]);
  const overflowing = rows[2];
  assert.equal(overflowing.viewport.classList.contains('has-flow'), true);
  assert.equal(overflowing.clones.length, 1);
  assert.equal(overflowing.animations[0].keyframes[1].transform, 'translate3d(-216.25px, 0, 0)');
  assert.equal(overflowing.animations[0].playState, 'running');
  assert.equal(overflowing.clones[0].attributes.has('data-flow-group'), false);
  assert.equal(overflowing.clones[0].attributes.get('aria-hidden'), 'true');
  assert.equal(overflowing.clones[0].link.tabIndex, -1);
});

test('flowRail_resize_and_content_shrink_remove_flow_and_restart_when_overflow_returns', async t => {
  const row = flowRow({ width: 202, groupWidth: 260 });
  const runtime = await loadFlows(t, [row]);
  assert.deepEqual(runtime.resizes[0].observed, [row.viewport, row.group]);
  row.animations[0].currentTime = 5000;

  row.viewport.width = 262;
  runtime.resize();
  assertStationary(row);
  assert.equal(row.animations[0].playState, 'idle');

  row.viewport.width = 202;
  runtime.resize();
  assert.equal(row.animations.at(-1).playState, 'running');
  assert.equal(row.clones.length, 1);
  row.animations.at(-1).currentTime = 6000;
  row.group.width = 199.75;
  runtime.resize();
  assertStationary(row);
});

test('flowRail_single_overflowing_item_repeats_and_fitting_shared_row_stays_stationary', async t => {
  const rows = [
    flowRow({ width: 202, groupWidth: 250, count: 1 }),
    flowRow({ width: 202, groupWidth: 400, reverse: true }),
    flowRow({ width: 202, groupWidth: 200 }),
  ];
  const runtime = await loadFlows(t, rows, { shared: true });
  const [first, second] = rows.map(row => row.animations[0]);

  assert.equal(rows[0].clones.length, 1);
  assert.equal(266 / first.options.duration, 416 / second.options.duration);
  assert.equal(second.options.direction, 'reverse');
  assertStationary(rows[2]);

  rows[1].group.width = 200;
  runtime.resize();
  assertStationary(rows[1]);
  assertStationary(rows[2]);
  assert.equal(rows[0].animations.at(-1).options.duration, 20000);
});

test('flowRail_reduced_motion_hands_off_to_scroll_and_respects_page_lifecycle_on_resume', async t => {
  const row = flowRow({ width: 202, groupWidth: 250 });
  const runtime = await loadFlows(t, [row], { reduced: true });
  assert.equal(row.animations.length, 0);
  assert.equal(row.clones.length, 1);

  runtime.media.matches = false;
  runtime.media.dispatch('change');
  const animation = row.animations[0];
  animation.currentTime = 5000;
  runtime.media.matches = true;
  runtime.media.dispatch('change');
  assert.equal(animation.playState, 'idle');
  assert.equal(row.viewport.scrollLeft, 66.5);

  runtime.media.matches = false;
  runtime.media.dispatch('change');
  const resumed = row.animations.at(-1);
  assert.equal(resumed.currentTime, 5000);
  runtime.document.hidden = true;
  runtime.document.dispatch('visibilitychange');
  assert.equal(resumed.playState, 'paused');
  runtime.document.hidden = false;
  runtime.document.dispatch('visibilitychange');
  assert.equal(resumed.playState, 'running');
  runtime.window.dispatch('pagehide');
  assert.equal(resumed.playState, 'paused');
  runtime.window.dispatch('pageshow');
  assert.equal(resumed.playState, 'running');
});

test('flowRail_manual_and_focus_handoffs_preserve_position_and_unchanged_resize_reuses_animation', async t => {
  const row = flowRow({ width: 202, groupWidth: 250 });
  const runtime = await loadFlows(t, [row]);
  const original = row.animations[0];
  original.currentTime = 5000;
  runtime.resize();
  assert.equal(row.animations.length, 1);

  runtime.area.dispatch('wheel', { deltaX: 10 });
  assert.equal(original.playState, 'idle');
  assert.equal(row.viewport.scrollLeft, 66.5);
  runtime.area.dispatch('pointerleave', { pointerType: 'mouse' });
  assert.equal(row.animations.at(-1).playState, 'running');
  assert.equal(row.animations.at(-1).currentTime, 5000);

  row.viewport.matches = () => true;
  runtime.area.dispatch('focusin');
  assert.equal(row.animations.at(-1).playState, 'idle');
  assert.equal(row.viewport.scrollLeft, 66.5);
  row.viewport.matches = () => false;
  runtime.area.dispatch('focusout');
  await Promise.resolve();
  assert.equal(row.animations.at(-1).playState, 'running');

  runtime.area.dispatch('pointerdown', { pointerType: 'touch' });
  assert.equal(row.animations.at(-1).playState, 'idle');
  runtime.visible(false);
  assert.equal(row.animations.at(-1).playState, 'paused');
  runtime.visible(true);
  assert.equal(row.animations.at(-1).playState, 'running');
});
