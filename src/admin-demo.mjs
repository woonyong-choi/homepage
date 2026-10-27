// 체험 모드: GitHub API 대신 이 탭의 메모리에 글을 두고 작성·임시저장·출간·삭제 흐름을 그대로 눌러 볼 수 있게 한다.
// 실제 저장소와 사이트는 바뀌지 않는다. 탭을 닫으면 체험 내용도 사라진다.
import { toBase64 } from './admin-model.mjs';

export const DEMO_KEY = 'admin-demo';

const today = () => new Date().toISOString().slice(0, 10);
const post = (slug, title, description, state, body) => [`publish/${today().slice(2)}-${slug}.md`, `---
id: ${slug}
slug: ${slug}
type: blog
title: "${title}"
description: "${description}"
tags: [체험, 글쓰기]
publishedAt: "${today()}"
visibility: ${state === 'public' ? 'public' : state}
status: ${state === 'draft' ? 'draft' : 'published'}
publish: ${state === 'public'}
comments: false
---

${body}
`];

export const DEMO_POSTS = Object.freeze([
  post('demo-draft', '쓰다 만 임시 글', '임시저장한 글은 오른쪽 아래 목록에서 다시 열 수 있습니다.', 'draft', '아직 쓰는 중인 글입니다.\n\n## 남은 일\n\n- 그림 넣기\n- 요약 다듬기'),
  post('demo-private', '나만 보는 비공개 글', '비공개로 출간한 글은 사이트에 보이지 않고 관리자 목록에만 남습니다.', 'private', '비공개 글은 다 쓴 글이지만 사이트에 싣지 않습니다.\n\n> 출간 화면에서 전체 공개로 바꾸면 사이트에 올라갑니다.'),
]);

export function demoFetcher(seed = DEMO_POSTS) {
  const files = new Map(seed.map(([path, text]) => [path, { content: toBase64(text) }]));
  let version = 0;
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  return async (url, init = {}) => {
    const address = new URL(url);
    const method = init.method ?? 'GET';
    if (address.pathname.includes('/actions/workflows/')) {
      return method === 'POST' ? new Response(null, { status: 204 }) : json({ workflow_runs: [{ status: 'completed', conclusion: 'success', created_at: new Date().toISOString() }] });
    }
    const path = decodeURIComponent(address.pathname.split('/contents/')[1] ?? '');
    const sha = () => `demo-${++version}`;
    if (method === 'GET') {
      const file = files.get(path);
      if (file) {
        if (init.headers?.accept === 'application/vnd.github.raw') return new Response(Uint8Array.from(atob(file.content), char => char.charCodeAt(0)));
        return json({ sha: file.sha ?? 'demo-0', content: file.content });
      }
      const children = [...files.keys()].filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'));
      return children.length ? json(children.map(key => ({ type: 'file', name: key.split('/').pop(), path: key }))) : json({ message: 'Not Found' }, 404);
    }
    const body = JSON.parse(init.body ?? '{}');
    if (method === 'PUT') {
      if (files.has(path) && !body.sha) return json({ message: 'exists' }, 422);
      const next = sha();
      files.set(path, { content: body.content, sha: next });
      return json({ content: { sha: next } }, 201);
    }
    if (method === 'DELETE') { files.delete(path); return json({}); }
    return json({ message: 'unsupported' }, 400);
  };
}
