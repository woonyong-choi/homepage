import { escape, out, slot } from './html.js';
import { ControlIcon } from './icons.js';

export function ToolIcon(name) {
  return String(ControlIcon(name, 'app-tool-icon'));
}

export function ToolButton({ action, label, icon, className = '', hidden = false, zoom }) {
  if (!/^[a-z][a-z-]*$/.test(action) || !/^[a-z -]*$/.test(className)) throw new Error('Invalid tool button');
  if (zoom !== undefined && !['in', 'out', 'fit'].includes(zoom)) throw new Error('Invalid zoom action');
  return out(`<button type="button" class="app-tool-button${className ? ` ${className}` : ''}" data-tool="${action}" aria-label="${escape(label)}" title="${escape(label)}"${hidden ? ' hidden' : ''}${zoom ? ` data-zoom="${zoom}"` : ''}>${ToolIcon(icon)}</button>`);
}

export function Toolbar({ label, buttons, extra }) {
  return out(`<div class="app-toolbar" role="toolbar" aria-label="${escape(label)}"><span class="app-tool-status app-sr" data-tool-status role="status" aria-live="polite" aria-atomic="true"></span>${buttons.map(button => slot(button, 'tool button')).join('')}${extra === undefined ? '' : slot(extra, 'extra tools')}</div>`);
}

export function ToolHeader({ label = '', toolbar, row = false }) {
  return out(`<div class="app-tool-header${row ? ' is-row' : ''}">${label ? `<span class="app-tool-label">${escape(label)}</span>` : ''}${slot(toolbar, 'toolbar')}</div>`);
}
