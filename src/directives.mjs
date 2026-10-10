// markdown-it에 `:::` 블록과 `:이름[글]{속성}` 인라인 표기를 더한다. 정의는 directive-blocks.mjs에 있다.
import { BLOCKS, INLINES } from './directive-blocks.mjs';
import { DirectiveError, MAX_DEPTH, attributeEnd, classifyLine, parseLabel, parseOptions, parseTabLine, parseTabOptions } from './directive-syntax.mjs';

// 목록이나 인용 안에서는 닫는 줄의 위치를 들여쓰기로 판단할 수 없어 쓰지 못한다.
const PARENT_TYPES = new Set(['root', 'directive', 'details']);
const KIND_NAMES = { paragraph: '문단', bullet_list: '목록', ordered_list: '순서 목록', dl: '정의 목록' };
const INLINE_START = /^:([a-z]+)\[([^\]\n]+)\]/;

const lineAt = (state, index) => state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);
const childKey = token => token.type.startsWith('directive') ? `directive:${token.meta.name}` : token.type.replace(/_open$/, '');
const describe = key => key.startsWith('directive:') ? `:::${key.slice(10)}` : KIND_NAMES[key] ?? key;
const failer = (env, line, name) => (message, at = line, who = name) => { throw new DirectiveError(message, { page: env.pageId, line: at, name: who }); };

