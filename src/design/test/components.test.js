import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readSource } from '../scripts/lib/tokens.mjs';
import { tables } from './helpers.mjs';
import { resolveValue, themeTable } from '../scripts/lib/token-css.mjs';
import { contrast } from '../scripts/lib/contrast.mjs';
import { RUNTIME_PROPERTIES } from '../ui/build/lib/tokens-patterns.mjs';
import { SYNTAX_ROLES } from '../dist/ui/components.mjs';
import { readIcon } from '../dist/ui/build/icons.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const modules = readdirSync(root + 'styles', { recursive: true }).filter(name => name.endsWith('.css')).map(name => `styles/${name}`);
const illustrations = existsSync(root + 'assets/illustrations') ? readdirSync(root + 'assets/illustrations').map(name => `assets/illustrations/${name}`) : [];
const audited = [...modules, ...illustrations, `assets/giscus.css`, ...readdirSync(root + 'ui', { recursive: true }).filter(name => /\.(?:mjs|js)$/.test(name) && !name.startsWith('build/')).map(name => `ui/${name}`)];
// 스크립트가 데이터에서 계산해 넣는 값. 토큰이 아니다.
const RUNTIME = new Set(RUNTIME_PROPERTIES);
const audit = files => spawnSync(process.execPath, ['ui/build/check-tokens.mjs', ...files, '--tokens', 'tokens/tokens.json'], { cwd: root, encoding: 'utf8' });

