/**
 * DocMitra UI Shell Main Entrypoint
 * Coordinates view navigation, settings modal, toast notifications, and placeholder actions.
 * STRICT RULE: UI rendering & navigation only. No business logic.
 */

import { NavigationManager } from './navigation.js';
import { SettingsModalManager } from './modal.js';
import { wirePlaceholderActions } from './placeholders.js';
import { toast } from './toast.js';
import { initRenamerUI } from './renamer-ui.js';
import { initSettingsUI } from './settings-ui.js';

export function initAppShell() {
  // Initialize View Navigation
  const nav = new NavigationManager();
  nav.init();

  // Initialize Settings Modal & UI
  const modal = new SettingsModalManager();
  modal.init();
  const settingsUI = initSettingsUI();

  // Initialize Bulk Renamer UI
  const renamerUI = initRenamerUI();

  // Wire Placeholder Action Buttons to Toast
  wirePlaceholderActions();

  // Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      toast.show(isDark ? 'Dark Theme Enabled' : 'Light Theme Enabled', 'UI Preference Updated', 'info');
    });
  }

  console.info('[DocMitra] UI Shell & Modules initialized successfully.');
}

// Auto-run if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppShell);
} else {
  initAppShell();
}
