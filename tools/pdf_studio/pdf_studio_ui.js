/**
 * tools/pdf_studio/pdf_studio_ui.js
 * DocMitra PDF Studio UI Binding & Adapter
 * Connects the PDF Studio screen to pure logic in tools/pdf_studio/pdf_studio_logic.js,
 * Tauri Zero-Port Native IPC bridge, and local disk subfolder operations.
 *
 * STRICT RULES:
 * 1. Zero localhost:3000 dependencies (Tauri read_binary_file / write_binary_file only).
 * 2. Zero browser <a download> hacks — saves directly to <source>/<Subfolder>/ under Zero-Overwrite.
 * 3. 100% offline, privacy-first local processing.
 * 4. Scoped execution under #view-pdf-studio and .pdf-studio-scope.
 */

import { toast } from '../../shared/toast.js';
import {
  selectNativeFolder,
  selectNativeFiles,
  readBinaryFile,
  writeBinaryFile,
  openFolderInExplorer
} from '../../shared/native-bridge.js';
import {
  createPdfFromJpegs,
  extractJpegsFromPdf,
  getDocumentImagesFromPdf,
  convertPdfToJpg,
  splitPdfDocument,
  mergePdfDocuments,
  rotatePdfDocument,
  formatSizeSuffixFilename,
  getSubfolderName,
  parsePageRanges,
  renderPdfPagesToJpegs
} from './pdf_studio_logic.js';
import { rotateFilePhysicallyOnDisk } from './rotation_engine.js';
import {
  compressBatchParallel,
  compressSingleDocumentPro,
  formatProSizeSuffix
} from './compress_pro_engine.js';

export class PdfStudioUIManager {
  constructor() {
    this.activeTool = 'compress_pdf'; // 'compress_pdf' | 'merge_pdf' | 'split_pdf' | 'pdf_to_jpg' | 'jpg_to_pdf' | 'rotate_pdf' | 'clean_pdf'
    this.files = []; // Array of { id, name, path, dir, size, bytes: Uint8Array, pageCount, rotation, status }
    this.activeFolderPath = '';
    this.activeFolderName = '';
    this.targetKb = 300;
    this.jpgDpi = 150;
    this.splitPageRange = '';
    this.isProcessing = false;
    this.lastOutputFolder = '';
    this.sortDesc = true;
    this.draggedIndex = null;
    this.targetSizeMode = 'kb'; // 'kb' | 'mb' (Strict Mutual-Exclusive Lock)
    this.completionSummary = null; // Stored on 100% completion

    // Bento Preview Modal state (Choice 3-B)
    this.modalFileIdx = -1;
    this.modalPage = 1;
    this.modalTotalPages = 1;
    this.modalZoom = 'fit';
    this.modalRotation = 0;
    this.modalPdfDoc = null;
    this.renderTask = null;
  }

  init() {
    this._bindRibbonTools();
    this._bindActions();
    this._bindDropzone();
    this._bindTargetSizeControls();
    this._bindBentoDropdowns();
    this._bindModalControls();
    this._bindHotkeys();
    this.setTool('compress_pdf');
    this.renderQueue();
    console.info('[DocMitra PDF Studio] Zero-Port Native UI Manager initialized.');
  }

