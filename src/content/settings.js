import { readFileSync } from 'node:fs';

import { settingsValidator } from '../lib/validate.js';

const FILE = new URL('../../config/site.json', import.meta.url);
const PATH = 'config/site.json';
const SEARCH_LABELS = ['region', 'input', 'placeholder', 'clear', 'suggestions'];
const CARD_FIELDS = ['title', 'description', 'media', 'tags', 'date', 'comments', 'author'];
const { fail, record, text, flag } = settingsValidator();

function integer(value, path, maximum) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) fail(path, `1~${maximum} 정수여야 합니다`);
  return value;
}

function grid(value, path) {
  const entry = record(value, path, ['columns', 'rows']);
  return { columns: integer(entry.columns, `${path}.columns`, 5), rows: entry.rows === null ? null : integer(entry.rows, `${path}.rows`, 1000) };
}

function card(value, path) {
  const entry = record(value, path, CARD_FIELDS);
  if (!['icon', 'image', 'none'].includes(entry.media)) fail(`${path}.media`, 'icon, image 또는 none이어야 합니다');
  const result = { media: entry.media };
  for (const field of CARD_FIELDS.filter(field => !['media', 'author'].includes(field))) result[field] = flag(entry[field], `${path}.${field}`);
  if (flag(entry.author, `${path}.author`, false)) result.author = true;
  if (!result.title && !result.description && result.media !== 'image') fail(path, '제목·설명·이미지 중 하나는 표시해야 합니다');
  return result;
}

const SITE_KEYS = ['url', 'name', 'title', 'description', 'copyright', 'logo', 'avatar', 'github', 'linkedin', 'repository', 'comments', 'blog', 'search', 'admin'];

export function loadSiteConfig(file = FILE) {
  return record(JSON.parse(readFileSync(file, 'utf8')), PATH, SITE_KEYS);
}

export function loadBlogLayout(site = loadSiteConfig()) {
  const blog = record(site.blog, `${PATH}.blog`, ['title', 'feedSize', 'autoLoad', 'archiveLabel', 'collection', 'card']);
  const search = record(site.search, `${PATH}.search`, ['title', 'labels']);
  const labels = Object.fromEntries(SEARCH_LABELS.map(key => [key, text(search.labels?.[key], `${PATH}.search.labels.${key}`)]));
  return { blog: { title: text(blog.title, `${PATH}.blog.title`), feedSize: integer(blog.feedSize, `${PATH}.blog.feedSize`, 1000), autoLoad: flag(blog.autoLoad, `${PATH}.blog.autoLoad`), archiveLabel: text(blog.archiveLabel, `${PATH}.blog.archiveLabel`), collection: grid(blog.collection, `${PATH}.blog.collection`), card: withAuthor(card(blog.card, `${PATH}.blog.card`), site) }, search: { title: text(search.title, `${PATH}.search.title`), box: { labels, suggestions: [] } } };
}

function withAuthor(result, site) {
  if (!result.author) return result;
  return { ...result, author: { name: text(site.name, `${PATH}.name`), ...(site.avatar === undefined ? {} : { avatar: text(site.avatar, `${PATH}.avatar`) }) } };
}
