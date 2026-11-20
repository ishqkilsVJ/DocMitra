/* ==========================================================================
   Student Document Renamer — Strict Single-Keyword Dictionary
   (All 21 Documents Preserved — Exactly 1 Clean Short Keyword Per Document)
   ========================================================================== */

export const DEFAULT_SHORTCUT_DICTIONARY = [
  {
    id: "aadhaar-card",
    displayName: "Aadhaar Card",
    primaryShortcut: "ADR",
    alternateKeywords: [],
    outputName: "AADHAAR CARD"
  },
  {
    id: "pan-card",
    displayName: "PAN Card",
    primaryShortcut: "PAN",
    alternateKeywords: [],
    outputName: "PAN CARD"
  },
  {
    id: "photo",
    displayName: "Student Photo",
    primaryShortcut: "PIC",
    alternateKeywords: [],
    outputName: "PHOTO"
  },
  {
    id: "10th-marksheet",
    displayName: "10th Marksheet",
    primaryShortcut: "10M",
    alternateKeywords: [],
    outputName: "10TH MARKSHEET"
  },
  {
    id: "10th-passing",
    displayName: "10th Passing Certificate",
    primaryShortcut: "10P",
    alternateKeywords: [],
    outputName: "10TH PASSING CERTIFICATE"
  },
  {
    id: "11th-marksheet",
    displayName: "11th Marksheet",
    primaryShortcut: "11M",
    alternateKeywords: [],
    outputName: "11TH MARKSHEET"
  },
  {
    id: "11th-passing",
    displayName: "11th Passing Certificate",
    primaryShortcut: "11P",
    alternateKeywords: [],
    outputName: "11TH PASSING CERTIFICATE"
  },
  {
    id: "10th-lc",
    displayName: "10th Leaving Certificate (LC)",
    primaryShortcut: "10LC",
    alternateKeywords: [],
    outputName: "10TH LC"
  },
  {
    id: "10th-marksheet-passing-combined",
    displayName: "10th Marksheet and Passing Combined",
    primaryShortcut: "10MP",
    alternateKeywords: [],
    outputName: "10TH MARKSHEET AND PASSING"
  },
  {
    id: "apaar-id",
    displayName: "APAAR ID / ABC ID",
    primaryShortcut: "APAAR",
    alternateKeywords: [],
    outputName: "APAAR ID"
  },
  {
    id: "degree-certificate",
    displayName: "Degree Certificate",
    primaryShortcut: "DEG",
    alternateKeywords: [],
    outputName: "DEGREE CERTIFICATE"
  },
  {
    id: "registration-certificate",
    displayName: "Registration Certificate (Nursing/Council)",
    primaryShortcut: "REG",
    alternateKeywords: [],
    outputName: "REGISTRATION CERTIFICATE"
  },
  {
    id: "ration-card",
    displayName: "Ration Card",
    primaryShortcut: "RAT",
    alternateKeywords: [],
    outputName: "RATION CARD"
  },
  {
    id: "12th-marksheet",
    displayName: "12th Marksheet",
    primaryShortcut: "12M",
    alternateKeywords: [],
    outputName: "12TH MARKSHEET"
  },
  {
    id: "12th-passing",
    displayName: "12th Passing Certificate",
    primaryShortcut: "12P",
    alternateKeywords: [],
    outputName: "12TH PASSING CERTIFICATE"
  },
  {
    id: "12th-lc",
    displayName: "12th Leaving Certificate (LC)",
    primaryShortcut: "12LC",
    alternateKeywords: [],
    outputName: "12TH LC"
  },
  {
    id: "12th-marksheet-passing-combined",
    displayName: "12th Marksheet & Passing Combined",
    primaryShortcut: "12MP",
    alternateKeywords: [],
    outputName: "12TH MARKSHEET AND PASSING"
  },
  {
    id: "caste-certificate",
    displayName: "Caste Certificate",
    primaryShortcut: "CST",
    alternateKeywords: ["CAST"],
    outputName: "CASTE CERTIFICATE"
  },
  {
    id: "validity-certificate",
    displayName: "Caste Validity Certificate",
    primaryShortcut: "VLD",
    alternateKeywords: [],
    outputName: "VALIDITY CERTIFICATE"
  },
  {
    id: "domicile-certificate",
    displayName: "Domicile Certificate",
    primaryShortcut: "DOM",
    alternateKeywords: ["DOMI"],
    outputName: "DOMICILE CERTIFICATE"
  },
  {
    id: "nationality-certificate",
    displayName: "Nationality Certificate",
    primaryShortcut: "NAT",
    alternateKeywords: ["NATI"],
    outputName: "NATIONALITY CERTIFICATE"
  },
  {
    id: "income-certificate",
    displayName: "Income Certificate",
    primaryShortcut: "INC",
    alternateKeywords: ["INCO"],
    outputName: "INCOME CERTIFICATE"
  },
  {
    id: "bank-passbook",
    displayName: "Bank Passbook",
    primaryShortcut: "BNK",
    alternateKeywords: ["PASS"],
    outputName: "PASSBOOK BANK"
  },
  {
    id: "attempt-certificate",
    displayName: "Attempt Certificate",
    primaryShortcut: "ATM",
    alternateKeywords: [],
    outputName: "ATTEMPT CERTIFICATE"
  },
  {
    id: "birth-certificate",
    displayName: "Birth Certificate",
    primaryShortcut: "BRT",
    alternateKeywords: ["BIR"],
    outputName: "BIRTH CERTIFICATE"
  },
  {
    id: "bonafide-certificate",
    displayName: "Bonafide Certificate",
    primaryShortcut: "BNF",
    alternateKeywords: ["BONA"],
    outputName: "BONAFIDE CERTIFICATE"
  },
  {
    id: "gap-certificate",
    displayName: "Gap Certificate",
    primaryShortcut: "GAP",
    alternateKeywords: [],
    outputName: "GAP CERTIFICATE"
  },
  {
    id: "self-declaration",
    displayName: "Self Declaration",
    primaryShortcut: "SLF",
    alternateKeywords: ["SELF"],
    outputName: "SELF DECLARATION"
  },
  {
    id: "parent-declaration",
    displayName: "Parent Declaration",
    primaryShortcut: "PAR",
    alternateKeywords: ["PART"],
    outputName: "PARENT DECLARATION"
  },
  {
    id: "cap-allotment",
    displayName: "CAP Allotment Letter",
    primaryShortcut: "CAP",
    alternateKeywords: [],
    outputName: "CAP ALLOTMENT LETTER"
  }
];

