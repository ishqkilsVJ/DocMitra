/* ==========================================================================
   Student Document Renamer — स्थानिक फाईल हाताळणी (File IO Library)
   ========================================================================== */

import { SUPPORTED_EXTENSIONS } from '../core/constants.js';
import { ext } from './rename-library.js';

/**
 * फोल्डरमधील सर्व उप-फोल्डर्स शोधणे
 */
export async function collectFolders(handle) {
  const out = [];
  if (!handle || typeof handle.entries !== 'function') {
    return out;
  }
  for await (const [, item] of handle.entries()) {
    if (item.kind === 'directory') {
      out.push(item);
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * फोल्डरमधील सर्व फायली वाचणे (कोणतीही फाइल टाईप मर्यादा न ठेवता १००% फाइल्स लोड करणे)
 */
export async function readFiles(handle) {
  const out = [];
  if (!handle || typeof handle.entries !== 'function') {
    return out;
  }
  const SYSTEM_IGNORE = ['thumbs.db', 'desktop.ini', '.ds_store'];
  for await (const [name, item] of handle.entries()) {
    if (item.kind === 'file') {
      const lower = name.toLowerCase();
      // फक्त लपवलेल्या व सिस्टीम तात्पुरत्या फाइल्स वगळणे, बाकी सर्व फाइल्स दाखवणे
      if (lower.startsWith('.') || lower.startsWith('~$') || lower.includes('.docmitra_id') || SYSTEM_IGNORE.includes(lower)) {
        continue;
      }
      try {
        const file = await item.getFile();
        file.handle = item; // मूळ हँडल सोबत जोडणे जेणेकरून .move() वापरता येईल
        out.push(file);
      } catch (fErr) {
        console.warn(`Could not read file ${name}:`, fErr);
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * प्रिव्ह्यू मेमरी मोकळी करणे (Memory Leak Cleanup)
 */
export function releasePreviews(urls) {
  if (Array.isArray(urls)) {
    urls.forEach(url => URL.revokeObjectURL(url));
  }
}

/**
 * फाईल साईझ मानवी वाचनीय स्वरूपात (KB/MB) दाखवणे
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}
