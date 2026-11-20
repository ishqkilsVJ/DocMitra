/* ==========================================================================
   Student Document Renamer — Accurate Checklist & Document Linking Engine
   (Binary Green/Red Precision, Strict Renamed Match, Multi-Document Linking)
   ========================================================================== */

import { DEFAULT_LINKED_RULES } from '../core/constants.js';

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

/**
 * Check if a file name matches a keyword safely
 */
function fileMatchesKeyword(fileName, keyword, ruleName = '') {
  const lowerName = fileName.toLowerCase();
  const q = keyword.toLowerCase().trim();

  // Safety: Caste certificate must NOT match validity-only files
  if (ruleName === 'CASTE CERTIFICATE' && (lowerName.includes('validity') || lowerName.includes('vld'))) {
    if (!lowerName.includes('caste certificate') && !lowerName.includes('cast certificate')) {
      return false;
    }
  }

  // If keyword has no spaces (single token/shortcut like 'domi', 'nati', 'cast', 'pass', 'adr', '12m', 'tc')
  // Use word boundary to avoid false substring matches inside other words (e.g. 'domi' matching 'domicile', 'pass' matching 'passing')
  if (!q.includes(' ')) {
    return new RegExp(`(^|[^a-z0-9])${q}([^a-z0-9]|$)`, 'i').test(lowerName);
  }

  return lowerName.includes(q);
}

/**
 * Evaluates a single checklist rule against folder files, utilizing Document Linking
 * @param {Array<string>} fileNames - List of file names in the folder
 * @param {Object} rule - Checklist rule object
 * @param {Array<Object>} [linkedRules] - Active document linking rules
 * @returns {Object} Evaluation result
 */
export function evaluateChecklistRule(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  const normalizedRuleName = rule.name.trim().toUpperCase();
  const activeLinks = Array.isArray(linkedRules) ? linkedRules : DEFAULT_LINKED_RULES;

  // 1. DOCUMENT LINKING MATCH (Combined Files)
  // Check if this rule is fulfilled by a combined multi-document file
  for (const link of activeLinks) {
    const p1 = (link.part1 || '').trim().toUpperCase();
    const p2 = (link.part2 || '').trim().toUpperCase();
    const comb = (link.combined || '').trim().toUpperCase();

    // Case A: Rule is Part 1 or Part 2 of a combined document
    // (e.g. Rule is '12TH MARKSHEET' or '12TH PASSING CERTIFICATE' and combined file is '12TH MARKSHEET AND PASSING')
    if (normalizedRuleName === p1 || normalizedRuleName === p2) {
      for (const f of fileNames) {
        const lower = f.toLowerCase();
        const matchesCombined = lower.includes(comb.toLowerCase()) ||
          (comb.includes('12TH MARKSHEET') && lower.includes('12th marksheet and passing')) ||
          (comb.includes('10TH MARKSHEET') && lower.includes('10th marksheet and passing')) ||
          (comb.includes('DOMICILE') && lower.includes('domicile and nationality'));

        if (matchesCombined) {
          return {
            status: 'green',
            matchedFile: f,
            note: `🔗 Fulfilled by Combined File: ${f}`,
            isLinked: true,
            type: 'combined'
          };
        }
      }
    }
  }

  // 2. DIRECT ACCURATE MATCH
  // Check if a file in the folder directly matches this rule's keywords or name
  for (const f of fileNames) {
    const lower = f.toLowerCase();
    let isDirectMatch = rule.keywords.some(kw => fileMatchesKeyword(f, kw, normalizedRuleName));

    // Support canonical "10TH PASSING" and "12TH PASSING" files without the word "certificate"
    if (!isDirectMatch) {
      if (normalizedRuleName === '10TH PASSING CERTIFICATE' && (lower.includes('10th passing') || lower.includes('10th pass '))) {
        if (!lower.includes('mark')) {
          isDirectMatch = true;
        }
      } else if (normalizedRuleName === '12TH PASSING CERTIFICATE' && (lower.includes('12th passing') || lower.includes('12th pass '))) {
        if (!lower.includes('mark')) {
          isDirectMatch = true;
        }
      }
    }

    if (isDirectMatch) {
      return {
        status: 'green',
        matchedFile: f,
        note: `📄 Verified File: ${f}`,
        isLinked: false,
        type: 'direct'
      };
    }
  }

  // 3. ADDITIONAL DOCUMENT LINKING (Aliases & Separates fulfilling Combined)
  for (const link of activeLinks) {
    const p1 = (link.part1 || '').trim().toUpperCase();
    const p2 = (link.part2 || '').trim().toUpperCase();
    const comb = (link.combined || '').trim().toUpperCase();

    // Case B: Rule is an Alias / Equivalent (e.g. 12TH LC = 12TH TC)
    if (link.type === 'alias' && (normalizedRuleName === p1 || normalizedRuleName === p2)) {
      const aliasTarget = (normalizedRuleName === p1 ? p2 : p1).toLowerCase();
      for (const f of fileNames) {
        if (f.toLowerCase().includes(aliasTarget) || (aliasTarget.includes('tc') && f.toLowerCase().includes('tc'))) {
          return {
            status: 'green',
            matchedFile: f,
            note: `🔗 Fulfilled by Equivalent: ${f}`,
            isLinked: true,
            type: 'alias'
          };
        }
      }
    }

    // Case C: Rule IS the Combined Document (e.g. Rule is '12TH MARKSHEET AND PASSING')
    // If separate Part 1 and Part 2 are both present, the combined requirement is satisfied
    if (normalizedRuleName === comb && p1 && p2) {
      const f1 = fileNames.find(f => f.toLowerCase().includes(p1.toLowerCase()));
      const f2 = fileNames.find(f => f.toLowerCase().includes(p2.toLowerCase()));
      if (f1 && f2) {
        return {
          status: 'green',
          matchedFile: `${f1} + ${f2}`,
          note: `🔗 Fulfilled by Separate Files: ${f1} + ${f2}`,
          isLinked: true,
          type: 'separate'
        };
      }
    }
  }

  // 4. STRICT BINARY RESULT: RED (Missing)
  // Per clerk mandate: No vague "similar spelling found / yellow" fuzziness.
  return {
    status: 'red',
    matchedFile: null,
    note: '⚠️ Required Document Missing (Rename required)',
    isLinked: false,
    type: 'missing'
  };
}

