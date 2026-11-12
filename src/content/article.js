import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEME_FILES, parseDocument, renderDocument } from '../document/index.js';
import { escape } from '#design/ui/index.js';
import { documentAssets as assets } from './images.js';
import { THEME_ROOT } from '../build/theme.js';
import { splitLead } from './summary.js';

if (realpathSync(fileURLToPath(DEFAULT_THEME_FILES.root)) !== realpathSync(THEME_ROOT)) throw new Error('문서 렌더러와 홈페이지가 서로 다른 디자인 생성 결과를 읽습니다.');
function rejectErrors(output, page) {
  const errors = output.diagnostics.filter(item => item.severity === 'error');
  if (errors.length) throw new Error(errors.map(item => `${page.id} 본문 ${item.line ?? 1}줄 :${item.directive ?? 'document'} ${item.message}`).join('\n'));
}

export async function parseArticle(page, options = {}) {
  const document = await parseDocument(page.body, { id: page.id, pageId: page.id, assets: options.assets ?? assets });
  rejectErrors(document, page);
  return document;
}

export async function renderArticle(page, options = {}) {
  const document = options.document ?? await parseArticle(page, options);
  const context = { assets: options.assets ?? assets };
  const split = splitLead([...document.tokens], page.description, page.title);
  const tokens = split.tokens;
  let leadHtml = split.kind === 'summary' ? escape(page.description) : '';
  let lead;
  if (split.kind === 'lead') {
    lead = await renderDocument({ ...document, tokens: split.lead, metadata: { headings: [] }, diagnostics: [] }, context);
    rejectErrors(lead, page);
    leadHtml = lead.html;
  }
  const output = await renderDocument({ ...document, tokens }, context);
  rejectErrors(output, page);
  return { ...output, leadHtml, assets: [...new Map([...(lead?.assets ?? []), ...output.assets].map(item => [item.name, item])).values()], runtime: [...new Set([...(lead?.runtime ?? []), ...output.runtime])], math: Boolean(lead?.math || output.math) };
}
