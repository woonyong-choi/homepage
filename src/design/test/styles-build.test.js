import assert from 'node:assert/strict';
import test from 'node:test';
import { pruneTokens, compileStyles } from '../ui/build/styles.mjs';
import { readSource } from '../scripts/lib/tokens.mjs';
import { themeTable, resolveValue, tailwindCss } from '../scripts/lib/token-css.mjs';

test('token_pruning_preserves_mode_dependencies_and_runtime_reads', () => {
  const source = ':root{--color-text:var(--color-dark);--color-dark:#111111;--color-light:#ffffff;--duration-copy:2400ms;--unused:12px} [data-theme=dark]{--color-text:var(--color-light)}';
  const css = pruneTokens(source, '.copy{color:var(--color-text)}; getPropertyValue("--duration-copy")');
  for (const name of ['--color-text', '--color-dark', '--color-light', '--duration-copy']) assert.ok(css.includes(name), name);
  assert.ok(!css.includes('--unused'));
  assert.ok(css.includes('[data-theme=dark]'));
});

test('compiled_styles_keep_copy_hover_focus_and_dynamic_states', async () => {
  const result = await compileStyles(':focus-visible{outline:2px solid var(--color-hover)}.copy{color:var(--color-ink)}.copy:hover,.copy:focus-visible{color:var(--color-hover)}.copy[data-state=copied]{opacity:1}.unused{color:red}', new Map([['/', '<button class="copy">copy</button>']]), new Map(), ':root{--color-ink:#111111;--color-hover:#ffffff;--unused:12px}');
  for (const selector of ['.copy:hover', '.copy:focus-visible', '[data-state=copied]']) assert.ok(result.css.includes(selector));
  assert.match(result.css, /(?:^|\})?:focus-visible\{/);
  assert.ok(!result.css.includes('.unused'));
  assert.ok(!result.theme.includes('--unused'));
  assert.ok(result.theme.includes('--color-hover'));
});

test('shared_design_exposes_tailwind_names_and_a_four_pixel_spacing_unit', () => {
  const theme = { meta: { defaultMode: 'light' }, sources: readSource(new URL('../', import.meta.url).pathname) };
  const table = themeTable(theme.sources.light);
  assert.equal(resolveValue(table, 'spacing.unit'), '4px');
  assert.equal(resolveValue(table, 'spacing.4'), '16px');
  assert.equal(resolveValue(table, 'spacing.8'), '32px');
  const css = tailwindCss(theme);
  assert.match(css, /@theme inline/);
  assert.match(css, /--spacing: var\(--spacing-unit\)/);
  assert.doesNotMatch(css, /--(?:site|space)-/);
  assert.doesNotMatch(css, /(--[\w-]+): var\(\1\)/);
});

test('fixed_light_scheme_drops_other_theme_blocks_and_their_tokens', async () => {
  const theme = ':root{--color-ink:var(--ink-light);--ink-light:#111111;--ink-dark:#eeeeee}@media (prefers-color-scheme: dark){:root:not([data-theme=light]){--color-ink:var(--ink-dark)}}[data-theme=\'dark\']{--color-ink:var(--ink-dark)}[data-theme=\'light\']{--color-ink:var(--ink-light)}';
  const result = await compileStyles('.copy{color:var(--color-ink)}', new Map([['/', '<p class="copy">copy</p>']]), new Map(), theme, { scheme: 'light' });
  assert.match(result.theme, /--color-ink:var\(--ink-light\)/);
  assert.doesNotMatch(result.theme, /--ink-dark|prefers-color-scheme|data-theme/);
  await assert.rejects(compileStyles('', new Map(), new Map(), theme, { scheme: 'dark' }), /unsupported fixed scheme/);
});
