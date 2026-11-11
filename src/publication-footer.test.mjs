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

// 연도는 빌드할 때 적는다. 연도만 바꾸는 스크립트를 따로 싣지 않는다.
test('footer_year_is_the_build_year_without_a_script', () => {
  assert.ok(personalFooter(CONFIG).includes(`<span data-current-year>${new Date().getFullYear()}</span>`));
  assert.deepEqual(clientEntrypoints(personalFooter(CONFIG)), []);
});
