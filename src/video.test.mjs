import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { ControlIcon, RemoteButton, RemoteLink } from './vendor/theme/ui/index.mjs';

globalThis.window = { addEventListener() {}, innerHeight: 800 };
globalThis.document = { querySelectorAll: () => [], addEventListener() {} };
const { updateRemote } = await import('./vendor/theme/ui/runtime/video.js');

function remote(label) {
  const props = { id: 'video', icon: ControlIcon('play') };
  const markup = label === undefined ? RemoteButton(props) : RemoteLink({ ...props, href: '#video', label });
  return new JSDOM(String(markup)).window.document.querySelector('[data-remote]');
}
const state = { paused: true, ended: false };
const iconName = button => button.querySelector('[data-control-icon]').dataset.controlIcon;

test('hero_remote_keeps_its_configured_label_and_only_switches_play_and_pause_icons', () => {
  const button = remote('프로젝트 영상 보기');
  updateRemote(button, { ...state });
  assert.deepEqual([iconName(button), button.getAttribute('aria-label'), button.querySelector('span').textContent], ['play', '프로젝트 영상 보기', '프로젝트 영상 보기']);
  updateRemote(button, { paused: false, ended: false });
  assert.deepEqual([iconName(button), button.getAttribute('aria-label'), button.querySelector('span').textContent, button.classList.contains('is-playing')], ['pause', '프로젝트 영상 보기', '프로젝트 영상 보기', true]);
  updateRemote(button, { paused: true, ended: false });
  assert.equal(iconName(button), 'play');
  updateRemote(button, { paused: true, ended: true });
  assert.deepEqual([iconName(button), button.getAttribute('aria-label'), button.classList.contains('is-playing')], ['play', '프로젝트 영상 보기', false]);
});

test('document_remote_without_a_configured_label_keeps_its_replay_state', () => {
  const button = remote();
  updateRemote(button, { paused: true, ended: true });
  assert.deepEqual([iconName(button), button.getAttribute('aria-label')], ['replay', 'Replay video']);
});
