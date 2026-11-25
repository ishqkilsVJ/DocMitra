/**
 * tools/rename_tool/missing_documents_modal.js
 * DocMitra Suite — Isolated Missing Documents & Follow-up Desk Modal
 * Extracted and adapted from Stitch design specification.
 * Fully encapsulated ES Module component.
 */

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

// Helper: Determine expected file type and target buffer (PDF for certificates, JPG for photo/signature)
function getExpectedFileSpec(ruleName, rule) {
  let ext = 'PDF';
  if (rule && rule.ext) {
    ext = rule.ext.toUpperCase().replace('.', '');
  } else if (rule && rule.format) {
    ext = rule.format.toUpperCase().replace('.', '');
  } else {
    const upper = (typeof ruleName === 'string' ? ruleName : (ruleName.name || '')).toUpperCase();
    if (upper.includes('PHOTO') || upper.includes('PHOTOGRAPH') || upper.includes('SIGNATURE') || upper.includes('SIGN') || upper.includes('THUMB') || upper.includes('PIC')) {
      ext = 'JPG';
    }
  }

  const isJpg = ext === 'JPG' || ext === 'JPEG';
  const targetBuffer = isJpg ? 'Target ≤ 100 KB' : 'Target ≤ 256 KB';
  return { ext, isJpg, targetBuffer };
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
    return '24-11-2026';
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
    this.onClose = options.onClose || (() => {});

    this.modalEl = null;
    this.contentEl = null;
    this.isOpen = false;
    this.currentProps = null;

    this._handleKeydown = this._handleKeydown.bind(this);
  }

  mount() {
    if (this.modalEl) return;

    const el = document.createElement('div');
    el.id = 'modalMissingDocumentsDesk';
    el.className = 'rename-tool-scope fixed inset-0 z-[1050] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 hidden select-none animate-in fade-in duration-150';
    el.innerHTML = `
      <div class="w-full max-w-4xl max-h-[92vh] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden my-auto">
        <div id="missingModalContent" class="flex flex-col h-full overflow-hidden"></div>
      </div>
    `;

    this.container.appendChild(el);
    this.modalEl = el;
    this.contentEl = el.querySelector('#missingModalContent');

    // Backdrop click dismisses modal
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
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
    }
    document.removeEventListener('keydown', this._handleKeydown);
    this.onClose();
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
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

    // SVG dasharray (circumference = 100 for r=15.9155)
    const strokeDash = `${percent}, 100`;

    this.contentEl.innerHTML = `
      <!-- 1. TOP HEADER WITH HIGH-CONTRAST ADMINISTRATIVE THEME (REQUIREMENT 6 & 4) -->
      <header class="px-5 py-3.5 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
            <span class="material-symbols-outlined text-[24px]">checklist_rtl</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-headline-md text-[17px] text-on-surface tracking-tight font-bold">Missing Documents &amp; Follow-up Desk</h1>
            </div>
            <p class="font-label-sm text-[11px] text-secondary mt-0.5">Maharashtra Admission &amp; Verification Workflow • 100% Offline Localhost</p>
          </div>
        </div>

        <!-- Bento PRESET Dropdown & Esc Close Button -->
        <div class="flex items-center gap-2.5">
          <div class="group relative flex items-center bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/80 rounded-xl px-3 py-1.5 shadow-2xs hover:shadow-[0_0_15px_rgba(0,55,176,0.18)] transition-all duration-200 cursor-pointer">
            <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_rgba(0,55,176,0.4)] mr-1.5"></span>
            <span class="font-mono-code text-[10px] text-secondary group-hover:text-primary uppercase font-bold tracking-wider mr-2">PRESET:</span>
            <select id="missingModalSchemeSelect" class="bg-transparent font-mono-code text-[12px] font-bold text-on-surface focus:outline-none cursor-pointer pr-1">
              ${presetsList.map(p => `
                <option value="${escapeHtml(p)}" class="bg-surface-container text-on-surface" ${p === activePreset ? 'selected' : ''}>${escapeHtml(p)}</option>
              `).join('')}
            </select>
          </div>
          <button id="btnMissingModalClose" type="button" class="px-3 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-rose-50 hover:text-rose-600 text-secondary font-mono-code text-[11px] font-bold transition-all flex items-center gap-1.5 border border-outline-variant/60 hover:border-rose-300 shadow-2xs cursor-pointer active:scale-95" title="Return to Main Dashboard (Esc)">
            <span>Esc Close</span>
            <span class="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      </header>

      <!-- 2. MAIN WORKSTATION SCROLL BODY -->
      <div class="p-4 md:p-5 space-y-4 md:space-y-5 flex-1 overflow-y-auto custom-pan-scroll">

        <!-- 2.1 APPLICATION READINESS STATUS SUMMARY CARD (WITH INLINE FOLDER/STUDENT EDIT - REQUIREMENT 5) -->
        <div class="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 shadow-xs">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <!-- Circular Ring Gauge + Student Name & Status -->
            <div class="flex items-center gap-4">
              <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <!-- Background Track -->
                  <path class="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.8"></path>
                  <!-- Completed / Green Progress Track -->
                  <path class="text-emerald-500 transition-all duration-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="${strokeDash}" stroke-linecap="round" stroke-width="3.8"></path>
                </svg>
                <div class="absolute flex flex-col items-center justify-center text-center leading-none">
                  <span class="font-headline-sm text-[14px] font-bold text-on-surface">${percent}%</span>
                  <span class="font-mono-code text-[8px] uppercase tracking-wider text-secondary mt-0.5">Ready</span>
                </div>
              </div>

              <div class="flex flex-col gap-0.5">
                <span class="font-label-sm text-[10px] text-secondary uppercase tracking-wider font-semibold">Application Readiness Status</span>
                
                <!-- Display Mode for Student Name + Edit Pencil Button -->
                <div class="flex items-center gap-2 mt-0.5" id="missingStudentDisplayWrap">
                  <span class="font-label-sm text-[10px] text-secondary uppercase tracking-wider font-semibold">Student Name:</span>
                  <span id="missingStudentNameDisplay" class="px-2.5 py-0.5 rounded-md bg-surface-container-lowest text-primary font-headline-sm text-[13px] font-bold tracking-wide border border-outline-variant/30">
                    ${escapeHtml(studentName)}
                  </span>
                  <button id="btnMissingEditFolder" type="button" class="p-1 rounded-md bg-surface-container hover:bg-surface-container-high text-secondary hover:text-primary transition-colors border border-outline-variant/40 cursor-pointer shadow-2xs flex items-center justify-center" title="Edit Student / Folder Name">
                    <span class="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                </div>

                <!-- Inline Edit Form (Hidden by default) -->
                <div class="flex items-center gap-1.5 mt-0.5 hidden" id="missingStudentEditWrap">
                  <span class="font-label-sm text-[10px] text-secondary uppercase tracking-wider font-semibold">Student:</span>
                  <input id="inputMissingEditStudent" type="text" value="${escapeHtml(studentName)}" class="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface font-headline-sm text-[12px] font-bold border border-primary focus:outline-none w-52 md:w-64 shadow-2xs">
                  <button id="btnMissingApplyStudent" type="button" class="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-mono-code text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95">
                    <span class="material-symbols-outlined text-[13px]">check</span>
                    <span>Apply</span>
                  </button>
                  <button id="btnMissingCancelStudent" type="button" class="px-2 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-secondary font-mono-code text-[11px] font-medium cursor-pointer" title="Cancel">
                    <span>✕</span>
                  </button>
                </div>

                <div class="flex items-center gap-2 mt-1">
                  <span class="font-headline-md text-[15px] font-bold text-on-surface">${presentCount} of ${totalCount} Documents Staged</span>
                  <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono-code text-[11px] font-bold">${percent}% Verified</span>
                </div>
                <span class="font-label-sm text-[11px] text-secondary">Maharashtra admission compliance threshold met for all verified documents.</span>
              </div>
            </div>

            <!-- Metrics Pill Breakdown -->
            <div class="flex items-center gap-3 shrink-0">
              <!-- Green Completed -->
              <div class="bg-surface-container-lowest border border-emerald-300 rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <span class="font-label-sm text-[10px] text-secondary uppercase font-semibold block">Completed</span>
                  <span class="font-mono-code text-[13px] font-bold text-emerald-800">${presentCount} Documents</span>
                </div>
              </div>

              <!-- Red/Amber Missing -->
              <div class="bg-surface-container-lowest border border-error-container rounded-xl px-3.5 py-2 shadow-2xs flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-error-container text-error flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
                <div>
                  <span class="font-label-sm text-[10px] text-secondary uppercase font-semibold block">Pending / Missing</span>
                  <span class="font-mono-code text-[13px] font-bold text-error">${missingCount} Documents</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2.2 MISSING DOCUMENTS LIST (2-COLUMN CARDS MATCHING PRESENT DOCUMENTS - REQUIREMENT 2) -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="font-headline-sm text-[15px] text-on-surface font-bold">Missing Documents</span>
              <span class="px-2.5 py-0.5 rounded-full ${missingCount > 0 ? 'bg-error text-white' : 'bg-emerald-600 text-white'} font-mono-code text-[11px] font-bold shadow-2xs">
                ${missingCount > 0 ? `${missingCount} Required` : '0 Missing'}
              </span>
            </div>
            <span class="font-mono-code text-[11px] text-secondary">Target Buffer: ≤ 256 KB (MahaDBT Strict)</span>
          </div>

          ${missingCount === 0 ? `
            <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 font-mono-code text-[12px] font-bold">
              <span class="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>All ${totalCount} required documents staged! Application is 100% verified.</span>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-pan-scroll pr-1">
              ${missingRules.map((rule) => {
                const ruleName = typeof rule === 'string' ? rule : (rule.name || '');
                const ruleTag = rule.tag || rule.code || '';
                const currentFollowup = followupMap[ruleName] || '';
                const spec = getExpectedFileSpec(ruleName, rule);

                return `
                  <div class="p-2.5 rounded-lg bg-surface-container-lowest border border-rose-200/90 shadow-xs flex flex-col justify-between gap-1.5 hover:border-rose-400 transition-colors">
                    <!-- Top Row: Icon + Title + Shortcode Chip & Red Missing Badge (Design 1 Strict Mirror) -->
                    <div class="flex items-center justify-between gap-2 min-w-0">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="material-symbols-outlined text-rose-600 text-[16px] shrink-0 font-bold">error_outline</span>
                        <span class="font-headline-sm text-[12px] font-bold text-on-surface truncate" title="${escapeHtml(ruleName)}">${escapeHtml(ruleName)}</span>
                        ${ruleTag ? `<span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-mono-code text-[9px] font-bold uppercase shrink-0">${escapeHtml(ruleTag)}</span>` : ''}
                      </div>
                      <span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-mono-code text-[9px] font-bold shrink-0">Missing</span>
                    </div>

                    <!-- Bottom Row: Specific File Format (PDF or JPG) + Target Buffer on Left; Follow-up Date + Royal Blue Import on Right -->
                    <div class="flex items-center justify-between gap-1 text-[10px] font-mono-code text-secondary pl-5">
                      <div class="flex items-center gap-2">
                        <!-- File Type Badge (Specific PDF or JPG) -->
                        <span class="px-1.5 py-0.2 rounded ${spec.isJpg ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'} font-bold uppercase text-[9px]">
                          ${escapeHtml(spec.ext)}
                        </span>
                        <!-- Target Buffer -->
                        <span class="text-secondary text-[9px] font-medium">${escapeHtml(spec.targetBuffer)}</span>
                      </div>

                      <!-- Compact Follow-up Date + Royal Blue Import Button -->
                      <div class="flex items-center gap-1.5 shrink-0">
                        <div class="flex items-center gap-1 bg-surface-container-low border border-outline-variant/40 rounded px-1.5 py-0.5 shadow-2xs" title="Set follow-up promise date">
                          <span class="material-symbols-outlined text-secondary text-[13px]">calendar_today</span>
                          <input type="date" value="${escapeHtml(currentFollowup)}" data-doc="${escapeHtml(ruleName)}" class="missing-followup-input bg-transparent text-on-surface font-mono-code text-[9px] font-bold focus:outline-none cursor-pointer w-[92px]">
                        </div>

                        <button type="button" data-doc="${escapeHtml(ruleName)}" class="btn-missing-import-file px-2.5 py-0.5 rounded bg-primary hover:bg-primary/90 text-white font-mono-code text-[10px] font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0" title="Import external file into student folder">
                          <span class="material-symbols-outlined text-[13px]">download</span>
                          <span>Import</span>
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- 2.3 PRESENT / VERIFIED DOCUMENTS SECTION (TRUE CREATED DATE - REQUIREMENT 3) -->
        <div class="space-y-2 pt-1">
          <details class="group" open>
            <summary class="flex items-center justify-between cursor-pointer py-2 select-none list-none bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 shadow-2xs hover:bg-surface-container-low transition-colors">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span class="font-headline-sm text-[14px] text-on-surface font-bold">Present Documents in Folder (${presentCount} Verified)</span>
                <span class="text-secondary text-[11px] font-medium">• All auto-matched</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono-code text-[10px] font-bold">${presentCount} READY</span>
                <span class="material-symbols-outlined text-secondary group-open:rotate-180 transition-transform text-[18px]">expand_more</span>
              </div>
            </summary>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-[220px] overflow-y-auto custom-pan-scroll pr-1">
              ${presentDocs.length === 0 ? `
                <div class="col-span-2 p-3 text-center text-secondary font-mono-code text-[11px]">No verified documents loaded in this folder yet.</div>
              ` : presentDocs.map((doc) => {
                const docName = doc.docType || doc.name || 'Document';
                const sizeStr = formatBytes(doc.size);
                const isCombined = doc.isCombined || false;
                const fileType = (doc.ext || (doc.name ? doc.name.split('.').pop() : 'PDF')).toUpperCase().replace('.', '');
                // True NTFS Creation Date (birthtime) with fallback to modified time
                const dateStr = formatFileDate(doc.dateCreated || doc.ctime || doc.birthtime || doc.dateModified || doc.lastModified);

                return `
                  <div class="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5">
                    <div class="flex items-center justify-between gap-2 min-w-0">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span class="material-symbols-outlined text-emerald-600 text-[16px] shrink-0">task_alt</span>
                        <span class="font-label-md text-[12px] font-semibold text-on-surface break-words" title="${escapeHtml(docName)}">${escapeHtml(docName)}</span>
                      </div>
                      <span class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-mono-code text-[9px] font-bold shrink-0">Verified</span>
                    </div>

                    <!-- Metadata Row: True Created Date (DD-MM-YYYY), Size, File Type Badge -->
                    <div class="flex items-center justify-between gap-1 text-[10px] font-mono-code text-secondary pl-5">
                      <div class="flex items-center gap-2">
                        <!-- File Type Badge -->
                        <span class="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold uppercase text-[9px]">
                          ${escapeHtml(fileType)}
                        </span>
                        <!-- File Size -->
                        <span>${escapeHtml(sizeStr)}</span>
                        ${isCombined ? `<span class="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[9px] font-bold">via Combined</span>` : ''}
                      </div>

                      <!-- True Created Date (DD-MM-YYYY) -->
                      <div class="flex items-center gap-1 text-on-surface-variant font-medium" title="True File Creation Date (NTFS Birthtime)">
                        <span class="material-symbols-outlined text-[13px] text-secondary">date_range</span>
                        <span>Created: ${escapeHtml(dateStr)}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </details>
        </div>
      </div>

      <!-- 3. MODAL / DESK FOOTER -->
      <footer class="px-5 py-3 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between gap-3 rounded-b-2xl shrink-0">
        <div class="flex items-center gap-2 text-on-surface-variant max-w-xl">
          <span class="material-symbols-outlined text-primary text-[18px] shrink-0">info</span>
          <span class="font-label-sm text-[11px] leading-tight text-secondary">
            Imported files automatically move to the active folder, rename to canonical MahaDBT format, and re-scan admission queue.
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button id="btnMissingModalDone" type="button" class="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-headline-sm text-[12px] font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95" title="Close and return to Bulk Renamer (Esc)">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Renamer</span>
            <kbd class="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono-code font-bold">Esc</kbd>
          </button>
        </div>
      </footer>
    `;

    // Bind event listeners
    const btnClose = this.contentEl.querySelector('#btnMissingModalClose');
    if (btnClose) {
      btnClose.onclick = () => this.close();
    }

    const btnDone = this.contentEl.querySelector('#btnMissingModalDone');
    if (btnDone) {
      btnDone.onclick = () => this.close();
    }

    const selectScheme = this.contentEl.querySelector('#missingModalSchemeSelect');
    if (selectScheme) {
      selectScheme.onchange = (e) => {
        this.onPresetChange(e.target.value);
      };
    }

    // Inline Student / Folder Name Edit Listeners
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

    // Follow-up date inputs
    const followupInputs = this.contentEl.querySelectorAll('.missing-followup-input');
    followupInputs.forEach((input) => {
      input.onchange = (e) => {
        const docName = e.target.getAttribute('data-doc');
        const dateVal = e.target.value;
        this.onSetFollowup({ docName, date: dateVal });
      };
    });

    // Import buttons
    const importButtons = this.contentEl.querySelectorAll('.btn-missing-import-file');
    importButtons.forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const docName = btn.getAttribute('data-doc');
        this.onImportFile(docName);
      };
    });
  }
}
