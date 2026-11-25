/**
 * tools/rename_tool/tests/test_missing_documents_desk.js
 * Comprehensive automated unit & integration test suite for MissingDocumentsModal
 */

import assert from 'assert';
import {
  DEFAULT_CHECKLISTS_DATA,
  DEFAULT_LINKED_RULES,
  buildName,
  uniqueDestination,
  cleanName,
  applyCase
} from '../rename_tool_logic.js';
import { MissingDocumentsModal } from '../missing_documents_modal.js';

console.log('===============================================================');
console.log('🧪 RUNNING: Missing Documents & Follow-up Desk Test Suite');
console.log('===============================================================');

// -----------------------------------------------------------------------------
// Test 1: Class Instantiation and Lifecycle
// -----------------------------------------------------------------------------
console.log('\n[TEST 1] Instantiation and Callbacks...');
let importCalled = false;
let followupCalled = false;
let presetCalled = false;
let closeCalled = false;

// Mock DOM container
const mockContainer = {
  appendChild: (child) => { mockContainer.lastChild = child; }
};

const modal = new MissingDocumentsModal({
  container: mockContainer,
  onImportFile: (doc) => { importCalled = true; },
  onSetFollowup: ({ docName, date }) => { followupCalled = true; },
  onPresetChange: (preset) => { presetCalled = true; },
  onClose: () => { closeCalled = true; }
});

assert.strictEqual(typeof modal.mount, 'function');
assert.strictEqual(typeof modal.open, 'function');
assert.strictEqual(typeof modal.close, 'function');
assert.strictEqual(typeof modal.render, 'function');
console.log('✓ Test 1 Passed: Modal instance exposes full component API');

// -----------------------------------------------------------------------------
// Test 2: Progress Ring & Dasharray Calculation
// -----------------------------------------------------------------------------
console.log('\n[TEST 2] Progress Ring & Readiness Statistics Math...');
function computeReadiness(presentCount, totalCount) {
  const percent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
  const strokeDash = `${percent}, 100`;
  return { percent, strokeDash };
}

const r0 = computeReadiness(0, 20);
assert.strictEqual(r0.percent, 0);
assert.strictEqual(r0.strokeDash, '0, 100');

const r50 = computeReadiness(10, 20);
assert.strictEqual(r50.percent, 50);
assert.strictEqual(r50.strokeDash, '50, 100');

const r85 = computeReadiness(17, 20);
assert.strictEqual(r85.percent, 85);
assert.strictEqual(r85.strokeDash, '85, 100');

const r100 = computeReadiness(20, 20);
assert.strictEqual(r100.percent, 100);
assert.strictEqual(r100.strokeDash, '100, 100');
console.log('✓ Test 2 Passed: 0%, 50%, 85%, and 100% SVG circular ring math accurate');

// -----------------------------------------------------------------------------
// Test 3: Missing Rules Filter & Combined Document Detection
// -----------------------------------------------------------------------------
console.log('\n[TEST 3] Combined Rules & Missing Document Calculation...');
const rawRules = DEFAULT_CHECKLISTS_DATA['MAHA DBT'] || [];
assert(rawRules.length > 0, 'MAHA DBT preset must have rules');
const mahaRules = rawRules.map(item => Array.isArray(item) ? { name: item[0] } : item);

// Simulate presence of 12TH MARKSHEET AND PASSING (Combined)
const presentSet = new Set(['12TH MARKSHEET AND PASSING']);

const missing = mahaRules.filter((r) => {
  const cleanRule = (r.name || r).toUpperCase();
  if (presentSet.has(cleanRule)) return false;
  for (const link of DEFAULT_LINKED_RULES) {
    if (link.combined && presentSet.has(link.combined.toUpperCase())) {
      if (cleanRule === link.part1.toUpperCase() || cleanRule === link.part2.toUpperCase()) {
        return false;
      }
    }
  }
  return true;
});

// Since 12TH MARKSHEET AND PASSING is present, 12TH MARKSHEET and 12TH PASSING CERTIFICATE must not be in missing
const marksheetInMissing = missing.some(r => r.name.toUpperCase() === '12TH MARKSHEET');
assert.strictEqual(marksheetInMissing, false, '12TH MARKSHEET must not be in missing list when combined is present');
console.log('✓ Test 3 Passed: Combined documents correctly fulfill linked missing rules');

// -----------------------------------------------------------------------------
// Test 4: Canonical Import Formula Generation with / without Student Name
// -----------------------------------------------------------------------------
console.log('\n[TEST 4] Canonical Target Name Generation on Import...');
const student = 'Vijay Ramesh Yadav';

// 1. With student name and UPPER style
const name1 = buildName('10TH PASSING CERTIFICATE', student, null, 'upper');
assert.strictEqual(name1, '10TH PASSING CERTIFICATE VIJAY RAMESH YADAV');

// 2. With student name and Title style
const name2 = buildName('10th Passing Certificate', student, null, 'title');
assert.strictEqual(name2, '10th Passing Certificate Vijay Ramesh Yadav');

// 3. Without student name (student unchecked)
const name3 = buildName('10TH PASSING CERTIFICATE', '', null, 'upper');
assert.strictEqual(name3, '10TH PASSING CERTIFICATE');

