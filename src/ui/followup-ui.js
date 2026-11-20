/**
 * DocMitra Follow-up Desk UI Binding & Adapter
 * Connects the Google Stitch Follow-up Desk screen to pure logic in src/services/followup-service.js.
 * STRICT RULES:
 * 1. Zero dynamic innerHTML (safe DOM creation methods only).
 * 2. Never suppress or override window.alert.
 * 3. 100% offline local processing.
 */

import { toast } from './toast.js';
import { selectNativeFolder } from '../services/native-bridge-service.js';
import {
  loadFollowUps,
  saveFollowUps,
  addOrUpdateFollowUp,
  resolveFollowUp,
  removeFollowUp,
  getFollowUpStats,
  getDateUrgency,
  formatFriendlyDate,
  getTodayDateString,
  getTomorrowDateString
} from '../services/followup-service.js';

export class FollowUpUIManager {
  constructor() {
    this.items = [];
    this.searchQuery = '';
  }

  init() {
    this._seedDemoDataIfEmpty();
    this.items = loadFollowUps();
    this._bindControls();
    this.renderTable();
    console.info('[DocMitra Follow-up Desk] Follow-up UI manager initialized.');
  }

  _seedDemoDataIfEmpty() {
    const existing = loadFollowUps();
    if (existing.length === 0) {
      const today = getTodayDateString();
      const tomorrow = getTomorrowDateString(2);
      const overdue = '2026-11-18';

      const demo = [
        {
          id: 'fu_demo_1',
          folderName: 'Vijay_Ramesh_Yadav',
          studentName: 'Vijay Ramesh Yadav',
          rollNo: 'FYJC-2026-084',
          phone: '+91 98231 44510',
          documentName: '12TH LEAVING CERTIFICATE (LC)',
          promisedDate: overdue,
          folderPath: 'E:\\College\\Admission_2026\\FYJC\\Vijay_Ramesh_Yadav',
          note: 'Original LC submitted at junior college, requested 3 days grace period.',
          status: 'pending',
          createdAt: Date.now() - 86400000 * 5
        },
        {
          id: 'fu_demo_2',
          folderName: 'Aarti_Suresh_Patil',
          studentName: 'Aarti Suresh Patil',
          rollNo: 'ENGG-2026-102',
          phone: '+91 98192 33419',
          documentName: 'DOMICILE CERTIFICATE',
          promisedDate: today,
          folderPath: 'E:\\College\\Admission_2026\\Degree\\Aarti_Suresh_Patil',
          note: 'MahaOnline application token attached, awaiting digital signature.',
          status: 'pending',
          createdAt: Date.now() - 86400000 * 2
        },
        {
          id: 'fu_demo_3',
          folderName: 'Rahul_Shinde',
          studentName: 'Rahul Tanaji Shinde',
          rollNo: 'DSE-2026-045',
          phone: '+91 97654 22108',
          documentName: 'CASTE VALIDITY CERTIFICATE',
          promisedDate: tomorrow,
          folderPath: 'E:\\College\\Admission_2026\\DSE\\Rahul_Shinde',
          note: 'Scrutiny committee hearing scheduled this week.',
          status: 'pending',
          createdAt: Date.now() - 86400000
        },
        {
          id: 'fu_demo_4',
          folderName: 'Sneha_Anand_More',
          studentName: 'Sneha Anand More',
          rollNo: 'FYJC-2026-192',
          phone: '+91 94220 88192',
          documentName: 'INCOME CERTIFICATE (TAHSILDAR)',
          promisedDate: tomorrow,
          folderPath: 'E:\\College\\Admission_2026\\FYJC\\Sneha_Anand_More',
          note: 'Tahsildar verification pending.',
          status: 'pending',
          createdAt: Date.now()
        }
      ];

      saveFollowUps(demo);
    }
  }

