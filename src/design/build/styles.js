import { pruneTokens } from './prune-tokens.js';
import { PurgeCSS } from 'purgecss';
import { transform } from 'esbuild';

export async function compileStyles(css, pages, scripts, theme = '') {
  const html = [...pages.values()];
  const javascript = [...scripts.values()];
  const content = [...html.map(raw => ({ raw, extension: 'html' })), ...javascript.map(raw => ({ raw, extension: 'js' }))];
  const [result] = await new PurgeCSS().purge({
    content, css: [{ raw: css }], rejected: true,
    fontFace: false, keyframes: false, variables: false,
    safelist: [/^is-/, /^has-/, ':focus-visible'],
    dynamicAttributes: [...new Set([...css.matchAll(/\[([\w-]+)/g)].map(match => match[1]))],
  });
  const usedTheme = pruneTokens(theme, [result.css, ...html, ...javascript].join('\n'));
  const compact = async source => (await transform(source, { loader: 'css', minify: true, target: 'es2022', legalComments: 'inline' })).code;
  return { css: await compact(result.css), theme: await compact(usedTheme), removed: result.rejected.length };
}
