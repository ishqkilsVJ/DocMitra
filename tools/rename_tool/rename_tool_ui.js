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
  renameNativeFolder,
  rotateNativeFile,
  importNativeFile,
  moveNativeFile,
  openFolderInExplorer,
  isNativeAvailable
} from '../../shared/native-bridge.js';
import { rotateFilePhysicallyOnDisk } from './rotation_engine.js';
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
  DEFAULT_SHORTCUT_DICTIONARY,
  evaluateSmartOcrDocument,
  matchFilenameSmart,
  SMART_DOC_SIGNATURES,
  registerDocumentSignature,
  extractSignatureKeywords,
  extractCleanTokens,
  stringSimilarity,
  applyCase,
  computeWordDiff,
  formatPatternName,
  cleanScannerJunk,
  cleanPortalSafe,
  escapeHtml,
  computeOldNameErrorPercent,
  detectDuplicateFiles,
  generateSmartKeywords,
  updateCanonicalName,
  removeCanonicalName,
  syncCanonicalNames,
  updateDocumentPattern,
  removeDocumentPattern
} from './rename_tool_logic.js';
import { recordRenameEvent } from '../../src/services/analytics-service.js';
import { loadSettings, saveSettings, loadDocumentPresets, saveDocumentPresets } from '../../src/services/storage-service.js';
import {
  addOrUpdateFollowUp,
  getPendingFollowUp,
  getTodayDateString,
  getTomorrowDateString,
  getNextMondayDateString,
  formatFriendlyDate,
  computeImportTargetName
} from '../../src/services/followup-service.js';
import { MissingDocumentsModal } from './missing_documents_modal.js';

/**
 * Get Tauri invoke function across all Tauri v2 runtime variations
 */
export function getTauriInvoke() {
  if (typeof window !== 'undefined') {
    if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke;
    if (window.__TAURI_INTERNALS__?.invoke) return window.__TAURI_INTERNALS__.invoke;
    if (window.__TAURI__?.invoke) return window.__TAURI__.invoke;
  }
  return null;
}

/**
 * Universal file preview URL resolver
 * Handles blob URLs, Tauri convertFileSrc, dynamic origin localhost endpoints, and base64 fallbacks
 */
export function resolveFilePreviewUrl(f) {
  if (!f) return null;
  if (f._blobUrl) return f._blobUrl;
  if (typeof f.url === 'string' && (f.url.startsWith('blob:') || f.url.startsWith('data:'))) {
    return f.url;
  }
  if (f.fileObj && typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      f._blobUrl = URL.createObjectURL(f.fileObj);
      f.url = f._blobUrl;
      return f.url;
    } catch (_) { }
  }
  const rawPath = f.path || f.name || '';
  if (typeof window !== 'undefined') {
    const convertFn = window.__TAURI__?.core?.convertFileSrc ||
      window.__TAURI__?.tauri?.convertFileSrc ||
      window.__TAURI_INTERNALS__?.convertFileSrc;
    if (typeof convertFn === 'function' && rawPath && (rawPath.includes(':') || rawPath.startsWith('/'))) {
      const converted = convertFn(rawPath);
      if (converted) {
        f.url = converted;
        return converted;
      }
    }
  }
  if (rawPath) {
    let origin = 'http://localhost:3000';
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      const locOrigin = window.location.origin;
      if (!locOrigin.startsWith('file:') && !locOrigin.includes('tauri')) {
        origin = locOrigin;
      }
    }
    const serveUrl = `${origin}/api/serve-file?path=${encodeURIComponent(rawPath)}`;
    f.url = f.url || serveUrl;
    return serveUrl;
  }
  return f.url || null;
}

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
  if (['ADR', 'PAN', 'PIC', 'SIG', 'VOT', 'DL', 'UID', 'APR'].includes(c)) return 'bg-blue-600 text-white font-extrabold';
  if (['10M', '10P', '10MP', '11M', '12M', '12P', '12LC', '12MP', '1YM', '2YM', '3YM', '4YM', 'PYM', 'DPC', 'DEG', 'REG', 'INT', 'CHR', 'ATM', 'BNF', 'BRT'].includes(c)) return 'bg-emerald-700 text-white font-extrabold';
  if (['CST', 'VAL', 'NCL', 'VLD'].includes(c)) return 'bg-purple-700 text-white font-extrabold';
  if (['INC', 'DOM', 'NAT', 'BNK', 'RAT', 'EWS'].includes(c)) return 'bg-amber-600 text-white font-extrabold';
  if (['SDC', 'PDC', 'GAP', 'SLF', 'PAR', 'NHC', 'DIS', 'PWD', 'MED', 'GAZ', 'MIN', 'DTH', 'CETAF', 'CETSC', 'SRF', 'CAP', 'BON', 'FEE', 'ATT', 'HST'].includes(c)) return 'bg-slate-700 text-white font-extrabold';
  return 'bg-primary text-on-primary font-extrabold';
}

export const DEFAULT_SHORTCUTS = DEFAULT_SHORTCUT_DICTIONARY.map(item => ({
  code: item.primaryShortcut,
  codes: [item.primaryShortcut],
  label: item.outputName,
  canonical: item.outputName,
  keywords: Array.isArray(item.alternateKeywords) ? [...item.alternateKeywords] : []
}));

export const MASTER_DOCUMENTS_MAP = new Map(
  DEFAULT_SHORTCUTS.map(d => [d.code, d])
);

