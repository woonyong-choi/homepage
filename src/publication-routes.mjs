// 이전 정적 주소도 쿼리와 앵커를 보존해 새 정본 주소로 연결한다.
import { JSDOM } from 'jsdom';
import { isDocumentId, FIELDS, TOPIC_GROUPS } from './content-model.mjs';

const LINK_ORIGIN = 'https://publication.invalid';

export function publicationLinks(html, route, origin = LINK_ORIGIN) {
  const base = new URL(route, origin);
  return [...JSDOM.fragment(html).querySelectorAll('a[href], area[href]')].map(node => {
    const url = new URL(node.getAttribute('href'), base);
    return url.origin === base.origin ? url.pathname + url.search + url.hash : url.href;
  });
}

export function documentRoute(value, baseRoute = '/', origin = LINK_ORIGIN) {
  const base = new URL(baseRoute, origin);
  let url;
  try { url = new URL(value, base); } catch { return null; }
  if (url.origin !== base.origin) return null;
  const match = /^\/(docs|blog|wiki|articles)\/([^/]+)\/?$/.exec(url.pathname);
  if (!match) return null;
  const [, kind, encoded] = match;
  let slug;
  try { slug = decodeURIComponent(encoded); } catch { return null; }
  if (!isDocumentId(slug)) return null;
  if (kind === 'blog' && ['all', 'page', 'feed'].includes(slug)) return null;
  if (kind === 'docs' && slug === 'topics') return null;
  if (kind === 'wiki' && [...TOPIC_GROUPS, ...FIELDS].includes(slug)) return null;
  return { kind, slug, fragment: url.hash.slice(1) };
}