test('audited_component_sources_have_no_hardcoded_presentation_values', () => {
  const result = audit(audited);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('every_css_variable_used_by_component_sources_is_a_theme_token', () => {
  const defined = new Set([...themeTable(readSource(root).light).keys()].map(name => `--${name.replaceAll('.', '-')}`));
  for (const file of audited) for (const [, name] of readFileSync(root + file, 'utf8').matchAll(/(--[\w-]+)\s*:/g)) defined.add(name);
  for (const file of audited) {
    const missing = [...new Set([...readFileSync(root + file, 'utf8').matchAll(/var\((--[\w-]+)/g)].map(match => match[1]))].filter(name => !defined.has(name) && !RUNTIME.has(name));
    assert.deepEqual(missing, [], file);
  }
});

test('body_and_caption_text_are_readable_on_the_page_in_each_theme', () => {
  for (const [mode, table] of Object.entries(tables)) {
    const page = resolveValue(table, 'color.ui-card');
    assert.ok(contrast(resolveValue(table, 'color.body'), page) >= 4.5, `${mode} body text on page`);
    // 사용자 결정: 그림 설명·작은 글은 Things 값(라이트 rgba(4,15,26,.5) 3.62:1, 다크 rgba(239,246,255,.49) 4.15:1)이다. 본문보다 한 단계 약한 보조 글이라 3.5:1을 하한으로 둔다.
    const caption = resolveValue(table, 'color.prose-caption-color');
    assert.ok(contrast(onSurface(caption, page), page) >= (THINGS_FIXED.has(caption) ? 3.5 : 4.5), `${mode} caption text on page`);
  }
});

// 구분색 넷: 면 위 글자(on)는 본문 대비, 이름 있는 색의 글자(ink)는 페이지 위 본문 대비다.
// 다크 연한 회색 글자(#94969b)는 사용자 확정값이라 페이지 위 4.38이고, 직접 라벨이 필요한 계열(label required)이며 이 예외 하나만 둔다.
const INK_EXCEPTIONS = new Set(['dark silver']);
// 사용자 결정: 메인 주황(#ff6900, 다크 #ff8904) 면 위 글자는 흰색이다. 흰 글자 대비는 2.89:1(라이트)·2.3:1(다크)로 4.5:1에 못 미치며 색은 바꾸지 않고 이 예외로 기록한다(docs/styles.md 색 체계).
// 사용자 결정: 상태색과 보조 파랑은 메인 주황과 같은 Tailwind 단계(라이트 500, 다크 400)의 정해진 값이다. 오류 #fb2c36·#ff6467, 성공 #00c950·#05df72, 파랑 #2b7fff·#51a2ff도 같은 예외로 기록한다.
const FIXED_PALETTE = new Set(['#ff6900', '#ff8904', '#fb2c36', '#ff6467', '#00c950', '#05df72', '#2b7fff', '#51a2ff']);
const onMainMinimum = (ink, surface, normal) => (ink === '#ffffff' && FIXED_PALETTE.has(surface) ? 2.2 : normal);
// 사용자 결정: 메인 주황은 글자·아이콘·선에도 정해진 값 그대로 쓴다. 라이트 #ff6900은 흰 면 2.89:1, 옅은 면·도구 면 위 2.0~2.6:1로 기준에 못 미치며 예외로 기록한다.
// 라이트 성공 #00c950은 도표 면 위 도구 누름 면에서 약 1.7:1로 가장 낮다. 상태 아이콘 모양과 글자 라벨로 보완한다.
const mainMinimum = (color, normal) => (FIXED_PALETTE.has(color) ? Math.min(normal, 1.65) : THINGS_FIXED.has(color) ? Math.min(normal, 4) : normal);
// 사용자 결정: accent-1과 글자 위계는 Things 공통 CSS 값 그대로다. 링크 #2576eb는 흰 면 4.31:1·옅은 면 4.03:1, 선택 면 #3c84f3·강한 단추 #4f91fb 위 흰 굵은 글자는 3.63:1·3.10:1이다.
// 색은 바꾸지 않고 이 예외로 기록한다(docs/styles.md 색 체계). 링크는 4:1, 선택 면·단추 위 흰 굵은 글자는 3:1을 하한으로 둔다.
const THINGS_FIXED = new Set(['#2576eb', '#649fff', '#3c84f3', '#4f91fb', 'rgba(4,15,26,.5)', 'rgba(239,246,255,.49)']);
const onThingsMinimum = (ink, surface, normal) => (ink === '#ffffff' && THINGS_FIXED.has(surface) ? 3 : onMainMinimum(ink, surface, normal));

test('category_and_flow_share_readable_solid_color_pairs', () => {
  for (const [mode, table] of Object.entries(tables)) {
    for (const [index, family] of ['orange', 'blue', 'gray', 'silver'].entries()) {
      const fill = resolveValue(table, `color.category.${family}.fill`);
      const on = resolveValue(table, `color.category.${family}.on`);
      assert.equal(resolveValue(table, `color.data.category-family.${index + 1}`), family);
      assert.equal(resolveValue(table, `color.data.category.${index + 1}`), fill);
      assert.equal(resolveValue(table, `color.data.category-on.${index + 1}`), on);
      assert.ok(contrast(on, fill) >= onMainMinimum(on, fill, 4.5), `${mode} ${family} text on fill`);
      const ink = contrast(resolveValue(table, `color.category.${family}.ink`), resolveValue(table, 'color.ui-card'));
      if (!INK_EXCEPTIONS.has(`${mode} ${family}`)) assert.ok(ink >= mainMinimum(resolveValue(table, `color.category.${family}.ink`), 4.5), `${mode} ${family} ink on page`);
    }
    assert.deepEqual(['1', '2', '3', '4'].map(key => resolveValue(table, `color.data.category-dash.${key}`)), ['solid', 'solid', 'dashed', 'dotted']);
    assert.deepEqual(['1', '2', '3', '4'].map(key => resolveValue(table, `color.data.category-label.${key}`)), ['optional', 'optional', 'required', 'required']);
    assert.equal(resolveValue(table, 'color.data.reference'), resolveValue(table, 'color.data.grid'));
  }
});

test('diagram_outline_is_readable_on_both_card_and_canvas_surfaces', () => {
  for (const [mode, table] of Object.entries(tables)) {
    const value = key => resolveValue(table, key);
    assert.notEqual(value('color.prose-pre-background'), value('color.ui-card'), mode + ' diagram surface differs from page');
    for (const background of ['color.ui-card', 'color.prose-pre-background']) {
      assert.ok(contrast(value('color.figure.outline'), value(background)) >= 3, mode + ' outline on ' + background);
    }
  }
});

test('icons_keep_contrast_on_page_paper_and_tool_surfaces_in_both_themes', () => {
  const staticChatStroke = /stroke="(#[a-f0-9]+)"/i.exec(readIcon('chat'))[1];
  for (const [mode, table] of Object.entries(tables)) {
    const hex = name => resolveValue(table, name);
    assert.ok(contrast(hex('icon.neutral'), hex('color.ui-card')) >= 3, `${mode} icon on page`);
    assert.ok(contrast(staticChatStroke, hex('color.help-bg')) >= 3, `${mode} static chat outline on card`);
    for (const surface of ['color.help-bg', 'color.help-hover', 'color.help-active']) assert.ok(contrast(hex('icon.accent-outline'), hex(surface)) >= 3, `${mode} comment outline on ${surface}`);
    assert.ok(contrast(hex('icon.brand.postgresql'), hex('color.ui-card')) >= 3, `${mode} PostgreSQL silhouette on page`);
    assert.ok(contrast(hex('icon.brand.nginx'), hex('color.ui-card')) >= 3, `${mode} NGINX silhouette on page`);
    assert.ok(contrast(hex('icon.neutral-edge'), hex('icon.paper')) >= 4.5, `${mode} annotation on paper`);
    const surface = hex('color.prose-pre-background');
    for (const background of ['color.prose-pre-background', 'color.control-hover', 'color.control-active']) {
      const fill = onSurface(hex(background), surface);
      for (const role of ['color.ui-muted', 'color.accent', 'color.state.success', 'color.state.error']) {
        assert.ok(contrast(hex(role), fill) >= mainMinimum(hex(role), 3), `${mode}.${role} on ${background}`);
      }
    }
    assert.ok(contrast(hex('color.ui.focus'), surface) >= mainMinimum(hex('color.ui.focus'), 3), `${mode} tool focus ring`);
  }
});

test('static_icon_structure_edge_keeps_contrast_after_light_token_binding', () => {
  const edge = resolveValue(tables.light, 'icon.structure-edge');
  for (const [mode, table] of Object.entries(tables)) {
    for (const background of ['color.ui-card', 'color.prose-pre-background']) {
      assert.ok(contrast(edge, resolveValue(table, background)) >= 3, `${mode} static edge on ${background}`);
    }
  }
});

test('media_symbol_and_edge_keep_contrast_at_playing_opacity', () => {
  const colors = ['icon.paper', 'icon.control-edge'].map(name => resolveValue(tables.light, name));
  const opacity = Number(resolveValue(tables.light, 'opacity.landing-logo-opacity'));
  const fade = (color, alpha, surface) => {
    const channels = color.slice(1).match(/../g).map(value => Number.parseInt(value, 16));
    return onSurface(`rgba(${channels.join(',')},${alpha})`, surface);
  };
  for (const [mode, table] of Object.entries(tables)) {
    const card = resolveValue(table, 'color.ui-card');
    for (const background of ['color.ui-card', 'color.control-hover', 'color.control-active']) {
      const surface = onSurface(resolveValue(table, background), card);
      for (const alpha of [1, opacity]) {
        const [symbol, edge] = colors.map(color => fade(color, alpha, surface));
        assert.ok(contrast(symbol, edge) >= 3, `${mode} media at ${alpha} on ${background}`);
      }
    }
  }
});

function onSurface(color, surface) {
  if (color.startsWith('#')) return color;
  const [r, g, b, alpha] = color.match(/[\d.]+/g).map(Number);
  const base = Number.parseInt(surface.slice(1), 16);
  return '#' + [r, g, b].map((channel, index) => Math.round(channel * alpha + ((base >> (16 - 8 * index)) & 255) * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

test('automatic_title_cover_text_is_readable_on_its_surface_in_both_themes', () => {
  for (const [mode, table] of Object.entries(tables)) {
    assert.ok(contrast(resolveValue(table, 'color.help-title-color'), resolveValue(table, 'color.help-hover')) >= 4.5, mode);
  }
});

test('syntax_and_comment_colors_keep_text_contrast_on_the_code_surface', () => {
  for (const [mode, table] of Object.entries(tables)) {
    const hex = name => resolveValue(table, name);
    const inline = onSurface(hex('color.prose-code-background'), hex('color.ui-card'));
    // 대비는 카드 면 위에 겹친 실제 색으로 잰다.
    const code = onSurface(hex('color.code-surface'), hex('color.ui-card'));
    assert.ok(contrast(onSurface(hex('color.code-ink'), code), code) >= 4.5, `${mode} code text on code surface`);
    assert.ok(contrast(onSurface(hex('color.prose-code-color'), inline), inline) >= 4.5, `${mode} inline code`);
    for (const role of ['color.code-ink', ...SYNTAX_ROLES.map(role => `color.syntax-${role}`)]) {
      assert.ok(contrast(onSurface(hex(role), code), code) >= mainMinimum(hex(role), 4.5), `${mode}.${role} on code surface ${code}`);
    }
    // 코드 블록과 인라인 코드는 같은 면을 쓴다(Things shared.css의 code·pre).
    // 강조 색은 정한 색만 쓴다: 메인 주황(키워드·형식), 구분색 파랑 글자(문자열), 구분색 회색 글자(주석). 숫자·상수·함수와 나머지는 기본 글자색이고 숫자·상수·함수는 굵기로 구분한다.
    // 라이트는 코드 블록과 인라인 코드가 같은 면이다. 다크 코드 블록은 주석 대비를 지키려고 깊은 면을 유지한다.
    if (mode === 'light') assert.equal(hex('color.code-surface'), hex('color.prose-code-background'), 'light code surface');
    else assert.equal(hex('color.code-surface'), '#1c1c1e', 'dark code surface');
    assert.equal(hex('color.syntax-keyword'), mode === 'light' ? '#ff6900' : '#ff8904', 'keyword');
    assert.equal(hex('color.syntax-type'), hex('color.syntax-keyword'), 'type');
    assert.equal(hex('color.syntax-string'), hex('color.category.blue.ink'), 'string');
    assert.equal(hex('color.syntax-comment'), hex('color.category.gray.ink'), 'comment palette');
    assert.notEqual(hex('color.syntax-comment'), hex('color.code-ink'), 'comment');
    for (const role of ['number', 'constant', 'function', 'property', 'parameter', 'variable', 'operator', 'punctuation', 'annotation']) assert.equal(hex(`color.syntax-${role}`), hex('color.code-ink'), role);
  }
  const prose = readFileSync(root + 'styles/prose.css', 'utf8');
  for (const role of ['number', 'constant', 'function']) assert.match(prose, new RegExp(`\\.app-syntax-${role} \\{[^}]*font-weight: var\\(--font-weight-bold\\)`), role);
});


// #180: 작은 탭 글자와 태그 기호는 실제 합성 면에서도 식별할 수 있어야 한다.
test('tab_and_tag_states_keep_text_and_selection_contrast_in_both_themes', () => {
  for (const [mode, table] of Object.entries(tables)) {
    const value = name => resolveValue(table, name);
    assert.ok(contrast(value('color.tag-ink'), value('color.tag-background')) >= mainMinimum(value('color.tag-ink'), 4.5), mode + ' default tag text');
    // 고른 태그는 선택 탭과 같은 Things 선택 면(accent-1 누름)이라 선택 탭과 같은 Things 값 예외를 따른다.
    assert.equal(value('color.tag-hover'), value('color.feature-tab-selected'), mode + ' selected tag matches selected tab');
    assert.ok(contrast(value('color.on-action'), value('color.tag-hover')) >= onThingsMinimum(value('color.on-action'), value('color.tag-hover'), 4.5), mode + ' tag text and clear symbol');
    assert.ok(contrast(value('color.tag-preview-ink'), value('color.tag-preview')) >= mainMinimum(value('color.tag-preview-ink'), 4.5), mode + ' tag preview text');
    assert.ok(contrast(value('color.tag-preview'), value('color.ui-card')) > contrast(value('color.tag-background'), value('color.ui-card')), mode + ' hovered tags remain more visible than default tags');
    assert.ok(contrast(value('color.tag-ink'), value('color.ui-card')) >= mainMinimum(value('color.tag-ink'), 4.5), mode + ' reset link text');
    assert.notEqual(value('color.tag-preview'), value('color.tag-hover'), mode + ' preview differs from selection');
    const selected = value('color.feature-tab-selected');
    const ink = value('color.feature-tab-ink');
    assert.ok(contrast(ink, selected) >= onThingsMinimum(ink, selected, 4.5), mode + ' selected tab text');
    // 기본 탭은 Things 기본 단추(회청 면, 진한 글자), 선택은 accent-1 누름 면(#3c84f3)에 흰 글자다.
    assert.ok(contrast(value('color.body'), value('color.ui-card')) >= 4.5, mode + ' tab text');
    // 선택 면 #3c84f3은 페이지 위 3.63:1(라이트)이다. 선택 상태는 회청 기본 면 대 파랑의 색상 차이로도 구분된다.
    const selectedMinimum = 3;
    assert.ok(contrast(selected, value('color.ui-card')) >= selectedMinimum, mode + ' selected tab on page');
    for (const base of ['color.ui-card', 'color.prose-pre-background']) {
      const gallery = onSurface(value('color.gallery-selected'), value(base));
      assert.ok(contrast(value('color.gallery-selected-ink'), gallery) >= 4.5, mode + ' selected number text');
      assert.ok(contrast(gallery, onSurface(value('color.gallery-background'), value(base))) >= 3, mode + ' selected number state');
      const channels = gallery.slice(1).match(/../g).map(channel => Number.parseInt(channel, 16));
      assert.ok(Math.max(...channels) - Math.min(...channels) <= 12, mode + ' selected numbers remain neutral');
      const track = onSurface(value('color.feature-tab-background'), value(base));
      // 같은 예외: Things 묶음 탭 바탕 rgba(0,25,61,.1) 위 선택 면 #3c84f3은 페이지 2.96:1, 옅은 면 2.77:1이다. 선택은 색상(파랑 대 회색)과 그림자로도 구분된다.
      assert.ok(contrast(selected, track) >= (THINGS_FIXED.has(selected) ? 2.75 : 3), mode + ' selected tab against ' + base);
      for (const state of ['color.button.surface', 'color.button.hover', 'color.button.active']) {
        const surface = onSurface(value(state), value(base));
        assert.ok(contrast(onSurface(value('color.button.ink'), surface), surface) >= 4.5, mode + ' unselected tab ' + state);
      }
    }
  }
});

test('component_contract_classes_exist_in_style_sources', () => {
  const doc = readFileSync(root + '../../docs/design/system/styles.md', 'utf8');
  const contract = doc.slice(doc.indexOf('## 구성 요소 계약'), doc.indexOf('### 강제하는 것'));
  const css = modules.map(file => readFileSync(root + file, 'utf8')).join('\n');
  const classes = [...new Set([...contract.matchAll(/\.(app-[\w-]+)/g)].map(match => match[1]))];
  assert.ok(classes.length >= 20);
  assert.deepEqual(classes.filter(name => !new RegExp(`\\.${name}(?![\\w-])`).test(css)), []);
});


test('playing_media_symbols_keep_contrast_on_default_hover_and_pressed_surfaces', () => {
  const css = readFileSync(root + 'styles/controls.css', 'utf8');
  const rule = /\.app-remote\.is-playing \[data-control-icon\] \{([^}]+)\}/.exec(css)?.[1];
  assert.ok(rule, 'custom-class control slots receive the same playing-state treatment');
  assert.match(rule, /color: var\(--color-control-playing-ink\)/);
  assert.doesNotMatch(rule, /opacity:/, 'the essential symbol is not faded with decorative logos');
  for (const [mode, table] of Object.entries(tables)) {
    const hex = name => resolveValue(table, name);
    const ink = hex('color.control-playing-ink');
    assert.ok(contrast(hex('icon.paper'), ink) >= 3, `${mode} pause bars on their circle`);
    const page = hex('color.ui-card');
    for (const [state, surface] of [['default', page], ['hover/pressed', onSurface(hex('color.control-active'), page)]]) {
      assert.ok(contrast(ink, surface) >= 3, `${mode} playing control on ${state} background`);
    }
  }
});

test('dark_help_card_text_is_readable_in_default_hover_and_active_states', () => {
  const table = tables.dark;
  for (const background of ['help-bg', 'help-hover', 'help-active', 'help-grouped-bg', 'related-background']) {
    for (const foreground of ['help-title-color', 'help-copy-color', 'body', 'document-nav-active-ink']) {
      assert.ok(contrast(resolveValue(table, `color.${foreground}`), resolveValue(table, `color.${background}`)) >= 4.5, `${foreground} on ${background}`);
    }
  }
});

// #184: 앱 도구와 중립 선택 면의 공개 소비 계약.
test('workspace_roles_keep_neutral_surfaces_readable_in_both_themes', () => {
  for (const [mode, table] of Object.entries(tables)) {
    for (const role of ['sidebar', 'document', 'toolbar', 'hover', 'selected']) {
      const surface = resolveValue(table, `color.workspace.${role}`);
      const channels = surface.slice(1).match(/../g).map(channel => Number.parseInt(channel, 16));
      assert.equal(new Set(channels).size, 1, `${mode} ${role} neutral surface`);
      assert.ok(contrast(resolveValue(table, 'color.ink'), surface) >= 4.5, `${mode} text on ${role}`);
    }
    assert.notEqual(resolveValue(table, 'color.workspace.document'), resolveValue(table, 'color.workspace.sidebar'));
    for (const [role, expected] of [['text.tool', '13px'], ['spacing.tool-icon', '16px'], ['spacing.tool-target', '28px'], ['spacing.toolbar', '40px']]) {
      assert.equal(resolveValue(table, role), expected, role);
    }
    assert.match(resolveValue(table, 'font.ui'), /system-ui/);
    assert.doesNotMatch(resolveValue(table, 'font.ui'), /Pretendard/);
  }
});

// 다크 미리보기에서 주의 상자·글머리 점·선택 탭 글자·입력 칸이 사라지지 않아야 한다.
test('warning_callout_list_marker_and_input_stay_readable_in_both_themes', () => {
  for (const [mode, table] of Object.entries(tables)) {
    const value = name => resolveValue(table, name);
    for (const base of ['color.ui-card', 'color.prose-pre-background']) {
      const page = value(base);
      assert.ok(contrast(onSurface(value('color.prose-marker'), page), page) >= 3, `${mode} list marker on ${base}`);
      const note = onSurface(value('color.prose-soft'), page);
      assert.ok(contrast(value('color.body'), note) >= 4.5, `${mode} callout text on ${base}`);
      const mark = onSurface(value('color.prose-mark-background'), page);
      assert.ok(contrast(value('color.body'), mark) >= 4.5, `${mode} marked text on ${base}`);
      const input = onSurface(value('color.input-background'), page);
      assert.ok(contrast(value('color.input-ink'), input) >= 4.5, `${mode} input text on ${base}`);
      assert.ok(contrast(value('color.input-placeholder'), input) >= 4.5, `${mode} input placeholder on ${base}`);
    }
    // 검색 입력(불투명 면)의 안내 문구. 라이트는 기존 화면 유지 조건(#9)이라 다크만 본문 수준 대비를 요구한다.
    if (mode === 'dark') assert.ok(contrast(value('color.input-field-placeholder'), value('color.search-bg')) >= 4.5, `${mode} search placeholder`);
    // 그림 문서·목록의 작은 링크(13px)는 본문 대비 기준.
    for (const base of ['color.ui-card', 'color.prose-pre-background']) assert.ok(contrast(value('color.ui.link'), value(base)) >= mainMinimum(value('color.ui.link'), 4.5), `${mode} link on ${base}`);
    // 다크는 밝은 선택 면 위의 어두운 글자이므로 본문 수준 이상의 대비를 둔다.
    assert.ok(contrast(value('color.feature-tab-ink'), value('color.feature-tab-selected')) >= onThingsMinimum(value('color.feature-tab-ink'), value('color.feature-tab-selected'), mode === 'dark' ? 7 : 4.5), `${mode} selected tab text stays clearly legible`);
    // 강한 단추(주요 단추)는 흰 굵은 글자다.
    assert.ok(contrast(value('color.button-primary-ink'), value('color.button-primary')) >= onThingsMinimum(value('color.button-primary-ink'), value('color.button-primary'), 4.5), `${mode} primary button text`);
    assert.ok(contrast(onSurface(value('color.button.ink'), onSurface(value('color.button.surface'), value('color.ui-card'))), onSurface(value('color.button.surface'), value('color.ui-card'))) >= 4.5, `${mode} default button text`);
  }
  // 형광펜 표시는 Things의 mark 값(라이트 #fcf9cf, 다크 rgba(255,214,3,.32))을 쓴다.
  assert.equal(resolveValue(tables.light, 'color.prose-mark-background'), '#fcf9cf', 'mark uses the Things highlight');
  assert.equal(resolveValue(tables.dark, 'color.prose-mark-background'), 'rgba(255,214,3,.32)', 'dark mark uses the Things highlight');
});

// 상태 안내: 옅은 상태 면 위 본문색 글자, 같은 아이콘 묶음의 상태색 아이콘. 테두리와 색 줄은 없다.
test('status_callouts_use_tinted_surfaces_body_text_and_colored_icons', () => {
  const expected = { light: { success: '#00c950', warning: '#ff6900', error: '#fb2c36' }, dark: { success: '#05df72', warning: '#ff8904', error: '#ff6467' } };
  for (const [mode, table] of Object.entries(tables)) {
    const value = name => resolveValue(table, name);
    for (const state of ['success', 'warning', 'error']) {
      const surface = value(`color.status.${state}.surface`);
      assert.equal(value(`color.status.${state}.ink`), expected[mode][state], `${mode} ${state} color`);
      assert.equal(value(`color.state.${state}`), expected[mode][state], `${mode} state role`);
      assert.ok(contrast(value('color.body'), surface) >= 4.5, `${mode} ${state} text`);
      assert.ok(contrast(value(`color.status.${state}.ink`), surface) >= mainMinimum(value(`color.status.${state}.ink`), 3), `${mode} ${state} icon`);
    }
  }
  assert.equal(resolveValue(tables.light, 'color.status.warning.ink'), resolveValue(tables.light, 'color.category.orange.ink'), 'warning shares the data orange family');
  const css = readFileSync(root + 'styles/prose.css', 'utf8');
  const callout = /\.app-callout \{([^}]*)\}/.exec(css)[1];
  assert.match(callout, /border: 0/);
  for (const state of ['success', 'warning', 'error']) assert.match(css, new RegExp(`\\.app-callout\\.is-${state} \\{[^}]*icons/actions/`));
});


// 코드·표·도표·접기는 같은 반경(Things 블록의 8)을 쓰고, 선이 있는 표·도표·접기는 Things 표 선 하나를 쓴다. 도표는 회색 면을 칠하지 않는다.
test('code_table_and_details_share_one_block_frame', () => {
  for (const table of Object.values(tables)) assert.equal(resolveValue(table, 'color.figure.canvas'), resolveValue(table, 'color.ui-card'));
  assert.equal(resolveValue(tables.light, 'radius.prose-block-radius'), '8px');
  assert.equal(resolveValue(tables.light, 'color.prose-block-line'), '#eceef0');
  const read = name => readFileSync(root + `styles/${name}`, 'utf8');
  const rule = (css, selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  assert.match(rule(read('prose.css'), '.app-code'), /border-radius: var\(--radius-prose-block-radius\)/);
  assert.match(rule(read('prose.css'), '.app-details'), /border: var\(--border-width-thin\) solid var\(--color-prose-block-line\);[^}]*border-radius: var\(--radius-prose-block-radius\)/);
  assert.match(rule(read('table.css'), '.app-table-scroll'), /border: var\(--border-width-thin\) solid var\(--color-prose-block-line\);\s*border-radius: var\(--radius-prose-block-radius\)/);
});

// Things shared.css의 code·pre 값: 반투명 면·선·글자, pre 안쪽 .4em .8em, 표 칸 .3em .5em과 머리 칸 면 없음.
test('inline_code_code_blocks_and_tables_use_things_source_values', () => {
  const light = name => resolveValue(tables.light, name);
  assert.equal(light('color.prose-code-background'), 'rgba(0,34,77,.05)');
  assert.equal(light('color.prose-code-border'), 'rgba(0,48,111,.04)');
  assert.equal(light('color.prose-code-color'), 'rgba(0,4,10,.69)');
  assert.equal(light('color.code-surface'), light('color.prose-code-background'));
  assert.equal(light('component.prose-pre-padding'), '.4em .8em');
  assert.equal(light('component.table-padding'), '.3em .5em');
  const prose = readFileSync(root + 'styles/prose.css', 'utf8');
  const table = readFileSync(root + 'styles/table.css', 'utf8');
  assert.match(prose, /\.app-code pre \{[^}]*padding: var\(--component-prose-pre-padding\)/);
  assert.match(table, /\.app-table :is\(th, td\) \{[^}]*padding: var\(--component-table-padding\)/);
  assert.match(table, /\.app-table th \{ font-weight: var\(--font-weight-bold\); \}/);
});

test('prose_images_open_in_one_viewer_and_close_on_click', () => {
  const runtime = readFileSync(root + 'ui/runtime/document.js', 'utf8');
  assert.match(runtime, /\.app-prose \.app-figure > img, \.app-prose p > img/);
  assert.match(runtime, /viewer\.addEventListener\('click', \(\) => viewer\.close\(\)\)/);
  assert.match(runtime, /showModal\(\)/);
  const css = readFileSync(root + 'styles/prose.css', 'utf8');
  assert.match(css, /\.app-prose img\[data-zoomable\] \{ cursor: zoom-in; \}/);
  assert.match(css, /\.app-image-viewer::backdrop \{ background: var\(--color-dialog-backdrop\); \}/);
});

// 사용자 결정: 본문 그림은 기본으로 모서리를 깎지 않고, rounded 옵션(img.is-rounded)만 코드 블록과 같은 곡률을 쓴다.
test('prose_figures_are_square_by_default_and_rounded_like_code_blocks_on_request', () => {
  const prose = readFileSync(root + 'styles/prose.css', 'utf8');
  assert.match(prose, /:is\(\.app-prose, \.app-figure-grid-item\) \.app-figure > :is\(img, a > img\) \{ border-radius: 0; \}/);
  assert.match(prose, /:is\(\.app-prose, \.app-figure-grid-item\) \.app-figure > :is\(img, a > img\)\.is-rounded \{ border-radius: var\(--radius-prose-block-radius\); \}/);
  assert.match(prose, /\.app-code \{[^}]*border-radius: var\(--radius-prose-block-radius\)/);
});
