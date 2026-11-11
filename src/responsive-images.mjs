// 본문·카드 그림을 화면에 맞는 크기로 줄인 사본을 만들고, 그림 태그에 크기·후보 목록(srcset)·원본 주소를 적는다.
// 원본은 그대로 싣고 확대 창(data-full)에서만 불러온다.
import sharp from 'sharp';

/** 줄인 사본의 폭. 카드(한 줄 3장, 화면 약 360px)의 두 배와 본문 폭 680px의 두 배다. */
export const DISPLAY_WIDTHS = Object.freeze([720, 1360]);
const IMAGE = /^\/assets\/[^?#]+\.(png|jpe?g|gif)$/i;
// 그림이 화면에서 차지하는 폭. 브라우저가 이 값으로 후보 가운데 하나를 고른다.
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
    // 움직이는 그림은 같은 크기의 webp로 바꿔 용량만 줄인다. 줄지 않으면 원본을 쓴다.
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
  // 원본보다 작은 사본만 후보로 둔다. 기본 주소는 가장 큰 사본, 확대 창은 원본을 연다.
  const largest = made.files.at(-1);
  const srcset = made.files.map(file => `${file.path} ${file.width}w`).join(', ');
  return next.replace(` src="${src}"`, ` src="${largest.path}" srcset="${srcset}" sizes="${SIZES[context]}" data-full="${src}"`);
}

/** output의 HTML과 검색 색인의 그림 주소를 사본으로 바꾸고, 사본을 assets에 더한다. */
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
  // 검색 결과 카드는 브라우저에서 그리므로 카드 폭에 맞는 가장 작은 사본 하나를 쓴다.
  for (const entry of entries) {
    const made = variants.get(entry.thumbnail?.src);
    if (made?.files.length) entry.thumbnail = { ...entry.thumbnail, src: made.files[0].path };
  }
}
