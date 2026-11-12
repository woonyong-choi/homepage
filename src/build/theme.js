import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const THEME_ROOT = fileURLToPath(new URL('../design/dist/', import.meta.url));
export const THEME_MANIFEST = JSON.parse(readFileSync(new URL('manifest.json', `file://${THEME_ROOT}`), 'utf8'));
