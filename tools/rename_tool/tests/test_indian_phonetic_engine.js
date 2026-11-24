/**
 * 3-Layer Indian Phonetic & Fuzzy Matching Engine Test Suite
 * Tests 50 heavily misspelled Indian document names against DocMitra matching engine.
 */

import { matchFilenameSmart, normalizeIndianText, doubleMetaphone, phoneticSimilarity, generateSmartKeywords } from '../rename_tool_logic.js';

console.log('================================================================');
console.log('🧪 RUNNING 3-LAYER INDIAN PHONETIC & FUZZY MATCHING TEST SUITE');
console.log('================================================================\n');

const testCases = [
  { input: "kcast sartificat", expected: "CASTE CERTIFICATE", minConfidence: 85 },
  { input: "domisail", expected: "DOMICILE CERTIFICATE", minConfidence: 85 },
  { input: "incom", expected: "INCOME CERTIFICATE", minConfidence: 85 },
  { input: "bonafaid", expected: "BONAFIDE CERTIFICATE", minConfidence: 85 },
  { input: "non crimiler", expected: "NON CREAMY LAYER CERTIFICATE", minConfidence: 85 },
  { input: "12th markshit", expected: "12TH MARKSHEET", minConfidence: 85 },
  { input: "10th markshit", expected: "10TH MARKSHEET", minConfidence: 85 },
  { input: "adhar", expected: "AADHAAR CARD", minConfidence: 85 },
  { input: "foto", expected: "PHOTO", minConfidence: 85 },
  { input: "woter id", expected: "VOTER ID", minConfidence: 85 },
  { input: "dahavi markshit", expected: "10TH MARKSHEET", minConfidence: 85 },
  { input: "baravi markshit", expected: "12TH MARKSHEET", minConfidence: 85 },
  { input: "caste dakhla", expected: "CASTE CERTIFICATE", minConfidence: 85 },
  { input: "kcast dakhla sachin", expected: "CASTE CERTIFICATE", minConfidence: 85 },
  { input: "utpanna dakhla rahul", expected: "INCOME CERTIFICATE", minConfidence: 85 },
  { input: "domisail dakhla", expected: "DOMICILE CERTIFICATE", minConfidence: 85 },
  { input: "skool leaving sartificat", expected: "12TH LC", minConfidence: 85 },
  { input: "12th tc leaving", expected: "12TH LC", minConfidence: 85 },
  { input: "10th lc transfer", expected: "10TH LC", minConfidence: 85 },
  { input: "pan kard", expected: "PAN CARD", minConfidence: 85 },
  { input: "bank pasbuk", expected: "BANK PASSBOOK", minConfidence: 85 },
  { input: "gap sartifiket", expected: "GAP CERTIFICATE", minConfidence: 85 },
  { input: "rashan kard", expected: "RATION CARD", minConfidence: 85 },
  { input: "ews dakhla", expected: "EWS CERTIFICATE", minConfidence: 85 },
  { input: "divyang cert", expected: "DISABILITY CERTIFICATE", minConfidence: 85 },
  { input: "signatur sahi", expected: "SIGNATURE", minConfidence: 85 },
  { input: "cast validiti", expected: "CASTE VALIDITY CERTIFICATE", minConfidence: 85 },
  { input: "kast validity cert", expected: "CASTE VALIDITY CERTIFICATE", minConfidence: 85 },
  { input: "12th pasing sartificat", expected: "12TH PASSING CERTIFICATE", minConfidence: 85 },
  { input: "10th pasing sartificat", expected: "10TH PASSING CERTIFICATE", minConfidence: 85 },
  { input: "12th markshit and pasing", expected: "12TH MARKSHEET AND PASSING CERTIFICATE", minConfidence: 85 },
  { input: "10th markshit and pasing", expected: "10TH MARKSHEET AND PASSING CERTIFICATE", minConfidence: 85 },
  { input: "self declarashan sdc", expected: "SELF DECLARATION", minConfidence: 85 },
  { input: "palak ghoshana pdc", expected: "PARENT DECLARATION", minConfidence: 85 },
  { input: "birth dakhla janam", expected: "BIRTH CERTIFICATE", minConfidence: 85 },
  { input: "rashtriyatva nat cert", expected: "NATIONALITY CERTIFICATE", minConfidence: 85 },
  { input: "medical fitnes arogya", expected: "MEDICAL FITNESS CERTIFICATE", minConfidence: 85 },
  { input: "migrashan cert", expected: "MIGRATION CERTIFICATE", minConfidence: 85 },
  { input: "hostel vasatigruh dakhla", expected: "HOSTEL CERTIFICATE", minConfidence: 85 },
  { input: "fee risit payment", expected: "FEE RECEIPT", minConfidence: 85 },
  { input: "atempt sartificat", expected: "ATTEMPT CERTIFICATE", minConfidence: 85 },
  { input: "mrutyu death dakhla", expected: "DEATH CERTIFICATE", minConfidence: 85 },
  { input: "cet aplication form", expected: "CET APPLICATION FORM", minConfidence: 85 },
  { input: "cet score kard", expected: "CET SCORE CARD", minConfidence: 85 },
  { input: "drivin lisence dl", expected: "DRIVING LICENSE", minConfidence: 85 },
  { input: "1st year markshit fy", expected: "1ST YEAR MARKSHEET", minConfidence: 85 },
  { input: "2nd year markshit sy", expected: "2ND YEAR MARKSHEET", minConfidence: 85 },
  { input: "3rd year markshit ty", expected: "3RD YEAR MARKSHEET", minConfidence: 85 },
  { input: "digree convocation cert", expected: "DEGREE CERTIFICATE", minConfidence: 85 },
  { input: "apaar abc id kard", expected: "APAAR ID", minConfidence: 85 }
];

