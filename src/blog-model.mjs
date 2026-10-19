import { isDocumentId, parseContent, validateThumbnail } from './content-metadata.mjs';

export function readPost(source, { now = new Date(), includeUnpublished = false } = {}) {
  const { metadata, body } = parseContent(source);
  for (const key of ['id', 'slug']) if (!isDocumentId(metadata[key])) throw new Error(`invalid post ${key}`);
  if (['all', 'page', 'feed'].includes(metadata.slug)) throw new Error(`reserved post slug: ${metadata.slug}`);
  for (const key of ['title', 'description']) if (typeof metadata[key] !== 'string' || !metadata[key].trim()) throw new Error(`missing ${key}: ${metadata.id}`);
  if (metadata.type !== undefined && metadata.type !== 'blog') throw new Error(`unsupported public post type: ${metadata.id}`);
  if (!['public', 'draft'].includes(metadata.visibility)) throw new Error(`invalid visibility: ${metadata.id}`);
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
  for (const key of ['comments', 'example']) if (metadata[key] !== undefined && typeof metadata[key] !== 'boolean') throw new Error(`invalid ${key}: ${metadata.id}`);
  validateThumbnail(metadata.thumbnail);
  if (!includeUnpublished && (metadata.visibility === 'draft' || metadata.publish === false || metadata.status === 'draft' || metadata.publishedAt > now.toISOString().slice(0, 10))) return null;
  return { id: metadata.id, slug: metadata.slug, title: metadata.title.trim(), description: metadata.description.trim(), tags: normalized, publishedAt: metadata.publishedAt, ...(metadata.updatedAt ? { updatedAt: metadata.updatedAt } : {}), ...(metadata.thumbnail ? { thumbnail: metadata.thumbnail } : {}), comments: metadata.comments ?? false, example: metadata.example ?? false, body, route: `/blog/${metadata.slug}/` };
}

export function postTags(posts, knownLabels = {}) {
  return Object.fromEntries([...new Set(posts.flatMap(post => post.tags))].sort((a, b) => a.localeCompare(b, 'ko')).map(tag => [tag, { label: (Object.hasOwn(knownLabels, tag) ? knownLabels[tag].label : undefined) ?? tag, aliases: (Object.hasOwn(knownLabels, tag) ? knownLabels[tag].aliases : undefined) ?? [] }]));
}

export function collectPosts(sources, { now = new Date(), includeExamples = false } = {}) {
  const posts = sources.map(source => readPost(source, { now, includeUnpublished: true }));
  for (const key of ['id', 'slug']) if (new Set(posts.map(post => post[key])).size !== posts.length) throw new Error(`duplicate post ${key}`);
  return sources.map(source => readPost(source, { now })).filter(post => post && (includeExamples || !post.example)).sort(comparePosts);
}

export function comparePosts(left, right) {
  return right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id);
}

export function relatedPosts(post, posts, limit = 4) {
  return posts.filter(candidate => candidate.id !== post.id && candidate.tags.some(tag => post.tags.includes(tag))).sort(comparePosts).slice(0, limit);
}

export function searchEntry(post, tags) {
  return { id: post.id, route: post.route, title: post.title, description: post.description, tags: post.tags, date: post.publishedAt, thumbnail: post.thumbnail, comments: post.comments, commentCount: post.commentCount, example: post.example, keywords: post.tags.flatMap(tag => [tag, tags[tag]?.label ?? tag, ...(tags[tag]?.aliases ?? [])]), text: post.body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, ' ').replace(/[#*_`>|]/g, ' ') };
}
