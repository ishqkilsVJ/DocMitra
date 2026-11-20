/* ==========================================================================
   Student Document Renamer — डुप्लिकेट नाव व्यवस्थापक (Duplicate Name Handler)
   ========================================================================== */

import { ext, cleanName } from './rename-library.js';

/**
 * डुप्लिकेट नावासाठी आपोआप ' 1', ' 2', ' 3' जोडणे (Case-insensitive & Safe)
 * @param {string} desired - अपेक्षित नाव
 * @param {string} currentName - फाईलचे सध्याचे नाव
 * @param {Set<string>|Array<string>} usedNames - आधीच वापरात असलेली नावे
 * @returns {string} अद्वितीय (Unique) फाईल नाव
 */
export function uniqueDestination(desired, currentName, usedNames) {
  const usedLower = new Map();
  if (usedNames) {
    for (const name of usedNames) {
      if (name) usedLower.set(name.toLowerCase(), name);
    }
  }

  // If desired is not used, or it's the exact same file keeping its name
  if (!usedLower.has(desired.toLowerCase()) || desired.toLowerCase() === (currentName || '').toLowerCase()) {
    return desired;
  }
  
  const suffix = ext(desired);
  const base = cleanName(desired).replace(/\s+\d+$/, '');
  let counter = 1;
  let candidate = `${base} ${counter}${suffix}`;
  
  while (usedLower.has(candidate.toLowerCase()) && candidate.toLowerCase() !== (currentName || '').toLowerCase()) {
    counter++;
    candidate = `${base} ${counter}${suffix}`;
  }
  
  return candidate;
}