export const BUILTIN_PRESETS = {
  "MAHA DBT": [
    "PIC", "SIG", "ADR", "10M", "10P", "10MP", "12M", "12P", "12MP", "12LC",
    "PYM", "CST", "VAL", "NCL", "INC", "DOM", "NAT", "RAT", "BNK", "CAP",
    "BON", "FEE", "ATT", "HST", "GAP", "SDC", "PDC", "DTH"
  ].map(code => {
    const doc = MASTER_DOCUMENTS_MAP.get(code);
    return { name: doc.canonical, code: doc.code, keywords: [...doc.keywords] };
  }),
  "SWAYAM DEENDAYAL YOJANA": [
    "PIC", "SIG", "ADR", "10M", "10MP", "12M", "12MP", "12LC", "PYM", "CST",
    "VAL", "DOM", "INC", "BNK", "BON", "CAP", "ATT", "HST", "NHC", "SDC",
    "PDC", "DIS"
  ].map(code => {
    const doc = MASTER_DOCUMENTS_MAP.get(code);
    return { name: doc.canonical, code: doc.code, keywords: [...doc.keywords] };
  }),
  "CET CELL": [
    "PIC", "SIG", "ADR", "APR", "CETAF", "CETSC", "CAP", "SRF", "10M", "10P",
    "10MP", "12M", "12P", "12MP", "12LC", "DOM", "NAT", "CST", "VAL", "NCL",
    "EWS", "INC", "GAP", "MIG", "MED", "BRT"
  ].map(code => {
    const doc = MASTER_DOCUMENTS_MAP.get(code);
    return { name: doc.canonical, code: doc.code, keywords: [...doc.keywords] };
  }),
  "EDUCATIONAL DOCUMENTS": [
    "PIC", "SIG", "ADR", "10M", "10P", "10MP", "12M", "12P", "12MP", "12LC",
    "PYM", "CST", "VAL", "NCL", "INC", "DOM", "NAT", "RAT", "BNK", "CAP",
    "BON", "FEE", "ATT", "HST", "GAP", "SDC", "PDC", "DTH", "NHC", "DIS",
    "APR", "CETAF", "CETSC", "SRF", "EWS", "MIG", "MED", "BRT", "PAN", "VOT",
    "DL", "11M", "1YM", "2YM", "3YM", "4YM", "DPC", "DEG", "REG", "INT",
    "CHR", "GAZ", "MIN"
  ].map(code => {
    const doc = MASTER_DOCUMENTS_MAP.get(code);
    return { name: doc.canonical, code: doc.code, keywords: [...doc.keywords] };
  })
};

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
      activePreset: 'MAHA DBT',
      customShortcuts: [],
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
      isMissingDocsCollapsed: true,
      isMissingModalOpen: false
    };
    this._scanAbortController = null;
    this.missingModal = null;

    // Master Shortcuts & Rules List
    this.shortcuts21 = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    this._presetDocsSearchQuery = '';
    this._shortcutsSearchQuery = '';

    // Document Sorting & Safe Move History
    this._sortOrder = 'asc';
    this._recentMoves = [];
  }

  init() {
    this.state.settings = loadSettings();
    this.loadPresetsAndSettings();

    const savedCasing = localStorage.getItem('docmitra_casing_style');
    this.state.style = (savedCasing && ['upper', 'title', 'lower'].includes(savedCasing.toLowerCase()))
      ? savedCasing.toLowerCase()
      : 'upper';
    this._bindDOM();
    this._bindKeyboardShortcuts();
    this._startBackgroundWatcher();

    // Listen for external settings updates from Settings modal
    window.addEventListener('storage', (e) => {
      if (e.key === 'docmitra_settings' || e.key === 'docmitra_casing_style' || e.key === 'docmitra_active_preset') {
        this.state.settings = loadSettings();
        const sc = localStorage.getItem('docmitra_casing_style');
        this.state.style = (sc && ['upper', 'title', 'lower'].includes(sc.toLowerCase())) ? sc.toLowerCase() : 'upper';
        this.loadPresetsAndSettings();
        this._recalculateTargetNames(true);
        this.renderQueue();
        this.renderCurrentPreview();
      }
    });

    console.info('[DocMitra Renamer] Renamer UI manager initialized.');

    if (typeof window !== 'undefined' && (window.location.search.includes('test_mode=1') || window.__DOCMITRA_TEST_MODE__)) {
      this._initTestModeData();
    }
  }

  _initTestModeData() {
    console.info('[DocMitra Renamer] Test mode active (?test_mode=1). Loading mock dataset...');
    this.loadFolderData({
      name: 'Vijay_Ramesh_Yadav',
      path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav',
      files: [
        { name: '10th_marksheet.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/10th_marksheet.pdf', size: 154200, ext: '.pdf' },
        { name: 'aadhaar_card_front.jpg', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/aadhaar_card_front.jpg', size: 210000, ext: '.jpg' },
        { name: 'caste_certificate.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/caste_certificate.pdf', size: 180000, ext: '.pdf' },
        { name: '12th_hsc_marksheet.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/12th_hsc_marksheet.pdf', size: 165000, ext: '.pdf' },
        { name: 'domicile_certificate.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/domicile_certificate.pdf', size: 195000, ext: '.pdf' },
        { name: 'leaving_certificate_tc.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/leaving_certificate_tc.pdf', size: 140000, ext: '.pdf' },
        { name: 'unrecognized_scan_img_0099.pdf', path: 'E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/unrecognized_scan_img_0099.pdf', size: 98000, ext: '.pdf' }
      ]
    });
  }

  _bindDOM() {
    // 1. Select Folder button (F2)
    const btnSelect = document.getElementById('btnSelectFolder');
    if (btnSelect) {
      btnSelect.addEventListener('click', () => this.handleSelectFolder());
    }

    // Global Autofill Suppressor: completely disables Chromium/WebView2 "Saved Info" popups across all inputs
    document.addEventListener('focusin', (e) => {
      if (e.target && e.target.tagName === 'INPUT' && !['checkbox', 'radio', 'range'].includes(e.target.type)) {
        e.target.setAttribute('autocomplete', 'new-password');
        e.target.setAttribute('autocorrect', 'off');
        e.target.setAttribute('autocapitalize', 'off');
        e.target.setAttribute('spellcheck', 'false');
        e.target.setAttribute('data-form-type', 'other');
        e.target.setAttribute('data-lpignore', 'true');
      }
    }, true);

    // 2. Memory Persistent Checkbox for Folder/Student Name Inclusion
    const chkInclude = document.getElementById('chkIncludeFolderName');
    if (chkInclude) {
      const saved = localStorage.getItem('docmitra_include_folder_name');
      if (saved !== null) {
        chkInclude.checked = (saved === 'true');
      }
      chkInclude.addEventListener('change', () => {
        localStorage.setItem('docmitra_include_folder_name', String(chkInclude.checked));
        this._recalculateTargetNames(true);
        this.renderQueue();
        this.renderCurrentPreview();
        this.updateTelemetry();
        const statusMsg = chkInclude.checked ? 'Folder name included in files' : 'Folder name removed from files';
        toast.show('Filename Setting', statusMsg, 'info');
      });
    }

    // 3. In-Ribbon Folder Name Edit & Apply (Variant 3 Dark Slate)
    const btnEditFolder = document.getElementById('btnEditFolderName');
    const btnApplyFolder = document.getElementById('btnApplyFolderName');
    const displayFolder = document.getElementById('displayFolderName');
    const inputEditFolder = document.getElementById('inputEditFolderName');

    if (btnEditFolder && inputEditFolder && displayFolder) {
      btnEditFolder.addEventListener('click', () => {
        inputEditFolder.value = this.state.studentName || (this.state.folder?.name || '');
        inputEditFolder.setAttribute('autocomplete', 'new-password');
        inputEditFolder.setAttribute('autocorrect', 'off');
        inputEditFolder.setAttribute('autocapitalize', 'off');
        inputEditFolder.setAttribute('spellcheck', 'false');
        inputEditFolder.setAttribute('data-form-type', 'other');
        inputEditFolder.setAttribute('data-lpignore', 'true');
        displayFolder.classList.add('hidden');
        btnEditFolder.classList.add('hidden');
        inputEditFolder.classList.remove('hidden');
        if (btnApplyFolder) btnApplyFolder.classList.remove('hidden');
        inputEditFolder.focus();
        inputEditFolder.select();
      });

      const applyFolderEdit = async () => {
        const newName = inputEditFolder.value.trim();
        inputEditFolder.classList.add('hidden');
        if (btnApplyFolder) btnApplyFolder.classList.add('hidden');
        displayFolder.classList.remove('hidden');
        btnEditFolder.classList.remove('hidden');

        await this.applyFolderRename(newName);
      };

      if (btnApplyFolder) {
        btnApplyFolder.addEventListener('click', applyFolderEdit);
      }

      inputEditFolder.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyFolderEdit();
        } else if (e.key === 'Escape') {
          inputEditFolder.classList.add('hidden');
          if (btnApplyFolder) btnApplyFolder.classList.add('hidden');
          displayFolder.classList.remove('hidden');
          btnEditFolder.classList.remove('hidden');
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

    // Move to Duplicates Button (Del)
    const btnMoveDup = document.getElementById('btnMoveToDuplicates');
    if (btnMoveDup) {
      btnMoveDup.addEventListener('click', () => {
        const extraDups = this.getExtraDuplicateFiles();
        if (extraDups.length > 0) {
          this.handleMoveAllDuplicates();
        } else {
          this.handleMoveFileToDuplicates();
        }
      });
    }

    // Re-Scan Files (F5)
    const btnRescan = document.getElementById('btnRescanFiles');
    if (btnRescan) {
      btnRescan.addEventListener('click', () => this.handleRescanFiles());
    }

    // Sort Queue Button (A–Z / Z–A)
    const btnSortQueue = document.getElementById('btnSortQueue');
    if (btnSortQueue) {
      btnSortQueue.addEventListener('click', () => this.handleSortDocuments());
    }

    // Save Batch (Ctrl+S)
    const btnSave = document.getElementById('btnSaveBatch');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.handleSaveBatch());
    }

    // Smart Auto-Rename Buttons
    const btnSmartScan = document.getElementById('btnSmartScanBatch');
    if (btnSmartScan) {
      btnSmartScan.addEventListener('click', () => this.handleSmartScanBatch());
    }

    const btnRenameMatched = document.getElementById('btnRenameMatched');
    if (btnRenameMatched) {
      btnRenameMatched.addEventListener('click', () => this.openCrossCheckModal());
    }

    // Modal: Add Document to Preset Flow
    const btnCloseAddDoc = document.getElementById('btnCloseAddDocModal');
    if (btnCloseAddDoc) {
      btnCloseAddDoc.addEventListener('click', () => this.closeAddDocumentModal());
    }
    const btnCancelAddDoc = document.getElementById('btnCancelAddDoc');
    if (btnCancelAddDoc) {
      btnCancelAddDoc.addEventListener('click', () => this.closeAddDocumentModal());
    }
    const btnSaveAddDoc = document.getElementById('btnSaveAddDoc');
    if (btnSaveAddDoc) {
      btnSaveAddDoc.addEventListener('click', () => this.handleSaveDocumentType());
    }

    // Modal: Dedicated Rename Tool Settings
    const btnSettings = document.getElementById('btnRenameSettings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => this.handleOpenSettingsModal('presets'));
    }
    const btnCloseSettings = document.getElementById('btnCloseRenameSettings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => this.handleCloseSettingsModal());
    }
    const btnDoneSettings = document.getElementById('btnDoneRenameSettings');
    if (btnDoneSettings) {
      btnDoneSettings.addEventListener('click', () => this.handleCloseSettingsModal());
    }
    const tabBtnPresets = document.getElementById('tabBtnPresets');
    if (tabBtnPresets) {
      tabBtnPresets.addEventListener('click', () => this.renderSettingsModal('presets'));
    }
    const tabBtnShortcuts = document.getElementById('tabBtnShortcuts');
    if (tabBtnShortcuts) {
      tabBtnShortcuts.addEventListener('click', () => this.renderSettingsModal('shortcuts'));
    }
    const selectActivePreset = document.getElementById('selectActivePreset');
    if (selectActivePreset) {
      selectActivePreset.addEventListener('change', (e) => this.handleSwitchActivePreset(e.target.value));
    }
    const btnNewPreset = document.getElementById('btnNewPreset');
    if (btnNewPreset) {
      btnNewPreset.addEventListener('click', () => this.handleNewPreset());
    }
    const btnCopyPreset = document.getElementById('btnCopyPreset');
    if (btnCopyPreset) {
      btnCopyPreset.addEventListener('click', () => this.handleCopyPreset());
    }
    const btnRenamePreset = document.getElementById('btnRenamePreset');
    if (btnRenamePreset) {
      btnRenamePreset.addEventListener('click', () => this.handleRenamePreset());
    }
    const btnDeletePreset = document.getElementById('btnDeletePreset');
    if (btnDeletePreset) {
      btnDeletePreset.addEventListener('click', () => this.handleDeletePreset());
    }
    const btnResetPresets = document.getElementById('btnResetPresetsDefault');
    if (btnResetPresets) {
      btnResetPresets.addEventListener('click', () => this.handleResetPresetsDefault());
    }
    const btnAddDocToPreset = document.getElementById('btnAddDocToPreset');
    if (btnAddDocToPreset) {
      btnAddDocToPreset.addEventListener('click', () => this.openAddDocumentModal());
    }
    const btnAddNewShortcut = document.getElementById('btnAddNewShortcut');
    if (btnAddNewShortcut) {
      btnAddNewShortcut.addEventListener('click', () => this.openAddDocumentModal(null, true));
    }
    // Sample 1: Single Unified Top Action Button (+ Add Document / Shortcut)
    const btnAddDocOrShortcut = document.getElementById('btnAddDocOrShortcut');
    if (btnAddDocOrShortcut) {
      btnAddDocOrShortcut.addEventListener('click', () => {
        const isFromShortcuts = this.state.settingsActiveTab === 'shortcuts' || (document.getElementById('tabContentShortcuts') && !document.getElementById('tabContentShortcuts').classList.contains('hidden'));
        this.openAddDocumentModal(null, isFromShortcuts);
      });
    }

    // Keyboard shortcut Ctrl+N / Cmd+N for adding document/shortcut when Settings modal is open
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        const modalSettings = document.getElementById('modalRenameSettings');
        if (modalSettings && !modalSettings.classList.contains('hidden')) {
          e.preventDefault();
          const btnAdd = document.getElementById('btnAddDocOrShortcut') || document.getElementById('btnAddDocToPreset');
          if (btnAdd) btnAdd.click();
        }
      }
    });

    // Close any open keyword popovers when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.keyword-popover-container')) {
        document.querySelectorAll('.keyword-popover-card:not(.hidden)').forEach(p => p.classList.add('hidden'));
      }
    });

    const inputSearchPresetDocs = document.getElementById('inputSearchPresetDocs');
    if (inputSearchPresetDocs) {
      inputSearchPresetDocs.addEventListener('input', (e) => {
        this._presetDocsSearchQuery = e.target.value.trim().toLowerCase();
        this.renderPresetDocsTable();
      });
    }

    const inputSearchShortcuts = document.getElementById('inputSearchShortcuts');
    if (inputSearchShortcuts) {
      inputSearchShortcuts.addEventListener('input', (e) => {
        this._shortcutsSearchQuery = e.target.value.trim().toLowerCase();
        this.renderShortcutsTable();
      });
    }

    // Modal: Cross-Check Preview & Power Utilities Events
    this._initCrossCheckEvents();

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
          const newStyle = e.target.value;
          this.state.style = newStyle;
          localStorage.setItem('docmitra_casing_style', newStyle);
          updateCasingPillStyles();
          for (const f of this.state.files) {
            if (!f.isRenamed && !f.isKept) {
              f.userEditedName = applyCase(f.userEditedName || cleanName(f.name), newStyle);
            }
          }
          this._recalculateTargetNames();
          this.renderQueue();
          this.renderCurrentPreview();
          const pendingCount = this.state.files.filter(f => !f.isRenamed && !f.isKept).length;
          const styleName = newStyle.toUpperCase() === 'UPPER'
            ? 'UPPERCASE'
            : (newStyle.toUpperCase() === 'LOWER' ? 'LOWERCASE' : 'TITLE CASE');
          toast.show('Case Style Changed', `Applied ${styleName} to ${pendingCount} pending files`, 'info');
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

      // Escape: Dismiss active modal if open
      if (e.key === 'Escape') {
        if (this.missingModal && this.missingModal.isOpen) {
          e.preventDefault();
          this.missingModal.close();
          return;
        }
        const modalRenameSettings = document.getElementById('modalRenameSettings');
        if (modalRenameSettings && !modalRenameSettings.classList.contains('hidden')) {
          e.preventDefault();
          this.handleCloseSettingsModal();
          return;
        }
        const modalAddDoc = document.getElementById('modalAddDocument');
        if (modalAddDoc && !modalAddDoc.classList.contains('hidden')) {
          e.preventDefault();
          this.closeAddDocumentModal();
          return;
        }
        const modalCrossCheck = document.getElementById('modalCrossCheck');
        if (modalCrossCheck && !modalCrossCheck.classList.contains('hidden')) {
          e.preventDefault();
          this.closeCrossCheckModal();
          return;
        }
      }

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

      // F5: Re-Scan Files
      if (e.key === 'F5') {
        e.preventDefault();
        this.handleRescanFiles();
        return;
      }

      // Delete: Move duplicate documents (or active document) to "Duplicate Files" subfolder (Safe — never deleted)
      if (e.key === 'Delete') {
        if (e.target && e.target.tagName === 'INPUT' && e.target.id !== 'inputRenameTarget') {
          // Other text inputs keep normal Delete key
          return;
        }
        e.preventDefault();
        const extraDups = this.getExtraDuplicateFiles();
        if (extraDups.length > 0) {
          this.handleMoveAllDuplicates();
        } else {
          this.handleMoveFileToDuplicates();
        }
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
    const btnRotateCCW = colPreview.querySelector('#btnRotateCCW');
    const btnRotateCW = colPreview.querySelector('#btnRotateCW') || colPreview.querySelector('#btnRenamerRotatePreview');
    const btnRotateFlip = colPreview.querySelector('#btnRotateFlip');
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

    const handleMultiWayRotation = async (deltaDegrees, targetBtn) => {
      const currentFile = this.state.files[this.state.currentIndex];
      if (!currentFile) {
        this.state.rotation = ((this.state.rotation || 0) + deltaDegrees + 360) % 360;
        this._applyPreviewTransform();
        return;
      }

      const origContent = targetBtn ? targetBtn.innerHTML : null;
      if (targetBtn) {
        targetBtn.disabled = true;
        targetBtn.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">refresh</span>';
      }

      try {
        const sourceBytes = currentFile._pdfBytes || currentFile.bytes;
        const res = await rotateFilePhysicallyOnDisk({
          filePath: currentFile.path,
          ext: currentFile.ext || (currentFile.name ? currentFile.name.split('.').pop() : ''),
          bytes: sourceBytes,
          degrees: deltaDegrees
        });

        if (res.success && res.newBytes) {
          // CRITICAL: Update BOTH bytes and cached _pdfBytes so preview reloads rotated bytes!
          currentFile.bytes = res.newBytes;
          currentFile._pdfBytes = res.newBytes;
          currentFile._blobUrl = null;

          if (currentFile.url) {
            try { URL.revokeObjectURL(currentFile.url); } catch (_) {}
          }
          const cleanExt = (currentFile.ext || currentFile.name.split('.').pop() || '').toLowerCase();
          const mime = cleanExt.includes('pdf')
            ? 'application/pdf'
            : cleanExt.includes('png')
              ? 'image/png'
              : 'image/jpeg';
          currentFile.url = URL.createObjectURL(new Blob([res.newBytes], { type: mime }));
          currentFile._blobUrl = currentFile.url;
          currentFile.rotation = 0;
          this.state.rotation = 0;
          this._applyPreviewTransform();
          this.renderCurrentPreview();
          const signStr = deltaDegrees > 0 ? `+${deltaDegrees}` : `${deltaDegrees}`;
          toast.show('Document Rotated', `${currentFile.name} rotated ${signStr}° and saved to disk.`, 'success');
        } else {
          currentFile.rotation = ((currentFile.rotation || 0) + deltaDegrees + 360) % 360;
          this.state.rotation = currentFile.rotation;
          this._applyPreviewTransform();
          toast.show('Preview Rotated', res.error || 'Rotated in viewport.', 'info');
        }
      } catch (err) {
        console.error('[DocMitra Renamer] Rotation failed:', err);
        currentFile.rotation = ((currentFile.rotation || 0) + deltaDegrees + 360) % 360;
        this.state.rotation = currentFile.rotation;
        this._applyPreviewTransform();
      } finally {
        if (targetBtn && origContent) {
          targetBtn.disabled = false;
          targetBtn.innerHTML = origContent;
        }
      }
    };

    if (btnRotateCCW) {
      btnRotateCCW.addEventListener('click', () => handleMultiWayRotation(-90, btnRotateCCW));
    }
    if (btnRotateCW) {
      btnRotateCW.addEventListener('click', () => handleMultiWayRotation(90, btnRotateCW));
    }
    if (btnRotateFlip) {
      btnRotateFlip.addEventListener('click', () => handleMultiWayRotation(180, btnRotateFlip));
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
        const matchSmart = matchFilenameSmart(f.name, this.state.studentName, this.state.settings?.groups, this.getAllPresetDocuments());
        const docType = matchSmart.docType;
        const isMatched = matchSmart.confidence >= 50;

        let suggested = baseName;
        if (docType) {
          suggested = buildName(docType, this.state.studentName, this.state.settings?.groups, this.state.style);
        } else {
          suggested = buildName(baseName, this.state.studentName, null, this.state.style);
        }

        const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
        const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations, this.state.studentName);
        usedDestinations.add(uniqueName);

        // Check for exact match -> 100% confidence
        let effectiveConfidence = matchSmart.confidence;
        if (baseName.toUpperCase() === cleanName(suggested).toUpperCase()) {
          effectiveConfidence = 100;
        }

        return {
          id: `file_append_${Date.now()}_${i}`,
          name: f.name,
          path: f.path,
          size: f.size || 0,
          ext: extension,
          fileObj: f.fileObj || null,
          url: resolveFilePreviewUrl(f),
          docType: docType,
          smartDocType: docType,
          smartConfidence: effectiveConfidence,
          isMatched: isMatched,
          suggestedName: uniqueName,
          targetName: uniqueName,
          status: isMatched ? (effectiveConfidence >= 80 ? 'matched' : 'needs_review') : 'unmatched',
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

      // AUTOMATIC SMART SCAN ONLY: auto-start sequential scan on file addition
      if (mapped.length > 0) {
        this.handleSmartScanBatch();
      }
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

  getEffectiveStudentName() {
    const chk = document.getElementById('chkIncludeFolderName');
    if (chk && !chk.checked) {
      return '';
    }
    return this.state.studentName || '';
  }

  loadFolderData(data, preservedEdits = null) {
    const folderPath = data.path || '';
    const folderName = data.name || (folderPath ? folderPath.split(/[\\/]/).pop() : 'Selected Folder');

    let cleanFolderName = folderName
      .replace(/\.[a-zA-Z0-9]+$/i, '')
      .replace(/^(?:roll\s*no\.?|student|candidate|sr\.?\s*no\.?)\s*[\d\w]*[\s_\.\-]+/i, '')
      .replace(/^[0-9]+[_\.\s-]+/, '')
      .replace(/\s*[\(\[][^\)\]]*(?:final|new|copy|admission|cet|dbt|\d{4})[^\)\]]*[\)\]]/gi, '')
      .trim();

    let guessedStudent = cleanFolderName
      .replace(/\.[a-zA-Z0-9]+$/i, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (/^\d+$/.test(guessedStudent)) {
      guessedStudent = '';
    }

    this.state.folder = {
      name: folderName,
      path: folderPath,
      nativePath: folderPath
    };
    this.state.studentName = guessedStudent;

    const displayFolder = document.getElementById('displayFolderName');
    if (displayFolder) {
      displayFolder.textContent = cleanFolderName || 'Selected Folder';
      displayFolder.title = folderPath || cleanFolderName;
    }
    const inputEdit = document.getElementById('inputEditFolderName');
    if (inputEdit) {
      inputEdit.value = guessedStudent || cleanFolderName;
    }

    const filesRaw = (data.files || []).filter(f => !isJunkFile(f.name));
    const usedDestinations = new Set();
    const effStudent = this.getEffectiveStudentName();

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
          dateCreated: f.ctime || f.birthtime || f.dateCreated || f.lastModified || Date.now(),
          dateModified: f.lastModified || f.fileObj?.lastModified || f.dateModified || f.modified || Date.now(),
          ext: extension,
          fileObj: f.fileObj || null,
          url: resolveFilePreviewUrl(f),
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
      // Filename-based matching (50%+ threshold) & preview URL resolution
      const matchSmart = matchFilenameSmart(f.name, effStudent, this.state.settings?.groups, this.getAllPresetDocuments());
      const docType = matchSmart.docType;
      const isMatched = matchSmart.confidence >= 50;

      let suggested = baseName;
      if (docType) {
        suggested = buildName(docType, effStudent, this.state.settings?.groups, this.state.style);
      } else {
        suggested = buildName(baseName, effStudent, null, this.state.style);
      }

      const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
      const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations, effStudent);
      usedDestinations.add(uniqueName);

      // Check for exact match -> 100% confidence
      let effectiveConfidence = matchSmart.confidence;
      if (baseName.toUpperCase() === cleanName(suggested).toUpperCase()) {
        effectiveConfidence = 100;
      }

      return {
        id: `file_${idx}_${Date.now()}`,
        name: f.name,
        path: f.path || `${folderPath}/${f.name}`,
        size: f.size || 0,
        dateCreated: f.ctime || f.birthtime || f.dateCreated || f.lastModified || Date.now(),
        dateModified: f.lastModified || f.fileObj?.lastModified || f.dateModified || f.modified || Date.now(),
        ext: extension,
        fileObj: f.fileObj || null,
        url: resolveFilePreviewUrl(f),
        docType: docType,
        smartDocType: docType,
        smartConfidence: effectiveConfidence,
        isMatched: isMatched,
        suggestedName: uniqueName,
        targetName: uniqueName,
        status: isMatched ? (effectiveConfidence >= 80 ? 'matched' : 'needs_review') : 'unmatched',
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

    // AUTOMATIC SMART SCAN ONLY: auto-start sequential scan on folder load
    if (this.state.files.length > 0) {
      this.handleSmartScanBatch();
      this._computeDuplicateHashesAsync();
    }
  }

  async _computeDuplicateHashesAsync() {
    if (!this.state.files || this.state.files.length === 0) return;

    const sizeMap = new Map();
    this.state.files.forEach(f => {
      const s = Number(f.size) || 0;
      const e = (f.ext || ext(f.name) || '').toLowerCase();
      if (s > 0 && e) {
        const k = `${s}_${e}`;
        if (!sizeMap.has(k)) sizeMap.set(k, []);
        sizeMap.get(k).push(f);
      }
    });

    const candidates = [];
    sizeMap.forEach(group => {
      if (group.length >= 2) {
        group.forEach(f => {
          if (!f.sha256) candidates.push(f);
        });
      }
    });

    if (candidates.length === 0) return;

    const tauriInvoke = getTauriInvoke();

    let computedAny = false;
    for (const f of candidates) {
      try {
        let buffer = null;
        if (f.fileObj && typeof f.fileObj.arrayBuffer === 'function') {
          buffer = await f.fileObj.arrayBuffer();
        } else if (f.path && tauriInvoke) {
          const bytes = await tauriInvoke('read_binary_file', { path: f.path });
          if (bytes) buffer = new Uint8Array(bytes).buffer;
        }
        if (buffer && typeof crypto !== 'undefined' && crypto.subtle) {
          const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuf));
          f.sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          computedAny = true;
        }
      } catch (err) {
        // Graceful non-blocking failover
      }
    }

    if (computedAny) {
      this.renderQueue();
      const modal = document.getElementById('modalCrossCheck');
      if (modal && !modal.classList.contains('hidden')) {
        this._renderCrossCheckRows();
      }
    }
  }

  _recalculateTargetNames(reMatch = false) {
    const usedDestinations = new Set();
    for (const f of this.state.files) {
      if (f.isRenamed || f.isKept) {
        usedDestinations.add(f.targetName || f.name);
      }
    }
    const effStudent = this.getEffectiveStudentName();
    const presetDocs = this.getAllPresetDocuments();
    for (const f of this.state.files) {
      if (!f.isRenamed && !f.isKept) {
        if (reMatch || !f.isMatched) {
          const matchSmart = matchFilenameSmart(f.name, effStudent, this.state.settings?.groups, presetDocs);
          if (matchSmart.confidence >= 50) {
            f.docType = matchSmart.docType;
            f.smartDocType = matchSmart.docType;
            f.smartConfidence = matchSmart.confidence;
            f.isMatched = true;
            f.status = matchSmart.confidence >= 80 ? 'matched' : 'needs_review';
          }
        }
        if (f.docType) {
          f.docType = applyCase(f.docType, this.state.style);
          f.smartDocType = applyCase(f.smartDocType || f.docType, this.state.style);
        }
        if (f.hasUserEdited && f.userEditedName) {
          f.userEditedName = applyCase(f.userEditedName, this.state.style);
        }
        const docBase = f.docType || cleanName(f.name);
        const currentExt = f.ext || ('.' + f.name.split('.').pop()).toLowerCase();
        const newBase = f.hasUserEdited && f.userEditedName
          ? f.userEditedName
          : buildName(docBase, effStudent, this.state.settings?.groups, this.state.style);
        const desired = newBase.endsWith(currentExt) ? newBase : `${newBase}${currentExt}`;
        const unique = uniqueDestination(desired, f.name, usedDestinations, effStudent);
        usedDestinations.add(unique);
        f.targetName = unique;
        if (cleanName(f.name).toUpperCase() === cleanName(newBase).toUpperCase()) {
          f.smartConfidence = 100;
        }
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
      const span = smartMatchedBtn.querySelector('span:not(.material-symbols-outlined)');
      if (span) span.textContent = 'Bulk Rename';
      smartMatchedBtn.disabled = this.state.files.length === 0;
    }

    // Move to Duplicates Button Dynamic Counter & Appearance
    const btnMoveDup = document.getElementById('btnMoveToDuplicates');
    const moveDupLabel = document.getElementById('moveDuplicatesLabel');
    if (btnMoveDup) {
      const extraDups = this.getExtraDuplicateFiles();
      if (extraDups.length > 0) {
        if (moveDupLabel) moveDupLabel.textContent = `Move Duplicates (${extraDups.length})`;
        btnMoveDup.classList.add('bg-rose-950/80', 'hover:bg-rose-900', 'border-rose-700/80', 'text-rose-200');
        btnMoveDup.classList.remove('bg-slate-800', 'hover:bg-slate-700', 'border-slate-700', 'text-slate-200');
        btnMoveDup.title = `Safely move ${extraDups.length} extra duplicate copies to "Duplicate Files" (keeps 1 master copy) (Del)`;
      } else {
        if (moveDupLabel) moveDupLabel.textContent = 'Move to Duplicates (Del)';
        btnMoveDup.classList.remove('bg-rose-950/80', 'hover:bg-rose-900', 'border-rose-700/80', 'text-rose-200');
        btnMoveDup.classList.add('bg-slate-800', 'hover:bg-slate-700', 'border-slate-700', 'text-slate-200');
        btnMoveDup.title = `Move current document to "Duplicate Files" subfolder (Safe — never deleted) (Del)`;
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
      qTitle.textContent = 'ALL LOADED DOCUMENTS (0 / 0 Done)';
      qHeader.appendChild(qTitle);

      const qSlotCount = document.createElement('span');
      qSlotCount.className = 'text-secondary text-[11px] font-mono-code';
      qSlotCount.textContent = 'Standby';
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

      // Smart Confidence Badge on Active File (Clean header area with zero Matched/Unmatched pill clutter)
      const rightBadgeGroup = document.createElement('div');
      rightBadgeGroup.className = 'flex items-center gap-1.5';

      const liveBadge = document.createElement('span');
      liveBadge.id = 'activeFileLiveBadge';
      if (currentFile.status === 'needs_review') {
        liveBadge.className = 'confidence-badge confidence-badge-med';
        liveBadge.textContent = '🟡 Needs Review';
      } else if (currentFile.smartConfidence !== undefined && currentFile.smartConfidence >= 50) {
        if (currentFile.smartConfidence >= 80) {
          liveBadge.className = 'confidence-badge confidence-badge-high';
          liveBadge.textContent = `🟢 ${currentFile.smartConfidence}% ${currentFile.smartDocType || currentFile.docType || 'DOCUMENT'}`;
        } else {
          liveBadge.className = 'confidence-badge confidence-badge-med';
          liveBadge.textContent = `🟡 ${currentFile.smartConfidence}% ${currentFile.smartDocType || currentFile.docType || 'DOCUMENT'}`;
        }
      } else if (currentFile.isMatched && currentFile.docType) {
        liveBadge.className = 'confidence-badge confidence-badge-high';
        liveBadge.textContent = `🟢 Matched: ${currentFile.docType}`;
      } else {
        liveBadge.className = 'confidence-badge confidence-badge-low';
        liveBadge.textContent = '🔴 Unmatched';
      }
      rightBadgeGroup.appendChild(liveBadge);

      // Check for fuzzy difference error %
      const oldCleanActive = cleanName(currentFile.name);
      const targetCleanActive = cleanName(currentFile.targetName || currentFile.suggestedName || '');
      if (targetCleanActive && oldCleanActive.toLowerCase() !== targetCleanActive.toLowerCase()) {
        const sim = stringSimilarity(oldCleanActive, targetCleanActive);
        if (sim >= 0.40 && sim < 0.99) {
          const errPct = Math.round((1 - sim) * 100);
          const typoBadge = document.createElement('span');
          typoBadge.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';
          typoBadge.textContent = `~${errPct}% Typo/Diff`;
          rightBadgeGroup.appendChild(typoBadge);
        }
      }

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
        delete currentFile.userEditedName;
        currentFile.hasUserEdited = false;
        currentFile.targetName = currentFile.name;
        targetInput.value = cleanOriginal;
        this.updateTelemetry();
        this.renderCoreShortcuts('');
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
      tipSpan.appendChild(document.createTextNode(' to save & next'));
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

      // USER APPROVED SPEC: Show original or previously assigned filename in active casing
      const rawBase = currentFile.userEditedName !== undefined
        ? currentFile.userEditedName
        : (currentFile.targetName ? cleanName(currentFile.targetName) : cleanName(currentFile.name));
      const activeStyle = this.state.style || 'upper';
      targetInput.value = applyCase(rawBase, activeStyle);

      // Live keystroke filtering for illegal characters
      targetInput.addEventListener('keydown', (e) => {
        // Delete key inside target input: intercept and safe-move duplicates (or current file)
        if (e.key === 'Delete') {
          e.preventDefault();
          const extraDups = this.getExtraDuplicateFiles();
          if (extraDups.length > 0) {
            this.handleMoveAllDuplicates();
          } else {
            this.handleMoveFileToDuplicates(currentFile);
          }
          return;
        }

        // Ctrl+Enter: Instant disk rename for this single file
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.handleRenameSingleFile(currentFile);
          return;
        }

        // Tab key: confirm and advance
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          const typedVal = targetInput.value.trim();
          const shortcutMatch = this.resolveShortcut(typedVal);
          if (shortcutMatch) {
            const canonical = shortcutMatch.canonical || shortcutMatch.label;
            const effStudent = this.getEffectiveStudentName();
            const formulaBase = buildName(canonical, effStudent, this.state.settings?.groups, this.state.style);
            const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
            targetInput.value = cleanBase;
            this.handleConfirmCurrentName(cleanBase);
          } else {
            const targetToConfirm = typedVal || currentFile.targetName || currentFile.suggestedName || cleanName(currentFile.name);
            this.handleConfirmCurrentName(targetToConfirm);
          }
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
          const typedVal = targetInput.value.trim();
          const shortcutMatch = this.resolveShortcut(typedVal);
          if (shortcutMatch) {
            const canonical = shortcutMatch.canonical || shortcutMatch.label;
            const effStudent = this.getEffectiveStudentName();
            const formulaBase = buildName(canonical, effStudent, this.state.settings?.groups, this.state.style);
            const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
            targetInput.value = cleanBase;
            this.handleConfirmCurrentName(cleanBase);
          } else {
            const targetToConfirm = typedVal || currentFile.targetName || currentFile.suggestedName || cleanName(currentFile.name);
            this.handleConfirmCurrentName(targetToConfirm);
          }
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

        currentFile.hasUserEdited = true;
        currentFile.userEditedName = val;

        const currentExt = currentFile.ext || ext(currentFile.name);
        const trimmedVal = val.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
        const liveBadge = document.getElementById('activeFileLiveBadge');

        if (!trimmedVal) {
          currentFile.targetName = currentFile.name;
          currentFile.docType = null;
          currentFile.isMatched = false;
          if (liveBadge) {
            liveBadge.className = 'confidence-badge confidence-badge-low';
            liveBadge.textContent = '🔴 Unmatched';
          }
          this.updateTelemetry();
          this.renderCoreShortcuts('');
          return;
        }

        // Exact-Match or Compact Shortcut Rule (e.g. "PIC", "PHO", "PAN", "CAS")
        const compactVal = trimmedVal.replace(/\s+/g, '').toLowerCase();
        let exactShortcut = this.resolveShortcut(trimmedVal) || this.resolveShortcut(compactVal);

        if (!exactShortcut) {
          // Check by keywords
          for (const s of (this.shortcuts21 || [])) {
            const kws = Array.isArray(s.keywords) ? s.keywords : [];
            if (kws.some(k => k.toLowerCase() === trimmedVal.toLowerCase() || k.toLowerCase() === compactVal)) {
              exactShortcut = s;
              break;
            }
          }
        }

        if (!exactShortcut) {
          const allDocs = this.getAllPresetDocuments();
          const docMatch = allDocs.find(d =>
            (d.code && (d.code.toLowerCase() === trimmedVal.toLowerCase() || d.code.toLowerCase() === compactVal)) ||
            (Array.isArray(d.keywords) && d.keywords.some(k => k.toLowerCase() === trimmedVal.toLowerCase() || k.toLowerCase() === compactVal))
          );
          if (docMatch) {
            exactShortcut = { code: docMatch.code, codes: [docMatch.code], canonical: docMatch.name.toUpperCase(), label: docMatch.name };
          }
        }

        if (exactShortcut) {
          const canonical = exactShortcut.canonical || exactShortcut.label;
          currentFile.docType = canonical;
          currentFile.isMatched = true;
          if (liveBadge) {
            liveBadge.className = 'confidence-badge confidence-badge-high';
            liveBadge.textContent = `🟢 Matched: ${canonical}`;
          }

          const effStudent = this.getEffectiveStudentName();
          const formulaBase = buildName(canonical, effStudent, this.state.settings?.groups, this.state.style);
          const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
          currentFile.targetName = `${cleanBase}${currentExt}`;
        } else {
          // Custom name: preserve user's typed name and append student name with selected case
          currentFile.docType = trimmedVal;
          currentFile.isMatched = false;
          if (liveBadge) {
            liveBadge.className = 'confidence-badge confidence-badge-med';
            liveBadge.textContent = `✏️ Custom: ${trimmedVal}`;
          }

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

        // Live narrow shortcuts in Right-Side SMART SUGGESTIONS Panel
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

    // 2. UNIFIED FILES LIST (ONE list for all loaded files)
    const listWrapper = document.createElement('div');
    listWrapper.className = 'flex flex-col gap-1.5 pt-1.5 flex-1 min-h-0 select-none';

    const listHeader = document.createElement('div');
    listHeader.className = 'flex items-center justify-between px-2 py-1 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-mono-code text-secondary shrink-0';

    const leftPart = document.createElement('div');
    leftPart.className = 'flex items-center gap-1.5 text-primary font-semibold';
    const listIcon = document.createElement('span');
    listIcon.className = 'material-symbols-outlined text-[15px]';
    listIcon.textContent = 'format_list_bulleted';
    leftPart.appendChild(listIcon);
    leftPart.appendChild(document.createTextNode('ALL LOADED DOCUMENTS'));
    listHeader.appendChild(leftPart);

    const completedCount = this.state.files.filter(f => f.isRenamed).length;
    const rightPart = document.createElement('span');
    rightPart.className = 'text-[10px] text-secondary font-medium';
    rightPart.textContent = `${completedCount} / ${this.state.files.length} Done`;
    listHeader.appendChild(rightPart);

    listWrapper.appendChild(listHeader);

    const filesContainer = document.createElement('div');
    filesContainer.className = 'flex flex-col gap-1 overflow-y-auto pr-0.5 custom-pan-scroll flex-1';

    const dupMap = detectDuplicateFiles(this.state.files);

    this.state.files.forEach((f, fIdx) => {
      const isActive = (fIdx === this.state.currentIndex);
      const isDone = !!f.isRenamed;

      const item = document.createElement('article');
      item.dataset.index = String(fIdx);
      item.className = isActive
        ? 'h-8 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/50 ring-1 ring-primary/30 shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer shrink-0 font-semibold active-queue-item'
        : (isDone
          ? 'h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-emerald-500/30 shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors cursor-pointer shrink-0 text-secondary'
          : 'h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer shrink-0');

      item.title = `Original: ${cleanName(f.name)}\nTarget: ${cleanName(f.targetName || f.name)} (Click to jump & edit)`;

      // Click to jump and edit (works for both completed and upcoming)
      item.addEventListener('click', () => {
        this.state.currentIndex = fIdx;
        this.renderQueue();
        this.renderCurrentPreview();
      });

      const leftCol = document.createElement('div');
      leftCol.className = 'flex items-center gap-1.5 min-w-0 flex-1';

      // Compact number badge with ✓ symbol on completed files
      const numBadge = document.createElement('span');
      numBadge.className = isDone
        ? 'w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700'
        : (isActive
          ? 'w-4 h-4 rounded bg-primary text-on-primary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs'
          : 'w-4 h-4 rounded bg-surface-container text-secondary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0');
      numBadge.textContent = String(fIdx + 1);
      leftCol.appendChild(numBadge);

      // Clean filename (single line, no extension in UI) - shows actual new renamed name or pending target name
      const origTitle = document.createElement('span');
      origTitle.className = isActive
        ? 'font-mono-code text-[11px] text-primary font-bold truncate flex-1 min-w-0'
        : (isDone
          ? 'font-mono-code text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex-1 min-w-0'
          : 'font-mono-code text-[11px] text-on-surface font-medium truncate flex-1 min-w-0');
      origTitle.textContent = cleanName(isDone ? f.name : (f.hasUserEdited && f.targetName ? f.targetName : applyCase(cleanName(f.name), this.state.style)));
      leftCol.appendChild(origTitle);

      item.appendChild(leftCol);

      // Compact Badge (~5-7 characters: score + short code)
      const shortCode = this.getShortCodeForDoc(f.smartDocType || f.docType);
      const conf = f.smartConfidence !== undefined ? f.smartConfidence : (f.isMatched ? 90 : 0);

      // Multi-Layer Duplicate Badge (Priority 1: 50% Dup, Priority 2: Duplicate)
      const dupInfo = dupMap.get(f.id || f.name);
      const dupStatus = dupInfo ? dupInfo.status : null;
      if (dupStatus === 'confirmed') {
        const dupBadge = document.createElement('span');
        dupBadge.className = 'confidence-badge badge-dup-confirmed shrink-0 text-[10px] px-1.5 py-0.5 select-none';
        dupBadge.textContent = 'Duplicate';
        dupBadge.title = 'Confirmed Duplicate (100% Identical or Copy Suffix Collision)';
        item.appendChild(dupBadge);
      } else if (dupStatus === 'probable') {
        const probBadge = document.createElement('span');
        probBadge.className = 'confidence-badge badge-dup-probable shrink-0 text-[10px] px-1.5 py-0.5 select-none';
        probBadge.textContent = '50% Dup';
        probBadge.title = 'Probable Duplicate (Exact same byte size & file extension)';
        item.appendChild(probBadge);
      }

      if (f.isScanning) {
        const scanBadge = document.createElement('span');
        scanBadge.className = 'confidence-badge bg-primary/20 text-primary flex items-center gap-1 font-bold shrink-0 text-[10px] px-1.5 py-0.5';
        const scanSpin = document.createElement('span');
        scanSpin.className = 'material-symbols-outlined text-[11px] animate-spin';
        scanSpin.textContent = 'sync';
        scanBadge.appendChild(scanSpin);
        scanBadge.appendChild(document.createTextNode('SCANNING'));
        item.appendChild(scanBadge);
      } else if (isDone) {
        const doneBadge = document.createElement('span');
        doneBadge.className = 'confidence-badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0 text-[10px] px-1.5 py-0.5';
        doneBadge.textContent = '✓';
        item.appendChild(doneBadge);
      } else if (conf >= 30) {
        const confBadge = document.createElement('span');
        if (conf >= 80) {
          confBadge.className = 'confidence-badge confidence-badge-high shrink-0 text-[10px] px-1.5 py-0.5';
          confBadge.textContent = `🟢 ${conf}%`;
        } else {
          confBadge.className = 'confidence-badge confidence-badge-med shrink-0 text-[10px] px-1.5 py-0.5';
          confBadge.textContent = `🟡 ${conf}%`;
        }
        item.appendChild(confBadge);
      } else {
        const unmatchBadge = document.createElement('span');
        unmatchBadge.className = 'confidence-badge confidence-badge-low shrink-0 text-[10px] px-1.5 py-0.5';
        unmatchBadge.textContent = '🔴 UNMATCH';
        item.appendChild(unmatchBadge);
      }

      // Safe Move action button (Hover to move to Duplicate Files)
      const btnRowMove = document.createElement('button');
      btnRowMove.type = 'button';
      btnRowMove.title = 'Move to "Duplicate Files" subfolder (Del)';
      btnRowMove.className = 'w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer';
      btnRowMove.innerHTML = '<span class="material-symbols-outlined text-[13px]">drive_file_move</span>';
      btnRowMove.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleMoveFileToDuplicates(f);
      });
      item.classList.add('group');
      item.appendChild(btnRowMove);

      filesContainer.appendChild(item);
    });

    listWrapper.appendChild(filesContainer);
    scrollContainer.appendChild(listWrapper);

    // Auto-scroll active row smoothly into view
    requestAnimationFrame(() => {
      const activeItem = filesContainer.querySelector('.active-queue-item');
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    queueCol.appendChild(scrollContainer);

    // Populate Column 3 Utility Panel (Missing Documents + Top 5 Shortcuts)
    const utilityScroll = document.getElementById('utilityScrollArea');
    if (utilityScroll) {
      this.renderUtilityPanel(utilityScroll);
    }
  }

  /**
   * Column 3 (Right Utility Panel): Scheme Preset Selector + 2 Summary Cards (Completed & Missing) + ↗ Document Desk Button + Top Core Shortcuts Card (Sample 1 Bento Master)
   */
  renderUtilityPanel(container) {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (this.state.files.length === 0) {
      // Standby / Empty State when no folder loaded
      const emptyTopCard = document.createElement('div');
      emptyTopCard.className = 'flex flex-col gap-2 shrink-0 select-none';

      // Scheme Selector (Standby)
      const schemeBox = document.createElement('div');
      schemeBox.className = 'flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm';
      schemeBox.innerHTML = `
        <span class="font-mono-code text-[10px] text-slate-400 uppercase font-bold tracking-wider shrink-0">SCHEME:</span>
        <span class="font-mono-code text-[12px] font-bold text-white flex items-center gap-1">
          ${escapeHtml(this.state.activePreset || 'MAHA DBT')}
          <span class="material-symbols-outlined text-[14px] text-blue-400">expand_more</span>
        </span>
      `;
      emptyTopCard.appendChild(schemeBox);

      // 2 Cards (Standby)
      const cardsGrid = document.createElement('div');
      cardsGrid.className = 'grid grid-cols-2 gap-2';
      cardsGrid.innerHTML = `
        <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2.5 shadow-2xs flex items-center gap-2 opacity-60">
          <div class="w-7 h-7 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold shrink-0">
            <span class="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div class="min-w-0">
            <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Completed</span>
            <span class="font-mono-code text-[12px] font-bold text-secondary block leading-tight truncate">0 Docs</span>
          </div>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2.5 shadow-2xs flex items-center gap-2 opacity-60">
          <div class="w-7 h-7 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold shrink-0">
            <span class="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
          <div class="min-w-0">
            <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Missing</span>
            <span class="font-mono-code text-[12px] font-bold text-secondary block leading-tight truncate">-- Docs</span>
          </div>
        </div>
      `;
      emptyTopCard.appendChild(cardsGrid);

      // Button: Document Desk (Standby)
      const btnStandbyDesk = document.createElement('button');
      btnStandbyDesk.type = 'button';
      btnStandbyDesk.id = 'btnOpenMissingDeskModal';
      btnStandbyDesk.className = 'w-full py-2 px-3 rounded-lg bg-slate-900 text-slate-400 font-mono-code text-[11px] font-bold border border-slate-700 shadow-sm flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50 shrink-0';
      btnStandbyDesk.disabled = true;
      btnStandbyDesk.innerHTML = `
        <span class="material-symbols-outlined text-[15px]">open_in_new</span>
        <span>↗ Document Desk</span>
      `;
      emptyTopCard.appendChild(btnStandbyDesk);
      container.appendChild(emptyTopCard);

      // Skeleton note
      const standbyNote = document.createElement('div');
      standbyNote.className = 'p-2.5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/60 text-[11px] text-secondary/70 italic text-center select-none';
      standbyNote.textContent = 'Select an intake folder (F2) to verify missing documents.';
      container.appendChild(standbyNote);
      return;
    }

    // 1. DYNAMIC PRESET AUDIT (ACTIVE FOLDER LOADED)
    const activeRules = this.getActivePresetDocuments();
    const presentDocs = new Set(
      this.state.files.map(f => (f.docType || '').toUpperCase()).filter(Boolean)
    );

    const missingRules = activeRules.filter((rule) => {
      const cleanRule = (rule.name || rule).toUpperCase();
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

    const presentCount = this.state.files.length;
    const missingCount = missingRules.length;

    // TOP STATUS CONTAINER (Sample 1: Bento Master)
    const topStatusSection = document.createElement('div');
    topStatusSection.className = 'flex flex-col gap-2 shrink-0 select-none';

    // 1.1 Custom Bento PRESET Dropdown (Replacing native <select>)
    const presetCard = document.createElement('div');
    presetCard.id = 'customPresetCard';
    presetCard.className = 'group relative flex items-center justify-between bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/80 rounded-xl px-3 h-[38px] shadow-2xs hover:shadow-[0_0_15px_rgba(0,55,176,0.18)] transition-all duration-200 cursor-pointer select-none';
    presetCard.title = 'Click to switch active document preset';

    // Left content: dot + PRESET: + active name
    const leftContent = document.createElement('div');
    leftContent.className = 'flex items-center gap-1.5 min-w-0 flex-1 mr-2';

    const dot = document.createElement('span');
    dot.className = 'w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_rgba(0,55,176,0.4)]';
    leftContent.appendChild(dot);

    const presetLabel = document.createElement('span');
    presetLabel.className = 'font-mono-code text-[10px] text-secondary group-hover:text-primary uppercase font-bold tracking-wider shrink-0 transition-colors';
    presetLabel.textContent = 'PRESET:';
    leftContent.appendChild(presetLabel);

    const activeName = document.createElement('span');
    activeName.id = 'customPresetActiveName';
    activeName.className = 'font-mono-code text-[12px] font-bold text-on-surface truncate text-left tracking-wide flex-1';
    activeName.textContent = this.state.activePreset || 'MAHA DBT';
    leftContent.appendChild(activeName);
    presetCard.appendChild(leftContent);

    // Right content: chevron
    const chevron = document.createElement('span');
    chevron.id = 'customPresetChevron';
    chevron.className = 'material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-transform duration-200 shrink-0';
    chevron.textContent = 'expand_more';
    presetCard.appendChild(chevron);

    // Hidden native select for backwards compatibility / tests
    const hiddenSelect = document.createElement('select');
    hiddenSelect.id = 'selectQuickPreset';
    hiddenSelect.className = 'hidden';
    presetCard.appendChild(hiddenSelect);

    // Floating elevated menu (z-9999)
    const floatingMenu = document.createElement('div');
    floatingMenu.id = 'customPresetMenu';
    floatingMenu.className = 'hidden absolute top-[calc(100%+6px)] left-0 w-full min-w-[240px] bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl z-[9999] py-1.5 overflow-hidden backdrop-blur-md transition-all duration-150';

    const rawPresets = this.state.documentPresets ? Object.keys(this.state.documentPresets) : ['MAHA DBT', 'SWAYAM DEENDAYAL YOJANA', 'CET CELL', 'EDUCATIONAL DOCUMENTS'];
    const availablePresets = Array.from(new Set([...rawPresets, 'MAHA DBT', 'SWAYAM DEENDAYAL YOJANA', 'CET CELL', 'EDUCATIONAL DOCUMENTS']));

    const renderMenuItems = () => {
      floatingMenu.innerHTML = '';
      hiddenSelect.innerHTML = '';

      availablePresets.forEach(presetName => {
        const opt = document.createElement('option');
        opt.value = presetName;
        opt.textContent = presetName;
        if (presetName === (this.state.activePreset || 'MAHA DBT')) opt.selected = true;
        hiddenSelect.appendChild(opt);

        const item = document.createElement('div');
        const isActive = presetName === (this.state.activePreset || 'MAHA DBT');
        item.className = `flex items-center justify-between px-3 py-2 text-[12px] font-mono-code font-semibold cursor-pointer transition-colors rounded-lg mx-1 ${
          isActive
            ? 'bg-primary/10 text-primary font-bold'
            : 'text-on-surface hover:bg-surface-container-high/60 hover:text-primary'
        }`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'truncate mr-2';
        nameSpan.textContent = presetName;
        item.appendChild(nameSpan);

        if (isActive) {
          const checkIcon = document.createElement('span');
          checkIcon.className = 'material-symbols-outlined text-[16px] text-primary shrink-0';
          checkIcon.textContent = 'check';
          item.appendChild(checkIcon);
        }

        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          this.handleSwitchActivePreset(presetName);
          activeName.textContent = presetName;
          hiddenSelect.value = presetName;
          hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
          floatingMenu.classList.add('hidden');
          chevron.classList.remove('rotate-180');
          renderMenuItems();
          if (this.state.isMissingModalOpen) {
            this.updateMissingModal();
          }
        });

        floatingMenu.appendChild(item);
      });
    };

    renderMenuItems();

    presetCard.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isHidden = floatingMenu.classList.contains('hidden');
      if (isHidden) {
        document.querySelectorAll('#customPresetMenu:not(.hidden)').forEach(m => m.classList.add('hidden'));
        floatingMenu.classList.remove('hidden');
        chevron.classList.add('rotate-180');
      } else {
        floatingMenu.classList.add('hidden');
        chevron.classList.remove('rotate-180');
      }
    });

    const handleOutsideClick = (ev) => {
      if (!presetCard.contains(ev.target)) {
        floatingMenu.classList.add('hidden');
        chevron.classList.remove('rotate-180');
      }
    };
    document.addEventListener('click', handleOutsideClick);

    presetCard.appendChild(floatingMenu);
    topStatusSection.appendChild(presetCard);

    // 1.2 Two Side-by-Side Summary Cards (Exact Sample 1 / Modal Style)
    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'grid grid-cols-2 gap-2';

    // Left Card: COMPLETED (Emerald)
    const completedCard = document.createElement('div');
    completedCard.className = 'bg-surface-container-lowest border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 shadow-2xs flex items-center gap-2';
    completedCard.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
        <span class="material-symbols-outlined text-[18px]">verified</span>
      </div>
      <div class="min-w-0">
        <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Completed</span>
        <span class="font-mono-code text-[12px] font-bold text-emerald-800 dark:text-emerald-400 block leading-tight truncate">${presentCount} Docs</span>
      </div>
    `;
    cardsGrid.appendChild(completedCard);

    // Right Card: MISSING (Soft Red / Rose)
    const missingCard = document.createElement('div');
    missingCard.className = 'bg-surface-container-lowest border border-rose-300 dark:border-rose-700 rounded-xl p-2.5 shadow-2xs flex items-center gap-2';
    missingCard.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
        <span class="material-symbols-outlined text-[18px]">pending_actions</span>
      </div>
      <div class="min-w-0">
        <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Missing</span>
        <span class="font-mono-code text-[12px] font-bold text-rose-700 dark:text-rose-400 block leading-tight truncate">${missingCount} Docs</span>
      </div>
    `;
    cardsGrid.appendChild(missingCard);
    topStatusSection.appendChild(cardsGrid);

    // 1.3 Compact Action Button: ↗ Document Desk (Black Mode + Subtle Blink/Pulse)
    const btnOpenDesk = document.createElement('button');
    btnOpenDesk.type = 'button';
    btnOpenDesk.id = 'btnOpenMissingDeskModal';
    btnOpenDesk.className = 'w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-mono-code text-[11px] font-bold border border-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0';
    btnOpenDesk.title = 'Open Document Desk Modal (Missing docs, follow-up dates & import)';

    // Subtle Live Blink / Pulse Dot when missing documents exist
    const pulseDot = missingCount > 0 ? `
      <span class="relative flex h-2 w-2 mr-0.5 shrink-0" title="${missingCount} missing documents need attention">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
    ` : '';

    btnOpenDesk.innerHTML = `
      <span class="material-symbols-outlined text-[15px]">open_in_new</span>
      <span>↗ Document Desk</span>
      ${pulseDot}
    `;

    btnOpenDesk.onclick = (e) => {
      e.stopPropagation();
      this.openMissingDocumentsModal();
    };
    topStatusSection.appendChild(btnOpenDesk);
    container.appendChild(topStatusSection);

    // 2. SMART SUGGESTIONS CONTAINER (Always visible below, 100% UNTOUCHED)
    const shortcutsSection = document.createElement('div');
    shortcutsSection.id = 'coreShortcutsContainer';
    shortcutsSection.className = 'flex flex-col gap-1.5 shrink-0 mt-2 bg-surface-container-lowest/80 p-2.5 rounded-xl border border-outline-variant/30 shadow-xs';
    container.appendChild(shortcutsSection);

    const inputVal = document.getElementById('inputRenameTarget')?.value || '';
    this.renderCoreShortcuts(inputVal);
  }

  /**
   * Dynamically filters and renders SMART SUGGESTIONS in Column 3 based on Rename box typing
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
    const isUntouched = (!currentFile?.hasUserEdited) && (q.toLowerCase() === baseOriginal.toLowerCase());
    if (isUntouched) q = '';

    // Build unified suggestion pool across ALL presets and ALL shortcuts
    const allDocs = this.getAllPresetDocuments();
    const pool = [];
    const poolCodes = new Set();

    for (const sc of (this.shortcuts21 || [])) {
      const canonicalName = sc.canonical || sc.label;
      const codes = Array.isArray(sc.codes) && sc.codes.length > 0 ? sc.codes : (sc.code ? [sc.code] : []);
      for (const codeStr of codes) {
        const cUpper = (codeStr || '').toUpperCase();
        if (cUpper && !poolCodes.has(cUpper)) {
          pool.push({
            code: cUpper,
            codes: codes,
            label: canonicalName,
            canonical: canonicalName,
            keywords: sc.keywords
          });
          poolCodes.add(cUpper);
        }
      }
    }
    for (const doc of allDocs) {
      const code = (doc.code || '').toUpperCase();
      if (code && !poolCodes.has(code)) {
        pool.push({
          code,
          codes: [code],
          label: doc.name,
          canonical: doc.name.toUpperCase(),
          keywords: doc.keywords
        });
        poolCodes.add(code);
      }
    }

    let itemsToRender = [];
    let isFiltered = false;
    let zeroMatches = false;

    if (!q) {
      // Prioritize top missing documents from active preset, then default shortcuts
      const activeRules = this.getActivePresetDocuments();
      const presentDocs = new Set(
        this.state.files.map(f => (f.docType || '').toUpperCase()).filter(Boolean)
      );
      const missingRules = activeRules.filter(r => !presentDocs.has(r.name.toUpperCase()));
      const topMissingItems = [];
      for (const m of missingRules) {
        const found = pool.find(s => s.canonical === m.name.toUpperCase() || s.code === m.code);
        if (found && !topMissingItems.some(x => x.code === found.code)) {
          topMissingItems.push(found);
          if (topMissingItems.length >= 5) break;
        }
      }

      for (const s of pool) {
        if (topMissingItems.length >= 5) break;
        if (!topMissingItems.some(x => x.code === s.code)) {
          topMissingItems.push(s);
        }
      }
      itemsToRender = topMissingItems.slice(0, 5);
      isFiltered = false;
    } else {
      isFiltered = true;
      const lowerQ = q.toLowerCase();
      // Match exact code > startsWith code > keywords > label/canonical
      const exactCodeMatches = pool.filter(s => s.code.toLowerCase() === lowerQ);
      const prefixCodeMatches = pool.filter(s => s.code.toLowerCase().startsWith(lowerQ) && s.code.toLowerCase() !== lowerQ);
      const keywordMatches = pool.filter(s => {
        if (s.code.toLowerCase().startsWith(lowerQ)) return false;
        const kws = Array.isArray(s.keywords) ? s.keywords : [];
        return kws.some(k => k.toLowerCase().includes(lowerQ));
      });
      const textMatches = pool.filter(s => {
        if (s.code.toLowerCase().startsWith(lowerQ)) return false;
        const kws = Array.isArray(s.keywords) ? s.keywords : [];
        if (kws.some(k => k.toLowerCase().includes(lowerQ))) return false;
        return (s.label || '').toLowerCase().includes(lowerQ) || (s.canonical || '').toLowerCase().includes(lowerQ);
      });

      const combined = [...exactCodeMatches, ...prefixCodeMatches, ...keywordMatches, ...textMatches];
      // Deduplicate by code
      const seen = new Set();
      const uniqueResults = [];
      for (const item of combined) {
        if (!seen.has(item.code)) {
          seen.add(item.code);
          uniqueResults.push(item);
        }
      }

      if (uniqueResults.length > 0) {
        itemsToRender = uniqueResults.slice(0, 5);
        zeroMatches = false;
      } else {
        itemsToRender = pool.slice(0, 5);
        zeroMatches = true;
      }
    }

    // Render suggestions chips
    itemsToRender.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer shadow-xs group';
      chip.title = `Click or type ${item.code} to rename`;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2 min-w-0 flex-1';

      const style = this.state.style || 'upper';
      const displayCode = style === 'lower'
        ? item.code.toLowerCase()
        : (style === 'title'
          ? (item.code.length <= 4 && /\d/.test(item.code) ? item.code.toUpperCase() : applyCase(item.code, 'title'))
          : item.code.toUpperCase());
      const displayLabel = applyCase(item.label || item.canonical, style);

      const codeBadge = document.createElement('span');
      codeBadge.className = `px-2 py-0.5 rounded font-mono-code font-bold text-[11px] shrink-0 ${getShortcutBadgeColor(item.code)}`;
      codeBadge.textContent = displayCode;
      left.appendChild(codeBadge);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'text-[12px] font-semibold text-on-surface truncate flex-1';
      labelSpan.textContent = displayLabel;
      left.appendChild(labelSpan);

      chip.appendChild(left);

      const rightIcon = document.createElement('span');
      rightIcon.className = 'material-symbols-outlined text-[16px] text-secondary group-hover:text-primary transition-colors shrink-0';
      rightIcon.textContent = 'arrow_forward';
      chip.appendChild(rightIcon);

      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.applyShortcutToCurrentFile(item.code);
      });

      scContainer.appendChild(chip);
    });

    if (zeroMatches) {
      const noMatchMsg = document.createElement('div');
      noMatchMsg.className = 'text-[11px] text-secondary italic px-1 pt-1';
      noMatchMsg.textContent = `No shortcode matches — saving as custom text (Showing top suggestions for "${q}")`;
      scContainer.prepend(noMatchMsg);
    }
  }

  resolveShortcut(shortcutCode) {
    if (!shortcutCode) return null;
    const cleanCode = String(shortcutCode).trim().toUpperCase();
    if (!cleanCode) return null;

    // 1. Check shortcuts21
    for (const s of (this.shortcuts21 || [])) {
      if (s.code && s.code.toUpperCase() === cleanCode) return s;
      if (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === cleanCode)) return s;
    }

    // 2. Check custom shortcuts
    for (const s of (this.state.customShortcuts || [])) {
      if (s.code && s.code.toUpperCase() === cleanCode) return s;
      if (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === cleanCode)) return s;
    }

    // 3. Check preset documents
    const allDocs = this.getAllPresetDocuments();
    for (const d of allDocs) {
      if (d.code && d.code.toUpperCase() === cleanCode) {
        return {
          code: d.code,
          codes: [d.code],
          canonical: d.name.toUpperCase(),
          label: d.name,
          keywords: d.keywords
        };
      }
    }

    // 4. Check DEFAULT_SHORTCUT_DICTIONARY
    for (const item of (DEFAULT_SHORTCUT_DICTIONARY || [])) {
      if (item.primaryShortcut && item.primaryShortcut.toUpperCase() === cleanCode) {
        return {
          code: item.primaryShortcut,
          codes: [item.primaryShortcut],
          canonical: item.outputName,
          label: item.outputName,
          keywords: item.alternateKeywords
        };
      }
    }

    return null;
  }

  applyShortcutToCurrentFile(shortcutCode) {
    const currentFile = this.state.files[this.state.currentIndex];
    if (!currentFile) return;

    const match = this.resolveShortcut(shortcutCode);
    const canonical = match ? (match.canonical || match.outputName || match.label || match.name).toUpperCase() : shortcutCode.toUpperCase();
    const currentExt = currentFile.ext || ('.' + currentFile.name.split('.').pop()).toLowerCase();
    const effStudent = this.getEffectiveStudentName();
    const formulaBase = buildName(canonical, effStudent, this.state.settings?.groups, this.state.style);
    const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
    const finalTarget = `${cleanBase}${currentExt}`;

    currentFile.targetName = finalTarget;
    currentFile.userEditedName = cleanBase;
    currentFile.hasUserEdited = true;
    currentFile.isMatched = true;
    currentFile.docType = canonical;
    currentFile.smartDocType = canonical;
    currentFile.smartConfidence = 100;
    currentFile.status = 'ready';

    const input = document.getElementById('inputRenameTarget');
    if (input) {
      input.value = cleanBase;
      input.focus();
      input.select();
    }

    toast.show('Selected Document', `${shortcutCode} → ${cleanBase}`, 'info');
    this.updateTelemetry();
    this.renderQueue();
  }

  handleNavigateBackward() {
    if (this.state.files.length > 0) {
      this.state.currentIndex = (this.state.currentIndex - 1 + this.state.files.length) % this.state.files.length;
      this.renderQueue();
      this.renderCurrentPreview();
    }
  }

  async handleRescanFiles() {
    if (!this.state.files || this.state.files.length === 0) {
      toast.show('No Files to Re-Scan', 'Please select a folder first.', 'info');
      return;
    }

    const folderPath = this.state.folder?.nativePath || this.state.folder?.path;
    if (folderPath && isNativeAvailable()) {
      try {
        const res = await listNativeDirectory(folderPath);
        if (res && res.success && Array.isArray(res.files)) {
          const validFiles = res.files.filter(f => !isJunkFile(f.name) && !f.name.toLowerCase().includes('duplicate files'));
          res.files = validFiles;
          // Fresh reload: reset all files to pending, 0/X Done, and clear green ticks
          this.loadFolderData(res);
          this._computeDuplicateHashesAsync();
          toast.show('Fresh Re-Scan Complete', `Reloaded ${validFiles.length} files from disk. All reset to pending.`, 'success');
          return;
        }
      } catch (err) {
        console.warn('[DocMitra Renamer] Native rescan fallback:', err);
      }
    }

    // In-memory fallback (e.g. test mode / mock dataset):
    this.state.files.forEach(f => {
      f.isRenamed = false;
      f.isKept = false;
      f.hasUserEdited = false;
      f.userEditedName = undefined;
      f.status = 'pending';
    });
    this.state.currentIndex = 0;
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this._computeDuplicateHashesAsync();

    if (this._scanAbortController) {
      this._scanAbortController.abort();
      this._scanAbortController = null;
    }
    this.handleSmartScanBatch();

    toast.show('Fresh Re-Scan Complete', `All ${this.state.files.length} files reset to 0 Done. Ready for re-matching.`, 'success');
  }

  handleSortDocuments(order = null) {
    if (!this.state.files || this.state.files.length === 0) {
      toast.show('No Files to Sort', 'Please load documents first.', 'info');
      return;
    }

    if (order === 'asc' || order === 'desc') {
      this._sortOrder = order;
    } else {
      this._sortOrder = this._sortOrder === 'asc' ? 'desc' : 'asc';
    }

    const currentFile = this.state.files[this.state.currentIndex];

    this.state.files.sort((a, b) => {
      const nameA = a.targetName || a.name || '';
      const nameB = b.targetName || b.name || '';
      const cmp = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      return this._sortOrder === 'asc' ? cmp : -cmp;
    });

    if (currentFile) {
      const newIdx = this.state.files.findIndex(f => f.id === currentFile.id || f.name === currentFile.name);
      if (newIdx !== -1) this.state.currentIndex = newIdx;
    }

    const sortQueueLabel = document.getElementById('sortQueueLabel');
    if (sortQueueLabel) sortQueueLabel.textContent = this._sortOrder === 'asc' ? 'Sort A–Z' : 'Sort Z–A';
    const modalSortLabel = document.getElementById('modalSortLabel');
    if (modalSortLabel) modalSortLabel.textContent = this._sortOrder === 'asc' ? 'Sort A–Z' : 'Sort Z–A';

    this.renderQueue();
    this.renderCurrentPreview();

    const modal = document.getElementById('modalCrossCheck');
    if (modal && !modal.classList.contains('hidden')) {
      this._renderCrossCheckRows();
    }

    toast.show('Sorted', `Documents sorted ${this._sortOrder === 'asc' ? 'A → Z' : 'Z → A'}`, 'info');
  }

  getExtraDuplicateFiles() {
    if (!this.state.files || this.state.files.length === 0) return [];
    const dupMap = detectDuplicateFiles(this.state.files);
    const extraFiles = [];
    this.state.files.forEach(f => {
      const info = dupMap.get(f.id || f.name);
      if (info && (info.status === 'confirmed' || info.status === 'probable') && !info.isMaster) {
        extraFiles.push(f);
      }
    });
    return extraFiles;
  }

  async handleMoveAllDuplicates() {
    const extraFiles = this.getExtraDuplicateFiles();
    if (extraFiles.length === 0) {
      toast.show('No Extra Duplicates', 'All documents are single master copies.', 'info');
      return;
    }

    const parentDir = this.state.folder?.nativePath || this.state.folder?.path ||
      (extraFiles[0].path ? extraFiles[0].path.substring(0, Math.max(extraFiles[0].path.lastIndexOf('\\'), extraFiles[0].path.lastIndexOf('/'))) : '');
    const dupDir = parentDir ? `${parentDir}\\Duplicate Files` : 'Duplicate Files';

    const movedRecords = [];
    const filesToMoveIds = new Set(extraFiles.map(f => f.id || f.name));

    for (const f of extraFiles) {
      let movedPath = '';
      if (f.path && isNativeAvailable()) {
        try {
          const res = await moveNativeFile(f.path, dupDir);
          if (res && res.success) {
            movedPath = res.new_path || res.path || `${dupDir}\\${f.name}`;
          }
        } catch (err) {
          console.warn('[DocMitra Renamer] Move error for', f.name, err);
        }
      } else {
        movedPath = `${dupDir}\\${f.name}`;
      }

      const origIdx = this.state.files.findIndex(item => item.id === f.id || item.name === f.name);
      movedRecords.push({
        file: { ...f },
        srcPath: f.path,
        movedPath: movedPath,
        originalIndex: origIdx
      });
    }

    // Save batch into _recentMoves
    this._recentMoves.push({
      isBatch: true,
      records: movedRecords
    });

    // Remove all moved files from this.state.files in one pass
    this.state.files = this.state.files.filter(f => !filesToMoveIds.has(f.id || f.name));
    if (this.state.currentIndex >= this.state.files.length) {
      this.state.currentIndex = Math.max(0, this.state.files.length - 1);
    }

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this._computeDuplicateHashesAsync();

    const modal = document.getElementById('modalCrossCheck');
    if (modal && !modal.classList.contains('hidden')) {
      this._renderCrossCheckRows();
    }

    toast.show(
      'Duplicates Moved',
      `Safely moved ${movedRecords.length} duplicate file(s) to "Duplicate Files"`,
      'success',
      7000,
      {
        label: 'Undo',
        onClick: () => this.handleUndoSafeMove()
      }
    );
  }

  async handleMoveFileToDuplicates(file = null) {
    const targetFile = file || this.state.files[this.state.currentIndex];
    if (!targetFile) {
      toast.show('No Document Selected', 'Please select a document to move.', 'warning');
      return;
    }

    const parentDir = this.state.folder?.nativePath || this.state.folder?.path ||
      (targetFile.path ? targetFile.path.substring(0, Math.max(targetFile.path.lastIndexOf('\\'), targetFile.path.lastIndexOf('/'))) : '');

    const dupDir = parentDir ? `${parentDir}\\Duplicate Files` : 'Duplicate Files';

    let movedPath = '';
    if (targetFile.path && isNativeAvailable()) {
      try {
        const res = await moveNativeFile(targetFile.path, dupDir);
        if (!res || !res.success) {
          toast.show('Move Failed', res?.error || 'Could not move file to Duplicate Files folder.', 'error');
          return;
        }
        movedPath = res.new_path || res.path || `${dupDir}\\${targetFile.name}`;
      } catch (err) {
        toast.show('Move Error', err?.message || String(err), 'error');
        return;
      }
    } else {
      movedPath = `${dupDir}\\${targetFile.name}`;
    }

    const originalIndex = this.state.files.findIndex(f => f.id === targetFile.id || f.name === targetFile.name);
    this._recentMoves.push({
      file: { ...targetFile },
      srcPath: targetFile.path,
      movedPath: movedPath,
      originalIndex: originalIndex
    });

    if (originalIndex !== -1) {
      this.state.files.splice(originalIndex, 1);
      if (this.state.currentIndex >= this.state.files.length) {
        this.state.currentIndex = Math.max(0, this.state.files.length - 1);
      }
    }

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this._computeDuplicateHashesAsync();

    const modal = document.getElementById('modalCrossCheck');
    if (modal && !modal.classList.contains('hidden')) {
      this._renderCrossCheckRows();
    }

    toast.show(
      'Safe Moved',
      `"${targetFile.name}" moved to "Duplicate Files"`,
      'info',
      6000,
      {
        label: 'Undo',
        onClick: () => this.handleUndoSafeMove()
      }
    );
  }

  async handleUndoSafeMove() {
    if (!this._recentMoves || this._recentMoves.length === 0) {
      toast.show('Nothing to Undo', 'No recent moved files found.', 'info');
      return;
    }

    const lastMove = this._recentMoves.pop();
    if (!lastMove) return;

    if (lastMove.isBatch && Array.isArray(lastMove.records)) {
      let restoredCount = 0;
      const records = [...lastMove.records].sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));
      for (const rec of records) {
        if (rec.srcPath && rec.movedPath && isNativeAvailable()) {
          try {
            const targetDir = rec.srcPath.substring(0, Math.max(rec.srcPath.lastIndexOf('\\'), rec.srcPath.lastIndexOf('/')));
            await moveNativeFile(rec.movedPath, targetDir);
          } catch (err) {
            console.warn('[DocMitra Renamer] Restore error for', rec.file?.name, err);
          }
        }
        const insertIdx = Math.min(rec.originalIndex ?? this.state.files.length, this.state.files.length);
        this.state.files.splice(insertIdx, 0, rec.file);
        restoredCount++;
      }
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      this._computeDuplicateHashesAsync();

      const modal = document.getElementById('modalCrossCheck');
      if (modal && !modal.classList.contains('hidden')) {
        this._renderCrossCheckRows();
      }

      toast.show('Restored', `Restored ${restoredCount} file(s) from "Duplicate Files"`, 'success');
      return;
    }

    if (lastMove.srcPath && lastMove.movedPath && isNativeAvailable()) {
      try {
        const targetDir = lastMove.srcPath.substring(0, Math.max(lastMove.srcPath.lastIndexOf('\\'), lastMove.srcPath.lastIndexOf('/')));
        const res = await moveNativeFile(lastMove.movedPath, targetDir);
        if (!res || !res.success) {
          toast.show('Restore Failed', res?.error || 'Could not restore file from Duplicate Files.', 'error');
          return;
        }
      } catch (err) {
        toast.show('Restore Error', err?.message || String(err), 'error');
        return;
      }
    }

    const insertIdx = Math.min(lastMove.originalIndex ?? this.state.files.length, this.state.files.length);
    this.state.files.splice(insertIdx, 0, lastMove.file);
    this.state.currentIndex = insertIdx;

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this._computeDuplicateHashesAsync();

    const modal = document.getElementById('modalCrossCheck');
    if (modal && !modal.classList.contains('hidden')) {
      this._renderCrossCheckRows();
    }

    toast.show('Restored', `"${lastMove.file.name}" restored from "Duplicate Files"`, 'success');
  }

  async handleMoveModalDuplicates() {
    await this.handleMoveAllDuplicates();
  }

  async handleConfirmCurrentName(targetName) {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    const fileExt = current.ext || ext(current.name);
    const cleanTarget = (targetName || '').trim();
    if (!cleanTarget) {
      toast.show('Document Name Required', 'Please provide a valid filename.', 'warning');
      return;
    }

    let baseWithoutExt = cleanTarget.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
    // Double protection: Check if baseWithoutExt is a registered shortcode (e.g. PIC, PHO, 10MP)
    const shortcutMatch = this.resolveShortcut(baseWithoutExt);
    if (shortcutMatch) {
      const canonical = shortcutMatch.canonical || shortcutMatch.label;
      const effStudent = this.getEffectiveStudentName();
      const formulaBase = buildName(canonical, effStudent, this.state.settings?.groups, this.state.style);
      baseWithoutExt = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
      current.docType = canonical;
      current.isMatched = true;
    }
    let finalName = `${baseWithoutExt}${fileExt}`;

    // Collect all existing/used destination names from queue and folder
    const usedDestinations = new Set();
    for (const f of this.state.files) {
      if (f !== current) {
        if (f.isRenamed || f.isKept) {
          usedDestinations.add(f.targetName || f.name);
        } else if (f.name) {
          usedDestinations.add(f.name);
        }
      }
    }

    const effStudent = this.getEffectiveStudentName();
    const uniqueCandidate = uniqueDestination(finalName, current.name, usedDestinations, effStudent);
    const wasDuplicateAdjusted = (uniqueCandidate.toLowerCase() !== finalName.toLowerCase());
    finalName = uniqueCandidate;
    const finalBaseWithoutExt = cleanName(finalName);

    const err = validateFilename(finalName);
    if (err) {
      toast.show('Validation Error', `${finalBaseWithoutExt}: ${err}`, 'error');
      return;
    }

    const dirPath = this.state.folder ? (this.state.folder.nativePath || this.state.folder.path || '') : '';
    const oldPath = current.nativePath || current.path || (dirPath ? `${dirPath}/${current.name}` : null);

    const isNameChanged = (cleanName(current.name) !== finalBaseWithoutExt);
    const hasRotation = (current.rotation && current.rotation % 360 !== 0);

    const isTestMode = typeof window !== 'undefined' && (window.location?.search?.includes('test_mode=1') || window.__DOCMITRA_TEST_MODE__);

    if (oldPath && (isNameChanged || hasRotation)) {
      const studentName = effStudent || current.studentName || '';
      const rotation = current.rotation || 0;

      toast.show('Renaming Document', `Renaming to ${finalBaseWithoutExt}...`, 'info');

      try {
        let res;
        if (isTestMode) {
          res = { success: true, name: finalName, path: oldPath.replace(/[^\\\/]+$/, finalName) };
        } else {
          res = await renameNativeFile(oldPath, finalName, studentName, rotation);
        }
        if (!res.success) {
          throw new Error(res.error || `Failed to rename ${current.name}`);
        }

        const actualName = res.name || finalName;
        const newPath = res.path || res.newPath || oldPath.replace(/[^\\\/]+$/, actualName);

        // Record in undo manager
        const planItem = {
          old: current.name,
          next: actualName,
          file: current,
          nativePath: oldPath,
          studentName,
          rotation
        };
        undoManager.pushBatch(this.state.folder, [planItem]);

        current.name = actualName;
        current.targetName = actualName;
        current.userEditedName = cleanName(actualName);
        current.path = newPath;
        current.nativePath = newPath;
        current.isRenamed = true;
        current.status = 'renamed';
        current.smartConfidence = 100;
        current.hasUserEdited = true;
        current.rotation = 0;
        current._pdfBytes = null;
        if (current._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          try { URL.revokeObjectURL(current._blobUrl); } catch (_) { }
          current._blobUrl = null;
        }
        const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
          ? window.location.origin : 'http://localhost:3000';
        current.url = `${origin}/api/serve-file?path=${encodeURIComponent(newPath)}`;

        if (wasDuplicateAdjusted || (actualName.toLowerCase() !== `${baseWithoutExt}${fileExt}`.toLowerCase())) {
          toast.show('Duplicate Auto-Numbered', `Saved as: ${cleanName(actualName)}`, 'info');
        } else {
          toast.show('Renamed Successfully', cleanName(actualName), 'success');
        }
      } catch (e) {
        toast.show('Rename Error', e.message, 'error');
        return;
      }
    } else {
      // Name was not changed or in mock mode, just mark confirmed
      current.targetName = finalName;
      current.userEditedName = finalBaseWithoutExt;
      current.hasUserEdited = true;
      current.isMatched = true;
      current.status = 'ready';
      current.smartConfidence = 100;
      current.smartDocType = current.docType || current.smartDocType || finalBaseWithoutExt;
      if (wasDuplicateAdjusted) {
        toast.show('Duplicate Auto-Numbered', `Saved as: ${finalBaseWithoutExt}`, 'info');
      } else {
        toast.show('Name Confirmed', finalBaseWithoutExt, 'info');
      }
    }

    // Advance to next file (Circular wrap-around queue navigation: 1..N..1)
    if (this.state.files.length > 0) {
      this.state.currentIndex = (this.state.currentIndex + 1) % this.state.files.length;
    }

    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this._computeDuplicateHashesAsync();
  }

  async handleRenameSingleFile(file) {
    const targetFile = file || this.state.files[this.state.currentIndex];
    if (!targetFile) return;

    if (!targetFile.targetName || targetFile.targetName === targetFile.name) {
      const inputEl = document.getElementById('inputRenameTarget');
      if (inputEl && inputEl.value.trim()) {
        const fileExt = targetFile.ext || ext(targetFile.name);
        const baseWithoutExt = inputEl.value.trim().replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
        targetFile.targetName = `${baseWithoutExt}${fileExt}`;
        targetFile.userEditedName = baseWithoutExt;
        targetFile.hasUserEdited = true;
        targetFile.isMatched = true;
        targetFile.status = 'ready';
        targetFile.smartConfidence = 100;
        targetFile.smartDocType = targetFile.docType || targetFile.smartDocType || baseWithoutExt;
      }
    }

    if (!targetFile.targetName) {
      toast.show('Document Name Required', 'Please enter a target name first.', 'warning');
      return;
    }

    const err = validateFilename(targetFile.targetName);
    if (err) {
      toast.show('Validation Error', `${cleanName(targetFile.name)}: ${err}`, 'error');
      return;
    }

    const dirPath = this.state.folder ? (this.state.folder.nativePath || this.state.folder.path || '') : '';
    const oldPath = targetFile.nativePath || targetFile.path || (dirPath ? `${dirPath}/${targetFile.name}` : null);

    if (!oldPath) {
      toast.show('Path Error', 'Cannot determine file disk path.', 'error');
      return;
    }

    const studentName = this.state.studentName || targetFile.studentName || '';
    const rotation = targetFile.rotation || 0;

    toast.show('Renaming File', `Renaming to ${cleanName(targetFile.targetName)}...`, 'info');

    try {
      const res = await renameNativeFile(oldPath, targetFile.targetName, studentName, rotation);
      if (!res.success) {
        throw new Error(res.error || `Failed to rename ${targetFile.name}`);
      }

      const actualName = res.name || targetFile.targetName;
      const newPath = res.path || res.newPath || oldPath.replace(/[^\\\/]+$/, actualName);

      const planItem = {
        old: targetFile.name,
        next: actualName,
        file: targetFile,
        nativePath: oldPath,
        studentName,
        rotation
      };
      undoManager.pushBatch(this.state.folder, [planItem]);

      targetFile.name = actualName;
      targetFile.targetName = actualName;
      targetFile.userEditedName = cleanName(actualName);
      targetFile.isRenamed = true;
      targetFile.status = 'renamed';
      targetFile.path = newPath;
      targetFile.nativePath = newPath;
      targetFile.rotation = 0;
      targetFile._pdfBytes = null;
      if (targetFile._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try { URL.revokeObjectURL(targetFile._blobUrl); } catch (_) { }
        targetFile._blobUrl = null;
      }
      const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
        ? window.location.origin : 'http://localhost:3000';
      targetFile.url = `${origin}/api/serve-file?path=${encodeURIComponent(newPath)}`;

      toast.show('Renamed Successfully', cleanName(actualName), 'success');

      // Advance to next pending file
      const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed && !f.isKept);
      if (nextPending !== -1) {
        this.state.currentIndex = nextPending;
      } else if (this.state.currentIndex < this.state.files.length - 1) {
        this.state.currentIndex++;
      }

      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
    } catch (e) {
      toast.show('Rename Error', e.message, 'error');
    }
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
      nativePath: f.path || f.nativePath,
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
        f._pdfBytes = null;
        if (f._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          try { URL.revokeObjectURL(f._blobUrl); } catch (_) { }
          f._blobUrl = null;
        }
        if (f.path) {
          f.path = f.path.replace(/[^\\\/]+$/, f.name);
        }
        if (f.nativePath) {
          f.nativePath = f.nativePath.replace(/[^\\\/]+$/, f.name);
        }
        const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
          ? window.location.origin : 'http://localhost:3000';
        if (f.path || f.nativePath) {
          f.url = `${origin}/api/serve-file?path=${encodeURIComponent(f.path || f.nativePath)}`;
        }
      });

      toast.show('Batch Complete!', `Successfully renamed ${plan.length} files.`, 'success');
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      this._computeDuplicateHashesAsync();
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
      this._computeDuplicateHashesAsync();
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
      return;
    }

    // Cancel existing scan if running
    if (this._scanAbortController) {
      this._scanAbortController.abort();
    }
    this._scanAbortController = new AbortController();
    const signal = this._scanAbortController.signal;

    // Strict: filter out files that are already renamed or kept
    const pending = this.state.files.filter(f => !f.isRenamed && !f.isKept);
    if (pending.length === 0) {
      return;
    }

    this.state.isSmartScanning = true;
    const btnSmart = document.getElementById('btnSmartScanBatch');
    const origHtml = btnSmart ? btnSmart.innerHTML : '';
    if (btnSmart) {
      btnSmart.classList.add('smart-scan-pulse');
      btnSmart.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (0/${pending.length})...</span>`;
    }

    // Duplicate collision avoidance in Smart Scan: collect already renamed/kept names
    const usedDestinations = new Set();
    for (const file of this.state.files) {
      if (file.isRenamed || file.isKept) {
        usedDestinations.add(file.targetName || file.name);
      }
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
        // Respect Keep Original (isKept = true): NEVER overwrite, re-match, or change
        if (f.isKept) continue;

        f.isScanning = true;

        if (btnSmart) {
          btnSmart.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (${i + 1}/${scanQueue.length})...</span>`;
        }

        // Live render active scanning indicator
        this.renderQueue();
        await new Promise(r => setTimeout(r, 40));

        if (signal.aborted) break;

        try {
          // Strictly Filename-Based Smart Matching (No OCR extraction)
          const evalRes = matchFilenameSmart(f.name, this.state.studentName, this.state.settings?.groups, this.getActivePresetDocuments());
          f.smartEvaluation = evalRes;
          f.smartConfidence = evalRes.confidence;
          f.smartDocType = evalRes.docType;

          if (evalRes.confidence >= 50 && evalRes.docType) {
            f.docType = evalRes.docType;
            f.isMatched = true;
            if (evalRes.confidence >= 80) highConfCount++;
            const formulaBase = buildName(evalRes.docType, this.state.studentName, this.state.settings?.groups, this.state.style);
            const cleanBase = formulaBase.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
            const currentExt = f.ext || ('.' + f.name.split('.').pop()).toLowerCase();
            const desiredWithExt = `${cleanBase}${currentExt}`;
            const uniqueTarget = uniqueDestination(desiredWithExt, f.name, usedDestinations, this.state.studentName);
            usedDestinations.add(uniqueTarget);
            f.targetName = uniqueTarget;
            f.status = evalRes.confidence >= 80 ? 'matched' : 'needs_review';
          } else {
            f.isMatched = false;
            f.docType = null;
            f.status = 'unmatched';
          }
        } catch (err) {
          console.error('[DocMitra Renamer] Filename match error on file:', f.name, err);
          f.smartConfidence = 0;
          f.isMatched = false;
          f.docType = null;
          f.status = 'unmatched';
        } finally {
          f.isScanning = false;
        }

        // Live row-by-row update: telemetry and queue badges
        this.updateTelemetry();
        this.renderQueue();

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
    this.openCrossCheckModal();
  }

  /* ==========================================================================
     Dedicated Rename Tool Settings & Document Presets Management
     ========================================================================== */

  loadPresetsAndSettings() {
    // 1. Load active preset
    const savedActive = localStorage.getItem('docmitra_active_preset');
    if (savedActive) {
      if (savedActive === 'MAHA DBT FORM' || savedActive === 'MAHA DBT') {
        this.state.activePreset = 'MAHA DBT';
      } else if (savedActive === 'SWAYAM FORM' || savedActive === 'SWAYAM' || savedActive === 'SWAYAM DEENDAYAL YOJANA') {
        this.state.activePreset = 'SWAYAM DEENDAYAL YOJANA';
      } else if (savedActive === 'EDUCATIONAL' || savedActive === 'EDUCATIONAL DOCUMENTS') {
        this.state.activePreset = 'EDUCATIONAL DOCUMENTS';
      } else if (savedActive === 'CET CELL') {
        this.state.activePreset = 'CET CELL';
      } else {
        this.state.activePreset = savedActive;
      }
    } else {
      this.state.activePreset = 'MAHA DBT';
    }

    // 2. Load presets from localStorage or default
    try {
      const storedPresets = localStorage.getItem('docmitra_rename_presets');
      if (storedPresets) {
        this.state.documentPresets = JSON.parse(storedPresets);
      }
    } catch (e) {
      console.warn('[DocMitra Renamer] Failed to parse local presets:', e);
    }

    // 3. Load custom shortcuts from localStorage
    try {
      const storedShortcuts = localStorage.getItem('docmitra_custom_shortcuts');
      if (storedShortcuts) {
        this.state.customShortcuts = JSON.parse(storedShortcuts);
        if (Array.isArray(this.state.customShortcuts)) {
          for (const cs of this.state.customShortcuts) {
            if (!cs || !cs.code) continue;
            const codeUpper = cs.code.toUpperCase();
            const existingIdx = this.shortcuts21.findIndex(s => s.code.toUpperCase() === codeUpper);
            const entry = {
              code: codeUpper,
              codes: cs.codes || [codeUpper],
              label: cs.label || cs.canonical || codeUpper,
              canonical: (cs.canonical || cs.label || codeUpper).toUpperCase(),
              keywords: Array.isArray(cs.keywords) ? cs.keywords : []
            };
            if (existingIdx !== -1) {
              this.shortcuts21[existingIdx] = entry;
            } else {
              this.shortcuts21.push(entry);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[DocMitra Renamer] Failed to parse custom shortcuts:', e);
    }

    if (this.state.documentPresets && typeof this.state.documentPresets === 'object') {
      if (this.state.documentPresets['SWAYAM'] && !this.state.documentPresets['SWAYAM DEENDAYAL YOJANA']) {
        this.state.documentPresets['SWAYAM DEENDAYAL YOJANA'] = this.state.documentPresets['SWAYAM'];
        delete this.state.documentPresets['SWAYAM'];
      }
      if (this.state.documentPresets['EDUCATIONAL'] && !this.state.documentPresets['EDUCATIONAL DOCUMENTS']) {
        this.state.documentPresets['EDUCATIONAL DOCUMENTS'] = this.state.documentPresets['EDUCATIONAL'];
        delete this.state.documentPresets['EDUCATIONAL'];
      }
    }

    if (!this.state.documentPresets || Object.keys(this.state.documentPresets).length === 0) {
      // Initialize with factory defaults from BUILTIN_PRESETS (MAHA DBT, SWAYAM DEENDAYAL YOJANA, CET CELL, EDUCATIONAL DOCUMENTS)
      this.state.documentPresets = JSON.parse(JSON.stringify(BUILTIN_PRESETS));
      this.savePresetsAndSettings();
    }

    // 4. Auto-migrate legacy shortcut codes with underscores (e.g., PIC_2 -> PIC2)
    let migratedAny = false;
    const migrateLegacyCode = (code) => {
      if (!code || typeof code !== 'string') return code;
      const clean = code.trim().toUpperCase();
      if (/^[A-Z0-9]+_\d+$/.test(clean)) {
        return clean.replace(/_(\d+)$/, '$1');
      }
      return clean;
    };

    if (this.state.documentPresets && typeof this.state.documentPresets === 'object') {
      for (const presetKey of Object.keys(this.state.documentPresets)) {
        const list = this.state.documentPresets[presetKey];
        if (Array.isArray(list)) {
          for (const doc of list) {
            if (doc && doc.code) {
              const migrated = migrateLegacyCode(doc.code);
              if (migrated !== doc.code) {
                doc.code = migrated;
                migratedAny = true;
              }
            }
            if (doc && Array.isArray(doc.codes)) {
              const newCodes = doc.codes.map(c => migrateLegacyCode(c));
              if (JSON.stringify(newCodes) !== JSON.stringify(doc.codes)) {
                doc.codes = newCodes;
                migratedAny = true;
              }
            }
          }
        }
      }
    }

    if (Array.isArray(this.state.customShortcuts)) {
      for (const cs of this.state.customShortcuts) {
        if (cs && cs.code) {
          const migrated = migrateLegacyCode(cs.code);
          if (migrated !== cs.code) {
            cs.code = migrated;
            migratedAny = true;
          }
        }
        if (cs && Array.isArray(cs.codes)) {
          const newCodes = cs.codes.map(c => migrateLegacyCode(c));
          if (JSON.stringify(newCodes) !== JSON.stringify(cs.codes)) {
            cs.codes = newCodes;
            migratedAny = true;
          }
        }
      }
    }

    if (Array.isArray(this.shortcuts21)) {
      for (const s of this.shortcuts21) {
        if (s && s.code) {
          s.code = migrateLegacyCode(s.code);
        }
        if (s && Array.isArray(s.codes)) {
          s.codes = s.codes.map(c => migrateLegacyCode(c));
        }
      }
    }

    if (migratedAny) {
      this.savePresetsAndSettings();
    }

    // 5. Automatically sync all unique preset documents to Shortcuts & Rename Rules with ZERO duplicates
    this.syncPresetsToShortcuts();

    // 6. Synchronize canonical names and document patterns to matching engine
    const allInitialDocs = this.getAllPresetDocuments();
    syncCanonicalNames(allInitialDocs);
    for (const d of allInitialDocs) {
      if (d && d.code && d.name) {
        updateDocumentPattern(d.code, d.name, d.keywords);
        updateCanonicalName(d.name, d.name);
      }
    }
  }

  savePresetsAndSettings() {
    try {
      localStorage.setItem('docmitra_rename_presets', JSON.stringify(this.state.documentPresets));
      localStorage.setItem('docmitra_active_preset', this.state.activePreset);
      if (this.state.settings) {
        this.state.settings.activeChecklist = this.state.activePreset;
        this.state.settings.checklists = this.state.documentPresets;
        saveSettings(this.state.settings);
      }
      if (this.state.customShortcuts) {
        localStorage.setItem('docmitra_custom_shortcuts', JSON.stringify(this.state.customShortcuts));
      }
      saveDocumentPresets({ forms: this.state.documentPresets }).catch(() => { });
    } catch (e) {
      console.warn('[DocMitra Renamer] Failed to persist presets and settings:', e);
    }
  }

  syncPresetsToShortcuts() {
    if (!this.state.documentPresets) return;
    const existingMap = new Map();
    for (const sc of this.shortcuts21) {
      if (sc && sc.code) {
        existingMap.set(sc.code.toUpperCase(), sc);
      }
    }

    for (const presetKey of Object.keys(this.state.documentPresets)) {
      const docList = this.state.documentPresets[presetKey];
      if (!Array.isArray(docList)) continue;
      for (const doc of docList) {
        if (!doc) continue;
        const code = (doc.code || '').trim().toUpperCase();
        if (!code) continue;
        const name = (doc.name || '').trim();
        const kws = Array.isArray(doc.keywords)
          ? doc.keywords
          : (typeof doc.keywords === 'string' ? doc.keywords.split(',').map(s => s.trim()) : []);

        if (existingMap.has(code)) {
          const item = existingMap.get(code);
          if (name) {
            item.canonical = name.toUpperCase();
            item.label = name;
          }
          if (Array.isArray(item.keywords)) {
            const combinedKws = new Set([...item.keywords, ...kws]);
            item.keywords = Array.from(combinedKws);
          } else {
            item.keywords = kws;
          }
        } else {
          const newEntry = {
            code,
            label: name || code,
            canonical: (name || code).toUpperCase(),
            keywords: kws
          };
          this.shortcuts21.push(newEntry);
          existingMap.set(code, newEntry);
        }
      }
    }
  }

  getAllPresetDocuments() {
    const map = new Map();
    if (this.state.documentPresets) {
      for (const presetKey of Object.keys(this.state.documentPresets)) {
        const list = this.state.documentPresets[presetKey];
        if (Array.isArray(list)) {
          for (const item of list) {
            if (!item) continue;
            const code = (item.code || '').toUpperCase().trim();
            const name = (item.name || '').toUpperCase().trim();
            const key = code || name;
            if (key && !map.has(key)) {
              map.set(key, {
                name: (item.name || '').toUpperCase(),
                code,
                keywords: Array.isArray(item.keywords) ? item.keywords : []
              });
            }
          }
        }
      }
    }
    // Also include shortcuts
    for (const s of this.shortcuts21) {
      const code = (s.code || '').toUpperCase().trim();
      const canon = (s.canonical || s.label || '').toUpperCase().trim();
      const key = code || canon;
      if (key && !map.has(key)) {
        map.set(key, {
          name: canon,
          code,
          keywords: Array.isArray(s.keywords) ? s.keywords : []
        });
      }
    }
    return Array.from(map.values());
  }

  getShortCodeForDoc(docType) {
    if (!docType) return null;
    const upper = docType.toUpperCase().trim();
    // 1. Check shortcuts
    const foundSc = this.shortcuts21.find(s =>
      s.code.toUpperCase() === upper ||
      (s.canonical && s.canonical.toUpperCase() === upper) ||
      (s.label && s.label.toUpperCase() === upper)
    );
    if (foundSc && foundSc.code) return foundSc.code;

    // 2. Check all presets
    const allDocs = this.getAllPresetDocuments();
    const foundDoc = allDocs.find(d =>
      d.code.toUpperCase() === upper ||
      d.name.toUpperCase() === upper
    );
    if (foundDoc && foundDoc.code) return foundDoc.code;

    return null;
  }

  getActivePresetDocuments() {
    const presetKey = this.state.activePreset || 'MAHA DBT';
    const rawList = (this.state.documentPresets && this.state.documentPresets[presetKey]) ||
      (this.state.documentPresets && this.state.documentPresets['MAHA DBT']) || [];

    return rawList.map(item => {
      if (typeof item === 'string') {
        return { name: item.toUpperCase(), code: '', keywords: [item.toLowerCase()] };
      }
      if (Array.isArray(item)) {
        return { name: item[0].toUpperCase(), code: item[2] || '', keywords: item[1] || [item[0].toLowerCase()] };
      }
      return {
        name: (item.name || '').toUpperCase(),
        code: (item.code || '').toUpperCase(),
        keywords: item.keywords || [item.name?.toLowerCase()]
      };
    });
  }

  handleOpenSettingsModal(tab = 'presets') {
    const modal = document.getElementById('modalRenameSettings');
    if (!modal) return;
    modal.classList.remove('hidden');
    this.renderSettingsModal(tab);
  }

  handleCloseSettingsModal() {
    const modal = document.getElementById('modalRenameSettings');
    if (modal) modal.classList.add('hidden');
    this._presetDocsSearchQuery = '';
    this._shortcutsSearchQuery = '';
    const inputP = document.getElementById('inputSearchPresetDocs');
    if (inputP) inputP.value = '';
    const inputS = document.getElementById('inputSearchShortcuts');
    if (inputS) inputS.value = '';
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
  }

  renderSettingsModal(activeTab = 'presets') {
    const tabPresets = document.getElementById('tabContentPresets');
    const tabShortcuts = document.getElementById('tabContentShortcuts');
    const btnTabPresets = document.getElementById('tabBtnPresets');
    const btnTabShortcuts = document.getElementById('tabBtnShortcuts');

    if (activeTab === 'presets') {
      tabPresets?.classList.remove('hidden');
      tabShortcuts?.classList.add('hidden');
      btnTabPresets?.classList.add('text-primary', 'border-primary', 'font-bold');
      btnTabPresets?.classList.remove('text-secondary', 'border-transparent', 'font-medium');
      btnTabShortcuts?.classList.remove('text-primary', 'border-primary', 'font-bold');
      btnTabShortcuts?.classList.add('text-secondary', 'border-transparent', 'font-medium');
    } else {
      tabPresets?.classList.add('hidden');
      tabShortcuts?.classList.remove('hidden');
      btnTabShortcuts?.classList.add('text-primary', 'border-primary', 'font-bold');
      btnTabShortcuts?.classList.remove('text-secondary', 'border-transparent', 'font-medium');
      btnTabPresets?.classList.remove('text-primary', 'border-primary', 'font-bold');
      btnTabPresets?.classList.add('text-secondary', 'border-transparent', 'font-medium');
    }

    // 1. Populate Active Preset Selector
    const select = document.getElementById('selectActivePreset');
    if (select && this.state.documentPresets) {
      select.innerHTML = '';
      const presetKeys = Object.keys(this.state.documentPresets);
      presetKeys.forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        // Truncate long preset names in the closed dropdown (max ~10-12 chars + ellipsis)
        opt.textContent = key.length > 14 ? key.slice(0, 12) + '...' : key;
        opt.title = key;
        if (key === this.state.activePreset) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      select.title = `Active Preset: ${this.state.activePreset}`;
    }

    // 2. Populate Documents in Active Preset Table
    this.renderPresetDocsTable();

    // 3. Populate Shortcuts Table
    this.renderShortcutsTable();
  }

  renderPresetDocsTable() {
    const docs = this.getActivePresetDocuments();
    const countBadge = document.getElementById('presetDocCountBadge');
    const tbody = document.getElementById('presetDocsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const q = (this._presetDocsSearchQuery || '').trim().toLowerCase();
    const filteredDocs = q ? docs.filter(doc => {
      const name = (doc.name || '').toLowerCase();
      const kw = (Array.isArray(doc.keywords) ? doc.keywords.join(' ') : (doc.keywords || '')).toLowerCase();
      return name.includes(q) || kw.includes(q);
    }) : docs;

    if (countBadge) {
      countBadge.textContent = q ? `${filteredDocs.length} / ${docs.length}` : String(docs.length);
    }

    if (filteredDocs.length === 0) {
      const emptyRow = document.createElement('tr');
      if (q) {
        emptyRow.innerHTML = `<td colspan="4" class="py-6 text-center text-secondary italic">No documents match "${this._presetDocsSearchQuery}".</td>`;
      } else {
        emptyRow.innerHTML = '<td colspan="4" class="py-6 text-center text-secondary italic">No documents in this preset. Click "Add Document" above.</td>';
      }
      tbody.appendChild(emptyRow);
      return;
    }

    filteredDocs.forEach((doc, idx) => {
      const row = document.createElement('tr');
      row.className = 'row-compact-42 hover:bg-surface-container-low transition-colors group';

      const origIdx = docs.indexOf(doc);

      row.innerHTML = `
        <td class="py-1 px-3 text-center text-secondary font-mono-code text-[11px]" style="width: 44px;">${idx + 1}</td>
        <td class="py-1 px-3 font-semibold text-on-surface truncate text-[12px]" style="width: 32%;" title="${escapeHtml(doc.name)}">${escapeHtml(doc.name)}</td>
        <td class="py-1 px-3 text-secondary text-[11px] overflow-visible relative" style="width: 55%;">${this._renderKeywordsWithPopover(doc.keywords)}</td>
        <td class="py-1 px-3 text-right whitespace-nowrap pr-4" style="width: 80px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-doc" title="Edit document" type="button" data-doc-idx="${origIdx}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-doc" title="Remove document from preset" type="button" data-doc-idx="${origIdx}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;

      const editBtn = row.querySelector('.btn-edit-doc');
      if (editBtn) {
        editBtn.addEventListener('click', () => this.openEditDocumentModal(doc, origIdx));
      }
      const delBtn = row.querySelector('.btn-del-doc');
      if (delBtn) {
        delBtn.addEventListener('click', () => this.handleRemoveDocFromPreset(origIdx));
      }

      this._initKeywordPopoverEvents(row);
      tbody.appendChild(row);
    });
  }

  _renderKeywordsWithPopover(keywords) {
    const kwList = Array.isArray(keywords)
      ? keywords
      : (typeof keywords === 'string' && keywords ? keywords.split(',').map(s => s.trim()).filter(Boolean) : []);

    if (!kwList || kwList.length === 0) {
      return '<span class="italic opacity-50 text-[11px]">-</span>';
    }

    const maxPrimary = 2;
    const primary = kwList.slice(0, maxPrimary);
    const overflow = kwList.slice(maxPrimary);

    const primaryHtml = primary.map(k =>
      `<span class="px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium text-[11px] border border-outline-variant/30 shrink-0 truncate max-w-[120px]" title="${escapeHtml(k)}">${escapeHtml(k)}</span>`
    ).join('');

    if (overflow.length === 0) {
      return `<div class="flex items-center gap-1.5 h-full overflow-hidden">${primaryHtml}</div>`;
    }

    const overflowHtml = overflow.map(k =>
      `<span class="px-1.5 py-0.5 rounded bg-surface-container text-secondary text-[10px] border border-outline-variant/30">${escapeHtml(k)}</span>`
    ).join('');

    return `
      <div class="flex items-center gap-1.5 h-full overflow-visible">
        ${primaryHtml}
        <div class="relative inline-block keyword-popover-container">
          <button type="button" class="btn-kw-popover px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] border border-primary/20 cursor-pointer transition-all flex items-center gap-0.5 shrink-0 select-none" title="Click to view all ${kwList.length} keywords">
            <span>+${overflow.length} more</span>
            <span class="material-symbols-outlined text-[12px]">expand_more</span>
          </button>
          <div class="keyword-popover-card hidden">
            <div class="text-[10px] font-bold text-secondary uppercase font-mono-code mb-1.5 flex items-center justify-between">
              <span>All ${kwList.length} Keyword Aliases</span>
              <span class="text-primary font-bold">100% Match Engine</span>
            </div>
            <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1 custom-pan-scroll">
              ${overflowHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _initKeywordPopoverEvents(parent) {
    if (!parent) return;
    parent.querySelectorAll('.btn-kw-popover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const container = btn.closest('.keyword-popover-container');
        const popover = container?.querySelector('.keyword-popover-card');
        if (!popover) return;
        const isHidden = popover.classList.contains('hidden');
        document.querySelectorAll('.keyword-popover-card:not(.hidden)').forEach(p => p.classList.add('hidden'));
        if (isHidden) {
          popover.classList.remove('hidden');
        }
      });
    });
  }

  renderShortcutsTable() {
    const sTbody = document.getElementById('shortcutsTableBody');
    if (!sTbody) return;

    sTbody.innerHTML = '';
    const sCountBadge = document.getElementById('shortcutsCountBadge');
    const totalCount = this.shortcuts21.length;
    const sq = (this._shortcutsSearchQuery || '').trim().toLowerCase();

    const filtered = sq ? this.shortcuts21.filter(s => {
      const codes = Array.isArray(s.codes) && s.codes.length > 0 ? s.codes : (s.code ? [s.code] : []);
      const codeMatch = codes.some(c => (c || '').toLowerCase().includes(sq));
      const canonical = (s.canonical || s.label || '').toLowerCase();
      const kw = (Array.isArray(s.keywords) ? s.keywords.join(' ') : (s.keywords || '')).toLowerCase();
      return codeMatch || canonical.includes(sq) || kw.includes(sq);
    }) : this.shortcuts21;

    if (sCountBadge) {
      sCountBadge.textContent = sq ? `${filtered.length} / ${totalCount}` : String(totalCount);
    }

    if (filtered.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="5" class="py-6 text-center text-secondary italic">No shortcuts match "${this._shortcutsSearchQuery}".</td>`;
      sTbody.appendChild(emptyRow);
      return;
    }

    filtered.forEach((s, idx) => {
      const sRow = document.createElement('tr');
      sRow.className = 'row-compact-42 hover:bg-surface-container-low transition-colors group';
      const codesList = Array.isArray(s.codes) && s.codes.length > 0 ? s.codes : (s.code ? [s.code] : []);
      const chipsHtml = codesList.map(c =>
        `<span class="px-1.5 py-0.5 rounded font-mono-code font-bold text-[10px] ${getShortcutBadgeColor(c)}">${c}</span>`
      ).join(' ');

      sRow.innerHTML = `
        <td class="py-1 px-3 text-center text-secondary font-mono-code text-[11px]" style="width: 44px;">${idx + 1}</td>
        <td class="py-1 px-3 whitespace-normal" style="width: 15%;"><div class="flex flex-wrap gap-1 max-h-[30px] overflow-hidden">${chipsHtml}</div></td>
        <td class="py-1 px-3 font-semibold text-on-surface truncate text-[12px]" style="width: 25%;" title="${escapeHtml(s.canonical || s.label)}">${escapeHtml(s.canonical || s.label)}</td>
        <td class="py-1 px-3 text-secondary text-[11px] overflow-visible relative" style="width: 46%;">${this._renderKeywordsWithPopover(s.keywords)}</td>
        <td class="py-1 px-3 text-right whitespace-nowrap pr-4" style="width: 80px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-shortcut" title="Edit shortcut" type="button" data-code="${s.code || codesList[0]}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-shortcut" title="Delete shortcut" type="button" data-code="${s.code || codesList[0]}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;

      const sEditBtn = sRow.querySelector('.btn-edit-shortcut');
      if (sEditBtn) {
        sEditBtn.addEventListener('click', () => this.handleEditShortcut(s.code || codesList[0]));
      }
      const sDelBtn = sRow.querySelector('.btn-del-shortcut');
      if (sDelBtn) {
        sDelBtn.addEventListener('click', () => this.handleRemoveShortcut(s.code || codesList[0]));
      }
      this._initKeywordPopoverEvents(sRow);
      sTbody.appendChild(sRow);
    });
  }

  handleSwitchActivePreset(newPreset) {
    if (!newPreset || !this.state.documentPresets[newPreset]) return;
    this.state.activePreset = newPreset;
    this.savePresetsAndSettings();

    // Re-evaluate unmatched files against newly selected preset
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this.renderSettingsModal('presets');
    toast.show('Preset Switched', `Active preset: ${newPreset}`, 'success');
  }

  handleNewPreset() {
    const name = window.prompt('Enter name for the new document preset (e.g. CET CELL, MSBNPE):');
    if (!name || !name.trim()) return;
    const cleanPreset = name.trim().toUpperCase();
    if (this.state.documentPresets[cleanPreset]) {
      toast.show('Preset Exists', `Preset "${cleanPreset}" already exists.`, 'warning');
      return;
    }
    this.state.documentPresets[cleanPreset] = [];
    this.handleSwitchActivePreset(cleanPreset);
    toast.show('Preset Created', `New preset "${cleanPreset}" created. You can now add documents to it.`, 'success');
  }

  handleCopyPreset() {
    const srcPreset = this.state.activePreset;
    const list = this.state.documentPresets[srcPreset] || [];
    let newName = `${srcPreset} 2`;
    let counter = 2;
    while (this.state.documentPresets[newName]) {
      counter++;
      newName = `${srcPreset} ${counter}`;
    }
    const entered = window.prompt(`Copy preset "${srcPreset}" to new name:`, newName);
    if (!entered || !entered.trim()) return;
    const cleanNew = entered.trim().toUpperCase();
    if (this.state.documentPresets[cleanNew]) {
      toast.show('Duplicate Preset', `Preset "${cleanNew}" already exists.`, 'warning');
      return;
    }
    this.state.documentPresets[cleanNew] = JSON.parse(JSON.stringify(list));
    this.handleSwitchActivePreset(cleanNew);
    toast.show('Preset Copied', `Copied "${srcPreset}" to "${cleanNew}".`, 'success');
  }

  handleRenamePreset() {
    const currentName = this.state.activePreset;
    const newName = window.prompt(`Rename preset "${currentName}" to:`, currentName);
    if (!newName || !newName.trim() || newName.trim().toUpperCase() === currentName) return;
    const cleanNew = newName.trim().toUpperCase();
    if (this.state.documentPresets[cleanNew]) {
      toast.show('Duplicate Name', `Preset "${cleanNew}" already exists.`, 'warning');
      return;
    }
    this.state.documentPresets[cleanNew] = this.state.documentPresets[currentName];
    delete this.state.documentPresets[currentName];
    this.handleSwitchActivePreset(cleanNew);
    toast.show('Preset Renamed', `Preset renamed to "${cleanNew}".`, 'success');
  }

  handleDeletePreset() {
    const presetKeys = Object.keys(this.state.documentPresets);
    if (presetKeys.length <= 1) {
      toast.show('Cannot Delete', 'At least one preset must remain.', 'warning');
      return;
    }
    const toDelete = this.state.activePreset;
    const confirmDel = window.confirm(`Are you sure you want to delete preset "${toDelete}"?`);
    if (!confirmDel) return;
    delete this.state.documentPresets[toDelete];
    const remaining = Object.keys(this.state.documentPresets);
    this.state.activePreset = remaining[0] || 'MAHA DBT';
    this.savePresetsAndSettings();
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this.renderSettingsModal('presets');
    toast.show('Preset Deleted', `Preset "${toDelete}" deleted. Switched to ${this.state.activePreset}.`, 'info');
  }

  handleResetPresetsDefault() {
    const confirmReset = window.confirm('Reset document presets to factory defaults? All custom presets will be removed and default 4 presets restored.');
    if (!confirmReset) return;

    this.state.documentPresets = JSON.parse(JSON.stringify(BUILTIN_PRESETS));
    this.state.activePreset = 'MAHA DBT';
    this.state.customShortcuts = [];
    this.shortcuts21 = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    this.savePresetsAndSettings();
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this.renderSettingsModal('presets');
    toast.show('Reset Complete', 'Document presets restored to factory defaults.', 'success');
  }

  handleRemoveDocFromPreset(idx) {
    const list = this.state.documentPresets[this.state.activePreset];
    if (list && list[idx]) {
      const removed = list.splice(idx, 1)[0];
      this.savePresetsAndSettings();
      this._recalculateTargetNames(true);
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      this.renderSettingsModal('presets');
      toast.show('Document Removed from Preset', `${removed.name || 'Document'} unlinked from "${this.state.activePreset}". Global shortcut preserved.`, 'info');
    }
  }

  handleRemoveShortcut(code) {
    if (!code) return;
    const cleanCode = String(code).trim().toUpperCase();
    const targetShortcut = this.shortcuts21.find(s =>
      (s.code && s.code.toUpperCase() === cleanCode) ||
      (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === cleanCode))
    );
    const targetCanon = (targetShortcut?.canonical || targetShortcut?.label || cleanCode).toUpperCase();

    // 1. Remove from master shortcuts list
    if (targetShortcut) {
      this.shortcuts21 = this.shortcuts21.filter(s => s !== targetShortcut);
    } else {
      this.shortcuts21 = this.shortcuts21.filter(s => s.code.toUpperCase() !== cleanCode);
    }

    // 2. Remove from custom shortcuts persistence
    if (this.state.customShortcuts) {
      this.state.customShortcuts = this.state.customShortcuts.filter(s => {
        if (s === targetShortcut) return false;
        if (s.code && s.code.toUpperCase() === cleanCode) return false;
        if (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === cleanCode)) return false;
        const sCanon = (s.canonical || s.label || '').toUpperCase();
        if (sCanon && sCanon === targetCanon) return false;
        return true;
      });
    }

    // 3. Single Source of Truth: Also unlink from all Presets
    let unlinkedPresetCount = 0;
    if (this.state.documentPresets) {
      for (const presetKey of Object.keys(this.state.documentPresets)) {
        const list = this.state.documentPresets[presetKey];
        if (Array.isArray(list)) {
          const prevLen = list.length;
          this.state.documentPresets[presetKey] = list.filter(d => {
            const dCanon = (d.name || '').trim().toUpperCase();
            const dCode = (d.code || '').trim().toUpperCase();
            if (dCanon && dCanon === targetCanon) return false;
            if (dCode && dCode === cleanCode) return false;
            return true;
          });
          if (list.length < prevLen) unlinkedPresetCount++;
        }
      }
    }

    this.savePresetsAndSettings();
    this.renderSettingsModal('shortcuts');
    toast.show('Shortcut Removed', `Removed "${targetCanon}" and unlinked from ${unlinkedPresetCount} preset(s).`, 'info');
  }

  openEditDocumentModal(doc, idx) {
    this._editingDocIdx = idx;
    this._editingShortcutCode = null;
    this.openAddDocumentModal(doc, false);
  }

  handleEditShortcut(code) {
    const cleanCode = (code || '').toUpperCase();
    const s = this.resolveShortcut(cleanCode) || this.shortcuts21.find(x =>
      (x.code && x.code.toUpperCase() === cleanCode) ||
      (Array.isArray(x.codes) && x.codes.some(c => c && c.toUpperCase() === cleanCode))
    );
    if (!s) return;
    const cs = (this.state.customShortcuts || []).find(x =>
      (x.code && x.code.toUpperCase() === cleanCode) ||
      (Array.isArray(x.codes) && x.codes.some(c => c && c.toUpperCase() === cleanCode))
    );
    this._editingShortcutCode = cleanCode;
    this._editingDocIdx = null;
    const codes = Array.isArray(s.codes) && s.codes.length > 0 ? s.codes : [s.code || cleanCode];
    this.openAddDocumentModal({
      code: s.code || cleanCode,
      codes: codes,
      name: s.canonical || s.label,
      keywords: cs ? cs.keywords : (s.keywords || [])
    }, true);
  }

  findAvailableShortcutCode(baseCode, targetCanonical = '') {
    if (!baseCode) return '';
    const cleanBase = String(baseCode).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanBase) return '';
    const targetCanon = (targetCanonical || '').trim().toUpperCase();

    const isCodeTaken = (codeToCheck) => {
      // 1. Check active modal chips
      if (this._currentShortcutCodes && this._currentShortcutCodes.some(c => c && c.toUpperCase() === codeToCheck)) {
        return true;
      }
      // 2. Check master & custom shortcuts
      const allShortcuts = [...(this.shortcuts21 || []), ...(this.state.customShortcuts || [])];
      for (const s of allShortcuts) {
        const sCanon = (s.canonical || s.label || s.name || '').trim().toUpperCase();
        if (targetCanon && sCanon === targetCanon) continue;
        if (s.code && s.code.toUpperCase() === codeToCheck) return true;
        if (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === codeToCheck)) return true;
      }
      // 3. Check preset documents
      const allDocs = this.getAllPresetDocuments();
      for (const d of allDocs) {
        const dCanon = (d.name || '').trim().toUpperCase();
        if (targetCanon && dCanon === targetCanon) continue;
        if (d.code && d.code.toUpperCase() === codeToCheck) return true;
      }
      return false;
    };

    if (!isCodeTaken(cleanBase)) {
      return cleanBase;
    }

    let suffix = 2;
    let candidate = `${cleanBase}${suffix}`;
    while (isCodeTaken(candidate)) {
      suffix++;
      candidate = `${cleanBase}${suffix}`;
    }
    return candidate;
  }

  renderShortcutChips(highlightCode = null) {
    const container = document.getElementById('containerShortcutChips');
    if (!container) return;
    container.innerHTML = '';
    if (!this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.className = 'text-secondary text-[11px] italic select-none';
      placeholder.textContent = 'No short codes added. Type code above and click Add or press Enter.';
      container.appendChild(placeholder);
      return;
    }
    this._currentShortcutCodes.forEach(code => {
      const isHighlighted = highlightCode && highlightCode.toUpperCase() === code.toUpperCase();
      const chip = document.createElement('span');
      chip.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary text-white font-mono-code font-bold text-[11px] shadow-xs select-none transition-all duration-300 ${isHighlighted ? 'chip-glow-anim ring-2 ring-primary ring-offset-2' : ''}`;
      chip.dataset.code = code;

      const textSpan = document.createElement('span');
      textSpan.textContent = code;
      chip.appendChild(textSpan);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'hover:bg-white/20 rounded p-0.5 inline-flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors';
      delBtn.title = `Remove ${code}`;
      delBtn.innerHTML = '<span class="material-symbols-outlined text-[13px]">close</span>';
      delBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._currentShortcutCodes = this._currentShortcutCodes.filter(c => c !== code);
        this.renderShortcutChips();
        // If aliases were auto-generated, refresh with updated chips
        const inputName = document.getElementById('inputAddDocName');
        const inputAliases = document.getElementById('inputAddDocAliases');
        if (!this._aliasesManuallyEdited && inputName?.value.trim()) {
          if (inputAliases) inputAliases.value = generateSmartKeywords(inputName.value, this._currentShortcutCodes);
          this.validateKeywordsInput();
        }
      });
      chip.appendChild(delBtn);
      container.appendChild(chip);
    });
  }

  renderPresetPills() {
    const container = document.getElementById('containerPresetPills');
    if (!container) return;
    container.innerHTML = '';
    const allPresets = Object.keys(this.state.documentPresets || BUILTIN_PRESETS);
    if (allPresets.length === 0) {
      container.innerHTML = '<span class="text-secondary text-[11px] italic">No presets available.</span>';
      return;
    }

    allPresets.forEach(presetKey => {
      const isSelected = this._selectedPresetKeys && this._selectedPresetKeys.has(presetKey);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = isSelected
        ? 'inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0037b0] text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all border border-[#0037b0]'
        : 'inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface text-secondary hover:text-on-surface font-medium text-[11px] cursor-pointer transition-all border border-outline-variant/50 hover:border-primary/50';

      pill.innerHTML = `
        <span class="material-symbols-outlined text-[13px] ${isSelected ? 'font-bold' : 'opacity-40'}">${isSelected ? 'check' : 'add'}</span>
        <span>${escapeHtml(presetKey)}</span>
      `;
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this._selectedPresetKeys) this._selectedPresetKeys = new Set();
        if (this._selectedPresetKeys.has(presetKey)) {
          this._selectedPresetKeys.delete(presetKey);
        } else {
          this._selectedPresetKeys.add(presetKey);
        }
        this.renderPresetPills();
      });
      container.appendChild(pill);
    });
    this.updatePresetFeedbackBanner();
  }

  updatePresetFeedbackBanner() {
    const banner = document.getElementById('dynamicPresetFeedback');
    const textEl = document.getElementById('dynamicPresetFeedbackText');
    if (!banner || !textEl) return;

    const count = this._selectedPresetKeys ? this._selectedPresetKeys.size : 0;
    if (count === 0) {
      banner.className = 'p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] flex items-start gap-2 mt-1';
      const icon = banner.querySelector('.material-symbols-outlined');
      if (icon) icon.className = 'material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5';
      textEl.innerHTML = '<strong>Shortcut Only:</strong> No presets selected. This will be saved purely as a <em>Keyboard Shortcut &amp; Rename Rule</em> without appearing in any preset checklist.';
    } else {
      banner.className = 'p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-on-surface text-[11px] flex items-start gap-2 mt-1';
      const icon = banner.querySelector('.material-symbols-outlined');
      if (icon) icon.className = 'material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5';
      const list = Array.from(this._selectedPresetKeys).join(', ');
      textEl.innerHTML = `<strong>Dual Save:</strong> Will be added to <strong>Shortcuts &amp; Rename Rules</strong> AND simultaneously included in preset checklists for: <strong>${escapeHtml(list)}</strong>.`;
    }
  }

  validateKeywordsInput() {
    const inputAliases = document.getElementById('inputAddDocAliases');
    const btnSave = document.getElementById('btnSaveAddDoc');
    const hint = document.getElementById('hintKeywordsValidation');
    const val = (inputAliases?.value || '').trim();
    const isValid = val.length > 0;
    if (btnSave) {
      btnSave.disabled = !isValid;
    }
    if (hint) {
      hint.classList.toggle('hidden', isValid);
    }
    return isValid;
  }

  openAddDocumentModal(editDoc = null, fromShortcutsTab = false) {
    const modal = document.getElementById('modalAddDocument');
    if (!modal) return;
    const containerCode = document.getElementById('containerAddDocCode');
    const inputCode = document.getElementById('inputAddDocCode');
    const inputName = document.getElementById('inputAddDocName');
    const inputAliases = document.getElementById('inputAddDocAliases');
    const previewEl = document.getElementById('addDocTargetPreview');
    const titleEl = modal.querySelector('h3');
    const subTitleEl = modal.querySelector('p');

    // Short codes are ALWAYS visible in the unified modal
    if (containerCode) containerCode.classList.remove('hidden');
    if (subTitleEl) subTitleEl.textContent = 'Define document name, short code(s), keywords, and preset assignments';

    this._fromShortcutsTab = Boolean(fromShortcutsTab);
    this._selectedPresetKeys = new Set();
    this._aliasesManuallyEdited = false;

    if (editDoc) {
      const targetCanon = (editDoc.name || editDoc.canonical || '').trim().toUpperCase();
      const targetCode = (editDoc.code || (Array.isArray(editDoc.codes) ? editDoc.codes[0] : '')).trim().toUpperCase();

      // Find all presets containing this document
      if (this.state.documentPresets) {
        for (const [presetKey, list] of Object.entries(this.state.documentPresets)) {
          if (Array.isArray(list)) {
            const hasDoc = list.some(d => {
              const dCanon = (d.name || '').trim().toUpperCase();
              const dCode = (d.code || '').trim().toUpperCase();
              return (targetCanon && dCanon === targetCanon) || (targetCode && dCode === targetCode);
            });
            if (hasDoc) {
              this._selectedPresetKeys.add(presetKey);
            }
          }
        }
      }

      if (!fromShortcutsTab && this.state.activePreset) {
        this._selectedPresetKeys.add(this.state.activePreset);
      }

      let initialCodes = [];
      if (Array.isArray(editDoc.codes) && editDoc.codes.length > 0) {
        initialCodes = [...editDoc.codes];
      } else if (editDoc.code) {
        initialCodes = [editDoc.code];
      } else {
        const found = this.shortcuts21.find(s => (s.canonical || s.label || '').toUpperCase() === targetCanon);
        if (found) {
          initialCodes = Array.isArray(found.codes) && found.codes.length > 0 ? [...found.codes] : [found.code];
        }
      }
      this._currentShortcutCodes = initialCodes;

      if (titleEl) titleEl.textContent = 'Edit Document Type';
      if (inputCode) inputCode.value = '';
      if (inputName) inputName.value = editDoc.name || editDoc.canonical || '';
      if (inputAliases) {
        inputAliases.value = Array.isArray(editDoc.keywords) ? editDoc.keywords.join(', ') : (editDoc.keywords || '');
        if (inputAliases.value.trim()) this._aliasesManuallyEdited = true;
      }
    } else {
      this._editingDocIdx = null;
      this._editingShortcutCode = null;
      this._currentShortcutCodes = [];

      // If opened from Presets tab, pre-select active preset
      if (!fromShortcutsTab && this.state.activePreset) {
        this._selectedPresetKeys.add(this.state.activePreset);
      }

      if (titleEl) titleEl.textContent = 'Add Document Type';
      if (inputCode) inputCode.value = '';
      if (inputName) inputName.value = '';
      if (inputAliases) inputAliases.value = '';
    }

    this.renderShortcutChips();
    this.renderPresetPills();

    const updatePreview = () => {
      const docName = inputName?.value.trim() || 'DOCUMENT';
      const effStudent = this.getEffectiveStudentName();
      const formula = buildName(docName, effStudent, null, this.state.style);
      const cleanBase = formula.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
      if (previewEl) previewEl.textContent = cleanBase;
    };

    if (inputName) {
      inputName.oninput = () => {
        updatePreview();
        // If keywords field is empty or was not manually customized, live auto-generate smart keywords
        if (!this._aliasesManuallyEdited) {
          const autoKws = generateSmartKeywords(inputName.value, this._currentShortcutCodes);
          if (inputAliases) inputAliases.value = autoKws;
        }
        this.validateKeywordsInput();
      };
      inputName.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSaveDocumentType();
        }
      };
    }

    const addShortcutChip = () => {
      const rawVal = (inputCode?.value || '').trim().toUpperCase();
      const val = rawVal.replace(/[^A-Z0-9_-]/g, '');
      if (!val) return;

      // 1. Self-duplicate check within current document chips
      if (this._currentShortcutCodes && this._currentShortcutCodes.includes(val)) {
        if (inputCode) {
          inputCode.classList.add('shake-anim', 'border-primary');
          setTimeout(() => inputCode.classList.remove('shake-anim', 'border-primary'), 600);
        }
        this.renderShortcutChips(val);
        toast.show('Code Already Added', `Code "${val}" is already added as a chip.`, 'info');
        if (inputCode) inputCode.value = '';
        return;
      }

      // 2. Cross-document collision check with auto-suffixing
      const currentCanon = (inputName?.value || '').trim().toUpperCase();
      let assignedDoc = null;
      const allShortcuts = [...(this.shortcuts21 || []), ...(this.state.customShortcuts || [])];
      for (const s of allShortcuts) {
        const sCanon = (s.canonical || s.label || s.name || '').trim().toUpperCase();
        if (currentCanon && sCanon === currentCanon) continue;
        if (s.code && s.code.toUpperCase() === val) { assignedDoc = sCanon; break; }
        if (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === val)) { assignedDoc = sCanon; break; }
      }

      if (!this._currentShortcutCodes) this._currentShortcutCodes = [];

      if (assignedDoc) {
        const suffixedCode = this.findAvailableShortcutCode(val, currentCanon);
        this._currentShortcutCodes.push(suffixedCode);
        this.renderShortcutChips(suffixedCode);
        toast.show('Auto-Numbered Code', `Code "${val}" is assigned to "${assignedDoc}". Auto-assigned "${suffixedCode}".`, 'info');
      } else {
        this._currentShortcutCodes.push(val);
        this.renderShortcutChips();
      }

      // Refresh auto-generated keywords if not manually edited
      if (!this._aliasesManuallyEdited && inputName?.value.trim()) {
        const autoKws = generateSmartKeywords(inputName.value, this._currentShortcutCodes);
        if (inputAliases) inputAliases.value = autoKws;
      }
      this.validateKeywordsInput();

      if (inputCode) inputCode.value = '';
      inputCode?.focus();
    };

    const btnAddChip = document.getElementById('btnAddShortcutChip');
    if (btnAddChip) {
      btnAddChip.onclick = (e) => {
        e.preventDefault();
        addShortcutChip();
      };
    }

    if (inputCode) {
      inputCode.oninput = () => {
        inputCode.value = inputCode.value.toUpperCase();
      };
      inputCode.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if ((inputCode.value || '').trim()) {
            addShortcutChip();
          } else {
            inputName?.focus();
          }
        }
      };
    }

    // Auto-Generate Keywords Button
    const btnAutoKeywords = document.getElementById('btnAutoGenerateKeywords');
    if (btnAutoKeywords) {
      btnAutoKeywords.onclick = (e) => {
        e.preventDefault();
        const currentName = (inputName?.value || '').trim();
        if (!currentName) {
          toast.show('Document Name Required', 'Please enter Full Document Name first to generate smart keywords.', 'info');
          inputName?.focus();
          return;
        }
        const autoKws = generateSmartKeywords(currentName, this._currentShortcutCodes);
        if (inputAliases) {
          inputAliases.value = autoKws;
          this._aliasesManuallyEdited = false;
          this.validateKeywordsInput();
          toast.show('Keywords Auto-Generated', 'Smart Indian academic aliases generated.', 'success');
        }
      };
    }

    if (inputAliases) {
      inputAliases.oninput = () => {
        this._aliasesManuallyEdited = true;
        this.validateKeywordsInput();
      };
    }

    updatePreview();
    this.validateKeywordsInput();
    modal.classList.remove('hidden');
    if (inputName) {
      inputName.focus();
    }
  }

  closeAddDocumentModal() {
    const modal = document.getElementById('modalAddDocument');
    if (modal) modal.classList.add('hidden');
    this._editingDocIdx = null;
    this._editingShortcutCode = null;
    this._fromShortcutsTab = false;
    this._currentShortcutCodes = [];
    this._selectedPresetKeys = new Set();
    this._aliasesManuallyEdited = false;
  }

  handleSaveDocumentType() {
    const inputCode = document.getElementById('inputAddDocCode');
    const inputName = document.getElementById('inputAddDocName');
    const inputAliases = document.getElementById('inputAddDocAliases');

    const rawName = (inputName?.value || '').trim();
    if (!rawName) {
      toast.show('Document Name Required', 'Please enter a Full Document Name.', 'warning');
      inputName?.focus();
      return;
    }

    const docName = rawName.toUpperCase();
    const rawAliases = (inputAliases?.value || '').trim();
    if (!rawAliases) {
      toast.show('Keywords Required', 'Keywords / Aliases are required for smart scanning & auto-matching.', 'warning');
      inputAliases?.focus();
      this.validateKeywordsInput();
      return;
    }

    // Process keywords
    const rawTokens = rawAliases.split(',')
      .map(s => s.trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, ''))
      .filter(s => s.length >= 2);
    const keywords = Array.from(new Set(rawTokens));

    // Commit any pending shortcode in the input
    const pendingRaw = (inputCode?.value || '').trim().toUpperCase();
    if (pendingRaw) {
      const cleanCode = pendingRaw.replace(/[^A-Z0-9_-]/g, '');
      if (cleanCode && !this._currentShortcutCodes.includes(cleanCode)) {
        const finalCode = this.findAvailableShortcutCode(cleanCode, docName);
        this._currentShortcutCodes.push(finalCode);
      }
    }

    // Auto-generate a shortcode if none provided
    if (!this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
      const words = docName.split(/[\s_-]+/).filter(w => w.length > 0);
      let candidate = '';
      if (words.length >= 2) {
        candidate = (words[0][0] + words[1][0] + (words[2] ? words[2][0] : '')).toUpperCase();
      } else {
        candidate = docName.substring(0, 3).toUpperCase();
      }
      const autoCode = this.findAvailableShortcutCode(candidate || 'DOC', docName);
      this._currentShortcutCodes.push(autoCode);
    }

    const codes = [...this._currentShortcutCodes];
    const primaryCode = codes[0];

    // Determine target old identifier if editing
    let oldCanon = null;
    let oldCode = null;
    if (this._editingShortcutCode) {
      oldCode = this._editingShortcutCode.toUpperCase();
      const oldShortcut = this.shortcuts21.find(s =>
        (s.code && s.code.toUpperCase() === oldCode) ||
        (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === oldCode))
      );
      oldCanon = (oldShortcut?.canonical || oldShortcut?.label || '').toUpperCase();
    } else if (this._editingDocIdx !== null && this._editingDocIdx !== undefined) {
      const activeList = this.state.documentPresets[this.state.activePreset];
      if (activeList && activeList[this._editingDocIdx]) {
        oldCanon = (activeList[this._editingDocIdx].name || '').toUpperCase();
        oldCode = (activeList[this._editingDocIdx].code || '').toUpperCase();
      }
    }

    // 1. Clean existing master shortcut if updating
    if (oldCode || oldCanon) {
      this.shortcuts21 = this.shortcuts21.filter(s => {
        const sCanon = (s.canonical || s.label || '').toUpperCase();
        const sCode = (s.code || '').toUpperCase();
        if (oldCode && (sCode === oldCode || (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === oldCode)))) return false;
        if (oldCanon && sCanon === oldCanon) return false;
        return true;
      });
      if (this.state.customShortcuts) {
        this.state.customShortcuts = this.state.customShortcuts.filter(s => {
          const sCanon = (s.canonical || s.label || '').toUpperCase();
          const sCode = (s.code || '').toUpperCase();
          if (oldCode && (sCode === oldCode || (Array.isArray(s.codes) && s.codes.some(c => c && c.toUpperCase() === oldCode)))) return false;
          if (oldCanon && sCanon === oldCanon) return false;
          return true;
        });
      }
    }

    // 2. Insert into master registry
    const shortcutObj = {
      code: primaryCode,
      codes: codes,
      label: docName,
      canonical: docName,
      keywords: keywords
    };

    this.shortcuts21.push(shortcutObj);
    if (!this.state.customShortcuts) this.state.customShortcuts = [];
    this.state.customShortcuts.push(shortcutObj);

    codes.forEach(c => {
      registerDocumentSignature({
        canonical: docName,
        code: c,
        primaryKeywords: [docName.toLowerCase(), c.toLowerCase()],
        secondaryKeywords: keywords
      });
    });

    updateCanonicalName(docName, docName);
    updateDocumentPattern(primaryCode, docName, keywords);
    MASTER_DOCUMENTS_MAP.set(primaryCode, {
      code: primaryCode,
      canonical: docName,
      label: docName,
      keywords
    });
    if (oldCanon && oldCanon !== docName) {
      removeCanonicalName(oldCanon);
      updateCanonicalName(oldCanon, docName);
      for (const f of this.state.files) {
        if (f.docType && f.docType.toUpperCase() === oldCanon) {
          f.docType = docName;
          f.smartDocType = docName;
        }
      }
    }

    // 3. Synchronize across ALL presets
    const selectedPresets = this._selectedPresetKeys || new Set();
    if (!this.state.documentPresets) this.state.documentPresets = {};

    for (const presetKey of Object.keys(this.state.documentPresets)) {
      if (!Array.isArray(this.state.documentPresets[presetKey])) {
        this.state.documentPresets[presetKey] = [];
      }
      const list = this.state.documentPresets[presetKey];

      if (selectedPresets.has(presetKey)) {
        // Document should be present in this preset
        const existingIdx = list.findIndex(d => {
          const dCanon = (d.name || '').trim().toUpperCase();
          const dCode = (d.code || '').trim().toUpperCase();
          if (oldCanon && dCanon === oldCanon) return true;
          if (oldCode && dCode === oldCode) return true;
          if (dCanon === docName) return true;
          if (dCode === primaryCode) return true;
          return false;
        });

        const entry = { name: docName, code: primaryCode, keywords };
        if (existingIdx !== -1) {
          list[existingIdx] = entry;
        } else {
          list.push(entry);
        }
      } else {
        // Document is NOT selected for this preset - unlink if it previously existed
        if (oldCanon || oldCode) {
          this.state.documentPresets[presetKey] = list.filter(d => {
            const dCanon = (d.name || '').trim().toUpperCase();
            const dCode = (d.code || '').trim().toUpperCase();
            if (oldCanon && dCanon === oldCanon) return false;
            if (oldCode && dCode === oldCode) return false;
            return true;
          });
        }
      }
    }

    const wasFromShortcuts = this._fromShortcutsTab;
    this.closeAddDocumentModal();
    this.savePresetsAndSettings();
    this.syncPresetsToShortcuts();
    syncCanonicalNames(this.getAllPresetDocuments());
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this.renderSettingsModal(wasFromShortcuts ? 'shortcuts' : 'presets');
    if (selectedPresets.size === 0) {
      toast.show('Shortcut Saved', `"${docName}" saved purely as Keyboard Shortcut & Rename Rule.`, 'success');
    } else {
      toast.show('Document Type Saved', `"${docName}" saved to Shortcuts & included in ${selectedPresets.size} preset(s).`, 'success');
    }
  }

  /* ==========================================================================
     Cross-Check Powerhouse: Live Word Diff, Pattern Bar & Power Utilities
     ========================================================================== */

  _initCrossCheckEvents() {
    const modal = document.getElementById('modalCrossCheck');
    if (!modal) return;

    // Close / Cancel buttons
    const btnClose = document.getElementById('btnCloseCrossCheckModal');
    if (btnClose) btnClose.addEventListener('click', () => this.closeCrossCheckModal());
    const btnCancel = document.getElementById('btnCancelCrossCheck');
    if (btnCancel) btnCancel.addEventListener('click', () => this.closeCrossCheckModal());

    // Confirm button
    const btnConfirm = document.getElementById('btnConfirmBatchRename');
    if (btnConfirm) btnConfirm.addEventListener('click', () => this.handleConfirmCrossCheckRename());

    // Pattern Bar: Order pills
    modal.querySelectorAll('[data-pattern-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this._crossCheckState) return;
        this._crossCheckState.order = btn.dataset.patternOrder;
        modal.querySelectorAll('[data-pattern-order]').forEach(b => b.classList.toggle('active', b === btn));
        this._recalculateAndRenderCrossCheck(true);
      });
    });

    // Pattern Bar: Student Name Toggle
    const btnStudentToggle = document.getElementById('btnToggleCrossCheckStudent');
    const studentToggleLabel = document.getElementById('crossCheckStudentToggleLabel');
    if (btnStudentToggle) {
      btnStudentToggle.addEventListener('click', () => {
        if (!this._crossCheckState) return;
        this._crossCheckState.includeStudent = !this._crossCheckState.includeStudent;
        const isOn = this._crossCheckState.includeStudent;
        if (studentToggleLabel) {
          studentToggleLabel.textContent = isOn ? 'ON' : 'OFF';
        }
        btnStudentToggle.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${isOn ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
          }`;
        this._recalculateAndRenderCrossCheck(true);
      });
    }

    // Pattern Bar: Casing pills
    modal.querySelectorAll('[data-pattern-case]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this._crossCheckState) return;
        this._crossCheckState.casing = btn.dataset.patternCase;
        modal.querySelectorAll('[data-pattern-case]').forEach(b => b.classList.toggle('active', b === btn));
        this._recalculateAndRenderCrossCheck(true);
      });
    });

    // Pattern Bar: Filter pills
    modal.querySelectorAll('[data-pattern-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this._crossCheckState) return;
        this._crossCheckState.filter = btn.dataset.patternFilter;
        modal.querySelectorAll('[data-pattern-filter]').forEach(b => b.classList.toggle('active', b === btn));
        this._renderCrossCheckRows();
      });
    });

    // Move Duplicates 1-Click Button (Modal Toolbar)
    const btnModalMoveDup = document.getElementById('btnModalMoveDuplicates');
    if (btnModalMoveDup) {
      btnModalMoveDup.addEventListener('click', () => this.handleMoveModalDuplicates());
    }

    // Power Utilities Toggle Button
    const btnToggleUtilities = document.getElementById('btnTogglePowerUtilities');
    const stripUtilities = document.getElementById('stripPowerUtilities');
    const arrowUtilities = document.getElementById('powerUtilitiesArrow');
    if (btnToggleUtilities && stripUtilities) {
      btnToggleUtilities.addEventListener('click', () => {
        const isHidden = stripUtilities.classList.contains('hidden');
        stripUtilities.classList.toggle('hidden', !isHidden);
        stripUtilities.classList.toggle('flex', isHidden);
        btnToggleUtilities.classList.toggle('bg-amber-100', isHidden);
        btnToggleUtilities.classList.toggle('text-amber-800', isHidden);
        btnToggleUtilities.classList.toggle('border-amber-300', isHidden);
        btnToggleUtilities.classList.toggle('bg-white', !isHidden);
        btnToggleUtilities.classList.toggle('text-slate-700', !isHidden);
        btnToggleUtilities.classList.toggle('border-slate-200', !isHidden);
        if (arrowUtilities) {
          arrowUtilities.classList.toggle('rotate-180', isHidden);
        }
      });
    }

    // Bulk Find & Replace
    const btnApplyReplace = document.getElementById('btnCrossCheckApplyReplace');
    const inputFind = document.getElementById('inputCrossCheckFind');
    const inputReplace = document.getElementById('inputCrossCheckReplace');
    if (btnApplyReplace && inputFind && inputReplace) {
      btnApplyReplace.addEventListener('click', () => {
        const findVal = inputFind.value;
        const replaceVal = inputReplace.value;
        if (!findVal) {
          toast.show('Find Empty', 'Please enter text to find.', 'info');
          return;
        }
        let count = 0;
        this._getMatchedCrossCheckFiles().forEach(f => {
          const currentTarget = this._getCrossCheckTargetBase(f);
          if (currentTarget.toLowerCase().includes(findVal.toLowerCase())) {
            const regex = new RegExp(findVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const replaced = currentTarget.replace(regex, replaceVal);
            this._crossCheckState.overrides.set(f.id, replaced);
            count++;
          }
        });
        toast.show('Find & Replace', `Replaced in ${count} document(s).`, 'success');
        this._recalculateAndRenderCrossCheck(true);
      });
    }

    // One-Click Scanner Junk Cleaner
    const btnCleanJunk = document.getElementById('btnCrossCheckCleanJunk');
    if (btnCleanJunk) {
      btnCleanJunk.addEventListener('click', () => {
        let count = 0;
        this._getMatchedCrossCheckFiles().forEach(f => {
          const currentBase = this._getCrossCheckTargetBase(f);
          const cleaned = cleanScannerJunk(currentBase);
          if (cleaned !== currentBase) {
            this._crossCheckState.overrides.set(f.id, cleaned);
            count++;
          }
        });
        toast.show('Junk Cleanup', `Cleaned scanner timestamps and prefixes in ${count} document(s).`, 'success');
        this._recalculateAndRenderCrossCheck(true);
      });
    }

    // Portal-Safe Cleaner
    const btnPortalSafe = document.getElementById('btnCrossCheckPortalSafe');
    if (btnPortalSafe) {
      btnPortalSafe.addEventListener('click', () => {
        let count = 0;
        this._getMatchedCrossCheckFiles().forEach(f => {
          const currentBase = this._getCrossCheckTargetBase(f);
          const cleaned = cleanPortalSafe(currentBase);
          if (cleaned !== currentBase) {
            this._crossCheckState.overrides.set(f.id, cleaned);
            count++;
          }
        });
        toast.show('Portal-Safe Cleaned', `Formatted ${count} document(s) for admission portals.`, 'success');
        this._recalculateAndRenderCrossCheck(true);
      });
    }

    // Reset Rules Button
    const btnResetRules = document.getElementById('btnCrossCheckResetPatterns');
    if (btnResetRules) {
      btnResetRules.addEventListener('click', () => {
        this._crossCheckState.overrides.clear();
        this._crossCheckState.order = 'doc_student';
        this._crossCheckState.separator = ' ';
        this._crossCheckState.includeStudent = true;
        this._crossCheckState.casing = (this.state.style || 'upper');
        this._crossCheckState.filter = 'all';

        // Reset pill UI
        modal.querySelectorAll('[data-pattern-order]').forEach(b => b.classList.toggle('active', b.dataset.patternOrder === 'doc_student'));
        modal.querySelectorAll('[data-pattern-case]').forEach(b => b.classList.toggle('active', b.dataset.patternCase === this._crossCheckState.casing));
        modal.querySelectorAll('[data-pattern-filter]').forEach(b => b.classList.toggle('active', b.dataset.patternFilter === 'all'));
        if (studentToggleLabel) studentToggleLabel.textContent = 'ON';
        if (btnStudentToggle) {
          btnStudentToggle.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
        }

        toast.show('Rules Reset', 'Reset patterns to smart auto-match defaults.', 'info');
        this._recalculateAndRenderCrossCheck(true);
      });
    }

    // Select All / Deselect All Checkbox
    const selectAllCb = document.getElementById('chkCrossCheckSelectAll');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        const rows = modal.querySelectorAll('#crossCheckTableBody > div');
        rows.forEach(r => {
          if (r.dataset.fileId) {
            this._crossCheckState.userToggled.set(r.dataset.fileId, e.target.checked);
          }
        });
        this._renderCrossCheckRows();
      });
    }

    // Modal Sort Button (A–Z / Z–A)
    const btnModalSort = document.getElementById('btnModalSort');
    if (btnModalSort) {
      btnModalSort.addEventListener('click', () => this.handleSortDocuments());
    }

    // Keyboard Navigation within Modal
    modal.addEventListener('keydown', (e) => {
      if (modal.classList.contains('hidden')) return;

      const isInput = (e.target.tagName === 'INPUT' && e.target.type === 'text');

      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeCrossCheckModal();
        return;
      }

      if (e.key === 'Enter') {
        if (isInput) {
          if (e.target.id === 'inputCrossCheckFind' || e.target.id === 'inputCrossCheckReplace') {
            e.preventDefault();
            const btnApply = document.getElementById('btnCrossCheckApplyReplace');
            if (btnApply) btnApply.click();
          }
          return;
        }
        e.preventDefault();
        const confirmBtn = document.getElementById('btnConfirmBatchRename');
        if (confirmBtn && !confirmBtn.disabled) {
          this.handleConfirmCrossCheckRename();
        }
        return;
      }

      if (isInput) return;

      const activeRows = Array.from(modal.querySelectorAll('#crossCheckTableBody > div'));
      if (activeRows.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex + 1, activeRows.length - 1);
        this._renderCrossCheckRows();
        const curRow = activeRows[this._crossCheckState.focusedIndex];
        if (curRow) curRow.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this._crossCheckState.focusedIndex = Math.max(this._crossCheckState.focusedIndex - 1, 0);
        this._renderCrossCheckRows();
        const curRow = activeRows[this._crossCheckState.focusedIndex];
        if (curRow) curRow.scrollIntoView({ block: 'nearest' });
      } else if (e.key === ' ') {
        e.preventDefault();
        const curRow = activeRows[this._crossCheckState.focusedIndex];
        if (curRow && curRow.dataset.fileId) {
          const fileId = curRow.dataset.fileId;
          const currentVal = this._crossCheckState.userToggled.get(fileId) ?? false;
          this._crossCheckState.userToggled.set(fileId, !currentVal);
          this._renderCrossCheckRows();
        }
      }
    });

    // Floating Undo Toast Buttons
    const btnUndo = document.getElementById('btnFloatingUndo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.hideFloatingUndoToast();
        this.handleUndo();
      });
    }
    const btnDismiss = document.getElementById('btnDismissFloatingUndo');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        this.hideFloatingUndoToast();
      });
    }
  }

  _highlightFocusedCrossCheckRow(rows) {
    rows.forEach((r, idx) => {
      const isFocused = (idx === this._crossCheckState.focusedIndex);
      r.classList.toggle('keyboard-focused-row', isFocused);
      if (isFocused) {
        r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  _getMatchedCrossCheckFiles() {
    return (this.state.files || []).filter(f => !isJunkFile(f.name));
  }

  _getCrossCheckTargetBase(f) {
    if (this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(f.id)) {
      return this._crossCheckState.overrides.get(f.id);
    }
    const doc = f.docType || f.smartDocType || f.smartMatchedDoc;
    if (doc) return doc;
    const rawStudent = (this.state.studentName || '').replace(/\.[a-zA-Z0-9]+$/i, '').trim();
    let base = cleanName(f.name);
    if (rawStudent) {
      const sRegex = new RegExp(`\\b${rawStudent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
      base = base.replace(sRegex, '').trim();
    }
    return base || cleanName(f.name);
  }

  _getCrossCheckTargetName(f) {
    const rawStudent = (this.state.studentName || '').replace(/\.[a-zA-Z0-9]+$/i, '').trim();
    const extension = f.ext || ext(f.name) || '';
    const baseDoc = this._getCrossCheckTargetBase(f);

    let cleanTarget = '';
    if (this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(f.id)) {
      cleanTarget = applyCase(baseDoc, this._crossCheckState.casing);
    } else {
      cleanTarget = formatPatternName(baseDoc, rawStudent, {
        order: this._crossCheckState ? this._crossCheckState.order : 'doc_student',
        separator: this._crossCheckState ? this._crossCheckState.separator : ' ',
        includeStudent: this._crossCheckState ? this._crossCheckState.includeStudent : true,
        casing: this._crossCheckState ? this._crossCheckState.casing : (this.state.style || 'upper')
      });
    }
    return `${cleanTarget}${extension}`;
  }

  openCrossCheckModal() {
    const allFiles = this._getMatchedCrossCheckFiles();
    if (allFiles.length === 0) {
      toast.show('No Documents', 'Please select a folder first to bulk rename.', 'info');
      return;
    }

    const modal = document.getElementById('modalCrossCheck');
    if (!modal) return;

    // Initialize Cross-Check session state
    this._crossCheckState = {
      order: 'doc_student',
      separator: ' ',
      includeStudent: true,
      casing: (this.state.style || 'upper'),
      filter: 'all',
      overrides: new Map(),
      userToggled: new Map(),
      focusedIndex: 0
    };

    // Auto-evaluate initial checkboxes: Perfect files unchecked by default, others checked!
    allFiles.forEach(f => {
      const targetName = this._getCrossCheckTargetName(f);
      const isPerfect = (cleanName(f.name) === cleanName(targetName));
      this._crossCheckState.userToggled.set(f.id, !isPerfect);
    });

    // Reset pattern pills UI to initial state
    modal.querySelectorAll('[data-pattern-order]').forEach(b => b.classList.toggle('active', b.dataset.patternOrder === 'doc_student'));
    modal.querySelectorAll('[data-pattern-case]').forEach(b => b.classList.toggle('active', b.dataset.patternCase === this._crossCheckState.casing));
    modal.querySelectorAll('[data-pattern-filter]').forEach(b => b.classList.toggle('active', b.dataset.patternFilter === 'all'));

    const studentToggleLabel = document.getElementById('crossCheckStudentToggleLabel');
    if (studentToggleLabel) studentToggleLabel.textContent = 'ON';
    const btnStudentToggle = document.getElementById('btnToggleCrossCheckStudent');
    if (btnStudentToggle) {
      btnStudentToggle.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
    }

    this._renderCrossCheckRows();
    modal.classList.remove('hidden');
  }

  _recalculateAndRenderCrossCheck(settingChanged = true) {
    if (!this._crossCheckState) return;
    const allMatched = this._getMatchedCrossCheckFiles();
    if (settingChanged) {
      allMatched.forEach(f => {
        const targetName = this._getCrossCheckTargetName(f);
        const isPerfect = (cleanName(f.name) === cleanName(targetName));
        this._crossCheckState.userToggled.set(f.id, !isPerfect);
      });
    }
    this._renderCrossCheckRows();
  }

  _renderCrossCheckRows() {
    const modal = document.getElementById('modalCrossCheck');
    if (!modal) return;

    const tbody = document.getElementById('crossCheckTableBody');
    const totalEl = document.getElementById('crossCheckTotalCount');
    const activeEmptyEl = document.getElementById('crossCheckActiveEmpty');
    const studentLabel = document.getElementById('crossCheckStudentLabel');

    const rawStudent = (this.state.studentName || '').replace(/\.[a-zA-Z0-9]+$/i, '').trim();
    if (studentLabel) studentLabel.textContent = rawStudent || 'Not Set';

    const allMatched = this._getMatchedCrossCheckFiles();
    if (totalEl) totalEl.textContent = String(allMatched.length);

    const filter = this._crossCheckState ? this._crossCheckState.filter : 'all';
    const filteredMatched = allMatched.filter(f => {
      const extLower = (f.ext || ext(f.name) || '').toLowerCase();
      if (filter === 'pdf') {
        return extLower === '.pdf';
      }
      if (filter === 'images') {
        return ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(extLower);
      }
      return true;
    });

    if (tbody) tbody.innerHTML = '';
    if (activeEmptyEl) {
      activeEmptyEl.classList.toggle('hidden', filteredMatched.length > 0);
    }

    const dupMap = detectDuplicateFiles(this.state.files);

    // Count extra confirmed duplicates for modal toolbar 1-click button
    let extraDupCount = 0;
    this.state.files.forEach(f => {
      const info = dupMap.get(f.id || f.name);
      if (info && info.status === 'confirmed' && !info.isMaster) {
        extraDupCount++;
      }
    });

    const btnModalMoveDup = document.getElementById('btnModalMoveDuplicates');
    const modalMoveDupLabel = document.getElementById('modalMoveDuplicatesLabel');
    if (btnModalMoveDup) {
      if (extraDupCount > 0) {
        btnModalMoveDup.classList.remove('hidden');
        if (modalMoveDupLabel) modalMoveDupLabel.textContent = `Move Duplicates (${extraDupCount})`;
      } else {
        btnModalMoveDup.classList.add('hidden');
      }
    }

    filteredMatched.forEach((f, index) => {
      const targetName = this._getCrossCheckTargetName(f);
      const isPerfect = (cleanName(f.name) === cleanName(targetName));
      const isChecked = this._crossCheckState.userToggled.has(f.id)
        ? this._crossCheckState.userToggled.get(f.id)
        : !isPerfect;
      const isFocused = (this._crossCheckState.focusedIndex === index);
      const diff = computeWordDiff(f.name, targetName, this.state.studentName);

      const row = document.createElement('div');
      row.dataset.fileId = f.id;
      let rowClasses = 'grid grid-cols-[32px_minmax(0,1fr)_22px_minmax(0,1.1fr)_104px] items-center gap-2 px-3 min-h-[38px] py-1.5 rounded-lg border transition-all cursor-pointer ';
      if (isFocused) {
        rowClasses += 'border-blue-600 bg-blue-50/35 shadow-2xs';
      } else if (isPerfect && !isChecked) {
        rowClasses += 'border-transparent bg-slate-50/45 hover:bg-slate-100/60';
      } else {
        rowClasses += 'border-transparent hover:bg-slate-50 border-b-slate-100';
      }
      row.className = rowClasses;

      // 1. Checkbox
      const colCb = document.createElement('div');
      colCb.className = 'flex items-center justify-center';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = isChecked;
      cb.className = 'w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 crosscheck-row-cb';
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        this._crossCheckState.userToggled.set(f.id, cb.checked);
        this._updateCrossCheckSelectionCount();
        this._renderCrossCheckRows();
      });
      colCb.appendChild(cb);
      row.appendChild(colCb);

      // 2. Old Name (with right-aligned Duplicate and Error % badges)
      const colOld = document.createElement('div');
      colOld.className = 'font-mono-code text-[12px] flex items-center justify-between gap-1.5 min-w-0';

      const oldTextSpan = document.createElement('span');
      oldTextSpan.className = 'truncate flex-1 min-w-0';
      oldTextSpan.title = cleanName(f.name);
      if (isPerfect) {
        oldTextSpan.innerHTML = `<span class="text-slate-400">${escapeHtml(cleanName(f.name))}</span>`;
      } else {
        oldTextSpan.innerHTML = diff.oldHtml;
      }
      colOld.appendChild(oldTextSpan);

      const oldBadgesDiv = document.createElement('div');
      oldBadgesDiv.className = 'flex items-center gap-1 shrink-0';

      const dupInfo = dupMap.get(f.id || f.name);
      const dupStatus = dupInfo ? dupInfo.status : null;
      if (dupStatus === 'confirmed') {
        const dupBadge = document.createElement('span');
        dupBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold badge-dup-confirmed whitespace-nowrap select-none';
        dupBadge.textContent = 'Duplicate';
        dupBadge.title = 'Confirmed Duplicate (100% Identical or Copy Suffix Collision)';
        oldBadgesDiv.appendChild(dupBadge);
      } else if (dupStatus === 'probable') {
        const probBadge = document.createElement('span');
        probBadge.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold badge-dup-probable whitespace-nowrap select-none';
        probBadge.textContent = '50% Dup';
        probBadge.title = 'Probable Duplicate (Exact same byte size & file extension)';
        oldBadgesDiv.appendChild(probBadge);
      }

      const errPct = computeOldNameErrorPercent(f.name, targetName, this.state.studentName);
      if (errPct > 0) {
        const errBadge = document.createElement('span');
        const errClass = errPct >= 30 ? 'badge-wrong-major' : 'badge-wrong-minor';
        errBadge.className = `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap select-none ${errClass}`;
        errBadge.textContent = `${errPct}% Wrong`;
        errBadge.title = `${errPct}% difference from suggested document name`;
        oldBadgesDiv.appendChild(errBadge);
      }

      if (dupStatus === 'confirmed' || dupStatus === 'probable') {
        const rowMoveBtn = document.createElement('button');
        rowMoveBtn.type = 'button';
        rowMoveBtn.title = 'Move this file to "Duplicate Files" subfolder (Del)';
        rowMoveBtn.className = 'w-4 h-4 rounded hover:bg-slate-200 text-slate-400 hover:text-amber-600 flex items-center justify-center shrink-0 cursor-pointer ml-0.5';
        rowMoveBtn.innerHTML = '<span class="material-symbols-outlined text-[12px]">drive_file_move</span>';
        rowMoveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleMoveFileToDuplicates(f);
        });
        oldBadgesDiv.appendChild(rowMoveBtn);
      }

      if (oldBadgesDiv.children.length > 0) {
        colOld.appendChild(oldBadgesDiv);
      }
      row.appendChild(colOld);

      // 3. Arrow
      const colArr = document.createElement('div');
      colArr.className = 'flex items-center justify-center text-slate-300 font-bold select-none';
      colArr.innerHTML = `<svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
      row.appendChild(colArr);

      // 4. Suggested New Name
      const colNew = document.createElement('div');
      colNew.className = 'font-mono-code text-[12px] truncate';
      colNew.title = cleanName(targetName);
      if (isPerfect) {
        colNew.innerHTML = `<span class="text-slate-400 font-medium">${escapeHtml(cleanName(targetName))}</span>`;
      } else {
        colNew.innerHTML = diff.newHtml;
      }
      row.appendChild(colNew);

      // 5. Status / Match Badge
      const colBadge = document.createElement('div');
      colBadge.className = 'flex justify-end';
      if (isPerfect) {
        colBadge.innerHTML = `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/90 text-emerald-700 border border-emerald-200/90 whitespace-nowrap">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <span>Perfect</span>
          </span>
        `;
      } else {
        const conf = f.smartConfidence !== undefined ? f.smartConfidence : (f.isMatched ? 90 : 0);
        const isMatched = (f.isMatched !== false && conf >= 30);
        if (!isMatched) {
          colBadge.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Unmatched
            </span>
          `;
        } else {
          const isHigh = conf >= 90;
          const badgeStyle = isHigh
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';
          const dotStyle = isHigh ? 'bg-emerald-500' : 'bg-amber-500';
          colBadge.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle} whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full ${dotStyle}"></span>
              ${conf}% Match
            </span>
          `;
        }
      }
      row.appendChild(colBadge);

      row.addEventListener('click', (e) => {
        if (e.target === cb) return;
        this._crossCheckState.focusedIndex = index;
        this._renderCrossCheckRows();
      });

      if (tbody) tbody.appendChild(row);
    });

    if (filteredMatched.length > 0) {
      this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex, filteredMatched.length - 1);
    }
    this._updateCrossCheckSelectionCount();
  }

  _updateCrossCheckSelectionCount() {
    const modal = document.getElementById('modalCrossCheck');
    if (!modal) return;
    const allMatched = this._getMatchedCrossCheckFiles();
    let checkedCount = 0;
    allMatched.forEach(f => {
      const isChecked = this._crossCheckState?.userToggled.get(f.id) ?? false;
      if (isChecked) checkedCount++;
    });

    const selectedEl = document.getElementById('crossCheckSelectedCount');
    const totalEl = document.getElementById('crossCheckTotalCount');
    const confirmLabel = document.getElementById('confirmRenameLabel');
    const confirmBtn = document.getElementById('btnConfirmBatchRename');
    const selectAllCb = document.getElementById('chkCrossCheckSelectAll');

    if (selectedEl) selectedEl.textContent = String(checkedCount);
    if (totalEl) totalEl.textContent = String(allMatched.length);
    if (confirmLabel) confirmLabel.textContent = `Confirm & Rename (${checkedCount})`;
    if (confirmBtn) {
      confirmBtn.disabled = (checkedCount === 0);
      confirmBtn.classList.toggle('opacity-40', checkedCount === 0);
      confirmBtn.classList.toggle('cursor-not-allowed', checkedCount === 0);
      confirmBtn.classList.toggle('cursor-pointer', checkedCount > 0);
    }

    const visibleRows = Array.from(modal.querySelectorAll('.crosscheck-row-cb'));
    const visibleChecked = visibleRows.filter(cb => cb.checked).length;
    if (selectAllCb) {
      selectAllCb.checked = (visibleRows.length > 0 && visibleChecked === visibleRows.length);
      selectAllCb.indeterminate = (visibleChecked > 0 && visibleChecked < visibleRows.length);
    }
  }

  closeCrossCheckModal() {
    const modal = document.getElementById('modalCrossCheck');
    if (modal) modal.classList.add('hidden');
  }

  showFloatingUndoToast(count) {
    const toastEl = document.getElementById('toastFloatingUndo');
    if (!toastEl) return;

    const msgEl = document.getElementById('floatingUndoMessage');
    const btnLabelEl = document.getElementById('floatingUndoBtnLabel');

    if (msgEl) msgEl.innerHTML = `Successfully renamed <strong>${count}</strong> documents in 0.1s`;
    if (btnLabelEl) btnLabelEl.textContent = `Undo All (${count})`;

    toastEl.classList.remove('hidden');

    if (this._floatingUndoTimer) {
      clearTimeout(this._floatingUndoTimer);
    }
    this._floatingUndoTimer = setTimeout(() => {
      this.hideFloatingUndoToast();
    }, 7000);
  }

  hideFloatingUndoToast() {
    const toastEl = document.getElementById('toastFloatingUndo');
    if (toastEl) toastEl.classList.add('hidden');
    if (this._floatingUndoTimer) {
      clearTimeout(this._floatingUndoTimer);
      this._floatingUndoTimer = null;
    }
  }

  async handleConfirmCrossCheckRename() {
    const modal = document.getElementById('modalCrossCheck');
    if (!modal) return;

    const checkedBoxes = modal.querySelectorAll('.crosscheck-row-cb:checked');
    const selectedFiles = [];
    checkedBoxes.forEach(cb => {
      const rowEl = cb.closest('[data-file-id]');
      if (rowEl && rowEl.dataset.fileId) {
        const f = this.state.files.find(x => x.id === rowEl.dataset.fileId);
        if (f) selectedFiles.push(f);
      }
    });

    if (selectedFiles.length === 0) {
      toast.show('No Files Selected', 'Please select at least one document to rename.', 'warning');
      return;
    }

    const plan = [];
    for (const f of selectedFiles) {
      const targetFilename = this._getCrossCheckTargetName(f);
      const err = validateFilename(targetFilename);
      if (err) {
        toast.show('Validation Error', `${cleanName(f.name)}: ${err}`, 'error');
        return;
      }
      plan.push({
        old: f.name,
        next: targetFilename,
        file: f,
        nativePath: f.path || f.nativePath,
        studentName: this.state.studentName || '',
        rotation: f.rotation || 0
      });
    }

    try {
      const result = await executeRename(this.state.folder, plan, (pct, status) => {
        console.log(`[Batch Rename Progress] ${pct}%: ${status}`);
      });

      undoManager.pushBatch(this.state.folder, plan);

      plan.forEach(item => {
        const f = item.file;
        f.name = item.next;
        f.targetName = item.next;
        f.isRenamed = true;
        f.status = 'renamed';
        f.rotation = 0;
        f._pdfBytes = null;
        if (f._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          try { URL.revokeObjectURL(f._blobUrl); } catch (_) { }
          f._blobUrl = null;
        }
        if (f.path) {
          f.path = f.path.replace(/[^\\\/]+$/, f.name);
        }
        if (f.nativePath) {
          f.nativePath = f.nativePath.replace(/[^\\\/]+$/, f.name);
        }
        const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
          ? window.location.origin : 'http://localhost:3000';
        if (f.path || f.nativePath) {
          f.url = `${origin}/api/serve-file?path=${encodeURIComponent(f.path || f.nativePath)}`;
        }
      });

      this.closeCrossCheckModal();
      this.showFloatingUndoToast(plan.length);

      // Auto-jump to first remaining unrenamed (unmatched) file for seamless operator workflow
      const firstUnrenamed = this.state.files.findIndex(f => !f.isRenamed);
      if (firstUnrenamed !== -1) {
        this.state.currentIndex = firstUnrenamed;
      }

      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      this._computeDuplicateHashesAsync();
    } catch (err) {
      toast.show('Rename Failed', err.message, 'error');
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

  handleClearQueue(silent = false) {
    if (this.state.files && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      for (const f of this.state.files) {
        if (f && f._blobUrl) {
          try { URL.revokeObjectURL(f._blobUrl); } catch (_) { }
          f._blobUrl = null;
        }
        f._pdfBytes = null;
      }
    }
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

  renderPreview() {
    return this.renderCurrentPreview();
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

    const getActiveStage = () => {
      if (compareLabel) return stage;
      const live = document.getElementById('previewContainerStage');
      if (live && live.isConnected) return live;
      return stage;
    };

    const isImage = /\.(jpe?g|png|webp|bmp|gif)$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);

    if (isImage) {
      const img = document.createElement('img');
      img.alt = file.name;
      img.className = 'w-full h-full object-contain';

      const applyBlob = (blobUrl) => {
        file._blobUrl = blobUrl;
        img.src = blobUrl;
        const targetStage = getActiveStage();
        if (!targetStage.contains(img)) {
          targetStage.innerHTML = '';
          targetStage.appendChild(img);
        }
      };

      if (file._blobUrl) {
        applyBlob(file._blobUrl);
      } else if (file.fileObj) {
        try {
          applyBlob(URL.createObjectURL(file.fileObj));
        } catch (_) {
          this._renderDocumentInfoFallback(getActiveStage(), file);
        }
      } else {
        const tauriInvoke = getTauriInvoke();
        if (file.path && tauriInvoke) {
          stage.innerHTML = '<div class="flex items-center justify-center w-full h-full text-secondary text-[12px]"><span class="material-symbols-outlined text-[20px] animate-spin text-primary mr-2">sync</span><span>Loading document preview...</span></div>';
          tauriInvoke('read_binary_file', { path: file.path })
            .then(bytes => {
              const mime = file.name.toLowerCase().endsWith('.png') ? 'image/png' : (file.name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');
              const blob = new Blob([new Uint8Array(bytes)], { type: mime });
              applyBlob(URL.createObjectURL(blob));
            })
            .catch(err => {
              console.warn('Native read_binary_file error, falling back:', err);
              const previewUrl = resolveFilePreviewUrl(file);
              if (previewUrl) {
                img.src = previewUrl;
                img.onload = () => { const targetStage = getActiveStage(); targetStage.innerHTML = ''; targetStage.appendChild(img); };
                img.onerror = () => this._renderDocumentInfoFallback(getActiveStage(), file);
              } else {
                this._renderDocumentInfoFallback(getActiveStage(), file);
              }
            });
        } else {
          const previewUrl = resolveFilePreviewUrl(file);
          if (previewUrl) {
            img.src = previewUrl;
            img.onload = () => { const targetStage = getActiveStage(); targetStage.innerHTML = ''; targetStage.appendChild(img); };
            img.onerror = () => this._renderDocumentInfoFallback(getActiveStage(), file);
          } else {
            this._renderDocumentInfoFallback(getActiveStage(), file);
          }
        }
      }
    } else if (isPdf) {
      const canvas = document.createElement('canvas');
      canvas.id = 'previewPdfCanvas';
      canvas.className = 'w-full h-full object-contain';

      const renderFromBytes = async (bytes) => {
        if (!window.pdfjsLib) {
          this._loadPdfJs(() => renderFromBytes(bytes));
          return;
        }
        try {
          const targetStage = getActiveStage();
          targetStage.innerHTML = '';
          targetStage.appendChild(canvas);
          const bufferCopy = (bytes instanceof Uint8Array) ? bytes.slice(0) : new Uint8Array(bytes);
          this.state.activePdfDoc = await window.pdfjsLib.getDocument({ data: bufferCopy }).promise;
          this.state.activePdfUrl = file.path || file.name;
          this.state.totalPdfPages = this.state.activePdfDoc.numPages || 1;
          this.state.currentPdfPage = 1;
          this._updatePdfPageIndicator();
          await this._renderPdfPage(1, canvas);
        } catch (pdfErr) {
          console.warn('PDF render error:', pdfErr);
          this._renderDocumentInfoFallback(getActiveStage(), file);
        }
      };

      if (file._pdfBytes) {
        renderFromBytes(file._pdfBytes);
      } else if (file.fileObj) {
        file.fileObj.arrayBuffer()
          .then(buf => {
            file._pdfBytes = new Uint8Array(buf);
            renderFromBytes(file._pdfBytes);
          })
          .catch(() => this._renderDocumentInfoFallback(getActiveStage(), file));
      } else {
        const tauriInvoke = getTauriInvoke();
        if (file.path && tauriInvoke) {
          stage.innerHTML = '<div class="flex items-center justify-center w-full h-full text-secondary text-[12px]"><span class="material-symbols-outlined text-[20px] animate-spin text-primary mr-2">sync</span><span>Loading PDF preview...</span></div>';
          tauriInvoke('read_binary_file', { path: file.path })
            .then(bytes => {
              file._pdfBytes = new Uint8Array(bytes);
              renderFromBytes(file._pdfBytes);
            })
            .catch(err => {
              console.warn('Native PDF read error, falling back to fetch:', err);
              const previewUrl = resolveFilePreviewUrl(file);
              if (previewUrl) {
                fetch(previewUrl)
                  .then(r => r.arrayBuffer())
                  .then(buf => {
                    file._pdfBytes = new Uint8Array(buf);
                    renderFromBytes(file._pdfBytes);
                  })
                  .catch(() => this._renderDocumentInfoFallback(getActiveStage(), file));
              } else {
                this._renderDocumentInfoFallback(getActiveStage(), file);
              }
            });
        } else {
          const previewUrl = resolveFilePreviewUrl(file);
          if (previewUrl) {
            fetch(previewUrl)
              .then(r => r.arrayBuffer())
              .then(buf => {
                file._pdfBytes = new Uint8Array(buf);
                renderFromBytes(file._pdfBytes);
              })
              .catch(() => this._renderDocumentInfoFallback(getActiveStage(), file));
          } else {
            this._renderDocumentInfoFallback(getActiveStage(), file);
          }
        }
      }
    } else {
      this._renderDocumentInfoFallback(getActiveStage(), file);
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
    if (!this._pdfCallbacks) this._pdfCallbacks = [];
    if (callback) this._pdfCallbacks.push(callback);
    if (this._pdfLoading) return;
    this._pdfLoading = true;

    const candidateSources = [
      'assets/js/libs/pdf.min.js',
      '/app/assets/js/libs/pdf.min.js',
      'app/assets/js/libs/pdf.min.js',
      'src/js/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    ];

    let tryIdx = 0;
    const tryNext = () => {
      if (tryIdx >= candidateSources.length) {
        this._pdfLoading = false;
        console.warn('[DocMitra Renamer] Could not load pdf.js from any candidate source.');
        const cbs = this._pdfCallbacks ? [...this._pdfCallbacks] : [];
        this._pdfCallbacks = [];
        return;
      }
      const src = candidateSources[tryIdx++];
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => {
        if (window.pdfjsLib) {
          const workerPath = src.includes('cdnjs')
            ? 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
            : src.replace('pdf.min.js', 'pdf.worker.min.js');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
          this._pdfLoading = false;
          const cbs = this._pdfCallbacks ? [...this._pdfCallbacks] : [];
          this._pdfCallbacks = [];
          cbs.forEach(cb => {
            try { cb(); } catch (err) { console.error('[DocMitra Renamer] PDF callback error:', err); }
          });
        } else {
          tryNext();
        }
      };
      s.onerror = () => tryNext();
      document.head.appendChild(s);
    };

    tryNext();
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
    const fileExt = file.ext || ext(file.name) || 'DOC';
    const fileSizeKb = file.size ? (file.size / 1024).toFixed(1) : '0.0';
    info.textContent = `Size: ${fileSizeKb} KB • Type: ${fileExt.toUpperCase().replace(/^\./, '')}`;
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

  /**
   * Centralized physical folder and student name rename handler
   */
  async applyFolderRename(newName) {
    const oldFolderName = this.state.studentName || (this.state.folder?.name || '');
    const oldFolderPath = this.state.folder ? (this.state.folder.nativePath || this.state.folder.path || '') : '';

    if (!newName || newName === oldFolderName) return;

    // 1. Exact Typing Casing: Use user's exact typing
    this.state.studentName = newName;
    const displayFolder = document.getElementById('displayFolderName');
    if (displayFolder) {
      displayFolder.textContent = newName;
      displayFolder.title = newName;
    }
    const inputEditFolder = document.getElementById('inputEditFolderName');
    if (inputEditFolder) {
      inputEditFolder.value = newName;
    }

    // 2. Physical Disk Folder Rename
    if (oldFolderPath) {
      try {
        const renameRes = await renameNativeFolder(oldFolderPath, newName);
        if (renameRes && renameRes.success) {
          const updatedPath = renameRes.newPath || renameRes.path;
          if (updatedPath) {
            const oldNormalized = oldFolderPath.replace(/\\/g, '/').toLowerCase();
            const newNormalized = updatedPath.replace(/\\/g, '/');

            if (this.state.folder) {
              this.state.folder.name = newName;
              this.state.folder.path = updatedPath;
              this.state.folder.nativePath = updatedPath;
            }

            // Update in-memory paths of all loaded queue files so subsequent operations succeed
            for (const f of this.state.files) {
              if (f.path) {
                const fNorm = f.path.replace(/\\/g, '/');
                if (fNorm.toLowerCase().startsWith(oldNormalized)) {
                  f.path = newNormalized + fNorm.slice(oldNormalized.length);
                  if (f.nativePath) {
                    f.nativePath = f.path;
                  }
                }
              }
            }
          }
        } else if (renameRes && renameRes.error) {
          console.warn('[DocMitra] Physical folder rename notice:', renameRes.error);
        }
      } catch (err) {
        console.warn('[DocMitra] Physical folder rename error:', err);
      }
    }

    // 3. 'Add folder name in file' Checkbox Guard
    const chkInclude = document.getElementById('chkIncludeFolderName');
    const shouldIncludeInFiles = chkInclude ? chkInclude.checked : true;

    if (shouldIncludeInFiles) {
      this._recalculateTargetNames(true);
      this.renderQueue();
      this.renderCurrentPreview();
    }

    this.updateTelemetry();
    this.updateMissingModal();
    toast.show('Folder Renamed', `Folder name updated to: ${newName}`, 'success');
  }

  /**
   * Unified native import handler for missing documents (used by both sidebar and MissingDocumentsModal)
   */
  async handleImportMissingDocument(ruleName) {
    toast.show('Select File for Import', `Select document for ${ruleName}`, 'info');
    try {
      const res = await selectNativeFiles('All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*', `Select File for ${ruleName}`);
      if (!res.success || !res.files || res.files.length === 0) return;

      const picked = res.files[0];
      const fileExt = picked.ext || ext(picked.name);
      const folderPath = this.state.folder?.path || '';

      // Dynamic Rule Inheritance: Check active ribbon settings (student name checked/unchecked, active casing)
      const chkInclude = document.getElementById('chkIncludeFolderName');
      const includeFolder = chkInclude ? chkInclude.checked : (this.state.settings?.includeFolderNameInFile !== false);
      const studentName = includeFolder ? (this.state.studentName || this.state.folder?.name || '') : '';
      const currentStyle = this.state.style || 'upper';

      const targetBase = buildName(ruleName || cleanName(picked.name), studentName, this.state.settings?.groups, currentStyle);
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
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: finalName,
        targetName: finalName,
        suggestedName: finalName,
        path: finalPath,
        nativePath: finalPath,
        size: finalSize,
        ext: fileExt,
        dateCreated: (imported && (imported.ctime || imported.dateCreated)) ? (imported.ctime || imported.dateCreated) : (picked.ctime || picked.dateCreated || Date.now()),
        dateModified: Date.now(),
        lastModified: Date.now(),
        url: (imported && imported.url) ? imported.url : (picked.url || resolveFilePreviewUrl(picked)),
        docType: ruleName,
        isMatched: true,
        isRenamed: false,
        isKept: false,
        rotation: 0,
        isScanning: false,
        smartConfidence: 100,
        smartDocType: ruleName,
        status: 'matched'
      };

      this.state.files.push(newFileItem);
      this.updateTelemetry();
      this.renderQueue();
      this.renderCurrentPreview();
      this.updateMissingModal();
      toast.show('Document Imported', `Imported ${cleanName(finalName)} as ${ruleName}`, 'success');
    } catch (err) {
      console.error('[DocMitra Import] Import error:', err);
      toast.show('Import Error', err.message || 'Failed to import document', 'error');
    }
  }

  /**
   * Opens the dedicated Missing Documents & Follow-up Desk modal
   */
  openMissingDocumentsModal() {
    if (!this.missingModal) {
      this.missingModal = new MissingDocumentsModal({
        onImportFile: (ruleName) => this.handleImportMissingDocument(ruleName),
        onRenameFolder: async (newFolderName) => {
          await this.applyFolderRename(newFolderName);
        },
        onSetFollowup: ({ docName, date }) => {
          const student = this.state.studentName || this.state.folder?.name || 'Student';
          addOrUpdateFollowUp({
            folderName: student,
            studentName: student,
            documentName: docName,
            promisedDate: date,
            note: 'Missing document follow-up'
          });
          toast.show('Follow-up Scheduled', `${docName} promise date set for ${date}`, 'success');
          this.updateMissingModal();
          this.renderQueue();
        },
        onPresetChange: (newPreset) => {
          this.handleSwitchActivePreset(newPreset);
          this.updateMissingModal();
        },
        onClose: () => {
          this.state.isMissingModalOpen = false;
        }
      });
    }
    this.state.isMissingModalOpen = true;
    this.updateMissingModal();
  }

  /**
   * Refreshes the active data in the Missing Documents modal
   */
  updateMissingModal() {
    if (!this.missingModal || !this.state.isMissingModalOpen) return;

    const studentName = this.state.studentName || this.state.folder?.name || 'Student';
    const folderPath = this.state.folder?.path || '';
    const activePreset = this.state.activePreset || 'MAHA DBT';
    const presetsList = this.state.documentPresets ? Object.keys(this.state.documentPresets) : ['MAHA DBT', 'SWAYAM DEENDAYAL YOJANA', 'CET CELL', 'EDUCATIONAL DOCUMENTS'];

    const activeRules = this.getActivePresetDocuments();
    const presentDocsSet = new Set(
      this.state.files.map(f => (f.docType || '').toUpperCase()).filter(Boolean)
    );

    const missingRules = activeRules.filter((rule) => {
      const cleanRule = (rule.name || rule).toUpperCase();
      if (presentDocsSet.has(cleanRule)) return false;
      for (const link of DEFAULT_LINKED_RULES) {
        if (link.combined && presentDocsSet.has(link.combined.toUpperCase())) {
          if (cleanRule === link.part1.toUpperCase() || cleanRule === link.part2.toUpperCase()) {
            return false;
          }
        }
      }
      return true;
    });

    const presentDocs = this.state.files.map(f => {
      const docType = f.docType || f.targetName || f.name;
      let isCombined = false;
      for (const link of DEFAULT_LINKED_RULES) {
        if (link.combined && (docType || '').toUpperCase() === link.combined.toUpperCase()) {
          isCombined = true;
          break;
        }
      }
      const fileExt = f.ext || ext(f.name) || 'pdf';
      const dateModified = f.dateModified || f.lastModified || f.modified || Date.now();
      const dateCreated = f.dateCreated || f.ctime || f.birthtime || dateModified;
      return {
        name: f.name,
        docType: docType,
        size: f.size || 0,
        ext: fileExt.toUpperCase().replace('.', ''),
        dateModified: dateModified,
        dateCreated: dateCreated,
        isCombined: isCombined
      };
    });

    const followupMap = {};
    missingRules.forEach(r => {
      const ruleName = typeof r === 'string' ? r : (r.name || '');
      const pending = getPendingFollowUp(studentName, ruleName);
      if (pending && pending.promisedDate) {
        followupMap[ruleName] = pending.promisedDate;
      }
    });

    this.missingModal.open({
      studentName,
      folderPath,
      activePreset,
      presetsList,
      missingRules,
      presentDocs,
      followupMap,
      totalRequiredCount: activeRules.length
    });
  }
}

export function initRenamerUI() {
  const manager = new RenamerUIManager();
  manager.init();
  if (typeof window !== 'undefined') window.docmitraRenamer = manager;
  return manager;
}
