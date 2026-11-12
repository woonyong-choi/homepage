import { readFileSync } from 'node:fs';

const ROOT = new URL('../dist/assets/icons/', import.meta.url);
const FILE = /^[a-z][a-z0-9-]*\/[a-z0-9][a-z0-9-]*\.svg$/;
const files = new Map();
let catalog;

export function getIconCatalog() {
  if (catalog) return catalog;
  const parsed = JSON.parse(readFileSync(new URL('catalog.json', ROOT), 'utf8'));
  if (parsed.version !== 2 || !parsed.icons || !parsed.aliases) throw new Error('unsupported icon catalog');
  catalog = parsed;
  return catalog;
}

export function iconFile(name, { variant = 'default' } = {}) {
  if (variant !== 'default' && variant !== 'detail') throw new Error(`unknown icon variant: ${variant}`);
  const { icons, aliases } = getIconCatalog();
  const target = Object.hasOwn(icons, name) ? name : aliases[name];
  if (typeof target !== 'string' || !Object.hasOwn(icons, target)) throw new Error(`unknown icon: ${name}`);
  const selected = variant === 'detail' && Object.hasOwn(icons, `${target}-detail`) ? `${target}-detail` : target;
  const file = icons[selected].file;
  if (typeof file !== 'string' || !FILE.test(file)) throw new Error(`invalid icon file: ${selected}`);
  return file;
}

export function readIcon(name, options) {
  const file = iconFile(name, options);
  if (!files.has(file)) files.set(file, readFileSync(new URL(file, ROOT), 'utf8'));
  return files.get(file);
}
