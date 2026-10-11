// 승인 사본과 목록을 같은 갱신으로 처리한다. 복원 실패 시 이전 파일과 잠금을 보존한다.
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function updateContent(siteRoot, prepare, validate) {
  if (!lstatSync(siteRoot).isDirectory() || lstatSync(siteRoot).isSymbolicLink()) throw new Error('invalid content root');
  const root = realpathSync(siteRoot);
  const lock = join(root, '.content-sync.lock');
  try { mkdirSync(lock); } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`content sync is already running or needs recovery: ${lock}`);
    throw error;
  }
  let staging;
  let recoveryRequired = false;
  const changes = [];
  try {
    writeFileSync(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid }));
    const update = prepare(root);
    staging = mkdtempSync(join(root, '.content-sync-'));
    for (const [target, content] of update.files) {
      const index = changes.length;
      const pending = join(staging, `${index}.new`);
      const backup = join(staging, `${index}.previous`);
      const existed = existsSync(target);
      const before = existed ? readFileSync(target) : undefined;
      if (content !== null) writeFileSync(pending, content);
      changes.push({ target, pending, backup, existed, before, remove: content === null, backedUp: false, installed: false });
    }
    writeFileSync(join(staging, 'recovery.json'), JSON.stringify(changes.map(({ target, pending, backup, existed, remove }) => ({ target, pending, backup, existed, remove })), null, 2));
    // 준비 중 관리 파일이 바뀌면 그 편집을 덮어쓰지 않는다.
    for (const change of changes) {
      if (existsSync(change.target) !== change.existed || (change.existed && !readFileSync(change.target).equals(change.before))) throw new Error(`content changed during preparation: ${change.target}`);
      mkdirSync(dirname(change.target), { recursive: true });
    }
    try {
      for (const change of changes) {
        if (change.existed) { renameSync(change.target, change.backup); change.backedUp = true; }
        if (!change.remove) { renameSync(change.pending, change.target); change.installed = true; }
      }
      validate(root);
    } catch (error) {
      const failures = [];
      for (const change of changes.slice().reverse()) {
        try {
          if (change.installed) rmSync(change.target);
          if (change.backedUp) renameSync(change.backup, change.target);
        } catch (failure) { failures.push(failure); }
      }
      if (failures.length) {
        recoveryRequired = true;
        throw new AggregateError([error, ...failures], `content recovery required; preserved files: ${staging}; lock: ${lock}`);
      }
      throw error;
    }
    return update.result;
  } finally {
    if (!recoveryRequired) {
      try { if (staging) rmSync(staging, { recursive: true, force: true }); }
      finally { rmSync(lock, { recursive: true, force: true }); }
    }
  }
}
