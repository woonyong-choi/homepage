// 글이 쓰는 사이트 그림 이름. 사이트 빌드처럼 해석한 문서의 그림·링크 주소 중 assets 폴더를 가리키는 것만 센다.
// 코드 블록·외부 주소·글자 속 경로는 세지 않는다. 브라우저 관리 화면과 Node 시험이 함께 쓴다.
import { parseDocumentSync } from './document/parser/index.js';
import { readPost } from './admin-model.mjs';

// Vault 원본의 상대 주소(../assets/, assets/)와 사이트 주소(/assets/)를 같은 이름으로 본다(build-publication의 assetLinks와 같은 규칙).
const ASSET = /^(?:\.\.\/|\/)?assets\/([^?#]+)/;

function assetName(value) {
  const match = typeof value === 'string' ? value.match(ASSET) : null;
  if (!match) return null;
  let name;
  try { name = decodeURIComponent(match[1]); } catch { return null; }
  return name.split('/').some(part => !part || part === '.' || part === '..') ? null : name;
}

function collect(tokens, names) {
  for (const token of tokens ?? []) {
    const value = token.type === 'image' ? token.attrGet?.('src') : token.type === 'link_open' ? token.attrGet?.('href') : null;
    const name = assetName(value);
    if (name) names.add(name);
    collect(token.children, names);
    for (const unit of token.meta?.units ?? []) collect(unit.tokens, names);
  }
}

/** 글 원문(글 머리 포함)이 쓰는 그림 이름 목록. 본문의 그림·링크와 글 머리 썸네일을 센다. */
export function postAssets(text) {
  const post = readPost(String(text));
  const names = new Set();
  collect(parseDocumentSync(post.body, { id: 'post-assets', features: { diagrams: true } }).tokens, names);
  const thumbnail = assetName(post.thumbnail?.src);
  if (thumbnail) names.add(thumbnail);
  return [...names];
}