  _bindControls() {
    // Search input
    const searchInput = document.getElementById('inputFollowupSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target.value || '').trim().toLowerCase();
        this.renderTable();
      });
    }

    // Open Batch Directory
    const btnOpenDir = document.getElementById('btnOpenBatchDirFollowup');
    if (btnOpenDir) {
      btnOpenDir.addEventListener('click', () => this.handleOpenBatchDirectory());
    }
  }

  async handleOpenBatchDirectory() {
    toast.show('Opening Folder Picker', 'Navigating Windows Explorer...', 'info');
    try {
      const res = await selectNativeFolder();
      if (!res.success) {
        if (!res.cancelled) {
          toast.show('Folder Select Error', res.error || 'Failed to select folder', 'error');
        }
        return;
      }

      toast.show('Batch Directory Loaded', res.path || 'Directory opened', 'success');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  renderTable() {
    const tbody = document.getElementById('followupTableBody');
    if (!tbody) return;

    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    const filtered = this.items.filter(item => {
      if (item.status === 'resolved') return false;
      if (!this.searchQuery) return true;
      const q = this.searchQuery;
      return (
        item.studentName?.toLowerCase().includes(q) ||
        item.rollNo?.toLowerCase().includes(q) ||
        item.phone?.includes(q) ||
        item.documentName?.toLowerCase().includes(q) ||
        item.folderName?.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'py-8 text-center text-secondary';
      td.textContent = 'No pending follow-up records found matching criteria.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low transition-colors';

      // 1. Student Name & Roll No
      const td1 = document.createElement('td');
      td1.className = 'py-3.5 px-space-md';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'font-headline-sm text-headline-sm font-bold text-on-surface';
      nameDiv.textContent = item.studentName;
      td1.appendChild(nameDiv);

      const rollDiv = document.createElement('div');
      rollDiv.className = 'font-mono-code text-label-sm text-secondary font-medium';
      rollDiv.textContent = `${item.rollNo || 'REG-2026'} • ${item.phone || '+91 98XXX XXXXX'}`;
      td1.appendChild(rollDiv);
      tr.appendChild(td1);

      // 2. Pending Document
      const td2 = document.createElement('td');
      td2.className = 'py-3.5 px-space-md';

      const docBadge = document.createElement('span');
      docBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold';
      
      const errIcon = document.createElement('span');
      errIcon.className = 'material-symbols-outlined text-[15px]';
      errIcon.textContent = 'error';
      docBadge.appendChild(errIcon);

      const docText = document.createTextNode(` ${item.documentName}`);
      docBadge.appendChild(docText);
      td2.appendChild(docBadge);
      tr.appendChild(td2);

      // 3. Deadline / Given Date with Urgency
      const td3 = document.createElement('td');
      td3.className = 'py-3.5 px-space-md';

      const urgency = getDateUrgency(item.promisedDate);
      const dateDiv = document.createElement('div');
      dateDiv.className = urgency === 'overdue'
        ? 'font-mono-code font-bold text-error'
        : (urgency === 'today' ? 'font-mono-code font-bold text-amber-700' : 'font-mono-code font-bold text-emerald-700');
      dateDiv.textContent = formatFriendlyDate(item.promisedDate);
      td3.appendChild(dateDiv);

      const urgBadge = document.createElement('span');
      if (urgency === 'overdue') {
        urgBadge.className = 'text-[10px] font-bold uppercase tracking-wider text-error bg-error-container/40 px-1.5 py-0.5 rounded';
        urgBadge.textContent = 'OVERDUE';
      } else if (urgency === 'today') {
        urgBadge.className = 'text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded';
        urgBadge.textContent = 'DUE TODAY';
      } else {
        urgBadge.className = 'text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded';
        urgBadge.textContent = 'UPCOMING';
      }
      td3.appendChild(urgBadge);
      tr.appendChild(td3);

      // 4. Student Local Folder Location
      const td4 = document.createElement('td');
      td4.className = 'py-3.5 px-space-md';

      const folderBox = document.createElement('div');
      folderBox.className = 'flex items-center gap-1.5 text-secondary font-mono-code text-[11px]';

      const fIcon = document.createElement('span');
      fIcon.className = 'material-symbols-outlined text-[15px] text-primary shrink-0';
      fIcon.textContent = 'folder';
      folderBox.appendChild(fIcon);

      const pathSpan = document.createElement('span');
      pathSpan.className = 'truncate max-w-[200px] text-on-surface font-semibold';
      pathSpan.textContent = item.folderPath || item.folderName;
      pathSpan.title = item.folderPath || item.folderName;
      folderBox.appendChild(pathSpan);

      const btnOpenFolder = document.createElement('button');
      btnOpenFolder.type = 'button';
      btnOpenFolder.className = 'ml-1 text-primary hover:text-primary-container inline-flex items-center cursor-pointer';
      btnOpenFolder.title = 'Open Folder';
      const openIcon = document.createElement('span');
      openIcon.className = 'material-symbols-outlined text-[15px]';
      openIcon.textContent = 'open_in_new';
      btnOpenFolder.appendChild(openIcon);

      btnOpenFolder.addEventListener('click', async () => {
        try {
          if (item.folderPath) {
            await fetch(`http://localhost:3000/api/open-folder?path=${encodeURIComponent(item.folderPath)}`);
            toast.show('Folder Opened', item.folderPath, 'info');
          }
        } catch (e) {
          toast.show('Open Folder', item.folderName, 'info');
        }
      });

      folderBox.appendChild(btnOpenFolder);
      td4.appendChild(folderBox);
      tr.appendChild(td4);

      // 5. Action Buttons (WhatsApp, Copy Notice, Mark Received)
      const td5 = document.createElement('td');
      td5.className = 'py-3.5 px-space-md text-right';

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'flex items-center justify-end gap-1.5';

      // WhatsApp Button
      const btnWa = document.createElement('button');
      btnWa.type = 'button';
      btnWa.className = 'h-8 px-space-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-sm font-semibold flex items-center gap-1 shadow-xs cursor-pointer';
      btnWa.title = 'Send WhatsApp Notification';
      const waIcon = document.createElement('span');
      waIcon.className = 'material-symbols-outlined text-[14px]';
      waIcon.textContent = 'chat';
      btnWa.appendChild(waIcon);
      btnWa.appendChild(document.createTextNode('WhatsApp'));

      btnWa.addEventListener('click', () => {
        this.sendWhatsApp(item);
      });
      actionsDiv.appendChild(btnWa);

      // Copy Marathi Notice Button
      const btnCopyNotice = document.createElement('button');
      btnCopyNotice.type = 'button';
      btnCopyNotice.className = 'h-8 px-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer';
      btnCopyNotice.title = 'Copy Marathi Admission Notice';
      const copyIcon = document.createElement('span');
      copyIcon.className = 'material-symbols-outlined text-[14px] text-secondary';
      copyIcon.textContent = 'content_copy';
      btnCopyNotice.appendChild(copyIcon);
      btnCopyNotice.appendChild(document.createTextNode('Copy Notice'));

      btnCopyNotice.addEventListener('click', () => {
        this.copyNoticeToClipboard(item);
      });
      actionsDiv.appendChild(btnCopyNotice);

      // Mark Received / Resolve Button
      const btnResolve = document.createElement('button');
      btnResolve.type = 'button';
      btnResolve.className = 'h-8 px-space-sm rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer';
      btnResolve.title = 'Mark Document Received';
      const okIcon = document.createElement('span');
      okIcon.className = 'material-symbols-outlined text-[14px]';
      okIcon.textContent = 'check_circle';
      btnResolve.appendChild(okIcon);
      btnResolve.appendChild(document.createTextNode('Received'));

      btnResolve.addEventListener('click', () => {
        this.markItemResolved(item);
      });
      actionsDiv.appendChild(btnResolve);

      td5.appendChild(actionsDiv);
      tr.appendChild(td5);

      tbody.appendChild(tr);
    });
  }

  generateMarathiNotice(item) {
    const formattedDate = formatFriendlyDate(item.promisedDate);
    return `सस्नेह नमस्कार,
विद्यार्थी नाव: ${item.studentName} (${item.rollNo || 'Admission 2026'})

आपल्या महाराष्ट्र शैक्षणिक प्रवेश प्रक्रियेसाठी खालील आवश्यक कागदपत्र अद्याप महाविद्यालयात प्रलंबित आहे:
📄 कागदपत्र: *${item.documentName}*
📅 अंतिम मुदत: *${formattedDate}*

कृपया सदर मूळ अथवा साक्षांकित प्रत दिलेल्या मुदतीपूर्वी प्रवेश विभागाकडे सादर करावी, जेणेकरून आपला प्रवेश अंतिम निश्चित होईल.

- प्रवेश विभाग (Admission Office)
(DocMitra Administrative Workstation)`;
  }

  copyNoticeToClipboard(item) {
    const text = this.generateMarathiNotice(item);
    navigator.clipboard.writeText(text);
    toast.show('सूचना कॉपी झाली', `Notification for ${item.studentName} copied to clipboard.`, 'success');
  }

  sendWhatsApp(item) {
    const text = this.generateMarathiNotice(item);
    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
    toast.show('WhatsApp उघडत आहे', `Opening WhatsApp for ${item.studentName}...`, 'info');
  }

  markItemResolved(item) {
    resolveFollowUp(item.folderName, item.documentName);
    item.status = 'resolved';
    this.renderTable();
    toast.show('कागदपत्र प्राप्त!', `${item.documentName} for ${item.studentName} marked as received.`, 'success');
  }
}

export function initFollowUpUI() {
  const manager = new FollowUpUIManager();
  manager.init();
  return manager;
}
