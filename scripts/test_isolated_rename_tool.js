/**
 * scripts/test_isolated_rename_tool.js
 * Comprehensive Verification Suite for the Isolated Bulk Renamer (tools/rename_tool/)
 */

import assert from 'assert';
import fs from 'fs';
import { execSync } from 'child_process';
import {
  ext,
  cleanName,
  applyCase,
  buildName,
  validateFilename,
  uniqueDestination,
  matchDocument,
  getMatchingSuggestions,
  evaluateMatch,
  correctSpelling,
  evaluateChecklistRule,
  generateBatchAuditCSV,
  undoManager,
  CANONICAL_NAMES,
  DEFAULT_SPELLING_RULES,
  DEFAULT_LINKED_RULES,
  DEFAULT_CHECKLISTS_DATA
} from '../tools/rename_tool/rename_tool_logic.js';
import {
  RenamerUIManager,
  isJunkFile,
  getShortcutBadgeColor
} from '../tools/rename_tool/rename_tool_ui.js';

console.log('=== RUNNING ISOLATED RENAME TOOL VERIFICATION SUITE ===\n');

// 1. Pure Logic Verification
console.log('[Test 1] Pure Logic & Naming Rules...');
assert.strictEqual(ext('student_scan.PDF'), '.PDF');
assert.strictEqual(cleanName('student_scan.PDF'), 'student_scan');
assert.strictEqual(applyCase('medical certificate', 'upper'), 'MEDICAL CERTIFICATE');
assert.strictEqual(applyCase('medical certificate', 'title'), 'Medical Certificate');
assert.strictEqual(applyCase('MEDICAL CERTIFICATE', 'lower'), 'medical certificate');
assert.strictEqual(applyCase('Medical Certificate', 'as_is'), 'Medical Certificate');

const student = 'Vijay Ramesh Yadav';
assert.strictEqual(buildName('10m', student, null, 'upper'), '10TH MARKSHEET VIJAY RAMESH YADAV');
assert.strictEqual(buildName('10m', student, null, 'title'), '10th Marksheet Vijay Ramesh Yadav');
assert.strictEqual(buildName('10m', student, null, 'lower'), '10th marksheet vijay ramesh yadav');
assert.strictEqual(buildName('Custom Medical Scan', student, null, 'upper'), 'CUSTOM MEDICAL SCAN VIJAY RAMESH YADAV');
console.log('✓ Pure logic and strict casing verified across all 4 styles.');

// 2. Exact-match shortcuts & word-boundary safety
console.log('\n[Test 2] Exact Shortcuts & Word-Boundary Protection...');
const shortcuts = [
  ['adr', 'AADHAAR CARD'],
  ['pan', 'PAN CARD'],
  ['pic', 'PHOTO'],
  ['10m', '10TH MARKSHEET'],
  ['10p', '10TH PASSING CERTIFICATE'],
  ['12m', '12TH MARKSHEET'],
  ['12p', '12TH PASSING CERTIFICATE'],
  ['12lc', '12TH LC'],
  ['12mp', '12TH MARKSHEET AND PASSING'],
  ['cst', 'CASTE CERTIFICATE'],
  ['vld', 'VALIDITY CERTIFICATE'],
  ['dom', 'DOMICILE CERTIFICATE'],
  ['nat', 'NATIONALITY CERTIFICATE'],
  ['inc', 'INCOME CERTIFICATE'],
  ['bnk', 'PASSBOOK BANK'],
  ['atm', 'ATTEMPT CERTIFICATE'],
  ['brt', 'BIRTH CERTIFICATE'],
  ['bnf', 'BONAFIDE CERTIFICATE'],
  ['gap', 'GAP CERTIFICATE'],
  ['slf', 'SELF DECLARATION'],
  ['par', 'PARENT DECLARATION']
];

for (const [code, expected] of shortcuts) {
  assert.strictEqual(matchDocument(code), expected, `Shortcut "${code}" must resolve to "${expected}"`);
}

// Word-boundary tests
assert.strictEqual(evaluateMatch('Pankaj_Rao.pdf').docType, null, 'Pankaj must not match PAN');
assert.strictEqual(evaluateMatch('Domain_Record.pdf').docType, null, 'Domain must not match DOM');
assert.strictEqual(evaluateMatch('Parental_Consent.pdf').docType, null, 'Parental must not match PAR');
console.log('✓ All 21 core shortcuts resolved with strict word-boundary safety.');

