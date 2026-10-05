import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import MarkdownIt from "./assets/vendor/markdown-it.mjs";

const root = new URL(".", import.meta.url).pathname;
const navigation = JSON.parse(await readFile(join(root, "content/navigation.json"), "utf8"));
const javascriptNavigation = JSON.parse(await readFile(join(root, "content/javascript-navigation.json"), "utf8"));
const home = await readFile(join(root, "index.html"), "utf8");
const header = home.match(/<header class="docs-header">[\s\S]*?<\/header>/)?.[0];
const footer = home.match(/<footer class="docs-footer">[\s\S]*?<\/footer>/)?.[0];
const dialogs = [...home.matchAll(/<dialog class="docs-(?:search|privacy)-dialog"[\s\S]*?<\/dialog>/g)].map((match) => match[0]).join("\n");
if (!header || !footer || !dialogs) throw new Error("Could not find the shared page layout in index.html");

const pages = navigation.groups.flatMap((group) => group.pages.map((page) => ({ ...page, group: group.title })));
const ids = new Set();
for (const page of pages) {
  if (!/^[a-z0-9][a-z0-9/-]*$/.test(page.id) || page.id.includes("//") || ids.has(page.id)) throw new Error(`Invalid or duplicate document ID: ${page.id}`);
  ids.add(page.id);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "section";
}
function rootPrefix(id) { return "../".repeat(id.split("/").length + 1); }
function pageHref(prefix, id) { return `${prefix}pages/${id}/`; }
function sharedMarkup(markup, prefix) {
  return markup.replaceAll('src="assets/', `src="${prefix}assets/`)
    .replaceAll('href="pages/', `href="${prefix}pages/`)
    .replaceAll('href="./"', `href="${prefix}"`);
}
function sidebarMarkup(active, prefix) {
  if (active === "reference/javascript" || active.startsWith("reference/javascript/")) {
    const renderItems = (items) => items.map((item) => {
      if (item.id) return `<a href="${pageHref(prefix, item.id)}"${item.id === active ? ' aria-current="page"' : ""}>${escapeHtml(item.title)}</a>`;
      const content = renderItems(item.children || []);
      if (item.branch) return `<details class="docs-reference-group"${(item.children || []).some((child) => child.id === active) ? " open" : ""}><summary>${escapeHtml(item.title)}</summary><div>${content}</div></details>`;
      return `<h2>${escapeHtml(item.title.toUpperCase())}</h2>${content}`;
    }).join("");
    return `<nav class="docs-sidebar-nav docs-reference-nav" aria-label="JavaScript reference navigation"><div class="docs-reference-brand"><span>JS</span><strong>JavaScript</strong><span>v2.0</span></div>${renderItems(javascriptNavigation)}</nav>`;
  }
  if (active.startsWith("guides/getting-started/quickstarts/") || active.startsWith("guides/getting-started/tutorials/")) {
    const startGroups = navigation.groups.filter((group) => ["Framework Quickstarts", "Web app demos", "Mobile tutorials"].includes(group.title));
    const link = (id, label) => `<a href="${pageHref(prefix, id)}"${id === active ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
    return `<nav class="docs-sidebar-nav docs-quickstart-nav" aria-label="Quickstart navigation"><a class="docs-quickstart-home" href="${pageHref(prefix, "guides/getting-started")}"><span class="docs-start-icon" aria-hidden="true">▷</span><span>Start with Supabase</span></a>${link("guides/ai-tools", "Build with AI tools")}${link("guides/api-keys", "API Keys")}${link("guides/local-development", "Local Development")}${link("guides/architecture", "Architecture")}${link("guides/migrating-to-new-api-keys", "Migrating to new API keys")}${startGroups.map((group) => `<h2>${escapeHtml(group.title.toUpperCase())}</h2>${group.pages.map((page) => link(page.id, page.navTitle || page.title)).join("")}`).join("")}</nav>`;
  }
  return `<nav class="docs-sidebar-nav" aria-label="Documentation navigation"><a class="docs-sidebar-home" href="${prefix}">Documentation</a>${navigation.groups.map((group) => {
    const open = group.pages.some((page) => page.id === active) ? " open" : "";
    const links = group.pages.map((page) => `<a href="${pageHref(prefix, page.id)}"${page.id === active ? ' aria-current="page"' : ""}>${escapeHtml(page.navTitle || page.title)}</a>`).join("");
    return `<details class="docs-sidebar-group"${open}><summary>${escapeHtml(group.title)}</summary><div>${links}</div></details>`;
  }).join("")}</nav>`;
}

const toolIcons = JSON.parse(await readFile(join(root, "assets/docs-tool-icons.json"), "utf8"));
const searchIndex = [];
for (let index = 0; index < pages.length; index++) {
  const page = pages[index];
  const prefix = rootPrefix(page.id);
  const source = await readFile(join(root, "content", `${page.id}.md`), "utf8");
  for (const [, target] of source.matchAll(/\]\(#\/([^)]*)\)/g)) {
    if (target && !ids.has(target)) throw new Error(`Unknown document link in ${page.id}: ${target}`);
  }
  const headings = [];
  const used = new Map();
  const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
  const renderFence = markdown.renderer.rules.fence;
  markdown.renderer.rules.fence = (tokens, tokenIndex, options, env, self) => {
    const token = tokens[tokenIndex];
    const type = token.info.trim();
    if (type === "prompt") return `<div class="docs-agent-prompt" data-prompt="${escapeHtml(token.content)}"><div class="docs-agent-head"><span>Agent Prompt</span><button type="button" class="docs-agent-copy" aria-label="Copy Agent Prompt">Copy</button></div><div class="docs-agent-content">${markdown.render(token.content)}</div><button type="button" class="docs-agent-more" aria-expanded="false">Show more</button></div>`;
    if (type === "api-details") return `<div class="docs-api-details">${["Project URL", "Publishable key"].map((label) => `<label><span>${label}</span><a href="https://supabase.com/dashboard" class="docs-project-picker">project: No project found ▾</a><span class="docs-api-input"><input aria-label="${label}" readonly placeholder="No project found" /><button type="button" disabled aria-label="Copy ${label}">Copy</button></span></label>`).join("")}</div>`;
    if (type === "tabs") {
      const variants = Object.entries(JSON.parse(token.content));
      const buttons = variants.map(([label], index) => `<button type="button" role="tab" aria-selected="${index === 0}" data-label="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join("");
      return `<div class="docs-code-tabs" data-variants="${escapeHtml(JSON.stringify(variants))}"><div class="docs-code-tablist" role="tablist">${buttons}</div><pre><code class="language-sh">${escapeHtml(variants[0][1])}</code></pre></div>`;
    }
    const name = type.match(/(?:^|\s)name=(.+)$/)?.[1];
    return `${name ? `<div class="docs-code-filename">${escapeHtml(name)}</div>` : ""}${renderFence(tokens, tokenIndex, options, env, self)}`;
  };
  markdown.renderer.rules.heading_open = (tokens, tokenIndex, options, env, self) => {
    const token = tokens[tokenIndex];
    const text = tokens[tokenIndex + 1].content;
    const base = slugify(text);
    const next = (used.get(base) || 0) + 1;
    used.set(base, next);
    const id = next === 1 ? base : `${base}-${next}`;
    token.attrSet("id", id);
    if (token.tag === "h2" || token.tag === "h3") headings.push({ id, text, level: token.tag });
    return self.renderToken(tokens, tokenIndex, options);
  };
  let body = markdown.render(source.replace(/^> \[!NOTE\]$/gm, "> **Note:**"))
    .replace(/<blockquote>\n<p><strong>Note:<\/strong>/g, '<blockquote class="docs-note"><span class="docs-note-icon" aria-hidden="true">i</span>\n<p>')
    .replace(/href="#\/([^\"]*)"/g, (_, id) => id ? `href="${pageHref(prefix, id)}"` : `href="${prefix}"`);
  const toc = headings.map(({ id, text, level }) => `<a${level === "h3" ? ' class="docs-toc-nested"' : ""} href="#${escapeHtml(id)}">${escapeHtml(text)}</a>`).join("");
  const referenceLayout = page.id === "reference/javascript" || page.id.startsWith("reference/javascript/");
  if (referenceLayout) {
    body = body.replace(/(<h2\b[^>]*>[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2\b|$)/g, (_, heading, content) => {
      const split = content.search(/<pre\b|<div class="docs-code-tabs"|<div class="docs-code-filename"/);
      if (split < 0) return `<section class="docs-reference-section">${heading}${content}</section>`;
      return `<section class="docs-reference-section">${heading}<div class="docs-reference-columns"><div>${content.slice(0, split)}</div><div>${content.slice(split)}</div></div></section>`;
    });
  }
  const rightActions = referenceLayout ? "" : `<div class="docs-right-actions"><p>Is this helpful?</p><div><button type="button" class="docs-feedback" data-feedback="no" aria-label="No">×</button><button type="button" class="docs-feedback" data-feedback="yes" aria-label="Yes">✓</button></div><p>AI TOOLS</p><a href="${pageHref(prefix, "guides/ai-tools")}">${toolIcons["Connect your AI agent"]}Connect your AI agent</a><button type="button" class="docs-copy-markdown" data-source="${prefix}content/${page.id}.md">${toolIcons["Copy as Markdown"]}Copy as Markdown</button><button type="button" class="docs-ask-ai" data-provider="ChatGPT">${toolIcons["Ask ChatGPT"]}Ask ChatGPT</button><button type="button" class="docs-ask-ai" data-provider="Claude">${toolIcons["Ask Claude"]}Ask Claude</button></div>`;
  const isQuickstart = page.id.startsWith("guides/getting-started/quickstarts/");
  const breadcrumb = isQuickstart ? `<a href="${pageHref(prefix, "guides/getting-started")}">Start with Supabase</a><span>›</span><span>Framework Quickstarts</span><span>›</span><span>${escapeHtml(page.navTitle || page.title)}</span>` : `<a href="${prefix}">Docs</a><span>›</span><span>${escapeHtml(page.group)}</span><span>›</span><span>${escapeHtml(page.title)}</span>`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#121212" /><title>${escapeHtml(page.title)} | Supabase Docs</title><link rel="icon" href="${prefix}assets/supabase-dark.svg" type="image/svg+xml" /><link rel="stylesheet" href="${prefix}variables.css" /><link rel="stylesheet" href="${prefix}styles.css" /><script src="${prefix}assets/vendor/prism.js" defer></script><script src="${prefix}doc-page.js" defer></script></head>
<body class="docs-page" data-root="${prefix}"><a class="docs-skip" href="#main">Skip to content</a>${sharedMarkup(header, prefix)}
<main id="main" tabindex="-1"><div class="docs-document${referenceLayout ? " docs-reference" : ""}${isQuickstart ? " docs-quickstart" : ""}"><div class="docs-document-shell"><aside class="docs-sidebar" aria-label="Documentation navigation">${sidebarMarkup(page.id, prefix)}</aside><div class="docs-content-grid"><article class="docs-article"><button class="docs-sidebar-toggle" type="button" aria-expanded="false">Browse docs</button><nav class="docs-breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav><h1 class="docs-article-title">${escapeHtml(page.title)}</h1><p class="docs-article-summary">${escapeHtml(page.summary)}</p><details class="docs-mobile-toc"${headings.length ? "" : " hidden"}><summary>On this page</summary><nav>${toc}</nav></details><div class="docs-article-body">${body}</div></article><aside class="docs-toc" aria-label="On this page">${rightActions}${referenceLayout ? "" : `<span>ON THIS PAGE</span><nav>${toc}</nav>`}</aside></div></div></div></main>
${sharedMarkup(footer, prefix)}${sharedMarkup(dialogs, prefix)}</body></html>`;
  const output = join(root, "pages", page.id, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
  searchIndex.push({ id: page.id, title: page.title, summary: page.summary, group: page.group, content: source.replace(/\[[^\]]+\]\([^)]*\)/g, " ").replace(/[`#*_]/g, " ") });
}
await writeFile(join(root, "search-index.json"), JSON.stringify(searchIndex));
console.log(`Built ${pages.length} static documentation pages`);
