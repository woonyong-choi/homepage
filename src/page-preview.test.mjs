import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync, statSync, mkdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPagePreview, normalizePublicationAssets } from './page-preview.mjs';

const siteRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = siteRoot + 'content';
const input = { siteRoot, contentRoot, topicsFile: 'pages/tech.md' };
const saved = file => readFileSync(`${contentRoot}/${file}`, 'utf8');
const articleSource = readFileSync(new URL('./fixtures/preview-article.md', import.meta.url), 'utf8');
const output = siteRoot + 'dist/site/index.html';
const stamp = () => existsSync(output) ? [statSync(output).mtimeMs, readFileSync(output, 'utf8')] : null;

test('renderPagePreview_uses_unsaved_home_without_writing_source_or_publication', async () => {
  const original = saved('home.md');
  const before = stamp();
  const source = original + '\n\n저장 전 미리보기 문장\n';
  const result = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home' });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /저장 전 미리보기 문장/);
  assert.match(result.html, /app-landing/);
  const technologies = new JSDOM(result.html).window.document.querySelector('#technologies');
  assert.equal(technologies.querySelector('h2').textContent.trim(), '기술과 생각');
  assert.ok(technologies.querySelector('[aria-disabled="true"]'));
  assert.match(result.html, /noindex,nofollow/);
  assert.ok(result.assets.has('/theme/tokens.css'));
  assert.ok(result.assets.has('/theme/styles.css'));
  assert.equal(saved('home.md'), original);
  assert.deepEqual(stamp(), before);
});

test('renderPagePreview_renders_article_tabs_math_and_runtime_with_shared_page_shell', async () => {
  const source = articleSource + '\n\n## 저장 전 문단\n\n수식 $x^2$.\n\n:::tabs\n@tab 첫째\n하나\n@tab 둘째\n둘\n:::end\n';
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.previewMode, 'publication');
  assert.match(result.html, /저장 전 문단/);
  assert.match(result.html, /role="tablist"/);
  assert.match(result.html, /katex/);
  assert.ok(result.assets.has('/katex/katex.css'));
  assert.ok(result.assets.has('/document.js'));
  for (const [, path] of result.html.matchAll(/<script[^>]+src="([^"?]+)/g)) assert.ok(result.assets.has(path), path);
});

test('renderPagePreview_publication_is_the_compatible_default_and_invalid_modes_are_diagnostics', async () => {
  const request = { ...input, file: 'blog/preview-article.md', source: articleSource };
  const implicit = await renderPagePreview(request);
  const explicit = await renderPagePreview({ ...request, previewMode: 'publication' });
  assert.deepEqual(explicit, implicit);
  for (const previewMode of [null, '', 'preview', 0]) {
    const bad = await renderPagePreview({ ...request, previewMode, id: 'preview-article' });
    assert.equal(bad.html, '');
    assert.equal(bad.assets.size, 0);
    assert.equal(bad.diagnostics[0].file, request.file);
    assert.equal(bad.diagnostics[0].id, 'preview-article');
    assert.match(bad.diagnostics[0].message, /invalid preview mode/);
  }
  assert.equal((await renderPagePreview(request)).html, implicit.html);
});

