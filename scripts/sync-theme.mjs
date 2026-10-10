// 기본 테마 완성본을 가져와 사이트의 기존 파일 경로에 연결한다.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyTheme } from './theme-snapshot.mjs';

const ROOT = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('theme.config.json', ROOT), 'utf8'));
const args = process.argv.slice(2);
const previous = verifyTheme();
for (const name of ['styles.source.css', ...Object.keys(previous.files).filter((name) => name.startsWith('assets/'))]) {
  if (!readFileSync(new URL(name, ROOT)).equals(readFileSync(new URL(`vendor/design-theme/${name}`, ROOT)))) throw new Error(`modified imported theme file: ${name}`);
}
const current = readFileSync(new URL('vendor/design-theme/tokens.json', ROOT));
if (!readFileSync(new URL('tokens.json', ROOT)).equals(current)) throw new Error('modified imported token source: tokens.json');
const from = args.indexOf('--from');
if (from < 0 || !args[from + 1]) throw new Error('usage: sync-theme.mjs --from <design-tokens-root>');
const source = resolve(args[from + 1]);
const result = spawnSync(process.execPath, [resolve(source, 'scripts/export-theme.mjs'), config.theme, new URL('vendor/design-theme/', ROOT).pathname], { stdio: 'inherit' });
if (result.status !== 0) throw new Error('theme import failed');
const next = verifyTheme();
for (const name of Object.keys(previous.files).filter((name) => name.startsWith('assets/'))) {
  if (!(name in next.files)) unlinkSync(new URL(name, ROOT));
}
for (const name of Object.keys(next.files).filter((name) => name.startsWith('assets/'))) {
  const target = new URL(name, ROOT);
  mkdirSync(new URL('.', target), { recursive: true });
  writeFileSync(target, readFileSync(new URL(`vendor/design-theme/${name}`, ROOT)));
}
writeFileSync(new URL('tokens.json', ROOT), readFileSync(new URL('vendor/design-theme/tokens.json', ROOT)));
// 스타일 정본은 base에서 가져온다. 후속 빌드가 theme.css와 styles.css를 재생성한다.
writeFileSync(new URL('styles.source.css', ROOT), readFileSync(new URL('vendor/design-theme/styles.source.css', ROOT)));
const build = spawnSync(process.execPath, [new URL('scripts/build-tokens.mjs', ROOT).pathname], { stdio: 'inherit' });
if (build.status !== 0) throw new Error('theme build failed');
