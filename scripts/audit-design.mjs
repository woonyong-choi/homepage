// 공통 디자인의 변조와 소비자 소스의 직접 표현 값 정의를 배포 전에 차단한다.
import { readdirSync } from 'node:fs';
import { verifyDesign } from '../src/vendor/theme/ui/build/verify.mjs';
import { iterFiles, TOKEN_SOURCES } from '../src/vendor/theme/ui/build/lib/walk-files.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'src');
const theme = join(source, 'vendor/theme');
const manifest = verifyDesign(theme);
// 제외는 실제 소유 경계인 src/vendor와 시험 자료 src/fixtures에만 적용한다.
const targets = readdirSync(source).filter(name => !['vendor', 'fixtures'].includes(name)).map(name => join(source, name));
const files = [...iterFiles([...targets, join(root, 'scripts')], {
  ...TOKEN_SOURCES,
  wants: name => TOKEN_SOURCES.wants(name) && !/\.test\.[^.]+$/.test(name),
  skipDirs: new Set(),
  filterTargets: true,
})];
if (!files.length) throw new Error('no application sources to audit');
const result = spawnSync(process.execPath, [join(theme, 'ui/build/check-tokens.mjs'), ...files, '--tokens', join(theme, 'tokens.json')], { encoding: 'utf8' });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`${files.length} application sources and ${Object.keys(manifest.files).length} design artifacts verified`);
