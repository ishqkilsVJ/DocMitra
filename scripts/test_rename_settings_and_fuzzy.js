// scripts/test_rename_settings_and_fuzzy.js
import fs from 'fs';
import assert from 'assert';
import {
  matchFilenameSmart,
  levenshteinDistance,
  stringSimilarity,
  extractCleanTokens,
  hasNumericConflict,
  DEFAULT_CHECKLISTS_DATA
} from '../tools/rename_tool/rename_tool_logic.js';

console.log('--- 🧪 STARTING DOCMITRA RENAME TOOL SETTINGS & FUZZY MATCHING TEST SUITE ---');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// 1. Levenshtein & Similarity Unit Tests
runTest('Levenshtein distance & string similarity', () => {
  assert.strictEqual(levenshteinDistance('marksheet', 'marksheet'), 0);
  assert.strictEqual(levenshteinDistance('marksheetdd', 'marksheet'), 2);
  const sim1 = stringSimilarity('marksheetdd', 'marksheet');
  assert.ok(sim1 >= 0.80, `Expected similarity >= 0.80, got ${sim1}`);

  const sim2 = stringSimilarity('bonfide', 'bonafide');
  assert.ok(sim2 >= 0.80, `Expected similarity >= 0.80, got ${sim2}`);

  const sim3 = stringSimilarity('adhar', 'aadhaar');
  assert.ok(sim3 >= 0.70, `Expected similarity >= 0.70, got ${sim3}`);
});

// 2. Order-Independent Token Matching Tests
runTest('Order-independent token matching on filenames', () => {
  // Word order 1: 12th Marksheet Vijay
  const res1 = matchFilenameSmart('12th Marksheet Vijay.pdf', 'Vijay');
  assert.strictEqual(res1.docType, '12TH MARKSHEET');
  assert.ok(res1.confidence >= 80, `Confidence was ${res1.confidence}`);
  assert.strictEqual(res1.isConfident, true);

  // Word order 2: Marksheet Vijay 12th
  const res2 = matchFilenameSmart('Marksheet Vijay 12th.pdf', 'Vijay');
  assert.strictEqual(res2.docType, '12TH MARKSHEET');
  assert.ok(res2.confidence >= 80, `Confidence was ${res2.confidence}`);
  assert.strictEqual(res2.isConfident, true);

  // Word order 3: Vijay Marksheet 12th
  const res3 = matchFilenameSmart('Vijay Marksheet 12th.pdf', 'Vijay');
  assert.strictEqual(res3.docType, '12TH MARKSHEET');
  assert.ok(res3.confidence >= 80, `Confidence was ${res3.confidence}`);

  // Aadhaar Card reversed
  const res4 = matchFilenameSmart('Card Aadhaar Aarti.jpg', 'Aarti');
  assert.strictEqual(res4.docType, 'AADHAAR CARD');
  assert.ok(res4.confidence >= 80);
});

// 3. Fuzzy Typo Tolerance Tests
runTest('Fuzzy typo tolerance (>= 80% similarity)', () => {
  // Marksheetdd typo
  const res1 = matchFilenameSmart('Marksheetdd Vijay 12th.pdf', 'Vijay');
  assert.strictEqual(res1.docType, '12TH MARKSHEET');
  assert.ok(res1.confidence >= 80, `Expected >= 80, got ${res1.confidence}`);

  // Adhar typo
  const res2 = matchFilenameSmart('Adhar Aarti.pdf', 'Aarti');
  assert.strictEqual(res2.docType, 'AADHAAR CARD');
  assert.ok(res2.confidence >= 80, `Expected >= 80, got ${res2.confidence}`);

  // Bonfide typo
  const res3 = matchFilenameSmart('Bonfide Aarti.pdf', 'Aarti');
  assert.strictEqual(res3.docType, 'BONAFIDE CERTIFICATE');
  assert.ok(res3.confidence >= 80, `Expected >= 80, got ${res3.confidence}`);

  // Pasing typo
  const res4 = matchFilenameSmart('10th Pasing Certificate.pdf');
  assert.strictEqual(res4.docType, '10TH PASSING CERTIFICATE');
  assert.ok(res4.confidence >= 80, `Expected >= 80, got ${res4.confidence}`);
});

