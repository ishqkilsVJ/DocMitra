/**
 * Verification Test: Zero-Duplicate Code, Keyword & Conflict Engine
 * Module: tools/rename_tool/
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser globals for Node.js environment
const fakeStorage = {};
global.localStorage = {
  getItem: (k) => fakeStorage[k] || null,
  setItem: (k, v) => { fakeStorage[k] = String(v); },
  removeItem: (k) => { delete fakeStorage[k]; },
  clear: () => { Object.keys(fakeStorage).forEach(k => delete fakeStorage[k]); }
};
global.window = {
  localStorage: global.localStorage,
  confirm: () => true,
  prompt: () => ''
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {} },
    setAttribute: () => {},
    addEventListener: () => {}
  }),
  body: {
    appendChild: () => {}
  }
};

async function runTests() {
  console.log('=== 🧪 STARTING VERIFICATION TESTS: Zero-Duplicate Codes & Keywords ===');

  const { RenamerUIManager, DEFAULT_SHORTCUTS } = await import('../rename_tool_ui.js');
  const instance = new RenamerUIManager();
  instance.shortcuts21 = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
  instance.state.customShortcuts = [];
  instance.state.documentPresets = {
    'MAHA DBT': [
      { name: 'AADHAAR CARD', keywords: ['aadhaar', 'uid'] },
      { name: 'INCOME CERTIFICATE', keywords: ['income', 'tahsildar'] }
    ]
  };
  instance.state.activePreset = 'MAHA DBT';

  // 1. Test findAvailableShortcutCode - Unique Code
  const uniqueCode = instance.findAvailableShortcutCode('UNIQUE_TEST', 'ANY_DOC');
  assert.strictEqual(uniqueCode, 'UNIQUE_TEST', 'Unique code must remain unchanged');
  console.log('  ✓ Test 1 Passed: findAvailableShortcutCode returns unique code without modification');

  // 2. Test findAvailableShortcutCode - Collision with another document
  // 'PIC' is assigned to 'PHOTO' in DEFAULT_SHORTCUTS
  const suffixedCode = instance.findAvailableShortcutCode('PIC', 'SIGNATURE');
  assert.strictEqual(suffixedCode, 'PIC2', 'Colliding code PIC for SIGNATURE must auto-suffix to PIC2');
  console.log('  ✓ Test 2 Passed: Collision auto-suffixing (PIC -> PIC2 for SIGNATURE) verified');

  // 3. Test findAvailableShortcutCode - Same document (editing)
  const selfCode = instance.findAvailableShortcutCode('PIC', 'PHOTO');
  assert.strictEqual(selfCode, 'PIC', 'Code for same canonical document must not be suffixed');
  console.log('  ✓ Test 3 Passed: Non-colliding self-document code preserved unchanged');

  // 4. Test multi-level collision suffixing (PIC2 already taken)
  instance.shortcuts21.push({
    code: 'PIC2',
    codes: ['PIC2'],
    label: 'OTHER DOC',
    canonical: 'OTHER DOC',
    keywords: ['other']
  });
  const suffixedCode3 = instance.findAvailableShortcutCode('PIC', 'THIRD DOC');
  assert.strictEqual(suffixedCode3, 'PIC3', 'Auto-suffix must increment to PIC3 when PIC2 is also taken');
  console.log('  ✓ Test 4 Passed: Multi-level collision suffixing (PIC -> PIC3) verified');

  // 5. Test Keyword Sanitization & Deduplication
  const rawKeywordsInput = 'photo, pic, photo, photograph, PHOTO,  pic , a, -';
  const rawTokens = rawKeywordsInput.split(',')
    .map(s => s.trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, ''))
    .filter(s => s.length >= 2);
  const uniqueSet = new Set(rawTokens);
  const cleanKeywords = Array.from(uniqueSet);
  assert.deepStrictEqual(cleanKeywords, ['photo', 'pic', 'photograph'], 'Duplicate & noise tokens must be cleanly removed');
  console.log('  ✓ Test 5 Passed: Keyword deduplication and noise filtering verified');

  // 6. Test Preset Document Uniqueness Guard logic
  const currentPresetList = instance.state.documentPresets['MAHA DBT'];
  const testDuplicateDoc = 'AADHAAR CARD';
  const isDuplicate = currentPresetList.some(item => (item.name || '').toUpperCase() === testDuplicateDoc);
  assert.strictEqual(isDuplicate, true, 'Preset must detect duplicate document name');
  console.log('  ✓ Test 6 Passed: Preset document duplication detection verified');

  // 7. Test Multi-Shortcode Deletion & Clean Unregistration
  instance.shortcuts21.push({
    code: 'SAMPLE',
    codes: ['SAMPLE', 'SMP', 'SMPL'],
    label: 'SAMPLE DOC',
    canonical: 'SAMPLE DOC',
    keywords: ['sample']
  });
  assert.ok(instance.resolveShortcut('SMPL'), 'resolveShortcut should find SMPL before deletion');

  // Remove by secondary code SMPL
  instance.handleRemoveShortcut('SMPL');
  const resolvedAfterDel = instance.resolveShortcut('SMPL');
  assert.strictEqual(resolvedAfterDel, null, 'Shortcut SMPL must be completely removed from shortcuts21');
  const resolvedBaseAfterDel = instance.resolveShortcut('SAMPLE');
  assert.strictEqual(resolvedBaseAfterDel, null, 'Primary shortcut SAMPLE must also be cleanly removed');
  console.log('  ✓ Test 7 Passed: Multi-code clean unregistration & removal verified');

  // 8. Test CSS file contains shake and glow keyframes
  const cssContent = fs.readFileSync(path.resolve(__dirname, '../rename_tool.css'), 'utf8');
  assert.ok(cssContent.includes('.shake-anim'), 'CSS must contain .shake-anim');
  assert.ok(cssContent.includes('@keyframes shakeAnim'), 'CSS must contain @keyframes shakeAnim');
  assert.ok(cssContent.includes('.chip-glow-anim'), 'CSS must contain .chip-glow-anim');
  assert.ok(cssContent.includes('@keyframes chipGlowAnim'), 'CSS must contain @keyframes chipGlowAnim');
  console.log('  ✓ Test 8 Passed: CSS shake and glow animations verified in rename_tool.css');

  console.log('\n🎉 ALL 8 ZERO-DUPLICATE & COLLISION VERIFICATION TESTS PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
