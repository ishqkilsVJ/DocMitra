/* ==========================================================================
   ClerkMaster — Document Print Studio (क्रमिक प्रिंट स्टुडिओ)
   1-Page Portrait Sequence, Multi-Preset Engine, Duplex & Smart Hybrid Printing
   ========================================================================== */

import { DEFAULT_PRINT_PRESETS } from '../core/constants.js';
import { evaluateMatch } from '../libraries/document-matcher.js';
import { showToast } from '../ui/ui-library.js';

// Print Studio State
let printDocs = [];
let dragSrcIndex = null;
let filterMode = 'strict'; // 'strict' | 'free'
let activePresetKey = 'MAHA DBT FORM';
let presets = { ...DEFAULT_PRINT_PRESETS };

let printSettings = {
  sets: 1,
  duplexMode: 'hybrid', // 'single' | 'duplex' | 'hybrid'
  flipOrientation: 'long', // 'long' | 'short'
  reverseOrder: false,
  colorMode: 'grayscale', // 'grayscale' | 'color'
  showBanner: false,
  studentName: ''
};

const STORAGE_KEY = 'clerkmaster_print_presets';

/* ==========================================================================
   Pure Logic & Helper Functions (Headless & Unit-Testable)
   ========================================================================== */

/**
 * Identifies the canonical document type using ClerkMaster's intelligent matcher
 */
export function identifyDocType(filenameOrLabel) {
  if (!filenameOrLabel || typeof filenameOrLabel !== 'string') return '';
  const match = evaluateMatch(filenameOrLabel);
  if (match && match.docType) {
    return match.docType;
  }
  // Strip extensions, page annotations and clean up
  let clean = filenameOrLabel.replace(/\.[^/.]+$/, '');
  clean = clean.replace(/\s*\(p\.\d+\)/i, '');
  return clean.trim().toUpperCase();
}

/**
 * Extracts student name from filename if prefixed with document type
 * e.g., "10TH MARKSHEET GAVIT AMISHA KASHIRAM.pdf" -> "GAVIT AMISHA KASHIRAM"
 */
export function extractStudentName(filenameOrFolder) {
  if (!filenameOrFolder || typeof filenameOrFolder !== 'string') return '';
  let clean = filenameOrFolder.replace(/\.[^/.]+$/, '').trim();
  const match = evaluateMatch(clean);
  if (match && match.docType) {
    // Remove docType or pattern from string
    const docType = match.docType;
    let stripped = clean;
    const docRegex = new RegExp(`^${docType}\\b`, 'i');
    if (docRegex.test(stripped)) {
      stripped = stripped.replace(docRegex, '').trim();
    } else {
      // Try with words
      const words = docType.split(/\s+/);
      words.forEach(w => {
        if (w.length > 2) {
          const r = new RegExp(`\\b${w}\\b`, 'gi');
          stripped = stripped.replace(r, '').trim();
        }
      });
    }
    // Clean leading/trailing hyphens, underscores, dots
    stripped = stripped.replace(/^[-_.\s]+|[-_.\s]+$/g, '').trim();
    if (stripped.length >= 3) {
      return stripped;
    }
  }
  return clean;
}

/**
 * Sorts document cards strictly by the preset sequence rules
 */
export function sortDocsByPreset(docs, presetRules = []) {
  if (!Array.isArray(docs) || docs.length === 0) return [];
  if (!Array.isArray(presetRules) || presetRules.length === 0) return [...docs];

  return [...docs].sort((a, b) => {
    const docTypeA = a.docType || identifyDocType(a.label || a.name);
    const docTypeB = b.docType || identifyDocType(b.label || b.name);

    let indexA = presetRules.findIndex(rule => {
      const r = rule.toUpperCase();
      const t = docTypeA.toUpperCase();
      return r === t || t.includes(r) || r.includes(t);
    });

    let indexB = presetRules.findIndex(rule => {
      const r = rule.toUpperCase();
      const t = docTypeB.toUpperCase();
      return r === t || t.includes(r) || r.includes(t);
    });

    if (indexA === -1) indexA = 9999;
    if (indexB === -1) indexB = 9999;

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    // Secondary sort: preserve multi-page order (p.1, p.2, etc.)
    return (a.pageNumber || 1) - (b.pageNumber || 1);
  });
}

