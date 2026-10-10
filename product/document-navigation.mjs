// 공개 문서의 부모 관계와 주제 입구를 탐색 구성 요소에 연결한다.
import * as ui from './vendor/theme/assets/components.mjs';

function topicRoots(page, context) {
  const roots = context.topicTrees?.get(page.category) ?? [];
  const entrySlug = context.topics[page.category]?.article;
  const pending = [...roots];
  let entry;
  while (pending.length) {
    const node = pending.pop();
    if (node.page.slug === entrySlug) { entry = node; break; }
    pending.push(...node.children);
  }
  if (!entry) return roots;
  const ancestor = roots.find(root => contains(root, entry.page.slug));
  if (contains(ancestor, page.slug) && !contains(entry, page.slug)) return roots;
  return [entry, ...roots.filter(root => root !== ancestor)];
}

function contains(root, slug) {
  const pending = root ? [root] : [];
  while (pending.length) {
    const node = pending.pop();
    if (node.page.slug === slug) return true;
    pending.push(...node.children);
  }
  return false;
}

export function documentNavigation(page, context) {
  function item(node) {
    const children = node.children.map(item);
    const current = node.page.id === page.id;
    return { title: node.page.title, href: node.page.route, current, children,
      open: current || children.some(child => child.open) };
  }
  const roots = topicRoots(page, context);
  if (!roots.length) return undefined;
  const topic = context.topics[page.category];
  return ui.DocumentNavigation({ label: topic.label,
    nodes: roots.map(item) });
}

export function documentPager(page, context, renderIcon = () => undefined) {
  if (page.type !== 'wiki') return '';
  const ordered = [];
  const pending = topicRoots(page, context).toReversed();
  while (pending.length) {
    const node = pending.pop();
    ordered.push(node.page);
    for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
  }
  const index = ordered.findIndex(candidate => candidate.id === page.id);
  if (index < 0) return '';
  const link = candidate => candidate && { title: candidate.title, href: candidate.route, icon: renderIcon(candidate) };
  return String(ui.DocumentPager({ label: context.topics[page.category].label,
    before: link(ordered[index - 1]), after: link(ordered[index + 1]) }));
}

export function documentOutline(headings) {
  if (!headings.some(heading => heading.level <= 3)) return undefined;
  return ui.DocumentOutline({ sections: headings.filter(heading => heading.level <= 3)
    .map(heading => ({ ...heading, level: Math.max(2, heading.level) })) });
}
