// 글 원문과 작성 화면 입력 사이의 변환. 글 머리(YAML)의 다른 항목과 따옴표 모양은 그대로 둔다.
import { isScalar, parseDocument } from 'yaml';

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const IMAGE_TYPES = Object.freeze({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' });
// 공개 여부 하나가 Vault 글 머리의 세 항목을 함께 정한다.
const STATES = Object.freeze({
  public: { visibility: 'public', status: 'published', publish: true },
  draft: { visibility: 'draft', status: 'draft', publish: false },
});

function split(text) {
  const match = FRONT.exec(text);
  return match ? { yaml: match[1], body: text.slice(match[0].length) } : { yaml: '', body: text };
}

export function readPost(text) {
  const { yaml, body } = split(text);
  const data = parseDocument(yaml).toJS() ?? {};
  const published = data.visibility === 'public' && data.publish === true;
  return {
    id: String(data.id ?? data.slug ?? ''), slug: String(data.slug ?? data.id ?? ''), type: String(data.type ?? ''),
    title: String(data.title ?? ''), description: String(data.description ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [], publishedAt: String(data.publishedAt ?? ''),
    state: published ? 'public' : 'draft', body: body.replace(/^\r?\n/, ''),
  };
}

// 기존 값은 따옴표 모양을 유지한다. 새 제목·설명·발행일은 Vault 글처럼 큰따옴표로 쓴다(날짜가 날짜 형식으로 바뀌지 않게).
const QUOTED = new Set(['title', 'description', 'publishedAt']);
function setValue(doc, key, value) {
  const node = doc.get(key, true);
  if (isScalar(node) && typeof value !== 'object') { node.value = value; return; }
  const created = doc.createNode(value, { flow: Array.isArray(value) });
  if (QUOTED.has(key)) created.type = 'QUOTE_DOUBLE';
  doc.set(key, created);
}

/** 입력값을 원문에 반영한다. 새 글이면 Vault 글 머리 기본 항목을 만든다. */
export function writePost(original, values) {
  const { yaml } = split(original ?? '');
  const doc = parseDocument(yaml || '{}');
  if (!original) {
    doc.contents = doc.createNode({});
    for (const [key, value] of Object.entries({ id: values.slug, slug: values.slug, type: 'blog' })) setValue(doc, key, value);
  }
  setValue(doc, 'title', values.title);
  setValue(doc, 'description', values.description);
  setValue(doc, 'tags', values.tags);
  setValue(doc, 'publishedAt', values.publishedAt);
  for (const [key, value] of Object.entries(STATES[values.state] ?? STATES.draft)) setValue(doc, key, value);
  if (!original) setValue(doc, 'comments', false);
  const head = doc.toString({ lineWidth: 0, flowCollectionPadding: false }).replace(/\n$/, '');
  return `---\n${head}\n---\n\n${values.body.replace(/^\s*\n/, '')}${values.body.endsWith('\n') ? '' : '\n'}`;
}

export const parseTags = text => [...new Set(String(text).split(',').map(tag => tag.trim()).filter(Boolean))];

/** Vault 발행 글 이름: 발행일(YY-MM-DD)과 주소 이름. */
export function postFileName(slug, date) {
  if (!SLUG.test(slug)) throw new Error('주소 이름은 영어 소문자·숫자와 - 만 쓸 수 있습니다.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('발행일은 YYYY-MM-DD 형식이어야 합니다.');
  return `${date.slice(2)}-${slug}.md`;
}

/** 올린 그림의 저장 이름. 날짜를 앞에 붙이고 영어 소문자·숫자·-만 남긴다. */
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
