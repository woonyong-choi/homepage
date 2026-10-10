// 도표 렌더러. 도표가 있는 글에서만 mermaid-loader.js가 처음 보일 때 불러온다.
import mermaid from 'mermaid';

const token = name => getComputedStyle(document.body).getPropertyValue(name).trim();
let configured = false;
// 토큰을 읽지 못하면 빈 색 때문에 초기화가 실패하지 않도록 mermaid 기본 색을 쓴다.
const definedOnly = values => Object.fromEntries(Object.entries(values).filter(([, value]) => value));

// strict 보안 수준은 라벨의 HTML을 인코딩하고 click·javascript 링크를 막는다. secure 목록은 글 안의 %%{init}%% 지시문이 보안과 겉모양을 바꾸지 못하게 한다.
function configure() {
  if (configured) return;
  configured = true;
  const ink = token('--site-ink');
  const line = token('--site-muted');
  const surface = token('--site-soft');
  const page = token('--site-card');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
    maxTextSize: 20000,
    maxEdges: 200,
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'theme', 'themeVariables', 'fontFamily'],
    theme: 'base',
    ...(token('--site-font') && { fontFamily: token('--site-font') }),
    themeVariables: definedOnly({
      background: page, primaryColor: surface, primaryTextColor: ink, primaryBorderColor: line,
      secondaryColor: page, secondaryTextColor: ink, secondaryBorderColor: line,
      tertiaryColor: page, tertiaryTextColor: ink, tertiaryBorderColor: line,
      lineColor: line, textColor: ink, mainBkg: surface, nodeBorder: line, clusterBkg: page, clusterBorder: line,
      noteBkgColor: surface, noteTextColor: ink, noteBorderColor: line,
      actorBkg: surface, actorBorder: line, actorTextColor: ink, actorLineColor: line,
      signalColor: line, signalTextColor: ink, labelBoxBkgColor: surface, labelBoxBorderColor: line, labelTextColor: ink,
      edgeLabelBackground: page, titleColor: ink,
    }),
  });
}

export default async function renderDiagram(id, source) {
  configure();
  try {
    const { svg } = await mermaid.render(id, source);
    return svg;
  } finally {
    // 실패하면 mermaid가 측정용 요소를 남길 수 있다.
    document.getElementById(`d${id}`)?.remove();
  }
}
