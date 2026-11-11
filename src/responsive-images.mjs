// 본문 그림을 화면에 맞는 크기로 줄인 사본을 만들고, 그림 태그에 크기와 원본 주소를 적는다.
// 원본은 그대로 싣고 확대 창(data-full)에서만 불러온다.
import sharp from 'sharp';

/** 본문 폭 680px의 두 배. 이보다 넓은 정지 그림만 줄인다. */
export const DISPLAY_WIDTH = 1360;
const IMAGE = /^\/assets\/[^?#]+\.(png|jpe?g|gif)$/i;

async function variant(path, content) {
  const animated = /\.gif$/i.test(path);
  const meta = await sharp(content, { animated, limitInputPixels: false }).metadata();
  const size = [meta.width, meta.pageHeight ?? meta.height];
  const base = path.replace(/\.[^.]+$/, '');
  if (animated) {
    const data = await sharp(content, { animated, limitInputPixels: false }).webp({ quality: 80, effort: 4 }).toBuffer();
    return data.length < content.length * 0.8 ? { size, path: `${base}.webp`, data, full: false, replaces: true } : { size };
  }
  if (meta.width <= DISPLAY_WIDTH) return { size };
  const data = await sharp(content).resize({ width: DISPLAY_WIDTH }).webp({ quality: 82 }).toBuffer();
  return { size, path: `${base}.w${DISPLAY_WIDTH}.webp`, data, full: true };
}

/** output의 HTML과 검색 색인의 그림 주소를 사본으로 바꾸고, 사본을 assets에 더한다. */
export async function responsiveImages(output, assets, entries = []) {
  const variants = new Map();
  for (const [path, content] of [...assets]) {
    if (!IMAGE.test(path)) continue;
    const made = await variant(path, content);
    variants.set(path, made);
    if (made.path) assets.set(made.path, made.data);
    if (made.replaces) assets.delete(path);
  }
  const rewrite = html => html.replace(/<img\s[^>]*>/g, tag => {
    const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
    const made = variants.get(src);
    if (!made) return tag;
    let next = tag;
    if (!/\swidth="/.test(next)) next = next.replace(/\ssrc="/, ` width="${made.size[0]}" height="${made.size[1]}" src="`);
    if (made.path) next = next.replace(` src="${src}"`, ` src="${made.path}"${made.full ? ` data-full="${src}"` : ''}`);
    return next;
  });
  for (const [route, html] of output) output.set(route, rewrite(html));
  for (const entry of entries) {
    const made = variants.get(entry.thumbnail?.src);
    if (made?.path) entry.thumbnail = { ...entry.thumbnail, src: made.path };
  }
}
