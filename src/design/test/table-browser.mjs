import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { Table, escape, trusted } from '../dist/ui/index.mjs';

const modulePath = process.argv[2];
if (!modulePath) throw new Error('Usage: node test/table-browser.mjs <playwright-core module> [evidence prefix]');
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const evidence = process.argv[3];
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const sentence = '긴 설명도 열의 관계를 비교하며 읽을 수 있어야 합니다. Words in a long sentence should stay readable. ';
const code = 'long_identifier_'.repeat(16);
const fixtures = [
  { name: 'ordinary', rows: [['동작', '단축키'], ['검색', '<code>⌘ K</code>']], fits: true },
  { name: 'numpy', rows: [
    ['x의 shape (2,3)', '의미', '출력 shape'],
    ['<code>sum(x, axis=0)</code>', '<span data-short>두 행을 더해 각 열의 합을 구한다</span>', '<code>(3,)</code>'],
    ['<code>sum(x, axis=1, keepdims=True)</code>', '줄인 축을 길이 1로 남긴다', '<code>(2,1)</code>'],
  ] },
  { name: 'long-prose', rows: [['항목', '설명', '결과'], ['값', `<span data-long>${sentence.repeat(5)}</span>`, '<code>(3,)</code>']] },
  { name: 'long-code', rows: [['식', '설명', '결과'], [`<code data-long>${code}</code>`, '긴 식의 결과', '<code>(3,)</code>']] },
  { name: 'mixed', rows: [['항목', '설명'], ['설정', `<span data-long>${`${sentence}<code>option=true</code> `.repeat(6)}</span>`]] },
  { name: 'long-word', rows: [['항목', '값'], ['이름', `<span data-long>${'word'.repeat(90)}</span>`]] },
  { name: 'many-columns', rows: [Array.from({ length: 8 }, (_, i) => `열 ${i + 1}`), Array.from({ length: 8 }, (_, i) => `<code>value_for_column_${i + 1}</code>`)] },
];
function documentFor(fixture) {
  const body = fixture.rows.map((row, i) => `<tr>${row.map(cell => i === 0 ? `<th scope="col">${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/styles.css"></head><body><main class="app-document"><article class="app-prose"><p>합성 데이터: ${escape(fixture.name)}</p>${Table({ label: fixture.name, body: trusted(`<thead>${body[0]}</thead><tbody>${body.slice(1).join('')}</tbody>`) })}</article></main></body></html>`;
}
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const fixture = fixtures.find(item => pathname === `/${item.name}`);
    if (fixture) {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(documentFor(fixture));
      return;
    }
    const path = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (!path.startsWith(`${root.replace(/\/$/, '')}${sep}`)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', extname(path) === '.css' ? 'text/css' : 'font/woff2');
    response.end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
after(async () => {
  await browser.close();
  await new Promise(done => server.close(done));
  if (evidence) await writeFile(`${evidence}.json`, JSON.stringify({ browser: browser.version(), results }, null, 2));
});

for (const colorScheme of ['light', 'dark']) for (const width of [320, 390, 430, 768, 1024, 1440]) {
  test(`table reading and overflow at ${width}px in ${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    try {
      for (const fixture of fixtures) {
        await page.goto(`http://127.0.0.1:${server.address().port}/${fixture.name}`);
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(() => {
          const region = document.querySelector('[role="region"]');
          const lineCount = selector => {
            const element = document.querySelector(selector);
            if (!element) return null;
            const range = document.createRange();
            range.selectNodeContents(element);
            return new Set([...range.getClientRects()].filter(rect => rect.width).map(rect => Math.round(rect.top))).size;
          };
          return {
            pageWidth: document.documentElement.clientWidth,
            pageScrollWidth: document.documentElement.scrollWidth,
            regionWidth: region.clientWidth,
            tableWidth: region.scrollWidth,
            shortLines: lineCount('[data-short]'), longLines: lineCount('[data-long]'),
            cells: [...document.querySelectorAll('th,td')].map(cell => ({ width: cell.clientWidth, scrollWidth: cell.scrollWidth })),
            code: document.querySelector('code[data-long]')?.textContent,
          };
        });
        const result = { fixture: fixture.name, width, colorScheme, ...layout };
        results.push(result);
        if (evidence && width === 390) await page.screenshot({ path: `${evidence}-${fixture.name}-${colorScheme}.png`, fullPage: true });
        assert.ok(layout.pageScrollWidth <= layout.pageWidth, `${fixture.name}: page must not scroll horizontally`);
        assert.ok(layout.cells.every(cell => cell.scrollWidth <= cell.width + 1), `${fixture.name}: cell content must not overlap a neighbouring cell`);
        if (fixture.fits) assert.equal(layout.tableWidth, layout.regionWidth, 'short tables fill the available width');
        if (layout.shortLines !== null) assert.equal(layout.shortLines, 1, 'a short explanation must not collapse beside code');
        if (layout.longLines !== null) assert.ok(layout.longLines > 1, `${fixture.name}: long content must wrap`);
        if (fixture.name === 'long-code') assert.equal(layout.code, code, 'wrapping must preserve code text');
        if (width === 390 && layout.tableWidth > layout.regionWidth) {
          await page.keyboard.press('Tab');
          assert.equal(await page.locator('[role="region"]').evaluate(element => element === document.activeElement && element.matches(':focus-visible')), true);
          for (let press = 0; press < 120; press++) {
            if (await page.locator('[role="region"]').evaluate(element => element.scrollLeft + element.clientWidth >= element.scrollWidth - 1)) break;
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(35);
          }
          result.keyboard = await page.locator('[role="region"]').evaluate(element => {
            const last = element.querySelector('tbody tr:last-child td:last-child').getBoundingClientRect();
            const bounds = element.getBoundingClientRect();
            return { scrollLeft: element.scrollLeft, lastColumnVisible: last.right <= bounds.right + 1 && last.right > bounds.left };
          });
          assert.equal(result.keyboard.lastColumnVisible, true, `${fixture.name}: ArrowRight must reach the final column`);
          if (evidence) await page.screenshot({ path: `${evidence}-${fixture.name}-${colorScheme}-keyboard.png`, fullPage: true });
        }
      }
    } finally { await page.close(); }
  });
}
