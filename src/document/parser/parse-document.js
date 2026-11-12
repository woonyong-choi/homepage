import { finalizeDocument } from './finalize.js';
import { createParser } from './markdown.js';
import { createEnv } from './units.js';

let parser;

export function parseDocumentSync(source, context = {}) {
  if (typeof source !== 'string') throw new TypeError('source must be a string');
  if (typeof context.id !== 'string' || context.id === '') {
    throw new TypeError('context.id must be a non-empty string');
  }
  if (context.pageId !== undefined && !/^[\w-]+$/.test(context.pageId)) {
    throw new TypeError(`pageId must match [\\w-]+: ${context.pageId}`);
  }
  parser ??= createParser();
  const env = createEnv(context);
  const tokens = parser.parse(source, env);
  const { headings, links } = finalizeDocument({ tokens, env });
  return {
    version: 1,
    id: context.id,
    pageId: context.pageId,
    tokens,
    env,
    metadata: { headings, links },
    diagnostics: env.diagnostics,
  };
}
