/**
 * tools/rename_tool/rename_tool_logic.js
 * DocMitra Bulk Document Renamer — Pure Business Logic Module
 *
 * Encapsulates:
 * 1. Naming & Case Enforcement (UPPER, Title, lower, As Is)
 * 2. 21-Shortcut Keyword & Canonical Name Resolution
 * 3. Document Pattern Matching & Word-Boundary Safety
 * 4. Duplicate Filename Auto-Suffixing (Sequential ' 1', ' 2'...)
 * 5. Windows Filename Validation & Reserved Names Protection
 * 6. Multi-Level Undo Manager
 * 7. Scanner Misspelling Typo Auto-Correction
 * 8. Checklist & Multi-Document Linking Engine
 * 9. Batch Audit CSV Report Generation
 * 10. Atomic Rename & Rollback Orchestration
 *
 * STRICT RULE: Pure logic only. Zero DOM dependencies, zero Marathi text.
 */

import { renameNativeFile } from '../../shared/native-bridge.js';

/* ==========================================================================
   1. Canonical Naming & Default Rules Constants
   ========================================================================== */

export const CANONICAL_NAMES = {
  "AADHAAR CARD": "Aadhaar Card",
  "AADHAR CARD": "Aadhaar Card",
  "PAN CARD": "PAN Card",
  "PHOTO": "Photo",
  "10TH MARKSHEET": "10th Marksheet",
  "10TH PASSING CERTIFICATE": "10th Passing",
  "11TH MARKSHEET": "11th Marksheet",
  "11TH PASSING CERTIFICATE": "11th Passing",
  "10TH LC": "10TH LC",
  "10TH MARKSHEET AND PASSING": "10th Marksheet and Passing",
  "APAAR ID": "APAAR ID",
  "ABC ID": "ABC ID",
  "DEGREE CERTIFICATE": "Degree Certificate",
  "REGISTRATION CERTIFICATE": "Registration Certificate",
  "RATION CARD": "Ration Card",
  "12TH MARKSHEET": "12th Marksheet",
  "12TH PASSING CERTIFICATE": "12th Passing",
  "12TH LC": "12TH LC",
  "12TH MARKSHEET AND PASSING": "12th Marksheet and Passing",
  "CASTE CERTIFICATE": "Caste Certificate",
  "VALIDITY CERTIFICATE": "Validity Certificate",
  "DOMICILE CERTIFICATE": "Domicile Certificate",
  "NATIONALITY CERTIFICATE": "Nationality Certificate",
  "PASSBOOK BANK": "Bank Passbook",
  "INCOME CERTIFICATE": "Income Certificate",
  "SELF DECLARATION": "Self Declaration",
  "PARENT DECLARATION": "Parent Declaration",
  "BIRTH CERTIFICATE": "Birth Certificate",
  "BONAFIDE CERTIFICATE": "Bonafide Certificate",
  "GAP CERTIFICATE": "Gap Certificate",
  "ATTEMPT CERTIFICATE": "Attempt Certificate",
  "CAP ALLOTMENT LETTER": "CAP Allotment Letter"
};

export const DEFAULT_SPELLING_RULES = {
  "marskheet": "marksheet",
  "markshet": "marksheet",
  "markshit": "marksheet",
  "pasing": "passing",
  "pasingg": "passing",
  "aadhhar": "aadhaar",
  "adhar": "aadhaar",
  "aadhar": "aadhaar",
  "bonafied": "bonafide",
  "bonafidee": "bonafide",
  "domocile": "domicile",
  "pasbook": "passbook",
  "pasbok": "passbook",
  "incom": "income",
  "incme": "income",
  "certifcte": "certificate",
  "certifcate": "certificate",
  "certificte": "certificate",
  "certficate": "certificate",
  "certifitcate": "certificate",
  "atempt": "attempt",
  "attmpt": "attempt",
  "phot": "photo"
};

export const DEFAULT_LINKED_RULES = [
  {
    id: "12th-marksheet-passing-link",
    part1: "12TH MARKSHEET",
    part2: "12TH PASSING CERTIFICATE",
    combined: "12TH MARKSHEET AND PASSING",
    type: "combined"
  },
  {
    id: "10th-marksheet-passing-link",
    part1: "10TH MARKSHEET",
    part2: "10TH PASSING CERTIFICATE",
    combined: "10TH MARKSHEET AND PASSING",
    type: "combined"
  },
  {
    id: "domicile-nationality-link",
    part1: "DOMICILE CERTIFICATE",
    part2: "NATIONALITY CERTIFICATE",
    combined: "DOMICILE AND NATIONALITY CERTIFICATE",
    type: "combined"
  },
  {
    id: "lc-tc-alias",
    part1: "12TH LC",
    part2: "12TH TC",
    combined: "12TH LC",
    type: "alias"
  }
];

