import { isScalar, parseDocument } from 'yaml';

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMAGE_TYPES = Object.freeze({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' });
export const STATES = Object.freeze({
  public: { visibility: 'public', status: 'published', publish: true },
  private: { visibility: 'private', status: 'published', publish: false },
  draft: { visibility: 'draft', status: 'draft', publish: false },
});
export function postState(data) {
  if (data.visibility === 'public' && data.publish !== false && data.status !== 'draft') return 'public';
  return data.visibility === 'private' ? 'private' : 'draft';
}

function split(text) {
  const match = FRONT.exec(text);
  return match ? { yaml: match[1], body: text.slice(match[0].length) } : { yaml: '', body: text };
}

export function readPost(text) {
  const { yaml, body } = split(text);
  const data = parseDocument(yaml).toJS() ?? {};
  return {
    id: String(data.id ?? data.slug ?? ''), slug: String(data.slug ?? data.id ?? ''), type: String(data.type ?? ''),
    title: String(data.title ?? ''), description: String(data.description ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [], publishedAt: String(data.publishedAt ?? ''),
    thumbnail: data.thumbnail && typeof data.thumbnail.src === 'string' ? { src: data.thumbnail.src, alt: String(data.thumbnail.alt ?? '') } : null,
    state: postState(data), body: body.replace(/^\r?\n/, ''),
  };
}

const QUOTED = new Set(['title', 'description', 'publishedAt']);
function setValue(doc, key, value) {
  const node = doc.get(key, true);
  if (isScalar(node) && typeof value !== 'object') { node.value = value; return; }
  const created = doc.createNode(value, { flow: Array.isArray(value) });
  if (QUOTED.has(key)) created.type = 'QUOTE_DOUBLE';
  doc.set(key, created);
}

export function writePost(original, values) {
  const { yaml } = split(original ?? '');
  const doc = parseDocument(yaml || '{}');
  if (!original) {
    doc.contents = doc.createNode({});
    for (const [key, value] of Object.entries({ id: values.slug, slug: values.slug, type: 'blog' })) setValue(doc, key, value);
  }
  if (original && values.slug) { setValue(doc, 'id', values.slug); setValue(doc, 'slug', values.slug); }
  setValue(doc, 'title', values.title);
  setValue(doc, 'description', values.description);
  setValue(doc, 'tags', values.tags);
  setValue(doc, 'publishedAt', values.publishedAt);
  if (values.thumbnail) setValue(doc, 'thumbnail', { src: values.thumbnail.src, alt: values.thumbnail.alt });
  else if (values.thumbnail === null) doc.delete('thumbnail');
  for (const [key, value] of Object.entries(STATES[values.state] ?? STATES.draft)) setValue(doc, key, value);
  if (!original) setValue(doc, 'comments', false);
  const head = doc.toString({ lineWidth: 0, flowCollectionPadding: false }).replace(/\n$/, '');
  return `---\n${head}\n---\n\n${values.body.replace(/^\s*\n/, '')}${values.body.endsWith('\n') ? '' : '\n'}`;
}

export function postFileName(slug, date) {
  if (!SLUG.test(slug)) throw new Error('주소 이름은 영어 소문자·숫자와 - 만 쓸 수 있습니다.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('발행일은 YYYY-MM-DD 형식이어야 합니다.');
  return `${date.slice(2)}-${slug}.md`;
}

export function imageFileName(name, type, date) {
  const extension = IMAGE_TYPES[type];
  if (!extension) throw new Error('PNG, JPG, GIF, WebP 그림만 올릴 수 있습니다.');
  const stem = String(name).replace(/\.[^.]*$/, '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'image';
  return `${date.replaceAll('-', '').slice(2)}-${stem}.${extension}`;
}

export const imageMarkdown = (alt, file) => `![${String(alt).replace(/[[\]\n]/g, ' ').trim()}](../assets/${file})`;

export function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  return btoa(binary);
}

export function fromBase64(value) {
  const binary = atob(String(value).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}
