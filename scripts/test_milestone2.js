import assert from 'assert';
import { validateFilename, buildName } from '../src/libraries/rename-library.js';
import { matchDocument } from '../src/libraries/shortcut-keyword-library.js';
import { evaluateMatch } from '../src/libraries/document-matcher.js';
import { uniqueDestination } from '../src/libraries/duplicate-name-library.js';
import { undoManager } from '../src/libraries/undo-library.js';
import { correctSpelling, issuesFor } from '../src/libraries/spelling-library.js';
import { DEFAULT_SPELLING_RULES, CANONICAL_NAMES } from '../src/core/constants.js';

console.log('=== RUNNING MILESTONE 2 SMOKE TESTS ===');

// 1. Safe Atomic Rename & Validation
console.log('[Test 1] validateFilename checks...');
assert.ok(validateFilename('').length > 0, 'Empty name must fail');
assert.ok(validateFilename('test.').length > 0, 'Trailing dot must fail');
assert.ok(validateFilename('test ').length > 0, 'Trailing space must fail');
assert.ok(validateFilename('CON.pdf').length > 0, 'CON reserved name must fail');
assert.ok(validateFilename('prn.jpg').length > 0, 'PRN reserved name must fail');
assert.ok(validateFilename('aux').length > 0, 'AUX reserved name must fail');
assert.ok(validateFilename('nul.txt').length > 0, 'NUL reserved name must fail');
assert.ok(validateFilename('COM1').length > 0, 'COM1 reserved name must fail');
assert.ok(validateFilename('LPT1').length > 0, 'LPT1 reserved name must fail');
assert.strictEqual(validateFilename('10TH MARKSHEET Vijay Yadav.pdf'), '', 'Valid name must pass');
console.log('✓ Validation rules verified: trailing dots/spaces and Windows reserved names strictly blocked.');

// 2. 21 Shortcuts & \b Word Boundary Matching
console.log('[Test 2] 21-Shortcut Keyword Engine & Word Boundary...');
const shortcuts = [
  'ADR', 'PAN', 'PIC', '10M', '10P', '12M', '12P', '12LC', '12MP',
  'CST', 'VLD', 'DOM', 'NAT', 'INC', 'BNK', 'ATM', 'BRT', 'BNF', 'GAP', 'SLF', 'PAR'
];

shortcuts.forEach(sc => {
  const matched = evaluateMatch(`Student_${sc}_Document.pdf`);
  assert.ok(matched.docType, `Shortcut ${sc} must match`);
});

// Verify "Pankaj" does NOT match "PAN"
const panResult = evaluateMatch('Pankaj_Kumar_Signature.jpg');
assert.strictEqual(panResult.docType, null, '"Pankaj" must NOT match PAN due to \\b word boundary enforcement');

// Verify exact "PAN" matches
const realPanResult = evaluateMatch('PAN_Card_Front.pdf');
assert.strictEqual(realPanResult.docType, 'PAN CARD', '"PAN_Card" must match PAN CARD');

console.log('✓ All 21 shortcuts matched cleanly and Pankaj/PAN false positive prevented.');

// 3. Unique Destination Numbering
console.log('[Test 3] Unique Destination duplicate numbering...');
const used = new Set(['10TH MARKSHEET.pdf']);
const next = uniqueDestination('10TH MARKSHEET.pdf', 'raw_file.pdf', used);
assert.notStrictEqual(next, '10TH MARKSHEET.pdf', 'Duplicate destination must be renamed');
console.log(`✓ Duplicate resolved to: "${next}"`);

// 4. Multi-level Undo Stack
console.log('[Test 4] Multi-level Undo Manager...');
undoManager.clear();
assert.strictEqual(undoManager.canUndo(), false);
undoManager.pushBatch({ name: 'TestFolder' }, [{ old: 'a.pdf', next: 'b.pdf' }]);
assert.strictEqual(undoManager.canUndo(), true);
const popped = undoManager.pop();
assert.strictEqual(popped.plan[0].next, 'b.pdf');
assert.strictEqual(undoManager.canUndo(), false);
console.log('✓ Multi-level undo stack behaves correctly.');

// 5. Batch Spelling Fixes
console.log('[Test 5] Batch Spelling fixes...');
const corrected = correctSpelling('marskheet adhar bonafied', DEFAULT_SPELLING_RULES);
assert.strictEqual(corrected, 'marksheet aadhaar bonafide', 'Spelling corrections must fix common typos');

const issues = issuesFor('Admission_Folder', [{ name: 'marskheet_scanned.pdf' }, { name: 'adhar_card.pdf' }], DEFAULT_SPELLING_RULES);
assert.strictEqual(issues.length, 2, 'Must detect 2 spelling issues');
console.log('✓ Batch spelling engine correctly identifies and fixes typos.');

console.log('\n>>> ALL MILESTONE 2 SMOKE TESTS PASSED! <<<');
