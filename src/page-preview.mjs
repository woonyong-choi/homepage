// 미리보기는 지정된 원고만 읽고 결과를 메모리로 반환한다. 발행 경로에는 쓰지 않는다.
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

import { mathAssets } from 'document-engine';

import { parseArticle, renderArticle } from './article-renderer.mjs';
import { readDocument } from './content-model.mjs';
import { parseContentSource } from './content-files.mjs';
import { loadHomeContent, loadHomeNavigation } from './home-content.mjs';
import { loadLayoutConfig } from './layout-config.mjs';
import { articlePage, documentShell, personalHome } from './publication-layout.mjs';
import { publicationAssets } from './publication-assets.mjs';
import { browserScripts } from './browser-scripts.mjs';
import { compileDiagrams } from './diagrams.mjs';
import { getIconCatalog } from './vendor/theme/ui/build/icons.mjs';

const SOURCE_ROOT = fileURLToPath(new URL('.', import.meta.url));
const THEME_ROOT = join(SOURCE_ROOT, 'vendor/theme');

/**
 * 저장 전 전체 Markdown을 기존 홈페이지 페이지로 조립한다.
 * siteRoot/config와 contentRoot의 명시된 홈 입력만 읽는다. assets.read는 신뢰할 수 있는 호스트가 제공한다.
 * @returns {Promise<{html: string, assets: Map, diagnostics: object[], route?: string, id?: string}>}
 */
export async function renderPagePreview(input) {
  try {
    return await renderPreview(input);
  } catch (error) {
    return { html: '', assets: new Map(), diagnostics: [{ severity: 'error', file: input.file, id: input.id, message: error.message }] };
  }
}

async function renderPreview({ source, file, id, kind = 'article', siteRoot, contentRoot, assets = {} }) {
  if (typeof source !== 'string') throw new TypeError('preview source must be a string');
  if (!['article', 'home'].includes(kind)) throw new TypeError('invalid preview kind');
  const root = realpathSync(contentRoot);
  const selected = within(root, file);
  const configRoot = realpathSync(join(siteRoot, 'config'));
  const json = name => JSON.parse(readFileSync(containedFile(configRoot, name), 'utf8'));
  const readContent = path => {
    const name = relative(root, path);
    within(root, name);
    return parseContentSource(path === selected ? source : readFileSync(containedFile(root, name), 'utf8'), name);
  };
  const manifest = JSON.parse(readFileSync(join(THEME_ROOT, 'manifest.json'), 'utf8'));
  const math = mathAssets();
  const scripts = browserScripts(SOURCE_ROOT);
  const context = {
    config: json('site.json'), tags: json('tags.json'), layout: loadLayoutConfig(pathToFileURL(configRoot + sep)),
    topics: readContent(join(root, 'tech.md')).metadata.topics,
    navigation: loadHomeNavigation(root, readContent), preview: true, origin: '', math,
    themeHash: manifest.contentHash,
    scriptHash: createHash('sha256').update([...scripts.values()].join('\n')).digest('hex'),
  };
  const readAsset = path => {
    if (math.assets.has(path)) return math.assets.get(path);
    if (path.startsWith('/theme/')) return readFileSync(containedFile(THEME_ROOT, path.slice('/theme/'.length)));
    if (assets.read) return assets.read(path);
    if (!/^\/(assets|media)\//.test(path)) throw new Error(`unsupported preview asset: ${path}`);
    return readFileSync(containedFile(root, path.slice(1)));
  };
  context.readAsset = readAsset;
  const sizes = json('image-sizes.json');
  const documentAssets = {
    size: name => Object.hasOwn(sizes, name) ? sizes[name] : undefined,
    ...assets,
    exists: assets.exists ?? (name => {
      if (!/^[\w.-]+$/.test(name)) return false;
      try { containedFile(root, `assets/${name}`); return true; } catch { return false; }
    }),
  };
  let page;
  let body;
  let diagrams = { assets: new Map() };
  let diagnostics = [];
  if (kind === 'home') {
    context.home = loadHomeContent(new Set(Object.keys(getIconCatalog().brands)), root, { readContent, exists: path => {
      try { readAsset(path.startsWith('/') ? path : `/${path}`); return true; } catch { return false; }
    } });
    page = { route: '/', title: context.config.title ?? context.config.name };
    body = personalHome(context);
  } else {
    page = readDocument(source, context.tags, new Date(), context.topics);
    if (id !== undefined && id !== page.id) throw new Error('preview document id does not match source');
    const document = await parseArticle(page, { assets: documentAssets });
    diagrams = await compileDiagrams(new Map(document.metadata.diagrams.map(item => [item.source, page.id])));
    const rendered = await renderArticle(page, { document, diagrams: diagrams.diagrams, assets: documentAssets });
    Object.assign(page, rendered);
    diagnostics = rendered.diagnostics;
    body = articlePage(page, context);
  }
  const html = documentShell(page, body, context);
  const files = publicationAssets(new Map([[page.route, html]]), [], readAsset);
  for (const [name, bytes] of scripts) files.set(`/${name}`, bytes);
  for (const [name, bytes] of diagrams.assets) files.set(name, bytes);
  return { html, assets: files, diagnostics, route: page.route, id: page.id };
}

function within(root, name) {
  if (typeof name !== 'string' || !name || isAbsolute(name)) throw new Error('preview path must be relative');
  const target = resolve(root, name);
  const path = relative(root, target);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) throw new Error('preview path escapes input root');
  return target;
}

function containedFile(root, name) {
  const target = realpathSync(within(root, name));
  within(root, relative(root, target));
  return target;
}