export function exportDictionaryToGroups(dictionary = DEFAULT_SHORTCUT_DICTIONARY) {
  const groups = {};
  for (const item of dictionary) {
    groups[item.outputName] = [item.primaryShortcut.toLowerCase(), ...(item.alternateKeywords || []).map(k => k.toLowerCase())];
  }
  return groups;
}

export function getActiveShortcutDictionary(groups = null) {
  if (!groups || typeof groups !== 'object' || !Object.keys(groups).length) {
    return DEFAULT_SHORTCUT_DICTIONARY;
  }

  const defaultMeta = new Map();
  for (const item of DEFAULT_SHORTCUT_DICTIONARY) {
    defaultMeta.set(item.outputName.toUpperCase(), item);
    if (item.canonicalKey) defaultMeta.set(item.canonicalKey.toUpperCase(), item);
  }

  const activeDict = [];
  for (const [ruleName, keys] of Object.entries(groups)) {
    if (!ruleName) continue;
    const upperRule = ruleName.trim().toUpperCase();
    const keyList = Array.isArray(keys) ? keys.map(k => String(k).trim()).filter(Boolean) : [];
    const primaryKey = keyList.length > 0 ? keyList[0].toUpperCase() : upperRule;
    const alternates = keyList.slice(1);

    const meta = defaultMeta.get(upperRule);
    if (meta) {
      activeDict.push({
        id: meta.id,
        displayName: meta.displayName,
        primaryShortcut: primaryKey,
        alternateKeywords: alternates,
        outputName: upperRule,
        canonicalKey: meta.canonicalKey || upperRule
      });
    } else {
      activeDict.push({
        id: upperRule.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        displayName: upperRule,
        primaryShortcut: primaryKey,
        alternateKeywords: alternates,
        outputName: upperRule,
        canonicalKey: upperRule
      });
    }
  }

  return activeDict;
}