let passed = 0;
let failed = 0;

console.log('--- 1. Testing 50 Heavily Misspelled Indian Document Names ---');

testCases.forEach((tc, index) => {
  const result = matchFilenameSmart(tc.input);
  const isMatch = result && result.docType === tc.expected;
  const isConfHigh = result && result.confidence >= tc.minConfidence;
  
  if (isMatch && isConfHigh) {
    passed++;
    console.log(`[PASS] Case ${index + 1}: "${tc.input}" -> "${result.docType}" (${result.confidence}%, ${result.reason})`);
  } else {
    failed++;
    console.error(`[FAIL] Case ${index + 1}: "${tc.input}"`);
    console.error(`       Expected: "${tc.expected}" (>= ${tc.minConfidence}%)`);
    console.error(`       Actual:   "${result ? result.docType : 'null'}" (${result ? result.confidence : 0}%)`);
  }
});

console.log('\n--- 2. Testing False Positive & Threshold Guardrails (< 50% = Unmatched) ---');

const falsePositiveCases = [
  "random_unrelated_text_file",
  "xyz_paper_document",
  "receipt_bill_misc_order"
];

let fpPassed = true;
falsePositiveCases.forEach(name => {
  const res = matchFilenameSmart(name);
  if (res.confidence >= 50 && res.docType) {
    console.error(`[FAIL] False positive on "${name}": matched "${res.docType}" at ${res.confidence}%`);
    fpPassed = false;
  } else {
    console.log(`[PASS] Guardrail: "${name}" correctly unmatched (${res.confidence}%)`);
  }
});

console.log('\n--- 3. Testing Numeric Standard Guard (10TH vs 12TH Conflict Guard) ---');
const std10Res = matchFilenameSmart('10th markshit vijay');
const std12Res = matchFilenameSmart('12th markshit vijay');
const dahaviRes = matchFilenameSmart('dahavi markshit aniket');
const baraviRes = matchFilenameSmart('baravi markshit aniket');

if (std10Res.docType === '10TH MARKSHEET' && std12Res.docType === '12TH MARKSHEET' &&
    dahaviRes.docType === '10TH MARKSHEET' && baraviRes.docType === '12TH MARKSHEET') {
  console.log('[PASS] Academic Number Guard passed: 10th/dahavi and 12th/baravi cleanly isolated!');
} else {
  console.error('[FAIL] Academic Number Guard failed!');
  failed++;
}

console.log('\n--- 4. Testing Auto-Generate Keywords Generator ---');
const kwsCaste = generateSmartKeywords('Caste Certificate', ['CST']);
console.log('Caste Certificate Keywords:', kwsCaste);
if (kwsCaste.includes('kcast') || kwsCaste.includes('sartificat') || kwsCaste.includes('dakhla')) {
  console.log('[PASS] Auto-Generate Keywords successfully includes Indian phonetic variations!');
} else {
  console.error('[FAIL] Auto-Generate Keywords missing phonetic variations!');
  failed++;
}

console.log('\n================================================================');
console.log(`TOTAL PASSED: ${passed}/${testCases.length} (${fpPassed ? 'All Guardrails OK' : 'Guardrail Issue'})`);
if (failed > 0 || !fpPassed) {
  console.error(`TOTAL FAILED: ${failed}`);
  process.exit(1);
} else {
  console.log('🎉 100% SUCCESS: 3-Layer Indian Phonetic & Fuzzy Matching Engine Verified!');
  process.exit(0);
}
