import { getIconCatalog, iconFile } from '#design/ui/build/icons.mjs';

export function brandIcon(name) {
  const brand = getIconCatalog().brands[name];
  return brand && Object.freeze({ label: brand.label, src: `/theme/assets/icons/${iconFile(name)}` });
}

export function brandNames() {
  return new Set(Object.keys(getIconCatalog().brands));
}
