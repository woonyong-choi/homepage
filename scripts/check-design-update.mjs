import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readProjectDocuments } from '../src/project-documents.mjs';
import { parseEnginePin } from '../src/document-engine-pin.mjs';
const [base] = process.argv.slice(2);
if (!base || base.startsWith('-')) throw new Error('usage: check-design-update.mjs <base>');
const before = JSON.parse(execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' }));
const after = JSON.parse(readFileSync('package.json', 'utf8'));
assert.match(after.devDependencies.thinkflow, /^github:woonyong-choi\/thinkflow#[a-f0-9]{40}$/);
delete before.devDependencies.thinkflow;
delete after.devDependencies.thinkflow;
assert.deepEqual(after, before, 'Only the ThinkFlow revision may change automatically');
// 엔진 고정값의 sha256과 설치 일치는 선행 검증(validate)이 같은 커밋에서 패키지를 다시 만들어 확인한다. 여기서는 형식만 본다.
parseEnginePin(readFileSync('config/document-engine.json', 'utf8'));
readProjectDocuments();