export function installDirectives(md, kit) {
  const checks = {
    asset: value => !/^[\w.-]+$/.test(value) ? '파일 이름만 쓸 수 있습니다' : kit.assetExists(value) ? '' : `없는 자산입니다: ${value}`,
    url: value => { try { kit.safeUrl(value); return ''; } catch { return 'https://, mailto:, /로 시작하는 사이트 경로, #만 쓸 수 있습니다'; } },
    icon: value => { try { kit.contentIcon(value, 'small'); return ''; } catch { return `없는 아이콘입니다: ${value}`; } },
  };
  const helpers = env => ({ ...kit, nextId: () => `component-${env.pageId ?? 'page'}-${env.componentCount = (env.componentCount ?? 0) + 1}` });

  // 다음 비어 있지 않은 줄의 글자. 없으면 빈 문자열이다.
  function nextContent(state, from, end) {
    for (let at = from; at < end; at += 1) { const text = lineAt(state, at); if (text.trim()) return text; }
    return '';
  }
  // tabs와 platform은 공백 옵션이나 다음 @tab 줄로 새 문법을 판별한다.
  const isTabsForm = (state, at, end, line) => line.kind === 'open' && ['tabs', 'platform'].includes(line.name) && line.colons === 3 && (line.flat || parseTabLine(nextContent(state, at + 1, end)) !== null);

  // 여는 줄에서 닫는 줄을 찾는다. 코드 펜스 안의 줄은 건너뛰고, 열린 블록은 스택으로 짝을 맞춘다.
  // 탭 묶음 바로 아래의 @tab 줄 위치도 돌려준다. :::end는 가장 안쪽 블록을 닫는다.
  function findClose(state, start, end, opener, fail) {
    const stack = [{ ...opener, line: start + 1 }];
    const marks = [];
    let fence = null;
    for (let at = start + 1; at < end; at += 1) {
      const text = lineAt(state, at);
      const marker = /^(`{3,}|~{3,})/.exec(text)?.[1];
      if (fence) {
        if (marker && marker[0] === fence[0] && marker.length >= fence.length && text.slice(marker.length).trim() === '') fence = null;
        continue;
      }
      if (state.sCount[at] - state.blkIndent >= 4) continue;
      if (marker) { fence = marker; continue; }
      if (stack.length === 1 && opener.closer === 'end') {
        const tab = parseTabLine(text);
        if (tab) { marks.push({ line: at, label: tab.label }); continue; }
      }
      const line = classifyLine(text);
      if (line.kind === 'invalid') fail('블록 줄 형식이 잘못되었습니다. :::이름 옵션 또는 닫는 :::end를 쓰세요', at + 1, line.name);
      if (line.kind === 'open') stack.push({ ...line, closer: isTabsForm(state, at, end, line) ? 'end' : 'bare', line: at + 1 });
      else if (line.kind === 'end') {
        const top = stack.at(-1);
        stack.pop();
        if (!stack.length) return { close: at, marks };
      } else if (line.kind === 'close') {
        const top = stack.at(-1);
        if (top.closer === 'end') fail(`${top.line}줄의 :tabs 묶음은 :::end 로 닫아야 합니다`, at + 1, top.name);
        if (line.colons !== top.colons) fail(`닫는 줄의 콜론 수(${line.colons})가 ${top.line}줄의 :${top.name} 여는 줄(${top.colons})과 다릅니다`, at + 1, top.name);
        stack.pop();
        if (!stack.length) return { close: at, marks };
      }
    }
    const top = stack.at(-1);
    return fail(top.closer === 'end' ? `닫는 :::end 줄이 없습니다` : `닫는 ${':'.repeat(top.colons)} 줄이 없습니다`, top.line, top.name);
  }

  // `@tab` 줄로 나뉜 탭 묶음을 같은 탭 토큰(directive_open/close)으로 바꾼다. 출력은 정의표의 tabs·tab과 테마의 Tabs가 만든다.
  function tabsBlock(state, startLine, endLine, found, fail) {
    if (!PARENT_TYPES.has(state.parentType)) fail('목록이나 인용 안에서는 블록을 쓸 수 없습니다');
    const stack = state.env.directiveStack ??= [];
    const parent = stack.at(-1)?.name ?? 'root';
    if (stack.length >= MAX_DEPTH) fail(`블록 중첩은 ${MAX_DEPTH}단계까지 쓸 수 있습니다`);
    if (!BLOCKS[found.name].within.includes(parent)) fail(`${parent === 'root' ? '문서 바로 아래' : `:::${parent} 안`}에서는 쓸 수 없습니다. 쓸 수 있는 곳: 문서 바로 아래`);
    // 쓰지 않은 옵션은 테마 Tabs의 기본값(frame none, position bottom, selector buttons, width content)이다.
    const options = parseTabOptions(found.source ?? '', fail);
    const { close, marks } = findClose(state, startLine, endLine, { ...found, closer: 'end' }, fail);
    if (!marks.length) fail('@tab 줄이 하나도 없습니다. 예: @tab 변경 전');
    for (let at = startLine + 1; at < marks[0].line; at += 1) if (lineAt(state, at).trim()) fail('첫 @tab 줄 앞에는 본문을 둘 수 없습니다', at + 1);
    const numbers = options.selector === 'numbers';
    const seen = new Set();
    const labels = marks.map(mark => {
      const label = mark.label === undefined ? undefined : parseLabel(mark.label, (message) => fail(message, mark.line + 1));
      if (label === undefined) {
        if (!numbers) fail('@tab 라벨이 필요합니다. 예: @tab 변경 전 (라벨을 생략할 수 있는 것은 numbers뿐입니다)', mark.line + 1);
        return undefined;
      }
      if (seen.has(label.toLowerCase())) fail(`탭 이름이 겹칩니다: ${label}`, mark.line + 1);
      seen.add(label.toLowerCase());
      return label;
    });
    const meta = { name: found.name, label: parseLabel(found.label, fail), attrs: {}, options, tabs: labels, id: helpers(state.env).nextId() };
    const open = state.push('directive_open', '', 1);
    Object.assign(open, { meta, block: true, map: [startLine, close] });
    const [oldMax, oldParent] = [state.lineMax, state.parentType];
    stack.push({ name: found.name });
    state.parentType = 'directive';
    try {
      marks.forEach((mark, index) => {
        const stop = index + 1 < marks.length ? marks[index + 1].line : close;
        if (!Array.from({ length: stop - mark.line - 1 }, (_, at) => lineAt(state, mark.line + 1 + at)).some(text => text.trim())) fail('탭 본문이 비었습니다', mark.line + 1);
        const tabMeta = { name: 'tab', label: labels[index], attrs: {}, group: meta.id, index };
        const tabOpen = state.push('directive_open', '', 1);
        Object.assign(tabOpen, { meta: tabMeta, block: true, map: [mark.line, stop] });
        stack.push({ name: 'tab' });
        state.lineMax = stop;
        try { state.md.block.tokenize(state, mark.line + 1, stop); } finally { stack.pop(); }
        Object.assign(state.push('directive_close', '', -1), { meta: tabMeta, block: true });
      });
    } finally {
      state.lineMax = oldMax;
      state.parentType = oldParent;
      stack.pop();
    }
    Object.assign(state.push('directive_close', '', -1), { meta, block: true });
    state.line = close + 1;
    return true;
  }

  function checkBody(spec, children, fail) {
    const { only, except, min } = spec.body;
    if (min && !children.length) fail('본문이 비었습니다');
    for (const child of children) {
      const key = childKey(child);
      const line = (child.map?.[0] ?? 0) + 1;
      if (only && !only.includes(key)) fail(`여기에는 ${only.map(describe).join(', ')}만 둘 수 있습니다. ${describe(key)}는 쓸 수 없습니다`, line);
      if (except?.some(prefix => key === prefix || key.startsWith(`${prefix}:`))) fail(`여기에는 ${describe(key)}를 둘 수 없습니다`, line);
    }
  }

  function block(state, startLine, endLine, silent) {
    if (state.sCount[startLine] - state.blkIndent >= 4) return false;
    const found = classifyLine(lineAt(state, startLine));
    if (found.kind === 'text') return false;
    if (silent) return found.kind === 'open' || found.kind === 'leaf';
    const fail = failer(state.env, startLine + 1, found.name);
    if (found.kind === 'end') fail('여는 블록 없이 :::end 가 있습니다');
    if (isTabsForm(state, startLine, endLine, found)) return tabsBlock(state, startLine, endLine, found, fail);
    if (found.kind === 'close') fail('여는 줄 없이 닫는 줄이 있습니다');
    if (found.kind === 'invalid') fail('블록 줄 형식이 잘못되었습니다. :::이름 옵션 또는 닫는 :::end를 쓰세요');
    if (!PARENT_TYPES.has(state.parentType)) fail('목록이나 인용 안에서는 블록을 쓸 수 없습니다');
    const spec = Object.hasOwn(BLOCKS, found.name) ? BLOCKS[found.name] : null;
    if (found.kind === 'leaf' && found.flat && lineAt(state, startLine).endsWith('::')) return false;
    if (!spec) fail(`알 수 없는 블록입니다. 사용할 수 있는 이름: ${Object.keys(BLOCKS).join(', ')}`);
    if ((found.kind === 'leaf') !== Boolean(spec.leaf)) fail(spec.leaf ? '본문이 없는 블록입니다. ::이름 옵션 한 줄로 쓰세요' : '본문이 있는 블록입니다. :::이름 … :::end 로 쓰세요');
    const stack = state.env.directiveStack ??= [];
    const parent = stack.at(-1)?.name ?? 'root';
    if (!spec.leaf && stack.length >= MAX_DEPTH) fail(`블록 중첩은 ${MAX_DEPTH}단계까지 쓸 수 있습니다`);
    if (!spec.within.includes(parent)) fail(`${parent === 'root' ? '문서 바로 아래' : `:::${parent} 안`}에서는 쓸 수 없습니다. 쓸 수 있는 곳: ${spec.within.map(name => name === 'root' ? '문서 바로 아래' : `:::${name}`).join(', ')}`);
    const label = parseLabel(found.label, fail);
    if (spec.label === 'none' && label !== undefined) fail('라벨을 받지 않는 블록입니다');
    if (spec.label === 'required' && label === undefined) fail('라벨이 필요합니다. 예: :::tab[macOS]');
    const attrs = parseOptions(found.source, spec.attrs, fail, checks);
    try { spec.check?.(attrs, kit); } catch (error) { fail(error.message); }
    const meta = { name: found.name, label, attrs };
    if (spec.leaf) {
      const token = state.push('directive', '', 0);
      Object.assign(token, { meta, block: true, map: [startLine, startLine + 1] });
      state.line = startLine + 1;
      return true;
    }
    const { close } = findClose(state, startLine, endLine, { ...found, closer: 'bare' }, fail);
    const open = state.push('directive_open', '', 1);
    Object.assign(open, { meta, block: true, map: [startLine, close] });
    const first = state.tokens.length;
    const [oldMax, oldParent] = [state.lineMax, state.parentType];
    stack.push({ name: found.name });
    state.parentType = 'directive';
    state.lineMax = close;
    try {
      state.md.block.tokenize(state, startLine + 1, close);
    } finally {
      state.lineMax = oldMax;
      state.parentType = oldParent;
      stack.pop();
    }
    const children = state.tokens.slice(first).filter(token => token.level === open.level + 1 && token.nesting !== -1);
    checkBody(spec, children, fail);
    spec.prepare?.(meta, children, { fail, nextId: helpers(state.env).nextId, ui: kit.ui });
    Object.assign(state.push('directive_close', '', -1), { meta, block: true });
    state.line = close + 1;
    return true;
  }

  function inline(state, silent) {
    if (state.src.charCodeAt(state.pos) !== 0x3A) return false;
    const match = INLINE_START.exec(state.src.slice(state.pos));
    if (!match || !Object.hasOwn(INLINES, match[1])) return false;
    const [name, label] = [match[1], match[2]];
    const spec = INLINES[name];
    const fail = failer(state.env, undefined, name);
    let end = state.pos + match[0].length;
    let attrs = Object.create(null);
    if (Object.keys(spec.attrs).length) {
      let source = '';
      if (state.src[end] === '{') {
        const close = attributeEnd(state.src, end);
        if (close < 0) fail('{ 속성이 닫히지 않았습니다');
        source = state.src.slice(end + 1, close - 1);
        end = close;
      }
      attrs = parseOptions(source, spec.attrs, fail, checks);
    }
    if (spec.label === 'icon' && checks.icon(label)) fail(checks.icon(label));
    if (!silent) state.push('html_inline', '', 0).content = spec.render(label, attrs, helpers(state.env));
    state.pos = end;
    return true;
  }

  md.block.ruler.before('fence', 'directive', block, { alt: ['paragraph', 'reference', 'blockquote', 'list'] });
  md.inline.ruler.before('emphasis', 'interface-label', inline);
  // 인라인 오류에 줄 번호를 붙이기 위해 기본 inline 규칙을 같은 동작에 오류 변환만 더해 바꾼다.
  md.core.ruler.at('inline', (state) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline') continue;
      try {
        state.md.inline.parse(token.content, state.md, state.env, token.children);
      } catch (error) {
        if (!(error instanceof DirectiveError) || error.line || !token.map) throw error;
        throw new DirectiveError(error.detail, { page: error.page, line: token.map[0] + 1, name: error.directive });
      }
    }
  });
  const render = (tokens, index, options, env) => {
    const { meta } = tokens[index];
    const spec = BLOCKS[meta.name];
    const kind = tokens[index].type;
    return (kind === 'directive_open' ? spec.open : kind === 'directive_close' ? spec.close : spec.render)(meta, helpers(env));
  };
  for (const type of ['directive_open', 'directive_close', 'directive']) md.renderer.rules[type] = render;
}
