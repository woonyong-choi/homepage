// 홈 원고의 본문과 메타데이터를 읽고 섹션별 계약을 검증한다.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { SOCIAL_ICONS } from './vendor/theme/ui/index.mjs';
import { iconFile } from './vendor/theme/ui/build/icons.mjs';
import { summaryParts } from './interviews.mjs';
import { readContentFile } from './content-files.mjs';

export const HOME_CONTENT = 'home.md';
export const LOCAL_INTERVIEWS = 'interviews.local.md';
const ROOT = fileURLToPath(new URL('../content/', import.meta.url));
const THEME = fileURLToPath(new URL('./vendor/theme/', import.meta.url));
const RESERVED_IDS = ['main'];
const IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'];
const VIDEO_TYPES = ['.mp4', '.webm'];
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const fail = (path, message) => { throw new Error(`${HOME_CONTENT} ${path}: ${message}`); };

function record(value, path, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, '키와 값을 가진 항목이어야 합니다');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, `알 수 없는 설정입니다. 사용할 수 있는 설정: ${keys.join(', ')}`);
  return value;
}

function list(value, path) {
  if (!Array.isArray(value)) fail(path, '목록이어야 합니다');
  return value;
}

function text(value, path, required = true) {
  if (value === undefined || value === null) return required ? fail(path, '값이 필요합니다') : undefined;
  if (typeof value !== 'string') fail(path, '문자열이어야 합니다. 숫자나 날짜처럼 읽히면 따옴표로 감싸세요');
  const trimmed = value.trim();
  if (!trimmed) return required ? fail(path, '비어 있을 수 없습니다') : undefined;
  return trimmed;
}

function flag(value, path) {
  if (value === undefined) return true;
  if (typeof value !== 'boolean') fail(path, 'true 또는 false여야 합니다');
  return value;
}

function secure(value, path) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch {
    fail(path, `HTTPS 주소여야 합니다: ${value}`);
  }
  return value;
}

export function href(value, path) {
  const link = text(value, path);
  if (/[\u0000- \\]/u.test(link)) fail(path, '공백, 제어 문자, 역슬래시를 쓸 수 없습니다');
  if (link.startsWith('#')) return /^#[A-Za-z][\w-]*$/.test(link) ? link : fail(path, `잘못된 페이지 안 연결입니다: ${link}`);
  if (link.startsWith('/')) return link.startsWith('//') ? fail(path, '//로 시작하는 주소는 쓸 수 없습니다') : link;
  return secure(link, path);
}

// 로컬 파일은 콘텐츠 자산 또는 검증된 테마 자산만 허용하고 빌드 전에 존재를 확인한다.
function media(value, path, types, context) {
  const source = text(value, path);
  if (!source.startsWith('/')) return secure(source, path);
  if (!/^\/(?:assets|media|theme\/assets)\/[A-Za-z0-9_][\w./-]*$/.test(source) || source.includes('//') || source.split('/').some(part => part === '..' || part === '.')) {
    fail(path, `콘텐츠 또는 테마 자산 아래의 안전한 경로여야 합니다: ${source}`);
  }
  if (!types.some(type => source.toLowerCase().endsWith(type))) fail(path, `${types.join(', ')} 파일이어야 합니다: ${source}`);
  if (context.check && !context.exists(source)) fail(path, `파일이 없습니다: ${source}`);
  return source;
}

function picture(value, path, context) {
  if (value === undefined) return undefined;
  const item = record(value, path, ['src', 'alt']);
  return { src: media(item.src, `${path}.src`, IMAGE_TYPES, context), alt: text(item.alt, `${path}.alt`, false) ?? '' };
}

function sectionIcon(value, path, context) {
  const image = typeof value === 'string' ? { src: `/theme/assets/icons/${iconFile(text(value, path))}` } : value;
  return picture(image, path, context);
}

// 요약 안의 [라벨](주소) 링크는 링크와 같은 주소 규칙을 따른다.
function summary(value, path) {
  const content = text(value, path);
  for (const part of summaryParts(content)) if (part.url !== undefined) href(part.url, `${path} 링크`);
  return content;
}

function link(value, path, hrefRequired = true) {
  if (value === undefined) return undefined;
  const item = record(value, path, ['label', 'href']);
  return { label: text(item.label, `${path}.label`), href: hrefRequired || item.href !== undefined ? href(item.href, `${path}.href`) : undefined };
}

// 아이콘, 제목, 설명을 가진 섹션 머리. 기본 문구가 없는 설명은 생략할 수 있다.
function intro(item, path, context, title, description) {
  return { icon: sectionIcon(item.icon, `${path}.icon`, context), title: text(item.title, `${path}.title`, false) ?? title, description: text(item.description, `${path}.description`, false) ?? description };
}

