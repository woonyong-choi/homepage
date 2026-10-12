// 고정된 ThinkFlow Git 커밋의 공개 문서만 발행 입력으로 가져온다.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const source = process.argv[2];
if (!source || process.argv.length !== 3) throw new Error('usage: sync-project-documents.mjs <thinkflow-repository>');
const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json')));
const revision = lock.packages['node_modules/thinkflow'].resolved.split('#').at(-1);
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('ThinkFlow dependency must use a Git commit');
const git = args => execFileSync('git', ['-C', source, ...args], { maxBuffer: 32 * 1024 * 1024 });
const pkg = JSON.parse(git(['show', `${revision}:package.json`]));
if (pkg.name !== 'thinkflow' || pkg.repository.url !== 'git+https://github.com/woonyong-choi/thinkflow.git') throw new Error('unexpected project source');
const entries = git(['ls-tree', '-rz', revision, '--', 'docs', 'LICENSE', 'NOTICE']).toString().split('\0').filter(Boolean);
const files = {};
const inputs = [];
const destination = resolve(root, 'content/projects/thinkflow');
const manifestPath = resolve(root, 'config/project-documents.json');
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath)).files : {};
const safePath = path => {
  if (!/^(?:docs\/[a-zA-Z0-9./-]+\.(?:md|svg|png|jpg|webp)|LICENSE|NOTICE)$/.test(path) || path.split('/').some(part => part === '.' || part === '..')) throw new Error(`invalid project file: ${path}`);
  const target = resolve(destination, path);
  for (let parent = target; parent !== root; parent = dirname(parent)) {
    if (lstatSync(parent, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`project path must not be a symlink: ${parent}`);
  }
  return target;
};
for (const [path, hash] of Object.entries(previous)) {
  const target = safePath(path);
  if (!existsSync(target) || createHash('sha256').update(readFileSync(target)).digest('hex') !== hash) throw new Error(`project snapshot changed locally: ${path}`);
}
for (const entry of entries) {
  const [info, path] = entry.split('\t');
  if (!/\.(md|svg|png|jpg|webp)$/.test(path) && !['LICENSE', 'NOTICE'].includes(path)) continue;
  if (!info.startsWith('100644 blob ') || path.split('/').some(part => part === '..' || part === '.')) throw new Error(`invalid project file: ${path}`);
  const bytes = git(['show', `${revision}:${path}`]);
  files[path] = createHash('sha256').update(bytes).digest('hex');
  const target = safePath(path);
  if (existsSync(target) && !Object.hasOwn(previous, path)) throw new Error(`untracked project file: ${path}`);
  inputs.push([target, bytes]);
}
for (const [path, bytes] of inputs) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}
for (const path of Object.keys(previous)) if (!Object.hasOwn(files, path)) unlinkSync(safePath(path));
writeFileSync(manifestPath, JSON.stringify({ repository: 'woonyong-choi/thinkflow', revision, files }, null, 2) + '\n');
console.log(`imported ${inputs.length} project documents and assets at ${revision}`);
