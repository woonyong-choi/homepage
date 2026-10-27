// 글 요약 규칙. 요약은 본문의 첫 문단 글자이고, 본문 맨 앞 문단이 요약과 같으면 글 머리로 옮긴다.
// 사이트 빌드와 관리자 작성 화면이 같은 해석 토큰으로 같은 규칙을 쓴다. 브라우저에서도 돌도록 Node 모듈을 쓰지 않는다.
export const SUMMARY_LIMIT = 150;
const FORMATTING = new Set(['em_open', 'em_close', 'strong_open', 'strong_close', 's_open', 's_close', 'link_open', 'link_close', 'mark_open', 'mark_close', 'footnote_ref']);

export const normalize = text => text.normalize('NFC').replace(/\s+/gu, ' ').trim();

// 강조·링크만 있는 문단의 보이는 글자. 그림·코드 블록처럼 글자로 줄일 수 없는 내용이 있으면 null이다.
export function visibleText(children) {
  let value = '';
  for (const token of children) {
    if (token.type === 'text' || token.type === 'code_inline') value += token.content;
    else if (token.type === 'softbreak' || token.type === 'hardbreak') value += ' ';
    else if (!FORMATTING.has(token.type)) return null;
  }
  return value;
}

// 본문의 글자 문단(인용·목록 안 포함)을 차례대로 돌려준다.
function* paragraphTexts(tokens) {
  for (let index = 0; index + 2 < tokens.length; index++) {
    if (tokens[index].type !== 'paragraph_open' || tokens[index + 1].type !== 'inline') continue;
    const text = visibleText(tokens[index + 1].children ?? []);
    if (text !== null && normalize(text)) yield normalize(text);
  }
}

/** 본문의 첫 글자 문단을 요약 길이로 줄인다. 글자 문단이 없으면 제목을 쓴다. */
export function summaryOf(tokens, title) {
  const [first] = paragraphTexts(tokens);
  if (!first) return normalize(title ?? '');
  return first.length > SUMMARY_LIMIT ? `${first.slice(0, SUMMARY_LIMIT - 1).trimEnd()}…` : first;
}

/**
 * 글 머리 결정. 본문이 요약과 같은 문단으로 시작하면 그 문단을 머리로 옮기고(lead), 요약이 제목이거나 본문 다른 곳에 이미 있으면
 * 머리를 비운다(empty). 그 밖에는 요약 글자를 머리에 둔다(summary).
 */
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

/**
 * 요약을 본문 첫 문단으로 옮긴 본문. 따로 써 둔 요약이 본문에 없으면 본문 맨 앞 문단으로 넣어,
 * 요약을 본문 첫 문단에서 만드는 규칙으로 다시 저장해도 같은 요약과 글 머리가 유지되게 한다.
 */
export function bodyWithSummary(body, tokens, description, title) {
  const summary = normalize(description ?? '');
  if (!summary || splitLead(tokens, summary, title).kind !== 'summary') return body;
  return `${summary}\n\n${body.replace(/^\s*\n/, '')}`;
}
