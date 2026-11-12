import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readTokens } from './tokens.js';
import { themeTable, resolveValue, tokensCss } from './token-css.js';
import { flattenStyle } from './style-source.js';
import { parseIconSvg } from '../ui/svg.js';

const serialize = value => JSON.stringify(value, null, 2) + '\n';
export const digest = value => createHash('sha256').update(value).digest('hex');
function filesIn(folder, prefix) {
  return Object.fromEntries(readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const name = `${prefix}${entry.name}`;
    return entry.isDirectory() ? Object.entries(filesIn(join(folder, entry.name), `${name}/`)) : [[name, readFileSync(join(folder, entry.name))]];
  }));
}
export function buildDesign(root) {
  const source = readTokens(root);
  const table = themeTable(source);
  const css = flattenStyle(join(root, 'styles/index.css'), join(root, 'styles'));
  const files = {
    'tokens.css': tokensCss(source),
    'styles.css': css.replace(/breakpoint\(([\w-]+)\)/g, (_, name) => resolveValue(table, `breakpoint.${name}`)),
    ...Object.fromEntries(Object.entries(filesIn(join(root, 'assets'), 'assets/')).filter(([name]) => !name.endsWith('/AGENTS.md'))), ...filesIn(join(root, 'ui'), 'ui/'),
  };
  const cssPaths = new Map([...table.keys()].map(name => [`--${name.replaceAll('.', '-')}`, name]));
  const bind = content => content.toString().replace(/var\((--[\w-]+)\)/g, (_, name) => {
    if (!cssPaths.has(name)) throw new Error(`unknown asset token: ${name}`);
    return resolveValue(table, cssPaths.get(name));
  });
  const iconSources = Object.fromEntries(Object.entries(files).filter(([name]) => /^assets\/icons\/.+\.svg$/.test(name)).map(([name, content]) => [name, content.toString()]));
  for (const name of Object.keys(files).filter(name => /^assets\/(?:icons|illustrations)\/.+\.svg$/.test(name))) files[name] = bind(files[name]);
  if (files['assets/giscus.css']) files['assets/giscus.css'] = bind(files['assets/giscus.css']);
  const catalog = JSON.parse(files['assets/icons/catalog.json']);
  if (catalog.version !== 2) throw new Error('unsupported icon catalog');
  catalog.icons = {};
  for (const file of Object.keys(files).filter(name => name.startsWith('assets/icons/') && name.endsWith('.svg')).sort()) {
    const match = /^assets\/icons\/([a-z][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)\.svg$/.exec(file);
    if (!match) throw new Error(`icon must be category/file.svg: ${file}`);
    const [, category, name] = match;
    if (!Object.hasOwn(catalog.categories, category) || Object.hasOwn(catalog.icons, name)) throw new Error(`invalid icon category or duplicate name: ${file}`);
    const svg = files[file].toString();
    try { parseIconSvg(iconSources[file]); parseIconSvg(svg); } catch (error) { throw new Error(`${file}: ${error.message}`); }
    const title = /<title>([^<>]*)<\/title>/.exec(svg)?.[1];
    catalog.icons[name] = { file: `${category}/${name}.svg`, category, label: catalog.brands[name]?.label ?? title ?? name.replaceAll('-', ' ') };
  }
  for (const [alias, name] of Object.entries(catalog.aliases)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(alias) || Object.hasOwn(catalog.icons, alias) || !Object.hasOwn(catalog.icons, name)) throw new Error(`invalid icon alias: ${alias}`);
  }
  const iconName = name => Object.hasOwn(catalog.icons, name) ? name : catalog.aliases[name];
  for (const group of ['controls', 'articles', 'social', 'kinds']) for (const name of Object.values(catalog[group])) {
    if (!iconName(name)) throw new Error(`unknown ${group} icon: ${name}`);
  }
  for (const library of catalog.libraries) if (!Object.hasOwn(files, `assets/icons/${library.notice}`)) throw new Error(`missing icon notice: ${library.name}`);
  for (const [name, brand] of Object.entries(catalog.brands)) {
    if (!Object.hasOwn(catalog.icons, name) || !catalog.libraries.some(library => library.name === brand.library) || !/^https:\/\//.test(brand.source)) throw new Error(`invalid brand source: ${name}`);
    if (brand.notice && !Object.hasOwn(files, `assets/icons/${brand.notice}`)) throw new Error(`missing brand notice: ${name}`);
  }
  files['assets/icons/catalog.json'] = serialize(catalog);
  const roles = Object.fromEntries(['controls', 'articles', 'social'].map(group => [group, catalog[group]]));
  const names = [...new Set(Object.values(roles).flatMap(group => Object.values(group)).map(iconName))];
  const graphics = Object.fromEntries(names.map(name => [name, iconSources[`assets/icons/${catalog.icons[name].file}`]]));
  files['ui/icon-data.js'] = `// assets/icons: 생성물, 손으로 고치지 않음\nexport const ICON_ROLES = Object.freeze(${serialize(roles).trim()});\nexport const ICON_DATA = Object.freeze(${serialize(graphics).trim()});\n`;
  const hashes = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([name, content]) => [name, digest(content)]));
  files['manifest.json'] = serialize({ schemaVersion: 1, files: hashes, contentHash: digest(serialize(hashes)) });
  return files;
}
