export function resolveCodeAlias(info, aliases) {
  const word = info.trim().split(/\s+/)[0].toLowerCase();
  const alias = aliases && Object.hasOwn(aliases, word) ? aliases[word] : undefined;
  if (typeof alias?.language !== 'string') return { info };
  return { info: alias.language, label: typeof alias.label === 'string' ? alias.label : undefined };
}
