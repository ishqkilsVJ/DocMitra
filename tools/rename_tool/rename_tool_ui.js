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
  matchFilenameSmart,
  SMART_DOC_SIGNATURES,
  registerDocumentSignature,
  extractSignatureKeywords,
  extractCleanTokens
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
  if (['ADR', 'PAN', 'PIC', 'UID'].includes(c)) return 'bg-blue-600 text-white font-extrabold';
  if (['10M', '10P', '12M', '12P', '12LC', '12MP', 'ATM', 'BNF', 'BRT'].includes(c)) return 'bg-emerald-700 text-white font-extrabold';
  if (['CST', 'VLD'].includes(c)) return 'bg-purple-700 text-white font-extrabold';
  if (['INC', 'DOM', 'NAT', 'BNK'].includes(c)) return 'bg-amber-600 text-white font-extrabold';
  if (['SLF', 'PAR', 'GAP'].includes(c)) return 'bg-slate-700 text-white font-extrabold';
  return 'bg-primary text-on-primary font-extrabold';
}


export const BUILTIN_PRESETS = {
  "MAHA DBT": [
    { name: "Aadhaar Card", code: "ADR", keywords: ["aadhaar card", "aadhar", "adhar", "uidai", "uid"] },
    { name: "Income Certificate", code: "INC", keywords: ["income certificate", "income", "tahsildar income", "utpann"] },
    { name: "Domicile Certificate", code: "DOM", keywords: ["domicile certificate", "domicile", "adhiwas"] },
    { name: "Nationality Certificate", code: "NAT", keywords: ["nationality certificate", "nationality", "indian nationality"] },
    { name: "Caste Certificate", code: "CST", keywords: ["caste certificate", "caste", "jati", "category cert"] },
    { name: "Caste Validity Certificate", code: "VLD", keywords: ["caste validity certificate", "validity", "caste validity", "padtalni"] },
    { name: "Non Creamy Layer Certificate", code: "NCL", keywords: ["non creamy layer certificate", "non creamy layer", "ncl", "creamy layer"] },
    { name: "10th Marksheet", code: "10M", keywords: ["10th marksheet", "10 marksheet", "10th mark", "ssc marksheet", "ssc mark"] },
    { name: "12th Marksheet", code: "12M", keywords: ["12th marksheet", "12 marksheet", "12th mark", "hsc marksheet", "hsc mark"] },
    { name: "Leaving Certificate", code: "LC", keywords: ["leaving certificate", "lc", "school leaving", "college leaving", "tc", "transfer certificate"] },
    { name: "Bonafide Certificate", code: "BON", keywords: ["bonafide certificate", "bonafide", "bonafied", "college bonafide"] },
    { name: "Admission Fee Receipt", code: "FEE", keywords: ["admission fee receipt", "fee receipt", "admission fee", "fees paid", "fee challan"] },
    { name: "Bank Passbook", code: "BNK", keywords: ["bank passbook", "passbook", "bank account", "bank front page", "ifsc"] },
    { name: "Ration Card", code: "RAT", keywords: ["ration card", "ration", "shidori patrika"] },
    { name: "Declaration Certificate", code: "DEC", keywords: ["declaration certificate", "declaration", "self declaration", "hamipatra"] }
  ],
  "CET CELL": [
    { name: "CET Scorecard", code: "CET", keywords: ["cet scorecard", "cet score", "cet result", "mht cet", "cet"] },
    { name: "CET Application Confirmation", code: "APP", keywords: ["cet application confirmation", "application form", "confirmation receipt", "cet form"] },
    { name: "Aadhaar Card", code: "ADR", keywords: ["aadhaar card", "aadhar", "adhar", "uidai", "uid"] },
    { name: "APAAR ID", code: "APR", keywords: ["apaar id", "apaar", "abc id", "academic bank of credits"] },
    { name: "10th Marksheet", code: "10M", keywords: ["10th marksheet", "10 marksheet", "10th mark", "ssc marksheet", "ssc mark"] },
    { name: "10th Passing Certificate", code: "10P", keywords: ["10th passing certificate", "10th passing", "10 passing", "ssc passing", "10th board cert"] },
    { name: "12th Marksheet", code: "12M", keywords: ["12th marksheet", "12 marksheet", "12th mark", "hsc marksheet", "hsc mark"] },
    { name: "12th Passing Certificate", code: "12P", keywords: ["12th passing certificate", "12th passing", "12 passing", "hsc passing", "12th board cert"] },
    { name: "Leaving Certificate", code: "LC", keywords: ["leaving certificate", "lc", "school leaving", "college leaving", "tc"] },
    { name: "Domicile Certificate", code: "DOM", keywords: ["domicile certificate", "domicile", "adhiwas"] },
    { name: "Nationality Certificate", code: "NAT", keywords: ["nationality certificate", "nationality", "indian nationality"] },
    { name: "Caste Certificate", code: "CST", keywords: ["caste certificate", "caste", "jati", "category cert"] },
    { name: "Caste Validity Certificate", code: "VLD", keywords: ["caste validity certificate", "validity", "caste validity", "padtalni"] },
    { name: "Non Creamy Layer Certificate", code: "NCL", keywords: ["non creamy layer certificate", "non creamy layer", "ncl"] },
    { name: "EWS Certificate", code: "EWS", keywords: ["ews certificate", "ews", "economically weaker section"] },
    { name: "Disability Certificate", code: "PWD", keywords: ["disability certificate", "pwd", "handicap", "divyang"] },
    { name: "Minority Declaration", code: "MIN", keywords: ["minority declaration", "minority", "religious minority", "linguistic minority"] },
    { name: "Photo", code: "PIC", keywords: ["photo", "pic", "photograph", "passport photo", "student photo"] }
  ],
  "SWAYAM": [
    { name: "Aadhaar Card", code: "ADR", keywords: ["aadhaar card", "aadhar", "adhar", "uidai"] },
    { name: "Income Certificate", code: "INC", keywords: ["income certificate", "income", "utpann"] },
    { name: "Domicile Certificate", code: "DOM", keywords: ["domicile certificate", "domicile", "adhiwas"] },
    { name: "Caste Certificate", code: "CST", keywords: ["caste certificate", "caste", "jati"] },
    { name: "Caste Validity Certificate", code: "VLD", keywords: ["caste validity certificate", "validity", "caste validity"] },
    { name: "Bonafide Certificate", code: "BON", keywords: ["bonafide certificate", "bonafide", "bonafied"] },
    { name: "Admission Fee Receipt", code: "FEE", keywords: ["admission fee receipt", "fee receipt", "admission fee", "fee paid"] },
    { name: "Hostel Receipt / Bonafide", code: "HST", keywords: ["hostel receipt", "hostel bonafide", "hostel", "vasatigruh"] },
    { name: "Bank Passbook", code: "BNK", keywords: ["bank passbook", "passbook", "bank", "ifsc"] },
    { name: "Ration Card", code: "RAT", keywords: ["ration card", "ration"] },
    { name: "Self Declaration", code: "DEC", keywords: ["self declaration", "declaration", "hamipatra"] },
    { name: "Photo", code: "PIC", keywords: ["photo", "pic", "photograph", "passport photo"] }
  ],
  "EDUCATIONAL": [
    { name: "Aadhaar Card", code: "ADR", keywords: ["aadhaar card", "aadhar", "adhar", "uidai", "uid"] },
    { name: "Photo", code: "PIC", keywords: ["photo", "pic", "photograph", "passport photo", "student photo"] },
    { name: "10th Marksheet", code: "10M", keywords: ["10th marksheet", "10 marksheet", "10th mark", "ssc marksheet", "ssc mark"] },
    { name: "10th Passing Certificate", code: "10P", keywords: ["10th passing certificate", "10th passing", "10 passing", "ssc passing"] },
    { name: "10th Marksheet and Passing Certificate", code: "10MP", keywords: ["10th marksheet and passing certificate", "10th marksheet passing", "10 mp", "cbse 10th marksheet passing"] },
    { name: "11th Marksheet", code: "11M", keywords: ["11th marksheet", "11 marksheet", "11th mark", "fyjc marksheet"] },
    { name: "12th Marksheet", code: "12M", keywords: ["12th marksheet", "12 marksheet", "12th mark", "hsc marksheet", "hsc mark"] },
    { name: "12th Passing Certificate", code: "12P", keywords: ["12th passing certificate", "12th passing", "12 passing", "hsc passing"] },
    { name: "12th Marksheet and Passing Certificate", code: "12MP", keywords: ["12th marksheet and passing certificate", "12th marksheet passing", "12 mp", "cbse 12th marksheet passing"] },
    { name: "Leaving Certificate", code: "LC", keywords: ["leaving certificate", "lc", "12lc", "12l", "school leaving", "college leaving", "tc"] },
    { name: "Caste Certificate", code: "CST", keywords: ["caste certificate", "caste", "cas", "jati"] },
    { name: "Caste Validity Certificate", code: "VLD", keywords: ["caste validity certificate", "validity", "caste validity", "padtalni"] },
    { name: "Non Creamy Layer Certificate", code: "NCL", keywords: ["non creamy layer certificate", "non creamy layer", "ncl"] },
    { name: "Domicile Certificate", code: "DOM", keywords: ["domicile certificate", "domicile", "domi", "adhiwas"] },
    { name: "Nationality Certificate", code: "NAT", keywords: ["nationality certificate", "nationality", "nat", "indian nationality"] },
    { name: "Income Certificate", code: "INC", keywords: ["income certificate", "income", "inc", "utpann"] },
    { name: "Self Declaration", code: "SDC", keywords: ["self declaration", "self decl", "declaration", "hamipatra"] },
    { name: "Parent Declaration", code: "PDC", keywords: ["parent declaration", "parent decl", "parents declaration"] },
    { name: "Residential Document", code: "RES", keywords: ["residential document", "residential", "residence proof"] },
    { name: "Ration Card", code: "RAT", keywords: ["ration card", "ration", "rat"] },
    { name: "PAN Card", code: "PAN", keywords: ["pan card", "pan", "permanent account number"] },
    { name: "Birth Certificate", code: "BRT", keywords: ["birth certificate", "birth", "brt", "janma dakhla"] },
    { name: "Bank Passbook", code: "BNK", keywords: ["bank passbook", "passbook", "bank", "bnk", "ifsc"] }
  ]
};

