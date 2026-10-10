// 화면의 제목·소개를 탭과 공유 정보에서도 같은 값으로 제공한다.
import { escape } from './markdown.mjs';
import { iconFile } from './vendor/theme/ui/build/icons.mjs';

export const SITE_ICON = `/theme/assets/icons/${iconFile('document')}`;

export function siteOrigin(value, preview) {
  if (!value) {
    if (!preview) throw new Error('production build requires SITE_ORIGIN');
    return '';
  }
  let url;
  try { url = new URL(value); } catch { throw new Error('invalid site origin'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || value !== url.origin) throw new Error('invalid site origin');
  if (!preview && url.protocol !== 'https:') throw new Error('production build requires HTTPS SITE_ORIGIN');
  return url.origin;
}

export function publicationMetadata(page, context) {
  const { config, origin = '', preview, identity, themeHash, tags = {} } = context;
  const title = page.title === config.name ? config.name : `${page.title} · ${config.name}`;
  const description = page.description ?? config.description;
  const meta = (key, value, attribute = 'property') => `<meta ${attribute}="${key}" content="${escape(value)}">`;
  let html = `<title>${escape(title)}</title>${meta('description', description, 'name')}${preview ? meta('robots', 'noindex,nofollow', 'name') : ''}`;
  if (identity) html += `<link rel="icon" type="image/png" sizes="32x32" href="${identity.favicon}"><link rel="apple-touch-icon" sizes="180x180" href="${identity.touch}">`;
  html += `<link rel="icon" type="image/svg+xml" sizes="any" href="${SITE_ICON}?v=${themeHash}">`;
  if (!origin) return html;
  const canonical = origin + page.route;
  html += `<link rel="canonical" href="${escape(canonical)}">`;
  html += meta('og:title', page.title) + meta('og:description', description) + meta('og:type', page.id ? 'article' : 'website') + meta('og:url', canonical) + meta('og:site_name', config.name) + meta('og:locale', 'ko_KR');
  html += meta('twitter:card', 'summary', 'name') + meta('twitter:title', page.title, 'name') + meta('twitter:description', description, 'name');
  if (identity) {
    const image = origin + identity.share;
    const alt = `${config.name}의 기록을 나타내는 문서 아이콘`;
    html += meta('og:image', image) + meta('og:image:type', 'image/png') + meta('og:image:width', 512) + meta('og:image:height', 512) + meta('og:image:alt', alt);
    html += meta('twitter:image', image, 'name') + meta('twitter:image:alt', alt, 'name');
  }
  if (page.id) {
    if (page.publishedAt) html += meta('article:published_time', page.publishedAt);
    if (page.updatedAt) html += meta('article:modified_time', page.updatedAt);
    for (const tag of page.tags ?? []) html += meta('article:tag', tags[tag]?.label ?? tag);
  }
  return html;
}
