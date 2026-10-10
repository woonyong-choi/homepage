const pages = {
  resume: ['Woonyong', '백엔드와 개발 도구를 만드는 개발자', '<p>문제를 작은 단위로 나누고, 구현과 검증을 기록하며, 다음 작업에서 다시 사용할 수 있는 지식과 도구로 연결하는 데 관심이 있습니다.</p><h3>대표 작업</h3><ul><li>K8s Clue — Kubernetes 장애 증거와 수정 제안을 연결하는 팀 프로젝트.</li><li>Daphnis — 텍스트를 문서용 다이어그램으로 만드는 도구.</li></ul><h3>이력서 구성</h3><p>소개 → 대표 프로젝트 → 재직 경력 → 교육과 기술 경험 순서로 구성합니다. 이 화면은 소개와 이동 구조의 예시이며, 경력·기간·성과 수치는 최종 이력서에 확인된 내용만 연결합니다.</p>'],
  portfolio: ['포트폴리오', '직접 만든 것과 선택의 이유', '<p>프로젝트마다 문제, 본인 역할, 설계 판단, 구현, 검증과 한계를 보여줍니다.</p><ul><li><a href="#clue" data-page="clue">K8s Clue</a> — 팀 프로젝트</li><li><a href="#daphnis" data-page="daphnis">Daphnis</a> — 개발 도구</li></ul>'],
  clue: ['K8s Clue', 'Kubernetes 장애 진단·복구 제안', '<p>장애의 증거를 읽기 전용으로 수집하고, 규칙으로 원인을 판정하며, 사람이 검토할 수 있는 수정안으로 연결하는 팀 프로젝트입니다.</p><h3>상세 페이지에서는</h3><p>팀의 결과와 본인이 맡은 구현을 구분하고, 증거 수집 → 진단 → Draft PR → 복구 확인의 흐름과 실제 검증 범위를 설명합니다.</p><h3>함께 읽기</h3><p><a href="#kubernetes" data-page="kubernetes">위키 · Kubernetes</a></p><p><a href="https://github.com/woonyong-choi/clue" target="_blank" rel="noopener noreferrer">프로젝트 저장소 ↗</a></p>'],
  daphnis: ['Daphnis', '텍스트에서 문서용 다이어그램으로', '<p>하나의 텍스트 소스로 흐름, 시퀀스, 상태, 데이터 관계와 차트를 표현하는 도구입니다.</p><h3>같은 디자인 언어</h3><p>웹 문서와 다이어그램이 역할 기반 디자인 토큰을 공유합니다. 계산과 배치는 도구가 맡고, 색상과 글꼴은 공통 테마에서 받습니다.</p><p><a href="https://github.com/woonyong-choi/daphnis" target="_blank" rel="noopener noreferrer">도구 저장소 ↗</a></p>'],
  'theme-story': ['웹과 다이어그램이 같은 디자인을 쓰려면', '설계 기록 · 예시 글', '<p>버튼의 파란색과 다이어그램의 강조선을 따로 관리하면 테마를 바꿀 때 서로 다른 화면이 됩니다.</p><h3>값보다 역할을 공유하기</h3><p>본문, 보조 설명, 강조, 경계선처럼 쓰임을 먼저 정합니다. 각 화면은 같은 역할을 참조하고 실제 값은 하나의 테마가 소유합니다.</p><h3>연결되는 내용</h3><p>완성된 글에서는 문제, 통합 과정, 라이트·다크 검증과 남은 제약을 설명합니다. 이 문장은 화면 구성을 위한 예시입니다.</p><p><a href="#daphnis" data-page="daphnis">관련 프로젝트 · Daphnis</a></p>'],
  'clue-story': ['장애를 고치기 전에, 증거부터 모으는 이유', '문제 해결 · 예시 글', '<p>관찰한 사실과 원인에 대한 추정, 실제 변경을 구분하면 판단의 근거를 다시 확인할 수 있습니다.</p><h3>관찰과 변경 사이</h3><p>이 글의 예시 구조는 증상 → 수집한 증거 → 진단 기준 → 변경 제안 → 검증입니다. 실제 사건 기록과 측정값은 본문 작성 시 확인해 연결합니다.</p><p><a href="#clue" data-page="clue">관련 프로젝트 · K8s Clue</a></p>'],
  'sql-story': ['SQL 한 줄이 데이터에 닿기까지', '학습 기록 · 예시 글', '<p>쿼리를 해석하는 단계와 실제 데이터를 읽고 쓰는 단계를 나누어 보면 데이터베이스 내부의 책임이 드러납니다.</p><h3>작은 구현으로 따라가기</h3><p>쿼리 입력 → 해석 → 실행 → 저장 경로 순서로 예제와 코드를 보여줄 글의 시안입니다. 학습 구현의 범위와 제품 운영 경험은 구분합니다.</p><p><a href="#data" data-page="data">관련 위키 · Data</a></p>'],
};
// 기존 위키의 아이콘 목록과 두 종류 카드를 그대로 사용한다.
const groups = {
  'language-links': [['Python','python','Python의 문법과 실행 흐름','python'],['Kotlin','kotlin','타입과 널 안전성, 함수와 코루틴','kotlin'],['JavaScript','javascript','언어와 브라우저 실행','ui:javascript'],['C#','csharp','타입과 컬렉션, 문제 풀이','ui:csharp']],
  'framework-links': [['Spring Boot','spring','서버 구성과 API, 데이터 처리','spring-boot'],['React','react','컴포넌트와 상태, 화면 갱신','react'],['Next.js','nextjs','페이지와 서버 렌더링','nextjs']],
  'knowledge-links': [['CS 기초','cs','자료구조 · 알고리즘 · OS · 네트워크','ui:cpu-lucide'],['Programming','programming','언어 · 런타임 · 설계 · 테스트','ui:terminal-lucide'],['Data','data','데이터베이스 · SQL · 데이터 흐름','ui:database-lucide'],['Frontend','frontend','브라우저 · UI · 클라이언트','ui:book-open-lucide'],['Backend','backend','API · 인증 · 서비스 구조','ui:server-lucide'],['DevOps','devops','배포 · 관측 · 운영','ui:workflow-lucide'],['AI','ai','모델 · 검색 · 추론 · 평가','ui:brain-lucide']],
  'platform-links': [['PostgreSQL','postgres','SQL, 트랜잭션과 인덱스','postgres'],['Redis','redis','캐시와 데이터 구조','redis'],['Kubernetes','kubernetes','Workload와 권한, 리소스 정책','kubernetes'],['Docker','docker','컨테이너 이미지와 실행 환경','docker'],['GitHub Actions','cicd','빌드부터 배포까지','githubactions'],['Prometheus','observability','서비스 지표 수집과 관측','prometheus']],
  'learning-links': [['PintOS','pintos','운영체제의 실행 흐름을 따라가는 학습 구현','ui:cpu-lucide'],['SQL 엔진','sql','쿼리 해석과 실행, 저장 경로를 살펴보는 학습 구현','ui:database-lucide'],['메모리 할당','malloc','메모리 할당과 해제를 직접 구현하며 학습','ui:server-lucide'],['HTTP Proxy','proxy','요청과 응답을 중계하며 네트워크 학습','ui:network-lucide']],
};
const projects = [['K8s Clue','clue','Kubernetes 장애 증거를 수집하고 사람이 검토할 수정안으로 연결하는 팀 프로젝트.','kubernetes'],['Daphnis','daphnis','텍스트로 문서용 다이어그램을 만들고 움직임으로 동작을 설명하는 도구.','daphnis']];
const articles = [['같은 테마를 웹과 다이어그램에 적용하기','theme-story','예시 글 · 색상 이름 대신 역할을 공유하고 하나의 테마로 연결하기.','ui:workflow-lucide'],['장애를 고치기 전에 증거부터 모으는 이유','clue-story','예시 글 · Kubernetes 진단에서 관찰과 변경의 경계 나누기.','ui:troubleshooting'],['SQL 한 줄이 데이터에 닿기까지','sql-story','예시 글 · 쿼리의 해석부터 저장까지 작은 엔진으로 따라가기.','ui:database-lucide']];
const entries = [...Object.values(groups).flat(), ...projects, ...articles];
const iconUrl = icon => icon.startsWith('ui:') ? `/assets/ui/${icon.slice(3)}.svg` : `/assets/img/icons/${icon}-icon.svg`;
for (const [target, entries] of Object.entries(groups)) {
  const container = document.getElementById(target);
  for (const [title, id, description, icon] of entries) {
    const link = document.createElement('a');
    link.className = 'docs-item-link'; link.href = `#${id}`; link.dataset.page = id;
    link.innerHTML = `<span class="docs-item-icon"><img src="${iconUrl(icon)}" alt="" /></span>`;
    link.append(document.createTextNode(title)); container?.append(link);
    pages[id] ??= [title, '위키 탐색 예시', `<p>${description}</p><p>이 항목은 해당 기술이나 개념의 위키로 연결할 자리입니다. 시안에서는 탐색 구성을 보여주며, 실제 위키 본문이나 비공개 자료를 가져오지 않습니다.</p>`];
  }
}
for (const [title, id, description] of articles.slice(0, 2)) {
  const card = document.createElement('a');
  card.className = 'docs-story-card'; card.href = `#${id}`; card.dataset.page = id;
  const theme = id === 'theme-story';
  const coverIcon = theme ? 'daphnis' : 'kubernetes';
  const coverTitle = theme ? '하나의 테마,<br />일관된 경험' : '관찰에서<br />진단까지';
  card.innerHTML = `<span class="docs-story-cover" aria-hidden="true"><span class="docs-story-cover-copy"><span class="docs-story-cover-label">${theme ? 'DESIGN SYSTEM' : 'KUBERNETES'}</span><span class="docs-story-cover-title">${coverTitle}</span></span><img class="docs-story-cover-icon" src="${iconUrl(coverIcon)}" alt="" /></span><span class="docs-story-body"><span class="docs-story-meta">${theme ? '설계 기록' : '문제 해결'} · 예시 글</span><span class="docs-story-title">${title}</span><span class="docs-story-summary">${description.replace('예시 글 · ', '')}</span></span>`;
  document.querySelector('#article-cards').append(card);
}
pages.blog = ['블로그', '글 목록 시안', `<ul>${articles.map(([title, id]) => `<li><a href="#${id}" data-page="${id}">${title}</a></li>`).join('')}</ul>`];
// 프로젝트도 기존 아이콘 목록으로 표시한다.
for (const [title, id, description, icon] of projects) {
  const link = document.createElement('a');
  link.className = 'docs-project-link';
  link.href = `#${id}`;
  link.dataset.page = id;
  const summary = id === 'clue' ? 'Kubernetes 장애 진단' : '텍스트 기반 다이어그램';
  link.innerHTML = `<span class="docs-item-icon"><img src="${iconUrl(icon)}" alt="" /></span><span class="docs-project-info"><span class="docs-product-title">${title}</span><span class="docs-product-description">${summary}</span></span>`;
  document.querySelector('#project-links').append(link);
}
pages.wiki = ['위키', '분야별 지식 탐색',
  [['기초와 개발', groups['knowledge-links']], ['데이터와 플랫폼', groups['platform-links']], ['학습 구현', groups['learning-links']]]
    .map(([heading, items]) => `<h3>${heading}</h3><ul>${items.map(([title, id]) => `<li><a href="#${id}" data-page="${id}">${title}</a></li>`).join('')}</ul>`).join('')];
