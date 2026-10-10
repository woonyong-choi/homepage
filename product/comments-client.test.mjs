import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { commentsSection } from './comments.mjs';
import { initComments } from './comments.js';

const config = { repo: 'owner/blog', repoId: 'repo-id', category: 'Comments', categoryId: 'category-id' };
const markup = (id, preview = true) => commentsSection({ id, title: `글 ${id}`, route: `/articles/${id}/`, description: '설명', comments: true }, config, 'light', { preview });
function setup(html = markup('first') + markup('second'), url = 'https://example.com/blog/') {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const sections = [...doc.querySelectorAll('[data-comments]')];
  const emit = (index, data, options = {}) => dom.window.dispatchEvent(new dom.window.MessageEvent('message', {
    origin: 'https://giscus.app', source: sections[index].querySelector('iframe')?.contentWindow, data: { giscus: data }, ...options,
  }));
  return { dom, doc, sections, emit };
}

test('each_preview_keeps_its_own_discussion_height_and_expansion', () => {
  const { dom, doc, sections, emit } = setup();
  initComments(doc);
  const [first, second] = sections;
  const firstFrame = first.querySelector('iframe');
  const params = new URL(firstFrame.src).searchParams;
  assert.equal(params.get('term'), 'first');
  assert.equal(params.get('backLink'), 'https://example.com/articles/first/');
  assert.equal(params.get('inputPosition'), 'bottom');
  assert.equal(params.get('origin'), 'https://example.com/blog/#comments-first');
  emit(0, { resizeHeight: 750, discussion: { totalCommentCount: 3, url: 'https://github.com/owner/blog/discussions/42' } });
  emit(1, { resizeHeight: 420 });
  assert.equal(Number.parseFloat(firstFrame.style.height), 750);
  assert.equal(Number.parseFloat(second.querySelector('iframe').style.height), 420);
  assert.equal(first.querySelector('[data-discussion-link]').href, 'https://github.com/owner/blog/discussions/42');
  assert.match(second.querySelector('[data-discussion-link]').href, /discussions\?/);
  first.querySelector('button[data-comments-expand]').click();
  assert.equal(first.dataset.expanded, 'true');
  assert.equal(first.querySelector('[data-comments-content]').inert, false);
  assert.equal(first.querySelector('[data-comments-content]').hasAttribute('aria-hidden'), false);
  assert.equal(doc.activeElement, firstFrame);
  assert.equal(second.dataset.expanded, 'false');
  assert.equal(second.querySelector('[data-comments-content]').inert, true);
  initComments(doc);
  assert.equal(first.querySelector('iframe'), firstFrame);
  assert.equal(first.dataset.expanded, 'true');
  dom.window.close();
});

test('foreign_messages_and_old_retry_frames_do_not_change_comments', () => {
  const { dom, doc, sections, emit } = setup(markup('first'));
  initComments(doc);
  const section = sections[0];
  const frame = section.querySelector('iframe');
  const staleSource = frame.contentWindow;
  emit(0, { resizeHeight: 900 }, { origin: 'https://other.example' });
  emit(0, { resizeHeight: 900 }, { source: dom.window });
  emit(0, { resizeHeight: Infinity });
  assert.equal(frame.style.height, '');
  emit(0, { error: 'network error' });
  assert.equal(section.querySelector('[data-comments-retry]').hidden, false);
  assert.equal(section.querySelector('[data-comments-fallback]').hidden, false);
  section.querySelector('[data-comments-retry]').click();
  const replacement = section.querySelector('iframe');
  assert.notEqual(replacement, frame);
  emit(0, { error: 'stale error' }, { source: staleSource });
  assert.equal(section.querySelector('[data-comments-retry]').hidden, true);
  emit(0, { error: 'Discussion not found' });
  assert.equal(section.querySelector('[data-comments-status]').hidden, true);
  assert.equal(section.querySelector('.app-comments-viewport').hidden, false);
  emit(0, { discussion: { url: 'https://github.com/owner/blog/discussions/42/../../other' } });
  assert.match(section.querySelector('[data-discussion-link]').href, /discussions\?/);
  dom.window.close();
});

test('comments_preload_without_scrolling_and_appended_threads_initialize_once', () => {
  const { dom, doc, sections } = setup(markup('first'));
  initComments(doc);
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  const frame = sections[0].querySelector('iframe');
  const added = doc.createElement('div');
  added.innerHTML = markup('third');
  added.querySelector('[data-comments]').dataset.commentsReturn = '/blog/page/2/';
  doc.body.append(added);
  initComments(added);
  initComments(doc);
  assert.equal(doc.querySelectorAll('iframe').length, 2);
  assert.equal(new URL(added.querySelector('iframe').src).searchParams.get('origin'), 'https://example.com/blog/page/2/#comments-third');
  assert.equal(sections[0].querySelector('iframe'), frame);
  const detail = setup(markup('detail', false), 'https://example.com/articles/detail/#comments');
  initComments(detail.doc);
  assert.equal(detail.doc.querySelector('[data-comments-expand]'), null);
  assert.equal(detail.doc.querySelector('[data-comments-content]').hasAttribute('aria-hidden'), false);
  assert.equal(new URL(detail.doc.querySelector('iframe').src).searchParams.get('inputPosition'), 'top');
  dom.window.close(); detail.dom.window.close();
});

test('login_callback_keeps_the_comment_anchor_and_logout_updates_all_loaded_threads', () => {
  const { dom, doc, sections, emit } = setup(undefined, 'https://example.com/blog/?giscus=test-session#comments-first');
  initComments(doc);
  assert.equal(dom.window.location.search, '');
  assert.equal(dom.window.location.hash, '#comments-first');
  assert.equal(sections[0].dataset.expanded, 'true');
  for (const frame of doc.querySelectorAll('iframe')) assert.equal(new URL(frame.src).searchParams.get('session'), 'test-session');
  emit(0, { signOut: true });
  assert.equal(dom.window.localStorage.getItem('giscus-session'), null);
  for (const frame of doc.querySelectorAll('iframe')) assert.equal(new URL(frame.src).searchParams.get('session'), '');
  dom.window.close();
});
