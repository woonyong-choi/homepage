import { isDocumentId, parseContent, validateThumbnail } from './content-metadata.mjs';
import { readPost } from './blog-model.mjs';
export { isDocumentId, parseContent, validateThumbnail } from './content-metadata.mjs';

export const TOPIC_GROUPS = Object.freeze(['cs', 'tech']);
export const FIELDS = Object.freeze(['languages', 'cs', 'frameworks', 'infrastructure']);

export const dateLabel = value => value ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : undefined;

export function readDocument(source, tags, now = new Date(), categories = tags) {
  const { metadata: page, body } = parseContent(source);
  if (page.type === 'blog') {
    const post = readPost(source, { now, includeUnpublished: true });
    return { ...post, type: 'blog', visibility: page.visibility, published: Boolean(readPost(source, { now })) };
  }
  for (const name of ['id', 'slug']) {
    if (!isDocumentId(page[name])) throw new Error(`invalid document ${name}`);
  }
  if (page.type !== 'wiki') throw new Error(`invalid document type: ${page.id}`);
  for (const name of ['title', 'description']) {
    if (typeof page[name] !== 'string' || !page[name].trim()) throw new Error(`missing ${name}: ${page.id}`);
  }
  if (!['public', 'draft'].includes(page.visibility)) throw new Error(`invalid visibility: ${page.id}`);
  page.tags ??= [];
  if (!Array.isArray(page.tags) || page.tags.length > 5) throw new Error(`invalid tags: ${page.id}`);
  if (new Set(page.tags).size !== page.tags.length || page.tags.some(tag => !tags[tag])) throw new Error(`unknown or duplicate tag: ${page.id}`);
  if (!FIELDS.includes(page.field)) throw new Error(`invalid field: ${page.id}`);
  if (!isDocumentId(page.category) || !categories[page.category]) throw new Error(`invalid category: ${page.id}`);
  if (page.parent != null && !isDocumentId(page.parent)) throw new Error(`invalid parent: ${page.id}`);
  if (typeof page.contentIcon?.name !== 'string') throw new Error(`missing content icon: ${page.id}`);
  for (const name of ['publishedAt', 'updatedAt']) {
    if (page[name] !== undefined && !validDate(page[name])) throw new Error(`invalid ${name}: ${page.id}`);
  }
  if (page.updatedAt && page.publishedAt && page.updatedAt < page.publishedAt) throw new Error(`update predates publication: ${page.id}`);
  validateThumbnail(page.thumbnail);
  if (page.slug === 'topics') throw new Error(`reserved document slug: ${page.slug}`);
  return { ...page, body, route: `/docs/${page.slug}/`,
    published: page.visibility === 'public' && (!page.publishedAt || page.publishedAt <= now.toISOString().slice(0, 10)) };
}

export function paginate(items, page, size) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(totalPages, Math.max(1, Number.isSafeInteger(page) ? page : 1));
  return { items: size === Infinity ? items.slice() : items.slice((current - 1) * size, current * size), page: current, total: items.length, totalPages };
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
