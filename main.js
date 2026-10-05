const asset = (name) => `assets/img/icons/${name}-icon.svg`;
document.querySelector(".docs-skip").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("main").focus();
});

const frameworks = [
  ["React", "react", "/guides/getting-started/quickstarts/reactjs"],
  ["Next.js", "nextjs", "/guides/getting-started/quickstarts/nextjs"],
  ["TanStack Start", "tanstack", "/guides/getting-started/quickstarts/tanstack"],
  ["Astro", "astro", "/guides/getting-started/quickstarts/astrojs"],
  ["Vue", "vuejs", "/guides/getting-started/quickstarts/vue"],
  ["Nuxt", "nuxt", "/guides/getting-started/quickstarts/nuxtjs"],
  ["SvelteKit", "svelte", "/guides/getting-started/quickstarts/sveltekit"],
  ["SolidJS", "solidjs", "/guides/getting-started/quickstarts/solidjs"],
  ["RedwoodJS", "redwood", "/guides/getting-started/quickstarts/redwoodjs"],
  ["Refine", "refine", "/guides/getting-started/quickstarts/refine"],
  ["Hono", "hono", "/guides/getting-started/quickstarts/hono"],
  ["iOS Swift", "swift-icon-orange", "/guides/getting-started/quickstarts/ios-swiftui"],
  ["Android Kotlin", "kotlin", "/guides/getting-started/quickstarts/kotlin"],
  ["Expo React Native", "expo", "/guides/getting-started/quickstarts/expo-react-native"],
  ["Flutter", "flutter", "/guides/getting-started/quickstarts/flutter"],
  ["Python", "python", "/guides/getting-started/quickstarts/flask"],
  ["Reflex", "reflex", "/guides/getting-started/quickstarts/reflex"],
  ["Laravel", "laravel", "/guides/getting-started/quickstarts/laravel"],
  ["Ruby on Rails", "rails", "/guides/getting-started/quickstarts/ruby-on-rails"],
  ["Spring Boot", "spring-boot", "/guides/getting-started/quickstarts/spring-boot"],
];

const backend = [
  ["Database", "Supabase provides a full Postgres database for every project with Realtime functionality, database backups, extensions, and more.", "/guides/database/overview", "database"],
  ["Auth", "Add and manage email and password, passwordless, OAuth, and mobile logins to your project through a suite of identity providers and APIs.", "/guides/auth", "auth"],
  ["Storage", "Store, organize, transform, and serve large files—fully integrated with your Postgres database with Row Level Security access policies.", "/guides/storage", "storage"],
  ["Realtime", "Listen to database changes, store and sync user states across clients, broadcast data to clients subscribed to a channel, and more.", "/guides/realtime", "realtime"],
  ["Edge Functions", "Globally distributed, server-side functions to execute your code closest to your users for the lowest latency.", "/guides/functions", "functions"],
];

