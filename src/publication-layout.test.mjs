import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { privateWikiArticle as articlePage } from './private-wiki-layout.mjs';

test('source_links_preserve_safe_urls_and_reject_executable_schemes', () => {
  const page = { id: 'source', slug: 'source', route: '/docs/source/', title: '원문', description: '설명', type: 'wiki', tags: [], headings: [], html: '', contentIcon: { name: 'project' } };
  for (const sourceUrl of ['https://example.com/wiki/?a=1&b=2#part', 'http://example.com/wiki/', '/docs/original/#part']) {
    const html = articlePage({ ...page, sourceUrl }, { topics: {} });
    assert.equal(JSDOM.fragment(html).querySelector('.app-source-link a').getAttribute('href'), sourceUrl);
    assert.doesNotMatch(html, /&amp;amp;/);
  }
  assert.equal(JSDOM.fragment(articlePage(page, { topics: {} })).querySelector('.app-source-link'), null);
  for (const sourceUrl of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd', '//example.com/', '/\\example.com/', 'https://example.com/\npath', 'https://example.com/a b']) {
    assert.throws(() => articlePage({ ...page, sourceUrl }, { topics: {} }), /Unsupported URL/);
  }
});
