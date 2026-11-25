/**
 * ClerkMaster — Enterprise Unified Error Code System (त्रुटी कोड प्रणाली)
 * Standardized 3-digit and 4-digit diagnostic error codes for customer support,
 * automated error logging, and one-click clipboard copying.
 */

export const ERROR_CODES = {
  // --------------------------------------------------------------------------
  // CM-100 Series: File & Folder Access (फायली व फोल्डर संबंधित त्रुटी)
  // --------------------------------------------------------------------------
  'CM-101': {
    code: 'CM-101',
    category: 'Folder System',
    title: 'Folder Selection Cancelled',
    desc: 'Folder picker dialog was closed or cancelled by the user.',
    marathi: 'वापरकर्त्याने फोल्डर निवड रद्द केली आहे.',
    solution: 'Click "Select Folder" again and choose a valid folder directory.'
  },
  'CM-102': {
    code: 'CM-102',
    category: 'Permission & Access',
    title: 'Folder Permission Denied',
    desc: 'Windows restricted folder access or permission was denied.',
    marathi: 'Windows किंवा ॲन्टीव्हायरसने या फोल्डरला परवानगी नाकारली आहे.',
    solution: 'Run DocMitra as Administrator or check folder security permissions.'
  },
  'CM-103': {
    code: 'CM-103',
    category: 'Native Bridge',
    title: 'Local Python Bridge Offline',
    desc: 'Local background desktop server (port 3000) is unreachable or timed out.',
    marathi: 'बॅकग्राउंड सर्व्हिस वेळेत प्रतिसाद देत नाहीये. ॲप रीस्टार्ट करा.',
    solution: 'Restart DocMitra software to reconnect the local background engine.'
  },
  'CM-104': {
    code: 'CM-104',
    category: 'Directory Not Found',
    title: 'Folder Path Not Found',
    desc: 'The selected folder path does not exist on disk or drive was unmounted.',
    marathi: 'हा फोल्डर किंवा ड्राईव्ह संगणकावर सापडला नाही.',
    solution: 'Verify the drive or folder path is accessible in Windows Explorer.'
  },
  'CM-105': {
    code: 'CM-105',
    category: 'Empty Directory',
    title: 'No Valid Documents Found',
    desc: 'Selected folder does not contain any readable student files (.pdf, .jpg, .png).',
    marathi: 'या फोल्डरमध्ये कोणतेही दस्तऐवज किंवा फाइल्स आढळल्या नाहीत.',
    solution: 'Ensure student documents are placed inside the selected folder.'
  },
  'CM-106': {
    code: 'CM-106',
    category: 'Folder Picker',
    title: 'Folder Picker Dialog Timeout',
    desc: 'The Windows folder picker dialog did not open within the expected time limit.',
    marathi: 'Windows फोल्डर डायलॉग उघडण्यात अडचण आली किंवा प्रतिसाद वेळेत आला नाही.',
    solution: 'Click Select Folder again or select the folder using the browser window.'
  },

  // --------------------------------------------------------------------------
  // CM-200 Series: Renamer Engine (दस्तऐवज पुनर्नामित त्रुटी)
  // --------------------------------------------------------------------------
  'CM-201': {
    code: 'CM-201',
    category: 'File Locked',
    title: 'File Open In Another Program',
    desc: 'Document is locked by Adobe Reader, Microsoft Word, or another application.',
    marathi: 'ही फाईल Adobe Reader किंवा Word मध्ये उघडी आहे. कृपया ती बंद करा.',
    solution: 'Close all open PDF/Word viewers showing this document, then try again.'
  },
  'CM-202': {
    code: 'CM-202',
    category: 'Duplicate Name',
    title: 'Target Filename Already Exists',
    desc: 'Another file with the identical target name already exists in this folder.',
    marathi: 'या नावाची फाईल या फोल्डरमध्ये आधीपासूनच अस्तित्वात आहे.',
    solution: 'Check folder contents or add a number suffix to avoid duplicate overwrite.'
  },
  'CM-203': {
    code: 'CM-203',
    category: 'Invalid Name',
    title: 'Invalid Windows Filename Characters',
    desc: 'Filename contains illegal Windows characters (\\ / : * ? " < > |).',
    marathi: 'नावामध्ये अवैध चिन्हे (जसे \\ / : * ? " < > |) वापरता येत नाहीत.',
    solution: 'Remove special symbols from the Live Name before renaming.'
  },
  'CM-204': {
    code: 'CM-204',
    category: 'Rename Operation',
    title: 'Atomic Disk Rename Failed',
    desc: 'Windows OS rejected disk rename operation.',
    marathi: 'फाईलचे नाव बदलताना Windows ने अडथळा आणला. फोल्डर Read-Only नाही ना ते तपासा.',
    solution: 'Ensure student folder is not marked Read-Only in Windows folder properties.'
  },
  'CM-205': {
    code: 'CM-205',
    category: 'Batch Rename',
    title: 'Partial Batch Rename Errors',
    desc: 'One or more files encountered errors during the batch rename sequence.',
    marathi: 'बॅचमधील काही फाइल्स बदलल्या पण काही फाइल्समध्ये त्रुटी आली.',
    solution: 'Review highlighted red rows in the file table for specific locked files.'
  },

  // --------------------------------------------------------------------------
  // CM-300 Series: PDF & Image Studio (पीडीएफ व इमेज स्टुडिओ त्रुटी)
  // --------------------------------------------------------------------------
  'CM-301': {
    code: 'CM-301',
    category: 'PDF Security',
    title: 'Password-Protected PDF',
    desc: 'Cannot process, merge, or convert password-protected PDF document.',
    marathi: 'हा पीडीएफ पासवर्ड प्रोटेक्टेड आहे. आधी पासवर्ड काढून टाका.',
    solution: 'Remove PDF password or unlock the document before adding to Studio.'
  },
  'CM-302': {
    code: 'CM-302',
    category: 'File Corrupt',
    title: 'Corrupted or Unreadable File',
    desc: 'The file header or data is damaged, incomplete, or unreadable.',
    marathi: 'ही फाईल खराब (Corrupt) झाली आहे किंवा अर्धवट डाऊनलोड झाली आहे.',
    solution: 'Open the document in an external viewer to verify file integrity.'
  },
  'CM-303': {
    code: 'CM-303',
    category: 'Studio Engine',
    title: 'Conversion Processing Failed',
    desc: 'Failed to convert document format offline.',
    marathi: 'दस्तऐवज रूपांतरित (Convert) करताना त्रुटी आली.',
    solution: 'Try converting file individually or re-export the document.'
  },

  // --------------------------------------------------------------------------
  // CM-400 Series: Hardware Lock & Licensing (परवाना व सुरक्षा त्रुटी)
  // --------------------------------------------------------------------------
  'CM-401': {
    code: 'CM-401',
    category: 'Hardware Lock',
    title: 'Hardware System Key Mismatch',
    desc: 'This license key was generated for a different computer motherboard.',
    marathi: 'हा परवाना दुसऱ्या संगणकासाठी आहे. नवीन लायसन्स की साठी संपर्क साधा.',
    solution: 'Provide current System Key to Administrator to issue a new valid license.'
  },
  'CM-402': {
    code: 'CM-402',
    category: 'License Signature',
    title: 'Invalid Cryptographic Signature',
    desc: 'License key format or HMAC signature verification failed.',
    marathi: 'लायसन्स की चुकीची आहे किंवा स्वाक्षरी जुळत नाही.',
    solution: 'Double-check license key string for extra spaces or typos.'
  },
  'CM-403': {
    code: 'CM-403',
    category: 'License Expiry',
    title: 'Commercial License Expired',
    desc: 'Software validity period has ended.',
    marathi: 'सॉफ्टवेअर परवान्याची मुदत संपलेली आहे. नूतनीकरणासाठी संपर्क साधा.',
    solution: 'Renew commercial license with DocMitra distributor.'
  },

  // --------------------------------------------------------------------------
  // CM-500 Series: Updates & Network (अपडेट्स व नेटवर्क त्रुटी)
  // --------------------------------------------------------------------------
  'CM-501': {
    code: 'CM-501',
    category: 'Network Offline',
    title: 'No Active Internet Connection',
    desc: 'Cannot reach GitHub update servers because device is offline.',
    marathi: 'इंटरनेट कनेक्शन उपलब्ध नाही. कृपया इंटरनेट सुरू करा.',
    solution: 'Connect to Wi-Fi or mobile hotspot to check and apply updates.'
  },
  'CM-502': {
    code: 'CM-502',
    category: 'Update Service',
    title: 'GitHub Release Check Failed',
    desc: 'Unable to query repository release information.',
    marathi: 'नवीन अपडेट तपासताना सर्व्हरकडून प्रतिसाद आला नाही.',
    solution: 'Check again in a few moments or verify GitHub access.'
  },
  'CM-503': {
    code: 'CM-503',
    category: 'Update Apply',
    title: 'Update File Replacement Failed',
    desc: 'Failed to copy updated application files in-place.',
    marathi: 'अपडेट फाइल्स रिप्लेस करताना त्रुटी आली.',
    solution: 'Ensure DocMitra directory is not write-locked by another user.'
  }
};

