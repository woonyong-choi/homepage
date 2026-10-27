// 관리자에게만 불러오는 글 관리 기능. 사이트 화면은 그대로 두고 오른쪽 아래 단추, 임시·비공개 글 목록,
// 글 화면의 수정·삭제, 벨로그식 작성·출간 화면을 얹는다. 글은 Vault 저장소에 커밋하고 공개 글이 바뀌면 배포를 실행한다.
// 썸네일과 요약은 따로 고르지 않는다. 사이트와 같은 규칙으로 본문의 첫 그림과 첫 문단에서 정한다.
import { parseDocumentSync, renderPreview } from 'document-engine/preview';
import { bodyWithSummary, splitLead, summaryOf } from './article-summary.mjs';
import { publishDate } from './content-metadata.mjs';
import { createSiteSync } from './admin-site.mjs';
import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';
import { fromBase64, imageFileName, imageMarkdown, postFileName, readPost, SLUG, toBase64, writePost } from './admin-model.mjs';
import { TOKEN_KEY } from './admin-token.mjs';

const API = 'https://api.github.com';
const DATE = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
// 작성 중 자동 임시저장 주기. 공개 글은 자동으로 저장하지 않는다(저장하면 사이트에 바로 반영해야 하므로).
const AUTOSAVE_MS = 60000;

// 서식 단추가 넣는 문법. line은 줄 앞에 붙이고, wrap은 고른 글자를 감싼다.
const FORMATS = {
  h1: { line: '# ' }, h2: { line: '## ' }, h3: { line: '### ' }, h4: { line: '#### ' }, quote: { line: '> ' },
  bold: { wrap: ['**', '**'], fallback: '굵은 글자' }, italic: { wrap: ['_', '_'], fallback: '기울인 글자' }, strike: { wrap: ['~~', '~~'], fallback: '취소한 글자' },
  link: { wrap: ['[', '](https://)'], fallback: '링크 글자' }, code: { wrap: ['\n```\n', '\n```\n'], fallback: '코드' },
};

const today = () => publishDate();
const sortPosts = posts => posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.name.localeCompare(b.name));

function nodeFrom(component) {
  if (!ui.isTrusted(component)) throw new TypeError('theme component output required');
  const template = document.createElement('template');
  template.innerHTML = component.html;
  return template.content.firstElementChild;
}

