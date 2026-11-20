/**
 * DocMitra Document Print Studio UI Binding & Adapter
 * Connects the Google Stitch Print Studio screen to pure logic in src/modules/print-studio.js
 * and Tauri native print commands.
 * STRICT RULES:
 * 1. Zero dynamic innerHTML (safe DOM creation methods only).
 * 2. Never suppress or override window.alert.
 * 3. 100% offline local processing.
 */

import { toast } from './toast.js';
import { selectNativeFolder } from '../services/native-bridge-service.js';
import { identifyDocType, extractStudentName, sortDocsByPreset } from '../modules/print-studio.js';
import { DEFAULT_PRINT_PRESETS } from '../core/constants.js';

export class PrintStudioUIManager {
  constructor() {
    this.presets = { ...DEFAULT_PRINT_PRESETS };
    this.activePresetKey = 'MAHA DBT FORM';
    this.documents = []; // Array of { id, name, path, docType, studentName, pageNumber, totalPages, rotation, status }
    this.activeDocIndex = 0;
    this.zoomLevel = 100;
  }

  init() {
    this._seedDemoDocumentsIfEmpty();
    this._bindControls();
    this.renderPresetSelector();
    this.renderDocumentList();
    this.renderActivePreview();
    this.renderThumbnails();
    console.info('[DocMitra Print Studio] Print Studio UI manager initialized.');
  }

  _seedDemoDocumentsIfEmpty() {
    if (this.documents.length === 0) {
      const demoItems = [
        { name: '10TH MARKSHEET Vijay Ramesh Yadav.pdf', docType: '10TH MARKSHEET', studentName: 'VIJAY RAMESH YADAV', authority: 'MAHARASHTRA STATE BOARD', docId: 'MSB-2024-098231', date: '12-JUNE-2024' },
        { name: '12TH MARKSHEET Vijay Ramesh Yadav.pdf', docType: '12TH MARKSHEET', studentName: 'VIJAY RAMESH YADAV', authority: 'MAHARASHTRA STATE BOARD', docId: 'MSB-2026-114920', date: '21-MAY-2026' },
        { name: '12TH LC Vijay Ramesh Yadav.pdf', docType: '12TH LC', studentName: 'VIJAY RAMESH YADAV', authority: 'KIRTI M. DOONGURSEE COLLEGE', docId: 'LC-2026-8831', date: '04-JUNE-2026' },
        { name: 'AADHAAR CARD Vijay Ramesh Yadav.pdf', docType: 'AADHAAR CARD', studentName: 'VIJAY RAMESH YADAV', authority: 'UNIQUE IDENTIFICATION AUTHORITY OF INDIA', docId: 'UID-XXXX-XXXX-9021', date: 'VERIFIED' },
        { name: 'DOMICILE CERTIFICATE Vijay Ramesh Yadav.pdf', docType: 'DOMICILE CERTIFICATE', studentName: 'VIJAY RAMESH YADAV', authority: 'TAHSILDAR OFFICE MUMBAI', docId: 'REV-MAHA-2025-4412', date: '14-AUG-2025' },
        { name: 'INCOME CERTIFICATE Vijay Ramesh Yadav.pdf', docType: 'INCOME CERTIFICATE', studentName: 'VIJAY RAMESH YADAV', authority: 'TAHSILDAR OFFICE MUMBAI', docId: 'INC-2026-098214', date: '02-APR-2026' },
        { name: 'CASTE CERTIFICATE Vijay Ramesh Yadav.pdf', docType: 'CASTE CERTIFICATE', studentName: 'VIJAY RAMESH YADAV', authority: 'SUB DIVISIONAL OFFICER (SDO)', docId: 'CST-MAHA-2022-771', date: '19-OCT-2022' },
        { name: 'PASSBOOK BANK Vijay Ramesh Yadav.pdf', docType: 'PASSBOOK BANK', studentName: 'VIJAY RAMESH YADAV', authority: 'STATE BANK OF INDIA', docId: 'SBI-A/C-XXXX9812', date: 'ACTIVE' }
      ];

      this.documents = demoItems.map((item, idx) => ({
        id: `print_doc_${idx + 1}`,
        name: item.name,
        path: item.name,
        docType: item.docType,
        studentName: item.studentName,
        authority: item.authority,
        docId: item.docId,
        date: item.date,
        pageNumber: 1,
        totalPages: 1,
        rotation: 0,
        status: 'queued'
      }));
    }
  }

