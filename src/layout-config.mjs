// 공개 Blog와 검색창의 문구·표시 정책만 읽는다. 공개할 원문은 승인 목록이 별도로 정한다.
import { readFileSync } from 'node:fs';

import { settingsValidator } from './settings-validation.mjs';

const ROOT = new URL('../config/', import.meta.url);
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

export function loadBlogLayout(root = ROOT) {
  const blog = JSON.parse(readFileSync(new URL('blog.json', root), 'utf8'));
  const search = JSON.parse(readFileSync(new URL('search.json', root), 'utf8'));
  const box = search.box;
  const labels = Object.fromEntries(SEARCH_LABELS.map(key => [key, text(box?.labels?.[key], `config/search.json.box.labels.${key}`)]));
  return { blog: { title: text(blog.title, 'config/blog.json.title'), feedSize: integer(blog.feedSize, 'config/blog.json.feedSize', 1000), autoLoad: flag(blog.autoLoad, 'config/blog.json.autoLoad'), archiveLabel: text(blog.archiveLabel, 'config/blog.json.archiveLabel'), collection: grid(blog.collection, 'config/blog.json.collection'), card: withAuthor(card(blog.card, 'config/blog.json.card'), root) }, search: { title: text(search.title, 'config/search.json.title'), box: { labels, suggestions: [] } } };
}

// 카드 글쓴이는 사이트 주인 한 명이다. 이름은 config/site.json의 name, 선택 사진은 avatar(공개 자산 주소)를 쓴다.
function withAuthor(result, root) {
  if (!result.author) return result;
  const site = JSON.parse(readFileSync(new URL('site.json', root), 'utf8'));
  return { ...result, author: { name: text(site.name, 'config/site.json.name'), ...(site.avatar === undefined ? {} : { avatar: text(site.avatar, 'config/site.json.avatar') }) } };
}
