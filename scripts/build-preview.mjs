// 공개 시안에는 명시한 정적 자산만 복사한다. 저장소 전체를 제공하지 않는다.
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const output = process.argv[2];
if (!output) throw new Error('usage: node scripts/build-preview.mjs <output-directory>');
const target = resolve(output);
const desktopOnly = process.argv.includes('--desktop');
const files = [
  'theme.css', 'styles.css', 'preview/preview.js',
  'landing/landing.js',
  ...[0, 1, 2].flatMap(index => ['mp4', 'jpg'].map(extension => `landing/assets/film-${index}.${extension}`)),
  'assets/fonts/pretendard-variable.woff2', 'assets/fonts/pretendard-license.txt',
  'assets/fonts/jetbrains-mono-regular.woff2', 'assets/fonts/jetbrains-mono-license.txt',
  'assets/img/icons/python-icon.svg', 'assets/img/icons/kotlin-icon.svg',
  'assets/img/icons/react-icon.svg', 'assets/img/icons/spring-boot-icon.svg',
  'assets/img/icons/postgres-icon.svg', 'assets/ui/github.svg',
  ...['vuejs', 'svelte', 'daphnis', 'nextjs', 'kubernetes', 'redis', 'docker', 'githubactions', 'prometheus'].map(name => `assets/img/icons/${name}-icon.svg`),
  ...['library', 'javascript', 'csharp', 'platform', 'cli', 'database', 'functions', 'integrations', 'ai-tools', 'rest-api', 'troubleshooting'].map(name => `assets/ui/${name}.svg`),
  'assets/img/icons/simple-icons-license.txt', 'assets/ui/lucide-license.txt',
  ...['user-round', 'cpu', 'network', 'brain', 'server', 'book-open', 'terminal', 'workflow', 'database', 'code-xml'].map(name => `assets/ui/${name}-lucide.svg`),
];
for (const file of files) {
  const destination = resolve(target, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(new URL(file, root), destination);
}
let html = readFileSync(new URL('preview/index.html', root), 'utf8');
if (desktopOnly) {
  // PC 검토용 출력에서만 폭에 따른 반응형 블록을 주석 처리한다.
  let css = readFileSync(new URL('styles.css', root), 'utf8');
  const media = /@media\s*\(max-width:[^)]*\)\s*\{/g;
  let match;
  while ((match = media.exec(css))) {
    let end = media.lastIndex;
    let depth = 1;
    while (depth && end < css.length) {
      if (css[end] === '{') depth++;
      if (css[end] === '}') depth--;
      end++;
    }
    if (depth) throw new Error('Unclosed responsive media block');
    const block = css.slice(match.index, end).replace(/\/\*[\s\S]*?\*\//g, '');
    const comment = `/* PC 검토 중 반응형 비활성화\n${block}\n*/`;
    css = css.slice(0, match.index) + comment + css.slice(end);
    media.lastIndex = match.index + comment.length;
  }
  writeFileSync(resolve(target, 'styles.css'), css);
  const theme = readFileSync(new URL('theme.css', root), 'utf8');
  const pixels = name => {
    const value = theme.match(new RegExp(`--${name}:\\s*([0-9.]+)px;`));
    if (!value) throw new Error(`Missing viewport token: ${name}`);
    return Number(value[1]);
  };
  const width = pixels('page-max-width') + pixels('spacing-64');
  html = html.replace('width=device-width, initial-scale=1', `width=${width}`);
}
for (const file of ['theme.css', 'styles.css', 'preview/preview.js']) {
  const hash = createHash('sha256').update(readFileSync(resolve(target, file))).digest('hex').slice(0, 12);
  html = html.replace(`/${file}"`, `/${file}?v=${hash}"`);
}
writeFileSync(resolve(target, 'index.html'), html);
let landing = readFileSync(new URL('landing/index.html', root), 'utf8');
for (const file of ['theme.css', 'styles.css', 'landing/landing.js']) {
  const hash = createHash('sha256').update(readFileSync(resolve(target, file))).digest('hex').slice(0, 12);
  landing = landing.replace(`/${file}"`, `/${file}?v=${hash}"`);
}
mkdirSync(resolve(target, 'landing'), { recursive: true });
writeFileSync(resolve(target, 'landing/index.html'), landing);
writeFileSync(resolve(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`Preview exported: ${files.length + 3} files`);
