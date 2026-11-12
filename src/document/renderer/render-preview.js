import { createDefaultComponents } from '../theme/components.js';
import { resolveComponents } from '../theme/resolve-theme.js';

import { renderTokens } from './render-state.js';

const LANGUAGE_NAME = /^[\w+#.-]+$/;
const PLAIN = Object.freeze({ id: 'plaintext', label: 'Plain text' });

const plainHighlighter = Object.freeze({
  codeLanguage(info = '') {
    const word = info.trim().split(/\s+/)[0].toLowerCase();
    return word && LANGUAGE_NAME.test(word) ? { id: word, label: word } : PLAIN;
  },
  async prepare() {},
  highlightCode: (source, language, ui) => ui.escape(source),
});

export function renderPreview(document, context) {
  if (document?.version !== 1 || !Array.isArray(document.tokens)) {
    throw new TypeError('document must be the result of parseDocument');
  }
  if (!context?.ui) throw new TypeError('renderPreview needs the design ui module');
  const { html, diagnostics } = renderTokens(
    document,
    context,
    {
      theme: { ui: context.ui, icons: context.icons, svg: context.svg },
      components: resolveComponents(createDefaultComponents(), undefined),
      highlighter: plainHighlighter,
      usedAssets: new Map(),
    },
  );
  return { html, diagnostics: [...document.diagnostics, ...diagnostics] };
}
