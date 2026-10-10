import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compileStyles as publicationStyles } from './vendor/theme/ui/build/styles.mjs';
import { publicationAssets } from './publication-assets.mjs';

test('published_styles_keep_dynamic_states_and_drop_unused_asset_dependencies', async () => {
  const css = `
    :root { --example: var(--spacing-gap); }
    @font-face { src: url(assets/font.woff2); }
    @keyframes motion { to { opacity: 0; } }
    .player.is-playing { color: var(--color-ink); }
    .navigation[open] > summary { display: none; }
    .result[aria-selected="true"]:focus-visible { outline-color: var(--color-action-link); }
    @media (hover: hover) { .player:hover { background: url(../assets/play.svg); } }
    .office { background: url(../assets/unused-office.jpg); }
  `;
  const pages = new Map([['/', '<link href="/theme/publication.css"><div class="player"></div><details class="navigation"><summary>목록</summary></details>']]);
  const scripts = new Map([['search.js', 'node.className = "result";']]);
  const result = await publicationStyles(css, pages, scripts);
  for (const expected of ['--example', '@font-face', '@keyframes motion', '.player.is-playing', '.navigation[open]', '.result[aria-selected=true]:focus-visible', '.player:hover']) assert.ok(result.css.includes(expected), expected);
  assert.ok(!result.css.includes('unused-office'));
  const assets = publicationAssets(pages, [], path => path === '/theme/publication.css' ? Buffer.from(result.css) : Buffer.from(''));
  assert.ok(assets.has('/assets/play.svg'));
  assert.ok(assets.has('/theme/assets/font.woff2'));
  assert.ok(!assets.has('/assets/unused-office.jpg'));
  assert.ok(css.includes('unused-office'));
});
