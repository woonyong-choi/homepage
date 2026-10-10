// 큰 색인의 파싱과 정규화는 입력을 처리하는 화면 스레드 밖에서 실행한다.
import { prepareIndex, searchDocuments, suggestions } from './search-model.mjs';
import { loadSearchIndex } from './search-index-loader.mjs';

let indexPromise;
function loadIndex() {
  return indexPromise ??= loadSearchIndex().then(data => ({ ...data, entries: prepareIndex(data.entries) })).catch(error => { indexPromise = undefined; throw error; });
}

function visibleEntry({ normalized, text, keywords, ...entry }) { return entry; }

self.addEventListener('message', async ({ data: { id, action, state } }) => {
  try {
    const data = await loadIndex();
    const result = action === 'suggest' ? suggestions(data.entries, data.tags, state) : searchDocuments(data.entries, state);
    const { all, ...visible } = result;
    self.postMessage({ id, result: { ...visible, entries: result.entries.map(visibleEntry) }, tags: data.tags });
  } catch { self.postMessage({ id, error: true }); }
});
