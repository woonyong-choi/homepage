// 소개와 같은 첫 문단만 옮기며 링크·각주·강조를 그대로 보존한다.
import { escape } from './markdown.mjs';

const normalize = text => text.normalize('NFC').replace(/\s+/gu, ' ').trim();
const formatting = new Set(['em_open', 'em_close', 'strong_open', 'strong_close', 's_open', 's_close', 'link_open', 'link_close', 'mark_open', 'mark_close', 'footnote_ref']);

function visibleText(tokens) {
  let value = '';
  for (const token of tokens) {
    if (token.type === 'text' || token.type === 'code_inline') value += token.content;
    else if (token.type === 'softbreak' || token.type === 'hardbreak') value += ' ';
    else if (!formatting.has(token.type)) return null;
  }
  return value;
}

export function renderArticle(md, page) {
  const env = { pageId: page.id, docId: page.id };
  const tokens = md.parse(page.body, env);
  let leadHtml = escape(page.description);
  if (tokens[0]?.type === 'paragraph_open' && tokens[1]?.type === 'inline' && tokens[2]?.type === 'paragraph_close') {
    const first = tokens[1];
    const plain = visibleText(first.children);
    if (normalize(first.content) === normalize(page.description) || (plain !== null && normalize(plain) === normalize(page.description))) {
      leadHtml = md.renderer.renderInline(first.children, md.options, env);
      tokens.splice(0, 3);
    }
  }
  const html = md.renderer.render(tokens, md.options, env);
  return { html, leadHtml, headings: env.headings ?? [] };
}
