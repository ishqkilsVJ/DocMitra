import assert from 'assert';
import { isJunkFile } from '../src/ui/renamer-ui.js';
import { cleanName, ext, validateFilename } from '../src/libraries/rename-library.js';

console.log('=== RUNNING RENAMER SPECIFICATION TESTS ===');

// Test 1: Junk file filtering
console.log('[Test 1] Junk file filtering...');
assert.strictEqual(isJunkFile('Thumbs.db'), true, 'Thumbs.db should be junk');
assert.strictEqual(isJunkFile('desktop.ini'), true, 'desktop.ini should be junk');
assert.strictEqual(isJunkFile('.DS_Store'), true, '.DS_Store should be junk');
assert.strictEqual(isJunkFile('~$admission_form.docx'), true, '~$ Word lock files should be junk');
assert.strictEqual(isJunkFile('scan_001.tmp'), true, '.tmp files should be junk');
assert.strictEqual(isJunkFile('.hidden_file'), true, 'dot-files should be junk');

assert.strictEqual(isJunkFile('vijay_10th.pdf'), false, 'Normal PDF is not junk');
assert.strictEqual(isJunkFile('photo.jpg'), false, 'Normal JPG is not junk');
assert.strictEqual(isJunkFile('biodata.docx'), false, 'Normal DOCX is not junk');
console.log('✓ Junk blacklist verified: system & temp files filtered out.');

// Test 2: Base name only in edit field
console.log('[Test 2] Base name only in edit field (e.g. vijay yadav.pdf -> vijay yadav)...');
const sampleFile = 'vijay yadav.pdf';
const baseOnly = cleanName(sampleFile);
const extensionOnly = ext(sampleFile);
assert.strictEqual(baseOnly, 'vijay yadav', 'Edit field must contain only base name without extension');
assert.strictEqual(extensionOnly, '.pdf', 'Extension must be separate for locked pill badge');
console.log(`✓ Edit field value: "${baseOnly}", Locked badge: "${extensionOnly}"`);

// Test 3: Illegal Windows characters
console.log('[Test 3] Illegal character validation in input...');
const illegalChars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
illegalChars.forEach(c => {
  const err = validateFilename(`vijay${c}yadav.pdf`);
  assert(err.length > 0, `Character ${c} must be flagged as invalid`);
});
console.log('✓ Illegal characters strictly blocked.');

console.log('\n>>> ALL RENAMER SPEC TESTS PASSED! <<<');
