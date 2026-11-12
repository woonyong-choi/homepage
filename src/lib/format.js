export { isDocumentId, parseContent } from '../content/front-matter.js';

export const dateLabel = value => value ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : undefined;

export function paginate(items, page, size) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(totalPages, Math.max(1, Number.isSafeInteger(page) ? page : 1));
  return { items: size === Infinity ? items.slice() : items.slice((current - 1) * size, current * size), page: current, total: items.length, totalPages };
}

