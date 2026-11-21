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

import { toast } from './toast.js';
import {
  selectNativeFolder,
  selectNativeFiles,
  listNativeDirectory,
  renameNativeFile,
  openFolderInExplorer,
  isNativeAvailable
} from '../services/native-bridge-service.js';
import { matchDocument } from '../libraries/shortcut-keyword-library.js';
import { evaluateMatch } from '../libraries/document-matcher.js';
import { buildName, cleanName, ext, validateFilename, executeRename, undoRename } from '../libraries/rename-library.js';
import { uniqueDestination } from '../libraries/duplicate-name-library.js';
import { undoManager } from '../libraries/undo-library.js';
import { issuesFor, correctSpelling } from '../libraries/spelling-library.js';
import { evaluateChecklistRule } from '../libraries/checklist-library.js';
import { generateBatchAuditCSV, downloadCSV } from '../libraries/export-reports-library.js';
import { recordRenameEvent } from '../services/analytics-service.js';
import { loadSettings, saveSettings } from '../services/storage-service.js';
import {
  CANONICAL_NAMES,
  DEFAULT_SPELLING_RULES,
  DEFAULT_LINKED_RULES,
  DEFAULT_CHECKLISTS_DATA
} from '../core/constants.js';

export function isJunkFile(filename) {
  if (!filename) return true;
  const lower = filename.toLowerCase().trim();
  if (lower === 'thumbs.db' || lower === 'ehthumbs.db' || lower === 'desktop.ini' || lower === '.ds_store') return true;
  if (lower.startsWith('.') || lower.startsWith('~$') || lower.endsWith('.tmp')) return true;
  return false;
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
      history: [],
      zoom: 100,
      rotation: 0,
      panEnabled: false,
      splitCompare: false,
      watcherActive: true,
      lastMtimeCheck: 0
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
    this._startBackgroundWatcher();

    // Listen for external settings updates from Settings modal
    window.addEventListener('storage', (e) => {
      if (e.key === 'docmitra_settings') {
        this.state.settings = loadSettings();
        this.state.style = this.state.settings?.style || 'preserve';
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

    // Clear Queue
    const btnClear = document.getElementById('btnClearQueue');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClearQueue());
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
        this.state.rotation = 0;
        if (zoomSlider) zoomSlider.value = 100;
        this._applyPreviewTransform();
      });
    }

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        this.state.rotation = (this.state.rotation + 90) % 360;
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

    // Attach dragging to preview stage wrapper for pan navigation
    const stageWrapper = colPreview.querySelector('.overflow-auto');
    if (stageWrapper) {
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
  }

  _applyPreviewTransform() {
    const stage = document.getElementById('previewContainerStage');
    if (stage) {
      stage.style.transform = `scale(${this.state.zoom / 100}) rotate(${this.state.rotation}deg)`;
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
        }

        const desiredWithExt = (suggested.endsWith(extension) ? suggested : suggested + extension);
        const uniqueName = uniqueDestination(desiredWithExt, f.name, usedDestinations);
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
          isKept: false
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
      }

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
        status: isMatched ? 'matched' : 'pending',
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
    const ready = this.state.files.filter(f => f.isMatched || f.isRenamed || f.isKept).length;
    const unmatched = total - ready;
    const pct = total > 0 ? Math.round((ready / total) * 100) : 0;

    const pathEl = document.getElementById('activeFolderPath');
    if (pathEl) {
      pathEl.textContent = this.state.folder ? this.state.folder.path : 'No folder selected';
    }

    const counterPill = document.getElementById('folderCounterPill');
    if (counterPill) {
      if (this.state.subfolders.length > 0) {
        counterPill.textContent = `Folder ${this.state.currentSubfolderIndex + 1} of ${this.state.subfolders.length}`;
      } else {
        counterPill.textContent = 'Folder 1 of 1';
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
      desc.textContent = 'Click "Select Folder" (F2) or "Add Files" to start renaming student admission documents.';
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

      // Binary status tag: Green Matched or Red Unmatched
      const isReady = currentFile.isMatched || currentFile.isRenamed || currentFile.isKept;
      const statusTag = document.createElement('span');
      statusTag.className = isReady
        ? 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold'
        : 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold';
      statusTag.textContent = isReady ? 'Matched' : 'Unmatched';
      headerRow.appendChild(statusTag);

      activeCardWrapper.appendChild(headerRow);

      const card = document.createElement('article');
      card.className = 'bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md border-2 border-primary ring-2 ring-primary/20 relative';

      // Original filename label with click-to-reset
      const origRow = document.createElement('div');
      origRow.className = 'flex items-center justify-between text-[11px] font-mono-code text-secondary';
      const origLabel = document.createElement('span');
      origLabel.textContent = 'Original: ';
      const origVal = document.createElement('strong');
      origVal.className = 'text-on-surface truncate max-w-[260px] inline-block cursor-pointer hover:underline hover:text-primary transition-colors';
      origVal.title = 'Click to reset input to original name';
      origVal.textContent = currentFile.name;

      origVal.addEventListener('click', () => {
        const cleanOriginal = cleanName(currentFile.name);
        currentFile.targetName = currentFile.name;
        this.updateTelemetry();
        this.renderQueue();
        toast.show('Input Reset', cleanOriginal, 'info');
      });

      origLabel.appendChild(origVal);
      origRow.appendChild(origLabel);

      const sizeLabel = document.createElement('span');
      sizeLabel.textContent = `${(currentFile.size / 1024).toFixed(0)} KB`;
      origRow.appendChild(sizeLabel);
      card.appendChild(origRow);

      // Rename target input (Base Name only + Locked Extension Badge)
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
      targetInput.className = 'flex-1 h-11 px-3 rounded-l-lg bg-surface-container-lowest font-mono-code text-[14px] text-on-surface font-semibold border-2 border-r-0 border-primary focus:ring-0 outline-none transition-all';
      
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

        const trimmedVal = val.trim();
        const currentExt = currentFile.ext;

        if (!trimmedVal) {
          currentFile.targetName = currentFile.name;
          currentFile.docType = null;
          currentFile.isMatched = false;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold';
          statusTag.textContent = 'Unmatched';
          this.updateTelemetry();
          return;
        }

        // Live evaluation formula & smart keyword matching
        const spellingFixed = correctSpelling(trimmedVal, DEFAULT_SPELLING_RULES);
        const matchResult = evaluateMatch(spellingFixed, this.state.settings?.groups);
        const shortDoc = matchDocument(spellingFixed, this.state.settings?.groups) || matchDocument(trimmedVal, this.state.settings?.groups);
        const recognized = shortDoc || matchResult.docType || null;

        if (recognized) {
          const canonical = CANONICAL_NAMES[recognized.toUpperCase()] || recognized;
          currentFile.docType = canonical;
          currentFile.isMatched = true;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold';
          statusTag.textContent = `Matched: ${canonical}`;

          // Live formula calculation
          const formulaBase = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
          currentFile.targetName = formulaBase.endsWith(currentExt) ? formulaBase : `${formulaBase}${currentExt}`;
        } else {
          currentFile.docType = null;
          currentFile.isMatched = false;
          statusTag.className = 'px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold';
          statusTag.textContent = 'Unmatched';
          currentFile.targetName = trimmedVal.endsWith(currentExt) ? trimmedVal : `${trimmedVal}${currentExt}`;
        }

        this.updateTelemetry();

        // Update live preview document title in canvas if present
        const stageTitle = document.querySelector('#previewContainerStage .font-headline-sm');
        if (stageTitle) {
          stageTitle.textContent = currentFile.targetName;
        }
      });

      inputWrapper.appendChild(targetInput);

      // Locked Extension Pill Badge
      const extBadge = document.createElement('span');
      extBadge.className = 'h-11 px-3 rounded-r-lg bg-surface-container text-secondary font-mono-code text-[13px] font-bold border-2 border-l-0 border-primary flex items-center select-none shadow-xs';
      extBadge.textContent = currentFile.ext;
      inputWrapper.appendChild(extBadge);

      inputSection.appendChild(inputWrapper);
      card.appendChild(inputSection);

      // 21 Quick Document Presets Grid (One-Click Instant Rename)
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
      presetTip.textContent = '1-Click Instant Rename';
      presetHeader.appendChild(presetTip);
      presetsSection.appendChild(presetHeader);

      const presetsGrid = document.createElement('div');
      presetsGrid.className = 'grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5';

      this.shortcuts21.forEach(sc => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[11px] font-semibold border border-outline-variant/40 hover:border-primary/50 transition-all flex items-center gap-1 shadow-xs justify-center cursor-pointer active:scale-95';

        const badge = document.createElement('span');
        badge.className = 'px-1 py-0.2 rounded bg-surface-container-highest text-secondary text-[9px] font-bold';
        badge.textContent = sc.code;
        btn.appendChild(badge);

        const lbl = document.createElement('span');
        lbl.className = 'truncate';
        lbl.textContent = sc.label;
        btn.appendChild(lbl);

        // One-Click Instant Rename
        btn.addEventListener('click', () => {
          this.applyShortcutToCurrent(sc);
        });

        presetsGrid.appendChild(btn);
      });

      presetsSection.appendChild(presetsGrid);
      card.appendChild(presetsSection);

      activeCardWrapper.appendChild(card);
      scrollContainer.appendChild(activeCardWrapper);

      // Auto-focus and select all text in input box
      requestAnimationFrame(() => {
        targetInput.focus();
        targetInput.select();
        // Pin active card to top of view
        activeCardWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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

        // Click upcoming item to jump and focus
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
        targetTitle.textContent = cleanName(f.targetName || f.suggestedName || f.name);
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
        const fIdx = this.state.files.indexOf(f);
        const item = document.createElement('article');
        item.className = 'bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-1.5 flex items-center justify-between gap-space-sm border border-emerald-300 cursor-pointer hover:bg-emerald-50/50 transition-colors';
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

  /**
   * One-Click Instant Rename via Shortcut Button
   */
  async applyShortcutToCurrent(shortcut) {
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
      this.handleKeepOriginal();
      return;
    }

    // 1. Check if user typed a short keyword e.g. "12m", "pan", "adr"
    const baseTyped = targetFilename.endsWith(currentExt)
      ? targetFilename.slice(0, -currentExt.length).trim()
      : targetFilename;

    const spellingFixed = correctSpelling(baseTyped, DEFAULT_SPELLING_RULES);
    const matchedDoc = matchDocument(spellingFixed, this.state.settings?.groups) ||
                       matchDocument(baseTyped, this.state.settings?.groups);
    const evalResult = evaluateMatch(spellingFixed, this.state.settings?.groups);
    const recognized = matchedDoc || evalResult.docType || null;

    if (recognized) {
      const canonical = CANONICAL_NAMES[recognized.toUpperCase()] || recognized;
      const formatted = buildName(canonical, this.state.studentName, this.state.settings?.groups, this.state.style);
      targetFilename = formatted.endsWith(currentExt) ? formatted : `${formatted}${currentExt}`;
      current.docType = canonical;
      current.isMatched = true;
    } else if (!targetFilename.endsWith(currentExt)) {
      targetFilename = `${targetFilename}${currentExt}`;
    }

    // UNIQUE DESTINATION NUMBERING: Ensure no duplicate overwrites!
    const used = new Set(this.state.files.map(f => f.targetName));
    used.delete(current.targetName);
    targetFilename = uniqueDestination(targetFilename, current.name, used);

    const error = validateFilename(targetFilename);
    if (error) {
      toast.show('Invalid Filename', error, 'error');
      return;
    }

    // Perform atomic rename on disk immediately
    try {
      const dirPath = this.state.folder?.path || '';
      const oldPath = current.path || (dirPath ? `${dirPath}/${current.name}` : null);

      if (oldPath && current.name !== targetFilename) {
        const res = await renameNativeFile(oldPath, targetFilename);
        if (res.success) {
          const updatedPath = res.path || (oldPath.replace(/\\/g, '/').replace(/\/[^\/]+$/, '') + '/' + targetFilename);
          // Push to undo stack
          undoManager.pushBatch(this.state.folder, [{
            old: current.name,
            next: targetFilename,
            file: current,
            nativePath: current.path
          }]);

          current.name = targetFilename;
          current.targetName = targetFilename;
          current.path = updatedPath;
          current.nativePath = updatedPath;
          current.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(updatedPath)}`;
          current.isRenamed = true;
          current.status = 'renamed';
          recordRenameEvent(1);
          toast.show('Renamed', targetFilename, 'success');
        } else {
          toast.show('Rename Error', res.error || 'Failed to rename on disk', 'error');
          return;
        }
      } else {
        current.name = targetFilename;
        current.targetName = targetFilename;
        current.isRenamed = true;
        current.status = 'renamed';
        toast.show('Name Confirmed', targetFilename, 'info');
      }
    } catch (err) {
      toast.show('Rename Failed', err.message, 'error');
      return;
    }

    this.updateTelemetry();

    // Advance to next pending file
    const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed && !f.isKept);
    if (nextPending !== -1) {
      this.state.currentIndex = nextPending;
    } else {
      const firstPending = this.state.files.findIndex(f => !f.isRenamed && !f.isKept);
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

  handleKeepOriginal() {
    const current = this.state.files[this.state.currentIndex];
    if (!current) return;

    current.targetName = current.name;
    current.isKept = true;
    current.status = 'kept';

    toast.show('Kept Original', current.name, 'info');

    // Advance to next pending file
    const nextPending = this.state.files.findIndex((f, idx) => idx > this.state.currentIndex && !f.isRenamed && !f.isKept);
    if (nextPending !== -1) {
      this.state.currentIndex = nextPending;
    } else {
      const firstPending = this.state.files.findIndex(f => !f.isRenamed && !f.isKept);
      if (firstPending !== -1) {
        this.state.currentIndex = firstPending;
      }
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

    for (const f of pending) {
      const err = validateFilename(f.targetName);
      if (err) {
        toast.show('Validation Error', `${f.name}: ${err}`, 'error');
        return;
      }
    }

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

      undoManager.pushBatch(this.state.folder, plan);

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
    } else if (isPdf && window.pdfjsLib && file.url) {
      const canvas = document.createElement('canvas');
      canvas.className = 'w-full h-full object-contain';
      stage.appendChild(canvas);

      window.pdfjsLib.getDocument(file.url).promise.then(pdf => {
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
        this._renderDocumentInfoFallback(stage, file);
      });
    } else {
      if (isPdf && !window.pdfjsLib && !this._pdfLoading) {
        this._pdfLoading = true;
        const s = document.createElement('script');
        s.src = 'assets/js/libs/pdf.min.js';
        s.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/libs/pdf.worker.min.js';
            this.renderCurrentPreview();
          }
        };
        document.head.appendChild(s);
      }
      this._renderDocumentInfoFallback(stage, file);
    }

    return stage;
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
