// 콘텐츠 정본과 가져온 테마를 검증한 뒤 독립적인 정적 사이트를 생성한다.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { createMarkdown, escape, image } from './markdown.mjs';
import * as ui from './vendor/theme/assets/components.mjs';
import { socialProof, socialLinks, newsletter, productCards } from './home.mjs';
import { layout, article, blogPost, home, search, products } from './layout.mjs';
import { verifyApprovedContent } from './approved-content.mjs';

verifyApprovedContent();

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(ROOT, '../dist/things');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'theme.config.json')));
const THEME = join(ROOT, 'vendor/theme');
const MANIFEST = JSON.parse(readFileSync(join(THEME, 'theme.json')));
const digest = (value) => createHash('sha256').update(value).digest('hex');
if (MANIFEST.id !== CONFIG.theme) throw new Error('Theme selection does not match snapshot');
for (const [name, hash] of Object.entries(MANIFEST.files)) {
  if (name.includes('..') || name.startsWith('/')) throw new Error('Invalid theme path');
  if (digest(readFileSync(join(THEME, name))) !== hash) throw new Error(`Theme snapshot modified: ${name}`);
}
if (digest(JSON.stringify(MANIFEST.files, null, 2) + '\n') !== MANIFEST.contentHash) throw new Error('Theme manifest modified');
const themeCss = readFileSync(join(THEME, 'theme.css'), 'utf8');
const stylesCss = readFileSync(join(THEME, 'styles.css'), 'utf8');
const definitions = new Set([...themeCss.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
for (const [,name] of stylesCss.matchAll(/var\((--site-[\w-]+)/g)) {
  if (!definitions.has(name)) throw new Error(`Undefined theme variable: ${name}`);
}
const md = createMarkdown();
const pages = [];
for (const name of readdirSync(join(ROOT, 'content')).filter((name) => name.endsWith('.md')).sort()) {
  if (!/^[a-z0-9-]+\.md$/.test(name)) throw new Error(`Invalid content filename: ${name}`);
  const source = readFileSync(join(ROOT, 'content', name), 'utf8');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${name}`);
  const page = parse(match[1], { maxAliasCount: 0 });
  if (!['home','support','features','article','post','blog','plain','contact','newsletter','about','status','redirect','pricing','icon-lab'].includes(page.layout)) throw new Error(`Invalid layout: ${name}`);
  if (page.layout === 'post' && (typeof page.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(page.date) || !Number.isFinite(Date.parse(page.date)))) throw new Error(`Invalid post date: ${name}`);
  page.body = match[2]; page.source = source; page.id = name.slice(0, -3);
  if (!/^\/things\/(?:[a-z0-9-]+\/)*$/.test(page.route) || !page.title) throw new Error(`Invalid page: ${name}`);
  if (pages.some((existing) => existing.route === page.route)) throw new Error(`Duplicate route: ${page.route}`);
  const env = { pageId: page.id, showSyntax: page.syntax === true, docId: page.id };
  page.html = md.render(page.body, env); page.headings = env.headings;
  pages.push(page);
}
if (!pages.length) throw new Error('No Markdown pages found');
const blog = pages.filter((page) => page.layout === 'post').sort((a,b) => b.date.localeCompare(a.date));
const htmlOutputs = new Map();
for (const page of pages) {
  let body;
  switch (page.layout) {
    case 'icon-lab': body = `<main id="main" class="app-shell"><div class="app-body app-plain"><h1>${escape(page.title)}</h1>${page.html}</div></main>`; break;
    case 'home': body = home(page, page.html); break;
    case 'support': body = `<div class="app-shell">${search(true)}<main id="main" class="app-body"><h1 class="app-sr">Support</h1>${page.html}<div class="app-contact-prompt"><p>Didn’t find what you were looking for?</p><a href="/things/contact/">Contact Us →</a></div></main></div>`; break;
    case 'redirect': body = `<main id="main" class="app-shell"><a href="${escape(page.target)}">${escape(page.title)}</a></main>`; break;
    case 'pricing': body = `<main id="main" class="app-pricing"><div class="app-shell">${ui.SectionIntro({ level: 1, icon: ui.trusted(image(page.image, '')), title: page.title, description: ui.trusted(page.html) })}${productCards(pages.find(entry => entry.layout === 'home').home.products, true)}</div></main>`; break;
    case 'status': body = `<main id="main" class="app-status"><div class="app-shell">${page.html}</div></main>`; break;
    case 'about': body = `<main id="main" class="app-office"><div class="app-shell">${page.panels.map((panel,index) => `<section class="app-office-panel${panel.lead === false ? '' : ' has-lead'}" id="${escape(panel.id)}"><h${index ? '2' : '1'}>${escape(panel.title)}</h${index ? '2' : '1'}><div class="app-prose">${md.render(panel.body)}</div></section>`).join('')}</div></main>`; break;
    case 'newsletter': body = `<main id="main">${newsletter(page, true)}</main>`; break;
    case 'plain': body = `<main id="main" class="app-shell"><article class="app-body app-plain${['document','actions'].includes(page.variant) ? ' is-document' + (page.variant === 'actions' ? ' has-actions' : '') : ''}"><h1>${page.image ? image(page.image, '', 'app-plain-icon') : ''}${escape(page.title)}</h1><div class="app-prose">${page.html}</div></article></main>`; break;
    case 'contact': body = `<main id="main" class="app-contact"><div class="app-shell"><div class="app-contact-intro"><h1>Contact</h1><p>${escape(page.description)} <a href="/things/support/">support pages</a></p><p class="app-contact-action"><a href="/things/contact/form/">${image('envelope.svg','Contact')}</a><a class="app-primary-action" href="/things/contact/form/">Write Email</a></p><p>${escape(page.socialDescription)}</p>${socialLinks()}<div class="app-contact-other"><p>Anything else?</p><a href="/things/contact/form/">Press inquiries</a><br><a href="/things/contact/form/">General inquiries</a></div></div><div class="app-contact-details">${page.html}</div></div></main>`; break;
    case 'post': body = `<main id="main" class="app-blog-feed"><div class="app-shell">${blogPost(page,page.html)}</div></main>`; break;
    case 'blog': {
      const entries = page.archive ? blog.slice(2) : blog.slice(0,2);
      body = `<main id="main" class="app-blog-feed"><div class="app-shell"><h1 class="app-sr">Blog</h1>${entries.map((post) => blogPost(post,post.html,true)).join('')}<nav class="app-body app-pagination" aria-label="Blog pages">${page.archive ? '<a href="/things/blog/">← Recent posts</a>' : '<a href="/things/blog/archive/">Older posts →</a>'}<a href="/things/blog/feed.xml">RSS</a></nav></div></main>`; break;
    }
    case 'features': body = `<main id="main"><header class="app-feature-hero"><div class="app-shell">${ui.SectionIntro({ level: 1, title: ui.trusted('What’s new in<br>the <em>all-new</em> Things?'), description: ui.trusted('<p>매일 사용하는 화면의 작은 차이를 만나보세요. 생각을 기록하고, 계획을 정리하고, 다음 행동으로 이어가는 과정을 새로운 화면과 부드러운 상호작용으로 살펴봅니다.</p>') })}${image('whatsnew-collage-io60.png','기능 화면 모음','app-collage')}</div></header>${page.html}${products(pages.find(entry => entry.layout === 'home').home.products, pages.find(entry => entry.layout === 'home').home.productsHeading)}${socialProof(pages.find(entry => entry.layout === 'home').home)}</main>`; break;
    default: body = article(page, page.html, page.headings);
  }
  htmlOutputs.set(page.route, layout(page, body));
}
// 복각 검토 빌드는 수식·도표 자산을 싣지 않는다. 쓰면 깨진 화면이 되므로 발행 빌드(build:site)를 쓰게 막는다.
for (const [route, html] of htmlOutputs) {
  if (/<span class="katex|\sdata-mermaid[\s=>]/.test(html)) throw new Error(`Math or diagram content needs the publication build: ${route}`);
}
const validRoutes = new Set(pages.map((page) => page.route));
const assets = new Set(readdirSync(join(ROOT, 'assets')));
for (const [route, html] of htmlOutputs) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate HTML id: ${route}`);
  for (const [,url] of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
    if (url.startsWith('/things/assets/') && !assets.has(url.split('/').at(-1).split('#')[0])) throw new Error(`Missing asset ${url} in ${route}`);
    if (url.startsWith('#') && !ids.includes(url.slice(1))) throw new Error(`Broken anchor ${url} in ${route}`);
    if (url.startsWith('/things/')) {
      const [target, fragment] = url.split('#');
      const pathname = target.split('?')[0];
      const knownFile = pathname === '/things/site.js' || pathname === '/things/blog/feed.xml' || pathname.startsWith('/things/assets/') && assets.has(pathname.split('/').at(-1)) || pathname.startsWith('/things/theme/') && pathname.slice('/things/theme/'.length) in MANIFEST.files || pages.some((page) => pathname === `/things/sources/${page.id}.md`);
      if (!validRoutes.has(pathname) && !knownFile) throw new Error(`Broken link ${url} in ${route}`);
      if (fragment && validRoutes.has(pathname) && !htmlOutputs.get(pathname).includes(`id="${fragment}"`)) throw new Error(`Broken cross-page anchor ${url} in ${route}`);
    }
  }
}
mkdirSync(OUTPUT, { recursive: true });
cpSync(join(ROOT,'assets'), join(OUTPUT,'assets'), { recursive: true });
cpSync(THEME, join(OUTPUT,'theme'), { recursive: true });
cpSync(join(ROOT,'site.js'), join(OUTPUT,'site.js'));
cpSync(join(ROOT,'document.js'), join(OUTPUT,'document.js'));
cpSync(join(ROOT,'video.js'), join(OUTPUT,'video.js'));
mkdirSync(join(OUTPUT,'sources'), { recursive: true });
for (const page of pages) {
  const destination = join(OUTPUT, page.route.slice('/things/'.length), 'index.html');
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, htmlOutputs.get(page.route));
  writeFileSync(join(OUTPUT,'sources',page.id+'.md'), page.source);
}
const searchIndex = pages.filter((page) => page.route.startsWith('/things/support/articles/')).map((page) => ({ title: page.title, description: page.description ?? '', icon: page.icon ?? 'question', route: page.route, keywords: page.keywords ?? '', text: page.body.replace(/```[\s\S]*?```/g,' ').slice(0,6000) }));
writeFileSync(join(OUTPUT,'search-index.json'), JSON.stringify(searchIndex));
writeFileSync(join(OUTPUT,'build-report.json'), JSON.stringify({ theme: CONFIG.theme, themeHash: MANIFEST.contentHash, pages: pages.length, assets: assets.size, routes: [...validRoutes] }, null, 2));
writeFileSync(join(OUTPUT,'blog/feed.xml'), `<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>Preview Blog</title><link>/things/blog/</link><description>예시 글</description>${blog.map((post)=>`<item><title>${escape(post.title)}</title><link>${post.route}</link><guid isPermaLink="false">${post.id}</guid><description>${escape(post.description)}</description></item>`).join('')}</channel></rss>`);
console.log(`${pages.length} pages, ${assets.size} local assets; links, anchors and theme hashes verified.`);
