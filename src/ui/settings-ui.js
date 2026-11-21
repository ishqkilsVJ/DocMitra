/**
 * DocMitra System Rules & Settings UI Binding
 * Wires canonical rules, 21 shortcuts, Maharashtra checklists, and validated JSON backup.
 * STRICT RULES:
 * 1. Zero dynamic innerHTML (safe DOM creation methods only).
 * 2. Never suppress or override window.alert.
 * 3. Strict schema validation on Settings Import.
 * 4. LocalStorage + IndexedDB persistence via storage-service.
 */

import { toast } from './toast.js';
import { loadSettings, saveSettings, loadDocumentPresets, saveDocumentPresets } from '../services/storage-service.js';
import { exportSettingsToFile, importSettingsFromFile } from '../services/export-import-service.js';
import { DEFAULT_SHORTCUT_DICTIONARY, exportDictionaryToGroups } from '../libraries/shortcut-keyword-library.js';
import { CANONICAL_NAMES, DEFAULT_CHECKLISTS_DATA } from '../core/constants.js';

export class SettingsUIManager {
  constructor() {
    this.state = null;
    this.initialState = null;
    this.activeChecklist = 'MAHA DBT FORM';
  }

  async init() {
    await this.loadState();
    this._bindButtons();
    this.renderAll();
    console.info('[DocMitra Settings] Settings UI manager initialized.');
  }

  async loadState() {
    this.state = loadSettings();
    try {
      const presets = await loadDocumentPresets();
      if (presets && presets.forms && Object.keys(presets.forms).length > 0) {
        this.state.checklists = presets.forms;
      }
    } catch (e) {
      console.warn('[SettingsUI] Could not load presets from server:', e);
    }
    this.initialState = JSON.parse(JSON.stringify(this.state));
  }

