/**
 * DocMitra Bulk Document Renamer UI Binding & Adapter
 * Connects the Stitch Renamer screen to pure logic in src/libraries, src/core, and src/services.
 *
 * SPECIFICATION APPROVED BEHAVIORS (docs/RENAMER_BEHAVIOR_SPEC.md):
 * 1. Two top buttons: First: 'Add Files' (in-place append), Second: 'Select Folder' (F2).
 * 2. In-Ribbon Folder Switcher (< Prev, > Next, folder counter pill, Ctrl+Left / Ctrl+Right).
 * 3. Open in Windows Explorer on folder path text click and open icon button click.
 * 4. Background Auto-Watcher detecting disk updates.
 * 5. Empty folder warning toast (remains on previous folder).
 * 6. Windows junk blacklist (Thumbs.db, desktop.ini, .DS_Store, ~$*, *.tmp).
 * 7. Simplified telemetry strip (Files, Ready, Unmatched).
 * 8. Base name only in input box + locked extension badge (.pdf/.jpg).
 * 9. Live keystroke intercept for illegal Windows characters (\ / : * ? " < > |).
 * 10. Simple binary status tag (Green 'Matched' / Red 'Unmatched').
 * 11. Click original filename resets the input box back to clean original name.
 * 12. Instant atomic rename on disk when Tab or Enter is pressed, auto-advancing to next file.
 * 13. Shift+Tab navigates backward to previous card.
 * 14. Pin active card to top on scroll.
 * 15. Click upcoming item jumps & focuses; click completed item re-opens it for re-renaming.
 * 16. Instant one-click rename on clicking any of the 21 shortcut buttons.
 * 17. Zero dynamic innerHTML (safe DOM creation methods only).
 */

import { toast } from '../../shared/toast.js';
import {
  selectNativeFolder,
  selectNativeFiles,
  listNativeDirectory,
  renameNativeFile,
  rotateNativeFile,
  importNativeFile,
  openFolderInExplorer,
  isNativeAvailable
} from '../../shared/native-bridge.js';
import {
  matchDocument,
  getMatchingSuggestions,
  evaluateMatch,
  buildName,
  cleanName,
  ext,
  validateFilename,
  executeRename,
  undoRename,
  uniqueDestination,
  undoManager,
  issuesFor,
  correctSpelling,
  evaluateChecklistRule,
  generateBatchAuditCSV,
  downloadCSV,
  CANONICAL_NAMES,
  DEFAULT_SPELLING_RULES,
  DEFAULT_LINKED_RULES,
  DEFAULT_CHECKLISTS_DATA,
  evaluateSmartOcrDocument,
  SMART_DOC_SIGNATURES
} from './rename_tool_logic.js';
import { recordRenameEvent } from '../../src/services/analytics-service.js';
import { loadSettings, saveSettings, loadDocumentPresets } from '../../src/services/storage-service.js';
import {
  addOrUpdateFollowUp,
  getPendingFollowUp,
  getTodayDateString,
  getTomorrowDateString,
  getNextMondayDateString,
  formatFriendlyDate,
  computeImportTargetName
} from '../../src/services/followup-service.js';

export function isJunkFile(filename) {
  if (!filename) return true;
  const lower = filename.toLowerCase().trim();
  if (lower === 'thumbs.db' || lower === 'ehthumbs.db' || lower === 'desktop.ini' || lower === '.ds_store') return true;
  if (lower.startsWith('.') || lower.startsWith('~$') || lower.endsWith('.tmp')) return true;
  return false;
}

/**
 * High-contrast, bold category-coded badge colors for shortcut buttons & chips
 */
export function getShortcutBadgeColor(code) {
  const c = (code || '').toUpperCase().trim();
  if (['ADR', 'PAN', 'PIC', 'UID'].includes(c)) return 'bg-blue-600 text-white font-extrabold';
  if (['10M', '10P', '12M', '12P', '12LC', '12MP', 'ATM', 'BNF', 'BRT'].includes(c)) return 'bg-emerald-700 text-white font-extrabold';
  if (['CST', 'VLD'].includes(c)) return 'bg-purple-700 text-white font-extrabold';
  if (['INC', 'DOM', 'NAT', 'BNK'].includes(c)) return 'bg-amber-600 text-white font-extrabold';
  if (['SLF', 'PAR', 'GAP'].includes(c)) return 'bg-slate-700 text-white font-extrabold';
  return 'bg-primary text-on-primary font-extrabold';
}

export class RenamerUIManager {
  constructor() {
    this.state = {
      folder: null, // { name, path, nativePath }
      subfolders: [],
      currentSubfolderIndex: 0,
      files: [],    // Array of file models
      currentIndex: 0,
      studentName: '',
      style: 'preserve', // 'preserve' | 'upper' | 'lower' | 'title'
      settings: null,
      documentPresets: null,
      history: [],
      zoom: 100,
      rotation: 0,
      panEnabled: false,
      splitCompare: false,
      watcherActive: true,
      lastMtimeCheck: 0,
      currentPdfPage: 1,
      totalPdfPages: 1,
      activePdfDoc: null,
      activePdfUrl: null,
      isSmartScanning: false,
      isMissingDocsCollapsed: true
    };
    this._scanAbortController = null;

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
    loadDocumentPresets().then(presets => {
      if (presets && presets.forms) {
        this.state.documentPresets = presets.forms;
        this.renderQueue();
      }
    }).catch(() => {});
    const savedCasing = localStorage.getItem('docmitra_casing_style');
    this.state.style = (savedCasing && ['upper', 'title', 'lower'].includes(savedCasing.toLowerCase()))
      ? savedCasing.toLowerCase()
      : 'upper';
    this._bindDOM();
    this._bindKeyboardShortcuts();
    this._startBackgroundWatcher();

    // Listen for external settings updates from Settings modal
    window.addEventListener('storage', (e) => {
      if (e.key === 'docmitra_settings' || e.key === 'docmitra_casing_style') {
        this.state.settings = loadSettings();
        const sc = localStorage.getItem('docmitra_casing_style');
        this.state.style = (sc && ['upper', 'title', 'lower'].includes(sc.toLowerCase())) ? sc.toLowerCase() : 'upper';
        this._recalculateTargetNames();
        this.renderQueue();
        this.renderCurrentPreview();
      }
    });

    console.info('[DocMitra Renamer] Renamer UI manager initialized.');
  }

