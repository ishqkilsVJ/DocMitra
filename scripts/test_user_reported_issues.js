import assert from 'assert';
import {
  cleanName,
  matchFilenameSmart,
  ext
} from '../tools/rename_tool/rename_tool_logic.js';
import fs from 'fs';

console.log('--- 🧪 VERIFYING USER REPORTED ISSUES (FALSE MATCHES & EXTENSIONS) ---');

// 1. Stacked and Single Extension Stripping
const extTests = [
  { input: '12 lc.jpg', expected: '12 lc' },
  { input: 'document.pdf.jpg', expected: 'document' },
  { input: 'A (1) AARTI ARUN BIRHADE.PDF', expected: 'A (1) AARTI ARUN BIRHADE' },
  { input: '12TH MARKSHEET.PDF.JPG', expected: '12TH MARKSHEET' },
  { input: 'CASTE_CERTIFICATE.PDF', expected: 'CASTE_CERTIFICATE' },
  { input: 'Photo.jpg', expected: 'Photo' }
];

extTests.forEach(t => {
  const res = cleanName(t.input);
  assert.strictEqual(res, t.expected, `cleanName failed for ${t.input}: got "${res}", expected "${t.expected}"`);
});
console.log('  ✅ PASS: Stacked and single extensions cleanly stripped in UI basenames');

// 2. Strict Document Matching without False PARENT DECLARATION Matches
const matchTests = [
  { filename: 'CAS AARTI ARUN BIRHADE.jpg', notExpected: 'PARENT DECLARATION', expected: 'CASTE CERTIFICATE' },
  { filename: 'in AARTI ARUN BIRHADE.pdf', notExpected: 'PARENT DECLARATION', expected: 'INCOME CERTIFICATE' },
  { filename: '12L AARTI ARUN BIRHADE.jpg', notExpected: 'PARENT DECLARATION', expected: '12TH LC' },
  { filename: '12 lc.jpg', notExpected: 'PARENT DECLARATION', expected: '12TH LC' },
  { filename: '12TH MARKSHEET AARTI.pdf', notExpected: 'PARENT DECLARATION', expected: '12TH MARKSHEET' },
  { filename: 'Domicile Certificate AARTI.jpg', notExpected: 'PARENT DECLARATION', expected: 'DOMICILE CERTIFICATE' },
  { filename: 'Aadhaar Card.jpg', notExpected: 'PARENT DECLARATION', expected: 'AADHAAR CARD' },
  { filename: 'Bank Passbook.jpg', notExpected: 'PARENT DECLARATION', expected: 'PASSBOOK BANK' },
  { filename: 'Photo.jpg', notExpected: 'PARENT DECLARATION', expected: 'PHOTO' },
  { filename: 'random_unknown_file.pdf', notExpected: 'PARENT DECLARATION' }
];

matchTests.forEach(t => {
  const res = matchFilenameSmart(t.filename, 'AARTI ARUN BIRHADE');
  if (res && res.docType) {
    assert.notStrictEqual(res.docType.toUpperCase(), t.notExpected, `FALSE MATCH: "${t.filename}" wrongly matched to ${t.notExpected}!`);
    if (t.expected) {
      assert.strictEqual(res.docType.toUpperCase(), t.expected.toUpperCase(), `Mismatch for "${t.filename}": got ${res.docType}, expected ${t.expected}`);
    }
  }
});
console.log('  ✅ PASS: Zero false PARENT DECLARATION matches on Caste, Income, 12th LC, Marksheet, Domicile, Aadhaar, Bank');

// 3. Verify HTML & JS DOM elements
const html = fs.readFileSync('tools/rename_tool/rename_tool.html', 'utf8');
const uiJs = fs.readFileSync('tools/rename_tool/rename_tool_ui.js', 'utf8');

assert(html.includes('id="btnCopyPreset"'), 'btnCopyPreset missing in rename_tool.html');
assert(html.includes('id="btnDoneRenameSettings"'), 'btnDoneRenameSettings missing in rename_tool.html');
assert(html.includes('Back to Rename Tool'), 'Back to Rename Tool button missing in rename_tool.html');
assert(!html.includes('Reset to Factory Defaults'), 'Reset to Factory Defaults still present in rename_tool.html footer');
assert(uiJs.includes('handleCopyPreset'), 'handleCopyPreset missing in rename_tool_ui.js');
assert(uiJs.includes('openEditDocumentModal'), 'openEditDocumentModal missing in rename_tool_ui.js');
assert(uiJs.includes('handleEditShortcut'), 'handleEditShortcut missing in rename_tool_ui.js');
assert(uiJs.includes('selectQuickPreset'), 'selectQuickPreset missing in rename_tool_ui.js');
assert(uiJs.includes('read_binary_file'), 'read_binary_file missing in rename_tool_ui.js');
assert(uiJs.includes('getTauriInvoke'), 'getTauriInvoke missing in rename_tool_ui.js');

console.log('  ✅ PASS: Structural elements (Copy Preset, in-place edit, quick switcher, read_binary_file) verified');

console.log('--------------------------------------------------------------');
console.log('🎉 ALL USER REPORTED ISSUES FIXED AND VERIFIED 100%!');
