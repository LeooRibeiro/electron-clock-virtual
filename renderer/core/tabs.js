const TAB_ATTR = 'data-tab';
const PANEL_ATTR = 'data-panel';

export function initTabs({ tablistSelector, panelSelector } = {}) {
  const tablist = document.querySelector(tablistSelector || '.tabs');
  const panels = [...document.querySelectorAll(panelSelector || '.panel')];

  if (!tablist || panels.length === 0) {
    throw new Error('[tabs] Nenhuma aba ou painel encontrado.');
  }

  const buttons = [...tablist.querySelectorAll(`[${TAB_ATTR}]`)];
  const panelMap = new Map(panels.map((panel) => [panel.dataset.panel, panel]));

  let activeId = buttons[0]?.dataset.tab || null;

  function activate(id) {
    if (!panelMap.has(id) || id === activeId) return;

    activeId = id;

    buttons.forEach((button) => {
      const isActive = button.dataset.tab === id;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === id);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => activate(button.dataset.tab));
    button.addEventListener('keydown', (event) => {
      const direction =
        event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
        : 0;

      if (!direction) return;
      event.preventDefault();

      const currentIndex = buttons.findIndex((b) => b.dataset.tab === activeId);
      const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
      const next = buttons[nextIndex];

      activate(next.dataset.tab);
      next.focus();
    });
  });

  activate(activeId);

  return {
    activate,
    getActiveTab: () => activeId,
  };
}