  _bindRibbonTools() {
    const toolBtns = document.querySelectorAll('#view-pdf-studio .tool-ribbon-btn');
    toolBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tool = btn.getAttribute('data-tool') || 'compress_pdf';
        this.setTool(tool, btn);
      });
    });
  }

  setTool(toolName, activeBtn = null) {
    this.activeTool = toolName;

    // Update ribbon active styling
    const toolBtns = document.querySelectorAll('#view-pdf-studio .tool-ribbon-btn');
    toolBtns.forEach(b => {
      b.classList.remove('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-sm');
      b.classList.add('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-on-surface');
      const badge = b.querySelector('.active-tool-badge');
      if (badge) badge.remove();
    });

    const targetBtn = activeBtn || document.querySelector(`#view-pdf-studio .tool-ribbon-btn[data-tool="${toolName}"]`);
    if (targetBtn) {
      targetBtn.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-on-surface');
      targetBtn.classList.add('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-sm');

      // Guarantee strictly ONE active badge exists
      const existingBadge = targetBtn.querySelector('.active-tool-badge');
      if (!existingBadge) {
        const badge = document.createElement('span');
        badge.className = 'active-tool-badge bg-primary/60 text-on-primary text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold uppercase tracking-tight';
        badge.textContent = 'Active';
        targetBtn.appendChild(badge);
      }
    }

    // Toggle contextual controls visibility
    const compWrapper = document.getElementById('compressTargetControlBar');
    const dpiWrapper = document.getElementById('bentoJpgDpiWrapper');
    const splitWrapper = document.getElementById('splitRangeWrapper');

    if (compWrapper) compWrapper.classList.toggle('hidden', toolName !== 'compress_pdf');
    if (dpiWrapper) dpiWrapper.classList.toggle('hidden', toolName !== 'pdf_to_jpg');
    if (splitWrapper) splitWrapper.classList.toggle('hidden', toolName !== 'split_pdf');

    // Update subfolder telemetry text if elements exist
    const subfolderName = getSubfolderName(toolName);
    const sideSub = document.getElementById('sidebarOutputSubfolderText');
    if (sideSub) sideSub.textContent = subfolderName;
    const footSub = document.getElementById('footerSubfolderOutputText');
    if (footSub) footSub.textContent = `${subfolderName}/`;

    this._updateProcessButtonLabel();
    toast.show('Tool Selected', this._getToolDisplayName(toolName), 'info');
  }

  _getToolDisplayName(tool) {
    switch (tool) {
      case 'compress_pdf': return 'Compress PDF';
      case 'merge_pdf': return 'Merge PDF';
      case 'split_pdf': return 'Split PDF';
      case 'pdf_to_jpg': return 'PDF to JPG';
      case 'jpg_to_pdf': return 'JPG to PDF';
      case 'rotate_pdf': return 'Rotate PDF';
      case 'clean_pdf': return 'Clean & Enhance';
      default: return 'Compress PDF';
    }
  }

  _updateProcessButtonLabel() {
    const btn = document.getElementById('startCompressBtn');
    if (!btn) return;

    // Label matches the exact active tool title from left sidebar
    const span = btn.querySelector('span:nth-of-type(2)') || btn.querySelector('span:last-of-type');
    if (span) {
      span.textContent = this._getToolDisplayName(this.activeTool);
    }
  }

  _bindTargetSizeControls() {
    const radioGroup = document.getElementById('targetRadioGroup');
    const radioBtns = document.querySelectorAll('#compressTargetControlBar .target-radio-pill');
    const slider = document.getElementById('sliderTargetKb');
    const inputKb = document.getElementById('inputManualTargetKb');
    const inputMb = document.getElementById('inputManualTargetMb');
    const wrapKb = document.getElementById('wrapManualKb');
    const wrapMb = document.getElementById('wrapManualMb');
    const radioModeKb = document.getElementById('radioModeKb');
    const radioModeMb = document.getElementById('radioModeMb');
    const lblModeKb = document.getElementById('lblModeKb');
    const lblModeMb = document.getElementById('lblModeMb');
    const overlayLockKb = document.getElementById('overlayLockKb');
    const overlayLockMb = document.getElementById('overlayLockMb');
    const badgeUnitKb = document.getElementById('badgeUnitKb');
    const badgeUnitMb = document.getElementById('badgeUnitMb');

    const updatePills = (kb) => {
      const isPreset = [100, 200, 300, 400, 500].includes(kb);
      radioBtns.forEach(btn => {
        const btnKb = parseInt(btn.getAttribute('data-kb'), 10);
        if (this.targetSizeMode === 'kb' && isPreset && btnKb === kb) {
          btn.className = 'target-radio-pill relative px-3 py-0.5 text-xs font-extrabold text-white bg-blue-600 rounded-md shadow-md ring-2 ring-blue-500/50 flex items-center gap-1.5 transition cursor-pointer';
          btn.innerHTML = `
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-beacon-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
            </span>
            <span class="tracking-wide">${btnKb} KB</span>
          `;
        } else {
          btn.className = 'target-radio-pill px-2.5 py-0.5 text-xs font-medium text-slate-600 rounded-md hover:bg-white hover:text-slate-900 transition cursor-pointer';
          btn.textContent = `${btnKb} KB`;
        }
      });
    };

    const setMode = (mode) => {
      this.targetSizeMode = mode;
      if (mode === 'kb') {
        // Radio buttons & labels
        if (radioModeKb) radioModeKb.checked = true;
        if (radioModeMb) radioModeMb.checked = false;
        if (lblModeKb) {
          lblModeKb.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-blue-700 ring-2 ring-blue-500/40 shadow-xs cursor-pointer transition-all';
          lblModeKb.querySelector('.mode-pulse-dot')?.classList.remove('hidden');
        }
        if (lblModeMb) {
          lblModeMb.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer transition-all';
          lblModeMb.querySelector('.mode-pulse-dot')?.classList.add('hidden');
        }

        // Unlock KB Section
        if (overlayLockKb) overlayLockKb.classList.add('hidden');
        if (wrapKb) {
          wrapKb.className = 'group flex items-center h-8 bg-white border-2 border-blue-500 rounded-lg px-2 shadow-xs transition-all cursor-pointer';
          wrapKb.title = 'KB Mode Active';
        }
        if (inputKb) {
          inputKb.disabled = false;
          inputKb.className = 'w-14 text-center font-mono text-xs font-black text-slate-900 bg-transparent border-none focus:outline-none p-0 cursor-text';
        }
        if (badgeUnitKb) {
          badgeUnitKb.className = 'px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded ml-1';
        }
        if (radioGroup) {
          radioGroup.classList.remove('opacity-40', 'pointer-events-none');
        }
        if (slider) {
          slider.disabled = false;
          slider.classList.remove('opacity-40', 'cursor-not-allowed');
        }

        // Lock MB Section
        if (overlayLockMb) overlayLockMb.classList.remove('hidden');
        if (wrapMb) {
          wrapMb.className = 'group flex items-center h-8 bg-white border border-slate-300 rounded-lg px-2 shadow-xs transition-all cursor-pointer';
          wrapMb.title = 'Click to unlock MB Mode (up to 100 MB)';
        }
        if (inputMb) {
          inputMb.disabled = true;
          inputMb.className = 'w-14 text-center font-mono text-xs font-black text-slate-900 bg-transparent border-none focus:outline-none p-0 cursor-not-allowed';
        }
        if (badgeUnitMb) {
          badgeUnitMb.className = 'px-1.5 py-0.5 bg-slate-200 text-slate-600 font-mono text-[10px] font-bold rounded ml-1';
        }

        updatePills(this.targetKb);
      } else {
        // Radio buttons & labels
        if (radioModeKb) radioModeKb.checked = false;
        if (radioModeMb) radioModeMb.checked = true;
        if (lblModeMb) {
          lblModeMb.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-indigo-700 ring-2 ring-indigo-500/40 shadow-xs cursor-pointer transition-all';
          lblModeMb.querySelector('.mode-pulse-dot')?.classList.remove('hidden');
        }
        if (lblModeKb) {
          lblModeKb.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer transition-all';
          lblModeKb.querySelector('.mode-pulse-dot')?.classList.add('hidden');
        }

        // Lock KB Section
        if (overlayLockKb) overlayLockKb.classList.remove('hidden');
        if (wrapKb) {
          wrapKb.className = 'group flex items-center h-8 bg-white border border-slate-300 rounded-lg px-2 shadow-xs transition-all cursor-pointer';
          wrapKb.title = 'Click to switch back to KB Mode';
        }
        if (inputKb) {
          inputKb.disabled = true;
          inputKb.className = 'w-14 text-center font-mono text-xs font-black text-slate-900 bg-transparent border-none focus:outline-none p-0 cursor-not-allowed';
        }
        if (badgeUnitKb) {
          badgeUnitKb.className = 'px-1.5 py-0.5 bg-slate-200 text-slate-600 font-mono text-[10px] font-bold rounded ml-1';
        }
        if (radioGroup) {
          radioGroup.classList.add('opacity-40');
        }
        if (slider) {
          slider.disabled = true;
          slider.classList.add('opacity-40', 'cursor-not-allowed');
        }

        // Unlock MB Section
        if (overlayLockMb) overlayLockMb.classList.add('hidden');
        if (wrapMb) {
          wrapMb.className = 'group flex items-center h-8 bg-white border-2 border-indigo-500 ring-2 ring-indigo-100 rounded-lg px-2 shadow-xs transition-all cursor-pointer';
          wrapMb.title = 'MB Mode Active';
        }
        if (inputMb) {
          inputMb.disabled = false;
          inputMb.className = 'w-14 text-center font-mono text-xs font-black text-slate-900 bg-transparent border-none focus:outline-none p-0 cursor-text';
          inputMb.focus();
        }
        if (badgeUnitMb) {
          badgeUnitMb.className = 'px-1.5 py-0.5 bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold rounded ml-1';
        }

        // Dim pills in MB mode but keep them clickable to switch back to KB
        radioBtns.forEach(btn => {
          const btnKb = parseInt(btn.getAttribute('data-kb'), 10);
          btn.className = 'target-radio-pill px-2.5 py-0.5 text-xs font-medium text-slate-400 rounded-md transition cursor-pointer hover:bg-slate-200';
          btn.textContent = `${btnKb} KB`;
        });
      }
    };

    const setTargetKb = (val, source) => {
      let kb = parseInt(val, 10);
      if (isNaN(kb) || kb <= 0) kb = 300;
      if (kb > 102400) kb = 102400; // max 100 MB
      this.targetKb = kb;

      if (slider) {
        if (source !== 'slider') {
          slider.value = Math.min(Math.max(kb, 50), 1000);
        }
        const sVal = Math.min(Math.max(kb, 50), 1000);
        const pct = ((sVal - 50) / (1000 - 50)) * 100;
        slider.style.setProperty('--slider-pct', `${pct}%`);
        slider.style.background = `linear-gradient(to right, #2563eb 0%, #2563eb ${pct}%, #cbd5e1 ${pct}%, #cbd5e1 100%)`;
      }
      if (source !== 'inputKb' && inputKb) {
        inputKb.value = kb;
      }
      // Note: Mutual-Exclusive Rule: In KB Mode, DO NOT live-change inputMb!
      updatePills(kb);
      this.updateStats();
      this.updateCardsProjectedSize();
    };

    const setTargetMb = (val) => {
      let mb = parseFloat(val);
      if (isNaN(mb) || mb <= 0) mb = 1;
      if (mb > 100) mb = 100;
      this.targetKb = Math.round(mb * 1024);
      // Note: Mutual-Exclusive Rule: In MB Mode, DO NOT live-change inputKb or slider!
      this.updateStats();
      this.updateCardsProjectedSize();
    };

    // Preset pills click -> switch to KB mode and set target
    radioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.targetSizeMode !== 'kb') setMode('kb');
        const kb = parseInt(btn.getAttribute('data-kb'), 10);
        setTargetKb(kb, 'radio');
        toast.show('Target Size', `Target set to < ${kb} KB`, 'info');
      });
    });

    // Slider input -> switch to KB mode and set target
    if (slider) {
      slider.addEventListener('mousedown', () => {
        if (this.targetSizeMode !== 'kb') setMode('kb');
      });
      slider.addEventListener('input', (e) => {
        if (this.targetSizeMode !== 'kb') setMode('kb');
        const kb = parseInt(e.target.value, 10);
        setTargetKb(kb, 'slider');
      });
    }

    // Radio change listeners
    if (radioModeKb) {
      radioModeKb.addEventListener('change', () => {
        if (radioModeKb.checked && this.targetSizeMode !== 'kb') {
          setMode('kb');
          toast.show('KB Mode', 'Switched to KB preset mode.', 'info');
        }
      });
    }

    if (radioModeMb) {
      radioModeMb.addEventListener('change', () => {
        if (radioModeMb.checked && this.targetSizeMode !== 'mb') {
          setMode('mb');
          const mb = parseFloat(inputMb?.value || 0.29);
          setTargetMb(mb);
          toast.show('MB Mode Active', 'KB controls locked. Direct MB sizing enabled.', 'info');
        }
      });
    }

    // Lock Overlay click listeners (Clicking anywhere on lock immediately switches mode)
    if (overlayLockKb) {
      overlayLockKb.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.targetSizeMode !== 'kb') {
          setMode('kb');
          if (inputKb) inputKb.focus();
          toast.show('KB Mode', 'Switched to KB preset mode.', 'info');
        }
      });
    }

    if (overlayLockMb) {
      overlayLockMb.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.targetSizeMode !== 'mb') {
          setMode('mb');
          const mb = parseFloat(inputMb?.value || 0.29);
          setTargetMb(mb);
          toast.show('MB Mode Active', 'KB controls locked. Direct MB sizing enabled.', 'info');
        }
      });
    }

    // KB Input container click / focus -> switch to KB mode
    if (wrapKb) {
      wrapKb.addEventListener('click', () => {
        if (this.targetSizeMode !== 'kb') {
          setMode('kb');
          if (inputKb) inputKb.focus();
          toast.show('KB Mode', 'Switched to KB preset mode.', 'info');
        }
      });
    }

    if (inputKb) {
      inputKb.addEventListener('input', (e) => {
        if (this.targetSizeMode !== 'kb') setMode('kb');
        const kb = parseInt(e.target.value, 10);
        if (!isNaN(kb) && kb > 0) {
          setTargetKb(kb, 'inputKb');
        }
      });
      inputKb.addEventListener('change', (e) => {
        let kb = parseInt(e.target.value, 10);
        if (isNaN(kb) || kb < 30) kb = 30;
        setTargetKb(kb, 'inputKb');
      });
    }

    // MB Input container click -> switch to MB mode
    if (wrapMb) {
      wrapMb.addEventListener('click', () => {
        if (this.targetSizeMode !== 'mb') {
          setMode('mb');
          const mb = parseFloat(inputMb?.value || 0.29);
          setTargetMb(mb);
          toast.show('MB Mode Active', 'KB controls locked. Direct MB sizing enabled.', 'info');
        }
      });
    }

    if (inputMb) {
      inputMb.addEventListener('input', (e) => {
        const mb = parseFloat(e.target.value);
        if (!isNaN(mb) && mb > 0) {
          setTargetMb(mb);
        }
      });
      inputMb.addEventListener('change', (e) => {
        let mb = parseFloat(e.target.value);
        if (isNaN(mb) || mb < 0.01) mb = 0.01;
        if (mb > 100) mb = 100;
        inputMb.value = mb;
        setTargetMb(mb);
      });
    }

    // Initial state: KB mode active, 300 KB default, MB locked
    setMode('kb');
    setTargetKb(300, 'init');
  }

  _bindActions() {
    // Browse Folder
    const btnBrowse = document.getElementById('btnBrowsePdfDir');
    if (btnBrowse) {
      btnBrowse.addEventListener('click', () => this.handleBrowseFolder());
    }

    // Add Files
    const btnAdd = document.getElementById('btnAddPdfFiles');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.handleAddFiles());
    }

    // Rotate All
    const btnRotateAll = document.getElementById('btnRotateAllPdf');
    if (btnRotateAll) {
      btnRotateAll.addEventListener('click', () => this.handleRotateAll());
    }

    // Clear Queue
    const btnClear = document.getElementById('btnClearPdfQueue');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClearQueue());
    }

    // Filter Oversized (>256KB)
    const btnFilter = document.getElementById('btnFilterOversizedPdf');
    if (btnFilter) {
      btnFilter.addEventListener('click', () => this.handleFilterOversized());
    }


    // Chevrons Scroll
    const btnScrollLeft = document.getElementById('btnPdfScrollLeft');
    const btnScrollRight = document.getElementById('btnPdfScrollRight');
    const grid = document.getElementById('pdfCardsGrid');

    if (btnScrollLeft && grid) {
      btnScrollLeft.addEventListener('click', () => {
        grid.scrollBy({ left: -300, behavior: 'smooth' });
      });
    }
    if (btnScrollRight && grid) {
      btnScrollRight.addEventListener('click', () => {
        grid.scrollBy({ left: 300, behavior: 'smooth' });
      });
    }

    // Sort Buttons
    const btnSortSize = document.getElementById('btnPdfSortSize');
    if (btnSortSize) {
      btnSortSize.addEventListener('click', () => {
        this.sortDesc = !this.sortDesc;
        this.files.sort((a, b) => this.sortDesc ? b.size - a.size : a.size - b.size);
        btnSortSize.textContent = this.sortDesc ? 'Size (Desc)' : 'Size (Asc)';
        this.renderQueue();
      });
    }

    const btnSortDocket = document.getElementById('btnPdfSortDocket');
    if (btnSortDocket) {
      btnSortDocket.addEventListener('click', () => {
        this.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        this.renderQueue();
        toast.show('Queue Sorted', 'Natural sorting (1-0, A-Z) applied.', 'info');
      });
    }

    // Split Page Range input listener
    const inputSplitRange = document.getElementById('inputSplitPageRange');
    if (inputSplitRange) {
      inputSplitRange.addEventListener('input', (e) => {
        this.splitPageRange = e.target.value.trim();
      });
    }

    // Start Process Button
    const btnStart = document.getElementById('startCompressBtn');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.handleStartProcess());
    }
  }

  _bindBentoDropdowns() {
    // PDF to JPG DPI dropdown
    const btnDpi = document.getElementById('btnBentoJpgDpi');
    const menuDpi = document.getElementById('menuBentoJpgDpi');
    const labelDpi = document.getElementById('labelJpgDpi');

    if (btnDpi && menuDpi) {
      btnDpi.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDpi.classList.toggle('hidden');
      });

      menuDpi.querySelectorAll('button[data-dpi]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const dpi = parseInt(btn.getAttribute('data-dpi'), 10) || 150;
          this.jpgDpi = dpi;
          if (labelDpi) labelDpi.textContent = `${dpi} DPI ${dpi === 150 ? '(Fast)' : dpi === 300 ? '(High Quality)' : '(Web)'}`;
          menuDpi.classList.add('hidden');
          this._updateProcessButtonLabel();
          toast.show('DPI Updated', `PDF to JPG resolution set to ${dpi} DPI`, 'info');
        });
      });
    }

    // Document click to close menus
    document.addEventListener('click', () => {
      if (menuDpi && !menuDpi.classList.contains('hidden')) menuDpi.classList.add('hidden');
    });
  }

  _bindDropzone() {
    const view = document.getElementById('view-pdf-studio');
    if (!view) return;

    view.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    view.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const items = Array.from(e.dataTransfer?.files || []);
      const isMixedMode = this.activeTool === 'compress_pdf';
      const isJpgMode = this.activeTool === 'jpg_to_pdf';
      const filterRegex = (isMixedMode || isJpgMode)
        ? (isJpgMode ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i)
        : /\.pdf$/i;

      const validFiles = items.filter(f => filterRegex.test(f.name));
      const invalidFiles = items.filter(f => !filterRegex.test(f.name));

      if (invalidFiles.length > 0) {
        toast.show('Unsupported File Skipped', `Skipped ${invalidFiles.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, 'warning');
      }

      if (validFiles.length === 0) {
        if (invalidFiles.length === 0) {
          toast.show('No Files Dropped', isMixedMode ? 'Please drop PDF, JPG, or PNG files.' : 'Please drop valid documents.', 'warning');
        }
        return;
      }

      await this.loadDroppedFiles(validFiles);
    });
  }

  _bindHotkeys() {
    window.addEventListener('keydown', (e) => {
      const view = document.getElementById('view-pdf-studio');
      if (!view || view.classList.contains('hidden')) return;

      // Modal preview hotkeys
      const modal = document.getElementById('modalPdfStudioPreview');
      if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closePreviewModal();
          return;
        }
        if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          this.modalPrevPage();
          return;
        }
        if (e.key === 'PageDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          this.modalNextPage();
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.modalRotate(90);
          return;
        }
        if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
          e.preventDefault();
          this.modalZoomIn();
          return;
        }
        if (e.ctrlKey && e.key === '-') {
          e.preventDefault();
          this.modalZoomOut();
          return;
        }
        if (e.ctrlKey && e.key === '0') {
          e.preventDefault();
          this.modalZoomFit();
          return;
        }
        return;
      }

      // Main screen shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        this.handleAddFiles();
      } else if (e.key === 'F8') {
        e.preventDefault();
        this.handleStartProcess();
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        this.setTool('merge_pdf');
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        this.setTool('split_pdf');
      } else if (e.altKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        this.setTool('pdf_to_jpg');
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        this.setTool('jpg_to_pdf');
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        this.setTool('rotate_pdf');
      } else if (e.key === 'Escape') {
        this.handleClearQueue();
      }
    });
  }

  async handleBrowseFolder() {
    toast.show('Opening Folder Picker', 'Navigating Windows Explorer...', 'info');
    try {
      const res = await selectNativeFolder();
      if (!res.success) {
        if (!res.cancelled) {
          toast.show('Folder Select Error', res.error || 'Failed to select folder', 'error');
        }
        return;
      }

      this.activeFolderPath = res.path || '';
      this.activeFolderName = res.name || (res.path ? res.path.split(/[\/\\]/).pop() : 'Selected Folder');

      // Update Dark Slate Folder Pill
      const pill = document.getElementById('displayPdfFolderName');
      if (pill) {
        pill.textContent = this.activeFolderName;
        pill.title = this.activeFolderPath;
      }

      const isMixedMode = this.activeTool === 'compress_pdf';
      const isJpgMode = this.activeTool === 'jpg_to_pdf';
      const targetFiles = (res.files || []).filter(f => {
        if (isMixedMode) return /\.(pdf|jpe?g|png|webp)$/i.test(f.name);
        if (isJpgMode) return /\.(jpe?g|png|webp)$/i.test(f.name);
        return /\.pdf$/i.test(f.name);
      });

      if (targetFiles.length === 0) {
        toast.show('No Files Found', `Folder contains 0 matching documents.`, 'warning');
        return;
      }

      await this.loadNativeFiles(targetFiles);
      toast.show('Files Loaded', `${targetFiles.length} files added from ${this.activeFolderName}.`, 'success');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  async handleAddFiles() {
    try {
      const isMixedMode = this.activeTool === 'compress_pdf';
      const isJpgMode = this.activeTool === 'jpg_to_pdf';
      const filter = isMixedMode
        ? 'Documents & Images (*.pdf;*.jpg;*.jpeg;*.png)|*.pdf;*.jpg;*.jpeg;*.png'
        : (isJpgMode ? 'Images (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png' : 'PDF Documents (*.pdf)|*.pdf');
      const title = isMixedMode
        ? 'Select Documents (PDF, JPG, PNG) - DocMitra'
        : (isJpgMode ? 'Select Images for PDF - DocMitra' : 'Select PDF Files - DocMitra');

      const res = await selectNativeFiles(filter, title);
      if (res && res.success && res.files && res.files.length) {
        if (res.files[0].path) {
          const parts = res.files[0].path.replace(/\\/g, '/').split('/');
          parts.pop();
          this.activeFolderPath = parts.join('/');
          this.activeFolderName = parts.pop() || 'Selected Folder';

          const pill = document.getElementById('displayPdfFolderName');
          if (pill) {
            pill.textContent = this.activeFolderName;
            pill.title = this.activeFolderPath;
          }
        }
        this.completionSummary = null;
        await this.loadNativeFiles(res.files);
        toast.show('Files Added', `${res.files.length} files added to execution queue.`, 'success');
        return;
      }
    } catch (e) {
      console.warn('Native select files fallback:', e);
    }

    // HTML input fallback
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = (this.activeTool === 'compress_pdf' || this.activeTool === 'jpg_to_pdf')
      ? '.pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf'
      : '.pdf,application/pdf';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', async (e) => {
      const fileList = Array.from(e.target.files || []);
      const filterRegex = (this.activeTool === 'compress_pdf' || this.activeTool === 'jpg_to_pdf')
        ? (this.activeTool === 'jpg_to_pdf' ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i)
        : /\.pdf$/i;
      const validFiles = fileList.filter(f => filterRegex.test(f.name));
      const invalidFiles = fileList.filter(f => !filterRegex.test(f.name));
      if (invalidFiles.length > 0) {
        toast.show('Unsupported File Skipped', `Skipped ${invalidFiles.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, 'warning');
      }
      if (validFiles.length > 0) {
        this.completionSummary = null;
        await this.loadDroppedFiles(validFiles);
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  async loadNativeFiles(fileList) {
    const isMixedMode = this.activeTool === 'compress_pdf';
    const isJpgMode = this.activeTool === 'jpg_to_pdf';
    const filterRegex = (isMixedMode || isJpgMode)
      ? (isJpgMode ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i)
      : /\.pdf$/i;

    const validFiles = fileList.filter(f => filterRegex.test(f.name));
    const invalidFiles = fileList.filter(f => !filterRegex.test(f.name));
    if (invalidFiles.length > 0) {
      toast.show('Unsupported File Skipped', `Skipped ${invalidFiles.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, 'warning');
    }
    if (validFiles.length === 0) return;

    for (const f of validFiles) {
      try {
        let bytes = null;
        if (f.path) {
          bytes = await readBinaryFile(f.path);
        } else if (f.fileObj) {
          const buf = await f.fileObj.arrayBuffer();
          bytes = new Uint8Array(buf);
        }

        const lastSlash = f.path ? Math.max(f.path.lastIndexOf('/'), f.path.lastIndexOf('\\')) : -1;
        const dir = f.dir || (f.path && lastSlash !== -1 ? f.path.substring(0, lastSlash) : this.activeFolderPath);
        if (dir) {
          this.activeFolderPath = dir.replace(/\\/g, '/');
          this.activeFolderName = this.activeFolderPath.split('/').pop() || 'Folder';
          const pill = document.getElementById('displayPdfFolderName');
          if (pill) {
            pill.textContent = this.activeFolderName;
            pill.title = this.activeFolderPath;
          }
        }

        this.files.push({
          id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: f.name,
          path: f.path || f.name,
          dir: dir,
          size: f.size || (bytes ? bytes.length : 0),
          bytes: bytes,
          pageCount: 1,
          rotation: 0,
          status: 'ready'
        });
      } catch (err) {
        console.warn(`[PDF-STUDIO] Failed to read bytes for ${f.name} via Native IPC:`, err);
      }
    }

    this.updateStats();
    this.renderQueue();
  }

  async loadDroppedFiles(fileList) {
    this.completionSummary = null;
    for (const f of fileList) {
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf);

      this.files.push({
        id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: f.name,
        path: f.name,
        dir: this.activeFolderPath || '',
        size: f.size,
        bytes: bytes,
        pageCount: 1,
        rotation: 0,
        status: 'ready'
      });
    }

    this.updateStats();
    this.renderQueue();
    toast.show('Files Queued', `${fileList.length} files added to execution queue.`, 'success');
  }

  updateStats() {
    const totalFiles = this.files.length;
    const totalBytes = this.files.reduce((acc, f) => acc + (f.size || 0), 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

    // Projected calculation based on targetKb
    const projectedBytes = this.files.reduce((acc, f) => {
      const fileTarget = Math.min(f.size || 0, this.targetKb * 1024);
      return acc + fileTarget;
    }, 0);
    const projectedMB = (projectedBytes / (1024 * 1024)).toFixed(2);

    // Reduction percentage
    const reductionPct = totalBytes > 0 && totalBytes > projectedBytes
      ? Math.max(0, Math.round(((totalBytes - projectedBytes) / totalBytes) * 100))
      : 0;

    // Summary cards
    const cardCount = document.getElementById('summaryPdfCount');
    if (cardCount) {
      cardCount.textContent = `${totalFiles} Docs`;
    }

    const cardTotal = document.getElementById('summaryPdfTotalSize');
    if (cardTotal) {
      cardTotal.textContent = `${totalMB} MB`;
    }

    const cardProjected = document.getElementById('summaryPdfProjected');
    if (cardProjected) {
      cardProjected.textContent = `~${projectedMB} MB`;
    }

    const reductionBadge = document.getElementById('summaryPdfReductionBadge');
    if (reductionBadge) {
      if (reductionPct > 0) {
        reductionBadge.textContent = `↓ -${reductionPct}%`;
        reductionBadge.classList.remove('hidden');
      } else {
        reductionBadge.classList.add('hidden');
      }
    }

    // Queue header readout if present
    const countEl = document.getElementById('pdfQueueCount');
    if (countEl) countEl.textContent = `${totalFiles} Files`;

    const statsEl = document.getElementById('pdfQueueStats');
    if (statsEl) statsEl.textContent = `Total: ${totalMB} MB → Projected: ~${projectedMB} MB`;

    this._updateProcessButtonLabel();
  }

  renderQueue() {
    const grid = document.getElementById('pdfCardsGrid');
    if (!grid) return;

    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    if (this.files.length === 0) {
      if (this.completionSummary) {
        grid.className = 'flex items-center justify-center min-h-[380px] w-full';
        const s = this.completionSummary;
        const origStr = s.origTotalBytes >= 1024 * 1024
          ? `${(s.origTotalBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(s.origTotalBytes / 1024)} KB`;
        const outStr = s.outTotalBytes >= 1024 * 1024
          ? `${(s.outTotalBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(s.outTotalBytes / 1024)} KB`;

        const summaryCard = document.createElement('div');
        summaryCard.className = 'col-span-full max-w-xl w-full mx-auto bg-white rounded-2xl border-2 border-emerald-500/30 shadow-xl p-8 flex flex-col items-center text-center';
        summaryCard.innerHTML = `
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
            <span class="material-symbols-outlined text-[36px]">task_alt</span>
          </div>
          <h3 class="text-xl font-bold text-slate-800 tracking-tight">Batch Compression Complete!</h3>
          <p class="text-xs text-slate-500 mt-1 mb-6">All documents were optimized and saved directly into the source folder.</p>

          <div class="grid grid-cols-3 gap-3 w-full mb-6">
            <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Files</div>
              <div class="text-base font-extrabold text-slate-800 mt-1 font-mono">${s.totalFiles} Files</div>
              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Succeeded</div>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-center">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Before Size</div>
              <div class="text-base font-extrabold text-slate-700 mt-1 font-mono">${origStr}</div>
              <div class="text-[10px] text-slate-400 font-medium mt-0.5">Original Total</div>
            </div>
            <div class="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200 text-center">
              <div class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Output Size</div>
              <div class="text-base font-extrabold text-emerald-700 mt-1 font-mono">${outStr}</div>
              <div class="text-[10px] text-emerald-700 font-bold mt-0.5">-${s.savedPct}% Saved</div>
            </div>
          </div>

          <div class="w-full bg-slate-100/90 rounded-lg px-3 py-2 border border-slate-200 flex items-center gap-2 mb-6 text-left">
            <span class="material-symbols-outlined text-slate-400 text-base flex-shrink-0">folder</span>
            <span class="text-[11px] font-mono text-slate-600 truncate flex-1" title="${s.outFolderPath}">${s.outFolderPath}</span>
          </div>

          <div class="grid grid-cols-2 gap-3 w-full">
            <button id="btnResetBatchLink" type="button" class="h-10 w-full rounded-lg bg-white hover:bg-rose-50/50 text-slate-700 hover:text-rose-600 font-bold text-xs border border-slate-200 hover:border-rose-300 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98">
              <span class="material-symbols-outlined text-[17px] text-rose-500">delete_sweep</span>
              <span>Clear Queue</span>
            </button>
            <button id="btnCenterOpenFolder" type="button" class="h-10 w-full rounded-lg bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 font-bold text-xs border border-slate-200 hover:border-emerald-300 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98">
              <span class="material-symbols-outlined text-[17px] text-emerald-600">folder_open</span>
              <span>Open Output Folder</span>
            </button>
          </div>
        `;

        grid.appendChild(summaryCard);

        const btnOpen = summaryCard.querySelector('#btnCenterOpenFolder');
        if (btnOpen) {
          btnOpen.addEventListener('click', () => {
            openFolderInExplorer(s.outFolderPath);
          });
        }
        const btnReset = summaryCard.querySelector('#btnResetBatchLink');
        if (btnReset) {
          btnReset.addEventListener('click', () => {
            this.handleClearQueue();
          });
        }
        return;
      }

      grid.className = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 min-h-[300px]';
      const emptyCard = document.createElement('div');
      emptyCard.className = 'col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/80 flex flex-col items-center gap-2';

      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[40px] text-primary opacity-60';
      icon.textContent = this.activeTool === 'jpg_to_pdf' ? 'add_photo_alternate' : 'picture_as_pdf';
      emptyCard.appendChild(icon);

      const title = document.createElement('div');
      title.className = 'font-headline-sm font-bold text-on-surface';
      title.textContent = 'Drag & Drop Files';
      emptyCard.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'text-body-sm text-secondary';
      desc.textContent = 'or use Add Files above to queue documents for processing.';
      emptyCard.appendChild(desc);

      grid.appendChild(emptyCard);
      return;
    }

    grid.className = 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 min-h-[300px]';

    this.files.forEach((file, idx) => {
      try {
        const card = document.createElement('div');
        card.className = 'docket-card relative bg-white rounded-xl border border-slate-200/90 p-2.5 flex flex-col justify-between hover:border-blue-400 hover:shadow-lg transition-all group cursor-pointer stitch-paper-shadow';
        card.setAttribute('data-file-id', file.id);

        // Drag-to-reorder for Merge Tool
        if (this.activeTool === 'merge_pdf') {
          card.setAttribute('draggable', 'true');
          card.addEventListener('dragstart', (e) => {
            this.draggedIndex = idx;
            card.classList.add('card-dragging');
            e.dataTransfer.effectAllowed = 'move';
          });
          card.addEventListener('dragend', () => {
            card.classList.remove('card-dragging');
            this.draggedIndex = null;
          });
          card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            card.classList.add('card-drag-over');
          });
          card.addEventListener('dragleave', () => {
            card.classList.remove('card-drag-over');
          });
          card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.classList.remove('card-drag-over');
            if (this.draggedIndex !== null && this.draggedIndex !== idx) {
              const moved = this.files.splice(this.draggedIndex, 1)[0];
              this.files.splice(idx, 0, moved);
              this.renderQueue();
              toast.show('Reordered', `Moved "${moved.name}" to position ${idx + 1}.`, 'info');
            }
          });
        }

        // Card Header: Format Badge on Left + Reduction / Actions on Right
        const cardHeader = document.createElement('div');
        cardHeader.className = 'flex items-center justify-between gap-1 mb-1.5';

        // Format Badge
        const isJpg = /\.(jpe?g)$/i.test(file.name);
        const isPng = /\.(png|webp)$/i.test(file.name);
        const formatBadge = document.createElement('span');
        if (isJpg) {
          formatBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white font-mono uppercase';
          formatBadge.textContent = 'JPG';
        } else if (isPng) {
          formatBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white font-mono uppercase';
          formatBadge.textContent = 'PNG';
        } else {
          formatBadge.className = 'px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-white font-mono uppercase';
          formatBadge.textContent = 'PDF';
        }
        cardHeader.appendChild(formatBadge);

        // Right Header Cluster (Reduction Badge + Action Buttons)
        const rightCluster = document.createElement('div');
        rightCluster.className = 'flex items-center gap-1';

        // Reduction Percentage Badge (Stitch Sample 4 Red Badge, hidden when orig <= target per Choice 2-A)
        const targetBytes = this.targetKb * 1024;
        const redBadge = document.createElement('span');
        redBadge.className = 'badge-reduction-pct bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono';
        if (file.size > targetBytes) {
          const redPct = Math.min(95, Math.max(1, Math.round(((file.size - targetBytes) / file.size) * 100)));
          redBadge.textContent = `-${redPct}%`;
        } else {
          redBadge.style.display = 'none';
        }
        rightCluster.appendChild(redBadge);

        // Quick Actions (Rotate / Remove)
        const btnRotate = document.createElement('button');
        btnRotate.type = 'button';
        btnRotate.className = 'w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer opacity-70 group-hover:opacity-100';
        btnRotate.title = 'Rotate 90° Clockwise';
        const rotIcon = document.createElement('span');
        rotIcon.className = 'material-symbols-outlined text-[13px]';
        rotIcon.textContent = 'rotate_right';
        btnRotate.appendChild(rotIcon);
        btnRotate.addEventListener('click', (e) => {
          e.stopPropagation();
          this.rotateSingleFile(idx);
        });
        rightCluster.appendChild(btnRotate);

        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer opacity-70 group-hover:opacity-100';
        btnRemove.title = 'Remove File';
        const remIcon = document.createElement('span');
        remIcon.className = 'material-symbols-outlined text-[13px]';
        remIcon.textContent = 'close';
        btnRemove.appendChild(remIcon);
        btnRemove.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeFile(idx);
        });
        rightCluster.appendChild(btnRemove);

        cardHeader.appendChild(rightCluster);
        card.appendChild(cardHeader);

        // Card Paper Thumbnail Preview Area (h-56 portrait paper container matching Stitch)
        const thumbBox = document.createElement('div');
        thumbBox.className = 'relative w-full h-56 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden mb-2 p-1.5 flex items-center justify-center group-hover:bg-blue-50/20 transition-colors';

        const canvas = document.createElement('canvas');
        canvas.className = 'max-w-full max-h-full object-contain shadow-xs rounded bg-white transition-all';
        thumbBox.appendChild(canvas);

        // Already in Limit Badge (Top Left Corner of Preview)
        const limitBadge = document.createElement('div');
        limitBadge.className = 'card-limit-badge absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 hidden pointer-events-none z-10';
        limitBadge.innerHTML = '<span class="material-symbols-outlined text-[12px]">check_circle</span><span>✓ Already in Limit</span>';
        thumbBox.appendChild(limitBadge);

        // Ultra-Compact Live Readability Pill (Bottom Center of Preview)
        const blurWarning = document.createElement('div');
        blurWarning.className = 'card-blur-warning absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all hidden';
        thumbBox.appendChild(blurWarning);

        // Render thumbnail with cache check and buffer cloning (No 1p/2p badges)
        if (file.thumbUrl) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
          };
          img.src = file.thumbUrl;
        } else if (file.bytes && window.pdfjsLib && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
          // Pass cloned buffer to protect master bytes from detachment
          window.pdfjsLib.getDocument({ data: file.bytes.slice() }).promise.then(pdf => {
            file.pageCount = pdf.numPages;
            pdf.getPage(1).then(page => {
              const viewport = page.getViewport({ scale: 0.5, rotation: file.rotation || 0 });
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
              }).promise.then(() => {
                try {
                  file.thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
                } catch (e) { }
              }).catch(() => { });
            });
          }).catch((err) => {
            console.warn('PDF.js thumbnail render error:', err);
            canvas.style.display = 'none';
            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined text-[36px] text-blue-500 opacity-40';
            icon.textContent = 'picture_as_pdf';
            thumbBox.appendChild(icon);
          });
        } else if (file.bytes && file.name.match(/\.(jpe?g|png|webp)$/i)) {
          const img = new Image();
          const blob = new Blob([file.bytes.slice()], { type: isPng ? 'image/png' : 'image/jpeg' });
          img.src = URL.createObjectURL(blob);
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              file.thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
            } catch (e) { }
            URL.revokeObjectURL(img.src);
          };
        }
        card.appendChild(thumbBox);

        // Filename
        const title = document.createElement('div');
        title.className = 'font-sans text-xs font-bold text-slate-800 truncate mb-1.5';
        title.title = file.name;
        title.textContent = file.name;
        card.appendChild(title);

        // Bottom Row: Dual Size Badges (Orig Emerald + Comp Rose matching Stitch Sample 4)
        const footerPills = document.createElement('div');
        footerPills.className = 'flex items-center justify-between gap-1 pt-1 border-t border-slate-100';

        const origKb = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(file.size / 1024)} KB`;
        const compKb = file.size > targetBytes
          ? (this.targetKb >= 1024 ? `${(this.targetKb / 1024).toFixed(2)} MB` : `${this.targetKb} KB`)
          : origKb;

        const pillOrig = document.createElement('span');
        pillOrig.className = 'badge-orig-size px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded font-mono text-[10px] font-bold truncate';
        pillOrig.textContent = `Orig ${origKb}`;
        footerPills.appendChild(pillOrig);

        const pillComp = document.createElement('span');
        if (file.size > targetBytes) {
          pillComp.className = 'badge-comp-size px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded font-mono text-[10px] font-bold truncate';
        } else {
          pillComp.className = 'badge-comp-size px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded font-mono text-[10px] font-bold truncate';
        }
        pillComp.textContent = `Comp ${compKb}`;
        footerPills.appendChild(pillComp);

        card.appendChild(footerPills);

        // Click card opens Bento Preview Modal
        card.addEventListener('click', () => {
          this.openPreviewModal(idx);
        });

        grid.appendChild(card);
      } catch (cardErr) {
        console.error(`[PDF-STUDIO] Failed to render card for ${file ? file.name : idx}:`, cardErr);
      }
    });

    // Run dynamic card indicators (blur / already in limit / reduction badges)
    this.updateCardsProjectedSize();
  }

  updateCardsProjectedSize() {
    const cards = document.querySelectorAll('#pdfCardsGrid .docket-card[data-file-id]');
    const targetBytes = this.targetKb * 1024;
    const targetStr = this.targetKb >= 1024
      ? `${(this.targetKb / 1024).toFixed(2)} MB`
      : `${this.targetKb} KB`;

    cards.forEach(card => {
      const fileId = card.getAttribute('data-file-id');
      const file = this.files.find(f => f.id === fileId);
      if (!file) return;

      const redBadge = card.querySelector('.badge-reduction-pct');
      const compBadge = card.querySelector('.badge-comp-size');
      const limitBadge = card.querySelector('.card-limit-badge');
      const blurWarning = card.querySelector('.card-blur-warning');
      const canvas = card.querySelector('canvas');

      const origStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      if (file.size > targetBytes) {
        const redPct = Math.min(95, Math.max(1, Math.round(((file.size - targetBytes) / file.size) * 100)));
        if (redBadge) {
          redBadge.textContent = `-${redPct}%`;
          redBadge.style.display = '';
        }
        if (compBadge) {
          compBadge.textContent = `Comp ${targetStr}`;
          compBadge.className = 'badge-comp-size px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded font-mono text-[10px] font-bold truncate';
        }
        if (limitBadge) {
          limitBadge.classList.add('hidden');
        }

        // Live Blur preview & Dynamic Readability / Visibility % calculation
        if (redPct >= 75 || this.targetKb <= 70) {
          let blurPx = 1.2;
          if (redPct >= 90 || this.targetKb <= 50) {
            blurPx = 2.4;
          } else if (redPct >= 80 || this.targetKb <= 70) {
            blurPx = 1.7;
          }
          if (canvas) {
            canvas.style.filter = `blur(${blurPx}px)`;
            canvas.style.transition = 'filter 0.2s ease';
          }
          if (blurWarning) {
            // Dynamic Visibility % calculation based on target KB, original size, and pages
            const pageCount = Math.max(1, file.pageCount || 1);
            const effectiveKb = this.targetKb / pageCount;
            const targetBytes = this.targetKb * 1024;
            const compRatio = Math.min(1.0, targetBytes / file.size);
            const kbRatio = Math.min(1.0, effectiveKb / 180);
            const rawScore = (kbRatio * 0.70) + (compRatio * 0.30);
            let visPct = Math.round(rawScore * 100);

            if (effectiveKb <= 25) {
              visPct = Math.max(5, Math.min(10, Math.round((effectiveKb / 25) * 10)));
            } else if (effectiveKb <= 45) {
              visPct = Math.max(10, Math.min(20, 10 + Math.round(((effectiveKb - 25) / 20) * 10)));
            } else if (effectiveKb <= 70) {
              visPct = Math.max(20, Math.min(35, 20 + Math.round(((effectiveKb - 45) / 25) * 15)));
            } else if (effectiveKb <= 100) {
              visPct = Math.max(35, Math.min(50, 35 + Math.round(((effectiveKb - 70) / 30) * 15)));
            } else {
              visPct = Math.max(50, Math.min(65, visPct));
            }

            // Multi-tier color shift (Rose <=20%, Orange <=35%, Amber >35%)
            let borderCls, textCls, iconCls, barCls;
            if (visPct <= 20) {
              borderCls = 'border-rose-500/60';
              textCls = 'text-rose-300';
              iconCls = 'text-rose-400';
              barCls = 'bg-rose-500';
            } else if (visPct <= 35) {
              borderCls = 'border-orange-500/50';
              textCls = 'text-orange-300';
              iconCls = 'text-orange-400';
              barCls = 'bg-orange-500';
            } else {
              borderCls = 'border-amber-500/45';
              textCls = 'text-amber-200';
              iconCls = 'text-amber-400';
              barCls = 'bg-amber-400';
            }

            blurWarning.className = `card-blur-warning absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none transition-all px-2 py-0.5 rounded-full bg-slate-950/85 border ${borderCls} shadow-md backdrop-blur-md inline-flex items-center gap-1.5 whitespace-nowrap`;
            blurWarning.innerHTML = `
              <span class="material-symbols-outlined text-[12px] ${iconCls} animate-pulse">warning</span>
              <span class="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">Blur</span>
              <span class="text-slate-600 text-[10px] leading-none">•</span>
              <span class="font-mono text-[10px] font-extrabold ${textCls}">~${visPct}% Visible</span>
              <div class="w-4 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 inline-flex">
                <div class="h-full ${barCls} rounded-full" style="width: ${visPct}%"></div>
              </div>
            `;
            blurWarning.classList.remove('hidden');
          }
        } else {
          if (canvas) {
            canvas.style.filter = 'none';
          }
          if (blurWarning) {
            blurWarning.classList.add('hidden');
          }
        }
      } else {
        // Choice 2-A: orig <= target, hide red badge, Comp = Orig, 100% sharp, show Already in Limit badge
        if (redBadge) {
          redBadge.style.display = 'none';
        }
        if (compBadge) {
          compBadge.textContent = `Comp ${origStr}`;
          compBadge.className = 'badge-comp-size px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded font-mono text-[10px] font-bold truncate';
        }
        if (limitBadge) {
          limitBadge.classList.remove('hidden');
        }
        if (blurWarning) {
          blurWarning.classList.add('hidden');
        }
        if (canvas) {
          canvas.style.filter = 'none';
        }
      }
    });
  }

  async rotateSingleFile(idx) {
    const file = this.files[idx];
    if (!file || !file.bytes) return;

    toast.show('Rotating...', `Rotating ${file.name} 90° clockwise...`, 'info');
    try {
      const res = await rotateFilePhysicallyOnDisk({
        filePath: file.path,
        ext: file.name.split('.').pop(),
        bytes: file.bytes.slice(),
        degrees: 90
      });

      if (!res.success) {
        toast.show('Rotate Failed', res.error || 'Could not rotate file on disk', 'error');
        return;
      }

      file.bytes = res.newBytes;
      file.size = res.newBytes.length;
      file.rotation = ((file.rotation || 0) + 90) % 360;
      file.thumbUrl = null; // Clear cached thumbnail to regenerate fresh rotated image

      // Update live preview in DOM
      const card = document.querySelector(`.docket-card[data-file-id="${file.id}"]`);
      if (card) {
        const canvas = card.querySelector('canvas');
        if (canvas) {
          if (file.name.match(/\.(jpe?g|png|webp)$/i)) {
            const img = new Image();
            const blob = new Blob([file.bytes.slice()], { type: file.name.match(/\.png$/i) ? 'image/png' : 'image/jpeg' });
            img.src = URL.createObjectURL(blob);
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              try {
                file.thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
              } catch (e) { }
              URL.revokeObjectURL(img.src);
            };
          } else if (window.pdfjsLib) {
            const pdf = await window.pdfjsLib.getDocument({ data: file.bytes.slice() }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5, rotation: 0 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;
            try {
              file.thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
            } catch (e) { }
          }
        }

        const origEl = card.querySelector('.badge-orig-size');
        if (origEl) {
          const origStr = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(file.size / 1024)} KB`;
          origEl.textContent = `Orig ${origStr}`;
        }
      }

      this.updateStats();
      this.updateCardsProjectedSize();
      toast.show('File Rotated & Saved', 'File rotated & saved directly to disk.', 'success');
    } catch (err) {
      console.error('[PDF Studio] Rotate error:', err);
      toast.show('Rotate Error', err.message, 'error');
    }
  }

  removeFile(idx) {
    this.files.splice(idx, 1);
    this.updateStats();
    this.renderQueue();
  }

  handleRotateAll() {
    if (this.files.length === 0) {
      toast.show('Queue Empty', 'Add PDF files first.', 'info');
      return;
    }

    let completed = 0;
    this.files.forEach(f => {
      if (f.bytes) {
        try {
          f.rotation = ((f.rotation || 0) + 90) % 360;
          const blob = rotatePdfDocument(f.bytes, 90);
          blob.arrayBuffer().then(buf => {
            f.bytes = new Uint8Array(buf);
            f.size = blob.size;
            completed++;
            if (completed === this.files.length) {
              this.renderQueue();
              toast.show('All Rotated', `Rotated all ${this.files.length} PDFs by 90°.`, 'success');
            }
          });
        } catch (e) { }
      }
    });
  }

  handleClearQueue() {
    this.files = [];
    this.activeFolderPath = '';
    this.activeFolderName = '';
    this.lastOutputFolder = '';
    this.completionSummary = null;
    const pill = document.getElementById('displayPdfFolderName');
    if (pill) {
      pill.textContent = 'All Documents';
      pill.title = '';
    }
    this.updateStats();
    this.renderQueue();
    toast.show('Queue Cleared', 'PDF workstation reset.', 'info');
  }

  handleFilterOversized() {
    const threshold = this.targetKb * 1024;
    const initialCount = this.files.length;
    this.files = this.files.filter(f => f.size > threshold);
    this.updateStats();
    this.renderQueue();
    toast.show('Filter Applied', `Kept ${this.files.length} oversized files (>${this.targetKb} KB) from ${initialCount}.`, 'info');
  }

  // ==============================================================================
  // Bento Preview Modal Controls (Choice 3-B)
  // ==============================================================================

  _bindModalControls() {
    const btnClose = document.getElementById('btnClosePdfModal');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.closePreviewModal());
    }

    const btnPrev = document.getElementById('btnPdfModalPrev');
    const btnNext = document.getElementById('btnPdfModalNext');
    if (btnPrev) btnPrev.addEventListener('click', () => this.modalPrevPage());
    if (btnNext) btnNext.addEventListener('click', () => this.modalNextPage());

    const btnZoomIn = document.getElementById('btnPdfModalZoomIn');
    const btnZoomOut = document.getElementById('btnPdfModalZoomOut');
    const btnZoomFit = document.getElementById('btnPdfModalZoomFit');
    const btnZoomReset = document.getElementById('btnPdfModalZoomReset');

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.modalZoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.modalZoomOut());
    if (btnZoomFit) btnZoomFit.addEventListener('click', () => this.modalZoomFit());
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => this.modalZoomReset());

    const btnCCW = document.getElementById('btnPdfModalRotateCCW');
    const btnCW = document.getElementById('btnPdfModalRotateCW');
    const btnFlip = document.getElementById('btnPdfModalRotateFlip');

    if (btnCCW) btnCCW.addEventListener('click', () => this.modalRotate(-90));
    if (btnCW) btnCW.addEventListener('click', () => this.modalRotate(90));
    if (btnFlip) btnFlip.addEventListener('click', () => this.modalRotate(180));
  }

  async openPreviewModal(idx) {
    const file = this.files[idx];
    if (!file || !file.bytes) return;

    this.modalFileIdx = idx;
    this.modalPage = 1;
    this.modalZoom = 'fit';
    this.modalRotation = file.rotation || 0;

    const modal = document.getElementById('modalPdfStudioPreview');
    if (modal) modal.classList.remove('hidden');

    const titleEl = document.getElementById('pdfModalDocTitle');
    if (titleEl) titleEl.textContent = file.name;

    const metaEl = document.getElementById('pdfModalDocMeta');
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    if (metaEl) metaEl.textContent = `Size: ${sizeStr} • Direct Output Ready`;

    if (window.pdfjsLib && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
      try {
        this.modalPdfDoc = await window.pdfjsLib.getDocument({ data: file.bytes.slice() }).promise;
        this.modalTotalPages = this.modalPdfDoc.numPages;
        this.renderModalPage();
      } catch (err) {
        console.warn('PDF.js modal load failed:', err);
      }
    } else {
      // Direct image display
      this.modalTotalPages = 1;
      this.renderModalImage(file.bytes);
    }
  }

  closePreviewModal() {
    const modal = document.getElementById('modalPdfStudioPreview');
    if (modal) modal.classList.add('hidden');
    if (this.renderTask) {
      try { this.renderTask.cancel(); } catch (e) { }
    }
    this.modalPdfDoc = null;
    this.modalFileIdx = -1;
  }

  modalPrevPage() {
    if (this.modalPage > 1) {
      this.modalPage--;
      this.renderModalPage();
    }
  }

  modalNextPage() {
    if (this.modalPage < this.modalTotalPages) {
      this.modalPage++;
      this.renderModalPage();
    }
  }

  modalZoomIn() {
    const cur = typeof this.modalZoom === 'number' ? this.modalZoom : 1.0;
    this.modalZoom = Math.min(3.0, cur + 0.25);
    this.renderModalPage();
  }

  modalZoomOut() {
    const cur = typeof this.modalZoom === 'number' ? this.modalZoom : 1.0;
    this.modalZoom = Math.max(0.4, cur - 0.25);
    this.renderModalPage();
  }

  modalZoomFit() {
    this.modalZoom = 'fit';
    this.renderModalPage();
  }

  modalZoomReset() {
    this.modalZoom = 1.0;
    this.renderModalPage();
  }

  modalRotate(deg) {
    this.modalRotation = (this.modalRotation + deg + 360) % 360;
    if (this.modalFileIdx >= 0 && this.files[this.modalFileIdx]) {
      this.files[this.modalFileIdx].rotation = this.modalRotation;
    }
    this.renderModalPage();
    this.renderQueue();
  }

  async renderModalPage() {
    if (!this.modalPdfDoc) return;

    const pageIndicator = document.getElementById('pdfModalPageIndicatorText');
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${this.modalPage} of ${this.modalTotalPages}`;
    }

    const btnPrev = document.getElementById('btnPdfModalPrev');
    const btnNext = document.getElementById('btnPdfModalNext');
    if (btnPrev) btnPrev.disabled = this.modalPage <= 1;
    if (btnNext) btnNext.disabled = this.modalPage >= this.modalTotalPages;

    const zoomBadge = document.getElementById('pdfModalZoomReadout');
    if (zoomBadge) {
      zoomBadge.textContent = this.modalZoom === 'fit' ? 'Fit' : `${Math.round(this.modalZoom * 100)}%`;
    }

    const canvas = document.getElementById('pdfModalCanvas');
    const viewportBox = document.getElementById('pdfModalViewport');
    if (!canvas || !viewportBox) return;

    try {
      if (this.renderTask) {
        this.renderTask.cancel();
      }

      const page = await this.modalPdfDoc.getPage(this.modalPage);
      const unscaledViewport = page.getViewport({ scale: 1.0, rotation: this.modalRotation });

      let scale = 1.0;
      if (this.modalZoom === 'fit') {
        const availW = viewportBox.clientWidth - 48;
        const availH = viewportBox.clientHeight - 48;
        scale = Math.min(availW / unscaledViewport.width, availH / unscaledViewport.height);
      } else {
        scale = this.modalZoom;
      }

      const viewport = page.getViewport({ scale, rotation: this.modalRotation });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext('2d');
      this.renderTask = page.render({ canvasContext: ctx, viewport });
      await this.renderTask.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn('Modal page render error:', err);
      }
    }
  }

  renderModalImage(imgBytes) {
    const canvas = document.getElementById('pdfModalCanvas');
    if (!canvas) return;

    const img = new Image();
    const blob = new Blob([imgBytes], { type: 'image/jpeg' });
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
    };
  }

  // ==============================================================================
  // Direct Disk Subfolder Saving (Zero-Port Native IPC & Zero-Overwrite)
  // ==============================================================================

  async saveOutputFile(subfolderName, fileName, dataBlobOrBytes) {
    let bytes;
    if (dataBlobOrBytes instanceof Uint8Array) {
      bytes = dataBlobOrBytes;
    } else if (dataBlobOrBytes instanceof Blob) {
      const buf = await dataBlobOrBytes.arrayBuffer();
      bytes = new Uint8Array(buf);
    } else {
      throw new Error('Invalid output format');
    }

    // Determine target directory
    const targetDir = this.activeFolderPath
      ? `${this.activeFolderPath}/${subfolderName}`
      : `Output/${subfolderName}`;

    // Clean filename
    let finalName = fileName.replace(/[<>:"/\\|?*]/g, '_');
    const dotIdx = finalName.lastIndexOf('.');
    const stem = dotIdx !== -1 ? finalName.slice(0, dotIdx) : finalName;
    const ext = dotIdx !== -1 ? finalName.slice(dotIdx) : '';

    let destPath = `${targetDir}/${finalName}`;

    // Zero-Overwrite collision avoidance
    const res = await writeBinaryFile(destPath, bytes);
    if (!res.success) {
      throw new Error(res.error || `Failed to write file ${destPath}`);
    }

    // Auto-unlock Windows file locks (:Zone.Identifier and Read-Only)
    if (typeof window !== 'undefined' && window.__TAURI__?.invoke) {
      try {
        await window.__TAURI__.invoke('strip_windows_file_locks', { paths: [destPath] });
      } catch (e) { }
    }

    this.lastOutputFolder = targetDir;
    return destPath;
  }

  async handleStartProcess() {
    if (this.files.length === 0) {
      toast.show('No Files', 'Please add files to process.', 'warning');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    const opName = this.activeTool;
    const subfolder = getSubfolderName(opName);
    toast.show('Processing Started', `Running ${this._getToolDisplayName(opName)} via Zero-Port Native IPC...`, 'info');

    const btnStart = document.getElementById('startCompressBtn');
    const gridContainer = document.getElementById('pdfCardsGridContainer');
    const grid = document.getElementById('pdfCardsGrid');

    if (btnStart) {
      btnStart.disabled = true;
      btnStart.classList.add('opacity-50', 'cursor-not-allowed');
      const labelSpan = btnStart.querySelector('span:last-child');
      if (labelSpan) labelSpan.textContent = 'Compressing...';
    }

    // Lock Screen Scroll to prevent user scrolling during execution (Choice 2-A)
    if (gridContainer) {
      gridContainer.scrollTop = 0;
      gridContainer.style.overflow = 'hidden';
    }

    // Sample 1: In-Place Bento Progress Transformation directly inside grid
    let centerBar = null;
    let centerCount = null;
    let centerEta = null;
    let centerFileName = null;
    let centerPct = null;

    if (opName === 'compress_pdf' && grid) {
      const totalFiles = this.files.length;
      const origTotalBytes = this.files.reduce((acc, f) => acc + (f.size || 0), 0);
      const origStr = origTotalBytes >= 1024 * 1024
        ? `${(origTotalBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(origTotalBytes / 1024)} KB`;
      const targetStr = this.targetKb >= 1024
        ? `${(this.targetKb / 1024).toFixed(1)} MB`
        : `${this.targetKb} KB`;

      grid.className = 'flex items-center justify-center min-h-[380px] w-full';
      grid.innerHTML = `
        <div id="pdfCenterProgressCard" class="col-span-full max-w-xl w-full mx-auto bg-white rounded-2xl border-2 border-blue-500/30 shadow-xl p-7 flex flex-col items-center text-center">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
            <span class="material-symbols-outlined text-[32px] animate-spin">sync</span>
          </div>
          <h3 class="text-xl font-bold text-slate-800 tracking-tight">Compressing Documents</h3>
          <p id="pdfCenterProgressFileName" class="text-xs text-blue-600 font-mono mt-1 mb-5 truncate max-w-sm">Preparing batch compression...</p>

          <div class="grid grid-cols-3 gap-3 w-full mb-5 text-center font-mono">
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed</div>
              <div id="pdfCenterProgressCount" class="text-sm font-extrabold text-slate-800 mt-0.5">0 / ${totalFiles} Files</div>
              <div class="text-[10px] text-blue-600 font-semibold mt-0.5">Batch Active</div>
            </div>
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Before Size</div>
              <div class="text-sm font-extrabold text-slate-700 mt-0.5">${origStr}</div>
              <div class="text-[10px] text-slate-400 font-medium mt-0.5">Original</div>
            </div>
            <div class="bg-blue-50/60 rounded-xl p-2.5 border border-blue-200">
              <div class="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Time Left</div>
              <div id="pdfCenterProgressEta" class="text-sm font-extrabold text-blue-700 mt-0.5">Estimating...</div>
              <div class="text-[10px] text-blue-600 font-bold mt-0.5">Speed: Fast</div>
            </div>
          </div>

          <div class="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/80 mb-2">
            <div id="pdfCenterProgressBar" class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-200 shadow-xs" style="width: 0%;"></div>
          </div>

          <div class="w-full flex items-center justify-between text-xs font-mono text-slate-500 px-1 mb-4">
            <span id="pdfCenterProgressPct" class="font-bold text-slate-800">0% Completed</span>
            <span class="text-slate-400">Target: ${targetStr}</span>
          </div>

          <div class="flex items-center gap-2 text-[11px] text-slate-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero-Port Native IPC Engine Active</span>
          </div>
        </div>
      `;

      centerBar = document.getElementById('pdfCenterProgressBar');
      centerCount = document.getElementById('pdfCenterProgressCount');
      centerEta = document.getElementById('pdfCenterProgressEta');
      centerFileName = document.getElementById('pdfCenterProgressFileName');
      centerPct = document.getElementById('pdfCenterProgressPct');
    }

    try {
      let savedCount = 0;

      if (opName === 'compress_pdf') {
        const totalFiles = this.files.length;
        const origTotalBytes = this.files.reduce((acc, f) => acc + (f.size || 0), 0);
        let outTotalBytes = 0;
        let completedFiles = 0;
        const startTime = Date.now();

        // Feature 11: Multi-Core Parallel Batch Engine with 12 Pro Compression Features
        await compressBatchParallel(
          this.files,
          this.targetKb,
          (fileId, pct) => {
            const card = document.querySelector(`.docket-card[data-file-id="${fileId}"]`);
            if (card) {
              const compEl = card.querySelector('.badge-comp-size');
              if (compEl) compEl.textContent = `Comp ~${pct}%...`;
            }
          },
          async (file, res) => {
            if (res && res.success) {
              await this.saveOutputFile(subfolder, res.outName, res.finalBlob || res.finalBytes);
              savedCount++;
              completedFiles++;
              outTotalBytes += (res.finalSize || 0);

              const overallPct = Math.round((completedFiles / totalFiles) * 100);
              const elapsedSec = (Date.now() - startTime) / 1000;
              const avgTime = elapsedSec / completedFiles;
              const remaining = totalFiles - completedFiles;
              const estLeft = Math.max(0, Math.ceil(remaining * avgTime));
              const etaText = remaining > 0 ? `Est. ~${estLeft}s left` : 'Finalizing...';

              // Update In-Place Bento Progress Card (Sample 1)
              if (centerBar) centerBar.style.width = `${overallPct}%`;
              if (centerCount) centerCount.textContent = `${completedFiles} / ${totalFiles} Files`;
              if (centerEta) centerEta.textContent = etaText;
              if (centerFileName) centerFileName.textContent = file.name;
              if (centerPct) centerPct.textContent = `${overallPct}% Completed`;

              // Update card in real-time
              const card = document.querySelector(`.docket-card[data-file-id="${file.id}"]`);
              if (card) {
                const compEl = card.querySelector('.badge-comp-size');
                if (compEl) {
                  const finalKbStr = res.finalSize >= 1024 * 1024
                    ? `${(res.finalSize / (1024 * 1024)).toFixed(2)} MB`
                    : `${Math.round(res.finalSize / 1024)} KB`;
                  compEl.textContent = `Comp ${finalKbStr}`;
                  compEl.className = 'badge-comp-size px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded font-mono text-[10px] font-bold truncate';
                }

                // Feature 10 (A3): If reached minimum readability floor, display amber warning badge!
                if (res.isAtFloor) {
                  let floorBadge = card.querySelector('.badge-floor-limit');
                  if (!floorBadge) {
                    floorBadge = document.createElement('div');
                    floorBadge.className = 'badge-floor-limit mt-1 px-1.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 rounded font-mono text-[9px] font-bold text-center';
                    card.appendChild(floorBadge);
                  }
                  floorBadge.textContent = `⚠ Min readable limit: ${res.floorKb} KB`;
                }
              }
            }
          }
        );

        const savedPct = origTotalBytes > 0 && origTotalBytes > outTotalBytes
          ? Math.round(((origTotalBytes - outTotalBytes) / origTotalBytes) * 100)
          : 0;

        const outFolderPath = this.lastOutputFolder || (this.activeFolderPath ? `${this.activeFolderPath}/${subfolder}` : `Output/${subfolder}`);

        this.completionSummary = {
          totalFiles: savedCount,
          origTotalBytes: origTotalBytes,
          outTotalBytes: outTotalBytes,
          savedPct: savedPct,
          outFolderPath: outFolderPath
        };

        // Unlock Screen Scroll & seamlessly transform in-place to Batch Compression Complete Bento Card
        if (gridContainer) gridContainer.style.overflow = '';
        this.files = [];
        this.updateStats();
        this.renderQueue();

        toast.show('Compression Complete!', `Saved ${savedCount} files directly into ${subfolder}/`, 'success');

        // Auto-Open Output Folder in Foreground at 100% Completion (Choice 2-A / Upgrade 4)
        if (outFolderPath) {
          openFolderInExplorer(outFolderPath);
        }

      } else if (opName === 'merge_pdf') {
        // Merge PDFs into single admission dossier
        const byteList = this.files.map(f => f.bytes).filter(Boolean);
        const mergedBlob = mergePdfDocuments(byteList, 'portrait');
        const dossierName = this.activeFolderName
          ? `Merged_Admission_Dossier_${this.activeFolderName}.pdf`
          : 'Merged_Admission_Dossier.pdf';

        await this.saveOutputFile(subfolder, dossierName, mergedBlob);
        savedCount = 1;
        toast.show('Merge Complete!', `Dossier saved to ${subfolder}/${dossierName}`, 'success');

      } else if (opName === 'split_pdf') {
        // Split with optional selective page range
        for (const f of this.files) {
          if (!f.bytes) continue;

          let images = getDocumentImagesFromPdf(f.bytes);
          if (!images || images.length === 0) {
            images = await renderPdfPagesToJpegs(f.bytes, 150, 0.85);
          }

          const totalPages = images.length || f.pageCount || 1;
          const allowedIndices = parsePageRanges(this.splitPageRange, totalPages);

          const splitResults = splitPdfDocument(f.bytes, f.name, allowedIndices, images);
          for (const item of splitResults) {
            await this.saveOutputFile(subfolder, item.fileName, item.blob);
            savedCount++;
          }
        }
        toast.show('Split Complete!', `Extracted ${savedCount} pages into ${subfolder}/`, 'success');

      } else if (opName === 'pdf_to_jpg') {
        // PDF to JPG with configurable DPI (150 default) & vector canvas fallback
        for (const f of this.files) {
          if (!f.bytes) continue;

          let fallbackImages = [];
          const existingImages = getDocumentImagesFromPdf(f.bytes);
          if (!existingImages || existingImages.length === 0) {
            fallbackImages = await renderPdfPagesToJpegs(f.bytes, this.jpgDpi, 0.85);
          }

          const jpgResults = convertPdfToJpg(f.bytes, f.name, fallbackImages);
          for (const item of jpgResults) {
            await this.saveOutputFile(subfolder, item.fileName, item.blob || item.bytes);
            savedCount++;
          }
        }
        toast.show('Conversion Complete!', `Saved ${savedCount} high-res JPGs to ${subfolder}/`, 'success');

      } else if (opName === 'jpg_to_pdf') {
        // JPG to PDF Compilation (Phase 3 sub-tool)
        const imageList = [];
        for (const f of this.files) {
          if (f.bytes) {
            imageList.push({ bytes: f.bytes });
          }
        }

        if (imageList.length > 0) {
          const compiledBlob = createPdfFromJpegs(imageList, 'portrait');
          const pdfName = this.activeFolderName
            ? `Compiled_Documents_${this.activeFolderName}.pdf`
            : 'Compiled_Document.pdf';

          await this.saveOutputFile(subfolder, pdfName, compiledBlob);
          savedCount = 1;
          toast.show('Compilation Complete!', `Compiled ${imageList.length} images into ${subfolder}/${pdfName}`, 'success');
        }

      } else if (opName === 'rotate_pdf') {
        for (const f of this.files) {
          if (!f.bytes) continue;
          const rotatedBlob = rotatePdfDocument(f.bytes, f.rotation || 90);
          await this.saveOutputFile(subfolder, f.name, rotatedBlob);
          savedCount++;
        }
        toast.show('Rotation Complete!', `Saved ${savedCount} rotated PDFs to ${subfolder}/`, 'success');

      } else {
        // Clean & enhance
        for (const f of this.files) {
          if (!f.bytes) continue;
          const images = getDocumentImagesFromPdf(f.bytes);
          const cleanedBlob = createPdfFromJpegs(images, 'portrait');
          await this.saveOutputFile(subfolder, f.name, cleanedBlob);
          savedCount++;
        }
        toast.show('Enhancement Complete!', `Saved ${savedCount} clean PDFs to ${subfolder}/`, 'success');
      }

    } catch (err) {
      console.error('[PDF-STUDIO] Process failed:', err);
      toast.show('Operation Failed', err.message, 'error');
      if (gridContainer) gridContainer.style.overflow = '';
      this.renderQueue();
    } finally {
      this.isProcessing = false;
      if (gridContainer) gridContainer.style.overflow = '';
      if (btnStart) {
        btnStart.disabled = false;
        btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
      }
      this._updateProcessButtonLabel();
    }
  }
}

export function initPdfStudioUI() {
  const manager = new PdfStudioUIManager();
  manager.init();
  if (typeof window !== 'undefined') {
    window.pdfStudioUI = manager;
  }
  return manager;
}