// 3. Windows Reserved Names & Collision Prevention
console.log('\n[Test 3] Windows Reserved Names & Duplicate Suffixing...');
assert.ok(validateFilename('CON.pdf').length > 0, 'CON must be blocked');
assert.ok(validateFilename('CON .pdf').length > 0, 'CON with stem spacing must be blocked');
assert.ok(validateFilename('PRN.jpg').length > 0, 'PRN must be blocked');
assert.ok(validateFilename('AUX.png').length > 0, 'AUX must be blocked');
assert.ok(validateFilename('NUL.docx').length > 0, 'NUL must be blocked');
assert.ok(validateFilename('invalid/char.pdf').length > 0, 'Slash must be blocked');
assert.ok(validateFilename('bad\x01char.pdf').length > 0, 'Control character must be blocked');
assert.strictEqual(validateFilename('Valid Clean Document.pdf'), '');

const existing = new Set(['10TH MARKSHEET Vijay Yadav.pdf']);
const suff1 = uniqueDestination('10TH MARKSHEET Vijay Yadav.pdf', 'raw.pdf', existing);
assert.strictEqual(suff1, '10TH MARKSHEET Vijay Yadav 1.pdf');
existing.add(suff1);
const suff2 = uniqueDestination('10TH MARKSHEET Vijay Yadav.pdf', 'raw2.pdf', existing);
assert.strictEqual(suff2, '10TH MARKSHEET Vijay Yadav 2.pdf');
console.log('✓ Windows reserved names blocked and collision suffixes increment cleanly.');

// 4. Scanner Typo Correction & Checklist Multi-Linking
console.log('\n[Test 4] Typo Autocorrect & Checklist Linking...');
assert.strictEqual(correctSpelling('10th_marskheet_doc', DEFAULT_SPELLING_RULES), '10th_marksheet_doc');
assert.strictEqual(correctSpelling('adhar_both_sides', DEFAULT_SPELLING_RULES), 'aadhaar_both_sides');

const dossier = [
  '12TH MARKSHEET AND PASSING Vijay.pdf',
  'AADHAAR CARD Vijay.pdf',
  'PHOTO Vijay.jpg',
  '10TH MARKSHEET Vijay.pdf',
  '10TH PASSING CERTIFICATE Vijay.pdf',
  '12TH TC Vijay.pdf',
  'CASTE CERTIFICATE Vijay.pdf',
  'VALIDITY CERTIFICATE Vijay.pdf',
  'INCOME CERTIFICATE Vijay.pdf',
  'NATIONALITY CERTIFICATE Vijay.pdf',
  'DOMICILE CERTIFICATE Vijay.pdf',
  'PASSBOOK BANK Vijay.pdf'
];

const mahaRules = DEFAULT_CHECKLISTS_DATA['MAHA DBT FORM'].map(r => ({ name: r[0], keywords: r[1] }));
const evals = mahaRules.map(r => evaluateChecklistRule(dossier, r, DEFAULT_LINKED_RULES));
assert.ok(evals.every(e => e.status === 'green'), 'All rules must pass with linking');
console.log('✓ Scanner typo correction and checklist multi-linking verified.');

// 5. Multi-level Undo & Audit CSV
console.log('\n[Test 5] Multi-level Undo & Audit CSV Export...');
undoManager.clear();
undoManager.pushBatch({ name: 'Batch 1' }, [{ old: 'raw1.pdf', next: '10M.pdf' }]);
undoManager.pushBatch({ name: 'Batch 2' }, [{ old: 'raw2.pdf', next: '12M.pdf' }]);
assert.strictEqual(undoManager.canUndo(), true);
assert.strictEqual(undoManager.pop().plan[0].next, '12M.pdf');
assert.strictEqual(undoManager.pop().plan[0].next, '10M.pdf');
assert.strictEqual(undoManager.canUndo(), false);

const auditCSV = generateBatchAuditCSV([{
  studentName: 'Aparna Nadekar',
  folderName: 'Aparna_Nadekar',
  summary: {
    evaluations: evals.map(e => ({ rule: e.rule || { name: 'Rule' }, status: e.status, isLinked: e.isLinked })),
    foundCount: 13,
    missingCount: 0,
    totalRequired: 13,
    percentComplete: 100,
    isReady: true,
    missingList: []
  }
}], mahaRules, 'MAHA DBT FORM');
assert.ok(auditCSV.includes('Aparna Nadekar'));
assert.ok(auditCSV.includes('READY FOR SUBMISSION'));
console.log('✓ Multi-level undo and audit CSV matrix export verified.');

