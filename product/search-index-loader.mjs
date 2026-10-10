// 공개 색인은 내용 버전이 같을 때만 재사용하고 캐시를 쓸 수 없으면 직접 읽는다.
const CACHE_NAME = 'publication-search-v1';

// cost: time O(n), heap O(n), stack O(1), io 최대 3회 네트워크와 캐시 읽기·쓰기
// vars: n = 압축 해제된 색인의 바이트 수
// basis: estimate
export async function loadSearchIndex(signal = AbortSignal.timeout(15_000)) {
  const storage = await versionedCache(signal);
  if (storage) {
    try {
      const cached = await storage.cache.match(storage.key);
      if (cached) return (await decodeIndex(cached, signal, storage.revision)).data;
    } catch (error) {
      if (signal.aborted) throw error;
      // 손상된 캐시는 화면 오류로 보내지 않고 원본을 다시 읽는다.
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
    } catch { /* 저장 거부와 용량 부족은 이미 읽은 검색 결과를 막지 않는다. */ }
  }
  return loaded.data;
}

async function versionedCache(signal) {
  try {
    if (typeof caches === 'undefined') return null;
    const cache = await caches.open(CACHE_NAME);
    // 글이 공개 해제되거나 수정되면 이전 색인을 재사용하지 않는다.
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
  // 호스트가 Content-Encoding으로 이미 풀었다면 다시 풀지 않는다.
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
