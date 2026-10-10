// 선택한 테마를 검증된 완성본으로 가져온다. 정본 위치는 호출자가 지정한다.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const source = process.argv[2];
if (!source) throw new Error('Usage: npm run theme:product -- <design-tokens repository>');
const config = JSON.parse(readFileSync(new URL('./theme.config.json', import.meta.url)));
for (const args of [[resolve(source,'scripts/build.mjs')],[resolve(source,'scripts/export-theme.mjs'),config.theme,fileURLToPath(new URL('./vendor/theme',import.meta.url))]]) {
  const result = spawnSync(process.execPath, args, { stdio:'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
