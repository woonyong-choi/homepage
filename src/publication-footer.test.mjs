import assert from 'node:assert/strict';
import { test } from 'node:test';
import { personalFooter } from './publication-footer.mjs';
import { clientEntrypoints } from './publication-assets.mjs';

const CONFIG = { github: 'https://github.com/example' };

test('footer_is_one_line_with_year_owner_and_two_icon_links', () => {
  const html = personalFooter(CONFIG, 2026);
  assert.match(html, /<p class="app-footer-copy">© <span data-current-year>2026<\/span> woonyong<\/p>/);
  assert.equal((html.match(/<a /g) ?? []).length, 2);
  assert.match(html, /href="https:\/\/github\.com\/example" aria-label="GitHub"/);
  assert.match(html, /href="\/blog\/feed\.xml" aria-label="RSS"/);
  assert.doesNotMatch(html, /app-footer-grid|<h3|@bywoonyong/);
});

test('footer_year_defaults_to_build_year_and_a_module_refreshes_it_on_load', async () => {
  assert.ok(personalFooter(CONFIG).includes(`<span data-current-year>${new Date().getFullYear()}</span>`));
  assert.deepEqual(clientEntrypoints(personalFooter(CONFIG)), ['footer-year.js']);
  const target = { textContent: '2020' };
  globalThis.document = { querySelectorAll: () => [target] };
  const RealDate = Date;
  globalThis.Date = class extends RealDate { getFullYear() { return 2031; } };
  try { await import('./footer-year.js'); } finally { globalThis.Date = RealDate; delete globalThis.document; }
  assert.equal(target.textContent, 2031);
});
