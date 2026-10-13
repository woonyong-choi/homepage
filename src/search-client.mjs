// 요청 번호를 유지해 느린 이전 응답과 최신 입력을 구분한다.
import { querySearch } from './search-query.mjs';

let worker;
let isWorkerUnavailable = false;
let sequence = 0;
const pending = new Map();

export function queryIndex(action, state) {
  const data = { id: ++sequence, action, state };
  if (!worker && !isWorkerUnavailable) {
    try { worker = createWorker(); }
    catch { isWorkerUnavailable = true; }
  }
  if (isWorkerUnavailable) return querySearch(data);
  return new Promise((resolve, reject) => {
    pending.set(data.id, { data, resolve, reject });
    try { worker.postMessage(data); }
    catch { useLocalSearch(); }
  });
}

function createWorker() {
  const url = new URL('./search-worker.mjs', import.meta.url);
  url.search = new URL(import.meta.url).search;
  const instance = new Worker(url, { type: 'module' });
  instance.addEventListener('message', ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.error) request.reject(new Error('search index unavailable'));
    else request.resolve(data);
  });
  instance.addEventListener('error', event => { event.preventDefault(); useLocalSearch(); });
  instance.addEventListener('messageerror', useLocalSearch);
  return instance;
}

function useLocalSearch() {
  isWorkerUnavailable = true;
  worker?.terminate();
  worker = undefined;
  const requests = [...pending.values()];
  pending.clear();
  for (const request of requests) querySearch(request.data).then(request.resolve, request.reject);
}
