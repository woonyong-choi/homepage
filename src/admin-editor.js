// 관리자에게만 불러오는 글 관리 기능. 사이트 화면은 그대로 두고 오른쪽 아래 단추, 임시·비공개 글 목록,
// 글 화면의 수정·삭제, 벨로그식 작성·출간 화면을 얹는다. 글은 Vault 저장소에 커밋하고 공개 글이 바뀌면 배포를 실행한다.
import MarkdownIt from 'markdown-it';
import { parseDocumentSync } from 'document-engine/parser';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { fromBase64, imageFileName, imageMarkdown, postFileName, readPost, SLUG, toBase64, writePost } from './admin-model.mjs';
import { TOKEN_KEY } from './admin-token.mjs';
export { demoFetcher } from './admin-demo.mjs';

const API = 'https://api.github.com';
const DATE = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const DESCRIPTION_LIMIT = 150;
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const renderToken = markdown.renderer.renderToken.bind(markdown.renderer);
// 엔진 전용 블록(탭·도표 등)은 태그 없는 토큰으로 온다. 미리보기에서는 빈 태그를 만들지 않는다.
markdown.renderer.renderToken = (tokens, index, options) => tokens[index].tag ? renderToken(tokens, index, options) : '';

// 서식 단추가 넣는 문법. line은 줄 앞에 붙이고, wrap은 고른 글자를 감싼다.
const FORMATS = {
  h1: { line: '# ' }, h2: { line: '## ' }, h3: { line: '### ' }, h4: { line: '#### ' }, quote: { line: '> ' },
  bold: { wrap: ['**', '**'], fallback: '굵은 글자' }, italic: { wrap: ['_', '_'], fallback: '기울인 글자' }, strike: { wrap: ['~~', '~~'], fallback: '취소한 글자' },
  link: { wrap: ['[', '](https://)'], fallback: '링크 글자' }, code: { wrap: ['\n```\n', '\n```\n'], fallback: '코드' },
};

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const sortPosts = posts => posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.name.localeCompare(b.name));

function nodeFrom(component) {
  if (!ui.isTrusted(component)) throw new TypeError('theme component output required');
  const template = document.createElement('template');
  template.innerHTML = component.html;
  return template.content.firstElementChild;
}

