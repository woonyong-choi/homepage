import mathPlugin from '@vscode/markdown-it-katex';
import MarkdownIt from 'markdown-it';
import deflist from 'markdown-it-deflist';
import footnote from 'markdown-it-footnote';

import { installDirectives } from './directives.js';
import { findMarkEnd } from './inline-marks.js';
import { installFences } from './ui-fences.js';

const BACKSLASH = String.fromCharCode(92);
const FENCE_MARKER = /^(`{3,}|~{3,})/;
const DETAILS_OPEN = /^<details(\s+open)?>\s*$/i;
const DETAILS_SUMMARY = /^<summary>([^<>\n]+)<\/summary>\s*$/i;
const DETAILS_CLOSE = /^<\/details>\s*$/i;
const TASK_MARKERS = Object.freeze([
  ['[ ] ', 'todo'],
  ['[x] ', 'done'],
  ['[X] ', 'done'],
  ['[~] ', 'cancelled'],
]);

export function createParser() {
  const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
    .use(footnote)
    .use(deflist)
    .use(mathPlugin.default ?? mathPlugin);
  installDirectives(md);
  md.inline.ruler.before('emphasis', 'highlight', markRule('::'));
  md.inline.ruler.before('emphasis', 'equals-highlight', markRule('=='));
  md.inline.ruler.before('emphasis', 'subscript', scriptRule('~', 'sub'));
  md.inline.ruler.before('emphasis', 'superscript', scriptRule('^', 'sup'));
  md.block.ruler.before('html_block', 'details', detailsBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.core.ruler.after('inline', 'task-items', taskItems);
  md.core.ruler.after('inline', 'standalone-figure', standaloneFigure);
  installFences(md);
  return md;
}

function markRule(marker) {
  return (state, silent) => {
    const start = state.pos;
    const end = findMarkEnd(state.src, start, marker);
    if (end < 0) return false;
    if (!silent)
      pushWrapped(
        state,
        'mark_open',
        'mark',
        state.src.slice(start + marker.length, end),
        start + marker.length,
      );
    state.pos = end + marker.length;
    return true;
  };
}

function pushWrapped(state, openType, tag, inner, innerStart) {
  state.push(openType, tag, 1);
  const children = [];
  try {
    state.md.inline.parse(inner, state.md, state.env, children);
  } catch (error) {
    if (typeof error?.offset === 'number') error.offset += innerStart;
    throw error;
  }
  state.tokens.push(...children);
  state.push(openType.replace(/_open$/, '_close'), tag, -1);
}

function scriptRule(marker, tag) {
  return (state, silent) => {
    const { src, pos: start } = state;
    if (src[start] !== marker || src[start + 1] === marker || src[start + 1] === '[') return false;
    let end = start + 1;
    while (end < src.length && src[end] !== marker) {
      if (/\s/.test(src[end])) return false;
      end += src[end] === BACKSLASH ? 2 : 1;
    }
    if (end >= src.length || end === start + 1) return false;
    if (!silent) pushWrapped(state, `${tag}_open`, tag, src.slice(start + 1, end), start + 1);
    state.pos = end + 1;
    return true;
  };
}

const textOf = (state, index) =>
  state.src.slice(state.bMarks[index] + state.tShift[index], state.eMarks[index]);

function findDetailsClose(state, startLine, endLine) {
  const scan = { depth: 1, fence: null };
  for (let close = startLine + 1; close < endLine; close += 1) {
    if (scanDetailsLine(state, close, scan)) return close;
  }
  return endLine;
}

function scanDetailsLine(state, line, scan) {
  const text = textOf(state, line);
  const indented = state.sCount[line] - state.blkIndent >= 4;
  const marker = indented ? undefined : FENCE_MARKER.exec(text)?.[1];
  if (scan.fence) {
    const closes = marker && marker[0] === scan.fence[0] && marker.length >= scan.fence.length;
    if (closes && text.slice(marker.length).trim() === '') scan.fence = null;
    return false;
  }
  if (indented) return false;
  if (marker) {
    scan.fence = marker;
  } else if (DETAILS_OPEN.test(text)) {
    scan.depth += 1;
  } else if (DETAILS_CLOSE.test(text)) {
    scan.depth -= 1;
  }
  return scan.depth === 0;
}

function detailsBlock(state, startLine, endLine, silent) {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const opening = DETAILS_OPEN.exec(textOf(state, startLine));
  if (!opening) return false;
  const close = findDetailsClose(state, startLine, endLine);
  if (close >= endLine) return false;
  if (silent) return true;
  const summary = DETAILS_SUMMARY.exec(textOf(state, startLine + 1));
  const open = state.push('details_open', 'details', 1);
  open.map = [startLine, close];
  if (opening[1]) open.attrSet('open', '');
  if (summary) {
    state.push('summary_open', 'summary', 1);
    const inline = state.push('inline', '', 0);
    inline.content = summary[1].trim();
    inline.children = [];
    inline.map = [startLine + 1, startLine + 2];
    state.push('summary_close', 'summary', -1);
  }
  const [oldMax, oldParent] = [state.lineMax, state.parentType];
  state.parentType = 'details';
  state.lineMax = close;
  state.md.block.tokenize(state, startLine + (summary ? 2 : 1), close);
  state.lineMax = oldMax;
  state.parentType = oldParent;
  state.push('details_close', 'details', -1);
  state.line = close + 1;
  return true;
}

function taskStateOf(content) {
  return TASK_MARKERS.find(([marker]) => content.startsWith(marker))?.[1];
}

const isTaskItem = (tokens, index) =>
  tokens[index].type === 'inline' &&
  tokens[index - 1].type === 'paragraph_open' &&
  tokens[index - 2].type === 'list_item_open';

function taskItems(state) {
  const { tokens } = state;
  for (let index = 2; index < tokens.length; index += 1) {
    if (!isTaskItem(tokens, index)) continue;
    const task = taskStateOf(tokens[index].content);
    if (task === undefined) continue;
    markTaskItem(state, tokens, index, task);
  }
}

function unlinkMarker(state, inline) {
  const [open, label, close, next] = inline.children;
  const linked =
    open?.type === 'link_open' &&
    label?.type === 'text' &&
    close?.type === 'link_close' &&
    inline.content.startsWith(`[${label.content}] `);
  if (!linked) return;
  const text = newToken(state, 'text', 0);
  text.content = `[${label.content}]`;
  if (next?.type === 'text') {
    next.content = text.content + next.content;
    inline.children.splice(0, 3);
  } else {
    inline.children.splice(0, 3, text);
  }
}

function markTaskItem(state, tokens, index, task) {
  const inline = tokens[index];
  const item = tokens[index - 2];
  unlinkMarker(state, inline);
  if (inline.children[0]?.type !== 'text') return;
  item.meta = { task };
  if (task === 'cancelled') {
    inline.content = inline.content.slice(4);
    inline.children[0].content = inline.children[0].content.slice(4);
    inline.children.unshift(newToken(state, 'task_cancelled', 0));
    return;
  }
  inline.content = inline.content.slice(3);
  inline.children[0].content = inline.children[0].content.slice(3);
  const checkbox = newToken(state, 'task_checkbox', 0);
  checkbox.meta = { checked: task === 'done' };
  inline.children.unshift(newToken(state, 'task_label_open', 1), checkbox);
  inline.children.push(newToken(state, 'task_label_close', -1));
  const parent = findParentList(tokens, index - 2);
  if (parent >= 0) tokens[parent].meta = { ...tokens[parent].meta, containsTask: true };
}

function newToken(state, type, nesting) {
  return new state.Token(type, '', nesting);
}

function findParentList(tokens, index) {
  const level = tokens[index].level - 1;
  for (let at = index - 1; at >= 0; at -= 1) {
    if (tokens[at].level === level) return at;
  }
  return -1;
}

function standaloneFigure(state) {
  if (state.env.nested) return;
  const { tokens } = state;
  for (let index = 0; index + 2 < tokens.length; index += 1) {
    const [open, inline, close] = [tokens[index], tokens[index + 1], tokens[index + 2]];
    const standalone =
      open.type === 'paragraph_open' &&
      open.level === 0 &&
      !open.hidden &&
      inline.type === 'inline' &&
      close.type === 'paragraph_close';
    if (!standalone) continue;
    const kinds = inline.children.map((child) => child.type).join();
    if (kinds === 'image' || kinds === 'link_open,image,link_close') {
      open.meta = { role: 'figure' };
      close.meta = { role: 'figure' };
    }
  }
}
