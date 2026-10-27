import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoFetcher, DEMO_POSTS } from './admin-demo.mjs';
import { fromBase64, readPost, toBase64 } from './admin-model.mjs';

const API = 'https://api.github.com/repos/woonyong-choi/vault';

test('demo_fetcher_keeps_posts_in_memory_like_github_contents_api', async () => {
  const fetcher = demoFetcher();
  const list = await (await fetcher(`${API}/contents/publish?ref=main`)).json();
  assert.equal(list.length, DEMO_POSTS.length);
  const first = await (await fetcher(`${API}/contents/${list[0].path}?ref=main`)).json();
  assert.equal(readPost(fromBase64(first.content)).state, 'draft');
  const created = await fetcher(`${API}/contents/publish/new.md`, { method: 'PUT', body: JSON.stringify({ content: toBase64('새 글'), message: 'm' }) });
  assert.equal(created.status, 201);
  assert.equal((await fetcher(`${API}/contents/publish/new.md`, { method: 'PUT', body: JSON.stringify({ content: toBase64('겹침') }) })).status, 422);
  await fetcher(`${API}/contents/publish/new.md`, { method: 'DELETE', body: JSON.stringify({ sha: 'x' }) });
  assert.equal((await fetcher(`${API}/contents/publish/new.md`)).status, 404);
  assert.equal((await fetcher('https://api.github.com/repos/o/r/actions/workflows/deploy.yml/dispatches', { method: 'POST', body: '{}' })).status, 204);
});
