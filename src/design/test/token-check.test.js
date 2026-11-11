import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { findCustomProperties } from '../ui/build/lib/find-hardcoded.mjs';
import { findTokensFile } from '../ui/build/lib/walk-files.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CHECKER = join(ROOT, 'ui/build/check-tokens.mjs');
const TOKENS = { 'border-width': { thin: { $type: 'dimension', $value: '1px' } }, primitive: { ink: { $type: 'color', $value: '#303336' } }, color: { ink: { $type: 'color', $value: '{primitive.ink}' } } };

function fixture(t) {
  const folder = mkdtempSync(join(tmpdir(), 'design-token-check-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  writeFileSync(join(folder, '.git'), 'gitdir: worktree\n');
  return {
    folder,
    write(name, content) {
      const path = join(folder, name);
      writeFileSync(path, content);
      return path;
    },
    tokens() { return this.write('tokens.json', JSON.stringify(TOKENS)); },
    check(...args) { return spawnSync(process.execPath, [CHECKER, ...args], { cwd: folder, encoding: 'utf8' }); },
  };
}

// #99: 검사할 파일이나 정본이 없으면 위반 0건과 구분한다.
test('check_tokens_rejects_missing_targets_sources_and_empty_directories', t => {
  const view = fixture(t);
  const source = view.write('source.css', '.card { color: var(--color-ink); }');
  const absentTokens = view.check(source);
  assert.equal(absentTokens.status, 2, absentTokens.stdout + absentTokens.stderr);
  assert.match(absentTokens.stderr, /tokens\.json not found/);
  const tokens = view.tokens();
  const absentTarget = view.check('absent.css', '--tokens', tokens);
  assert.equal(absentTarget.status, 2, absentTarget.stdout + absentTarget.stderr);
  assert.match(absentTarget.stderr, /target not found/);
  const empty = join(view.folder, 'empty');
  mkdirSync(empty);
  assert.equal(view.check(empty, '--tokens', tokens).status, 2);
  assert.equal(view.check(source, '--tokens', 'absent.json').status, 2);
  assert.equal(view.check(source).status, 0);
});

// #99: 저장소 루트와 하위 폴더는 같은 정본을 고르고 worktree 밖으로 탐색하지 않는다.
test('find_tokens_file_uses_canonical_locations_and_respects_worktree_boundaries', t => {
  assert.equal(findTokensFile([ROOT]), join(ROOT, 'tokens/tokens.json'));
  assert.equal(findTokensFile([join(ROOT, 'styles')]), join(ROOT, 'tokens/tokens.json'));
  const view = fixture(t);
  view.tokens();
  const nested = join(view.folder, 'nested');
  mkdirSync(nested);
  writeFileSync(join(nested, '.git'), 'gitdir: worktree\n');
  const source = join(nested, 'source.css');
  writeFileSync(source, '.card { color: var(--color-ink); }');
  assert.equal(findTokensFile([source]), null);
});

// #99: 문자열의 예외 표기와 빈 사유는 실제 하드코딩을 숨기지 않는다.
test('check_tokens_only_allows_reasoned_comments_on_the_same_line', t => {
  const view = fixture(t);
  view.tokens();
  const rejected = [
    ['empty.css', '.card { width: 12px; } /* tokens-allow: */'],
    ['string.css', '.card { content: "/* tokens-allow: fake */"; width: 12px; }'],
    ['empty.mjs', "const width = '12px'; // tokens-allow:   "],
    ['string.mjs', "const width = '12px'; const note = 'tokens-allow: fake';"],
    ['comment-string.mjs', "const width = '12px'; const note = '/* tokens-allow: fake */';"],
    ['generated-string.mjs', "const width = '12px'; const note = '생성물, 손으로 고치지 않음';"],
    ['other-line.mjs', "// tokens-allow: external contract\nconst width = '12px';"],
  ];
  for (const [name, content] of rejected) {
    const result = view.check(view.write(name, content));
    assert.equal(result.status, 1, `${name}\n${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /length or time: 12px/);
  }
  for (const [name, content] of [
    ['allowed.css', '.card { width: 12px; } /* tokens-allow: external contract */'],
    ['allowed.mjs', "const width = '12px'; // tokens-allow: external contract"],
    ['allowed-block.mjs', "const width = '12px'; /* tokens-allow: external contract */"],
    ['generated.mjs', "// 생성물, 손으로 고치지 않음\nconst width = '12px';"],
  ]) assert.equal(view.check(view.write(name, content)).status, 0, name);
});

// #99: 폴더 검사도 마크업의 스타일과 표현 속성을 검사하며 도형 좌표는 제외한다.
test('check_tokens_checks_markup_styles_and_presentation_attributes', t => {
  const view = fixture(t);
  view.tokens();
  for (const [name, content, rule] of [
    ['page.html', '<style>.card { padding: 12px; }</style>', 'length or time'],
    ['icon.svg', '<svg viewBox="0 0 24 24"><path stroke-width="3" d="M 0 0 L 24 24"/></svg>', 'stroke-width number'],
    ['font.svg', '<svg><text font-family="Arial">label</text></svg>', 'font family'],
    ['panel.vue', '<template><div style="padding: 12px"></div></template>', 'length or time'],
    ['panel.svelte', '<div style="padding: 12px"></div>', 'length or time'],
  ]) {
    const result = view.check(view.write(name, content));
    assert.equal(result.status, 1, `${name}\n${result.stdout}${result.stderr}`);
    assert.match(result.stdout, new RegExp(rule));
  }
  assert.equal(view.check(view.folder).status, 1);
  const coordinates = view.write('coordinates.svg', '<svg viewBox="0 0 48 48"><circle cx="12" cy="24" r="8" stroke-width="var(--border-width-thin)"/><image width="32" height="32"/></svg>');
  assert.equal(view.check(coordinates).status, 0);
  const comment = view.write('comment.html', '<!-- <style>.card { width: 12px; }</style> --><p title="12px">12px</p>');
  assert.equal(view.check(comment).status, 0);
  const text = view.write('text.html', '<p title=\'style="padding: 12px"\'>12px</p><script>const example = "<style>.card { width: 12px; }</style>";</script>');
  assert.equal(view.check(text).status, 0);
});

// 미정의 참조는 fallback 유무나 소비자 선언으로 숨기지 않는다.
test('check_tokens_rejects_unknown_variables_including_fallbacks', t => {
  const view = fixture(t);
  view.tokens();
  for (const [name, content, missing] of [
    ['unknown.css', '.card { color: var(--color-missing); }', '--color-missing'],
    ['fallback.css', '.card { color: var(--color-ink, var(--fallback-missing)); }', '--fallback-missing'],
    ['literal-fallback.css', '.card { color: var(--typo, transparent); }', '--typo'],
    ['local.css', '.card { --local: var(--color-ink); color: var(--local); }', '--local'],
    ['markup.svg', '<svg><path fill="var(--missing-ink)"/></svg>', '--missing-ink'],
    ['script.mjs', 'const style = "color: var(--missing-ink);";', '--missing-ink'],
  ]) {
    const result = view.check(view.write(name, content));
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.ok(result.stdout.includes(`undefined CSS variable: ${missing}`), result.stdout);
  }
});

test('check_tokens_accepts_canonical_declarations_and_documented_runtime_inputs', t => {
  const view = fixture(t);
  view.tokens();
  const names = ['--color-ink', '--anchor-x', '--anchor-y', '--s', '--figure-canvas', '--view-w', '--panel-w', '--fit-w', '--zoom', '--bundle-w', '--pill-tint'];
  const result = view.check(view.write('known.css', names.map(name => `.sample { color: var(${name}); }`).join('\n')));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('canonical_variable_collection_ignores_comments_and_css_strings', () => {
  const css = '/* --fake-comment: none; */ .card { content: "--fake-string: none"; --face: var(--color-ink); --empty: initial; }';
  assert.deepEqual(findCustomProperties(css), ['--face', '--empty']);
});


test('check_tokens_rejects_named_colors_easing_weights_and_extra_units', t => {
  const view = fixture(t);
  view.tokens();
  for (const declaration of [
    'color:red', 'background: WHITE', 'border: solid rebeccapurple',
    'color:color-mix(in srgb,var(--color-ink),white)', 'color:light-dark(white,black)',
    'transition-timing-function:ease-in', 'transition:opacity var(--duration-notice) ease',
    'animation-timing-function:cubic-bezier(0,0,1,1)', 'animation-timing-function:steps(2,end)',
    'font-weight:bold', 'font-weight:normal', 'width:42%', 'width:4ch', 'rotate:12deg', 'width:12PX',
  ]) {
    const result = view.check(view.write('literal.css', `.card { ${declaration}; }`));
    assert.equal(result.status, 1, declaration + '\n' + result.stdout + result.stderr);
    assert.match(result.stdout, /named color|easing literal|font-weight keyword|length or time/);
  }
  for (const [name, content] of [
    ['color.svg', '<svg><path fill="red" /></svg>'],
    ['color.mjs', 'const css = "color: red;";'],
    ['unit.mjs', "const width = '4CH';"],
    ['condition.css', '@media (max-width:4CH) { .card { color:inherit; } }'],
  ]) assert.equal(view.check(view.write(name, content)).status, 1, content);
});

test('check_tokens_preserves_labels_token_references_and_runtime_ratios', t => {
  const view = fixture(t);
  view.tokens();
  for (const [name, content] of [
    ['labels.mjs', 'const label = "red"; const other = "ease-in";'],
    ['grammar.mjs', `const grammar = 'track [lost=60%] [when="condition"]';`],
    ['dynamic.mjs', 'const css = `fill: var(--color-paint-${name}-fill);`;'],
    ['labels.html', '<p title="red">red ease-in bold 42%</p>'],
    ['labels.svg', '<svg><path fill="currentColor" aria-label="red" /></svg>'],
    ['safe.css', '.card { color:currentColor; background:transparent; font-weight:inherit; width:100%; height:50%; opacity:1; left:0%; transform:translate(-50%, -100%); transform:scale(1); width:calc(100% * var(--panel-w) / var(--view-w)); color:var(--color-ink); content:"red"; background-image:url(red.svg); }'],
  ]) {
    const result = view.check(view.write(name, content));
    assert.equal(result.status, 0, content + '\n' + result.stdout + result.stderr);
  }
});

test('check_tokens_rejects_dom_color_assignments_and_theme_or_custom_property_literals', t => {
  const view = fixture(t);
  view.tokens();
  for (const [name, content] of [
    ['custom.css', '.card { --fx-face:red; }'],
    ['scheme.css', ':root { color-scheme:dark; }'],
    ['theme.css', '.card { color:light-dark(var(--color-ink),var(--color-ink)); }'],
    ['style.mjs', 'element.style.backgroundColor = "red";'],
    ['set-property.mjs', 'element.style.setProperty("color", "red");'],
    ['opacity.mjs', 'element.style.opacity = "0.5";'],
    ['weight.mjs', 'element.style.fontWeight = "700";'],
    ['script.html', '<script>element.style.color = "red";</script>'],
  ]) {
    const result = view.check(view.write(name, content));
    assert.equal(result.status, 1, name + result.stdout + result.stderr);
  }
  const valid = view.write('valid.mjs', `element.style.color = "var(--color-ink)"; const label = 'element.style.color = "red"';`);
  assert.equal(view.check(valid).status, 0);
  const labels = view.write('labels.css', '.card { --fx-face:url(/white.svg); content:"color-scheme: dark"; }');
  assert.equal(view.check(labels).status, 0);
});