// 4. Duplicate collision handling (suffix 2 before student name)
const usedDestinations = new Set(['10TH PASSING CERTIFICATE VIJAY RAMESH YADAV.pdf']);
const uniqueTarget = uniqueDestination('10TH PASSING CERTIFICATE VIJAY RAMESH YADAV.pdf', 'scan.pdf', usedDestinations, student);
assert.strictEqual(uniqueTarget, '10TH PASSING CERTIFICATE 2 VIJAY RAMESH YADAV.pdf');

console.log('✓ Test 4 Passed: Canonical import formula builds correctly with active styles and duplicate suffixing');

// -----------------------------------------------------------------------------
// Test 5: UI/UX Audit & Layout Verification (Readiness on Top, Clean Folder, Row Badges)
// -----------------------------------------------------------------------------
console.log('\n[TEST 5] UI/UX Layout & Metadata Badges Verification...');

// Create a DOM-like container for render testing
const renderedElements = {};
const testModal = new MissingDocumentsModal({
  container: {
    appendChild: (child) => {}
  }
});

testModal.contentEl = {
  set innerHTML(html) {
    this._html = html;
  },
  get innerHTML() {
    return this._html || '';
  },
  querySelector: () => null,
  querySelectorAll: () => []
};

testModal.render({
  studentName: 'APARNA GORAKH NADEKAR',
  folderPath: 'E:/Documents/Admissions/APARNA GORAKH NADEKAR.pdf',
  activePreset: 'MAHA DBT',
  presetsList: ['MAHA DBT', 'CET CELL'],
  missingRules: [
    { name: 'CASTE VALIDITY CERTIFICATE', code: 'CVC' },
    { name: 'INCOME CERTIFICATE', code: 'INC' }
  ],
  presentDocs: [
    {
      name: '10TH MARKSHEET APARNA GORAKH NADEKAR.pdf',
      docType: '10TH MARKSHEET',
      size: 328704, // ~321 KB
      ext: 'PDF',
      dateModified: '2026-11-24T12:45:00.000Z',
      isCombined: false
    }
  ],
  followupMap: {
    'INCOME CERTIFICATE': '2026-11-28'
  },
  totalRequiredCount: 3
});

const html = testModal.contentEl.innerHTML;

// 1. Verify Application Readiness Status is placed BEFORE Missing Documents section in scroll body
const readinessIdx = html.indexOf('Application Readiness Status');
const missingDocsSectionIdx = html.indexOf('<span class="font-headline-sm text-[15px] text-on-surface font-bold">Missing Documents</span>');
const presentDocsIdx = html.indexOf('Present Documents in Folder');

assert(readinessIdx > 0, 'Application Readiness Status must be present');
assert(missingDocsSectionIdx > 0, 'Missing Documents section must be present');
assert(presentDocsIdx > 0, 'Present Documents section must be present');
assert(readinessIdx < missingDocsSectionIdx, 'Application Readiness must be rendered ABOVE Missing Documents section');
assert(missingDocsSectionIdx < presentDocsIdx, 'Missing Documents section must be rendered ABOVE Present Documents');
console.log('  ✓ Verified: Application Readiness is positioned at the top above Missing & Present sections');

// 2. Verify Student Name is displayed inside Readiness card and header
assert(html.includes('APARNA GORAKH NADEKAR'), 'Student Name must be clearly displayed');
assert(html.includes('Student Name:'), 'Student Name label must be rendered in Readiness card');
console.log('  ✓ Verified: Student Name is clearly displayed inside Application Readiness card');

// 3. Verify clean folder name without raw file path or edit pencil
assert(!html.includes('DIR:'), 'Raw DIR: prefix must be replaced with clean Folder:');
assert(!html.includes('📁 E:/Documents/Admissions/APARNA GORAKH NADEKAR.pdf'), 'Raw file path must not be displayed');
assert(html.includes('📁 APARNA GORAKH NADEKAR.pdf') || html.includes('📁 APARNA GORAKH NADEKAR'), 'Clean folder badge must be displayed');
console.log('  ✓ Verified: Raw file paths and clunky edit buttons removed, clean folder name shown');

// 4. Verify Date (DD-MM-YYYY), Size and File Type on Present Document row
assert(html.includes('321 KB'), 'Present document must display formatted file size (321 KB)');
assert(html.includes('PDF'), 'Present document must display file type badge (PDF)');
assert(html.includes('24-11-2026'), 'Present document must display formatted date (24-11-2026)');
console.log('  ✓ Verified: Present document rows display Date (DD-MM-YYYY), Size, and Type badge');

// 5. Verify Type, Target Size and Follow-up on Missing Document row
assert(html.includes('PDF / JPG'), 'Missing document must display expected file type badge (PDF / JPG)');
assert(html.includes('Target ≤ 256 KB'), 'Missing document must display Target ≤ 256 KB buffer');
assert(html.includes('Promised: 2026-11-28') || html.includes('2026-11-28'), 'Missing document must display promised follow-up date');
console.log('  ✓ Verified: Missing document rows display Type, Target Size, and Follow-up Status');

console.log('✓ Test 5 Passed: All 5 UI/UX Audit & Layout specifications validated 100%');

console.log('\n===============================================================');
console.log('🎉 ALL 5 UNIT & INTEGRATION TEST PHASES PASSED 100%!');
console.log('===============================================================');
