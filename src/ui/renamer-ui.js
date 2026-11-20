/**
 * DocMitra Bulk Document Renamer UI Binding & Adapter
 * Connects the Stitch Renamer screen to pure logic in src/libraries, src/core, and src/services.
 * STRICT RULES:
 * 1. Zero dynamic innerHTML (safe DOM creation methods only).
 * 2. Never suppress or override window.alert.
 * 3. 21 Shortcuts: ADR, PAN, PIC, 10M, 10P, 12M, 12P, 12LC, 12MP, CST, VLD, DOM, NAT, INC, BNK, ATM, BRT, BNF, GAP, SLF, PAR.
 * 4. Safe Atomic Rename with Windows case-insensitive temp naming and reserved name / trailing dot/space checks.
 * 5. Multi-level Undo stack preserved across operations.
 */

import { toast } from './toast.js';
import { selectNativeFolder, renameNativeFile, isNativeAvailable } from '../services/native-bridge-service.js';
import { matchDocument } from '../libraries/shortcut-keyword-library.js';
import { evaluateMatch } from '../libraries/document-matcher.js';
import { buildName, cleanName, ext, validateFilename, executeRename, undoRename } from '../libraries/rename-library.js';
import { uniqueDestination } from '../libraries/duplicate-name-library.js';
import { undoManager } from '../libraries/undo-library.js';
import { issuesFor, correctSpelling } from '../libraries/spelling-library.js';
import { generateBatchAuditCSV, downloadCSV } from '../libraries/export-reports-library.js';
import { loadSettings, saveSettings } from '../services/storage-service.js';
import { CANONICAL_NAMES, DEFAULT_SPELLING_RULES } from '../core/constants.js';

export class RenamerUIManager {
  constructor() {
    this.state = {
      folder: null, // { name, path, nativePath }
      files: [],    // Array of file models
      currentIndex: 0,
      studentName: '',
      style: 'preserve', // 'preserve' | 'upper' | 'lower' | 'title'
      settings: null,
      history: [],
      zoom: 100,
      rotation: 0
    };

    // 21 Canonical Shortcut Engine List
    this.shortcuts21 = [
      { code: 'ADR', label: 'Aadhaar Card', canonical: 'AADHAAR CARD' },
      { code: 'PAN', label: 'PAN Card', canonical: 'PAN CARD' },
      { code: 'PIC', label: 'Student Photo', canonical: 'PHOTO' },
      { code: '10M', label: '10th Marksheet', canonical: '10TH MARKSHEET' },
      { code: '10P', label: '10th Passing', canonical: '10TH PASSING CERTIFICATE' },
      { code: '12M', label: '12th Marksheet', canonical: '12TH MARKSHEET' },
      { code: '12P', label: '12th Passing', canonical: '12TH PASSING CERTIFICATE' },
      { code: '12LC', label: '12th Leaving Cert', canonical: '12TH LC' },
      { code: '12MP', label: '12th Mark & Pass', canonical: '12TH MARKSHEET AND PASSING' },
      { code: 'CST', label: 'Caste Certificate', canonical: 'CASTE CERTIFICATE' },
      { code: 'VLD', label: 'Validity Cert', canonical: 'VALIDITY CERTIFICATE' },
      { code: 'DOM', label: 'Domicile Cert', canonical: 'DOMICILE CERTIFICATE' },
      { code: 'NAT', label: 'Nationality Cert', canonical: 'NATIONALITY CERTIFICATE' },
      { code: 'INC', label: 'Income Certificate', canonical: 'INCOME CERTIFICATE' },
      { code: 'BNK', label: 'Bank Passbook', canonical: 'PASSBOOK BANK' },
      { code: 'ATM', label: 'Attempt Cert', canonical: 'ATTEMPT CERTIFICATE' },
      { code: 'BRT', label: 'Birth Certificate', canonical: 'BIRTH CERTIFICATE' },
      { code: 'BNF', label: 'Bonafide Cert', canonical: 'BONAFIDE CERTIFICATE' },
      { code: 'GAP', label: 'Gap Certificate', canonical: 'GAP CERTIFICATE' },
      { code: 'SLF', label: 'Self Declaration', canonical: 'SELF DECLARATION' },
      { code: 'PAR', label: 'Parent Declaration', canonical: 'PARENT DECLARATION' }
    ];
  }

  init() {
    this.state.settings = loadSettings();
    this.state.style = this.state.settings.style || 'preserve';
    this._bindDOM();
    this._bindKeyboardShortcuts();
    console.info('[DocMitra Renamer] Renamer UI manager initialized.');
  }

