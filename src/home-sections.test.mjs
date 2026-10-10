import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';
import { existsSync, readFileSync } from 'node:fs';
import { loadHomeContent, parseHomeSections } from './home-content.mjs';
import { personalHome } from './publication-layout.mjs';
import { clientEntrypoints, publicationAssets } from './publication-assets.mjs';
import { getIconCatalog } from './vendor/theme/ui/build/icons.mjs';

const TECHNOLOGIES = new Set(['python', 'git']);
const render = (yaml, preview = true) => personalHome({ config: { name: '이름' }, home: parseHomeSections(parseYaml(yaml), { technologies: TECHNOLOGIES }), preview });
const positions = (html, marks) => marks.map(mark => html.indexOf(mark));
const ascending = values => values.every((value, index) => value >= 0 && (!index || value > values[index - 1]));

const ALL = {
  hero: '  - { id: hero, type: hero, description: 소개 }',
  projects: '  - id: projects\n    type: projects\n    items:\n      - { title: 첫째, description: 설명 }',
  technologies: '  - { id: technologies, type: technologies, items: [python] }',
  interviews: '  - { id: interviews, type: interviews, items: [{ id: a, summary: 예시 요약, example: true }] }',
  contact: '  - { id: contact, type: contact, email: hello@example.com }',
};
const MARKS = { hero: 'id="hero"', projects: 'id="projects"', technologies: 'id="technologies"', interviews: 'id="interviews"', contact: 'id="contact"' };
const compose = order => `sections:\n${order.map(name => ALL[name]).join('\n')}`;

