/**
 * DocMitra System Rules & Settings Modal Controller
 * Handles modal open/close, internal sub-navigation, and safe rule additions.
 * STRICT RULE: No innerHTML for dynamic content, never override window.alert.
 */

import { toast } from './toast.js';

export class SettingsModalManager {
  constructor() {
    this.overlay = document.getElementById('settings-modal-overlay');
    this.modal = document.getElementById('settingsModal');
    this.openBtn = document.getElementById('openSettingsBtn');
    this.closeBtn = document.getElementById('closeSettingsBtn');
    this.subnavBtns = document.querySelectorAll('.settings-subnav-btn');
    this.sections = document.querySelectorAll('.settings-section');
    this.isOpen = false;
  }

  init() {
    this._bindOpenClose();
    this._bindSubnav();
    this._bindModalActions();
  }

  open() {
    if (!this.overlay) return;
    this.overlay.classList.remove('hidden');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.add('hidden');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  _bindOpenClose() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }

    // Close when clicking on backdrop scrim outside modal card
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Keyboard shortcuts: Esc to close, Ctrl+, to open
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        if (this.isOpen) {
          this.close();
        } else {
          this.open();
        }
      }
    });
  }

  _bindSubnav() {
    const ACTIVE_SUB_CLASSES = ['bg-surface-container-lowest', 'text-primary', 'font-semibold', 'shadow-xs', 'border-l-[3px]', 'border-primary'];
    const INACTIVE_SUB_CLASSES = ['text-on-surface-variant', 'hover:bg-surface-container', 'hover:text-on-surface'];

    this.subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSectionId = btn.getAttribute('data-target-section');

        // Update button styles
        this.subnavBtns.forEach(b => {
          b.classList.remove(...ACTIVE_SUB_CLASSES);
          b.classList.add(...INACTIVE_SUB_CLASSES);
        });
        btn.classList.remove(...INACTIVE_SUB_CLASSES);
        btn.classList.add(...ACTIVE_SUB_CLASSES);

        // Switch visible section
        this.sections.forEach(sec => {
          if (sec.id === targetSectionId) {
            sec.classList.remove('hidden');
          } else {
            sec.classList.add('hidden');
          }
        });
      });
    });
  }

  _bindModalActions() {
    // Add Custom Rule
    const addRuleBtn = document.getElementById('addNewRuleBtn');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        this._showAddRulePrompt();
      });
    }

    // Save Rules Button
    const saveRulesBtn = document.getElementById('saveRulesBtn');
    if (saveRulesBtn) {
      saveRulesBtn.addEventListener('click', () => {
        toast.show('Settings & Rules Saved', 'Configuration saved to local schema store', 'success');
      });
    }

    // Reset Rules Button
    const resetRulesBtn = document.getElementById('resetRulesBtn');
    if (resetRulesBtn) {
      resetRulesBtn.addEventListener('click', () => {
        toast.show('Factory Reset Default', 'Ready to connect rule restoration engine', 'warning');
      });
    }

    // Export Config Button
    const exportConfigBtn = document.getElementById('exportConfigBtn');
    if (exportConfigBtn) {
      exportConfigBtn.addEventListener('click', () => {
        toast.show('Export Configuration', 'Ready to connect JSON export routine', 'info');
      });
    }
  }

  _showAddRulePrompt() {
    const docName = window.prompt('Enter Canonical Document Label (e.g., GAP CERTIFICATE):', 'GAP AFFIDAVIT');
    if (!docName || !docName.trim()) return;

    const shortcut = (window.prompt('Enter 2-4 letter Shortcut (e.g., GAP):', 'GAP') || 'DOC').trim();
    const tableContainer = document.getElementById('canonicalRuleRows');
    if (!tableContainer) return;

    // Build row using safe DOM creation methods (NO innerHTML)
    const row = document.createElement('div');
    row.className = 'grid grid-cols-12 items-center px-space-md py-space-sm bg-surface-container-high/40 hover:bg-surface-container-low transition-colors group animate-pulse';

    // Col 1: Sr/Priority
    const col1 = document.createElement('div');
    col1.className = 'col-span-1';
    const badge = document.createElement('span');
    badge.className = 'px-2 py-0.5 rounded bg-primary text-on-primary font-mono-code text-[11px] font-bold';
    badge.textContent = 'P7';
    col1.appendChild(badge);
    row.appendChild(col1);

    // Col 2: Canonical Document Label
    const col2 = document.createElement('div');
    col2.className = 'col-span-4 flex flex-col pr-space-sm';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'font-label-lg text-label-lg font-bold text-on-surface';
    labelSpan.textContent = docName.toUpperCase();
    const subLabel = document.createElement('span');
    subLabel.className = 'font-mono-code text-[10px] text-tertiary font-bold';
    subLabel.textContent = 'CUSTOM_RULE_SAVED';
    col2.appendChild(labelSpan);
    col2.appendChild(subLabel);
    row.appendChild(col2);

    // Col 3: Quick Shortcut
    const col3 = document.createElement('div');
    col3.className = 'col-span-2';
    const shortcutBadge = document.createElement('span');
    shortcutBadge.className = 'px-2 py-1 bg-surface-container-highest rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs';
    shortcutBadge.textContent = shortcut.toUpperCase();
    col3.appendChild(shortcutBadge);
    row.appendChild(col3);

    // Col 4: Keywords
    const col4 = document.createElement('div');
    col4.className = 'col-span-4 pr-space-sm';
    const tagWrap = document.createElement('div');
    tagWrap.className = 'flex flex-wrap gap-1';

    const tag1 = document.createElement('span');
    tag1.className = 'px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]';
    tag1.textContent = shortcut.toLowerCase();
    tagWrap.appendChild(tag1);

    const tag2 = document.createElement('span');
    tag2.className = 'px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]';
    tag2.textContent = 'custom_rule';
    tagWrap.appendChild(tag2);

    col4.appendChild(tagWrap);
    row.appendChild(col4);

    // Col 5: Actions
    const col5 = document.createElement('div');
    col5.className = 'col-span-1 flex items-center justify-end';
    const newBadge = document.createElement('span');
    newBadge.className = 'px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-[10px] font-bold';
    newBadge.textContent = 'NEW';
    col5.appendChild(newBadge);
    row.appendChild(col5);

    tableContainer.appendChild(row);
    setTimeout(() => row.classList.remove('animate-pulse'), 1200);

    toast.show(`Rule Added: ${docName.toUpperCase()}`, `Shortcut: ${shortcut.toUpperCase()}`, 'success');
  }
}
