import { querySearch } from './query.js';

self.addEventListener('message', async ({ data }) => {
  try { self.postMessage(await querySearch(data)); }
  catch { self.postMessage({ id: data.id, error: true }); }
});
