// 데이터와 슬롯으로 조립하는 콘텐츠 구성 요소다.
import { escape, safeUrl, isTrusted, slot, id, out } from './html.mjs';
import { Card } from './components.mjs';
import { ControlIcon } from './icons.mjs';
import { TextInput } from './layout.mjs';

export function ContentIcon({ graphic, badge, size = 'card' }) {
  if (!['small', 'medium', 'card', 'proof'].includes(size)) throw new Error(`Unknown icon size: ${size}`);
  return out(`<span class="app-content-icon is-${size}">${slot(graphic, 'graphic')}${badge === undefined ? '' : `<span class="app-content-icon-badge">${slot(badge, 'badge')}</span>`}</span>`);
}

export function SearchBox({ combobox = true, large = false, query = '', action, labels, suggestions = [], filters, fallback }) {
  return out(`<section class="app-search app-public-search${large ? ' is-prominent' : ''}" data-public-search aria-label="${escape(labels.region)}"><form action="${safeUrl(action)}" role="search">${TextInput({ id: 'site-query', name: 'q', label: labels.input, value: query, placeholder: labels.placeholder, autocomplete: 'off', size: large ? 'large' : 'medium', surface: 'field', icon: ControlIcon('search', 'app-input-icon'), action: out(`<button class="app-search-clear" type="button" data-clear-query aria-label="${escape(labels.clear)}" hidden>${ControlIcon('clear')}</button>`), role: combobox ? 'combobox' : 'searchbox', controls: combobox ? 'search-suggestions' : undefined })}</form><div class="app-search-panel" id="search-suggestions" role="listbox" hidden></div><p class="app-sr" data-search-status role="status" aria-live="polite"></p>${suggestions.length ? `<p class="app-search-frequent">${escape(labels.suggestions)} ${suggestions.map(query => `<button type="button" data-query="${escape(query)}">${escape(query)}</button>`).join(' ')}</p>` : ''}${filters === undefined ? '' : slot(filters, 'filters')}${fallback ? `<noscript>${slot(fallback, 'fallback')}</noscript>` : ''}</section>`);
}

export function DocumentArticle({ title, icon, lead, metadata, body, after }) {
  return out(`<article class="app-document"><header class="app-document-header"><h1 class="app-article-title">${icon ? slot(icon, 'icon') : ''}${escape(title)}</h1></header><p class="app-article-lead app-document-lead">${slot(lead, 'lead')}</p><div class="app-document-metadata">${slot(metadata, 'metadata')}</div><div class="app-prose app-document-body">${slot(body, 'body')}</div>${after ? slot(after, 'after') : ''}</article>`);
}

// ---- 소개·목록·홈 구성 요소 ----

export const SocialRow = ({ links }) => out(`<p class="app-landing-social">${slot(links, 'links')}</p>`);
export function PageHeading({ title, icon }) {
  return out(`<h1 class="app-page-heading${icon === undefined ? '' : ' has-icon'}">${icon === undefined ? '' : `<span class="app-page-heading-icon" aria-hidden="true">${slot(icon, 'icon')}</span>`}${escape(title)}</h1>`);
}
/** 섹션 머리: 아이콘, 제목(글자 또는 슬롯), 설명 단락 슬롯, 링크 행 슬롯, 동작 링크. 홈 섹션과 기능 소개가 같이 쓴다. */
export function SectionIntro({ level = 2, id: heading, icon, title, description, links, action }) {
  if (!Number.isInteger(level) || level < 1 || level > 6) throw new Error(`Invalid heading level: ${level}`);
  return out(`<div class="app-landing-heading"><h${level}${heading ? ` id="${id(heading)}"` : ''}>${icon === undefined ? '' : `<span class="app-landing-icon">${slot(icon, 'icon')}</span> `}${isTrusted(title) ? title.html : escape(title)}</h${level}>${description === undefined ? '' : slot(description, 'description')}${links === undefined ? '' : SocialRow({ links })}${action ? `<p><a class="app-landing-action" href="${safeUrl(action.href)}">${escape(action.label)}</a></p>` : ''}</div>`);
}
/** 링크 행의 항목. 주소가 없으면 아이콘만 보이는 자리표시이며 링크로 읽히지 않는다. */
export function SocialLink({ href, label, icon }) {
  if (href === undefined) return out(`<span role="img" aria-label="${escape(label)} · 주소 준비 중">${icon === undefined ? '' : slot(icon, 'icon')}</span>`);
  return out(`<a href="${safeUrl(href)}"${icon === undefined ? '' : ` aria-label="${escape(label)}"`}>${icon === undefined ? escape(label) : slot(icon, 'icon')}</a>`);
}

