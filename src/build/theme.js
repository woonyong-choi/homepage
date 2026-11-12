// 홈페이지가 직접 소유하는 디자인 정본(src/design)의 생성 결과 위치와 내용 해시.
// src/design/scripts/build.mjs가 tokens·styles·ui·assets에서 src/design/dist를 만든다(npm run build:design).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** 디자인 생성 결과 폴더. 페이지의 /theme/ 경로가 이 폴더를 가리킨다. */
export const THEME_ROOT = fileURLToPath(new URL('../design/dist/', import.meta.url));
/** 생성 파일 목록과 내용 해시. 캐시 무효화용 버전 값(contentHash)으로만 쓴다. */
export const THEME_MANIFEST = JSON.parse(readFileSync(new URL('manifest.json', `file://${THEME_ROOT}`), 'utf8'));
