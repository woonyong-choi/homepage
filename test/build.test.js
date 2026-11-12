import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { buildSite } from '../src/build/index.js';

const output = mkdtempSync(join(tmpdir(), 'site-'));
after(() => rmSync(output, { recursive: true, force: true }));

test('builds every page with a title, one h1 and the shared stylesheet', async () => {
  const report = await buildSite({ outputRoot: join(output, 'site') });
  assert.ok(report.pages >= 3);
  const read = path => readFileSync(join(output, 'site', path), 'utf8');
  for (const path of ['index.html', 'blog/index.html', 'search/index.html', '404.html']) {
    const html = read(path);
    assert.match(html, /<title>[^<]+<\/title>/, path);
    assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `${path} h1`);
    assert.match(html, /\/theme\/site\.css\?v=/, path);
  }
  for (const path of ['site.js', 'search-worker.js', 'search-index.json', 'sitemap.xml', 'robots.txt', 'blog/feed.xml']) {
    assert.ok(existsSync(join(output, 'site', path)), path);
  }
  const index = JSON.parse(read('search-index.json'));
  assert.equal(index.entries.length, report.documents);
});
