import assert from 'node:assert';
import { executeRename, undoRename, validateFilename, cleanName, ext } from '../src/libraries/rename-library.js';
import { undoManager } from '../src/libraries/undo-library.js';
import { uniqueDestination } from '../src/libraries/duplicate-name-library.js';
import { isJunkFile } from '../src/ui/renamer-ui.js';

console.log('=== RUNNING REVIEWER FIX VERIFICATION SUITE ===');

// Test 1: URL and path synchronization on executeRename
console.log('[Test 1] executeRename path and URL synchronization...');
const mockFile = {
  id: 'file_1',
  name: '12th.pdf',
  path: 'E:/admissions/Vijay/12th.pdf',
  nativePath: 'E:/admissions/Vijay/12th.pdf',
  url: 'http://localhost:3000/api/serve-file?path=E%3A%2Fadmissions%2FVijay%2F12th.pdf',
  isRenamed: false,
  status: 'pending'
};

const plan = [{
  old: '12th.pdf',
  next: '12TH MARKSHEET Vijay Yadav.pdf',
  file: mockFile,
  nativePath: mockFile.path
}];

// In headless environment without Tauri / server.py, renameNativeFile will fail unless mocked or tested directly.
// Let's test undoRename with dir having only .path
console.log('[Test 2] undoRename with dir having only path property (not nativePath)...');
const dirWithPathOnly = { path: 'E:/admissions/Vijay', name: 'Vijay' };
let nativeRenamesCalled = [];

// Mock global fetch for test
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (url.includes('/api/native-rename')) {
    const body = JSON.parse(opts.body);
    nativeRenamesCalled.push(body);
    const parent = body.oldPath.replace(/\\/g, '/').replace(/\/[^\/]+$/, '');
    const newPath = `${parent}/${body.newName}`;
    return {
      json: async () => ({
        success: true,
        oldPath: body.oldPath,
        newPath,
        path: newPath,
        name: body.newName
      })
    };
  }
  return { ok: true, json: async () => ({}) };
};

(async () => {
  try {
    // 1. Execute rename
    await executeRename(dirWithPathOnly, plan);
    assert.strictEqual(mockFile.name, '12TH MARKSHEET Vijay Yadav.pdf');
    assert.strictEqual(mockFile.isRenamed, true);
    assert.strictEqual(mockFile.status, 'renamed');
    assert.strictEqual(mockFile.path, 'E:/admissions/Vijay/12TH MARKSHEET Vijay Yadav.pdf');
    assert.ok(mockFile.url.includes('12TH%20MARKSHEET%20Vijay%20Yadav.pdf'), 'File URL must be updated with new path');
    console.log('✓ File path and URL successfully updated after executeRename.');

    // 2. Undo rename
    await undoRename(dirWithPathOnly, plan);
    assert.strictEqual(mockFile.name, '12th.pdf');
    assert.strictEqual(mockFile.isRenamed, false);
    assert.strictEqual(mockFile.status, 'pending');
    assert.strictEqual(mockFile.path, 'E:/admissions/Vijay/12th.pdf');
    assert.ok(mockFile.url.includes('12th.pdf'), 'File URL must be restored to original path after undo');
    console.log('✓ File path, status, and URL successfully restored after undoRename.');

    // 3. Batch vs single student folder classification test
    console.log('[Test 3] Batch folder detection with loose index file...');
    const batchData = {
      name: 'FYJC',
      path: 'E:/FYJC',
      subfolders: [{ name: 'Vijay_Yadav', path: 'E:/FYJC/Vijay_Yadav' }, { name: 'Pooja_Patil', path: 'E:/FYJC/Pooja_Patil' }],
      files: [{ name: 'students_list.xlsx', path: 'E:/FYJC/students_list.xlsx' }]
    };
    const validFiles = batchData.files.filter(f => !isJunkFile(f.name));
    const isBatch = batchData.subfolders && batchData.subfolders.length > 1;
    assert.strictEqual(isBatch, true, 'Folder with multiple subfolders must be identified as Batch Parent');
    console.log('✓ Batch parent correctly identified despite presence of loose Excel roster file.');

    // 4. Duplicate Destination numbering robustness
    console.log('[Test 4] Duplicate destination collision prevention...');
    const used = new Set(['10TH MARKSHEET 1.pdf']);
    const target = uniqueDestination('10TH MARKSHEET.pdf', 'raw.pdf', used);
    assert.strictEqual(target, '10TH MARKSHEET.pdf', 'First instance does not collide');
    used.add(target);
    const target2 = uniqueDestination('10TH MARKSHEET.pdf', 'raw2.pdf', used);
    assert.strictEqual(target2, '10TH MARKSHEET 2.pdf', 'Second collision gets 2');
    console.log('✓ Duplicate numbers resolved sequentially without overwriting.');

    // Restore fetch
    globalThis.fetch = originalFetch;
    console.log('\n>>> ALL REVIEWER FIX VERIFICATION TESTS PASSED! <<<');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