const extensions = [
  ["AI & Vectors", "/guides/ai", "ui:ai-vectors"], ["Cron", "/guides/cron", "ui:cron"],
  ["Queues", "/guides/queues", "ui:queues"], ["Data REST API", "/guides/api", "ui:rest-api"],
  ["GraphQL API", "/guides/graphql", "ui:graphql"],
];
const libraries = [
  ["JavaScript", "/reference/javascript/introduction", "ui:javascript"], ["Flutter", "/reference/dart/introduction", "flutter"],
  ["Python", "/reference/python/introduction", "python"], ["C#", "/reference/csharp/introduction", "ui:csharp"],
  ["Swift", "/reference/swift/introduction", "swift-icon-orange"], ["Kotlin", "/reference/kotlin/introduction", "kotlin"],
];
const migrations = [
  ["Amazon RDS", "amazon-rds", "aws-rds"], ["Auth0", "auth0", "auth0"],
  ["Firebase Auth", "firebase-auth", "firebase"], ["Firebase Storage", "firebase-storage", "firebase"],
  ["Firestore Data", "firestore-data", "firebase"], ["Heroku", "heroku", "heroku"],
  ["MSSQL", "mssql", "mssql"], ["MySQL", "mysql", "mysql"],
  ["Neon", "neon", "neon"], ["Postgres", "postgres", "postgres"],
  ["Render", "render", "render"], ["Vercel Postgres", "vercel-postgres", "vercel"],
].map(([title, path, icon]) => [title, `/guides/platform/migrating-to-supabase/${path}`, icon]);
const resources = [
  ["AI tools", "Develop with Supabase AI-first using plugins, MCP, and skills.", "/guides/ai-tools", "ai-tools"],
  ["Platform guides", "Learn more about the tools and services powering Supabase.", "/guides/platform", "platform"],
  ["Supabase CLI", "Use the CLI to develop, manage and deploy your projects.", "/reference/cli/introduction", "cli"],
  ["Management API", "Manage your Supabase projects and organizations.", "/reference/api/introduction", "management-api"],
  ["Integrations", "Explore a variety of integrations from Supabase partners.", "/guides/integrations", "integrations"],
  ["Supabase Library", "A collection of pre-built Supabase components to speed up your project.", "/library", "library"],
  ["Troubleshooting", "Our troubleshooting guide for solutions to common Supabase issues.", "/guides/troubleshooting", "troubleshooting"],
];
const selfHosted = [
  ["Auth", "/reference/self-hosting-auth/introduction", "ui:self-auth"], ["Realtime", "/reference/self-hosting-realtime/introduction", "ui:self-realtime"],
  ["Storage", "/reference/self-hosting-storage/introduction", "ui:self-storage"], ["Analytics", "/reference/self-hosting-analytics/introduction", "ui:self-analytics"],
];

const localPages = new Map([
  ["/", ""], ["/guides/getting-started", "guides/getting-started"],
  ["/guides/database/overview", "guides/database"], ["/guides/auth", "guides/auth"],
  ["/guides/storage", "guides/storage"], ["/guides/realtime", "guides/realtime"],
  ["/guides/functions", "guides/functions"], ["/guides/local-development", "guides/local-development"],
  ["/guides/deployment/database-migrations", "guides/migrations"],
  ["/guides/platform", "guides/platform"], ["/guides/platform/organizations", "guides/organizations"],
  ["/reference/javascript/introduction", "reference/javascript"], ["/reference/cli/introduction", "reference/cli"],
  ["/guides/troubleshooting", "guides/troubleshooting"], ["/guides/self-hosting", "guides/self-hosting"],
]);
function link(path) {
  if (path.startsWith("https:") || path.startsWith("pages/")) return path;
  if (path === "/") return "./";
  return `pages/${localPages.get(path) ?? path.replace(/^\//, "")}/`;
}
function imageOrSymbol(icon, title) {
  const frame = document.createElement("span");
  frame.className = "docs-item-icon";
  if (icon.startsWith("ui:") || icon.length > 3) {
    const img = document.createElement("img");
    img.src = icon.startsWith("ui:") ? `assets/ui/${icon.slice(3)}.svg` : icon.endsWith("-icon-orange") ? `assets/img/icons/${icon}.svg` : asset(icon);
    img.alt = "";
    frame.append(img);
  } else {
    frame.textContent = icon;
    frame.setAttribute("aria-hidden", "true");
  }
  return frame;
}
function renderLinks(target, items) {
  const parent = document.getElementById(target);
  for (const [title, path, icon] of items) {
    const a = document.createElement("a");
    a.className = "docs-item-link";
    a.href = link(path);
    a.append(imageOrSymbol(icon, title), document.createTextNode(title));
    parent.append(a);
  }
}
renderLinks("frameworks", frameworks.map(([title, icon, path]) => [title, path, icon]));
renderLinks("extensions", extensions);
renderLinks("libraries", libraries);
renderLinks("migrations", migrations);
renderLinks("self-hosted", selfHosted);

