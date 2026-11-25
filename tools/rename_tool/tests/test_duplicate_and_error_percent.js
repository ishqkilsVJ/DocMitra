/**
 * Unit test for Smart Duplicate Detection & Old Name Error % Badge
 */
import assert from 'assert';
import {
  computeOldNameErrorPercent,
  detectDuplicateFiles
} from '../rename_tool_logic.js';

console.log('=== RUNNING SMART DUPLICATE DETECTION & ERROR % TESTS ===');

// 1. Error Percent Tests
console.log('\n[TEST 1] Old Name Spelling Error %:');

// Exact match -> 0%
const err0 = computeOldNameErrorPercent('caste certificate', 'CASTE CERTIFICATE');
assert.strictEqual(err0, 0, 'Exact match should return 0%');
console.log('✓ Exact match returns 0%');

// 1 typo in 17-char doc name -> ~6%
const err1 = computeOldNameErrorPercent('caste certifikate', 'CASTE CERTIFICATE');
assert(err1 > 0 && err1 <= 10, `Expected ~5-10% typo, got ${err1}%`);
console.log(`✓ 1-char typo in caste certificate returns ${err1}% (Expected ~6%)`);

// Normalized spacing: "10 th mark sheet" vs "10TH MARKSHEET" -> 0%
const errNorm = computeOldNameErrorPercent('10 th mark sheet', '10TH MARKSHEET');
assert.strictEqual(errNorm, 0, 'Spaced standard and marksheet should normalize to 0%');
console.log('✓ Spaced standard "10 th mark sheet" normalizes to 0%');

// Typo with standard: "10 th nark sheet" vs "10TH MARKSHEET" -> ~7%
const errTypo = computeOldNameErrorPercent('10 th nark sheet', '10TH MARKSHEET');
assert(errTypo > 0 && errTypo <= 15, `Expected ~7-10% typo, got ${errTypo}%`);
console.log(`✓ 1-char typo "10 th nark sheet" returns ${errTypo}%`);

// When student name is appended to targetName, but absent from oldName:
// It should compare against document name, not penalizing for added student name!
const errWithStudent = computeOldNameErrorPercent('caste certifikate', 'CASTE CERTIFICATE ARATI ARJUN', 'ARATI ARJUN');
assert.strictEqual(errWithStudent, err1, 'Student name should be excluded from error comparison when absent from old name');
console.log(`✓ Student name excluded cleanly: got ${errWithStudent}%`);

// 2. Multi-Layer Duplicate Detection Tests
console.log('\n[TEST 2] Multi-Layer Duplicate Detection:');

const testFiles = [
  // Pair 1: Suffix collision (100% Confirmed Duplicate)
  { id: '1', name: '12th_lc.pdf', targetName: '12TH LC.pdf', size: 100000, ext: '.pdf' },
  { id: '2', name: '12th_lc_2.pdf', targetName: '12TH LC 2.pdf', size: 105000, ext: '.pdf' },
  { id: '3', name: '12th_lc_3.pdf', targetName: '12TH LC 3.pdf', size: 110000, ext: '.pdf' },

  // Pair 2: Exact size + ext match without hash yet (50% Probable Duplicate)
  { id: '4', name: 'scan_doc_a.pdf', targetName: 'BONAFIDE.pdf', size: 250000, ext: '.pdf' },
  { id: '5', name: 'scan_doc_b.pdf', targetName: 'DOMICILE.pdf', size: 250000, ext: '.pdf' },

  // Pair 3: Identical SHA-256 hash match (100% Confirmed Duplicate)
  { id: '6', name: 'photo1.jpg', targetName: 'PHOTO.jpg', size: 45000, ext: '.jpg', sha256: 'abcd1234abcd1234' },
  { id: '7', name: 'photo_copy.jpg', targetName: 'PHOTO 2.jpg', size: 45000, ext: '.jpg', sha256: 'abcd1234abcd1234' },

  // Single file: Unique (No duplicate)
  { id: '8', name: 'income_cert.pdf', targetName: 'INCOME CERTIFICATE.pdf', size: 180000, ext: '.pdf' }
];

const dupResults = detectDuplicateFiles(testFiles);

// Suffix collision files -> Master stays clean (null), extra copies -> 'confirmed'
assert.strictEqual(dupResults.get('1').status, null, '12TH LC (master) should have status null (no duplicate badge)');
assert.strictEqual(dupResults.get('1').isMaster, true, '12TH LC should be marked isMaster');
assert.strictEqual(dupResults.get('2').status, 'confirmed', '12TH LC 2 should be confirmed duplicate');
assert.strictEqual(dupResults.get('3').status, 'confirmed', '12TH LC 3 should be confirmed duplicate');
console.log('✓ Suffix collision: master is clean and extra copies are flagged as "confirmed" (100% Duplicate)');

// Size + Ext match -> Master stays clean (null), extra copy -> 'probable'
assert.strictEqual(dupResults.get('4').status, null, 'Scan doc A (master) should have status null');
assert.strictEqual(dupResults.get('5').status, 'probable', 'Scan doc B should be probable duplicate (50%)');
console.log('✓ Exact byte size + extension: master is clean and extra copy is flagged as "probable" (50% Dup)');

// Hash match -> Master stays clean (null), extra copy -> 'confirmed'
assert.strictEqual(dupResults.get('6').status, null, 'Photo 1 (master) should have status null');
assert.strictEqual(dupResults.get('7').status, 'confirmed', 'Photo copy should be confirmed duplicate');
console.log('✓ SHA-256 hash match: master is clean and copy is flagged as "confirmed" (100% Duplicate)');

// Unique file -> null
assert.strictEqual(dupResults.get('8').status, null, 'Income cert should have no duplicate badge');
console.log('✓ Unique document has status null (no badge)');

console.log('\n🎉 ALL DUPLICATE & ERROR % TESTS PASSED 100%! 🎉\n');
