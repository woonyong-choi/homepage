import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertInstalledEngine, parseEnginePin } from './document-engine-pin.mjs';

const pin = { sourceCommit: 'a'.repeat(40), designCommit: 'b'.repeat(40), sha256: 'c'.repeat(64) };

test('engine_pin_accepts_only_full_hashes_and_the_three_known_keys', () => {
  assert.deepEqual(parseEnginePin(JSON.stringify(pin)), pin);
  for (const invalid of [{ ...pin, sha256: 'c'.repeat(40) }, { ...pin, sourceCommit: 'main' }, { ...pin, extra: 'x' }, { sourceCommit: pin.sourceCommit, designCommit: pin.designCommit }]) {
    assert.throws(() => parseEnginePin(JSON.stringify(invalid)), /config\/document-engine\.json/);
  }
});

test('installed_engine_uses_the_pinned_design_and_the_homepage_thinkflow_install', () => {
  const current = parseEnginePin(readFileSync(new URL('../config/document-engine.json', import.meta.url), 'utf8'));
  assertInstalledEngine(current);
  assert.throws(() => assertInstalledEngine({ ...current, designCommit: 'f'.repeat(40) }), /디자인 commit/);
});
