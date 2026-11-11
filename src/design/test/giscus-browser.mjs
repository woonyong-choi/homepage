import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { contrast } from '../scripts/lib/contrast.mjs';

const modulePath = process.argv[2];
if (!modulePath) throw new Error('Usage: node test/giscus-browser.mjs <playwright-core module> [evidence prefix]');
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const evidence = process.argv[3];
const css = await readFile(new URL('../dist/assets/giscus.css', import.meta.url));
const fixture = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><link rel="stylesheet" href="/giscus.css"></head><body><main class="gsc-main"><article class="gsc-comment"><p class="gsc-comment-content">댓글 본문을 밝은 바탕에서 읽는다.</p><p class="gsc-reply-content">답글도 같은 바탕과 글자 역할을 사용한다.</p></article><textarea class="gsc-comment-box-textarea" aria-label="합성 댓글" readonly>입력 영역의 글자</textarea></main></body></html>`;
const widget = createServer((request, response) => {
  const style = request.url === '/giscus.css';
  response.setHeader('Content-Type', style ? 'text/css' : 'text/html; charset=utf-8');
  response.end(style ? css : fixture);
});
await new Promise(done => widget.listen(0, '127.0.0.1', done));
const host = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(`<!doctype html><html lang="ko"><head><meta name="color-scheme" content="light"><meta name="viewport" content="width=device-width"></head><body><iframe title="댓글" src="http://127.0.0.1:${widget.address().port}" width="100%" height="500" frameborder="0"></iframe></body></html>`);
});
await new Promise(done => host.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
after(async () => {
  await browser.close();
  await Promise.all([host, widget].map(server => new Promise(done => server.close(done))));
  if (evidence) await writeFile(`${evidence}.json`, JSON.stringify({ browser: browser.version(), results }, null, 2));
});

for (const colorScheme of ['light', 'dark']) for (const width of [390, 1440]) {
  test(`comment text retains contrast at ${width}px with OS ${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 700 }, colorScheme });
    try {
      await page.goto(`http://127.0.0.1:${host.address().port}`);
      const frame = await (await page.locator('iframe').elementHandle()).contentFrame();
      await frame.waitForSelector('.gsc-comment-content');
      const colors = await frame.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = 'Canvas';
        document.body.append(probe);
        const canvas = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const hex = color => '#' + color.match(/\d+/g).slice(0, 3).map(value => Number(value).toString(16).padStart(2, '0')).join('');
        return ['.gsc-comment-content', '.gsc-reply-content', 'textarea'].map(selector => {
          const element = document.querySelector(selector);
          let background = canvas;
          for (let node = element; node; node = node.parentElement) {
            const fill = getComputedStyle(node).backgroundColor;
            if (fill !== 'rgba(0, 0, 0, 0)') { background = fill; break; }
          }
          return { selector, foreground: hex(getComputedStyle(element).color), background: hex(background) };
        });
      });
      results.push({ width, colorScheme, colors: colors.map(color => ({ ...color, ratio: contrast(color.foreground, color.background) })) });
      if (evidence) await page.screenshot({ path: `${evidence}-${colorScheme}-${width}.png` });
      for (const color of colors) assert.ok(contrast(color.foreground, color.background) >= 4.5, `${color.selector}: ${color.foreground} on ${color.background}`);
      await page.keyboard.press('Tab');
      assert.equal(await frame.locator('textarea').evaluate(element => element === document.activeElement && element.matches(':focus-visible')), true);
    } finally { await page.close(); }
  });
}
