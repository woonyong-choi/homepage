// 정적 다음 페이지의 카드 또는 본문을 재사용한다. 스크립트가 없으면 원래 쪽 이동 링크가 동작한다.
export function initBlogList(root, { fetchPage, Observer } = {}) {
  const doc = root.ownerDocument;
  const view = doc.defaultView;
  const feed = root.dataset.blogList === 'feed';
  const containerSelector = feed ? '.app-blog-feed-items' : '.app-support-grid';
  const itemSelector = feed ? '.app-blog-slice' : '.app-blog-card';
  const primarySelector = feed ? '.app-post-title a' : '.app-blog-card-link';
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
    if (url.origin !== view.location.origin || !(feed ? /^\/blog\/(?:page\/[1-9]\d*\/)?$/ : /^\/blog\/all\/(?:page\/[1-9]\d*\/)?$/).test(url.pathname) || url.search || url.hash || visited.has(url.href)) throw new Error('invalid next page');
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
      const list = page.querySelector(feed ? '[data-blog-list=feed]' : '[data-blog-list=""]');
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
      if (feed) await prepareContent(page, doc, url);
      grid.append(...added);
      if (feed) doc.dispatchEvent(new view.CustomEvent('content-added', { detail: grid }));
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

async function prepareContent(page, doc, url) {
  const scripts = new Set(['/document.js', '/video.js', '/diagram.js', '/comments.js']);
  for (const script of page.querySelectorAll('script[type=module][src]')) {
    const source = new URL(script.getAttribute('src'), url);
    if (source.origin === doc.location.origin && scripts.has(source.pathname)) await import(source.href);
  }
  const math = page.querySelector('link[href^="/katex/katex.css"]');
  if (math && !doc.querySelector('link[href^="/katex/katex.css"]')) doc.head.append(math.cloneNode(true));
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-blog-list]').forEach(root => initBlogList(root));
