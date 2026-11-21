/**
 * DocMitra UI Shell Main Entrypoint
 * Coordinates view navigation, settings modal, toast notifications, and placeholder actions.
 * STRICT RULE: UI rendering & navigation only. No business logic.
 */

import { NavigationManager } from './navigation.js';
import { SettingsModalManager } from './modal.js';
import { wirePlaceholderActions } from './placeholders.js';
import { toast } from './toast.js';
import { initRenamerUI } from '../../tools/rename_tool/rename_tool_ui.js';
import { initSettingsUI } from './settings-ui.js';
import { initPdfStudioUI } from '../../tools/pdf_studio/pdf_studio_ui.js';
import { initImageStudioUI } from './image-studio-ui.js';
import { initPrintStudioUI } from './print-studio-ui.js';
import { initFollowUpUI } from './followup-ui.js';

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
  if (typeof window !== 'undefined') {
    window.renamerUI = renamerUI;
    if (window.location.search.includes('test_loaded=1')) {
      setTimeout(() => {
        renamerUI.state.folder = { name: 'Vijay_Ramesh_Yadav', path: 'E:/Students/Vijay_Ramesh_Yadav' };
        renamerUI.state.studentName = 'Vijay Ramesh Yadav';
        renamerUI.state.files = [
          { name: '10th_marksheet.pdf', size: 184320, ext: '.pdf', status: 'pending', targetName: '10TH MARKSHEET VIJAY RAMESH YADAV.pdf', isRenamed: false, matchConfidence: 95 },
          { name: 'adhar_card.pdf', size: 215040, ext: '.pdf', status: 'pending', targetName: 'AADHAAR CARD VIJAY RAMESH YADAV.pdf', isRenamed: false, matchConfidence: 90 },
          { name: 'photo_scan.jpg', size: 95400, ext: '.jpg', status: 'pending', targetName: 'PHOTO VIJAY RAMESH YADAV.jpg', isRenamed: false, matchConfidence: 95 }
        ];
        renamerUI.state.currentIndex = 0;
        renamerUI.renderQueue();
      }, 200);
    }
  }

  // Reset Bulk Renamer whenever navigating away to a different tool tab
  nav.onViewChange = (newView, oldView) => {
    if (oldView === 'bulk-renamer' && newView !== 'bulk-renamer') {
      renamerUI.handleClearQueue(true); // silent reset on tab switch
    }
  };

  // Initialize PDF Studio UI
  const pdfStudioUI = initPdfStudioUI();

  // Initialize Image Studio UI
  const imageStudioUI = initImageStudioUI();

  // Initialize Print Studio UI
  const printStudioUI = initPrintStudioUI();

  // Initialize Follow-up Desk UI
  const followUpUI = initFollowUpUI();

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
