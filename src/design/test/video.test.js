import test from 'node:test';
import assert from 'node:assert/strict';

function classList(...initial) {
  const values = new Set(initial);
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    contains: value => values.has(value),
    toggle(value, enabled) { if (enabled) values.add(value); else values.delete(value); },
  };
}

function player({ id, nativeControls, showcase = false }) {
  const events = {};
  let attempts = 0;
  const video = {
    controls: showcase, paused: true, ended: false,
    hasAttribute: name => name === 'data-native-controls' && nativeControls,
    addEventListener(name, handler) { events[name] = handler; },
    async play() {
      if (++attempts === 1) throw Error('play rejected');
      this.paused = false;
      events.play();
    },
  };
  const overlay = { removeAttribute() {}, addEventListener(_, handler) { this.click = handler; } };
  const status = { textContent: '', classList: classList('app-sr') };
  const root = {
    id, classList: classList(...(nativeControls ? ['has-controls'] : []), ...(showcase ? ['is-hidden-until-played'] : [])),
    querySelector: selector => ({ video, '[data-player-play]': overlay, '[role=status]': status })[selector],
    getBoundingClientRect: () => ({ top: 10, bottom: 300 }),
  };
  const remote = showcase ? {
    dataset: { remote: id, scroll: 'down', label: '영상 보기' }, classList: classList(),
    setAttribute() {}, addEventListener(_, handler) { this.click = handler; },
    querySelector: () => ({ outerHTML: '', getAttribute: () => 'app-control-icon' }),
  } : null;
  return { video, overlay, status, root, remote };
}

test('video_keeps_native_retry_after_rejection_and_clears_the_error_on_play', async t => {
  const views = [
    player({ id: 'article', nativeControls: true }),
    player({ id: 'showcase', nativeControls: true, showcase: true }),
    player({ id: 'custom', nativeControls: false }),
  ];
  const previous = Object.fromEntries(['document', 'window'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  t.after(() => {
    for (const [name, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });
  globalThis.window = { innerHeight: 800, addEventListener() {} };
  globalThis.document = {
    querySelectorAll: selector => selector === '[data-player]' ? views.map(view => view.root) : views.flatMap(view => view.remote ? [view.remote] : []),
    addEventListener() {},
  };
  await import('../dist/ui/runtime/video.js');
  for (const view of views) {
    assert.equal(view.video.controls, false);
    if (view.remote) {
      view.remote.click({ preventDefault() {} });
      await Promise.resolve();
    } else await view.overlay.click();
    assert.equal(view.video.controls, view.root.classList.contains('has-controls'));
    assert.equal(view.root.classList.contains('has-played'), true);
    assert.match(view.status.textContent, /재생하지 못했습니다/);
    assert.equal(view.status.classList.contains('app-video-error'), true);
    assert.equal(view.status.classList.contains('app-sr'), false);
    if (view.root.classList.contains('has-controls')) await view.video.play();
    else await view.overlay.click();
    assert.equal(view.status.textContent, '');
    assert.equal(view.status.classList.contains('app-video-error'), false);
    assert.equal(view.status.classList.contains('app-sr'), true);
    assert.equal(view.video.controls, view.root.classList.contains('has-controls'));
  }
});
