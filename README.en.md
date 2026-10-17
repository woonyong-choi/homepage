<h1 align="center">homepage</h1>

<p align="center">
  A Markdown-based personal blog and website<br>
  <a href="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml"><img src="https://github.com/woonyong-choi/homepage/actions/workflows/validate.yml/badge.svg?branch=main" alt="Build and product check status"></a><br>
  <a href="README.md">한국어</a> | English
</p>

This repository contains the source for [woonyong.com](https://woonyong.com). It publishes a personal introduction, technical documents, and blog posts from Markdown as static HTML. It imports approved content and uses shared packages for design, diagrams, and Markdown parsing.

> [!NOTE]
> In development. There are no releases; build from source.

## Contents

- [Quick start](#quick-start)
- [Why](#why)
- [How it works](#how-it-works)
- [Status](#status)
- [Documentation](#documentation)
- [Development](#development)

## Quick start

Use Node.js 22.x, version 22.13 or later, npm, and Git. Run these commands from the repository.

```sh
npm ci
npm run dev
```

Open the home page in the [local preview](http://localhost:8796/). Browse documents at `/docs/` and blog posts at `/blog/all/`. Restart the command after you change a file. The build output is in `dist/site/`. The default build is a preview that includes example posts and blocks search engine indexing.

The approved copies in this repository and the public Git dependencies are enough to run the site. Importing new content requires a publication manifest from the private Vault. If GitHub CLI is unavailable, unauthenticated, or a lookup fails, the site shows comment links instead of comment counts.

## Why

The site publishes selected files from private notes after approval. The build stops when files do not match the hashes in the publication manifest. Document IDs and URLs are separate from file locations, so moving a source file preserves its public URL.

For a blog with public content only, a static site tool without a separate approval manifest can be sufficient.

## How it works

1. Read approved Markdown, author settings, and assets, then check them against the publication manifest.
2. Parse the content with the document engine and compile diagrams with ThinkFlow.
3. Assemble pages and check internal links, anchors, and assets.
4. Replace the publication output in `dist/site/` after the checks pass.

![Only approved input that passes link and asset checks becomes the static site](docs/assets/publication-flow.svg)

[개인 사이트 발행](docs/design/publication.md) describes synchronization, recovery, preview, and deployment. Do not edit approved copies of content and settings directly. Update the source and its approval, then import it with these commands.

```sh
npm run content:sync-vault -- <vault-root>
npm run content:check
```

`<vault-root>` is the Vault root with an approved `tooling/dist/publication.json`. External project documents are maintained in their source repositories.

## Status

| Area | Scope |
|---|---|
| Implemented | Personal introduction, document hierarchy, search and tags, blog archive and feed, comments, Markdown and diagram publication |
| Limitations | Published pages use the light theme, code execution is unavailable, and the subscription endpoint is not configured |
| Next | [Full audit](https://github.com/woonyong-choi/homepage/issues/215), [integration checks](https://github.com/woonyong-choi/homepage/issues/28), [site mark](https://github.com/woonyong-choi/homepage/issues/303) |

Each issue records the scope of automated checks, visual checks, and production verification. This implementation serves a personal site and does not guarantee backward compatibility for content formats or commands.

## Documentation

The design documents are written in Korean.

- [개인 랜딩 페이지](docs/design/personal-landing.md): 홈 구성과 공통 구성 요소
- [전체 문서](docs/README.md)

## Development

```sh
npm run build:site
npm run check:product
npm run check:tokens
```

CI runs installation, token checks, product checks, and the build on Node.js 22. The design package, ThinkFlow, and document engine use pinned Git commits. To change shared components, update their source repository and follow [스타일 수정 지도](docs/design/styles.md#갱신) to update the dependency.

Regenerate the publication diagram with the installed ThinkFlow version.

```sh
node node_modules/thinkflow/src/cli.js render docs/assets/publication-flow.thinkflow --strict --static
```

Create a production build with `SITE_ORIGIN=https://woonyong.com npm run build:site -- --production`. Run the `Deploy woonyong.com` GitHub Actions workflow manually on `main` to check the site and deploy it to GitHub Pages.
