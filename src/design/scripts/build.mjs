// 공통 정본을 검증한 다음 하나의 배포 세트를 생성한다.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDesign } from './lib/design-build.mjs';

function removeEmptyDirectories(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(folder, entry.name);
    removeEmptyDirectories(path);
    if (!readdirSync(path).length) rmdirSync(path);
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputs = new Map();
try {
  for (const [name, content] of Object.entries(buildDesign(root))) outputs.set(`dist/${name}`, content);
  // dist는 이 생성기의 전용 출력이다. 이름이 바뀐 모듈이 다음 배포에 남지 않게 한다.
  const outputRoot = join(root, 'dist');
  if (existsSync(outputRoot)) for (const entry of readdirSync(outputRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    const name = path.slice(root.length + 1);
    if (outputs.has(name)) continue;
    if (process.argv.includes('--check')) throw new Error(`obsolete generated file: ${name}`);
    unlinkSync(path);
  }
  for (const [name, content] of outputs) {
    const path = join(root, name);
    if (process.argv.includes('--check')) {
      const expected = Buffer.from(content);
      if (!readFileSync(path).equals(expected)) throw new Error(`stale generated file: ${name}`);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
  }
  if (!process.argv.includes('--check')) removeEmptyDirectories(outputRoot);
  console.log(`${outputs.size} design files ${process.argv.includes('--check') ? 'checked' : 'built'}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
