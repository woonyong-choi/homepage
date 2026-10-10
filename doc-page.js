function tokenNumber(name) { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); }
const root = document.body.dataset.root;
const searchDialog = document.querySelector(".docs-search-dialog");
const searchInput = searchDialog.querySelector("input");
const searchResults = searchDialog.querySelector(".docs-search-results");
let searchIndex = [];

fetch(`${root}search-index.json`)
  .then((response) => response.json())
  .then((entries) => { searchIndex = entries; if (searchDialog.open) renderSearch(); })
  .catch(() => {});

function renderSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = query
    ? searchIndex.filter((page) => `${page.title} ${page.summary} ${page.group} ${page.content}`.toLowerCase().includes(query)).slice(0, 12)
    : searchIndex.filter((page) => ["guides/getting-started", "guides/database", "guides/auth", "guides/storage", "guides/functions", "guides/realtime"].includes(page.id));
  searchResults.replaceChildren();
  const heading = document.createElement("p");
  heading.className = "docs-search-group";
  heading.textContent = query ? "RESULTS" : "GO TO";
  searchResults.append(heading);
  if (!matches.length) {
    const empty = document.createElement("p");
    empty.textContent = "No results found";
    searchResults.append(empty);
  }
  for (const page of matches) {
    const anchor = document.createElement("a");
    anchor.href = `${root}pages/${page.id}/`;
    anchor.textContent = page.title;
    const group = document.createElement("span");
    group.textContent = page.group;
    anchor.append(group);
    searchResults.append(anchor);
  }
}

function toggleSearch() {
  if (searchDialog.open) searchDialog.close();
  else { searchDialog.showModal(); searchInput.focus(); renderSearch(); }
}
document.querySelector(".docs-search-trigger").addEventListener("click", toggleSearch);
document.querySelector(".docs-search-close").addEventListener("click", () => searchDialog.close());
searchInput.addEventListener("input", renderSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const first = searchResults.querySelector("a");
    if (first) { event.preventDefault(); first.click(); }
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); toggleSearch(); }
});

const sidebar = document.querySelector(".docs-sidebar");
const sidebarToggle = document.querySelector(".docs-sidebar-toggle");
const sidebarClose = document.querySelector(".docs-sidebar-close");
function closeSidebar() {
  sidebar.classList.remove("is-open");
  sidebarToggle.setAttribute("aria-expanded", "false");
  sidebarToggle.focus();
}
sidebarClose.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) closeSidebar();
});
const activeSidebarLink = sidebar.querySelector('[aria-current="page"]');
if (activeSidebarLink) {
  const link = activeSidebarLink.getBoundingClientRect();
  const pane = sidebar.getBoundingClientRect();
  if (link.top < pane.top || link.bottom > pane.bottom) {
    sidebar.scrollTop += link.top - pane.top - sidebar.clientHeight / tokenNumber("--ratio-sidebar-anchor");
  }
}
sidebarToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("is-open");
  sidebarToggle.setAttribute("aria-expanded", String(open));
  if (open) { sidebar.scrollTop = 0; sidebarClose.focus(); }
});
document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
    sidebar.classList.remove("is-open");
    sidebarToggle.setAttribute("aria-expanded", "false");
  }
});

const mobileTrigger = document.querySelector(".docs-mobile-trigger");
const mobileNav = document.querySelector(".docs-mobile-nav");
mobileTrigger.addEventListener("click", () => {
  mobileNav.hidden = !mobileNav.hidden;
  mobileTrigger.setAttribute("aria-expanded", String(!mobileNav.hidden));
});
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) { mobileNav.hidden = true; mobileTrigger.setAttribute("aria-expanded", "false"); }
});
document.querySelectorAll(".docs-nav-menu").forEach((menu) => menu.addEventListener("toggle", () => {
  if (menu.open) document.querySelectorAll(".docs-nav-menu").forEach((other) => { if (other !== menu) other.open = false; });
}));

