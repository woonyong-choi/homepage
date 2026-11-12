import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseDocument, renderDocument } from '../src/document/index.js';

test('renders headings, code, math and footnotes', async () => {
  const source = '# 제목\n\n본문[^1]과 $a^2$.\n\n```js\nconst a = 1;\n```\n\n[^1]: 각주\n';
  const document = await parseDocument(source, { id: 'sample' });
  const { html } = await renderDocument(document, { id: 'sample' });
  assert.match(html, /<h1[^>]*>제목<\/h1>/);
  assert.match(html, /class="katex"/);
  assert.match(html, /<code[^>]*>[\s\S]*const/);
  assert.match(html, /각주/);
});
