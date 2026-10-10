import assert from 'node:assert/strict';
import { test } from 'node:test';

globalThis.window = { addEventListener() {}, innerHeight: 800 };
globalThis.document = { querySelectorAll: () => [], addEventListener() {} };
const { updateRemote } = await import('./video.js');

function remote(label) {
  const icon = { src: 'https://example.com/theme/assets/controls/play.svg' };
  const text = { textContent: label ?? 'Play' };
  const classes = new Set();
  const attributes = {};
  const button = {
    dataset: label === undefined ? {} : { label }, icon, text,
    classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) },
    setAttribute: (name, value) => { attributes[name] = value; },
    querySelector: selector => (selector === 'img' ? icon : text),
    classes, attributes,
  };
  return button;
}
const state = { paused: true, ended: false };
const iconName = button => button.icon.src.split('/').pop();

test('hero_remote_keeps_its_configured_label_and_only_switches_play_and_pause_icons', () => {
  const button = remote('프로젝트 영상 보기');
  updateRemote(button, { ...state });
  assert.deepEqual([iconName(button), button.attributes['aria-label'], button.text.textContent], ['play.svg', '프로젝트 영상 보기', '프로젝트 영상 보기']);
  updateRemote(button, { paused: false, ended: false });
  assert.deepEqual([iconName(button), button.attributes['aria-label'], button.text.textContent, button.classes.has('is-playing')], ['pause.svg', '프로젝트 영상 보기', '프로젝트 영상 보기', true]);
  updateRemote(button, { paused: true, ended: false });
  assert.equal(iconName(button), 'play.svg');
  updateRemote(button, { paused: true, ended: true });
  assert.deepEqual([iconName(button), button.attributes['aria-label'], button.classes.has('is-playing')], ['play.svg', '프로젝트 영상 보기', false]);
});

test('document_remote_without_a_configured_label_keeps_its_replay_state', () => {
  const button = remote();
  updateRemote(button, { paused: true, ended: true });
  assert.deepEqual([iconName(button), button.attributes['aria-label']], ['replay.svg', 'Replay video']);
});
