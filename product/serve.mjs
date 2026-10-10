// 로컬 정적 미리보기. 영상 탐색을 위한 바이트 범위 요청을 지원한다.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const port = Number(option('--port', '8794'));
const host = option('--host', '127.0.0.1');
const root = resolve(option('--root', fileURLToPath(new URL('../dist/', import.meta.url))));
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.mp4':'video/mp4', '.woff2':'font/woff2', '.md':'text/plain; charset=utf-8', '.xml':'application/xml' };
createServer((request, response) => {
  try {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/' && !args.includes('--root')) { response.writeHead(302, { location:'/things/' }); response.end(); return; }
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) throw new Error('path');
    let stat = statSync(path);
    if (stat.isDirectory()) { path = resolve(path, 'index.html'); stat = statSync(path); }
    if (!stat.isFile()) throw new Error('file');
    const headers = { 'content-type': mime[extname(path)] ?? 'application/octet-stream', 'accept-ranges':'bytes', 'cache-control':'no-cache', 'x-content-type-options':'nosniff' };
    if (pathname.endsWith('/giscus.css')) headers['access-control-allow-origin'] = 'https://giscus.app';
    let start = 0; let end = stat.size - 1; let status = 200;
    if (request.headers.range) {
      const range = request.headers.range.match(/^bytes=(\d*)-(\d*)$/);
      if (!range || (!range[1] && !range[2])) { response.writeHead(416, {'content-range':`bytes */${stat.size}`}); response.end(); return; }
      start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
      if (start > end || start >= stat.size) { response.writeHead(416, {'content-range':`bytes */${stat.size}`}); response.end(); return; }
      headers['content-range'] = `bytes ${start}-${end}/${stat.size}`; status = 206;
    }
    headers['content-length'] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || stat.size === 0) { response.end(); return; }
    const stream = createReadStream(path, { start,end });
    stream.on('error', () => response.destroy()); stream.pipe(response);
  } catch { response.writeHead(404, {'content-type':'text/plain; charset=utf-8'}); response.end('페이지를 찾을 수 없습니다.'); }
}).listen(port, host, () => console.log(`Preview: http://${host}:${port}/${args.includes('--root') ? '' : 'things/'}`));