  _bindButtons() {
    // Save button
    const btnSave = document.getElementById('saveRulesBtn');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSave());
    }

    // Reset button
    const btnReset = document.getElementById('resetRulesBtn');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.handleReset());
    }

    // Discard button
    const btnDiscard = document.getElementById('discardBtn');
    if (btnDiscard) {
      btnDiscard.addEventListener('click', () => this.handleDiscard());
    }

    // Add New Custom Rule button
    const btnAddRule = document.getElementById('addNewRuleBtn');
    if (btnAddRule) {
      btnAddRule.addEventListener('click', () => this.handleAddNewRule());
    }

    // Export Settings JSON button
    const btnExport = document.getElementById('btnExportSettingsJSON');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        try {
          exportSettingsToFile(this.state);
          toast.show('Settings Exported', 'Configuration JSON file downloaded.', 'success');
        } catch (err) {
          toast.show('Export Error', err.message, 'error');
        }
      });
    }

    // Import Settings JSON trigger
    const btnImport = document.getElementById('btnTriggerImportJSON');
    const inputImport = document.getElementById('inputImportSettingsJSON');
    if (btnImport && inputImport) {
      btnImport.addEventListener('click', () => inputImport.click());
      inputImport.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          await importSettingsFromFile(file, this.state);
          saveSettings(this.state);
          this.initialState = JSON.parse(JSON.stringify(this.state));
          this.renderAll();
          toast.show('Import Successful', 'System configuration restored and verified.', 'success');
        } catch (err) {
          toast.show('Import Failed', err.message || 'Invalid settings JSON format.', 'error');
        } finally {
          inputImport.value = '';
        }
      });
    }
  }

  renderAll() {
    this.renderCanonicalRules();
    this.renderShortcutMatrix();
    this.renderChecklists();
  }

  renderCanonicalRules() {
    const rowsContainer = document.getElementById('canonicalRuleRows');
    if (!rowsContainer) return;

    // Clear safely
    while (rowsContainer.firstChild) {
      rowsContainer.removeChild(rowsContainer.firstChild);
    }

    const groups = this.state.groups || {};
    const entries = Object.entries(groups);

    entries.forEach(([docName, keywords], idx) => {
      const isAlt = idx % 2 === 1;
      const row = document.createElement('div');
      row.className = `grid grid-cols-12 items-center px-space-md py-space-sm ${isAlt ? 'bg-surface-container-low/40' : 'bg-surface-container-lowest'} hover:bg-surface-container-low transition-colors group`;

      // Col 1: Sr No
      const col1 = document.createElement('div');
      col1.className = 'col-span-1';
      const srBadge = document.createElement('span');
      srBadge.className = 'px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono-code text-[11px] font-bold';
      srBadge.textContent = `#${String(idx + 1).padStart(2, '0')}`;
      col1.appendChild(srBadge);
      row.appendChild(col1);

      // Col 2: Canonical Label
      const col2 = document.createElement('div');
      col2.className = 'col-span-4 flex flex-col pr-space-sm';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors';
      titleSpan.textContent = docName;
      col2.appendChild(titleSpan);

      const tokenSpan = document.createElement('span');
      tokenSpan.className = 'font-mono-code text-[10px] text-on-surface-variant';
      tokenSpan.textContent = `TOKEN_${docName.replace(/[^A-Z0-9]/gi, '_').toUpperCase()}`;
      col2.appendChild(tokenSpan);
      row.appendChild(col2);

      // Col 3: Quick Shortcut
      const col3 = document.createElement('div');
      col3.className = 'col-span-2';
      const dictEntry = DEFAULT_SHORTCUT_DICTIONARY.find(d => d.outputName.toUpperCase() === docName.toUpperCase());
      const scCode = dictEntry ? dictEntry.primaryShortcut : (keywords[0] || 'DOC').toUpperCase().slice(0, 4);

      const scBadge = document.createElement('span');
      scBadge.className = 'px-2 py-1 bg-surface-container-high rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs';
      scBadge.textContent = scCode;
      col3.appendChild(scBadge);
      row.appendChild(col3);

      // Col 4: Keywords badges
      const col4 = document.createElement('div');
      col4.className = 'col-span-4 pr-space-sm';
      const badgesWrap = document.createElement('div');
      badgesWrap.className = 'flex flex-wrap gap-1 max-h-16 overflow-y-auto';

      (keywords || []).forEach(kw => {
        const badge = document.createElement('span');
        const isDevanagari = /[\u0900-\u097F]/.test(kw);
        badge.className = isDevanagari
          ? 'px-1.5 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]'
          : 'px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]';
        badge.textContent = kw;
        badgesWrap.appendChild(badge);
      });
      col4.appendChild(badgesWrap);
      row.appendChild(col4);

      // Col 5: Actions (Edit / Delete)
      const col5 = document.createElement('div');
      col5.className = 'col-span-1 flex items-center justify-end gap-1';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer';
      btnEdit.title = 'Edit Keywords';
      const editIcon = document.createElement('span');
      editIcon.className = 'material-symbols-outlined text-[16px]';
      editIcon.textContent = 'edit';
      btnEdit.appendChild(editIcon);

      btnEdit.addEventListener('click', () => {
        const currentKeywords = (keywords || []).join(', ');
        const updated = window.prompt(`Edit keywords for "${docName}" (comma-separated):`, currentKeywords);
        if (updated !== null) {
          const list = updated.split(',').map(s => s.trim()).filter(Boolean);
          this.state.groups[docName] = list;
          this.renderCanonicalRules();
          toast.show('Rule Updated', `Keywords updated for ${docName}`, 'info');
        }
      });
      col5.appendChild(btnEdit);

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'p-1 text-on-surface-variant hover:text-error hover:bg-error-container hover:text-on-error-container rounded transition-colors cursor-pointer';
      btnDel.title = 'Delete Rule';
      const delIcon = document.createElement('span');
      delIcon.className = 'material-symbols-outlined text-[16px]';
      delIcon.textContent = 'delete';
      btnDel.appendChild(delIcon);

      btnDel.addEventListener('click', () => {
        if (window.confirm(`Are you sure you want to delete canonical rule "${docName}"?`)) {
          delete this.state.groups[docName];
          this.renderCanonicalRules();
          toast.show('Rule Deleted', docName, 'warning');
        }
      });
      col5.appendChild(btnDel);

      row.appendChild(col5);
      rowsContainer.appendChild(row);
    });
  }

  handleAddNewRule() {
    const docName = window.prompt('Enter Canonical Document Label (e.g. "MINORITY CERTIFICATE"):');
    if (!docName || !docName.trim()) return;

    const trimmed = docName.trim().toUpperCase();
    if (this.state.groups[trimmed]) {
      toast.show('Rule Exists', `Rule "${trimmed}" is already registered.`, 'warning');
      return;
    }

    const keywordsInput = window.prompt(`Enter keywords for "${trimmed}" (comma-separated):`, trimmed.toLowerCase());
    const keywords = (keywordsInput || trimmed.toLowerCase()).split(',').map(s => s.trim()).filter(Boolean);

    this.state.groups[trimmed] = keywords;
    this.renderCanonicalRules();
    toast.show('Custom Rule Added', trimmed, 'success');
  }

  renderShortcutMatrix() {
    const matrixContainer = document.getElementById('shortcutMatrixRows');
    if (!matrixContainer) return;

    while (matrixContainer.firstChild) {
      matrixContainer.removeChild(matrixContainer.firstChild);
    }

    // 21 shortcuts list
    const shortcuts = [
      { code: 'ADR', doc: 'Aadhaar Card', logic: 'Match \\b(ADR|Aadhaar|UID)\\b', canonical: 'AADHAAR CARD' },
      { code: 'PAN', doc: 'PAN Card', logic: 'Match \\b(PAN|Pancard)\\b (Never "Pankaj")', canonical: 'PAN CARD' },
      { code: 'PIC', doc: 'Student Photo', logic: 'Match \\b(PIC|Photo|Passport)\\b', canonical: 'PHOTO' },
      { code: '10M', doc: '10th Marksheet', logic: 'Match \\b(10M|10th mark|ssc)\\b', canonical: '10TH MARKSHEET' },
      { code: '10P', doc: '10th Passing', logic: 'Match \\b(10P|10th passing|sanad)\\b', canonical: '10TH PASSING CERTIFICATE' },
      { code: '12M', doc: '12th Marksheet', logic: 'Match \\b(12M|12th mark|hsc)\\b', canonical: '12TH MARKSHEET' },
      { code: '12P', doc: '12th Passing', logic: 'Match \\b(12P|12th passing|hsc pass)\\b', canonical: '12TH PASSING CERTIFICATE' },
      { code: '12LC', doc: '12th Leaving Cert', logic: 'Match \\b(12LC|12th lc|tc|leaving)\\b', canonical: '12TH LC' },
      { code: '12MP', doc: '12th Mark & Passing', logic: 'Combined Dual Document Match', canonical: '12TH MARKSHEET AND PASSING' },
      { code: 'CST', doc: 'Caste Certificate', logic: 'Match \\b(CST|Cast|Caste)\\b (No Validity)', canonical: 'CASTE CERTIFICATE' },
      { code: 'VLD', doc: 'Validity Certificate', logic: 'Match \\b(VLD|Validity|Pramanpatra)\\b', canonical: 'VALIDITY CERTIFICATE' },
      { code: 'DOM', doc: 'Domicile Certificate', logic: 'Match \\b(DOM|Domicile|Adhiwas)\\b', canonical: 'DOMICILE CERTIFICATE' },
      { code: 'NAT', doc: 'Nationality Certificate', logic: 'Match \\b(NAT|Nationality|Rashtriyatva)\\b', canonical: 'NATIONALITY CERTIFICATE' },
      { code: 'INC', doc: 'Income Certificate', logic: 'Match \\b(INC|Income|Utpanna)\\b', canonical: 'INCOME CERTIFICATE' },
      { code: 'BNK', doc: 'Bank Passbook', logic: 'Match \\b(BNK|Passbook|Bank)\\b', canonical: 'PASSBOOK BANK' },
      { code: 'ATM', doc: 'Attempt Certificate', logic: 'Match \\b(ATM|Attempt)\\b', canonical: 'ATTEMPT CERTIFICATE' },
      { code: 'BRT', doc: 'Birth Certificate', logic: 'Match \\b(BRT|Birth|Janam)\\b', canonical: 'BIRTH CERTIFICATE' },
      { code: 'BNF', doc: 'Bonafide Certificate', logic: 'Match \\b(BNF|Bonafide)\\b', canonical: 'BONAFIDE CERTIFICATE' },
      { code: 'GAP', doc: 'Gap Certificate', logic: 'Match \\b(GAP|Gap cert|Affidavit)\\b', canonical: 'GAP CERTIFICATE' },
      { code: 'SLF', doc: 'Self Declaration', logic: 'Match \\b(SLF|Self decl|Pratidnyapatra)\\b', canonical: 'SELF DECLARATION' },
      { code: 'PAR', doc: 'Parent Declaration', logic: 'Match \\b(PAR|Parent decl)\\b', canonical: 'PARENT DECLARATION' }
    ];

    shortcuts.forEach(item => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 items-center px-space-md py-2 hover:bg-surface-container-lowest transition-colors';

      const c1 = document.createElement('div');
      c1.className = 'col-span-2';
      const badge = document.createElement('span');
      badge.className = 'px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono-code text-[12px] font-bold';
      badge.textContent = item.code;
      c1.appendChild(badge);
      row.appendChild(c1);

      const c2 = document.createElement('div');
      c2.className = 'col-span-4 font-label-md font-semibold text-on-surface';
      c2.textContent = item.doc;
      row.appendChild(c2);

      const c3 = document.createElement('div');
      c3.className = 'col-span-4 font-mono-code text-[11px] text-secondary';
      c3.textContent = item.logic;
      row.appendChild(c3);

      const c4 = document.createElement('div');
      c4.className = 'col-span-2 text-right';
      const safeBadge = document.createElement('span');
      safeBadge.className = 'px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono-code text-[10px] font-bold';
      safeBadge.textContent = 'Word-Safe \\b';
      c4.appendChild(safeBadge);
      row.appendChild(c4);

      matrixContainer.appendChild(row);
    });
  }

  renderChecklists() {
    const tabsContainer = document.getElementById('checklistFormTabs');
    const rulesList = document.getElementById('checklistRulesList');
    if (!tabsContainer || !rulesList) return;

    while (tabsContainer.firstChild) tabsContainer.removeChild(tabsContainer.firstChild);
    while (rulesList.firstChild) rulesList.removeChild(rulesList.firstChild);

    const checklists = this.state.checklists || DEFAULT_CHECKLISTS_DATA;
    const forms = Object.keys(checklists);

    forms.forEach(formName => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = formName === this.activeChecklist;
      btn.className = isActive
        ? 'px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm font-bold shadow-xs cursor-pointer'
        : 'px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm font-semibold cursor-pointer';
      btn.textContent = formName;

      btn.addEventListener('click', () => {
        this.activeChecklist = formName;
        this.renderChecklists();
      });

      tabsContainer.appendChild(btn);
    });

    const currentRules = checklists[this.activeChecklist] || [];

    // Header Toolbar with "Add Document" Button
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30';
    const formTitle = document.createElement('span');
    formTitle.className = 'font-label-sm font-bold text-secondary uppercase';
    formTitle.textContent = `${this.activeChecklist} (${currentRules.length} Documents)`;
    headerRow.appendChild(formTitle);

    const btnAddDoc = document.createElement('button');
    btnAddDoc.type = 'button';
    btnAddDoc.className = 'px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm font-bold flex items-center gap-1 shadow-xs cursor-pointer hover:bg-primary/90';
    const addIcon = document.createElement('span');
    addIcon.className = 'material-symbols-outlined text-[14px]';
    addIcon.textContent = 'add';
    btnAddDoc.appendChild(addIcon);
    btnAddDoc.appendChild(document.createTextNode('Add Document'));
    btnAddDoc.onclick = () => {
      const docName = window.prompt('Enter document name (e.g. INCOME CERTIFICATE):');
      if (!docName || !docName.trim()) return;
      const docCode = window.prompt('Enter document shortcode (e.g. INC):') || '';
      const newRule = {
        name: docName.trim().toUpperCase(),
        code: docCode.trim().toUpperCase(),
        required: true
      };
      if (!checklists[this.activeChecklist]) checklists[this.activeChecklist] = [];
      checklists[this.activeChecklist].push(newRule);
      this.state.checklists = checklists;
      this.renderChecklists();
      toast.show('Document Added', `${newRule.name} added to ${this.activeChecklist}`, 'success');
    };
    headerRow.appendChild(btnAddDoc);
    rulesList.appendChild(headerRow);

    currentRules.forEach((rule, idx) => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-3 shadow-2xs';

      const ruleName = typeof rule === 'string' ? rule : (rule.name || (Array.isArray(rule) ? rule[0] : ''));
      const ruleCode = rule.code || '';
      const isRequired = rule.required !== undefined ? !!rule.required : true;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2.5 min-w-0 flex-1';

      const num = document.createElement('span');
      num.className = 'w-6 h-6 rounded bg-surface-container text-secondary font-mono-code text-[11px] font-bold flex items-center justify-center shrink-0';
      num.textContent = String(idx + 1);
      left.appendChild(num);

      if (ruleCode) {
        const codeBadge = document.createElement('span');
        codeBadge.className = 'px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono-code text-[10px] font-bold shrink-0';
        codeBadge.textContent = ruleCode;
        left.appendChild(codeBadge);
      }

      const name = document.createElement('span');
      name.className = 'font-label-md font-bold text-on-surface truncate';
      name.textContent = ruleName;
      left.appendChild(name);
      card.appendChild(left);

      const right = document.createElement('div');
      right.className = 'flex items-center gap-1.5 shrink-0';

      // Required / Optional toggle button
      const reqBtn = document.createElement('button');
      reqBtn.type = 'button';
      reqBtn.className = isRequired
        ? 'px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono-code text-[10px] font-bold cursor-pointer transition-colors'
        : 'px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono-code text-[10px] font-semibold cursor-pointer transition-colors';
      reqBtn.textContent = isRequired ? 'Mandatory' : 'Optional';
      reqBtn.title = 'Click to toggle Mandatory / Optional';
      reqBtn.onclick = () => {
        if (typeof rule === 'object' && !Array.isArray(rule)) {
          rule.required = !isRequired;
        } else {
          currentRules[idx] = {
            name: ruleName,
            code: ruleCode,
            required: !isRequired
          };
        }
        this.renderChecklists();
      };
      right.appendChild(reqBtn);

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'w-6 h-6 rounded bg-surface-container hover:bg-surface-container-high text-secondary flex items-center justify-center cursor-pointer transition-colors';
      editBtn.title = 'Edit document rule';
      const editIcon = document.createElement('span');
      editIcon.className = 'material-symbols-outlined text-[13px]';
      editIcon.textContent = 'edit';
      editBtn.appendChild(editIcon);
      editBtn.onclick = () => {
        const newName = window.prompt('Edit document name:', ruleName);
        if (!newName || !newName.trim()) return;
        const newCode = window.prompt('Edit document shortcode:', ruleCode) || '';
        currentRules[idx] = {
          name: newName.trim().toUpperCase(),
          code: newCode.trim().toUpperCase(),
          required: isRequired
        };
        this.renderChecklists();
        toast.show('Document Updated', newName, 'info');
      };
      right.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'w-6 h-6 rounded bg-surface-container hover:bg-error/20 hover:text-error text-secondary flex items-center justify-center cursor-pointer transition-colors';
      delBtn.title = 'Delete document rule';
      const delIcon = document.createElement('span');
      delIcon.className = 'material-symbols-outlined text-[13px]';
      delIcon.textContent = 'delete';
      delBtn.appendChild(delIcon);
      delBtn.onclick = () => {
        if (window.confirm(`Remove ${ruleName} from ${this.activeChecklist}?`)) {
          currentRules.splice(idx, 1);
          this.renderChecklists();
          toast.show('Document Removed', ruleName, 'info');
        }
      };
      right.appendChild(delBtn);

      card.appendChild(right);
      rulesList.appendChild(card);
    });
  }

  async handleSave() {
    saveSettings(this.state);
    await saveDocumentPresets({ forms: this.state.checklists });
    this.initialState = JSON.parse(JSON.stringify(this.state));
    toast.show('Settings Saved', 'System rules updated and applied to workstation.', 'success');

    // Close modal
    const overlay = document.getElementById('settings-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  handleReset() {
    if (window.confirm('Reset all rules, shortcuts, and checklists to factory defaults?')) {
      this.state.groups = exportDictionaryToGroups();
      this.state.checklists = JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS_DATA));
      saveSettings(this.state);
      this.initialState = JSON.parse(JSON.stringify(this.state));
      this.renderAll();
      toast.show('Factory Defaults Restored', 'All default rules loaded.', 'info');
    }
  }

  handleDiscard() {
    this.state = JSON.parse(JSON.stringify(this.initialState));
    this.renderAll();
    toast.show('Changes Discarded', 'Reverted to previous configuration.', 'info');

    // Close modal
    const overlay = document.getElementById('settings-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

export function initSettingsUI() {
  const manager = new SettingsUIManager();
  manager.init();
  return manager;
}
