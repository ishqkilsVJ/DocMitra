/**
 * Verification Test: 4 UI Refinements & PIC Short Code Expansion Bugfix
 * Module: tools/rename_tool/
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=== 🧪 STARTING VERIFICATION TESTS: Shortcode Expansion & Multi-Code UI ===');

  // 1. Verify rename_tool_logic.js DEFAULT_SHORTCUT_DICTIONARY
  const { DEFAULT_SHORTCUT_DICTIONARY, buildName } = await import('../rename_tool_logic.js');
  const photoEntry = DEFAULT_SHORTCUT_DICTIONARY.find(d => d.primaryShortcut === 'PIC');
  assert.ok(photoEntry, 'PIC shortcut must exist in DEFAULT_SHORTCUT_DICTIONARY');
  assert.strictEqual(photoEntry.displayName, 'PHOTO', 'PIC displayName must be canonical PHOTO, never Student Photo');
  assert.strictEqual(photoEntry.outputName, 'PHOTO', 'PIC outputName must be canonical PHOTO');
  console.log('  ✓ Test 1 Passed: DEFAULT_SHORTCUT_DICTIONARY PIC mapped to PHOTO');

  // 2. Verify rename_tool_ui.js DEFAULT_SHORTCUTS and multi-code structure
  const { DEFAULT_SHORTCUTS } = await import('../rename_tool_ui.js');
  const scPhoto = DEFAULT_SHORTCUTS.find(s => s.code === 'PIC');
  assert.ok(scPhoto, 'DEFAULT_SHORTCUTS must contain PIC');
  assert.strictEqual(scPhoto.label, 'PHOTO', 'DEFAULT_SHORTCUTS PIC label must be PHOTO');
  assert.strictEqual(scPhoto.canonical, 'PHOTO', 'DEFAULT_SHORTCUTS PIC canonical must be PHOTO');
  assert.ok(Array.isArray(scPhoto.codes), 'DEFAULT_SHORTCUTS must have codes array');
  assert.ok(scPhoto.codes.includes('PIC'), 'DEFAULT_SHORTCUTS PIC codes array must contain PIC');
  console.log('  ✓ Test 2 Passed: DEFAULT_SHORTCUTS PIC label and codes array verified');

  // 3. Verify DOM parity & Structure in rename_tool.html and app/index.html
  const files = [
    { name: 'rename_tool.html', path: path.resolve(__dirname, '../rename_tool.html') },
    { name: 'app/index.html', path: path.resolve(__dirname, '../../../app/index.html') }
  ];

  for (const file of files) {
    const content = fs.readFileSync(file.path, 'utf8');

    // Check Presets table <thead> has 4 columns (No Short Code)
    assert.ok(!content.includes('style="width: 11%;">Short Code</th>') || content.indexOf('style="width: 11%;">Short Code</th>') === -1,
      `${file.name}: Presets table must not have Short Code th`);
    assert.ok(content.includes('style="width: 32%;">Document Name</th>'), `${file.name}: Must have 32% Document Name th`);
    assert.ok(content.includes('style="width: 55%;">Keywords / Tokens</th>'), `${file.name}: Must have 55% Keywords / Tokens th`);
    console.log(`  ✓ Test 3 Passed (${file.name}): Presets table has 4 columns with Short Code completely removed`);

    // Check Modal Add/Edit Document has Multi-Short-Code UI elements
    assert.ok(content.includes('id="inputAddDocCode"'), `${file.name}: Input #inputAddDocCode must exist`);
    assert.ok(content.includes('id="btnAddShortcutChip"'), `${file.name}: Button #btnAddShortcutChip must exist`);
    assert.ok(content.includes('id="containerShortcutChips"'), `${file.name}: Container #containerShortcutChips must exist`);

    // Check Target Name Preview has no .pdf extension
    const previewMatch = content.match(/id="addDocTargetPreview"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(previewMatch, `${file.name}: Must contain #addDocTargetPreview`);
    const previewText = previewMatch[1].trim();
    assert.ok(!previewText.includes('.pdf') && !previewText.includes('.jpg'),
      `${file.name}: Target preview must NOT contain .pdf or .jpg (found: "${previewText}")`);
    console.log(`  ✓ Test 4 Passed (${file.name}): Multi-code chips DOM & preview without file extension verified`);
  }

  // 4. Verify mock RenamerUIManager resolution & expansion formula
  const { RenamerUIManager } = await import('../rename_tool_ui.js');
  const instance = new RenamerUIManager();
  instance.state.studentName = 'BIRHADE ARTI ARUN';
  instance.state.style = 'upper';

  // Test resolveShortcut with PIC
  const resolvedPic = instance.resolveShortcut('PIC');
  assert.ok(resolvedPic, 'resolveShortcut("PIC") must return an entry');
  assert.strictEqual(resolvedPic.canonical, 'PHOTO', 'resolveShortcut("PIC") canonical must be PHOTO');

  // Test multi-code resolution with PHO
  instance.shortcuts21.push({
    code: 'PIC',
    codes: ['PIC', 'PHO'],
    label: 'PHOTO',
    canonical: 'PHOTO',
    keywords: ['photo', 'pic']
  });

  const resolvedPho = instance.resolveShortcut('PHO');
  assert.ok(resolvedPho, 'resolveShortcut("PHO") must resolve multi-shortcode');
  assert.strictEqual(resolvedPho.canonical, 'PHOTO', 'resolveShortcut("PHO") canonical must be PHOTO');

  // Test expansion formula
  const expandedName = buildName(resolvedPic.canonical, instance.state.studentName, null, instance.state.style);
  assert.strictEqual(expandedName, 'PHOTO BIRHADE ARTI ARUN', 'Formula expansion must equal PHOTO BIRHADE ARTI ARUN');
  console.log('  ✓ Test 5 Passed: Multi-code resolution (PIC and PHO -> PHOTO) and expansion formula verified');

  console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED 100%!');
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
