import { escape } from '#design/ui/index.js';
import { QuoteCard, trusted } from '#design/ui/index.js';

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

function summaryHtml(summary, href) {
  return summaryParts(summary).map(part => {
    if (part.text !== undefined) return escape(part.text);
    try { return `<a href="${escape(href(part.url, 'summary'))}">${escape(part.label)}</a>`; } catch { return escape(part.label); }
  }).join('');
}

export function publicInterviews(entries, preview = false) {
  return entries.filter(entry => preview || !entry.example);
}

export function interviewCards(entries, href) {
  return entries.map(entry => String(QuoteCard({ profile: entry.profile, href: entry.url, label: [entry.profile?.title, entry.profile?.subtitle, '인터뷰 보기'].filter(Boolean).join(' '), content: trusted(summaryHtml(entry.summary, href)) }))).join('');
}