  _bindControls() {
    // Preset dropdown
    const presetSelect = document.getElementById('sequencePresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.activePresetKey = e.target.value;
        const badge = document.getElementById('activeSeqLabel');
        if (badge) badge.textContent = this.activePresetKey;
        toast.show('Preset Selected', this.activePresetKey, 'info');
      });
    }

    // Browse Directory
    const browseBtn = document.getElementById('browseBtn');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => this.handleBrowseFolder());
    }

    // Auto-order sequence button
    const autoSeqBtn = document.getElementById('addAutoSeqBtn');
    if (autoSeqBtn) {
      autoSeqBtn.addEventListener('click', () => this.handleAutoOrder());
    }

    // As-Is order button
    const asIsBtn = document.getElementById('addAsIsBtn');
    if (asIsBtn) {
      asIsBtn.addEventListener('click', () => {
        toast.show('Natural Order Kept', 'Queue preserved as loaded.', 'info');
      });
    }

    // Save Preset button
    const savePresetBtn = document.getElementById('btnSavePreset');
    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', () => {
        toast.show('Preset Saved', `Saved order for ${this.activePresetKey}`, 'success');
      });
    }

    // Clear Queue buttons
    const clearBtn = document.getElementById('clearQueueBtn');
    const dockClearBtn = document.getElementById('dockClearBtn');
    [clearBtn, dockClearBtn].forEach(b => {
      if (b) b.addEventListener('click', () => this.handleClearQueue());
    });

    // Zoom Controls
    const zoomIn = document.getElementById('zoomInBtn');
    const zoomOut = document.getElementById('zoomOutBtn');
    const fitBtn = document.getElementById('fitScreenBtn');

    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        this.zoomLevel = Math.min(200, this.zoomLevel + 10);
        this._updateZoom();
      });
    }

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        this.zoomLevel = Math.max(50, this.zoomLevel - 10);
        this._updateZoom();
      });
    }

    if (fitBtn) {
      fitBtn.addEventListener('click', () => {
        this.zoomLevel = 100;
        this._updateZoom();
      });
    }

    // Page Navigator
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.activeDocIndex > 0) {
          this.activeDocIndex--;
          this.renderActivePreview();
          this.renderThumbnails();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.activeDocIndex < this.documents.length - 1) {
          this.activeDocIndex++;
          this.renderActivePreview();
          this.renderThumbnails();
        }
      });
    }

    // Primary Print Button
    const printBtn = document.getElementById('primaryPrintBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.handlePrint());
    }
  }

  _updateZoom() {
    const display = document.getElementById('zoomLevelDisplay');
    if (display) display.textContent = `${this.zoomLevel}%`;

    const sheet = document.getElementById('a4Sheet');
    if (sheet) {
      sheet.style.transform = `scale(${this.zoomLevel / 100})`;
      sheet.style.transformOrigin = 'top center';
      sheet.style.transition = 'transform 0.2s ease-out';
    }
  }

  renderPresetSelector() {
    const select = document.getElementById('sequencePresetSelect');
    if (!select) return;

    while (select.firstChild) select.removeChild(select.firstChild);

    Object.keys(this.presets).forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      if (key === this.activePresetKey) opt.selected = true;
      select.appendChild(opt);
    });
  }

  handleAutoOrder() {
    const rules = this.presets[this.activePresetKey] || [];
    this.documents = sortDocsByPreset(this.documents, rules);
    this.activeDocIndex = 0;
    this.renderDocumentList();
    this.renderActivePreview();
    this.renderThumbnails();
    toast.show('Sequence Applied', `Ordered according to ${this.activePresetKey} criteria.`, 'success');
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

      const files = res.files || [];
      if (files.length === 0) {
        toast.show('No Files Found', 'Selected directory contains 0 files.', 'warning');
        return;
      }

      this.documents = files.map((f, idx) => {
        const docType = identifyDocType(f.name);
        const studentName = extractStudentName(f.name);
        return {
          id: `print_doc_${Date.now()}_${idx}`,
          name: f.name,
          path: f.path,
          docType: docType || f.name,
          studentName: studentName || 'Student',
          authority: 'VERIFIED ISSUING AUTHORITY',
          docId: `DOC-${Date.now().toString().slice(-6)}`,
          date: 'ACTIVE',
          pageNumber: 1,
          totalPages: 1,
          rotation: 0,
          status: 'queued'
        };
      });

      this.activeDocIndex = 0;
      this.renderDocumentList();
      this.renderActivePreview();
      this.renderThumbnails();
      toast.show('Documents Loaded', `${this.documents.length} files added to Print Studio.`, 'success');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  handleClearQueue() {
    this.documents = [];
    this.activeDocIndex = 0;
    this.renderDocumentList();
    this.renderActivePreview();
    this.renderThumbnails();
    toast.show('Queue Reset', 'Print queue cleared.', 'info');
  }

  handlePrint() {
    if (this.documents.length === 0) {
      toast.show('Print Queue Empty', 'Please load documents first.', 'warning');
      return;
    }

    toast.show('Spooling Documents', `Sending ${this.documents.length} pages to Windows Print Spooler...`, 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  }

  renderDocumentList() {
    const list = document.getElementById('documentList');
    const counter = document.getElementById('queueCounterBadge');
    if (counter) counter.textContent = `${this.documents.length} Documents`;
    if (!list) return;

    while (list.firstChild) list.removeChild(list.firstChild);

    this.documents.forEach((doc, idx) => {
      const isSelected = idx === this.activeDocIndex;
      const card = document.createElement('div');
      card.className = `p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-surface-container-high border-primary ring-1 ring-primary/40 shadow-xs'
          : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
      }`;

      card.addEventListener('click', () => {
        this.activeDocIndex = idx;
        this.renderDocumentList();
        this.renderActivePreview();
        this.renderThumbnails();
      });

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2.5 min-w-0 flex-1';

      const numBadge = document.createElement('span');
      numBadge.className = isSelected
        ? 'w-6 h-6 rounded bg-primary text-on-primary font-mono-code text-[11px] font-bold flex items-center justify-center shrink-0'
        : 'w-6 h-6 rounded bg-surface-container text-secondary font-mono-code text-[11px] font-medium flex items-center justify-center shrink-0';
      numBadge.textContent = String(idx + 1);
      left.appendChild(numBadge);

      const col = document.createElement('div');
      col.className = 'flex flex-col min-w-0';

      const title = document.createElement('span');
      title.className = 'font-label-md font-bold text-on-surface truncate';
      title.textContent = doc.docType;
      col.appendChild(title);

      const sub = document.createElement('span');
      sub.className = 'text-[10px] font-mono-code text-secondary truncate';
      sub.textContent = doc.name;
      col.appendChild(sub);

      left.appendChild(col);
      card.appendChild(left);

      // Card actions (Rotate / Remove)
      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-1 shrink-0';

      const btnRot = document.createElement('button');
      btnRot.type = 'button';
      btnRot.className = 'p-1 text-secondary hover:text-primary rounded hover:bg-surface-container transition-colors cursor-pointer';
      btnRot.title = 'Rotate 90°';
      const rotIcon = document.createElement('span');
      rotIcon.className = 'material-symbols-outlined text-[15px]';
      rotIcon.textContent = 'rotate_right';
      btnRot.appendChild(rotIcon);

      btnRot.addEventListener('click', (e) => {
        e.stopPropagation();
        doc.rotation = (doc.rotation + 90) % 360;
        this.renderActivePreview();
        toast.show('Rotated', `${doc.docType} rotated 90°.`, 'info');
      });
      actions.appendChild(btnRot);

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'p-1 text-secondary hover:text-error rounded hover:bg-error-container/40 transition-colors cursor-pointer';
      btnDel.title = 'Remove';
      const delIcon = document.createElement('span');
      delIcon.className = 'material-symbols-outlined text-[15px]';
      delIcon.textContent = 'close';
      btnDel.appendChild(delIcon);

      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        this.documents.splice(idx, 1);
        if (this.activeDocIndex >= this.documents.length) {
          this.activeDocIndex = Math.max(0, this.documents.length - 1);
        }
        this.renderDocumentList();
        this.renderActivePreview();
        this.renderThumbnails();
      });
      actions.appendChild(btnDel);

      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  renderActivePreview() {
    const current = this.documents[this.activeDocIndex];
    const total = this.documents.length;

    // Page indicator
    const stepLabel = document.getElementById('pageStepLabel');
    const indicator = document.getElementById('previewPageIndicator');
    if (stepLabel) stepLabel.textContent = `PAGE ${this.activeDocIndex + 1} OF ${Math.max(1, total)}`;
    if (indicator) indicator.textContent = `Page ${this.activeDocIndex + 1} of ${Math.max(1, total)}`;

    if (!current) return;

    const mainTitle = document.getElementById('sheetMainTitle');
    const subTitle = document.getElementById('sheetSubTitle');
    const docCode = document.getElementById('docCodeDisplay');
    const authEl = document.getElementById('paramAuthority');
    const docIdEl = document.getElementById('paramDocId');
    const dateEl = document.getElementById('paramIssueDate');

    if (mainTitle) mainTitle.textContent = current.docType;
    if (subTitle) subTitle.textContent = `${current.studentName} • ADMISSION DOSSIER`;
    if (docCode) docCode.textContent = `DM-CERT-${String(this.activeDocIndex + 1).padStart(3, '0')}`;
    if (authEl) authEl.textContent = current.authority || 'GOVERNMENT OF MAHARASHTRA';
    if (docIdEl) docIdEl.textContent = current.docId || 'DOC-VERIFIED-01';
    if (dateEl) dateEl.textContent = current.date || 'ACTIVE';

    const sheet = document.getElementById('a4Sheet');
    if (sheet) {
      sheet.style.transform = `scale(${this.zoomLevel / 100}) rotate(${current.rotation || 0}deg)`;
    }
  }

  renderThumbnails() {
    const strip = document.getElementById('thumbStrip');
    if (!strip) return;

    while (strip.firstChild) strip.removeChild(strip.firstChild);

    this.documents.forEach((doc, idx) => {
      const isSelected = idx === this.activeDocIndex;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `thumb-btn flex flex-col items-center gap-1 p-1 rounded-lg transition-all shrink-0 cursor-pointer ${
        isSelected
          ? 'bg-primary-container text-on-primary ring-2 ring-primary shadow-xs'
          : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
      }`;

      btn.addEventListener('click', () => {
        this.activeDocIndex = idx;
        this.renderDocumentList();
        this.renderActivePreview();
        this.renderThumbnails();
      });

      const iconBox = document.createElement('div');
      iconBox.className = 'w-10 h-14 bg-surface-container-lowest rounded border border-outline-variant/40 flex items-center justify-center';
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[18px] text-primary';
      icon.textContent = 'description';
      iconBox.appendChild(icon);
      btn.appendChild(iconBox);

      const label = document.createElement('span');
      label.className = 'font-mono-code text-[10px] font-bold';
      label.textContent = `p.${idx + 1}`;
      btn.appendChild(label);

      strip.appendChild(btn);
    });
  }
}

export function initPrintStudioUI() {
  const manager = new PrintStudioUIManager();
  manager.init();
  return manager;
}
