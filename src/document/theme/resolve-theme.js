import { COMPONENT_SHAPES } from './components.js';

export class ThemeError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ThemeError';
  }
}

export function resolveComponents(baseComponents, custom) {
  if (custom === undefined) return baseComponents;
  const overrides = custom.components ?? {};
  const merged = { ...baseComponents };
  for (const [name, replacement] of Object.entries(overrides)) {
    if (!Object.hasOwn(COMPONENT_SHAPES, name)) {
      throw new ThemeError(
        `unsupported theme component: ${name} (supported: ${Object.keys(COMPONENT_SHAPES).join(', ')})`,
      );
    }
    merged[name] = checkShape(name, replacement);
  }
  return Object.freeze(merged);
}

function checkShape(name, replacement) {
  const methods = COMPONENT_SHAPES[name];
  if (methods === null) {
    if (typeof replacement !== 'function')
      throw new ThemeError(`theme component ${name} must be a function`);
    return replacement;
  }
  for (const method of methods) {
    if (typeof replacement?.[method] !== 'function') {
      throw new ThemeError(`theme component ${name} must provide ${method}()`);
    }
  }
  return Object.fromEntries(methods.map((method) => [method, replacement[method]]));
}
