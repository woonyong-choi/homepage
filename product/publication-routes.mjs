// 이전 정적 주소도 쿼리와 앵커를 보존해 새 정본 주소로 연결한다.
import { escape } from './markdown.mjs';

export function legacyRoutes(documents, fields) {
  return new Map([
    ['/wiki/', '/docs/'],
    ...fields.map(field => [`/wiki/${field}/`, `/docs/topics/${field}/`]),
    ...documents.map(page => [`/articles/${page.slug}/`, page.route]),
  ]);
}

export function redirectPage(target, origin = '') {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>페이지 이동</title><link rel="canonical" href="${escape(origin + target)}"><script src="/redirect.js" data-redirect="${escape(target)}" defer></script><noscript><meta http-equiv="refresh" content="0;url=${escape(target)}"></noscript></head><body><main id="main"><h1>페이지 주소가 바뀌었습니다.</h1><a href="${escape(target)}">새 주소에서 계속 읽기</a></main></body></html>`;
}
