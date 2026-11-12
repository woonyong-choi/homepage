export class DirectiveError extends Error {
  constructor(message, { page, line, name } = {}) {
    const where = [page, line ? `본문 ${line}줄` : '', name ? `:${name}` : '']
      .filter(Boolean)
      .join(' ');
    super(where ? `${where}: ${message}` : message);
    this.name = 'DirectiveError';
    Object.assign(this, { page, line, directive: name, detail: message });
  }
}

export function reportSyntaxError(env, error) {
  const nested = env.fenceLine !== undefined;
  const diagnostic = {
    document: env.documentId,
    severity: 'error',
    stage: 'parse',
    message: error.detail,
    line: nested ? env.fenceLine : error.line,
    directive: error.directive,
  };
  if (nested && error.line) diagnostic.nestedLine = error.line;
  env.diagnostics.push(diagnostic);
  return diagnostic;
}
