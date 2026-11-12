import { parseDocumentSync } from './parser/parse-document.js';
import { renderDocument as render } from './renderer/render-document.js';
import { loadDefaultTheme } from './theme/default-theme.js';

export { MATH_STYLESHEET, mathAssets, usesMath } from './renderer/math-assets.js';
export { ThemeError } from './theme/resolve-theme.js';
export { DEFAULT_THEME_FILES } from './theme/default-theme.js';

export async function parseDocument(source, context = {}) {
  const theme = await loadDefaultTheme();
  const catalog = theme.icons.getIconCatalog();
  return parseDocumentSync(source, {
    icons: { has: (name) => hasIcon(catalog, name) },
    urls: { isSafe: (url) => isSafeUrl(theme.ui, url) },
    vocabulary: { widths: [...theme.ui.WIDTHS], cardVariants: [...theme.ui.CARD_VARIANTS] },
    ...context,
  });
}

export const renderDocument = render;


function hasIcon(catalog, name) {
  const target = Object.hasOwn(catalog.icons, name) ? name : catalog.aliases[name];
  return typeof target === 'string' && Object.hasOwn(catalog.icons, target);
}

function isSafeUrl(ui, url) {
  try {
    ui.safeUrl(url);
    return true;
  } catch {
    return false;
  }
}