const dialog=document.querySelector('#detail-dialog');
const search=document.querySelector('.docs-search-dialog');
let returnFocus;
function showPage(id,link) {
  const page=pages[id];if(!page)return;
  const [title,subtitle,body]=page;
  document.querySelector('#detail-content').innerHTML=`<h2 id="detail-title">${title}</h2><p>${subtitle}</p>${body}`;
  if(search.open)search.close();
  if(!dialog.open){returnFocus=link;dialog.showModal();}
  dialog.scrollTop=0;document.querySelector('.docs-privacy-cancel').focus();
}
const trigger=document.querySelector('.docs-mobile-trigger');
const mobile=document.querySelector('.docs-mobile-nav');
function closeMenu(){mobile.hidden=true;trigger.setAttribute('aria-expanded','false');}
trigger.addEventListener('click',()=>{mobile.hidden=!mobile.hidden;trigger.setAttribute('aria-expanded',String(!mobile.hidden));});
mobile.addEventListener('click',closeMenu);
const intro='<p>만들고 배우는 과정을 남깁니다.</p><ol><li>블로그에 경험과 생각을 기록합니다.</li><li>프로젝트로 구현과 결과를 보여줍니다.</li><li>언어와 프레임워크별 위키를 정리합니다.</li></ol>';
const interest='<p>백엔드와 개발 도구에 관심이 있습니다.</p><ol><li>API와 데이터 처리, 서비스의 동작</li><li>Kubernetes의 장애 증거와 진단</li><li>문서·지식·다이어그램을 연결하는 도구</li></ol>';
function selectTab(button){document.querySelectorAll('[role="tab"]').forEach(tab=>{tab.setAttribute('aria-selected',String(tab===button));tab.tabIndex=tab===button?0:-1;});const panel=document.querySelector('#command-content');panel.innerHTML=button.dataset.tab==='intro'?intro:interest;panel.setAttribute('aria-labelledby',button.id);}
const tabs=[...document.querySelectorAll('[role="tab"]')];
for(const tab of tabs){tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const next=tabs.find(item=>item!==tab);selectTab(next);next.focus();});}
selectTab(tabs[0]);
document.addEventListener('click',event=>{const link=event.target.closest('[data-page]');if(!link)return;event.preventDefault();showPage(link.dataset.page,link);closeMenu();});
document.querySelector('.docs-privacy-cancel').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.focus());
const input=search.querySelector('input');
function filterSearch(){const value=input.value.trim().toLowerCase();const results=search.querySelector('.docs-search-results');results.replaceChildren();for(const [title,id,description] of entries.filter(row=>row.join(' ').toLowerCase().includes(value))){const link=document.createElement('a');link.className='docs-search-result';link.href=`#${id}`;link.dataset.page=id;link.textContent=title;results.append(link);}if(!results.children.length)results.textContent='일치하는 기록이 없습니다.';}
document.querySelector('.docs-search-trigger').addEventListener('click',()=>{filterSearch();search.showModal();input.focus();});
input.addEventListener('input',filterSearch);
document.querySelector('.docs-search-close').addEventListener('click',()=>search.close());
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();filterSearch();if(!search.open)search.showModal();input.focus();}if(event.key==='Escape'&&!mobile.hidden){closeMenu();trigger.focus();}});
