/* ==========================================================================
   Student Document Renamer — Intelligent Document Matcher & Percentage Engine
   ========================================================================== */

export const DOCUMENT_PATTERNS = [
  // 1. Compound / Multi-keyword documents first (higher precedence)
  {
    id: "12th-marksheet-passing-combined",
    outputName: "12TH MARKSHEET AND PASSING",
    shortcut: "12MP",
    patterns: [
      /\b12mp\b/i,
      /\b12tmp\b/i,
      /\b12(th)?\s*(mark|marksheet|मार्क|मार्कशीट).*(pass|passing|पास)\b/i,
      /\b12(th)?\s*(pass|passing|पास).*(mark|marksheet|मार्क|मार्कशीट)\b/i,
      /\b12(th)?\s*combined\b/i
    ]
  },
  {
    id: "validity-certificate",
    outputName: "VALIDITY CERTIFICATE",
    shortcut: "VLD",
    patterns: [
      /\bvld\b/i,
      /\bvalidity\b/i,
      /\bcaste\s*validity\b/i,
      /वैधता/i
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
      /\bhsc\s*leaving\b/i,
      /12.*(एलसी|दाखला|tc)/i
    ]
  },
  {
    id: "12th-marksheet",
    outputName: "12TH MARKSHEET",
    shortcut: "12M",
    patterns: [
      /\b12m\b/i,
      /\b12(th)?\s*(mark|marksheet|marskheet)\b/i,
      /\bhsc\s*(mark|marksheet)\b/i,
      /12.*(मार्क|मार्कशीट)/i
    ]
  },
  {
    id: "12th-passing",
    outputName: "12TH PASSING CERTIFICATE",
    shortcut: "12P",
    patterns: [
      /\b12p\b/i,
      /\b12(th)?\s*(pass|passing|pasing)\b/i,
      /\bhsc\s*(pass|passing)\b/i,
      /12.*(पास|पासिंग)/i
    ]
  },
  {
    id: "11th-marksheet",
    outputName: "11TH MARKSHEET",
    shortcut: "11M",
    patterns: [
      /\b11m\b/i,
      /\b11(th)?\s*(mark|marksheet|marskheet)\b/i,
      /11.*(मार्क|मार्कशीट)/i
    ]
  },
  {
    id: "11th-passing",
    outputName: "11TH PASSING CERTIFICATE",
    shortcut: "11P",
    patterns: [
      /\b11p\b/i,
      /\b11(th)?\s*(pass|passing|pasing)\b/i,
      /11.*(पास|पासिंग)/i
    ]
  },
  {
    id: "10th-marksheet",
    outputName: "10TH MARKSHEET",
    shortcut: "10M",
    patterns: [
      /\b10m\b/i,
      /\b10(th)?\s*(mark|marksheet|marskheet)\b/i,
      /\bssc\s*(mark|marksheet)\b/i,
      /10.*(मार्क|मार्कशीट)/i
    ]
  },
  {
    id: "10th-lc",
    outputName: "10TH LC",
    shortcut: "10LC",
    patterns: [
      /\b10lc\b/i,
      /\b10l\b/i,
      /\b10(th)?\s*lc\b/i,
      /\b10(th)?\s*leaving\b/i,
      /\b10(th)?\s*tc\b/i,
      /\bssc\s*(lc|leaving|tc)\b/i,
      /10.*(एलसी|दाखला|tc)/i
    ]
  },
  {
    id: "10th-marksheet-passing-combined",
    outputName: "10TH MARKSHEET AND PASSING",
    shortcut: "10MP",
    patterns: [
      /\b10mp\b/i,
      /\b10tmp\b/i,
      /\b10(th)?\s*(mark|marksheet|मार्क|मार्कशीट).*(pass|passing|पास)\b/i,
      /\b10(th)?\s*(pass|passing|पास).*(mark|marksheet|मार्क|मार्कशीट)\b/i,
      /\b10(th)?\s*combined\b/i
    ]
  },
  {
    id: "apaar-id",
    outputName: "APAAR ID",
    shortcut: "APAAR",
    patterns: [
      /\bapaar\b/i,
      /\bapaar\s*id\b/i,
      /\babc\s*id\b/i,
      /\babc\b/i,
      /अपार/i
    ]
  },
  {
    id: "degree-certificate",
    outputName: "DEGREE CERTIFICATE",
    shortcut: "DEG",
    patterns: [
      /\bdeg\b/i,
      /\bdegree\b/i,
      /\bdegree\s*certificate\b/i,
      /पदवी/i
    ]
  },
  {
    id: "registration-certificate",
    outputName: "REGISTRATION CERTIFICATE",
    shortcut: "REG",
    patterns: [
      /\breg\b/i,
      /\bregistration\b/i,
      /\bregistration\s*certificate\b/i,
      /नोंदणी/i
    ]
  },
  {
    id: "ration-card",
    outputName: "RATION CARD",
    shortcut: "RAT",
    patterns: [
      /\brat\b/i,
      /\bration\b/i,
      /\bration\s*card\b/i,
      /रेशन/i
    ]
  },
  {
    id: "10th-passing",
    outputName: "10TH PASSING CERTIFICATE",
    shortcut: "10P",
    patterns: [
      /\b10p\b/i,
      /\b10(th)?\s*(pass|passing|pasing)\b/i,
      /\bssc\s*(pass|passing)\b/i,
      /10.*(पास|पासिंग)/i
    ]
  },
  {
    id: "aadhaar-card",
    outputName: "AADHAAR CARD",
    shortcut: "ADR",
    patterns: [
      /\badr\b/i,
      /\b(aadhaar|aadhar|adhar|aadhhar)\b/i,
      /आधार/i
    ]
  },
  {
    id: "pan-card",
    outputName: "PAN CARD",
    shortcut: "PAN",
    patterns: [
      /\bpan\b/i,
      /\bpan\s*card\b/i,
      /पॅन/i
    ]
  },
  {
    id: "photo",
    outputName: "PHOTO",
    shortcut: "PIC",
    patterns: [
      /\bpic\b/i,
      /\b(photo|photograph|picture)\b/i,
      /\bstudent\s*photo\b/i,
      /\bpassport\s*photo\b/i,
      /फोटो/i
    ]
  },
  {
    id: "caste-certificate",
    outputName: "CASTE CERTIFICATE",
    shortcut: "CAST",
    patterns: [
      /\bcast\b/i,
      /\bcaste\b/i,
      /\bjati\b/i,
      /जात/i
    ]
  },
  {
    id: "domicile-certificate",
    outputName: "DOMICILE CERTIFICATE",
    shortcut: "DOMI",
    patterns: [
      /\bdomi\b/i,
      /\b(domicile|domocile|adhivas)\b/i,
      /अधिवास|रहिवासी/i
    ]
  },
  {
    id: "nationality-certificate",
    outputName: "NATIONALITY CERTIFICATE",
    shortcut: "NATI",
    patterns: [
      /\bnati\b/i,
      /\bnationality\b/i,
      /राष्ट्रीयत्व/i
    ]
  },
  {
    id: "income-certificate",
    outputName: "INCOME CERTIFICATE",
    shortcut: "INCO",
    patterns: [
      /\binco\b/i,
      /\b(income|incom|utpanna)\b/i,
      /उत्पन्न/i
    ]
  },
  {
    id: "bank-passbook",
    outputName: "PASSBOOK BANK",
    shortcut: "PASS",
    patterns: [
      /\bpass\b/i,
      /\b(passbook|pasbook|bank\s*passbook)\b/i,
      /पासबुक|बँक/i
    ]
  },
  {
    id: "attempt-certificate",
    outputName: "ATTEMPT CERTIFICATE",
    shortcut: "ATM",
    patterns: [
      /\batm\b/i,
      /\b(attempt|atempt|attmpt)\b/i,
      /अटेम्प्ट|प्रयत्न/i
    ]
  },
  {
    id: "birth-certificate",
    outputName: "BIRTH CERTIFICATE",
    shortcut: "BIR",
    patterns: [
      /\bbir\b/i,
      /\b(birth|janma)\b/i,
      /जन्म/i
    ]
  },
  {
    id: "bonafide-certificate",
    outputName: "BONAFIDE CERTIFICATE",
    shortcut: "BONA",
    patterns: [
      /\bbona\b/i,
      /\b(bonafide|bonafied|bonafidee)\b/i,
      /बोनाफाईड|बोनाफाइड/i
    ]
  },
  {
    id: "gap-certificate",
    outputName: "GAP CERTIFICATE",
    shortcut: "GAP",
    patterns: [
      /\bgap\b/i,
      /\bgap\s*certificate\b/i,
      /गॅप/i
    ]
  },
  {
    id: "self-declaration",
    outputName: "SELF DECLARATION",
    shortcut: "SELF",
    patterns: [
      /\bself\b/i,
      /\bself\s*declaration\b/i,
      /\bsvataha\b/i,
      /स्वयं/i
    ]
  },
  {
    id: "parent-declaration",
    outputName: "PARENT DECLARATION",
    shortcut: "PART",
    patterns: [
      /\bpart\b/i,
      /\b(parent|palak)\b/i,
      /\bparent\s*declaration\b/i,
      /पालक/i
    ]
  }
];

