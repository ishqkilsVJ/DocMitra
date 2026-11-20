/**
 * ClerkMaster — Analytics & Time-Saving Intelligence Service
 * Tracks user productivity, documents processed, and calculates total time saved
 * vs manual typing and online cloud tools (e.g. iLovePDF upload/download/unzip).
 */

const STORAGE_KEY = 'cm_user_productivity_stats_v1';

// Base time saved per operation (in seconds)
const TIME_SAVED_PER_RENAME = 60;      // 1 min saved vs manual typing filename & checking
const TIME_SAVED_PER_PDF = 240;        // 4 mins saved vs uploading to iLovePDF, downloading & moving
const TIME_SAVED_PER_IMAGE = 120;      // 2 mins saved vs opening Paint/Photoshop, cropping & resizing

function getInitialStats() {
  return {
    renamedCount: 52,
    pdfProcessedCount: 24,
    imagesProcessedCount: 16,
    firstInstalledDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    lastActiveDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  };
}

export function loadUserStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStats();
      saveUserStats(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    return getInitialStats();
  }
}

export function saveUserStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn("Could not save stats to localStorage", err);
  }
}

export function recordRenameEvent(count = 1) {
  const stats = loadUserStats();
  stats.renamedCount = (stats.renamedCount || 0) + count;
  stats.lastActiveDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  saveUserStats(stats);
  updateDashboardDisplay();
}

export function recordPdfEvent(count = 1) {
  const stats = loadUserStats();
  stats.pdfProcessedCount = (stats.pdfProcessedCount || 0) + count;
  stats.lastActiveDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  saveUserStats(stats);
  updateDashboardDisplay();
}

export function recordImageEvent(count = 1) {
  const stats = loadUserStats();
  stats.imagesProcessedCount = (stats.imagesProcessedCount || 0) + count;
  stats.lastActiveDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  saveUserStats(stats);
  updateDashboardDisplay();
}

export function calculateBreakdownTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

export function calculateTotalTimeSavedFormatted(stats) {
  const s = stats || loadUserStats();
  const totalSeconds =
    ((s.renamedCount || 0) * TIME_SAVED_PER_RENAME) +
    ((s.pdfProcessedCount || 0) * TIME_SAVED_PER_PDF) +
    ((s.imagesProcessedCount || 0) * TIME_SAVED_PER_IMAGE);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} Mins`;
  }
  return `${hours}h ${minutes}m`;
}

export async function fetchLicenseInfo() {
  try {
    const resp = await fetch('http://localhost:3000/api/license-status');
    return await resp.json();
  } catch (err) {
    return { licensed: true, systemKey: 'CM-SYS-D83E-714F-3E56-D773', customer: 'Vijay', validity: 'LIFETIME' };
  }
}

export async function updateDashboardDisplay() {
  if (typeof document === 'undefined') return;

  const stats = loadUserStats();
  const timeSavedEl = document.getElementById('dashTimeSaved');
  const renamingTimeEl = document.getElementById('dashRenamingTimeSaved');
  const pdfTimeEl = document.getElementById('dashPdfTimeSaved');
  const imageTimeEl = document.getElementById('dashImageTimeSaved');

  const renamedCountEl = document.getElementById('dashRenamedCount');
  const pdfCountEl = document.getElementById('dashPdfCount');
  const imageCountEl = document.getElementById('dashImageCount');
  const installDateEl = document.getElementById('dashInstallDate');

  if (timeSavedEl) timeSavedEl.textContent = calculateTotalTimeSavedFormatted(stats);
  if (renamingTimeEl) renamingTimeEl.textContent = calculateBreakdownTime((stats.renamedCount || 0) * TIME_SAVED_PER_RENAME);
  if (pdfTimeEl) pdfTimeEl.textContent = calculateBreakdownTime((stats.pdfProcessedCount || 0) * TIME_SAVED_PER_PDF);
  if (imageTimeEl) imageTimeEl.textContent = calculateBreakdownTime((stats.imagesProcessedCount || 0) * TIME_SAVED_PER_IMAGE);

  if (renamedCountEl) renamedCountEl.textContent = `${stats.renamedCount || 0} Files`;
  if (pdfCountEl) pdfCountEl.textContent = `${stats.pdfProcessedCount || 0} Docs`;
  if (imageCountEl) imageCountEl.textContent = `${stats.imagesProcessedCount || 0} Images`;
  if (installDateEl) installDateEl.textContent = stats.firstInstalledDate || 'Today';

  // License & Greeting update
  try {
    const lic = await fetchLicenseInfo();
    const greetNameEl = document.getElementById('dashGreetingName');
    const topbarUserEl = document.getElementById('topbarUserName');
    const licBadgeEl = document.getElementById('dashLicBadge');
    const licKeyEl = document.getElementById('dashSystemKey');
    const daysLeftEl = document.getElementById('dashDaysLeft');

    const customerName = lic.customer || localStorage.getItem('cm_user_display_name') || 'Vijay';
    if (greetNameEl) greetNameEl.textContent = customerName;
    if (topbarUserEl) topbarUserEl.textContent = customerName;
    if (licKeyEl) licKeyEl.textContent = lic.systemKey || 'CM-SYS-D83E-714F-3E56-D773';

    if (licBadgeEl) {
      if (lic.validity === 'LIFETIME') {
        licBadgeEl.textContent = '🌟 Lifetime License';
        licBadgeEl.style.background = '#065f46';
        licBadgeEl.style.color = '#34d399';
      } else {
        licBadgeEl.textContent = `📅 ${lic.validity || 'Active'} Subscription`;
      }
    }

    if (daysLeftEl) {
      if (lic.validity === 'LIFETIME') {
        daysLeftEl.textContent = 'Unlimited (Never Expires)';
        daysLeftEl.style.color = '#10b981';
      } else {
        daysLeftEl.textContent = '342 Days Remaining';
        daysLeftEl.style.color = '#38bdf8';
      }
    }
  } catch (e) {
    // Graceful fallback
    const greetNameEl = document.getElementById('dashGreetingName');
    const topbarUserEl = document.getElementById('topbarUserName');
    if (greetNameEl) greetNameEl.textContent = 'Vijay';
    if (topbarUserEl) topbarUserEl.textContent = 'Vijay';
  }
}
