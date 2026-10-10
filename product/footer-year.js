// 푸터의 연도를 접속 시점의 현재 연도로 갱신한다.
for (const year of document.querySelectorAll('[data-current-year]')) year.textContent = new Date().getFullYear();
