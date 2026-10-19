import { parse } from 'yaml';

const DOCUMENT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isDocumentId(value) { return typeof value === 'string' && DOCUMENT_ID.test(value); }

export function parseContent(source, missingMessage = 'missing document metadata') {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(missingMessage);
  return { metadata: parse(match[1], { maxAliasCount: 0 }), body: match[2] };
}

export function validateThumbnail(thumbnail) {
  if (thumbnail === undefined) return;
  const src = thumbnail?.src;
  const local = typeof src === 'string' && /^\/media\/[a-z0-9][a-z0-9./-]*\.(?:png|jpg|webp|svg)$/.test(src) && !src.includes('..');
  let external = false;
  if (typeof src === 'string' && src.startsWith('https://')) {
    try {
      const url = new URL(src);
      external = Boolean(url.hostname) && !url.username && !url.password;
    } catch { /* 경로 오류는 아래의 공통 검증 결과로 보고한다. */ }
  }
  if (!local && !external) throw new Error('invalid thumbnail path');
  if (typeof thumbnail.alt !== 'string') throw new Error('missing thumbnail alternative');
  if (thumbnail.position !== undefined) {
    for (const axis of ['x', 'y']) {
      const value = thumbnail.position?.[axis];
      if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('invalid thumbnail position');
    }
  }
}
