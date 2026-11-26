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
    const radioBtns = document.querySelectorAll('#compressTargetControlBar .target-radio-pill');
    const slider = document.getElementById('sliderTargetKb');
    const inputKb = document.getElementById('inputManualTargetKb');
    const inputMb = document.getElementById('inputManualTargetMb');

    const updatePills = (kb) => {
      radioBtns.forEach(btn => {
        const btnKb = parseInt(btn.getAttribute('data-kb'), 10);
        if (btnKb === kb) {
          if (btnKb === 300) {
            btn.className = 'target-radio-pill relative px-3 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-md shadow-md ring-2 ring-blue-500/50 flex items-center gap-1.5 transition cursor-pointer';
            btn.innerHTML = `
              <span class="relative flex h-1.5 w-1.5">
                <span class="animate-beacon-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span class="tracking-wide">300 KB</span>
            `;
          } else {
            btn.className = 'target-radio-pill px-2.5 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-md shadow-xs transition cursor-pointer';
            btn.textContent = `${btnKb} KB`;
          }
        } else {
          btn.className = 'target-radio-pill px-2.5 py-0.5 text-xs font-medium text-slate-600 rounded-md hover:bg-white hover:text-slate-900 transition cursor-pointer';
          btn.textContent = `${btnKb} KB`;
        }
      });
    };

    const setTargetKb = (val, source) => {
      let kb = parseInt(val, 10);
      if (isNaN(kb) || kb <= 0) kb = 300;
      if (kb > 102400) kb = 102400; // max 100 MB
      this.targetKb = kb;

      if (source !== 'slider' && slider) {
        slider.value = Math.min(Math.max(kb, 50), 1000);
      }
      if (source !== 'inputKb' && inputKb) {
        inputKb.value = kb;
      }
      if (source !== 'inputMb' && inputMb) {
        inputMb.value = (kb / 1024).toFixed(2);
      }
      updatePills(kb);
      this.updateStats();
    };

    radioBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const kb = parseInt(btn.getAttribute('data-kb'), 10);
        setTargetKb(kb, 'radio');
        toast.show('Target Size', `Target set to < ${kb} KB`, 'info');
      });
    });

    if (slider) {
      slider.addEventListener('input', (e) => {
        const kb = parseInt(e.target.value, 10);
        setTargetKb(kb, 'slider');
      });
    }

    if (inputKb) {
      inputKb.addEventListener('input', (e) => {
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

    if (inputMb) {
      inputMb.addEventListener('input', (e) => {
        const mb = parseFloat(e.target.value);
        if (!isNaN(mb) && mb > 0) {
          const kb = Math.round(mb * 1024);
          setTargetKb(kb, 'inputMb');
        }
      });
      inputMb.addEventListener('change', (e) => {
        let mb = parseFloat(e.target.value);
        if (isNaN(mb) || mb < 0.05) mb = 0.05;
        if (mb > 100) mb = 100;
        const kb = Math.round(mb * 1024);
        setTargetKb(kb, 'inputMb');
      });
    }

    // Set initial active state (300 KB default)
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

    // Open Output Folder
    const btnOpenOutput = document.getElementById('btnOpenOutputFolder');
    if (btnOpenOutput) {
      btnOpenOutput.addEventListener('click', () => {
        if (this.lastOutputFolder) {
          openFolderInExplorer(this.lastOutputFolder);
        }
      });
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
      const validFiles = (isMixedMode || isJpgMode)
        ? items.filter(f => /\.(pdf|jpe?g|png|webp)$/i.test(f.name))
        : items.filter(f => /\.pdf$/i.test(f.name));

      if (validFiles.length === 0) {
        toast.show('Invalid Files', isMixedMode ? 'Please drop PDF, JPG, or PNG documents.' : (isJpgMode ? 'Please drop JPG/PNG images only.' : 'Please drop PDF files only.'), 'warning');
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
        this.handleBrowseFolder();
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
        ? 'Documents & Images (*.pdf;*.jpg;*.jpeg;*.png;*.webp)|*.pdf;*.jpg;*.jpeg;*.png;*.webp'
        : (isJpgMode ? 'Images (*.jpg;*.jpeg;*.png;*.webp)|*.jpg;*.jpeg;*.png;*.webp' : 'PDF Documents (*.pdf)|*.pdf');
      const title = isMixedMode
        ? 'Select Documents (PDF, JPG, PNG) - DocMitra'
        : (isJpgMode ? 'Select Images for PDF - DocMitra' : 'Select PDF Files - DocMitra');

      const res = await selectNativeFiles(filter, title);
      if (res && res.success && res.files && res.files.length) {
        if (!this.activeFolderPath && res.files[0].path) {
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
      ? '.pdf,.jpg,.jpeg,.png,.webp,image/*,application/pdf'
      : '.pdf,application/pdf';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', async (e) => {
      const fileList = Array.from(e.target.files || []);
      if (fileList.length > 0) {
        await this.loadDroppedFiles(fileList);
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  async loadNativeFiles(fileList) {
    for (const f of fileList) {
      try {
        let bytes = null;
        if (f.path) {
          bytes = await readBinaryFile(f.path);
        } else if (f.fileObj) {
          const buf = await f.fileObj.arrayBuffer();
          bytes = new Uint8Array(buf);
        }

        const dir = f.dir || (f.path ? f.path.substring(0, f.path.lastIndexOf(/[\/\\]/)) : this.activeFolderPath);
        if (!this.activeFolderPath && dir) {
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
      cardCount.innerHTML = `${totalFiles} Documents <span class="text-[10px] font-normal text-slate-500 font-sans">(Ready)</span>`;
    }

    const cardTotal = document.getElementById('summaryPdfTotalSize');
    if (cardTotal) {
      cardTotal.innerHTML = `${totalMB} MB <span class="text-[10px] font-normal text-slate-400 font-sans">(Uncompressed)</span>`;
    }

    const cardProjected = document.getElementById('summaryPdfProjected');
    if (cardProjected) {
      cardProjected.textContent = `~${projectedMB} MB`;
    }

    const reductionBadge = document.getElementById('summaryPdfReductionBadge');
    if (reductionBadge) {
      reductionBadge.textContent = `↓ -${reductionPct}% saved`;
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

    this.files.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'docket-card relative bg-white rounded-xl border border-slate-200/90 p-2.5 flex flex-col justify-between hover:border-blue-400 hover:shadow-lg transition-all group cursor-pointer stitch-paper-shadow';

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

      // Reduction Percentage Badge (Stitch Sample 4 Red Badge)
      const targetBytes = this.targetKb * 1024;
      if (file.size > targetBytes) {
        const redPct = Math.min(95, Math.max(10, Math.round(((file.size - targetBytes) / file.size) * 100)));
        const redBadge = document.createElement('span');
        redBadge.className = 'bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono';
        redBadge.textContent = `-${redPct}%`;
        rightCluster.appendChild(redBadge);
      }

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
      canvas.className = 'max-w-full max-h-full object-contain shadow-xs rounded bg-white';
      thumbBox.appendChild(canvas);

      const pageBadge = document.createElement('div');
      pageBadge.className = 'absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white rounded px-1.5 py-0.5 text-[9px] font-mono font-bold select-none';
      pageBadge.textContent = `${file.pageCount || 1}p`;

      // Render first page with PDF.js if PDF, or render Image
      if (file.bytes && window.pdfjsLib && !file.name.match(/\.(jpe?g|png|webp)$/i)) {
        window.pdfjsLib.getDocument({ data: file.bytes }).promise.then(pdf => {
          file.pageCount = pdf.numPages;
          pageBadge.textContent = `${pdf.numPages}p`;

          pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 0.5, rotation: file.rotation || 0 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({
              canvasContext: canvas.getContext('2d'),
              viewport: viewport
            });
          });
        }).catch(() => {
          canvas.style.display = 'none';
          const icon = document.createElement('span');
          icon.className = 'material-symbols-outlined text-[36px] text-blue-500 opacity-40';
          icon.textContent = 'picture_as_pdf';
          thumbBox.appendChild(icon);
        });
      } else if (file.bytes && file.name.match(/\.(jpe?g|png|webp)$/i)) {
        const img = new Image();
        const blob = new Blob([file.bytes], { type: isPng ? 'image/png' : 'image/jpeg' });
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(img.src);
        };
        pageBadge.textContent = 'IMG';
      }

      thumbBox.appendChild(pageBadge);
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
      pillOrig.className = 'px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded font-mono text-[10px] font-bold truncate';
      pillOrig.textContent = `Orig ${origKb}`;
      footerPills.appendChild(pillOrig);

      const pillComp = document.createElement('span');
      pillComp.className = 'px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded font-mono text-[10px] font-bold truncate';
      pillComp.textContent = `Comp ${compKb}`;
      footerPills.appendChild(pillComp);

      card.appendChild(footerPills);

      // Click card opens Bento Preview Modal
      card.addEventListener('click', () => {
        this.openPreviewModal(idx);
      });

      grid.appendChild(card);
    });
  }

  rotateSingleFile(idx) {
    const file = this.files[idx];
    if (!file || !file.bytes) return;

    try {
      file.rotation = ((file.rotation || 0) + 90) % 360;
      const rotatedBlob = rotatePdfDocument(file.bytes, 90);
      rotatedBlob.arrayBuffer().then(buf => {
        file.bytes = new Uint8Array(buf);
        file.size = rotatedBlob.size;
        this.renderQueue();
        toast.show('Page Rotated', `${file.name} rotated 90° clockwise.`, 'info');
      });
    } catch (err) {
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
        this.modalPdfDoc = await window.pdfjsLib.getDocument({ data: file.bytes }).promise;
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

    try {
      let savedCount = 0;

      if (opName === 'compress_pdf') {
        // Compress PDF or auto-convert images to compressed PDF (< targetKb)
        for (const f of this.files) {
          if (!f.bytes) continue;

          let outputBlob;
          if (f.name.match(/\.(jpe?g|png|webp)$/i)) {
            // Image input: auto-convert to PDF
            outputBlob = createPdfFromJpegs([f.bytes], 'portrait', f.rotation || 0);
            const baseName = f.name.replace(/\.[^/.]+$/, "") + '.pdf';
            const outName = formatSizeSuffixFilename(baseName, outputBlob.size);
            await this.saveOutputFile(subfolder, outName, outputBlob);
            savedCount++;
            continue;
          }

          let images = getDocumentImagesFromPdf(f.bytes);
          // Vector PDF Fallback: Render via PDF.js canvas if 0 embedded JPEGs found
          if (!images || images.length === 0) {
            images = await renderPdfPagesToJpegs(f.bytes, 150, 0.78);
          }

          if (images.length > 0) {
            outputBlob = createPdfFromJpegs(images, 'portrait', f.rotation || 0);
          } else {
            outputBlob = new Blob([f.bytes], { type: 'application/pdf' });
          }

          const outName = formatSizeSuffixFilename(f.name, outputBlob.size);
          await this.saveOutputFile(subfolder, outName, outputBlob);
          savedCount++;
        }
        toast.show('Compression Complete!', `Saved ${savedCount} files directly into ${subfolder}/`, 'success');

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

      // Show 1-click Open Output Folder button on completion
      const btnOpen = document.getElementById('btnOpenOutputFolder');
      if (btnOpen) {
        btnOpen.classList.remove('hidden');
      }

    } catch (err) {
      console.error('[PDF-STUDIO] Process failed:', err);
      toast.show('Operation Failed', err.message, 'error');
    } finally {
      this.isProcessing = false;
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
