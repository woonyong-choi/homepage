// 블로그 피드와 상세가 같은 글 구조(날짜, 제목, 도입문, 본문, 꼬리말)를 쓰도록 문자열 조각만 조립한다.
import { escape, imageSize } from './markdown.mjs';
import * as ui from './vendor/theme/ui/index.mjs';

// 본문 제목의 태그 단계를 문서 안의 위치에 맞춰 옮긴다. 원래 단계는 app-heading-N 클래스로 남는다.
export const feedLevels = level => Math.min(6, level + 1);
export const detailLevels = level => Math.max(2, level);

export function shiftHeadings(html, levels) {
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/g, (_, end, level, attrs) => {
    const next = levels(Number(level));
    const marker = end || /\sclass="/.test(attrs) ? '' : ` class="app-heading-${level}"`;
    return `<${end}h${next}${marker}${attrs}>`;
  });
}

export function postArticle(post, { detail = false, tags = '', footer = '', after = '' } = {}) {
  const dateLabel = post.publishedAt ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(post.publishedAt)) : undefined;
  return String(ui.PostArticle({ id: `post-${post.id}`, detail, href: post.route, title: post.title, date: post.publishedAt, dateLabel, cover: post.thumbnail ? ui.trusted(thumbnailImage(post, detail)) : undefined, lead: ui.trusted(post.leadHtml ?? escape(post.description)), tags: ui.trusted(tags), body: ui.trusted(shiftHeadings(post.html, detail ? detailLevels : feedLevels)), footer: ui.trusted(footer), after: ui.trusted(after) }));
}

export function thumbnailImage(page, eager = false) {
  if (!page.thumbnail) return '';
  const size = imageSize(page.thumbnail.src);
  const dimensions = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  const position = page.thumbnail.position;
  const crop = position ? ` style="object-position:${position.x}% ${position.y}%"` : '';
  return `<img src="${escape(page.thumbnail.src)}" alt="${escape(page.thumbnail.alt)}"${dimensions} loading="${eager ? 'eager' : 'lazy'}" decoding="async"${crop}>`;
}
