// /admin 글 작성 화면의 동작. GitHub 로그인 토큰으로 Vault 저장소의 발행 글을 읽고 커밋한다.
// 토큰은 이 탭의 sessionStorage에만 두며 GitHub API 외의 곳으로 보내지 않는다.
import MarkdownIt from 'markdown-it';
import { parseDocumentSync } from 'document-engine/parser';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { fromBase64, imageFileName, imageMarkdown, parseTags, postFileName, readPost, SLUG, toBase64, writePost } from './admin-model.mjs';

const TOKEN_KEY = 'admin-github-token';
const DATE = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const API = 'https://api.github.com';
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const renderToken = markdown.renderer.renderToken.bind(markdown.renderer);
// 엔진 전용 블록(탭·도표 등)은 태그 없는 토큰으로 온다. 미리보기에서는 빈 태그를 만들지 않는다.
markdown.renderer.renderToken = (tokens, index, options) => tokens[index].tag ? renderToken(tokens, index, options) : '';

function nodeFrom(component) {
  if (!ui.isTrusted(component)) throw new TypeError('theme component output required');
  const template = document.createElement('template');
  template.innerHTML = component.html;
  return template.content.firstElementChild;
}

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function initAdmin(root, { fetcher = (...args) => fetch(...args), storage = sessionStorage, openWindow = (...args) => window.open(...args), confirmLeave = message => window.confirm(message) } = {}) {
  const view = root.ownerDocument.defaultView;
  const config = JSON.parse(root.dataset.admin);
  const $ = selector => root.querySelector(selector);
  const statuses = [$('[data-admin-status]'), $('[data-admin-signin-status]')].filter(Boolean);
  const layout = $('.app-editor');
  const signin = $('[data-admin-signin]');
  const editor = $('[data-admin-editor]');
  const form = $('[data-admin-form]');
  const list = $('[data-admin-list]');
  const preview = $('[data-admin-preview]');
  const problems = $('[data-admin-problems]');
  const slugField = $('[data-admin-slug]');
  const imageInput = $('[data-admin-image]');
  const fields = name => form.elements.namedItem(name);
  const images = new Map();
  const state = { posts: [], current: null, dirty: false, token: storage.getItem(TOKEN_KEY) ?? '' };

  const say = message => { for (const status of statuses) status.textContent = message; };

  // 세 칸이 다 보이지 않는 너비에서 보이는 칸을 고른다. 넓은 화면에서는 CSS가 모든 칸을 보인다.
  function setView(view) {
    layout.dataset.view = view;
    for (const button of root.querySelectorAll('[data-action^="view-"]')) button.setAttribute('aria-pressed', String(button.dataset.action === `view-${view}`));
    if (view === 'preview') renderPreview();
  }

  async function api(path, init = {}) {
    const response = await fetcher(`${API}/repos/${config.repository}/${path}`, {
      ...init,
      headers: { authorization: `Bearer ${state.token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers },
    });
    if (response.status === 401) { signOut('로그인이 만료됐습니다. 다시 로그인해 주세요.'); throw new Error('unauthorized'); }
    return response;
  }
  const contentPath = path => `contents/${path.split('/').map(encodeURIComponent).join('/')}`;

  function showEditor(signedIn) {
    signin.hidden = signedIn;
    editor.hidden = !signedIn;
  }

  function signOut(message = '로그아웃했습니다.') {
    storage.removeItem(TOKEN_KEY);
    state.token = '';
    state.posts = [];
    showEditor(false);
    say(message);
  }

  function renderList() {
    const items = state.posts.map(post => ({ id: post.path, title: post.title || post.name, state: post.state, date: post.publishedAt, selected: post.path === state.current?.path }));
    list.replaceChildren(items.length ? nodeFrom(ui.EditorList({ label: '발행 글', items })) : Object.assign(root.ownerDocument.createElement('p'), { className: 'app-caption', textContent: '아직 글이 없습니다. 새 글을 써 보세요.' }));
  }

  async function loadPosts() {
    say('글 목록을 불러오는 중입니다.');
    const response = await api(`${contentPath(config.posts)}?ref=${encodeURIComponent(config.branch)}`);
    if (response.status === 404) { state.posts = []; renderList(); say(`${config.posts} 폴더가 아직 없습니다. 새 글을 저장하면 만들어집니다.`); return; }
    if (!response.ok) throw new Error(`글 목록을 읽지 못했습니다(${response.status}).`);
    const files = (await response.json()).filter(item => item.type === 'file' && item.name.endsWith('.md'));
    const posts = await Promise.all(files.map(async file => {
      const item = await (await api(`${contentPath(file.path)}?ref=${encodeURIComponent(config.branch)}`)).json();
      const text = fromBase64(item.content);
      return { ...readPost(text), path: file.path, name: file.name, sha: item.sha, text };
    }));
    state.posts = posts.filter(post => post.type === 'blog').sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.name.localeCompare(b.name));
    renderList();
    say(`글 ${state.posts.length}편을 불러왔습니다.`);
  }

  function fill(post) {
    fields('title').value = post?.title ?? '';
    fields('slug').value = post?.slug ?? '';
    slugField.hidden = Boolean(post);
    fields('description').value = post?.description ?? '';
    fields('tags').value = post?.tags.join(', ') ?? '';
    fields('publishedAt').value = post?.publishedAt || today();
    fields('state').value = post?.state ?? 'draft';
    fields('body').value = post?.body ?? '';
    state.current = post;
    state.dirty = false;
    renderList();
    renderPreview();
  }

  function leaveOk() {
    return !state.dirty || confirmLeave('저장하지 않은 내용이 있습니다. 버리고 이동할까요?');
  }

  // 미리보기는 사이트와 같은 해석기로 문법을 확인하고 본문 글자 모양만 보여 준다. 탭·도표 같은 전용 블록은 배포 뒤 사이트에서 확인한다.
  function renderPreview() {
    const body = fields('body').value;
    const parsed = parseDocumentSync(body, { id: 'admin-preview', features: { tabs: true, diagrams: true } });
    const input = values();
    const tags = input.tags.length ? ui.TagList({ tags: input.tags.map(tag => ({ href: `/search/?tag=${encodeURIComponent(tag)}`, label: tag })), size: 'medium' }) : undefined;
    // 글 머리와 본문 틀은 사이트 글 화면과 같은 PostArticle로 그린다.
    preview.innerHTML = ui.PostArticle({
      id: 'admin-preview', detail: true, href: '/', title: input.title || '제목 없음',
      date: input.publishedAt, dateLabel: input.publishedAt ? DATE.format(new Date(input.publishedAt)) : '', lead: ui.trusted(ui.escape(input.description)), tags,
      body: ui.trusted(markdown.renderer.render(parsed.tokens, markdown.options, parsed.env)), byline: config.author,
    }).html;
    for (const image of preview.querySelectorAll('img[src^="../assets/"]')) showImage(image);
    const errors = parsed.diagnostics.filter(item => item.severity === 'error');
    problems.replaceChildren(...errors.map(item => Object.assign(root.ownerDocument.createElement('p'), { className: 'app-caption', textContent: `문법 오류 ${item.line ?? 1}줄: ${item.message}` })));
  }

  // 비공개 저장소의 그림은 주소로 바로 열 수 없으므로 토큰으로 받아 이 탭 안에서만 보여 준다.
  async function showImage(image) {
    const file = decodeURIComponent(image.getAttribute('src').slice('../assets/'.length));
    if (!images.has(file)) {
      images.set(file, api(`${contentPath(`${config.assets}/${file}`)}?ref=${encodeURIComponent(config.branch)}`, { headers: { accept: 'application/vnd.github.raw' } })
        .then(response => response.ok ? response.blob() : null).then(blob => blob ? view.URL.createObjectURL(blob) : '').catch(() => ''));
    }
    const url = await images.get(file);
    if (url) image.src = url;
  }

  function values() {
    return {
      title: fields('title').value.replace(/\s*\n\s*/g, ' ').trim(), slug: fields('slug').value.trim(), description: fields('description').value.trim(),
      tags: parseTags(fields('tags').value), publishedAt: fields('publishedAt').value, state: fields('state').value, body: fields('body').value,
    };
  }

  async function save() {
    const input = values();
    if (!input.title) return say('제목을 입력해 주세요.');
    if (!SLUG.test(input.slug)) return say('주소 이름은 영어 소문자·숫자와 - 만 쓸 수 있습니다.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) return say('발행일을 입력해 주세요.');
    const current = state.current;
    if (!current && state.posts.some(post => post.slug === input.slug)) return say('같은 주소 이름의 글이 이미 있습니다.');
    const path = current?.path ?? `${config.posts}/${postFileName(input.slug, input.publishedAt)}`;
    const text = writePost(current?.text, input);
    if (current && text === current.text) return say('바뀐 내용이 없습니다.');
    say('저장하는 중입니다.');
    const response = await api(contentPath(path), {
      method: 'PUT',
      body: JSON.stringify({ message: `docs(publish): ${input.title} ${current ? '수정' : '추가'}`, content: toBase64(text), branch: config.branch, ...(current ? { sha: current.sha } : {}) }),
    });
    if (response.status === 409 || response.status === 422) return say('다른 곳에서 먼저 바뀌었습니다. 목록을 새로 불러온 뒤 다시 저장해 주세요.');
    if (!response.ok) return say(`저장하지 못했습니다(${response.status}).`);
    const result = await response.json();
    const post = { ...readPost(text), path, name: path.split('/').pop(), sha: result.content.sha, text };
    state.posts = [post, ...state.posts.filter(item => item.path !== path)].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.name.localeCompare(b.name));
    fill(post);
    say(`저장했습니다. ${post.state === 'public' ? '사이트에는 Vault 동기화와 배포 뒤에 보입니다.' : '초안이라 사이트에는 보이지 않습니다.'}`);
  }

  async function uploadImage(file) {
    const name = imageFileName(file.name, file.type, today());
    say('그림을 올리는 중입니다.');
    const content = await new Promise((resolve, reject) => {
      const reader = new view.FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const response = await api(contentPath(`${config.assets}/${name}`), { method: 'PUT', body: JSON.stringify({ message: `docs(assets): ${name} 추가`, content, branch: config.branch }) });
    if (response.status === 422) return say('같은 이름의 그림이 이미 있습니다. 파일 이름을 바꿔 다시 올려 주세요.');
    if (!response.ok) return say(`그림을 올리지 못했습니다(${response.status}).`);
    images.set(name, Promise.resolve(view.URL.createObjectURL(file)));
    const area = fields('body');
    const snippet = `\n${imageMarkdown(file.name.replace(/\.[^.]*$/, ''), name)}\n`;
    area.setRangeText(snippet, area.selectionStart, area.selectionEnd, 'end');
    state.dirty = true;
    renderPreview();
    say('그림을 올리고 본문에 넣었습니다. 설명 글(대체 텍스트)을 알맞게 고쳐 주세요.');
  }

  const run = task => Promise.resolve().then(task).catch(error => { if (error.message !== 'unauthorized') say(error.message || '처리하지 못했습니다.'); });

  root.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    const item = event.target.closest('[data-item]')?.dataset.item;
    if (action === 'signin') {
      const url = new URL('/auth', config.authUrl);
      url.searchParams.set('origin', view.location.origin);
      openWindow(String(url), 'admin-auth', 'width=600,height=720');
      say('GitHub 로그인 창에서 허용해 주세요.');
    } else if (action === 'signout') signOut();
    else if (action === 'new-post') { if (leaveOk()) { fill(null); setView('edit'); fields('title').focus(); } }
    else if (action === 'insert-image') imageInput.click();
    else if (action === 'save') run(save);
    else if (action?.startsWith('view-')) setView(action.slice(5));
    else if (item && leaveOk()) { fill(state.posts.find(post => post.path === item) ?? null); setView('edit'); }
  });
  view.addEventListener('message', event => {
    if (!config.authUrl || event.origin !== new URL(config.authUrl).origin || event.data?.type !== 'admin-auth') return;
    if (!event.data.token) return say(event.data.error ?? '로그인하지 못했습니다.');
    state.token = event.data.token;
    storage.setItem(TOKEN_KEY, state.token);
    showEditor(true);
    fill(null);
    run(loadPosts);
  });
  let pending = 0;
  form.addEventListener('input', () => {
    state.dirty = true;
    view.clearTimeout(pending);
    pending = view.setTimeout(renderPreview, 150);
  });
  form.addEventListener('submit', event => { event.preventDefault(); run(save); });
  // 제목은 한 줄 값이다. 줄바꿈 대신 요약 칸으로 옮긴다.
  fields('title').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); fields('description').focus(); } });
  imageInput.addEventListener('change', () => { const [file] = imageInput.files; imageInput.value = ''; if (file) run(() => uploadImage(file)); });
  view.addEventListener('beforeunload', event => { if (state.dirty) event.preventDefault(); });

  if (state.token) { showEditor(true); fill(null); run(loadPosts); } else showEditor(false);
  return state;
}

const root = typeof document === 'undefined' ? null : document.querySelector('[data-admin]');
if (root) initAdmin(root);
