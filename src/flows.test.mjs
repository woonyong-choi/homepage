import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

function run(cards, directions = [], shared = true) {
  let now = 0;
  const listeners = {}; const visibility = []; const resize = [];
  const motion = { matches: false, addEventListener: (_, fn) => { motion.change = fn; } };
  const element = (props = {}) => ({ children: [], classList: { toggle() {} }, addEventListener() {}, querySelector: () => null, matches: () => false, hasAttribute: () => false, ...props });
  const scope = element({ hasAttribute: () => shared, addEventListener: (type, fn) => { listeners[type] = fn; } });
  function animation(options) {
    let elapsed = 0; let started = now;
    const handle = {
      options, playState: 'running',
      get currentTime() { return elapsed + (this.playState === 'running' ? now - started : 0); },
      set currentTime(value) { elapsed = value; started = now; },
      pause() { elapsed = this.currentTime; this.playState = 'paused'; },
      play() { if (this.playState !== 'running') { started = now; this.playState = 'running'; } },
      cancel() { this.playState = 'idle'; },
      effect: { getComputedTiming() {
        const progress = (handle.currentTime % options.duration) / options.duration;
        return { progress: options.direction === 'reverse' ? 1 - progress : progress };
      } },
    };
    return handle;
  }
  const rows = cards.map((count, index) => {
    const row = { width: count * 100, animations: [] };
    const group = element({ children: Array(count).fill(0), getBoundingClientRect: () => ({ width: row.width }), cloneNode: () => element({ removeAttribute() {}, setAttribute() {}, querySelectorAll: () => [], remove() {} }) });
    const track = element({ append() {}, animate: (keys, options) => {
      row.keys = keys; const handle = animation(options); row.animations.push(handle); return handle;
    } });
    const viewport = element({ clientWidth: 450, scrollLeft: 0, addEventListener: scope.addEventListener });
    const rail = element({ dataset: directions[index] ? { flowDirection: directions[index] } : {}, closest: () => scope, querySelector: selector => ({ '[data-flow-viewport]': viewport, '[data-flow-track]': track, '[data-flow-group]': group })[selector] });
    return Object.assign(row, { rail, viewport, group, track });
  });
  const document = { querySelectorAll: () => rows.map(row => row.rail), addEventListener: (type, fn) => { listeners[type] = fn; }, hidden: false };
  runInNewContext(readFileSync(new URL('./vendor/theme/ui/runtime/flows.js', import.meta.url), 'utf8'), {
    document, matchMedia: () => motion, window: { addEventListener: (type, fn) => { listeners[type] = fn; } },
    getComputedStyle: () => ({ getPropertyValue: () => '1000ms', columnGap: '0' }), // tokens-allow: 실제 화면과 독립적으로 이동 속도를 계산하는 테스트 시간
    ResizeObserver: class { constructor(fn) { resize.push(fn); } observe() {} },
    IntersectionObserver: class { constructor(fn) { visibility.push(fn); } observe() {} },
    queueMicrotask: fn => fn(),
  });
  resize.forEach(fn => fn());
  visibility.forEach(fn => fn([{ isIntersecting: true }]));
  const offset = row => {
    const live = row.animations.findLast(item => item.playState !== 'idle');
    return live ? live.effect.getComputedTiming().progress * row.width : row.viewport.scrollLeft;
  };
  return { rows, scope, listeners, motion, document, resize: () => resize.forEach(fn => fn()), visibility, offset, advance: ms => { now += ms; } };
}

const near = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-8, `${value} ≠ ${expected}`);

test('flows_use_fractional_transforms_and_equal_pixel_speed_for_unequal_rows', () => {
  for (const cards of [[1, 1], [2, 1], [3, 2]]) {
    const state = run(cards);
    state.advance(16.67);
    const step = Math.max(...cards) * 100 * 16.67 / 2000;
    state.rows.forEach(row => {
      near(state.offset(row), step);
      assert.equal(row.viewport.scrollLeft, 0, '자동 이동 중 스크롤 위치를 매 프레임 바꾸지 않는다');
      assert.equal(row.animations.at(-1).options.easing, 'linear');
    });
  }
});

