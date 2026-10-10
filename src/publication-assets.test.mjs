import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';
import { documentShell } from './publication-layout.mjs';

test('publication_includes_nested_css_and_search_assets_without_shipping_authoring_files', () => {
  const source = new Map(Object.entries({
    '/theme/tokens.css': '@import "colors.css"; @font-face { src: url("assets/font.woff2") }',
    '/theme/colors.css': '.row { background: url(../assets/arrow.svg?v=1) }',
    '/assets/arrow.svg': '<svg/>',
    '/theme/assets/font.woff2': 'font',
    '/theme/assets/icons/small/document.svg': '<svg/>',
    '/theme/assets/giscus.css': '',
    '/theme/tokens.json': 'authoring data',
    '/theme/styles.source.css': 'authoring source',
    '/media/unused.svg': '<svg/>',
  }));
  const pages = new Map([['/wiki/', '<link href="/theme/tokens.css?v=hash"><a href="/articles/example/">문서</a><img src="https://cdn.example/image.png">']]);
  const assets = publicationAssets(pages, [{ iconUrl: '/theme/assets/icons/small/document.svg' }], path => {
    assert.ok(source.has(path), path); return source.get(path);
  });
  assert.deepEqual([...assets.keys()].sort(), [...source.keys()].filter(path => !['/theme/tokens.json', '/theme/styles.source.css', '/media/unused.svg'].includes(path)).sort());
});

test('missing_dependencies_and_encoded_path_escape_fail_before_publication', () => {
  const pages = new Map([['/', '<link href="/theme/styles.css">']]);
  assert.throws(() => publicationAssets(pages, [], path => {
    if (path === '/theme/styles.css') return '.a { background: url(../assets/missing.svg) }';
    throw new Error(`missing ${path}`);
  }), /missing \/assets\/missing.svg/);
  for (const url of ['../../private.txt', '/theme/%2e%2e%2fprivate.txt', '/theme/a%5cb.svg']) {
    assert.throws(() => publicationAssets(pages, [], () => `.a { background: url(${url}) }`), /outside publication roots|invalid publication asset/);
  }
});

test('static_pages_load_only_the_footer_year_module_and_document_controls_keep_their_own_entrypoint', () => {
  const context = { config: { name: '이름', description: '소개', github: 'https://github.com/example' }, themeHash: 'theme', scriptHash: 'client' };
  const home = documentShell({ route: '/', title: '홈' }, '<main id="main"><a href="/wiki/">Wiki</a></main>', context);
  assert.deepEqual([...home.matchAll(/<script[^>]*src="\/([^?"]+)/g)].map(match => match[1]), ['footer-year.js']);
  assert.deepEqual(clientEntrypoints('<section data-public-search></section>'), ['publication.js']);
  assert.deepEqual(clientEntrypoints('<details class="app-document-nav"></details>'), []);
  const article = documentShell({ route: '/articles/example/', title: '글' }, '<section data-public-search></section><button data-tool></button><div data-comments></div>', context);
  for (const file of ['publication.js', 'document.js', 'comments.js']) assert.ok(article.includes(`src="/${file}?v=client"`));
  assert.match(article, /<script type="module" async src="\/publication\.js\?v=client"><\/script><\/body>/);
  assert.ok(article.indexOf('data-comments') < article.indexOf('async src="/publication.js'));
  assert.match(article, /<script type="module" src="\/document\.js\?v=client">/);
  for (const marker of ['data-tabs', 'data-tool', 'data-keyboard', 'data-tooltip-trigger']) assert.deepEqual(clientEntrypoints(`<div ${marker}></div>`), ['document.js']);
  assert.deepEqual(clientEntrypoints('<code>&lt;div data-tool&gt;</code>'), []);
});

test('video_state_icons_are_included_before_the_first_play', () => {
  const pages = new Map([['/', '<div data-player><video poster="/media/poster.png"><source src="/media/demo.mp4"></video></div>']]);
  const assets = publicationAssets(pages, [], () => Buffer.from(''));
  for (const path of ['/media/poster.png', '/media/demo.mp4', '/theme/assets/controls/pause.svg', '/theme/assets/controls/replay.svg']) assert.ok(assets.has(path));
  assert.deepEqual(clientEntrypoints(pages.get('/')), ['video.js']);
});

test('used_licensed_assets_include_notices_and_unused_assets_do_not', () => {
  const dependencies = [
    ['/theme/assets/controls/play.svg', '/theme/assets/controls/LICENSE'],
    ['/theme/assets/fonts/pretendard-variable.woff2', '/theme/assets/fonts/pretendard-license.txt'],
    ['/theme/assets/fonts/jetbrains-mono-regular.woff2', '/theme/assets/fonts/jetbrains-mono-license.txt'],
    ['/theme/assets/icons/brands/python.svg', '/theme/assets/icons/brands/LICENSE'],
    ['/assets/company-j2ysoft.png', '/assets/company-logos-NOTICE.txt'],
    ['/assets/company-neople-background.png', '/assets/company-logos-NOTICE.txt'],
    ['/media/woonyong-interview.mp4', '/media/woonyong-interview-NOTICE.txt'],
    ['/media/woonyong-interview-poster.jpg', '/media/woonyong-interview-NOTICE.txt'],
  ];
  for (const [asset, notice] of dependencies) {
    const pages = new Map([['/', `<a href="${asset}">자산</a>`]]);
    const files = publicationAssets(pages, [], path => Buffer.from(path));
    assert.ok(files.has(notice), notice);
    assert.equal(files.get(notice).toString(), notice);
    assert.throws(() => publicationAssets(pages, [], path => {
      if (path === notice) throw new Error('missing notice');
      return Buffer.from(path);
    }), /missing notice/);
  }
  const unused = publicationAssets(new Map([['/', '<main>자산 없음</main>']]), [], () => Buffer.from(''));
  for (const [, notice] of dependencies) assert.ok(!unused.has(notice));
});

test('blog_archive_loads_its_client_only_when_the_list_exists', () => {
  assert.deepEqual(clientEntrypoints('<div data-blog-list></div>'), ['blog-list.js']);
  assert.deepEqual(clientEntrypoints('<article class="app-blog-card"></article>'), []);
});
