import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// #215: 정상 소스만으로는 중첩 생산 파일이 감사 대상에서 빠지는 회귀를 발견할 수 없다.
test('audit_design_rejects_nested_hardcoding_and_excludes_owned_inputs', () => {
  const loader = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { resolve } from 'node:path';
    const read = fs.readdirSync, stat = fs.statSync, contents = fs.readFileSync;
    const tree = new Map([
      [resolve('src/audit-probe'), ['view.js', 'view.test.mjs', 'build', 'vendor']],
      [resolve('src/audit-probe/build'), ['nested.css']],
      [resolve('src/audit-probe/vendor'), ['owned.js']],
      [resolve('scripts/audit-probe'), ['render.mjs', 'render.test.js']],
    ]);
    fs.readdirSync = (path, options) => {
      const absolute = resolve(path), names = tree.get(absolute);
      if (names) return options?.withFileTypes ? names.map(name => ({ name, isDirectory: () => tree.has(resolve(absolute, name)) })) : names;
      const entries = read(path, options);
      if (![resolve('src'), resolve('scripts')].includes(absolute)) return entries;
      return [...entries, options?.withFileTypes ? { name: 'audit-probe', isDirectory: () => true } : 'audit-probe'];
    };
    fs.statSync = (path, options) => resolve(path).includes('/audit-probe')
      ? { isFile: () => !tree.has(resolve(path)), isDirectory: () => tree.has(resolve(path)) }
      : stat(path, options);
    fs.readFileSync = (path, options) => {
      const name = String(path);
      if (!name.includes('/audit-probe/')) return contents(path, options);
      const bad = process.env.AUDIT_PROBE === 'production' || name.includes('.test.');
      return bad ? (name.endsWith('.css') ? '.probe { color: #123456; }' : 'const color = "#123456";') : '';
    };
    syncBuiltinESMExports();
  `;
  for (const [probe, status] of [['production', 1], ['excluded', 0]]) {
    const result = spawnSync(process.execPath, ['scripts/audit-design.mjs'], {
      cwd: new URL('..', import.meta.url), encoding: 'utf8',
      env: { ...process.env, AUDIT_PROBE: probe, NODE_OPTIONS: `--import=data:text/javascript;base64,${Buffer.from(loader).toString('base64')}` },
    });
    assert.equal(result.status, status, result.stderr || result.stdout);
    if (probe === 'production') {
      for (const file of ['view.js', 'nested.css', 'owned.js', 'render.mjs']) assert.ok(result.stdout.includes(file), result.stdout);
    } else assert.match(result.stdout, /total 0/);
    assert.doesNotMatch(result.stdout, /(?:view|render)\.test\./);
  }
});
