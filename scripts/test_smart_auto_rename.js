import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('--- TEST SUITE: Smart Auto-Rename Engine & UI Integration ---');

  // 1. Test logic imports
  const logicPath = path.resolve(__dirname, '../tools/rename_tool/rename_tool_logic.js');
  const { evaluateSmartOcrDocument, SMART_DOC_SIGNATURES } = await import(`file://${logicPath}`);

  assert.ok(Array.isArray(SMART_DOC_SIGNATURES), 'SMART_DOC_SIGNATURES must be an array');
  assert.ok(SMART_DOC_SIGNATURES.length >= 8, 'Must cover at least 8 document signatures');
  assert.strictEqual(typeof evaluateSmartOcrDocument, 'function', 'evaluateSmartOcrDocument must be a function');
  console.log('✓ Logic module exports verified');

  // 2. Test Aadhaar Card evaluation
  const aadhaarText = `
    GOVERNMENT OF INDIA
    Unique Identification Authority of India
    Enrollment No: 1234/56789/01234
    To,
    Vijay Ramesh Yadav
    DOB: 15/08/2004
    Gender: Male
    9876 5432 1098
    Vid: 1234 5678 9012 3456
    Mera Aadhaar, Meri Pehchan
  `;
  const aadhaarRes = evaluateSmartOcrDocument(aadhaarText, 'Vijay Ramesh Yadav');
  assert.strictEqual(aadhaarRes.canonical, 'AADHAAR CARD', 'Should recognize AADHAAR CARD');
  assert.ok(aadhaarRes.confidence >= 80, `Aadhaar confidence should be >= 80%, got ${aadhaarRes.confidence}%`);
  assert.strictEqual(aadhaarRes.isConfident, true, 'isConfident must be true for Aadhaar match');
  console.log(`✓ Aadhaar Card recognized: ${aadhaarRes.canonical} (Confidence: ${aadhaarRes.confidence}%)`);

  // 3. Test 10th Marksheet evaluation
  const sscText = `
    MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
    DIVISIONAL BOARD, PUNE
    SECONDARY SCHOOL CERTIFICATE EXAMINATION - STATEMENT OF MARKS
    CANDIDATE NAME: VIJAY RAMESH YADAV
    SEAT NO: D084512   CENTRE NO: 1204
    MARCH 2020  STANDARD X (SSC)
    TOTAL MARKS: 450/500   RESULT: PASS WITH DISTINCTION
  `;
  const sscRes = evaluateSmartOcrDocument(sscText, 'Vijay Ramesh Yadav');
  assert.strictEqual(sscRes.canonical, '10TH MARKSHEET', 'Should recognize 10TH MARKSHEET');
  assert.ok(sscRes.confidence >= 80, `SSC confidence should be >= 80%, got ${sscRes.confidence}%`);
  assert.strictEqual(sscRes.isConfident, true, 'isConfident must be true for SSC');
  console.log(`✓ 10th Marksheet recognized: ${sscRes.canonical} (Confidence: ${sscRes.confidence}%)`);

  // 4. Test 12th Marksheet vs 10th Marksheet distinction
  const hscText = `
    MAHARASHTRA STATE BOARD OF SECONDARY AND HIGHER SECONDARY EDUCATION
    HIGHER SECONDARY CERTIFICATE EXAMINATION
    STATEMENT OF MARKS - STD 12 HSC
    CANDIDATE: VIJAY RAMESH YADAV
    STREAM: SCIENCE   SEAT NO: M123456
    RESULT: PASS
  `;
  const hscRes = evaluateSmartOcrDocument(hscText, 'Vijay Ramesh Yadav');
  assert.strictEqual(hscRes.canonical, '12TH MARKSHEET', 'Should distinguish and recognize 12TH MARKSHEET');
  assert.ok(hscRes.confidence >= 80, `HSC confidence should be >= 80%, got ${hscRes.confidence}%`);
  console.log(`✓ 12th Marksheet recognized: ${hscRes.canonical} (Confidence: ${hscRes.confidence}%)`);

  // 5. Test Caste Certificate & Validity
  const casteText = `
    GOVERNMENT OF MAHARASHTRA
    OFFICE OF THE SUB DIVISIONAL OFFICER
    CASTE CERTIFICATE
    This is to certify that Shri Vijay Ramesh Yadav belongs to Kunbi Caste
    which is recognized as Other Backward Class (OBC).
    Competent Authority Tahasildar
  `;
  const casteRes = evaluateSmartOcrDocument(casteText, 'Vijay Ramesh Yadav');
  assert.strictEqual(casteRes.canonical, 'CASTE CERTIFICATE', 'Should recognize CASTE CERTIFICATE');
  assert.ok(casteRes.confidence >= 80, `Caste cert confidence should be >= 80%, got ${casteRes.confidence}%`);
  console.log(`✓ Caste Certificate recognized: ${casteRes.canonical} (Confidence: ${casteRes.confidence}%)`);

  // 6. Test Low Confidence / Uncertain Document
  const unclearText = `
    Some random receipt or blurred photocopy
    Payment received Rs 500
    Date: 12/04/2023
    Signature
  `;
  const unclearRes = evaluateSmartOcrDocument(unclearText, 'Vijay Ramesh Yadav');
  assert.ok(unclearRes.confidence < 80, `Unclear text confidence should be < 80%, got ${unclearRes.confidence}%`);
  assert.strictEqual(unclearRes.isConfident, false, 'isConfident must be false for unclear documents');
  console.log(`✓ Low confidence safely flagged: Confidence ${unclearRes.confidence}%, isConfident: false`);

  // 7. Verify UI HTML contains buttons & F4 hotkey
  const htmlPath = path.resolve(__dirname, '../tools/rename_tool/rename_tool.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  assert.ok(htmlContent.includes('id="btnSmartScanBatch"'), 'btnSmartScanBatch button must be in HTML');
  assert.ok(htmlContent.includes('id="btnRenameMatched"'), 'btnRenameMatched button must be in HTML');
  assert.ok(htmlContent.includes('id="btnReviewUnmatched"'), 'btnReviewUnmatched button must be in HTML');
  assert.ok(htmlContent.includes('>F4<'), 'F4 hotkey indicator must be in HTML');
  console.log('✓ UI HTML buttons and hotkey badges verified');

  // 8. Verify Scoped CSS contains confidence badge rules
  const cssPath = path.resolve(__dirname, '../tools/rename_tool/rename_tool.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert.ok(cssContent.includes('.confidence-badge-high'), 'Scoped CSS must contain .confidence-badge-high');
  assert.ok(cssContent.includes('.confidence-badge-med'), 'Scoped CSS must contain .confidence-badge-med');
  assert.ok(cssContent.includes('.confidence-badge-low'), 'Scoped CSS must contain .confidence-badge-low');
  assert.ok(cssContent.includes('.smart-scan-pulse'), 'Scoped CSS must contain .smart-scan-pulse');
  console.log('✓ Scoped CSS rules verified');

  // 9. Verify UI JS integration
  const uiJsPath = path.resolve(__dirname, '../tools/rename_tool/rename_tool_ui.js');
  const uiJsContent = fs.readFileSync(uiJsPath, 'utf-8');
  assert.ok(uiJsContent.includes('handleSmartScanBatch'), 'rename_tool_ui.js must implement handleSmartScanBatch');
  assert.ok(uiJsContent.includes('handleRenameAllMatched'), 'rename_tool_ui.js must implement handleRenameAllMatched');
  assert.ok(uiJsContent.includes('handleReviewUnmatched'), 'rename_tool_ui.js must implement handleReviewUnmatched');
  assert.ok(uiJsContent.includes('extractTextFromFile'), 'rename_tool_ui.js must implement extractTextFromFile');
  assert.ok(uiJsContent.includes("e.key === 'F4'"), 'rename_tool_ui.js must bind F4 key');
  console.log('✓ Renamer UI bindings and handlers verified');

  console.log('\n🌟 ALL SMART AUTO-RENAME ENGINE & INTEGRATION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