test('renderPagePreview_writing_keeps_draft_content_and_tags_without_publication_chrome_for_blog_and_wiki', async () => {
  const before = stamp();
  for (const type of ['blog', 'wiki']) {
    const source = articleSource.replace('type: blog', `type: ${type}`).replace('visibility: public', 'visibility: draft\npublish: false\nstatus: draft').replace('tags: []', 'tags: [python]')
      .replace('## 미리보기 본문', '# 미리보기 시험 원고\n\n저장 전 원고를 공개하지 않고 렌더링합니다.\n\n## 미리보기 본문')
      + '\n\n[제목으로](#preview-article-미리보기-시험-원고)\n\n```md\n# 미리보기 시험 원고\n```\n\n수식 $x^2$와 참조.[^n]\n\n[^n]: 보존할 출처\n';
    const request = { ...input, file: `${type}/preview-article.md`, source };
    const publication = await renderPagePreview(request);
    const result = await renderPagePreview({ ...request, previewMode: 'writing' });
    assert.deepEqual(result.diagnostics, []);
    assert.deepEqual(publication.diagnostics, []);
    assert.equal(result.previewMode, 'writing');
    assert.equal(result.id, publication.id);
    assert.equal(result.route, publication.route);
    const document = new JSDOM(result.html).window.document;
    const publicDocument = new JSDOM(publication.html).window.document;
    for (const selector of ['.app-header', '.app-logo', '.app-nav', '.app-footer', '.app-footer-links', '.app-comments', '.app-document-sidebar', '.app-document-outline', '.app-search', 'link[type="application/rss+xml"]']) {
      assert.equal(document.querySelector(selector), null, selector);
    }
    assert.ok(publicDocument.querySelector('.app-header'));
    assert.ok(publicDocument.querySelector('.app-footer'));
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.equal(document.querySelector('h1').textContent, '미리보기 시험 원고');
    assert.equal(document.querySelector('h1').id, 'preview-article-미리보기-시험-원고');
    assert.match(document.querySelector('main').textContent, /초안/);
    assert.equal(document.querySelector('main time'), null);
    assert.equal(document.querySelector('a[href="/search/?tag=python"]').textContent, 'Python');
    assert.equal(document.querySelector('pre code').textContent, '# 미리보기 시험 원고\n');
    assert.ok(document.querySelector('[data-tool="copy"]'));
    assert.ok(document.querySelector('.katex'));
    assert.match(document.querySelector('.footnotes').textContent, /보존할 출처/);
    for (const anchor of document.querySelectorAll('a[href^="#"]')) {
      assert.ok(document.getElementById(decodeURIComponent(anchor.getAttribute('href').slice(1))), anchor.href);
    }
    assert.ok(result.assets.has('/document.js'));
    assert.ok(result.assets.has('/katex/katex.css'));
    assert.match(source, /visibility: draft\npublish: false\nstatus: draft/);
    assert.equal((await renderPagePreview(request)).html, publication.html);
  }
  assert.deepEqual(stamp(), before);
});

test('renderPagePreview_writing_reports_content_errors_and_preserves_source_reference_and_images', async () => {
  const source = articleSource.replace('type: blog', 'type: wiki').replace('tags: []', 'tags: [python]')
    .replace('comments: true', 'comments: true\nsourceUrl: https://example.test/reference') + '\n\n![Python](/theme/assets/icons/brands/python.svg)\n';
  const result = await renderPagePreview({ ...input, file: 'docs/preview.md', source, previewMode: 'writing' });
  assert.deepEqual(result.diagnostics, []);
  const document = new JSDOM(result.html).window.document;
  assert.equal(document.querySelector('a[href="https://example.test/reference"]').textContent, '공개 원문');
  assert.ok(document.querySelector('img[alt="Python"]'));
  assert.ok(result.assets.has('/theme/assets/icons/brands/python.svg'));
  const bad = await renderPagePreview({ ...input, file: 'docs/preview.md', source: source + '\n:::note\n닫히지 않음\n', previewMode: 'writing' });
  assert.equal(bad.html, '');
  assert.equal(bad.assets.size, 0);
  assert.equal(bad.diagnostics[0].file, 'docs/preview.md');
  assert.match(bad.diagnostics[0].message, /본문/);
});

test('renderPagePreview_reads_migrated_brand_bytes_and_notices_from_the_shared_theme', async () => {
  const source = articleSource.replace(/\nicon:.*\n/, '\nicon: python\n') + '\n\n![Python](/theme/assets/icons/brands/python.svg)\n';
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source });
  assert.deepEqual(result.diagnostics, []);
  const theme = new URL('../node_modules/@woonyong-choi/design-tokens/dist/', import.meta.url);
  for (const file of ['brands/python.svg', 'licenses/technology-logos-NOTICE.txt']) {
    assert.deepEqual(result.assets.get(`/theme/assets/icons/${file}`), readFileSync(new URL(`assets/icons/${file}`, theme)));
  }
  assert.equal([...result.assets.keys()].some(path => path.startsWith('/assets/brands/')), false);
});

