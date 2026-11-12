import { JSDOM } from 'jsdom';

const LINK_ORIGIN = 'https://site.invalid';

export function pageLinks(html, route, origin = LINK_ORIGIN) {
  const base = new URL(route, origin);
  return [...JSDOM.fragment(html).querySelectorAll('a[href], area[href]')].map(node => {
    const url = new URL(node.getAttribute('href'), base);
    return url.origin === base.origin ? url.pathname + url.search + url.hash : url.href;
  });
}