const RAILS = { technologies: 'app-technologies', interviews: 'app-interviews' };
/** 가로로 흐르는 목록. `items`는 `li` 슬롯이고 `kind`는 technologies 또는 interviews다. */
export function FlowRail({ kind, direction, label, ariaLabel, items }) {
  if (!Object.hasOwn(RAILS, kind)) throw new Error(`Unknown rail: ${kind}`);
  if (direction !== undefined && direction !== 'right') throw new Error(`Unknown direction: ${direction}`);
  return out(`<div class="${RAILS[kind]}" data-flow-rail${direction ? ` data-flow-direction="${direction}"` : ''} data-flow-label="${escape(label)}"><div class="app-flow-viewport" data-flow-viewport tabindex="0" role="region" aria-label="${escape(ariaLabel)}"><div class="app-flow-track" data-flow-track><ul class="app-flow-group" data-flow-group>${slot(items, 'items')}</ul></div></div></div>`);
}
export const FlowRows = ({ rails }) => out(`<div class="app-interview-rows" data-flow-rows>${slot(rails, 'rails')}</div>`);

/** 동작 링크 모양의 재생 단추. 같은 쪽의 영상 자리(`id`)를 가리킨다. */
export function RemoteLink({ id: target, href, label, icon }) {
  return out(`<a class="app-remote" href="${safeUrl(href)}" data-remote="${id(target)}" data-scroll="down" data-label="${escape(label)}" aria-label="${escape(label)}">${slot(icon, 'icon')}<span>${escape(label)}</span></a>`);
}
/** 홈의 프로젝트 영상: 컨트롤이 있는 영상, 재생 전 숨김 단추, 파일 링크. */
export function ProjectShowcase({ id: section, title, src, poster }) {
  const name = escape(title);
  const file = safeUrl(src);
  return out(`<section id="${id(section)}-video" class="app-project-showcase" aria-label="${name}"><div class="app-player app-cinema has-controls is-hidden-until-played" id="${section}-player" data-player><video controls playsinline preload="none" data-native-controls aria-label="${name}"${poster ? ` poster="${safeUrl(poster)}"` : ''}><source src="${file}">${name} · <a href="${file}">영상 파일 열기</a></video><button class="app-player-button" type="button" data-player-play aria-label="${name} 영상 재생" hidden>${ControlIcon('play')}</button><span class="app-sr" role="status"></span></div></section>`);
}
export const Panorama = ({ id: section, label, image }) => out(`<section id="${id(section)}-video" class="app-hero-panorama" aria-label="${escape(label)}"><div class="app-hero-panorama-content">${slot(image, 'image')}</div></section>`);

export function TitleCover({ title }) {
  const length = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(title)].length;
  return out(`<div class="app-title-cover${length > 40 ? ' is-long' : ''}" aria-hidden="true"><span class="app-title-cover-title">${escape(title)}</span></div>`);
}

