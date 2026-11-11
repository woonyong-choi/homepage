import { fileURLToPath } from 'node:url';
import { buildTables, readSource, resolveColor } from '../scripts/lib/tokens.mjs';
export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const tables = buildTables(readSource(ROOT));
export const colorOf = (mode, name) => resolveColor(tables[mode], `color.${name}`);
