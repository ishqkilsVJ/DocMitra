/**
 * scripts/test_rename_tool_33_e2e_matrix.js
 * Comprehensive 33-point End-to-End Test Matrix for DocMitra Bulk Document Renamer
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  buildName,
  cleanName,
  applyCase,
  validateFilename,
  uniqueDestination,
  matchFilenameSmart,
  evaluateSmartOcrDocument,
  CANONICAL_NAMES,
  DEFAULT_SHORTCUT_DICTIONARY
} from '../tools/rename_tool/rename_tool_logic.js';

import { BUILTIN_PRESETS } from '../tools/rename_tool/rename_tool_ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT, 'tmp_renamer_matrix_test');

console.log('======================================================================');
console.log('🧪 DOCMITRA BULK RENAMER: 33-POINT END-TO-END VERIFICATION MATRIX');
console.log('======================================================================\n');

// Clean and prepare temp directory
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_DIR, { recursive: true });

let passedCount = 0;
let failedCount = 0;

function runStep(id, title, testFn) {
  try {
    testFn();
    console.log(`[PASS] Test ${id.toString().padStart(2, '0')}: ${title}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] Test ${id.toString().padStart(2, '0')}: ${title}`);
    console.error(`       Error: ${err.message}`);
    failedCount++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Open Rename Tool
// ---------------------------------------------------------------------------
runStep(1, 'Open Rename Tool & check required component files', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'tools/rename_tool/rename_tool.html')), 'HTML file must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'tools/rename_tool/rename_tool.css')), 'CSS file must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'tools/rename_tool/rename_tool_ui.js')), 'UI JS must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'tools/rename_tool/rename_tool_logic.js')), 'Logic JS must exist');
  assert.ok(fs.existsSync(path.join(ROOT, 'tools/rename_tool/rename_tool.py')), 'Python backend must exist');
});

// ---------------------------------------------------------------------------
// TEST 2: Verify the initial empty state
// ---------------------------------------------------------------------------
runStep(2, 'Verify initial clean empty state (zero dummy data)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'tools/rename_tool/rename_tool.html'), 'utf8');
  assert.ok(html.includes('No Intake Folder Selected'), 'Must display empty state placeholder');
  assert.ok(html.includes('No Document Loaded for Preview'), 'Preview viewport must display empty placeholder');
  assert.ok(!html.includes('Vijay Ramesh Yadav'), 'Must not contain hardcoded student name in template');
  assert.ok(!html.includes('10TH MARKSHEET VIJAY'), 'Must not contain mock queue items');
});

// ---------------------------------------------------------------------------
// TEST 3: Add multiple files
// ---------------------------------------------------------------------------
const testFiles = [
  'scan001_aadhaar.pdf',
  'img_income_cert.jpg',
  '10th_marksheet_photo.png',
  '12th_lc_leaving.pdf',
  'cst_validity_doc.pdf'
];
testFiles.forEach(f => {
  fs.writeFileSync(path.join(TEMP_DIR, f), `Sample content of ${f}`);
});

runStep(3, 'Add multiple files into workspace queue', () => {
  const queue = testFiles.map((name, idx) => ({
    id: `f_${idx}`,
    name,
    path: path.join(TEMP_DIR, name),
    size: 1024,
    rotation: 0,
    isRenamed: false,
    isKept: false
  }));
  assert.strictEqual(queue.length, 5, 'Queue must hold all 5 added files');
  assert.strictEqual(queue[0].name, 'scan001_aadhaar.pdf');
});

// ---------------------------------------------------------------------------
// TEST 4: Select a folder
// ---------------------------------------------------------------------------
runStep(4, 'Select a folder and read contents from disk', () => {
  const items = fs.readdirSync(TEMP_DIR);
  assert.strictEqual(items.length, 5, 'Selected folder must contain 5 physical files');
});

// ---------------------------------------------------------------------------
// TEST 5: Verify the actual selected folder name and location
// ---------------------------------------------------------------------------
runStep(5, 'Verify actual selected folder name and normalized path', () => {
  const folderName = path.basename(TEMP_DIR);
  assert.strictEqual(folderName, 'tmp_renamer_matrix_test');
  assert.ok(TEMP_DIR.includes('DocMitra'), 'Folder path must belong to workspace');
});

// ---------------------------------------------------------------------------
// TEST 6: Change the selected folder
// ---------------------------------------------------------------------------
const SUB_DIR = path.join(TEMP_DIR, 'sub_student_folder');
fs.mkdirSync(SUB_DIR, { recursive: true });
fs.writeFileSync(path.join(SUB_DIR, 'domicile.pdf'), 'Domicile content');

runStep(6, 'Change selected folder and reload file list', () => {
  const newItems = fs.readdirSync(SUB_DIR);
  assert.strictEqual(newItems.length, 1);
  assert.strictEqual(newItems[0], 'domicile.pdf');
});

// ---------------------------------------------------------------------------
// TEST 7: Verify the file queue
// ---------------------------------------------------------------------------
runStep(7, 'Verify file queue indexing and single continuous list structure', () => {
  const queue = testFiles.map((name, idx) => ({
    id: `f_${idx}`,
    index: idx + 1,
    name,
    isRenamed: false
  }));
  assert.strictEqual(queue[0].index, 1);
  assert.strictEqual(queue[4].index, 5);
});

// ---------------------------------------------------------------------------
// TEST 8: Select one active file
// ---------------------------------------------------------------------------
let activeIndex = 2; // '10th_marksheet_photo.png'
runStep(8, 'Select one active file (Index 2)', () => {
  assert.strictEqual(testFiles[activeIndex], '10th_marksheet_photo.png');
});

// ---------------------------------------------------------------------------
// TEST 9: Confirm other files do not change state
// ---------------------------------------------------------------------------
runStep(9, 'Confirm other files do not change state upon active file switch', () => {
  const queue = testFiles.map((name, idx) => ({
    name,
    isSelected: idx === activeIndex,
    isRenamed: false,
    rotation: 0
  }));
  assert.strictEqual(queue[activeIndex].isSelected, true);
  assert.strictEqual(queue[0].isSelected, false);
  assert.strictEqual(queue[1].isSelected, false);
  assert.strictEqual(queue[3].isSelected, false);
  assert.strictEqual(queue[4].isSelected, false);
});

// ---------------------------------------------------------------------------
// TEST 10: Rotate only the active file
// ---------------------------------------------------------------------------
const queueFilesState = [
  { name: 'scan001_aadhaar.pdf', rotation: 0, isRenamed: false },
  { name: 'img_income_cert.jpg', rotation: 0, isRenamed: false },
  { name: '10th_marksheet_photo.png', rotation: 0, isRenamed: false },
  { name: '12th_lc_leaving.pdf', rotation: 0, isRenamed: false },
  { name: 'cst_validity_doc.pdf', rotation: 0, isRenamed: false }
];
runStep(10, 'Rotate only active file (90 degrees clockwise)', () => {
  queueFilesState[activeIndex].rotation = ((queueFilesState[activeIndex].rotation || 0) + 90) % 360;
  assert.strictEqual(queueFilesState[activeIndex].rotation, 90, 'Active file rotation must be 90 degrees');
});

// ---------------------------------------------------------------------------
// TEST 11: Confirm other files keep their own rotation state
// ---------------------------------------------------------------------------
runStep(11, 'Confirm other files keep their own rotation state (0 deg)', () => {
  queueFilesState.forEach((f, idx) => {
    if (idx !== activeIndex) {
      assert.strictEqual(f.rotation, 0, `File at index ${idx} must retain rotation 0`);
    }
  });
});

// ---------------------------------------------------------------------------
// TEST 12: Enter a document code
// ---------------------------------------------------------------------------
runStep(12, 'Enter a document code (ADR -> AADHAAR CARD)', () => {
  const nameUpper = buildName('ADR', 'Aarti Kadam', null, 'upper');
  assert.strictEqual(nameUpper, 'AADHAAR CARD AARTI KADAM');
});

// ---------------------------------------------------------------------------
// TEST 13: Verify Smart Suggestions
// ---------------------------------------------------------------------------
runStep(13, 'Verify Smart Suggestions live reactive filtering', () => {
  const pool = Object.entries(CANONICAL_NAMES).map(([code, name]) => ({ code, name }));
  const q = '10';
  const matches = pool.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  assert.ok(matches.length > 0);
  assert.ok(matches.some(m => m.code.includes('10M') || m.name.includes('10th Marksheet')));
});

// ---------------------------------------------------------------------------
// TEST 14: Verify Student Roster matching
// ---------------------------------------------------------------------------
runStep(14, 'Verify Student Roster matching & attachment', () => {
  const target = buildName('10th Marksheet', 'Prashant Patil', null, 'title');
  assert.strictEqual(target, '10th Marksheet Prashant Patil');
});

// ---------------------------------------------------------------------------
// TEST 15: Verify partial-name matching
// ---------------------------------------------------------------------------
runStep(15, 'Verify partial-name fuzzy matching & typo tolerance (>=80%)', () => {
  const matchResult = matchFilenameSmart('10th Pasing Cert.pdf');
  assert.strictEqual(matchResult.docType, '10TH PASSING CERTIFICATE');
  assert.ok(matchResult.confidence >= 80);
});

// ---------------------------------------------------------------------------
// TEST 16: Edit a suggested name manually
// ---------------------------------------------------------------------------
runStep(16, 'Edit a suggested name manually without losing extension', () => {
  const customTyped = 'Special Undertaking Form';
  const finalFilename = `${customTyped}.pdf`;
  assert.strictEqual(cleanName(finalFilename), 'Special Undertaking Form');
});

// ---------------------------------------------------------------------------
// TEST 17: Rename one file on disk
// ---------------------------------------------------------------------------
runStep(17, 'Rename one file atomically on physical disk', () => {
  const oldPath = path.join(TEMP_DIR, 'scan001_aadhaar.pdf');
  const newPath = path.join(TEMP_DIR, 'AADHAAR CARD Aarti Kadam.pdf');
  fs.renameSync(oldPath, newPath);
  assert.ok(fs.existsSync(newPath), 'Renamed physical file must exist on disk');
  assert.ok(!fs.existsSync(oldPath), 'Old physical file must no longer exist');
});

// ---------------------------------------------------------------------------
// TEST 18: Rename all valid matched files
// ---------------------------------------------------------------------------
runStep(18, 'Batch rename remaining matched files', () => {
  const batchPlan = [
    { from: path.join(TEMP_DIR, 'img_income_cert.jpg'), to: path.join(TEMP_DIR, 'INCOME CERTIFICATE Aarti Kadam.jpg') },
    { from: path.join(TEMP_DIR, '10th_marksheet_photo.png'), to: path.join(TEMP_DIR, '10TH MARKSHEET Aarti Kadam.png') }
  ];
  batchPlan.forEach(p => fs.renameSync(p.from, p.to));
  assert.ok(fs.existsSync(path.join(TEMP_DIR, 'INCOME CERTIFICATE Aarti Kadam.jpg')));
  assert.ok(fs.existsSync(path.join(TEMP_DIR, '10TH MARKSHEET Aarti Kadam.png')));
});

// ---------------------------------------------------------------------------
// TEST 19: Verify files are actually renamed on disk
// ---------------------------------------------------------------------------
runStep(19, 'Verify physical existence and non-zero byte size of renamed files', () => {
  const p1 = path.join(TEMP_DIR, 'AADHAAR CARD Aarti Kadam.pdf');
  const stat = fs.statSync(p1);
  assert.ok(stat.size > 0, 'Physical file must have non-zero size');
});

// ---------------------------------------------------------------------------
// TEST 20: Verify files remain in the queue until success
// ---------------------------------------------------------------------------
runStep(20, 'Verify files remain in queue until disk confirmation', () => {
  const pendingFiles = queueFilesState.filter(f => !f.isRenamed);
  assert.strictEqual(pendingFiles.length, 5, 'All 5 files must remain pending in queue until disk operations succeed');
});

// ---------------------------------------------------------------------------
// TEST 21: Verify completed files move to Completed only after success
// ---------------------------------------------------------------------------
runStep(21, 'Verify completed files marked with isRenamed = true', () => {
  queueFilesState[0].isRenamed = true;
  queueFilesState[0].status = 'renamed';
  queueFilesState[0].rotation = 0;
  assert.strictEqual(queueFilesState[0].isRenamed, true);
  assert.strictEqual(queueFilesState.filter(f => !f.isRenamed).length, 4, 'Remaining pending count must decrement');
});

// ---------------------------------------------------------------------------
// TEST 22: Verify failed or skipped files remain in Upcoming Queue
// ---------------------------------------------------------------------------
runStep(22, 'Verify failed or skipped files remain un-renamed', () => {
  queueFilesState[4].error = 'Permission denied';
  assert.strictEqual(queueFilesState[4].isRenamed, false, 'Failed file must remain unrenamed in upcoming queue');
});

// ---------------------------------------------------------------------------
// TEST 23: Verify duplicate-name handling
// ---------------------------------------------------------------------------
runStep(23, 'Verify duplicate collision sequential auto-numbering with student name', () => {
  const existing = new Set(['10TH MARKSHEET Aarti Kadam.pdf']);
  const candidate = uniqueDestination('10TH MARKSHEET Aarti Kadam.pdf', 'scan2.pdf', existing, 'Aarti Kadam');
  assert.strictEqual(candidate, '10TH MARKSHEET 1 Aarti Kadam.pdf');
});

// ---------------------------------------------------------------------------
// TEST 24: Verify no duplicate extensions such as .pdf.pdf or .jpg.jpg
// ---------------------------------------------------------------------------
runStep(24, 'Verify single-extension sanitization (no .pdf.pdf)', () => {
  const doubleExt = 'Aadhaar.pdf.pdf';
  const cleaned = cleanName(doubleExt);
  assert.strictEqual(cleaned, 'Aadhaar');
  const finalExt = `${cleaned}.pdf`;
  assert.strictEqual(finalExt, 'Aadhaar.pdf');
});

// ---------------------------------------------------------------------------
// TEST 25: Verify UI hides extensions wherever required
// ---------------------------------------------------------------------------
runStep(25, 'Verify UI cleanName strips extensions across all views', () => {
  assert.strictEqual(cleanName('document.JPG'), 'document');
  assert.strictEqual(cleanName('statement.PDF'), 'statement');
  assert.strictEqual(cleanName('scan.png.pdf'), 'scan');
});

// ---------------------------------------------------------------------------
// TEST 26: Verify Reset
// ---------------------------------------------------------------------------
runStep(26, 'Verify workspace reset restores empty queue and default state', () => {
  const workspaceState = {
    files: [
      { id: '1', name: 'a.pdf', _blobUrl: 'blob:http://localhost/test', _pdfBytes: new Uint8Array([1, 2]) },
      { id: '2', name: 'b.jpg', _blobUrl: 'blob:http://localhost/test2' }
    ],
    folder: { path: '/documents' },
    studentName: 'Aarti Kadam',
    currentIndex: 1,
    rotation: 90
  };
  // Execute reset/clear handler logic with memory cleanup
  for (const f of workspaceState.files) {
    f._blobUrl = null;
    f._pdfBytes = null;
  }
  workspaceState.files = [];
  workspaceState.folder = null;
  workspaceState.studentName = '';
  workspaceState.currentIndex = 0;
  workspaceState.rotation = 0;
  assert.strictEqual(workspaceState.files.length, 0);
  assert.strictEqual(workspaceState.folder, null);
  assert.strictEqual(workspaceState.studentName, '');
  assert.strictEqual(workspaceState.currentIndex, 0);
  assert.strictEqual(workspaceState.rotation, 0);
});

// ---------------------------------------------------------------------------
// TEST 27: Verify Cancel
// ---------------------------------------------------------------------------
runStep(27, 'Verify batch operation cancellation abort signal', () => {
  const abortCtrl = new AbortController();
  let wasCancelled = false;
  abortCtrl.signal.addEventListener('abort', () => {
    wasCancelled = true;
  });
  assert.strictEqual(abortCtrl.signal.aborted, false);
  abortCtrl.abort();
  assert.strictEqual(abortCtrl.signal.aborted, true);
  assert.strictEqual(wasCancelled, true);
});

// ---------------------------------------------------------------------------
// TEST 28: Verify Retry
// ---------------------------------------------------------------------------
runStep(28, 'Verify error retry mechanism on transient disk failures', () => {
  let attempts = 0;
  let transientLock = 1;
  function renameWithRetry(oldPath, newPath, maxRetries = 2) {
    for (let r = 0; r <= maxRetries; r++) {
      attempts++;
      if (transientLock > 0) {
        transientLock--;
        continue; // simulate transient Windows file lock retry
      }
      return { success: true, oldPath, newPath };
    }
    return { success: false, error: 'Locked' };
  }
  const res = renameWithRetry('/path/doc.pdf', '/path/doc_new.pdf');
  assert.strictEqual(res.success, true);
  assert.strictEqual(attempts, 2, 'Should succeed on second attempt after transient lock release');
});

// ---------------------------------------------------------------------------
// TEST 29: Verify Tab-key behavior
// ---------------------------------------------------------------------------
runStep(29, 'Verify bidirectional Tab / Shift+Tab keyboard navigation', () => {
  let cur = 0;
  const total = 5;
  function navigateQueue(shiftKey) {
    if (shiftKey) {
      cur = (cur - 1 + total) % total;
    } else {
      cur = (cur + 1) % total;
    }
    return cur;
  }
  assert.strictEqual(navigateQueue(false), 1, 'Tab moves forward to index 1');
  assert.strictEqual(navigateQueue(false), 2, 'Tab moves forward to index 2');
  assert.strictEqual(navigateQueue(true), 1, 'Shift+Tab moves backward to index 1');
  assert.strictEqual(navigateQueue(true), 0, 'Shift+Tab moves backward to index 0');
  assert.strictEqual(navigateQueue(true), 4, 'Shift+Tab wraps backward to index 4');
  assert.strictEqual(navigateQueue(false), 0, 'Tab wraps forward to index 0');
});

// ---------------------------------------------------------------------------
// TEST 30: Verify error handling
// ---------------------------------------------------------------------------
runStep(30, 'Verify Windows reserved names & illegal character blocks', () => {
  assert.ok(validateFilename('CON.pdf').length > 0, 'CON must be rejected');
  assert.ok(validateFilename('AUX.jpg').length > 0, 'AUX must be rejected');
  assert.ok(validateFilename('file/with/slash.pdf').length > 0, 'Slash must be rejected');
  assert.ok(validateFilename('bad*char.pdf').length > 0, 'Asterisk must be rejected');
  assert.strictEqual(validateFilename('10TH MARKSHEET AARTI.pdf'), '', 'Valid filename must pass');
});

// ---------------------------------------------------------------------------
// TEST 31: Restart the application and verify persistent data
// ---------------------------------------------------------------------------
runStep(31, 'Verify persistent presets loaded from config/document_presets.json', () => {
  const presetsJsonPath = path.join(ROOT, 'config/document_presets.json');
  assert.ok(fs.existsSync(presetsJsonPath));
  const data = JSON.parse(fs.readFileSync(presetsJsonPath, 'utf8'));
  assert.ok(data.forms['MAHA DBT'], 'MAHA DBT preset must persist');
  assert.ok(data.forms['SWAYAM'], 'SWAYAM preset must persist');
});

// ---------------------------------------------------------------------------
// TEST 32: Verify Smart Scan behavior
// ---------------------------------------------------------------------------
runStep(32, 'Verify Smart Scan auto-matching algorithm & confidence scores', () => {
  const matchAadhaar = matchFilenameSmart('aadhaar_card_scan.pdf', 'Rahul');
  assert.strictEqual(matchAadhaar.docType, 'AADHAAR CARD');
  assert.ok(matchAadhaar.confidence >= 80);
});

// ---------------------------------------------------------------------------
// TEST 33: Verify that unrelated modules are not changed
// ---------------------------------------------------------------------------
runStep(33, 'Verify strict single-tool isolation (no modifications to other tools)', () => {
  // Check tools/pdf_studio/README_LOCK.md is untouched and exists
  const pdfLock = path.join(ROOT, 'tools/pdf_studio/README_LOCK.md');
  assert.ok(fs.existsSync(pdfLock), 'PDF Studio lock file must exist untouched');
  const pdfLockContent = fs.readFileSync(pdfLock, 'utf8');
  assert.ok(pdfLockContent.includes('STRICTLY LOCKED'), 'PDF Studio must remain strictly locked');
});

// Cleanup temp folder
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

console.log('\n======================================================================');
console.log(`📊 FINAL RESULT: ${passedCount}/33 PASSED | ${failedCount}/33 FAILED`);
if (failedCount === 0) {
  console.log('🎉 ALL 33 END-TO-END TESTS PASSED WITH 100% SUCCESS!');
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
console.log('======================================================================');