export function BlogCard({ href, title, showTitle = true, level = 3, cover, automaticCover = false, tags, tagItems = [], tagLimit = 3, description = '', publishedAt, dateLabel, commentsHref, commentCount, author }) {
  const heading = level === 2 ? 'h2' : 'h3';
  // 그림이 없는 글은 제목으로 표지를 자동으로 만든다. 직접 넘긴 표지(빈 슬롯 포함)가 먼저다.
  const media = cover === undefined && automaticCover ? TitleCover({ title }) : cover;
  const link = safeUrl(href);
  const date = publishedAt ? `<time class="app-blog-card-date" datetime="${escape(publishedAt)}">${escape(dateLabel || publishedAt)}</time>` : '';
  const knownCount = Number.isSafeInteger(commentCount) && commentCount >= 0;
  const count = knownCount ? `댓글 · ${commentCount}` : '댓글 보기';
  const comments = commentsHref ? `<a class="app-blog-card-comments" href="${safeUrl(commentsHref)}">${count}</a>` : knownCount ? `<span class="app-blog-card-comments">${count}</span>` : '';
  const byline = author?.name ? `${author.avatar ? `<img class="app-blog-card-avatar" src="${safeUrl(author.avatar)}" alt="" loading="lazy" decoding="async">` : ''}<span>${escape(author.name)}</span>` : '';
  const writer = byline ? `<span class="app-blog-card-author">${byline}</span>` : '';
  const fields = [writer, date].filter(Boolean).join('<span aria-hidden="true">·</span>');
  const metadata = fields || comments ? `<div class="app-blog-card-meta">${fields}${comments}</div>` : '';
  // 카드는 대표 태그만 보인다. 나머지는 글 머리의 전체 태그에서 확인한다.
  const shown = tagItems.slice(0, tagLimit);
  const summary = shown.length ? `<div class="app-blog-card-tags" role="group" aria-label="태그">${shown.map(item => String(Tag(item))).join(' ')}</div>` : '';
  return out(`<article class="app-blog-card"><a class="app-blog-card-link" href="${link}" aria-label="${escape(title)}">${media === undefined ? '' : `<div class="app-blog-cover">${slot(media, 'cover')}</div>`}<div class="app-blog-card-body"><${heading} class="app-blog-card-title${showTitle ? '' : ' app-sr'}">${escape(title)}</${heading}>${description ? `<p class="app-card-summary">${escape(description)}</p>` : ''}</div></a>${summary}${tags === undefined ? '' : slot(tags, 'tags')}${metadata}</article>`);
}
/** 쪽 이동. `before`·`after`는 `{ href, text }`, `numbers`는 `{ page, href, current }`, `summary`는 번호 대신 쓰는 글자다. */
export function PageLinks({ label, before, after, numbers = [], summary, resultPages = false }) {
  const edge = (item, rel) => item ? `<a class="app-navigation-link${rel === 'prev' ? ' is-back' : ''}" rel="${rel}" href="${safeUrl(item.href)}">${escape(item.text)}</a>` : '';
  const middle = summary === undefined ? numbers.map((item) => item.current ? `<span aria-current="page">${Number(item.page)}</span>` : `<a href="${safeUrl(item.href)}" aria-label="${Number(item.page)}페이지">${Number(item.page)}</a>`).join('') : `<span>${escape(summary)}</span>`;
  return out(`<nav class="app-page-links"${resultPages ? ' data-result-pages' : ''} aria-label="${escape(label)}">${edge(before, 'prev')}${middle}${edge(after, 'next')}</nav>`);
}
/** 목록 이동 링크. 돌아가기는 같은 꺾쇠를 반대 방향으로 표시한다. */
export const NavigationLink = ({ href, text, back = false }) => out(`<a class="app-navigation-link${back ? ' is-back' : ''}" href="${safeUrl(href)}">${escape(text)}</a>`);
export const ListLink = ({ href, text }) => out(`<p class="app-page-links">${NavigationLink({ href, text })}</p>`);


