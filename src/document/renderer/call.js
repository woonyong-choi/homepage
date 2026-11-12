export function attemptComponent(render, name, method, props, line) {
  try {
    const component = render.components[name];
    const result = (method === undefined ? component : component[method])(
      structuredClone(props),
      render.kit,
    );
    if (typeof result !== 'string' && !render.kit.ui.isTrusted(result)) {
      throw new TypeError(
        `component ${name}${method ? `.${method}` : ''} must return an HTML string`,
      );
    }
    return { html: String(result), failed: false };
  } catch (error) {
    return {
      html: reportRenderFailure(render, error, { component: name, method, line }),
      failed: true,
    };
  }
}

export function callComponent(render, name, method, props, line) {
  return attemptComponent(render, name, method, props, line).html;
}

export function describeError(value) {
  try {
    if (value instanceof Error) return String(value.message);
    return String(value);
  } catch {
    return 'unknown error';
  }
}

export function reportRenderFailure(render, error, { component, method, line }) {
  const message = describeError(error);
  render.diagnostics.push({
    document: render.documentId,
    severity: 'error',
    stage: 'render',
    component: method ? `${component}.${method}` : component,
    message,
    line,
  });
  return errorBlock(render, message);
}

export function errorBlock(render, message) {
  const { ui } = render.kit;
  return String(
    ui.Callout({
      title: '문서 오류',
      tone: 'warning',
      body: ui.trusted(`<p>${ui.escape(message)}</p>`),
    }),
  );
}
