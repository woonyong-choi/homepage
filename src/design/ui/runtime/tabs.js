export function bindTabs(container, onSelect) {
  const buttons = [...container.querySelectorAll(':scope > [role=tab]')];
  const select = (index) => {
    if (!buttons[index]) return;
    buttons.forEach((button, at) => {
      button.setAttribute('aria-selected', String(at === index));
      button.tabIndex = at === index ? 0 : -1;
    });
  };
  buttons.forEach((button, index) => button.addEventListener('click', () => {
    select(index);
    onSelect(index);
  }));
  container.addEventListener('keydown', (event) => {
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    const next = { ArrowRight: (current + 1) % buttons.length, ArrowLeft: (current + buttons.length - 1) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].click();
    buttons[next].focus();
  });
  return { buttons, select };
}
