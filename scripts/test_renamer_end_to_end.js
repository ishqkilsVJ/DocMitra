import assert from 'assert';
import { isJunkFile } from '../src/ui/renamer-ui.js';
import { cleanName, ext, validateFilename, buildName } from '../src/libraries/rename-library.js';
import { matchDocument } from '../src/libraries/shortcut-keyword-library.js';
import { evaluateMatch } from '../src/libraries/document-matcher.js';
import { uniqueDestination } from '../src/libraries/duplicate-name-library.js';
import { undoManager } from '../src/libraries/undo-library.js';
import { correctSpelling, issuesFor } from '../src/libraries/spelling-library.js';
import { evaluateChecklistRule } from '../src/libraries/checklist-library.js';
import { generateBatchAuditCSV } from '../src/libraries/export-reports-library.js';
import {
  CANONICAL_NAMES,
  DEFAULT_SPELLING_RULES,
  DEFAULT_LINKED_RULES,
  DEFAULT_CHECKLISTS_DATA
} from '../src/core/constants.js';

console.log('=== RUNNING COMPREHENSIVE RENAMER END-TO-END VERIFICATION ===');

// 1. Live Typing & Formula Simulation
console.log('[Test 1] Live typing & Formula matching...');
const typedShortcuts = [
  { typed: '10m', expectedDoc: '10TH MARKSHEET' },
  { typed: '12m', expectedDoc: '12TH MARKSHEET' },
  { typed: '12lc', expectedDoc: '12TH LC' },
  { typed: 'adr', expectedDoc: 'AADHAAR CARD' },
  { typed: 'pan', expectedDoc: 'PAN CARD' },
  { typed: 'cst', expectedDoc: 'CASTE CERTIFICATE' },
  { typed: 'dom', expectedDoc: 'DOMICILE CERTIFICATE' },
  { typed: 'inc', expectedDoc: 'INCOME CERTIFICATE' },
  { typed: 'bnk', expectedDoc: 'PASSBOOK BANK' },
  { typed: 'atm', expectedDoc: 'ATTEMPT CERTIFICATE' },
  { typed: 'pic', expectedDoc: 'PHOTO' },
  { typed: 'gap', expectedDoc: 'GAP CERTIFICATE' },
  { typed: 'slf', expectedDoc: 'SELF DECLARATION' },
  { typed: 'par', expectedDoc: 'PARENT DECLARATION' }
];

typedShortcuts.forEach(tc => {
  const matched = matchDocument(tc.typed);
  assert.strictEqual(matched, tc.expectedDoc, `Typed "${tc.typed}" must resolve to ${tc.expectedDoc}`);
  const formula = buildName(matched, 'Vijay Ramesh Yadav', null, 'preserve');
  assert.ok(formula.includes('Vijay Ramesh Yadav'), `Formula must include student name: ${formula}`);
});
console.log('✓ All typed shortcuts correctly trigger live formula resolution.');

// 2. Misspelling Auto-Correction before matching
console.log('[Test 2] Scanner misspelling auto-correction before matching...');
const misspelledFiles = [
  { raw: '10th_marskheet.pdf', expectedClean: '10th marksheet', expectedDoc: '10TH MARKSHEET' },
  { raw: 'adhar_card_front.pdf', expectedClean: 'aadhaar card front', expectedDoc: 'AADHAAR CARD' },
  { raw: 'bonafied_cert.pdf', expectedClean: 'bonafide cert', expectedDoc: 'BONAFIDE CERTIFICATE' },
  { raw: 'domocile_maha.pdf', expectedClean: 'domicile maha', expectedDoc: 'DOMICILE CERTIFICATE' },
  { raw: 'incom_tahsildar.pdf', expectedClean: 'income tahsildar', expectedDoc: 'INCOME CERTIFICATE' }
];

misspelledFiles.forEach(tc => {
  const base = cleanName(tc.raw);
  const fixed = correctSpelling(base, DEFAULT_SPELLING_RULES);
  const evalResult = evaluateMatch(fixed);
  assert.strictEqual(evalResult.docType, tc.expectedDoc, `Spelling typo in "${tc.raw}" must be corrected to match ${tc.expectedDoc}`);
});
console.log('✓ Spelling library fixes scanned document typos before matching.');

// 3. Word-Boundary Safety: No false positives
console.log('[Test 3] Word-boundary safety checks...');
assert.strictEqual(evaluateMatch('Pankaj_Kumar.pdf').docType, null, 'Pankaj must not match PAN');
assert.strictEqual(evaluateMatch('Domain_Record.pdf').docType, null, 'Domain must not match DOM');
assert.strictEqual(evaluateMatch('Parental_Advisory.pdf').docType, null, 'Parental must not match PAR');
assert.strictEqual(evaluateMatch('PAN_Card.pdf').docType, 'PAN CARD', 'PAN_Card must match PAN CARD');
assert.strictEqual(evaluateMatch('DOM_Certificate.pdf').docType, 'DOMICILE CERTIFICATE', 'DOM must match DOMICILE');
console.log('✓ Strict word boundary ensures zero false positive collisions.');

// 4. Duplicate Destination Auto-Numbering
console.log('[Test 4] Unique Destination Duplicate Numbering...');
const usedSet = new Set(['12TH MARKSHEET Vijay Yadav.pdf']);
const unique1 = uniqueDestination('12TH MARKSHEET Vijay Yadav.pdf', 'raw_file_2.pdf', usedSet);
assert.strictEqual(unique1, '12TH MARKSHEET Vijay Yadav 1.pdf', 'First collision must be suffixed with 1');
usedSet.add(unique1);

