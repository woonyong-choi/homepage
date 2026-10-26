// 각 글의 iframe과 상태를 따로 관리해 연속 읽기에서도 토론과 높이가 섞이지 않게 한다.
const initialized = new WeakSet();
const documents = new WeakMap();
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

// 문서마다 message 리스너와 화면 관찰자를 하나만 두고 event.source로 해당 댓글 iframe을 찾는다.
function documentState(doc) {
  if (documents.has(doc)) return documents.get(doc);
  const view = doc.defaultView;
  const state = { session: readSession(view), threads: new Set(), pending: new Map(), observer: null };
  view.addEventListener('message', event => {
    if (event.origin !== host || !event.source || !event.data?.giscus) return;
    for (const thread of liveThreads(state)) {
      if (thread.source() === event.source) { thread.receive(event.data.giscus); return; }
    }
  });
  if (view.IntersectionObserver) {
    state.observer = new view.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) state.pending.get(entry.target)?.();
    }, { rootMargin: '100% 0px' });
  }
  documents.set(doc, state);
  return state;
}

// 무한 피드에서 문서 밖으로 빠진 댓글 영역은 등록에서 지운다.
function* liveThreads(state) {
  for (const thread of state.threads) {
    if (thread.section.isConnected) yield thread;
    else { state.threads.delete(thread); state.pending.delete(thread.section); state.observer?.unobserve(thread.section); }
  }
}

export function initComments(root) {
  const doc = root.ownerDocument ?? root;
  const view = doc.defaultView;
  const state = documentState(doc);
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
      state.pending.delete(section);
      state.observer?.unobserve(section);
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
      params.set('session', state.session);
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

    function receive(data) {
      const expired = typeof data.error === 'string' && /Bad credentials|Invalid state value|State has expired/.test(data.error);
      if (data.signOut || expired && state.session) {
        try { view.localStorage.removeItem(sessionKey); } catch { /* 저장소 접근이 막힌 환경에서도 로그아웃한다. */ }
        state.session = '';
        for (const thread of liveThreads(state)) thread.reload();
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
    }

    state.threads.add({ section, source: () => frame?.contentWindow, receive, reload: () => { if (frame) load(true); } });
    retry.addEventListener('click', () => load(true));
    if (expand) {
      section.dataset.expanded = 'false';
      content.inert = true;
      content.setAttribute('aria-hidden', 'true');
      expand.hidden = false;
      expand.addEventListener('click', () => showFull(true));
    }
    if (view.location.hash === `#${section.id}`) {
      if (expand) showFull();
      else load();
    } else if (state.observer) {
      // 화면 근처에 오기 전까지 iframe을 만들지 않아 연속 읽기의 요청 수를 보이는 글로 제한한다.
      state.pending.set(section, () => load());
      state.observer.observe(section);
    } else load();
  }
}

if (typeof document !== 'undefined') {
  initComments(document);
  document.addEventListener('content-added', event => initComments(event.detail));
}
