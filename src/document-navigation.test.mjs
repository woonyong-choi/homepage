import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { initDocumentNavigation } from './vendor/theme/ui/runtime/document-navigation.js';
import * as ui from './vendor/theme/ui/index.mjs';

test('group_titles_toggle_children_and_leaf_titles_keep_their_document_link', () => {
  const dom = new JSDOM(String(ui.DocumentNavigation({ label: 'OS', nodes: [
    { title: '프로세스', href: '/docs/process/', current: true, children: [
      { title: 'Thread', href: '/docs/thread/' },
    ] },
  ] })), { url: 'https://example.com/docs/process/' });
  const group = dom.window.document.querySelector('li > details');
  const title = group.querySelector('summary').lastElementChild;
  title.click();
  assert.equal(group.open, true);
  assert.equal(title.getAttribute('aria-current'), 'page');
  assert.equal(group.querySelector('ul a').getAttribute('href'), '/docs/thread/');
  title.click();
  assert.equal(group.open, false);
  dom.window.close();
});

test('document_navigation_selects_the_clicked_row_and_keeps_only_its_ancestor_branch_open', () => {
  const dom = new JSDOM(String(ui.DocumentLayout({
    navigation: ui.DocumentNavigation({ label: 'OS', nodes: [
      { title: 'OS', href: '/docs/os/', current: true, open: true, children: [
        { title: '파일 시스템', href: '/docs/files/', children: [
          { title: '파일 접근', href: '/docs/access/', children: [
            { title: '권한', href: '/docs/permissions/' },
          ] },
        ] },
        { title: '프로세스', href: '/docs/process/', children: [
          { title: 'Thread', href: '/docs/thread/' },
        ] },
      ] },
    ] }),
    content: ui.trusted('<article>본문</article>'),
  })), { url: 'https://example.com/docs/os/', pretendToBeVisual: true });
  const doc = dom.window.document;
  const layout = doc.querySelector('[data-document-layout]');
  layout.querySelector('aside').style.position = 'sticky';
  initDocumentNavigation(layout);
  const [root, files, access, process] = layout.querySelectorAll('nav details');
  const click = group => group.querySelector('summary > span').click();
  const selected = () => [...layout.querySelectorAll('.is-selected')].map(row => row.textContent);
  click(files);
  assert.equal(files.open, true);
  assert.deepEqual(selected(), ['파일 시스템']);
  click(access);
  assert.ok(root.open && files.open && access.open);
  assert.deepEqual(selected(), ['파일 접근']);
  click(process);
  assert.ok(root.open && process.open);
  assert.ok(!files.open && !access.open);
  assert.deepEqual(selected(), ['프로세스']);
  assert.equal(layout.querySelector('[aria-current="page"]').textContent, 'OS');
  const leaf = process.querySelector('a');
  leaf.addEventListener('click', event => event.preventDefault());
  leaf.click();
  assert.deepEqual(selected(), ['Thread']);
  assert.equal(leaf.getAttribute('href'), '/docs/thread/');
  click(root);
  assert.ok(!root.open && !process.open);
  assert.deepEqual(selected(), ['OS']);
  dom.window.close();
});

test('document_navigation_tracks_subheadings_and_preserves_mobile_disclosure_choices', () => {
  const html = ui.DocumentLayout({
    navigation: ui.DocumentNavigation({ label: 'Python',
      nodes: [{ title: 'Python', href: '/docs/python/', current: true }] }),
    outline: ui.DocumentOutline({ sections: [
      { id: 'one', title: '첫 절', level: 2 }, { id: 'child', title: '하위 절', level: 3 },
      { id: 'two', title: '다음 절', level: 2 },
    ] }),
    content: ui.trusted('<h2 id="one">첫 절</h2><h3 id="child">하위 절</h3><h2 id="two">다음 절</h2>'),
  });
  const dom = new JSDOM(String(html), { url: 'https://example.com/docs/python/' });
  const doc = dom.window.document;
  const layout = doc.querySelector('[data-document-layout]');
  const panes = [...layout.querySelectorAll('aside')];
  panes.forEach(pane => { pane.style.position = 'sticky'; });
  const panels = [...layout.querySelectorAll('[data-document-panel]')];
  assert.equal(panels.length, 1);
  assert.equal(layout.querySelector('.app-document-outline > nav').getAttribute('aria-label'), '본문 목차');
  assert.equal(layout.querySelector('.app-document-outline summary'), null);
  let scheduled;
  dom.window.requestAnimationFrame = callback => { scheduled = callback; return 1; };
  const tops = [0, 100, 200];
  ['one', 'child', 'two'].forEach((id, index) => {
    doc.getElementById(id).getBoundingClientRect = () => ({ top: tops[index] });
  });
  initDocumentNavigation(layout);
  assert.ok(panels.every(panel => panel.open));
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#one');
  tops.splice(0, 3, -100, -1, 200);
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  scheduled();
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#child');
  assert.equal(layout.querySelector('.app-document-outline .is-parent').hash, '#one');
  Object.defineProperty(doc.documentElement, 'scrollHeight', { value: 1200 });
  dom.window.scrollY = 200;
  dom.window.innerHeight = 1000;
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  scheduled();
  assert.equal(layout.querySelector('.app-document-outline [aria-current]').hash, '#two');
  panes.forEach(pane => { pane.style.position = 'static'; });
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.ok(panels.every(panel => !panel.open));
  panels[0].open = true;
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(panels[0].open, true);
  assert.equal(panels[0].querySelector('summary').tabIndex, 0);
  dom.window.close();
});
