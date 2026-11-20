/* ==========================================================================
   Student Document Renamer — App Core Controller (Safe Mode)
   ========================================================================== */

import { $, clear, el, showToast, confirmAction, updateProgressBar, hideProgressBar } from '../ui/ui-library.js';
import { loadSettings, saveSettings, hydrateSettings } from '../services/storage-service.js';
import { readFiles, collectFolders, releasePreviews } from '../libraries/file-library.js';
import { planRename, executeRename, cleanName } from '../libraries/rename-library.js';
import { matchDocument } from '../libraries/shortcut-keyword-library.js';
import { allFileNames, evaluateChecklistSummary } from '../libraries/checklist-library.js';
import { renderFilesTable } from '../ui/file-list-ui.js';
import { initSettingsUI } from '../ui/settings-ui.js';
import {
  loadFollowUps,
  addOrUpdateFollowUp,
  resolveFollowUp,
  removeFollowUp,
  getPendingFollowUp,
  getFollowUpStats,
  getDateUrgency,
  formatFriendlyDate,
  getTodayDateString,
  getTomorrowDateString,
  getNextMondayDateString,
  computeImportTargetName
} from '../services/followup-service.js';
import {
  generateBatchAuditCSV,
  downloadCSV,
  generateFollowUpCSV,
  openLandscapePrintReport,
  openFollowUpPrintSheet
} from '../libraries/export-reports-library.js';
import { initSuiteHub, syncSuiteFiles } from '../modules/suite-hub.js';
import { updaterService } from '../services/updater-service.js';
import { licensingService } from '../services/licensing-service.js';
import { recordRenameEvent, updateDashboardDisplay } from '../services/analytics-service.js';
import { selectNativeFolder, listNativeDirectory, createNativeFileObject } from '../services/native-bridge-service.js';
import { dispatchError, searchErrorCodes } from '../services/error-code-service.js';

const state = loadSettings();
let dir = null;
let folders = [];
let folderIndex = 0;
let files = [];
let urls = [];
let selectedIndices = [];
let currentViewMode = 'focus';
let activeFocusIndex = 0;
let inputsState = {};
let activeFollowUpTarget = null;
let activeDeskFilter = 'attention';
let batchAuditFilter = 'all';
let cachedBatchResults = [];

// Windows Explorer-Style Folder Navigation State
let rootBatchHandle = null;
let folderPathTrail = [];
let navHistory = [];
let historyIndex = -1;
let currentSubfolders = [];
let activeReelShortcuts = new Map();

function setDisabled(id, val) {
  const elem = $(id);
  if (elem) elem.disabled = val;
}

function handleSelectionChange(indices) {
  selectedIndices = indices;
  const renameBtn = $('directRename');
  if (renameBtn) {
    const count = selectedIndices.length;
    renameBtn.disabled = !dir || count === 0;
    renameBtn.innerHTML = `<strong>✏️ Rename Selected (${count} Files)</strong><small>Apply live names to checked files only</small>`;
  }
}

async function loadFolder(handle, options = {}) {
  const isNavAction = options.isNavAction || false;
  const explicitTrail = options.explicitTrail || null;
  const preserveActiveIndex = options.preserveActiveIndex !== undefined ? options.preserveActiveIndex : null;

  dir = handle;
  files = await readFiles(handle);
  syncSuiteFiles(files, dir?.name, dir);
  try {
    currentSubfolders = await collectFolders(handle);
  } catch {
    currentSubfolders = [];
  }
  selectedIndices = [];
  if (preserveActiveIndex !== null) {
    activeFocusIndex = Math.min(preserveActiveIndex, Math.max(0, files.length - 1));
  } else {
    activeFocusIndex = 0;
  }
  inputsState = {};

  // 1. Maintain folderPathTrail
  if (explicitTrail) {
    folderPathTrail = [...explicitTrail];
  } else {
    if (!folderPathTrail.length) {
      folderPathTrail = [{
        handle,
        name: handle.name,
        isBatchRoot: Boolean(rootBatchHandle && handle.name === rootBatchHandle.name)
      }];
    } else {
      const lastCrumb = folderPathTrail[folderPathTrail.length - 1];
      if (lastCrumb.handle.name.toLowerCase() === handle.name.toLowerCase()) {
        // Refreshing current dir, keep as is
      } else {
        const trailIdx = folderPathTrail.findIndex(c => c.name.toLowerCase() === handle.name.toLowerCase());
        if (trailIdx >= 0) {
          folderPathTrail = folderPathTrail.slice(0, trailIdx + 1);
        } else {
          const studentIdx = folders.findIndex(f => f.name.toLowerCase() === handle.name.toLowerCase());
          if (studentIdx >= 0 && rootBatchHandle) {
            folderPathTrail = [
              { handle: rootBatchHandle, name: rootBatchHandle.name, isBatchRoot: true },
              { handle, name: handle.name }
            ];
          } else {
            folderPathTrail.push({ handle, name: handle.name });
          }
        }
      }
    }
  }

  // 2. History tracking for Back / Forward
  if (!isNavAction) {
    if (historyIndex < navHistory.length - 1) {
      navHistory = navHistory.slice(0, historyIndex + 1);
    }
    navHistory.push({
      handle,
      name: handle.name,
      trail: [...folderPathTrail]
    });
    historyIndex = navHistory.length - 1;
  }

  // 3. Update folderIndex if handle is in folders array
  const matchedIdx = folders.findIndex(f => f.name.toLowerCase() === handle.name.toLowerCase());
  if (matchedIdx >= 0) {
    folderIndex = matchedIdx;
  }
  
  const countText = folders.length > 1 && matchedIdx >= 0 ? ` (${folderIndex + 1}/${folders.length})` : '';
  $('folderName').innerHTML = `<strong>Folder:</strong> ${handle.name}${countText}`;
  
  renderFiles();
  handleSelectionChange([]);
  runChecklist();
  updateFollowUpDeskBadge();
  renderFolderNavigator();

  const batchBtn = $('openBatchAuditBtn');
  if (batchBtn) {
    batchBtn.disabled = folders.length === 0;
  }
  const batchBadge = $('batchFolderCountBadge');
  if (batchBadge) {
    batchBadge.textContent = folders.length;
    batchBadge.style.display = folders.length > 0 ? 'inline-block' : 'none';
  }
  
  setDisabled('runChecklist', false);
  setDisabled('bulkChecklist', folders.length === 0);
  setDisabled('prevFolder', folderIndex <= 0 || matchedIdx === -1);
  setDisabled('nextFolder', folderIndex >= folders.length - 1 || matchedIdx === -1);
  setDisabled('refreshFolder', false);
}

function renderFolderNavigator() {
  const navWrap = $('folderNavigator');
  if (!navWrap) return;

  if (!dir) {
    navWrap.style.display = 'none';
    return;
  }
  navWrap.style.display = 'block';

  // 1. Update History & Hierarchy Buttons
  const backBtn = $('navBackBtn');
  const fwdBtn = $('navForwardBtn');
  const upBtn = $('navUpBtn');

  if (backBtn) backBtn.disabled = historyIndex <= 0;
  if (fwdBtn) fwdBtn.disabled = historyIndex >= navHistory.length - 1;
  if (upBtn) upBtn.disabled = folderPathTrail.length <= 1;

  // 2. Render Clickable Growing Breadcrumb Path
  const breadcrumb = $('navBreadcrumb');
  if (breadcrumb) {
    clear(breadcrumb);

    folderPathTrail.forEach((crumb, idx) => {
      if (idx > 0) {
        breadcrumb.append(el('span', { class: 'crumbSeparator', textContent: '›' }));
      }
      const isLast = (idx === folderPathTrail.length - 1);
      const isFirst = (idx === 0);
      const isRoot = isFirst && rootBatchHandle;
      const icon = isRoot ? '🏠' : (isLast ? '📂' : '📁');

      const item = el('span', {
        class: `crumbItem ${isLast ? 'active' : ''}`,
        title: crumb.name,
        textContent: `${icon} ${crumb.name}`,
        onclick: async () => {
          if (!isLast) {
            const nextTrail = folderPathTrail.slice(0, idx + 1);
            await loadFolder(crumb.handle, { explicitTrail: nextTrail });
          }
        }
      });
      breadcrumb.append(item);
    });
  }

  // 3. Render Folder Reel Track
  renderFolderReelTrack();
}

async function triggerFolderItemOpen(item) {
  if (!item) return;
  if (item.isUpTile) {
    const nextTrail = folderPathTrail.slice(0, -1);
    await loadFolder(item.handle, { explicitTrail: nextTrail });
  } else if (item.type === 'subfolder') {
    const nextTrail = [...folderPathTrail, { handle: item.handle, name: item.name }];
    await loadFolder(item.handle, { explicitTrail: nextTrail });
  } else if (item.type === 'sibling') {
    if (!item.isCurrent) {
      const nextTrail = [...folderPathTrail.slice(0, -1), { handle: item.handle, name: item.name }];
      await loadFolder(item.handle, { explicitTrail: nextTrail });
    }
  } else if (item.type === 'student') {
    const matchedIdx = folders.findIndex(f => f.name.toLowerCase() === item.handle.name.toLowerCase());
    if (matchedIdx >= 0) folderIndex = matchedIdx;
    const explicitTrail = rootBatchHandle
      ? [{ handle: rootBatchHandle, name: rootBatchHandle.name, isBatchRoot: true }, { handle: item.handle, name: item.name }]
      : [{ handle: item.handle, name: item.name, isBatchRoot: false }];
    await loadFolder(item.handle, { explicitTrail });
  } else if (item.type === 'current') {
    if (dir.nativePath) {
      await loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
    } else {
      await loadFolder(dir);
    }
  }
}

