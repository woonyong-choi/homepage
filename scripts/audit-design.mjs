// 소비자 소스의 직접 표현 값 정의를 배포 전에 차단한다. 디자인은 설치한 패키지의 검사기와 토큰 정본으로 판정한다.
import { readdirSync } from 'node:fs';
import { iterFiles, TOKEN_SOURCES } from '@woonyong-choi/design-tokens/ui/build/lib/walk-files.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { THEME_ROOT as theme } from '../src/design-package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'src');
// 제외는 시험 자료 src/fixtures에만 적용한다.
const targets = readdirSync(source).filter(name => name !== 'fixtures').map(name => join(source, name));
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
