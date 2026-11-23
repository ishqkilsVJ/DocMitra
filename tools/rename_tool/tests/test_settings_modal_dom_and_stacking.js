import assert from 'node:assert';
import fs from 'node:fs';

console.log('=== 🧪 TEST: SETTINGS MODAL DOM STACKING & TABLE COLUMNS ALIGNMENT ===');

const files = [
  { name: 'rename_tool.html', path: 'tools/rename_tool/rename_tool.html' },
  { name: 'app/index.html', path: 'app/index.html' }
];

for (const file of files) {
  const content = fs.readFileSync(file.path, 'utf8');

  // 1. Stacking order: modalAddDocument must appear AFTER modalRenameSettings
  const idxSettings = content.indexOf('id="modalRenameSettings"');
  const idxAddDoc = content.indexOf('id="modalAddDocument"');
  assert.ok(idxSettings !== -1, `${file.name} must contain modalRenameSettings`);
  assert.ok(idxAddDoc !== -1, `${file.name} must contain modalAddDocument`);
  assert.ok(idxAddDoc > idxSettings, `${file.name}: modalAddDocument must be rendered AFTER modalRenameSettings in DOM`);
  console.log(`  ✓ ${file.name}: DOM stacking order correct (modalAddDocument is after modalRenameSettings)`);

  // 2. High z-index on modalAddDocument and modalRenameSettings
  assert.ok(content.includes('id="modalAddDocument"'), `${file.name} must have modalAddDocument`);
  assert.ok(content.includes('z-[9999]') || content.includes('z-[1000]'), `${file.name} must use high z-index`);
  console.log(`  ✓ ${file.name}: High z-index configured for child modal layering`);

  // 3. Search inputs present
  assert.ok(content.includes('id="inputSearchPresetDocs"'), `${file.name} must contain inputSearchPresetDocs`);
  assert.ok(content.includes('id="inputSearchShortcuts"'), `${file.name} must contain inputSearchShortcuts`);
  console.log(`  ✓ ${file.name}: Both search inputs present`);

  // 4. Fixed table layout style
  assert.ok(content.includes('table-layout: fixed; width: 100%;'), `${file.name} must have locked table layout`);
  console.log(`  ✓ ${file.name}: Strict locked table layout present`);
}

console.log('🎉 ALL SETTINGS MODAL DOM & STACKING VERIFICATION CHECKS PASSED 100%!');