  _bindDOM() {
    // Select Folder button
    const btnSelect = document.getElementById('btnSelectFolder');
    if (btnSelect) {
      btnSelect.addEventListener('click', () => this.handleSelectFolder());
    }

    // Add Files button
    const btnAdd = document.getElementById('btnAddFiles');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.handleAddFiles());
    }

    // Rescan Folder button
    const btnRescan = document.getElementById('btnRescanFolder');
    if (btnRescan) {
      btnRescan.addEventListener('click', () => this.handleRescan());
    }

    // Copy Folder Path button
    const btnCopy = document.getElementById('btnCopyFolderPath');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        if (this.state.folder?.path) {
          navigator.clipboard.writeText(this.state.folder.path);
          toast.show('Copied to Clipboard', this.state.folder.path, 'info');
        }
      });
    }

    // Rename All Button (F8)
    const btnRenameAll = document.getElementById('btnRenameAll');
    if (btnRenameAll) {
      btnRenameAll.addEventListener('click', () => this.handleRenameAll());
    }

    // Undo Rename Button (Ctrl+Z)
    const btnUndo = document.getElementById('btnUndoRename');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => this.handleUndo());
    }

    // Keep Original & Next (Tab)
    const btnKeep = document.getElementById('btnKeepOriginal');
    if (btnKeep) {
      btnKeep.addEventListener('click', () => this.handleKeepOriginal());
    }

    // Save Batch (Ctrl+S)
    const btnSave = document.getElementById('btnSaveBatch');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSaveBatch());
    }

    // Export Audit (F9)
    const btnExport = document.getElementById('btnExportAudit');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.handleExportAudit());
    }

    // Clear Queue
    const btnClear = document.getElementById('btnClearQueue');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClearQueue());
    }

    // Preview zoom controls
    this._bindPreviewControls();
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Only process when bulk renamer view is visible and not typing inside modal
      const renamerView = document.getElementById('view-bulk-renamer');
      if (!renamerView || renamerView.classList.contains('hidden')) return;

      const modalOverlay = document.getElementById('settings-modal-overlay');
      if (modalOverlay && !modalOverlay.classList.contains('hidden')) return;

      // F2: Select folder
      if (e.key === 'F2') {
        e.preventDefault();
        this.handleSelectFolder();
        return;
      }

      // F8: Rename All
      if (e.key === 'F8') {
        e.preventDefault();
        this.handleRenameAll();
        return;
      }

      // F9: Export Audit
      if (e.key === 'F9') {
        e.preventDefault();
        this.handleExportAudit();
        return;
      }

      // Ctrl+Z: Undo Rename
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (e.target.tagName !== 'INPUT') {
          e.preventDefault();
          this.handleUndo();
          return;
        }
      }

      // Ctrl+S: Save Batch
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.handleSaveBatch();
        return;
      }

      // Tab: Keep Original & Next (when on active rename input)
      if (e.key === 'Tab') {
        const activeInput = document.getElementById('inputRenameTarget');
        if (e.target === activeInput) {
          e.preventDefault();
          this.handleConfirmCurrentName(activeInput.value);
          return;
        }
      }
    });
  }

  _bindPreviewControls() {
    const colPreview = document.getElementById('col-preview');
    if (!colPreview) return;

    const btnZoomIn = colPreview.querySelector('button[title*="Zoom In"]');
    const btnZoomOut = colPreview.querySelector('button[title*="Zoom Out"]');
    const btnReset = colPreview.querySelector('button[title*="Reset Zoom"]');
    const btnRotate = colPreview.querySelector('button[title*="Rotate"]');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        this.state.zoom = Math.min(300, this.state.zoom + 20);
        this._applyPreviewTransform();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        this.state.zoom = Math.max(40, this.state.zoom - 20);
        this._applyPreviewTransform();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.state.zoom = 100;
        this.state.rotation = 0;
        this._applyPreviewTransform();
      });
    }

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        this.state.rotation = (this.state.rotation + 90) % 360;
        this._applyPreviewTransform();
      });
    }
  }

  _applyPreviewTransform() {
    const stage = document.getElementById('previewContainerStage');
    if (stage) {
      stage.style.transform = `scale(${this.state.zoom / 100}) rotate(${this.state.rotation}deg)`;
      stage.style.transformOrigin = 'center center';
      stage.style.transition = 'transform 0.2s ease-out';
    }
  }

  /**
   * Triggers native OS folder picker with ZERO browser sandbox prompts
   */
  async handleSelectFolder() {
    toast.show('Opening Folder Picker', 'Navigating Windows Explorer...', 'info');
    try {
      const res = await selectNativeFolder();
      if (!res.success) {
        if (!res.cancelled) {
          toast.show('Folder Select Error', res.error || 'Failed to select folder', 'error');
        }
        return;
      }

      this.loadFolderData(res);
      toast.show('Folder Loaded', `${res.files ? res.files.length : 0} files found`, 'success');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  loadFolderData(data) {
    const folderPath = data.path || '';
    const folderName = data.name || (folderPath ? folderPath.split(/[\\/]/).pop() : 'Selected Folder');

    // Extract student name from folder if formatted like "Vijay_Ramesh_Yadav"
    const guessedStudent = folderName.replace(/_/g, ' ').trim();

    this.state.folder = {
      name: folderName,
      path: folderPath,
      nativePath: folderPath
    };
    this.state.studentName = guessedStudent;

    const filesRaw = data.files || [];
    const usedDestinations = new Set();

    // Map files and run matching algorithm
    this.state.files = filesRaw.map((f, idx) => {
      const extension = f.ext || ext(f.name);
      const baseName = cleanName(f.name);

      // Match against 21 shortcuts & canonical rules
      const matchResult = evaluateMatch(baseName, this.state.settings?.groups);
      const docType = matchResult.docType || matchDocument(baseName, this.state.settings?.groups) || null;

      let suggested = baseName;
      let isMatched = false;

      if (docType) {
        const canonical = CANONICAL_NAMES[docType.toUpperCase()] || docType;
        suggested = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
        isMatched = true;
      }

      // Unique destination check
      const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
      const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations);
      usedDestinations.add(uniqueName);

      return {
        id: `file_${idx}_${Date.now()}`,
        name: f.name,
        path: f.path || `${folderPath}/${f.name}`,
        size: f.size || 0,
        ext: extension,
        url: f.url || (f.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(f.path)}` : null),
        docType: docType,
        isMatched: isMatched,
        suggestedName: uniqueName,
        targetName: uniqueName,
        status: isMatched ? 'matched' : 'pending', // 'matched' | 'pending' | 'renamed' | 'kept'
        isRenamed: false,
        isKept: false
      };
    });

    this.state.currentIndex = 0;
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
  }

  updateTelemetry() {
    const total = this.state.files.length;
    const matched = this.state.files.filter(f => f.isMatched || f.status === 'renamed' || f.status === 'kept').length;
    const pending = total - matched;
    const totalBytes = this.state.files.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const pct = total > 0 ? Math.round((matched / total) * 100) : 0;

    const pathEl = document.getElementById('activeFolderPath');
    if (pathEl) {
      pathEl.textContent = this.state.folder ? this.state.folder.path : 'No folder selected';
    }

    const countEl = document.getElementById('telemetryTotalFiles');
    if (countEl) countEl.textContent = String(total);

    const matchedEl = document.getElementById('telemetryMatchedFiles');
    if (matchedEl) matchedEl.textContent = `${matched} (${pct}%)`;

    const pendingEl = document.getElementById('telemetryPendingFiles');
    if (pendingEl) pendingEl.textContent = String(pending);

    const sizeEl = document.getElementById('telemetryTotalSize');
    if (sizeEl) sizeEl.textContent = `${totalMB} MB`;

    const renameAllBtn = document.getElementById('btnRenameAll');
    if (renameAllBtn) {
      const pendingToRename = this.state.files.filter(f => !f.isRenamed && !f.isKept && f.targetName !== f.name);
      const span = renameAllBtn.querySelector('.font-bold');
      if (span) {
        span.textContent = `Rename All (${pendingToRename.length} Files)`;
      }
    }
  }

  renderQueue() {
    const queueCol = document.getElementById('col-queue');
    if (!queueCol) return;

    // Clear safely without innerHTML
    while (queueCol.firstChild) {
      queueCol.removeChild(queueCol.firstChild);
    }

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'flex flex-col gap-space-sm overflow-y-auto pr-1 flex-1 min-h-0 custom-pan-scroll pan-grab-active queue-scroll-area';

    if (this.state.files.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'p-6 text-center text-secondary bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center gap-2';
      
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[36px] text-primary opacity-60';
      icon.textContent = 'folder_open';
      emptyCard.appendChild(icon);

      const title = document.createElement('div');
      title.className = 'font-headline-sm font-bold text-on-surface';
      title.textContent = 'No Intake Folder Selected';
      emptyCard.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'text-body-sm text-secondary';
      desc.textContent = 'Click "Select Folder" (F2) above to load student files and run automated canonical matching.';
      emptyCard.appendChild(desc);

      scrollContainer.appendChild(emptyCard);
      queueCol.appendChild(scrollContainer);
      return;
    }

    const currentFile = this.state.files[this.state.currentIndex];

    // 1. ACTIVE EDITING CARD
    if (currentFile) {
      const activeCardWrapper = document.createElement('div');
      activeCardWrapper.className = 'flex flex-col gap-space-xs shrink-0';

      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-center justify-between px-1 text-label-sm';

      const badgeGroup = document.createElement('div');
      badgeGroup.className = 'flex items-center gap-2';
      const editingBadge = document.createElement('span');
      editingBadge.className = 'px-2.5 py-1 rounded bg-primary text-on-primary font-bold text-[11px] flex items-center gap-1.5 shadow-sm';
      
      const editIcon = document.createElement('span');
      editIcon.className = 'material-symbols-outlined text-[14px]';
      editIcon.textContent = 'edit_document';
      editingBadge.appendChild(editIcon);

      const editText = document.createTextNode(`Editing ${this.state.currentIndex + 1} of ${this.state.files.length}`);
      editingBadge.appendChild(editText);
      badgeGroup.appendChild(editingBadge);
      headerRow.appendChild(badgeGroup);

      const statusTag = document.createElement('span');
      statusTag.className = currentFile.isMatched
        ? 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold'
        : 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold';
      statusTag.textContent = currentFile.isMatched ? 'Matched' : 'Unmatched';
      headerRow.appendChild(statusTag);

      activeCardWrapper.appendChild(headerRow);

      const card = document.createElement('article');
      card.className = 'bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md border-2 border-primary ring-2 ring-primary/20 relative';

      // Original filename label
      const origRow = document.createElement('div');
      origRow.className = 'flex items-center justify-between text-[11px] font-mono-code text-secondary';
      const origLabel = document.createElement('span');
      origLabel.textContent = 'Original: ';
      const origVal = document.createElement('strong');
      origVal.className = 'text-on-surface truncate max-w-[260px] inline-block';
      origVal.textContent = currentFile.name;
      origLabel.appendChild(origVal);
      origRow.appendChild(origLabel);

      const sizeLabel = document.createElement('span');
      sizeLabel.textContent = `${(currentFile.size / 1024).toFixed(0)} KB`;
      origRow.appendChild(sizeLabel);
      card.appendChild(origRow);

      // Rename target input
      const inputSection = document.createElement('div');
      inputSection.className = 'flex flex-col gap-1.5';

      const labelRow = document.createElement('div');
      labelRow.className = 'flex items-center justify-between font-label-sm font-semibold';
      const renameLabel = document.createElement('label');
      renameLabel.className = 'text-on-surface font-bold text-[13px]';
      renameLabel.textContent = 'Rename To:';
      labelRow.appendChild(renameLabel);

      const tipSpan = document.createElement('span');
      tipSpan.className = 'text-secondary text-[11px] flex items-center gap-1';
      tipSpan.appendChild(document.createTextNode('Press '));
      const kbd = document.createElement('kbd');
      kbd.className = 'px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40';
      kbd.textContent = 'Tab';
      tipSpan.appendChild(kbd);
      tipSpan.appendChild(document.createTextNode(' to save'));
      labelRow.appendChild(tipSpan);
      inputSection.appendChild(labelRow);

      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'relative flex items-center';

      const targetInput = document.createElement('input');
      targetInput.id = 'inputRenameTarget';
      targetInput.type = 'text';
      targetInput.className = 'w-full h-11 px-3 rounded-lg bg-surface-container-lowest font-mono-code text-[14px] text-on-surface font-semibold border-2 border-primary focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all';
      targetInput.value = currentFile.targetName || currentFile.suggestedName || currentFile.name;

      targetInput.addEventListener('input', (e) => {
        const val = e.target.value;
        currentFile.targetName = val;
        this.updateTelemetry();
      });

      targetInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleConfirmCurrentName(targetInput.value);
        }
      });

      inputWrapper.appendChild(targetInput);
      inputSection.appendChild(inputWrapper);
      card.appendChild(inputSection);

      // 21 Quick Document Presets Grid
      const presetsSection = document.createElement('div');
      presetsSection.className = 'flex flex-col gap-1.5 pt-2 border-t border-surface-container';

      const presetHeader = document.createElement('div');
      presetHeader.className = 'flex items-center justify-between';
      const presetTitle = document.createElement('span');
      presetTitle.className = 'font-label-sm text-secondary font-semibold flex items-center gap-1.5';
      const boltIcon = document.createElement('span');
      boltIcon.className = 'material-symbols-outlined text-[15px] text-primary';
      boltIcon.textContent = 'bolt';
      presetTitle.appendChild(boltIcon);
      presetTitle.appendChild(document.createTextNode('Quick 21-Shortcut Presets:'));
      presetHeader.appendChild(presetTitle);

      const presetTip = document.createElement('span');
      presetTip.className = 'text-label-sm text-secondary font-mono-code text-[10px]';
      presetTip.textContent = 'Click to rename';
      presetHeader.appendChild(presetTip);
      presetsSection.appendChild(presetHeader);

      const presetsGrid = document.createElement('div');
      presetsGrid.className = 'grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5';

      this.shortcuts21.forEach(sc => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[11px] font-semibold border border-outline-variant/40 hover:border-primary/50 transition-all flex items-center gap-1 shadow-xs justify-center cursor-pointer';

        const badge = document.createElement('span');
        badge.className = 'px-1 py-0.2 rounded bg-surface-container-highest text-secondary text-[9px] font-bold';
        badge.textContent = sc.code;
        btn.appendChild(badge);

        const lbl = document.createElement('span');
        lbl.className = 'truncate';
        lbl.textContent = sc.label;
        btn.appendChild(lbl);

        btn.addEventListener('click', () => {
          this.applyShortcutToCurrent(sc);
        });

        presetsGrid.appendChild(btn);
      });

      presetsSection.appendChild(presetsGrid);
      card.appendChild(presetsSection);

      activeCardWrapper.appendChild(card);
      scrollContainer.appendChild(activeCardWrapper);
    }

    // 2. UPCOMING QUEUE
    const upcomingFiles = this.state.files.filter((_, i) => i > this.state.currentIndex && !_.isRenamed && !_.isKept);
    if (upcomingFiles.length > 0) {
      const upHeader = document.createElement('div');
      upHeader.className = 'flex items-center justify-between px-2 py-1 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-mono-code text-secondary shrink-0';
      
      const leftPart = document.createElement('div');
      leftPart.className = 'flex items-center gap-1.5 text-primary font-semibold';
      const upIcon = document.createElement('span');
      upIcon.className = 'material-symbols-outlined text-[15px]';
      upIcon.textContent = 'north';
      leftPart.appendChild(upIcon);
      leftPart.appendChild(document.createTextNode('UPCOMING QUEUE'));
      upHeader.appendChild(leftPart);

      const rightPart = document.createElement('span');
      rightPart.className = 'text-[10px] text-secondary font-medium uppercase';
      rightPart.textContent = `${upcomingFiles.length} files waiting`;
      upHeader.appendChild(rightPart);

      scrollContainer.appendChild(upHeader);

      const upList = document.createElement('div');
      upList.className = 'flex flex-col gap-1.5 shrink-0';

      upcomingFiles.slice(0, 10).forEach(f => {
        const fIdx = this.state.files.indexOf(f);
        const item = document.createElement('article');
        item.className = 'bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-2 flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer';

        item.addEventListener('click', () => {
          this.state.currentIndex = fIdx;
          this.renderQueue();
          this.renderCurrentPreview();
        });

        const leftCol = document.createElement('div');
        leftCol.className = 'flex items-center gap-2.5 min-w-0 flex-1';

        const numBadge = document.createElement('span');
        numBadge.className = 'w-5 h-5 rounded bg-surface-container text-secondary font-mono-code font-medium text-[11px] flex items-center justify-center shrink-0';
        numBadge.textContent = String(fIdx + 1);
        leftCol.appendChild(numBadge);

        const nameCol = document.createElement('div');
        nameCol.className = 'flex flex-col min-w-0';

        const targetTitle = document.createElement('span');
        targetTitle.className = 'font-mono-code text-[12px] text-on-surface font-semibold truncate';
        targetTitle.textContent = f.targetName || f.suggestedName || f.name;
        nameCol.appendChild(targetTitle);

        const origTitle = document.createElement('span');
        origTitle.className = 'text-[10px] font-mono-code text-secondary truncate';
        origTitle.textContent = f.name;
        nameCol.appendChild(origTitle);

        leftCol.appendChild(nameCol);
        item.appendChild(leftCol);

        const tag = document.createElement('span');
        tag.className = f.isMatched
          ? 'px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase shrink-0'
          : 'px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-surface-variant text-on-surface-variant font-bold uppercase shrink-0';
        tag.textContent = f.docType || 'Select';
        item.appendChild(tag);

        upList.appendChild(item);
      });

      scrollContainer.appendChild(upList);
    }

    // 3. COMPLETED FILES
    const completedFiles = this.state.files.filter(f => f.isRenamed || f.isKept);
    if (completedFiles.length > 0) {
      const compHeader = document.createElement('div');
      compHeader.className = 'mt-auto pt-2 flex flex-col gap-1.5 shrink-0';

      const bar = document.createElement('div');
      bar.className = 'flex items-center justify-between px-2 py-1 rounded bg-emerald-100 border border-emerald-300 text-[11px] font-mono-code text-emerald-900';
      
      const leftBar = document.createElement('div');
      leftBar.className = 'flex items-center gap-1.5 font-bold';
      const chkIcon = document.createElement('span');
      chkIcon.className = 'material-symbols-outlined text-[15px] text-tertiary';
      chkIcon.textContent = 'south';
      leftBar.appendChild(chkIcon);
      leftBar.appendChild(document.createTextNode('COMPLETED FILES'));
      bar.appendChild(leftBar);

      const rightBar = document.createElement('span');
      rightBar.className = 'text-[10px] font-semibold text-tertiary uppercase';
      rightBar.textContent = `${completedFiles.length} finished`;
      bar.appendChild(rightBar);
      compHeader.appendChild(bar);

      completedFiles.forEach(f => {
        const item = document.createElement('article');
        item.className = 'bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-1.5 flex items-center justify-between gap-space-sm border border-emerald-300';

        const left = document.createElement('div');
        left.className = 'flex items-center gap-2 min-w-0 flex-1';

        const iconBadge = document.createElement('span');
        iconBadge.className = 'w-4 h-4 rounded-full bg-emerald-500 text-on-primary font-mono-code font-bold text-[9px] flex items-center justify-center shrink-0';
        const ok = document.createElement('span');
        ok.className = 'material-symbols-outlined text-[11px]';
        ok.textContent = 'check';
        iconBadge.appendChild(ok);
        left.appendChild(iconBadge);

        const txt = document.createElement('span');
        txt.className = 'font-mono-code text-[11px] text-tertiary font-bold truncate';
        txt.textContent = f.targetName;
        left.appendChild(txt);
        item.appendChild(left);

        const sz = document.createElement('span');
        sz.className = 'font-mono-code text-[10px] text-secondary shrink-0';
        sz.textContent = `${(f.size / 1024).toFixed(0)} KB`;
        item.appendChild(sz);

        compHeader.appendChild(item);
      });

      scrollContainer.appendChild(compHeader);
    }

    queueCol.appendChild(scrollContainer);
  }

  applyShortcutToCurrent(shortcut) {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    const canonical = shortcut.canonical;
    const extension = current.ext;
    const formatted = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
    const targetWithExt = formatted.endsWith(extension) ? formatted : `${formatted}${extension}`;

    // Unique destination check
    const used = new Set(this.state.files.map(f => f.targetName));
    used.delete(current.targetName);
    const unique = uniqueDestination(targetWithExt, current.name, used);

    current.targetName = unique;
    current.docType = canonical;
    current.isMatched = true;
    current.status = 'matched';

    this.updateTelemetry();
    this.renderQueue();

    // Advance to next uncompleted file or focus
    this.handleConfirmCurrentName(unique);
  }

  handleConfirmCurrentName(newName) {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    const error = validateFilename(newName);
    if (error) {
      toast.show('Invalid Filename', error, 'error');
      return;
    }

    current.targetName = newName;
    toast.show('Target Updated', newName, 'info');

    // Move to next pending file
    const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed && !f.isKept);
    if (nextPending !== -1) {
      this.state.currentIndex = nextPending;
    } else {
      // Find first uncompleted from 0
      const firstPending = this.state.files.findIndex(f => !f.isRenamed && !f.isKept);
      if (firstPending !== -1) {
        this.state.currentIndex = firstPending;
      }
    }

    this.renderQueue();
    this.renderCurrentPreview();
  }

  handleKeepOriginal() {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    current.targetName = current.name;
    current.isKept = true;
    current.status = 'kept';

    toast.show('Kept Original', current.name, 'info');

    // Move to next
    if (this.state.currentIndex < this.state.files.length - 1) {
      this.state.currentIndex++;
    }

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
  }

  async handleRenameAll() {
    const pending = this.state.files.filter(f => !f.isRenamed && !f.isKept && f.targetName !== f.name);
    if (pending.length === 0) {
      toast.show('No Changes Needed', 'All files are already named or kept.', 'info');
      return;
    }

    // Validate all target names
    for (const f of pending) {
      const err = validateFilename(f.targetName);
      if (err) {
        toast.show('Validation Error', `${f.name}: ${err}`, 'error');
        return;
      }
    }

    // Build plan
    const plan = pending.map(f => ({
      old: f.name,
      next: f.targetName,
      file: f,
      nativePath: f.path
    }));

    toast.show('Executing Batch Rename', `Processing ${plan.length} files atomically...`, 'info');

    try {
      const result = await executeRename(this.state.folder, plan, (pct, status) => {
        console.log(`[Rename Progress] ${pct}%: ${status}`);
      });

      // Record to undo manager
      undoManager.pushBatch(this.state.folder, plan);

      // Update models
      pending.forEach(f => {
        f.name = f.targetName;
        f.isRenamed = true;
        f.status = 'renamed';
      });

      toast.show('Batch Complete!', `Successfully renamed ${plan.length} files.`, 'success');
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
    } catch (err) {
      toast.show('Rename Failed', err.message, 'error');
    }
  }

  async handleUndo() {
    if (!undoManager.canUndo()) {
      toast.show('Undo Stack Empty', 'No previous rename batch to undo.', 'info');
      return;
    }

    const batch = undoManager.pop();
    toast.show('Reverting Changes', `Restoring ${batch.plan.length} files...`, 'info');

    try {
      await undoRename(batch.dir, batch.plan, (pct, status) => {
        console.log(`[Undo Progress] ${pct}%: ${status}`);
      });

      // Revert models
      batch.plan.forEach(item => {
        const f = this.state.files.find(x => x.targetName === item.next || x.name === item.next);
        if (f) {
          f.name = item.old;
          f.targetName = item.old;
          f.isRenamed = false;
          f.status = 'pending';
        }
      });

      toast.show('Undo Successful', `Restored ${batch.plan.length} files to original names.`, 'success');
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
    } catch (err) {
      toast.show('Undo Failed', err.message, 'error');
    }
  }

  handleSaveBatch() {
    if (!this.state.folder) {
      toast.show('No Active Batch', 'Please load a folder first.', 'warning');
      return;
    }

    const snapshot = {
      folder: this.state.folder,
      files: this.state.files.map(f => ({
        name: f.name,
        targetName: f.targetName,
        docType: f.docType,
        isMatched: f.isMatched,
        isRenamed: f.isRenamed,
        isKept: f.isKept
      })),
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('docmitra_last_batch', JSON.stringify(snapshot));
    toast.show('Batch State Saved', 'Current progress saved locally.', 'success');
  }

  handleExportAudit() {
    if (this.state.files.length === 0) {
      toast.show('Nothing to Export', 'Queue is empty.', 'info');
      return;
    }

    const batchResults = [{
      studentName: this.state.studentName || 'Student',
      folderName: this.state.folder?.name || 'Folder',
      summary: {
        evaluations: this.state.files.map(f => ({
          rule: { name: f.docType || f.name },
          status: f.isMatched || f.isRenamed ? 'green' : 'missing',
          isLinked: false
        })),
        foundCount: this.state.files.filter(f => f.isMatched || f.isRenamed).length,
        missingCount: this.state.files.filter(f => !f.isMatched && !f.isRenamed).length,
        totalRequired: this.state.files.length,
        percentComplete: Math.round((this.state.files.filter(f => f.isMatched || f.isRenamed).length / this.state.files.length) * 100),
        isReady: this.state.files.every(f => f.isMatched || f.isRenamed),
        missingList: this.state.files.filter(f => !f.isMatched && !f.isRenamed).map(f => f.name)
      }
    }];

    const rules = this.state.files.map(f => ({ name: f.docType || f.name }));
    const csvContent = generateBatchAuditCSV(batchResults, rules, 'Admission Audit');
    downloadCSV(`DocMitra_Audit_${(this.state.studentName || 'Batch').replace(/\s+/g, '_')}.csv`, csvContent);
    toast.show('Audit Exported', 'CSV report downloaded with UTF-8 BOM.', 'success');
  }

  handleClearQueue() {
    this.state.files = [];
    this.state.folder = null;
    this.state.currentIndex = 0;
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    toast.show('Queue Cleared', 'Intake workstation reset.', 'info');
  }

  renderCurrentPreview() {
    const previewCol = document.getElementById('col-preview');
    if (!previewCol) return;

    const currentFile = this.state.files[this.state.currentIndex];
    const previewStageWrapper = previewCol.querySelector('.overflow-auto');
    if (!previewStageWrapper) return;

    // Clear safely
    while (previewStageWrapper.firstChild) {
      previewStageWrapper.removeChild(previewStageWrapper.firstChild);
    }

    if (!currentFile) {
      const placeholder = document.createElement('div');
      placeholder.className = 'flex flex-col items-center justify-center gap-3 text-secondary opacity-60';
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[64px]';
      icon.textContent = 'visibility';
      placeholder.appendChild(icon);
      const txt = document.createElement('span');
      txt.className = 'font-mono-code text-[13px]';
      txt.textContent = 'No Document Loaded for Preview';
      placeholder.appendChild(txt);
      previewStageWrapper.appendChild(placeholder);
      return;
    }

    const stage = document.createElement('div');
    stage.id = 'previewContainerStage';
    stage.className = 'h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded shadow-2xl p-space-md flex flex-col justify-between relative overflow-hidden select-text border border-outline-variant/40 shrink-0';

    const isImage = /\.(jpe?g|png|webp|bmp|gif)$/i.test(currentFile.name);
    const isPdf = /\.pdf$/i.test(currentFile.name);

    if (isImage && currentFile.url) {
      const img = document.createElement('img');
      img.src = currentFile.url;
      img.alt = currentFile.name;
      img.className = 'w-full h-full object-contain';
      stage.appendChild(img);
    } else if (isPdf && window.pdfjsLib && currentFile.url) {
      const canvas = document.createElement('canvas');
      canvas.className = 'w-full h-full object-contain';
      stage.appendChild(canvas);

      // Render PDF.js page 1
      window.pdfjsLib.getDocument(currentFile.url).promise.then(pdf => {
        pdf.getPage(1).then(page => {
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
          });
        });
      }).catch(err => {
        console.warn('PDF.js render error:', err);
        this._renderDocumentInfoFallback(stage, currentFile);
      });
    } else {
      this._renderDocumentInfoFallback(stage, currentFile);
    }

    previewStageWrapper.appendChild(stage);
  }

  _renderDocumentInfoFallback(stage, file) {
    while (stage.firstChild) {
      stage.removeChild(stage.firstChild);
    }

    const header = document.createElement('div');
    header.className = 'flex flex-col items-center text-center gap-1 border-b pb-2 border-outline-variant/50';
    const govTitle = document.createElement('span');
    govTitle.className = 'font-mono-code text-[10px] tracking-widest text-secondary uppercase font-bold';
    govTitle.textContent = 'DocMitra Offline Document Inspector';
    header.appendChild(govTitle);

    const docTitle = document.createElement('span');
    docTitle.className = 'font-headline-sm text-[15px] font-bold text-on-surface uppercase';
    docTitle.textContent = file.targetName || file.name;
    header.appendChild(docTitle);
    stage.appendChild(header);

    const body = document.createElement('div');
    body.className = 'flex-1 flex flex-col items-center justify-center gap-2 text-center p-4';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[64px] text-primary opacity-40';
    icon.textContent = 'description';
    body.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'font-mono-code text-[12px] text-secondary';
    info.textContent = `Size: ${(file.size / 1024).toFixed(1)} KB • Type: ${file.ext.toUpperCase()}`;
    body.appendChild(info);

    const matchBadge = document.createElement('div');
    matchBadge.className = file.isMatched
      ? 'px-3 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-mono-code text-[11px]'
      : 'px-3 py-1 rounded bg-surface-variant text-on-surface-variant font-bold font-mono-code text-[11px]';
    matchBadge.textContent = file.isMatched ? `Matched: ${file.docType}` : 'Unmatched File';
    body.appendChild(matchBadge);
    stage.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'text-center border-t pt-2 border-outline-variant/30 text-[10px] font-mono-code text-secondary';
    footer.textContent = 'Air-Gapped High-Precision Preview Stage';
    stage.appendChild(footer);
  }
}

export function initRenamerUI() {
  const manager = new RenamerUIManager();
  manager.init();
  return manager;
}
