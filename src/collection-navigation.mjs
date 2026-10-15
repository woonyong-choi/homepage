import * as ui from '@woonyong-choi/design-tokens/ui/index.mjs';

export function collectionNavigation(result, route, { label = '목록 페이지', before = '이전', after = '다음', summary } = {}) {
  if (result.totalPages <= 1) return '';
  const href = page => page === 1 ? route : `${route}page/${page}/`;
  return String(ui.PageLinks({
    label,
    before: result.page > 1 ? { href: href(result.page - 1), text: before } : undefined,
    after: result.page < result.totalPages ? { href: href(result.page + 1), text: after } : undefined,
    numbers: Array.from({ length: result.totalPages }, (_, i) => ({ page: i + 1, href: href(i + 1), current: i + 1 === result.page })),
    summary,
  }));
}
