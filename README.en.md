<h1 align="center">homepage</h1>

<p align="center">
  A static blog and personal home page written in Markdown<br>
  <a href="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml"><img src="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml/badge.svg?branch=main" alt="Validate status"></a><br>
  <a href="README.md">한국어</a> | English
</p>

This repository builds a personal home page and a Blog from Markdown and JSON settings into static HTML and deploys it to GitHub Pages. It is the source of [woonyong.com](https://woonyong.com). Without a server, it provides search, tag filters, RSS, comments (giscus), and a post editor for the administrator. The internal document renderer (`src/document`) parses Markdown, and the internal design system (`src/design`) owns screen values and shared markup. Guides are in the [documentation index](docs/README.md) (Korean).

![Only approved input that passes link and asset checks becomes the static site](docs/assets/publication-flow.svg)

## Requirements

- Node.js 22 and npm
- Git
- Optional: an authenticated GitHub CLI (`gh`). With it, the build reads comment counts for the post list; without it, the list shows comment links only.

## Quick start

```sh
npm ci
npm run dev
```

`npm ci` generates the design output (`src/design/dist/`). `npm run dev` builds the site into `dist/site/` and serves it at http://127.0.0.1:8796. Run `npm run dev` again after changing files. To change the host or port, run `node src/build/serve.js --host <host> --port <port>`. Main paths: home `/`, all posts and search `/search/`, post feed `/blog/`, post `/blog/<slug>/`, RSS `/blog/feed.xml`, admin `/admin/`.

## Writing a post

A post is one `.md` file under `content/blog/`. Folder and file names do not affect the URL. Put YAML front matter at the top.

```markdown
---
id: first-post
slug: first-post
title: "First post"
description: "Summary shown in lists and search results"
tags: [notes, javascript]
publishedAt: "2026-01-15"
visibility: public
comments: true
---

Write the body in Markdown.
```

| Field | Required | Content |
|---|---|---|
| `id` | Yes | Fixed ID. Lowercase letters and digits joined by hyphens. Used to link comments |
| `slug` | Yes | URL `/blog/<slug>/`. Same format as `id`; `all`, `page`, and `feed` are reserved |
| `title`, `description` | Yes | Title and summary |
| `publishedAt` | Yes | Publication date `YYYY-MM-DD`. Posts dated after today (Korea time) are left out |
| `visibility` | Yes | `public`, `draft`, or `private`. Only `public` is published |
| `updatedAt` | No | Update date `YYYY-MM-DD`. Cannot precede the publication date |
| `tags`, `keywords` | No | String arrays. Tags are free text; `config/tags.json` only sets display names and aliases |
| `thumbnail` | No | `{ src, alt, position? }`. `src` is an image under `/assets/` or `/media/`, or an HTTPS URL |
| `comments` | No | Show comments. Default `false` |
| `example` | No | `true` leaves the post out |

`publish: false` or `status: draft` also leaves a post out. A duplicate `id` or `slug` or an invalid date stops the build. Put images and videos in `content/assets/` and `content/media/`. Supported syntax is in [Markdown 글 작성](docs/design/markdown.md) (Korean).

In this repository, `content/blog/` holds approved copies imported from a private Vault. Do not edit them directly; import them with `npm run content:sync -- <vault-root>`. The flow is in [발행](docs/design/publication.md) (Korean).

## Configuration

| File | Content |
|---|---|
| `config/site.json` | Site name, author, logo, description, GitHub and LinkedIn, projects, repository, comments (giscus) |
| `config/blog.json` | Blog title, list columns and rows, card fields, posts per feed page |
| `config/search.json` | Search title and search box labels |
| `config/tags.json` | Tag display names and search aliases |
| `config/admin.json` | Post repository, deploy workflow, and sign-in server for the admin screen |
| `config/approved-content.json` | File list and SHA-256 of approved copies. Updated by sync |
| `config/assets.json` | Source and license records of content assets |
| `config/image-sizes.json` | Width and height of external images |
| `config/publication-manifest.json` | Document sources recorded by Vault sync |
| `config/cs.json`, `config/tech.json` | Inputs kept for Vault sync compatibility. The site code does not read them |

The home page is assembled from `content/home.md`, `content/pages/tech.md`, and `content/interviews/index.md`. The format is in [홈 원고](docs/design/home-content.md) (Korean).

## Folder structure

```text
config/          Settings and approval lists
content/         Home page text, Blog posts, images and videos
src/build/       Site build entry (index.js) and preview server (serve.js)
src/content/     Reading and validating posts, home page, settings
src/layouts/     Page assembly
src/client/      Browser scripts (search, comments, feed)
src/admin/       Administrator post editor
src/vault/       Sync of approved copies from the Vault
src/document/    Markdown document renderer
src/design/      Tokens, CSS, shared components, icons
test/            node:test tests
workers/         OAuth sign-in relay for the admin screen (Cloudflare Worker)
docs/            Design notes and guides
```

## Commands

| Command | Content |
|---|---|
| `npm run dev` | Build and preview at http://127.0.0.1:8796 |
| `npm run build` | Generate the design and build the site into `dist/site/` |
| `npm test` | Generate the design and run `test/*.test.js` |
| `npm run content:sync -- <vault-root>` | Import approved files listed by the Vault publication manifest |
| `npm run content:check` | Check that approved copies match their hashes |

`npm run build -- --production` is the production build. With an HTTPS `SITE_ORIGIN`, it writes canonical URLs, a sitemap, and sharing metadata. A preview built without `--production` blocks search engine indexing.

## Deployment

`.github/workflows/validate.yml` runs `npm ci` and `npm test` on every push and pull request. `.github/workflows/deploy.yml` runs manually on `main`: after `npm test`, it builds with `npm run build -- --production` and `SITE_ORIGIN`, then uploads `dist/site` to GitHub Pages. If the repository secret `VAULT_TOKEN` exists, it checks out the Vault's `publish` and `assets` folders and builds with `--blog-root .vault/publish`.

## License

There is no LICENSE file that covers the whole repository. Sources and licenses of content assets are in `config/assets.json`; sources of icons and fonts are in `src/design/assets/sources.json` and the accompanying notice files.
