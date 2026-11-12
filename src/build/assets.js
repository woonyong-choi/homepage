import { readFileSync } from 'node:fs';

import { runtimeEntrypoints } from '#design/ui/manifest.js';
import { getIconCatalog } from '../design/build/icons.js';
const ORIGIN = 'https://site.invalid';
const ICON_CATALOG = getIconCatalog();
const ICON_NOTICES = [...new Set([...ICON_CATALOG.libraries, ...Object.values(ICON_CATALOG.brands)].map(item => item.notice).filter(Boolean))].map(file => `/theme/assets/icons/${file}`);
const ASSET_ROOTS = ['/theme/', '/assets/', '/media/', '/katex/'];
const PRETENDARD_SUBSETS = '/theme/assets/fonts/pretendard-variable/';
const ASSET_SOURCES = JSON.parse(readFileSync(new URL('../../config/assets.json', import.meta.url), 'utf8'));
const ASSET_NOTICES = new Map([
  ['/theme/assets/fonts/jetbrains-mono-regular.woff2', '/theme/assets/fonts/jetbrains-mono-license.txt'],
  ...ASSET_SOURCES.filter(source => source.notice).map(source => [`/${source.file}`, `/${source.notice}`]),
]);

export function clientEntrypoints(body) {
  const scripts = [];
  if (/<[^>]+\sdata-public-search(?:[\s=>])/.test(body)) scripts.push('site.js');
  scripts.push(...runtimeEntrypoints(body));
  if (/<[^>]+\sdata-comments(?:[\s=>])/.test(body)) scripts.push('comments.js');
  if (/<[^>]+\sdata-blog-list(?:[\s=>])/.test(body)) scripts.push('blog-list.js');
  return scripts;
}

function markupReferences(source) {
  return [...source.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)].map(match => match[1]);
}

function styleReferences(source) {
  const urls = [...source.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/g)].map(match => match[1] ?? match[2] ?? match[3]);
  const imports = [...source.matchAll(/@import\s+["']([^"']+)["']/g)].map(match => match[1]);
  return [...urls, ...imports];
}

export function collectAssets(pages, searchEntries, readAsset) {
  const files = new Map();
  function include(reference, from = '/') {
    if (!reference || reference.startsWith('#')) return;
    const url = new URL(reference, ORIGIN + from);
    if (url.origin !== ORIGIN) return;
    const path = decodeURIComponent(url.pathname);
    if (!ASSET_ROOTS.some(root => path.startsWith(root))) {
      if (ASSET_ROOTS.some(root => from.startsWith(root))) throw new Error(`asset dependency outside asset roots: ${reference}`);
      return;
    }
    if (path.includes('\\') || path.split('/').some(part => part === '..' || part === '.')) throw new Error(`invalid asset path: ${reference}`);
    if (files.has(path)) return;
    const content = readAsset(path);
    files.set(path, content);
    const notice = path.startsWith('/katex/fonts/') ? '/katex/LICENSE' : path.startsWith(PRETENDARD_SUBSETS) ? '/theme/assets/fonts/pretendard-license.txt' : ASSET_NOTICES.get(path);
    if (notice) include(notice);
    const references = path.endsWith('.css') ? styleReferences(content.toString()) : path.endsWith('.svg') ? markupReferences(content.toString()) : [];
    for (const dependency of references) include(dependency, path);
  }
  for (const [route, html] of pages) {
    for (const reference of markupReferences(html)) include(reference, route);
  }
  for (const entry of searchEntries) include(entry.thumbnail?.src);
  for (const notice of ICON_NOTICES) include(notice);
  include('/theme/assets/giscus.css');
  return files;
}
