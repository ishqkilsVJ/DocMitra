/**
 * tools/rename_tool/missing_documents_modal.js
 * DocMitra Suite — Isolated Missing Documents & Follow-up Desk Modal
 * Extracted and adapted from Stitch design specification (code.html / screen.png).
 * Fully encapsulated ES Module component.
 */

import { readBinaryFile } from '../../shared/native-bridge.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 KB';
  const kb = Math.round(bytes / 1024);
  return `${kb} KB`;
}

function formatFileDate(timestamp) {
  if (!timestamp) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    return '25-11-2026';
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export class MissingDocumentsModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onImportFile = options.onImportFile || (() => {});
    this.onSetFollowup = options.onSetFollowup || (() => {});
    this.onPresetChange = options.onPresetChange || (() => {});
    this.onRenameFolder = options.onRenameFolder || (() => {});
    this.onViewDocument = options.onViewDocument || (() => {});
    this.onClose = options.onClose || (() => {});

    this.modalEl = null;
    this.contentEl = null;
    this.quickPreviewEl = null;
    this.isOpen = false;
    this.currentProps = null;

    this._handleKeydown = this._handleKeydown.bind(this);
  }

  mount() {
    if (this.modalEl) return;

    const el = document.createElement('div');
    el.id = 'modalMissingDocumentsDesk';
    el.className = 'rename-tool-scope fixed inset-0 z-[1050] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 hidden select-none animate-in fade-in duration-150';
    el.innerHTML = `
      <div class="relative w-full max-w-[1040px] max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all duration-300">
        <div id="missingModalContent" class="flex flex-col h-full overflow-hidden"></div>

        <!-- In-Modal Quick Preview Overlay (Choice 3-C) -->
        <div id="inModalQuickPreview" class="hidden absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
            <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <span class="material-symbols-outlined text-primary text-[20px] shrink-0">visibility</span>
                <span id="quickPreviewTitle" class="font-heading font-bold text-sm text-slate-900 truncate">Document Preview</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button id="btnQuickPreviewClose" type="button" class="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer" title="Close Preview (Esc)">
                  <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div id="quickPreviewBody" class="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 min-h-[360px]">
              <!-- Dynamic image or PDF canvas rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(el);
    this.modalEl = el;
    this.contentEl = el.querySelector('#missingModalContent');
    this.quickPreviewEl = el.querySelector('#inModalQuickPreview');

    // Backdrop click dismisses modal (unless quick preview is active)
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        if (!this.quickPreviewEl.classList.contains('hidden')) {
          this.closeQuickPreview();
        } else {
          this.close();
        }
      }
    });

    // Quick preview close wiring
    const btnQPClose = el.querySelector('#btnQuickPreviewClose');
    if (btnQPClose) {
      btnQPClose.onclick = () => this.closeQuickPreview();
    }
  }

  open(props) {
    this.mount();
    this.currentProps = props;
    this.isOpen = true;
    this.modalEl.classList.remove('hidden');
    document.addEventListener('keydown', this._handleKeydown);
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
      this.closeQuickPreview();
    }
    document.removeEventListener('keydown', this._handleKeydown);
    this.onClose();
  }

  closeQuickPreview() {
    if (this.quickPreviewEl) {
      this.quickPreviewEl.classList.add('hidden');
      const body = this.quickPreviewEl.querySelector('#quickPreviewBody');
      if (body) body.innerHTML = '';
    }
  }

  async showQuickPreview(doc) {
    if (!this.quickPreviewEl) return;

    const titleEl = this.quickPreviewEl.querySelector('#quickPreviewTitle');
    const bodyEl = this.quickPreviewEl.querySelector('#quickPreviewBody');

    const docName = doc.docType || doc.name || 'Document';
    if (titleEl) {
      titleEl.textContent = `${docName} • ${formatBytes(doc.size)}`;
    }

    if (!bodyEl) return;

    // 1. Initial Loading Spinner
    bodyEl.innerHTML = `
      <div class="flex flex-col items-center justify-center p-8 gap-2 text-slate-500 text-xs font-mono">
        <span class="material-symbols-outlined text-[28px] animate-spin text-blue-600">sync</span>
        <span>Loading document preview...</span>
      </div>
    `;
    this.quickPreviewEl.classList.remove('hidden');

    const ext = (doc.ext || (doc.name ? doc.name.split('.').pop() : 'pdf')).toLowerCase().replace('.', '');
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);
    const isPdf = ext === 'pdf';
    const fileRot = doc.rotation || 0;

    // Helper: Create White Bento Card Paper Stage (Exact matching Main Renamer Stage)
    const paperStage = document.createElement('div');
    paperStage.className = 'bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center relative p-2 transition-transform duration-200';
    paperStage.style.maxHeight = '65vh';
    paperStage.style.maxWidth = '100%';
    if (fileRot) {
      paperStage.style.transform = `rotate(${fileRot}deg)`;
    }

    // Helper: Render PDF from bytes onto Canvas
    const renderPdfCanvas = async (bytes) => {
      if (!window.pdfjsLib) {
        bodyEl.innerHTML = '<div class="text-xs text-slate-500 font-mono">Initializing PDF engine...</div>';
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.className = 'max-w-full max-h-[60vh] object-contain shadow-sm rounded';
        const bufferCopy = (bytes instanceof Uint8Array) ? bytes.slice(0) : new Uint8Array(bytes);
        const pdfDoc = await window.pdfjsLib.getDocument({ data: bufferCopy }).promise;
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        bodyEl.innerHTML = '';
        paperStage.appendChild(canvas);
        bodyEl.appendChild(paperStage);
      } catch (err) {
        console.warn('[QuickPreview] PDF render error:', err);
        bodyEl.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
            <span class="material-symbols-outlined text-[32px] text-amber-500">picture_as_pdf</span>
            <span class="text-xs font-semibold text-slate-700">Unable to render PDF preview</span>
            <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(doc.name || '')}</span>
          </div>
        `;
      }
    };

    // Case A: Image
    if (isImg) {
      const displayImage = (blobUrl) => {
        const img = document.createElement('img');
        img.src = blobUrl;
        img.alt = docName;
        img.className = 'max-w-full max-h-[60vh] object-contain rounded';
        bodyEl.innerHTML = '';
        paperStage.appendChild(img);
        bodyEl.appendChild(paperStage);
      };

      if (doc._blobUrl) {
        displayImage(doc._blobUrl);
      } else if (doc.fileObj) {
        try {
          const blobUrl = URL.createObjectURL(doc.fileObj);
          doc._blobUrl = blobUrl;
          displayImage(blobUrl);
        } catch (_) {
          displayFallback();
        }
      } else {
        const filePath = doc.path || doc.nativePath;
        if (filePath) {
          try {
            const bytes = await readBinaryFile(filePath);
            if (!bytes || bytes.length === 0) throw new Error('Empty file bytes');
            const mime = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');
            const blob = new Blob([bytes], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            doc._blobUrl = blobUrl;
            displayImage(blobUrl);
          } catch (err) {
            console.warn('[QuickPreview] Image load error:', err);
            bodyEl.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                <span class="material-symbols-outlined text-[32px] text-amber-500">warning</span>
                <span class="text-xs font-semibold text-slate-700">Unable to load image preview</span>
                <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(doc.name || '')}</span>
              </div>
            `;
          }
        } else {
          bodyEl.innerHTML = '<div class="text-xs text-slate-500 font-mono">No file path available.</div>';
        }
      }
    } else if (isPdf) {
      // Case B: PDF
      if (doc._pdfBytes) {
        await renderPdfCanvas(doc._pdfBytes);
      } else if (doc.fileObj) {
        try {
          const buf = await doc.fileObj.arrayBuffer();
          doc._pdfBytes = new Uint8Array(buf);
          await renderPdfCanvas(doc._pdfBytes);
        } catch (_) {
          bodyEl.innerHTML = '<div class="text-xs text-rose-500 font-mono">Failed to read PDF file object.</div>';
        }
      } else {
        const filePath = doc.path || doc.nativePath;
        if (filePath) {
          try {
            const bytes = await readBinaryFile(filePath);
            if (!bytes || bytes.length === 0) throw new Error('Empty PDF bytes');
            doc._pdfBytes = bytes;
            await renderPdfCanvas(bytes);
          } catch (err) {
            console.warn('[QuickPreview] PDF load error:', err);
            bodyEl.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                <span class="material-symbols-outlined text-[32px] text-amber-500">picture_as_pdf</span>
                <span class="text-xs font-semibold text-slate-700">Unable to load PDF preview</span>
                <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(doc.name || '')}</span>
              </div>
            `;
          }
        } else {
          bodyEl.innerHTML = '<div class="text-xs text-slate-500 font-mono">No PDF file path available.</div>';
        }
      }
    } else {
      // Case C: Generic document
      bodyEl.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
          <span class="material-symbols-outlined text-[32px] text-blue-500">description</span>
          <span class="text-xs font-semibold text-slate-700">${escapeHtml(docName)}</span>
          <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(doc.ext || 'DOCUMENT')} • ${formatBytes(doc.size)}</span>
        </div>
      `;
    }
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.quickPreviewEl && !this.quickPreviewEl.classList.contains('hidden')) {
        this.closeQuickPreview();
      } else {
        this.close();
      }
    } else if (e.key === 'Enter') {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag !== 'INPUT' && activeTag !== 'BUTTON' && activeTag !== 'SELECT') {
        e.preventDefault();
        this.close();
      }
    }
  }

  render(newProps) {
    if (newProps) {
      this.currentProps = newProps;
    }
    if (!this.contentEl || !this.currentProps) return;

    const {
      studentName = 'Student',
      folderPath = '',
      activePreset = 'MAHA DBT',
      presetsList = ['MAHA DBT', 'CET CELL', 'SWAYAM DEENDAYAL YOJANA', 'EDUCATIONAL DOCUMENTS'],
      missingRules = [],
      presentDocs = [],
      followupMap = {},
      totalRequiredCount = 0
    } = this.currentProps;

    const missingCount = missingRules.length;
    const presentCount = presentDocs.length;
    const totalCount = totalRequiredCount || (presentCount + missingCount);
    const percent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

    // SVG dasharray (circumference = 163.3 for r=26)
    const circumference = 163.3;
    const strokeDashOffset = circumference - (circumference * percent / 100);

    this.contentEl.innerHTML = `
      <!-- BEGIN: ModalHeader -->
      <header class="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white sticky top-0 z-20 shrink-0">
        <div class="flex items-center space-x-3.5">
          <!-- App icon with double-layered bookmark/layer symbol -->
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <div>
            <h1 class="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              Missing Documents &amp; Follow-up Desk
            </h1>
          </div>
        </div>

        <!-- Bento PRESET Selector Pill with Elevated Floating Menu -->
        <div class="flex items-center">
          <div id="modalPresetCard" class="relative group flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer select-none" title="Click to switch active document preset">
            <span class="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)]"></span>
            <span>PRESET: <strong id="modalPresetActiveName" class="text-slate-900">${escapeHtml(activePreset)}</strong></span>
            <svg id="modalPresetChevron" class="w-3.5 h-3.5 text-slate-500 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>

            <!-- Elevated Floating Menu (z-[9999]) with Active Checkmarks -->
            <div id="modalPresetMenu" class="hidden absolute top-[calc(100%+6px)] right-0 w-[240px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden transition-all duration-150">
              ${presetsList.map(p => {
                const isActive = p === activePreset;
                return `
                  <div class="modal-preset-item flex items-center justify-between px-3.5 py-2 text-[12px] font-mono font-semibold cursor-pointer transition-colors rounded-lg mx-1 ${
                    isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                  }" data-preset="${escapeHtml(p)}">
                    <span class="truncate mr-2">${escapeHtml(p)}</span>
                    ${isActive ? '<span class="material-symbols-outlined text-[16px] text-blue-600 shrink-0">check</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </header>
      <!-- END: ModalHeader -->

      <!-- BEGIN: ModalBodyContent -->
      <main class="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scroll">
        <!-- BEGIN: ApplicationReadinessSection -->
        <section class="bg-gradient-to-r from-slate-50 via-slate-50/70 to-blue-50/30 border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs" data-purpose="readiness-banner">
          <div class="flex items-center space-x-4 sm:space-x-5">
            <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle class="text-slate-200" cx="32" cy="32" fill="transparent" r="26" stroke="currentColor" stroke-width="5"></circle>
                <circle class="text-emerald-500 progress-ring__circle transition-all duration-500" cx="32" cy="32" fill="transparent" r="26" stroke="currentColor" stroke-dasharray="163.3" stroke-dashoffset="${strokeDashOffset}" stroke-linecap="round" stroke-width="5.5"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                <span class="text-[13px] font-extrabold text-slate-800">${percent}%</span>
                <span class="text-[8px] font-bold text-emerald-600 uppercase tracking-tight mt-0.5">VERIFIED</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center space-x-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <span>STUDENT NAME:</span>
                <div id="missingStudentDisplayWrap" class="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200/60 text-xs normal-case">
                  <span id="missingStudentNameDisplay">${escapeHtml(studentName)}</span>
                  <button id="btnMissingEditFolder" aria-label="Edit student name" class="text-blue-500 hover:text-blue-700 cursor-pointer" type="button" title="Edit Student / Folder Name">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                  </button>
                </div>

                <!-- Inline Edit Form (Hidden by default) -->
                <div id="missingStudentEditWrap" class="inline-flex items-center space-x-1.5 hidden">
                  <input id="inputMissingEditStudent" type="text" value="${escapeHtml(studentName)}" class="px-2 py-0.5 rounded border border-blue-500 text-xs font-bold font-heading text-slate-800 focus:outline-none w-48 shadow-2xs">
                  <button id="btnMissingApplyStudent" type="button" class="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer">Apply</button>
                  <button id="btnMissingCancelStudent" type="button" class="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] cursor-pointer">✕</button>
                </div>
              </div>

              <div class="flex items-center flex-wrap gap-2 pt-0.5">
                <h2 class="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
                  ${presentCount} of ${totalCount} Documents Staged (${percent}% Verified)
                </h2>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ MahaDBT Compliant
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <!-- Active Verified Card -->
            <div class="bg-white border-2 border-emerald-500/80 rounded-xl px-4 py-2.5 min-w-[140px] flex items-center space-x-3 shadow-xs ring-2 ring-emerald-100">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 leading-none">ACTIVE • VERIFIED</p>
                <p class="text-sm font-extrabold text-emerald-700 mt-1">${presentCount} Documents</p>
              </div>
            </div>

            <!-- Missing Card -->
            <div class="bg-white border border-rose-200/90 rounded-xl px-4 py-2.5 min-w-[130px] flex items-center space-x-3 shadow-xs">
              <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-rose-600 leading-none">MISSING</p>
                <p class="text-sm font-extrabold text-rose-600 mt-1">${missingCount} Documents</p>
              </div>
            </div>
          </div>
        </section>
        <!-- END: ApplicationReadinessSection -->

        <!-- BEGIN: 2-COLUMN SIDE-BY-SIDE BENTO LAYOUT (EXACT STITCH REPLICATION) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" data-purpose="bento-columns-layout">

          <!-- LEFT COLUMN: Missing Documents (${missingCount} Required) -->
          <div class="flex flex-col bg-slate-50/60 border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <!-- Column Header -->
            <div class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 class="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">Missing Documents</h3>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${missingCount > 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                ${missingCount > 0 ? `${missingCount} Required` : '0 Required'}
              </span>
            </div>

            <!-- Scrollable Missing Documents List -->
            <div class="p-3.5 space-y-2.5 overflow-y-auto custom-pan-scroll" style="max-height: 440px;">
              ${missingCount === 0 ? `
                <div class="p-6 text-center text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 font-medium text-xs">
                  🎉 All required documents have been verified and staged in this folder!
                </div>
              ` : missingRules.map((rule) => {
                const ruleName = typeof rule === 'string' ? rule : (rule.name || '');
                const currentFollowup = followupMap[ruleName] || '';

                return `
                  <div class="bg-white border border-slate-200 border-l-[3.5px] border-l-rose-500 rounded-lg p-3 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
                    <div class="min-w-0 flex items-center space-x-2.5">
                      <span class="text-xs font-bold text-slate-800 tracking-wide uppercase truncate" title="${escapeHtml(ruleName)}">${escapeHtml(ruleName)}</span>
                      <span class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full shrink-0">Missing</span>
                    </div>

                    <div class="flex items-center space-x-2 shrink-0">
                      <div class="relative flex items-center" title="Set follow-up promise date">
                        <input type="date" value="${escapeHtml(currentFollowup)}" data-doc="${escapeHtml(ruleName)}" class="missing-followup-input text-xs py-1 px-2 border border-slate-200 rounded font-mono text-slate-600 w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                      </div>

                      <button type="button" data-doc="${escapeHtml(ruleName)}" class="btn-missing-import-file bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded inline-flex items-center space-x-1 shadow-xs transition cursor-pointer" title="Import external file for ${escapeHtml(ruleName)}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                        <span>Import</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- RIGHT COLUMN: Present Documents in Folder (${presentCount} Verified / Ready) -->
          <div class="flex flex-col bg-slate-50/60 border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <!-- Column Header -->
            <div class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 class="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">Present Documents in Folder</h3>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ${presentCount} Verified / Ready
              </span>
            </div>

            <!-- Scrollable Present Documents List -->
            <div class="p-3.5 space-y-2.5 overflow-y-auto custom-pan-scroll" style="max-height: 440px;">
              ${presentDocs.length === 0 ? `
                <div class="p-6 text-center text-slate-500 bg-white rounded-lg border border-slate-200 font-medium text-xs">
                  No verified documents found in this folder yet. Use [Import] on the left to add missing files.
                </div>
              ` : presentDocs.map((doc, idx) => {
                const docName = doc.docType || doc.name || 'Document';
                const sizeStr = formatBytes(doc.size);
                const isCombined = doc.isCombined || false;
                const fileType = (doc.ext || (doc.name ? doc.name.split('.').pop() : 'PDF')).toUpperCase().replace('.', '');
                const dateStr = formatFileDate(doc.dateCreated || doc.ctime || doc.birthtime || doc.dateModified || doc.lastModified);
                const isImg = fileType === 'JPG' || fileType === 'JPEG' || fileType === 'PNG';

                return `
                  <div class="bg-white border border-emerald-200/90 border-l-[3.5px] border-l-emerald-500 rounded-lg p-3 shadow-xs hover:border-emerald-300 transition flex items-center justify-between gap-3">
                    <div class="min-w-0 space-y-1">
                      <div class="flex items-center space-x-2">
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <h4 class="font-heading font-bold text-xs sm:text-sm text-slate-900 tracking-tight truncate" title="${escapeHtml(docName)}">${escapeHtml(docName)}</h4>
                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0">Verified</span>
                      </div>
                      <div class="flex items-center space-x-2 text-[11px] text-slate-500 pl-7">
                        <span class="${isImg ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'} font-bold text-[9px] px-1 py-0.2 rounded">${escapeHtml(fileType)}</span>
                        <span class="font-semibold text-slate-700">${escapeHtml(sizeStr)}</span>
                        <span>•</span>
                        <span>Created: ${escapeHtml(dateStr)}</span>
                        ${isCombined ? `<span class="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold">via Combined</span>` : ''}
                      </div>
                    </div>

                    <!-- Eye Icon Quick Inspect Button (Choice 3-C) -->
                    <button type="button" data-doc-idx="${idx}" class="btn-present-view-inspect p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer active:scale-95" title="View / Inspect Document (${escapeHtml(docName)})">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                      </svg>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        <!-- END: 2-COLUMN SIDE-BY-SIDE BENTO LAYOUT -->
      </main>
      <!-- END: ModalBodyContent -->

      <!-- BEGIN: ModalFooter -->
      <footer class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end sticky bottom-0 z-20 shrink-0">
        <!-- Action Button -->
        <div>
          <button id="btnMissingModalDone" type="button" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer active:scale-95" title="Close and return to Bulk Renamer (Esc)">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
            </svg>
            <span>Back to Renamer</span>
            <kbd class="ml-1.5 px-1.5 py-0.5 bg-blue-700 text-blue-100 rounded text-[10px] font-mono font-normal">Esc</kbd>
          </button>
        </div>
      </footer>
      <!-- END: ModalFooter -->
    `;

    // 1. Modal Footer Close
    const btnDone = this.contentEl.querySelector('#btnMissingModalDone');
    if (btnDone) {
      btnDone.onclick = () => this.close();
    }

    // 2. Bento PRESET Dropdown Wiring
    const modalPresetCard = this.contentEl.querySelector('#modalPresetCard');
    const modalPresetMenu = this.contentEl.querySelector('#modalPresetMenu');
    const modalPresetChevron = this.contentEl.querySelector('#modalPresetChevron');

    if (modalPresetCard && modalPresetMenu) {
      modalPresetCard.onclick = (e) => {
        e.stopPropagation();
        const isHidden = modalPresetMenu.classList.contains('hidden');
        if (isHidden) {
          modalPresetMenu.classList.remove('hidden');
          if (modalPresetChevron) modalPresetChevron.classList.add('rotate-180');
        } else {
          modalPresetMenu.classList.add('hidden');
          if (modalPresetChevron) modalPresetChevron.classList.remove('rotate-180');
        }
      };

      const presetItems = modalPresetMenu.querySelectorAll('.modal-preset-item');
      presetItems.forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const targetPreset = item.getAttribute('data-preset');
          modalPresetMenu.classList.add('hidden');
          if (modalPresetChevron) modalPresetChevron.classList.remove('rotate-180');
          if (targetPreset && targetPreset !== activePreset) {
            this.onPresetChange(targetPreset);
          }
        };
      });

      const handleOutsideModalClick = (e) => {
        if (!modalPresetCard.contains(e.target)) {
          modalPresetMenu.classList.add('hidden');
          if (modalPresetChevron) modalPresetChevron.classList.remove('rotate-180');
        }
      };
      document.addEventListener('click', handleOutsideModalClick, { once: true });
    }

    // 3. Inline Student / Folder Name Edit Listeners
    const btnEditFolder = this.contentEl.querySelector('#btnMissingEditFolder');
    const displayWrap = this.contentEl.querySelector('#missingStudentDisplayWrap');
    const editWrap = this.contentEl.querySelector('#missingStudentEditWrap');
    const inputEditStudent = this.contentEl.querySelector('#inputMissingEditStudent');
    const btnApplyStudent = this.contentEl.querySelector('#btnMissingApplyStudent');
    const btnCancelStudent = this.contentEl.querySelector('#btnMissingCancelStudent');

    if (btnEditFolder && displayWrap && editWrap && inputEditStudent) {
      btnEditFolder.onclick = () => {
        displayWrap.classList.add('hidden');
        editWrap.classList.remove('hidden');
        inputEditStudent.focus();
        inputEditStudent.select();
      };

      const handleApply = () => {
        const newName = inputEditStudent.value.trim();
        editWrap.classList.add('hidden');
        displayWrap.classList.remove('hidden');
        if (newName && newName !== studentName) {
          this.onRenameFolder(newName);
        }
      };

      if (btnApplyStudent) {
        btnApplyStudent.onclick = handleApply;
      }

      if (btnCancelStudent) {
        btnCancelStudent.onclick = () => {
          inputEditStudent.value = studentName;
          editWrap.classList.add('hidden');
          displayWrap.classList.remove('hidden');
        };
      }

      inputEditStudent.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApply();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          inputEditStudent.value = studentName;
          editWrap.classList.add('hidden');
          displayWrap.classList.remove('hidden');
        }
      };
    }

    // 4. Follow-up Date Pickers
    const followupInputs = this.contentEl.querySelectorAll('.missing-followup-input');
    followupInputs.forEach((input) => {
      input.onchange = (e) => {
        const docName = e.target.getAttribute('data-doc');
        const dateVal = e.target.value;
        this.onSetFollowup({ docName, date: dateVal });
      };
    });

    // 5. Import Buttons
    const importButtons = this.contentEl.querySelectorAll('.btn-missing-import-file');
    importButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const docName = btn.getAttribute('data-doc');
        this.onImportFile(docName);
      };
    });

    // 6. View / Inspect Eye Buttons (Choice 3-C: In-Modal Quick Preview)
    const viewButtons = this.contentEl.querySelectorAll('.btn-present-view-inspect');
    viewButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-doc-idx'), 10);
        const doc = presentDocs[idx];
        if (doc) {
          this.showQuickPreview(doc);
        }
      };
    });
  }
}
