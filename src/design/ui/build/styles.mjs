// 정적 마크업과 런타임에서 쓰는 선택자·변수만 내보낸다. 원본 테마는 바꾸지 않는다.
import { pruneTokens, fixThemeScheme } from './prune-tokens.mjs';
export { pruneTokens, fixThemeScheme } from './prune-tokens.mjs';
import { PurgeCSS } from 'purgecss';
import { transform } from 'esbuild';

/** `scheme`을 주면 그 테마로 고정한 사이트로 보고 다른 테마의 토큰 블록을 뺀다(fixThemeScheme). */
export async function compileStyles(css, pages, scripts, theme = '', { scheme } = {}) {
  const html = [...pages.values()];
  const javascript = [...scripts.values()];
  const content = [...html.map(raw => ({ raw, extension: 'html' })), ...javascript.map(raw => ({ raw, extension: 'js' }))];
  const [result] = await new PurgeCSS().purge({
    content, css: [{ raw: css }], rejected: true,
    fontFace: false, keyframes: false, variables: false,
    safelist: [/^is-/, /^has-/, ':focus-visible'],
    dynamicAttributes: [...new Set([...css.matchAll(/\[([\w-]+)/g)].map(match => match[1]))],
  });
  const usedTheme = pruneTokens(fixThemeScheme(theme, scheme), [result.css, ...html, ...javascript].join('\n'));
  const compact = async source => (await transform(source, { loader: 'css', minify: true, target: 'es2022', legalComments: 'inline' })).code;
  return { css: await compact(result.css), theme: await compact(usedTheme), removed: result.rejected.length };
}
