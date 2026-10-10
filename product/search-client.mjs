// 요청 번호를 유지해 느린 이전 응답과 최신 입력을 구분한다.
let worker;
let sequence = 0;
const pending = new Map();

export function queryIndex(action, state) {
  if (!worker) {
    const url = new URL('./search-worker.mjs', import.meta.url);
    url.search = new URL(import.meta.url).search;
    worker = new Worker(url, { type: 'module' });
    worker.addEventListener('message', ({ data }) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      if (data.error) request.reject(new Error('search index unavailable'));
      else request.resolve(data);
    });
    worker.addEventListener('error', () => {
      for (const request of pending.values()) request.reject(new Error('search worker unavailable'));
      pending.clear(); worker.terminate(); worker = undefined;
    });
  }
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, action, state });
  });
}
