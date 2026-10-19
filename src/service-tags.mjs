import { brandNames, brandIcon } from './brand-icons.mjs';
import { normalizeQuery } from './search-model.mjs';

export function serviceTagCatalog(knownTags = {}) {
  return [...brandNames()].sort().map(id => {
    const { label } = brandIcon(id);
    const aliases = [...new Set([knownTags[id]?.label, ...(knownTags[id]?.aliases ?? [])].filter(value => value && value !== id && value !== label))];
    return { id, label, aliases };
  });
}

export function publishedServiceTag({ id, label, aliases }, tags) {
  const identity = [id, label].map(normalizeQuery);
  const alternatives = aliases.map(normalizeQuery);
  const rank = tag => tag === id ? 0 : tag === label ? 1 : identity.includes(normalizeQuery(tag)) ? 2 : alternatives.includes(normalizeQuery(tag)) ? 3 : 4;
  return Object.keys(tags).filter(tag => rank(tag) < 4).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'ko'))[0];
}

export function serviceRailItems(items, catalog, tags) {
  if (!items.length) return [];
  return [...new Set([...items, ...catalog.filter(service => publishedServiceTag(service, tags) !== undefined).map(service => service.id)])];
}

export function serviceTagInventory(catalog, tags, home) {
  const visible = new Set(home.filter(section => section.type === 'technologies' && section.enabled !== false).flatMap(section => serviceRailItems(section.items, catalog, tags)));
  return catalog.map(service => {
    const tag = publishedServiceTag(service, tags);
    return { ...service, tag: tag ?? null, active: tag !== undefined, inRail: visible.has(service.id) };
  });
}