// 제목 아래 링크 행. icon은 내장 이름(github, rss, linkedin) 또는 이미지 파일이고 없으면 label이 글자로 보인다.
// 주소를 아직 모르는 내장 아이콘은 href 없이 두면 아이콘만 보이고 링크가 되지 않는다.
function links(value, path, context) {
  return list(value ?? [], path).map((entry, index) => {
    const where = `${path}[${index}]`;
    const item = record(entry, where, ['label', 'href', 'icon']);
    const icon = item.icon === undefined ? undefined : SOCIAL_ICONS.includes(item.icon) ? item.icon : media(item.icon, `${where}.icon`, IMAGE_TYPES, context);
    if (item.href === undefined && !(icon && SOCIAL_ICONS.includes(icon))) fail(`${where}.href`, '값이 필요합니다. 내장 아이콘만 href 없이 쓸 수 있습니다');
    return { label: text(item.label, `${where}.label`), href: item.href === undefined ? undefined : href(item.href, `${where}.href`), icon };
  });
}

const SECTIONS = {
  hero(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'title', 'description', 'icon', 'image', 'video', 'action']);
    const video = item.video === undefined ? undefined : record(item.video, `${path}.video`, ['src', 'poster', 'title']);
    return {
      title: text(item.title, `${path}.title`, false),
      description: text(item.description, `${path}.description`),
      icon: sectionIcon(item.icon, `${path}.icon`, context),
      image: picture(item.image, `${path}.image`, context),
      video: video && {
        src: media(video.src, `${path}.video.src`, VIDEO_TYPES, context),
        poster: video.poster === undefined ? undefined : media(video.poster, `${path}.video.poster`, IMAGE_TYPES, context),
        title: text(video.title, `${path}.video.title`),
      },
      action: link(item.action, `${path}.action`, false),
    };
  },
  projects(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'items']);
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const where = `${path}.items[${index}]`;
      const project = record(entry, where, ['enabled', 'title', 'description', 'link', 'icon', 'image']);
      const enabled = flag(project.enabled, `${where}.enabled`);
      const scope = { ...context, check: context.check && enabled };
      return {
        enabled,
        title: text(project.title, `${where}.title`),
        description: text(project.description, `${where}.description`),
        link: link(project.link, `${where}.link`),
        icon: sectionIcon(project.icon, `${where}.icon`, scope),
        image: picture(project.image, `${where}.image`, scope),
      };
    });
    return { items: items.filter(project => project.enabled) };
  },
  technologies(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'icon', 'title', 'description', 'items']);
    const seen = new Set();
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const id = text(entry, `${path}.items[${index}]`);
      if (!context.technologies.has(id)) fail(`${path}.items[${index}]`, `알 수 없는 기술입니다: ${id}`);
      if (seen.has(id)) fail(`${path}.items[${index}]`, `중복된 기술입니다: ${id}`);
      seen.add(id);
      return id;
    });
    return { ...intro(item, path, context, '함께 쓰는 기술', '기술별 기록을 모았습니다.'), items };
  },
  interviews(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'icon', 'title', 'description', 'links', 'items']);
    const seen = new Set();
    const items = list(item.items ?? [], `${path}.items`).map((entry, index) => {
      const where = `${path}.items[${index}]`;
      const interview = record(entry, where, ['id', 'summary', 'profile', 'url', 'example']);
      const id = text(interview.id, `${where}.id`);
      if (!/^[a-z0-9-]+$/.test(id)) fail(`${where}.id`, '영문 소문자, 숫자, -만 쓸 수 있습니다');
      if (seen.has(id)) fail(`${where}.id`, `중복된 인터뷰 id입니다: ${id}`);
      seen.add(id);
      if (interview.example !== undefined && typeof interview.example !== 'boolean') fail(`${where}.example`, 'true 또는 false여야 합니다');
      // 카드 아래는 이미지, 제목, 부제목 세 자리다. 회사, 플랫폼 같은 의미는 설정이 정한다.
      const profile = interview.profile === undefined ? undefined : record(interview.profile, `${where}.profile`, ['image', 'title', 'subtitle']);
      if (interview.url !== undefined && !profile) fail(`${where}.url`, '카드 링크를 설명할 profile.title이 필요합니다');
      return {
        id, example: interview.example === true,
        summary: summary(interview.summary, `${where}.summary`),
        profile: profile && {
          image: picture(profile.image, `${where}.profile.image`, context),
          title: text(profile.title, `${where}.profile.title`),
          subtitle: text(profile.subtitle, `${where}.profile.subtitle`, false),
        },
        url: interview.url === undefined ? undefined : secure(text(interview.url, `${where}.url`), `${where}.url`),
      };
    });
    return { ...intro(item, path, context, '사람들이 하는 말', '동료평가 소개 섹션입니다.'), links: links(item.links, `${path}.links`, context), items };
  },
  contact(section, path, context) {
    const item = record(section, path, ['id', 'type', 'enabled', 'icon', 'title', 'description', 'button', 'email']);
    const email = text(item.email, `${path}.email`);
    if (!EMAIL.test(email)) fail(`${path}.email`, `올바른 이메일 주소가 아닙니다: ${email}`);
    return {
      ...intro(item, path, context, '함께 만들어 볼까요?', '프로젝트와 협업에 관한 이야기를 기다립니다.'),
      email,
      button: text(item.button, `${path}.button`, false) ?? '메일 보내기',
    };
  },
};