async function renderFolderReelTrack() {
  const track = $('folderReelTrack');
  if (!track || !dir) return;
  clear(track);

  const query = ($('folderSearchInput')?.value || '').trim().toLowerCase();
  const clearBtn = $('folderSearchClearBtn');
  if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

  let list = [];

  if (query) {
    // 1. Search in current folder's subfolders
    const matchedSubfolders = (currentSubfolders || []).filter(sf => 
      sf.name.toLowerCase().includes(query)
    ).map((sf, idx) => ({
      handle: sf,
      name: sf.name,
      serial: String(idx + 1).padStart(2, '0'),
      type: 'subfolder',
      subtitle: 'Subfolder',
      badge: 'OPEN ➔',
      badgeClass: 'tileBadge subfolder'
    }));

    // 2. Search in student batch folders (if batch loaded)
    const matchedStudents = (folders.length > 1 ? folders : []).filter((f, idx) => {
      const matchName = f.name.toLowerCase().includes(query);
      const serial = String(idx + 1).padStart(2, '0');
      const matchSerial = serial.includes(query) || String(idx + 1) === query || `#${idx + 1}` === query;
      return matchName || matchSerial;
    }).map(f => {
      const idx = folders.findIndex(x => x.name.toLowerCase() === f.name.toLowerCase());
      const isCurrent = dir && dir.name.toLowerCase() === f.name.toLowerCase();
      return {
        handle: f,
        name: f.name,
        serial: String(idx + 1).padStart(2, '0'),
        type: 'student',
        subtitle: 'Student',
        badge: isCurrent ? 'ACTIVE' : 'SELECT',
        badgeClass: isCurrent ? 'tileBadge ready' : 'tileBadge subfolder',
        isCurrent
      };
    });

    list = [...matchedSubfolders, ...matchedStudents];
  } else {
    // No query: Contextual view based on current folder hierarchy
    if (currentSubfolders && currentSubfolders.length > 0) {
      // The current folder HAS subfolders -> Display all child subfolders!
      if (folderPathTrail.length > 1) {
        const parentCrumb = folderPathTrail[folderPathTrail.length - 2];
        list.push({
          handle: parentCrumb.handle,
          name: `⮌ Up: ${parentCrumb.name}`,
          serial: 'UP',
          type: 'up',
          subtitle: 'Parent Folder',
          badge: 'GO UP ⬆',
          badgeClass: 'tileBadge subfolder',
          isUpTile: true
        });
      }

      currentSubfolders.forEach((sf, idx) => {
        list.push({
          handle: sf,
          name: sf.name,
          serial: String(idx + 1).padStart(2, '0'),
          type: 'subfolder',
          subtitle: 'Subfolder',
          badge: 'OPEN ➔',
          badgeClass: 'tileBadge subfolder'
        });
      });
    } else {
      // Current folder has NO subfolders (leaf folder containing files)
      if (folderPathTrail.length > 1) {
        const parentCrumb = folderPathTrail[folderPathTrail.length - 2];
        const isStudentLevel = rootBatchHandle && folderPathTrail.length === 2 &&
          folderPathTrail[0].handle.name === rootBatchHandle.name;

        // Add Up to Parent tile FIRST so user can always navigate up with Backspace!
        list.push({
          handle: parentCrumb.handle,
          name: `⮌ Up: ${parentCrumb.name}`,
          serial: 'UP',
          type: 'up',
          subtitle: parentCrumb.isBatchRoot ? 'Parent Batch' : 'Parent Folder',
          badge: 'GO UP ⬆',
          badgeClass: 'tileBadge subfolder',
          isUpTile: true
        });

        if (isStudentLevel && folders.length > 1) {
          // At student level: show all student batch tiles so user can switch students easily
          folders.forEach((f, idx) => {
            const isCurrent = dir && dir.name.toLowerCase() === f.name.toLowerCase();
            list.push({
              handle: f,
              name: f.name,
              serial: String(idx + 1).padStart(2, '0'),
              type: 'student',
              subtitle: 'Student',
              badge: isCurrent ? 'ACTIVE' : 'SELECT',
              badgeClass: isCurrent ? 'tileBadge ready' : 'tileBadge subfolder',
              isCurrent
            });
          });
        } else {
          // Inside a deep subfolder (e.g. Vijay > JPG):
          // Fetch parent's subfolders to show sibling subfolders!
          try {
            const siblings = await collectFolders(parentCrumb.handle);
            siblings.forEach((sib, idx) => {
              const isCurrent = dir && dir.name.toLowerCase() === sib.name.toLowerCase();
              list.push({
                handle: sib,
                name: sib.name,
                serial: String(idx + 1).padStart(2, '0'),
                type: 'sibling',
                subtitle: 'Subfolder',
                badge: isCurrent ? 'ACTIVE' : 'SWITCH ➔',
                badgeClass: isCurrent ? 'tileBadge ready' : 'tileBadge subfolder',
                isCurrent
              });
            });
          } catch {
            // If cannot fetch parent's subfolders, show current leaf folder
            list.push({
              handle: dir,
              name: dir.name,
              serial: 'NOW',
              type: 'current',
              subtitle: 'Current Folder',
              badge: 'ACTIVE',
              badgeClass: 'tileBadge ready',
              isCurrent: true
            });
          }
        }
      } else if (folders.length > 1) {
        // At root batch
        list = folders.map((f, idx) => ({
          handle: f,
          name: f.name,
          serial: String(idx + 1).padStart(2, '0'),
          type: 'student',
          subtitle: 'Student',
          badge: 'SELECT',
          badgeClass: 'tileBadge subfolder'
        }));
      } else {
        // Single folder leaf
        list = [{
          handle: dir,
          name: dir.name,
          serial: '01',
          type: 'current',
          subtitle: 'Folder',
          badge: 'ACTIVE',
          badgeClass: 'tileBadge ready',
          isCurrent: true
        }];
      }
    }
  }

  if (!list.length) {
    activeReelShortcuts.clear();
    track.append(
      el('div', { style: 'padding: 10px 14px; font-size: 11.5px; color: var(--muted);' }, [
        el('span', { textContent: `No folders found matching '${query}'` })
      ])
    );
    return;
  }

  // Assign dynamic shortcuts 1..9 to actionable folders
  activeReelShortcuts.clear();
  let shortcutCounter = 1;
  list.forEach(item => {
    if (item.isUpTile) {
      item.shortcutKey = 'Backspace';
      item.shortcutDisplay = '⮌';
      activeReelShortcuts.set('Backspace', item);
    } else if (!item.isCurrent && shortcutCounter <= 9) {
      const keyStr = String(shortcutCounter);
      item.shortcutKey = keyStr;
      item.shortcutDisplay = keyStr;
      activeReelShortcuts.set(keyStr, item);
      shortcutCounter++;
    } else {
      item.shortcutKey = null;
      item.shortcutDisplay = null;
    }
  });

  list.forEach(item => {
    let serialSpan;
    if (item.shortcutDisplay) {
      serialSpan = el('span', {
        class: `tileKeyBadge ${item.isUpTile ? 'upKey' : ''}`,
        textContent: item.isUpTile ? 'KEY: ⮌' : `KEY: ${item.shortcutDisplay}`,
        title: item.isUpTile ? 'Press Backspace to go back' : `Press ${item.shortcutDisplay} (or Alt+${item.shortcutDisplay}) to open`
      });
    } else {
      serialSpan = el('span', {
        class: 'tileSerial',
        textContent: item.serial.startsWith('#') ? item.serial : `#${item.serial}`
      });
    }

    let iconChar = '📁';
    if (item.isUpTile) iconChar = '⬆';
    else if (item.type === 'subfolder' || item.type === 'sibling') iconChar = '📂';
    else if (item.type === 'student') iconChar = '📁';

    const iconSpan = el('span', {
      class: 'tileIcon',
      textContent: iconChar
    });

    const topRow = el('div', { class: 'tileTop' }, [serialSpan, iconSpan]);

    const cleanTitle = item.name.replace(/^[0-9]+[_\s.-]*/, '');
    const nameEl = el('div', {
      class: 'tileName',
      title: item.name,
      textContent: cleanTitle || item.name
    });

    const footer = el('div', { class: 'tileFooter' }, [
      el('span', { textContent: item.subtitle }),
      el('span', { class: item.badgeClass, textContent: item.badge })
    ]);

    const tile = el('div', {
      class: `folderTile ${item.isCurrent ? 'active' : ''}`,
      onclick: () => triggerFolderItemOpen(item)
    }, [
      topRow,
      nameEl,
      footer
    ]);

    track.append(tile);

    // Auto-scroll active tile into view
    if (item.isCurrent && !query) {
      setTimeout(() => {
        tile.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 80);
    }
  });
}

function getStudentContextName() {
  if (!dir) return '';
  if (rootBatchHandle && folderPathTrail && folderPathTrail.length >= 2) {
    return folderPathTrail[1].name;
  }
  if (folders.length === 1 && !rootBatchHandle) {
    return folders[0].name;
  }
  return dir.name;
}

async function handleInstantRename(index, typedVal) {
  if (!dir || !files[index]) return false;
  const currentFile = files[index];
  const currentBase = cleanName(currentFile.name);
  const trimmed = (typedVal || '').trim();

  // If user pressed Tab/Enter with empty or unchanged input, advance smoothly without rename
  if (!trimmed || trimmed === currentBase) {
    const isLast = (index >= files.length - 1);
    const nextIdx = isLast ? 0 : index + 1;
    activeFocusIndex = nextIdx;
    showToast(`No change: '${currentBase}'`, 'info');
    renderFiles();
    return true;
  }

  // 1. Resolve typedVal against our official shortcode dictionary and active groups
  const canonical = matchDocument(trimmed, state.groups);

  const effectiveDocName = canonical || trimmed;
  const studentContext = getStudentContextName();

  // 2. Plan rename for this single file
  const result = planRename(
    files,
    files.map((f, i) => (i === index ? effectiveDocName : cleanName(f.name))),
    studentContext,
    state.groups,
    state.style,
    [index]
  );

  if (result.error) {
    showToast(result.error, 'error');
    return false;
  }

  const item = result.plan[0];
  const isAlreadyRenamed = !item || item.next === currentFile.name;

  if (isAlreadyRenamed) {
    const isLast = (index >= files.length - 1);
    const nextIdx = isLast ? 0 : index + 1;
    activeFocusIndex = nextIdx;
    showToast(`No change: '${currentBase}'`, 'info');
    renderFiles();
    return true;
  }

  try {
    await executeRename(dir, [item]);
    recordRenameEvent(1);
    const cleanDisplay = cleanName(item.next);
    showToast(`'${cleanDisplay}' auto-renamed! ⚡`, 'success');
  } catch (err) {
    handleRenameError(err);
    return false;
  }

  // 3. Advance to the next document smoothly
  // Track the filename of the following file before reloading to prevent skipping on re-sort
  const followingFile = (index < files.length - 1) ? files[index + 1] : null;
  const followingFileName = followingFile ? followingFile.name : null;

  if (dir && dir.nativePath) {
    await loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
  } else {
    await loadFolder(dir, { explicitTrail: folderPathTrail });
  }

  // After folder reload and alphabetical sort, find the exact target file
  let nextIdx = 0;
  if (followingFileName) {
    const foundIdx = files.findIndex(f => f.name === followingFileName);
    nextIdx = (foundIdx >= 0) ? foundIdx : Math.min(index, Math.max(0, files.length - 1));
  } else {
    // Was the last file
    nextIdx = Math.max(0, files.length - 1);
    showToast(`🎉 All ${files.length} documents in folder '${dir.name}' are verified!`, 'success');
  }

  activeFocusIndex = nextIdx;
  renderFiles();
  return true;
}

function renderFiles() {
  const studentContext = getStudentContextName();
  const indexText = (folders.length > 1 && folderIndex >= 0) ? `${folderIndex + 1}/${folders.length}` : '';

  renderFilesTable({
    files,
    dir,
    studentName: studentContext,
    folderName: dir ? dir.name : '',
    folderIndexText: indexText,
    groups: state.groups,
    style: state.style,
    urls,
    viewMode: currentViewMode,
    activeFocusIndex,
    selectedIndices,
    inputsState,
    onNameInput: (idx, val) => {
      inputsState[idx] = val;
    },
    onSelectionChange: handleSelectionChange,
    onFocusChange: (newIdx) => {
      activeFocusIndex = newIdx;
      renderFiles();
    },
    onInstantRename: handleInstantRename
  });
}

async function renameOneFile(index, typed) {
  const result = planRename(
    files,
    files.map((f, i) => (i === index ? typed : cleanName(f.name))),
    dir.name,
    state.groups,
    state.style
  );

  if (result.error) {
    showToast(result.error, 'error');
    return;
  }

  const item = result.plan[0];
  if (!item) {
    showToast('No change in file name.', 'info');
    return;
  }

  try {
    await executeRename(dir, [item]);
    if (dir.nativePath) {
      await loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
    } else {
      await loadFolder(dir);
    }
    showToast(`'${cleanName(item.next)}' renamed successfully! ✅`, 'success');
  } catch (err) {
    showToast(`Rename failed: ${err.message}`, 'error');
  }
}

async function renameSelectedFiles() {
  if (!selectedIndices.length) {
    showToast('Please select at least one file to rename.', 'warning');
    return;
  }

  const inputs = files.map((f, i) => inputsState[i] ?? cleanName(f.name));
  const result = planRename(files, inputs, dir.name, state.groups, state.style, selectedIndices);

  if (result.error) {
    showToast(result.error, 'error');
    return;
  }

  if (!result.plan.length) {
    showToast('No changes detected in selected file names.', 'info');
    return;
  }

  const confirmMsg = `${result.plan.length} selected file(s) will be renamed directly. Unchecked files will remain untouched. Do you want to proceed?`;
  if (!confirmAction(confirmMsg)) return;

  try {
    updateProgressBar(10, 'Renaming in progress...');
    await executeRename(dir, result.plan, (percent, msg) => {
      updateProgressBar(percent, msg);
    });

    hideProgressBar();
    inputsState = {};
    selectedIndices = [];
    activeFocusIndex = 0;
    recordRenameEvent(result.plan.length);
    if (dir.nativePath) {
      await loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
    } else {
      await loadFolder(dir);
    }
    showToast(`${result.plan.length} file(s) renamed directly! ✅`, 'success');
  } catch (err) {
    hideProgressBar();
    showToast(`Rename failed: ${err.message}`, 'error');
  }
}

async function runChecklist() {
  if (!dir) return;
  const items = state.checklists[$('checklistSelect').value] || [];
  const names = dir.nativePath ? (files || []).map(f => f.name) : await allFileNames(dir);
  clear($('checkResults'));
  
  const summary = evaluateChecklistSummary(names, items, state.linkedRules);

  if (!summary.evaluations.length) {
    $('checkResults').append(
      el('span', { class: 'muted', textContent: 'No rules defined in this checklist.' })
    );
  } else {
    summary.evaluations.forEach((ev, idx) => {
      const isGreen = ev.status === 'green';
      const icon = isGreen ? '✅' : '❌';
      const serial = String(idx + 1).padStart(2, '0');

      let tagClass = 'tagRed';
      let tagText = 'MISSING';
      if (isGreen) {
        tagClass = ev.isLinked ? 'tagLinked' : 'tagGreen';
        tagText = ev.isLinked ? 'LINKED' : 'PRESENT';
      }

      const actions = [];
      if (!isGreen) {
        const existingFU = getPendingFollowUp(dir.name, ev.rule.name);
        if (existingFU) {
          const dateBtn = el('button', {
            class: 'rowActionBtn dateBtn activeDate',
            type: 'button',
            title: `Promised on ${existingFU.promisedDate} (${existingFU.note || 'No note'}). Click to update.`,
            textContent: `📅 Due: ${formatFriendlyDate(existingFU.promisedDate)}`,
            onclick: (e) => {
              e.stopPropagation();
              openFollowUpModal(dir.name, dir.name, ev.rule.name, existingFU);
            }
          });
          actions.push(dateBtn);
        } else {
          const dateBtn = el('button', {
            class: 'rowActionBtn dateBtn',
            type: 'button',
            title: 'Set promised date when student will bring this document',
            textContent: '📅 Due Date',
            onclick: (e) => {
              e.stopPropagation();
              openFollowUpModal(dir.name, dir.name, ev.rule.name);
            }
          });
          actions.push(dateBtn);
        }

        const pickBtn = el('button', {
          class: 'rowActionBtn pickBtn',
          type: 'button',
          title: 'Pick scanned file from PC, copy to student folder and auto-rename',
          textContent: '📥 Pick File',
          onclick: (e) => {
            e.stopPropagation();
            pickAndImportDocument(dir, ev.rule.name, dir.name, existingFU?.id);
          }
        });
        actions.push(pickBtn);
      }

      actions.push(el('span', { class: `checkStatusTag ${tagClass}`, textContent: tagText }));

      const row = el('div', { 
        class: `checkRow ${ev.status}`,
        title: ev.note
      }, [
        el('div', { class: 'checkRowLeft' }, [
          el('span', { class: 'checkSerial', textContent: `${serial}.` }),
          el('span', { class: 'checkIcon', textContent: icon }),
          el('b', { class: 'checkTitle', textContent: ev.rule.name })
        ]),
        el('div', { class: 'checkRowActions' }, actions)
      ]);

      $('checkResults').append(row);
    });
  }

  // Right Column Dashboard
  const dashFolderName = $('dashFolderName');
  if (dashFolderName) dashFolderName.textContent = `📁 ${dir.name}`;
  
  const gaugePercent = $('gaugePercent');
  if (gaugePercent) gaugePercent.textContent = `${summary.percentComplete}%`;
  
  const gauge = $('gaugeCircle');
  if (gauge) {
    if (summary.percentComplete === 100) {
      gauge.style.borderColor = 'var(--green)';
      gauge.style.color = 'var(--green)';
    } else if (summary.percentComplete >= 70) {
      gauge.style.borderColor = 'var(--primary)';
      gauge.style.color = 'var(--primary)';
    } else {
      gauge.style.borderColor = '#f59e0b';
      gauge.style.color = '#f59e0b';
    }
  }

  if ($('metricVerified')) $('metricVerified').textContent = summary.foundCount;
  if ($('metricMissing')) $('metricMissing').textContent = summary.missingCount;
  if ($('metricFolderFiles')) $('metricFolderFiles').textContent = summary.totalFolderFiles;
  if ($('metricTotalRequired')) $('metricTotalRequired').textContent = summary.totalRequired;

  const banner = $('readinessBanner');
  const readinessText = $('readinessText');
  if (banner && readinessText) {
    if (summary.isReady) {
      banner.className = 'readinessBanner ready';
      readinessText.textContent = `🎉 100% Ready! Verified for Form Submission`;
    } else {
      banner.className = 'readinessBanner pending';
      readinessText.textContent = `⚠️ Action Needed: ${summary.missingCount} Document(s) Pending`;
    }
  }

  const missingWrap = $('missingQuickWrap');
  const missingTags = $('missingTagList');
  if (missingWrap && missingTags) {
    clear(missingTags);
    if (summary.missingList.length > 0) {
      missingWrap.style.display = 'block';
      summary.missingList.forEach(m => {
        missingTags.append(el('span', { class: 'missingTagChip', textContent: `❌ ${m}` }));
      });
    } else {
      missingWrap.style.display = 'none';
    }
  }

  $('checkSummary').textContent = `${summary.foundCount} Verified · ${summary.missingCount} Missing · ${summary.totalRequired} Total Rules (${summary.percentComplete}% Completed)`;
}

async function runMasterBatchAudit(forceRefresh = false) {
  if (!folders.length) {
    showToast('Please select a parent folder containing student folders first.', 'warning');
    return;
  }

  const checklistKey = $('batchAuditChecklistSelect')?.value || $('checklistSelect')?.value;
  const items = state.checklists[checklistKey] || [];
  if (!items.length) {
    showToast('Please configure rules for this checklist first.', 'warning');
    return;
  }

  const batchTitle = folders[0]?.name || 'Student Batch';
  if ($('batchAuditSub')) {
    $('batchAuditSub').textContent = `Auditing ${folders.length} students in '${batchTitle}' against '${checklistKey}' with Document Linking.`;
  }

  try {
    updateProgressBar(10, `Auditing batch: 0 / ${folders.length} students...`);
    const results = [];
    
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const percent = Math.round(10 + ((i + 1) / folders.length) * 85);
      updateProgressBar(percent, `Auditing student ${i + 1} of ${folders.length}: ${folder.name}...`);
      
      const names = await allFileNames(folder);
      const summary = evaluateChecklistSummary(names, items, state.linkedRules);
      
      results.push({
        folderName: folder.name,
        studentName: folder.name.replace(/^[0-9]+[_\s.-]*/, ''),
        folderHandle: folder,
        folderIndex: i,
        summary
      });
    }

    hideProgressBar();
    cachedBatchResults = results;
    renderBatchAuditMatrix();
  } catch (err) {
    hideProgressBar();
    showToast(`Batch audit error: ${err.message}`, 'error');
  }
}