  _bindDOM() {
    // 1. Select Folder button (F2)
    const btnSelect = document.getElementById('btnSelectFolder');
    if (btnSelect) {
      btnSelect.addEventListener('click', () => this.handleSelectFolder());
    }

    // 2. Add Files button
    const btnAdd = document.getElementById('btnAddFiles');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.handleAddFiles());
    }

    // 3. In-Ribbon Folder Switcher (< Prev and > Next)
    const btnPrev = document.getElementById('btnPrevFolder');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.handlePrevFolder());
    }

    const btnNext = document.getElementById('btnNextFolder');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.handleNextFolder());
    }

    // 4. Open in Windows Explorer (Path text click + icon button)
    const pathText = document.getElementById('activeFolderPath');
    if (pathText) {
      pathText.addEventListener('click', () => this.handleOpenInExplorer());
    }

    const btnOpenExplorer = document.getElementById('btnOpenInExplorer');
    if (btnOpenExplorer) {
      btnOpenExplorer.addEventListener('click', () => this.handleOpenInExplorer());
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

    // Smart Auto-Rename Buttons
    const btnSmartScan = document.getElementById('btnSmartScanBatch');
    if (btnSmartScan) {
      btnSmartScan.addEventListener('click', () => this.handleSmartScanBatch());
    }

    const btnRenameMatched = document.getElementById('btnRenameMatched');
    if (btnRenameMatched) {
      btnRenameMatched.addEventListener('click', () => this.handleRenameAllMatched());
    }

    const btnReviewUnmatched = document.getElementById('btnReviewUnmatched');
    if (btnReviewUnmatched) {
      btnReviewUnmatched.addEventListener('click', () => this.handleReviewUnmatched());
    }

    // Casing Style Radios (UPPER, Title, lower, As Is)
    const updateCasingPillStyles = () => {
      document.querySelectorAll('#casingRadiosGroup label').forEach(lbl => {
        const inp = lbl.querySelector('input');
        if (inp && inp.checked) {
          lbl.className = 'flex items-center cursor-pointer text-white bg-primary font-mono-code text-[11px] px-2 py-0.5 rounded shadow-xs select-none font-bold transition-all casing-pill-active';
        } else {
          lbl.className = 'flex items-center cursor-pointer text-secondary hover:text-on-surface font-mono-code text-[11px] px-2 py-0.5 rounded transition-all select-none';
        }
      });
    };

    const casingRadios = document.querySelectorAll('input[name="casingStyleRadio"]');
    casingRadios.forEach(radio => {
      if (radio.value === (this.state.style || 'upper')) {
        radio.checked = true;
      }
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.style = e.target.value;
          localStorage.setItem('docmitra_casing_style', e.target.value);
          updateCasingPillStyles();
          this._recalculateTargetNames();
          this.renderQueue();
          this.renderCurrentPreview();
          toast.show('Case Style Changed', `Applied ${e.target.value.toUpperCase()} casing to pending files`, 'info');
        }
      });
    });
    updateCasingPillStyles();

    // Clear Workspace (Top-Right Action Button & Footer Legacy)
    const btnClearWs = document.getElementById('btnClearWorkspace');
    if (btnClearWs) {
      btnClearWs.addEventListener('click', () => this.handleClearQueue());
    }

    const btnClear = document.getElementById('btnClearQueue');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClearQueue());
    }

    // Empty State Skeleton Action Buttons
    const btnEmptySelect = document.getElementById('btnEmptySelectFolder');
    if (btnEmptySelect) {
      btnEmptySelect.addEventListener('click', () => this.handleSelectFolder());
    }

    const btnEmptyAdd = document.getElementById('btnEmptyAddFiles');
    if (btnEmptyAdd) {
      btnEmptyAdd.addEventListener('click', () => this.handleAddFiles());
    }

    // Wire initial mockup elements if user interacts before selecting folder
    const initialInput = document.querySelector('#col-queue input');
    if (initialInput) {
      initialInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          toast.show('Intake Folder Needed', 'Press "Select Folder" (F2) to choose admission documents.', 'info');
        }
        if (/[\\/:*?"<>|]/.test(e.key)) {
          e.preventDefault();
          toast.show('Character Not Allowed', `Windows filenames cannot contain ${e.key}`, 'warning');
        }
      });
      initialInput.addEventListener('input', (e) => {
        if (/[\\/:*?"<>|]/.test(e.target.value)) {
          e.target.value = e.target.value.replace(/[\\/:*?"<>|]/g, '');
          toast.show('Character Not Allowed', 'Illegal characters removed', 'warning');
        }
      });
    }

    const initialPresetBtns = document.querySelectorAll('#col-queue .grid-cols-3 button');
    initialPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.querySelector('span:first-child')?.textContent?.trim() || '';
        const label = btn.querySelector('span:last-child')?.textContent?.trim() || '';
        toast.show(`Preset Selected: ${code}`, `Press "Select Folder" (F2) to rename documents with ${label}.`, 'info');
      });
    });

    // Preview zoom controls
    this._bindPreviewControls();
  }

  _bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
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

      // F4: Smart Scan Batch
      if (e.key === 'F4') {
        e.preventDefault();
        this.handleSmartScanBatch();
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

      // Ctrl+Left: Previous folder
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        this.handlePrevFolder();
        return;
      }

      // Ctrl+Right: Next folder
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        this.handleNextFolder();
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
    });
  }

  _bindPreviewControls() {
    const colPreview = document.getElementById('col-preview');
    if (!colPreview) return;

    const btnZoomIn = colPreview.querySelector('button[title*="Zoom In"]');
    const btnZoomOut = colPreview.querySelector('button[title*="Zoom Out"]');
    const btnReset = colPreview.querySelector('button[title*="Reset Zoom"]');
    const btnRotate = colPreview.querySelector('button[title*="Rotate"]');
    const zoomSlider = colPreview.querySelector('input[type="range"]');
    const btnFitA4 = colPreview.querySelector('button[title*="Fit to A4 Width"]');
    const btnPan = colPreview.querySelector('button[title*="Pan Hand"]');
    const btnSplit = colPreview.querySelector('button[title*="Split Compare"]');
    const btnResetFilters = colPreview.querySelector('.border-t button');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        this.state.zoom = Math.min(300, this.state.zoom + 20);
        if (zoomSlider) zoomSlider.value = this.state.zoom;
        this._applyPreviewTransform();
      });
    }

    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        this.state.zoom = Math.max(40, this.state.zoom - 20);
        if (zoomSlider) zoomSlider.value = this.state.zoom;
        this._applyPreviewTransform();
      });
    }

    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        this.state.zoom = Number(e.target.value);
        this._applyPreviewTransform();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.state.zoom = 100;
        const currentFile = this.state.files[this.state.currentIndex];
        if (currentFile) currentFile.rotation = 0;
        this.state.rotation = 0;
        if (zoomSlider) zoomSlider.value = 100;
        this._applyPreviewTransform();
      });
    }

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        const currentFile = this.state.files[this.state.currentIndex];
        if (currentFile) {
          currentFile.rotation = ((currentFile.rotation || 0) + 90) % 360;
          this.state.rotation = currentFile.rotation;
        } else {
          this.state.rotation = (this.state.rotation + 90) % 360;
        }
        this._applyPreviewTransform();
      });
    }

    if (btnFitA4) {
      btnFitA4.addEventListener('click', () => {
        this.state.zoom = 120;
        if (zoomSlider) zoomSlider.value = 120;
        this._applyPreviewTransform();
        toast.show('Fit to A4 Width', 'Zoom set to 120% standard document view', 'info');
      });
    }

    if (btnPan) {
      btnPan.addEventListener('click', () => {
        this.state.panEnabled = !this.state.panEnabled;
        const stageWrapper = colPreview.querySelector('.overflow-auto');
        if (stageWrapper) {
          stageWrapper.classList.toggle('cursor-grab', this.state.panEnabled);
          stageWrapper.classList.toggle('bg-primary/5', this.state.panEnabled);
        }
        btnPan.classList.toggle('bg-primary/20', this.state.panEnabled);
        btnPan.classList.toggle('text-primary', this.state.panEnabled);
        toast.show('Pan Hand', this.state.panEnabled ? 'Pan mode active: click & drag preview' : 'Pan mode disabled', 'info');
      });
    }

    // Attach dragging & Ctrl+Wheel zoom to preview stage wrapper
    const stageWrapper = colPreview.querySelector('.overflow-auto');
    if (stageWrapper) {
      // Ctrl + Wheel zooming for smooth magnification (Feature 3)
      stageWrapper.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 15 : -15;
          this.state.zoom = Math.max(40, Math.min(300, this.state.zoom + delta));
          if (zoomSlider) zoomSlider.value = this.state.zoom;
          this._applyPreviewTransform();
        }
      }, { passive: false });

      let isPanning = false;
      let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;

      stageWrapper.addEventListener('mousedown', (e) => {
        if (!this.state.panEnabled) return;
        isPanning = true;
        stageWrapper.classList.add('cursor-grabbing');
        startX = e.pageX - stageWrapper.offsetLeft;
        startY = e.pageY - stageWrapper.offsetTop;
        scrollLeft = stageWrapper.scrollLeft;
        scrollTop = stageWrapper.scrollTop;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - stageWrapper.offsetLeft;
        const y = e.pageY - stageWrapper.offsetTop;
        stageWrapper.scrollLeft = scrollLeft - (x - startX);
        stageWrapper.scrollTop = scrollTop - (y - startY);
      });

      window.addEventListener('mouseup', () => {
        if (isPanning) {
          isPanning = false;
          stageWrapper.classList.remove('cursor-grabbing');
        }
      });
    }

    if (btnSplit) {
      btnSplit.addEventListener('click', () => {
        this.state.splitCompare = !this.state.splitCompare;
        btnSplit.classList.toggle('bg-primary/20', this.state.splitCompare);
        btnSplit.classList.toggle('text-primary', this.state.splitCompare);
        this.renderCurrentPreview();
        toast.show('Split Compare', this.state.splitCompare ? 'Split compare mode active' : 'Single view restored', 'info');
      });
    }

    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        this.state.zoom = 100;
        this.state.rotation = 0;
        if (zoomSlider) zoomSlider.value = 100;
        this._applyPreviewTransform();
        toast.show('Filters Reset', 'Preview display restored to default', 'info');
      });
    }

    // Multi-page PDF Navigation controls (Feature 2)
    const btnPdfPrev = colPreview.querySelector('#btnPdfPrevPage');
    const btnPdfNext = colPreview.querySelector('#btnPdfNextPage');
    const pdfPageBadge = colPreview.querySelector('#renamerPdfPageBadge');

    if (btnPdfPrev) {
      btnPdfPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.state.currentPdfPage > 1) {
          this._renderPdfPage(this.state.currentPdfPage - 1);
        }
      });
    }

    if (btnPdfNext) {
      btnPdfNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.state.currentPdfPage < this.state.totalPdfPages) {
          this._renderPdfPage(this.state.currentPdfPage + 1);
        }
      });
    }

    if (pdfPageBadge) {
      pdfPageBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.state.totalPdfPages > 1) {
          const targetStr = window.prompt(`Jump to Page (1 to ${this.state.totalPdfPages}):`, String(this.state.currentPdfPage));
          if (targetStr) {
            const targetNum = parseInt(targetStr, 10);
            if (!isNaN(targetNum) && targetNum >= 1 && targetNum <= this.state.totalPdfPages) {
              this._renderPdfPage(targetNum);
            }
          }
        }
      });
    }
  }

  _applyPreviewTransform() {
    const stage = document.getElementById('previewContainerStage');
    const currentFile = this.state.files[this.state.currentIndex];
    const fileRot = currentFile ? (currentFile.rotation || 0) : (this.state.rotation || 0);
    if (stage) {
      stage.style.transform = `scale(${this.state.zoom / 100}) rotate(${fileRot}deg)`;
      stage.style.transformOrigin = 'center center';
      stage.style.transition = 'transform 0.15s ease-out';
    }

    const colPreview = document.getElementById('col-preview');
    if (colPreview) {
      const zoomLabel = colPreview.querySelector('.font-mono-code.text-label-sm');
      if (zoomLabel) {
        zoomLabel.textContent = this.state.zoom === 100 ? 'Fit to Page' : `${this.state.zoom}%`;
      }
    }
  }

  _startBackgroundWatcher() {
    setInterval(async () => {
      if (!this.state.watcherActive || !this.state.folder?.path) return;
      try {
        const res = await listNativeDirectory(this.state.folder.path);
        if (res.success && Array.isArray(res.files)) {
          const validDiskFiles = res.files.filter(f => !isJunkFile(f.name));
          const currentFilenames = new Set(this.state.files.map(f => f.name));
          const diskFilenames = new Set(validDiskFiles.map(f => f.name));
          
          let changed = false;
          if (currentFilenames.size !== diskFilenames.size) {
            changed = true;
          } else {
            for (const name of diskFilenames) {
              if (!currentFilenames.has(name)) { changed = true; break; }
            }
          }

          if (changed) {
            this._syncDiskFiles(validDiskFiles);
          }
        }
      } catch {
        // Silent ignore for air-gapped watcher
      }
    }, 4000);
  }

  _syncDiskFiles(diskFiles) {
    const preservedEdits = new Map();
    this.state.files.forEach(f => {
      preservedEdits.set(f.name, {
        targetName: f.targetName,
        isRenamed: f.isRenamed,
        isKept: f.isKept,
        docType: f.docType,
        isMatched: f.isMatched
      });
    });

    this.loadFolderData({
      name: this.state.folder.name,
      path: this.state.folder.path,
      files: diskFiles
    }, preservedEdits);
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

      // Check for direct files and student subfolders
      const validFiles = (res.files || []).filter(f => !isJunkFile(f.name));

      // 1. If folder has 2 or more student subfolders, treat as Batch Parent Folder
      if (res.subfolders && res.subfolders.length > 1) {
        this.state.subfolders = res.subfolders;
        this.state.currentSubfolderIndex = 0;
        await this.loadSubfolder(0);
        toast.show('Batch Folder Loaded', `${res.subfolders.length} student folders detected`, 'success');
        return;
      }

      // 2. If folder has 1 subfolder and 0 direct files, navigate into it
      if (res.subfolders && res.subfolders.length === 1 && validFiles.length === 0) {
        this.state.subfolders = res.subfolders;
        this.state.currentSubfolderIndex = 0;
        await this.loadSubfolder(0);
        toast.show('Student Folder Loaded', res.subfolders[0].name, 'success');
        return;
      }

      // 3. If folder has direct document files, treat as Single Student Folder
      if (validFiles.length > 0) {
        res.files = validFiles;
        this.state.subfolders = res.subfolders || [];
        this.loadFolderData(res);
        toast.show('Folder Loaded', `${validFiles.length} files found`, 'success');
        return;
      }

      // 4. Otherwise folder is empty
      toast.show('Selected Folder is Empty', 'Remaining on previous folder.', 'warning');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  async loadSubfolder(index) {
    if (index < 0 || index >= this.state.subfolders.length) return;
    this.state.currentSubfolderIndex = index;
    const sub = this.state.subfolders[index];
    const subPath = typeof sub === 'string' ? sub : (sub.path || '');
    
    try {
      const res = await listNativeDirectory(subPath);
      if (res.success) {
        const validFiles = (res.files || []).filter(f => !isJunkFile(f.name));
        res.files = validFiles;
        this.loadFolderData(res);
      }
    } catch (err) {
      toast.show('Subfolder Error', err.message, 'error');
    }
  }

  handlePrevFolder() {
    if (this.state.subfolders.length === 0) {
      toast.show('Single Folder Mode', 'No parent batch subfolders active.', 'info');
      return;
    }
    if (this.state.currentSubfolderIndex > 0) {
      this.loadSubfolder(this.state.currentSubfolderIndex - 1);
    } else {
      toast.show('First Folder', 'Already on the first student folder.', 'info');
    }
  }

  handleNextFolder() {
    if (this.state.subfolders.length === 0) {
      toast.show('Single Folder Mode', 'No parent batch subfolders active.', 'info');
      return;
    }
    if (this.state.currentSubfolderIndex < this.state.subfolders.length - 1) {
      this.loadSubfolder(this.state.currentSubfolderIndex + 1);
    } else {
      toast.show('Last Folder', 'Already on the last student folder.', 'info');
    }
  }

  /**
   * Adds external files in-place to the current queue
   */
  async handleAddFiles() {
    toast.show('Opening File Picker', 'Select files to append in-place...', 'info');
    try {
      const res = await selectNativeFiles('All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*', 'Select Files to Add');
      if (!res.success) return;

      const newFiles = (res.files || []).filter(f => !isJunkFile(f.name));
      if (newFiles.length === 0) {
        toast.show('No Files Selected', '0 valid documents selected.', 'info');
        return;
      }

      const folderPath = this.state.folder?.path || '';
      const usedDestinations = new Set(this.state.files.map(f => f.targetName));

      const mapped = newFiles.map((f, i) => {
        const extension = f.ext || ext(f.name);
        const baseName = cleanName(f.name);
        const spellingFixed = correctSpelling(baseName, DEFAULT_SPELLING_RULES);

        let matchResult = evaluateMatch(spellingFixed, this.state.settings?.groups);
        if (!matchResult.docType) {
          matchResult = evaluateMatch(baseName, this.state.settings?.groups);
        }
        const docType = matchResult.docType ||
                        matchDocument(spellingFixed, this.state.settings?.groups) ||
                        matchDocument(baseName, this.state.settings?.groups) ||
                        null;

        let suggested = baseName;
        let isMatched = false;

        if (docType) {
          const canonical = CANONICAL_NAMES[docType.toUpperCase()] || docType;
          suggested = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
          isMatched = true;
        } else {
          suggested = buildName(baseName, this.state.studentName, null, this.state.style);
        }

        const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
        const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations, this.state.studentName);
        usedDestinations.add(uniqueName);

        return {
          id: `file_append_${Date.now()}_${i}`,
          name: f.name,
          path: f.path,
          size: f.size || 0,
          ext: extension,
          url: f.url || (f.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(f.path)}` : null),
          docType: docType,
          isMatched: isMatched,
          suggestedName: uniqueName,
          targetName: uniqueName,
          status: isMatched ? 'matched' : 'pending',
          isRenamed: false,
          isKept: false,
          rotation: 0,
          isScanning: false
        };
      });

      this.state.files.push(...mapped);
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      toast.show('Files Appended', `${mapped.length} files added to queue in-place`, 'success');
    } catch (err) {
      toast.show('Add Files Error', err.message, 'error');
    }
  }

  handleOpenInExplorer() {
    if (this.state.folder?.path) {
      openFolderInExplorer(this.state.folder.path);
      toast.show('Opening Windows Explorer', this.state.folder.path, 'info');
    } else {
      toast.show('No Active Folder', 'Please select a folder first.', 'warning');
    }
  }

  loadFolderData(data, preservedEdits = null) {
    const folderPath = data.path || '';
    const folderName = data.name || (folderPath ? folderPath.split(/[\\/]/).pop() : 'Selected Folder');

    const cleanFolderName = folderName.replace(/^[0-9]+[_\.\s-]+/, '').trim();
    const guessedStudent = cleanFolderName.replace(/_/g, ' ').trim();

    this.state.folder = {
      name: folderName,
      path: folderPath,
      nativePath: folderPath
    };
    this.state.studentName = guessedStudent;

    const filesRaw = (data.files || []).filter(f => !isJunkFile(f.name));
    const usedDestinations = new Set();

    this.state.files = filesRaw.map((f, idx) => {
      const extension = f.ext || ext(f.name);
      const baseName = cleanName(f.name);

      const preserved = preservedEdits ? preservedEdits.get(f.name) : null;
      if (preserved) {
        usedDestinations.add(preserved.targetName);
        return {
          id: `file_${idx}_${Date.now()}`,
          name: f.name,
          path: f.path || `${folderPath}/${f.name}`,
          size: f.size || 0,
          ext: extension,
          url: f.url || (f.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(f.path)}` : null),
          docType: preserved.docType,
          isMatched: preserved.isMatched,
          suggestedName: preserved.targetName,
          targetName: preserved.targetName,
          status: preserved.isRenamed ? 'renamed' : (preserved.isKept ? 'kept' : (preserved.isMatched ? 'matched' : 'pending')),
          isRenamed: preserved.isRenamed,
          isKept: preserved.isKept
        };
      }

      // Batch spelling auto-correction: correct scanner typos before matching
      const spellingFixed = correctSpelling(baseName, DEFAULT_SPELLING_RULES);

      // Match against 21 shortcuts, patterns & canonical rules
      let matchResult = evaluateMatch(spellingFixed, this.state.settings?.groups);
      if (!matchResult.docType) {
        matchResult = evaluateMatch(baseName, this.state.settings?.groups);
      }
      const docType = matchResult.docType ||
                      matchDocument(spellingFixed, this.state.settings?.groups) ||
                      matchDocument(baseName, this.state.settings?.groups) ||
                      null;

      let suggested = baseName;
      let isMatched = false;

      if (docType) {
        const canonical = CANONICAL_NAMES[docType.toUpperCase()] || docType;
        suggested = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
        isMatched = true;
      } else {
        suggested = buildName(baseName, this.state.studentName, null, this.state.style);
      }

      const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
      const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations, this.state.studentName);
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
        status: isMatched ? 'matched' : 'pending',
        isRenamed: false,
        isKept: false,
        rotation: 0,
        isScanning: false
      };
    });

    if (this._scanAbortController) {
      this._scanAbortController.abort();
      this._scanAbortController = null;
    }

    this.state.currentIndex = 0;
    this.state.rotation = 0;
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
  }

  _recalculateTargetNames() {
    const usedDestinations = new Set();
    for (const f of this.state.files) {
      if (f.isRenamed || f.isKept) {
        usedDestinations.add(f.targetName || f.name);
      }
    }
    for (const f of this.state.files) {
      if (!f.isRenamed && !f.isKept) {
        const docBase = f.docType || cleanName(f.name);
        const currentExt = f.ext || ('.' + f.name.split('.').pop()).toLowerCase();
        const newBase = buildName(docBase, this.state.studentName, this.state.settings?.groups, this.state.style);
        const desired = newBase.endsWith(currentExt) ? newBase : `${newBase}${currentExt}`;
        const unique = uniqueDestination(desired, f.name, usedDestinations, this.state.studentName);
        usedDestinations.add(unique);
        f.targetName = unique;
      }
    }
  }

  updateTelemetry() {
    const total = this.state.files.length;
    const ready = this.state.files.filter(f => f.isMatched || f.isRenamed || f.isKept).length;
    const unmatched = total - ready;
    const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

    // Interactive Clickable Breadcrumbs (Single-Line Middle Truncation, Zero Hover Underline)
    const pathEl = document.getElementById('activeFolderPath');
    if (pathEl) {
      while (pathEl.firstChild) pathEl.removeChild(pathEl.firstChild);
      if (this.state.folder?.path) {
        pathEl.title = this.state.folder.path;
        const fullPath = this.state.folder.path.replace(/\\/g, '/');
        const parts = fullPath.split('/').filter(Boolean);

        // Build target paths for each segment
        const segmentPaths = [];
        let accumulated = '';
        parts.forEach((seg, idx) => {
          if (idx === 0 && (seg.includes(':') || fullPath.startsWith('/'))) {
            accumulated = seg;
          } else {
            accumulated = accumulated ? `${accumulated}/${seg}` : seg;
          }
          segmentPaths.push(accumulated);
        });

        // Smart Middle Truncation if path has more than 3 segments
        let segmentsToRender = [];
        if (parts.length > 3) {
          segmentsToRender = [
            { seg: parts[0], path: segmentPaths[0], isLast: false },
            { isEllipsis: true, title: segmentPaths.slice(1, parts.length - 2).join(' / ') },
            { seg: parts[parts.length - 2], path: segmentPaths[parts.length - 2], isLast: false },
            { seg: parts[parts.length - 1], path: segmentPaths[parts.length - 1], isLast: true }
          ];
        } else {
          segmentsToRender = parts.map((seg, idx) => ({
            seg,
            path: segmentPaths[idx],
            isLast: idx === parts.length - 1
          }));
        }

        segmentsToRender.forEach((item, rIdx) => {
          if (item.isEllipsis) {
            const ellSpan = document.createElement('span');
            ellSpan.className = 'text-secondary/70 font-mono-code px-1 py-0.5 rounded hover:bg-surface-container cursor-default select-none text-[11px]';
            ellSpan.textContent = '...';
            ellSpan.title = `Intermediate folders: ${item.title}`;
            pathEl.appendChild(ellSpan);
          } else {
            const segSpan = document.createElement('span');
            segSpan.className = item.isLast
              ? 'text-on-surface font-bold truncate select-text px-1 py-0.5 rounded'
              : 'text-secondary hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container';
            segSpan.textContent = item.seg;
            segSpan.title = item.isLast ? item.path : `Click to jump to parent folder: ${item.path}`;

            if (!item.isLast) {
              segSpan.addEventListener('click', async (e) => {
                e.stopPropagation();
                toast.show('Navigating Folder', `Opening ${item.path}...`, 'info');
                const res = await listNativeDirectory(item.path);
                if (res && res.success) {
                  this.loadFolderData(res);
                  toast.show('Navigated to Folder', item.path, 'success');
                } else {
                  toast.show('Navigation Failed', res?.error || 'Could not read directory', 'error');
                }
              });
            }
            pathEl.appendChild(segSpan);
          }

          if (rIdx < segmentsToRender.length - 1) {
            const sep = document.createElement('span');
            sep.className = 'text-outline-variant/60 mx-0.5 select-none font-normal text-[10px]';
            sep.textContent = '>';
            pathEl.appendChild(sep);
          }
        });
      } else {
        pathEl.textContent = 'No folder selected';
      }
    }

    const counterPill = document.getElementById('folderCounterPill');
    if (counterPill) {
      if (this.state.subfolders.length > 0) {
        counterPill.textContent = `Folder ${this.state.currentSubfolderIndex + 1} of ${this.state.subfolders.length}`;
      } else if (total > 0) {
        counterPill.textContent = 'Folder 1 of 1';
      } else {
        counterPill.textContent = 'Folder 0 of 0';
      }
    }

    const countEl = document.getElementById('telemetryTotalFiles');
    if (countEl) countEl.textContent = String(total);

    const readyEl = document.getElementById('telemetryReadyFiles');
    if (readyEl) readyEl.textContent = `${ready} (${pct}%)`;

    const unmatchedEl = document.getElementById('telemetryUnmatchedFiles');
    if (unmatchedEl) unmatchedEl.textContent = String(unmatched);

    const renameAllBtn = document.getElementById('btnRenameAll');
    if (renameAllBtn) {
      const pendingToRename = this.state.files.filter(f => !f.isRenamed && ((f.targetName && f.targetName !== f.name) || (f.rotation && f.rotation % 360 !== 0)));
      const span = renameAllBtn.querySelector('.font-bold');
      if (span) {
        span.textContent = `Rename All (${pendingToRename.length} Files)`;
      }
    }

    // Smart Auto-Rename Action Buttons Counter Sync
    const smartMatchedBtn = document.getElementById('btnRenameMatched');
    if (smartMatchedBtn) {
      const matchedCount = this.state.files.filter(f => !f.isRenamed && f.status !== 'needs_review' && (f.smartConfidence >= 80 || (f.smartConfidence === undefined && f.isMatched))).length;
      const span = smartMatchedBtn.querySelector('span:not(.material-symbols-outlined)');
      if (span) span.textContent = `Rename Matched (${matchedCount})`;
      smartMatchedBtn.disabled = matchedCount === 0;
    }

    const reviewUnmatchedBtn = document.getElementById('btnReviewUnmatched');
    if (reviewUnmatchedBtn) {
      const unmatchedCount = this.state.files.filter(f => !f.isRenamed && (f.status === 'needs_review' || (f.smartConfidence !== undefined ? f.smartConfidence < 80 : !f.isMatched))).length;
      const span = reviewUnmatchedBtn.querySelector('span:not(.material-symbols-outlined)');
      if (span) span.textContent = `Review Unmatched (${unmatchedCount})`;
      reviewUnmatchedBtn.disabled = unmatchedCount === 0;
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
      // 1. Structural Hero Card Skeleton Frame (Awaiting Files)
      const heroSkeleton = document.createElement('div');
      heroSkeleton.className = 'flex flex-col gap-space-xs shrink-0 select-none';

      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-center justify-between px-1 text-label-sm';
      const badgeGroup = document.createElement('div');
      badgeGroup.className = 'flex items-center gap-2';
      const editingBadge = document.createElement('span');
      editingBadge.className = 'px-2 py-0.5 rounded bg-surface-container-high text-secondary font-bold text-[11px] flex items-center gap-1.5 shadow-xs';
      const editIcon = document.createElement('span');
      editIcon.className = 'material-symbols-outlined text-[13px]';
      editIcon.textContent = 'edit_document';
      editingBadge.appendChild(editIcon);
      editingBadge.appendChild(document.createTextNode('Standby (0 / 0)'));
      badgeGroup.appendChild(editingBadge);
      headerRow.appendChild(badgeGroup);
      heroSkeleton.appendChild(headerRow);

      const heroCard = document.createElement('div');
      heroCard.className = 'p-space-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-2 relative';
      
      const labelRow = document.createElement('div');
      labelRow.className = 'flex items-center justify-between text-label-sm';
      const renameLabel = document.createElement('label');
      renameLabel.className = 'font-bold text-on-surface text-[12px]';
      renameLabel.textContent = 'Rename To:';
      labelRow.appendChild(renameLabel);

      const helperSpan = document.createElement('span');
      helperSpan.className = 'text-[11px] text-secondary font-mono-code';
      helperSpan.textContent = 'Awaiting intake files';
      labelRow.appendChild(helperSpan);
      heroCard.appendChild(labelRow);

      // Frosted / blurred input skeleton (NO dummy student name!)
      const inputSkeleton = document.createElement('div');
      inputSkeleton.className = 'h-9 w-full rounded-lg bg-surface-container/60 border border-outline-variant/30 px-3 flex items-center justify-between text-secondary/40 font-mono-code text-[12px]';
      const italicPlaceholder = document.createElement('span');
      italicPlaceholder.className = 'italic text-secondary/50';
      italicPlaceholder.textContent = 'Select student folder (F2) to rename...';
      inputSkeleton.appendChild(italicPlaceholder);

      heroCard.appendChild(inputSkeleton);
      heroSkeleton.appendChild(heroCard);
      scrollContainer.appendChild(heroSkeleton);

      // 2. Structural Upcoming Queue Skeleton Frame (5 Blank Placeholder Rows)
      const queueFrame = document.createElement('div');
      queueFrame.className = 'flex flex-col gap-1.5 pt-2 select-none';

      const qHeader = document.createElement('div');
      qHeader.className = 'flex items-center justify-between px-1 text-label-sm pb-1';
      const qTitle = document.createElement('span');
      qTitle.className = 'font-bold text-on-surface text-[12px]';
      qTitle.textContent = 'UPCOMING QUEUE (0 Files)';
      qHeader.appendChild(qTitle);

      const qSlotCount = document.createElement('span');
      qSlotCount.className = 'text-secondary text-[11px] font-mono-code';
      qSlotCount.textContent = '5 Slots Ready';
      qHeader.appendChild(qSlotCount);
      queueFrame.appendChild(qHeader);

      for (let i = 1; i <= 5; i++) {
        const row = document.createElement('div');
        row.className = 'p-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/50 flex items-center justify-between gap-2 opacity-50';
        
        const leftSide = document.createElement('div');
        leftSide.className = 'flex items-center gap-2 flex-1 min-w-0';
        
        const numPill = document.createElement('span');
        numPill.className = 'w-5 h-5 rounded bg-surface-container text-secondary text-[10px] font-mono-code font-bold flex items-center justify-center shrink-0';
        numPill.textContent = String(i);
        leftSide.appendChild(numPill);

        const bar = document.createElement('div');
        bar.className = 'h-3 rounded bg-slate-300 dark:bg-slate-700/60 skeleton-bar flex-1 max-w-[160px]';
        leftSide.appendChild(bar);

        row.appendChild(leftSide);

        queueFrame.appendChild(row);
      }

      scrollContainer.appendChild(queueFrame);
      queueCol.appendChild(scrollContainer);

      const utilityScroll = document.getElementById('utilityScrollArea');
      if (utilityScroll) {
        this.renderUtilityPanel(utilityScroll);
      }
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

      // Binary status tag: Green Matched or Red Unmatched & Smart Confidence Badge
      const rightBadgeGroup = document.createElement('div');
      rightBadgeGroup.className = 'flex items-center gap-1.5';

      if (currentFile.status === 'needs_review') {
        const smartConfBadge = document.createElement('span');
        smartConfBadge.className = 'confidence-badge confidence-badge-med';
        smartConfBadge.textContent = '🟡 Needs Review';
        rightBadgeGroup.appendChild(smartConfBadge);
      } else if (currentFile.smartConfidence !== undefined) {
        const smartConfBadge = document.createElement('span');
        if (currentFile.smartConfidence >= 80) {
          smartConfBadge.className = 'confidence-badge confidence-badge-high';
          smartConfBadge.textContent = `🟢 ${currentFile.smartConfidence}% ${currentFile.smartDocType || 'MATCH'}`;
        } else if (currentFile.smartConfidence >= 60) {
          smartConfBadge.className = 'confidence-badge confidence-badge-med';
          smartConfBadge.textContent = `🟡 ${currentFile.smartConfidence}% ${currentFile.smartDocType || 'REVIEW'}`;
        } else {
          smartConfBadge.className = 'confidence-badge confidence-badge-low';
          smartConfBadge.textContent = `🔴 ${currentFile.smartConfidence}% UNMATCHED`;
        }
        rightBadgeGroup.appendChild(smartConfBadge);
      }

      const isReady = (currentFile.isMatched || currentFile.isRenamed || currentFile.isKept) && currentFile.status !== 'needs_review';
      const statusTag = document.createElement('span');
      statusTag.className = currentFile.status === 'needs_review'
        ? 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
        : (isReady
          ? 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold'
          : 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold');
      statusTag.textContent = currentFile.status === 'needs_review' ? 'Needs Review' : (isReady ? 'Matched' : 'Unmatched');
      rightBadgeGroup.appendChild(statusTag);

      headerRow.appendChild(rightBadgeGroup);

      activeCardWrapper.appendChild(headerRow);

      const card = document.createElement('article');
      card.className = 'bg-surface-container-lowest rounded-xl shadow-sm p-3 flex flex-col gap-2.5 border border-outline-variant/30 border-l-4 border-l-primary relative';

      // Original filename label with click-to-reset (Horizontal baseline alignment, zero KB, clean ellipsis)
      const origRow = document.createElement('div');
      origRow.className = 'flex items-center gap-1.5 text-[11px] font-mono-code text-secondary w-full min-w-0 overflow-hidden';
      const origLabel = document.createElement('span');
      origLabel.className = 'shrink-0 select-none text-secondary';
      origLabel.textContent = 'Original:';
      origRow.appendChild(origLabel);

      const origVal = document.createElement('strong');
      origVal.className = 'text-on-surface truncate min-w-0 flex-1 cursor-pointer hover:underline hover:text-primary transition-colors font-medium';
      origVal.title = 'Click to reset input to original name';
      origVal.textContent = cleanName(currentFile.name);

      origVal.addEventListener('click', () => {
        const cleanOriginal = cleanName(currentFile.name);
        currentFile.targetName = currentFile.name;
        this.updateTelemetry();
        this.renderQueue();
        toast.show('Input Reset', cleanOriginal, 'info');
      });

      origRow.appendChild(origVal);
      card.appendChild(origRow);

      // Rename target input (Base Name only, extension preserved silently in background)
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
      tipSpan.appendChild(document.createTextNode(' or '));
      const kbdEnter = document.createElement('kbd');
      kbdEnter.className = 'px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40';
      kbdEnter.textContent = 'Enter';
      tipSpan.appendChild(kbdEnter);
      tipSpan.appendChild(document.createTextNode(' to save'));
      labelRow.appendChild(tipSpan);
      inputSection.appendChild(labelRow);

      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'relative flex items-center w-full shadow-sm';

      const targetInput = document.createElement('input');
      targetInput.id = 'inputRenameTarget';
      targetInput.type = 'text';
      targetInput.autocomplete = 'new-password';
      targetInput.setAttribute('autocomplete', 'new-password');
      targetInput.setAttribute('autocorrect', 'off');
      targetInput.setAttribute('autocapitalize', 'off');
      targetInput.setAttribute('spellcheck', 'false');
      targetInput.setAttribute('name', `docmitra_rename_${Date.now()}`);
      targetInput.className = 'w-full h-10 px-3 rounded-lg bg-surface-container-lowest font-mono-code text-[13px] text-on-surface font-semibold border-2 border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-xs';
      
      // USER APPROVED SPEC: ONLY NAME WITHOUT EXTENSION IN EDIT FIELD
      targetInput.value = cleanName(currentFile.targetName || currentFile.suggestedName || currentFile.name);

      // Live keystroke filtering for illegal characters
      targetInput.addEventListener('keydown', (e) => {
        // Tab key: confirm and advance
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          this.handleConfirmCurrentName(targetInput.value.trim());
          return;
        }

        // Shift+Tab: navigate backward
        if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault();
          this.handleNavigateBackward();
          return;
        }

        // Enter key: confirm and advance (identical to Tab)
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleConfirmCurrentName(targetInput.value.trim());
          return;
        }

        // Block illegal Windows characters
        if (/[\\/:*?"<>|]/.test(e.key)) {
          e.preventDefault();
          toast.show('Character Not Allowed', `Windows filenames cannot contain ${e.key}`, 'warning');
        }
      });

      targetInput.addEventListener('input', (e) => {
        let val = e.target.value;
        // Sanitize pasted illegal characters
        if (/[\\/:*?"<>|]/.test(val)) {
          val = val.replace(/[\\/:*?"<>|]/g, '');
          e.target.value = val;
          toast.show('Character Not Allowed', 'Illegal Windows filename characters removed', 'warning');
        }

        const currentExt = currentFile.ext || ext(currentFile.name);
        const trimmedVal = val.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();

        if (!trimmedVal) {
          currentFile.targetName = currentFile.name;
          currentFile.docType = null;
          currentFile.isMatched = false;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold';
          statusTag.textContent = 'Unmatched';
          this.updateTelemetry();
          this.renderCoreShortcuts('');
          return;
        }

        // Exact-Match Shortcut Rule
        const exactShortcut = this.shortcuts21.find(s => s.code.toLowerCase() === trimmedVal.toLowerCase());
        if (exactShortcut) {
          const canonical = exactShortcut.canonical;
          currentFile.docType = canonical;
          currentFile.isMatched = true;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold';
          statusTag.textContent = `Matched: ${canonical}`;

          const formulaBase = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
          const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
          currentFile.targetName = `${cleanBase}${currentExt}`;
        } else {
          // Custom name: preserve user's typed name and append student name with selected case
          currentFile.docType = trimmedVal;
          currentFile.isMatched = false;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-surface-container-high text-secondary font-bold';
          statusTag.textContent = 'Custom Name';

          const formulaBase = buildName(trimmedVal, this.state.studentName, null, this.state.style);
          const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
          currentFile.targetName = `${cleanBase}${currentExt}`;
        }

        this.updateTelemetry();

        // Update live preview document title in canvas if present
        const stageTitle = document.querySelector('#previewContainerStage .font-headline-sm');
        if (stageTitle) {
          stageTitle.textContent = cleanName(currentFile.targetName);
        }

        // Live narrow shortcuts in Right-Side CORE SHORTCUTS Panel
        this.renderCoreShortcuts(val);
      });

      inputWrapper.appendChild(targetInput);
      inputSection.appendChild(inputWrapper);

      card.appendChild(inputSection);
      activeCardWrapper.appendChild(card);
      scrollContainer.appendChild(activeCardWrapper);

      // Auto-focus and select all text in input box
      requestAnimationFrame(() => {
        targetInput.focus();
        targetInput.select();
        // Pin active card to top of view
        activeCardWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Initial render of CORE SHORTCUTS for active file
        this.renderCoreShortcuts(targetInput.value);
      });
    }

    // 2. UPCOMING QUEUE (Strict Queue Rule: files stay until actually renamed on disk)
    const upcomingFiles = this.state.files.filter((f, i) => i !== this.state.currentIndex && !f.isRenamed);
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
      upList.className = 'flex flex-col gap-1 shrink-0';

      upcomingFiles.forEach(f => {
        const fIdx = this.state.files.indexOf(f);
        const item = document.createElement('article');
        item.className = 'h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer shrink-0';
        item.title = `Original: ${cleanName(f.name)} (Click to jump & edit)`;

        // Click upcoming item to jump and focus
        item.addEventListener('click', () => {
          this.state.currentIndex = fIdx;
          this.renderQueue();
          this.renderCurrentPreview();
        });

        const leftCol = document.createElement('div');
        leftCol.className = 'flex items-center gap-2 min-w-0 flex-1';

        const numBadge = document.createElement('span');
        numBadge.className = 'w-4 h-4 rounded bg-surface-container text-secondary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0';
        numBadge.textContent = String(fIdx + 1);
        leftCol.appendChild(numBadge);

        const targetTitle = document.createElement('span');
        targetTitle.className = 'font-mono-code text-[11px] text-on-surface font-semibold truncate';
        targetTitle.textContent = cleanName(f.targetName || f.suggestedName || f.name);
        leftCol.appendChild(targetTitle);

        item.appendChild(leftCol);

        if (f.isScanning) {
          const scanBadge = document.createElement('span');
          scanBadge.className = 'confidence-badge bg-primary/20 text-primary flex items-center gap-1 font-bold';
          const scanSpin = document.createElement('span');
          scanSpin.className = 'material-symbols-outlined text-[12px] animate-spin';
          scanSpin.textContent = 'sync';
          scanBadge.appendChild(scanSpin);
          scanBadge.appendChild(document.createTextNode('SCANNING'));
          item.appendChild(scanBadge);
        } else if (f.status === 'needs_review') {
          const confBadge = document.createElement('span');
          confBadge.className = 'confidence-badge confidence-badge-med';
          confBadge.textContent = '🟡 Needs Review';
          item.appendChild(confBadge);
        } else if (f.smartConfidence !== undefined) {
          const confBadge = document.createElement('span');
          if (f.smartConfidence >= 80) {
            confBadge.className = 'confidence-badge confidence-badge-high';
            confBadge.textContent = `🟢 ${f.smartConfidence}% ${f.smartDocType || 'MATCH'}`;
          } else if (f.smartConfidence >= 60) {
            confBadge.className = 'confidence-badge confidence-badge-med';
            confBadge.textContent = `🟡 ${f.smartConfidence}% ${f.smartDocType || 'REVIEW'}`;
          } else {
            confBadge.className = 'confidence-badge confidence-badge-low';
            confBadge.textContent = `🔴 ${f.smartConfidence}% UNMATCHED`;
          }
          item.appendChild(confBadge);
        }

        upList.appendChild(item);
      });

      scrollContainer.appendChild(upList);
    }

    // 3. COMPLETED FILES (Strict: ONLY genuinely renamed on disk files)
    const completedFiles = this.state.files.filter(f => f.isRenamed);
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
        const fIdx = this.state.files.indexOf(f);
        const item = document.createElement('article');
        item.className = 'h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 border border-emerald-300 cursor-pointer hover:bg-emerald-50/50 transition-colors shrink-0';
        item.title = 'Click to re-open and re-rename in Active Card';

        // USER APPROVED SPEC: Clicking completed item re-opens it in Active Card
        item.addEventListener('click', () => {
          this.state.currentIndex = fIdx;
          this.renderQueue();
          this.renderCurrentPreview();
        });

        const left = document.createElement('div');
        left.className = 'flex items-center gap-2 min-w-0 flex-1';

        const iconBadge = document.createElement('span');
        iconBadge.className = 'w-3.5 h-3.5 rounded-full bg-emerald-500 text-on-primary font-mono-code font-bold text-[9px] flex items-center justify-center shrink-0';
        const ok = document.createElement('span');
        ok.className = 'material-symbols-outlined text-[10px]';
        ok.textContent = 'check';
        iconBadge.appendChild(ok);
        left.appendChild(iconBadge);

        const txt = document.createElement('span');
        txt.className = 'font-mono-code text-[11px] text-tertiary font-bold truncate';
        txt.textContent = cleanName(f.targetName || f.name);
        left.appendChild(txt);
        item.appendChild(left);

        compHeader.appendChild(item);
      });

      scrollContainer.appendChild(compHeader);
    }

    queueCol.appendChild(scrollContainer);

    // Populate Column 3 Utility Panel (Missing Documents + Top 5 Shortcuts)
    const utilityScroll = document.getElementById('utilityScrollArea');
    if (utilityScroll) {
      this.renderUtilityPanel(utilityScroll);
    }
  }

  /**
   * Column 3 (Right Utility Panel): Missing Documents List + Top 5 Core Shortcuts Card
   */
  renderUtilityPanel(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (this.state.files.length === 0) {
      // 1. Missing Documents Checklist Frame (Blurred / Skeleton Empty State — 0 Dummy Documents)
      const missingSection = document.createElement('div');
      missingSection.className = 'flex flex-col gap-1.5 shrink-0 select-none';

      const missingHeader = document.createElement('div');
      missingHeader.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] font-mono-code text-secondary shrink-0';
      const mLeft = document.createElement('div');
      mLeft.className = 'flex items-center gap-1.5 font-bold';
      const mIcon = document.createElement('span');
      mIcon.className = 'material-symbols-outlined text-[15px] text-secondary';
      mIcon.textContent = 'checklist';
      mLeft.appendChild(mIcon);
      const mTitle = document.createElement('span');
      mTitle.textContent = 'MISSING DOCUMENTS (Checklist)';
      mLeft.appendChild(mTitle);
      missingHeader.appendChild(mLeft);

      const mStatus = document.createElement('span');
      mStatus.className = 'text-[10px] text-secondary/70';
      mStatus.textContent = 'Standby';
      missingHeader.appendChild(mStatus);
      missingSection.appendChild(missingHeader);

      const missingSkeletonBox = document.createElement('div');
      missingSkeletonBox.className = 'p-3 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/60 flex flex-col gap-2 select-none';
      const sBar1 = document.createElement('div');
      sBar1.className = 'h-3 w-3/4 bg-slate-300 dark:bg-slate-700/50 rounded skeleton-bar';
      missingSkeletonBox.appendChild(sBar1);
      const sBar2 = document.createElement('div');
      sBar2.className = 'h-3 w-1/2 bg-slate-300 dark:bg-slate-700/50 rounded skeleton-bar';
      missingSkeletonBox.appendChild(sBar2);
      const sNote = document.createElement('span');
      sNote.className = 'text-[11px] text-secondary/60 italic pt-1';
      sNote.textContent = 'Checklist audit will verify missing records upon folder load.';
      missingSkeletonBox.appendChild(sNote);
      missingSection.appendChild(missingSkeletonBox);
      container.appendChild(missingSection);
      return;
    }

    // 1. MISSING DOCUMENTS / CHECKLIST AUDIT
    const presetsData = this.state.documentPresets || this.state.settings?.checklists || DEFAULT_CHECKLISTS_DATA;
    const formRules = presetsData["MAHA DBT FORM"] || DEFAULT_CHECKLISTS_DATA["MAHA DBT FORM"] || [];

    // Extract rule names and shortcodes
    const activeRules = formRules.map(r => {
      if (typeof r === 'string') return { name: r, code: '', required: true };
      if (Array.isArray(r)) return { name: r[0], code: '', required: true };
      return { name: r.name, code: r.code || '', required: r.required !== undefined ? !!r.required : true };
    }).filter(r => r.required !== false);

    const presentDocs = new Set(
      this.state.files.map(f => (f.docType || '').toUpperCase()).filter(Boolean)
    );

    const missingRules = activeRules.filter((rule) => {
      const cleanRule = rule.name.toUpperCase();
      if (presentDocs.has(cleanRule)) return false;
      for (const link of DEFAULT_LINKED_RULES) {
        if (link.combined && presentDocs.has(link.combined.toUpperCase())) {
          if (cleanRule === link.part1.toUpperCase() || cleanRule === link.part2.toUpperCase()) {
            return false;
          }
        }
      }
      return true;
    });

    if (missingRules.length > 0) {
      const missingSection = document.createElement('div');
      missingSection.className = 'flex flex-col gap-1.5 shrink-0';

      const missingHeader = document.createElement('div');
      missingHeader.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono-code text-amber-900 dark:text-amber-300 shrink-0 cursor-pointer select-none hover:bg-amber-500/20 transition-colors';
      missingHeader.onclick = () => {
        this.state.isMissingDocsCollapsed = !this.state.isMissingDocsCollapsed;
        this.renderQueue();
      };

      const leftMissing = document.createElement('div');
      leftMissing.className = 'flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400';
      const warnIcon = document.createElement('span');
      warnIcon.className = 'material-symbols-outlined text-[15px]';
      warnIcon.textContent = 'warning';
      leftMissing.appendChild(warnIcon);
      leftMissing.appendChild(document.createTextNode('MISSING DOCUMENTS'));
      missingHeader.appendChild(leftMissing);

      const rightMissing = document.createElement('div');
      rightMissing.className = 'flex items-center gap-1.5';

      const pulseBadge = document.createElement('span');
      pulseBadge.className = 'px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono-code text-[10px] animate-pulse flex items-center gap-1';
      pulseBadge.textContent = `⚠️ ${missingRules.length} Missing Documents Found`;
      rightMissing.appendChild(pulseBadge);

      const chevron = document.createElement('span');
      chevron.className = 'material-symbols-outlined text-[16px] text-amber-800 transition-transform';
      chevron.textContent = this.state.isMissingDocsCollapsed ? 'expand_more' : 'expand_less';
      rightMissing.appendChild(chevron);

      missingHeader.appendChild(rightMissing);
      missingSection.appendChild(missingHeader);

      if (!this.state.isMissingDocsCollapsed) {
        const missingList = document.createElement('div');
        missingList.className = 'flex flex-col gap-1 shrink-0';

        missingRules.forEach((ruleObj) => {
          const ruleName = ruleObj.name;
          const ruleCode = ruleObj.code;
          const mItem = document.createElement('article');
          mItem.className = 'h-8 px-2 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-1.5 border border-amber-500/30 hover:border-amber-500/50 transition-colors shrink-0';

          const leftCol = document.createElement('div');
          leftCol.className = 'flex items-center gap-1.5 min-w-0 flex-1';

          const redDot = document.createElement('span');
          redDot.className = 'w-1.5 h-1.5 rounded-full bg-error shrink-0';
          leftCol.appendChild(redDot);

          if (ruleCode) {
            const cBadge = document.createElement('span');
            cBadge.className = 'px-1 py-0.2 rounded bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono-code text-[9px] font-bold shrink-0';
            cBadge.textContent = ruleCode;
            leftCol.appendChild(cBadge);
          }

          const titleSpan = document.createElement('span');
          titleSpan.className = 'font-mono-code text-[11px] font-bold text-on-surface truncate';
          titleSpan.textContent = ruleName;
          leftCol.appendChild(titleSpan);

          const studentName = this.state.studentName || this.state.folder?.name || 'Student';
          const pendingFollowup = getPendingFollowUp(studentName, ruleName);

          if (pendingFollowup) {
            const statusBadge = document.createElement('span');
            statusBadge.className = 'px-1.5 py-0.2 rounded font-mono-code text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shrink-0 flex items-center gap-0.5';
            statusBadge.textContent = `📅 ${formatFriendlyDate(pendingFollowup.promisedDate)}`;
            leftCol.appendChild(statusBadge);
          }

          mItem.appendChild(leftCol);

          // Inline Action Buttons (Follow-up + Import)
          const actionRow = document.createElement('div');
          actionRow.className = 'flex items-center gap-1 shrink-0';

          // 1. Follow-up Date Picker Popover Button
          const popoverWrapper = document.createElement('div');
          popoverWrapper.className = 'relative inline-block';

          const btnFollowup = document.createElement('button');
          btnFollowup.type = 'button';
          btnFollowup.className = 'px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[9px] font-semibold flex items-center gap-0.5 border border-outline-variant/30 cursor-pointer transition-colors';
          const calIcon = document.createElement('span');
          calIcon.className = 'material-symbols-outlined text-[12px] text-primary';
          calIcon.textContent = 'event';
          btnFollowup.appendChild(calIcon);
          btnFollowup.appendChild(document.createTextNode('Date'));
          popoverWrapper.appendChild(btnFollowup);

          const dateMenu = document.createElement('div');
          dateMenu.className = 'hidden absolute right-0 bottom-full mb-1 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/40 p-2 z-50 flex flex-col gap-1 text-[11px] font-mono-code';

          const optToday = document.createElement('button');
          optToday.type = 'button';
          optToday.className = 'w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer';
          optToday.textContent = `Today (${formatFriendlyDate(getTodayDateString())})`;
          optToday.onclick = (e) => {
            e.stopPropagation();
            addOrUpdateFollowUp({
              folderName: studentName,
              studentName: studentName,
              documentName: ruleName,
              promisedDate: getTodayDateString(),
              note: `Missing ${ruleName} during intake`
            });
            dateMenu.classList.add('hidden');
            toast.show('Follow-up Scheduled', `${ruleName} promise date set for Today`, 'success');
            this.renderQueue();
          };
          dateMenu.appendChild(optToday);

          const optTomorrow = document.createElement('button');
          optTomorrow.type = 'button';
          optTomorrow.className = 'w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer';
          optTomorrow.textContent = `Tomorrow (${formatFriendlyDate(getTomorrowDateString(1))})`;
          optTomorrow.onclick = (e) => {
            e.stopPropagation();
            addOrUpdateFollowUp({
              folderName: studentName,
              studentName: studentName,
              documentName: ruleName,
              promisedDate: getTomorrowDateString(1),
              note: `Missing ${ruleName} during intake`
            });
            dateMenu.classList.add('hidden');
            toast.show('Follow-up Scheduled', `${ruleName} promise date set for Tomorrow`, 'success');
            this.renderQueue();
          };
          dateMenu.appendChild(optTomorrow);

          const optMonday = document.createElement('button');
          optMonday.type = 'button';
          optMonday.className = 'w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer';
          optMonday.textContent = `Monday (${formatFriendlyDate(getNextMondayDateString())})`;
          optMonday.onclick = (e) => {
            e.stopPropagation();
            addOrUpdateFollowUp({
              folderName: studentName,
              studentName: studentName,
              documentName: ruleName,
              promisedDate: getNextMondayDateString(),
              note: `Missing ${ruleName} during intake`
            });
            dateMenu.classList.add('hidden');
            toast.show('Follow-up Scheduled', `${ruleName} promise date set for Monday`, 'success');
            this.renderQueue();
          };
          dateMenu.appendChild(optMonday);

          // Custom date input
          const customDateDiv = document.createElement('div');
          customDateDiv.className = 'flex items-center gap-1 pt-1 border-t border-surface-container mt-1';
          const dateInput = document.createElement('input');
          dateInput.type = 'date';
          dateInput.className = 'flex-1 text-[10px] p-1 rounded bg-surface-container text-on-surface border border-outline-variant/40 outline-none';
          const btnSetCustom = document.createElement('button');
          btnSetCustom.type = 'button';
          btnSetCustom.className = 'px-2 py-1 rounded bg-primary text-on-primary text-[10px] font-bold cursor-pointer';
          btnSetCustom.textContent = 'Set';
          btnSetCustom.onclick = (e) => {
            e.stopPropagation();
            if (dateInput.value) {
              addOrUpdateFollowUp({
                folderName: studentName,
                studentName: studentName,
                documentName: ruleName,
                promisedDate: dateInput.value,
                note: `Missing ${ruleName} during intake`
              });
              dateMenu.classList.add('hidden');
              toast.show('Follow-up Scheduled', `${ruleName} promise date: ${dateInput.value}`, 'success');
              this.renderQueue();
            }
          };
          customDateDiv.appendChild(dateInput);
          customDateDiv.appendChild(btnSetCustom);
          dateMenu.appendChild(customDateDiv);

          btnFollowup.onclick = (e) => {
            e.stopPropagation();
            dateMenu.classList.toggle('hidden');
          };
          popoverWrapper.appendChild(dateMenu);
          actionRow.appendChild(popoverWrapper);

          // 2. Direct Import Button (Functional: Copies file on disk into student folder)
          const btnImport = document.createElement('button');
          btnImport.type = 'button';
          btnImport.className = 'px-2 py-0.5 rounded bg-primary hover:bg-primary/90 text-on-primary font-mono-code text-[9px] font-bold flex items-center gap-0.5 shadow-xs cursor-pointer transition-colors';
          const impIcon = document.createElement('span');
          impIcon.className = 'material-symbols-outlined text-[12px]';
          impIcon.textContent = 'download';
          btnImport.appendChild(impIcon);
          btnImport.appendChild(document.createTextNode('Import'));

          btnImport.onclick = async (e) => {
            e.stopPropagation();
            toast.show('Select File for Import', `Select document for ${ruleName}`, 'info');
            try {
              const res = await selectNativeFiles('All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*', `Select File for ${ruleName}`);
              if (!res.success || !res.files || res.files.length === 0) return;

              const picked = res.files[0];
              const fileExt = picked.ext || ext(picked.name);
              const folderPath = this.state.folder?.path || '';
              const studentName = this.state.studentName || this.state.folder?.name || '';

              // Detection & Matching Pipeline: detect type/code -> match student name -> mark uncertain files as Needs Review
              let detectedDocType = ruleName;
              let isConfident = true;
              let evalRes = null;

              try {
                const text = await this.extractTextFromFile(picked);
                if (text && text.length >= 20) {
                  evalRes = evaluateSmartOcrDocument(text, studentName);
                  if (evalRes && evalRes.docType) {
                    if (ruleName && evalRes.docType.toUpperCase() === ruleName.toUpperCase()) {
                      detectedDocType = ruleName;
                      isConfident = evalRes.confidence >= 50;
                    } else if (!ruleName) {
                      detectedDocType = evalRes.docType;
                      isConfident = evalRes.confidence >= 70;
                    } else {
                      // OCR detected a different document type
                      isConfident = false;
                    }
                  } else {
                    isConfident = false;
                  }
                } else {
                  // Fallback: check filename for keyword or shortcode matching
                  const baseClean = cleanName(picked.name);
                  const matched = matchDocument(baseClean, this.state.settings?.groups);
                  if (matched) {
                    detectedDocType = ruleName || matched;
                    isConfident = true;
                  } else {
                    isConfident = false;
                  }
                }
              } catch (ocrErr) {
                console.warn('[DocMitra Import] OCR detection warning:', ocrErr);
                isConfident = false;
              }

              const targetBase = buildName(detectedDocType || ruleName || cleanName(picked.name), studentName, this.state.settings?.groups, this.state.style);
              const cleanBase = targetBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
              const targetFilename = `${cleanBase}${fileExt}`;

              let imported = null;
              if (folderPath && picked.path) {
                imported = await importNativeFile({
                  sourcePath: picked.path,
                  targetDir: folderPath,
                  targetName: targetFilename,
                  studentName: studentName
                });
              }

              const finalName = (imported && imported.name) ? imported.name : targetFilename;
              const finalPath = (imported && imported.path) ? imported.path : (folderPath ? `${folderPath}/${finalName}` : picked.path);
              const finalSize = (imported && imported.size) ? imported.size : (picked.size || 0);

              const newFileItem = {
                id: `imported_${Date.now()}`,
                name: finalName,
                targetName: finalName,
                suggestedName: finalName,
                path: finalPath,
                nativePath: finalPath,
                size: finalSize,
                ext: fileExt,
                url: (imported && imported.url) ? imported.url : picked.url,
                docType: detectedDocType || ruleName,
                isMatched: isConfident,
                isRenamed: false,
                isKept: false,
                rotation: 0,
                isScanning: false,
                smartConfidence: evalRes ? evalRes.confidence : (isConfident ? 90 : 40),
                smartDocType: evalRes ? evalRes.docType : detectedDocType,
                status: isConfident ? 'matched' : 'needs_review'
              };

              this.state.files.push(newFileItem);
              this.updateTelemetry();
              this.renderQueue();
              this.renderCurrentPreview();
              if (isConfident) {
                toast.show('Document Imported', `Imported ${cleanName(finalName)} as ${detectedDocType}`, 'success');
              } else {
                toast.show('Imported — Needs Review', `Imported ${cleanName(finalName)}; please verify document type.`, 'warning');
              }
            } catch (err) {
              toast.show('Import Error', err.message, 'error');
            }
          };
          actionRow.appendChild(btnImport);

          mItem.appendChild(actionRow);
          missingList.appendChild(mItem);
        });

        missingSection.appendChild(missingList);
      }
      container.appendChild(missingSection);
    } else {
      const allDoneCard = document.createElement('div');
      allDoneCard.className = 'p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300';
      const checkIcon = document.createElement('span');
      checkIcon.className = 'material-symbols-outlined text-[18px] text-tertiary';
      checkIcon.textContent = 'check_circle';
      allDoneCard.appendChild(checkIcon);
      const doneText = document.createElement('span');
      doneText.className = 'font-mono-code text-[11px] font-bold';
      doneText.textContent = 'All Required Documents Present';
      allDoneCard.appendChild(doneText);
      container.appendChild(allDoneCard);
    }

    // 2. CORE SHORTCUTS CONTAINER (Hidden from UI per operator preference)
    const shortcutsSection = document.createElement('div');
    shortcutsSection.id = 'coreShortcutsContainer';
    shortcutsSection.className = 'hidden';
    container.appendChild(shortcutsSection);

    const inputVal = document.getElementById('inputRenameTarget')?.value || '';
    this.renderCoreShortcuts(inputVal);
  }

  /**
   * Dynamically filters and renders CORE SHORTCUTS in Column 3 based on Rename box typing
   */
  renderCoreShortcuts(query = '') {
    const scContainer = document.getElementById('coreShortcutsContainer');
    if (!scContainer) return;

    while (scContainer.firstChild) {
      scContainer.removeChild(scContainer.firstChild);
    }

    if (this.state.files.length === 0) {
      return;
    }

    const currentFile = this.state.files[this.state.currentIndex];
    const baseOriginal = currentFile ? cleanName(currentFile.name) : '';
    let q = (query || '').trim();
    if (q === baseOriginal) q = '';

    const defaultTop5 = [
      { code: '10M', label: '10th Marksheet', canonical: '10TH MARKSHEET' },
      { code: '12M', label: '12th Marksheet', canonical: '12TH MARKSHEET' },
      { code: 'ADR', label: 'Aadhaar Card', canonical: 'AADHAAR CARD' },
      { code: 'CST', label: 'Caste Certificate', canonical: 'CASTE CERTIFICATE' },
      { code: 'DOM', label: 'Domicile Cert', canonical: 'DOMICILE CERTIFICATE' }
    ];

    let itemsToRender = [];
    let isFiltered = false;
    let zeroMatches = false;

    if (!q) {
      itemsToRender = defaultTop5;
    } else {
      const lowerQ = q.toLowerCase();
      const filtered = this.shortcuts21.filter(s =>
        s.code.toLowerCase().includes(lowerQ) ||
        s.label.toLowerCase().includes(lowerQ) ||
        s.canonical.toLowerCase().includes(lowerQ)
      );

      if (filtered.length > 0) {
        itemsToRender = filtered.slice(0, 5);
        isFiltered = true;
      } else {
        // Zero matches: display default top 5 dimmed with italic note per locked spec
        itemsToRender = defaultTop5;
        zeroMatches = true;
      }
    }

    // Header
    const scHeader = document.createElement('div');
    scHeader.className = 'flex items-center justify-between mb-1.5';
    const scTitle = document.createElement('div');
    scTitle.className = 'flex items-center gap-1.5 font-bold font-mono-code text-[11px] text-primary';
    const boltIcon = document.createElement('span');
    boltIcon.className = 'material-symbols-outlined text-[15px]';
    boltIcon.textContent = 'bolt';
    scTitle.appendChild(boltIcon);
    scTitle.appendChild(document.createTextNode('CORE SHORTCUTS'));
    scHeader.appendChild(scTitle);

    const scBadge = document.createElement('span');
    if (zeroMatches) {
      scBadge.className = 'px-1.5 py-0.2 rounded font-mono-code text-[10px] bg-surface-container text-secondary font-bold';
      scBadge.textContent = 'Custom';
    } else if (isFiltered) {
      scBadge.className = 'px-1.5 py-0.2 rounded font-mono-code text-[10px] bg-primary/20 text-primary font-bold';
      scBadge.textContent = `${itemsToRender.length} Match${itemsToRender.length > 1 ? 'es' : ''}`;
    } else {
      scBadge.className = 'px-1.5 py-0.2 rounded font-mono-code text-[10px] bg-surface-container text-secondary font-bold';
      scBadge.textContent = 'Top 5';
    }
    scHeader.appendChild(scBadge);
    scContainer.appendChild(scHeader);

    // Italic note if custom name (zero matches)
    if (zeroMatches) {
      const note = document.createElement('div');
      note.className = 'text-[10px] font-mono-code text-secondary italic py-1 px-2 mb-1.5 rounded bg-surface-container/60 border border-outline-variant/30 text-center select-none';
      note.textContent = 'No shortcode matches — saving as custom text';
      scContainer.appendChild(note);
    }

    const scList = document.createElement('div');
    scList.className = 'flex flex-col gap-1.5';

    itemsToRender.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';

      if (zeroMatches) {
        btn.className = 'h-8 px-2.5 rounded-lg bg-surface-container text-on-surface font-mono-code text-[11px] font-semibold flex items-center justify-between gap-2 border border-outline-variant/20 opacity-40 pointer-events-none cursor-not-allowed select-none';
      } else {
        btn.className = 'h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[11px] font-semibold flex items-center justify-between gap-2 border border-outline-variant/30 hover:border-primary/50 cursor-pointer active:scale-95 transition-all shadow-xs';
        btn.title = `Click to apply ${item.code} (${item.label}) to active document`;
        btn.addEventListener('click', () => {
          this.applyShortcutToCurrent(item);
        });
      }

      const badge = document.createElement('span');
      badge.className = `px-2 py-0.5 rounded text-[10px] ${getShortcutBadgeColor(item.code)} shadow-xs`;
      badge.textContent = item.code;
      btn.appendChild(badge);

      const label = document.createElement('span');
      label.className = 'truncate flex-1 text-left text-on-surface text-[11px] font-medium';
      label.textContent = item.label;
      btn.appendChild(label);

      if (!zeroMatches) {
        const enterHint = document.createElement('span');
        enterHint.className = 'text-[9px] font-mono-code text-secondary opacity-60';
        enterHint.textContent = '↵';
        btn.appendChild(enterHint);
      }

      scList.appendChild(btn);
    });

    scContainer.appendChild(scList);
  }

  /**
   * One-Click Instant Rename via Shortcut Button
   */
  async applyShortcutToCurrent(shortcut) {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    const canonical = shortcut.canonical;
    const extension = current.ext || ('.' + current.name.split('.').pop()).toLowerCase();
    const formatted = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
    const cleanFormatted = formatted.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
    const targetWithExt = `${cleanFormatted}${extension}`;

    // Unique destination check with studentName sequential duplicate avoidance
    const used = new Set(this.state.files.map(f => f.targetName));
    used.delete(current.targetName);
    const unique = uniqueDestination(targetWithExt, current.name, used, this.state.studentName);

    current.targetName = unique;
    current.docType = canonical;
    current.isMatched = true;
    current.status = 'matched';

    // USER APPROVED SPEC: Instant atomic rename & advance
    await this.handleConfirmCurrentName(unique);
  }

  /**
   * Tab & Enter Key Immediate Atomic Rename on Disk
   */
  async handleConfirmCurrentName(rawInput) {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    let targetFilename = (rawInput || '').trim();
    const currentExt = current.ext || ('.' + current.name.split('.').pop()).toLowerCase();

    // If empty input, keep original name
    if (!targetFilename) {
      await this.handleKeepOriginal();
      return;
    }

    const baseTyped = targetFilename.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();

    // Exact-Match Shortcut Rule vs. Custom User Name (+ Student Name)
    const exactShortcut = this.shortcuts21.find(s => s.code.toLowerCase() === baseTyped.toLowerCase());
    if (exactShortcut) {
      const canonical = exactShortcut.canonical;
      const formatted = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
      const cleanFormatted = formatted.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
      targetFilename = `${cleanFormatted}${currentExt}`;
      current.docType = canonical;
      current.isMatched = true;
    } else {
      // Custom user name: preserve exact custom text and automatically append Student Name
      let customBase = baseTyped;
      if (this.state.studentName && !customBase.toLowerCase().includes(this.state.studentName.toLowerCase())) {
        customBase = `${customBase} ${this.state.studentName}`;
      }
      if (this.state.style === 'upper') customBase = customBase.toUpperCase();
      else if (this.state.style === 'lower') customBase = customBase.toLowerCase();
      else if (this.state.style === 'title') customBase = customBase.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());

      const cleanCustom = customBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
      targetFilename = `${cleanCustom}${currentExt}`;
      current.docType = baseTyped;
      current.isMatched = false;
    }

    // UNIQUE DESTINATION NUMBERING: Ensure no duplicate overwrites!
    const used = new Set(this.state.files.map(f => f.targetName || f.name));
    if (this.state.folder?.files) {
      for (const diskFile of this.state.folder.files) {
        if (diskFile.name) used.add(diskFile.name);
      }
    }
    used.delete(current.targetName);
    used.delete(current.name);
    targetFilename = uniqueDestination(targetFilename, current.name, used, this.state.studentName);

    const error = validateFilename(targetFilename);
    if (error) {
      toast.show('Invalid Filename', error, 'error');
      return;
    }

    // Perform atomic rename on disk immediately with rotation support
    try {
      const dirPath = this.state.folder?.path || '';
      const oldPath = current.path || (dirPath ? `${dirPath}/${current.name}` : null);
      const studentName = this.state.studentName || '';
      const rotation = current.rotation || 0;

      if (oldPath && (current.name !== targetFilename || rotation % 360 !== 0)) {
        const res = await renameNativeFile(oldPath, targetFilename, studentName, rotation);
        if (res.success) {
          const actualFilename = res.name || targetFilename;
          const updatedPath = res.path || (oldPath.replace(/\\/g, '/').replace(/\/[^\/]+$/, '') + '/' + actualFilename);
          // Push to undo stack
          undoManager.pushBatch(this.state.folder, [{
            old: current.name,
            next: actualFilename,
            file: current,
            nativePath: current.path
          }]);

          current.name = actualFilename;
          current.targetName = actualFilename;
          current.path = updatedPath;
          current.nativePath = updatedPath;
          current.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(updatedPath)}`;
          current.isRenamed = true;
          current.status = 'renamed';
          current.rotation = 0; // successfully applied to output file
          recordRenameEvent(1);
          toast.show('Renamed', cleanName(actualFilename), 'success');
        } else {
          toast.show('Rename Error', res.error || 'Failed to rename on disk', 'error');
          return;
        }
      } else {
        current.name = targetFilename;
        current.targetName = targetFilename;
        current.isRenamed = true;
        current.status = 'renamed';
        toast.show('Name Confirmed', cleanName(targetFilename), 'info');
      }
    } catch (err) {
      toast.show('Rename Failed', err.message, 'error');
      return;
    }

    this.updateTelemetry();

    // Advance to next pending file
    const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed);
    if (nextPending !== -1) {
      this.state.currentIndex = nextPending;
    } else {
      const firstPending = this.state.files.findIndex(f => !f.isRenamed);
      if (firstPending !== -1) {
        this.state.currentIndex = firstPending;
      }
    }

    this.renderQueue();
    this.renderCurrentPreview();
  }

  handleNavigateBackward() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.renderQueue();
      this.renderCurrentPreview();
    } else {
      toast.show('First Document', 'Already on the first document in queue.', 'info');
    }
  }

  async handleKeepOriginal() {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    current.targetName = current.name;
    current.isKept = true;
    current.status = 'kept';

    // If file has rotation, apply it to disk even when keeping original name
    if (current.rotation && current.rotation % 360 !== 0) {
      const oldPath = current.path || (this.state.folder?.path ? `${this.state.folder.path}/${current.name}` : null);
      if (oldPath) {
        try {
          const rotRes = await rotateNativeFile(oldPath, current.rotation);
          if (rotRes && rotRes.success) {
            current.rotation = 0;
          }
        } catch (e) {
          console.warn('[DocMitra] Rotation on keep failed:', e);
        }
      }
    }

    toast.show('Kept Original', cleanName(current.name), 'info');

    // Advance to next pending file
    const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed && !f.isKept);
    if (nextPending !== -1) {
      this.state.currentIndex = nextPending;
    } else {
      const firstPending = this.state.files.findIndex(f => !f.isRenamed);
      if (firstPending !== -1) {
        this.state.currentIndex = firstPending;
      }
    }

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
  }

  async handleRenameAll() {
    const pending = this.state.files.filter(f => !f.isRenamed && ((f.targetName && f.targetName !== f.name) || (f.rotation && f.rotation % 360 !== 0)));
    if (pending.length === 0) {
      toast.show('No Changes Needed', 'All files are already named or kept.', 'info');
      return;
    }

    for (const f of pending) {
      const err = validateFilename(f.targetName);
      if (err) {
        toast.show('Validation Error', `${cleanName(f.name)}: ${err}`, 'error');
        return;
      }
    }

    const plan = pending.map(f => ({
      old: f.name,
      next: f.targetName,
      file: f,
      nativePath: f.path,
      studentName: this.state.studentName || '',
      rotation: f.rotation || 0
    }));

    toast.show('Executing Batch Rename', `Processing ${plan.length} files atomically...`, 'info');

    try {
      const result = await executeRename(this.state.folder, plan, (pct, status) => {
        console.log(`[Rename Progress] ${pct}%: ${status}`);
      });

      undoManager.pushBatch(this.state.folder, plan);

      pending.forEach(f => {
        f.name = f.targetName;
        f.isRenamed = true;
        f.status = 'renamed';
        f.rotation = 0;
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

      batch.plan.forEach(item => {
        const f = this.state.files.find(x => x.targetName === item.next || x.name === item.next || (item.file && x.id === item.file.id));
        if (f) {
          f.name = item.old;
          f.targetName = item.old;
          f.isRenamed = false;
          f.status = 'pending';
          const restoredPath = item.nativePath || (this.state.folder?.path ? `${this.state.folder.path}/${item.old}` : f.path?.replace(/[^\\\/]+$/, item.old));
          if (restoredPath) {
            f.path = restoredPath;
            f.nativePath = restoredPath;
            f.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(restoredPath)}`;
          }
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

  async extractTextFromFile(file) {
    if (!file) return '';
    const isPdf = (file.ext === '.pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf')));

    if (isPdf) {
      try {
        if (!window.pdfjsLib) {
          await new Promise((resolve) => this._loadPdfJs(resolve));
        }
        if (window.pdfjsLib && file.url) {
          const loadingTask = window.pdfjsLib.getDocument(file.url);
          const pdfDoc = await loadingTask.promise;
          const page = await pdfDoc.getPage(1);
          const textContent = await page.getTextContent();
          const extractedText = (textContent.items || []).map(item => item.str).join(' ').trim();
          if (extractedText && extractedText.length >= 35) {
            return extractedText;
          }

          // Fallback: Scanned PDF page 1 rendered to canvas for Tesseract OCR
          const viewport = page.getViewport({ scale: 1.5 });
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;
          const ctx = offscreenCanvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          const base64Data = offscreenCanvas.toDataURL('image/jpeg', 0.85);

          const res = await fetch('http://localhost:3000/api/ocr-extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image: base64Data })
          });
          const data = await res.json();
          if (data && data.success) {
            return data.text || '';
          }
        }
      } catch (err) {
        console.warn('[DocMitra Renamer] PDF OCR extraction warning:', err);
      }
    } else {
      // Image documents (JPG, PNG, TIFF, etc.)
      try {
        const res = await fetch('http://localhost:3000/api/ocr-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: file.path || file.nativePath || '' })
        });
        const data = await res.json();
        if (data && data.success) {
          return data.text || '';
        }
      } catch (err) {
        console.warn('[DocMitra Renamer] Image OCR extraction warning:', err);
      }
    }
    return '';
  }

  async handleSmartScanBatch() {
    if (this.state.files.length === 0) {
      toast.show('Intake Folder Needed', 'Press "Select Folder" (F2) before running Smart Scan.', 'warning');
      return;
    }

    // Cancel existing scan if running
    if (this._scanAbortController) {
      this._scanAbortController.abort();
    }
    this._scanAbortController = new AbortController();
    const signal = this._scanAbortController.signal;

    const pending = this.state.files.filter(f => !f.isRenamed);
    if (pending.length === 0) {
      toast.show('No Pending Files', 'All files are already renamed.', 'info');
      return;
    }

    this.state.isSmartScanning = true;
    const btnSmart = document.getElementById('btnSmartScanBatch');
    const origHtml = btnSmart ? btnSmart.innerHTML : '';
    if (btnSmart) {
      btnSmart.classList.add('smart-scan-pulse');
      btnSmart.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (0/${pending.length})...</span>`;
    }

    toast.show('Smart Scan Started', `Scanning File #1 immediately...`, 'info');

    let highConfCount = 0;

    // Prioritize File #1 (current index or index 0)
    const scanQueue = [...pending];
    const currentFile = this.state.files[this.state.currentIndex];
    if (currentFile && scanQueue.includes(currentFile)) {
      const idx = scanQueue.indexOf(currentFile);
      if (idx > 0) {
        scanQueue.splice(idx, 1);
        scanQueue.unshift(currentFile);
      }
    }

    try {
      for (let i = 0; i < scanQueue.length; i++) {
        if (signal.aborted) break;

        const f = scanQueue[i];
        f.isScanning = true;

        if (btnSmart) {
          btnSmart.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (${i + 1}/${scanQueue.length})...</span>`;
        }

        // Live render active scanning indicator
        this.renderQueue();
        await new Promise(r => setTimeout(r, 40));

        if (signal.aborted) break;

        try {
          const text = await this.extractTextFromFile(f);
          const evalRes = evaluateSmartOcrDocument(text, this.state.studentName);
          f.smartEvaluation = evalRes;
          f.smartConfidence = evalRes.confidence;
          f.smartDocType = evalRes.docType;
          f.smartText = text;

          if (evalRes.isConfident && evalRes.docType) {
            highConfCount++;
            f.docType = evalRes.docType;
            f.isMatched = true;
            const formulaBase = buildName(evalRes.docType, this.state.studentName, this.state.settings?.groups, this.state.style);
            const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
            const currentExt = f.ext || ('.' + f.name.split('.').pop()).toLowerCase();
            f.targetName = `${cleanBase}${currentExt}`;
            f.status = 'matched';
          }
        } catch (err) {
          console.error('[DocMitra Renamer] OCR error on file:', f.name, err);
          f.smartConfidence = 0;
        } finally {
          f.isScanning = false;
        }

        // Live row-by-row update: telemetry, queue badges, and preview
        this.updateTelemetry();
        this.renderQueue();
        if (this.state.files[this.state.currentIndex] === f) {
          this.renderCurrentPreview();
        }

        // Yield to browser UI paint
        await new Promise(r => setTimeout(r, 40));
      }
    } finally {
      this.state.isSmartScanning = false;
      this.state.files.forEach(f => { f.isScanning = false; });
      if (btnSmart) {
        btnSmart.classList.remove('smart-scan-pulse');
        btnSmart.innerHTML = origHtml;
      }
      this.updateTelemetry();
      this.renderQueue();
    }

    if (!signal.aborted) {
      toast.show(
        'Smart Scan Complete',
        `${highConfCount} of ${pending.length} documents identified with high confidence (>=80%).`,
        highConfCount > 0 ? 'success' : 'info'
      );
    }
  }

  async handleRenameAllMatched() {
    const toRename = this.state.files.filter(f => !f.isRenamed && f.status !== 'needs_review' && (f.smartConfidence >= 80 || (f.smartConfidence === undefined && f.isMatched)) && (f.targetName !== f.name || (f.rotation && f.rotation % 360 !== 0)));
    if (toRename.length === 0) {
      toast.show('No Matched Files', 'Run Smart Scan (F4) or match documents with shortcuts first.', 'info');
      return;
    }

    for (const f of toRename) {
      const err = validateFilename(f.targetName);
      if (err) {
        toast.show('Validation Error', `${cleanName(f.name)}: ${err}`, 'error');
        return;
      }
    }

    const plan = toRename.map(f => ({
      old: f.name,
      next: f.targetName,
      file: f,
      nativePath: f.path,
      studentName: this.state.studentName || '',
      rotation: f.rotation || 0
    }));

    toast.show('Executing Matched Batch', `Renaming ${plan.length} matched files (>=80% confidence)...`, 'info');

    try {
      const result = await executeRename(this.state.folder, plan, (pct, status) => {
        console.log(`[Smart Rename Progress] ${pct}%: ${status}`);
      });

      undoManager.pushBatch(this.state.folder, plan);

      toRename.forEach(f => {
        f.name = f.targetName;
        f.isRenamed = true;
        f.status = 'renamed';
        f.rotation = 0;
      });

      toast.show('Matched Batch Complete!', `Successfully renamed ${plan.length} documents.`, 'success');
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
    } catch (err) {
      toast.show('Rename Failed', err.message, 'error');
    }
  }

  handleReviewUnmatched() {
    const unmatchedIdx = this.state.files.findIndex(f => !f.isRenamed && (f.status === 'needs_review' || (f.smartConfidence !== undefined ? f.smartConfidence < 80 : !f.isMatched)));
    if (unmatchedIdx === -1) {
      toast.show('Queue Clear', 'All pending files have high confidence or are already resolved.', 'info');
      return;
    }

    this.state.currentIndex = unmatchedIdx;
    this.renderQueue();
    this.renderCurrentPreview();
    const targetFile = this.state.files[unmatchedIdx];
    toast.show(
      'Reviewing File',
      `Jumped to file #${unmatchedIdx + 1} (${cleanName(targetFile.name)}) for manual inspection.`,
      'info'
    );
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

    const checklistName = this.state.settings?.activeChecklist || 'MAHA DBT FORM';
    const checklistsData = this.state.settings?.checklists || DEFAULT_CHECKLISTS_DATA;
    const rawRules = checklistsData[checklistName] || DEFAULT_CHECKLISTS_DATA['MAHA DBT FORM'] || [];

    const rules = rawRules.map(r => {
      if (Array.isArray(r)) {
        return { name: r[0], keywords: r[1] || [r[0].toLowerCase()] };
      }
      return r;
    });

    const fileNames = this.state.files.map(f => f.targetName || f.name);
    const activeLinks = this.state.settings?.linkedRules || DEFAULT_LINKED_RULES;
    const evaluations = rules.map(rule => evaluateChecklistRule(fileNames, rule, activeLinks));

    const foundCount = evaluations.filter(e => e.status === 'green').length;
    const missingCount = evaluations.length - foundCount;
    const percentComplete = rules.length > 0 ? Math.round((foundCount / rules.length) * 100) : 0;
    const missingList = evaluations
      .map((e, idx) => (e.status !== 'green' ? rules[idx].name : null))
      .filter(Boolean);

    const batchResults = [{
      studentName: this.state.studentName || 'Student',
      folderName: this.state.folder?.name || 'Folder',
      summary: {
        evaluations: evaluations.map((ev, idx) => ({
          rule: rules[idx],
          status: ev.status,
          isLinked: ev.isLinked
        })),
        foundCount,
        missingCount,
        totalRequired: rules.length,
        percentComplete,
        isReady: missingCount === 0,
        missingList
      }
    }];

    const csvContent = generateBatchAuditCSV(batchResults, rules, checklistName);
    const filename = `DocMitra_Audit_${(this.state.studentName || 'Batch').replace(/\s+/g, '_')}.csv`;
    downloadCSV(filename, csvContent);
    toast.show('Audit Exported', `CSV report for ${rules.length} admission rules downloaded.`, 'success');
  }

  handleClearQueue(silent = false) {
    this.state.files = [];
    this.state.folder = null;
    this.state.subfolders = [];
    this.state.currentSubfolderIndex = 0;
    this.state.studentName = '';
    this.state.currentIndex = 0;
    this.state.activePdfDoc = null;
    this.state.activePdfUrl = null;
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    if (!silent) {
      toast.show('Workspace Cleared', 'Intake queue and preview have been reset.', 'info');
    }
  }

  renderCurrentPreview() {
    const previewCol = document.getElementById('col-preview');
    if (!previewCol) return;

    const currentFile = this.state.files[this.state.currentIndex];
    this.state.rotation = currentFile ? (currentFile.rotation || 0) : 0;
    const previewStageWrapper = previewCol.querySelector('.overflow-auto');
    if (!previewStageWrapper) return;

    while (previewStageWrapper.firstChild) {
      previewStageWrapper.removeChild(previewStageWrapper.firstChild);
    }

    if (!currentFile) {
      const emptyStage = document.createElement('div');
      emptyStage.id = 'previewContainerStage';
      emptyStage.className = 'h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col items-center justify-center text-center gap-4 relative select-none border border-outline-variant/30 shrink-0';

      const iconBox = document.createElement('div');
      iconBox.className = 'w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner';
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[36px]';
      icon.textContent = 'drive_file_rename_outline';
      iconBox.appendChild(icon);
      emptyStage.appendChild(iconBox);

      const textGroup = document.createElement('div');
      textGroup.className = 'flex flex-col gap-1 max-w-xs';
      const h3 = document.createElement('h3');
      h3.className = 'font-headline-sm text-[17px] font-bold text-on-surface';
      h3.textContent = 'No Document Loaded for Preview';
      textGroup.appendChild(h3);
      const p = document.createElement('p');
      p.className = 'text-body-sm text-secondary text-[12px] leading-relaxed';
      p.textContent = 'Select a student folder (F2) from the top-right toolbar to begin admission document renaming.';
      textGroup.appendChild(p);
      emptyStage.appendChild(textGroup);

      // Status telemetry strip (Minimalist blueprint status — NO duplicate buttons)
      const statusStrip = document.createElement('div');
      statusStrip.className = 'flex items-center gap-2 font-mono-code text-[11px] text-secondary opacity-60 mt-1 select-none';
      statusStrip.innerHTML = '<span>DPI: Standby</span><span>•</span><span>Buffer: Empty</span><span>•</span><span>Zero Zoom</span>';
      emptyStage.appendChild(statusStrip);

      previewStageWrapper.appendChild(emptyStage);
      return;
    }

    // Update target buffer telemetry
    const bufferEl = previewCol.querySelector('strong.text-tertiary, strong.text-error');
    if (bufferEl) {
      const sizeKb = (currentFile.size / 1024).toFixed(0);
      if (currentFile.size <= 256 * 1024) {
        bufferEl.className = 'text-tertiary font-bold';
        bufferEl.textContent = `${sizeKb} KB / 256 KB Safe`;
      } else {
        bufferEl.className = 'text-error font-bold';
        bufferEl.textContent = `${sizeKb} KB (>256 KB Safe Buffer)`;
      }
    }

    const isCurrentPdf = /\.pdf$/i.test(currentFile.name);
    if (!isCurrentPdf) {
      this.state.activePdfDoc = null;
      this.state.activePdfUrl = null;
      this.state.currentPdfPage = 1;
      this.state.totalPdfPages = 1;
      this._updatePdfPageIndicator();
    }

    if (this.state.splitCompare && this.state.files.length > 1) {
      const cmpIndex = this.state.currentIndex > 0 ? this.state.currentIndex - 1 : 1;
      const cmpFile = this.state.files[cmpIndex];

      const splitGrid = document.createElement('div');
      splitGrid.id = 'previewContainerStage';
      splitGrid.className = 'flex flex-row gap-space-md items-center justify-center h-full max-h-[calc(100vh-175px)]';

      const leftStage = this._createStageElement(cmpFile, `Compare: ${cmpFile.name}`);
      const rightStage = this._createStageElement(currentFile, `Active: ${currentFile.targetName || currentFile.name}`);

      splitGrid.appendChild(leftStage);
      splitGrid.appendChild(rightStage);
      previewStageWrapper.appendChild(splitGrid);
      this._applyPreviewTransform();
      return;
    }

    const stage = this._createStageElement(currentFile);
    previewStageWrapper.appendChild(stage);
    this._applyPreviewTransform();
  }

  _createStageElement(file, compareLabel = null) {
    const stage = document.createElement('div');
    if (!compareLabel) stage.id = 'previewContainerStage';
    stage.className = 'h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded shadow-2xl p-space-md flex flex-col justify-between relative overflow-hidden select-text border border-outline-variant/40 shrink-0';

    if (compareLabel) {
      const topBadge = document.createElement('div');
      topBadge.className = 'absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono-code text-[10px] font-bold shadow-xs';
      topBadge.textContent = compareLabel;
      stage.appendChild(topBadge);
    }

    const isImage = /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    if (isImage && file.url) {
      const img = document.createElement('img');
      img.src = file.url;
      img.alt = file.name;
      img.className = 'w-full h-full object-contain';
      stage.appendChild(img);
    } else if (isPdf && file.url) {
      const canvas = document.createElement('canvas');
      canvas.id = 'previewPdfCanvas';
      canvas.className = 'w-full h-full object-contain';
      stage.appendChild(canvas);

      const loadAndRenderPdf = async () => {
        try {
          if (!window.pdfjsLib) {
            this._loadPdfJs(() => loadAndRenderPdf());
            return;
          }
          if (!this.state.activePdfDoc || this.state.activePdfUrl !== file.url) {
            this.state.activePdfDoc = await window.pdfjsLib.getDocument(file.url).promise;
            this.state.activePdfUrl = file.url;
            this.state.totalPdfPages = this.state.activePdfDoc.numPages || 1;
            this.state.currentPdfPage = 1;
          }
          await this._renderPdfPage(this.state.currentPdfPage, canvas);
        } catch (err) {
          console.warn('PDF.js render error:', err);
          this._renderDocumentInfoFallback(stage, file);
        }
      };

      loadAndRenderPdf();
    } else {
      if (isPdf && !window.pdfjsLib) {
        this._loadPdfJs(() => this.renderCurrentPreview());
      }
      this._renderDocumentInfoFallback(stage, file);
    }

    return stage;
  }

  async _renderPdfPage(pageNumber, canvasEl = null) {
    if (!this.state.activePdfDoc) return;
    const canvas = canvasEl || document.getElementById('previewPdfCanvas');
    if (!canvas) return;

    try {
      const page = await this.state.activePdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const ctx = canvas.getContext('2d');
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      this.state.currentPdfPage = pageNumber;
      this._updatePdfPageIndicator();
    } catch (err) {
      console.warn(`Error rendering PDF page ${pageNumber}:`, err);
    }
  }

  _updatePdfPageIndicator() {
    const colPreview = document.getElementById('col-preview');
    if (!colPreview) return;
    const badge = colPreview.querySelector('#renamerPdfPageBadge');
    const btnPrev = colPreview.querySelector('#btnPdfPrevPage');
    const btnNext = colPreview.querySelector('#btnPdfNextPage');

    if (badge) {
      badge.textContent = this.state.totalPdfPages > 1
        ? `Page ${this.state.currentPdfPage} of ${this.state.totalPdfPages}`
        : 'Page 1 of 1';
      badge.style.cursor = this.state.totalPdfPages > 1 ? 'pointer' : 'default';
      badge.title = this.state.totalPdfPages > 1 ? 'Click to jump to page' : 'Single page document';
    }
    if (btnPrev) {
      btnPrev.disabled = (this.state.currentPdfPage <= 1);
    }
    if (btnNext) {
      btnNext.disabled = (this.state.currentPdfPage >= this.state.totalPdfPages || this.state.totalPdfPages <= 1);
    }
  }

  _loadPdfJs(callback) {
    if (window.pdfjsLib) {
      if (callback) callback();
      return;
    }
    if (this._pdfLoading) return;
    this._pdfLoading = true;
    const s = document.createElement('script');
    s.src = 'assets/js/libs/pdf.min.js';
    s.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/libs/pdf.worker.min.js';
        this._pdfLoading = false;
        if (callback) callback();
      }
    };
    document.head.appendChild(s);
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
