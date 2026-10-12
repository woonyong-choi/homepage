import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readProjectDocuments, projectRoute, projectReference } from './project-documents.mjs';
import { createMarkdown } from './markdown.mjs';
import { renderArticle } from './article-renderer.mjs';

const { documents, assets } = readProjectDocuments();
const usage = documents.find(page => page.project.file === 'docs/usage.md');

test('project_snapshot_has_unique_routes_and_pinned_source_links', () => {
  assert.ok(documents.length > 0);
  assert.equal(new Set(documents.map(page => page.route)).size, documents.length);
  assert.equal(new Set(documents.map(page => page.id)).size, documents.length);
  for (const page of documents) assert.ok(page.sourceUrl.includes(page.project.manifest.revision));
  assert.ok(assets.has('/assets/projects/thinkflow/LICENSE'));
  assert.throws(() => projectRoute('docs/../private.md'), /invalid/);
  assert.throws(() => projectRoute('../private.md'), /invalid/);
});

test('project_links_use_local_documents_and_assets_and_reject_missing_docs', () => {
  const project = usage.project;
  assert.equal(projectReference('#시작하기', project), '/projects/thinkflow/usage/#thinkflow-usage-시작하기');
  assert.equal(projectReference('README.md', project), '/projects/thinkflow/');
  assert.equal(projectReference('usage-request.svg', project), '/assets/projects/thinkflow/docs/usage-request.svg');
  assert.equal(projectReference('https://example.com/', project), 'https://example.com/');
  assert.throws(() => projectReference('missing.md', project), /missing/);
  assert.throws(() => projectReference('%5cprivate.md', project), /invalid/);
  assert.equal(projectReference('../package.json', project), `https://github.com/${project.manifest.repository}/blob/${project.manifest.revision}/package.json`);
});

test('project_viewer_embeds_diagrams_once_and_keeps_unrelated_images', () => {
  const diagramSources = new Map();
  const rendered = renderArticle(createMarkdown(), usage, { diagramSources });
  assert.ok(diagramSources.size > 0);
  assert.doesNotMatch(rendered.html, /<h1\b|src="[^"\n]*usage-request\.svg"/);
  assert.match(rendered.html, /href="\/projects\/thinkflow\/design\/figure-syntax\//);
  const page = { ...usage, body: '# Test\n\n![그림](usage-request.svg)\n' };
  assert.match(renderArticle(createMarkdown(), page).html, /src="\/assets\/projects\/thinkflow\/docs\/usage-request.svg"/);
});

test('every_guide_opens_an_existing_local_project_page_and_heading', () => {
  const site = JSON.parse(readFileSync(new URL('../config/site.json', import.meta.url)));
  for (const item of site.guides[0].items) {
    const url = new URL(item.href, 'https://homepage.invalid');
    assert.equal(url.origin, 'https://homepage.invalid');
    const page = documents.find(page => page.route === url.pathname);
    assert.ok(page, item.href);
    if (url.hash) assert.ok(renderArticle(createMarkdown(), page).headings.some(heading => heading.id === decodeURIComponent(url.hash.slice(1))), item.href);
  }
});
