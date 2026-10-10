// 검색의 모듈 의존성을 화면과 Worker 진입점에 각각 묶는다.
import { join } from 'node:path';

import { buildSync } from 'esbuild';
import { RUNTIMES } from './vendor/theme/ui/manifest.mjs';

export function browserScripts(root) {
  const scripts = new Map();
  const entries = new Map(['publication.js', 'search-worker.mjs', 'redirect.js', 'comments.js', 'footer-year.js', 'blog-list.js'].map(file => [file, join(root, file)]));
  for (const file of Object.keys(RUNTIMES)) entries.set(file, join(root, 'vendor/theme/ui/runtime', file));
  for (const [file, entry] of entries) {
    const result = buildSync({
      entryPoints: [entry], bundle: true, write: false,
      format: 'esm', platform: 'browser', target: 'es2022', minify: true,
      charset: 'utf8', legalComments: 'inline',
    });
    scripts.set(file, result.outputFiles[0].text);
  }
  return scripts;
}