export function findKeywordConflict(keyword, targetRuleName, groups) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return null;

  for (const [ruleName, keys] of Object.entries(groups || {})) {
    if (ruleName === targetRuleName) continue;
    if (Array.isArray(keys) && keys.map(k => k.toLowerCase().trim()).includes(normalized)) {
      return ruleName;
    }
  }
  return null;
}

export function matchDocument(input, groups = null) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim().toLowerCase();
  
  // 1. Active groups check (custom user rules take top priority!)
  if (groups && typeof groups === 'object') {
    for (const [ruleName, keys] of Object.entries(groups)) {
      if (Array.isArray(keys)) {
        for (const key of keys) {
          if (raw === key.toLowerCase().trim()) {
            return ruleName;
          }
        }
      }
    }
  }

  // 2. Exact primary shortcut match in active dictionary
  const dict = getActiveShortcutDictionary(groups);
  for (const item of dict) {
    if (raw === item.primaryShortcut.toLowerCase()) {
      return item.outputName;
    }
  }

  // 3. Fallback to default dictionary
  for (const item of DEFAULT_SHORTCUT_DICTIONARY) {
    if (raw === item.primaryShortcut.toLowerCase()) {
      return item.outputName;
    }
  }
  
  return null;
}

/**
 * Get dynamic, intelligent shortcode suggestions as user types
 * Live synchronizes with user's settings rules and modifications!
 * @param {string} query
 * @param {object} groups
 * @param {number} limit
 */
export function getMatchingSuggestions(query = '', groups = null, limit = 5) {
  const normalized = (query || '').trim().toLowerCase();
  const dict = getActiveShortcutDictionary(groups);

  // If query is empty: Return top 5 popular active shortcuts
  if (!normalized) {
    const preferredCodes = ['12M', 'ADR', 'PIC', '10M', 'CAST', 'INC', 'INCO', 'CAP'];
    const topMatches = dict.filter(d => preferredCodes.includes(d.primaryShortcut.toUpperCase()));
    const finalSelection = topMatches.length >= 5 ? topMatches.slice(0, 5) : dict.slice(0, 5);

    return finalSelection.map(d => ({
      code: d.primaryShortcut,
      name: d.outputName,
      displayName: d.displayName
    }));
  }

  const results = [];
  const addedCodes = new Set();

  const add = (item, priority) => {
    if (!addedCodes.has(item.primaryShortcut)) {
      addedCodes.add(item.primaryShortcut);
      results.push({
        code: item.primaryShortcut,
        name: item.outputName,
        displayName: item.displayName,
        priority
      });
    }
  };

  // 1. Primary shortcut starts with query (e.g. "inc" -> "INC", "vij" -> "VIJAY", "12" -> "12M")
  for (const item of dict) {
    if (item.primaryShortcut.toLowerCase().startsWith(normalized)) {
      add(item, 1);
    }
  }

  // 2. Output name or display name starts with query
  for (const item of dict) {
    const out = item.outputName.toLowerCase();
    const disp = (item.displayName || '').toLowerCase();
    if (out.startsWith(normalized) || disp.startsWith(normalized)) {
      add(item, 2);
    }
  }

  // 3. Alternate keywords match
  for (const item of dict) {
    if (Array.isArray(item.alternateKeywords)) {
      if (item.alternateKeywords.some(ak => ak.toLowerCase().startsWith(normalized))) {
        add(item, 3);
      }
    }
  }

  // 4. Any word in output name starts with query (e.g. "pass" -> "10TH PASSING")
  for (const item of dict) {
    const words = item.outputName.toLowerCase().split(/\s+/);
    if (words.some(w => w.startsWith(normalized))) {
      add(item, 4);
    }
  }

  // 5. Contains query anywhere in shortcut or output name
  for (const item of dict) {
    const sc = item.primaryShortcut.toLowerCase();
    const out = item.outputName.toLowerCase();
    if (sc.includes(normalized) || out.includes(normalized)) {
      add(item, 5);
    }
  }

  // If results found, return top results up to limit
  if (results.length > 0) {
    return results.slice(0, limit);
  }

  // Return empty array so UI cleanly indicates no matches
  return [];
}
