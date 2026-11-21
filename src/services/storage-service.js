/* ==========================================================================
   Student Document Renamer — Storage Service (Strict Single-Keyword Mode)
   ========================================================================== */

import { DB_CONFIG, DEFAULT_SPELLING_RULES, DEFAULT_CHECKLISTS_DATA, DEFAULT_LINKED_RULES, CHECKLIST_VERSION } from '../core/constants.js';
import { exportDictionaryToGroups } from '../libraries/shortcut-keyword-library.js';
import { makeChecklist } from '../libraries/checklist-library.js';

const DICT_VERSION = 'v3_exact_single';
const DEFAULT_GROUPS = exportDictionaryToGroups();

const readLocal = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key, v) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
};

export const normalizeGroups = groups => {
  const out = {};
  Object.entries(groups || {}).forEach(([name, keys]) => {
    const normalized = /^12\s*LC$/i.test(name) || name === '12TH LEAVING CERTIFICATE' ? '12TH LC' : name;
    out[normalized] = [...(out[normalized] || []), ...(Array.isArray(keys) ? keys : [])].filter(
      (key, index, all) => all.indexOf(key) === index
    );
  });
  
  const ordered = {};
  Object.entries(out).forEach(([name, keys]) => {
    if (name === '12TH MARKSHEET AND PASSING') return;
    ordered[name] = keys;
    if (name === '12TH PASSING CERTIFICATE' && out['12TH MARKSHEET AND PASSING']) {
      ordered['12TH MARKSHEET AND PASSING'] = out['12TH MARKSHEET AND PASSING'];
    }
  });
  return ordered;
};

export const normalizeRule = rule => {
  const name = rule.name === '12TH LEAVING CERTIFICATE' ? '12TH LC' : rule.name;
  return {
    ...rule,
    name,
    keywords: [...new Set(rule.keywords || [])],
    short: rule.short || name.slice(0, 18)
  };
};

export const order12thRows = rows => {
  const special = rows.filter(rule => rule.name === '12TH MARKSHEET AND PASSING');
  if (!special.length) return rows;
  const rest = rows.filter(rule => rule.name !== '12TH MARKSHEET AND PASSING');
  const index = rest.findIndex(rule => rule.name === '12TH PASSING CERTIFICATE');
  rest.splice(index < 0 ? rest.length : index + 1, 0, ...special);
  return rest;
};

export const mergeChecklists = saved => {
  const base = makeChecklist(DEFAULT_CHECKLISTS_DATA);
  const source = saved || {};
  const out = {};
  
  Object.keys(base).forEach(form => {
    const existing = Array.isArray(source[form]) ? source[form].map(normalizeRule) : [];
    const byName = new Map(existing.map(x => [x.name.toUpperCase(), x]));
    base[form].forEach(rule => {
      const normalized = normalizeRule(rule);
      if (!byName.has(normalized.name.toUpperCase())) {
        existing.push(normalized);
      }
    });
    out[form] = order12thRows(existing);
  });
  
  Object.entries(source).forEach(([form, rows]) => {
    if (!out[form]) out[form] = order12thRows(rows.map(normalizeRule));
  });
  return out;
};

