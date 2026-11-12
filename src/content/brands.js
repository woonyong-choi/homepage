import { getIconCatalog, iconFile } from '../design/build/icons.js';

export function brandIcon(name) {
  const brand = getIconCatalog().brands[name];
  return brand && Object.freeze({ label: brand.label, src: `/theme/assets/icons/${iconFile(name)}` });
}

export function brandNames() {
  return new Set(Object.keys(getIconCatalog().brands));
}
