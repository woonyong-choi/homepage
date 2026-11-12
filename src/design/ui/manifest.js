export const RUNTIMES = Object.freeze({
  'document.js': /<(?:[^>]+\sdata-(?:tabs|tool|tooltip-trigger)(?:[\s=>])|figure\s[^>]*class="[^"]*\bapp-figure\b)/,
  'document-navigation.js': /<[^>]+\sdata-document-layout(?:[\s=>])/,
  'flows.js': /<[^>]+\sdata-flow-rail(?:[\s=>])/,
  'video.js': /<[^>]+\sdata-player(?:[\s=>])/,
});

export function runtimeEntrypoints(markup) {
  return Object.entries(RUNTIMES).filter(([, pattern]) => pattern.test(markup)).map(([name]) => name);
}
