// 발행 HTML과 런타임 색인의 의존 파일만 복사 대상으로 모은다.
import { runtimeEntrypoints } from './vendor/theme/ui/manifest.mjs';
import { getIconCatalog } from './vendor/theme/ui/build/icons.mjs';
const ORIGIN = 'https://publication.invalid';
const ICON_CATALOG = getIconCatalog();
const ICON_NOTICES = [...new Set([...ICON_CATALOG.libraries, ...Object.values(ICON_CATALOG.brands)].map(item => item.notice).filter(Boolean))].map(file => `/theme/assets/icons/${file}`);
const ASSET_ROOTS = ['/theme/', '/assets/', '/media/', '/katex/'];
const ASSET_NOTICES = new Map([
  ['/media/manta-code-blocks-poster.png', '/media/manta-code-blocks-LICENSE.txt'],
  ['/theme/assets/fonts/pretendard-variable.woff2', '/theme/assets/fonts/pretendard-license.txt'],
  ['/theme/assets/fonts/jetbrains-mono-regular.woff2', '/theme/assets/fonts/jetbrains-mono-license.txt'],
  ['/media/woonyong-interview.mp4', '/media/woonyong-interview-NOTICE.txt'],
  ['/media/woonyong-interview-poster.jpg', '/media/woonyong-interview-NOTICE.txt'],
  ...['j2ysoft', 'jusin-background', 'neople-background', 'nexon', 'roborobo'].map(name => [`/assets/company-${name}.png`, '/assets/company-logos-NOTICE.txt']),
]);

export function clientEntrypoints(body) {
  const scripts = [];
  if (/<[^>]+\sdata-public-search(?:[\s=>])/.test(body)) scripts.push('publication.js');
  scripts.push(...runtimeEntrypoints(body));
  if (/<[^>]+\sdata-comments(?:[\s=>])/.test(body)) scripts.push('comments.js');
  if (/<[^>]+\sdata-current-year(?:[\s=>])/.test(body)) scripts.push('footer-year.js');
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

export function publicationAssets(pages, searchEntries, readAsset) {
  const files = new Map();
  function include(reference, from = '/') {
    if (!reference || reference.startsWith('#')) return;
    const url = new URL(reference, ORIGIN + from);
    if (url.origin !== ORIGIN) return;
    const path = decodeURIComponent(url.pathname);
    if (!ASSET_ROOTS.some(root => path.startsWith(root))) {
      if (ASSET_ROOTS.some(root => from.startsWith(root))) throw new Error(`asset dependency outside publication roots: ${reference}`);
      return;
    }
    if (path.includes('\\') || path.split('/').some(part => part === '..' || part === '.')) throw new Error(`invalid publication asset: ${reference}`);
    if (files.has(path)) return;
    const content = readAsset(path);
    files.set(path, content);
    // 화면에서 요청하지 않는 고지도 해당 자산의 배포 의존성이다.
    const notice = path.startsWith('/katex/fonts/') ? '/katex/LICENSE' : ASSET_NOTICES.get(path);
    if (notice) include(notice);
    const references = path.endsWith('.css') ? styleReferences(content.toString()) : path.endsWith('.svg') ? markupReferences(content.toString()) : [];
    for (const dependency of references) include(dependency, path);
  }
  for (const [route, html] of pages) {
    for (const reference of markupReferences(html)) include(reference, route);
  }
  for (const entry of searchEntries) include(entry.iconUrl);
  // 인라인 아이콘과 같은 원본에서 만든 사이트 아이콘은 파일 링크 없이도 정본 고지를 배포한다.
  for (const notice of ICON_NOTICES) include(notice);
  // iframe에서 직접 읽는 테마는 부모 HTML에 stylesheet 링크가 없다.
  include('/theme/assets/giscus.css');
  return files;
}