function tagSize(size) {
  if (!['small', 'medium'].includes(size)) throw new Error(`Unknown tag size: ${size}`);
  return size === 'medium' ? ' is-medium' : '';
}
export const Tag = ({ href, label, size = 'small' }) => out(`<a class="app-tag${tagSize(size)}" href="${safeUrl(href)}">${escape(label)}</a>`);
export function TagList({ tags, limit = Infinity, size = 'small' }) {
  const variant = tagSize(size);
  const link = (tag) => String(Tag({ ...tag, size }));
  const remaining = tags.slice(limit);
  return out(`<div class="app-tags" role="group" aria-label="태그">${tags.slice(0, limit).map(link).join('')}${remaining.length ? `<details class="app-tags-more"><summary${variant ? ` class="${variant.trim()}"` : ''}>+${remaining.length}</summary><div class="app-tags">${remaining.map(link).join('')}</div></details>` : ''}</div>`);
}

export function TagFilter({ tags, reset }) {
  return out(`<div class="app-tags app-tag-filter" data-tag-filter role="group" aria-label="태그">${tags.map(tag => `<button class="app-tag" type="button" data-tag-toggle="${escape(tag.id)}" aria-pressed="${Boolean(tag.selected)}">${escape(tag.label)}</button>`).join('')}${reset ? `<a class="app-tag-reset" href="${safeUrl(reset.href)}" data-tag-reset>${escape(reset.label)}</a>` : ''}</div>`);
}


/** 문서 계층과 현재 글 목차를 본문 밖의 탐색 열에 둔다. */
export function DocumentLayout({ navigation, outline, content }) {
  return out(`<div class="app-document-layout" data-document-layout>${navigation ? `<aside class="app-document-sidebar">${slot(navigation, 'navigation')}</aside>` : ''}${outline ? `<aside class="app-document-outline">${slot(outline, 'outline')}</aside>` : ''}<div class="app-document-content">${slot(content, 'content')}</div></div>`);
}

export function DocumentNavigation({ label, nodes }) {
  function item(node) {
    const current = node.current ? ' class="is-selected" aria-current="page"' : '';
    const title = node.href && !node.children?.length ? `<a href="${safeUrl(node.href)}"${current}>${escape(node.title)}</a>` : `<span${current}>${escape(node.title)}</span>`;
    return node.children?.length ? `<li><details${node.open ? ' open' : ''}><summary title="하위 문서 접기·펼치기">${title}</summary><ul>${node.children.map(item).join('')}</ul></details></li>` : `<li>${title}</li>`;
  }
  return out(`<details class="app-document-nav" data-document-panel><summary aria-label="${escape(label)} 하위 문서"><span>${escape(label)}</span></summary><nav aria-label="${escape(label)} 하위 문서"><ul>${nodes.map(item).join('')}</ul></nav></details>`);
}

export function DocumentOutline({ sections }) {
  if (!sections.length) return out('');
  for (const section of sections) {
    if (!Number.isInteger(section.level) || section.level < 1 || section.level > 6) throw new TypeError('invalid outline heading level');
  }
  // 문서 탐색과 같은 접기 패널이다. 세 열 배치에서는 펼친 채 고정하고, 본문 위에 쌓이는 좁은 화면에서는 접는다.
  return out(`<details class="app-document-nav" data-document-panel><summary aria-label="본문 목차"><span>목차</span></summary><nav aria-label="본문 목차"><ol>${sections.map(section => `<li${section.level === 3 ? ' class="is-subsection"' : ''}><a href="#${escape(section.id)}" data-heading-level="${section.level}">${escape(section.title)}</a></li>`).join('')}</ol></nav></details>`);
}

/** 같은 주제에서 이어 읽을 문서. 없는 방향은 빈 링크를 만들지 않는다. */
export function DocumentPager({ label, before, after }) {
  if (!before && !after) return out('');
  const link = (page, rel, direction) => page ? String(Card({ ...page, variant: 'related', rel, label: `${direction} 문서: ${page.title}` })) : '';
  return out(`<nav class="app-document-pager app-related-grid" aria-label="${escape(label)} 문서 이동">${link(before, 'prev', '이전')}${link(after, 'next', '다음')}</nav>`);
}

