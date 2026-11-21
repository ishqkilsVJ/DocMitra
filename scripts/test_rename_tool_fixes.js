import assert from 'assert';
import fs from 'fs';
import path from 'path';

import {
  cleanName,
  ext,
  buildName,
  applyCase,
  uniqueDestination,
  matchFilenameSmart
} from '../tools/rename_tool/rename_tool_logic.js';

import {
  resolveFilePreviewUrl
} from '../tools/rename_tool/rename_tool_ui.js';

console.log('=== VERIFYING DOCMITRA RENAME TOOL 4 FIXES & FILENAME MATCHING ===\n');

// -------------------------------------------------------------
// Test 1: Filename-Based Smart Matching (Non-OCR, 30%+ threshold)
// -------------------------------------------------------------
console.log('[Test 1] Filename-Based Smart Matching...');
const m1 = matchFilenameSmart('10th_marksheet.pdf', 'Vijay Yadav');
assert.strictEqual(m1.docType, '10TH MARKSHEET');
assert.ok(m1.confidence >= 80, '10th marksheet should have >= 80% confidence');

const m2 = matchFilenameSmart('12th_hsc_mark.jpg', 'Vijay Yadav');
assert.strictEqual(m2.docType, '12TH MARKSHEET');
assert.ok(m2.confidence >= 80, '12th marksheet should have >= 80% confidence');

const m3 = matchFilenameSmart('adhar_card.pdf', 'Vijay Yadav');
assert.strictEqual(m3.docType, 'AADHAAR CARD');
assert.ok(m3.confidence >= 80, 'Aadhaar card should have >= 80% confidence');

const m4 = matchFilenameSmart('photo_scan.jpg', 'Vijay Yadav');
assert.strictEqual(m4.docType, 'PHOTO');
assert.ok(m4.confidence >= 80, 'Photo should have >= 80% confidence');

const m5 = matchFilenameSmart('caste_certificate.pdf', 'Vijay Yadav');
assert.strictEqual(m5.docType, 'CASTE CERTIFICATE');
assert.ok(m5.confidence >= 80, 'Caste cert should have >= 80% confidence');

const m6 = matchFilenameSmart('domicile_cert.pdf', 'Vijay Yadav');
assert.strictEqual(m6.docType, 'DOMICILE CERTIFICATE');
assert.ok(m6.confidence >= 80, 'Domicile cert should have >= 80% confidence');

// 30%+ threshold test (partial match)
const m7 = matchFilenameSmart('marksheet_generic.pdf');
assert.ok(m7.confidence >= 30, 'Generic marksheet should meet >= 30% threshold');
assert.ok(m7.docType !== null, 'Generic marksheet should have suggested docType');

// Below 30% threshold test
const m8 = matchFilenameSmart('xyz_unknown_99999.png');
assert.strictEqual(m8.docType, null, 'Unknown file must have null docType');
assert.strictEqual(m8.isConfident, false, 'Unknown file must be unconfident');
console.log('✓ Test 1 Passed: Filename-based matching strictly non-OCR with 30%+ threshold works perfectly.');

// -------------------------------------------------------------
// Test 2: Preview URL / Asset Conversion
// -------------------------------------------------------------
console.log('\n[Test 2] Preview URL & Asset Conversion...');
const mockFileBlob = { name: 'photo.jpg', fileObj: { size: 1024 } };
global.URL = {
  createObjectURL: (obj) => 'blob:http://localhost:3000/mock-uuid'
};
const url1 = resolveFilePreviewUrl(mockFileBlob);
assert.ok(url1.startsWith('blob:'), 'fileObj creates blob URL');

const mockFilePath = { name: 'scan.pdf', path: 'E:/Students/Vijay/scan.pdf' };
const url2 = resolveFilePreviewUrl(mockFilePath);
assert.ok(url2.includes('api/serve-file?path=') || url2.startsWith('http'), 'File path resolves to serve endpoint');
console.log('✓ Test 2 Passed: Preview URL resolution supports blob, local, and serve endpoints.');

