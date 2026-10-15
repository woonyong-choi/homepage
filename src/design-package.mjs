// 홈페이지가 의존성으로 설치한 공통 디자인 패키지의 위치와 버전. 사본을 두지 않고 고정 commit의 설치본을 읽는다.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const DESIGN_PACKAGE = '@woonyong-choi/design-tokens';
const packageFile = createRequire(import.meta.url).resolve(`${DESIGN_PACKAGE}/package.json`);
/** 설치된 디자인 패키지의 dist 폴더. 페이지의 /theme/ 경로가 이 폴더를 가리킨다. */
export const THEME_ROOT = join(dirname(packageFile), 'dist');
/** 생성 파일 목록과 내용 해시. 캐시 무효화용 버전 값(contentHash)으로만 쓴다. */
export const THEME_MANIFEST = JSON.parse(readFileSync(join(THEME_ROOT, 'manifest.json'), 'utf8'));
