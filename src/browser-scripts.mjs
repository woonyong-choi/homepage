// 검색의 모듈 의존성을 화면과 Worker 진입점에 각각 묶는다.
import { join } from 'node:path';

import { buildSync } from 'esbuild';
import { RUNTIMES } from '@woonyong-choi/design-tokens/ui/manifest.mjs';
import { THEME_ROOT } from './design-package.mjs';

export function browserScripts(root) {
  const scripts = new Map();
  const entries = new Map(['publication.js', 'search-worker.mjs', 'comments.js', 'footer-year.js', 'blog-list.js', 'admin.js', 'admin-editor.js'].map(file => [file, join(root, file)]));
  for (const file of Object.keys(RUNTIMES)) entries.set(file, join(THEME_ROOT, 'ui/runtime', file));
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
