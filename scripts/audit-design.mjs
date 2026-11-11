// 화면 코드의 직접 표현 값 정의를 배포 전에 차단한다. 값은 src/design의 토큰 정본에서만 정의하고 이 검사기로 판정한다.
import { readdirSync } from 'node:fs';
import { iterFiles, TOKEN_SOURCES } from '#design/ui/build/lib/walk-files.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { THEME_ROOT as theme } from '../src/design-package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'src');
// 제외는 시험 자료 src/fixtures와 값을 정의하는 디자인 정본 src/design에만 적용한다. 디자인 정본은 src/design/test의 시험이 검사한다.
const targets = readdirSync(source).filter(name => !['fixtures', 'design'].includes(name)).map(name => join(source, name));
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
console.log(`${files.length} application sources verified`);
