const dialog = document.querySelector('#film-dialog');
const video = document.querySelector('#full-film');
const opener = document.querySelector('#open-film');
const status = document.querySelector('#film-status');
const description = '영상 재생을 확인하는 예시입니다. 실제 소개 영상은 이후 연결합니다.';

opener.addEventListener('click', () => {
  status.textContent = description;
  video.src = '/landing/assets/film-0.mp4';
  dialog.showModal();
  video.play().catch(() => {
    status.textContent = '플레이어의 재생 버튼을 눌러주세요. ' + description;
  });
});
document.querySelector('#close-film').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
  opener.focus();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) video.pause();
});
video.addEventListener('error', () => {
  if (video.hasAttribute('src')) status.textContent = '영상을 불러오지 못했습니다. 닫은 뒤 다시 시도해 주세요.';
});
