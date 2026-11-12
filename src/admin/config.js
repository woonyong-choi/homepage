import { loadSiteConfig } from '../content/settings.js';

const REPOSITORY = /^[\w.-]+\/[\w.-]+$/;
const FOLDER = /^[\w.-]+(?:\/[\w.-]+)*$/;
const KEYS = ['repository', 'branch', 'posts', 'assets', 'deploy', 'authUrl'];
const DEPLOY = /^[\w.-]+\/[\w.-]+\/[\w.-]+\.ya?ml$/;

export function parseAdminConfig(value, path = 'config/site.json.admin') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: 객체가 필요합니다.`);
  for (const key of Object.keys(value)) if (!KEYS.includes(key)) throw new Error(`${path}.${key}: 알 수 없는 설정입니다. 사용할 수 있는 설정: ${KEYS.join(', ')}`);
  const { repository, branch, posts, assets, deploy = '', authUrl = '' } = value;
  if (typeof repository !== 'string' || !REPOSITORY.test(repository)) throw new Error(`${path}.repository: 소유자/저장소 형식이 필요합니다.`);
  if (typeof branch !== 'string' || !/^[\w./-]+$/.test(branch) || branch.includes('..')) throw new Error(`${path}.branch: 브랜치 이름이 올바르지 않습니다.`);
  for (const [key, folder] of [['posts', posts], ['assets', assets]]) {
    if (typeof folder !== 'string' || !FOLDER.test(folder) || folder.split('/').includes('..')) throw new Error(`${path}.${key}: 저장소 안의 폴더 경로가 필요합니다.`);
  }
  if (typeof deploy !== 'string' || (deploy && !DEPLOY.test(deploy))) throw new Error(`${path}.deploy: 소유자/저장소/작업.yml 형식이 필요합니다.`);
  if (typeof authUrl !== 'string') throw new Error(`${path}.authUrl: 주소 문자열이 필요합니다.`);
  if (authUrl) {
    let url;
    try { url = new URL(authUrl); } catch { throw new Error(`${path}.authUrl: 주소 형식이 올바르지 않습니다.`); }
    const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !local) || url.pathname !== '/' || url.search || url.hash) throw new Error(`${path}.authUrl: 경로 없는 https 주소가 필요합니다.`);
  }
  return { repository, branch, posts, assets, deploy, authUrl: authUrl.replace(/\/$/, '') };
}

export function loadAdminConfig(site = loadSiteConfig()) {
  if (site.admin === undefined) return null;
  return parseAdminConfig(site.admin);
}
