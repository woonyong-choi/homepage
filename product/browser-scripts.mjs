// 검색의 모듈 의존성을 화면과 Worker 진입점에 각각 묶는다.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildSync } from 'esbuild';

export function browserScripts(root) {
  const scripts = new Map();
  for (const file of ['publication.js', 'search-worker.mjs']) {
    const result = buildSync({
      entryPoints: [join(root, file)], bundle: true, write: false,
      format: 'esm', platform: 'browser', target: 'es2022', minify: true,
      charset: 'utf8', legalComments: 'inline',
    });
    scripts.set(file, result.outputFiles[0].text);
  }
  for (const file of ['document.js', 'document-navigation.js', 'redirect.js', 'comments.js', 'flows.js', 'video.js', 'footer-year.js', 'blog-list.js']) {
    scripts.set(file, readFileSync(join(root, file), 'utf8'));
  }
  return scripts;
}
