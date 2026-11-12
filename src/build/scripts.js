// 브라우저에서 실행하는 진입점을 각각 하나의 파일로 묶는다. 키는 사이트 루트의 출력 파일 이름이다.
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { buildSync } from 'esbuild';
import { RUNTIMES } from '#design/ui/manifest.js';
import { THEME_ROOT } from './theme.js';

const SOURCE = fileURLToPath(new URL('../', import.meta.url));
const ENTRIES = {
  'site.js': 'client/site.js',
  'search-worker.js': 'client/search/worker.js',
  'comments.js': 'client/comments.js',
  'blog-list.js': 'client/blog-list.js',
  'admin.js': 'admin/loader.js',
  'admin-editor.js': 'admin/editor.js',
};

export function bundleScripts() {
  const scripts = new Map();
  const entries = new Map(Object.entries(ENTRIES).map(([file, source]) => [file, join(SOURCE, source)]));
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