/**
 * Prepares the final printable page sequence considering:
 * - Sets count (1..N)
 * - Reverse order (N..1)
 * - Duplex / Simplex / Smart Hybrid blank filler page padding
 * - Page 1 header banner
 */
export function buildPrintPagesList(docs, options = {}) {
  const {
    sets = 1,
    duplexMode = 'hybrid', // 'single' | 'duplex' | 'hybrid'
    reverseOrder = false,
    showBanner = false,
    studentName = ''
  } = options;

  if (!Array.isArray(docs) || docs.length === 0) return [];

  let baseList = [...docs];
  if (reverseOrder) {
    baseList.reverse();
  }

  const finalPages = [];
  const safeSets = Math.max(1, parseInt(sets, 10) || 1);

  for (let s = 1; s <= safeSets; s++) {
    const setPages = [];

    if (duplexMode === 'single') {
      // 1-to-1: Single-sided printing
      baseList.forEach((doc, idx) => {
        setPages.push({
          ...doc,
          setNumber: s,
          isFiller: false,
          showBannerOnPage: (s === 1 && idx === 0 && showBanner && Boolean(studentName))
        });
      });
    } else if (duplexMode === 'duplex') {
      // All Double-Sided: pad odd set total with 1 blank filler so next set starts on front
      baseList.forEach((doc, idx) => {
        setPages.push({
          ...doc,
          setNumber: s,
          isFiller: false,
          showBannerOnPage: (s === 1 && idx === 0 && showBanner && Boolean(studentName))
        });
      });
      if (setPages.length % 2 !== 0) {
        setPages.push({
          id: `filler_set_${s}`,
          label: 'Blank Page (Duplex Pad)',
          name: 'BLANK_PAGE',
          src: '',
          isFiller: true,
          setNumber: s
        });
      }
    } else if (duplexMode === 'hybrid') {
      // Smart Hybrid:
      // Single-page certificates get a blank filler behind them so they print on separate physical sheets!
      // Multi-page booklets print front-and-back duplex, padded with filler only if odd pages!
      const groups = [];
      let currentGroup = [];
      let lastSource = null;

      baseList.forEach(doc => {
        const sourceKey = doc.sourceFileId || doc.name.replace(/\s*\(p\.\d+\)/i, '');
        if (lastSource && lastSource !== sourceKey) {
          groups.push(currentGroup);
          currentGroup = [doc];
        } else {
          currentGroup.push(doc);
        }
        lastSource = sourceKey;
      });
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }

      groups.forEach((grp, grpIdx) => {
        grp.forEach((pageDoc) => {
          setPages.push({
            ...pageDoc,
            setNumber: s,
            isFiller: false,
            showBannerOnPage: (s === 1 && setPages.length === 0 && showBanner && Boolean(studentName))
          });
        });

        // If single page or odd multi-page, add 1 filler back page
        if (grp.length % 2 !== 0) {
          setPages.push({
            id: `hybrid_filler_${s}_${grpIdx}`,
            label: 'Blank Page (Separate Sheet)',
            name: 'BLANK_PAGE',
            src: '',
            isFiller: true,
            setNumber: s
          });
        }
      });
    }

    finalPages.push(...setPages);
  }

  return finalPages;
}

/* ==========================================================================
   Presets Storage & Management
   ========================================================================== */

function loadPresetsFromStorage() {
  presets = { ...DEFAULT_PRINT_PRESETS };
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          presets = { ...DEFAULT_PRINT_PRESETS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not read presets from localStorage:', e);
    }
  }
}

function savePresetsToStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.warn('Could not save presets to localStorage:', e);
    }
  }
}

export function getPrintPresets() {
  return presets;
}

export function getPrintDocs() {
  return printDocs;
}

