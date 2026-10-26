import { RUNTIMES } from '@woonyong-choi/design-tokens/ui/manifest.mjs';

// 이어 붙인 글이 쓰는 공통 런타임과 댓글 런타임. 페이지 조립의 clientEntrypoints와 같은 정본 목록을 읽는다.
const CONTENT_SCRIPTS = new Set([...Object.keys(RUNTIMES), 'comments.js'].map(file => `/${file}`));

export function initBlogList(root, { fetchPage, Observer, loadModule = url => import(url) } = {}) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const containerSelector = '.app-blog-feed-items';
  const itemSelector = '.app-blog-slice';
  const primarySelector = '.app-post-title a';
  const grid = root.querySelector(containerSelector);
  const nav = root.querySelector('.app-page-links');
  const link = nav?.querySelector('[rel="next"]');
  if (!link || !grid) return;
  const status = root.querySelector('[data-blog-status]');
  const fetchNext = fetchPage ?? view.fetch.bind(view);
  const Intersection = Observer ?? view.IntersectionObserver;
  const visited = new Set([view.location.href]);
  const articles = new Set([...grid.querySelectorAll(primarySelector)].map(item => item.href));
  let pending = false;
  let failed = false;
  let next = link.href;

  function pageUrl(value) {
    const url = new URL(value, view.location.href);
    if (url.origin !== view.location.origin || !/^\/blog\/(?:page\/[1-9]\d*\/)?$/.test(url.pathname) || url.search || url.hash || visited.has(url.href)) throw new Error('invalid next page');
    return url.href;
  }

  async function load(manual = false) {
    if (pending || !next || (failed && !manual)) return;
    pending = true;
    root.setAttribute('aria-busy', 'true');
    link.setAttribute('aria-disabled', 'true');
    status.textContent = '글을 불러오는 중입니다.';
    try {
      const url = pageUrl(next);
      const response = await fetchNext(url, { redirect: 'error' });
      if (!response.ok) throw new Error('page request failed');
      const page = new view.DOMParser().parseFromString(await response.text(), 'text/html');
      const list = page.querySelector('[data-blog-list=feed]');
      const cards = [...(list?.querySelectorAll(`${containerSelector} > ${itemSelector}`) ?? [])];
      if (!cards.length) throw new Error('missing cards');
      const href = list.querySelector('.app-page-links [rel="next"]')?.getAttribute('href');
      const following = href ? pageUrl(href) : null;
      if (following === url) throw new Error('repeated next page');
      const incoming = new Set();
      const added = cards.filter(card => {
        const cover = card.querySelector(primarySelector);
        if (!cover) throw new Error('missing article link');
        const key = new URL(cover.getAttribute('href'), url).href;
        if (articles.has(key) || incoming.has(key)) return false;
        incoming.add(key);
        return true;
      });
      if (!added.length) throw new Error('no new articles');
      await prepareContent(page, doc, url, loadModule);
      grid.append(...added);
      doc.dispatchEvent(new view.CustomEvent('content-added', { detail: grid }));
      incoming.forEach(key => articles.add(key));
      visited.add(url);
      next = following;
      failed = false;
      status.textContent = next ? `${added.length}편을 더 불러왔습니다.` : '모든 글을 불러왔습니다.';
      if (next) link.href = next;
      else { observer?.disconnect(); nav.hidden = true; }
      link.textContent = '더 보기';
      if (manual) added[0].querySelector(primarySelector)?.focus();
      if (next) { observer?.unobserve(nav); observer?.observe(nav); }
    } catch {
      failed = true;
      status.textContent = '글을 불러오지 못했습니다. 다시 시도해 주세요.';
      link.textContent = '다시 불러오기';
    } finally {
      pending = false;
      root.removeAttribute('aria-busy');
      link.removeAttribute('aria-disabled');
    }
  }

  nav.replaceChildren(link);
  nav.setAttribute('aria-label', '글 더 보기');
  link.textContent = '더 보기';
  link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void load(true);
  });
  const observer = Intersection ? new Intersection(entries => {
    if (entries.some(entry => entry.isIntersecting)) void load();
  }, { rootMargin: '100% 0px' }) : null;
  observer?.observe(nav);
}

async function prepareContent(page, doc, url, loadModule) {
  for (const script of page.querySelectorAll('script[type=module][src]')) {
    const source = new URL(script.getAttribute('src'), url);
    if (source.origin === doc.location.origin && CONTENT_SCRIPTS.has(source.pathname)) await loadModule(source.href);
  }
  // 수식 스타일 주소는 페이지 조립이 document-engine의 MATH_STYLESHEET로 표시한 link에서 읽는다.
  const math = page.querySelector('link[data-math-stylesheet]');
  if (math && !doc.querySelector('link[data-math-stylesheet]')) doc.head.append(math.cloneNode(true));
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-blog-list]').forEach(root => initBlogList(root));