const toc = document.querySelector(".docs-toc nav");
if (toc) {
  const tocPane = toc.closest(".docs-toc");
  const headings = [...document.querySelectorAll(".docs-article-body h2[id], .docs-article-body h3[id]")];
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const mobileLinks = [...document.querySelectorAll('.docs-mobile-toc a[href^="#"]')];
  let pending = false;

  function positionToc() {
    if (getComputedStyle(tocPane).display === "none") return;
    const grid = document.querySelector(".docs-content-grid");
    const article = document.querySelector(".docs-article");
    const gridStyle = getComputedStyle(grid);
    const gap = parseFloat(gridStyle.columnGap);
    const column = parseFloat(gridStyle.gridTemplateColumns);
    const left = article.getBoundingClientRect().right + column + gap * tokenNumber("--ratio-toc-gaps");
    const right = grid.getBoundingClientRect().right - parseFloat(gridStyle.paddingRight);
    tocPane.style.left = `${left}px`;
    tocPane.style.width = `${Math.max(0, right - left)}px`;
  }

  function updateToc() {
    pending = false;
    if (!headings.length || !links.length) return;
    const threshold = Math.min(tokenNumber("--size-toc-threshold"), window.innerHeight * tokenNumber("--ratio-toc-viewport"));
    let current = 0;
    for (let index = 0; index < headings.length; index++) {
      if (headings[index].getBoundingClientRect().top > threshold) break;
      current = index;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - tokenNumber("--size-scroll-epsilon")) current = headings.length - 1;
    let parent = current;
    while (parent > 0 && headings[parent].tagName !== "H2") parent--;
    const activeIds = new Set([headings[parent].id, headings[current].id]);
    for (const link of [...links, ...mobileLinks]) {
      const active = activeIds.has(decodeURIComponent(link.hash.slice(1)));
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
    const start = links.find((link) => link.hash.slice(1) === headings[parent].id);
    const end = links.find((link) => link.hash.slice(1) === headings[current].id);
    if (start && end) {
      toc.style.setProperty("--toc-progress-top", `${start.offsetTop}px`);
      toc.style.setProperty("--toc-progress-height", `${end.offsetTop + end.offsetHeight - start.offsetTop}px`);
    }
  }

  function scheduleTocUpdate() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateToc);
  }

  tocPane.addEventListener("wheel", (event) => {
    if (tocPane.scrollHeight <= tocPane.clientHeight) event.preventDefault();
  }, { passive: false });
  window.addEventListener("scroll", scheduleTocUpdate, { passive: true });
  window.addEventListener("resize", () => { positionToc(); scheduleTocUpdate(); });
  window.addEventListener("hashchange", scheduleTocUpdate);
  window.addEventListener("load", scheduleTocUpdate);
  document.fonts.ready.then(scheduleTocUpdate);
  new ResizeObserver(scheduleTocUpdate).observe(document.querySelector(".docs-article"));
  positionToc();
  updateToc();
}

const copyIcon = '<svg viewBox="0 0 24 24" class="docs-code-icon" fill="none" stroke="currentColor"  aria-hidden="true"><rect x="8" y="8" width="12" height="13" class="docs-copy-rect"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
const checkIcon = '<svg viewBox="0 0 24 24" class="docs-code-icon" fill="none" stroke="currentColor"  aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
const wrapIcon = '<svg viewBox="0 0 24 24" class="docs-code-icon" fill="none" stroke="currentColor"  aria-hidden="true"><path d="M3 6h18M3 12h14a3 3 0 0 1 0 6h-5m3-3-3 3 3 3M3 18h4"/></svg>';