const unique2 = uniqueDestination('12TH MARKSHEET Vijay Yadav.pdf', 'raw_file_3.pdf', usedSet);
assert.strictEqual(unique2, '12TH MARKSHEET Vijay Yadav 2.pdf', 'Second collision must be suffixed with 2');
console.log('✓ Unique destination automatically generates non-colliding suffixes.');

// 5. Windows Filename Validation & Reserved Names
console.log('[Test 5] Filename validation & reserved names...');
assert.ok(validateFilename('').length > 0);
assert.ok(validateFilename('CON.pdf').length > 0);
assert.ok(validateFilename('PRN.jpg').length > 0);
assert.ok(validateFilename('AUX.png').length > 0);
assert.ok(validateFilename('NUL.docx').length > 0);
assert.ok(validateFilename('COM1').length > 0);
assert.ok(validateFilename('LPT1').length > 0);
assert.ok(validateFilename('test/doc.pdf').length > 0);
assert.ok(validateFilename('test:doc.pdf').length > 0);
assert.ok(validateFilename('trailing_dot.').length > 0);
assert.ok(validateFilename('trailing_space ').length > 0);
assert.strictEqual(validateFilename('Valid Document Name.pdf'), '');
console.log('✓ Windows reserved names and illegal syntax strictly blocked.');

// 6. Checklist Evaluation with Multi-Document Linking
console.log('[Test 6] Checklist evaluation with document linking...');
const sampleFiles = [
  '12TH MARKSHEET AND PASSING Vijay Yadav.pdf', // Combined satisfies both Marksheet and Passing!
  'AADHAAR CARD Vijay Yadav.pdf',
  'PHOTO Vijay Yadav.jpg',
  '10TH MARKSHEET Vijay Yadav.pdf',
  '10TH PASSING CERTIFICATE Vijay Yadav.pdf',
  '12TH TC Vijay Yadav.pdf', // Alias satisfies 12TH LC!
  'CASTE CERTIFICATE Vijay Yadav.pdf',
  'VALIDITY CERTIFICATE Vijay Yadav.pdf',
  'INCOME CERTIFICATE Vijay Yadav.pdf',
  'NATIONALITY CERTIFICATE Vijay Yadav.pdf',
  'DOMICILE CERTIFICATE Vijay Yadav.pdf',
  'PASSBOOK BANK Vijay Yadav.pdf'
];

const mahaDbtRules = DEFAULT_CHECKLISTS_DATA['MAHA DBT FORM'].map(r => ({
  name: r[0],
  keywords: r[1]
}));

const evaluations = mahaDbtRules.map(rule => evaluateChecklistRule(sampleFiles, rule, DEFAULT_LINKED_RULES));
const allGreen = evaluations.every(e => e.status === 'green');
assert.ok(allGreen, 'All 13 MahaDBT rules must be fulfilled by sample dossier via direct and linked rules.');

// Check specific linkings
const mark12Idx = mahaDbtRules.findIndex(r => r.name === '12TH MARKSHEET');
const mark12 = evaluations[mark12Idx];
assert.ok(mark12.isLinked, '12th Marksheet fulfilled via combined file');
console.log('✓ Checklist evaluation and document linking verified.');

// 7. Audit CSV Generation
console.log('[Test 7] Batch Audit CSV report generation...');
const batchResults = [{
  studentName: 'Vijay Ramesh Yadav',
  folderName: 'Vijay_Ramesh_Yadav',
  summary: {
    evaluations: evaluations.map((ev, idx) => ({
      rule: mahaDbtRules[idx],
      status: ev.status,
      isLinked: ev.isLinked
    })),
    foundCount: evaluations.filter(e => e.status === 'green').length,
    missingCount: 0,
    totalRequired: mahaDbtRules.length,
    percentComplete: 100,
    isReady: true,
    missingList: []
  }
}];

const csv = generateBatchAuditCSV(batchResults, mahaDbtRules, 'MAHA DBT FORM');
assert.ok(csv.includes('Vijay Ramesh Yadav'), 'CSV must contain student name');
assert.ok(csv.includes('READY FOR SUBMISSION'), 'CSV must report student readiness');
assert.ok(csv.includes('100%'), 'CSV must report completion percent');
console.log('✓ Batch Audit CSV generated correctly.');

// 8. Multi-level Undo Manager
console.log('[Test 8] Multi-level Undo stack...');
undoManager.clear();
undoManager.pushBatch({ name: 'Batch1' }, [{ old: 'f1.pdf', next: '10M.pdf' }]);
undoManager.pushBatch({ name: 'Batch2' }, [{ old: 'f2.pdf', next: '12M.pdf' }]);
assert.strictEqual(undoManager.canUndo(), true);
const b2 = undoManager.pop();
assert.strictEqual(b2.plan[0].next, '12M.pdf');
const b1 = undoManager.pop();
assert.strictEqual(b1.plan[0].next, '10M.pdf');
assert.strictEqual(undoManager.canUndo(), false);
console.log('✓ Multi-level undo stack functions correctly.');

console.log('\n>>> ALL RENAMER END-TO-END VERIFICATION TESTS PASSED! <<<');