function renderBatchAuditMatrix() {
  const container = $('batchMatrixContainer');
  if (!container) return;
  clear(container);

  const checklistKey = $('batchAuditChecklistSelect')?.value || $('checklistSelect')?.value;
  const rules = state.checklists[checklistKey] || [];

  const totalStudents = cachedBatchResults.length;
  const readyCount = cachedBatchResults.filter(x => x.summary.isReady).length;
  const pendingCount = totalStudents - readyCount;
  
  let totalVerified = 0;
  const totalPossible = totalStudents * rules.length;
  cachedBatchResults.forEach(x => { totalVerified += x.summary.foundCount; });
  const compliancePercent = totalPossible > 0 ? Math.round((totalVerified / totalPossible) * 100) : 0;

  if ($('batchCountAll')) $('batchCountAll').textContent = totalStudents;
  if ($('batchCountReady')) $('batchCountReady').textContent = readyCount;
  if ($('batchCountPending')) $('batchCountPending').textContent = pendingCount;

  if ($('batchKpiTotalStudents')) $('batchKpiTotalStudents').textContent = totalStudents;
  if ($('batchKpiReadyStudents')) $('batchKpiReadyStudents').textContent = readyCount;
  if ($('batchKpiPendingStudents')) $('batchKpiPendingStudents').textContent = pendingCount;
  if ($('batchKpiCompliance')) $('batchKpiCompliance').textContent = `${compliancePercent}%`;

  const search = ($('batchAuditSearchInput')?.value || '').trim().toLowerCase();
  let filtered = cachedBatchResults;

  if (batchAuditFilter === 'ready') {
    filtered = filtered.filter(x => x.summary.isReady);
  } else if (batchAuditFilter === 'pending') {
    filtered = filtered.filter(x => !x.summary.isReady);
  }

  if (search) {
    filtered = filtered.filter(x =>
      x.folderName.toLowerCase().includes(search) ||
      x.studentName.toLowerCase().includes(search)
    );
  }

  if (!filtered.length) {
    container.append(
      el('div', { class: 'emptyState', style: 'padding: 30px; min-height: auto;' }, [
        el('p', { textContent: 'No student records match this filter.' })
      ])
    );
    return;
  }

  const table = el('table', { class: 'batchAuditTable' });
  
  const thRow = el('tr', {}, [
    el('th', { class: 'colSr', style: 'width: 35px;' }, [el('span', { textContent: '#' })]),
    el('th', { class: 'colStudent', style: 'min-width: 170px;' }, [el('span', { textContent: 'Student Name / Folder' })]),
    ...rules.map(r => el('th', { title: r.name, textContent: r.short || r.name.slice(0, 14) })),
    el('th', { style: 'width: 65px;', textContent: 'Verified' }),
    el('th', { style: 'width: 50px;', textContent: '%' }),
    el('th', { style: 'width: 90px;', textContent: 'Status' })
  ]);
  table.append(el('thead', {}, [thRow]));

  const tbody = el('tbody');
  filtered.forEach((item, idx) => {
    const evMap = {};
    (item.summary.evaluations || []).forEach(ev => { evMap[ev.rule.name] = ev; });

    const cells = [
      el('td', { style: 'text-align: center; color: var(--muted); font-weight: 700;' }, [
        el('span', { textContent: String(idx + 1).padStart(2, '0') })
      ]),
      el('td', {
        class: 'studentNameCell',
        title: `Click to open '${item.folderName}' in workspace`,
        textContent: `📁 ${item.studentName || item.folderName}`,
        onclick: async () => {
          folderIndex = item.folderIndex;
          await loadFolder(folders[folderIndex]);
          $('batchAuditModal').classList.remove('open');
          showToast(`Opened '${item.studentName || item.folderName}' workspace.`, 'info');
        }
      })
    ];

    rules.forEach(r => {
      const ev = evMap[r.name];
      if (ev && ev.status === 'green') {
        if (ev.isLinked) {
          cells.push(el('td', { class: 'cellLinked', title: ev.note, textContent: '🔗' }));
        } else {
          cells.push(el('td', { class: 'cellOk', title: ev.note, textContent: '✔' }));
        }
      } else {
        cells.push(el('td', {
          class: 'cellMissing',
          title: `Missing: ${r.name}. Click to pick file or set follow-up.`,
          textContent: '✖',
          onclick: () => {
            openFollowUpModal(item.folderName, item.studentName, r.name);
          }
        }));
      }
    });

    const statusBadge = item.summary.isReady
      ? el('span', { class: 'badgeReady', textContent: '100% READY' })
      : el('span', { class: 'badgePending', textContent: `${item.summary.missingCount} PENDING` });

    cells.push(
      el('td', { style: 'text-align: center; font-weight: 800;' }, [
        el('span', { textContent: `${item.summary.foundCount}/${item.summary.totalRequired}` })
      ]),
      el('td', { style: 'text-align: center; font-weight: 800;' }, [
        el('span', { textContent: `${item.summary.percentComplete}%` })
      ]),
      el('td', { style: 'text-align: center;' }, [statusBadge])
    );

    tbody.append(el('tr', {}, cells));
  });

  table.append(tbody);
  container.append(table);
}

