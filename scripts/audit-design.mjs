// 공통 디자인의 변조와 소비자 소스의 직접 표현 값 정의를 배포 전에 차단한다.
import { readFileSync, readdirSync } from 'node:fs';
import { verifyDesign } from '../src/vendor/theme/ui/build/verify.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'src');
const theme = join(source, 'vendor/theme');
const manifest = verifyDesign(theme);
const files = readdirSync(source).filter(name => /\.(?:mjs|js)$/.test(name) && !name.endsWith('.test.mjs')).map(name => join(source, name));
if (!files.length) throw new Error('no application sources to audit');
const result = spawnSync(process.execPath, [join(theme, 'ui/build/check-tokens.mjs'), ...files, '--tokens', join(theme, 'tokens.json')], { encoding: 'utf8' });
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`${files.length} application sources and ${Object.keys(manifest.files).length} design artifacts verified`);