export function setPrintDocs(docs) {
  printDocs = Array.isArray(docs) ? docs : [];
}

export function getPrintSettings() {
  return printSettings;
}

/* ==========================================================================
   UI Rendering & Card Interactions
   ========================================================================== */

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

export function renderPresetDropdown() {
  const select = document.getElementById('printPresetSelect');
  if (!select) return;

  select.innerHTML = '';
  const keys = Object.keys(presets);
  keys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    if (k === activePresetKey) opt.selected = true;
    select.appendChild(opt);
  });

  renderPresetBadges();
}

export function renderPresetBadges() {
  const container = document.getElementById('printPresetBadgesBar');
  if (!container) return;

  const currentRules = presets[activePresetKey] || [];
  if (currentRules.length === 0) {
    container.innerHTML = '<span style="color: var(--muted); font-size: 11px;">(कोणतेही नियम परिभाषित नाहीत)</span>';
    return;
  }

  let html = `<strong style="color: var(--primary); font-size: 11.5px;">${escapeHtml(activePresetKey)} क्रम:</strong> `;
  html += currentRules.map((rule, idx) => `
    <span style="background: var(--surface-subtle); border: 1px solid var(--line); color: var(--ink); font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;">
      ${idx + 1}. ${escapeHtml(rule)}
    </span>
  `).join(' <span style="color: var(--muted); font-size: 10px;">➔</span> ');

  container.innerHTML = html;
}

