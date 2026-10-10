// 가져온 테마의 아이콘 목록을 Markdown과 검토 화면에서 함께 사용한다.
import { readFileSync } from 'node:fs';
import { renderContentIcon, validateIconCatalog } from './vendor/theme/assets/icons/render.mjs';

const CATALOG = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/catalog.json', import.meta.url)));
const DIRECTION_REFERENCE = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/direction-reference.json', import.meta.url)));
const DIRECTION_REVIEW = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/direction-review.json', import.meta.url)));
const PROPOSAL = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/catalog-proposal.json', import.meta.url)));
const DETAIL = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/catalog-detail.json', import.meta.url)));
validateIconCatalog(CATALOG);
const BRANDS = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/brands/catalog.json', import.meta.url)));
const SET_REFERENCE = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/review-set-reference.json', import.meta.url)));
const AUDIT = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/audit.json', import.meta.url)));
const REVIEW = JSON.parse(readFileSync(new URL('./vendor/theme/assets/icons/review-reference.json', import.meta.url)));
validateIconCatalog(DETAIL);
validateIconCatalog(REVIEW);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function contentIcon(spec, size = 'card', variant = 'default') {
  if (!['default', 'detail', 'review', 'set-reference', 'proposal', 'direction-reference'].includes(variant)) throw new Error(`invalid icon variant: ${variant}`);
  if (!['small','medium','card','proof'].includes(size)) throw new Error(`invalid icon size: ${size}`);
  const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
  return `<span class="app-content-icon is-${size}">${renderContentIcon(variant === 'detail' ? DETAIL : variant === 'review' ? REVIEW : variant === 'set-reference' ? SET_REFERENCE : variant === 'proposal' ? PROPOSAL : variant === 'direction-reference' ? DIRECTION_REFERENCE : CATALOG, name, size === 'small' ? undefined : kind, size)}</span>`;
}

export function iconLab() {
  const detailIcon = (name, size = 'card') => contentIcon(name, size, 'detail');
  const comparison = direction => Object.entries(DIRECTION_REVIEW.icons).filter(([, item]) => item.direction === direction).map(([name, item]) => `<section class="app-icon-audit-item" data-direction-icon="${name}"><h3>${escape(item.label)}</h3><div class="app-icon-review-pair"><figure>${contentIcon(name, 'card', 'direction-reference')}<figcaption>이전 48</figcaption></figure><figure>${detailIcon(name)}<figcaption>현재 48</figcaption></figure><figure>${detailIcon(name, 'small')}<figcaption>24</figcaption></figure></div><p>${escape(item.reason)}</p></section>`).join('');
  const iconLink = ([name, item]) => `<a href="/things/theme/assets/icons/detail/${name}.svg" download aria-label="${escape(item.label)} SVG 내려받기">${detailIcon(name)}<span>${escape(item.label)}</span></a>`;
  const groups = [...new Set(Object.values(DETAIL.icons).map(item => item.group))];
  const all = groups.map(group => `<section class="app-icon-topic"><h3>${escape(group)}</h3><div class="app-icon-catalog">${Object.entries(DETAIL.icons).filter(([, item]) => item.group === group).map(iconLink).join('')}</div></section>`).join('');
  const brands = BRANDS.icons.map(item => `<a href="/things/theme/assets/icons/brands/${escape(item.file)}" download><span class="app-content-icon is-card"><img src="/things/theme/assets/icons/brands/${escape(item.file)}" alt=""></span><span>${escape(item.label)}</span></a>`).join('');
  const reference = ['tags','repeating','notes','idea','markdown','calendar'].map(name => `<span class="app-article-icon app-icon-${name}" aria-hidden="true"></span>`).join('');
  const focus = ["vision", "terminal", "audio", "idea", "cache", "security", "vulnerability", "key", "operating-system", "build", "performance", "code-review", "portfolio", "backup", "pipeline", "container", "interaction", "event"].map(name => `<section><h3>${escape(DETAIL.icons[name].label)}</h3><div class="app-icon-scale-row"><figure>${contentIcon(name,'card','direction-reference')}<figcaption>이전 방향</figcaption></figure><figure>${detailIcon(name)}<figcaption>새 시안 · 48</figcaption></figure><figure>${detailIcon(name,'small')}<figcaption>24</figcaption></figure></div><p>${escape(DIRECTION_REVIEW.icons[name].reason)}</p></section>`).join('');
  return `<div class="app-icon-lab"><h2>색면과 굵기 · 수정 시안</h2><p>이미지·CLI·음성·문제 해결·캐시는 이전 방향을 복원했습니다. 나머지는 색면과 흰 기호를 강화하거나 모티프를 바꾼 시안입니다.</p><p><a href="#preserved-directions">25개 모티프 유지</a> · <a href="#redesigned-directions">59개 재설계</a> · <a href="#complete-catalog">전체 84개</a> · <a href="#brand-catalog">기술 로고</a></p><h2>수정한 18개</h2><div class="app-icon-catalog app-filled-overview">${["vision","terminal","audio","idea","cache","security","vulnerability","key","operating-system","build","performance","code-review","portfolio","backup","pipeline","container","interaction","event"].map(name => iconLink([name,DETAIL.icons[name]])).join('')}</div><h2>이전 방향과 비교</h2><div class="app-icon-direction-focus">${focus}</div><details><summary>Things 참고 아이콘</summary><div class="app-icon-scale-row">${reference}</div></details><h2 id="preserved-directions">25개 · 모티프 유지, 도형 교정</h2><p>방향 통과는 곡률과 세부 완성도의 승인을 의미하지 않습니다. 아래는 이전 도형과 이번 교정안입니다.</p><div class="app-icon-audit-grid">${comparison('preserved')}</div><h2 id="redesigned-directions">59개 · 새 디자인 방향</h2><p>각 항목의 사물·기호와 변경 이유를 비교합니다.</p><div class="app-icon-audit-grid">${comparison('redesigned')}</div><h2 id="complete-catalog">전체 84개</h2><p>아이콘을 누르면 독립 SVG를 내려받습니다.</p>${all}<h2 id="brand-catalog">기술 로고 · 별도 세트</h2><div class="app-icon-catalog app-icon-brand-proof">${brands}</div><details><summary>철회한 일괄 단순화 안</summary><p>사용자 검토에서 철회한 안입니다. 현재 도형으로 사용하지 않습니다.</p><div class="app-icon-catalog">${['operating-system','concurrency','architecture','person'].map(name => `<div class="app-icon-specimen">${contentIcon(name,'card','proposal')}<p>${escape(DETAIL.icons[name].label)}</p></div>`).join('')}</div></details></div>`;
}