/**
 * Backward compatible status getter
 */
export function getChecklistStatus(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  return evaluateChecklistRule(fileNames, rule, linkedRules).status;
}

/**
 * Evaluates entire checklist and computes executive dashboard metrics
 */
export function evaluateChecklistSummary(fileNames, rules = [], linkedRules = DEFAULT_LINKED_RULES) {
  const evaluations = [];
  let foundCount = 0;
  const missingList = [];

  for (const rule of rules) {
    const evalResult = evaluateChecklistRule(fileNames, rule, linkedRules);
    evaluations.push({
      rule,
      ...evalResult
    });

    if (evalResult.status === 'green') {
      foundCount++;
    } else {
      missingList.push(rule.name);
    }
  }

  const totalRequired = rules.length;
  const missingCount = totalRequired - foundCount;
  const percentComplete = totalRequired > 0 ? Math.round((foundCount / totalRequired) * 100) : 0;
  const isReady = missingCount === 0 && totalRequired > 0;

  return {
    evaluations,
    totalRequired,
    foundCount,
    missingCount,
    percentComplete,
    missingList,
    isReady,
    totalFolderFiles: fileNames.length
  };
}

/**
 * Collect all file names recursively
 */
export async function allFileNames(handle, path = '') {
  if (!handle) return [];
  if (typeof handle.entries !== 'function') {
    if (Array.isArray(handle.files)) return handle.files.map(f => f.name || f);
    return [];
  }
  const out = [];
  for await (const [name, item] of handle.entries()) {
    if (item.kind === 'file') {
      out.push(path + name);
    } else if (item.kind === 'directory') {
      out.push(...(await allFileNames(item, path + name + '/')));
    }
  }
  return out;
}