function fillChecklistSelects() {
  const options = Object.keys(state.checklists || {});
  const opts = options.map(x => {
    const count = (state.checklists[x] || []).length;
    return el('option', { value: x, textContent: `${x} (${count} Rules)` });
  });

  $('checklistSelect').replaceChildren(...opts.map(o => o.cloneNode(true)));
  $('settingsChecklistSelect').replaceChildren(...opts.map(o => o.cloneNode(true)));
  if ($('batchAuditChecklistSelect')) {
    $('batchAuditChecklistSelect').replaceChildren(...opts.map(o => o.cloneNode(true)));
  }
}

// Native Desktop Folder Data Loader (Zero-Prompt OS level access)
async function loadNativeFolderData(data) {
  const rootPath = data.path;
  const rootName = data.name;
  const subdirs = data.subfolders || [];

  folderIndex = 0;
  navHistory = [];
  historyIndex = -1;

  if (subdirs.length > 0) {
    rootBatchHandle = { name: rootName, nativePath: rootPath, isBatchRoot: true };
    folders = subdirs.map(s => ({
      name: s.name,
      nativePath: s.path,
      kind: 'directory'
    }));
    folderPathTrail = [
      { handle: rootBatchHandle, name: rootName, isBatchRoot: true },
      { handle: folders[0], name: folders[0].name }
    ];
    await loadNativeStudentFolder(folders[0], { explicitTrail: folderPathTrail });
    showToast(`Parent folder '${rootName}' selected (${folders.length} subfolders). 🎓`, 'success');
  } else {
    const singleFolder = { name: rootName, nativePath: rootPath, kind: 'directory' };
    rootBatchHandle = null;
    folders = [singleFolder];
    folderPathTrail = [{ handle: singleFolder, name: rootName, isBatchRoot: false }];
    await loadNativeStudentFolder(singleFolder, { explicitTrail: folderPathTrail });
    showToast(`Folder '${rootName}' selected. 📁`, 'success');
  }
}

