const ID = /^[\w-]+$/;

export const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function safeUrl(value) {
  if (typeof value !== 'string' || /[\u0000- \\]/u.test(value) || !/^(?:https?:\/\/|mailto:|\/(?!\/)|#)/.test(value)) throw new Error(`Unsupported URL: ${value}`);
  return escape(value);
}

class Trusted {
  constructor(html) { this.html = String(html); }
  toString() { return this.html; }
}
export const trusted = (html) => new Trusted(html);
export const isTrusted = (value) => value instanceof Trusted;

export function slot(value, name) {
  if (!isTrusted(value)) throw new TypeError(`${name} must be trusted(html)`);
  return value.html;
}
export function id(value) {
  if (typeof value !== 'string' || !ID.test(value)) throw new TypeError(`Invalid id: ${value}`);
  return value;
}
export const out = (html) => trusted(html);
