// 문서 엔진 고정값(config/document-engine.json)의 형식과 설치된 엔진·ThinkFlow 렌더러와의 일치를 확인한다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const FORMAT = { sourceCommit: /^[a-f0-9]{40}$/, designCommit: /^[a-f0-9]{40}$/, sha256: /^[a-f0-9]{64}$/ };
const PIN_URL = new URL('../config/document-engine.json', import.meta.url);

export function parseEnginePin(text) {
  const pin = JSON.parse(text);
  const keys = Object.keys(pin ?? {}).sort();
  if (keys.join() !== Object.keys(FORMAT).sort().join() || !keys.every(key => typeof pin[key] === 'string' && FORMAT[key].test(pin[key]))) {
    throw new Error('config/document-engine.json은 sourceCommit·designCommit(40자리)과 sha256(64자리)만 가져야 합니다.');
  }
  return pin;
}

// 엔진은 자기 위치에서 찾은 thinkflow로 도표를 만든다. 홈페이지 고정값과 다르면 npm이 엔진 아래에 별도 사본을 두므로 같은 설치인지 확인한다.
export function assertInstalledEngine(pin = parseEnginePin(readFileSync(PIN_URL, 'utf8'))) {
  const require = createRequire(import.meta.url);
  const entry = require.resolve('document-engine');
  const input = JSON.parse(readFileSync(join(dirname(entry), 'design-input.json'), 'utf8'));
  if (input.commit !== pin.designCommit) throw new Error('설치된 문서 엔진의 디자인 commit이 config/document-engine.json과 다릅니다.');
  if (createRequire(entry).resolve('thinkflow/package.json') !== require.resolve('thinkflow/package.json')) {
    throw new Error('문서 엔진과 홈페이지의 ThinkFlow 렌더러 고정값이 다릅니다.');
  }
}