async function loadNativeStudentFolder(folderObj, options = {}) {
  const res = await listNativeDirectory(folderObj.nativePath);
  if (!res.success) {
    showToast(`Error loading folder: ${res.error}`, 'error');
    return;
  }

  const rawFiles = res.files || [];
  const wrappedFiles = await Promise.all(rawFiles.map(rf => createNativeFileObject(rf)));

  dir = folderObj;
  files = wrappedFiles;
  syncSuiteFiles(files, dir?.name, dir);
  currentSubfolders = (res.subfolders || []).map(s => ({ name: s.name, nativePath: s.path, kind: 'directory' }));

  selectedIndices = [];
  const preserveActiveIndex = options.preserveActiveIndex !== undefined ? options.preserveActiveIndex : null;
  if (preserveActiveIndex !== null) {
    activeFocusIndex = Math.min(preserveActiveIndex, Math.max(0, wrappedFiles.length - 1));
  } else {
    activeFocusIndex = 0;
  }
  inputsState = {};

  if (options.explicitTrail) {
    folderPathTrail = [...options.explicitTrail];
  }

  const matchedIdx = folders.findIndex(f => f.name.toLowerCase() === folderObj.name.toLowerCase());
  if (matchedIdx >= 0) folderIndex = matchedIdx;
  const countText = folders.length > 1 && matchedIdx >= 0 ? ` (${folderIndex + 1}/${folders.length})` : '';
  $('folderName').innerHTML = `<strong>Folder:</strong> ${folderObj.name}${countText}`;

  renderFiles();
  handleSelectionChange([]);
  runChecklist();
  updateFollowUpDeskBadge();
  renderFolderNavigator();

  const batchBtn = $('openBatchAuditBtn');
  if (batchBtn) batchBtn.disabled = folders.length === 0;
  const batchBadge = $('batchFolderCountBadge');
  if (batchBadge) {
    batchBadge.textContent = folders.length;
    batchBadge.style.display = folders.length > 0 ? 'inline-block' : 'none';
  }
  setDisabled('runChecklist', false);
}

// Events

function handleRenameError(err) {
  const msg = (err && err.message) ? err.message.toLowerCase() : String(err || '');
  if (msg.includes('busy') || msg.includes('locked') || msg.includes('open in') || msg.includes('sharing violation')) {
    dispatchError('CM-201', err.message);
  } else if (msg.includes('already exists') || msg.includes('duplicate')) {
    dispatchError('CM-202', err.message);
  } else if (msg.includes('invalid') || msg.includes('character') || msg.includes('illegal')) {
    dispatchError('CM-203', err.message);
  } else if (msg.includes('permission') || msg.includes('access denied')) {
    dispatchError('CM-102', err.message);
  } else {
    dispatchError('CM-204', err.message);
  }
}

$('selectFolder').onclick = async () => {
  if (!window.showDirectoryPicker) {
    showToast('Direct file access requires Google Chrome or Desktop ClerkMaster.', 'warning');
    return;
  }
  try {
    const root = await window.showDirectoryPicker({ mode: 'readwrite' });
    const subdirs = await collectFolders(root);

    folderIndex = 0;
    navHistory = [];
    historyIndex = -1;

    if (subdirs.length > 0) {
      // It has subfolders (Parent Batch or Multi-folder directory)
      rootBatchHandle = root;
      folders = subdirs;
      folderPathTrail = [
        { handle: root, name: root.name, isBatchRoot: true },
        { handle: folders[0], name: folders[0].name }
      ];
      await loadFolder(folders[0], { explicitTrail: folderPathTrail });
      showToast(`Parent folder '${root.name}' selected (${folders.length} subfolders). 🎓`, 'success');
    } else {
      // Single leaf folder with files directly
      rootBatchHandle = null;
      folders = [root];
      folderPathTrail = [{ handle: root, name: root.name, isBatchRoot: false }];
      await loadFolder(root, { explicitTrail: folderPathTrail });
      showToast(`Folder '${root.name}' selected. 📁`, 'success');
    }
  } catch (err) {
    if (err.name === 'AbortError') return; // User clicked Cancel in Windows Dialog - clean return
    showToast(`Folder access error: ${err.message}`, 'error');
  }
};

// --------------------------------------------------------------------------
// 2. Direct File Selection & Drag-and-Drop (Shows ALL files inside dialog)
// --------------------------------------------------------------------------
async function loadFilesDirectly(fileList, folderName = 'Selected Documents') {
  if (!fileList || !fileList.length) return;
  const wrappedFiles = [];
  for (const item of fileList) {
    if (item instanceof File) {
      wrappedFiles.push(item);
    } else if (item.getFile) {
      try {
        const f = await item.getFile();
        f.handle = item;
        wrappedFiles.push(f);
      } catch (err) {
        console.warn('Could not read file handle:', err);
      }
    }
  }

  if (!wrappedFiles.length) {
    showToast('No readable files were selected.', 'warning');
    return;
  }

  wrappedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  dir = {
    name: folderName,
    kind: 'directory',
    getFileHandle: async (name) => {
      const match = wrappedFiles.find(f => f.name === name);
      if (match && match.handle) return match.handle;
      throw new Error(`File '${name}' handle not found`);
    }
  };

  files = wrappedFiles;
  syncSuiteFiles(files, dir.name, dir);
  currentSubfolders = [];
  selectedIndices = [];
  activeFocusIndex = 0;
  inputsState = {};
  rootBatchHandle = null;
  folders = [dir];
  folderIndex = 0;
  folderPathTrail = [{ handle: dir, name: dir.name, isBatchRoot: false }];
  navHistory = [{ handle: dir, name: dir.name, trail: [...folderPathTrail] }];
  historyIndex = 0;

  $('folderName').innerHTML = `<strong>Folder:</strong> ${folderName} (${files.length} Files)`;
  renderFiles();
  handleSelectionChange([]);
  runChecklist();
  updateFollowUpDeskBadge();
  renderFolderNavigator();
  showToast(`${files.length} file(s) loaded successfully! 📄`, 'success');
}

// Wire up "Add / Select Files" Button
const selectFilesBtn = $('selectFilesBtn');
if (selectFilesBtn) {
  selectFilesBtn.onclick = async () => {
    if (window.showOpenFilePicker) {
      try {
        const fileHandles = await window.showOpenFilePicker({
          multiple: true
        });
        if (!fileHandles || !fileHandles.length) return;
        await loadFilesDirectly(fileHandles, 'Selected Files');
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed dialog
        showToast(`File picker error: ${err.message}`, 'error');
      }
    } else {
      const fallbackInput = $('fallbackFileInput');
      if (fallbackInput) {
        fallbackInput.value = '';
        fallbackInput.onchange = async () => {
          if (fallbackInput.files && fallbackInput.files.length) {
            await loadFilesDirectly(Array.from(fallbackInput.files), 'Selected Files');
          }
        };
        fallbackInput.click();
      }
    }
  };
}

// Drag & Drop Handler: Drag loose files or an entire folder directly into ClerkMaster
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

window.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  const dt = e.dataTransfer;
  if (!dt) return;

  if (dt.items && dt.items.length) {
    const handles = [];
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i];
      if (typeof item.getAsFileSystemHandle === 'function') {
        try {
          const handle = await item.getAsFileSystemHandle();
          if (handle) handles.push(handle);
        } catch {}
      }
    }

    if (handles.length === 1 && handles[0].kind === 'directory') {
      const root = handles[0];
      const subdirs = await collectFolders(root);
      folderIndex = 0;
      navHistory = [];
      historyIndex = -1;

      if (subdirs.length > 0) {
        rootBatchHandle = root;
        folders = subdirs;
        folderPathTrail = [
          { handle: root, name: root.name, isBatchRoot: true },
          { handle: folders[0], name: folders[0].name }
        ];
        await loadFolder(folders[0], { explicitTrail: folderPathTrail });
        showToast(`Parent folder '${root.name}' dropped (${folders.length} subfolders). 🎓`, 'success');
      } else {
        rootBatchHandle = null;
        folders = [root];
        folderPathTrail = [{ handle: root, name: root.name, isBatchRoot: false }];
        await loadFolder(root, { explicitTrail: folderPathTrail });
        showToast(`Folder '${root.name}' dropped. 📁`, 'success');
      }
      return;
    } else if (handles.length > 0) {
      await loadFilesDirectly(handles, 'Dropped Documents');
      return;
    }
  }

  if (dt.files && dt.files.length) {
    await loadFilesDirectly(Array.from(dt.files), 'Dropped Documents');
  }
});

// View Mode Toggle Events
const viewFocusBtn = $('viewFocusBtn');
const viewTableBtn = $('viewTableBtn');

if (viewFocusBtn && viewTableBtn) {
  viewFocusBtn.onclick = () => {
    if (currentViewMode === 'focus') return;
    currentViewMode = 'focus';
    viewFocusBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderFiles();
  };

  viewTableBtn.onclick = () => {
    if (currentViewMode === 'table') return;
    currentViewMode = 'table';
    viewTableBtn.classList.add('active');
    viewFocusBtn.classList.remove('active');
    renderFiles();
  };
}

/**
 * 1-Click Scan-to-Folder Importer & Auto-Renamer (The Picker)
 */
async function pickAndImportDocument(folderHandle, documentName, studentName, followUpId = null) {
  if (!folderHandle) {
    showToast('Please open or select a student folder first.', 'warning');
    return;
  }

  let fileToImport = null;

  if (window.showOpenFilePicker) {
    try {
      const handles = await window.showOpenFilePicker({
        types: [{
          description: 'Document Files (*.pdf, images, docx)',
          accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.jpg', '.jpeg', '.png'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc']
          }
        }],
        multiple: false
      });
      if (handles && handles.length > 0) {
        fileToImport = await handles[0].getFile();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('showOpenFilePicker error, falling back:', err);
    }
  }

  if (!fileToImport) {
    const fallbackInput = $('fallbackScanPickerInput');
    if (fallbackInput) {
      fileToImport = await new Promise(resolve => {
        fallbackInput.value = '';
        fallbackInput.onchange = e => resolve(e.target.files?.[0] || null);
        fallbackInput.click();
      });
    }
  }

  if (!fileToImport) return;

  const ext = fileToImport.name.slice(fileToImport.name.lastIndexOf('.')) || '.pdf';
  const targetName = computeImportTargetName(documentName, studentName, ext);

  try {
    updateProgressBar(20, `Importing and renaming to '${targetName}'...`);
    const newHandle = await folderHandle.getFileHandle(targetName, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(await fileToImport.arrayBuffer());
    await writable.close();
    hideProgressBar();

    // Auto-resolve follow-up!
    resolveFollowUp(folderHandle.name, documentName);

    // If currently viewing this folder, reload!
    if (dir && dir.name === folderHandle.name) {
      if (dir.nativePath) {
      await loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
    } else {
      await loadFolder(dir);
    }
    }

    updateFollowUpDeskBadge();
    renderFollowUpDesk();
    showToast(`📥 '${targetName}' imported, renamed & verified! ✅`, 'success');
  } catch (err) {
    hideProgressBar();
    showToast(`Failed to import document: ${err.message}`, 'error');
  }
}

