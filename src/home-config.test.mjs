import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadHomeConfig, parseHomeConfig } from './home-config.mjs';

const parse = (yaml, options = {}) => parseHomeConfig(yaml, { technologies: new Set(['python']), ...options });
const rejects = (yaml, pattern, options) => assert.throws(() => parse(yaml, options), pattern);

test('private_interviews_replace_only_preview_content_and_never_public_content', () => {
  const root = fileURLToPath(new URL('./fixtures/home-local-preview/', import.meta.url));
  const load = options => loadHomeConfig(new Set(), root, options)[0].items.map(item => item.summary);
  assert.deepEqual(load(), ['공개된 예시 평가']);
  assert.deepEqual(load({ preview: false }), ['공개된 예시 평가']);
  assert.deepEqual(load({ preview: true }), ['비공개 검토용 예시 평가']);
});

test('errors_name_the_file_and_the_exact_path', () => {
  rejects('sections:\n  - { id: a, type: banner }', /home\.config\.yaml sections\[0\]\.type: .*banner/);
  rejects('sections:\n  - { id: a, type: hero, description: x, colour: red }', /sections\[0\]\.colour: 알 수 없는 설정/);
  rejects('sections:\n  - { id: a, type: hero }', /sections\[0\]\.description: 값이 필요/);
  rejects('sections:\n  - { id: a, type: technologies, items: [python, rust] }', /sections\[0\]\.items\[1\]: 알 수 없는 기술/);
  rejects('sections:\n  - { id: a, type: technologies, items: [python, python] }', /sections\[0\]\.items\[1\]: 중복/);
  rejects('sections:\n  - { id: a, type: projects, items: [{ title: 가, description: 나 }, { title: 다 }] }', /sections\[0\]\.items\[1\]\.description/);
  rejects('sections: [', /YAML/);
});

test('links_and_media_reject_active_protocols_traversal_and_missing_files', () => {
  const link = href => `sections:\n  - { id: a, type: projects, items: [{ title: 가, description: 나, link: { label: 열기, href: "${href}" } }] }`;
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'http://example.com', 'https://user:pw@example.com', '/a b']) {
    rejects(link(bad), /sections\[0\]\.items\[0\]\.link\.href/);
  }
  assert.equal(parse(link('/wiki/'))[0].items[0].link.href, '/wiki/');
  const hero = src => `sections:\n  - { id: a, type: hero, description: x, video: { src: "${src}", title: t } }`;
  rejects(hero('/media/../secret.mp4'), /video\.src.*안전한 경로/);
  rejects(hero('javascript:alert(1)'), /video\.src.*HTTPS/);
  rejects(hero('/media/clip.png'), /video\.src.*\.mp4/);
  rejects(hero('/media/missing.mp4'), /video\.src: 파일이 없습니다: src\/media\/missing\.mp4/, { exists: () => false });
  rejects('sections:\n  - { id: a, type: hero, description: x, video: { src: /media/a.mp4, poster: "data:text/html,x", title: t } }', /video\.poster/);
});

test('disabled_sections_are_checked_for_shape_but_not_for_missing_files', () => {
  const yaml = 'sections:\n  - { id: a, type: hero, enabled: false, description: x, video: { src: /media/gone.mp4, title: t } }';
  assert.deepEqual(parse(yaml, { exists: () => false }), []);
  rejects(yaml.replace('description: x, ', ''), /description/, { exists: () => false });
});

test('section_ids_must_be_unique_and_not_collide_with_derived_dom_ids', () => {
  rejects('sections:\n  - { id: a, type: hero, description: x }\n  - { id: a, type: technologies }', /sections\[1\]\.id: DOM id "a"/);
  rejects('sections:\n  - { id: hero, type: hero, description: x }\n  - { id: hero-video, type: technologies }', /sections\[1\]\.id: DOM id "hero-video"/);
  rejects('sections:\n  - { id: main, type: technologies }', /DOM id "main"/);
  rejects('sections:\n  - { id: Bad_Id, type: technologies }', /sections\[0\]\.id/);
});

test('interview_items_use_the_profile_slots_with_optional_image_and_url', () => {
  const item = extra => `sections:\n  - { id: a, type: interviews, items: [{ id: talk, summary: s${extra} }] }`;
  assert.equal(parse(item(''))[0].items[0].profile, undefined);
  const [card] = parse(item(', profile: { image: { src: /assets/a.png, alt: 로고 }, title: 회사명, subtitle: 직무 }, url: "https://example.com/post"'))[0].items;
  assert.deepEqual([card.profile.image.src, card.profile.title, card.profile.subtitle, card.url], ['/assets/a.png', '회사명', '직무', 'https://example.com/post']);
  assert.equal(parse(item(', profile: { title: t }'))[0].items[0].profile.image, undefined);
  rejects(item(', profile: { subtitle: x }'), /profile\.title: 값이 필요/);
  rejects(item(', company: c'), /items\[0\]\.company: 알 수 없는 설정/);
  rejects(item(', profile: { title: t, date: d }'), /profile\.date: 알 수 없는 설정/);
  rejects(item(', url: "https://example.com"'), /items\[0\]\.url: .*profile\.title/);
  rejects(item(', profile: { title: t }, url: "http://example.com"'), /items\[0\]\.url.*HTTPS/);
  rejects(item(', profile: { title: t }, url: "javascript:alert(1)"'), /items\[0\]\.url/);
  rejects(item(', profile: { title: t, image: { src: /elsewhere/a.png } }'), /profile\.image\.src/);
  rejects(item(', profile: { title: t, image: { src: "http://example.com/a.png" } }'), /profile\.image\.src.*HTTPS/);
  rejects(item(', profile: { title: t, image: { src: /assets/missing.png } }'), /profile\.image\.src: 파일이 없습니다/, { exists: () => false });
  rejects('sections:\n  - { id: a, type: interviews, items: [{ id: t, summary: s }, { id: t, summary: s }] }', /items\[1\]\.id: 중복/);
});

test('prototype_properties_are_not_section_types_and_link_icons_are_checked', () => {
  for (const type of ['toString', '__proto__', 'constructor', 'hasOwnProperty']) rejects(`sections:\n  - { id: a, type: ${type} }`, /sections\[0\]\.type/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x, href: /a/, icon: twitter }] }', /links\[0\]\.icon/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x, href: "javascript:alert(1)" }] }', /links\[0\]\.href/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x }] }', /links\[0\]\.href: 값이 필요/);
  rejects('sections:\n  - { id: a, type: interviews, links: [{ label: x, icon: /assets/a.png }] }', /links\[0\]\.href: 값이 필요/);
  assert.equal(parse('sections:\n  - { id: a, type: interviews, links: [{ label: LinkedIn, icon: linkedin }] }')[0].links[0].href, undefined);
});

test('interview_summary_links_use_the_link_href_rules', () => {
  const item = summary => `sections:\n  - { id: a, type: interviews, items: [{ id: talk, summary: "${summary}" }] }`;
  assert.equal(parse(item('[@만난 곳](/wiki/)에서 [@모임](https://example.com/m)'))[0].items[0].summary, '[@만난 곳](/wiki/)에서 [@모임](https://example.com/m)');
  assert.equal(parse(item('@만난 곳'))[0].items[0].summary, '@만난 곳');
  for (const url of ['javascript:x', 'data:text/html,x', '//evil.example.com', 'http://example.com']) rejects(item(`[@x](${url})`), /items\[0\]\.summary 링크/);
});