export function startAdmin(settings, token, { fetcher = (...args) => fetch(...args), storage = localStorage, doc = document } = {}) {
  const view = doc.defaultView;
  const state = { token, posts: [], current: null, tags: [], visibility: 'public', dirty: false, edits: 0, saving: false, closing: false, images: new Map() };

  // 화면 조각은 모두 공통 구성 요소로 만든다.
  const toast = nodeFrom(ui.Toast());
  const dock = nodeFrom(ui.AdminDock({ count: 0 }));
  let panel = nodeFrom(ui.AdminDrafts({ items: [] }));
  const write = nodeFrom(ui.WriteScreen({ preview: ui.trusted('<div data-write-preview></div>') }));
  const publish = nodeFrom(ui.PublishScreen({ card: ui.trusted('') }));
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
    // 사이트에 없는 글(임시·비공개, 출간했지만 사이트 반영이 끝나지 않은 공개 글)을 목록에 둔다.
    const hidden = state.posts.filter(post => post.state !== 'public' || post.offline);
    dock.querySelector('[data-admin-count]').textContent = String(hidden.length);
    const label = post => post.state === 'private' ? '비공개' : post.state === 'public' ? '사이트 반영 안 됨' : '임시저장';
    const next = nodeFrom(ui.AdminDrafts({ items: hidden.map(post => ({ id: post.path, title: post.title || post.name, date: post.publishedAt, label: label(post) })) }));
    next.hidden = panel.hidden;
    panel.replaceWith(next);
    panel = next;
    const article = doc.querySelector('.app-blog-post.is-detail');
    const slug = view.location.pathname.match(/^\/blog\/([^/]+)\/$/)?.[1];
    const post = slug && state.posts.find(item => item.slug === slug);
    const byline = article?.querySelector('.app-post-byline') ?? article?.querySelector('.app-post-header');
    article?.querySelector('.app-post-owner')?.remove();
    if (byline && post) byline.append(nodeFrom(ui.PostOwnerActions()));
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
    await markOffline();
    renderAdminUi();
    if (await checkSiteAccess()) await repairSite();
  }

  // 공개 글 중 사이트 저장소의 승인 사본과 내용이 다른 글은 사이트 반영이 끝나지 않은 글이다. 승인 목록을 못 읽으면 표시하지 않는다.
  async function markOffline() {
    if (!siteSync) return;
    try {
      const pending = new Set(await siteSync.pending(state.posts));
      for (const post of state.posts) post.offline = pending.has(post);
    } catch { /* 반영 여부를 모르면 표시하지 않는다. */ }
  }
  // 반영되지 않은 공개 글은 관리 화면을 열 때 자동으로 다시 올린다.
  async function repairSite() {
    const pending = state.posts.filter(post => post.offline);
    if (!pending.length) return;
    say(`사이트에 반영되지 않은 글 ${pending.length}개를 다시 올리는 중입니다.`, { stay: true });
    await updateSite(pending.map(post => ({ post })));
    for (const post of pending) post.offline = false;
    renderAdminUi();
    await deploy(`사이트에 반영되지 않은 글 ${pending.length}개를 다시 올렸습니다.`);
  }

  // 공개 글은 사이트 저장소에도 커밋한다. 토큰에 그 저장소 쓰기 권한이 없으면 출간 전에 알린다.
  async function checkSiteAccess() {
    if (!siteRepo) return false;
    const response = await api(`${API}/repos/${siteRepo}`);
    const permissions = response.ok ? (await response.json()).permissions : null;
    if (!permissions?.push) say(`토큰에 ${siteRepo} 쓰기 권한이 없어 출간한 글이 사이트에 반영되지 않습니다. /admin/에서 두 저장소를 고른 토큰으로 다시 로그인해 주세요.`, { stay: true });
    return Boolean(permissions?.push);
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
    if (state.tags.length !== before) { markDirty(); renderTags(); schedulePreview(); }
  }

  function openWrite(post) {
    state.current = post;
    state.tags = [...(post?.tags ?? [])];
    title.value = post?.title ?? '';
    // 요약을 따로 써 둔 기존 글은 그 요약을 본문 첫 문단으로 넣어 연다. 저장하면 요약이 그대로 유지된다.
    body.value = post ? bodyWithSummary(post.body, parseDocumentSync(post.body, { id: 'admin-open', features: settings.features ?? {} }).tokens, post.description, post.title) : '';
    tagInput.value = '';
    renderTags();
    drawPreview();
    state.dirty = false;
    panel.hidden = true;
    dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false');
    // 공개된 글은 임시저장으로 사이트에서 내리지 않는다. 출간하기 대신 수정하기로 바로 반영한다.
    const published = post?.state === 'public';
    write.querySelector('[data-action=save-draft]').hidden = published;
    write.querySelector('[data-action=open-publish]').textContent = published ? '수정하기' : '출간하기';
    publish.querySelector('[data-action=publish]').textContent = published ? '수정하기' : '출간하기';
    write.hidden = false;
    lockPage(true);
    write.querySelector('.app-write-fields').scrollTop = 0;
    title.focus({ preventScroll: true });
    pushView('write');
  }

  // 작성·출간 화면은 브라우저 기록에 한 칸씩 쌓는다. 뒤로 가기는 열린 화면을 하나씩 닫는다.
  function pushView(name) {
    view.history.pushState({ admin: name }, '', view.location.href);
  }
  function hideWrite() {
    write.hidden = true;
    publish.hidden = true;
    lockPage(false);
    state.dirty = false;
  }
  async function onBack() {
    if (state.closing) { state.closing = false; return; }
    if (!dialog.hidden) closeDialog(false);
    if (!publish.hidden) { publish.hidden = true; return; }
    if (write.hidden) return;
    if (state.dirty && !await confirm('작성 화면 나가기', '저장하지 않은 내용이 있습니다. 나가면 바뀐 내용을 잃습니다.', '나가기')) { pushView('write'); return; }
    hideWrite();
  }
  // 저장을 마친 뒤 열린 화면 수만큼 기록을 되돌리며 닫는다.
  function closeAll() {
    const steps = (publish.hidden ? 0 : 1) + (write.hidden ? 0 : 1);
    hideWrite();
    if (steps) { state.closing = true; view.history.go(-steps); }
  }

  function markDirty() {
    state.dirty = true;
    state.edits += 1;
  }

  let previewTimer = 0;
  const schedulePreview = () => { view.clearTimeout(previewTimer); previewTimer = view.setTimeout(drawPreview, 150); };
  const heading = () => title.value.replace(/\s*\n\s*/g, ' ').trim();
  const parseBody = () => parseDocumentSync(body.value, { id: 'admin-preview', features: settings.features ?? {} });
  const html = (parsed, tokens) => renderPreview({ ...parsed, tokens }, { ui }).html;
  // 미리보기는 사이트 글 화면과 같은 PostArticle과 같은 문서 엔진 규칙으로 그린다. 요약·글 머리도 사이트와 같은 규칙이다.
  // 코드 강조와 도표 그림은 배포 뒤 사이트에서 보인다.
  function drawPreview() {
    const parsed = parseBody();
    const description = summaryOf(parsed.tokens, heading());
    const split = splitLead(parsed.tokens, description, heading());
    const lead = split.kind === 'lead' ? html(parsed, split.lead) : split.kind === 'summary' ? ui.escape(description) : '';
    const date = state.current?.publishedAt || today();
    const tags = state.tags.length ? ui.TagList({ tags: state.tags.map(tag => ({ href: `/search/?tag=${encodeURIComponent(tag)}`, label: tag })), size: 'medium' }) : undefined;
    preview.innerHTML = ui.PostArticle({
      id: 'admin-preview', detail: true, href: '/', title: heading() || '제목 없음', date, dateLabel: DATE.format(new Date(date)),
      lead: ui.trusted(lead), tags, body: ui.trusted(html(parsed, split.tokens)), byline: settings.author,
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

  // 서식 단추는 고른 줄·글자에 Markdown 문법을 넣거나, 이미 있으면 뺀다(다시 누르면 해제).
  function applyFormat(format) {
    if (format === 'image') { pickImage(); return; }
    const rule = FORMATS[format];
    const { value } = body;
    let start = body.selectionStart;
    let end = body.selectionEnd;
    if (rule.line) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
      const lines = value.slice(lineStart, lineEnd).split('\n');
      const strip = line => format === 'quote' ? line.replace(/^>\s?/, '') : line.replace(/^#{1,6}\s+/, '');
      const active = lines.every(line => format === 'quote' ? /^>\s?/.test(line) : line.startsWith(rule.line));
      const next = lines.map(line => active ? strip(line) : `${rule.line}${strip(line)}`).join('\n');
      body.setRangeText(next, lineStart, lineEnd, 'end');
    } else if (format === 'code' && !value.slice(start, end).includes('\n') && start !== end) {
      toggleWrap('`', '`', start, end, '코드');
    } else if (format === 'link') {
      const text = value.slice(start, end) || rule.fallback;
      body.setRangeText(`[${text}](https://)`, start, end, 'end');
      const url = body.selectionEnd - 1;
      body.setSelectionRange(url - 'https://'.length, url);
    } else toggleWrap(rule.wrap[0], rule.wrap[1], start, end, rule.fallback);
    body.focus();
    markDirty();
    schedulePreview();
  }
  function toggleWrap(before, after, start, end, fallback) {
    const { value } = body;
    if (value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after) {
      body.setRangeText(value.slice(start, end), start - before.length, end + after.length, 'select');
      return;
    }
    const selected = value.slice(start, end) || fallback;
    body.setRangeText(`${before}${selected}${after}`, start, end, 'end');
    body.setSelectionRange(start + before.length, start + before.length + selected.length);
  }

  function pickImage() {
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
    body.setRangeText(`\n${imageMarkdown(file.name.replace(/\.[^.]*$/, ''), name)}\n`, body.selectionStart, body.selectionEnd, 'end');
    schedulePreview();
    markDirty();
    say('그림을 올렸습니다.');
  }

  // 출간 화면: 왼쪽에 사이트 목록 카드와 같은 BlogCard를 그린다. 썸네일은 글 머리에 이미 적힌 그림, 본문 첫 그림, 제목 표지 순서다.
  function renderCard() {
    const thumbnail = state.current?.thumbnail ?? null;
    const first = body.value.match(/!\[[^\]]*\]\(\.\.\/assets\/([^)\s]+)\)/)?.[1];
    const file = thumbnail?.src.startsWith('/assets/') ? thumbnail.src.slice('/assets/'.length) : thumbnail ? null : first;
    const external = thumbnail && !thumbnail.src.startsWith('/assets/') ? thumbnail.src : '';
    const date = publishField('publishedAt').value || today();
    const slug = publishField('slug').value.trim() || 'new-post';
    const card = ui.BlogCard({
      href: `/blog/${slug}/`, title: heading() || '제목 없음', level: 3, automaticCover: true,
      cover: file || external ? ui.trusted('<img data-card-image alt="">') : undefined,
      description: summaryOf(parseBody().tokens, heading()), tagItems: state.tags.map(tag => ({ href: `/search/?tag=${encodeURIComponent(tag)}`, label: tag })),
      author: settings.author, publishedAt: date, dateLabel: DATE.format(new Date(date)),
    });
    const box = publish.querySelector('[data-publish-card]');
    box.replaceChildren(nodeFrom(card));
    const image = box.querySelector('[data-card-image]');
    if (image && file) showImage(image, file);
    else if (image) image.src = external;
  }
  function setVisibility(value) {
    state.visibility = value;
    for (const [action, name] of [['visibility-public', 'public'], ['visibility-private', 'private']]) publish.querySelector(`[data-action=${action}]`).setAttribute('aria-pressed', String(value === name));
  }
  function openPublish() {
    if (!heading()) { say('제목을 입력해 주세요.'); title.focus(); return; }
    setVisibility(state.current?.state === 'private' ? 'private' : 'public');
    const slug = publishField('slug');
    slug.value = state.current?.slug ?? '';
    slug.readOnly = Boolean(state.current) && !state.current.slug.startsWith('draft-');
    if (slug.value.startsWith('draft-')) slug.value = '';
    publishField('publishedAt').value = state.current?.publishedAt || today();
    renderCard();
    publish.hidden = false;
    pushView('publish');
    publish.querySelector(`[data-action=visibility-${state.visibility}]`).focus();
  }

  function values(nextState) {
    return {
      title: heading(),
      slug: publish.hidden ? state.current?.slug ?? '' : publishField('slug').value.trim(),
      description: summaryOf(parseBody().tokens, heading()),
      tags: state.tags, publishedAt: publish.hidden ? state.current?.publishedAt || today() : publishField('publishedAt').value,
      state: nextState, body: body.value,
    };
  }

  // 임시저장은 아직 주소가 없으면 날짜와 제목에서 임시 주소를 만든다. 출간할 때 주소를 다시 정할 수 있다.
  function draftSlug() {
    return `draft-${today().replaceAll('-', '')}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // 저장은 한 번에 하나만 한다. 자동 저장 중에 누른 저장은 끝난 뒤 다시 누르도록 알린다.
  async function save(nextState, { auto = false } = {}) {
    if (state.saving) { if (!auto) say('저장하는 중입니다. 잠시 뒤 다시 눌러 주세요.'); return; }
    state.saving = true;
    try { await store(nextState, auto); } finally { state.saving = false; }
  }
  async function store(nextState, auto) {
    const input = values(nextState);
    const edits = state.edits;
    if (!input.title) return auto ? undefined : say('제목을 입력해 주세요.');
    if (nextState !== 'draft') {
      if (!SLUG.test(input.slug)) return say('주소 이름은 영어 소문자·숫자와 - 만 쓸 수 있습니다.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.publishedAt)) return say('발행일을 입력해 주세요.');
    } else if (!input.slug) input.slug = draftSlug();
    const current = state.current;
    const renamed = Boolean(current) && current.slug !== input.slug;
    if ((!current || renamed) && state.posts.some(post => post.slug === input.slug)) return say('같은 주소 이름의 글이 이미 있습니다.');
    const path = current && !renamed ? current.path : `${settings.posts}/${postFileName(input.slug, input.publishedAt)}`;
    const text = writePost(current?.text, input);
    const wasPublic = current?.state === 'public';
    if (current && text === current.text && nextState === current.state) {
      state.dirty = false;
      // 저장은 됐지만 사이트 반영이 끝나지 않은 공개 글은 바꾼 내용이 없어도 사이트에 다시 올린다.
      if (nextState === 'public' && current.offline && !auto) {
        closeAll();
        say('사이트에 올리는 중입니다.', { stay: true });
        await updateSite([{ post: current }]);
        current.offline = false;
        renderAdminUi();
        await deploy('사이트에 올렸습니다.');
        return;
      }
      if (!auto) say('바뀐 내용이 없습니다.');
      return;
    }
    if (!auto) say(nextState === 'public' ? '저장하는 중입니다.' : '임시저장하는 중입니다.', { stay: true });
    const verb = { draft: current ? '임시저장' : '임시 글 추가', private: '비공개 저장', public: wasPublic ? '수정' : '출간' }[nextState];
    const response = await api(contentPath(path), { method: 'PUT', body: JSON.stringify({ message: `docs(publish): ${input.title} ${verb}`, content: toBase64(text), branch: settings.branch, ...(current && !renamed ? { sha: current.sha } : {}) }) });
    if (response.status === 409 || response.status === 422) return say('다른 곳에서 먼저 바뀌었습니다. 새로고침한 뒤 다시 저장해 주세요.');
    if (!response.ok) return say(`저장하지 못했습니다(${response.status}).`);
    const result = await response.json();
    // 임시 주소 파일은 새 주소 파일을 만든 뒤 지운다.
    if (renamed) await api(contentPath(current.path), { method: 'DELETE', body: JSON.stringify({ message: `docs(publish): ${input.title} 임시 파일 정리`, sha: current.sha, branch: settings.branch }) });
    const post = { ...readPost(text), path, name: path.split('/').pop(), sha: result.content.sha, text };
    state.posts = sortPosts([post, ...state.posts.filter(item => item.path !== path && item.path !== current?.path)]);
    state.current = post;
    // 저장하는 동안 더 고친 내용이 있으면 아직 저장할 것이 남은 상태다.
    state.dirty = state.edits !== edits;
    renderAdminUi();
    // 사이트에 보이는 글이 생기거나 바뀌거나 사라질 때만 배포한다.
    if (nextState === 'public') {
      closeAll();
      say('사이트에 올리는 중입니다.', { stay: true });
      await updateSite([{ post }]);
      await deploy(wasPublic ? '수정했습니다.' : '출간했습니다.');
    } else if (wasPublic) {
      closeAll();
      say('사이트에서 내리는 중입니다.', { stay: true });
      await updateSite([{ post, remove: true }]);
      await deploy(nextState === 'private' ? '비공개로 바꿨습니다.' : '임시 글로 바꿨습니다.');
    } else if (nextState === 'private') {
      closeAll();
      say('비공개로 저장했습니다. 오른쪽 아래 목록에서 다시 열 수 있습니다.');
    } else say(auto ? '자동으로 임시저장했습니다.' : '임시저장했습니다.');
  }

  async function removePost(post) {
    if (!await confirm('글 삭제', `「${post.title}」을(를) 삭제할까요? Vault 저장소의 기록에는 남지만 사이트와 목록에서 사라집니다.`, '삭제')) return;
    const response = await api(contentPath(post.path), { method: 'DELETE', body: JSON.stringify({ message: `docs(publish): ${post.title} 삭제`, sha: post.sha, branch: settings.branch }) });
    if (!response.ok) return say(`삭제하지 못했습니다(${response.status}).`);
    state.posts = state.posts.filter(item => item.path !== post.path);
    renderAdminUi();
    if (post.state === 'public') { await updateSite([{ post, remove: true }]); await deploy('삭제했습니다.'); }
    else say('삭제했습니다.');
  }

  // 공개 글은 사이트 저장소의 승인 사본으로 옮긴다(src/admin-site.mjs). 사이트 저장소는 공개라 임시·비공개 글은 올리지 않는다.
  const siteRepo = settings.deploy ? settings.deploy.split('/').slice(0, 2).join('/') : '';
  const encode = bytes => { let binary = ''; for (let at = 0; at < bytes.length; at += 0x8000) binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000)); return btoa(binary); };
  const digest = async bytes => [...new Uint8Array(await view.crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  async function readVaultAsset(name) {
    const response = await api(`${contentPath(`${settings.assets}/${name}`)}${ref}`, { headers: { accept: 'application/vnd.github.raw' } });
    if (!response.ok) throw new Error(`그림을 읽지 못했습니다: ${name}`);
    return new Uint8Array(await response.arrayBuffer());
  }
  const siteSync = siteRepo ? createSiteSync({
    repo: siteRepo, request: (path, init) => api(`${API}/repos/${siteRepo}/${path}`, init), readVaultAsset, digest, encode, decode: fromBase64,
    wait: ms => new Promise(resolve => view.setTimeout(resolve, ms)),
  }) : null;
  async function updateSite(changes) {
    if (siteSync) await siteSync.apply(changes);
  }

  // 배포 작업을 실행하고 끝날 때까지 상태를 알린다.
  async function deploy(done) {
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
    if (!action && !target.closest('[data-item],[data-format],[data-tag]')) {
      if (!panel.hidden && !target.closest('.app-admin-panel, .app-admin-dock')) { panel.hidden = true; dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false'); }
      return;
    }
    const item = target.closest('[data-item]')?.dataset.item;
    const format = target.closest('[data-format]')?.dataset.format;
    const tag = target.closest('.app-tag-entry [data-tag]')?.dataset.tag;
    const current = () => state.posts.find(post => post.slug === view.location.pathname.match(/^\/blog\/([^/]+)\/$/)?.[1]);
    if (action === 'new-post') openWrite(null);
    else if (action === 'open-drafts') {
      panel.hidden = !panel.hidden;
      target.closest('[data-action]').setAttribute('aria-expanded', String(!panel.hidden));
    } else if (item) { const post = state.posts.find(entry => entry.path === item); if (post) openWrite(post); }
    else if (action === 'edit-post') { const post = current(); if (post) openWrite(post); }
    else if (action === 'delete-post') { const post = current(); if (post) run(() => removePost(post)); }
    else if (action === 'close-write') view.history.back();
    else if (action === 'save-draft') run(() => save('draft'));
    else if (action === 'open-publish') openPublish();
    else if (action === 'close-publish') view.history.back();
    else if (action === 'publish') run(() => save(state.visibility));
    else if (action === 'visibility-public' || action === 'visibility-private') setVisibility(action.slice('visibility-'.length));
    else if (action === 'dialog-cancel') closeDialog(false);
    else if (action === 'dialog-confirm') closeDialog(true);
    else if (format) applyFormat(format);
    else if (tag !== undefined) { state.tags = state.tags.filter(value => value !== tag); markDirty(); renderTags(); schedulePreview(); tagInput.focus(); }
  });
  writeForm.addEventListener('input', event => {
    markDirty();
    if (event.target !== tagInput) schedulePreview();
  });
  writeForm.addEventListener('submit', event => event.preventDefault());
  publishForm.addEventListener('submit', event => event.preventDefault());
  publishForm.addEventListener('input', () => {
    markDirty();
    renderCard();
  });
  // 작성 화면이 열려 있고 바뀐 내용이 있으면 1분마다 임시저장한다. 임시·비공개 글은 그 상태 그대로, 공개 글은 건너뛴다.
  view.setInterval(() => {
    if (write.hidden || !publish.hidden || !state.dirty || state.current?.state === 'public') return;
    run(() => save(state.current?.state ?? 'draft', { auto: true }));
  }, AUTOSAVE_MS);
  view.addEventListener('popstate', () => run(onBack));
  // 서식 단추를 눌러도 본문의 선택 영역이 풀리지 않게 한다.
  write.querySelector('.app-write-toolbar').addEventListener('mousedown', event => event.preventDefault());
  body.addEventListener('keydown', event => {
    if (!(event.metaKey || event.ctrlKey) || event.isComposing) return;
    const format = { b: 'bold', i: 'italic', k: 'link' }[event.key.toLowerCase()];
    if (format) { event.preventDefault(); applyFormat(format); }
  });
  title.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); tagInput.focus(); } });
  tagInput.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTags(tagInput.value); tagInput.value = ''; }
    else if (event.key === 'Backspace' && !tagInput.value && state.tags.length) { state.tags = state.tags.slice(0, -1); markDirty(); renderTags(); schedulePreview(); }
  });
  tagInput.addEventListener('blur', () => { if (tagInput.value.trim()) { addTags(tagInput.value); tagInput.value = ''; } });
  fileInput.addEventListener('change', () => { const [file] = fileInput.files; if (file) run(() => uploadImage(file)); });
  doc.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!dialog.hidden) closeDialog(false);
    else if (!publish.hidden || !write.hidden) view.history.back();
    else if (!panel.hidden) { panel.hidden = true; dock.querySelector('[data-action=open-drafts]').setAttribute('aria-expanded', 'false'); }
  });
  view.addEventListener('beforeunload', event => { if (state.dirty && !write.hidden) event.preventDefault(); });

  run(loadPosts);
  return state;
}