export function loadSettings() {
  const currentVersion = localStorage.getItem('dictVersion');
  let groups;
  let profiles;

  // Auto-upgrade to strict single-keyword dictionary upon user's request
  if (currentVersion !== DICT_VERSION) {
    groups = DEFAULT_GROUPS;
    profiles = { Default: DEFAULT_GROUPS };
    saveLocal('renameSettings', groups);
    saveLocal('renameProfiles', profiles);
    localStorage.setItem('dictVersion', DICT_VERSION);
  } else {
    groups = normalizeGroups(readLocal('renameSettings', DEFAULT_GROUPS));
    profiles = readLocal('renameProfiles', { Default: DEFAULT_GROUPS });
  }

  // Auto-upgrade checklist keywords to strict exact canonical names upon user's request
  const currentChecklistVer = localStorage.getItem('checklistVersion');
  let checklists;
  if (currentChecklistVer !== CHECKLIST_VERSION) {
    checklists = makeChecklist(DEFAULT_CHECKLISTS_DATA);
    saveLocal('checklists', checklists);
    localStorage.setItem('checklistVersion', CHECKLIST_VERSION);
  } else {
    checklists = mergeChecklists(readLocal('checklists', null));
  }
  const spelling = { ...DEFAULT_SPELLING_RULES, ...(readLocal('spellingCorrections', {}) || {}) };
  const linkedRules = readLocal('linkedRules', DEFAULT_LINKED_RULES);
  
  return {
    groups,
    checklists,
    spelling,
    profiles,
    linkedRules,
    style: localStorage.getItem('nameStyle') || 'preserve',
    active: Object.keys(profiles)[0] || 'Default'
  };
}

export function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_CONFIG.store)) {
        request.result.createObjectStore(DB_CONFIG.store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });
}

export function idbGet() {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_CONFIG.store, 'readonly');
        const req = tx.objectStore(DB_CONFIG.store).get(DB_CONFIG.key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      })
  );
}

export function idbPut(value) {
  return openDB().then(
    db =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(DB_CONFIG.store, 'readwrite');
        tx.objectStore(DB_CONFIG.store).put(value, DB_CONFIG.key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function saveSettings(s) {
  const value = {
    groups: s.groups,
    checklists: s.checklists,
    spelling: s.spelling,
    profiles: s.profiles,
    linkedRules: s.linkedRules,
    style: s.style,
    savedAt: new Date().toISOString()
  };
  saveLocal('renameSettings', value.groups);
  saveLocal('checklists', value.checklists);
  saveLocal('spellingCorrections', value.spelling);
  saveLocal('renameProfiles', value.profiles);
  saveLocal('linkedRules', value.linkedRules);
  localStorage.setItem('nameStyle', value.style);
  idbPut(value).catch(() => {});
}

export async function hydrateSettings(state) {
  try {
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
    const currentVersion = localStorage.getItem('dictVersion');
    if (currentVersion === DICT_VERSION) {
      const stored = await idbGet();
      if (stored && stored.groups) {
        state.groups = normalizeGroups(stored.groups);
        state.checklists = mergeChecklists(stored.checklists);
        state.spelling = { ...DEFAULT_SPELLING_RULES, ...(stored.spelling || {}) };
        state.profiles = stored.profiles || { Default: state.groups };
        state.linkedRules = stored.linkedRules || DEFAULT_LINKED_RULES;
        state.style = stored.style || state.style;
        return true;
      }
    }
    await idbPut({
      groups: state.groups,
      checklists: state.checklists,
      spelling: state.spelling,
      profiles: state.profiles,
      linkedRules: state.linkedRules || DEFAULT_LINKED_RULES,
      style: state.style,
      savedAt: new Date().toISOString()
    });
    return false;
  } catch {
    return false;
  }
}

/**
 * Load persistent document presets from backend config/document_presets.json with local fallback
 */
export async function loadDocumentPresets() {
  try {
    const res = await fetch('http://localhost:3000/api/load-document-presets');
    const json = await res.json();
    if (json && json.success && json.data && json.data.forms) {
      return json.data;
    }
  } catch (e) {
    console.warn('[StorageService] Failed to load document presets from backend:', e);
  }
  return readLocal('documentPresets', { forms: DEFAULT_CHECKLISTS_DATA });
}

/**
 * Save document presets persistently to config/document_presets.json via backend API
 */
export async function saveDocumentPresets(presets) {
  saveLocal('documentPresets', presets);
  try {
    await fetch('http://localhost:3000/api/save-document-presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(presets)
    });
  } catch (e) {
    console.warn('[StorageService] Failed to persist document presets to disk:', e);
  }
}
