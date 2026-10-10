// 도표 렌더러를 로더와 분리해 묶는다. 렌더러와 도표 종류별 조각은 mermaid/ 아래에 두고 로더만 글에 연결한다.
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

import { buildSync } from 'esbuild';

const digest = value => createHash('sha256').update(value).digest('hex');
const COMMON = { bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', minify: true, charset: 'utf8', logLevel: 'warning' };

export function mermaidScripts(root) {
  const outdir = join(root, '.mermaid-out');
  const renderer = buildSync({ ...COMMON, entryPoints: { 'mermaid/render': join(root, 'mermaid-render.js') }, splitting: true, outdir, chunkNames: 'mermaid/chunk-[hash]', legalComments: 'external' });
  const files = new Map(renderer.outputFiles.map(file => [relative(outdir, file.path), file.text]));
  const entry = files.get('mermaid/render.js');
  if (!entry) throw new Error('mermaid renderer entry missing');
  const render = `/mermaid/render.js?v=${digest(entry)}`;
  const loader = buildSync({ ...COMMON, entryPoints: { 'mermaid-loader': join(root, 'mermaid-loader.js') }, outdir, define: { __MERMAID_RENDER__: JSON.stringify(render) }, legalComments: 'none' }).outputFiles[0].text;
  files.set('mermaid-loader.js', loader);
  return { files, hashes: { 'mermaid-loader.js': digest(loader) } };
}
