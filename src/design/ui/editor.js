import { escape, id, out, safeUrl, slot } from './html.js';

const BUTTON_VARIANTS = ['primary', 'secondary', 'quiet', 'link'];
const ACTION = /^[a-z][a-z-]*$/;

export function Button({ label, variant = 'secondary', type = 'button', action, disabled = false, hidden = false, pressed, controls, context }) {
  if (!BUTTON_VARIANTS.includes(variant)) throw new Error(`Unknown button variant: ${variant}`);
  if (!['button', 'submit'].includes(type)) throw new Error(`Unknown button type: ${type}`);
  if (action !== undefined && !ACTION.test(action)) throw new Error(`Invalid button action: ${action}`);
  const variantClass = variant === 'secondary' ? '' : ` is-${variant}`;
  const expands = controls === undefined ? '' : ` aria-controls="${id(controls)}" aria-expanded="false"`;
  const named = context === undefined ? '' : `<span class="app-sr"> · ${escape(context)}</span>`;
  return out(`<button type="${type}" class="app-button${variantClass}"${action ? ` data-action="${action}"` : ''}${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}${expands}${disabled ? ' disabled' : ''}${hidden ? ' hidden' : ''}>${escape(label)}${named}</button>`);
}

export function LinkButton({ label, href, variant = 'secondary', external = false, hidden = false }) {
  if (!BUTTON_VARIANTS.includes(variant)) throw new Error(`Unknown button variant: ${variant}`);
  return out(`<a class="app-button${variant === 'secondary' ? '' : ` is-${variant}`}" href="${safeUrl(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}${hidden ? ' hidden' : ''}>${escape(label)}</a>`);
}

export function TextArea({ id: name, name: field = name, label, value = '', placeholder = '', rows = 4, variant = 'field', labelVisible = true, maxLength, describedBy }) {
  if (!['field', 'title', 'source'].includes(variant)) throw new Error(`Unknown textarea variant: ${variant}`);
  if (!Number.isInteger(rows) || rows < 1) throw new Error('TextArea rows must be a positive integer');
  if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 1)) throw new Error('TextArea maxLength must be a positive integer');
  return out(`<label class="${labelVisible ? 'app-field-label' : 'app-sr'}" for="${id(name)}">${escape(label)}</label><textarea class="app-textarea${variant === 'field' ? '' : ` is-${variant}`}" id="${name}" name="${escape(field)}" rows="${rows}"${maxLength ? ` maxlength="${maxLength}"` : ''}${placeholder ? ` placeholder="${escape(placeholder)}"` : ''}${describedBy ? ` aria-describedby="${id(describedBy)}"` : ''} spellcheck="${variant === 'source' ? 'false' : 'true'}">${escape(value)}</textarea>`);
}

export function Field({ control, hint, hintId }) {
  if (hint && !hintId) throw new Error('Field hint requires hintId');
  return out(`<div class="app-field">${slot(control, 'field control')}${hint ? `<p class="app-field-hint" id="${id(hintId)}">${escape(hint)}</p>` : ''}</div>`);
}


