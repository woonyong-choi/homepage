// Worker와 격리된 미리보기가 같은 색인 캐시와 검색 모델을 사용한다.
import { prepareIndex, searchDocuments, suggestions } from './search-model.mjs';
import { loadSearchIndex } from './search-index-loader.mjs';

let indexPromise;
export async function querySearch({ id, action, state }) {
  const data = await loadIndex();
  const result = action === 'suggest' ? suggestions(data.entries, data.tags, state) : searchDocuments(data.entries, state);
  const { all, ...visible } = result;
  return { id, result: { ...visible, entries: result.entries.map(visibleEntry) }, tags: data.tags };
}

function loadIndex() {
  return indexPromise ??= loadSearchIndex().then(data => ({ ...data, entries: prepareIndex(data.entries) })).catch(error => { indexPromise = undefined; throw error; });
}

function visibleEntry({ normalized, text, keywords, ...entry }) { return entry; }