/**
 * Open Modal to set promised submission date
 */
function openFollowUpModal(folderName, studentName, documentName, existingFU = null) {
  activeFollowUpTarget = { folderName, studentName, documentName, existingFU };
  
  if ($('fuStudentName')) $('fuStudentName').textContent = `Student: 📁 ${studentName || folderName}`;
  if ($('fuDocName')) $('fuDocName').textContent = `Missing Document: 📄 ${documentName}`;
  
  const dateInput = $('fuDateInput');
  if (dateInput) {
    dateInput.value = existingFU ? existingFU.promisedDate : getTomorrowDateString();
    dateInput.min = getTodayDateString();
  }
  
  if ($('fuNoteInput')) {
    $('fuNoteInput').value = existingFU ? existingFU.note || '' : '';
  }
  
  const deleteBtn = $('deleteFollowUpBtn');
  if (deleteBtn) {
    deleteBtn.style.display = existingFU ? 'inline-block' : 'none';
  }
  
  $('followUpModal').classList.add('open');
}

/**
 * Update Header Badge & Morning Alert Banner
 */
function updateFollowUpDeskBadge() {
  const stats = getFollowUpStats();
  const badge = $('topFollowUpBadge');
  if (badge) {
    badge.textContent = stats.needsAttentionCount;
    badge.style.display = stats.needsAttentionCount > 0 ? 'inline-block' : 'none';
  }

  const morningBanner = $('morningFollowUpBanner');
  if (morningBanner) {
    if (stats.needsAttentionCount > 0) {
      morningBanner.style.display = 'flex';
      const sub = $('alertBannerSub');
      if (sub) {
        const parts = [];
        if (stats.todayCount > 0) parts.push(`🟡 ${stats.todayCount} document(s) due today`);
        if (stats.overdueCount > 0) parts.push(`🔴 ${stats.overdueCount} overdue`);
        sub.textContent = parts.join(' · ') || 'Student submissions scheduled.';
      }
    } else {
      morningBanner.style.display = 'none';
    }
  }
}

/**
 * Render Follow-up Desk items and KPI metrics
 */
function renderFollowUpDesk() {
  const container = $('deskItemsContainer');
  if (!container) return;
  clear(container);

  const stats = getFollowUpStats();
  if ($('kpiOverdueCount')) $('kpiOverdueCount').textContent = stats.overdueCount;
  if ($('kpiTodayCount')) $('kpiTodayCount').textContent = stats.todayCount;
  if ($('kpiUpcomingCount')) $('kpiUpcomingCount').textContent = stats.upcomingCount;
  if ($('kpiTotalPending')) $('kpiTotalPending').textContent = stats.totalPending;

  const allList = loadFollowUps();
  const search = ($('deskSearchInput')?.value || '').trim().toLowerCase();

  let filtered = allList;
  if (activeDeskFilter === 'attention') {
    filtered = allList.filter(x => x.status === 'pending' && (getDateUrgency(x.promisedDate) === 'today' || getDateUrgency(x.promisedDate) === 'overdue'));
  } else if (activeDeskFilter === 'all') {
    filtered = allList.filter(x => x.status === 'pending');
  } else if (activeDeskFilter === 'resolved') {
    filtered = allList.filter(x => x.status === 'resolved');
  }

  if (search) {
    filtered = filtered.filter(x =>
      (x.studentName || '').toLowerCase().includes(search) ||
      (x.folderName || '').toLowerCase().includes(search) ||
      (x.documentName || '').toLowerCase().includes(search) ||
      (x.note || '').toLowerCase().includes(search)
    );
  }

  filtered.sort((a, b) => {
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    if (a.status !== 'resolved' && b.status === 'resolved') return -1;
    return a.promisedDate.localeCompare(b.promisedDate);
  });

  if (!filtered.length) {
    container.append(
      el('div', { class: 'emptyState', style: 'padding: 30px; min-height: auto;' }, [
        el('p', { textContent: activeDeskFilter === 'attention' ? '🎉 No overdue or today documents! All caught up.' : 'No follow-up documents in this view.' })
      ])
    );
    return;
  }

  filtered.forEach(item => {
    const urgency = item.status === 'resolved' ? 'resolved' : getDateUrgency(item.promisedDate);
    
    let dueTagClass = 'dueUpcoming';
    let dueTagText = `Due: ${formatFriendlyDate(item.promisedDate)}`;
    let rowStatusClass = 'statusUpcoming';

    if (item.status === 'resolved') {
      dueTagClass = 'dueResolved';
      dueTagText = `✅ Received`;
      rowStatusClass = 'statusResolved';
    } else if (urgency === 'overdue') {
      dueTagClass = 'dueOverdue';
      dueTagText = `🔴 Overdue (${formatFriendlyDate(item.promisedDate)})`;
      rowStatusClass = 'statusOverdue';
    } else if (urgency === 'today') {
      dueTagClass = 'dueToday';
      dueTagText = `🟡 Due Today`;
      rowStatusClass = 'statusToday';
    }

    const info = el('div', { class: 'deskItemInfo' }, [
      el('div', { class: 'deskItemTop' }, [
        el('span', { class: 'deskStudentName', textContent: `📁 ${item.studentName || item.folderName}` }),
        el('span', { class: 'deskDocName', textContent: `📄 ${item.documentName}` }),
        el('span', { class: `deskDueTag ${dueTagClass}`, textContent: dueTagText })
      ]),
      item.note ? el('div', { class: 'deskNote', textContent: `Note: ${item.note}` }) : null
    ].filter(Boolean));

    const actions = el('div', { class: 'deskItemActions' });

    const goBtn = el('button', {
      class: 'btn soft btnSm',
      type: 'button',
      textContent: '📂 Go to Folder',
      onclick: async () => {
        const matchIdx = folders.findIndex(f => f.name.toLowerCase() === item.folderName.toLowerCase());
        if (matchIdx >= 0) {
          folderIndex = matchIdx;
          await loadFolder(folders[folderIndex]);
          $('followUpDeskModal').classList.remove('open');
          showToast(`Opened folder for '${item.studentName || item.folderName}'.`, 'info');
        } else if (dir && dir.name.toLowerCase() === item.folderName.toLowerCase()) {
          $('followUpDeskModal').classList.remove('open');
        } else {
          showToast(`Folder '${item.folderName}' is not in the currently open parent workspace.`, 'warning');
        }
      }
    });
    actions.append(goBtn);

    if (item.status !== 'resolved') {
      const pickBtn = el('button', {
        class: 'btn primary btnSm',
        type: 'button',
        textContent: '📥 Pick File',
        onclick: async () => {
          let targetFolder = null;
          if (dir && dir.name.toLowerCase() === item.folderName.toLowerCase()) {
            targetFolder = dir;
          } else {
            targetFolder = folders.find(f => f.name.toLowerCase() === item.folderName.toLowerCase());
          }

          if (targetFolder) {
            await pickAndImportDocument(targetFolder, item.documentName, item.studentName, item.id);
          } else {
            showToast(`Please open student folder '${item.folderName}' first to import directly.`, 'warning');
          }
        }
      });
      actions.append(pickBtn);
    }

    const dismissBtn = el('button', {
      class: 'btn soft btnSm',
      type: 'button',
      title: 'Remove this follow-up',
      textContent: '✕',
      onclick: () => {
        removeFollowUp(item.id);
        renderFollowUpDesk();
        updateFollowUpDeskBadge();
        if (dir) runChecklist();
        showToast('Follow-up entry removed.', 'info');
      }
    });
    actions.append(dismissBtn);

    const row = el('div', { class: `deskItemRow ${rowStatusClass}` }, [info, actions]);
    container.append(row);
  });
}

// Follow-up Modals Event Handlers
const openDeskBtn = $('openFollowUpDesk');
if (openDeskBtn) {
  openDeskBtn.onclick = () => {
    $('followUpDeskModal').classList.add('open');
    renderFollowUpDesk();
  };
}

const checklistDeskBtn = $('checklistFollowUpDeskBtn');
if (checklistDeskBtn) {
  checklistDeskBtn.onclick = () => {
    $('followUpDeskModal').classList.add('open');
    renderFollowUpDesk();
  };
}

const alertViewDeskBtn = $('alertViewDeskBtn');
if (alertViewDeskBtn) {
  alertViewDeskBtn.onclick = () => {
    $('followUpDeskModal').classList.add('open');
    renderFollowUpDesk();
  };
}

$('closeFollowUpDeskModal').onclick = () => $('followUpDeskModal').classList.remove('open');
$('closeFollowUpModal').onclick = () => $('followUpModal').classList.remove('open');

// Quick Date Buttons
$('fuQuickTomorrow').onclick = () => {
  $('fuDateInput').value = getTomorrowDateString(1);
};
$('fuQuick2Days').onclick = () => {
  $('fuDateInput').value = getTomorrowDateString(2);
};
$('fuQuickNextMonday').onclick = () => {
  $('fuDateInput').value = getNextMondayDateString();
};

