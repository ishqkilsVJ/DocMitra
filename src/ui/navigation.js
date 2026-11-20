/**
 * DocMitra View & Tab Navigation
 * Manages view switching between the 5 main views and top navigation bar tabs.
 * STRICT RULE: No business logic, no innerHTML for dynamic state.
 */

const ACTIVE_CLASSES = ['bg-primary-container', 'text-on-primary', 'font-bold', 'shadow-sm'];
const INACTIVE_CLASSES = ['text-on-surface-variant', 'hover:bg-surface-container-high', 'hover:text-on-surface'];

export class NavigationManager {
  constructor() {
    this.currentView = 'bulk-renamer';
    this.views = {
      'bulk-renamer': document.getElementById('view-bulk-renamer'),
      'pdf-studio': document.getElementById('view-pdf-studio'),
      'image-studio': document.getElementById('view-image-studio'),
      'print-studio': document.getElementById('view-print-studio'),
      'follow-up': document.getElementById('view-follow-up'),
    };
    this.navTabs = document.querySelectorAll('.nav-tab[data-view]');
  }

  init() {
    this._bindTabs();
    this._bindKeyboardShortcuts();
    this.switchView('bulk-renamer');
  }

  _bindTabs() {
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = tab.getAttribute('data-view');
        if (targetView) {
          this.switchView(targetView);
        }
      });
    });
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Check for Alt+0 through Alt+5
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key === '0' || e.key === '1') {
          e.preventDefault();
          this.switchView('bulk-renamer');
        } else if (e.key === '2') {
          e.preventDefault();
          this.switchView('pdf-studio');
        } else if (e.key === '3') {
          e.preventDefault();
          this.switchView('image-studio');
        } else if (e.key === '4') {
          e.preventDefault();
          this.switchView('print-studio');
        } else if (e.key === '5') {
          e.preventDefault();
          this.switchView('follow-up');
        }
      }
    });
  }

  switchView(viewName) {
    if (!this.views[viewName]) {
      console.warn(`[Navigation] View "${viewName}" not found.`);
      return;
    }

    this.currentView = viewName;

    // Toggle View Panes
    Object.keys(this.views).forEach(key => {
      const pane = this.views[key];
      if (pane) {
        if (key === viewName) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      }
    });

    // Update Nav Tab Styles
    this.navTabs.forEach(tab => {
      const tabView = tab.getAttribute('data-view');
      if (tabView === viewName) {
        tab.classList.remove(...INACTIVE_CLASSES);
        tab.classList.add(...ACTIVE_CLASSES);
      } else {
        tab.classList.remove(...ACTIVE_CLASSES);
        tab.classList.add(...INACTIVE_CLASSES);
      }
    });
  }
}
