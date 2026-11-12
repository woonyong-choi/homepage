import { loadDefaultTheme } from '../theme/default-theme.js';
import { resolveComponents } from '../theme/resolve-theme.js';

import { loadHighlighter, resolveCodeAlias } from './code-highlight.js';
import { usesMath } from './math-assets.js';
import { renderTokens } from './render-state.js';

export async function renderDocument(document, context = {}) {
  if (document?.version !== 1 || !Array.isArray(document.tokens)) {
    throw new TypeError('document must be the result of parseDocument');
  }
  const theme = await loadDefaultTheme();
  const components = resolveComponents(theme.components, context.theme);
  const highlighter = await loadHighlighter();
  await highlighter.prepare(
    [...codeInfos(document.tokens)].map((info) => resolveCodeAlias(info, context.codeAliases).info),
  );
  const usedAssets = new Map();
  const { html, diagnostics } = renderTokens(document, context, {
    theme,
    components,
    highlighter,
    usedAssets,
  });
  return {
    html,
    headings: document.metadata.headings,
    diagnostics: [...document.diagnostics, ...diagnostics],
    assets: [...usedAssets].map(([name, url]) => ({ name, url })),
    runtime: theme.runtimeFor(html),
    math: usesMath(html),
    theme: context.theme === undefined ? theme.name : (context.theme.name ?? 'custom'),
  };
}

function* codeInfos(tokens) {
  for (const token of tokens) {
    if (token.type !== 'fence') continue;
    if (token.meta?.role === 'ui') {
      for (const unit of token.meta.units) yield* codeInfos(unit.tokens);
    } else {
      yield token.info;
    }
  }
}

