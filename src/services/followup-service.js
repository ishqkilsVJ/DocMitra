/* ==========================================================================
   Student Document Renamer — Follow-up & Pending Documents Service
   (Tracks promised submission dates, overdue alerts, and document imports)
   ========================================================================== */

const STORAGE_KEY = 'studentDocumentFollowUps';
let memoryStore = [];

/**
 * Load all follow-ups from localStorage
 * @returns {Array<Object>}
 */
export function loadFollowUps() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return memoryStore;
  } catch {
    return memoryStore;
  }
}

/**
 * Save all follow-ups to localStorage
 * @param {Array<Object>} list
 */
export function saveFollowUps(list) {
  try {
    memoryStore = list;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Failed to save follow-ups:', err);
  }
}

/**
 * Add or update a follow-up for a student's missing document
 * @param {Object} data - { folderName, studentName, documentName, promisedDate, note }
 * @returns {Object} saved item
 */
export function addOrUpdateFollowUp({ folderName, studentName, documentName, promisedDate, note = '' }) {
  const list = loadFollowUps();
  const cleanFolder = (folderName || '').trim();
  const cleanDoc = (documentName || '').trim().toUpperCase();
  const cleanStudent = (studentName || folderName || '').trim();

  // Check if an entry already exists for this student & document
  const existingIdx = list.findIndex(
    x => x.folderName.toLowerCase() === cleanFolder.toLowerCase() &&
         x.documentName.toUpperCase() === cleanDoc &&
         x.status === 'pending'
  );

  const now = Date.now();
  if (existingIdx >= 0) {
    list[existingIdx].promisedDate = promisedDate;
    list[existingIdx].note = note;
    list[existingIdx].updatedAt = now;
    saveFollowUps(list);
    return list[existingIdx];
  }

  const newItem = {
    id: `fu_${now}_${Math.random().toString(36).slice(2, 7)}`,
    folderName: cleanFolder,
    studentName: cleanStudent,
    documentName: cleanDoc,
    promisedDate: promisedDate || getTomorrowDateString(),
    note: note || '',
    status: 'pending',
    createdAt: now,
    resolvedAt: null
  };

  list.push(newItem);
  saveFollowUps(list);
  return newItem;
}

/**
 * Mark a follow-up as resolved when the document is received/imported
 * @param {string} folderName
 * @param {string} documentName
 * @returns {boolean} true if resolved
 */
export function resolveFollowUp(folderName, documentName) {
  const list = loadFollowUps();
  const cleanFolder = (folderName || '').trim().toLowerCase();
  const cleanDoc = (documentName || '').trim().toUpperCase();

  let modified = false;
  list.forEach(item => {
    if (
      item.folderName.trim().toLowerCase() === cleanFolder &&
      item.documentName.trim().toUpperCase() === cleanDoc &&
      item.status === 'pending'
    ) {
      item.status = 'resolved';
      item.resolvedAt = Date.now();
      modified = true;
    }
  });

  if (modified) {
    saveFollowUps(list);
  }
  return modified;
}

/**
 * Remove a follow-up entry by ID
 * @param {string} id
 */
export function removeFollowUp(id) {
  const list = loadFollowUps().filter(x => x.id !== id);
  saveFollowUps(list);
}

/**
 * Find pending follow-up for a given student folder and document
 * @param {string} folderName
 * @param {string} documentName
 * @returns {Object|null}
 */
export function getPendingFollowUp(folderName, documentName) {
  const list = loadFollowUps();
  const cleanFolder = (folderName || '').trim().toLowerCase();
  const cleanDoc = (documentName || '').trim().toUpperCase();

  return list.find(
    x => x.folderName.trim().toLowerCase() === cleanFolder &&
         x.documentName.trim().toUpperCase() === cleanDoc &&
         x.status === 'pending'
  ) || null;
}

/**
 * Get stats of follow-ups: today, overdue, upcoming, total pending
 * @param {string} [refDate] - YYYY-MM-DD reference date (defaults to today)
 * @returns {Object}
 */
export function getFollowUpStats(refDate = getTodayDateString()) {
  const list = loadFollowUps().filter(x => x.status === 'pending');
  let overdueCount = 0;
  let todayCount = 0;
  let upcomingCount = 0;

  list.forEach(item => {
    const diff = compareDates(item.promisedDate, refDate);
    if (diff < 0) {
      overdueCount++;
    } else if (diff === 0) {
      todayCount++;
    } else {
      upcomingCount++;
    }
  });

  return {
    totalPending: list.length,
    overdueCount,
    todayCount,
    upcomingCount,
    needsAttentionCount: overdueCount + todayCount
  };
}

/**
 * Get date urgency category: 'overdue' | 'today' | 'upcoming'
 * @param {string} promisedDate
 * @param {string} [refDate]
 * @returns {string}
 */
export function getDateUrgency(promisedDate, refDate = getTodayDateString()) {
  const diff = compareDates(promisedDate, refDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return 'upcoming';
}

/**
 * Format date nicely for human display
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Helper: Today as YYYY-MM-DD in local time
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Tomorrow as YYYY-MM-DD
 */
export function getTomorrowDateString(offsetDays = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Next Monday as YYYY-MM-DD
 */
export function getNextMondayDateString() {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Compare two YYYY-MM-DD dates: <0 if d1 < d2, 0 if d1 == d2, >0 if d1 > d2
 */
function compareDates(d1, d2) {
  if (d1 === d2) return 0;
  return d1 < d2 ? -1 : 1;
}

/**
 * Compute the target canonical filename when importing a scanned document
 * @param {string} documentName - Canonical document name (e.g. 'ATTEMPT CERTIFICATE')
 * @param {string} studentName - Student name (e.g. 'Aarti Patil')
 * @param {string} fileExtension - e.g. '.pdf' or '.jpg'
 * @returns {string} Target clean filename
 */
export function computeImportTargetName(documentName, studentName, fileExtension) {
  const doc = (documentName || '').trim().toUpperCase();
  const name = (studentName || '').trim();
  const ext = (fileExtension || '.pdf').toLowerCase().startsWith('.') ? fileExtension.toLowerCase() : `.${fileExtension.toLowerCase()}`;
  return `${doc} ${name}${ext}`;
}
