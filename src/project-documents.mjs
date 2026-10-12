// 프로젝트 정본의 해시를 확인하고 기존 문서 뷰어에 필요한 경로와 참조를 연결한다.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASE = '/projects/thinkflow/';
const ASSETS = '/assets/projects/thinkflow/';

export function projectRoute(file) {
  if (!/^docs\/[a-zA-Z0-9./-]+\.md$/.test(file) || file.split('/').some(part => part === '.' || part === '..')) throw new Error(`invalid project document: ${file}`);
  return BASE + (file === 'docs/README.md' ? '' : file.slice(5, -3).toLowerCase() + '/');
}
function projectId(file) {
  return 'thinkflow' + (file === 'docs/README.md' ? '' : '-' + file.slice(5, -3).toLowerCase().replaceAll('/', '-'));
}

export function readProjectDocuments() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'config/project-documents.json')));
  const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json')));
  if (manifest.repository !== 'woonyong-choi/thinkflow' || !/^[a-f0-9]{40}$/.test(manifest.revision) || !lock.packages['node_modules/thinkflow'].resolved.endsWith('#' + manifest.revision)) throw new Error('project documents do not match the installed ThinkFlow revision');
  const root = join(ROOT, 'content/projects/thinkflow');
  const actual = readdirSync(root, { recursive: true, withFileTypes: true }).filter(entry => !entry.isDirectory()).map(entry => posix.join(entry.parentPath.slice(root.length + 1), entry.name)).sort();
  if (JSON.stringify(actual) !== JSON.stringify(Object.keys(manifest.files).sort())) throw new Error('unexpected or missing project document files');
  const documents = [];
  const assets = new Map();
  for (const [file, hash] of Object.entries(manifest.files)) {
    if (!/^(?:docs\/[a-zA-Z0-9./-]+\.(?:md|svg|png|jpg|webp)|LICENSE|NOTICE)$/.test(file) || file.split('/').some(part => part === '.' || part === '..')) throw new Error(`invalid project file: ${file}`);
    const path = join(root, file);
    if (!lstatSync(path).isFile()) throw new Error(`project file must be regular: ${file}`);
    const bytes = readFileSync(path);
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error(`project document hash mismatch: ${file}`);
    if (!file.endsWith('.md')) { assets.set(ASSETS + file, bytes); continue; }
    const body = bytes.toString('utf8');
    const title = /^# (.+)$/m.exec(body)?.[1];
    if (!title) throw new Error(`project document has no title: ${file}`);
    const id = projectId(file);
    documents.push({ id, slug: id, title, description: '', type: 'wiki', visibility: 'public', published: true, category: 'projects', field: 'cs', tags: [], parent: file === 'docs/README.md' ? null : 'thinkflow', contentIcon: { name: 'hierarchy' }, route: projectRoute(file), body, project: { file, manifest }, sourceUrl: `https://github.com/${manifest.repository}/blob/${manifest.revision}/${file}` });
  }
  return { documents, assets };
}

export function projectReference(reference, project) {
  if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) return reference;
  const url = new URL(reference, 'https://project.invalid/' + project.file);
  const file = decodeURIComponent(url.pathname.slice(1));
  if (file.includes('\\') || file.split('/').some(part => part === '.' || part === '..')) throw new Error(`invalid project reference: ${reference}`);
  if (file.endsWith('.md') && Object.hasOwn(project.manifest.files, file)) {
    const fragment = url.hash ? '#' + projectId(file) + '-' + decodeURIComponent(url.hash.slice(1)) : '';
    return projectRoute(file) + url.search + fragment;
  }
  if (Object.hasOwn(project.manifest.files, file)) return ASSETS + file + url.search + url.hash;
  if (file.startsWith('docs/')) throw new Error(`missing project reference: ${reference}`);
  return `https://github.com/${project.manifest.repository}/blob/${project.manifest.revision}/${file}${url.search}${url.hash}`;
}

const FIGURE_IMAGE = /^!\[[^\]]*\]\(([^)\s]+\.svg)\)\s*<!-- thinkflow -->\s*$/;

// 이 문서의 SVG 자산을 가리키는 ThinkFlow 표식 이미지 한 줄인지 확인한다.
function isProjectFigure(content, project) {
  const source = FIGURE_IMAGE.exec(content)?.[1];
  if (!source) return false;
  try {
    return projectReference(source, project).startsWith(ASSETS);
  } catch {
    return false;
  }
}

// ThinkFlow md가 첫 그림 다음에 만드는 장면 구간이 식별자(이름 있는 울타리는 `name=이름`, 이름 없는 울타리는 시작 표식의 `n=순번`) 소유 표식과 장면별 details·그림으로 온전히 이어지면 그 끝 다음 토큰 번호를 돌려준다. 하나라도 다르면 undefined다.
function sceneRegionEnd(tokens, fence, id, project) {
  const level = tokens[fence].level;
  const shape = ['details_open', 'summary_open', 'inline', 'summary_close', 'paragraph_open', 'inline', 'paragraph_close', 'details_close'];
  let at = fence + 4;
  let count = 0;
  while (tokens[at]?.type === 'details_open') {
    if (shape.some((type, step) => tokens[at + step]?.type !== type) || tokens[at].level !== level || tokens[at].attrGet('open') !== null || !isProjectFigure(tokens[at + 5].content, project)) return undefined;
    at += shape.length;
    count += 1;
  }
  const mark = tokens[at + 1];
  if (!count || tokens[at]?.type !== 'paragraph_open' || mark?.type !== 'inline' || mark.content !== `<!-- /thinkflow scenes v1 ${id} -->` || tokens[at + 2]?.type !== 'paragraph_close') return undefined;
  return at + 3;
}

export function prepareProjectTokens(tokens, page, env) {
  if (!page.project) return;
  if (tokens[0]?.type === 'heading_open' && tokens[0].tag === 'h1') {
    tokens.splice(0, 3);
    env.headings = env.headings.filter(heading => heading.level !== 1);
  }
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'fence' && /^thinkflow(?:\s|$)/.test(token.info)) {
      if (!/^thinkflow(?:\s+name=[\w-]+)?\s*$/.test(token.info)) throw new Error(`unsupported project diagram options: ${token.info}`);
      const name = /name=([\w-]+)/.exec(token.info)?.[1];
      token.info = 'thinkflow';
      const inline = tokens[index + 2];
      if (tokens[index + 1]?.type !== 'paragraph_open' || inline?.type !== 'inline' || tokens[index + 3]?.type !== 'paragraph_close') continue;
      if (/^!\[[^\]]*\]\([^)]+\.svg\)\s*<!-- thinkflow -->\s*$/.test(inline.content)) {
        tokens.splice(index + 1, 3);
        continue;
      }
      const [figure, mark, ...rest] = inline.content.split('\n');
      const id = rest.length ? undefined : (name ? `name=${name}` : /^<!-- thinkflow scenes v1 (n=[1-9]\d*) -->$/.exec(mark)?.[1]);
      const end = id && mark === `<!-- thinkflow scenes v1 ${id} -->` && isProjectFigure(figure, page.project) ? sceneRegionEnd(tokens, index, id, page.project) : undefined;
      if (end) tokens.splice(index + 1, end - index - 1);
    }
    for (const child of token.children ?? []) {
      for (const attribute of ['href', 'src']) {
        const reference = child.attrGet(attribute);
        if (reference) child.attrSet(attribute, projectReference(reference, page.project));
      }
    }
  }
}