export const DEFAULT_CHECKLISTS_DATA = {
  "MAHA DBT FORM": [
    ["AADHAAR CARD", ["aadhaar card"]],
    ["PHOTO", ["photo"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["VALIDITY CERTIFICATE", ["validity certificate"]],
    ["INCOME CERTIFICATE", ["income certificate"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["PASSBOOK BANK", ["passbook bank", "bank passbook"]]
  ],
  "MH CET FORM": [
    ["PHOTO", ["photo"]],
    ["AADHAAR CARD", ["aadhaar card"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["VALIDITY CERTIFICATE", ["validity certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate"]],
    ["INCOME CERTIFICATE", ["income certificate"]],
    ["ATTEMPT CERTIFICATE", ["attempt certificate"]]
  ],
  "SWAYAM FORM": [
    ["PHOTO", ["photo"]],
    ["AADHAAR CARD", ["aadhaar card"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["SELF DECLARATION", ["self declaration"]],
    ["PARENT DECLARATION", ["parent declaration"]],
    ["PASSBOOK BANK", ["passbook bank", "bank passbook"]],
    ["BONAFIDE CERTIFICATE", ["bonafide certificate"]]
  ]
};

/* ==========================================================================
   2. Shortcut Keyword Dictionary & Matching
   ========================================================================== */

export const DEFAULT_SHORTCUT_DICTIONARY = [
  { id: "aadhaar-card", displayName: "Aadhaar Card", primaryShortcut: "ADR", alternateKeywords: [], outputName: "AADHAAR CARD" },
  { id: "pan-card", displayName: "PAN Card", primaryShortcut: "PAN", alternateKeywords: [], outputName: "PAN CARD" },
  { id: "photo", displayName: "Student Photo", primaryShortcut: "PIC", alternateKeywords: [], outputName: "PHOTO" },
  { id: "10th-marksheet", displayName: "10th Marksheet", primaryShortcut: "10M", alternateKeywords: [], outputName: "10TH MARKSHEET" },
  { id: "10th-passing", displayName: "10th Passing Certificate", primaryShortcut: "10P", alternateKeywords: [], outputName: "10TH PASSING CERTIFICATE" },
  { id: "11th-marksheet", displayName: "11th Marksheet", primaryShortcut: "11M", alternateKeywords: [], outputName: "11TH MARKSHEET" },
  { id: "11th-passing", displayName: "11th Passing Certificate", primaryShortcut: "11P", alternateKeywords: [], outputName: "11TH PASSING CERTIFICATE" },
  { id: "10th-lc", displayName: "10th LC (Leaving)", primaryShortcut: "10LC", alternateKeywords: [], outputName: "10TH LC" },
  { id: "10th-marksheet-passing", displayName: "10th Marksheet & Passing", primaryShortcut: "10MP", alternateKeywords: [], outputName: "10TH MARKSHEET AND PASSING" },
  { id: "12th-marksheet", displayName: "12th Marksheet", primaryShortcut: "12M", alternateKeywords: [], outputName: "12TH MARKSHEET" },
  { id: "12th-passing", displayName: "12th Passing Certificate", primaryShortcut: "12P", alternateKeywords: [], outputName: "12TH PASSING CERTIFICATE" },
  { id: "12th-lc", displayName: "12th LC (Leaving)", primaryShortcut: "12LC", alternateKeywords: [], outputName: "12TH LC" },
  { id: "12th-marksheet-passing", displayName: "12th Marksheet & Passing", primaryShortcut: "12MP", alternateKeywords: [], outputName: "12TH MARKSHEET AND PASSING" },
  { id: "caste-certificate", displayName: "Caste Certificate", primaryShortcut: "CST", alternateKeywords: [], outputName: "CASTE CERTIFICATE" },
  { id: "validity-certificate", displayName: "Caste Validity", primaryShortcut: "VLD", alternateKeywords: [], outputName: "VALIDITY CERTIFICATE" },
  { id: "income-certificate", displayName: "Income Certificate", primaryShortcut: "INC", alternateKeywords: [], outputName: "INCOME CERTIFICATE" },
  { id: "domicile-certificate", displayName: "Domicile Certificate", primaryShortcut: "DOM", alternateKeywords: [], outputName: "DOMICILE CERTIFICATE" },
  { id: "nationality-certificate", displayName: "Nationality Certificate", primaryShortcut: "NAT", alternateKeywords: [], outputName: "NATIONALITY CERTIFICATE" },
  { id: "bank-passbook", displayName: "Bank Passbook", primaryShortcut: "BNK", alternateKeywords: [], outputName: "PASSBOOK BANK" },
  { id: "attempt-certificate", displayName: "Attempt Certificate", primaryShortcut: "ATM", alternateKeywords: [], outputName: "ATTEMPT CERTIFICATE" },
  { id: "birth-certificate", displayName: "Birth Certificate", primaryShortcut: "BRT", alternateKeywords: [], outputName: "BIRTH CERTIFICATE" },
  { id: "bonafide-certificate", displayName: "Bonafide Certificate", primaryShortcut: "BNF", alternateKeywords: [], outputName: "BONAFIDE CERTIFICATE" },
  { id: "gap-certificate", displayName: "Gap Certificate", primaryShortcut: "GAP", alternateKeywords: [], outputName: "GAP CERTIFICATE" },
  { id: "self-declaration", displayName: "Self Declaration", primaryShortcut: "SLF", alternateKeywords: [], outputName: "SELF DECLARATION" },
  { id: "parent-declaration", displayName: "Parent Declaration", primaryShortcut: "PAR", alternateKeywords: [], outputName: "PARENT DECLARATION" },
  { id: "apaar-id", displayName: "APAAR ID", primaryShortcut: "UID", alternateKeywords: [], outputName: "APAAR ID" },
  { id: "abc-id", displayName: "ABC ID", primaryShortcut: "ABC", alternateKeywords: [], outputName: "ABC ID" },
  { id: "cap-allotment", displayName: "CAP Allotment Letter", primaryShortcut: "CAP", alternateKeywords: [], outputName: "CAP ALLOTMENT LETTER" }
];

export function exportDictionaryToGroups(dictionary = DEFAULT_SHORTCUT_DICTIONARY) {
  const groups = {};
  for (const item of dictionary) {
    const keywords = [item.primaryShortcut.toLowerCase()];
    if (item.alternateKeywords && Array.isArray(item.alternateKeywords)) {
      for (const kw of item.alternateKeywords) {
        if (kw && typeof kw === 'string') {
          keywords.push(kw.trim().toLowerCase());
        }
      }
    }
    groups[item.outputName] = keywords;
  }
  return groups;
}

export function getActiveShortcutDictionary(groups = null) {
  if (!groups) return DEFAULT_SHORTCUT_DICTIONARY;
  return DEFAULT_SHORTCUT_DICTIONARY.map(item => {
    const customList = groups[item.outputName];
    if (customList && Array.isArray(customList) && customList.length > 0) {
      return {
        ...item,
        primaryShortcut: customList[0].toUpperCase(),
        alternateKeywords: customList.slice(1)
      };
    }
    return item;
  });
}

export function findKeywordConflict(keyword, targetRuleName, groups) {
  const cleanKeyword = (keyword || '').toLowerCase().trim();
  if (!cleanKeyword) return null;
  const activeDict = getActiveShortcutDictionary(groups);
  for (const item of activeDict) {
    if (item.outputName === targetRuleName) continue;
    if (item.primaryShortcut.toLowerCase() === cleanKeyword) {
      return { conflictingRule: item.outputName, keyword: item.primaryShortcut };
    }
    if (item.alternateKeywords && item.alternateKeywords.map(k => k.toLowerCase()).includes(cleanKeyword)) {
      return { conflictingRule: item.outputName, keyword: cleanKeyword };
    }
  }
  return null;
}

export function matchDocument(input, groups = null) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.toLowerCase().trim();
  if (!clean) return null;

  const activeDict = getActiveShortcutDictionary(groups);

  // Exact match against primary shortcut
  for (const item of activeDict) {
    if (clean === item.primaryShortcut.toLowerCase()) {
      return item.outputName;
    }
  }

  // Exact match against alternate keywords
  for (const item of activeDict) {
    if (item.alternateKeywords) {
      for (const alt of item.alternateKeywords) {
        if (clean === alt.toLowerCase().trim()) {
          return item.outputName;
        }
      }
    }
  }

  // Word-boundary match
  for (const item of activeDict) {
    const sc = item.primaryShortcut.toLowerCase();
    const pattern = new RegExp(`(^|[^a-z0-9])${sc}([^a-z0-9]|$)`, 'i');
    if (pattern.test(clean)) {
      return item.outputName;
    }
    if (item.alternateKeywords) {
      for (const alt of item.alternateKeywords) {
        const altClean = alt.toLowerCase().trim();
        const altPattern = new RegExp(`(^|[^a-z0-9])${altClean}([^a-z0-9]|$)`, 'i');
        if (altPattern.test(clean)) {
          return item.outputName;
        }
      }
    }
  }

  return null;
}

export function getMatchingSuggestions(query = '', groups = null, limit = 5) {
  const activeDict = getActiveShortcutDictionary(groups);
  const q = (query || '').toLowerCase().trim();

  if (!q) {
    return activeDict.slice(0, limit);
  }

  const exact = [];
  const prefix = [];
  const contains = [];

  for (const item of activeDict) {
    const code = item.primaryShortcut.toLowerCase();
    const name = item.displayName.toLowerCase();
    const out = item.outputName.toLowerCase();

    if (code === q) {
      exact.push(item);
    } else if (code.startsWith(q) || name.startsWith(q)) {
      prefix.push(item);
    } else if (code.includes(q) || name.includes(q) || out.includes(q)) {
      contains.push(item);
    }
  }

  return [...exact, ...prefix, ...contains].slice(0, limit);
}

/* ==========================================================================
   3. Document Pattern Matching Engine
   ========================================================================== */

export const DOCUMENT_PATTERNS = [
  {
    id: "12th-marksheet-passing-combined",
    outputName: "12TH MARKSHEET AND PASSING",
    shortcut: "12MP",
    patterns: [
      /\b12mp\b/i,
      /\b12tmp\b/i,
      /\b12(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
      /\b12(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
      /\b12(th)?\s*combined\b/i
    ]
  },
  {
    id: "10th-marksheet-passing-combined",
    outputName: "10TH MARKSHEET AND PASSING",
    shortcut: "10MP",
    patterns: [
      /\b10mp\b/i,
      /\b10tmp\b/i,
      /\b10(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
      /\b10(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
      /\b10(th)?\s*combined\b/i
    ]
  },
  {
    id: "12th-lc",
    outputName: "12TH LC",
    shortcut: "12LC",
    patterns: [
      /\b12lc\b/i,
      /\b12(th)?\s*lc\b/i,
      /\b12(th)?\s*leaving\b/i,
      /\b12(th)?\s*tc\b/i,
      /\bhsc\s*lc\b/i,
      /\bhsc\s*leaving\b/i
    ]
  },
  {
    id: "12th-marksheet",
    outputName: "12TH MARKSHEET",
    shortcut: "12M",
    patterns: [
      /\b12m\b/i,
      /\b12(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
      /\bhsc\s*(mark|marksheet|mark-sheet)\b/i,
      /\b12th\b/i
    ]
  },
  {
    id: "12th-passing",
    outputName: "12TH PASSING CERTIFICATE",
    shortcut: "12P",
    patterns: [
      /\b12p\b/i,
      /\b12(th)?\s*(pass|passing|board|sanad)\b/i,
      /\bhsc\s*(pass|passing|board|sanad)\b/i
    ]
  },
  {
    id: "10th-lc",
    outputName: "10TH LC",
    shortcut: "10LC",
    patterns: [
      /\b10lc\b/i,
      /\b10(th)?\s*lc\b/i,
      /\b10(th)?\s*leaving\b/i,
      /\b10(th)?\s*tc\b/i,
      /\bssc\s*lc\b/i,
      /\bssc\s*leaving\b/i
    ]
  },
  {
    id: "10th-marksheet",
    outputName: "10TH MARKSHEET",
    shortcut: "10M",
    patterns: [
      /\b10m\b/i,
      /\b10(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
      /\bssc\s*(mark|marksheet|mark-sheet)\b/i,
      /\b10th\b/i
    ]
  },
  {
    id: "10th-passing",
    outputName: "10TH PASSING CERTIFICATE",
    shortcut: "10P",
    patterns: [
      /\b10p\b/i,
      /\b10(th)?\s*(pass|passing|board|sanad)\b/i,
      /\bssc\s*(pass|passing|board|sanad)\b/i
    ]
  },
  {
    id: "aadhaar-card",
    outputName: "AADHAAR CARD",
    shortcut: "ADR",
    patterns: [
      /\badr\b/i,
      /\baadhar\b/i,
      /\baadhaar\b/i,
      /\badhar\b/i,
      /\buidai\b/i,
      /\be-?aadhaar\b/i
    ]
  },
  {
    id: "pan-card",
    outputName: "PAN CARD",
    shortcut: "PAN",
    patterns: [
      /\bpan\b/i,
      /\bpancard\b/i,
      /\bnsdl\b/i,
      /\butiitsl\b/i
    ]
  },
  {
    id: "photo",
    outputName: "PHOTO",
    shortcut: "PIC",
    patterns: [
      /\bpic\b/i,
      /\bphoto\b/i,
      /\bphotograph\b/i,
      /\bpassport_?size\b/i,
      /\bimage\b/i
    ]
  },
  {
    id: "caste-validity",
    outputName: "VALIDITY CERTIFICATE",
    shortcut: "VLD",
    patterns: [
      /\bvld\b/i,
      /\bvalidity\b/i,
      /\bcaste\s*validity\b/i,
      /\bpramanpatra\b/i
    ]
  },
  {
    id: "caste-certificate",
    outputName: "CASTE CERTIFICATE",
    shortcut: "CST",
    patterns: [
      /\bcst\b/i,
      /\bcaste\b/i,
      /\bcast\b/i,
      /\bjati\b/i,
      /\bcategory\b/i
    ]
  },
  {
    id: "income-certificate",
    outputName: "INCOME CERTIFICATE",
    shortcut: "INC",
    patterns: [
      /\binc\b/i,
      /\bincome\b/i,
      /\butpann\b/i,
      /\btahsildar\b/i
    ]
  },
  {
    id: "domicile-certificate",
    outputName: "DOMICILE CERTIFICATE",
    shortcut: "DOM",
    patterns: [
      /\bdom\b/i,
      /\bdomicile\b/i,
      /\badhivasa\b/i,
      /\bnivas\b/i
    ]
  },
  {
    id: "nationality-certificate",
    outputName: "NATIONALITY CERTIFICATE",
    shortcut: "NAT",
    patterns: [
      /\bnat\b/i,
      /\bnationality\b/i,
      /\brastriyatva\b/i
    ]
  },
  {
    id: "bank-passbook",
    outputName: "PASSBOOK BANK",
    shortcut: "BNK",
    patterns: [
      /\bbnk\b/i,
      /\bpassbook\b/i,
      /\bbank\b/i,
      /\bstatement\b/i,
      /\bcheque\b/i
    ]
  },
  {
    id: "attempt-certificate",
    outputName: "ATTEMPT CERTIFICATE",
    shortcut: "ATM",
    patterns: [
      /\batm\b/i,
      /\battempt\b/i,
      /\bprayatna\b/i
    ]
  },
  {
    id: "birth-certificate",
    outputName: "BIRTH CERTIFICATE",
    shortcut: "BRT",
    patterns: [
      /\bbrt\b/i,
      /\bbirth\b/i,
      /\bjanma\b/i,
      /\bdob\b/i
    ]
  },
  {
    id: "bonafide-certificate",
    outputName: "BONAFIDE CERTIFICATE",
    shortcut: "BNF",
    patterns: [
      /\bbnf\b/i,
      /\bbonafide\b/i,
      /\bbonafied\b/i
    ]
  },
  {
    id: "gap-certificate",
    outputName: "GAP CERTIFICATE",
    shortcut: "GAP",
    patterns: [
      /\bgap\b/i,
      /\bgap\s*affidavit\b/i,
      /\bgap\s*cert\b/i
    ]
  },
  {
    id: "self-declaration",
    outputName: "SELF DECLARATION",
    shortcut: "SLF",
    patterns: [
      /\bslf\b/i,
      /\bself\b/i,
      /\bself\s*declaration\b/i,
      /\bswayam\b/i
    ]
  },
  {
    id: "parent-declaration",
    outputName: "PARENT DECLARATION",
    shortcut: "PAR",
    patterns: [
      /\bpar\b/i,
      /\bparent\b/i,
      /\bfather\b/i,
      /\bmother\b/i,
      /\bpalak\b/i
    ]
  }
];

export function evaluateMatch(text, groups = null) {
  if (!text || typeof text !== 'string') {
    return { docType: null, confidence: 0, matchedPattern: null };
  }

  const clean = text.replace(/[_\-\.]+/g, ' ').trim();
  const lower = clean.toLowerCase();

  // Custom groups override
  if (groups) {
    for (const [outputName, keywords] of Object.entries(groups)) {
      for (const kw of keywords) {
        const kwClean = kw.toLowerCase().trim();
        const pattern = new RegExp(`(^|[^a-z0-9])${kwClean}([^a-z0-9]|$)`, 'i');
        if (pattern.test(lower)) {
          return { docType: outputName, confidence: 95, matchedPattern: kw };
        }
      }
    }
  }

  // Precedence patterns
  for (const entry of DOCUMENT_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(lower)) {
        return {
          docType: entry.outputName,
          confidence: 90,
          matchedPattern: pattern.toString()
        };
      }
    }
  }

  return { docType: null, confidence: 0, matchedPattern: null };
}

/* ==========================================================================
   4. Filename Operations, Casing, and Construction
   ========================================================================== */

export function ext(name) {
  if (!name) return '';
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i) : '';
}

export function cleanName(name) {
  if (!name) return '';
  const e = ext(name);
  return e ? name.slice(0, -e.length) : name;
}

export function group(name, groups) {
  const match = evaluateMatch(name, groups);
  if (match && match.docType) return match.docType;

  const matched = matchDocument(name, groups);
  if (matched) return matched;

  return null;
}

export function applyCase(textOrSource, targetOrStyle = 'preserve', optionalStyle = null) {
  let text = textOrSource;
  let style = targetOrStyle;
  if (optionalStyle !== null) {
    text = targetOrStyle;
    style = optionalStyle;
  }
  if (!text) return '';
  if (style === 'upper') return text.toUpperCase();
  if (style === 'lower') return text.toLowerCase();
  if (style === 'title') {
    return text.toLowerCase().replace(/(^|[\s\-_])\S/g, c => c.toUpperCase());
  }
  return text; // 'preserve' or 'as_is'
}

export function buildName(input, student, groups, style = 'preserve') {
  const g = group(input, groups);
  let baseDoc = '';
  if (!g) {
    baseDoc = cleanName(input);
  } else {
    baseDoc = CANONICAL_NAMES[g.toUpperCase()] || g;
  }

  let combined = baseDoc;
  if (student && !baseDoc.toLowerCase().includes(student.toLowerCase())) {
    combined = `${baseDoc} ${student}`;
  }

  return applyCase(combined, style);
}

export function validateFilename(name) {
  if (!name || !name.trim()) return 'File name cannot be empty.';
  const trimmed = name.trim();
  if (name.endsWith('.') || name.endsWith(' ') || trimmed.endsWith('.')) {
    return 'File name cannot end with a period or space.';
  }
  if (/[\x00-\x1f\\/:*?"<>|]/.test(name)) return 'File name cannot contain \\ / : * ? " < > | or control characters.';
  if (trimmed === '.' || trimmed === '..') return 'Invalid file name.';

  const base = trimmed.toUpperCase().split('.')[0].trim();
  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  if (reserved.includes(base)) {
    return 'This file name is reserved by Windows OS.';
  }

  return '';
}

/* ==========================================================================
   5. Duplicate Name Handling (Non-colliding Suffixing)
   ========================================================================== */

export function uniqueDestination(desired, currentName, usedNames) {
  const usedLower = new Map();
  if (usedNames) {
    for (const name of usedNames) {
      if (name) usedLower.set(name.toLowerCase(), name);
    }
  }

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

/* ==========================================================================
   6. Multi-Level Undo Manager
   ========================================================================== */

export class UndoManager {
  constructor(maxHistory = 10) {
    this.history = [];
    this.maxHistory = maxHistory;
  }

  pushBatch(dir, plan) {
    if (!plan || !plan.length) return;
    this.history.push({
      dir,
      dirName: dir ? dir.name : '',
      plan: [...plan],
      timestamp: new Date().toISOString()
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  peek() {
    return this.history[this.history.length - 1] || null;
  }

  pop() {
    return this.history.pop() || null;
  }

  canUndo() {
    return this.history.length > 0;
  }

  clear() {
    this.history = [];
  }
}

export const undoManager = new UndoManager();

/* ==========================================================================
   7. Spelling Auto-Correction Library
   ========================================================================== */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function preserveCase(found, replacement) {
  if (found === found.toUpperCase()) return replacement.toUpperCase();
  if (found === found.toLowerCase()) return replacement.toLowerCase();
  if (found[0] === found[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}

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

/* ==========================================================================
   8. Checklist & Document Linking Engine
   ========================================================================== */

export function makeChecklist(raw) {
  return Object.fromEntries(
    Object.entries(raw).map(([name, rows]) => [
      name,
      rows.map(x =>
        Array.isArray(x)
          ? {
              name: x[0],
              keywords: x[1],
              short: x[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, '').slice(0, 18)
            }
          : x
      )
    ])
  );
}

function fileMatchesKeyword(fileName, keyword, ruleName = '') {
  const lowerName = fileName.toLowerCase();
  const q = keyword.toLowerCase().trim();

  // Safety: Caste certificate must NOT match validity-only files
  if (ruleName === 'CASTE CERTIFICATE' && (lowerName.includes('validity') || lowerName.includes('vld'))) {
    if (!lowerName.includes('caste certificate') && !lowerName.includes('cast certificate')) {
      return false;
    }
  }

  if (!q.includes(' ')) {
    return new RegExp(`(^|[^a-z0-9])${q}([^a-z0-9]|$)`, 'i').test(lowerName);
  }

  return lowerName.includes(q);
}

export function evaluateChecklistRule(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  const normalizedRuleName = rule.name.trim().toUpperCase();
  const activeLinks = Array.isArray(linkedRules) ? linkedRules : DEFAULT_LINKED_RULES;

  // 1. Combined document link
  for (const link of activeLinks) {
    if (link.type === 'combined' && (link.part1 === normalizedRuleName || link.part2 === normalizedRuleName)) {
      const combinedClean = link.combined.toLowerCase();
      const matched = fileNames.find(fn => {
        const lower = fn.toLowerCase();
        return lower.includes(combinedClean) ||
               (lower.includes('12th') && lower.includes('marksheet') && lower.includes('passing')) ||
               (lower.includes('10th') && lower.includes('marksheet') && lower.includes('passing')) ||
               (lower.includes('12mp') || lower.includes('10mp'));
      });
      if (matched) {
        return {
          status: 'green',
          matchedFile: matched,
          isLinked: true,
          linkedReason: `Fulfilled via combined file "${link.combined}"`
        };
      }
    }
  }

  // 2. Alias document link
  for (const link of activeLinks) {
    if (link.type === 'alias' && link.part1 === normalizedRuleName) {
      const aliasClean = link.part2.toLowerCase();
      const matched = fileNames.find(fn => fn.toLowerCase().includes(aliasClean));
      if (matched) {
        return {
          status: 'green',
          matchedFile: matched,
          isLinked: true,
          linkedReason: `Fulfilled via alias "${link.part2}"`
        };
      }
    }
  }

  // 3. Direct keyword matching
  const keywords = Array.isArray(rule.keywords) ? rule.keywords : [rule.name];
  for (const kw of keywords) {
    const matched = fileNames.find(fn => fileMatchesKeyword(fn, kw, normalizedRuleName));
    if (matched) {
      return { status: 'green', matchedFile: matched, isLinked: false };
    }
  }

  return { status: 'red', matchedFile: null, isLinked: false };
}

export function getChecklistStatus(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  const res = evaluateChecklistRule(fileNames, rule, linkedRules);
  return res.status;
}

export function evaluateChecklistSummary(fileNames, rules = [], linkedRules = DEFAULT_LINKED_RULES) {
  const evaluations = rules.map(rule => ({
    rule,
    ...evaluateChecklistRule(fileNames, rule, linkedRules)
  }));

  const foundCount = evaluations.filter(e => e.status === 'green').length;
  const missingCount = evaluations.filter(e => e.status === 'red').length;
  const totalRequired = rules.length;
  const percentComplete = totalRequired > 0 ? Math.round((foundCount / totalRequired) * 100) : 100;
  const isReady = missingCount === 0;

  const missingList = evaluations
    .filter(e => e.status === 'red')
    .map(e => e.rule.name);

  return {
    evaluations,
    foundCount,
    missingCount,
    totalRequired,
    percentComplete,
    isReady,
    missingList
  };
}

export async function allFileNames(handle, path = '') {
  const out = [];
  try {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        out.push(path ? `${path}/${entry.name}` : entry.name);
      } else if (entry.kind === 'directory') {
        const sub = await allFileNames(entry, path ? `${path}/${entry.name}` : entry.name);
        out.push(...sub);
      }
    }
  } catch (err) {
    console.warn('[rename_tool_logic] allFileNames error:', err);
  }
  return out;
}

/* ==========================================================================
   9. Batch Audit CSV Report Export
   ========================================================================== */

export function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateBatchAuditCSV(batchResults, rules, checklistName = 'Checklist') {
  const headers = [
    'Sr No',
    'Student Name',
    'Folder Name',
    ...rules.map(r => r.name),
    'Verified Count',
    'Missing Count',
    'Total Rules',
    'Completion %',
    'Readiness Status',
    'Missing Documents'
  ];

  const rows = [headers.map(escapeCSV).join(',')];

  batchResults.forEach((item, idx) => {
    const evMap = {};
    if (item.summary && Array.isArray(item.summary.evaluations)) {
      item.summary.evaluations.forEach(ev => {
        evMap[ev.rule.name] = ev.status === 'green' ? (ev.isLinked ? 'LINKED' : 'PRESENT') : 'MISSING';
      });
    }

    const row = [
      idx + 1,
      item.studentName || 'Unknown Student',
      item.folderName || '',
      ...rules.map(r => evMap[r.name] || 'MISSING'),
      item.summary?.foundCount || 0,
      item.summary?.missingCount || 0,
      item.summary?.totalRequired || rules.length,
      `${item.summary?.percentComplete || 0}%`,
      item.summary?.isReady ? 'READY FOR SUBMISSION' : 'INCOMPLETE',
      (item.summary?.missingList || []).join('; ')
    ];
    rows.push(row.map(escapeCSV).join(','));
  });

  return rows.join('\r\n');
}

/* ==========================================================================
   10. Rename Plan and Execution
   ========================================================================== */

export function planRename(files, inputs, student, groups, style, selectedIndices = null) {
  const plan = [];
  const used = new Set(files.map(f => f.name));
  const indices = selectedIndices !== null ? selectedIndices : files.map((_, i) => i);

  for (const i of indices) {
    const file = files[i];
    if (!file) continue;
    const typed = (inputs[i] ?? cleanName(file.name)).trim();
    const error = validateFilename(typed);
    if (error) return { error: `${file.name}: ${error}` };

    const desired = buildName(typed, student, groups, style) + ext(file.name);
    if (desired === file.name) continue;

    const next = uniqueDestination(desired, file.name, used);
    used.add(next);
    plan.push({ old: file.name, next, file, handle: file.handle || null, index: i });
  }

  return { plan };
}

export async function executeRename(dir, plan, onProgress = null) {
  const written = [];
  try {
    let completed = 0;
    for (const item of plan) {
      // 1. Native Desktop Rename (0 browser prompt, atomic rename)
      const dirPath = dir ? (dir.nativePath || dir.path || '') : '';
      const oldPath = item.nativePath || (item.file && (item.file.path || item.file.nativePath)) || (dirPath ? `${dirPath}/${item.old}` : null);
      if (oldPath) {
        const res = await renameNativeFile(oldPath, item.next);
        if (!res.success) {
          throw new Error(res.error || `Failed to rename ${item.old}`);
        }
        if (item.file) {
          const newPath = res.path || res.newPath;
          if (newPath) {
            item.file.path = newPath;
            item.file.nativePath = newPath;
            item.file.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(newPath)}`;
          }
          item.file.name = item.next;
          item.file.targetName = item.next;
          item.file.isRenamed = true;
          item.file.status = 'renamed';
        }
        written.push(item);
        completed++;
        if (onProgress) {
          const pct = Math.round((completed / plan.length) * 100);
          onProgress(pct, `Renamed ${completed} of ${plan.length} files...`);
        }
        continue;
      }

      // 2. Browser File System Access API Rename fallback
      const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;

      if (!isCaseOnly) {
        let finalNext = item.next;
        let handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
        if (handle) {
          const suffix = ext(finalNext);
          const base = cleanName(finalNext).replace(/\s+\d+$/, '');
          let counter = 1;
          finalNext = `${base} ${counter}${suffix}`;
          handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          while (handle) {
            counter++;
            finalNext = `${base} ${counter}${suffix}`;
            handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          }
          item.next = finalNext;
        }
      }

      let sourceHandle = item.handle;
      if (!sourceHandle) {
        sourceHandle = await dir.getFileHandle(item.old, { create: false }).catch(() => null);
      }

      let movedSuccessfully = false;
      if (sourceHandle && typeof sourceHandle.move === 'function') {
        try {
          if (isCaseOnly) {
            const tempName = `__tmp_${Date.now()}_${item.next}`;
            await sourceHandle.move(tempName);
            await sourceHandle.move(item.next);
          } else {
            await sourceHandle.move(item.next);
          }
          movedSuccessfully = true;
          written.push(item);
        } catch (moveErr) {
          console.warn('sourceHandle.move() not supported on this handle, falling back to stream copy:', moveErr);
          movedSuccessfully = false;
        }
      }

      if (!movedSuccessfully) {
        const data = await item.file.arrayBuffer();
        let targetHandle;

        if (isCaseOnly) {
          const tempName = `__tmp_${Date.now()}_${item.next}`;
          const tempOut = await dir.getFileHandle(tempName, { create: true });
          const tw = await tempOut.createWritable();
          await tw.write(data);
          await tw.close();
          await dir.removeEntry(item.old);

          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const w = await targetHandle.createWritable();
          await w.write(data);
          await w.close();
          await dir.removeEntry(tempName);
        } else {
          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const writer = await targetHandle.createWritable();
          await writer.write(data);
          await writer.close();
          await dir.removeEntry(item.old);
        }
        written.push(item);
      }

      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / plan.length) * 100), `${completed}/${plan.length} files renamed`);
      }
    }
    return written;
  } catch (error) {
    throw error;
  }
}

export async function undoRename(dir, plan, onProgress = null) {
  const reversed = [...plan].reverse();
  let completed = 0;

  for (const item of reversed) {
    const dirPath = dir ? (dir.nativePath || dir.path || '') : '';
    const currentPath = (item.file && (item.file.path || item.file.nativePath)) ||
                        (dirPath ? `${dirPath}/${item.next}` : null) ||
                        (item.nativePath ? item.nativePath.replace(/[^\\\/]+$/, item.next) : null);

    if (currentPath) {
      const res = await renameNativeFile(currentPath, item.old);
      if (res && res.success) {
        const restoredPath = res.path || (item.nativePath || (dirPath ? `${dirPath}/${item.old}` : currentPath.replace(/[^\\\/]+$/, item.old)));
        if (item.file) {
          item.file.path = restoredPath;
          item.file.nativePath = restoredPath;
          item.file.name = item.old;
          item.file.targetName = item.old;
          item.file.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(restoredPath)}`;
          item.file.isRenamed = false;
          item.file.status = 'pending';
        }
      }
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
      }
      continue;
    }

    const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;
    const currentHandle = await dir.getFileHandle(item.next, { create: false }).catch(() => null);

    if (currentHandle && typeof currentHandle.move === 'function') {
      if (isCaseOnly) {
        const tempName = `__tmp_undo_${Date.now()}_${item.old}`;
        await currentHandle.move(tempName);
        await currentHandle.move(item.old);
      } else {
        await currentHandle.move(item.old);
      }
    } else if (currentHandle) {
      const data = await (await currentHandle.getFile()).arrayBuffer();
      const oldHandle = await dir.getFileHandle(item.old, { create: true });
      const writer = await oldHandle.createWritable();
      await writer.write(data);
      await writer.close();
      await dir.removeEntry(item.next);
    }

    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
    }
  }
}
