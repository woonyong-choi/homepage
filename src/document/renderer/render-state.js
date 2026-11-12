import { createKit } from './kit.js';
import { createRenderer } from './markdown-rules.js';

let renderer;

export function renderTokens(document, context, { theme, components, highlighter, usedAssets }) {
  renderer ??= createRenderer();
  const render = {
    documentId: context.id ?? document.id,
    context,
    kit: createKit(theme, context, usedAssets),
    components,
    highlighter,
    diagnostics: [],
    failedOpens: new WeakSet(),
    pairs: [],
    renderUnit: (unit) => renderUnit(unit, render),
  };
  const html = renderUnit({ tokens: document.tokens, env: document.env }, render);
  return { html, diagnostics: render.diagnostics };
}

function renderUnit(unit, render) {
  const env = {
    footnotes: unit.env.footnotes,
    docId: unit.env.docId,
    fenceLine: unit.env.fenceLine,
    render,
  };
  return renderer.renderer.render(unit.tokens, renderer.options, env);
}
