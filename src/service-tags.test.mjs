import assert from 'node:assert/strict';
import { test } from 'node:test';
import { serviceTagCatalog, serviceTagInventory, publishedServiceTag } from './service-tags.mjs';
import { brandNames } from './brand-icons.mjs';

const catalog = serviceTagCatalog({ python: { label: 'Python', aliases: ['파이썬'] }, javascript: { label: 'JavaScript', aliases: ['JS'] }, unrelated: { label: '산책' } });

test('service_catalog_covers_available_logos_before_any_post_uses_a_tag', () => {
  assert.deepEqual(catalog.map(service => service.id), [...brandNames()].sort());
  assert.equal(new Set(catalog.map(service => service.id)).size, catalog.length);
  assert.deepEqual(catalog.find(service => service.id === 'python'), { id: 'python', label: 'Python', aliases: ['파이썬'] });
  assert.equal(catalog.some(service => service.id === 'unrelated'), false);
  assert.ok(catalog.every(service => service.label && service.aliases));
});

test('service_activation_uses_published_tag_identity_and_keeps_filter_ids_exact', () => {
  const python = catalog.find(service => service.id === 'python');
  assert.equal(publishedServiceTag(python, {}), undefined);
  assert.equal(publishedServiceTag(python, { Python: {} }), 'Python');
  assert.equal(publishedServiceTag(python, { PYTHON: {} }), 'PYTHON');
  assert.equal(publishedServiceTag(python, { 파이썬: {} }), '파이썬');
  assert.equal(publishedServiceTag(python, { Python: {}, python: {}, 파이썬: {} }), 'python');
  assert.equal(publishedServiceTag(python, { 'Python 입문': {} }), undefined);
});

test('service_inventory_distinguishes_candidates_active_tags_and_rail_membership', () => {
  const home = [{ type: 'technologies', items: ['python', 'git'] }];
  const empty = serviceTagInventory(catalog, {}, home);
  assert.equal(empty.find(service => service.id === 'python').active, false);
  assert.equal(empty.find(service => service.id === 'python').inRail, true);
  assert.equal(empty.find(service => service.id === 'redis').inRail, false);
  const used = serviceTagInventory(catalog, { Redis: {} }, home).find(service => service.id === 'redis');
  assert.deepEqual({ active: used.active, tag: used.tag, inRail: used.inRail }, { active: true, tag: 'Redis', inRail: true });
  for (const sections of [[], [{ type: 'technologies', items: [] }], [{ type: 'technologies', enabled: false, items: ['python'] }]]) assert.ok(serviceTagInventory(catalog, { Redis: {} }, sections).every(service => !service.inRail));
});
