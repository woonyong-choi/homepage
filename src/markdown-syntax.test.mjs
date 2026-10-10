import { parse } from 'yaml';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import hljs from 'highlight.js';
import { createMarkdown, codeLanguage } from './markdown.mjs';
import { highlightCode } from './code-highlight.mjs';
import { renderArticle } from './article-renderer.mjs';
import { shiftHeadings, feedLevels, detailLevels } from './post-article.mjs';

const md = createMarkdown();
const render = source => md.render(source, {});
const text = html => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'").replace(/&amp;/g, '&');
const codeOf = html => text(html.match(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/)[1]);
const labelOf = html => html.match(/class="app-tool-label">([^<]*)</)[1];
const fence = (info, body) => '```' + info + '\n' + body + '```\n';

test('commonmark_and_gfm_constructs_render_as_semantic_html', () => {
  const html = render([
    '# 제목 1', '## 제목 2', '###### 제목 6', '',
    '*기울임* **굵게** ~~취소~~ `코드`  ', '줄바꿈', '',
    '> 인용\n>\n> > 중첩', '',
    '1. 하나\n   - 중첩\n2. 둘', '',
    '- [x] 완료\n- [ ] 남음', '',
    '| 가 | 나 |\n|:--|--:|\n| 1 | 2 |', '',
    '---', '', '<https://example.com/> 와 https://example.org/path', '',
    '![대체](/media/a.png "제목")', '', '각주[^a]\n\n[^a]: 본문',
  ].join('\n'));
  for (const marker of ['<h1 id="', '<h6 id="', '<em>', '<strong>', '<s>', '<code>코드</code>', '<br>', '<blockquote>\n<p>인용</p>\n<blockquote>', '<ol>', '<ul>\n<li>중첩', 'task-list-item-checkbox', 'is-right', '<hr>', 'href="https://example.com/"', 'href="https://example.org/path"', '<img src="/media/a.png" alt="대체" title="제목"', 'footnote-ref', 'class="footnotes"']) assert.ok(html.includes(marker), marker);
  assert.match(html, /<div class="app-table-scroll"[^>]*><table class="app-table">/);
});

test('every_heading_level_keeps_its_written_level_as_a_class_and_ids_never_collide', () => {
  const html = render('# 제목\n\n## 제목\n\n### 제목 2\n\n#### 제목\n\n##### 제목\n\n###### 제목');
  for (let level = 1; level <= 6; level += 1) assert.match(html, new RegExp(`<h${level} id="[^"]+" class="app-heading-${level}">`));
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids, ['제목', '제목-2', '제목-2-2', '제목-3', '제목-4', '제목-5']);
});