test('reverse_flow_has_equal_speed_and_both_rows_join_the_next_cycle_without_a_gap', () => {
  const state = run([3, 2], [undefined, 'right']);
  state.advance(100);
  near(state.offset(state.rows[0]), 15);
  near(state.offset(state.rows[1]), 185);
  state.advance(1900);
  near(state.offset(state.rows[0]), 0);
  near(state.offset(state.rows[1]), 100);
});

test('hover_keeps_each_flow_running_without_restarting_its_animation', () => {
  for (const state of [run([10], ['right'], false), run([3, 2], [undefined, 'right'])]) {
    state.advance(100);
    const animations = state.rows.map(row => row.animations.at(-1));
    const positions = state.rows.map(state.offset);
    state.listeners.pointerenter?.({ pointerType: 'mouse' });
    state.advance(300);
    const step = Math.max(...state.rows.map(row => row.width)) * 300 / 2000;
    state.rows.forEach((row, index) => {
      near(state.offset(row), positions[index] + (row.rail.dataset.flowDirection === 'right' ? -step : step));
      assert.equal(row.animations.at(-1), animations[index]);
      assert.equal(animations[index].playState, 'running');
    });
    state.listeners.pointerleave({ pointerType: 'mouse' });
    state.rows.forEach((row, index) => assert.equal(row.animations.at(-1), animations[index]));
  }
});

test('horizontal_scrolling_pauses_both_rows_and_resumes_from_the_reading_position', () => {
  const state = run([3, 2]);
  state.advance(100);
  state.listeners.wheel({ deltaX: 40 });
  state.advance(300);
  state.rows.forEach(row => near(state.offset(row), 15));
  state.rows[0].viewport.scrollLeft = 65;
  state.listeners.pointerleave({ pointerType: 'mouse' });
  state.advance(100);
  near(state.offset(state.rows[0]), 80);
  near(state.offset(state.rows[1]), 30);
});

test('keyboard_focus_pauses_both_rows_until_focus_leaves_the_region', () => {
  const state = run([3, 2]);
  state.advance(100);
  state.scope.querySelector = () => ({});
  state.listeners.focusin(); state.advance(300);
  state.rows.forEach(row => near(state.offset(row), 15));
  state.scope.querySelector = () => null;
  state.listeners.focusout(); state.advance(100);
  state.rows.forEach(row => near(state.offset(row), 30));
});

test('reduced_motion_visibility_and_page_lifecycle_pause_without_catching_up', () => {
  const state = run([3, 2]);
  state.advance(100);
  state.document.hidden = true; state.listeners.visibilitychange(); state.advance(1000);
  near(state.offset(state.rows[0]), 15);
  state.document.hidden = false; state.listeners.visibilitychange(); state.advance(100);
  near(state.offset(state.rows[0]), 30);
  state.listeners.pagehide(); state.advance(1000); near(state.offset(state.rows[0]), 30);
  state.listeners.pageshow(); state.advance(100); near(state.offset(state.rows[0]), 45);
  state.motion.matches = true; state.motion.change(); state.advance(1000);
  near(state.rows[0].viewport.scrollLeft, 45);
  assert.equal(state.rows[0].animations.at(-1).playState, 'idle');
});

test('resize_preserves_progress_and_touch_navigation_stays_paused_until_the_rail_leaves_view', () => {
  const state = run([3, 2]);
  state.advance(500);
  state.rows[0].width = 600; state.rows[1].width = 400; state.resize();
  near(state.offset(state.rows[0]), 150);
  state.listeners.pointerdown({ pointerType: 'touch' }); state.advance(500);
  near(state.offset(state.rows[0]), 150);
  state.visibility.forEach(fn => fn([{ isIntersecting: false }])); state.advance(500);
  near(state.offset(state.rows[0]), 150);
  state.visibility.forEach(fn => fn([{ isIntersecting: true }])); state.advance(100);
  near(state.offset(state.rows[0]), 180);
});

test('a_single_unshared_card_stays_static', () => {
  const state = run([1], [], false);
  state.advance(1000);
  assert.equal(state.rows[0].animations.length, 0);
});
