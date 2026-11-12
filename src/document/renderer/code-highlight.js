export { resolveCodeAlias } from './code-alias.js';

let loading;

export const HIGHLIGHT_TIME_LIMIT_MS = 500;

const LANGUAGE_NAME = /^[\w+#.-]+$/;
const PLAIN = Object.freeze({ id: 'plaintext', label: 'Plain text' });
const PLAIN_NAMES = new Set(['plaintext', 'text', 'txt']);

const SCOPES = Object.freeze([
  [/^(?:comment|punctuation\.definition\.comment)(?:\.|$)/, 'comment'],
  [
    /^(?:support\.type\.property-name|punctuation\.support\.type\.property-name|entity\.other\.attribute-name|entity\.name\.tag\.yaml|support\.variable\.property)(?:\.|$)/,
    'property',
  ],
  [/^(?:variable\.(?:other\.)?(?:object\.)?property|meta\.attribute\.python)(?:\.|$)/, 'property'],
  [/^variable\.parameter(?:\.|$)/, 'parameter'],
  [
    /^(?:entity\.name\.(?:function|command)|support\.function|meta\.function-call\.generic\.python)(?:\.|$)/,
    'function',
  ],
  [
    /^(?:entity\.name\.(?:type|class|namespace)|support\.(?:type|class)|storage\.type\.(?:(?:primitive|generic|object|array)\.)?java)(?:\.|$)/,
    'type',
  ],
  [
    /^(?:entity\.name\.annotation|storage\.type\.annotation|meta\.annotation\.identifier)(?:\.|$)/,
    'annotation',
  ],
  [/^(?:keyword\.operator|keyword\.control\.ternary\.java)(?:\.|$)/, 'operator'],
  [/^storage\.modifier\.import\.java$/, undefined],
  [
    /^(?:keyword|storage|constant\.language|variable\.language|entity\.name\.tag)(?:\.|$)/,
    'keyword',
  ],
  [/^constant\.numeric(?:\.|$)/, 'number'],
  [/^(?:constant\.character\.escape|punctuation\.definition\.string|string)(?:\.|$)/, 'string'],
  [/^(?:constant|variable\.other\.constant)(?:\.|$)/, 'constant'],
  [/^variable(?:\.|$)/, 'variable'],
  [/^punctuation(?:\.|$)/, 'punctuation'],
]);

const FALLBACK_ROLES = Object.freeze({
  keyword: 'keyword',
  literal: 'keyword',
  string: 'string',
  regexp: 'string',
  number: 'number',
  symbol: 'constant',
  bullet: 'punctuation',
  title: 'function',
  section: 'function',
  name: 'keyword',
  attr: 'property',
  attribute: 'property',
  built_in: 'function',
  type: 'type',
  class: 'type',
  'selector-tag': 'type',
  'selector-class': 'type',
  'selector-id': 'property',
  variable: 'variable',
  'template-variable': 'variable',
  params: 'parameter',
  comment: 'comment',
  quote: 'comment',
  meta: 'annotation',
  operator: 'operator',
  punctuation: 'punctuation',
});

export function loadHighlighter() {
  loading ??= createEngine();
  return loading;
}

async function createEngine() {
  const [{ default: hljs }, { bundledLanguages, createHighlighter }] = await Promise.all([
    import('highlight.js'),
    import('shiki'),
  ]);
  const languages = collectLanguages(hljs, bundledLanguages);
  const highlighter = await createHighlighter({ langs: [], themes: [] });
  const loaded = new Set();
  const lookup = (info = '') => {
    const word = info.trim().split(/\s+/)[0].toLowerCase();
    return LANGUAGE_NAME.test(word) ? languages.get(word) : undefined;
  };
  return {
    codeLanguage(info = '') {
      const language = lookup(info);
      return language ? { id: language.id, label: language.label } : PLAIN;
    },
    async prepare(infos) {
      const grammars = new Set();
      for (const info of infos) {
        const grammar = lookup(info)?.grammar;
        if (grammar && !loaded.has(grammar)) grammars.add(grammar);
      }
      if (!grammars.size) return;
      await highlighter.loadLanguage(...grammars);
      for (const grammar of grammars) loaded.add(grammar);
    },
    highlightCode(source, language, ui, { timeLimit = HIGHLIGHT_TIME_LIMIT_MS } = {}) {
      const grammar = languages.get(language)?.grammar;
      if (grammar && loaded.has(grammar)) {
        return textMateCode(highlighter.getLanguage(grammar), source, ui, timeLimit);
      }
      if (grammar || PLAIN_NAMES.has(language) || !languages.has(language)) {
        return ui.escape(source);
      }
      return hljs
        .highlight(source, { language, ignoreIllegals: true })
        .value.replace(/class="([^"]+)"/g, (_, classes) => {
          const names = classes.split(' ');
          const role = names.includes('class_')
            ? 'type'
            : FALLBACK_ROLES[names[0].replace(/^hljs-/, '')];
          return role ? `class="${ui.syntaxClass(role)}"` : '';
        });
    },
  };
}

function collectLanguages(hljs, bundledLanguages) {
  const languages = new Map();
  for (const language of hljs.listLanguages()) {
    const definition = hljs.getLanguage(language);
    const names = [language, ...(definition.aliases ?? [])];
    const grammar = names.find((name) => bundledLanguages[name]);
    for (const id of names) {
      languages.set(id, {
        id,
        label: definition.name ?? language,
        grammar: bundledLanguages[id] ? id : grammar,
      });
    }
  }
  return languages;
}

function textMateCode(grammar, source, ui, timeLimit) {
  const deadline = performance.now() + timeLimit;
  const parts = [];
  const append = (text, role) => {
    if (!text) return;
    const previous = parts.at(-1);
    if (previous && previous.role === role) previous.text += text;
    else parts.push({ text, role });
  };
  let state = null;
  let offset = 0;
  for (const match of source.matchAll(/[^\r\n]*(\r\n|\r|\n|$)/g)) {
    if (match.index >= source.length && match[0] === '') break;
    const line = match[0].slice(0, match[0].length - match[1].length);
    if (line) {
      const remaining = deadline - performance.now();
      if (remaining <= 0) return ui.escape(source);
      const result = grammar.tokenizeLine(line, state, Math.ceil(remaining));
      if (result.stoppedEarly) return ui.escape(source);
      for (const token of result.tokens) {
        append(line.slice(token.startIndex, token.endIndex), roleOf(token.scopes));
      }
      state = result.ruleStack;
    }
    append(match[1]);
    offset += match[0].length;
  }
  append(source.slice(offset));
  return parts.map((part) => String(ui.SyntaxToken(part))).join('');
}

function roleOf(names) {
  const javaField =
    names.includes('variable.other.definition.java') &&
    names.includes('meta.class.body.java') &&
    !names.includes('meta.method.body.java');
  if (javaField) return 'property';
  for (const scopeName of names.toReversed()) {
    const match = SCOPES.find(([pattern]) => pattern.test(scopeName));
    if (match) return match[1];
  }
  return undefined;
}
