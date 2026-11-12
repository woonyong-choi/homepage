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
  const local = typeof src === 'string' && /^\/(?:media|assets)\/[a-z0-9][a-z0-9./-]*\.(?:png|jpg|jpeg|gif|webp|svg)$/.test(src) && !src.includes('..');
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

// 글의 발행일은 한국 날짜로 쓴다. 오늘 이후 글인지도 한국 날짜로 비교한다.
// UTC로 비교하면 한국 0시~9시에는 오늘 날짜 글이 미래 글로 빠진다.
export const PUBLISH_TIME_ZONE = 'Asia/Seoul';
export const publishDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: PUBLISH_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