export function renderPrintDocs() {
  const grid = document.getElementById('printCardsGrid');
  const emptyState = document.getElementById('printEmptyState');
  const badge = document.getElementById('printDocCountBadge');

  if (!grid) return;

  if (printDocs.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    grid.innerHTML = '';
    if (badge) badge.textContent = '0 कागदपत्रे';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (badge) badge.textContent = `${printDocs.length} कागदपत्रे`;

  grid.innerHTML = '';

  printDocs.forEach((doc, index) => {
    const card = document.createElement('div');
    card.className = 'printDocCard';
    card.draggable = true;
    card.dataset.index = index;

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px; background: var(--surface-subtle); padding: 4px 6px; border-radius: 6px; border: 1px solid var(--line-subtle);">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="cursor: grab; color: var(--muted); font-size: 11px;">⋮⋮</span>
          <span style="background: var(--primary); color: #fff; font-weight: 800; font-size: 10px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${index + 1}
          </span>
        </div>
        <input type="text" value="${escapeHtml(doc.label)}" class="printCardLabelInput" data-index="${index}" style="font-size: 11px; font-weight: 700; color: var(--ink); background: transparent; border: none; border-bottom: 1px dashed var(--line); text-align: center; width: 100%; outline: none;" title="${escapeHtml(doc.label)}">
        <div style="display: flex; align-items: center; gap: 2px;">
          <button type="button" class="btnRotateCard" data-index="${index}" style="background: transparent; border: none; cursor: pointer; color: var(--muted); font-size: 11px; padding: 2px 4px;" title="90° फिरवा">↻</button>
          <button type="button" class="btnMoveCardLeft" data-index="${index}" style="background: transparent; border: none; cursor: pointer; color: var(--muted); font-size: 11px; padding: 2px 4px; ${index === 0 ? 'opacity: 0.3; pointer-events: none;' : ''}" title="मागे सरकवा">◀</button>
          <button type="button" class="btnMoveCardRight" data-index="${index}" style="background: transparent; border: none; cursor: pointer; color: var(--muted); font-size: 11px; padding: 2px 4px; ${index === printDocs.length - 1 ? 'opacity: 0.3; pointer-events: none;' : ''}" title="पुढे सरकवा">▶</button>
          <button type="button" class="btnDeleteCard" data-index="${index}" style="background: transparent; border: none; cursor: pointer; color: var(--red); font-size: 11px; padding: 2px 4px;" title="काढून टाका">✕</button>
        </div>
      </div>

      <div style="flex: 1; min-height: 140px; display: flex; align-items: center; justify-content: center; background: #fafafa; border: 1px solid var(--line-subtle); border-radius: 6px; overflow: hidden; padding: 4px;">
        <img src="${doc.src}" style="max-height: 130px; max-width: 100%; object-fit: contain; transform: rotate(${doc.rotation}deg); transition: transform 0.2s;" alt="${escapeHtml(doc.name)}" />
      </div>

      <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: var(--muted);">
        <span style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(doc.name)}">
          ${escapeHtml(doc.name)}
        </span>
        <span style="background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); font-weight: 700; padding: 1px 4px; border-radius: 4px; font-size: 9.5px;">
          ${escapeHtml(doc.docType || 'DOC')}
        </span>
      </div>
    `;

    // Card Drag and Drop Listeners
    card.addEventListener('dragstart', (e) => {
      dragSrcIndex = index;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragSrcIndex = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSrcIndex !== null && dragSrcIndex !== index) {
        const movedItem = printDocs.splice(dragSrcIndex, 1)[0];
        printDocs.splice(index, 0, movedItem);
        renderPrintDocs();
      }
    });

    grid.appendChild(card);
  });

  // Attach card event listeners
  grid.querySelectorAll('.printCardLabelInput').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      if (printDocs[idx]) {
        printDocs[idx].label = e.target.value.trim() || printDocs[idx].label;
      }
    });
  });

  grid.querySelectorAll('.btnRotateCard').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      rotatePrintDoc(idx);
    });
  });

  grid.querySelectorAll('.btnMoveCardLeft').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      movePrintDoc(idx, -1);
    });
  });

  grid.querySelectorAll('.btnMoveCardRight').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      movePrintDoc(idx, 1);
    });
  });

  grid.querySelectorAll('.btnDeleteCard').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      deletePrintDoc(idx);
    });
  });
}

export function rotatePrintDoc(index) {
  if (printDocs[index]) {
    printDocs[index].rotation = (printDocs[index].rotation + 90) % 360;
    renderPrintDocs();
  }
}

export function rotateAllPrintDocs() {
  if (printDocs.length === 0) return;
  printDocs.forEach(d => {
    d.rotation = (d.rotation + 90) % 360;
  });
  renderPrintDocs();
  showToast('सर्व कागदपत्रे ९० अंश फिरवली आहेत', 'info');
}

export function movePrintDoc(index, delta) {
  const newIndex = index + delta;
  if (newIndex >= 0 && newIndex < printDocs.length) {
    const item = printDocs.splice(index, 1)[0];
    printDocs.splice(newIndex, 0, item);
    renderPrintDocs();
  }
}

export function deletePrintDoc(index) {
  if (printDocs[index]) {
    printDocs.splice(index, 1);
    renderPrintDocs();
  }
}

export function clearPrintDocs() {
  if (printDocs.length === 0) return;
  if (confirm('सर्व कागदपत्रे काढून टाकायची आहेत का?')) {
    printDocs = [];
    renderPrintDocs();
    showToast('सर्व कागदपत्रे क्लियर केली', 'info');
  }
}

export function nextStudent() {
  if (printDocs.length > 0) {
    if (!confirm('नवीन विद्यार्थ्यासाठी कागदपत्रे क्लियर करायची आहेत का?')) {
      return;
    }
  }
  printDocs = [];
  const nameInput = document.getElementById('printStudentNameInput');
  if (nameInput) nameInput.value = '';
  printSettings.studentName = '';
  renderPrintDocs();
  showToast('नवीन विद्यार्थ्यासाठी वर्कस्पेस तयार आहे 👤', 'success');
}

/* ==========================================================================
   File Ingestion & Local Canvas PDF Rendering (100% Offline)
   ========================================================================== */

export async function handlePrintFiles(files) {
  if (!files || files.length === 0) return;

  const currentRules = presets[activePresetKey] || [];
  let addedCount = 0;
  let detectedStudent = '';

  for (const file of Array.from(files)) {
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
    const docType = identifyDocType(cleanFileName);

    // If student name not yet set, attempt extraction
    if (!detectedStudent) {
      const candidate = extractStudentName(cleanFileName);
      if (candidate && candidate.length > 2 && candidate.toUpperCase() !== docType.toUpperCase()) {
        detectedStudent = candidate;
      }
    }

    // STRICT FILTER MODE: Ignore files not belonging to active preset
    if (filterMode === 'strict' && currentRules.length > 0) {
      const matchesPreset = currentRules.some(rule => {
        const r = rule.toUpperCase();
        const t = docType.toUpperCase();
        return r === t || t.includes(r) || r.includes(t);
      });

      if (!matchesPreset) {
        continue; // Skip irrelevant file
      }
    }

    // Handle Image
    if (file.type.startsWith('image/')) {
      const dataUrl = await readFileAsDataUrl(file);
      printDocs.push({
        id: `pdoc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sourceFileId: file.name,
        name: file.name,
        label: cleanFileName,
        docType: docType || 'PHOTO',
        src: dataUrl,
        rotation: 0,
        pageNumber: 1,
        totalPages: 1,
        isMultiPage: false,
        originalFile: file
      });
      addedCount++;
    }
    // Handle PDF
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        const arrayBuf = await file.arrayBuffer();
        if (typeof window !== 'undefined' && window.pdfjsLib) {
          const typedarray = new Uint8Array(arrayBuf);
          const pdf = await window.pdfjsLib.getDocument(typedarray).promise;

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.8 }); // Sharp high-DPI A4
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: ctx, viewport }).promise;
            const pageDataUrl = canvas.toDataURL('image/jpeg', 0.92);

            const pageLabel = pdf.numPages > 1 ? `${cleanFileName} (p.${pageNum})` : cleanFileName;
            printDocs.push({
              id: `pdoc_${Date.now()}_${pageNum}_${Math.random().toString(36).slice(2, 6)}`,
              sourceFileId: file.name,
              name: pdf.numPages > 1 ? `${file.name} (p.${pageNum})` : file.name,
              label: pageLabel,
              docType: docType || 'PDF DOC',
              src: pageDataUrl,
              rotation: 0,
              pageNumber: pageNum,
              totalPages: pdf.numPages,
              isMultiPage: pdf.numPages > 1,
              originalFile: file
            });
            addedCount++;
          }
        }
      } catch (err) {
        console.error('PDF Read error:', err);
        showToast(`PDF वाचता आली नाही: ${file.name}`, 'error');
      }
    }
  }

  // Update student name input if found
  if (detectedStudent) {
    const nameInput = document.getElementById('printStudentNameInput');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.value = detectedStudent;
      printSettings.studentName = detectedStudent;
    }
  }

  // Auto-sort according to active preset
  if (currentRules.length > 0) {
    printDocs = sortDocsByPreset(printDocs, currentRules);
  }

  renderPrintDocs();
  if (addedCount > 0) {
    showToast(`${addedCount} कागदपत्रे जोडली व क्रमाने लावली ⚡`, 'success');
  } else if (filterMode === 'strict') {
    showToast('निवडलेल्या Preset मधील कोणतीही फाईल आढळली नाही. Free Upload मोड वापरून पहा.', 'warning');
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 1-Click Import from currently active student folder in Renamer workspace
 */
export async function importFromRenamerWorkspace(files = [], folderName = '') {
  if (!files || files.length === 0) {
    showToast('चालू विद्यार्थ्याच्या फोल्डरमध्ये कोणत्याही फाईल्स उपलब्ध नाहीत.', 'warning');
    return;
  }

  const nameInput = document.getElementById('printStudentNameInput');
  if (nameInput && folderName) {
    nameInput.value = folderName;
    printSettings.studentName = folderName;
  }

  await handlePrintFiles(files);
}

/* ==========================================================================
   Preset Actions (Apply, Save, Delete)
   ========================================================================== */

export function applyPresetSequence() {
  if (printDocs.length === 0) {
    showToast('आधी कागदपत्रे अपलोड करा!', 'warning');
    return;
  }

  const currentRules = presets[activePresetKey] || [];
  if (currentRules.length === 0) {
    showToast('निवडलेल्या Preset मध्ये नियम नाहीत.', 'warning');
    return;
  }

  printDocs = sortDocsByPreset(printDocs, currentRules);
  renderPrintDocs();
  showToast(`'${activePresetKey}' क्रम यशस्वीपणे लागू केला ⚡`, 'success');
}

export function saveCurrentAsPreset() {
  if (printDocs.length === 0) {
    showToast('नवीन Preset बनवण्यासाठी आधी काही फायली अपलोड करून क्रम लावा!', 'warning');
    return;
  }

  const name = prompt('नवीन Preset ला नाव द्या (उदा. SCHEME C / CET ADMISSION):');
  if (!name || !name.trim()) return;

  const trimmed = name.trim();
  // Extract pure document types from loaded cards
  const uniqueTypes = [];
  printDocs.forEach(d => {
    const t = d.docType || identifyDocType(d.label || d.name);
    if (t && !uniqueTypes.includes(t)) {
      uniqueTypes.push(t);
    }
  });

  if (uniqueTypes.length === 0) {
    showToast('कागदपत्रांचे प्रकार ओळखता आले नाहीत.', 'warning');
    return;
  }

  presets[trimmed] = uniqueTypes;
  activePresetKey = trimmed;
  savePresetsToStorage();
  renderPresetDropdown();
  showToast(`'${trimmed}' Preset सेव्ह झाला!`, 'success');
}

export function deleteCurrentPreset() {
  if (DEFAULT_PRINT_PRESETS[activePresetKey]) {
    alert(`'${activePresetKey}' हा मुख्य सिस्टीम Preset डिलीट करता येणार नाही.`);
    return;
  }

  if (confirm(`'${activePresetKey}' हा Custom Preset नक्की डिलीट करायचा आहे का?`)) {
    delete presets[activePresetKey];
    activePresetKey = Object.keys(presets)[0] || 'MAHA DBT FORM';
    savePresetsToStorage();
    renderPresetDropdown();
    showToast('Preset डिलीट केला.', 'info');
  }
}

/* ==========================================================================
   Print Engine Trigger & DOM Construction
   ========================================================================== */

export async function triggerPrint() {
  if (printDocs.length === 0) {
    showToast('प्रिंट करण्यासाठी आधी कागदपत्रे जोडा!', 'warning');
    return;
  }

  // Update latest settings from form inputs
  const setsSelect = document.getElementById('printSettingSets');
  const duplexSelect = document.getElementById('printSettingDuplex');
  const flipSelect = document.getElementById('printSettingFlip');
  const colorSelect = document.getElementById('printSettingColor');
  const reverseCheck = document.getElementById('printSettingReverse');
  const bannerCheck = document.getElementById('printSettingBanner');
  const nameInput = document.getElementById('printStudentNameInput');

  if (setsSelect) printSettings.sets = parseInt(setsSelect.value, 10) || 1;
  if (duplexSelect) printSettings.duplexMode = duplexSelect.value;
  if (flipSelect) printSettings.flipOrientation = flipSelect.value;
  if (colorSelect) printSettings.colorMode = colorSelect.value;
  if (reverseCheck) printSettings.reverseOrder = reverseCheck.checked;
  if (bannerCheck) printSettings.showBanner = bannerCheck.checked;
  if (nameInput) printSettings.studentName = nameInput.value.trim();

  // Generate page list
  const pages = buildPrintPagesList(printDocs, printSettings);
  if (pages.length === 0) return;

  // Build hidden printable container
  let container = document.getElementById('printStudioOutputContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'printStudioOutputContainer';
    document.body.appendChild(container);
  }

  container.innerHTML = '';
  const isGrayscale = printSettings.colorMode === 'grayscale';

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageCard = document.createElement('div');
    pageCard.className = `printPageCard ${isGrayscale ? 'printGrayscale' : ''} ${page.isFiller ? 'printBlankFiller' : ''}`;

    if (page.isFiller) {
      pageCard.innerHTML = `<div style="visibility: hidden;">BLANK PAGE FOR DUPLEX</div>`;
    } else {
      let bannerHtml = '';
      if (page.showBannerOnPage && printSettings.studentName) {
        bannerHtml = `
          <div class="printPageBanner">
            ${escapeHtml(printSettings.studentName)}
          </div>
        `;
      }

      // Check if image requires rotation
      let imageSrc = page.src;
      let transformStyle = '';
      if (page.rotation && page.rotation % 360 !== 0) {
        transformStyle = `transform: rotate(${page.rotation}deg);`;
      }

      pageCard.innerHTML = `
        ${bannerHtml}
        <img src="${imageSrc}" style="${transformStyle}" alt="${escapeHtml(page.name)}" />
      `;
    }

    container.appendChild(pageCard);
  }

  // Trigger native print
  window.print();

  // Clean up printable container after print
  window.addEventListener('afterprint', () => {
    if (container) container.innerHTML = '';
  }, { once: true });
}

