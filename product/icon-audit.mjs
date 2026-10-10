// 검토 화면은 실제 발행 렌더러와 같은 자산을 크기별로 대조한다.
import { readFileSync } from 'node:fs';
import { escape } from './markdown.mjs';
import { contentIcon } from './content-icons.mjs';

export function iconAuditPages() {
  const root = new URL('./vendor/theme/assets/icons/', import.meta.url);
  const read = name => JSON.parse(readFileSync(new URL(name, root)));
  const detail = read('catalog-detail.json'); const base = read('catalog.json'); const brands = read('brands/catalog.json');
  const review = read('current-review.json');
  const entries = [
    ...Object.entries(detail.icons).map(([name, icon]) => ({ id: `detail-${name}`, label: icon.label, note: icon.metaphor, render: size => contentIcon(name, size, 'detail') })),
    ...brands.icons.map(icon => ({ id: `brand-${icon.name}`, label: icon.label, note: icon.treatment, render: size => `<span class="app-content-icon is-${size}"><img src="/theme/assets/icons/brands/${icon.file}" alt=""></span>` })),
    ...Object.entries(base.icons).map(([name, icon]) => ({ id: `base-${name}`, label: `공유 원본 · ${icon.label}`, note: '기본 호출과 상세 호출이 같은 마스터를 사용합니다.', render: size => contentIcon(name, size) })),
    ...Object.entries(detail.badges).map(([name, badge]) => ({ id: `badge-${name}`, label: `글 표식 · ${badge.label}`, note: '24px 목록은 표식을 생략하고 제목을 함께 읽습니다.', render: size => contentIcon({ name: 'document', kind: name }, size, 'detail') })),
  ];
  return Array.from({ length: Math.ceil(entries.length / 12) }, (_, index) => ({ route: index === 0 ? '/review/icons/' : `/review/icons/page/${index + 1}/`,
    body: `<main id="main" class="app-shell"><h1 class="app-page-heading">아이콘 검증 ${index + 1} / ${Math.ceil(entries.length / 12)}</h1><p>84개 주제 · 18개 기술 로고 · 35개 공유 원본 · 5개 표식</p><p class="app-caption">${escape(review.reviewedAt)} 구현 검토 · 사용자 최종 승인과 구분합니다.</p><div class="app-icon-audit-grid">${entries.slice(index * 12, (index + 1) * 12).map(entry => reviewEntry(entry, review.entries[entry.id])).join('')}</div><nav class="app-page-links" aria-label="아이콘 검증 페이지">${Array.from({ length: Math.ceil(entries.length / 12) }, (_, i) => `<a href="${i === 0 ? '/review/icons/' : `/review/icons/page/${i + 1}/`}"${i === index ? ' aria-current="page"' : ''}>${i + 1}</a>`).join('')}</nav></main>` }));
}

function reviewEntry(entry, review) {
  if (!review) throw new Error(`missing current icon review: ${entry.id}`);
  return `<section class="app-icon-audit-item" data-audit-id="${entry.id}" data-review-fingerprint="${escape(review.fingerprint)}"><h2>${escape(entry.label)}</h2><div class="app-icon-review-pair">${[['card', 48], ['medium', 32], ['small', 24]].map(([size, label]) => `<figure>${entry.render(size)}<figcaption>${label}px</figcaption></figure>`).join('')}</div><p>${escape(entry.note ?? '')}</p><details><summary>크기별 검토 기록</summary><p>${escape(review.observation)}</p><p>${escape(review.smallSize)}</p><p class="app-caption">원본 ${escape(review.fingerprint.slice(0, 12))}</p></details></section>`;
}