test('renderPagePreview_supplies_site_icon_without_requiring_host_content_assets', async t => {
  const externalRoot = mkdtempSync(join(tmpdir(), 'homepage-preview-'));
  t.after(() => rmSync(externalRoot, { recursive: true, force: true }));
  assert.equal(existsSync(externalRoot + '/assets/site-icon.svg'), false);
  const requests = [];
  const result = await renderPagePreview({ ...input, contentRoot: externalRoot, file: 'draft.md',
    source: articleSource + '저장 전 원고\n',
    readContent: (name, edited) => edited ?? saved(name),
    assets: { read: path => {
      requests.push(path);
      if (path === '/assets/site-icon.svg') throw new Error(`host denied asset: ${path}`);
      return readFileSync(contentRoot + path);
    } } });
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.html);
  assert.deepEqual(result.assets.get('/assets/site-icon.svg'), readFileSync(siteRoot + 'content/assets/site-icon.svg'));
  assert.equal(requests.includes('/assets/site-icon.svg'), false);
});

test('renderPagePreview_preserves_host_denial_for_document_assets', async () => {
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md',
    source: articleSource + '![제한된 이미지](/assets/denied.png)\n',
    assets: { exists: () => true, read: path => {
      if (path === '/assets/denied.png') throw new Error(`host denied asset: ${path}`);
      return readFileSync(contentRoot + path);
    } } });
  assert.equal(result.html, '');
  assert.equal(result.assets.size, 0);
  assert.match(result.diagnostics[0].message, /host denied asset: \/assets\/denied\.png/);
});

test('renderPagePreview_reports_file_and_id_and_rejects_paths_outside_explicit_root', async () => {
  for (const file of ['../private.md', '/private.md']) {
    const result = await renderPagePreview({ ...input, file, source: '', id: 'draft' });
    assert.equal(result.html, '');
    assert.equal(result.assets.size, 0);
    assert.equal(result.diagnostics[0].file, file);
    assert.equal(result.diagnostics[0].id, 'draft');
    assert.match(result.diagnostics[0].message, /preview path/);
  }
  const result = await renderPagePreview({ ...input, file: 'unsaved.md', source: '잘못된 메타데이터', id: 'draft' });
  assert.equal(result.diagnostics[0].severity, 'error');
  assert.match(result.diagnostics[0].message, /metadata/);
});


test('renderPagePreview_compiles_diagrams_and_returns_iframe_bytes', async () => {
  const source = articleSource + '\n\n```thinkflow\nthinkflow\nbox a "서버"\nbox b "저장소"\na -> b\n```\n';
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source });
  assert.deepEqual(result.diagnostics, []);
  const path = /src="(\/diagrams\/[^"?]+)"/.exec(result.html)?.[1];
  assert.ok(path);
  assert.match(result.assets.get(path).toString(), /서버/);
  assert.ok(result.assets.has('/diagram.js'));
});


test('renderPagePreview_selects_shared_dark_tokens_and_keeps_light_as_default', async () => {
  const source = saved('home.md');
  const light = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home' });
  const dark = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home', colorScheme: 'dark' });
  assert.deepEqual(dark.diagnostics, []);
  assert.match(light.html, /data-theme="light"/);
  assert.match(dark.html, /data-theme="dark"/);
  assert.match(dark.html, /name="color-scheme" content="dark"/);
  assert.deepEqual(dark.assets, light.assets);
  const bad = await renderPagePreview({ ...input, file: 'home.md', source, colorScheme: 'unknown' });
  assert.match(bad.diagnostics[0].message, /color scheme/);
});


