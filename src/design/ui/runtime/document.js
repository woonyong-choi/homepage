import { bindTabs } from './tabs.js';
import { bindToolbar } from './toolbar.js';

const initialized = new WeakSet();
function initContent(root) {
  for (const gallery of root.querySelectorAll('[data-tabs]')) {
    if (initialized.has(gallery)) continue;
    initialized.add(gallery);
    const panels = [...gallery.querySelectorAll(':scope > [role=tabpanel]')];
    bindTabs(gallery.querySelector(':scope > [role=tablist]'), (index) => {
      panels.forEach((panel, at) => { panel.hidden = at !== index; if (panel.hidden) panel.querySelectorAll('video').forEach((video) => video.pause()); });
    });
  }
  for (const block of root.querySelectorAll('.app-code')) {
    if (initialized.has(block)) continue;
    initialized.add(block);
    bindToolbar(block, { source: () => block.querySelector('code').textContent });
  }
  for (const image of root.querySelectorAll('.app-prose .app-figure > img, .app-prose p > img')) {
    if (initialized.has(image) || image.closest('a, button')) continue;
    initialized.add(image);
    image.dataset.zoomable = '';
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.addEventListener('click', () => openImage(image));
    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openImage(image);
    });
  }
  for (const button of root.querySelectorAll('[data-tooltip-trigger]')) {
    if (initialized.has(button)) continue;
    initialized.add(button);
    const bubble = document.getElementById(button.getAttribute('popovertarget'));
    if (!bubble) continue;
    const position = () => {
      const rect = button.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(bubble).getPropertyValue('--spacing-gap-xs'));
      const width = parseFloat(getComputedStyle(bubble).width);
      bubble.style.setProperty('--anchor-x', `${rect.left + rect.width / 2 - width / 2}px`);
      const height = bubble.getBoundingClientRect().height;
      const top = rect.bottom + gap + height > window.innerHeight ? rect.top - gap - height : rect.bottom + gap;
      bubble.style.setProperty('--anchor-y', `${Math.max(gap, top)}px`);
    };
    button.addEventListener('click', position);
    bubble.addEventListener('toggle', event => { if (event.newState === 'open') position(); });
    tooltips.add({ bubble, position });
  }
}
let viewer;
function openImage(image) {
  if (!viewer) {
    viewer = document.createElement('dialog');
    viewer.className = 'app-image-viewer';
    viewer.append(document.createElement('img'));
    viewer.addEventListener('click', () => viewer.close());
    document.body.append(viewer);
  }
  const large = viewer.querySelector('img');
  large.src = image.dataset.full || image.currentSrc || image.src;
  large.alt = image.alt;
  viewer.setAttribute('aria-label', image.alt || '확대한 그림');
  viewer.showModal();
}
const tooltips = new Set();
function openTooltips() {
  for (const tooltip of tooltips) if (!tooltip.bubble.isConnected) tooltips.delete(tooltip);
  return [...tooltips].filter(({ bubble }) => bubble.matches(':popover-open'));
}
window.addEventListener('resize', () => { for (const { position } of openTooltips()) position(); });
window.addEventListener('scroll', () => { for (const { bubble } of openTooltips()) bubble.hidePopover(); }, { passive: true });
initContent(document);
document.addEventListener('content-added', event => initContent(event.detail));
