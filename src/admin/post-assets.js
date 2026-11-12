import { parseDocumentSync } from '../document/parser/index.js';
import { readPost } from './post-file.js';

const ASSET = /^(?:\.\.\/|\/)?assets\/([^?#]+)/;

function assetName(value) {
  const match = typeof value === 'string' ? value.match(ASSET) : null;
  if (!match) return null;
  let name;
  try { name = decodeURIComponent(match[1]); } catch { return null; }
  return name.split('/').some(part => !part || part === '.' || part === '..') ? null : name;
}

function collect(tokens, names) {
  for (const token of tokens ?? []) {
    const value = token.type === 'image' ? token.attrGet?.('src') : token.type === 'link_open' ? token.attrGet?.('href') : null;
    const name = assetName(value);
    if (name) names.add(name);
    collect(token.children, names);
    for (const unit of token.meta?.units ?? []) collect(unit.tokens, names);
  }
}

export function postAssets(text) {
  const post = readPost(String(text));
  const names = new Set();
  collect(parseDocumentSync(post.body, { id: 'post-assets' }).tokens, names);
  const thumbnail = assetName(post.thumbnail?.src);
  if (thumbnail) names.add(thumbnail);
  return [...names];
}
