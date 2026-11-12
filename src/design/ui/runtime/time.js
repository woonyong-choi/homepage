export function cssTimeMs(value) {
  const text = value.trim();
  const amount = Number.parseFloat(text);
  if (!Number.isFinite(amount) || amount < 0 || !/m?s$/.test(text)) throw new TypeError(`Invalid CSS duration: ${value}`);
  return amount * (text.endsWith('ms') ? 1 : 1000);
}
