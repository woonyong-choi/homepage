import { readFileSync } from 'node:fs';
import { sha256 } from './sha256.mjs';

import { escape } from '#design/ui/index.mjs';
import { iconFile } from '#design/ui/build/icons.mjs';

export const FAVICON = '/assets/site-icon.svg';
export const SITE_ICON = `/theme/assets/icons/${iconFile('document')}`;
const FAVICON_HASH = sha256(readFileSync(new URL(`../content${FAVICON}`, import.meta.url)));

export function siteTitle(config) {
  return config.title ?? config.name;
}

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
  const { config, origin = '', preview, identity, tags = {} } = context;
  const site = siteTitle(config);
  const pageTitle = page.title ?? site;
  const title = pageTitle === site ? site : `${pageTitle} · ${site}`;
  const description = page.description ?? config.description;
  const meta = (key, value, attribute = 'property') => `<meta ${attribute}="${key}" content="${escape(value)}">`;
  let html = `<title>${escape(title)}</title>${meta('description', description, 'name')}${preview || page.noindex ? meta('robots', 'noindex,nofollow', 'name') : ''}`;
  if (identity) html += `<link rel="apple-touch-icon" sizes="180x180" href="${identity.touch}">`;
  html += `<link rel="icon" type="image/svg+xml" href="${FAVICON}?v=${FAVICON_HASH}">`;
  if (!origin || page.noindex) return html;
  const canonical = origin + page.route;
  html += `<link rel="canonical" href="${escape(canonical)}">`;
  html += meta('og:title', pageTitle) + meta('og:description', description) + meta('og:type', page.id ? 'article' : 'website') + meta('og:url', canonical) + meta('og:site_name', site) + meta('og:locale', 'ko_KR');
  // 글은 대표 그림(썸네일 또는 본문 첫 그림)을 공유 그림으로 쓰고 큰 카드로 보인다. 움직이는 GIF는 배포 때 다른 형식으로 바뀌므로 쓰지 않는다.
  const cover = page.id && shareImage(page.cardImage ?? page.thumbnail);
  html += meta('twitter:card', cover ? 'summary_large_image' : 'summary', 'name') + meta('twitter:title', pageTitle, 'name') + meta('twitter:description', description, 'name');
  if (cover) {
    html += meta('og:image', origin + cover.src) + meta('og:image:alt', cover.alt || pageTitle);
    html += meta('twitter:image', origin + cover.src, 'name') + meta('twitter:image:alt', cover.alt || pageTitle, 'name');
  } else if (identity) {
    const image = origin + identity.share;
    const alt = `${config.name}의 기록을 나타내는 문서 아이콘`;
    html += meta('og:image', image) + meta('og:image:type', 'image/png') + meta('og:image:width', 512) + meta('og:image:height', 512) + meta('og:image:alt', alt);
    html += meta('twitter:image', image, 'name') + meta('twitter:image:alt', alt, 'name');
  }
  if (page.id) {
    if (page.publishedAt) html += meta('article:published_time', page.publishedAt);
    if (page.updatedAt) html += meta('article:modified_time', page.updatedAt);
    for (const tag of page.tags ?? []) html += meta('article:tag', tags[tag]?.label ?? tag);
    // 검색 엔진용 글 정보. 화면에 보이는 제목·요약·날짜·글쓴이와 같은 값만 적는다.
    const posting = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: pageTitle, description, url: canonical, mainEntityOfPage: canonical, inLanguage: 'ko', ...(page.publishedAt ? { datePublished: page.publishedAt } : {}), ...(page.publishedAt ? { dateModified: page.updatedAt ?? page.publishedAt } : {}), ...(cover ? { image: origin + cover.src } : {}), ...(config.name ? { author: { '@type': 'Person', name: config.name, url: origin + '/' } } : {}) };
    html += jsonLd(posting);
  } else if (page.route === '/') {
    // 첫 화면은 사이트와 사람 정보를 알린다. 화면과 설정에 있는 값만 적는다.
    const person = { '@type': 'Person', name: config.name, url: origin + '/', ...(config.github || config.linkedin ? { sameAs: [config.github, config.linkedin].filter(Boolean) } : {}) };
    html += jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: site, url: origin + '/', inLanguage: 'ko', description, author: person });
  }
  return html;
}

const jsonLd = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;

function shareImage(image) {
  if (!image?.src?.startsWith('/') || /\.gif$/i.test(image.src)) return undefined;
  return image;
}