// 섹션 id에서 파생되는 DOM id까지 포함해 한 페이지 안의 중복을 막는다.
export const DERIVED_IDS = {
  hero: id => [id, `${id}-video`, `${id}-player`],
  technologies: id => [id, `${id}-title`],
  interviews: id => [id, `${id}-title`],
  contact: id => [id, `${id}-title`],
};
const domIds = section => (DERIVED_IDS[section.type] ?? (id => [id]))(section.id);

export function parseHomeSections(data, { technologies = new Set(), exists = () => true } = {}) {
  const root = record(data ?? {}, '(최상위)', ['sections']);
  const used = new Map(RESERVED_IDS.map(id => [id, '예약된 id']));
  return list(root.sections ?? [], 'sections').flatMap((entry, index) => {
    const path = `sections[${index}]`;
    const base = record(entry, path, Object.keys(entry ?? {}));
    const type = text(base.type, `${path}.type`);
    if (!Object.hasOwn(SECTIONS, type)) fail(`${path}.type`, `알 수 없는 섹션 종류입니다: ${type}. 사용할 수 있는 종류: ${Object.keys(SECTIONS).join(', ')}`);
    const id = text(base.id, `${path}.id`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`${path}.id`, '영문 소문자로 시작하고 소문자, 숫자, -만 쓸 수 있습니다');
    const enabled = flag(base.enabled, `${path}.enabled`);
    const section = { id, type };
    for (const domId of domIds(section)) {
      if (used.has(domId)) fail(`${path}.id`, `DOM id "${domId}"가 ${used.get(domId)}와 겹칩니다`);
      used.set(domId, `${index}번째 섹션`);
    }
    const content = SECTIONS[type](base, path, { technologies, exists, check: enabled });
    return enabled ? [{ ...section, ...content }] : [];
  });
}

// cost: time O(b+n), heap O(b+n), stack O(d), io O(n)
// vars: b = 홈 원고 전체 바이트 수, n = 섹션과 카드 수, d = YAML 최대 중첩 깊이
// basis: estimate
export function loadHomeContent(technologies, root = ROOT, { preview = false } = {}) {
  const options = { technologies, exists: path => existsSync(path.startsWith('/theme/') ? join(THEME, path.slice('/theme/'.length)) : join(root, path)) };
  const home = readContentFile(join(root, HOME_CONTENT));
  record(home.metadata, '(최상위)', ['sections']);
  const entries = list(home.metadata.sections, 'sections').map((entry, index) => {
    if (!entry || !Object.hasOwn(entry, 'source')) return entry;
    const path = `sections[${index}]`;
    record(entry, path, ['source']);
    const source = text(entry.source, `${path}.source`);
    if (!/^[a-z][a-z0-9-]*\.md$/.test(source)) fail(`${path}.source`, '같은 content 폴더의 Markdown 파일 이름이어야 합니다');
    const { metadata, body } = readContentFile(join(root, source));
    const section = { ...metadata };
    if (section.type === 'technologies') delete section.topics;
    return withIntroduction(section, body, source);
  });
  if (home.body.trim()) {
    const hero = entries.findIndex(section => section?.type === 'hero');
    if (hero < 0) fail('sections', '홈 본문을 표시할 hero 섹션이 필요합니다');
    entries[hero] = withIntroduction(entries[hero], home.body, HOME_CONTENT);
  }
  const sections = parseHomeSections({ sections: entries }, options);
  const local = join(root, LOCAL_INTERVIEWS);
  if (!preview || !existsSync(local)) return sections;
  const interviews = sections.filter(section => section.type === 'interviews');
  if (interviews.length !== 1) throw new Error(`${LOCAL_INTERVIEWS}: 활성 인터뷰 섹션이 하나여야 합니다`);
  const { metadata, body } = readContentFile(local);
  record(metadata, LOCAL_INTERVIEWS, ['items']);
  if (body.trim()) throw new Error(`${LOCAL_INTERVIEWS}: 카드 내용은 items에 작성합니다`);
  const replacement = { ...interviews[0], items: metadata.items };
  return parseHomeSections({ sections: sections.map(section => section === interviews[0] ? replacement : section) }, options);
}

function withIntroduction(section, body, source) {
  if (Object.hasOwn(section, 'title') || Object.hasOwn(section, 'description')) throw new Error(`${source}: 제목과 소개는 Markdown 본문에 작성합니다`);
  const match = body.trim().match(/^# ([^\n]+)\n+([\s\S]*)$/);
  if (!match) throw new Error(`${source}: 첫 줄의 제목과 소개 문단이 필요합니다`);
  return { ...section, title: match[1].trim(), description: match[2].trim() };
}
