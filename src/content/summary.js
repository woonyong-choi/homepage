export const SUMMARY_LIMIT = 150;
const FORMATTING = new Set(['em_open', 'em_close', 'strong_open', 'strong_close', 's_open', 's_close', 'link_open', 'link_close', 'mark_open', 'mark_close', 'footnote_ref']);

export const normalize = text => text.normalize('NFC').replace(/\s+/gu, ' ').trim();

export function visibleText(children) {
  let value = '';
  for (const token of children) {
    if (token.type === 'text' || token.type === 'code_inline') value += token.content;
    else if (token.type === 'softbreak' || token.type === 'hardbreak') value += ' ';
    else if (!FORMATTING.has(token.type)) return null;
  }
  return value;
}

function* paragraphTexts(tokens) {
  for (let index = 0; index + 2 < tokens.length; index++) {
    if (tokens[index].type !== 'paragraph_open' || tokens[index + 1].type !== 'inline') continue;
    const text = visibleText(tokens[index + 1].children ?? []);
    if (text !== null && normalize(text)) yield normalize(text);
  }
}

export function summaryOf(tokens, title) {
  const [first] = paragraphTexts(tokens);
  if (!first) return normalize(title ?? '');
  return first.length > SUMMARY_LIMIT ? `${first.slice(0, SUMMARY_LIMIT - 1).trimEnd()}…` : first;
}

export function splitLead(tokens, description, title) {
  const summary = normalize(description);
  if (tokens[0]?.type === 'paragraph_open' && tokens[1]?.type === 'inline' && tokens[2]?.type === 'paragraph_close') {
    const plain = visibleText(tokens[1].children ?? []);
    if (normalize(tokens[1].content) === summary || (plain !== null && normalize(plain) === summary)) return { kind: 'lead', lead: [tokens[1]], tokens: tokens.slice(3) };
  }
  const prefix = summary.replace(/…$/u, '');
  if (!summary || summary === normalize(title ?? '') || [...paragraphTexts(tokens)].some(text => text.startsWith(prefix))) return { kind: 'empty', tokens };
  return { kind: 'summary', tokens };
}