// 4. Strict Numeric & Standard Guard Tests
runTest('Strict numeric & standard guard (never confuse 10 vs 12 or 1st vs 2nd)', () => {
  // 10th Marksheet MUST match 10TH MARKSHEET and NEVER 12TH MARKSHEET
  const res10 = matchFilenameSmart('10th Marksheet Aarti.pdf', 'Aarti');
  assert.strictEqual(res10.docType, '10TH MARKSHEET');
  assert.notStrictEqual(res10.docType, '12TH MARKSHEET');

  // 12th Marksheet MUST match 12TH MARKSHEET and NEVER 10TH MARKSHEET
  const res12 = matchFilenameSmart('12th Marksheet Aarti.pdf', 'Aarti');
  assert.strictEqual(res12.docType, '12TH MARKSHEET');
  assert.notStrictEqual(res12.docType, '10TH MARKSHEET');

  // 12 lc.jpg MUST match 12TH LC and NEVER 10TH LC
  const resLc12 = matchFilenameSmart('12 lc.jpg', 'Aarti');
  assert.strictEqual(resLc12.docType, '12TH LC');
  assert.notStrictEqual(resLc12.docType, '10TH LC');

  // 10 lc.jpg MUST match 10TH LC and NEVER 12TH LC
  const resLc10 = matchFilenameSmart('10 lc.jpg', 'Aarti');
  assert.strictEqual(resLc10.docType, '10TH LC');
  assert.notStrictEqual(resLc10.docType, '12TH LC');
});

// 5. Dynamic Preset Documents Matching Tests
runTest('Dynamic preset documents matching & custom documents', () => {
  // Custom document: Medical Fitness Certificate
  const customPreset = [
    { name: 'MEDICAL FITNESS CERTIFICATE', code: 'MED', keywords: ['medical fitness', 'fitness cert', 'fitness'] },
    { name: 'GAP CERTIFICATE', code: 'GAP', keywords: ['gap'] }
  ];

  const resMed = matchFilenameSmart('Fitness Medical Aarti.pdf', 'Aarti', null, customPreset);
  assert.strictEqual(resMed.docType, 'MEDICAL FITNESS CERTIFICATE');
  assert.ok(resMed.confidence >= 80, `Expected >= 80, got ${resMed.confidence}`);

  // Swayam document: Bonafide
  const resBon = matchFilenameSmart('Aarti Bonafide.jpg', 'Aarti', null, DEFAULT_CHECKLISTS_DATA['SWAYAM']);
  assert.strictEqual(resBon.docType, 'BONAFIDE CERTIFICATE');
  assert.ok(resBon.confidence >= 80);
});

// 6. Default Presets Verification
runTest('Default presets contain MAHA DBT and SWAYAM', () => {
  assert.ok(DEFAULT_CHECKLISTS_DATA['MAHA DBT'], 'MAHA DBT preset missing');
  assert.ok(DEFAULT_CHECKLISTS_DATA['SWAYAM'], 'SWAYAM preset missing');
  assert.strictEqual(DEFAULT_CHECKLISTS_DATA['MAHA DBT'].length, 13);
  assert.strictEqual(DEFAULT_CHECKLISTS_DATA['SWAYAM'].length, 11);
});

// 7. Structural HTML & DOM Elements Verification
runTest('Structural HTML & DOM elements in rename_tool.html and app/index.html', () => {
  const toolHtml = fs.readFileSync('tools/rename_tool/rename_tool.html', 'utf8');
  const appHtml = fs.readFileSync('app/index.html', 'utf8');

  for (const [name, html] of [['rename_tool.html', toolHtml], ['app/index.html', appHtml]]) {
    // btnRenameSettings button in toolbar
    assert.ok(html.includes('id="btnRenameSettings"'), `Missing #btnRenameSettings in ${name}`);
    // modalRenameSettings
    assert.ok(html.includes('id="modalRenameSettings"'), `Missing #modalRenameSettings in ${name}`);
    // tabBtnPresets and tabBtnShortcuts
    assert.ok(html.includes('id="tabBtnPresets"'), `Missing #tabBtnPresets in ${name}`);
    assert.ok(html.includes('id="tabBtnShortcuts"'), `Missing #tabBtnShortcuts in ${name}`);
    // selectActivePreset
    assert.ok(html.includes('id="selectActivePreset"'), `Missing #selectActivePreset in ${name}`);
    // modalAddDocument with inputAddDocAliases
    assert.ok(html.includes('id="modalAddDocument"'), `Missing #modalAddDocument in ${name}`);
    assert.ok(html.includes('id="inputAddDocAliases"'), `Missing #inputAddDocAliases in ${name}`);
    // newDocAlertBar must NOT be present
    assert.ok(!html.includes('id="newDocAlertBar"'), `Found obsolete #newDocAlertBar in ${name}`);
  }
});

console.log('--------------------------------------------------------------');
console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (100%)!');
}
