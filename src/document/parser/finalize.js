export function finalizeDocument(root) {
  const shared = { counter: 0, componentIds: [], headingIds: new Map(), headings: [], links: [] };
  numberUnit(root, shared);
  describeUnit(root, shared);
  return { headings: shared.headings, links: shared.links };
}

function numberUnit(unit, shared) {
  const { env, tokens } = unit;
  for (const target of env.idSlots) assignId(target, nextId(shared, env));
  for (const token of tokens) {
    if (token.type === 'directive' && token.meta.name === 'video') {
      token.meta.id = nextId(shared, env);
    } else if (token.type === 'fence' && token.meta?.role === 'ui') {
      const { meta } = token;
      meta.id = nextId(shared, env);
      meta.units.forEach((field, index) => {
        field.env.docId = `${meta.id}-${index + 1}`;
        numberUnit(field, shared);
      });
    }
  }
}

function describeUnit(unit, shared) {
  assignHeadingIds(unit, shared);
  collectLinks(unit, shared);
  for (const token of unit.tokens) {
    if (token.type === 'fence' && token.meta?.role === 'ui') {
      for (const field of token.meta.units) describeUnit(field, shared);
    }
  }
}

function nextId(shared, env) {
  shared.counter += 1;
  const id = `component-${env.pageId ?? 'page'}-${shared.counter}`;
  shared.componentIds.push(id);
  return id;
}

const takenByComponent = (shared, id) =>
  shared.componentIds.some((component) => id === component || id.startsWith(`${component}-`));

function assignId(target, id) {
  target.id = id;
  for (const panel of target.panels ?? []) panel.group = id;
}

function toHeadingText(tokens) {
  return tokens
    .map((token) => {
      if (token.children) return toHeadingText(token.children);
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
      return token.meta?.plainText ?? token.content;
    })
    .join('');
}

function assignHeadingIds(unit, shared) {
  const { tokens, env } = unit;
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open') return;
    const inline = tokens[index + 1];
    const title = toHeadingText(inline.children) || inline.content;
    const text =
      inline.content
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '') || 'section';
    const prefixed = (local) => (env.pageId ? `${env.pageId}-${local}` : local);
    const slug = takenByComponent(shared, prefixed(text)) ? `heading-${text}` : text;
    let count = shared.headingIds.get(slug) ?? 0;
    let localId;
    do localId = ++count === 1 ? slug : `${slug}-${count}`;
    while (shared.headingIds.has(`#${localId}`) || takenByComponent(shared, prefixed(localId)));
    shared.headingIds.set(slug, count);
    shared.headingIds.set(`#${localId}`, 1);
    const id = prefixed(localId);
    token.attrSet('id', id);
    const level = Number(token.tag.slice(1));
    shared.headings.push({ id, title, level, line: env.fenceLine ?? (token.map?.[0] ?? 0) + 1 });
  });
}

const hrefsOfItems = (data) =>
  Array.isArray(data.items) ? data.items.map((item) => item?.href) : [];
const DIRECTIVE_HREFS = new Set(['card', 'figure']);
const COMPONENT_HREFS = Object.freeze({
  __proto__: null,
  feature: (data) => [data.href],
  figure: (data) => [data.href],
  cards: hrefsOfItems,
  'figure-grid': hrefsOfItems,
});

function collectLinks({ tokens, env }, shared) {
  const push = (kind, target, line) => {
    if (typeof target === 'string' && target !== '') shared.links.push({ kind, target, line });
  };
  for (const token of tokens) {
    const line = env.fenceLine ?? (token.map?.[0] ?? 0) + 1;
    if (token.type === 'inline') collectInlineLinks(token, line, push, env.fenceLine === undefined);
    else if (token.type === 'directive' && DIRECTIVE_HREFS.has(token.meta.name)) {
      push('link', token.meta.attrs?.href, line);
    } else if (token.type === 'fence' && token.meta?.role === 'ui') {
      for (const href of COMPONENT_HREFS[token.meta.kind]?.(token.meta.data ?? {}) ?? []) {
        push('link', href, line);
      }
    }
  }
}

function collectInlineLinks(token, firstLine, push, countsBreaks) {
  let line = firstLine;
  for (const child of token.children ?? []) {
    if (countsBreaks && (child.type === 'softbreak' || child.type === 'hardbreak')) line += 1;
    if (child.type === 'link_open') push('link', child.attrGet('href'), line);
    else if (child.type === 'image') push('image', child.attrGet('src'), line);
  }
}
