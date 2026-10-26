// 화면의 문구·순서·표시 정책만 읽는다. 공개할 원문은 승인 목록이 별도로 정한다.
import { readFileSync } from 'node:fs';

const ROOT = new URL('../config/', import.meta.url);
const SECTIONS = ['blog', 'projects', 'cs', 'tech', 'guides'];
const fail = (path, message) => { throw new Error(`${path}: ${message}`); };

function record(value, path, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, '설정 객체가 필요합니다');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, '알 수 없는 설정입니다');
  return value;
}

function text(value, path, empty = false) {
  if (typeof value !== 'string' || (!empty && !value.trim())) fail(path, '문자열이 필요합니다');
  return value.trim();
}

function flag(value, path) {
  if (typeof value !== 'boolean') fail(path, 'true 또는 false여야 합니다');
  return value;
}

function integer(value, path, maximum) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) fail(path, `1~${maximum} 정수여야 합니다`);
  return value;
}

function strings(value, path) {
  if (!Array.isArray(value)) fail(path, '문자열 목록이어야 합니다');
  const entries = value.map((item, index) => text(item, `${path}[${index}]`));
  if (new Set(entries).size !== entries.length) fail(path, '중복 항목이 있습니다');
  return entries;
}

function grid(value, path, all = false) {
  const entry = record(value, path, ['columns', 'rows']);
  return { columns: integer(entry.columns, `${path}.columns`, 5), rows: all && entry.rows === null ? null : integer(entry.rows, `${path}.rows`, 1000) };
}

function card(value, path, blog) {
  const fields = ['title', 'description', 'media', ...(blog ? ['tags', 'date', 'comments'] : [])];
  const entry = record(value, path, fields);
  if (!['icon', 'image', 'none'].includes(entry.media)) fail(`${path}.media`, 'icon, image 또는 none이어야 합니다');
  const result = { media: entry.media };
  for (const field of fields.filter(field => field !== 'media')) result[field] = flag(entry[field], `${path}.${field}`);
  if (!result.title && !result.description && result.media !== 'image') fail(path, '제목·설명·이미지 중 하나는 표시해야 합니다');
  return result;
}

function area(value, name) {
  const path = `config/${name}.json`;
  const blog = name === 'blog';
  const keys = ['title', 'description', 'preview', 'collection', 'card', ...(blog ? ['feedSize', 'autoLoad', 'archiveTitle', 'feedLabel', 'archiveLabel'] : ['order'])];
  const entry = record(value, path, keys);
  const result = {
    title: text(entry.title, `${path}.title`), description: text(entry.description, `${path}.description`, true),
    preview: grid(entry.preview, `${path}.preview`), collection: grid(entry.collection, `${path}.collection`, true),
    card: card(entry.card, `${path}.card`, blog),
  };
  if (blog) {
    result.autoLoad = flag(entry.autoLoad, `${path}.autoLoad`);
    result.feedSize = integer(entry.feedSize, `${path}.feedSize`, 1000);
    for (const key of ['archiveTitle', 'feedLabel', 'archiveLabel']) result[key] = text(entry[key], `${path}.${key}`);
  } else result.order = strings(entry.order, `${path}.order`);
  return result;
}

export function parseLayoutConfig(value) {
  record(value, '화면 설정', ['search', 'cs', 'tech', 'blog']);
  const path = 'config/search.json';
  const entry = record(value.search, path, ['title', 'sections', 'box', 'allLabel', 'backLabel', 'projectsTitle']);
  if (!Array.isArray(entry.sections)) fail(`${path}.sections`, '목록이어야 합니다');
  const sections = entry.sections.map((value, index) => {
    const where = `${path}.sections[${index}]`;
    const item = record(value, where, ['id', 'enabled']);
    if (!SECTIONS.includes(item.id)) fail(`${where}.id`, `지원 영역: ${SECTIONS.join(', ')}`);
    return { id: item.id, enabled: flag(item.enabled, `${where}.enabled`) };
  });
  if (new Set(sections.map(item => item.id)).size !== sections.length) fail(`${path}.sections`, '중복 영역이 있습니다');
  const box = record(entry.box, `${path}.box`, ['labels', 'suggestions']);
  const keys = ['region', 'input', 'placeholder', 'clear', 'suggestions'];
  record(box.labels, `${path}.box.labels`, keys);
  const search = { sections, box: { labels: Object.fromEntries(keys.map(key => [key, text(box.labels[key], `${path}.box.labels.${key}`)])), suggestions: strings(box.suggestions, `${path}.box.suggestions`) } };
  for (const key of ['title', 'allLabel', 'backLabel', 'projectsTitle']) search[key] = text(entry[key], `${path}.${key}`);
  return { search, cs: area(value.cs, 'cs'), tech: area(value.tech, 'tech'), blog: area(value.blog, 'blog') };
}

export function loadLayoutConfig(root = ROOT) {
  const files = ['search', 'cs', 'tech', 'blog'].map(name => {
    try { return [name, JSON.parse(readFileSync(new URL(`${name}.json`, root), 'utf8'))]; }
    catch (error) { throw new Error(`config/${name}.json: ${error.message}`, { cause: error }); }
  });
  return parseLayoutConfig(Object.fromEntries(files));
}

export function loadBlogLayout(root = ROOT) {
  const blog = JSON.parse(readFileSync(new URL('blog.json', root), 'utf8'));
  const search = JSON.parse(readFileSync(new URL('search.json', root), 'utf8'));
  const box = search.box;
  const labels = Object.fromEntries(['region', 'input', 'placeholder', 'clear', 'suggestions'].map(key => [key, text(box?.labels?.[key], `config/search.json.box.labels.${key}`)]));
  return { blog: { title: text(blog.title, 'config/blog.json.title'), feedSize: integer(blog.feedSize, 'config/blog.json.feedSize', 1000), autoLoad: flag(blog.autoLoad, 'config/blog.json.autoLoad'), archiveLabel: text(blog.archiveLabel, 'config/blog.json.archiveLabel'), collection: grid(blog.collection, 'config/blog.json.collection', true), card: card(blog.card, 'config/blog.json.card', true) }, search: { title: text(search.title, 'config/search.json.title'), box: { labels, suggestions: [] } } };
}
