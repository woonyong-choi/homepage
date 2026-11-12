import * as ui from '#design/ui/index.js';

export function documentOutline(headings) {
  if (!headings.some(heading => heading.level <= 3)) return undefined;
  return ui.DocumentOutline({ sections: headings.filter(heading => heading.level <= 3)
    .map(heading => ({ ...heading, level: Math.max(2, heading.level) })) });
}