/** 블로그 글 한 편의 틀(피드와 상세 공통). 본문·도입문·꼬리말은 슬롯이다. */
/** `byline: { name, avatar }`이 있으면 날짜를 제목 위 대신 도입문 아래의 글쓴이 줄에 둔다. 목록 카드의 글쓴이 줄과 같은 순서다. */
export function PostArticle({ id: post, detail = false, href, title, date, dateLabel = date, dateNote = '', cover, lead, tags, body, author, byline, footer, after }) {
  const heading = detail ? `<h1 class="app-post-title" id="${id(post)}">${escape(title)}</h1>` : `<h2 class="app-post-title" id="${id(post)}"><a href="${safeUrl(href)}">${escape(title)}</a></h2>`;
  const footerContent = `${author ? `<p class="app-post-author">${escape(author)}</p>` : ''}${footer === undefined ? '' : slot(footer, 'footer')}`;
  const leadHtml = lead === undefined ? '' : slot(lead, 'lead');
  const time = `<time class="app-post-date" datetime="${escape(date)}">${escape(dateLabel)}${escape(dateNote)}</time>`;
  const writer = byline?.name ? `<div class="app-post-byline">${byline.avatar ? `<img class="app-post-avatar" src="${safeUrl(byline.avatar)}" alt="" decoding="async">` : ''}<span class="app-post-byline-name">${escape(byline.name)}</span>${time}</div>` : '';
  return out(`<article class="app-blog-post${detail ? ' is-detail' : ''}" aria-labelledby="${post}"><header class="app-post-header">${writer ? '' : time}${heading}</header><div class="app-prose app-feed-body">${leadHtml ? `<p class="app-article-lead">${leadHtml}</p>` : ''}${writer}${tags === undefined ? '' : slot(tags, 'tags')}${cover === undefined ? '' : `<div class="app-post-cover app-width-wide">${slot(cover, 'cover')}</div>`}${slot(body, 'body')}</div>${footerContent ? `<footer class="app-post-footer">${footerContent}</footer>` : ''}${after === undefined ? '' : slot(after, 'after')}</article>`);
}

const text = (value) => isTrusted(value) ? value.html : escape(value);
const ICON_SIZES = ['small', 'medium', 'card', 'proof'];
/** 이미지 파일로 된 콘텐츠 아이콘(브랜드 로고, 검색 결과 아이콘). */
export function ContentIconImage({ src, size = 'small' }) {
  if (!ICON_SIZES.includes(size)) throw new Error(`Unknown icon size: ${size}`);
  return out(`<span class="app-content-icon is-${size}"><img src="${safeUrl(src)}" alt="" decoding="async"></span>`);
}
/** 검색어와 겹치는 글자를 `mark`로 감싼 글. 나머지는 모두 이스케이프한다. 결과는 슬롯으로 쓴다. */
export function Highlight({ text: source, query = '' }) {
  const value = String(source).normalize('NFC');
  const terms = String(query).normalize('NFC').trim().split(/\s+/).filter(Boolean).map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return out(escape(value));
  let end = 0;
  let html = '';
  for (const match of value.matchAll(new RegExp(terms.join('|'), 'giu'))) {
    html += `${escape(value.slice(end, match.index))}<mark>${escape(match[0])}</mark>`;
    end = match.index + match[0].length;
  }
  return out(html + escape(value.slice(end)));
}
/** 검색 결과의 링크 부분. 제목과 설명은 글자 또는 슬롯(`Highlight`)이다. */
export function SearchResultLink({ href, icon, title, example = false, description }) {
  return out(`<a class="app-search-result-link" href="${safeUrl(href)}">${icon === undefined ? '' : slot(icon, 'icon')}<strong>${text(title)}</strong>${example ? '<span class="app-search-result-note"> 예시</span>' : ''}<p>${text(description)}</p></a>`);
}


/** 검색 상태 안내와 선택 동작을 같은 중앙 정렬 영역에 둔다. */
export function SearchMessage({ lines }) {
  return out(`<div class="app-search-message"><p>${lines.map(line => escape(line)).join('<br>')}</p></div>`);
}
