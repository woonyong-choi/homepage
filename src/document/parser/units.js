export function createEnv(context, parent, nested) {
  return {
    context,
    pageId: context.pageId,
    documentId: context.id,
    docId: nested === undefined ? context.pageId : undefined,
    diagnostics: parent?.diagnostics ?? [],
    idSlots: [],
    nested: nested !== undefined,
    fenceLine: nested?.fenceLine,
  };
}

export function reserveId(env, target) {
  env.idSlots.push(target);
}
