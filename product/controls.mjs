// 검색과 영상 조작은 테마에서 생성한 기본 도형을 공유한다.
const sizes = { search: [24, 24], clear: [24, 24], play: [32, 32], pause: [32, 32], replay: [32, 32] };
export const videoControlAssets = ['play', 'pause', 'replay'].map(name => `/theme/assets/controls/${name}.svg`);
export function controlImage(name, className = '', base = '/things') {
  const size = sizes[name];
  if (!size || !/^[a-z -]*$/.test(className) || !['', '/things'].includes(base)) throw new Error('invalid control image');
  return `<img width="${size[0]}" height="${size[1]}" class="${className}" src="${base}/theme/assets/controls/${name}.svg" alt="" decoding="async">`;
}
