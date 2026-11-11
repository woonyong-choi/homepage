import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { buildDesign } from '../scripts/lib/design-build.mjs';
import { getIconCatalog, iconFile, readIcon } from '../dist/ui/build/icons.mjs';
import { parseIconSvg, renderSvgIcon, iconBody } from '../dist/ui/svg.mjs';
import { ContentIcon, ControlIcon, ArticleIcon, SocialIcon, trusted } from '../dist/ui/index.mjs';

const root = new URL('../', import.meta.url).pathname;
const files = buildDesign(root);
const catalog = getIconCatalog();

test('semantic_catalog_covers_every_svg_once_at_two_levels', () => {
  const source = readdirSync(root + 'assets/icons', { recursive: true }).filter(name => name.endsWith('.svg')).sort();
  assert.deepEqual(Object.values(catalog.icons).map(icon => icon.file).sort(), source);
  assert.equal(new Set(source).size, source.length);
  assert.equal(source.some(name => name.split('/').length !== 2), false);
  for (const [name, icon] of Object.entries(catalog.icons)) {
    assert.ok(Object.hasOwn(catalog.categories, icon.category), name);
    const raw = readFileSync(root + 'assets/icons/' + icon.file, 'utf8');
    const output = files['assets/icons/' + icon.file].toString();
    // 브랜드 고유색과 SVG 좌표는 원본 데이터이고 테마 색은 변수로 공급한다.
    if (!Object.hasOwn(catalog.brands, name)) assert.doesNotMatch(raw, /(?:fill|stroke|color)=["']#[0-9a-f]/i, icon.file);
    assert.doesNotMatch(output, /var\(|undefined|NaN/, icon.file);
    assert.doesNotThrow(() => parseIconSvg(output), icon.file);
  }
  assert.equal(Object.keys(files).some(name => /assets\/controls|catalog-detail|current-review/.test(name)), false);
});

test('active_consumer_inventory_matches_source_and_distribution', () => {
  const general = 'chat check checkbox-check checkbox-empty checkbox-indeterminate chevron-right close document download-bottom ellipsis file-copy maximize minimize pause play question replay rss scan search-mono user user-settings warning zoom-in zoom-out'.split(' ').sort();
  const content = 'api api-detail box-up brain-circuit code-review components cpu cpu-detail database database-detail document-detail event gateway hierarchy hierarchy-detail network network-detail operating-system operating-system-detail project search security server terminal terminal-detail'.split(' ');
  const names = [...general, ...content, ...Object.keys(catalog.brands)].sort();
  assert.deepEqual(Object.keys(catalog.icons).sort(), names);
  assert.deepEqual(readdirSync(root + 'assets/icons', { recursive: true }).filter(name => name.endsWith('.svg')).map(name => name.split('/').at(-1).slice(0, -4)).sort(), names);
  assert.deepEqual(Object.keys(files).filter(name => /^assets\/icons\/.*\.svg$/.test(name)).map(name => name.split('/').at(-1).slice(0, -4)).sort(), names);
  assert.deepEqual(catalog.aliases, { admin: 'user-settings', administrator: 'user-settings', apigw: 'gateway', architecture: 'hierarchy', deploy: 'box-up', incident: 'warning', model: 'brain-circuit', notify: 'event', person: 'user', processor: 'cpu' });
  assert.deepEqual(catalog.controls, {
    comment: 'chat', copy: 'file-copy', download: 'download-bottom', 'maximize-2': 'maximize', 'minimize-2': 'minimize', check: 'check', alert: 'warning', 'zoom-in': 'zoom-in', 'zoom-out': 'zoom-out', scan: 'scan', search: 'search-mono', clear: 'close', play: 'play', pause: 'pause', replay: 'replay', chevron: 'chevron-right', 'video-play': 'play', 'task-empty': 'checkbox-empty', 'task-done': 'checkbox-check', 'task-cancelled': 'checkbox-indeterminate',
  });
});

test('independent_png_icons_preserve_image_paths_dimensions_and_provenance', () => {
  const names = ['icons/communication/newsletter.png', 'icons/communication/technology-thought.png', 'icons/communication/testimonials.png'];
  assert.deepEqual(Object.keys(files).filter(name => name.startsWith('assets/icons/') && name.endsWith('.png')).sort(), names.map(name => `assets/${name}`));
  const sources = JSON.parse(readFileSync(root + 'assets/sources.json', 'utf8'));
  for (const name of names) {
    const source = readFileSync(root + 'assets/' + name);
    const provenance = sources.find(asset => asset.file === name);
    const hash = createHash('sha256').update(source).digest('hex');
    assert.equal(provenance?.origin, 'project-original', name);
    assert.equal(provenance.license, 'MIT', name);
    assert.equal(provenance.sha256, hash, name);
    assert.equal(provenance.bytes, source.length, name);
    assert.equal(provenance.width, 128, name);
    assert.equal(provenance.height, 128, name);
    assert.equal(provenance.format, 'PNG RGBA', name);
    if (name.endsWith('/technology-thought.png')) {
      assert.equal(provenance.previousSource, undefined, name);
    } else {
      assert.notEqual(provenance.previousSource.sha256, hash, name);
      assert.match(provenance.previousSource.url, /^https:\/\/culturedcode\.com\//, name);
      assert.equal(provenance.previousSource.use, 'comparison-only', name);
    }
    assert.equal(provenance.url, undefined, name);
    assert.deepEqual(files['assets/' + name], source, name);
    assert.equal(source.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', name);
    assert.deepEqual([source.readUInt32BE(16), source.readUInt32BE(20)], [128, 128], name);
    assert.equal(source[25], 6, name);
    assert.equal(Object.values(catalog.icons).some(icon => icon.file === name.slice(6)), false, name);
  }
});

test('loader_resolves_aliases_and_variants_without_accepting_paths', () => {
  for (const [alias, target] of Object.entries(catalog.aliases)) assert.equal(iconFile(alias), iconFile(target));
  assert.equal(iconFile('document', { variant: 'detail' }), 'documents/document-detail.svg');
  assert.equal(iconFile('file-copy', { variant: 'detail' }), iconFile('file-copy'));
  for (const name of ['missing', '../copy', 'constructor', '__proto__']) assert.throws(() => readIcon(name), /unknown icon/);
  assert.throws(() => iconFile('document', { variant: 'small' }), /unknown icon variant/);
  for (const library of catalog.libraries) assert.ok(files['assets/icons/' + library.notice], library.name);
  for (const [name, brand] of Object.entries(catalog.brands)) {
    assert.ok(catalog.icons[name], name);
    assert.match(brand.source, /^https:\/\//);
    assert.ok(catalog.libraries.some(library => library.name === brand.library));
  }
});

test('private_preview_metadata_and_pending_body_names_resolve_original_targets', () => {
  const metadata = {
    api: ['backend-api/api.svg', 'backend-api/api-detail.svg'],
    architecture: ['documents/hierarchy.svg', 'documents/hierarchy-detail.svg'],
    components: ['layout/components.svg', 'layout/components.svg'],
    database: ['databases/database.svg', 'databases/database-detail.svg'],
    deploy: ['actions/box-up.svg', 'actions/box-up.svg'],
    document: ['documents/document.svg', 'documents/document-detail.svg'],
    model: ['algorithms/brain-circuit.svg', 'algorithms/brain-circuit.svg'],
    network: ['networking/network.svg', 'networking/network-detail.svg'],
    'operating-system': ['operating-systems/operating-system.svg', 'operating-systems/operating-system-detail.svg'],
    processor: ['computer-architecture/cpu.svg', 'computer-architecture/cpu-detail.svg'],
    project: ['documents/project.svg', 'documents/project.svg'],
    security: ['security/security.svg', 'security/security.svg'],
    terminal: ['programming/terminal.svg', 'programming/terminal-detail.svg'],
    redis: ['brands/redis.svg', 'brands/redis.svg'],
  };
  for (const [name, [base, detail]] of Object.entries(metadata)) {
    assert.equal(iconFile(name), base, name);
    assert.equal(iconFile(name, { variant: 'detail' }), detail, name);
    assert.equal(readIcon(name, { variant: 'detail' }), files['assets/icons/' + detail].toString(), name);
    for (const size of ['medium', 'small']) {
      assert.match(String(ContentIcon({ graphic: trusted(renderSvgIcon(readIcon(name, { variant: 'detail' }))), size })), /<svg/);
    }
  }
  const pendingBody = { apigw: 'networking/gateway.svg', 'code-review': 'programming/code-review.svg', document: 'documents/document.svg', notify: 'backend-api/event.svg', person: 'people/user.svg', search: 'documents/search.svg', server: 'backend-api/server.svg' };
  for (const [name, file] of Object.entries(pendingBody)) assert.equal(iconFile(name), file, name);
  for (const name of ['missing', 'binary-tree', 'gateway-detail', 'event-detail', 'search-detail', 'server-detail']) assert.throws(() => readIcon(name), /unknown icon/, name);
});

test('static_svg_rejects_active_or_broken_content', () => {
  const wrap = body => `<svg viewBox="0 0 24 24">${body}</svg>`;
  for (const body of ['<script/>', '<image href="https://example.com/x"/>', '<path d="M0 0" onload="x"/>', '<style/>', '<rect mask="url(https://example.com/m)"/>', '<rect mask="url(#missing)"/>', '<g id="x"/><g id="x"/>', '<g></path>']) assert.throws(() => parseIconSvg(wrap(body)), body);
  assert.throws(() => parseIconSvg('<svg viewBox="0 0 1e999 24"/>'), /viewBox/);
  assert.throws(() => renderSvgIcon(wrap('<path d="M0 0"/>'), { className: 'x" onload="x' }), /invalid icon class/);
});

test('repeated_masked_icons_keep_cutouts_and_separate_ids', () => {
  const source = '<svg viewBox="0 0 32 16" fill="#123456"><defs><mask id="cut"><rect width="32" height="16" fill="white"/><circle cx="8" cy="8" r="2" fill="black"/></mask></defs><rect width="32" height="16" mask="url(#cut)"/></svg>';
  const first = iconBody(source, { size: 24, prefix: 'first', monochrome: true });
  const second = iconBody(source, { size: 24, prefix: 'second', monochrome: true });
  assert.match(first, /translate\(0 6\) scale\(0.75\)/);
  assert.match(first, /id="first-cut"/);
  assert.match(first, /mask="url\(#first-cut\)"/);
  assert.match(second, /mask="url\(#second-cut\)"/);
  assert.doesNotMatch(second, /first-cut/);
  assert.match(first, /fill="white"/);
  assert.match(first, /fill="black"/);
  assert.match(first, /fill="currentColor"/);
  assert.notEqual(renderSvgIcon(source), renderSvgIcon(source));
});

test('color_surfaces_and_monochrome_cutouts_keep_separate_presentations', () => {
  // #135: 컬러의 불투명 종이면을 단색 변환 때문에 투명하게 만들지 않는다.
  const source = '<svg viewBox="0 0 24 24"><g data-name="color"><rect id="paper" width="24" height="24" fill="white"/><path d="M4 8H20" stroke="#a5a7a9"/></g><g data-name="monochrome" display="none"><defs><mask id="cut"><rect width="24" height="24" fill="white"/><path d="M4 8H20" stroke="black"/></mask></defs><rect width="24" height="24" mask="url(#cut)"/></g></svg>';
  for (const render of [options => renderSvgIcon(source, options), options => iconBody(source, { size: 24, ...options })]) {
    const color = render({ prefix: 'color' });
    assert.match(color, /id="color-paper"[^>]*fill="white"/);
    assert.match(color, /stroke="#a5a7a9"/);
    assert.doesNotMatch(color, /<mask|display=|data-name=/);
    const mono = render({ prefix: 'mono', monochrome: true });
    assert.match(mono, /mask="url\(#mono-cut\)"/);
    assert.match(mono, /stroke="black"/);
    assert.match(mono, /fill="currentColor"/);
    assert.doesNotMatch(mono, /paper|#a5a7a9|display=|data-name=/);
    assert.doesNotThrow(() => parseIconSvg(mono.startsWith('<svg ') ? mono : `<svg viewBox="0 0 24 24">${mono}</svg>`));
  }
});

test('presentation_variants_reject_partial_hidden_or_cross_referenced_content', () => {
  const color = '<g data-name="color"><rect width="24" height="24"/></g>';
  const mono = '<g data-name="monochrome" display="none"><path d="M4 8H20"/></g>';
  for (const body of [
    color, mono, color + color + mono, `<g>${color}${mono}</g>`,
    color + mono + '<circle r="4"/>', color + mono.replace('display="none"', 'display="inline"'),
    color.replace('data-name="color"', 'data-name="color" display="none"') + mono,
    '<g display="none"><rect width="24" height="24"/></g>',
    color + mono.replace('<path d="M4 8H20"/>', '<script/>'),
    color + mono.replace('<path d="M4 8H20"/>', '<image href="https://example.com/x"/>'),
    color.replace('<rect width="24" height="24"/>', '<defs><mask id="shared"><rect width="24" height="24"/></mask></defs>') + mono.replace('<path d="M4 8H20"/>', '<rect mask="url(#shared)"/>'),
  ]) assert.throws(() => parseIconSvg(`<svg viewBox="0 0 24 24">${body}</svg>`), body);
});

test('shared_components_render_catalog_roles_and_validate_graphic_slots', async () => {
  assert.deepEqual(catalog.kinds, {});
  assert.deepEqual(catalog.articles, { question: 'question' });
  assert.deepEqual(catalog.social, { github: 'github', rss: 'rss', linkedin: 'linkedin' });
  for (const [group, render] of [['controls', ControlIcon], ['articles', ArticleIcon], ['social', SocialIcon]]) {
    for (const name of Object.keys(catalog[group])) assert.match(String(render(name)), /<svg[^>]*aria-hidden="true"/);
    assert.throws(() => render('missing'), /unknown/);
  }
  const graphic = trusted(renderSvgIcon(readIcon('document')));
  const badge = trusted(renderSvgIcon(readIcon('question')));
  assert.match(String(ContentIcon({ graphic, badge })), /app-content-icon-badge/);
  assert.doesNotMatch(String(ContentIcon({ graphic })), /app-content-icon-badge/);
  assert.throws(() => ContentIcon({ graphic, badge: '<svg/>' }), /must be trusted/);
  const runtime = await import('data:text/javascript;base64,' + Buffer.from(files['ui/icon-data.mjs']).toString('base64'));
  const roles = Object.fromEntries(['controls', 'articles', 'social'].map(group => [group, catalog[group]]));
  const names = [...new Set(Object.values(roles).flatMap(group => Object.values(group)))].sort();
  assert.deepEqual(runtime.ICON_ROLES, roles);
  assert.deepEqual(Object.keys(runtime.ICON_DATA).sort(), names);
  for (const name of names) assert.equal(runtime.ICON_DATA[name], readFileSync(root + 'assets/icons/' + catalog.icons[name].file, 'utf8'));
});

test('comment_control_preserves_bubble_geometry_and_consumer_class', () => {
  assert.equal(iconFile('chat'), 'communication/chat.svg');
  assert.equal(catalog.controls.comment, 'chat');
  const svg = String(ControlIcon('comment', 'app-blog-card-comment-icon'));
  assert.match(svg, /<svg[^>]*data-control-icon="comment"/);
  assert.match(svg, /class="app-blog-card-comment-icon"/);
  assert.match(svg, /viewBox="0 0 32 32"/);
  assert.match(svg, /<path[^>]*stroke-width="2.25"/);
  assert.match(svg, /stroke-linecap="round" stroke-linejoin="round"/);
  assert.doesNotMatch(svg, /<svg[^>]*\scolor=|(?:fill|stroke)="#/);
  assert.match(String(ControlIcon('comment')), /class="app-control-icon"/);
  const color = renderSvgIcon(readFileSync(root + 'assets/icons/communication/chat.svg', 'utf8'));
  assert.match(color, /fill="var\(--icon-accent-soft\)"/);
  assert.match(color, /stroke="var\(--icon-accent-outline\)"/);
  assert.doesNotMatch(color, /fill="none"/);
  assert.equal(readIcon('chat'), files['assets/icons/communication/chat.svg'].toString());
});

test('media_controls_preserve_white_symbols_and_inherit_button_color', () => {
  for (const name of ['play', 'video-play', 'pause']) {
    const svg = String(ControlIcon(name));
    assert.match(svg, /<circle[^>]*fill="currentColor"/);
    assert.match(svg, /<(?:path|rect)[^>]*fill="var\(--icon-paper\)"/);
    assert.doesNotMatch(svg, /<svg[^>]*\scolor=/);
  }
  assert.doesNotMatch(String(ControlIcon('copy')), /fill="#fff(?:fff)?"/);
});

test('comment_control_preserves_a_colored_surface_and_outline', () => {
  const svg = String(ControlIcon('comment'));
  assert.match(svg, /fill="var\(--icon-accent-soft\)"/);
  assert.match(svg, /stroke="var\(--icon-accent-outline\)"/);
  assert.match(svg, /aria-hidden="true"/);
  assert.match(String(ControlIcon('copy')), /(?:fill|stroke)="currentColor"/);
});
