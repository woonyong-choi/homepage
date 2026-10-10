// 도표 자리가 화면 근처에 오면 로컬 렌더러를 한 번만 불러와 그린다. 실패하거나 스크립트가 없으면 열린 원문이 남는다.
const url = __MERMAID_RENDER__;
let renderer;

async function draw(figure) {
  const view = figure.querySelector('[data-mermaid-view]');
  const status = figure.querySelector('[data-mermaid-status]');
  const source = figure.querySelector('.app-diagram-source');
  const text = source.querySelector('code').textContent;
  status.textContent = '도표를 그리는 중입니다.';
  try {
    renderer ??= import(url).then(module => module.default);
    view.innerHTML = await (await renderer)(figure.dataset.mermaidId, text);
    view.hidden = false;
    source.open = false;
    figure.classList.add('is-rendered');
    status.textContent = '';
  } catch {
    figure.classList.add('is-failed');
    source.open = true;
    status.textContent = '도표를 그리지 못했습니다. 아래 원문을 확인하거나 복사하세요.';
  }
}

const initialized = new WeakSet();
const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    void draw(entry.target);
  }
}, { rootMargin: '300px 0px' }) : null;
function initContent(root) {
  for (const figure of root.querySelectorAll('[data-mermaid]')) {
    if (initialized.has(figure)) continue;
    initialized.add(figure);
    if (observer) observer.observe(figure);
    else void draw(figure);
  }
}
initContent(document);
document.addEventListener('content-added', event => initContent(event.detail));
