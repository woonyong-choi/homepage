import { createDefaultComponents } from './components.js';

const THEME_DIR = new URL('../../design/dist/', import.meta.url);
let loading;

export const DEFAULT_THEME_FILES = Object.freeze({
  root: THEME_DIR,
  tokens: 'tokens.css',
  styles: 'styles.css',
  runtimeDir: 'ui/runtime/',
  iconCatalog: 'assets/icons/catalog.json',
});

export function loadDefaultTheme() {
  loading ??= importTheme();
  return loading;
}

async function importTheme() {
  const [ui, icons, svg, manifest] = await Promise.all([
    import('#design/ui/index.js'),
    import('../../design/build/icons.js'),
    import('#design/ui/svg.js'),
    import('#design/ui/manifest.js'),
  ]);
  return {
    name: 'default',
    ui,
    icons,
    svg,
    runtimeFor: manifest.runtimeEntrypoints,
    components: createDefaultComponents(),
  };
}