// Save & Delete Follow-up Buttons
$('saveFollowUpBtn').onclick = () => {
  const dateVal = $('fuDateInput').value;
  if (!dateVal) {
    showToast('Please select a promised submission date.', 'warning');
    return;
  }
  const noteVal = $('fuNoteInput').value.trim();
  addOrUpdateFollowUp({
    folderName: activeFollowUpTarget.folderName,
    studentName: activeFollowUpTarget.studentName,
    documentName: activeFollowUpTarget.documentName,
    promisedDate: dateVal,
    note: noteVal
  });
  $('followUpModal').classList.remove('open');
  if (dir) runChecklist();
  updateFollowUpDeskBadge();
  renderFollowUpDesk();
  showToast(`Follow-up saved for '${activeFollowUpTarget.documentName}' on ${formatFriendlyDate(dateVal)}! 📅`, 'success');
};

const deleteFollowUpBtn = $('deleteFollowUpBtn');
if (deleteFollowUpBtn) {
  deleteFollowUpBtn.onclick = () => {
    if (activeFollowUpTarget?.existingFU?.id) {
      removeFollowUp(activeFollowUpTarget.existingFU.id);
      $('followUpModal').classList.remove('open');
      if (dir) runChecklist();
      updateFollowUpDeskBadge();
      renderFollowUpDesk();
      showToast('Follow-up reminder removed.', 'info');
    }
  };
}

// Desk Filter Tabs
const deskFilterAttention = $('deskFilterAttention');
const deskFilterAll = $('deskFilterAll');
const deskFilterResolved = $('deskFilterResolved');

if (deskFilterAttention && deskFilterAll && deskFilterResolved) {
  deskFilterAttention.onclick = () => {
    activeDeskFilter = 'attention';
    deskFilterAttention.classList.add('active');
    deskFilterAll.classList.remove('active');
    deskFilterResolved.classList.remove('active');
    renderFollowUpDesk();
  };

  deskFilterAll.onclick = () => {
    activeDeskFilter = 'all';
    deskFilterAll.classList.add('active');
    deskFilterAttention.classList.remove('active');
    deskFilterResolved.classList.remove('active');
    renderFollowUpDesk();
  };

  deskFilterResolved.onclick = () => {
    activeDeskFilter = 'resolved';
    deskFilterResolved.classList.add('active');
    deskFilterAttention.classList.remove('active');
    deskFilterAll.classList.remove('active');
    renderFollowUpDesk();
  };
}

const deskSearchInput = $('deskSearchInput');
if (deskSearchInput) {
  deskSearchInput.oninput = () => renderFollowUpDesk();
}