/**
 * In-memory diagnostic error log for customer support
 */
export const sessionErrorLog = [];

/**
 * Lookup error code metadata
 */
export function getErrorCodeInfo(code) {
  const norm = String(code || '').toUpperCase().trim();
  const direct = ERROR_CODES[norm] || ERROR_CODES[`CM-${norm}`];
  if (direct) return direct;

  return {
    code: norm || 'CM-ERR',
    category: 'General System',
    title: 'System Execution Error',
    desc: 'An unexpected operation error occurred.',
    marathi: 'सॉफ्टवेअर चालवताना अनपेक्षित त्रुटी आली आहे.',
    solution: 'Please copy the error code and report it to support.'
  };
}

/**
 * Format error for support report
 */
export function formatErrorSupportReport(code, detail = '') {
  const info = getErrorCodeInfo(code);
  const sysKey = localStorage.getItem('clerk_system_key') || 'CM-SYS-D83E-714F-3E56-D773';
  const ver = 'v1.3.0';
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  return `DocMitra Support Report: [${info.code}] ${info.title} | ${detail ? 'Detail: ' + detail + ' | ' : ''}Time: ${time} | Version: ${ver} | SysKey: ${sysKey}`;
}

/**
 * Dispatch standardized error with structured notification
 */
export function dispatchError(code, customDetail = '', durationMs = 6000) {
  const info = getErrorCodeInfo(code);
  const timestamp = new Date().toISOString();

  // Log to session history
  sessionErrorLog.unshift({
    code: info.code,
    title: info.title,
    detail: customDetail || info.desc,
    timestamp
  });
  if (sessionErrorLog.length > 50) sessionErrorLog.pop();

  console.warn(`[ERROR-CODE] [${info.code}] ${info.title}:`, customDetail || info.desc);

  // Trigger enhanced UI toast
  if (typeof window.showErrorCodeToast === 'function') {
    window.showErrorCodeToast(info, customDetail, durationMs);
  } else if (typeof window.showToast === 'function') {
    const msg = `[${info.code}] ${info.title}: ${customDetail || info.marathi}`;
    window.showToast(msg, 'error', durationMs);
  }
}

/**
 * Quick search error codes by query
 */
export function searchErrorCodes(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return Object.values(ERROR_CODES);

  return Object.values(ERROR_CODES).filter(e => 
    e.code.toLowerCase().includes(q) ||
    e.title.toLowerCase().includes(q) ||
    e.desc.toLowerCase().includes(q) ||
    e.marathi.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q)
  );
}
