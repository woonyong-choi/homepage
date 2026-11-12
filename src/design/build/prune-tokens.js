import postcss from 'postcss';

/** 페이지·스크립트·CSS가 참조하는 변수와 그 변수가 다시 참조하는 변수만 남긴다. */
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