/**
 * Intelligent Document Matcher with Percentage Scoring
 * @param {string} text - The input string (file name or typed shortcut)
 * @param {Object} [groups] - Custom groups from user settings
 * @returns {Object} Match evaluation result
 */
export function evaluateMatch(text, groups = null) {
  if (!text || typeof text !== 'string') {
    return {
      docType: null,
      percentage: 0,
      badgeText: 'Needs Input ✏️',
      badgeClass: 'matchNeutral',
      status: 'none'
    };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Exact primary shortcut match (e.g. "12M", "ATM", "SELF", "BONA")
  for (const item of DOCUMENT_PATTERNS) {
    if (lower === item.shortcut.toLowerCase()) {
      return {
        docType: item.outputName,
        percentage: 100,
        badgeText: `100% Match: ${item.outputName}`,
        badgeClass: 'matchGreen',
        status: 'exact'
      };
    }
  }

  // 2. Active groups check (custom user rules in settings)
  if (groups) {
    for (const [ruleName, keys] of Object.entries(groups)) {
      if (Array.isArray(keys)) {
        for (const k of keys) {
          const q = k.toLowerCase().trim();
          if (lower === q) {
            return {
              docType: ruleName,
              percentage: 100,
              badgeText: `100% Match: ${ruleName}`,
              badgeClass: 'matchGreen',
              status: 'exact'
            };
          }
        }
      }
    }
  }

  // 3. Pattern recognition on filename / input
  for (const item of DOCUMENT_PATTERNS) {
    for (const pat of item.patterns) {
      if (pat.test(lower)) {
        return {
          docType: item.outputName,
          percentage: 100,
          badgeText: `100% Match: ${item.outputName}`,
          badgeClass: 'matchGreen',
          status: 'pattern'
        };
      }
    }
  }

  // 4. Custom active groups substring check
  if (groups) {
    for (const [ruleName, keys] of Object.entries(groups)) {
      if (Array.isArray(keys)) {
        for (const k of keys) {
          const q = k.toLowerCase().trim();
          if (q.length > 2 && lower.includes(q)) {
            return {
              docType: ruleName,
              percentage: 90,
              badgeText: `90% Match: ${ruleName}`,
              badgeClass: 'matchYellow',
              status: 'custom'
            };
          }
        }
      }
    }
  }

  // 5. No match
  return {
    docType: null,
    percentage: 0,
    badgeText: 'Needs Input ✏️',
    badgeClass: 'matchNeutral',
    status: 'none'
  };
}
