// 인터뷰 카드를 만든다. 예시 항목은 미리보기에서만 공개 대상이다.
import { escape } from './markdown.mjs';
import { QuoteCard, trusted } from './vendor/theme/ui/index.mjs';

// summary는 글자와 [라벨](주소) 링크만 읽는다. HTML, 이미지, 강조 같은 다른 문법은 쓰지 않는다.
// 라벨 안의 \[ \] \\ 는 글자 그대로이고 @ 도 그냥 글자다. 주소를 추정하지 않는다.
const LINK = /(?<!\\)\[((?:\\.|[^\]\\])+)\]\(([^()\s]+)\)/g;
const literal = value => value.replace(/\\([\\[\]])/g, '$1');

export function summaryParts(summary) {
  const parts = [];
  let last = 0;
  for (const match of summary.matchAll(LINK)) {
    if (match.index > last) parts.push({ text: summary.slice(last, match.index) });
    parts.push({ label: literal(match[1]), url: match[2] });
    last = match.index + match[0].length;
  }
  if (last < summary.length) parts.push({ text: summary.slice(last) });
  return parts.map(part => part.text === undefined ? part : { text: literal(part.text) });
}

// 설정 검증이 잘못된 주소를 막지만 예시 데이터처럼 검증을 거치지 않은 값도 같은 규칙으로 걸러 글자로만 보인다.
function summaryHtml(summary, href) {
  return summaryParts(summary).map(part => {
    if (part.text !== undefined) return escape(part.text);
    try { return `<a href="${escape(href(part.url, 'summary'))}">${escape(part.label)}</a>`; } catch { return escape(part.label); }
  }).join('');
}

export function publicInterviews(entries, preview = false) {
  return entries.filter(entry => preview || !entry.example);
}

// 공개 여부와 안전한 요약 해석을 끝낸 데이터만 공유 카드에 전달한다.
export function interviewCards(entries, href) {
  return entries.map(entry => String(QuoteCard({ profile: entry.profile, href: entry.url, label: [entry.profile?.title, entry.profile?.subtitle, '인터뷰 보기'].filter(Boolean).join(' '), content: trusted(summaryHtml(entry.summary, href)) }))).join('');
}
