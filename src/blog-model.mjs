import { isDocumentId, parseContent, publishDate, validateThumbnail } from './content-metadata.mjs';

// /blog/ 아래 목록 주소와 겹쳐 글 주소로 쓸 수 없는 이름. 관리 화면도 출간 전에 같은 목록으로 막는다.
export const RESERVED_SLUGS = Object.freeze(['all', 'page', 'feed']);

export function readPost(source, { now = new Date(), includeUnpublished = false } = {}) {
  const post = parsePost(source);
  return includeUnpublished || isPublished(post, now) ? post.page : null;
}

// 형식 검증은 공개 여부와 무관하게 한 번만 한다.
function parsePost(source) {
  const { metadata, body } = parseContent(source);
  for (const key of ['id', 'slug']) if (!isDocumentId(metadata[key])) throw new Error(`invalid post ${key}`);
  if (RESERVED_SLUGS.includes(metadata.slug)) throw new Error(`reserved post slug: ${metadata.slug}`);
  for (const key of ['title', 'description']) if (typeof metadata[key] !== 'string' || !metadata[key].trim()) throw new Error(`missing ${key}: ${metadata.id}`);
  if (metadata.type !== undefined && metadata.type !== 'blog') throw new Error(`unsupported public post type: ${metadata.id}`);
  if (!VISIBILITIES.includes(metadata.visibility)) throw new Error(`invalid visibility: ${metadata.id}`);
  for (const key of ['publishedAt', 'updatedAt']) {
    const value = metadata[key];
    if (key === 'updatedAt' && value === undefined) continue;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`invalid ${key}: ${metadata.id}`);
  }
  if (metadata.updatedAt && metadata.updatedAt < metadata.publishedAt) throw new Error(`update predates publication: ${metadata.id}`);
  const tags = metadata.tags ?? [];
  if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || !tag.trim())) throw new Error(`invalid tags: ${metadata.id}`);
  const normalized = tags.map(tag => tag.trim().normalize('NFC'));
  if (new Set(normalized).size !== normalized.length) throw new Error(`duplicate tag: ${metadata.id}`);
  const keywords = metadata.keywords ?? [];
  if (!Array.isArray(keywords) || keywords.some(word => typeof word !== 'string' || !word.trim())) throw new Error(`invalid keywords: ${metadata.id}`);
  for (const key of ['comments', 'example']) if (metadata[key] !== undefined && typeof metadata[key] !== 'boolean') throw new Error(`invalid ${key}: ${metadata.id}`);
  validateThumbnail(metadata.thumbnail);
  return { metadata, page: { id: metadata.id, slug: metadata.slug, title: metadata.title.trim(), description: metadata.description.trim(), tags: normalized, ...(metadata.keywords ? { keywords: [...new Set(keywords.map(word => word.trim().normalize('NFC')))] } : {}), publishedAt: metadata.publishedAt, ...(metadata.updatedAt ? { updatedAt: metadata.updatedAt } : {}), ...(metadata.thumbnail ? { thumbnail: metadata.thumbnail } : {}), comments: metadata.comments ?? false, example: metadata.example ?? false, body, route: `/blog/${metadata.slug}/` } };
}

// 공개 글만 사이트에 싣는다. 임시(draft)와 비공개(private)는 원본 저장소에만 남는다.
export const VISIBILITIES = Object.freeze(['public', 'draft', 'private']);
function isPublished({ metadata }, now) {
  return !(metadata.visibility !== 'public' || metadata.publish === false || metadata.status === 'draft' || metadata.publishedAt > publishDate(now));
}

// 작성 중인 임시·비공개 글의 형식 오류가 공개 글 배포를 막지 않게 한다. 공개 글의 오류는 그대로 멈춘다.
function parseSource(source) {
  try {
    return parsePost(source);
  } catch (error) {
    let metadata = {};
    try { ({ metadata } = parseContent(source)); } catch { throw error; }
    if (metadata.visibility === 'public' && metadata.publish !== false && metadata.status !== 'draft') throw error;
    return null;
  }
}

export function postTags(posts, knownLabels = {}) {
  return Object.fromEntries([...new Set(posts.flatMap(post => post.tags))].sort((a, b) => a.localeCompare(b, 'ko')).map(tag => [tag, { label: (Object.hasOwn(knownLabels, tag) ? knownLabels[tag].label : undefined) ?? tag, aliases: (Object.hasOwn(knownLabels, tag) ? knownLabels[tag].aliases : undefined) ?? [] }]));
}

export function collectPosts(sources, { now = new Date(), includeExamples = false } = {}) {
  const posts = sources.map(parseSource).filter(Boolean);
  for (const key of ['id', 'slug']) if (new Set(posts.map(post => post.page[key])).size !== posts.length) throw new Error(`duplicate post ${key}`);
  return posts.filter(post => isPublished(post, now)).map(post => post.page).filter(post => includeExamples || !post.example).sort(comparePosts);
}

export function comparePosts(left, right) {
  return right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id);
}

export function relatedPosts(post, posts, limit = 4) {
  return posts.filter(candidate => candidate.id !== post.id && candidate.tags.some(tag => post.tags.includes(tag))).sort(comparePosts).slice(0, limit);
}

export function searchEntry(post, tags) {
  const aliases = keywordAliases(tags);
  const keywords = [...new Set([...post.tags, ...(post.keywords ?? [])].flatMap(word => [word, ...(aliases.get(keywordKey(word))?.terms ?? [])]))];
  return { id: post.id, route: post.route, title: post.title, description: post.description, tags: post.tags, date: post.publishedAt, thumbnail: post.cardImage ?? post.thumbnail, comments: post.comments, commentCount: post.commentCount, example: post.example, keywords, text: post.body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ').replace(/[#*_`>|]/g, ' ') };
}

const keywordKey = word => word.trim().normalize('NFC').toLocaleLowerCase('ko').replace(/\s+/g, ' ');

function keywordAliases(knownTags) {
  const aliases = new Map();
  for (const [id, tag] of Object.entries(knownTags).sort(([a], [b]) => a.localeCompare(b, 'ko'))) {
    for (const word of [id, tag.label, ...(tag.aliases ?? [])]) {
      const key = keywordKey(word);
      if (!aliases.has(key)) aliases.set(key, { key: keywordKey(id), keyword: tag.label, terms: [id, tag.label, ...(tag.aliases ?? [])] });
    }
  }
  return aliases;
}

export function keywordRanking(posts, knownTags = {}) {
  const aliases = keywordAliases(knownTags);
  const ranks = new Map();
  for (const post of posts) {
    const words = new Map([...post.tags, ...(post.keywords ?? [])].map(word => {
      const key = keywordKey(word);
      const item = aliases.get(key) ?? { key, keyword: word.trim().normalize('NFC') };
      return [item.key, item.keyword];
    }));
    for (const [key, keyword] of words) {
      const rank = ranks.get(key) ?? { keyword, postCount: 0, latest: post.publishedAt };
      rank.postCount += 1;
      if (post.publishedAt > rank.latest) rank.latest = post.publishedAt;
      ranks.set(key, rank);
    }
  }
  return [...ranks.values()].sort((a, b) => b.postCount - a.postCount || b.latest.localeCompare(a.latest) || a.keyword.localeCompare(b.keyword, 'ko'));
}
