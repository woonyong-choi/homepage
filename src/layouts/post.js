import { dateLabel } from '../lib/format.js';
import { escape } from '#design/ui/index.js';
import * as ui from '#design/ui/index.js';

export const feedLevels = level => Math.min(6, level + 1);
export const detailLevels = level => Math.max(2, level);

export function shiftHeadings(html, levels) {
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/g, (_, end, level, attrs) => {
    const next = levels(Number(level));
    const marker = end || /\sclass="/.test(attrs) ? '' : ` class="app-heading-${level}"`;
    return `<${end}h${next}${marker}${attrs}>`;
  });
}

export function postArticle(post, { detail = false, tags = '', footer = '', after = '', byline } = {}) {
  return String(ui.PostArticle({ id: `post-${post.id}`, detail, href: post.route, title: post.title, date: post.publishedAt, dateLabel: dateLabel(post.publishedAt), cover: post.thumbnail ? ui.trusted(thumbnailImage(post, detail)) : undefined, lead: ui.trusted(post.leadHtml ?? escape(post.description)), tags: ui.trusted(tags), body: ui.trusted(shiftHeadings(post.html, detail ? detailLevels : feedLevels)), footer: ui.trusted(footer), after: ui.trusted(after), byline }));
}

export function thumbnailImage(page, eager = false) {
  if (!page.thumbnail) return '';
  const position = page.thumbnail.position;
  const crop = position ? ` style="object-position:${position.x}% ${position.y}%"` : '';
  return `<img src="${escape(page.thumbnail.src)}" alt="${escape(page.thumbnail.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${crop}>`;
}
