import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { readProjectDocuments, projectRoute, projectReference } from './project-documents.mjs';
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
  assert.throws(() => projectReference('assets/missing.svg', project), /missing/);
  assert.equal(projectReference('assets/sources.json', project), `https://github.com/${project.manifest.repository}/blob/${project.manifest.revision}/docs/assets/sources.json`);
  assert.equal(projectReference('../package.json', project), `https://github.com/${project.manifest.repository}/blob/${project.manifest.revision}/package.json`);
});

test('project_viewer_embeds_diagrams_once_and_keeps_unrelated_images', async () => {
  const diagramSources = new Map();
  const rendered = (await renderArticle(usage, { diagramSources }));
  assert.ok(diagramSources.size > 0);
  assert.doesNotMatch(rendered.html, /<h1\b|src="[^"\n]*usage-request\.svg"/);
  assert.match(rendered.html, /href="\/projects\/thinkflow\/design\/figure-syntax\//);
  const page = { ...usage, body: '# Test\n\n![그림](usage-request.svg)\n' };
  assert.match((await renderArticle(page)).html, /src="\/assets\/projects\/thinkflow\/docs\/usage-request.svg"/);
});

test('every_guide_opens_an_existing_local_project_page_and_heading', async () => {
  const site = JSON.parse(readFileSync(new URL('../config/site.json', import.meta.url)));
  for (const item of site.guides[0].items) {
    const url = new URL(item.href, 'https://homepage.invalid');
    assert.equal(url.origin, 'https://homepage.invalid');
    const page = documents.find(page => page.route === url.pathname);
    assert.ok(page, item.href);
    if (url.hash) assert.ok((await renderArticle(page)).headings.some(heading => heading.id === decodeURIComponent(url.hash.slice(1))), item.href);
  }
});

const FIGURE = '```thinkflow name=flow\nA-->B\n```\n\n![흐름](usage-request.svg)<!-- thinkflow -->\n';
const scene = (summary, svg) => `<details>\n<summary>${summary}</summary>\n\n![장면](${svg})<!-- thinkflow -->\n\n</details>\n`;
const START = '<!-- thinkflow scenes v1 name=flow -->\n';
const END = '<!-- /thinkflow scenes v1 name=flow -->\n';
const render = async body => (await renderArticle({ ...usage, body: `# T\n\n${body}` })).html;

test('project_viewer_removes_only_the_intact_scene_list_of_its_own_diagram', async () => {
  const intact = await render(`${FIGURE}${START}${scene('쓰기', 'usage-trace.svg')}${scene('읽기', 'usage-queue.svg')}${END}\n뒤 문단\n`);
  assert.doesNotMatch(intact, /<details|usage-(?:request|trace|queue)\.svg|thinkflow scenes/);
  assert.match(intact, /뒤 문단/);
  assert.match(await render(`${FIGURE}\n뒤 문단\n`), /뒤 문단/);
});

test('project_viewer_matches_scene_lists_to_name_or_unnamed_order', async () => {
  const unnamed = n => `\`\`\`thinkflow\nA-->B\n\`\`\`\n\n![흐름](usage-request.svg)<!-- thinkflow -->\n${START.replace('name=flow', `n=${n}`)}${scene('쓰기', 'usage-trace.svg')}${END.replace('name=flow', `n=${n}`)}\n본문 ${n}\n\n`;
  const named = `${FIGURE}${START}${scene('읽기', 'usage-queue.svg')}${END}\n이름 본문\n\n`;
  const clean = html => assert.doesNotMatch(html, /<details|\.svg"|thinkflow scenes/);
  // 이름 있는 울타리는 순번을 쓰지 않으므로 둘째 이름 없는 울타리가 n=2다.
  const mixed = await render(unnamed(1) + named + unnamed(2));
  clean(mixed);
  for (const text of ['본문 1', '이름 본문', '본문 2']) assert.match(mixed, new RegExp(text));
  clean(await render(unnamed(1) + unnamed(2) + unnamed(3)));
  // 순번은 소비자가 다시 세지 않고 생성 표식의 값을 읽는다.
  clean(await render(named + unnamed(2)));
  clean(await render(unnamed(2) + unnamed(1)));
});

test('project_viewer_reads_unnamed_scene_id_from_the_generated_marker_not_from_fence_order', async () => {
  const unnamed = (n, text) => `\`\`\`thinkflow\nA-->B\n\`\`\`\n\n![흐름](usage-request.svg)<!-- thinkflow -->\n${START.replace('name=flow', `n=${n}`)}${scene('쓰기', 'usage-trace.svg')}${END.replace('name=flow', `n=${n}`)}\n${text}\n\n`;
  const quote = body => body.split('\n').map(line => (line ? `> ${line}` : '>')).join('\n');
  const clean = html => assert.doesNotMatch(html, /<details|\.svg"|thinkflow scenes/);
  // 표식 없는 인용 안 울타리는 생성기가 건너뛰므로 뒤 정상 목록이 n=1이다.
  const skipped = '> ```thinkflow\n> A-->B\n> ```\n\n';
  const first = await render(skipped + unnamed(1, '정상 본문'));
  clean(first);
  assert.match(first, /정상 본문/);
  // 생성 표식이 있는 인용 안 n=1 뒤의 일반 울타리는 n=2다.
  const quoted = await render(quote(unnamed(1, '인용 본문')) + '\n\n' + unnamed(2, '일반 본문'));
  clean(quoted);
  assert.match(quoted, /일반 본문/);
});

test('project_viewer_keeps_unnamed_scene_lists_with_unreadable_or_foreign_ids', async () => {
  const trace = scene('쓰기', 'usage-trace.svg');
  const body = (fenceInfo, start, end) => `\`\`\`${fenceInfo}\nA-->B\n\`\`\`\n\n![흐름](usage-request.svg)<!-- thinkflow -->\n<!-- thinkflow scenes v1 ${start} -->\n${trace}<!-- /thinkflow scenes v1 ${end} -->\n\n뒤 글\n`;
  const keep = (html, label) => assert.match(html, /thinkflow scenes/, label);
  for (const id of ['n=0', 'n=-1', 'n=a', 'n=01', 'n=', 'name=flow']) keep(await render(body('thinkflow', id, id)), id);
  keep(await render(body('thinkflow', 'n=1', 'n=2')), 'mismatched end');
  keep(await render(body('thinkflow', 'n=1', 'name=flow')), 'end with name');
  keep(await render(body('thinkflow name=flow', 'n=1', 'n=1')), 'named fence with n mark');
  assert.doesNotMatch(await render(body('thinkflow', 'n=7', 'n=7')), /<details|thinkflow scenes/);
});

test('project_viewer_removes_scene_list_generated_by_thinkflow_and_keeps_following_text', async () => {
  const generated = [
    '```thinkflow name=minimal', 'state', '```', '',
    '![작업 상태](usage-request.svg)<!-- thinkflow -->',
    '<!-- thinkflow scenes v1 name=minimal -->', '<details>', '<summary>재시도</summary>', '',
    '![작업 상태 (재시도)](usage-trace.svg)<!-- thinkflow -->', '', '</details>',
    '<!-- /thinkflow scenes v1 name=minimal -->', '',
    '`start`는 처음 상태입니다.', '',
  ].join('\n');
  const html = await render(generated);
  assert.doesNotMatch(html, /<details|\.svg"|thinkflow scenes/);
  assert.match(html, /<code>start<\/code>는 처음 상태입니다/);
  // 끝 표식 바로 뒤에 새 울타리가 이어져도 소유 구간만 걷는다.
  const adjacent = await render(generated.replace('\n\n`start`는 처음 상태입니다.', '\n```thinkflow name=next\nB-->C\n```'));
  assert.doesNotMatch(adjacent, /<details|\.svg"|thinkflow scenes/);
  assert.match(adjacent, /B--&gt;C/);
});

test('project_viewer_keeps_scene_lists_it_cannot_prove_are_generated', async () => {
  const trace = scene('쓰기', 'usage-trace.svg');
  const cases = {
    userDetails: `${FIGURE}\n${scene('내 접기', 'usage-trace.svg')}`,
    otherName: `${FIGURE}${START.replace('name=flow', 'name=other')}${trace}${END.replace('name=flow', 'name=other')}`,
    missingEnd: `${FIGURE}${START}${trace}\n뒤 문단\n`,
    mismatchedEnd: `${FIGURE}${START}${trace}${END.replace('v1', 'v2')}`,
    gluedAfterEnd: `${FIGURE}${START}${trace}${END}붙은 글\n`,
    emptyList: `${FIGURE}${START}${END}`,
    openDetails: `${FIGURE}${START}${trace.replace('<details>', '<details open>')}${END}`,
    extraLine: `${FIGURE}${START}${trace.replace('\n</details>', '\n내 글\n\n</details>')}${END}`,
    foreignImage: `${FIGURE}${START}${scene('쓰기', 'https://example.com/x.svg')}${END}`,
    unnamedFence: `${FIGURE.replace(' name=flow', '')}${START}${trace}${END}`,
  };
  for (const [label, body] of Object.entries(cases)) assert.match((await render(body)), /<details|thinkflow scenes/, label);
});

test('project_viewer_keeps_scene_list_examples_in_code', async () => {
  const example = `\`\`\`text\n${FIGURE}${START}${scene('쓰기', 'usage-trace.svg')}${END}\`\`\`\n`;
  assert.match(await render(example), /thinkflow scenes v1 name=flow/);
});
