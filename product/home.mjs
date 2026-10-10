// 제품 소개의 섹션 순서와 콘텐츠를 Markdown 메타데이터에서 조합한다.
import { controlImage } from './controls.mjs';
import { escape, image, safeUrl } from './markdown.mjs';
import * as ui from './vendor/theme/assets/components.mjs';

function sectionHeader(section, level = 2) {
  return String(ui.SectionIntro({ level, icon: ui.trusted(image(section.icon, '')), title: section.title, description: ui.trusted(`<p>${escape(section.description)}</p>`), links: section.social ? ui.trusted(socialItems()) : undefined, action: section.href ? { href: section.href, label: section.link } : undefined }));
}

const socialItems = () => ['bluesky','x','threads','instagram','mastodon'].map(name => `<a href="/things/follow/${name}/" aria-label="${name}"><svg aria-hidden="true"><use href="/things/assets/symbols-social.svg#${name}"></use></svg></a>`).join(' ');
export const socialLinks = () => String(ui.SocialRow({ links: ui.trusted(socialItems()) }));

export function productCards(items, minimal = false) {
  return `<div class="app-product-grid">${items.map(item => `<article class="app-product-card"><div><a href="${safeUrl(item.href)}">${image(item.image,item.title,'app-product-symbol')}</a><h3>${escape(item.title)}</h3>${minimal ? '' : `<p>${escape(item.requirement)}<br>${escape(item.price)}<br><a href="/things/pricing/">view in your currency</a></p>`}</div><div class="app-product-actions">${!minimal && item.trial ? `<a href="/things/assets/preview-trial.zip" download="preview-trial.zip" aria-label="Download Free Trial — 검토용 예시 파일">${image('appstore-trial.svg','Download Free Trial','app-product-badge')}</a>` : ''}<a href="${safeUrl(item.href)}">${image(item.badge,'Download on the App Store','app-product-badge')}</a></div></article>`).join('')}</div>`;
}

export function products(items, heading) {
  return `<section class="app-landing-section app-landing-products"><div class="app-shell">${sectionHeader(heading)}${productCards(items)}</div></section>`;
}

export function reviews(items) {
  const pages = [];
  for (let start = 0; start < items.length; start += 8) pages.push(items.slice(start,start + 8));
  return `<div class="app-review-stage">${pages.map((page,index) => `<div class="app-review-grid" data-review-page${index ? ' hidden' : ''}>${page.map(item => `<article class="app-review-bubble"><div class="app-review-copy">${escape(item.body)}</div><div class="app-review-meta">${image('tweetgrid-avatar-default.png','','app-review-avatar')}<strong>${escape(item.author)}</strong><span>${escape(item.date)}</span></div></article>`).join('')}</div>`).join('')}<div class="app-review-actions"><button class="app-review-control is-previous" data-review-previous hidden aria-label="Previous Posts">Previous Posts</button><button class="app-review-control is-next" data-review-next aria-label="Next Posts">Next Posts</button><span class="app-sr" data-review-status aria-live="polite"></span></div></div>`;
}

export function quotes(items) {
  return `<div class="app-quote-grid">${items.map(item => item.art ? `<div class="app-quote-art">${image(item.art,'평가 영역의 참고 이미지')}</div>` : `<figure class="app-quote-item" data-tail="${escape(item.tail ?? 'default')}"><blockquote class="app-quote-bubble">${item.seal ? image(item.seal,'','app-quote-seal') : ''}<p><span class="app-quote-open" aria-hidden="true"></span>${item.highlight ? escape(item.body).replace(escape(item.highlight), `<mark>${escape(item.highlight)}</mark>`) : escape(item.body)}<span class="app-quote-close" aria-hidden="true"></span></p>${item.award ? `<div class="app-quote-awards"><div class="app-quote-award">${escape(item.award)}</div></div>` : ''}</blockquote><figcaption class="app-quote-credit">${item.logo ? image(item.logo,'',`app-quote-logo is-${item.kind}`) : `<strong>${escape(item.publication)}</strong>`}<span>${escape(item.author ?? '')}</span></figcaption></figure>`).join('')}</div>`;
}

export function home(page) {
  const content = page.home;
  return `<main id="main" class="app-landing"><section class="app-landing-hero"><div class="app-shell"><div class="app-hero-copy"><h1 class="app-sr">Things</h1>${image('hero-logo-things-io90.png','Things','app-hero-logo')}<p class="app-hero-description">${escape(content.intro)}</p><p class="app-hero-description"><button class="app-play" data-intro-play type="button">${controlImage('play')}<span>Watch Introduction Video</span></button></p></div></div><div class="app-cinema" data-intro-cinema hidden><video controls playsinline preload="none" poster="/things/assets/meettheallnewthings-poster-e.jpg" aria-label="Introduction video"><source src="/things/assets/meettheallnewthings.mp4" type="video/mp4"></video><p role="status"></p></div><div class="app-hero-panorama"><div class="app-hero-panorama-content">${image('meettheallnewthings2-io75.jpg','기기별 작업 목록 화면')}<div class="app-hero-panorama-extension"></div></div></div></section><section class="app-landing-section app-landing-features"><div class="app-shell">${sectionHeader(content.features)}<div class="app-landing-collage">${image('whatsnew-collage-io60.png','제품 화면 모음')}</div></div></section>${products(content.products,content.productsHeading)}<section class="app-landing-section app-landing-reviews"><div class="app-shell">${sectionHeader(content.reviewsHeading)}${reviews(content.reviews)}</div></section><section class="app-landing-section app-landing-quotes"><div class="app-shell">${sectionHeader(content.quotesHeading)}${quotes(content.quotes)}</div></section>${newsletter(content)}</main>`;
}

export function socialProof(content) {
  return `<section class="app-landing-section app-landing-reviews"><div class="app-shell">${sectionHeader(content.reviewsHeading)}${reviews(content.reviews)}</div></section><section class="app-landing-section app-landing-quotes"><div class="app-shell">${quotes(content.quotes)}</div></section>`;
}

export function newsletter(content, standalone = false) {
  return `<section class="app-landing-section app-landing-newsletter${standalone ? ' app-newsletter-page' : ''}"><div class="app-shell">${sectionHeader(content.newsletterHeading, standalone ? 1 : 2)}<form class="app-newsletter" data-demo-form><label class="app-sr" for="newsletter-email">Email</label><input class="app-newsletter-email" type="email" id="newsletter-email" placeholder="me@example.com" required autocomplete="email">${content.newsletterNote ? `<p class="app-newsletter-note">${escape(content.newsletterNote)} <a href="/things/newsletter/unsubscribe/">unsubscribe</a> · <a href="/things/privacy/">Privacy Policy</a>.</p>` : ''}<button type="submit">${escape(content.newsletterAction ?? 'Subscribe')}</button><p role="status" data-form-status></p></form></div></section>`;
}
