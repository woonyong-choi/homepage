// /admin 글 작성 화면 설정. 파일이 없으면 작성 화면을 만들지 않는다(템플릿 기본값).
import { existsSync, readFileSync } from 'node:fs';

const CONFIG = new URL('../config/admin.json', import.meta.url);
const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;
const FOLDER = /^[\w.-]+(?:\/[\w.-]+)*$/;
const KEYS = ['repository', 'branch', 'posts', 'assets', 'authUrl'];

export function parseAdminConfig(value, path = 'config/admin.json') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: 객체가 필요합니다.`);
  for (const key of Object.keys(value)) if (!KEYS.includes(key)) throw new Error(`${path}.${key}: 알 수 없는 설정입니다. 사용할 수 있는 설정: ${KEYS.join(', ')}`);
  const { repository, branch, posts, assets, authUrl = '' } = value;
  if (typeof repository !== 'string' || !REPOSITORY.test(repository)) throw new Error(`${path}.repository: 소유자/저장소 형식이 필요합니다.`);
  if (typeof branch !== 'string' || !/^[\w./-]+$/.test(branch) || branch.includes('..')) throw new Error(`${path}.branch: 브랜치 이름이 올바르지 않습니다.`);
  for (const [key, folder] of [['posts', posts], ['assets', assets]]) {
    if (typeof folder !== 'string' || !FOLDER.test(folder) || folder.split('/').includes('..')) throw new Error(`${path}.${key}: 저장소 안의 폴더 경로가 필요합니다.`);
  }
  if (typeof authUrl !== 'string') throw new Error(`${path}.authUrl: 주소 문자열이 필요합니다.`);
  if (authUrl) {
    let url;
    try { url = new URL(authUrl); } catch { throw new Error(`${path}.authUrl: 주소 형식이 올바르지 않습니다.`); }
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !local) || url.pathname !== '/' || url.search || url.hash) throw new Error(`${path}.authUrl: 경로 없는 https 주소가 필요합니다.`);
  }
  return { repository, branch, posts, assets, authUrl: authUrl.replace(/\/$/, '') };
}

export function loadAdminConfig(file = CONFIG) {
  if (!existsSync(file)) return null;
  return parseAdminConfig(JSON.parse(readFileSync(file, 'utf8')));
}
