import { escape, slot, out } from './html.js';

export function Table({ body, ...props }) {
  return out(`${Table.open(props)}${slot(body, 'table body')}${Table.close()}`);
}

Table.open = ({ caption, label = caption ?? '표' } = {}) => `<div class="app-table-scroll" tabindex="0" role="region" aria-label="${escape(label)}"><table class="app-table">${caption ? `<caption>${escape(caption)}</caption>` : ''}`;
Table.close = () => '</table></div>';