// 6. UI Helpers & Junk Filtering
console.log('\n[Test 6] UI Helpers & Junk Blacklist...');
assert.strictEqual(isJunkFile('Thumbs.db'), true);
assert.strictEqual(isJunkFile('desktop.ini'), true);
assert.strictEqual(isJunkFile('.DS_Store'), true);
assert.strictEqual(isJunkFile('~$scan_document.docx'), true);
assert.strictEqual(isJunkFile('cache_temp.tmp'), true);
assert.strictEqual(isJunkFile('.hidden_folder'), true);
assert.strictEqual(isJunkFile('marksheet.pdf'), false);

assert.ok(getShortcutBadgeColor('ADR').includes('bg-blue-600'));
assert.ok(getShortcutBadgeColor('10M').includes('bg-emerald-700'));
assert.ok(getShortcutBadgeColor('CST').includes('bg-purple-700'));
assert.ok(getShortcutBadgeColor('INC').includes('bg-amber-600'));
assert.ok(getShortcutBadgeColor('SLF').includes('bg-slate-700'));
console.log('✓ Junk file filtering and shortcut category color codes verified.');

// 7. Markup & CSS Scoping Checks
console.log('\n[Test 7] Scoped Markup & Scoped CSS Validation...');
const html = fs.readFileSync('tools/rename_tool/rename_tool.html', 'utf8');
const css = fs.readFileSync('tools/rename_tool/rename_tool.css', 'utf8');
const marathiRegex = /[\u0900-\u097F]/;

assert.ok(!marathiRegex.test(html), 'rename_tool.html must have 0 Marathi characters');
assert.ok(html.includes('rename-tool-scope'), 'rename_tool.html must be wrapped in .rename-tool-scope');
assert.ok(html.includes('id="col-queue"'), 'Column 1 must exist');
assert.ok(html.includes('id="col-preview"'), 'Column 2 must exist');
assert.ok(html.includes('id="col-utility"'), 'Column 3 must exist');
assert.ok(html.includes('id="btnClearWorkspace"'), 'btnClearWorkspace must exist');
assert.ok(html.includes('id="btnAddFiles"'), 'btnAddFiles must exist');
assert.ok(html.includes('id="btnSelectFolder"'), 'btnSelectFolder must exist');

// Verify CSS is strictly scoped under .rename-tool-scope
const cssLines = css.split('\n')
  .map(l => l.trim())
  .filter(l => l.endsWith('{') && !l.startsWith('@') && !l.startsWith('/*'));
for (const line of cssLines) {
  assert.ok(line.includes('.rename-tool-scope'), `CSS rule "${line}" must be scoped under .rename-tool-scope`);
}
console.log('✓ Markup is 100% English and CSS is strictly scoped under .rename-tool-scope.');

// 8. Python Backend Verification
console.log('\n[Test 8] Python Backend (tools/rename_tool/rename_tool.py)...');
const pyOutput = execSync('python -c "import tools.rename_tool.rename_tool as rt; ' +
  'assert rt.validate_filename(\'CON.pdf\')[0] == False; ' +
  'assert rt.validate_filename(\'CON .pdf\')[0] == False; ' +
  'assert rt.validate_filename(\'bad\\x01char.pdf\')[0] == False; ' +
  'assert rt.validate_filename(\'Valid.pdf\')[0] == True; ' +
  'assert rt.unique_destination(\'doc.pdf\', \'doc.pdf\', {\'doc.pdf\'}) == \'doc.pdf\'; ' +
  'assert rt.unique_destination(\'doc.pdf\', \'other.pdf\', {\'doc.pdf\'}) == \'doc 1.pdf\'; ' +
  'assert rt.is_junk_file(\'Thumbs.db\') == True; ' +
  'assert rt.is_junk_file(\'doc.pdf\') == False; ' +
  'batch_res = rt.batch_rename_files([{\'path\': \'fake.pdf\', \'targetName\': \'CON.pdf\'}]); ' +
  'assert batch_res[\'results\'][0][\'success\'] == False; ' +
  'print(\'PYTHON_BACKEND_OK\');"').toString().trim();
assert.ok(pyOutput.includes('PYTHON_BACKEND_OK'), 'Python backend verification must pass');
console.log('✓ Python backend safe atomic operations, reserved names, and junk filter verified.');

console.log('\n🎉 ALL 8 ISOLATED RENAME TOOL TESTS PASSED PERFECTLY! 🎉\n');
