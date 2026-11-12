const CACHE_NAME = 'search-index-v1';

export async function loadSearchIndex(signal = AbortSignal.timeout(15_000)) {
  const storage = await versionedCache(signal);
  if (storage) {
    try {
      const cached = await storage.cache.match(storage.key);
      if (cached) return (await decodeIndex(cached, signal, storage.revision)).data;
    } catch (error) {
      if (signal.aborted) throw error;
      try { await storage.cache.delete(storage.key); } catch {}
    }
  }
  signal.throwIfAborted();
  const loaded = await downloadIndex(signal, storage?.revision);
  if (storage) {
    try {
      await storage.cache.put(storage.key, new Response(loaded.bytes));
      for (const key of await storage.cache.keys()) {
        if (new URL(key.url).searchParams.get('revision') !== storage.revision) await storage.cache.delete(key);
      }
    } catch { }
  }
  return loaded.data;
}

async function versionedCache(signal) {
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch('/search-version.json', { signal, cache: 'no-store' });
    if (!response.ok) return null;
    const { revision } = await response.json();
    if (!/^[a-f0-9]{64}$/.test(revision)) return null;
    return { cache, revision, key: `/search-index.json?revision=${revision}` };
  } catch { return null; }
}

async function downloadIndex(signal, revision) {
  const suffix = revision ? `?revision=${revision}` : '';
  if (typeof DecompressionStream === 'function') {
    try {
      return await readIndex(`/search-index.json.gz${suffix}`, signal, revision);
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  return readIndex(`/search-index.json${suffix}`, signal, revision);
}

async function readIndex(url, signal, revision) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`search index unavailable: ${url}`);
  return decodeIndex(response, signal, revision);
}

async function decodeIndex(response, signal, revision) {
  let bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const body = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'), { signal });
    bytes = new Uint8Array(await new Response(body).arrayBuffer());
  }
  signal.throwIfAborted();
  if (revision) {
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    if (Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('') !== revision) throw new Error('search index version mismatch');
  }
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(data?.entries) || !data.tags || typeof data.tags !== 'object') throw new Error('invalid search index');
  signal.throwIfAborted();
  return { data, bytes };
}
