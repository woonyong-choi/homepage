export function createKit(theme, context, usedAssets) {
  const { ui, icons, svg } = theme;
  const { escape, safeUrl, trusted } = ui;

  function asset(name) {
    if (typeof name !== 'string' || !/^[\w.-]+$/.test(name)) {
      throw new Error(`Invalid asset: ${name}`);
    }
    const url = context.assets?.url ? context.assets.url(name) : `/assets/${name}`;
    if (typeof url !== 'string') throw new TypeError(`asset url must be a string: ${name}`);
    safeUrl(url);
    if (!usedAssets.has(name)) usedAssets.set(name, url);
    return url;
  }

  const isDimension = (value) => Number.isSafeInteger(value) && value > 0;
  function imageSize(name) {
    const size = context.assets?.size?.(name);
    if (size === undefined) return undefined;
    if (
      !Array.isArray(size) ||
      size.length !== 2 ||
      !isDimension(size[0]) ||
      !isDimension(size[1])
    ) {
      throw new TypeError(`Invalid image size: ${name}`);
    }
    return [size[0], size[1]];
  }

  function image(name, alt = '', className = '') {
    const url = asset(name);
    const size = imageSize(name);
    const dimensions = size ? ` width="${size[0]}" height="${size[1]}"` : '';
    return `<img${dimensions} class="${escape(className)}" src="${safeUrl(url)}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
  }

  function contentIcon(spec, size = 'card', variant = 'default') {
    const { name, kind } = typeof spec === 'string' ? { name: spec } : spec;
    let badge;
    if (kind !== undefined && size !== 'small') {
      const { kinds } = icons.getIconCatalog();
      if (!Object.hasOwn(kinds, kind)) throw new Error(`unknown icon kind: ${kind}`);
      badge = trusted(svg.renderSvgIcon(icons.readIcon(kinds[kind])));
    }
    const graphic = trusted(svg.renderSvgIcon(icons.readIcon(name, { variant })));
    return String(ui.ContentIcon({ size, graphic, badge }));
  }

  function deviceOverlay() {
    const name = context.deviceOverlay;
    return name === undefined ? undefined : trusted(image(name, '', 'app-device-overlay'));
  }

  return { ui, escape, safeUrl, trusted, asset, imageSize, image, contentIcon, deviceOverlay };
}