/* ==========================================================================
   Module Lifecycle & Initialization
   ========================================================================== */

export function initPrintStudio() {
  if (typeof document === 'undefined') return;

  loadPresetsFromStorage();

  const dropZone = document.getElementById('printDropZone');
  const fileInput = document.getElementById('printFileInput');
  const presetSelect = document.getElementById('printPresetSelect');
  const btnStrict = document.getElementById('btnFilterStrict');
  const btnFree = document.getElementById('btnFilterFree');
  const nameInput = document.getElementById('printStudentNameInput');

  // Populate presets dropdown
  renderPresetDropdown();

  // DropZone setup
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
      dropZone.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(ev => {
      dropZone.addEventListener(ev, () => dropZone.classList.add('drag-over'));
    });

    ['dragleave', 'drop'].forEach(ev => {
      dropZone.addEventListener(ev, () => dropZone.classList.remove('drag-over'));
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files) {
        handlePrintFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target && e.target.files) {
        handlePrintFiles(e.target.files);
        fileInput.value = '';
      }
    });
  }

  // Preset Select change
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      activePresetKey = e.target.value;
      renderPresetBadges();
    });
  }

  // Filter mode toggle
  if (btnStrict && btnFree) {
    btnStrict.addEventListener('click', () => {
      filterMode = 'strict';
      btnStrict.classList.add('active');
      btnFree.classList.remove('active');
      showToast('फक्त नियमातील फायली (Auto Filter) चालू आहे ⚡', 'info');
    });

    btnFree.addEventListener('click', () => {
      filterMode = 'free';
      btnFree.classList.add('active');
      btnStrict.classList.remove('active');
      showToast('सर्व फायली (Free Upload) चालू आहे 📁', 'info');
    });
  }

  // Student Name input
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      printSettings.studentName = e.target.value.trim();
    });
  }

  // Action Buttons
  const applyPresetBtn = document.getElementById('printApplyPresetBtn');
  if (applyPresetBtn) applyPresetBtn.addEventListener('click', applyPresetSequence);

  const savePresetBtn = document.getElementById('printSavePresetBtn');
  if (savePresetBtn) savePresetBtn.addEventListener('click', saveCurrentAsPreset);

  const deletePresetBtn = document.getElementById('printDeletePresetBtn');
  if (deletePresetBtn) deletePresetBtn.addEventListener('click', deleteCurrentPreset);

  const rotateAllBtn = document.getElementById('printRotateAllBtn');
  if (rotateAllBtn) rotateAllBtn.addEventListener('click', rotateAllPrintDocs);

  const clearAllBtn = document.getElementById('printClearAllBtn');
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearPrintDocs);

  const nextStudentBtn = document.getElementById('printNextStudentBtn');
  if (nextStudentBtn) nextStudentBtn.addEventListener('click', nextStudent);

  const triggerMainBtn = document.getElementById('printTriggerMainBtn');
  if (triggerMainBtn) triggerMainBtn.addEventListener('click', triggerPrint);

  renderPrintDocs();
}