for (const [title, description, path, icon] of backend) {
  const a = document.createElement("a");
  a.className = "docs-product-card";
  a.href = link(path);
  const heading = document.createElement("span");
  heading.className = "docs-product-title";
  const image = document.createElement("img");
  image.src = `assets/ui/${icon}.svg`;
  image.alt = "";
  heading.append(image);
  heading.append(document.createTextNode(title));
  const body = document.createElement("span");
  body.className = "docs-product-description";
  body.textContent = description;
  a.append(heading, body);
  document.getElementById("backend").append(a);
}
for (const [title, description, path, icon] of resources) {
  const a = document.createElement("a");
  a.className = "docs-resource-card";
  a.href = link(path);
  const mark = document.createElement("span");
  mark.className = "docs-resource-mark";
  const image = document.createElement("img");
  image.src = `assets/ui/${icon}.svg`;
  image.alt = "";
  mark.append(image);
  const heading = document.createElement("span");
  heading.className = "docs-resource-title";
  heading.textContent = title;
  const body = document.createElement("span");
  body.className = "docs-resource-description";
  body.textContent = description;
  a.append(mark, heading, body);
  document.getElementById("resources").append(a);
}

const promptText = "Help me get set up with Supabase. Do the following:\n1. Install the Supabase CLI as a project dev dependency with `npm install supabase --save-dev`, so the version is pinned per project.\n2. Install the Supabase Plugin with `npx plugins add supabase-community/supabase-plugin`.\n3. Review my project and determine whether Supabase is already initialized. If it is not initialized, run `npx supabase init`.\n4. Suggest the most relevant next steps.";
const cliText = "npm install supabase --save-dev\nnpx plugins add supabase-community/supabase-plugin";
const commandContent = document.getElementById("command-content");
let activeTab = "prompt";
function setTab(name) {
  activeTab = name;
  document.querySelectorAll(".docs-tabs button").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.tab === name)));
  commandContent.classList.remove("is-expanded");
  commandContent.replaceChildren();
  if (name === "cli") {
    const code = document.createElement("pre");
    code.textContent = cliText;
    commandContent.append(code);
  } else {
    const intro = document.createElement("p");
    intro.textContent = "Help me get set up with Supabase. Do the following:";
    const list = document.createElement("ol");
    for (const line of promptText.split("\n").slice(1)) {
      const item = document.createElement("li");
      const parts = line.replace(/^\d\. /, "").split(/(`[^`]+`)/);
      for (const part of parts) {
        if (part.startsWith("`") && part.endsWith("`")) {
          const code = document.createElement("code");
          code.textContent = part.slice(1, -1);
          item.append(code);
        } else item.append(document.createTextNode(part));
      }
      list.append(item);
    }
    const more = document.createElement("button");
    more.type = "button";
    more.className = "docs-show-more";
    more.textContent = "Show more";
    more.addEventListener("click", () => {
      const expanded = commandContent.classList.toggle("is-expanded");
      more.textContent = expanded ? "Show less" : "Show more";
    });
    commandContent.append(intro, list, more);
  }
  document.querySelector(".docs-copy").setAttribute("aria-label", name === "prompt" ? "Copy Agent Prompt" : "Copy CLI commands");
}
document.querySelectorAll(".docs-tabs button").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));
setTab("prompt");
document.querySelector(".docs-copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(activeTab === "prompt" ? promptText : cliText);
  const button = document.querySelector(".docs-copy");
  button.title = "Copied";
  button.setAttribute("aria-label", "Copied");
  setTimeout(() => {
    button.title = "Copy to clipboard";
    button.setAttribute("aria-label", activeTab === "prompt" ? "Copy Agent Prompt" : "Copy CLI commands");
  }, 1600);
});

const dialog = document.querySelector(".docs-search-dialog");
const searchInput = dialog.querySelector("input");
const searchResults = dialog.querySelector(".docs-search-results");
const searchable = [
  ...frameworks.map(([title, , path]) => [title, path, "Framework"]),
  ...backend.map(([title, , path]) => [title, path, "Product"]),
  ...extensions.map(([title, path]) => [title, path, "Database"]),
  ...libraries.map(([title, path]) => [title, path, "Client library"]),
  ...resources.map(([title, , path]) => [title, path, "Resource"]),
];
fetch("search-index.json")
  .then((response) => response.json())
  .then((entries) => {
    entries.forEach((page) => searchable.unshift([page.title, `pages/${page.id}/`, page.group, `${page.summary} ${page.content}`]));
    if (dialog.open) search();
  })
  .catch(() => {});
function search() {
  const query = searchInput.value.trim().toLowerCase();
  searchResults.replaceChildren();
  if (!query) {
    const groups = [
      ["DOCS", [["Search the docs", "/", "Documentation"]]],
      ["GO TO", [["Go to Getting Started", "/guides/getting-started", "Guide"], ["Go to Database", "/guides/database/overview", "Product"], ["Go to Auth", "/guides/auth", "Product"], ["Go to Storage", "/guides/storage", "Product"], ["Go to Functions", "/guides/functions", "Product"], ["Go to Realtime", "/guides/realtime", "Product"]]],
    ];
    for (const [label, entries] of groups) {
      const heading = document.createElement("p");
      heading.className = "docs-search-group";
      heading.textContent = label;
      searchResults.append(heading);
      for (const [title, path, group] of entries) {
        const a = document.createElement("a");
        a.href = link(path);
        a.textContent = title;
        const meta = document.createElement("span");
        meta.textContent = group;
        a.append(meta);
        searchResults.append(a);
      }
    }
    return;
  }
  const seen = new Set();
  const matches = searchable.filter(([title, path, group, content = ""]) => {
    const href = link(path);
    if (seen.has(href) || !`${title} ${group} ${content}`.toLowerCase().includes(query)) return false;
    seen.add(href);
    return true;
  }).slice(0, 12);
  if (!matches.length) {
    const empty = document.createElement("p");
    empty.textContent = "No results found";
    searchResults.append(empty);
  }
  for (const [title, path, group] of matches) {
    const a = document.createElement("a");
    a.href = link(path);
    a.textContent = title;
    const label = document.createElement("span");
    label.textContent = group;
    a.append(label);
    searchResults.append(a);
  }
}
document.querySelector(".docs-search-trigger").addEventListener("click", () => { dialog.showModal(); searchInput.focus(); search(); });
document.querySelector(".docs-search-close").addEventListener("click", () => dialog.close());
searchResults.addEventListener("click", (event) => { if (event.target.closest("a")) dialog.close(); });
searchInput.addEventListener("input", search);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const first = searchResults.querySelector("a");
    if (first) { event.preventDefault(); first.click(); }
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (dialog.open) dialog.close(); else { dialog.showModal(); searchInput.focus(); search(); }
  }
});

document.querySelectorAll(".docs-nav-menu").forEach((menu) => menu.addEventListener("toggle", () => {
  if (menu.open) document.querySelectorAll(".docs-nav-menu").forEach((other) => { if (other !== menu) other.open = false; });
}));

const mobileTrigger = document.querySelector(".docs-mobile-trigger");
const mobileNav = document.querySelector(".docs-mobile-nav");
mobileTrigger.addEventListener("click", () => {
  mobileNav.hidden = !mobileNav.hidden;
  mobileTrigger.setAttribute("aria-expanded", String(!mobileNav.hidden));
});
mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) { mobileNav.hidden = true; mobileTrigger.setAttribute("aria-expanded", "false"); }
});

const privacyDialog = document.querySelector(".docs-privacy-dialog");
const optionalStorage = privacyDialog.querySelector("#optional-storage");
try { optionalStorage.checked = localStorage.getItem("docs-optional-preferences") === "true"; } catch { optionalStorage.checked = false; }
document.querySelector(".docs-privacy-trigger").addEventListener("click", () => privacyDialog.showModal());
document.querySelector(".docs-privacy-cancel").addEventListener("click", () => privacyDialog.close());
document.querySelector(".docs-privacy-save").addEventListener("click", () => {
  try { localStorage.setItem("docs-optional-preferences", String(optionalStorage.checked)); } catch { /* Browser storage may be unavailable. */ }
  privacyDialog.close();
});
