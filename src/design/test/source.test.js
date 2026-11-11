import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { buildDesign } from '../scripts/lib/design-build.mjs';
import { buildTables, flattenTokens, resolveToken, readSource } from '../scripts/lib/tokens.mjs';
import { themeTable, resolveValue } from '../scripts/lib/token-css.mjs';
import { ROOT, tables } from './helpers.mjs';
import { verifyDesign } from '../scripts/lib/verify-dist.mjs';

test('one_source_owns_web_and_diagram_roles_without_theme_hierarchy', () => {
  assert.equal(existsSync(`${ROOT}themes`), false);
  for (const name of tables.light.keys()) assert.doesNotMatch(name, /^(?:site|space|size|weight|easing)\./);
  assert.equal(resolveValue(tables.light, 'spacing.4'), '16px');
});

test('unknown_references_cycles_css_collisions_and_invalid_dark_overrides_fail', () => {
  const token = value => ({ $type: 'color', $value: value });
  assert.throws(() => themeTable({ a: token('{b}'), b: token('{a}') }), /cycle/);
  assert.throws(() => themeTable({ a: token('{missing}') }), /unknown/);
  assert.throws(() => themeTable({ a: { b: token('#fff') }, 'a-b': token('#fff') }), /collision/);
  assert.throws(() => buildTables({ light: { a: token('#fff') }, dark: { b: token('#000') } }), /missing/);
  assert.throws(() => resolveToken(flattenTokens({ a: token('{a}') }), 'a'), /cycle/);
});

// 색 체계: accent-1 Things 파랑(링크·단추·초점·선택), accent-2 주황(켜진 경로·구분색 1번·경고), 구분색 넷(주황 → 파랑 → 진한 회색 → 연한 회색 순서 고정), 상태색 셋. 보라·노랑·청록은 어디에도 없고 빨강·초록은 상태 전용이다.
test('one_palette_has_main_orange_four_distinctions_and_three_states_without_purple', () => {
  const distinctions = {
    light: { blue: ['#2b7fff', '#2b7fff', '#155dfc'], orange: ['#ff6900', '#ff6900', '#ff6900'], gray: ['#8b8f95', '#8b8f95', '#62666c'], silver: ['#c4c8cd', '#b4b8bd', '#62666c'] },
    dark: { blue: ['#51a2ff', '#51a2ff', '#51a2ff'], orange: ['#ff8904', '#ff8904', '#ff8904'], gray: ['#a0a2a7', '#a0a2a7', '#a0a2a7'], silver: ['#6e7075', '#6e7075', '#94969b'] },
  };
  for (const [mode, table] of Object.entries(tables)) {
    assert.deepEqual(Object.keys(distinctions[mode]).map((_, index) => resolveValue(table, `color.data.category-family.${index + 1}`)), ['orange', 'blue', 'gray', 'silver']);
    for (const [family, [fill, line, ink]] of Object.entries(distinctions[mode])) {
      assert.deepEqual(['fill', 'line', 'ink'].map(role => resolveValue(table, `color.category.${family}.${role}`)), [fill, line, ink], `${mode} ${family}`);
    }
    // accent-2는 사용자가 정한 주황(라이트 #ff6900, 다크 #ff8904)이고 도표의 켜진 경로·이동 점이 쓴다.
    assert.equal(resolveValue(table, 'color.data.main'), mode === 'light' ? '#ff6900' : '#ff8904');
    assert.equal(resolveValue(table, 'color.state.active'), mode === 'light' ? '#ff6900' : '#ff8904');
    assert.equal(resolveValue(table, 'color.status.warning.ink'), mode === 'light' ? '#ff6900' : '#ff8904');
    // accent-1은 Things 공통 CSS 값이다: 링크 #2576eb(다크 #649fff), 강한 단추 #4f91fb, 선택 면 #3c84f3(다크는 다크 링크 #649fff 면에 어두운 글자).
    assert.equal(resolveValue(table, 'color.ui.link'), mode === 'light' ? '#2576eb' : '#649fff');
    assert.equal(resolveValue(table, 'color.action-link'), resolveValue(table, 'color.ui.link'));
    assert.equal(resolveValue(table, 'color.button-primary'), '#4f91fb');
    assert.equal(resolveValue(table, 'color.button-primary-hover'), '#649fff');
    assert.equal(resolveValue(table, 'color.feature-tab-selected'), mode === 'light' ? '#3c84f3' : '#649fff');
    assert.equal(resolveValue(table, 'component.action-focus'), '0 0 0 2px rgba(37,118,235,.5)');
    // 아이콘 고유색(icon.*)은 아이콘 검수 기준을 따르고 색 역할(color.*)만 본다.
    for (const name of table.keys()) if (name.startsWith('color.')) assert.doesNotMatch(name, /purple|yellow|cyan|^color\.category\.(?:red|green)\./, name);
  }
  const source = ['tokens/tokens.json', 'tokens/tokens.dark.json'].map(file => readFileSync(ROOT + file, 'utf8')).join('');
  for (const purple of ['#7d40c8', '#a269f3', '#bb91ff', '#945ae3', '#b78aff']) assert.ok(!source.includes(purple), purple);
});

