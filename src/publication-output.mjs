// 완성한 발행 파일 집합을 검사한 다음 기존 산출물을 교체한다.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function validateOutput(output, files) {
  for (const [route, html] of output) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) throw new Error(`duplicate HTML id: ${route}`);
    for (const [, url] of html.matchAll(/(?:href|src|poster)="([^"]+)"/g)) {
      if (!url.startsWith('/') && !url.startsWith('#')) continue;
      const [path, fragment] = url.split('#');
      const target = path.split('?')[0] || route;
      if (!output.has(target) && !files.has(target)) throw new Error(`broken link: ${route} -> ${url}`);
      if (fragment && output.has(target) && !output.get(target).includes(`id="${decodeURIComponent(fragment)}"`)) throw new Error(`broken anchor: ${route} -> ${url}`);
    }
  }
}

export function replacePublication(outputRoot, pages, files) {
  const output = new Map(files);
  for (const [route, html] of pages) {
    if (!route.endsWith('/')) throw new Error(`invalid publication route: ${route}`);
    const path = `${route}index.html`;
    if (output.has(path)) throw new Error(`duplicate publication file: ${path}`);
    output.set(path, html);
  }
  for (const path of output.keys()) {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.endsWith('/') || /[\u0000\\]/.test(path) || path.slice(1).split('/').some(part => part === '' || part === '.' || part === '..')) throw new Error(`invalid publication file: ${path}`);
  }
  for (const path of output.keys()) {
    for (let parent = dirname(path); parent !== '/'; parent = dirname(parent)) {
      if (output.has(parent)) throw new Error(`publication path conflict: ${parent} -> ${path}`);
    }
  }
  validateOutput(pages, output);
  rmSync(outputRoot, { recursive: true, force: true });
  for (const [path, content] of output) {
    const destination = join(outputRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
}
