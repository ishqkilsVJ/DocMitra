/* ==========================================================================
   Student Document Renamer — स्पेलिंग तपासणी आणि दुरुस्ती (Spelling Library)
   ========================================================================== */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * शब्दाचा मूळ केस (Uppercase / Lowercase / Capitalize) राखून सुधारणे
 */
export function preserveCase(found, replacement) {
  if (found === found.toUpperCase()) return replacement.toUpperCase();
  if (found === found.toLowerCase()) return replacement.toLowerCase();
  if (found[0] === found[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}

/**
 * मजकुरातील चुकीचे स्पेलिंग सुधारणे
 */
export function correctSpelling(text, rules) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [wrong, right] of Object.entries(rules || {})) {
    if (!wrong) continue;
    const re = new RegExp(`(^|[^a-zA-Z0-9])(${esc(wrong)})([^a-zA-Z0-9]|$)`, 'gi');
    out = out.replace(re, (match, prefix, found, suffix) => {
      return prefix + preserveCase(found, right) + suffix;
    });
  }
  return out;
}

/**
 * फोल्डर आणि फाईल्समधील स्पेलिंग चुका शोधणे
 */
export function issuesFor(dirName, files, rules) {
  const out = [];
  
  if (dirName) {
    const folderFixed = correctSpelling(dirName, rules);
    if (folderFixed !== dirName) {
      out.push({ type: 'folder', old: dirName, corrected: folderFixed });
    }
  }

  files.forEach((file, index) => {
    const lastDot = file.name.lastIndexOf('.');
    const base = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
    const extension = lastDot > 0 ? file.name.slice(lastDot) : '';
    
    const fixedBase = correctSpelling(base, rules);
    if (base !== fixedBase) {
      out.push({
        type: 'file',
        fileIndex: index,
        old: file.name,
        corrected: fixedBase + extension
      });
    }
  });

  return out;
}
