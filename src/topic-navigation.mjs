// 공개 문서의 부모 관계를 검사하고 전체 깊이를 보존한 주제별 목록을 만든다.
export function createTopicTrees(documents) {
  const roots = createTopicTree('documents', documents.filter(page => page.type === 'wiki'));
  const topics = new Map();
  const pending = roots.toReversed().map(root => ({ node: root, root }));
  while (pending.length) {
    const { node, root } = pending.pop();
    if (!topics.has(node.page.category)) topics.set(node.page.category, new Set());
    topics.get(node.page.category).add(root);
    for (let i = node.children.length - 1; i >= 0; i--) pending.push({ node: node.children[i], root });
  }
  return new Map([...topics].map(([category, entries]) => [category, [...entries]]));
}

function createTopicTree(topic, pages) {
  const bySlug = new Map(pages.map(page => [page.slug, { page, children: [] }]));
  if (bySlug.size !== pages.length) throw new Error(`duplicate navigation slug: ${topic}`);
  const roots = [];
  for (const node of bySlug.values()) {
    const parent = bySlug.get(node.page.parent);
    (parent ? parent.children : roots).push(node);
  }
  const result = [];
  const visited = new Set();
  const pending = roots.toReversed().map(node => ({ node, target: result }));
  while (pending.length) {
    const { node, target } = pending.pop();
    visited.add(node.page.slug);
    const output = { page: node.page, children: [] };
    target.push(output);
    const children = output.children;
    for (let i = node.children.length - 1; i >= 0; i--) {
      pending.push({ node: node.children[i], target: children });
    }
  }
  // 부모가 하나인 그래프에서 루트로부터 닿지 않는 항목은 순환 또는 그 하위 문서다.
  const unreachable = pages.filter(page => !visited.has(page.slug));
  if (unreachable.length) throw new Error(`cyclic topic navigation: ${topic} (${unreachable.slice(0, 5).map(page => page.slug).join(', ')})`);
  return result;
}