export const DEFAULT_SHORTCUTS = [
  { code: 'ADR', label: 'Aadhaar Card', canonical: 'AADHAAR CARD', keywords: ['aadhaar', 'aadhar', 'adhar', 'uidai', 'uid'] },
  { code: 'PIC', label: 'Photo', canonical: 'PHOTO', keywords: ['photo', 'pic', 'photograph', 'passport photo', 'student photo'] },
  { code: '10M', label: '10th Marksheet', canonical: '10TH MARKSHEET', keywords: ['10th marksheet', '10 marksheet', '10th mark', 'ssc marksheet', 'ssc'] },
  { code: '10P', label: '10th Passing Certificate', canonical: '10TH PASSING CERTIFICATE', keywords: ['10th passing', '10 passing', 'ssc passing', '10th pass cert'] },
  { code: '10MP', label: '10th Marksheet and Passing Certificate', canonical: '10TH MARKSHEET AND PASSING CERTIFICATE', keywords: ['10th marksheet passing', '10th combined', 'cbse 10th marksheet passing'] },
  { code: '11M', label: '11th Marksheet', canonical: '11TH MARKSHEET', keywords: ['11th marksheet', '11 marksheet', '11th mark', 'fyjc marksheet'] },
  { code: '12M', label: '12th Marksheet', canonical: '12TH MARKSHEET', keywords: ['12th marksheet', '12 marksheet', '12th mark', 'hsc marksheet', 'hsc'] },
  { code: '12P', label: '12th Passing Certificate', canonical: '12TH PASSING CERTIFICATE', keywords: ['12th passing', '12 passing', 'hsc passing', '12th pass cert'] },
  { code: '12MP', label: '12th Marksheet and Passing Certificate', canonical: '12TH MARKSHEET AND PASSING CERTIFICATE', keywords: ['12th marksheet passing', '12th combined', 'cbse 12th marksheet passing'] },
  { code: 'LC', label: 'Leaving Certificate', canonical: 'LEAVING CERTIFICATE', keywords: ['leaving certificate', 'lc', '12lc', '12l', 'tc', 'transfer certificate'] },
  { code: 'CST', label: 'Caste Certificate', canonical: 'CASTE CERTIFICATE', keywords: ['caste certificate', 'caste', 'cas', 'jati', 'category'] },
  { code: 'VLD', label: 'Caste Validity Certificate', canonical: 'CASTE VALIDITY CERTIFICATE', keywords: ['caste validity', 'validity', 'vld', 'padtalni'] },
  { code: 'NCL', label: 'Non Creamy Layer Certificate', canonical: 'NON CREAMY LAYER CERTIFICATE', keywords: ['non creamy layer', 'ncl', 'creamy layer'] },
  { code: 'DOM', label: 'Domicile Certificate', canonical: 'DOMICILE CERTIFICATE', keywords: ['domicile', 'domi', 'adhiwas'] },
  { code: 'NAT', label: 'Nationality Certificate', canonical: 'NATIONALITY CERTIFICATE', keywords: ['nationality', 'nat', 'indian nationality'] },
  { code: 'INC', label: 'Income Certificate', canonical: 'INCOME CERTIFICATE', keywords: ['income certificate', 'income', 'inc', 'utpann'] },
  { code: 'SDC', label: 'Self Declaration', canonical: 'SELF DECLARATION', keywords: ['self declaration', 'self decl', 'declaration', 'hamipatra'] },
  { code: 'PDC', label: 'Parent Declaration', canonical: 'PARENT DECLARATION', keywords: ['parent declaration', 'parent decl', 'parents declaration'] },
  { code: 'RES', label: 'Residential Document', canonical: 'RESIDENTIAL DOCUMENT', keywords: ['residential document', 'residential', 'residence proof'] },
  { code: 'RAT', label: 'Ration Card', canonical: 'RATION CARD', keywords: ['ration card', 'ration', 'rat'] },
  { code: 'PAN', label: 'PAN Card', canonical: 'PAN CARD', keywords: ['pan card', 'pan'] },
  { code: 'BRT', label: 'Birth Certificate', canonical: 'BIRTH CERTIFICATE', keywords: ['birth certificate', 'birth', 'brt', 'janma dakhla'] },
  { code: 'BNK', label: 'Bank Passbook', canonical: 'BANK PASSBOOK', keywords: ['bank passbook', 'passbook', 'bank', 'bnk'] },
  { code: 'CET', label: 'CET Scorecard', canonical: 'CET SCORECARD', keywords: ['cet scorecard', 'cet score', 'cet result', 'mht cet'] },
  { code: 'APP', label: 'CET Application Confirmation', canonical: 'CET APPLICATION CONFIRMATION', keywords: ['cet application', 'application confirmation', 'cet form', 'confirmation receipt'] },
  { code: 'APR', label: 'APAAR ID', canonical: 'APAAR ID', keywords: ['apaar id', 'apaar', 'abc id'] },
  { code: 'EWS', label: 'EWS Certificate', canonical: 'EWS CERTIFICATE', keywords: ['ews certificate', 'ews', 'economically weaker'] },
  { code: 'PWD', label: 'Disability Certificate', canonical: 'DISABILITY CERTIFICATE', keywords: ['disability certificate', 'pwd', 'divyang', 'handicap'] },
  { code: 'MIN', label: 'Minority Declaration', canonical: 'MINORITY DECLARATION', keywords: ['minority declaration', 'minority'] },
  { code: 'BON', label: 'Bonafide Certificate', canonical: 'BONAFIDE CERTIFICATE', keywords: ['bonafide certificate', 'bonafide', 'bonafied'] },
  { code: 'FEE', label: 'Admission Fee Receipt', canonical: 'ADMISSION FEE RECEIPT', keywords: ['admission fee receipt', 'fee receipt', 'admission fee', 'fees'] },
  { code: 'HST', label: 'Hostel Receipt / Bonafide', canonical: 'HOSTEL RECEIPT / BONAFIDE', keywords: ['hostel receipt', 'hostel bonafide', 'hostel', 'vasatigruh'] },
  { code: 'DEC', label: 'Declaration Certificate', canonical: 'DECLARATION CERTIFICATE', keywords: ['declaration certificate', 'declaration', 'hamipatra'] }
];

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
      isMissingDocsCollapsed: true
    };
    this._scanAbortController = null;

    // Master Shortcuts & Rules List (33 Rules)
    this.shortcuts21 = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
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
      btnRenameMatched.addEventListener('click', () => this.openCrossCheckModal());
    }

    const btnReviewUnmatched = document.getElementById('btnReviewUnmatched');
    if (btnReviewUnmatched) {
      btnReviewUnmatched.addEventListener('click', () => this.handleReviewUnmatched());
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

    // Modal: Cross-Check Preview
    const btnCloseCrossCheck = document.getElementById('btnCloseCrossCheckModal');
    if (btnCloseCrossCheck) {
      btnCloseCrossCheck.addEventListener('click', () => this.closeCrossCheckModal());
    }
    const btnCancelCrossCheck = document.getElementById('btnCancelCrossCheck');
    if (btnCancelCrossCheck) {
      btnCancelCrossCheck.addEventListener('click', () => this.closeCrossCheckModal());
    }
    const btnConfirmRename = document.getElementById('btnConfirmBatchRename');
    if (btnConfirmRename) {
      btnConfirmRename.addEventListener('click', () => this.handleConfirmCrossCheckRename());
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

      // Escape: Dismiss active modal if open
      if (e.key === 'Escape') {
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
        const matchSmart = matchFilenameSmart(f.name, this.state.studentName, this.state.settings?.groups, this.getAllPresetDocuments());
        const docType = matchSmart.docType;
        const isMatched = matchSmart.confidence >= 30;

        let suggested = baseName;
        if (docType) {
          suggested = buildName(docType, this.state.studentName, this.state.settings?.groups, this.state.style);
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
          fileObj: f.fileObj || null,
          url: resolveFilePreviewUrl(f),
          docType: docType,
          smartDocType: docType,
          smartConfidence: matchSmart.confidence,
          isMatched: isMatched,
          suggestedName: uniqueName,
          targetName: uniqueName,
          status: isMatched ? (matchSmart.confidence >= 80 ? 'matched' : 'needs_review') : 'unmatched',
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
      // Filename-based matching (30%+ threshold) & preview URL resolution
      const matchSmart = matchFilenameSmart(f.name, this.state.studentName, this.state.settings?.groups, this.getAllPresetDocuments());
      const docType = matchSmart.docType;
      const isMatched = matchSmart.confidence >= 30;

      let suggested = baseName;
      if (docType) {
        suggested = buildName(docType, this.state.studentName, this.state.settings?.groups, this.state.style);
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
        fileObj: f.fileObj || null,
        url: resolveFilePreviewUrl(f),
        docType: docType,
        smartDocType: docType,
        smartConfidence: matchSmart.confidence,
        isMatched: isMatched,
        suggestedName: uniqueName,
        targetName: uniqueName,
        status: isMatched ? (matchSmart.confidence >= 80 ? 'matched' : 'needs_review') : 'unmatched',
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
    }
  }

  _recalculateTargetNames(reMatch = false) {
    const usedDestinations = new Set();
    for (const f of this.state.files) {
      if (f.isRenamed || f.isKept) {
        usedDestinations.add(f.targetName || f.name);
      }
    }
    const presetDocs = this.getAllPresetDocuments();
    for (const f of this.state.files) {
      if (!f.isRenamed && !f.isKept) {
        if (reMatch || !f.isMatched) {
          const matchSmart = matchFilenameSmart(f.name, this.state.studentName, this.state.settings?.groups, presetDocs);
          if (matchSmart.confidence >= 30) {
            f.docType = matchSmart.docType;
            f.smartDocType = matchSmart.docType;
            f.smartConfidence = matchSmart.confidence;
            f.isMatched = true;
            f.status = matchSmart.confidence >= 80 ? 'matched' : 'needs_review';
          }
        }
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

      // Smart Confidence Badge on Active File (Clean header area with zero Matched/Unmatched pill clutter)
      const rightBadgeGroup = document.createElement('div');
      rightBadgeGroup.className = 'flex items-center gap-1.5';

      const liveBadge = document.createElement('span');
      liveBadge.id = 'activeFileLiveBadge';
      if (currentFile.status === 'needs_review') {
        liveBadge.className = 'confidence-badge confidence-badge-med';
        liveBadge.textContent = '🟡 Needs Review';
      } else if (currentFile.smartConfidence !== undefined && currentFile.smartConfidence >= 30) {
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

      // USER APPROVED SPEC: Show original filename without extension in edit field first
      if (currentFile.userEditedName !== undefined) {
        targetInput.value = currentFile.userEditedName;
      } else {
        targetInput.value = cleanName(currentFile.name);
      }

      // Live keystroke filtering for illegal characters
      targetInput.addEventListener('keydown', (e) => {
        // Tab key: confirm and advance
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          const typedVal = targetInput.value.trim();
          if (!currentFile.hasUserEdited && typedVal === cleanName(currentFile.name)) {
            if (currentFile.isMatched && (currentFile.targetName || currentFile.suggestedName)) {
              this.handleConfirmCurrentName(currentFile.targetName || currentFile.suggestedName);
            } else {
              this.handleKeepOriginal();
            }
          } else {
            this.handleConfirmCurrentName(typedVal);
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
          if (!currentFile.hasUserEdited && typedVal === cleanName(currentFile.name)) {
            if (currentFile.isMatched && (currentFile.targetName || currentFile.suggestedName)) {
              this.handleConfirmCurrentName(currentFile.targetName || currentFile.suggestedName);
            } else {
              this.handleKeepOriginal();
            }
          } else {
            this.handleConfirmCurrentName(typedVal);
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

        // Exact-Match Shortcut Rule
        const exactShortcut = this.shortcuts21.find(s => s.code.toLowerCase() === trimmedVal.toLowerCase());
        if (exactShortcut) {
          const canonical = exactShortcut.canonical;
          currentFile.docType = canonical;
          currentFile.isMatched = true;
          if (liveBadge) {
            liveBadge.className = 'confidence-badge confidence-badge-high';
            liveBadge.textContent = `🟢 Matched: ${canonical}`;
          }

          const formulaBase = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
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
      numBadge.textContent = isDone ? '✓' : String(fIdx + 1);
      leftCol.appendChild(numBadge);

      // Clean original filename (single line, no extension in UI) - clean single-line display (zero triple repetition)
      const origTitle = document.createElement('span');
      origTitle.className = isActive
        ? 'font-mono-code text-[11px] text-primary font-bold truncate flex-1 min-w-0'
        : (isDone
          ? 'font-mono-code text-[11px] text-on-surface/80 line-through truncate flex-1 min-w-0'
          : 'font-mono-code text-[11px] text-on-surface font-medium truncate flex-1 min-w-0');
      origTitle.textContent = cleanName(f.name);
      leftCol.appendChild(origTitle);

      item.appendChild(leftCol);

      // Compact Badge (~5-7 characters: score + short code)
      const shortCode = this.getShortCodeForDoc(f.smartDocType || f.docType);
      const conf = f.smartConfidence !== undefined ? f.smartConfidence : (f.isMatched ? 90 : 0);

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
        doneBadge.textContent = shortCode ? `✓ ${shortCode}` : '✓ DONE';
        item.appendChild(doneBadge);
      } else if (conf >= 30) {
        const confBadge = document.createElement('span');
        const label = shortCode || (f.smartDocType || f.docType || 'DOC').substring(0, 6).toUpperCase();
        if (conf >= 80) {
          confBadge.className = 'confidence-badge confidence-badge-high shrink-0 text-[10px] px-1.5 py-0.5';
          confBadge.textContent = `🟢 ${conf}% ${label}`;
        } else {
          confBadge.className = 'confidence-badge confidence-badge-med shrink-0 text-[10px] px-1.5 py-0.5';
          confBadge.textContent = `🟡 ${conf}% ${label}`;
        }
        item.appendChild(confBadge);
      } else {
        const unmatchBadge = document.createElement('span');
        unmatchBadge.className = 'confidence-badge confidence-badge-low shrink-0 text-[10px] px-1.5 py-0.5';
        unmatchBadge.textContent = '🔴 UNMATCH';
        item.appendChild(unmatchBadge);
      }

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

    // 1. MISSING DOCUMENTS / CHECKLIST AUDIT (Dynamic per Active Preset)
    const activeRules = this.getActivePresetDocuments();

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
      missingHeader.className = 'flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono-code text-amber-900 dark:text-amber-300 shrink-0 cursor-pointer select-none hover:bg-amber-500/20 transition-colors' + (this.state.isMissingDocsCollapsed ? ' animate-pulse' : '');
      missingHeader.onclick = () => {
        this.state.isMissingDocsCollapsed = !this.state.isMissingDocsCollapsed;
        this.renderQueue();
      };

      const leftMissing = document.createElement('div');
      leftMissing.className = 'flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-[11px] font-mono-code';
      const warnIcon = document.createElement('span');
      warnIcon.className = 'material-symbols-outlined text-[15px]';
      warnIcon.textContent = 'warning';
      leftMissing.appendChild(warnIcon);
      leftMissing.appendChild(document.createTextNode(`${missingRules.length} Missing Documents Found`));

      const presetSelect = document.createElement('select');
      presetSelect.id = 'selectQuickPreset';
      presetSelect.className = 'px-1.5 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 text-[10px] font-mono-code uppercase font-bold ml-1 border-none outline-none cursor-pointer';
      presetSelect.title = 'Switch active document preset';
      const availablePresets = this.state.documentPresets ? Object.keys(this.state.documentPresets) : ['MAHA DBT', 'SWAYAM'];
      availablePresets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (p === this.state.activePreset) opt.selected = true;
        presetSelect.appendChild(opt);
      });
      presetSelect.addEventListener('click', (e) => e.stopPropagation());
      presetSelect.addEventListener('change', (e) => {
        e.stopPropagation();
        this.handleSwitchActivePreset(e.target.value);
      });
      leftMissing.appendChild(presetSelect);

      missingHeader.appendChild(leftMissing);

      const rightMissing = document.createElement('div');
      rightMissing.className = 'flex items-center gap-1.5';

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
                    evalRes = matchFilenameSmart(picked.name, studentName, this.state.settings?.groups);
                    if (evalRes && evalRes.docType) {
                      if (ruleName && evalRes.docType.toUpperCase() === ruleName.toUpperCase()) {
                        detectedDocType = ruleName;
                        isConfident = evalRes.confidence >= 50;
                      } else if (!ruleName) {
                        detectedDocType = evalRes.docType;
                        isConfident = evalRes.confidence >= 70;
                      } else {
                        detectedDocType = ruleName;
                        isConfident = evalRes.confidence >= 30;
                      }
                    } else {
                      detectedDocType = ruleName;
                      isConfident = false;
                    }
                  } catch (matchErr) {
                    console.warn('[DocMitra Import] Filename matching warning:', matchErr);
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
      allDoneCard.className = 'p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300';
      const doneLeft = document.createElement('div');
      doneLeft.className = 'flex items-center gap-2';
      const checkIcon = document.createElement('span');
      checkIcon.className = 'material-symbols-outlined text-[18px] text-tertiary';
      checkIcon.textContent = 'check_circle';
      doneLeft.appendChild(checkIcon);
      const doneText = document.createElement('span');
      doneText.className = 'font-mono-code text-[11px] font-bold';
      doneText.textContent = 'All Required Documents Present';
      doneLeft.appendChild(doneText);
      allDoneCard.appendChild(doneLeft);

      const donePresetSelect = document.createElement('select');
      donePresetSelect.className = 'px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-900 dark:text-emerald-200 text-[10px] font-mono-code uppercase font-bold border-none outline-none cursor-pointer';
      const availablePresets = this.state.documentPresets ? Object.keys(this.state.documentPresets) : ['MAHA DBT', 'SWAYAM'];
      availablePresets.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (p === this.state.activePreset) opt.selected = true;
        donePresetSelect.appendChild(opt);
      });
      donePresetSelect.addEventListener('change', (e) => this.handleSwitchActivePreset(e.target.value));
      allDoneCard.appendChild(donePresetSelect);
      container.appendChild(allDoneCard);
    }

    // 2. SMART SUGGESTIONS CONTAINER (Always visible below Missing Documents)
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

    for (const sc of this.shortcuts21) {
      const code = (sc.code || '').toUpperCase();
      if (code && !poolCodes.has(code)) {
        pool.push(sc);
        poolCodes.add(code);
      }
    }
    for (const doc of allDocs) {
      const code = (doc.code || '').toUpperCase();
      if (code && !poolCodes.has(code)) {
        pool.push({
          code,
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

      const codeBadge = document.createElement('span');
      codeBadge.className = `px-2 py-0.5 rounded font-mono-code font-bold text-[11px] shrink-0 ${getShortcutBadgeColor(item.code)}`;
      codeBadge.textContent = item.code;
      left.appendChild(codeBadge);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'text-[12px] font-semibold text-on-surface truncate flex-1';
      labelSpan.textContent = item.label || item.canonical;
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
            current._pdfBytes = null;
            if (current._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
              try { URL.revokeObjectURL(current._blobUrl); } catch (_) {}
              current._blobUrl = null;
            }
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
        f._pdfBytes = null;
        if (f._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
          try { URL.revokeObjectURL(f._blobUrl); } catch (_) {}
          f._blobUrl = null;
        }
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

    // Duplicate collision avoidance in Smart Scan: collect all used target names and existing names
    const usedDestinations = new Set();
    for (const file of this.state.files) {
      usedDestinations.add(file.name);
      if (file.isRenamed || file.isKept || file.targetName) {
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

            if (evalRes.confidence >= 30 && evalRes.docType) {
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
      this.openCrossCheckModal();
    }

  /* ==========================================================================
     Dedicated Rename Tool Settings & Document Presets Management
     ========================================================================== */

  loadPresetsAndSettings() {
    // 1. Load active preset
    const savedActive = localStorage.getItem('docmitra_active_preset');
    if (savedActive) {
      this.state.activePreset = (savedActive === 'MAHA DBT FORM' || savedActive === 'MAHA DBT') ? 'MAHA DBT' :
                                (savedActive === 'SWAYAM FORM' || savedActive === 'SWAYAM') ? 'SWAYAM' : savedActive;
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

    if (!this.state.documentPresets || Object.keys(this.state.documentPresets).length === 0) {
      // Initialize with factory defaults: MAHA DBT and SWAYAM only
      this.state.documentPresets = {
        "MAHA DBT": [
          { name: "AADHAAR CARD", code: "ADR", keywords: ["aadhaar card", "adhar", "aadhar"] },
          { name: "PHOTO", code: "PIC", keywords: ["photo", "pic", "photograph"] },
          { name: "10TH MARKSHEET", code: "10M", keywords: ["10th marksheet", "10th mark", "ssc marksheet"] },
          { name: "10TH PASSING CERTIFICATE", code: "10P", keywords: ["10th passing", "ssc passing", "10th sanad"] },
          { name: "12TH MARKSHEET", code: "12M", keywords: ["12th marksheet", "12th mark", "hsc marksheet"] },
          { name: "12TH PASSING CERTIFICATE", code: "12P", keywords: ["12th passing", "hsc passing", "12th sanad"] },
          { name: "12TH LC", code: "12LC", keywords: ["12th lc", "12th tc", "leaving certificate"] },
          { name: "CASTE CERTIFICATE", code: "CST", keywords: ["caste certificate", "jati dakhla"] },
          { name: "VALIDITY CERTIFICATE", code: "VLD", keywords: ["validity certificate", "caste validity"] },
          { name: "INCOME CERTIFICATE", code: "INC", keywords: ["income certificate", "utpanna"] },
          { name: "NATIONALITY CERTIFICATE", code: "NAT", keywords: ["nationality certificate"] },
          { name: "DOMICILE CERTIFICATE", code: "DOM", keywords: ["domicile certificate", "adivasi dakhla", "rahavasi"] },
          { name: "PASSBOOK BANK", code: "BNK", keywords: ["passbook bank", "bank passbook", "bank account"] }
        ],
        "SWAYAM": [
          { name: "PHOTO", code: "PIC", keywords: ["photo", "pic", "photograph"] },
          { name: "AADHAAR CARD", code: "ADR", keywords: ["aadhaar card", "adhar", "aadhar"] },
          { name: "10TH MARKSHEET", code: "10M", keywords: ["10th marksheet", "10th mark"] },
          { name: "12TH MARKSHEET", code: "12M", keywords: ["12th marksheet", "12th mark"] },
          { name: "12TH LC", code: "12LC", keywords: ["12th lc", "leaving certificate"] },
          { name: "CASTE CERTIFICATE", code: "CST", keywords: ["caste certificate"] },
          { name: "DOMICILE CERTIFICATE", code: "DOM", keywords: ["domicile certificate"] },
          { name: "SELF DECLARATION", code: "SLF", keywords: ["self declaration", "svayam ghoshana"] },
          { name: "PARENT DECLARATION", code: "PAR", keywords: ["parent declaration", "palak ghoshana"] },
          { name: "PASSBOOK BANK", code: "BNK", keywords: ["passbook bank", "bank passbook"] },
          { name: "BONAFIDE CERTIFICATE", code: "BNF", keywords: ["bonafide certificate", "bonafide"] }
        ]
      };
      this.savePresetsAndSettings();
    }

    // 3. Load custom shortcuts
    try {
      const storedShortcuts = localStorage.getItem('docmitra_custom_shortcuts');
      if (storedShortcuts) {
        this.state.customShortcuts = JSON.parse(storedShortcuts);
        if (Array.isArray(this.state.customShortcuts)) {
          for (const cs of this.state.customShortcuts) {
            if (cs.code && !this.shortcuts21.some(s => s.code.toUpperCase() === cs.code.toUpperCase())) {
              this.shortcuts21.push({
                code: cs.code.toUpperCase(),
                label: cs.label || cs.canonical,
                canonical: cs.canonical
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[DocMitra Renamer] Failed to parse custom shortcuts:', e);
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
      saveDocumentPresets({ forms: this.state.documentPresets }).catch(() => {});
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
          if (name && (!item.canonical || item.canonical === item.code)) {
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
        opt.textContent = key;
        if (key === this.state.activePreset) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    // 2. Populate Documents in Active Preset Table
    const docs = this.getActivePresetDocuments();
    const countBadge = document.getElementById('presetDocCountBadge');
    if (countBadge) countBadge.textContent = String(docs.length);

    const tbody = document.getElementById('presetDocsTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      if (docs.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="5" class="py-4 text-center text-secondary italic">No documents in this preset. Click "Add Document to Preset" above.</td>';
        tbody.appendChild(emptyRow);
      } else {
        docs.forEach((doc, idx) => {
          const row = document.createElement('tr');
          row.className = 'hover:bg-surface-container-low transition-colors';

          const kwDisplay = Array.isArray(doc.keywords) ? doc.keywords.join(', ') : (doc.keywords || '');

          row.innerHTML = `
            <td class="py-2 px-3 text-center text-secondary font-mono-code">${idx + 1}</td>
            <td class="py-2 px-3 font-semibold text-on-surface">${doc.name}</td>
            <td class="py-2 px-3 font-mono-code font-bold text-primary">${doc.code || '-'}</td>
            <td class="py-2 px-3 text-secondary text-[11px] truncate max-w-xs" title="${kwDisplay}">${kwDisplay}</td>
            <td class="py-2 px-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-doc" title="Edit document" type="button" data-doc-idx="${idx}">
                  <span class="material-symbols-outlined text-[15px]">edit</span>
                </button>
                <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-doc" title="Remove document from preset" type="button" data-doc-idx="${idx}">
                  <span class="material-symbols-outlined text-[15px]">delete</span>
                </button>
              </div>
            </td>
          `;

          const editBtn = row.querySelector('.btn-edit-doc');
          if (editBtn) {
            editBtn.addEventListener('click', () => this.openEditDocumentModal(doc, idx));
          }
          const delBtn = row.querySelector('.btn-del-doc');
          if (delBtn) {
            delBtn.addEventListener('click', () => this.handleRemoveDocFromPreset(idx));
          }

          tbody.appendChild(row);
        });
      }
    }

    // 3. Populate Shortcuts Table
    const sTbody = document.getElementById('shortcutsTableBody');
    if (sTbody) {
      sTbody.innerHTML = '';
      const sCountBadge = document.getElementById('shortcutsCountBadge');
      if (sCountBadge) sCountBadge.textContent = String(this.shortcuts21.length);

      this.shortcuts21.forEach((s) => {
        const sRow = document.createElement('tr');
        sRow.className = 'hover:bg-surface-container-low transition-colors';
        const isCustom = (this.state.customShortcuts || []).some(cs => cs.code.toUpperCase() === s.code.toUpperCase());
        sRow.innerHTML = `
          <td class="py-2 px-3 font-mono-code font-bold text-primary">${s.code}</td>
          <td class="py-2 px-3 font-semibold text-on-surface">${s.canonical || s.label}</td>
          <td class="py-2 px-3 text-secondary text-[11px] font-mono-code">${s.label !== s.canonical ? s.label : '-'}</td>
          <td class="py-2 px-3 text-center">
            <div class="flex items-center justify-center gap-1">
              <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-shortcut" title="Edit shortcut" type="button" data-code="${s.code}">
                <span class="material-symbols-outlined text-[15px]">edit</span>
              </button>
              <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-shortcut" title="Delete shortcut" type="button" data-code="${s.code}">
                <span class="material-symbols-outlined text-[15px]">delete</span>
              </button>
            </div>
          </td>
        `;

        const sEditBtn = sRow.querySelector('.btn-edit-shortcut');
        if (sEditBtn) {
          sEditBtn.addEventListener('click', () => this.handleEditShortcut(s.code));
        }
        const sDelBtn = sRow.querySelector('.btn-del-shortcut');
        if (sDelBtn) {
          sDelBtn.addEventListener('click', () => this.handleRemoveShortcut(s.code));
        }
        sTbody.appendChild(sRow);
      });
    }
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
    const confirmReset = window.confirm('Reset document presets to factory defaults? All custom presets will be removed and default MahaDBT and Swayam restored.');
    if (!confirmReset) return;

    this.state.documentPresets = {
      "MAHA DBT": [
        { name: "AADHAAR CARD", code: "ADR", keywords: ["aadhaar card", "adhar", "aadhar"] },
        { name: "PHOTO", code: "PIC", keywords: ["photo", "pic", "photograph"] },
        { name: "10TH MARKSHEET", code: "10M", keywords: ["10th marksheet", "10th mark", "ssc marksheet"] },
        { name: "10TH PASSING CERTIFICATE", code: "10P", keywords: ["10th passing", "ssc passing", "10th sanad"] },
        { name: "12TH MARKSHEET", code: "12M", keywords: ["12th marksheet", "12th mark", "hsc marksheet"] },
        { name: "12TH PASSING CERTIFICATE", code: "12P", keywords: ["12th passing", "hsc passing", "12th sanad"] },
        { name: "12TH LC", code: "12LC", keywords: ["12th lc", "12th tc", "leaving certificate"] },
        { name: "CASTE CERTIFICATE", code: "CST", keywords: ["caste certificate", "jati dakhla"] },
        { name: "VALIDITY CERTIFICATE", code: "VLD", keywords: ["validity certificate", "caste validity"] },
        { name: "INCOME CERTIFICATE", code: "INC", keywords: ["income certificate", "utpanna"] },
        { name: "NATIONALITY CERTIFICATE", code: "NAT", keywords: ["nationality certificate"] },
        { name: "DOMICILE CERTIFICATE", code: "DOM", keywords: ["domicile certificate", "adivasi dakhla", "rahavasi"] },
        { name: "PASSBOOK BANK", code: "BNK", keywords: ["passbook bank", "bank passbook", "bank account"] }
      ],
      "SWAYAM": [
        { name: "PHOTO", code: "PIC", keywords: ["photo", "pic", "photograph"] },
        { name: "AADHAAR CARD", code: "ADR", keywords: ["aadhaar card", "adhar", "aadhar"] },
        { name: "10TH MARKSHEET", code: "10M", keywords: ["10th marksheet", "10th mark"] },
        { name: "12TH MARKSHEET", code: "12M", keywords: ["12th marksheet", "12th mark"] },
        { name: "12TH LC", code: "12LC", keywords: ["12th lc", "leaving certificate"] },
        { name: "CASTE CERTIFICATE", code: "CST", keywords: ["caste certificate"] },
        { name: "DOMICILE CERTIFICATE", code: "DOM", keywords: ["domicile certificate"] },
        { name: "SELF DECLARATION", code: "SLF", keywords: ["self declaration", "svayam ghoshana"] },
        { name: "PARENT DECLARATION", code: "PAR", keywords: ["parent declaration", "palak ghoshana"] },
        { name: "PASSBOOK BANK", code: "BNK", keywords: ["passbook bank", "bank passbook"] },
        { name: "BONAFIDE CERTIFICATE", code: "BNF", keywords: ["bonafide certificate", "bonafide"] }
      ]
    };
    this.state.activePreset = 'MAHA DBT';
    this.state.customShortcuts = [];
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
      toast.show('Document Removed', `${removed.name || 'Document'} removed from preset.`, 'info');
    }
  }

  handleRemoveShortcut(code) {
    if (!code) return;
    this.state.customShortcuts = (this.state.customShortcuts || []).filter(s => s.code.toUpperCase() !== code.toUpperCase());
    this.shortcuts21 = this.shortcuts21.filter(s => s.code.toUpperCase() !== code.toUpperCase());
    this.savePresetsAndSettings();
    this.renderSettingsModal('shortcuts');
    toast.show('Shortcut Removed', `Shortcut ${code} removed.`, 'info');
  }

  openEditDocumentModal(doc, idx) {
    this._editingDocIdx = idx;
    this.openAddDocumentModal(doc, false);
  }

  handleEditShortcut(code) {
    const s = this.shortcuts21.find(x => x.code.toUpperCase() === code.toUpperCase());
    if (!s) return;
    const cs = (this.state.customShortcuts || []).find(x => x.code.toUpperCase() === code.toUpperCase());
    this._editingShortcutCode = code.toUpperCase();
    this.openAddDocumentModal({
      code: s.code,
      name: s.canonical || s.label,
      keywords: cs ? cs.keywords : []
    }, true);
  }

  openAddDocumentModal(editDoc = null, isShortcutOnly = false) {
    const modal = document.getElementById('modalAddDocument');
    if (!modal) return;
    const inputCode = document.getElementById('inputAddDocCode');
    const inputName = document.getElementById('inputAddDocName');
    const inputAliases = document.getElementById('inputAddDocAliases');
    const previewEl = document.getElementById('addDocTargetPreview');
    const titleEl = modal.querySelector('h3');

    this._isShortcutOnly = Boolean(isShortcutOnly);

    if (editDoc) {
      if (titleEl) titleEl.textContent = isShortcutOnly ? 'Edit Shortcut' : 'Edit Document in Preset';
      if (inputCode) inputCode.value = editDoc.code || '';
      if (inputName) inputName.value = editDoc.name || editDoc.canonical || '';
      if (inputAliases) inputAliases.value = Array.isArray(editDoc.keywords) ? editDoc.keywords.join(', ') : (editDoc.keywords || '');
    } else {
      this._editingDocIdx = null;
      this._editingShortcutCode = null;
      if (titleEl) titleEl.textContent = isShortcutOnly ? 'Add Shortcut' : 'Add Document to Preset';
      if (inputCode) inputCode.value = '';
      if (inputName) inputName.value = '';
      if (inputAliases) inputAliases.value = '';
    }

    const updatePreview = () => {
      const docName = inputName?.value.trim() || 'DOCUMENT';
      const formula = buildName(docName, this.state.studentName, null, this.state.style);
      const cleanBase = formula.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
      if (previewEl) previewEl.textContent = `${cleanBase}.pdf`;
    };

    if (inputName) {
      inputName.oninput = updatePreview;
      inputName.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSaveDocumentType();
        }
      };
    }
    if (inputCode) {
      inputCode.oninput = () => {
        inputCode.value = inputCode.value.toUpperCase();
      };
      inputCode.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          inputName?.focus();
        }
      };
    }
    updatePreview();
    modal.classList.remove('hidden');
    if (inputCode) inputCode.focus();
  }

  closeAddDocumentModal() {
    const modal = document.getElementById('modalAddDocument');
    if (modal) modal.classList.add('hidden');
    this._editingDocIdx = null;
    this._editingShortcutCode = null;
    this._isShortcutOnly = false;
  }

  handleSaveDocumentType() {
    const inputCode = document.getElementById('inputAddDocCode');
    const inputName = document.getElementById('inputAddDocName');
    const inputAliases = document.getElementById('inputAddDocAliases');

    const rawName = (inputName?.value || '').trim();
    if (!rawName) {
      toast.show('Document Name Required', 'Please enter a Full Document Name.', 'warning');
      return;
    }

    const docName = rawName.toUpperCase();
    let docCode = (inputCode?.value || '').trim().toUpperCase();
    if (!docCode) {
      const words = docName.split(/\s+/).filter(Boolean);
      docCode = words.map(w => w[0]).join('').slice(0, 4);
    }

    const rawAliases = (inputAliases?.value || '').trim();
    let keywords = [];
    if (rawAliases) {
      keywords = rawAliases.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else {
      keywords = [docName.toLowerCase(), ...extractCleanTokens(docName)];
    }

    const wasShortcutOnly = this._isShortcutOnly;

    // 1. Add/update in active preset documents unless shortcut-only mode
    if (!wasShortcutOnly) {
      if (!this.state.documentPresets[this.state.activePreset]) {
        this.state.documentPresets[this.state.activePreset] = [];
      }
      const currentList = this.state.documentPresets[this.state.activePreset];
      const docEntry = { name: docName, code: docCode, keywords };

      if (this._editingDocIdx !== null && this._editingDocIdx !== undefined && currentList[this._editingDocIdx]) {
        currentList[this._editingDocIdx] = docEntry;
      } else {
        const existingIdx = currentList.findIndex(item => {
          const n = (typeof item === 'string' ? item : item.name || '').toUpperCase();
          return n === docName;
        });
        if (existingIdx !== -1) {
          currentList[existingIdx] = docEntry;
        } else {
          currentList.push(docEntry);
        }
      }
    }

    // 2. Add/update in shortcuts dictionary
    if (docCode) {
      // If editing an existing shortcut with a different code, clean old code
      if (this._editingShortcutCode && this._editingShortcutCode !== docCode) {
        this.shortcuts21 = this.shortcuts21.filter(s => s.code.toUpperCase() !== this._editingShortcutCode);
        this.state.customShortcuts = (this.state.customShortcuts || []).filter(s => s.code.toUpperCase() !== this._editingShortcutCode);
      }

      const existingShortcutIdx = this.shortcuts21.findIndex(s => s.code.toUpperCase() === docCode);
      if (existingShortcutIdx !== -1) {
        this.shortcuts21[existingShortcutIdx] = { code: docCode, label: rawName, canonical: docName };
      } else {
        this.shortcuts21.push({ code: docCode, label: rawName, canonical: docName });
      }

      if (!this.state.customShortcuts) this.state.customShortcuts = [];
      const csIdx = this.state.customShortcuts.findIndex(s => s.code.toUpperCase() === docCode);
      if (csIdx !== -1) {
        this.state.customShortcuts[csIdx] = { code: docCode, label: rawName, canonical: docName, keywords };
      } else {
        this.state.customShortcuts.push({ code: docCode, label: rawName, canonical: docName, keywords });
      }

      registerDocumentSignature({
        canonical: docName,
        code: docCode,
        primaryKeywords: [docName.toLowerCase(), docCode.toLowerCase()],
        secondaryKeywords: keywords
      });
    }

    this._editingDocIdx = null;
    this._editingShortcutCode = null;
    this._isShortcutOnly = false;

    // 3. Persist and refresh
    this.savePresetsAndSettings();
    this.closeAddDocumentModal();
    this._recalculateTargetNames(true);
    this.updateTelemetry();
    this.renderQueue();
    this.renderCurrentPreview();
    this.renderSettingsModal(wasShortcutOnly ? 'shortcuts' : 'presets');
    toast.show('Saved', `${docName} saved successfully.`, 'success');
  }

    /* ==========================================================================
       High-Speed Cross-Check Preview Modal & Batch Execution Handlers
       ========================================================================== */
    openCrossCheckModal() {
      const matched = this.state.files.filter(f => !f.isRenamed && f.status !== 'needs_review' && (f.smartConfidence >= 80 || (f.smartConfidence === undefined && f.isMatched)));
      if (matched.length === 0) {
        toast.show('No Matched Files', 'No documents ready for batch rename.', 'info');
        return;
      }

      const modal = document.getElementById('modalCrossCheck');
      if (!modal) return;

      const tbody = document.getElementById('crossCheckTableBody');
      const selectAllCb = document.getElementById('chkCrossCheckSelectAll');
      const totalEl = document.getElementById('crossCheckTotalCount');
      const selectedEl = document.getElementById('crossCheckSelectedCount');
      const studentLabel = document.getElementById('crossCheckStudentLabel');
      const confirmLabel = document.getElementById('confirmRenameLabel');

      if (studentLabel) studentLabel.textContent = this.state.studentName || 'Not Set';
      if (totalEl) totalEl.textContent = String(matched.length);
      if (selectedEl) selectedEl.textContent = String(matched.length);
      if (confirmLabel) confirmLabel.textContent = `Confirm & Rename (${matched.length})`;
      if (selectAllCb) selectAllCb.checked = true;

      if (tbody) {
        tbody.innerHTML = '';
        const sName = (this.state.studentName || '').trim();

        matched.forEach(f => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-surface-container-high/40 transition-colors';
          tr.dataset.fileId = f.id;

          const oldClean = cleanName(f.name);
          const newClean = cleanName(f.targetName || f.name);

          // Determine difference status
          let changeStatus = 'rename'; // 'identical' | 'casing' | 'student' | 'rename'
          if (oldClean === newClean) {
            changeStatus = 'identical';
          } else if (oldClean.toLowerCase() === newClean.toLowerCase()) {
            changeStatus = 'casing';
          } else if (sName && newClean.toLowerCase().includes(sName.toLowerCase()) && !oldClean.toLowerCase().includes(sName.toLowerCase())) {
            changeStatus = 'student';
          }

          // Checkbox: Default unchecked for identical rows, checked for changes
          const tdCb = document.createElement('td');
          tdCb.className = 'py-2 px-3 text-center';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = (changeStatus !== 'identical');
          cb.className = 'w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer crosscheck-row-cb';
          cb.addEventListener('change', () => this._updateCrossCheckSelectionCount());
          tdCb.appendChild(cb);
          tr.appendChild(tdCb);

          // Old Name (clean basename, NO extension)
          const tdOld = document.createElement('td');
          tdOld.className = 'py-2 px-3 text-secondary truncate max-w-[220px] font-mono-code text-[12px]';
          tdOld.title = oldClean;
          tdOld.textContent = oldClean;
          tr.appendChild(tdOld);

          // Arrow
          const tdArr = document.createElement('td');
          tdArr.className = 'py-2 px-2 text-center text-outline-variant font-bold select-none';
          tdArr.textContent = '→';
          tr.appendChild(tdArr);

          // Suggested New Name (clean basename, NO extension, student highlighted)
          const tdNew = document.createElement('td');
          tdNew.className = 'py-2 px-3 font-bold text-on-surface truncate max-w-[260px] font-mono-code text-[12px]';
          tdNew.title = newClean;

          if (sName && newClean.toLowerCase().includes(sName.toLowerCase())) {
            const idx = newClean.toLowerCase().indexOf(sName.toLowerCase());
            const before = newClean.slice(0, idx);
            const matchStr = newClean.slice(idx, idx + sName.length);
            const after = newClean.slice(idx + sName.length);
            tdNew.appendChild(document.createTextNode(before));
            const hl = document.createElement('span');
            hl.className = 'text-primary bg-primary/10 px-1 rounded';
            hl.textContent = matchStr;
            tdNew.appendChild(hl);
            tdNew.appendChild(document.createTextNode(after));
          } else {
            tdNew.textContent = newClean;
          }
          tr.appendChild(tdNew);

          // Difference / Status badge
          const tdConf = document.createElement('td');
          tdConf.className = 'py-2 px-3 text-right';
          const confBadge = document.createElement('span');

          if (changeStatus === 'identical') {
            confBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-surface-container-high text-secondary';
            confBadge.textContent = 'Identical';
          } else if (changeStatus === 'casing') {
            confBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-primary/10 text-primary';
            confBadge.textContent = 'Case Change';
          } else if (changeStatus === 'student') {
            confBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary-fixed text-on-tertiary-fixed';
            confBadge.textContent = '+ Student';
          } else {
            const conf = f.smartConfidence !== undefined ? f.smartConfidence : 90;
            confBadge.className = 'confidence-badge confidence-badge-high';
            confBadge.textContent = `🟢 ${conf}% Rename`;
          }

          tdConf.appendChild(confBadge);
          tr.appendChild(tdConf);

          tbody.appendChild(tr);
        });
      }

      this._updateCrossCheckSelectionCount();

      if (selectAllCb) {
        selectAllCb.onchange = (e) => {
          const checkboxes = modal.querySelectorAll('.crosscheck-row-cb');
          checkboxes.forEach(cb => { cb.checked = e.target.checked; });
          this._updateCrossCheckSelectionCount();
        };
      }

      modal.classList.remove('hidden');
    }

    _updateCrossCheckSelectionCount() {
      const modal = document.getElementById('modalCrossCheck');
      if (!modal) return;
      const checkboxes = modal.querySelectorAll('.crosscheck-row-cb');
      const checked = Array.from(checkboxes).filter(cb => cb.checked);
      const selectedEl = document.getElementById('crossCheckSelectedCount');
      const confirmLabel = document.getElementById('confirmRenameLabel');
      const confirmBtn = document.getElementById('btnConfirmBatchRename');
      const selectAllCb = document.getElementById('chkCrossCheckSelectAll');

      if (selectedEl) selectedEl.textContent = String(checked.length);
      if (confirmLabel) confirmLabel.textContent = `Confirm & Rename (${checked.length})`;
      if (confirmBtn) confirmBtn.disabled = checked.length === 0;
      if (selectAllCb) selectAllCb.checked = (checkboxes.length > 0 && checked.length === checkboxes.length);
    }

    closeCrossCheckModal() {
      const modal = document.getElementById('modalCrossCheck');
      if (modal) modal.classList.add('hidden');
    }

  async handleConfirmCrossCheckRename() {
      const modal = document.getElementById('modalCrossCheck');
      if (!modal) return;

      const rows = modal.querySelectorAll('#crossCheckTableBody tr');
      const selectedFiles = [];
      rows.forEach(tr => {
        const cb = tr.querySelector('.crosscheck-row-cb');
        if (cb && cb.checked) {
          const f = this.state.files.find(x => x.id === tr.dataset.fileId);
          if (f) selectedFiles.push(f);
        }
      });

      if (selectedFiles.length === 0) {
        toast.show('No Files Selected', 'Please select at least one document to rename.', 'warning');
        return;
      }

      for (const f of selectedFiles) {
        const err = validateFilename(f.targetName);
        if (err) {
          toast.show('Validation Error', `${cleanName(f.name)}: ${err}`, 'error');
          return;
        }
      }

      const plan = selectedFiles.map(f => ({
        old: f.name,
        next: f.targetName,
        file: f,
        nativePath: f.path,
        studentName: this.state.studentName || '',
        rotation: f.rotation || 0
      }));

      toast.show('Executing Batch Rename', `Processing ${plan.length} matched documents...`, 'info');

      try {
        const result = await executeRename(this.state.folder, plan, (pct, status) => {
          console.log(`[Batch Rename Progress] ${pct}%: ${status}`);
        });

        undoManager.pushBatch(this.state.folder, plan);

        selectedFiles.forEach(f => {
          f.name = f.targetName;
          f.isRenamed = true;
          f.status = 'renamed';
          f.rotation = 0;
          f._pdfBytes = null;
          if (f._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
            try { URL.revokeObjectURL(f._blobUrl); } catch (_) {}
            f._blobUrl = null;
          }
        });

        this.closeCrossCheckModal();
        toast.show('Batch Complete!', `Successfully renamed ${plan.length} documents.`, 'success');
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
      if (this.state.files && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        for (const f of this.state.files) {
          if (f && f._blobUrl) {
            try { URL.revokeObjectURL(f._blobUrl); } catch (_) {}
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

      if (isImage) {
        const img = document.createElement('img');
        img.alt = file.name;
        img.className = 'w-full h-full object-contain';

        const applyBlob = (blobUrl) => {
          file._blobUrl = blobUrl;
          img.src = blobUrl;
          if (!stage.contains(img)) {
            stage.innerHTML = '';
            stage.appendChild(img);
          }
        };

        if (file._blobUrl) {
          applyBlob(file._blobUrl);
        } else if (file.fileObj) {
          try {
            applyBlob(URL.createObjectURL(file.fileObj));
          } catch (_) {
            this._renderDocumentInfoFallback(stage, file);
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
                  img.onload = () => { stage.innerHTML = ''; stage.appendChild(img); };
                  img.onerror = () => this._renderDocumentInfoFallback(stage, file);
                } else {
                  this._renderDocumentInfoFallback(stage, file);
                }
              });
          } else {
            const previewUrl = resolveFilePreviewUrl(file);
            if (previewUrl) {
              img.src = previewUrl;
              img.onload = () => { stage.innerHTML = ''; stage.appendChild(img); };
              img.onerror = () => this._renderDocumentInfoFallback(stage, file);
            } else {
              this._renderDocumentInfoFallback(stage, file);
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
            stage.innerHTML = '';
            stage.appendChild(canvas);
            this.state.activePdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
            this.state.activePdfUrl = file.path || file.name;
            this.state.totalPdfPages = this.state.activePdfDoc.numPages || 1;
            this.state.currentPdfPage = 1;
            await this._renderPdfPage(1, canvas);
          } catch (pdfErr) {
            console.warn('PDF render error:', pdfErr);
            this._renderDocumentInfoFallback(stage, file);
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
            .catch(() => this._renderDocumentInfoFallback(stage, file));
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
                    .catch(() => this._renderDocumentInfoFallback(stage, file));
                } else {
                  this._renderDocumentInfoFallback(stage, file);
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
                .catch(() => this._renderDocumentInfoFallback(stage, file));
            } else {
              this._renderDocumentInfoFallback(stage, file);
            }
          }
        }
      } else {
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
                  if (callback) callback();
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
