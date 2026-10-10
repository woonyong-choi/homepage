// 각 글의 iframe과 상태를 따로 관리해 연속 읽기에서도 토론과 높이가 섞이지 않게 한다.
const initialized = new WeakSet();
const sessions = new WeakMap();
const host = 'https://giscus.app';
const sessionKey = 'giscus-session';
const widgetFields = ['repo', 'repoId', 'category', 'categoryId', 'term', 'strict', 'reactionsEnabled', 'emitMetadata', 'inputPosition', 'theme'];

function readSession(view) {
  const url = new URL(view.location.href);
  const callback = url.searchParams.get('giscus');
  if (callback) {
    try { view.localStorage.setItem(sessionKey, JSON.stringify(callback)); } catch { /* 저장소가 막혀도 현재 화면의 로그인은 유지한다. */ }
    url.searchParams.delete('giscus');
    view.history.replaceState(view.history.state, '', url);
    return callback;
  }
  try {
    const saved = JSON.parse(view.localStorage.getItem(sessionKey) ?? 'null');
    return typeof saved === 'string' ? saved : '';
  } catch { return ''; }
}

export function initComments(root) {
  const doc = root.ownerDocument ?? root;
  const view = doc.defaultView;
  if (!sessions.has(doc)) sessions.set(doc, { value: readSession(view), reload: new Set() });
  const session = sessions.get(doc);
  for (const section of root.querySelectorAll('[data-comments]')) {
    if (initialized.has(section)) continue;
    initialized.add(section);
    const status = section.querySelector('[data-comments-status]');
    const retry = section.querySelector('[data-comments-retry]');
    const fallback = section.querySelector('[data-comments-fallback]');
    const viewport = section.querySelector('.app-comments-viewport');
    const content = section.querySelector('[data-comments-content]');
    const expand = section.querySelector('[data-comments-expand]');
    let frame;
    let timeout;
    let failed = false;

    function showFull(focus = false) {
      section.dataset.expanded = 'true';
      content.inert = false;
      content.removeAttribute('aria-hidden');
      if (expand) { expand.hidden = true; expand.setAttribute('aria-expanded', 'true'); }
      load();
      if (focus) frame.focus();
    }

    function fail() {
      failed = true;
      view.clearTimeout(timeout);
      status.hidden = false;
      status.textContent = '댓글을 불러오지 못했습니다. 다시 시도하거나 GitHub에서 열어 주세요.';
      retry.hidden = false;
      fallback.hidden = false;
      viewport.hidden = true;
    }

    function ready() {
      failed = false;
      view.clearTimeout(timeout);
      status.hidden = true;
      retry.hidden = true;
      fallback.hidden = true;
      viewport.hidden = false;
    }

    function load(reload = false) {
      if (frame && !reload) return;
      view.clearTimeout(timeout);
      failed = false;
      status.hidden = false;
      status.textContent = '댓글을 불러오고 있습니다.';
      retry.hidden = true;
      fallback.hidden = true;
      viewport.hidden = false;
      const origin = new URL(section.dataset.commentsReturn || view.location.href, view.location.href);
      origin.searchParams.delete('giscus');
      origin.hash = section.id;
      const backLink = new URL(section.dataset.commentsRoute || view.location.pathname, view.location.href);
      const params = new URLSearchParams(widgetFields.map(name => [name, section.dataset[name]]));
      params.set('origin', origin.href);
      params.set('backLink', backLink.href);
      params.set('description', section.dataset.commentsDescription);
      params.set('session', session.value);
      frame = doc.createElement('iframe');
      frame.className = 'app-comments-frame';
      frame.title = '댓글';
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('allow', 'clipboard-write');
      frame.src = `${host}/ko/widget?${params}`;
      frame.addEventListener('error', fail);
      content.replaceChildren(frame);
      timeout = view.setTimeout(fail, 15000);
    }

    retry.addEventListener('click', () => load(true));
    session.reload.add(() => { if (frame) load(true); });
    if (expand) {
      section.dataset.expanded = 'false';
      content.inert = true;
      content.setAttribute('aria-hidden', 'true');
      expand.hidden = false;
      expand.addEventListener('click', () => showFull(true));
    }
    view.addEventListener('message', event => {
      if (event.origin !== host || event.source !== frame?.contentWindow || !event.data?.giscus) return;
      const data = event.data.giscus;
      const expired = typeof data.error === 'string' && /Bad credentials|Invalid state value|State has expired/.test(data.error);
      if (data.signOut || expired && session.value) {
        try { view.localStorage.removeItem(sessionKey); } catch { /* 저장소 접근이 막힌 환경에서도 로그아웃한다. */ }
        session.value = '';
        session.reload.forEach(reload => reload());
        return;
      }
      if (data.error) {
        if (typeof data.error === 'string' && data.error.includes('Discussion not found')) ready();
        else fail();
        return;
      }
      if (typeof data.resizeHeight === 'number' && Number.isFinite(data.resizeHeight) && data.resizeHeight > 0) {
        frame.style.height = `${data.resizeHeight}px`;
        if (!failed) ready();
      }
      if ('discussion' in data) {
        ready();
        const url = data.discussion?.url;
        const prefix = `https://github.com/${section.dataset.repo}/discussions/`;
        if (typeof url === 'string' && url.startsWith(prefix) && /^\d+$/.test(url.slice(prefix.length))) section.querySelector('[data-discussion-link]').href = url;
      }
    });
    load();
    if (expand && view.location.hash === `#${section.id}`) showFull();
  }
}

if (typeof document !== 'undefined') {
  initComments(document);
  document.addEventListener('content-added', event => initComments(event.detail));
}
