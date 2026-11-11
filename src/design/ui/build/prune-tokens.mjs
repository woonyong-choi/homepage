import postcss from 'postcss';

/** CSS 참조와 getPropertyValue의 문자열을 시작점으로 모든 모드의 참조 폐쇄를 보존한다. */
export function pruneTokens(css, usage) {
  const ast = postcss.parse(css);
  const declarations = new Map();
  ast.walkDecls(/^--/, declaration => {
    const values = declarations.get(declaration.prop) ?? [];
    values.push(declaration.value);
    declarations.set(declaration.prop, values);
  });
  const names = source => [...source.matchAll(/--[a-zA-Z][\w-]*/g)].map(match => match[0]);
  const used = new Set(names(usage));
  for (const name of used) for (const value of declarations.get(name) ?? []) for (const reference of names(value)) used.add(reference);
  ast.walkDecls(/^--/, declaration => { if (!used.has(declaration.prop)) declaration.remove(); });
  ast.walkRules(rule => { if (!rule.nodes.length) rule.remove(); });
  return ast.toString();
}

/**
 * 화면 테마를 하나로 고정한 사이트(<html data-theme="light">)에서는 다른 테마의 값이 쓰일 일이 없다.
 * 라이트로 고정하면 다크 미디어 질의, [data-theme=dark] 블록, :root와 같은 값을 되풀이하는 [data-theme=light] 블록을 뺀다.
 */
export function fixThemeScheme(css, scheme) {
  if (scheme === undefined) return css;
  if (scheme !== 'light') throw new Error(`unsupported fixed scheme: ${scheme}`);
  const ast = postcss.parse(css);
  ast.walkAtRules('media', rule => { if (/prefers-color-scheme:\s*dark/.test(rule.params)) rule.remove(); });
  ast.walkRules(rule => { if (/^\[data-theme=['"]?(dark|light)['"]?\]$/.test(rule.selector.trim())) rule.remove(); });
  return ast.toString();
}
