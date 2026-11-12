import sharp from 'sharp';

export const DISPLAY_WIDTHS = Object.freeze([720, 1360]);
const IMAGE = /^\/assets\/[^?#]+\.(png|jpe?g|gif)$/i;
const SIZES = Object.freeze({
  card: '(max-width: 600px) 100vw, 360px',
  prose: '(max-width: 740px) 100vw, 680px',
});
const OPEN = { animated: true, limitInputPixels: false };

async function variant(path, content) {
  const animated = /\.gif$/i.test(path);
  const meta = await sharp(content, { ...OPEN, animated }).metadata();
  const size = [meta.width, meta.pageHeight ?? meta.height];
  const base = path.replace(/\.[^.]+$/, '');
  if (animated) {
    const data = await sharp(content, OPEN).webp({ quality: 80, effort: 4 }).toBuffer();
    return data.length < content.length * 0.8 ? { size, files: [{ path: `${base}.webp`, data, width: meta.width }], replaces: true } : { size, files: [] };
  }
  const widths = DISPLAY_WIDTHS.filter(width => width < meta.width);
  const files = [];
  for (const width of widths) {
    files.push({ path: `${base}.w${width}.webp`, data: await sharp(content, { limitInputPixels: false }).resize({ width }).webp({ quality: 82 }).toBuffer(), width });
  }
  return { size, files };
}

function rewriteTag(tag, made, context) {
  const src = /\ssrc="([^"]+)"/.exec(tag)[1];
  let next = tag;
  if (!/\swidth="/.test(next)) next = next.replace(/\ssrc="/, ` width="${made.size[0]}" height="${made.size[1]}" src="`);
  if (/\sloading="eager"/.test(next) && !/\sfetchpriority=/.test(next)) next = next.replace(/\sloading="eager"/, ' loading="eager" fetchpriority="high"');
  if (!made.files.length) return next;
  if (made.replaces) return next.replace(` src="${src}"`, ` src="${made.files[0].path}"`);
  const largest = made.files.at(-1);
  const srcset = made.files.map(file => `${file.path} ${file.width}w`).join(', ');
  return next.replace(` src="${src}"`, ` src="${largest.path}" srcset="${srcset}" sizes="${SIZES[context]}" data-full="${src}"`);
}

export async function responsiveImages(output, assets, entries = []) {
  const variants = new Map();
  for (const [path, content] of [...assets]) {
    if (!IMAGE.test(path)) continue;
    const made = await variant(path, content);
    variants.set(path, made);
    for (const file of made.files) assets.set(file.path, file.data);
    if (made.replaces) assets.delete(path);
  }
  const rewrite = html => html.replace(/<img\s[^>]*>/g, (tag, at) => {
    const made = variants.get(/\ssrc="([^"]+)"/.exec(tag)?.[1]);
    if (!made) return tag;
    const context = /class="app-blog-cover"[^<]*$/.test(html.slice(Math.max(0, at - 80), at)) ? 'card' : 'prose';
    return rewriteTag(tag, made, context);
  });
  for (const [route, html] of output) output.set(route, rewrite(html));
  for (const entry of entries) {
    const made = variants.get(entry.thumbnail?.src);
    if (made?.files.length) entry.thumbnail = { ...entry.thumbnail, src: made.files[0].path };
  }
}
