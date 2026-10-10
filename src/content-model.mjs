// 공개 문서의 식별자와 분류를 화면·검색·댓글에서 함께 사용한다.
import { parse } from 'yaml';

const DOCUMENT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PAGE_SIZES = Object.freeze({ preview: 4, cards: 12, feed: 4 });
export const TOPIC_GROUPS = Object.freeze(['cs', 'tech']);
export const FIELDS = Object.freeze(['languages', 'cs', 'frameworks', 'infrastructure']);

export function isDocumentId(value) { return typeof value === 'string' && DOCUMENT_ID.test(value); }

export function readDocument(source, tags, now = new Date(), categories = tags) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('missing document metadata');
  const page = parse(match[1], { maxAliasCount: 0 });
  for (const name of ['id', 'slug']) {
    if (!isDocumentId(page[name])) throw new Error(`invalid document ${name}`);
  }
  if (!['wiki', 'blog'].includes(page.type)) throw new Error(`invalid document type: ${page.id}`);
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
  if (page.type === 'blog' && page.comments !== true) throw new Error(`blog comments are required: ${page.id}`);
  for (const name of ['publishedAt', 'updatedAt']) {
    if (page[name] !== undefined && !validDate(page[name])) throw new Error(`invalid ${name}: ${page.id}`);
  }
  if (page.type === 'blog' && !page.publishedAt) throw new Error(`missing publication date: ${page.id}`);
  if (page.updatedAt && page.publishedAt && page.updatedAt < page.publishedAt) throw new Error(`update predates publication: ${page.id}`);
  validateThumbnail(page.thumbnail);
  if ((page.type === 'blog' ? ['all', 'page', 'feed'] : ['topics']).includes(page.slug)) throw new Error(`reserved document slug: ${page.slug}`);
  return { ...page, body: match[2], route: `/${page.type === 'blog' ? 'blog' : 'docs'}/${page.slug}/`,
    published: page.visibility === 'public' && (!page.publishedAt || page.publishedAt <= now.toISOString().slice(0, 10)) };
}

export function publicDocuments(documents, { includeExamples = false } = {}) {
  for (const key of ['id', 'slug']) {
    const values = documents.map(page => page[key]);
    if (new Set(values).size !== values.length) throw new Error(`duplicate document ${key}`);
  }
  return documents.filter(page => page.published && (includeExamples || !page.example));
}

export function blogDocuments(documents) {
  return documents.filter(page => page.type === 'blog').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
}

export function paginate(items, page, size) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(totalPages, Math.max(1, Number.isSafeInteger(page) ? page : 1));
  return { items: items.slice((current - 1) * size, current * size), page: current, total: items.length, totalPages };
}

export function searchEntry(page, tags) {
  return { id: page.id, route: page.route, title: page.title, description: page.description,
    type: page.type, tags: page.tags, contentIcon: page.contentIcon,
    date: page.type === 'blog' ? page.publishedAt : page.updatedAt ?? '',
    keywords: [...(page.keywords ?? []), ...page.tags.flatMap(tag => [tags[tag].label, ...(tags[tag].aliases ?? [])])],
    text: page.body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ').replace(/[#*_`>|]/g, ' ') };
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateThumbnail(thumbnail) {
  if (thumbnail === undefined) return;
  const src = thumbnail?.src;
  const local = typeof src === 'string' && /^\/media\/[a-z0-9][a-z0-9./-]*\.(?:png|jpg|webp|svg)$/.test(src) && !src.includes('..');
  let external = false;
  if (typeof src === 'string' && src.startsWith('https://')) {
    try {
      const url = new URL(src);
      external = Boolean(url.hostname) && !url.username && !url.password;
    } catch { /* 경로 오류는 아래의 공통 검증 결과로 보고한다. */ }
  }
  if (!local && !external) throw new Error('invalid thumbnail path');
  if (typeof thumbnail.alt !== 'string') throw new Error('missing thumbnail alternative');
  if (thumbnail.position !== undefined) {
    for (const axis of ['x', 'y']) {
      const value = thumbnail.position?.[axis];
      if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('invalid thumbnail position');
    }
  }
}