test('dark_mode_defines_its_own_soft_surface_and_link', () => {
  assert.notEqual(resolveValue(tables.dark, 'color.soft'), resolveValue(tables.light, 'color.soft'));
  assert.equal(resolveValue(tables.dark, 'color.link'), '#649fff');
  assert.equal(resolveValue(tables.dark, 'color.prose-link-active'), '#92bbfe');
});

test('all_generated_files_match_the_single_source_and_manifest', () => {
  const generated = buildDesign(ROOT);
  for (const [name, value] of Object.entries(generated)) assert.ok(readFileSync(`${ROOT}dist/${name}`).equals(Buffer.from(value)), name);
  assert.equal(verifyDesign(`${ROOT}dist`).contentHash, JSON.parse(generated['manifest.json']).contentHash);
});

test('both_modes_keep_references_and_generated_token_modules_are_identified', () => {
  const css = readFileSync(`${ROOT}dist/tokens.css`, 'utf8');
  assert.equal((css.match(/--spacing-4:/g) ?? []).length, 1, 'shared spacing is defined once and modes only override differences');
  assert.match(css, /data-theme='light'/);
  assert.match(css, /data-theme='dark'/);
  for (const name of ['tokens.css', 'tokens.js']) assert.match(readFileSync(`${ROOT}dist/${name}`, 'utf8').split('\n')[0], /생성물, 손으로 고치지 않음/);
});


test('web_corner_radii_do_not_borrow_spacing_tokens', () => {
  for (const file of ['cards', 'controls', 'shell', 'landing']) {
    const css = readFileSync(`${ROOT}styles/${file}.css`, 'utf8');
    assert.doesNotMatch(css, /border-radius:[^;{}]*var\(--spacing-/, file);
  }
});

test('dark_landing_text_contrasts_with_its_section_surfaces', async () => {
  const { contrast } = await import('../scripts/lib/contrast.mjs');
  for (const surface of ['ui-card', 'canvas', 'feature-canvas', 'feature-light', 'feature-medium']) {
    const background = resolveValue(tables.dark, `color.${surface}`);
    assert.ok(contrast(resolveValue(tables.dark, 'color.landing-title-color'), background) >= 3);
    for (const role of ['description-color', 'landing-review-meta-ink', 'landing-newsletter-note-ink']) {
      assert.ok(contrast(resolveValue(tables.dark, `color.${role}`), background) >= 4.5, `${role} on ${surface}`);
    }
  }
});

test('light_header_footer_and_newsletter_text_meet_body_contrast', async () => {
  const { contrast } = await import('../scripts/lib/contrast.mjs');
  const background = resolveValue(tables.light, 'color.ui-card');
  for (const role of ['nav-color', 'landing-footer-ink', 'landing-newsletter-note-ink']) {
    assert.ok(contrast(resolveValue(tables.light, `color.${role}`), background) >= 4.5, role);
  }
});

test('dark_canvas_keeps_secondary_sections_distinct_from_cards', () => {
  assert.notEqual(resolveValue(tables.dark, 'color.canvas'), resolveValue(tables.dark, 'color.ui-card'));
});

test('service_brand_icon_size_has_one_shared_role_in_both_modes', () => {
  const source = JSON.parse(readFileSync(ROOT + 'tokens/tokens.json', 'utf8'));
  assert.equal(source.spacing.figure.icon.brand.$value, '{spacing.figure.icon.node}');
  for (const table of Object.values(tables)) {
    assert.equal(resolveValue(table, 'spacing.figure.icon.brand'), resolveValue(table, 'spacing.figure.icon.node'));
    assert.equal(resolveValue(table, 'spacing.figure.icon.node'), '20px');
    assert.equal(resolveValue(table, 'spacing.figure.icon.tile'), '32px');
  }
});