export function startAdmin(settings, token, { fetcher = (...args) => fetch(...args), storage = localStorage, doc = document } = {}) {
  const view = doc.defaultView;
  const state = { token, posts: [], current: null, tags: [], thumbnail: undefined, visibility: 'public', dirty: false, images: new Map() };

  // 화면 조각은 모두 공통 구성 요소로 만든다.
  const toast = nodeFrom(ui.Toast());
  const dock = nodeFrom(ui.AdminDock({ count: 0 }));
  let panel = nodeFrom(ui.AdminDrafts({ items: [] }));
  const write = nodeFrom(ui.WriteScreen({ preview: ui.trusted('<div data-write-preview></div>') }));
  const publish = nodeFrom(ui.PublishScreen());
  const dialog = nodeFrom(ui.Dialog({ id: 'admin-confirm', title: '확인', body: '', actions: [ui.Button({ label: '취소', variant: 'quiet', action: 'dialog-cancel' }), ui.Button({ label: '확인', variant: 'primary', action: 'dialog-confirm' })] }));
  const fileInput = Object.assign(doc.createElement('input'), { type: 'file', accept: 'image/png,image/jpeg,image/gif,image/webp', hidden: true });
  doc.body.append(panel, dock, write, publish, dialog, toast, fileInput);

  const writeForm = write.querySelector('[data-write-form]');
  const field = name => writeForm.elements.namedItem(name);
  const title = field('title');
  const body = field('body');
  const tagEntry = write.querySelector('[data-tag-entry]');
  const tagInput = tagEntry.querySelector('input');
  const preview = write.querySelector('[data-write-preview]');
  const publishForm = publish.querySelector('[data-publish-form]');
  const publishField = name => publishForm.elements.namedItem(name);

  let toastTimer = 0;
  function say(message, { stay = false } = {}) {
    toast.textContent = message;
    toast.hidden = false;
    view.clearTimeout(toastTimer);
    if (!stay) toastTimer = view.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  let resolveDialog = null;
  function confirm(heading, message, label = '확인') {
    dialog.querySelector('.app-dialog-title').textContent = heading;
    dialog.querySelector('[data-dialog-body]').textContent = message;
    dialog.querySelector('[data-action=dialog-confirm]').textContent = label;
    dialog.hidden = false;
    dialog.querySelector('[data-action=dialog-cancel]').focus();
    return new Promise(resolve => { resolveDialog = resolve; });
  }
  function closeDialog(value) {
    dialog.hidden = true;
    resolveDialog?.(value);
    resolveDialog = null;
  }

  async function api(url, init = {}) {
    const response = await fetcher(url.startsWith('https://') ? url : `${API}/repos/${settings.repository}/${url}`, {
      ...init,
      headers: { authorization: `Bearer ${state.token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers },
    });
    if (response.status === 401) {
      try { storage.removeItem(TOKEN_KEY); } catch { /* 이미 지워진 상태다. */ }
      say('로그인이 만료됐습니다. /admin/에서 다시 로그인해 주세요.', { stay: true });
      throw new Error('unauthorized');
    }
    return response;
  }
  const contentPath = path => `contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const ref = `?ref=${encodeURIComponent(settings.branch)}`;

  function lockPage(locked) {
    doc.documentElement.style.overflow = locked ? 'hidden' : '';
  }

  // 목록과 개수, 글 화면의 수정·삭제 줄을 지금 글 목록에 맞춘다.
  function renderAdminUi() {
    const hidden = state.posts.filter(post => post.state !== 'public');
    dock.querySelector('[data-admin-count]').textContent = String(hidden.length);
    const next = nodeFrom(ui.AdminDrafts({ items: hidden.map(post => ({ id: post.path, title: post.title || post.name, state: post.state, date: post.publishedAt })) }));
    next.hidden = panel.hidden;
    panel.replaceWith(next);
    panel = next;
    const article = doc.querySelector('.app-blog-post.is-detail');
    const slug = view.location.pathname.match(/^\/blog\/([^/]+)\/$/)?.[1];
    const post = slug && state.posts.find(item => item.slug === slug);
    const byline = article?.querySelector('.app-post-byline') ?? article?.querySelector('.app-post-header');
    article?.querySelector('.app-post-owner')?.remove();
    if (byline && post) byline.append(nodeFrom(ui.PostOwnerActions({ state: post.state })));
  }

  async function loadPosts() {
    const response = await api(`${contentPath(settings.posts)}${ref}`);
    if (response.status === 404) { state.posts = []; renderAdminUi(); return; }
    if (!response.ok) throw new Error(`글 목록을 읽지 못했습니다(${response.status}).`);
    const files = (await response.json()).filter(item => item.type === 'file' && item.name.endsWith('.md'));
    const posts = await Promise.all(files.map(async file => {
      const item = await (await api(`${contentPath(file.path)}${ref}`)).json();
      const text = fromBase64(item.content);
      return { ...readPost(text), path: file.path, name: file.name, sha: item.sha, text };
    }));
    state.posts = sortPosts(posts.filter(post => post.type === 'blog'));
    renderAdminUi();
  }

  // 작성 화면
  function renderTags() {
    for (const chip of tagEntry.querySelectorAll('[data-tag]')) chip.remove();
    for (const tag of state.tags) tagInput.before(nodeFrom(ui.TagInput({ id: 'admin-tag-chip', label: '태그', tags: [tag] })).querySelector('[data-tag]'));
  }
  function addTags(text) {
    const next = String(text).split(/[,#]/).map(tag => tag.trim()).filter(Boolean);
    const before = state.tags.length;
    state.tags = [...new Set([...state.tags, ...next])];
    if (state.tags.length !== before) { state.dirty = true; renderTags(); schedulePreview(); }
  }

  function openWrite(post) {
    state.current = post;
    state.tags = [...(post?.tags ?? [])];
    state.thumbnail = undefined;
    state.visibility = post?.state === 'private' ? 'private' : 'public';
    title.value = post?.title ?? '';
    body.value = post?.body ?? '';
    tagInput.value = '';
    renderTags();
    renderPreview();
    state.dirty = false;
    panel.hidden = true;
    dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false');
    write.hidden = false;
    lockPage(true);
    write.querySelector('.app-write-fields').scrollTop = 0;
    title.focus({ preventScroll: true });
  }
  async function closeWrite() {
    if (state.dirty && !await confirm('작성 화면 나가기', '저장하지 않은 내용이 있습니다. 나가면 바뀐 내용을 잃습니다.', '나가기')) return;
    write.hidden = true;
    publish.hidden = true;
    lockPage(false);
    state.dirty = false;
  }

  let previewTimer = 0;
  const schedulePreview = () => { view.clearTimeout(previewTimer); previewTimer = view.setTimeout(renderPreview, 150); };
  // 미리보기는 사이트 글 화면과 같은 PostArticle로 그린다. 탭·도표 같은 전용 블록은 배포 뒤 사이트에서 확인한다.
  function renderPreview() {
    const parsed = parseDocumentSync(body.value, { id: 'admin-preview', features: { tabs: true, diagrams: true } });
    const date = state.current?.publishedAt || today();
    const tags = state.tags.length ? ui.TagList({ tags: state.tags.map(tag => ({ href: `/search/?tag=${encodeURIComponent(tag)}`, label: tag })), size: 'medium' }) : undefined;
    preview.innerHTML = ui.PostArticle({
      id: 'admin-preview', detail: true, href: '/', title: title.value.replace(/\s*\n\s*/g, ' ').trim() || '제목 없음', date, dateLabel: DATE.format(new Date(date)),
      lead: ui.trusted(ui.escape(state.current?.description ?? '')), tags, body: ui.trusted(markdown.renderer.render(parsed.tokens, markdown.options, parsed.env)), byline: settings.author,
    }).html;
    for (const image of preview.querySelectorAll('img[src^="../assets/"]')) showImage(image, image.getAttribute('src').slice('../assets/'.length));
  }

  // 비공개 저장소의 그림은 주소로 바로 열 수 없으므로 토큰으로 받아 이 탭 안에서만 보여 준다.
  function imageUrl(file) {
    if (!state.images.has(file)) {
      state.images.set(file, api(`${contentPath(`${settings.assets}/${file}`)}${ref}`, { headers: { accept: 'application/vnd.github.raw' } })
        .then(response => response.ok ? response.blob() : null).then(blob => blob ? view.URL.createObjectURL(blob) : '').catch(() => ''));
    }
    return state.images.get(file);
  }
  async function showImage(image, file) {
    const url = await imageUrl(decodeURIComponent(file));
    if (url) image.src = url;
  }

  function applyFormat(format) {
    const rule = FORMATS[format];
    if (format === 'image') { pickImage('body'); return; }
    const start = body.selectionStart;
    const end = body.selectionEnd;
    if (rule.line) {
      const lineStart = body.value.lastIndexOf('\n', start - 1) + 1;
      body.setRangeText(rule.line, lineStart, lineStart, 'end');
    } else {
      const selected = body.value.slice(start, end) || rule.fallback;
      body.setRangeText(`${rule.wrap[0]}${selected}${rule.wrap[1]}`, start, end, 'select');
    }
    body.focus();
    state.dirty = true;
    schedulePreview();
  }

  let imageTarget = 'body';
  function pickImage(target) {
    imageTarget = target;
    fileInput.value = '';
    fileInput.click();
  }
  async function uploadImage(file) {
    const name = imageFileName(file.name, file.type, today());
    say('그림을 올리는 중입니다.', { stay: true });
    const content = await new Promise((resolve, reject) => {
      const reader = new view.FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const response = await api(contentPath(`${settings.assets}/${name}`), { method: 'PUT', body: JSON.stringify({ message: `docs(assets): ${name} 추가`, content, branch: settings.branch }) });
    if (response.status === 422) return say('같은 이름의 그림이 이미 있습니다. 파일 이름을 바꿔 다시 올려 주세요.');
    if (!response.ok) return say(`그림을 올리지 못했습니다(${response.status}).`);
    state.images.set(name, Promise.resolve(view.URL.createObjectURL(file)));
    if (imageTarget === 'thumbnail') {
      state.thumbnail = { src: `/assets/${name}`, alt: title.value.trim() };
      renderThumbnail();
    } else {
      body.setRangeText(`\n${imageMarkdown(file.name.replace(/\.[^.]*$/, ''), name)}\n`, body.selectionStart, body.selectionEnd, 'end');
      schedulePreview();
    }
    state.dirty = true;
    say('그림을 올렸습니다.');
  }

  // 출간 화면
  const currentThumbnail = () => state.thumbnail === undefined ? state.current?.thumbnail ?? null : state.thumbnail;
  function renderThumbnail() {
    const box = publish.querySelector('[data-publish-thumbnail]');
    const thumbnail = currentThumbnail();
    const first = body.value.match(/!\[[^\]]*\]\(\.\.\/assets\/([^)\s]+)\)/)?.[1];
    const file = thumbnail?.src.startsWith('/assets/') ? thumbnail.src.slice('/assets/'.length) : first;
    publish.querySelector('[data-action=remove-thumbnail]').hidden = !thumbnail;
    const empty = box.querySelector('.app-publish-thumbnail-empty');
    box.querySelector('img')?.remove();
    empty.hidden = Boolean(file);
    if (file) {
      const image = Object.assign(doc.createElement('img'), { alt: '' });
      box.append(image);
      showImage(image, file);
    }
  }
  function setVisibility(value) {
    state.visibility = value;
    for (const button of publish.querySelectorAll('[data-visibility]')) button.setAttribute('aria-pressed', String(button.dataset.visibility === value));
  }
  function openPublish() {
    const heading = title.value.replace(/\s*\n\s*/g, ' ').trim();
    if (!heading) { say('제목을 입력해 주세요.'); title.focus(); return; }
    publish.querySelector('[data-publish-title]').textContent = heading;
    const description = publishField('description');
    description.value = state.current?.description ?? '';
    publish.querySelector('[data-publish-count]').textContent = String(description.value.length);
    const slug = publishField('slug');
    slug.value = state.current?.slug ?? '';
    slug.readOnly = Boolean(state.current) && !state.current.slug.startsWith('draft-');
    if (slug.value.startsWith('draft-')) slug.value = '';
    publishField('publishedAt').value = state.current?.publishedAt || today();
    setVisibility(state.visibility);
    renderThumbnail();
    publish.hidden = false;
    description.focus();
  }

  function values(nextState) {
    return {
      title: title.value.replace(/\s*\n\s*/g, ' ').trim(),
      slug: publish.hidden ? state.current?.slug ?? '' : publishField('slug').value.trim(),
      description: publish.hidden ? state.current?.description ?? '' : publishField('description').value.trim(),
      tags: state.tags, publishedAt: publish.hidden ? state.current?.publishedAt || today() : publishField('publishedAt').value,
      state: nextState, body: body.value, thumbnail: state.thumbnail,
    };
  }

  // 임시저장은 아직 주소가 없으면 날짜와 제목에서 임시 주소를 만든다. 출간할 때 주소를 다시 정할 수 있다.
  function draftSlug() {
    return `draft-${today().replaceAll('-', '')}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function save(nextState) {
    const input = values(nextState);
    if (!input.title) return say('제목을 입력해 주세요.');
    if (nextState !== 'draft') {
      if (!input.description) return say('요약을 입력해 주세요.');
      if (!SLUG.test(input.slug)) return say('주소 이름은 영어 소문자·숫자와 - 만 쓸 수 있습니다.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) return say('발행일을 입력해 주세요.');
    } else if (!input.slug) input.slug = draftSlug();
    const current = state.current;
    const renamed = Boolean(current) && current.slug !== input.slug;
    if ((!current || renamed) && state.posts.some(post => post.slug === input.slug)) return say('같은 주소 이름의 글이 이미 있습니다.');
    const path = current && !renamed ? current.path : `${settings.posts}/${postFileName(input.slug, input.publishedAt)}`;
    const text = writePost(current?.text, input);
    const wasPublic = current?.state === 'public';
    if (current && text === current.text && nextState === current.state) { say('바뀐 내용이 없습니다.'); return; }
    say(nextState === 'draft' ? '임시저장하는 중입니다.' : '저장하는 중입니다.', { stay: true });
    const verb = !current ? '추가' : nextState === 'draft' ? '임시저장' : nextState === 'private' ? '비공개로 저장' : '출간';
    const response = await api(contentPath(path), { method: 'PUT', body: JSON.stringify({ message: `docs(publish): ${input.title} ${verb}`, content: toBase64(text), branch: settings.branch, ...(current && !renamed ? { sha: current.sha } : {}) }) });
    if (response.status === 409 || response.status === 422) return say('다른 곳에서 먼저 바뀌었습니다. 새로고침한 뒤 다시 저장해 주세요.');
    if (!response.ok) return say(`저장하지 못했습니다(${response.status}).`);
    const result = await response.json();
    // 임시 주소 파일은 새 주소 파일을 만든 뒤 지운다.
    if (renamed) await api(contentPath(current.path), { method: 'DELETE', body: JSON.stringify({ message: `docs(publish): ${input.title} 임시 파일 정리`, sha: current.sha, branch: settings.branch }) });
    const post = { ...readPost(text), path, name: path.split('/').pop(), sha: result.content.sha, text };
    state.posts = sortPosts([post, ...state.posts.filter(item => item.path !== path && item.path !== current?.path)]);
    state.current = post;
    state.thumbnail = undefined;
    state.dirty = false;
    renderAdminUi();
    // 사이트에 보이는 글이 생기거나 바뀌거나 사라질 때만 배포한다.
    if (nextState === 'public' || wasPublic) await deploy(nextState === 'public' ? '출간했습니다.' : '사이트에서 내렸습니다.');
    else say(`${nextState === 'draft' ? '임시저장했습니다.' : '비공개로 저장했습니다. 사이트에는 보이지 않습니다.'}${settings.demo ? ' (체험 모드)' : ''}`);
    if (nextState !== 'draft') { publish.hidden = true; write.hidden = true; lockPage(false); }
  }

  async function removePost(post) {
    if (!await confirm('글 삭제', `「${post.title}」을(를) 삭제할까요? Vault 저장소의 기록에는 남지만 사이트와 목록에서 사라집니다.`, '삭제')) return;
    const response = await api(contentPath(post.path), { method: 'DELETE', body: JSON.stringify({ message: `docs(publish): ${post.title} 삭제`, sha: post.sha, branch: settings.branch }) });
    if (!response.ok) return say(`삭제하지 못했습니다(${response.status}).`);
    state.posts = state.posts.filter(item => item.path !== post.path);
    renderAdminUi();
    if (post.state === 'public') await deploy('삭제했습니다.');
    else say('삭제했습니다.');
  }

  // 배포 작업을 실행하고 끝날 때까지 상태를 알린다.
  async function deploy(done) {
    if (settings.demo) { say(`${done} 체험 모드라 실제 저장소와 사이트는 바뀌지 않았습니다.`); return; }
    if (!settings.deploy) { say(`${done} 사이트에는 다음 배포 때 반영됩니다.`); return; }
    const [owner, repo, workflow] = settings.deploy.split('/');
    const base = `${API}/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}`;
    const started = Date.now();
    const response = await api(`${base}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: 'main' }) });
    if (!response.ok) { say(`${done} 배포를 시작하지 못했습니다(${response.status}). GitHub에서 직접 배포해 주세요.`, { stay: true }); return; }
    say(`${done} 사이트에 반영하는 중입니다(1~2분).`, { stay: true });
    for (let attempt = 0; attempt < 40; attempt++) {
      await new Promise(resolve => view.setTimeout(resolve, 6000));
      const runs = await (await api(`${base}/runs?per_page=1&event=workflow_dispatch`)).json().catch(() => ({}));
      const run = runs.workflow_runs?.[0];
      if (!run || Date.parse(run.created_at) < started - 60000 || run.status !== 'completed') continue;
      say(run.conclusion === 'success' ? '사이트에 반영했습니다. 새로고침하면 보입니다.' : '배포가 실패했습니다. GitHub Actions 기록을 확인해 주세요.', { stay: run.conclusion !== 'success' });
      return;
    }
    say('배포가 오래 걸립니다. 잠시 뒤 새로고침해 주세요.');
  }

  const run = task => Promise.resolve().then(task).catch(error => { if (error.message !== 'unauthorized') say(error.message || '처리하지 못했습니다.'); });

  doc.addEventListener('click', event => {
    const target = event.target;
    const action = target.closest('[data-action]')?.dataset.action;
    if (!action && !target.closest('[data-item],[data-format],[data-visibility],[data-tag]')) {
      if (!panel.hidden && !target.closest('.app-admin-panel, .app-admin-dock')) { panel.hidden = true; dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false'); }
      return;
    }
    const item = target.closest('[data-item]')?.dataset.item;
    const format = target.closest('[data-format]')?.dataset.format;
    const visibility = target.closest('[data-visibility]')?.dataset.visibility;
    const tag = target.closest('.app-tag-entry [data-tag]')?.dataset.tag;
    const current = () => state.posts.find(post => post.slug === view.location.pathname.match(/^\/blog\/([^/]+)\/$/)?.[1]);
    if (action === 'new-post') openWrite(null);
    else if (action === 'open-drafts') {
      panel.hidden = !panel.hidden;
      target.closest('[data-action]').setAttribute('aria-expanded', String(!panel.hidden));
    } else if (item) { const post = state.posts.find(entry => entry.path === item); if (post) openWrite(post); }
    else if (action === 'edit-post') { const post = current(); if (post) openWrite(post); }
    else if (action === 'delete-post') { const post = current(); if (post) run(() => removePost(post)); }
    else if (action === 'close-write') run(closeWrite);
    else if (action === 'save-draft') run(() => save('draft'));
    else if (action === 'open-publish') openPublish();
    else if (action === 'close-publish') publish.hidden = true;
    else if (action === 'publish') run(() => save(state.visibility));
    else if (action === 'upload-thumbnail') pickImage('thumbnail');
    else if (action === 'remove-thumbnail') { state.thumbnail = null; state.dirty = true; renderThumbnail(); }
    else if (action === 'dialog-cancel') closeDialog(false);
    else if (action === 'dialog-confirm') closeDialog(true);
    else if (format) applyFormat(format);
    else if (visibility) setVisibility(visibility);
    else if (tag !== undefined) { state.tags = state.tags.filter(value => value !== tag); state.dirty = true; renderTags(); schedulePreview(); tagInput.focus(); }
  });
  writeForm.addEventListener('input', event => {
    state.dirty = true;
    if (event.target !== tagInput) schedulePreview();
  });
  writeForm.addEventListener('submit', event => event.preventDefault());
  publishForm.addEventListener('submit', event => event.preventDefault());
  publishField('description').addEventListener('input', event => {
    publish.querySelector('[data-publish-count]').textContent = String(Math.min(event.target.value.length, DESCRIPTION_LIMIT));
    state.dirty = true;
  });
  title.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); tagInput.focus(); } });
  tagInput.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTags(tagInput.value); tagInput.value = ''; }
    else if (event.key === 'Backspace' && !tagInput.value && state.tags.length) { state.tags = state.tags.slice(0, -1); state.dirty = true; renderTags(); schedulePreview(); }
  });
  tagInput.addEventListener('blur', () => { if (tagInput.value.trim()) { addTags(tagInput.value); tagInput.value = ''; } });
  fileInput.addEventListener('change', () => { const [file] = fileInput.files; if (file) run(() => uploadImage(file)); });
  doc.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!dialog.hidden) closeDialog(false);
    else if (!publish.hidden) publish.hidden = true;
    else if (!write.hidden) run(closeWrite);
    else if (!panel.hidden) { panel.hidden = true; dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false'); }
  });
  view.addEventListener('beforeunload', event => { if (state.dirty && !write.hidden) event.preventDefault(); });

  run(loadPosts);
  if (settings.demo) say('체험 모드입니다. 저장·삭제·배포는 이 탭 안에서만 흉내 냅니다. /admin/에서 끝낼 수 있습니다.', { stay: false });
  return state;
}