// Follow-up Desk Export Handlers
const fuDownloadExcel = $('fuDownloadExcel');
if (fuDownloadExcel) {
  fuDownloadExcel.onclick = () => {
    const list = loadFollowUps();
    if (!list.length) {
      showToast('No follow-up records found to export.', 'warning');
      return;
    }
    const csvContent = generateFollowUpCSV(list);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Student_FollowUp_Action_Sheet_${dateStr}.csv`;
    downloadCSV(filename, csvContent);
    showToast('Follow-up desk Excel CSV downloaded! 📊', 'success');
  };
}

const fuDownloadPdf = $('fuDownloadPdf');
if (fuDownloadPdf) {
  fuDownloadPdf.onclick = () => {
    const list = loadFollowUps().filter(x => x.status !== 'resolved');
    if (!list.length) {
      showToast('No pending follow-ups to print on action sheet.', 'info');
      return;
    }
    openFollowUpPrintSheet({
      followUpList: list
    });
  };
}

// Master Batch Audit Modal & Export Handlers
const openBatchAuditModal = () => {
  if (!folders.length) {
    showToast('Please select a parent folder containing student folders first.', 'warning');
    return;
  }
  $('batchAuditModal').classList.add('open');
  runMasterBatchAudit();
};

const openBatchAuditBtn = $('openBatchAuditBtn');
if (openBatchAuditBtn) {
  openBatchAuditBtn.onclick = openBatchAuditModal;
}

const bulkChecklistBtn = $('bulkChecklist');
if (bulkChecklistBtn) {
  bulkChecklistBtn.onclick = openBatchAuditModal;
}

const closeBatchAuditModal = $('closeBatchAuditModal');
if (closeBatchAuditModal) {
  closeBatchAuditModal.onclick = () => $('batchAuditModal').classList.remove('open');
}

const batchAuditChecklistSelect = $('batchAuditChecklistSelect');
if (batchAuditChecklistSelect) {
  batchAuditChecklistSelect.onchange = () => runMasterBatchAudit(true);
}

const batchAuditSearchInput = $('batchAuditSearchInput');
if (batchAuditSearchInput) {
  batchAuditSearchInput.oninput = () => renderBatchAuditMatrix();
}

const batchFilterAll = $('batchFilterAll');
const batchFilterReady = $('batchFilterReady');
const batchFilterPending = $('batchFilterPending');

if (batchFilterAll && batchFilterReady && batchFilterPending) {
  batchFilterAll.onclick = () => {
    batchAuditFilter = 'all';
    batchFilterAll.classList.add('active');
    batchFilterReady.classList.remove('active');
    batchFilterPending.classList.remove('active');
    renderBatchAuditMatrix();
  };

  batchFilterReady.onclick = () => {
    batchAuditFilter = 'ready';
    batchFilterReady.classList.add('active');
    batchFilterAll.classList.remove('active');
    batchFilterPending.classList.remove('active');
    renderBatchAuditMatrix();
  };

  batchFilterPending.onclick = () => {
    batchAuditFilter = 'pending';
    batchFilterPending.classList.add('active');
    batchFilterAll.classList.remove('active');
    batchFilterReady.classList.remove('active');
    renderBatchAuditMatrix();
  };
}

const batchDownloadExcel = $('batchDownloadExcel');
if (batchDownloadExcel) {
  batchDownloadExcel.onclick = () => {
    if (!cachedBatchResults.length) {
      showToast('No batch audit results to export.', 'warning');
      return;
    }
    const checklistKey = $('batchAuditChecklistSelect')?.value || $('checklistSelect')?.value;
    const rules = state.checklists[checklistKey] || [];
    const csvContent = generateBatchAuditCSV(cachedBatchResults, rules, checklistKey);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `Batch_Audit_Matrix_${checklistKey.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`;
    downloadCSV(filename, csvContent);
    showToast('Batch audit Excel CSV downloaded! 📊', 'success');
  };
}

const batchDownloadPdf = $('batchDownloadPdf');
if (batchDownloadPdf) {
  batchDownloadPdf.onclick = () => {
    if (!cachedBatchResults.length) {
      showToast('No batch audit results to print.', 'warning');
      return;
    }
    const checklistKey = $('batchAuditChecklistSelect')?.value || $('checklistSelect')?.value;
    const rules = state.checklists[checklistKey] || [];
    const batchName = folders[0]?.name ? `${folders[0].name} (Batch of ${folders.length})` : 'Student Batch';

    const totalStudents = cachedBatchResults.length;
    const readyCount = cachedBatchResults.filter(x => x.summary.isReady).length;
    const pendingCount = totalStudents - readyCount;
    let totalVerified = 0;
    const totalPossible = totalStudents * rules.length;
    cachedBatchResults.forEach(x => { totalVerified += x.summary.foundCount; });
    const compliancePercent = totalPossible > 0 ? Math.round((totalVerified / totalPossible) * 100) : 0;

    openLandscapePrintReport({
      title: 'Student Document Verification & Audit Matrix',
      subtitle: `Master Batch Audit for ${totalStudents} Students`,
      batchName,
      checklistName: checklistKey,
      rules,
      results: cachedBatchResults,
      stats: {
        totalStudents,
        readyCount,
        pendingCount,
        compliancePercent
      }
    });
  };
}

// Folder Navigator Event Listeners
const folderSearchInput = $('folderSearchInput');
if (folderSearchInput) {
  folderSearchInput.oninput = () => renderFolderReelTrack();
}

const folderSearchClearBtn = $('folderSearchClearBtn');
if (folderSearchClearBtn) {
  folderSearchClearBtn.onclick = () => {
    if (folderSearchInput) folderSearchInput.value = '';
    renderFolderReelTrack();
    folderSearchInput?.focus();
  };
}

const reelScrollLeft = $('reelScrollLeft');
const reelScrollRight = $('reelScrollRight');
const folderReelTrack = $('folderReelTrack');

if (reelScrollLeft && folderReelTrack) {
  reelScrollLeft.onclick = () => folderReelTrack.scrollBy({ left: -260, behavior: 'smooth' });
}
if (reelScrollRight && folderReelTrack) {
  reelScrollRight.onclick = () => folderReelTrack.scrollBy({ left: 260, behavior: 'smooth' });
}

const navBackBtn = $('navBackBtn');
if (navBackBtn) {
  navBackBtn.onclick = async () => {
    if (historyIndex > 0) {
      historyIndex--;
      const target = navHistory[historyIndex];
      if (target) await loadFolder(target.handle, { isNavAction: true, explicitTrail: target.trail });
    }
  };
}

const navForwardBtn = $('navForwardBtn');
if (navForwardBtn) {
  navForwardBtn.onclick = async () => {
    if (historyIndex < navHistory.length - 1) {
      historyIndex++;
      const target = navHistory[historyIndex];
      if (target) await loadFolder(target.handle, { isNavAction: true, explicitTrail: target.trail });
    }
  };
}

const navUpBtn = $('navUpBtn');
if (navUpBtn) {
  navUpBtn.onclick = async () => {
    if (folderPathTrail.length > 1) {
      const parentCrumb = folderPathTrail[folderPathTrail.length - 2];
      const nextTrail = folderPathTrail.slice(0, -1);
      await loadFolder(parentCrumb.handle, { explicitTrail: nextTrail });
    }
  };
}

// Global Explorer Keyboard Navigation (1..9, Alt+1..9, Backspace, Enter in Search)
window.addEventListener('keydown', async event => {
  if (document.querySelector('.modal.show') || document.querySelector('.modal[style*="display: flex"]')) {
    return;
  }

  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  const isEditingText = (activeTag === 'input' || activeTag === 'textarea');
  const key = event.key;

  // 1. Alt + 1..9 (Works from anywhere, even while editing text or searching!)
  if (event.altKey && !event.ctrlKey && !event.metaKey && key >= '1' && key <= '9') {
    const targetItem = activeReelShortcuts.get(key);
    if (targetItem) {
      event.preventDefault();
      await triggerFolderItemOpen(targetItem);
      return;
    }
  }

  // 2. Backspace for Going Up / Back in Folder Hierarchy
  if (key === 'Backspace') {
    if (!isEditingText) {
      event.preventDefault();
      const upBtn = $('navUpBtn');
      const backBtn = $('navBackBtn');
      if (upBtn && !upBtn.disabled) {
        upBtn.click();
      } else if (backBtn && !backBtn.disabled) {
        backBtn.click();
      }
      return;
    } else if (event.altKey) {
      event.preventDefault();
      $('navUpBtn')?.click() || $('navBackBtn')?.click();
      return;
    }
  }

  // 3. Bare 1..9 (When NOT editing an input, direct folder jump!)
  if (!isEditingText && !event.altKey && !event.ctrlKey && !event.metaKey) {
    if (key >= '1' && key <= '9') {
      const targetItem = activeReelShortcuts.get(key);
      if (targetItem) {
        event.preventDefault();
        await triggerFolderItemOpen(targetItem);
        return;
      }
    }
  }

  // 4. In Folder Search Input: Pressing Enter opens the first match (KEY: 1)
  if (document.activeElement === $('folderSearchInput') && key === 'Enter') {
    event.preventDefault();
    const firstItem = activeReelShortcuts.get('1');
    if (firstItem) {
      await triggerFolderItemOpen(firstItem);
      $('folderSearchInput')?.blur();
    }
  }
});

$('directRename').onclick = renameSelectedFiles;
$('runChecklist').onclick = runChecklist;
$('checklistSelect').onchange = () => dir && runChecklist();
$('refreshFolder').onclick = () => {
  if (!dir) return;
  if (dir.nativePath) {
    loadNativeStudentFolder(dir, { explicitTrail: folderPathTrail });
  } else {
    loadFolder(dir, { explicitTrail: folderPathTrail });
  }
};

$('nextFolder').onclick = async () => {
  if (folderIndex < folders.length - 1) {
    folderIndex++;
    const nextStudent = folders[folderIndex];
    const explicitTrail = rootBatchHandle
      ? [{ handle: rootBatchHandle, name: rootBatchHandle.name, isBatchRoot: true }, { handle: nextStudent, name: nextStudent.name }]
      : [{ handle: nextStudent, name: nextStudent.name, isBatchRoot: false }];
    if (nextStudent.nativePath) {
      await loadNativeStudentFolder(nextStudent, { explicitTrail });
    } else {
      await loadFolder(nextStudent, { explicitTrail });
    }
  }
};

$('prevFolder').onclick = async () => {
  if (folderIndex > 0) {
    folderIndex--;
    const prevStudent = folders[folderIndex];
    const explicitTrail = rootBatchHandle
      ? [{ handle: rootBatchHandle, name: rootBatchHandle.name, isBatchRoot: true }, { handle: prevStudent, name: prevStudent.name }]
      : [{ handle: prevStudent, name: prevStudent.name, isBatchRoot: false }];
    if (prevStudent.nativePath) {
      await loadNativeStudentFolder(prevStudent, { explicitTrail });
    } else {
      await loadFolder(prevStudent, { explicitTrail });
    }
  }
};

$('exit').onclick = () => {
  releasePreviews(urls);
  dir = null;
  files = [];
  folders = [];
  rootBatchHandle = null;
  folderPathTrail = [];
  navHistory = [];
  historyIndex = -1;
  currentSubfolders = [];
  if ($('folderNavigator')) $('folderNavigator').style.display = 'none';
  cachedBatchResults = [];
  selectedIndices = [];
  inputsState = {};
  activeFocusIndex = 0;
  handleSelectionChange([]);
  $('folderName').innerHTML = '<strong>Folder:</strong> None Selected';
  $('fileList').replaceChildren(
    el('div', { class: 'emptyState' }, [
      el('h3', { textContent: 'No folder selected' }),
      el('p', { textContent: 'Choose a parent folder from the actions panel to see supported documents here.' })
    ])
  );
  clear($('checkResults'));
  $('checkSummary').textContent = 'Select a checklist and click Check';
  if ($('dashFolderName')) $('dashFolderName').textContent = 'No Folder Selected';
  if ($('gaugePercent')) $('gaugePercent').textContent = '0%';
  if ($('metricVerified')) $('metricVerified').textContent = '0';
  if ($('metricMissing')) $('metricMissing').textContent = '0';
  if ($('metricFolderFiles')) $('metricFolderFiles').textContent = '0';
  if ($('metricTotalRequired')) $('metricTotalRequired').textContent = '0';
  if ($('readinessBanner')) $('readinessBanner').className = 'readinessBanner';
  if ($('readinessText')) $('readinessText').textContent = 'Awaiting document check';
  if ($('missingQuickWrap')) $('missingQuickWrap').style.display = 'none';
  if ($('openBatchAuditBtn')) $('openBatchAuditBtn').disabled = true;
  if ($('batchFolderCountBadge')) $('batchFolderCountBadge').style.display = 'none';
  setDisabled('directRename', true);
  setDisabled('runChecklist', true);
  setDisabled('bulkChecklist', true);
  setDisabled('refreshFolder', true);
  setDisabled('prevFolder', true);
  setDisabled('nextFolder', true);
  syncSuiteFiles([], '');
  showToast('Workspace closed.', 'info');
};

initSettingsUI(state, () => {
  saveSettings(state);
  fillChecklistSelects();
  if (dir) renderFiles();
});

// Theme Controller (Light / Dark Mode with instant toggle and persistence)
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = $('themeToggleIcon');
  const label = $('themeToggleLabel');
  if (icon && label) {
    if (theme === 'dark') {
      icon.textContent = '☀️';
      label.textContent = 'Light';
    } else {
      icon.textContent = '🌙';
      label.textContent = 'Dark';
    }
  }
  const themeSelect = $('themeSettingSelect');
  if (themeSelect && themeSelect.value !== theme) {
    themeSelect.value = theme;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('clerk_theme') || 'light';
  applyTheme(savedTheme);

  const toggleBtn = $('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('clerk_theme', next);
      showToast(next === 'dark' ? 'Switched to Obsidian Dark Mode 🌙' : 'Switched to Light Day Mode ☀️', 'info');
    };
  }

  const themeSelect = $('themeSettingSelect');
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.onchange = () => {
      applyTheme(themeSelect.value);
      localStorage.setItem('clerk_theme', themeSelect.value);
      showToast(themeSelect.value === 'dark' ? 'Switched to Obsidian Dark Mode 🌙' : 'Switched to Light Day Mode ☀️', 'info');
    };
  }
}

initTheme();
initSuiteHub();
updaterService.init();
licensingService.checkLicense();
updateDashboardDisplay();
fillChecklistSelects();
updateFollowUpDeskBadge();

hydrateSettings(state).then(() => {
  fillChecklistSelects();
  updateFollowUpDeskBadge();
  if (dir) renderFiles();
});

setDisabled('runChecklist', true);
setDisabled('bulkChecklist', true);
setDisabled('directRename', true);
setDisabled('refreshFolder', true);
setDisabled('prevFolder', true);
setDisabled('nextFolder', true);
if ($('openBatchAuditBtn')) $('openBatchAuditBtn').disabled = true;


// Customer Support Error Diagnostic Directory Search Wiring
function initErrorDiagnosticSearch() {
  const searchInput = $('errorCodeSearchInput');
  const searchBtn = $('errorCodeSearchBtn');
  const searchResult = $('errorCodeSearchResult');

  const performErrorSearch = () => {
    if (!searchInput || !searchResult) return;
    const q = searchInput.value.trim();
    if (!q) {
      searchResult.style.display = 'none';
      return;
    }
    const matches = searchErrorCodes(q);
    if (!matches || matches.length === 0) {
      searchResult.style.display = 'block';
      searchResult.innerHTML = '<span style="color:var(--muted);">No matching error code found. Enter e.g. 102, 201, 301.</span>';
      return;
    }
    searchResult.style.display = 'block';
    searchResult.innerHTML = matches.slice(0, 4).map(m => `
      <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed var(--line);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color: #ef4444; font-family: monospace; font-size: 13px;">[${m.code}] ${m.title}</strong>
          <span style="font-size:11px; background:var(--surface); padding:1px 6px; border-radius:4px; border:1px solid var(--line);">${m.category}</span>
        </div>
        <div style="color:var(--ink); margin-top:3px; font-size:12px;">${m.desc}</div>
        <div style="color:#10b981; margin-top:3px; font-size:11.5px;">💡 ${m.marathi}</div>
        <div style="color:var(--muted); font-size:11px; margin-top:3px;"><b>Recommended Fix:</b> ${m.solution}</div>
      </div>
    `).join('');
  };

  if (searchInput) {
    searchInput.addEventListener('input', performErrorSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performErrorSearch(); });
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', performErrorSearch);
  }
}
initErrorDiagnosticSearch();

window.renameApp = {
  state,
  save: () => saveSettings(state)
};