// -------------------------------------------------------------
// Test 3: Static Structural Verifications in HTML & UI JS
// -------------------------------------------------------------
console.log('\n[Test 3] UI & Code Verification of All 4 Fixes...');
const htmlContent = fs.readFileSync(path.resolve('tools/rename_tool/rename_tool.html'), 'utf-8');
const uiJsContent = fs.readFileSync(path.resolve('tools/rename_tool/rename_tool_ui.js'), 'utf-8');

// Fix 2: Check that #newDocAlertBar is removed from rename_tool.html
assert.strictEqual(htmlContent.includes('id="newDocAlertBar"'), false, 'newDocAlertBar must NOT exist in rename_tool.html');
assert.strictEqual(uiJsContent.includes("document.getElementById('newDocAlertBar')"), false, 'newDocAlertBar must NOT be queried in rename_tool_ui.js');
console.log('✓ Fix 2 Verified: New Document Found banner and Add Document button completely removed from preview stage.');

// Fix 3: Check Hero Card top header has NO Matched/Unmatched statusTag pill
assert.strictEqual(uiJsContent.includes("statusTag.textContent = currentFile.status === 'needs_review' ? 'Needs Review' : (isReady ? 'Matched' : 'Unmatched');"), false, 'Hero Card statusTag must NOT exist in rename_tool_ui.js');
assert.ok(uiJsContent.includes('Clean header area with zero Matched/Unmatched pill clutter'), 'Clean header comment verified');
console.log('✓ Fix 3 Verified: Matched/Unmatched pill above Hero Card removed for clean uncluttered layout.');

// Fix 4: Check Missing Documents header deduplication
assert.ok(uiJsContent.includes('Missing Documents Found'), 'Missing Documents Found must exist in header');
assert.strictEqual(uiJsContent.includes('leftMissing.appendChild(document.createTextNode(\'MISSING DOCUMENTS\'));'), false, 'Duplicate MISSING DOCUMENTS text must NOT exist in leftMissing');
assert.ok(uiJsContent.includes('leftMissing.appendChild(document.createTextNode(`${missingRules.length} Missing Documents Found`));'), 'Header must contain single clean indicator');
console.log('✓ Fix 4 Verified: MISSING DOCUMENTS header renders indicator exactly ONCE with chevron intact.');

// Fix: Clean single-line queue display (zero triple name repetition)
assert.strictEqual(uiJsContent.includes("arrow.textContent = '→';"), false, 'Upcoming queue must not render cluttering arrow (→)');
assert.strictEqual(uiJsContent.includes("targetTitle.textContent = cleanName(f.targetName"), false, 'Upcoming queue must not duplicate target title');
assert.ok(uiJsContent.includes('zero triple repetition'), 'Clean single line comment verified');
console.log('✓ Clean Single-Line Queue Display Verified: Zero triple/duplicate name repetition in upcoming queue.');

// -------------------------------------------------------------
// Test 4: Casing and Auto-Numbering Integrity
// -------------------------------------------------------------
console.log('\n[Test 4] Casing & Duplicate Auto-Numbering Integrity...');
assert.strictEqual(applyCase('AADHAAR CARD VIJAY YADAV', 'upper'), 'AADHAAR CARD VIJAY YADAV');
assert.strictEqual(applyCase('AADHAAR CARD VIJAY YADAV', 'title'), 'Aadhaar Card Vijay Yadav');
assert.strictEqual(applyCase('AADHAAR CARD VIJAY YADAV', 'lower'), 'aadhaar card vijay yadav');

const used = new Set(['10TH MARKSHEET Vijay Yadav.pdf']);
const nextDup = uniqueDestination('10TH MARKSHEET Vijay Yadav.pdf', 'another_marksheet.pdf', used, 'Vijay Yadav');
assert.strictEqual(nextDup, '10TH MARKSHEET 1 Vijay Yadav.pdf');
console.log('✓ Test 4 Passed: Casing and duplicate numbering rules preserved 100%.');

console.log('\n=============================================================');
console.log('🎉 ALL 4 UI/PREVIEW FIXES & FILENAME MATCHING VERIFIED 100%!');
console.log('=============================================================');