test('list_order_is_render_order_and_disabled_sections_leave_no_trace', () => {
  const order = ['hero', 'projects', 'technologies', 'interviews', 'contact'];
  assert.ok(ascending(positions(render(compose(order)), order.map(name => MARKS[name]))));
  const reversed = [...order].reverse();
  assert.ok(ascending(positions(render(compose(reversed)), reversed.map(name => MARKS[name]))));
  const hidden = render(compose(order).replace('{ id: technologies,', '{ id: technologies, enabled: false,'));
  assert.doesNotMatch(hidden, /id="technologies"|data-flow-direction="right"|\/tags\/python\//);
  assert.match(hidden, /id="interviews"/);
});

test('disabled_hero_removes_player_remote_script_and_media_assets', () => {
  const yaml = id => `sections:\n  - id: hero\n    type: hero\n    enabled: ${id}\n    description: 소개\n    video: { src: /media/demo.mp4, poster: /media/poster.png, title: 영상 }`;
  const on = render(yaml(true));
  assert.match(on, /data-remote="hero-player"[^>]*>/);
  assert.doesNotMatch(on, /data-language/);
  assert.match(on, /id="hero-player" data-player/);
  assert.deepEqual(clientEntrypoints(on), ['video.js']);
  const off = render(yaml(false));
  assert.doesNotMatch(off, /data-remote|data-player|video|demo\.mp4/);
  assert.deepEqual(clientEntrypoints(off), []);
  const read = path => Buffer.from(path);
  assert.ok(publicationAssets(new Map([['/', on]]), [], read).has('/media/demo.mp4'));
  assert.ok(![...publicationAssets(new Map([['/', off]]), [], read).keys()].some(path => path.startsWith('/media/')));
});

test('hero_bundle_changes_icon_image_video_poster_and_action_together', () => {
  const html = render('sections:\n  - id: intro\n    type: hero\n    description: 소개\n    icon: { src: https://example.com/a.png, alt: 로고 }\n    image: { src: https://example.com/b.jpg, alt: 그림 }\n    action: { label: 더 보기, href: /blog/ }');
  assert.match(html, /<img class="app-hero-logo" src="https:\/\/example.com\/a.png" alt="로고" loading="eager"/);
  assert.match(html, /<a class="app-hero-link" href="\/blog\/">더 보기 <span aria-hidden="true">→<\/span><\/a>/);
  assert.match(html, /id="intro-video"[^>]*><div class="app-hero-panorama-content"><img src="https:\/\/example.com\/b.jpg"/);
  assert.doesNotMatch(html, /data-player|data-remote/);
});

test('projects_render_zero_two_or_many_entries_and_skip_disabled_ones', () => {
  const projects = count => `sections:\n  - id: projects\n    type: projects\n    items:\n${Array.from({ length: count }, (_, index) => `      - { title: 제목${index}, description: 설명${index}, link: { label: 열기, href: 'https://example.com/${index}' }, image: { src: https://example.com/${index}.png, alt: 그림 } }`).join('\n')}`;
  const slices = html => html.match(/class="app-landing-section app-landing-features"/g)?.length ?? 0;
  assert.equal(slices(render('sections:\n  - { id: projects, type: projects, items: [] }')), 0);
  assert.equal(slices(render(projects(2))), 2);
  assert.equal(slices(render(projects(7))), 7);
  const one = render(`${projects(2)}\n      - { enabled: false, title: 숨김, description: 설명 }`);
  assert.equal(slices(one), 2);
  assert.doesNotMatch(one, /숨김/);
  assert.match(one, /<h2>제목0<\/h2><p>설명0<\/p><p><a class="app-landing-action" href="https:\/\/example.com\/0">열기<\/a><\/p><\/div><div class="app-landing-collage"><img src="https:\/\/example.com\/0.png"/);
});

test('interview_cards_show_summary_and_exactly_the_image_title_subtitle_slots', () => {
  const item = extra => `sections:\n  - id: interviews\n    type: interviews\n    items:\n      - { id: talk, summary: 요약, profile: { title: 회사명, subtitle: 직무 }${extra} }`;
  const plain = render(item(''), false);
  assert.match(plain, /<p class="app-interview-summary">요약<\/p><div class="app-interview-meta"><div class="app-interview-lines"><strong>회사명<\/strong><span>직무<\/span><\/div><\/div>/);
  assert.doesNotMatch(plain, /<a href|app-interview-avatar|undefined/);
  const linked = render(item(', url: "https://example.com/talk"'), false);
  assert.match(linked, /<a class="app-interview-card-link" href="https:\/\/example.com\/talk" aria-label="회사명 직무 인터뷰 보기"><\/a>/);
  assert.match(linked, /<strong>회사명<\/strong><span>직무<\/span>/);
  assert.equal((linked.match(/<a[^>]+href="https:\/\/example.com\/talk"/g) ?? []).length, 1);
  const picture = render(item('').replace('profile: {', 'profile: { image: { src: /theme/assets/icons/places/building.svg }, '), false);
  assert.match(picture, /<div class="app-interview-meta"><span class="app-interview-avatar"><img src="\/theme\/assets\/icons\/places\/building\.svg" alt=""[^>]*><\/span><div class="app-interview-lines">/);
  const bare = render('sections:\n  - { id: interviews, type: interviews, items: [{ id: a, summary: <b>요약</b> }, { id: b, summary: 둘, profile: { title: "<i>제목</i>" } }] }', false);
  assert.doesNotMatch(bare.split('</li>')[0], /app-interview-meta/);
  assert.match(bare, /&lt;b&gt;요약&lt;\/b&gt;/);
  assert.match(bare, /<strong>&lt;i&gt;제목&lt;\/i&gt;<\/strong><\/div>/);
  const empty = 'sections:\n  - { id: interviews, type: interviews, items: [] }';
  assert.doesNotMatch(render(empty, true), /interviews/);
  const example = item(', example: true');
  assert.match(render(example, true), /회사명/);
  assert.doesNotMatch(render(example, false), /interviews/);
  assert.doesNotMatch(render(empty, false), /interviews|예시/);
});

test('interviews_split_in_order_into_ceil_half_rows_after_filtering', () => {
  const items = count => `sections:\n  - id: interviews\n    type: interviews\n    items:\n${Array.from({ length: count }, (_, i) => `      - { id: i${i}, summary: 요약${i}, profile: { title: 회사${i} } }`).join('\n')}`;
  const rows = html => [...html.matchAll(/<ul class="app-flow-group"[^>]*>(.*?)<\/ul>/g)].map(match => [...match[1].matchAll(/요약(\d)/g)].map(card => Number(card[1])));
  assert.equal(rows(render('sections:\n  - { id: interviews, type: interviews, items: [] }', false)).length, 0);
  assert.deepEqual(rows(render(items(1), false)), [[0]]);
  assert.doesNotMatch(render(items(1), false), /data-flow-rows/);
  assert.deepEqual(rows(render(items(2), false)), [[0], [1]]);
  assert.deepEqual(rows(render(items(5), false)), [[0, 1, 2], [3, 4]]);
  assert.deepEqual(rows(render(items(6), false)), [[0, 1, 2], [3, 4, 5]]);
  const two = render(items(6), false);
  assert.equal((two.match(/data-flow-rows/g) ?? []).length, 1);
  assert.match(two, /aria-label="인터뷰 카드 1행"[\s\S]*aria-label="인터뷰 카드 2행"/);
  assert.equal((two.match(/data-flow-direction="right"/g) ?? []).length, 1);
  assert.match(two, /<div class="app-interviews" data-flow-rail data-flow-label="인터뷰">[\s\S]*<div class="app-interviews" data-flow-rail data-flow-direction="right" data-flow-label="인터뷰">/);
  assert.doesNotMatch(readFileSync(new URL('./vendor/theme/styles.css', import.meta.url), 'utf8'), /app-interview-rows[^{]*\{[^}]*align-items: flex-start/);
  const filtered = render(items(3).replace('i1,', 'i1, example: true,'), false);
  assert.deepEqual(rows(filtered), [[0], [2]]);
});

test('social_links_support_registry_icons_and_show_a_link_less_icon_as_a_placeholder', () => {
  const html = render('sections:\n  - { id: talk, type: interviews, links: [{ label: GitHub, href: "https://github.com/x", icon: github }, { label: LinkedIn, icon: linkedin }], items: [{ id: a, summary: 예시 요약 }] }');
  const row = html.match(/<p class="app-landing-social">.*?<\/p>/)[0];
  assert.match(row, /<a href="https:\/\/github.com\/x" aria-label="GitHub"><svg/);
  assert.match(row, /<span role="img" aria-label="LinkedIn · 주소 준비 중"><svg[^>]*class="app-landing-symbol"/);
  assert.equal((row.match(/<a /g) ?? []).length, 1);
});

test('technologies_and_interviews_share_the_section_intro_with_projects', () => {
  const intro = html => html.match(/<div class="app-landing-heading">.*?<\/div>/)[0];
  const tech = render('sections:\n  - { id: tech, type: technologies, items: [python] }');
  assert.match(intro(tech), /<h2 id="tech-title">함께 쓰는 기술<\/h2><p>기술별 기록을 모았습니다\.<\/p>/);
  const rich = render('sections:\n  - id: talk\n    type: interviews\n    icon: { src: https://example.com/i.png }\n    title: 이야기\n    description: 설명\n    links: [{ label: GitHub, href: "https://github.com/x", icon: github }, { label: 글, href: /blog/ }]\n    items: [{ id: a, summary: 예시 요약 }]');
  assert.match(intro(rich), /<h2 id="talk-title"><img src="https:\/\/example.com\/i.png" alt="" loading="lazy" decoding="async"> 이야기<\/h2><p>설명<\/p><p class="app-landing-social"><a href="https:\/\/github.com\/x" aria-label="GitHub"><svg[^>]*class="app-landing-symbol"/);
  assert.match(intro(rich), /<a href="\/blog\/">글<\/a>/);
  assert.doesNotMatch(rich, /data-flow-controls|data-flow-(?:toggle|prev|next)|<button/);
  assert.match(rich, /class="app-landing-section app-landing-interviews"/);
  assert.deepEqual(clientEntrypoints(rich), ['flows.js']);
  const named = render('sections:\n  - { id: contact, type: contact, email: hello@example.com, icon: mail }');
  assert.match(intro(named), /<img src="\/theme\/assets\/icons\/communication\/mail.svg"/);
  assert.throws(() => render('sections:\n  - { id: contact, type: contact, email: hello@example.com, icon: missing-icon }'), /unknown icon/);
});

test('hero_title_names_the_page_and_icon_and_missing_files_of_disabled_items_are_ignored', () => {
  const hero = render('sections:\n  - id: hero\n    type: hero\n    title: 내 이름\n    description: 소개\n    icon: { src: https://example.com/a.png }');
  assert.match(hero, /<h1 class="app-sr">내 이름<\/h1>/);
  assert.match(hero, /alt="내 이름"/);
  assert.match(render(compose(['contact'])), /<h1 class="app-sr">이름<\/h1>/);
  assert.doesNotMatch(hero, /app-hero-title/);
  const noIcon = render('sections:\n  - { id: hero, type: hero, title: 내 이름, description: 소개 }');
  assert.match(noIcon, /<p class="app-hero-title" aria-hidden="true">내 이름<\/p>/);
  assert.doesNotMatch(render('sections:\n  - { id: hero, type: hero, description: 소개 }'), /app-hero-title/);
  const yaml = 'sections:\n  - id: projects\n    type: projects\n    items:\n      - { enabled: false, title: 숨김, description: 설명, image: { src: /assets/gone.png } }\n      - { title: 보임, description: 설명 }';
  const html = personalHome({ config: { name: '이름' }, home: parseHomeSections(parseYaml(yaml), { exists: () => false }), preview: true });
  assert.doesNotMatch(html, /gone\.png|숨김/);
  assert.throws(() => parseHomeSections(parseYaml(yaml.replace('enabled: false, ', '')), { exists: () => false }), /items\[0\]\.image\.src: 파일이 없습니다/);
});

test('contact_uses_the_email_link_and_rejects_unsupported_subscription_settings', () => {
  const base = 'sections:\n  - id: contact\n    type: contact\n    email: hello@example.com';
  const html = render(base);
  assert.match(html, /<h2 id="contact-title">함께 만들어 볼까요\?<\/h2>/);
  assert.match(html, /href="mailto:hello@example.com">메일 보내기<\/a>/);
  assert.doesNotMatch(html, /<form|<input|<button|구독|준비 중/);
  for (const setting of ['mode: newsletter', 'endpoint: https://subscribe.example.com/form']) {
    assert.throws(() => render(`${base}\n    ${setting}`), /알 수 없는 설정/);
  }
  const home = loadHomeContent(new Set(Object.keys(getIconCatalog().brands)));
  const shipped = personalHome({ config: { name: '이름' }, home });
  assert.match(shipped, /<p class="app-hero-title" aria-hidden="true">최우녕<\/p>/);
  assert.match(shipped, /href="mailto:woonyong.contact@gmail.com">메일 보내기<\/a>/);
  assert.doesNotMatch(shipped, /<form|<input|구독 서비스를 준비 중/);
});

test('the_shipped_interviews_section_shows_its_title_description_and_two_social_links', () => {
  const brands = Object.keys(getIconCatalog().brands);
  const interviews = loadHomeContent(new Set(brands)).find(section => section.type === 'interviews');
  assert.equal(interviews.description, '함께 일한 동료들이 들려주는 저에 대한 이야기입니다.');
  assert.equal(interviews.title, '사람들이 하는 말');
  assert.deepEqual(interviews.links.map(item => [item.icon, Boolean(item.href)]), [['github', true], ['linkedin', true]]);
  assert.match(personalHome({ config: { name: '이름' }, home: [interviews], preview: true }) || '', /^<main/);
});

test('the_shipped_home_content_omits_projects_from_the_visible_sections', () => {
  const brands = Object.keys(getIconCatalog().brands);
  const home = loadHomeContent(new Set(brands));
  assert.deepEqual(home.map(section => section.type), ['hero', 'technologies', 'interviews', 'contact']);
  assert.equal(home[1].title, '기술과 생각');
  assert.equal(home[1].description, '언어와 도구의 원리, 개발 과정에서 마주한 질문과 지식을 정리하고 기록합니다.');
});

test('the_shipped_hero_plays_the_selected_local_video_from_the_beginning', () => {
  const brands = Object.keys(getIconCatalog().brands);
  const hero = loadHomeContent(new Set(brands)).find(section => section.type === 'hero');
  assert.equal(hero.video.src, '/media/woonyong-interview.mp4');
  assert.equal(hero.action.href, undefined);
  for (const name of ['woonyong-interview.mp4', 'woonyong-interview-poster.jpg']) assert.ok(existsSync(new URL(`../content/media/${name}`, import.meta.url)));
});
