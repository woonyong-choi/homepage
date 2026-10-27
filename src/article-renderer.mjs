// 소개와 같은 첫 문단만 옮기며 링크·각주·강조를 그대로 보존한다.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEME_FILES, parseDocument, renderDocument } from 'document-engine';
import { escape } from '@woonyong-choi/design-tokens/ui/index.mjs';
import { documentAssets as assets } from './document-assets.mjs';
import { THEME_ROOT } from './design-package.mjs';
import { SITE_FEATURES } from './site-features.mjs';
import { splitLead } from './article-summary.mjs';

// 문서 엔진은 디자인을 peer 의존성으로 받는다. 홈페이지가 설치한 같은 패키지를 읽는지 확인한다.
if (realpathSync(fileURLToPath(DEFAULT_THEME_FILES.root)) !== realpathSync(THEME_ROOT)) throw new Error('문서 엔진과 홈페이지가 서로 다른 공통 디자인 패키지를 읽습니다.');
function rejectErrors(output, page) {
  const errors = output.diagnostics.filter(item => item.severity === 'error');
  if (errors.length) throw new Error(errors.map(item => `${page.id} 본문 ${item.line ?? 1}줄 :${item.directive ?? 'document'} ${item.message}`).join('\n'));
  if (output.diagrams?.some(item => item.status === 'failed')) throw new Error(`${page.id}: DiagramPlay 도표를 만들 수 없습니다.`);
}

export async function parseArticle(page, options = {}) {
  const document = await parseDocument(page.body, { id: page.id, pageId: page.id, assets: options.assets ?? assets, features: options.features ?? SITE_FEATURES });
  rejectErrors(document, page);
  return document;
}

export async function renderArticle(page, options = {}) {
  const document = options.document ?? await parseArticle(page, options);
  for (const diagram of document.metadata.diagrams) options.diagramSources?.set(diagram.source, page.id);
  const context = { assets: options.assets ?? assets, diagrams: options.diagrams };
  // 요약과 같은 첫 문단은 글 머리로 옮기고, 요약이 제목이거나 본문에 이미 있으면 머리를 비운다.
  const split = splitLead([...document.tokens], page.description, page.title);
  const tokens = split.tokens;
  let leadHtml = split.kind === 'summary' ? escape(page.description) : '';
  let lead;
  if (split.kind === 'lead') {
    lead = await renderDocument({ ...document, tokens: split.lead, metadata: { headings: [], diagrams: [] }, diagnostics: [] }, context);
    rejectErrors(lead, page);
    leadHtml = lead.html;
  }
  const output = await renderDocument({ ...document, tokens }, context);
  rejectErrors(output, page);
  return { ...output, leadHtml, assets: [...new Map([...(lead?.assets ?? []), ...output.assets].map(item => [item.name, item])).values()], runtime: [...new Set([...(lead?.runtime ?? []), ...output.runtime])], math: Boolean(lead?.math || output.math) };
}
