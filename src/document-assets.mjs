import { existsSync, readFileSync } from 'node:fs';

const sizes = JSON.parse(readFileSync(new URL('../config/image-sizes.json', import.meta.url)));
export const imageSize = name => Object.hasOwn(sizes, name) ? sizes[name] : undefined;
export const documentAssets = {
  exists: name => typeof name === 'string' && /^[\w.-]+$/.test(name) && existsSync(new URL(`../content/assets/${name}`, import.meta.url)),
  size: imageSize,
};