test('detail_and_feed_move_heading_tags_without_losing_the_written_level', () => {
  const html = render('# 가\n\n## 나\n\n### 다\n\n###### 라');
  assert.deepEqual([...shiftHeadings(html, detailLevels).matchAll(/<h(\d) [^>]*class="app-heading-(\d)"/g)].map(m => [m[1], m[2]]), [['2', '1'], ['2', '2'], ['3', '3'], ['6', '6']]);
  assert.deepEqual([...shiftHeadings(html, feedLevels).matchAll(/<h(\d) [^>]*class="app-heading-(\d)"/g)].map(m => [m[1], m[2]]), [['2', '1'], ['3', '2'], ['4', '3'], ['6', '6']]);
  const legacy = shiftHeadings('<h2 id="x">절</h2>', feedLevels);
  assert.equal(legacy, '<h3 class="app-heading-2" id="x">절</h3>');
  assert.equal(shiftHeadings(shiftHeadings(html, feedLevels), feedLevels).match(/class="/g).length, 4);
});

test('extended_inline_and_block_syntax_renders_and_leaves_literals_alone', () => {
  const html = render('H~2~O, mc^2^, ==mark==, ::mark::, ~~del~~, a === b, ~5분~ ~ 10, \\~escaped\\~ ^[inline]\n\n용어\n: 설명 **굵게**\n  이어짐\n: 둘째\n\n둘째 용어\n: 설명');
  assert.match(html, /H<sub>2<\/sub>O, mc<sup>2<\/sup>, <mark>mark<\/mark>, <mark>mark<\/mark>, <s>del<\/s>, a === b/);
  assert.match(html, /<sub>5분<\/sub> ~ 10/);
  assert.ok(!render('약 ~5분, ~10분 걸림, 3~5개').includes('<sub>'), '공백을 사이에 둔 물결표는 범위 표기로 남는다');
  assert.match(html, /~escaped~/);
  assert.match(html, /class="footnote-ref"/);
  assert.match(html, /<dl>\n<dt>용어<\/dt>\n<dd>설명 <strong>굵게<\/strong>\n이어짐<\/dd>\n<dd>둘째<\/dd>\n<dt>둘째 용어<\/dt>\n<dd>설명<\/dd>\n<\/dl>/);
  assert.ok(!render('콜론: 단어\n\n이것은 정의 목록이 아니다').includes('<dl>'));
  assert.ok(!render('코드 `a ^b^ c`').includes('<sup>'));
});

test('safe_details_blocks_render_and_unsafe_variants_stay_text', () => {
  const html = render('<details open>\n<summary>**요약** 글자</summary>\n\n본문 `코드`\n\n<details>\n<summary>안쪽</summary>\n\n중첩\n</details>\n\n</details>\n\n끝');
  assert.match(html, /^<details class="app-details" open><summary><strong>요약<\/strong> 글자<\/summary>/);
  assert.equal((html.match(/<details/g) ?? []).length, 2);
  assert.equal((html.match(/<\/details>/g) ?? []).length, 2);
  assert.match(html, /<p>끝<\/p>\n$/);
  for (const source of ['<details onclick="x()">\n본문\n</details>', '<details>\n<summary onclick="x()">x</summary>\n</details>', '<details>\n본문 닫히지 않음', '<div>\n본문\n</div>']) {
    const unsafe = render(source);
    assert.ok(!unsafe.includes('<details onclick') && !unsafe.includes('onclick="x()">x') && !unsafe.includes('<div>'), source);
  }
  assert.ok(render('<details>\n<summary>**요약**</summary>\n</details>').includes('<summary>'));
  assert.ok(!render('<details>\n<summary><img src=x onerror=1></summary>\n</details>').includes('<img'));
  assert.ok(!render('    <details>\n    코드').includes('<details'));
});

test('raw_html_and_unsafe_urls_never_reach_the_page_as_markup', () => {
  const html = render([
    '<script>alert(1)</script>', '', '<img src=x onerror=alert(1)>', '', '<iframe src="https://evil.test"></iframe>', '',
    '[js](javascript:alert(1)) [data](data:text/html,x) [vb](vbscript:x) [file](file:///etc/passwd) ![x](javascript:alert(1))', '',
    '[ok](https://example.com/?a=1&b="2"&c=<x>) [사이트](/search/) [앵커](#a) <hello@example.com>', '',
    '[quote](https://example.com/" onmouseover="alert(1))', '', '`<b>`', '',
    '| <script> |\n|---|\n| <img src=x onerror=1> |',
  ].join('\n'));
  assert.doesNotMatch(html, /<script|<iframe|<img src=x|<img[^>]+onerror|href="javascript|href="data:|href="vbscript|href="file:|src="javascript/i);
  assert.match(html, /href="https:\/\/example.com\/\?a=1&amp;b=%22 ?2%22&amp;c=%3Cx%3E"/);
  assert.match(html, /href="\/search\/"/);
  assert.doesNotMatch(html, /onmouseover="alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('code_fences_escape_content_and_fall_back_to_plaintext', () => {
  for (const info of ['', 'unknown-language', 'ui-unknown', 'x"onload="alert(1)', '<script>', 'js"><script>alert(1)</script>']) {
    const body = '<script>alert(1)</script> & "quote" \'single\'\n';
    const html = render(fence(info, body));
    assert.doesNotMatch(html, /<script|onload=/);
    assert.equal(codeOf(html), body);
    assert.match(html, /<code class="language-plaintext">/, info);
    assert.equal(labelOf(html), 'Plain text');
  }
  assert.equal(codeLanguage('JS').id, 'js');
  assert.equal(codeLanguage('mermaid').id, 'plaintext');
  assert.equal(render(fence('text', '<b>x</b>\n')).includes('<b>'), false);
});

test('representative_languages_and_aliases_use_the_registered_highlighter', () => {
  const samples = {
    javascript: ['js', 'JavaScript', 'const a = 1; // 주석'], typescript: ['ts', 'TypeScript', 'let a: number = 1;'], python: ['py', 'Python', 'def f():\n    return 1'],
    c: ['c', 'C', 'int main(void) { return 0; }'], cpp: ['c++', 'C++', 'auto x = 1;'], csharp: ['c#', 'C#', 'var x = 1;'], java: ['java', 'Java', 'class A {}'],
    kotlin: ['kt', 'Kotlin', 'val x = 1'], rust: ['rs', 'Rust', 'let x = 1;'], go: ['golang', 'Go', 'func main() {}'], swift: ['swift', 'Swift', 'let x = 1'],
    bash: ['sh', 'Bash', 'echo "$HOME"'], sql: ['sql', 'SQL', 'SELECT 1;'], json: ['json', 'JSON', '{"a": [1, true, null]}'], yaml: ['yml', 'YAML', 'a: 1'],
    html: ['html', 'HTML, XML', '<a href="/">x</a>'], css: ['css', 'CSS', 'a { color: red; }'], dockerfile: ['docker', 'Dockerfile', 'FROM node:22'], markdown: ['md', 'Markdown', '# 제목'],
  };
  for (const [language, [alias, label, source]] of Object.entries(samples)) {
    for (const info of [language, alias, alias.toUpperCase()]) {
      const html = render(fence(info, source + '\n'));
      assert.equal(labelOf(html), label, info);
      assert.match(html, new RegExp(`<code class="language-${info.toLowerCase().replace(/[+]/g, '\\+')}">`));
      assert.equal(codeOf(html), source + '\n', info);
    }
  }
  assert.match(render(fence('js', 'const a = 1; // 주석\n')), /app-syntax-keyword/);
});

// #107: 언어별 함수 선언과 호출을 같은 역할로 표시하고 문자열·주석은 코드로 판별하지 않는다.
test('code_roles_distinguish_calls_types_properties_and_parameters', () => {
  const samples = [
    ['java', 'class Greeter {\n String name;\n String greet(String input) {\n String local = input.trim();\n this.name = local;\n return input;\n }\n}', { function: ['greet', 'trim'], type: ['Greeter', 'String'], parameter: ['input'], property: ['name'], variable: ['local'] }],
    ['java', 'import java.util.List;\nclass Cart { int total(List<Integer> prices) { return prices.size(); } }', { function: ['total', 'size'], type: ['int', 'List', 'Integer'], parameter: ['prices'] }],
    ['kotlin', 'fun greet(input: String): String {\n return input.trim()\n}', { function: ['greet', 'trim'], type: ['String'] }],
    ['python', 'def greet(name):\n    self.name = name.strip()\n    return name\n', { function: ['greet', 'strip'], parameter: ['name'], property: ['name'] }],
    ['typescript', 'class Greeter { name: string; greet(input: string) { return input.trim().length; } }', { function: ['greet', 'trim'], type: ['Greeter', 'string'], property: ['name', 'length'], parameter: ['input'] }],
    ['json', '{"list":"greet()","count":3,"enabled":true}', { property: ['list', 'count'], string: ['greet()'], number: ['3'], keyword: ['true'] }],
    ['yaml', 'title: my-first-post\nenabled: true', { property: ['title', 'enabled'], string: ['my-first-post'], keyword: ['true'] }],
    ['bash', 'curl --header "Accept: application/json" "$URL"', { function: ['curl'], string: ['Accept: application/json'], variable: ['URL'] }],
  ];
  for (const [language, source, roles] of samples) {
    const html = render(fence(language, source + '\n'));
    for (const [role, words] of Object.entries(roles)) for (const word of words) {
      const spans = [...html.matchAll(new RegExp(`<span class="app-syntax-${role}">([\\s\\S]*?)<\\/span>`, 'g'))];
      assert.ok(spans.some(span => text(span[1]).includes(word)), `${language}: ${word} is ${role}`);
    }
    assert.equal(codeOf(html), source + '\n');
    assert.doesNotMatch(html, /style=|hljs-/);
  }
  const literal = render(fence('java', 'String s = "fake.call()"; // comment.call()\n'));
  assert.doesNotMatch(literal, /app-syntax-function[^>]*>(?:fake|call|comment)/);
});

test('highlightCode_preserves_line_endings_incomplete_code_and_escaped_content', () => {
  const samples = [
    ['java', '/* fake.call()\r\n continued */\r\n\tString s = "<script>&";  \r\n'],
    ['kotlin', 'fun greet(input: List<String>\n    // incomplete.call()\n'],
    ['python', 'message = """fake.call()\n<script>alert(1)</script>"""\n'],
    ['abnf', 'rule = "<tag>&"\n'],
    ['json', '{"키": "\\"<&>😀", "incomplete":\n'],
  ];
  for (const [language, source] of samples) {
    const html = highlightCode(source, language);
    assert.equal(text(html), source, language);
    assert.doesNotMatch(html, /<script|<tag>|style=/, language);
    assert.doesNotMatch(html, /app-syntax-function[^>]*>(?:fake|call|incomplete)/, language);
  }
});

test('every_registered_highlight_language_and_alias_renders_and_keeps_its_text', () => {
  const languages = hljs.listLanguages();
  assert.ok(languages.length >= 190, `${languages.length}`);
  const source = 'x = 1 // <tag> & "q"\n\tindented\n\n';
  let aliases = 0;
  for (const language of languages) {
    for (const name of [language, ...(hljs.getLanguage(language).aliases ?? [])]) {
      aliases += 1;
      if (!/^[\w+#.-]+$/.test(name)) continue;
      const html = render(fence(name, source));
      assert.match(html, /<div class="app-code app-tool-surface"><div class="app-tool-header"><span class="app-tool-label">[^<]+<\/span><div class="app-toolbar"/);
      assert.equal(codeOf(html), source, name);
      assert.doesNotMatch(html, /<tag>/);
    }
  }
  assert.ok(aliases > languages.length);
});

test('filename_is_shown_next_to_the_language_only_when_given', () => {
  assert.equal(labelOf(render(fence('ts filename=src/main.ts', 'x\n'))), 'TypeScript · src/main.ts');
  assert.equal(labelOf(render(fence('ts filename="my file.ts"', 'x\n'))), 'TypeScript · my file.ts');
  assert.equal(labelOf(render(fence('ts filename=<b>.ts', 'x\n'))), 'TypeScript · &lt;b&gt;.ts');
  assert.equal(labelOf(render(fence('ts', 'x\n'))), 'TypeScript');
});

test('copy_source_is_the_exact_fence_content_including_tabs_comments_and_trailing_blank_lines', () => {
  const body = '// 주석\n\tfunction a() {  \n\t\treturn "탭\\t";   \n\t}\n\n\n  # 공백 시작\n';
  for (const info of ['js', 'python', 'bash', 'text', 'nonexistent']) assert.equal(codeOf(render(fence(info, body))), body, info);
  const html = render(fence('js', body));
  assert.equal((html.match(/data-tool="copy" aria-label="코드 복사" title="코드 복사" hidden/g) ?? []).length, 1);
  assert.ok(html.indexOf('data-tool') < html.indexOf('<pre>'), '복사 버튼은 코드 위쪽 머리글에 있다');
  assert.ok(html.indexOf('data-tool') > html.indexOf('class="app-tool-header"') && html.indexOf('data-tool') < html.indexOf('</div><pre>'));
});

test('ui_components_and_nested_fences_keep_working_with_markdown_extensions', () => {
  const inner = '```js\nconsole.log(1);\n```';
  const html = render('````ui:callout\ntitle: 알림\nbody: |\n  ' + inner.split('\n').join('\n  ') + '\n````\n\n````markdown\n' + inner + '\n````\n');
  assert.match(html, /class="app-callout"/);
  assert.equal((html.match(/class="app-code app-tool-surface"/g) ?? []).length, 2);
  assert.match(html, /<code class="language-js">/);
  assert.match(html, /<code class="language-markdown">/);
  assert.ok(text(html).includes('```js\nconsole.log(1);\n```'));
});

test('footnotes_stay_unique_across_pages_and_link_back', () => {
  const first = md.render('가[^1]\n\n[^1]: 첫째', { pageId: 'a', docId: 'a' });
  const second = md.render('나[^1]\n\n[^1]: 둘째', { pageId: 'b', docId: 'b' });
  const ids = html => [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids(first).filter(id => ids(second).includes(id)).length, 0);
  assert.match(first, /href="#fn-a-1"/);
  assert.match(first, /href="#fnref-a-1"/);
});

test('the_markdown_guide_example_renders_every_supported_construct_and_round_trips_code', () => {
  const source = readFileSync(new URL('../content/blog/markdown-guide.md', import.meta.url), 'utf8');
  assert.match(source, /example: true/);
  const body = source.split('\n---\n').slice(1).join('\n---\n');
  const meta = parse(source.slice(4, source.indexOf('\n---\n')));
  const page = { ...meta, body: body.replace(/^\n/, '') };
  const rendered = renderArticle(createMarkdown(), page);
  const fences = [...page.body.matchAll(/^(`{3,})([^\n]*)\n([\s\S]*?)^\1\s*$/gm)].filter(match => !match[2].startsWith('ui:'));
  const blocks = [...rendered.html.matchAll(/<pre><code class="language-[^"]*">([\s\S]*?)<\/code><\/pre>/g)].map(match => text(match[1]));
  assert.equal(blocks.length, fences.length);
  fences.forEach((match, index) => assert.equal(blocks[index], match[3], `fence ${index}: ${match[2]}`));
  const labels = new Set([...rendered.html.matchAll(/class="app-tool-label">([^<]*)</g)].map(match => match[1].split(' · ')[0]));
  for (const label of ['JavaScript', 'TypeScript', 'Python', 'C', 'C++', 'C#', 'Java', 'Kotlin', 'Rust', 'Go', 'Swift', 'Bash', 'SQL', 'JSON', 'YAML', 'HTML, XML', 'CSS', 'Dockerfile', 'Markdown', 'Plain text']) assert.ok(labels.has(label), label);
  for (const marker of ['app-heading-1', 'app-heading-6', '<s>', '<mark>', '<sub>', '<sup>', '<kbd>', '<dl>', '<details', 'class="footnotes"', 'is-center', 'is-right', 'contains-task-list', 'is-cancelled', '<hr>', '<blockquote>', '<img ']) assert.ok(rendered.html.includes(marker), marker);
  assert.doesNotMatch(rendered.html, /<script|href="javascript|onerror=alert\(1\)>/);
  const ids = [...(rendered.leadHtml + rendered.html).matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(rendered.leadHtml, '일반 Markdown만으로 글을 쓰는 방법과 지원하는 문법, 코드 블록 언어를 한 글에서 확인합니다.');
});

test('definition_lists_support_multiple_paragraphs_blocks_and_inline_formatting_like_markdown_it_deflist', () => {
  const html = render('용어 `코드`\n: 첫 문단\n\n    둘째 문단\n\n: 또 다른 정의\n\n```js\nnot a definition\n```\n');
  assert.match(html, /<dt>용어 <code>코드<\/code><\/dt>/);
  assert.match(html, /<dd>\n<p>첫 문단<\/p>\n<p>둘째 문단<\/p>\n<\/dd>/);
  assert.equal((html.match(/<dd>/g) ?? []).length, 2);
  assert.equal((html.match(/<dl>/g) ?? []).length, 1);
  assert.match(html, /<\/dl>\n<div class="app-code app-tool-surface">/);
});

test('details_close_tags_inside_fenced_code_do_not_end_the_block_and_nesting_stays_balanced', () => {
  const html = render('<details>\n<summary>Code</summary>\n\n```html\n</details>\n<details>\n```\n\n~~~\n</details>\n~~~\n\nAfter code\n\n<details>\n<summary>안</summary>\n\n중첩\n</details>\n</details>\n\n끝');
  assert.equal((html.match(/<details/g) ?? []).length, 2);
  assert.equal((html.match(/<\/details>/g) ?? []).length, 2);
  assert.equal(codeOf(html), '</details>\n<details>\n');
  assert.ok(html.indexOf('After code') < html.indexOf('</details>', html.indexOf('중첩')), '코드 뒤 본문이 접힘 블록 안에 남아야 한다');
  assert.ok(html.endsWith('<p>끝</p>\n'));
  assert.ok(!render('<details>\n```\n</details>').includes('<details'), '닫히지 않은 펜스 뒤의 닫는 태그는 짝이 아니다');
});

test('indented_code_blocks_get_the_same_header_copy_button_and_exact_text', () => {
  const body = 'indented <b>&</b>\n  deeper\n\nlast';
  const html = render('문단\n\n' + body.split('\n').map(line => (line ? '    ' + line : line)).join('\n') + '\n');
  assert.match(html, /<div class="app-code app-tool-surface"><div class="app-tool-header"><span class="app-tool-label">Plain text<\/span>[\s\S]*?data-tool="copy" aria-label="코드 복사" title="코드 복사" hidden/);
  assert.equal(codeOf(html), body + '\n');
  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /data-tool-status/);
});

test('heading_ids_stay_unique_when_a_natural_slug_collides_with_a_numbered_one', () => {
  const html = render('## foo\n\n## foo\n\n## foo-2\n\n## foo\n\n## foo-2');
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 5);
  assert.equal(new Set(ids).size, 5);
});

test('details_markers_inside_indented_code_and_list_item_fences_do_not_change_the_block_boundary', () => {
  const reported = render('<details>\n<summary>Code</summary>\n\n    </details>\n\nAfter code\n</details>');
  assert.equal((reported.match(/<details/g) ?? []).length, 1);
  assert.equal(codeOf(reported), '</details>\n');
  assert.ok(reported.indexOf('After code') < reported.lastIndexOf('</details>'));
  const tabbed = render('<details>\n<summary>Tab</summary>\n\n\t<details>\n\nAfter tab\n</details>');
  assert.equal((tabbed.match(/<details/g) ?? []).length, 1);
  assert.equal(codeOf(tabbed), '<details>\n');
  assert.ok(tabbed.indexOf('After tab') < tabbed.lastIndexOf('</details>'));
  for (const indent of ['  ', '    ']) {
    const list = render(`<details>\n<summary>List</summary>\n\n- 항목\n\n${indent}\`\`\`html\n${indent}</details>\n${indent}\`\`\`\n\nAfter list\n</details>\n\n끝`);
    assert.equal((list.match(/<details/g) ?? []).length, 1, JSON.stringify(indent));
    assert.equal(codeOf(list), '</details>\n');
    assert.ok(list.indexOf('After list') < list.lastIndexOf('</details>'));
    assert.ok(list.endsWith('<p>끝</p>\n'));
  }
});