test('renderPagePreview_applies_host_reader_to_edited_and_referenced_content_without_fallback', async () => {
  const files = new Map(['home.md', 'pages/tech.md', 'interviews/index.md'].map(name => [name, saved(name)]));
  const reads = [];
  const readContent = (name, edited) => {
    reads.push(name);
    if (!files.has(name)) throw new Error(`content not allowed: ${name}`);
    return edited === undefined ? files.get(name) : edited + '\n\n호스트가 검사한 바이트\n';
  };
  const source = saved('home.md');
  const success = await renderPagePreview({ ...input, file: 'home.md', kind: 'home', source, readContent });
  assert.deepEqual(success.diagnostics, []);
  assert.match(success.html, /호스트가 검사한 바이트/);
  assert.equal(reads.filter(name => name === 'home.md').length, 1);
  const denied = await renderPagePreview({ ...input, file: 'home.md', kind: 'home', source: source.replace('interviews/index.md', 'drafts/private.md'), readContent });
  assert.match(denied.diagnostics[0].message, /content not allowed: drafts\/private.md/);
  assert.equal(denied.html, '');
  const edited = await renderPagePreview({ ...input, file: 'docs/private.md', source: articleSource, readContent });
  assert.match(edited.diagnostics[0].message, /content not allowed: docs\/private.md/);
  const invalid = await renderPagePreview({ ...input, file: 'home.md', source, kind: 'home', readContent: () => undefined });
  assert.match(invalid.diagnostics[0].message, /reader must return a string/);
});


test('renderPagePreview_host_asset_sizes_do_not_require_generated_config', async t => {
  const root = siteRoot + 'dist/test/preview-' + randomUUID();
  mkdirSync(root + '/config', { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ['site', 'tags', 'search', 'cs', 'tech', 'blog']) {
    copyFileSync(siteRoot + 'config/' + name + '.json', root + '/config/' + name + '.json');
  }
  const result = await renderPagePreview({ ...input, siteRoot: root, file: 'home.md',
    source: saved('home.md'), kind: 'home', assets: { size: () => undefined } });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /app-landing/);
  const technologies = new JSDOM(result.html).window.document.querySelector('#technologies');
  assert.equal(technologies.querySelector('h2').textContent.trim(), '기술과 생각');
  assert.ok(technologies.querySelector('[aria-disabled="true"]'));
  assert.equal(existsSync(root + '/config/image-sizes.json'), false);
});

test('preview_and_publication_share_existing_asset_prefixes', async () => {
  assert.equal(normalizePublicationAssets('/things/assets/image.png?q=1#part'), '/assets/image.png?q=1#part');
  assert.equal(normalizePublicationAssets('/things/theme/tokens.css'), '/theme/tokens.css');
  assert.equal(normalizePublicationAssets('/media/video.mp4'), '/media/video.mp4');
  const source = articleSource + '\n\n![예시](/things/assets/preview-prefix.png)\n';
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source,
    assets: { read: path => path === '/assets/preview-prefix.png' ? Buffer.from('image') : readFileSync(contentRoot + path) } });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /src="\/assets\/preview-prefix.png"/);
  assert.ok(result.assets.has('/assets/preview-prefix.png'));
  assert.match(source, /\/things\/assets\//);
});

test('preview_normalizes_same_site_absolute_links_using_the_build_origin_contract', async () => {
  const source = articleSource + '\n\n[문서](https://example.test/docs/private/)\n';
  const result = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source, origin: 'https://example.test' });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.origin, 'https://example.test');
  assert.ok(result.links.includes('/docs/private/'));
  const bad = await renderPagePreview({ ...input, file: 'blog/preview-article.md', source, origin: 'https://example.test/path' });
  assert.match(bad.diagnostics[0].message, /invalid site origin/);
});

// #275: 자동완성의 Enter와 전체 결과 링크가 기존 검색 페이지를 연다.
test('renderPagePreview_search_reuses_results_page_and_returns_assets', async () => {
  const before = stamp();
  const result = await renderPagePreview({ ...input, file: 'home.md', source: saved('home.md'), kind: 'search', colorScheme: 'dark' });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.route, '/search/');
  assert.match(result.html, /action="\/search\/"/);
  assert.match(result.html, /data-search-page/);
  assert.match(result.html, /data-full-results/);
  assert.match(result.html, /data-theme="dark"/);
  assert.ok(result.assets.has('/publication.js'));
  assert.ok(result.assets.has('/search-worker.mjs'));
  assert.equal(result.assets.has('/search-index.json'), false);
  assert.deepEqual(stamp(), before);
});
