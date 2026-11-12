import { existsSync } from 'node:fs';

export const documentAssets = {
  exists: name => typeof name === 'string' && /^[\w.-]+$/.test(name) && existsSync(new URL(`../../content/assets/${name}`, import.meta.url)),
};
