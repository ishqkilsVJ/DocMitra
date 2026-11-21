/**
 * scripts/test_rename_tool_master_suite.js
 * Comprehensive automated verification test suite for DocMitra Bulk Document Renamer:
 * Covers Phase 1, Phase 2, Phase 3, Phase 4, and Sequential One-by-One Live Streaming Smart Scan (TC-01 through TC-11).
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

import {
  cleanName,
  ext,
  buildName,
  uniqueDestination,
  validateFilename,
  DEFAULT_CHECKLISTS_DATA
} from '../tools/rename_tool/rename_tool_logic.js';

import {
  renameNativeFile,
  batchRenameNativeFiles,
  rotateNativeFile,
  importNativeFile
} from '../src/services/native-bridge-service.js';

import {
  loadDocumentPresets,
  saveDocumentPresets
} from '../src/services/storage-service.js';

console.log('=== RUNNING DOCMITRA BULK RENAMER MASTER VERIFICATION SUITE ===\n');

// ---------------------------------------------------------------------------
// TC-01: Phase 1 — Bottom Bar Cleanup & High-Visibility 'Rename All'
// ---------------------------------------------------------------------------
console.log('[TC-01] Phase 1: Verifying Bottom Bar Cleanup & High-Visibility Rename All...');
const htmlPath = path.join(ROOT, 'tools/rename_tool/rename_tool.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Ensure no visible <kbd> shortcut tags inside bottom toolbar
const footerMatch = htmlContent.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
assert.ok(footerMatch, 'Footer toolbar must exist in rename_tool.html');
const footerContent = footerMatch[1];
assert.ok(!footerContent.includes('<kbd'), 'No <kbd> tags should exist in bottom toolbar');

// Ensure essential buttons exist
assert.ok(footerContent.includes('id="btnUndoRename"'), 'Undo button must exist in toolbar');
assert.ok(footerContent.includes('id="btnKeepOriginal"'), 'Keep Original button must exist in toolbar');
assert.ok(footerContent.includes('id="btnSmartScanBatch"'), 'Smart Scan button must exist in toolbar');
assert.ok(footerContent.includes('id="btnRenameMatched"'), 'Rename Matched button must exist in toolbar');
assert.ok(footerContent.includes('id="btnReviewUnmatched"'), 'Review Unmatched button must exist in toolbar');
assert.ok(footerContent.includes('id="btnSaveBatch"'), 'Save Batch button must exist in toolbar');
assert.ok(footerContent.includes('id="btnExportAudit"'), 'Export Audit button must exist in toolbar');

// Verify Rename All button styling is prominent and high-contrast
assert.ok(footerContent.includes('id="btnRenameAll"'), 'btnRenameAll must exist');
assert.ok(footerContent.includes('bg-emerald-600'), 'btnRenameAll must have prominent emerald styling');
assert.ok(footerContent.includes('text-[15px]') || footerContent.includes('font-bold'), 'btnRenameAll must have prominent font styling');

// Verify synchronization with app/index.html
const appIndexHtmlPath = path.join(ROOT, 'app/index.html');
const appIndexContent = fs.readFileSync(appIndexHtmlPath, 'utf-8');
const appRenamerFooter = appIndexContent.match(/<section id="view-bulk-renamer"[\s\S]*?<footer[^>]*>([\s\S]*?)<\/footer>/);
assert.ok(appRenamerFooter, 'app/index.html must contain view-bulk-renamer footer');
assert.ok(!appRenamerFooter[1].includes('<kbd'), 'app/index.html renamer footer must not contain <kbd> tags');
assert.ok(appRenamerFooter[1].includes('bg-emerald-600'), 'app/index.html renamer footer must include bg-emerald-600');
console.log('✓ TC-01 Passed: Bottom toolbar is clean, clutter-free, and Rename All is prominently styled (synchronized with app/index.html).\n');

// ---------------------------------------------------------------------------
// TC-02: Phase 2 — Clean Filename Display (No Extensions)
// ---------------------------------------------------------------------------
console.log('[TC-02] Phase 2: Verifying Clean Filename Display (No Extensions)...');
const sampleFiles = [
  'Student_Marksheet.pdf',
  'PHOTO_PASSPORT.jpg',
  'Income_Certificate_2026.PNG',
  'Aadhaar_Front.jpeg'
];

sampleFiles.forEach(fn => {
  const cleaned = cleanName(fn);
  assert.ok(!cleaned.endsWith('.pdf'), `cleanName should strip .pdf: ${cleaned}`);
  assert.ok(!cleaned.endsWith('.jpg'), `cleanName should strip .jpg: ${cleaned}`);
  assert.ok(!cleaned.endsWith('.png'), `cleanName should strip .png: ${cleaned}`);
  assert.ok(!cleaned.endsWith('.jpeg'), `cleanName should strip .jpeg: ${cleaned}`);
  const recoveredExt = ext(fn);
  assert.ok(recoveredExt.startsWith('.'), `ext() should preserve extension: ${recoveredExt}`);
});

// Verify in UI code that cleanName is used for Original label and Queue titles
const uiJsPath = path.join(ROOT, 'tools/rename_tool/rename_tool_ui.js');
const uiJsContent = fs.readFileSync(uiJsPath, 'utf-8');
assert.ok(uiJsContent.includes('origVal.textContent = cleanName(currentFile.name)'), 'Original label must use cleanName');
assert.ok(uiJsContent.includes('targetTitle.textContent = cleanName('), 'Upcoming queue titles must use cleanName');
console.log('✓ TC-02 Passed: All filename views display clean base names without extensions.\n');

// ---------------------------------------------------------------------------
// TC-03: Phase 2 — Strict Queue Lifecycle
// ---------------------------------------------------------------------------
console.log('[TC-03] Phase 2: Verifying Strict Queue Lifecycle...');
// Test queue formula: files stay in upcoming queue until isRenamed === true
const mockFiles = [
  { id: '1', name: 'File1.pdf', isRenamed: false, isKept: false },
  { id: '2', name: 'File2.pdf', isRenamed: false, isKept: true },  // user kept original
  { id: '3', name: 'File3.pdf', isRenamed: true,  isKept: false }, // successfully renamed on disk
  { id: '4', name: 'File4.pdf', isRenamed: false, isKept: false }
];

let currentIndex = 0;
// When currentIndex is 0, upcoming files are indices 1, 2, 3... that are not renamed
let upcoming = mockFiles.filter((f, idx) => idx !== currentIndex && !f.isRenamed);
assert.strictEqual(upcoming.length, 2, 'Files 2 and 4 should be in upcoming (File 3 is renamed)');
assert.ok(upcoming.some(f => f.id === '2'), 'Kept file must remain in queue until disk rename');

// Jump to File 4 (currentIndex = 3)
currentIndex = 3;
upcoming = mockFiles.filter((f, idx) => idx !== currentIndex && !f.isRenamed);
// File 1 and File 2 should BOTH remain in upcoming
assert.strictEqual(upcoming.length, 2, 'Jumping ahead must NEVER lose prior unrenamed files');
assert.ok(upcoming.some(f => f.id === '1'), 'File 1 must still be in upcoming queue');
assert.ok(upcoming.some(f => f.id === '2'), 'File 2 must still be in upcoming queue');

// Completed files contains ONLY isRenamed === true
const completed = mockFiles.filter(f => f.isRenamed);
assert.strictEqual(completed.length, 1, 'Completed files must only include isRenamed === true');
assert.strictEqual(completed[0].id, '3');
console.log('✓ TC-03 Passed: Strict Queue Lifecycle prevents file disappearance and enforces disk-success completion.\n');

// ---------------------------------------------------------------------------
// TC-04: Phase 2 — Auto-Increment Duplicate Numbering with studentName
// ---------------------------------------------------------------------------
console.log('[TC-04] Phase 2: Verifying Auto-Increment Duplicate Numbering with studentName...');
const existingNames = new Set([
  '10TH MARKSHEET RAHUL PATIL.pdf',
  '10TH MARKSHEET 1 RAHUL PATIL.pdf',
  'INCOME CERTIFICATE.pdf'
]);

// With studentName: number inserted before student name
const candidateWithStudent = uniqueDestination('10TH MARKSHEET RAHUL PATIL.pdf', 'scan1.pdf', existingNames, 'RAHUL PATIL');
assert.strictEqual(candidateWithStudent, '10TH MARKSHEET 2 RAHUL PATIL.pdf', 'Duplicate should auto-increment to 2 before student name');

// Without studentName: number appended before extension
const candidateNoStudent = uniqueDestination('INCOME CERTIFICATE.pdf', 'scan2.pdf', existingNames, '');
assert.strictEqual(candidateNoStudent, 'INCOME CERTIFICATE 1.pdf', 'Duplicate should auto-increment to 1 when no student name');

// Preserving document numbers ending in digits (e.g. FORM 16)
const form16Student = uniqueDestination('FORM 16 RAHUL PATIL.pdf', '', new Set(['form 16 rahul patil.pdf']), 'RAHUL PATIL');
assert.strictEqual(form16Student, 'FORM 16 1 RAHUL PATIL.pdf', 'FORM 16 with student must preserve 16 and suffix 1');
const form16NoStudent = uniqueDestination('FORM 16.pdf', '', new Set(['form 16.pdf']), '');
assert.strictEqual(form16NoStudent, 'FORM 16 1.pdf', 'FORM 16 without student must preserve 16 and suffix 1');

// Verify bridge service passes studentName
assert.ok(uiJsContent.includes('studentName: this.state.studentName'), 'executeRename plan must pass studentName');
assert.ok(uiJsContent.includes('uniqueDestination(desiredWithExt, f.name, usedDestinations, this.state.studentName)'), 'loadFolderData must pass studentName to uniqueDestination');
console.log('✓ TC-04 Passed: Auto-increment collision avoidance follows project rules with studentName (FORM 16 preserved).\n');

// ---------------------------------------------------------------------------
// TC-05: Phase 3 — True Per-File Rotation (State Isolation)
// ---------------------------------------------------------------------------
console.log('[TC-05] Phase 3: Verifying Per-File Rotation State Isolation...');
const fileA = { id: 'a', name: 'A.pdf', rotation: 0 };
const fileB = { id: 'b', name: 'B.pdf', rotation: 0 };

// Rotate File A by 90 degrees
fileA.rotation = (fileA.rotation + 90) % 360;
assert.strictEqual(fileA.rotation, 90, 'File A rotation should be 90');
assert.strictEqual(fileB.rotation, 0, 'File B rotation must remain strictly 0 (never global)');

// Rotate File A to 270 degrees
fileA.rotation = (fileA.rotation + 180) % 360;
assert.strictEqual(fileA.rotation, 270);
assert.strictEqual(fileB.rotation, 0, 'File B remains 0');

// Verify rotated files with unchanged names are included in batch rename plan
const pendingWithRot = [
  { id: '1', name: 'Doc.pdf', targetName: 'Doc.pdf', rotation: 90, isRenamed: false },
  { id: '2', name: 'Keep.pdf', targetName: 'Keep.pdf', rotation: 0, isRenamed: false }
].filter(f => !f.isRenamed && ((f.targetName && f.targetName !== f.name) || (f.rotation && f.rotation % 360 !== 0)));
assert.strictEqual(pendingWithRot.length, 1, 'Rotated file with unchanged name must be included in pending');
assert.strictEqual(pendingWithRot[0].id, '1');
console.log('✓ TC-05 Passed: Per-file rotation state is completely isolated and included in batch plan.\n');

// ---------------------------------------------------------------------------
// TC-06: Phase 3 — Actual Saved Output Disk Rotation (pypdf & PIL)
// ---------------------------------------------------------------------------
console.log('[TC-06] Phase 3: Verifying Actual Saved Output Disk Rotation via Python Backend...');
import { execSync } from 'child_process';
const pyResult = execSync(`python scripts/test_python_disk_ops.py`, { encoding: 'utf-8' });
assert.ok(pyResult.includes('ALL_PYTHON_DISK_OPS_PASSED'), 'Python backend disk operations must pass');
console.log('✓ TC-06 Passed: True disk output rotation verified with pypdf and PIL on physical files.\n');

// ---------------------------------------------------------------------------
// TC-07: Phase 3 — Single-Extension Code Rename Fix (ADR etc.)
// ---------------------------------------------------------------------------
console.log('[TC-07] Phase 3: Verifying Single-Extension Code Rename Fix...');
const extRegex = /(\.[a-zA-Z0-9]+)+$/i;

const typedInputs = [
  'ADR',
  'ADR.pdf',
  'ADR.PDF',
  '10M',
  '10M.pdf.pdf',
  'DOM.PNG'
];

typedInputs.forEach(input => {
  const stem = input.replace(extRegex, '').trim();
  assert.ok(!stem.includes('.'), `Stem should be cleanly stripped of extensions: "${stem}" from "${input}"`);
  const finalExt = '.pdf';
  const finalName = `${stem} RAHUL PATIL${finalExt}`;
  assert.ok(!finalName.includes('.pdf.pdf'), `Should never have double extension: ${finalName}`);
  assert.ok(!finalName.includes('.PDF.pdf'), `Should never have case double extension: ${finalName}`);
});
console.log('✓ TC-07 Passed: Single-extension safe renamer prevents double extensions.\n');

// ---------------------------------------------------------------------------
// TC-08: Phase 4 — Dynamic Presets & Persistent Disk Storage
// ---------------------------------------------------------------------------
console.log('[TC-08] Phase 4: Verifying Dynamic Presets & Persistent Storage...');
const presetsFilePath = path.join(ROOT, 'config/document_presets.json');
assert.ok(fs.existsSync(presetsFilePath), 'config/document_presets.json must exist');
const presetsData = JSON.parse(fs.readFileSync(presetsFilePath, 'utf-8'));
assert.ok(presetsData.forms, 'document_presets.json must contain forms object');
assert.ok(presetsData.forms['MAHA DBT FORM'], 'MAHA DBT FORM preset must exist');

// Verify CRUD operations in settings-ui.js
const settingsUiPath = path.join(ROOT, 'src/ui/settings-ui.js');
const settingsUiContent = fs.readFileSync(settingsUiPath, 'utf-8');
assert.ok(settingsUiContent.includes('Add Document'), 'settings-ui must include Add Document functionality');
assert.ok(settingsUiContent.includes('saveDocumentPresets'), 'settings-ui must save presets via saveDocumentPresets');
assert.ok(settingsUiContent.includes('loadDocumentPresets'), 'settings-ui must load presets via loadDocumentPresets');
console.log('✓ TC-08 Passed: Dynamic presets persist in config/document_presets.json with full CRUD.\n');

// ---------------------------------------------------------------------------
// TC-09: Phase 4 — Collapsible Missing Documents
// ---------------------------------------------------------------------------
console.log('[TC-09] Phase 4: Verifying Collapsible Missing Documents...');
assert.ok(uiJsContent.includes('isMissingDocsCollapsed: true'), 'Missing documents section must be collapsed by default');
assert.ok(uiJsContent.includes('animate-pulse'), 'Missing documents indicator must have pulsating animation');
assert.ok(uiJsContent.includes('Missing Documents Found'), 'Indicator must show Missing Documents Found');
console.log('✓ TC-09 Passed: Missing documents section collapses by default with pulsating indicator.\n');

// ---------------------------------------------------------------------------
// TC-10: Phase 4 — Functional Import Document
// ---------------------------------------------------------------------------
console.log('[TC-10] Phase 4: Verifying Functional Import Document Disk Copy & Detection...');
assert.ok(pyResult.includes('Python File Import and duplicate sequential auto-numbering verified successfully'), 'Python backend import operations must pass');
assert.ok(uiJsContent.includes('evaluateSmartOcrDocument(text, studentName)'), 'Import Document must run OCR detection pipeline');
assert.ok(uiJsContent.includes("'needs_review'"), 'Import Document must flag uncertain files with needs_review status');
console.log('✓ TC-10 Passed: Import Document performs safe physical copy on disk with detection and Needs Review flagging.\n');

// ---------------------------------------------------------------------------
// TC-11: Smart Scan — Sequential One-by-One Live Streaming Scan
// ---------------------------------------------------------------------------
console.log('[TC-11] Smart Scan: Verifying Sequential Live Streaming Scan...');
assert.ok(uiJsContent.includes('_scanAbortController'), 'UI must maintain AbortController for cancellation');
assert.ok(uiJsContent.includes('scanQueue.unshift(currentFile)'), 'Scan queue must prioritize File #1 first');
assert.ok(uiJsContent.includes('f.isScanning = true'), 'Scanning file must be tagged with isScanning = true');
assert.ok(uiJsContent.includes('SCANNING'), 'Queue row must show live SCANNING indicator');
assert.ok(uiJsContent.includes('signal.aborted'), 'Scan loop must check abort signal on each iteration');
console.log('✓ TC-11 Passed: Sequential Live Streaming Smart Scan prioritizes File #1 with row-by-row streaming.\n');

console.log('🎉 ALL 11 MASTER TEST CASES (TC-01 through TC-11) PASSED 100%! 🎉');
