// 큰 색인의 파싱과 정규화는 입력을 처리하는 화면 스레드 밖에서 실행한다.
import { querySearch } from './search-query.mjs';

self.addEventListener('message', async ({ data }) => {
  try { self.postMessage(await querySearch(data)); }
  catch { self.postMessage({ id: data.id, error: true }); }
});
