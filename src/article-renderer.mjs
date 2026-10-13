// 소개와 같은 첫 문단만 옮기며 링크·각주·강조를 그대로 보존한다.
import { readFileSync } from 'node:fs';
import { DEFAULT_THEME_FILES, parseDocument, renderDocument } from 'document-engine';
import { escape } from './vendor/theme/ui/index.mjs';
import { prepareProjectTokens } from './project-documents.mjs';
import { documentAssets as assets } from './document-assets.mjs';

const engineTheme = JSON.parse(readFileSync(new URL('receipt.json', DEFAULT_THEME_FILES.root)));
const siteTheme = JSON.parse(readFileSync(new URL('./vendor/theme/manifest.json', import.meta.url)));
if (engineTheme.contentHash !== siteTheme.contentHash) throw new Error('문서 엔진과 홈페이지의 공통 디자인 버전이 다릅니다.');
const normalize = text => text.normalize('NFC').replace(/\s+/gu, ' ').trim();
const formatting = new Set(['em_open', 'em_close', 'strong_open', 'strong_close', 's_open', 's_close', 'link_open', 'link_close', 'mark_open', 'mark_close', 'footnote_ref']);

function visibleText(tokens) {
  let value = '';
  for (const token of tokens) {
    if (token.type === 'text' || token.type === 'code_inline') value += token.content;
    else if (token.type === 'softbreak' || token.type === 'hardbreak') value += ' ';
    else if (!formatting.has(token.type)) return null;
  }
  return value;
}

function rejectErrors(output, page) {
  const errors = output.diagnostics.filter(item => item.severity === 'error');
  if (errors.length) throw new Error(errors.map(item => `${page.id} 본문 ${item.line ?? 1}줄 :${item.directive ?? 'document'} ${item.message}`).join('\n'));
  if (output.diagrams?.some(item => item.status === 'failed')) throw new Error(`${page.id}: ThinkFlow 도표를 만들 수 없습니다.`);
}

export async function parseArticle(page, options = {}) {
  const document = await parseDocument(page.body, { id: page.id, pageId: page.id, assets: options.assets ?? assets });
  rejectErrors(document, page);
  const env = { ...document.env, headings: document.metadata.headings };
  prepareProjectTokens(document.tokens, page, env);
  document.metadata.headings = env.headings;
  return document;
}

export async function renderArticle(page, options = {}) {
  const document = options.document ?? await parseArticle(page, options);
  for (const diagram of document.metadata.diagrams) options.diagramSources?.set(diagram.source, page.id);
  const tokens = [...document.tokens];
  const context = { assets: options.assets ?? assets, diagrams: options.diagrams };
  let leadHtml = escape(page.description);
  let lead;
  if (tokens[0]?.type === 'paragraph_open' && tokens[1]?.type === 'inline' && tokens[2]?.type === 'paragraph_close') {
    const first = tokens[1];
    const plain = visibleText(first.children);
    if (normalize(first.content) === normalize(page.description) || (plain !== null && normalize(plain) === normalize(page.description))) {
      lead = await renderDocument({ ...document, tokens: [first], metadata: { headings: [], diagrams: [] }, diagnostics: [] }, context);
      rejectErrors(lead, page);
      leadHtml = lead.html;
      tokens.splice(0, 3);
    }
  }
  const output = await renderDocument({ ...document, tokens }, context);
  rejectErrors(output, page);
  return { ...output, leadHtml, assets: [...new Map([...(lead?.assets ?? []), ...output.assets].map(item => [item.name, item])).values()], runtime: [...new Set([...(lead?.runtime ?? []), ...output.runtime])], math: Boolean(lead?.math || output.math) };
}