function drawCodeLines(code, source) {
  code.replaceChildren();
  const language = code.className.replace("language-", "").split(" ")[0];
  const grammar = window.Prism?.languages[language === "sh" ? "bash" : language];
  const lines = source.replace(/\n$/, "").split("\n");
  lines.forEach((line, index) => {
    const span = document.createElement("span");
    span.className = "docs-code-line";
    span.dataset.line = String(index + 1);
    if (grammar) span.innerHTML = window.Prism.highlight(line || " ", grammar, language);
    else span.textContent = line || " ";
    code.append(span);
  });
}
for (const pre of document.querySelectorAll(".docs-article-body pre")) {
  if (pre.closest(".docs-agent-prompt")) continue;
  const code = pre.querySelector("code");
  const original = code?.textContent || "";
  const frame = document.createElement("div");
  frame.className = "docs-code";
  frame.dataset.code = original;
  pre.replaceWith(frame);
  frame.append(pre);
  if (code) {
    const label = document.createElement("span");
    label.className = "docs-code-label";
    label.textContent = code.className.replace("language-", "") || "text";
    frame.append(label);
    drawCodeLines(code, original);
  }
  const wrap = document.createElement("button");
  wrap.type = "button";
  wrap.className = "docs-code-wrap";
  wrap.innerHTML = wrapIcon;
  wrap.setAttribute("aria-label", "Toggle code word wrap");
  wrap.addEventListener("click", () => {
    const enabled = frame.classList.toggle("is-wrapped");
    wrap.setAttribute("aria-pressed", String(enabled));
  });
  frame.append(wrap);
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = copyIcon;
  button.setAttribute("aria-label", "Copy code");
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(frame.dataset.code);
    button.innerHTML = checkIcon;
    button.setAttribute("aria-label", "Copied code");
    setTimeout(() => { button.innerHTML = copyIcon; button.setAttribute("aria-label", "Copy code"); }, tokenNumber("--duration-feedback"));
  });
  frame.append(button);
}

for (const tabs of document.querySelectorAll(".docs-code-tabs")) {
  const variants = Object.fromEntries(JSON.parse(tabs.dataset.variants));
  tabs.querySelectorAll('[role="tab"]').forEach((button) => button.addEventListener("click", () => {
    tabs.querySelectorAll('[role="tab"]').forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    const code = tabs.querySelector("code");
    code.closest(".docs-code").dataset.code = variants[button.dataset.label];
    drawCodeLines(code, variants[button.dataset.label]);
  }));
}
for (const prompt of document.querySelectorAll(".docs-agent-prompt")) {
  prompt.querySelector(".docs-agent-copy").innerHTML = copyIcon;
  prompt.querySelector(".docs-agent-more").addEventListener("click", () => {
    const expanded = prompt.classList.toggle("is-expanded");
    prompt.querySelector(".docs-agent-more").textContent = expanded ? "Show less" : "Show more";
    prompt.querySelector(".docs-agent-more").setAttribute("aria-expanded", String(expanded));
  });
  prompt.querySelector(".docs-agent-copy").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    await navigator.clipboard.writeText(prompt.dataset.prompt);
    button.innerHTML = checkIcon;
    setTimeout(() => { button.innerHTML = copyIcon; }, tokenNumber("--duration-feedback"));
  });
}
document.querySelector(".docs-copy-markdown")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const response = await fetch(button.dataset.source);
  await navigator.clipboard.writeText(await response.text());
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = "Copy as Markdown"; }, tokenNumber("--duration-feedback"));
});
document.querySelectorAll(".docs-ask-ai").forEach((button) => button.addEventListener("click", async () => {
  const provider = button.dataset.provider;
  const destination = provider === "Claude" ? "https://claude.ai/new" : "https://chatgpt.com/";
  window.open(destination, "_blank", "noopener,noreferrer");
  const source = document.querySelector(".docs-copy-markdown")?.dataset.source;
  if (!source) return;
  const response = await fetch(source);
  await navigator.clipboard.writeText(await response.text());
  button.textContent = "Markdown copied";
  setTimeout(() => { button.textContent = `Ask ${provider}`; }, tokenNumber("--duration-feedback"));
}));
document.querySelectorAll(".docs-feedback").forEach((button) => button.addEventListener("click", () => {
  button.closest(".docs-right-actions").querySelector("p").textContent = "Thanks for your feedback";
}));

const privacyDialog = document.querySelector(".docs-privacy-dialog");
const optionalStorage = privacyDialog.querySelector("#optional-storage");
try { optionalStorage.checked = localStorage.getItem("docs-optional-preferences") === "true"; } catch { optionalStorage.checked = false; }
document.querySelector(".docs-privacy-trigger").addEventListener("click", () => privacyDialog.showModal());
document.querySelector(".docs-privacy-cancel").addEventListener("click", () => privacyDialog.close());
document.querySelector(".docs-privacy-save").addEventListener("click", () => {
  try { localStorage.setItem("docs-optional-preferences", String(optionalStorage.checked)); } catch { /* Storage may be unavailable. */ }
  privacyDialog.close();
});
document.querySelector(".docs-skip").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("main").focus();
});

document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).backgroundColor;
