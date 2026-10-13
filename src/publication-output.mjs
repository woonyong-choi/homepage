// 완성한 발행 파일 집합을 검사한 다음 기존 산출물을 교체한다.
import { existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { publicationLinks } from './publication-routes.mjs';
import { basename, dirname, join, resolve } from 'node:path';

function validateOutput(output, files) {
  for (const [route, html] of output) {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) throw new Error(`duplicate HTML id: ${route}`);
    for (const url of new Set([...publicationLinks(html, route), ...[...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(match => match[1])])) {
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
  const requested = resolve(outputRoot);
  mkdirSync(dirname(requested), { recursive: true });
  const root = join(realpathSync(dirname(requested)), basename(requested));
  const lock = `${root}.lock`;
  try { mkdirSync(lock); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`publication is already locked: ${lock}`);
    throw error;
  }
  let staged;
  try {
    if (existsSync(root) && (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink())) throw new Error(`invalid publication directory: ${root}`);
    staged = mkdtempSync(`${root}.build-`);
    for (const [path, content] of output) {
      const destination = join(staged, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, content);
    }
    installPublication(root, staged);
  } finally {
    try { if (staged) rmSync(staged, { recursive: true, force: true }); }
    finally { rmSync(lock, { recursive: true }); }
  }
}

function installPublication(root, staged) {
  const backup = `${staged}.previous`;
  const previous = existsSync(root);
  if (previous) renameSync(root, backup);
  try { renameSync(staged, root); }
  catch (error) {
    if (previous) {
      try { renameSync(backup, root); }
      catch (rollbackError) { throw new AggregateError([error, rollbackError], `publication restore failed; previous output remains at ${backup}`); }
    }
    throw error;
  }
  if (previous) rmSync(backup, { recursive: true });
}
