const PAGE_SIZE = 12;

export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFC').toLocaleLowerCase('ko').trim().replace(/\s+/g, ' ');
}

export function readSearchState(query, defaultTag = '') {
  const params = new URLSearchParams(query);
  const page = Number(params.get('page'));
  return { query: params.get('q') ?? '',
    tags: [...new Set([...params.getAll('tag'), ...(defaultTag ? [defaultTag] : [])].map(tag => tag.trim().normalize('NFC')).filter(Boolean))],
    page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}

export function searchUrl({ query = '', tags = [], page = 1, baseRoute = '/search/', homeRoute } = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  for (const tag of [...new Set(tags.map(tag => tag.trim().normalize('NFC')).filter(Boolean))]) params.append('tag', tag);
  if (page > 1) params.set('page', page);
  const route = baseRoute === '/docs/' ? '/docs/' : '/search/';
  if (homeRoute === '/docs/' && !normalizeQuery(query) && !tags.length) return '/docs/';
  return `${route}${params.size ? '?' + params : ''}`;
}

export function prepareIndex(entries) {
  return [...new Map(entries.map(entry => [entry.id, entry])).values()].map(entry => ({ ...entry,
    normalized: Object.fromEntries(['title', 'description', 'text', 'keywords'].map(key => [key, normalizeQuery(Array.isArray(entry[key]) ? entry[key].join(' ') : entry[key])])) }));
}

export function searchDocuments(entries, state) {
  const query = normalizeQuery(state.query);
  const terms = query.split(' ').filter(Boolean);
  const matches = entries.filter(entry => state.tags.every(tag => entry.tags.includes(tag))).map(entry => ({ entry, score: scoreEntry(entry, terms, query) })).filter(item => item.score >= 0);
  matches.sort((a, b) => b.entry.date.localeCompare(a.entry.date) || a.entry.id.localeCompare(b.entry.id));
  const selected = matches.map(({ entry }) => entry);
  const size = state.pageSize === 'all' ? Math.max(1, selected.length) : Number.isSafeInteger(state.pageSize) && state.pageSize > 0 ? state.pageSize : PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(selected.length / size));
  const page = Math.min(totalPages, state.page);
  return { tagIds: [...new Set(selected.flatMap(entry => entry.tags))], entries: selected.slice((page - 1) * size, page * size).map(entry => ({ ...entry, excerpt: searchExcerpt(entry, terms) })), all: selected, total: selected.length, page, totalPages };
}

function searchExcerpt(entry, terms) {
  if (!terms.length || terms.some(term => entry.normalized.description.includes(term))) return entry.description;
  const text = String(entry.text ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const lower = text.toLocaleLowerCase('ko');
  const positions = terms.map(term => lower.indexOf(term)).filter(index => index >= 0);
  if (!positions.length) return entry.description;
  const start = Math.max(0, Math.min(...positions) - 50);
  return `${start ? '…' : ''}${text.slice(start, start + 180)}${start + 180 < text.length ? '…' : ''}`;
}

export function suggestions(entries, tags, state) {
  const query = normalizeQuery(state.query);
  if (!query) return { queries: [], tags: [], entries: [], count: 0 };
  const result = searchDocuments(entries, { ...state, page: 1 });
  const queries = [...new Set(result.all.flatMap(entry => [entry.title, ...entry.keywords]))].filter(value => normalizeQuery(value).includes(query) && normalizeQuery(value) !== query).slice(0, 5);
  const available = searchDocuments(entries, { ...state, query: '', page: 1 }).all;
  const matchingTags = Object.entries(tags).filter(([id, tag]) => !state.tags.includes(id) && [tag.label, ...(tag.aliases ?? [])].some(value => normalizeQuery(value).includes(query)) && available.some(entry => entry.tags.includes(id))).slice(0, 5);
  return { queries, tags: matchingTags, entries: result.entries.slice(0, 6), count: result.all.length };
}

function scoreEntry(entry, terms, query) {
  let score = query && entry.normalized.title === query ? 1000 : 0;
  for (const term of terms) {
    const field = ['title', 'keywords', 'description', 'text'].findIndex(key => entry.normalized[key].includes(term));
    if (field < 0) return -1;
    score += [600, 400, 200, 100][field];
  }
  return score;
}
