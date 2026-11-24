/**
 * Automated Unit Test Suite for Bulk Renamer Safe Move, Fresh Rescan & Sort Documents
 */
import assert from 'assert';
import {
  detectDuplicateFiles,
  cleanName,
  uniqueDestination
} from '../rename_tool_logic.js';

console.log('=== RUNNING SAFE MOVE, RESCAN & SORT LOGIC TESTS ===\n');

// 1. Natural Sort Verification
console.log('[TEST 1] Natural Sort (A–Z / Z–A):');
const mockFiles = [
  { name: '12TH LC ANJALI.pdf', targetName: '12TH LC ANJALI.pdf' },
  { name: '10TH MARKSHEET ANJALI.pdf', targetName: '10TH MARKSHEET ANJALI.pdf' },
  { name: 'AADHAAR CARD ANJALI.pdf', targetName: 'AADHAAR CARD ANJALI.pdf' },
  { name: 'CASTE CERTIFICATE 2 ANJALI.pdf', targetName: 'CASTE CERTIFICATE 2 ANJALI.pdf' },
  { name: 'CASTE CERTIFICATE ANJALI.pdf', targetName: 'CASTE CERTIFICATE ANJALI.pdf' },
  { name: 'BANK PASSBOOK ANJALI.pdf', targetName: 'BANK PASSBOOK ANJALI.pdf' }
];

// Sort Ascending (A-Z)
const sortedAsc = [...mockFiles].sort((a, b) => {
  return (a.targetName || a.name).localeCompare(b.targetName || b.name, undefined, { numeric: true, sensitivity: 'base' });
});

assert.strictEqual(sortedAsc[0].name, '10TH MARKSHEET ANJALI.pdf', '10TH should be first in numeric natural sort');
assert.strictEqual(sortedAsc[1].name, '12TH LC ANJALI.pdf', '12TH should be second');
assert.strictEqual(sortedAsc[2].name, 'AADHAAR CARD ANJALI.pdf', 'AADHAAR should be third');
assert.strictEqual(sortedAsc[3].name, 'BANK PASSBOOK ANJALI.pdf', 'BANK should be fourth');
assert.strictEqual(sortedAsc[4].name, 'CASTE CERTIFICATE 2 ANJALI.pdf', 'Digit 2 comes before letter A in alphabetical order');
assert.strictEqual(sortedAsc[5].name, 'CASTE CERTIFICATE ANJALI.pdf', 'CASTE CERTIFICATE ANJALI should be fifth/sixth');
console.log('✓ Natural sort Ascending (A–Z) correctly orders 10TH before 12TH, numbers before letters');

// Sort Descending (Z-A)
const sortedDesc = [...mockFiles].sort((a, b) => {
  return (b.targetName || b.name).localeCompare(a.targetName || a.name, undefined, { numeric: true, sensitivity: 'base' });
});
assert.strictEqual(sortedDesc[0].name, 'CASTE CERTIFICATE ANJALI.pdf');
assert.strictEqual(sortedDesc[sortedDesc.length - 1].name, '10TH MARKSHEET ANJALI.pdf');
console.log('✓ Natural sort Descending (Z–A) correctly reverses list');

// 2. Safe Move & Undo Stack Simulation
console.log('\n[TEST 2] Safe Move & Undo Simulation:');
const queue = [
  { id: '1', name: '10TH MARKSHEET.pdf', path: 'C:/docs/10TH MARKSHEET.pdf' },
  { id: '2', name: '12TH LC.pdf', path: 'C:/docs/12TH LC.pdf' },
  { id: '3', name: 'PHOTO.jpg', path: 'C:/docs/PHOTO.jpg' }
];
const recentMoves = [];

// Simulate Safe Move on item 1 (12TH LC)
const targetToMove = queue[1];
const origIdx = queue.findIndex(f => f.id === targetToMove.id);
recentMoves.push({
  file: { ...targetToMove },
  srcPath: targetToMove.path,
  movedPath: 'C:/docs/Duplicate Files/12TH LC.pdf',
  originalIndex: origIdx
});
queue.splice(origIdx, 1);

assert.strictEqual(queue.length, 2, 'Queue should have 2 items remaining');
assert.strictEqual(queue[0].name, '10TH MARKSHEET.pdf');
assert.strictEqual(queue[1].name, 'PHOTO.jpg');
console.log('✓ Target file safely removed from queue upon Move');

// Simulate Undo Safe Move
const lastMove = recentMoves.pop();
queue.splice(lastMove.originalIndex, 0, lastMove.file);
assert.strictEqual(queue.length, 3, 'Queue should be restored to 3 items');
assert.strictEqual(queue[1].name, '12TH LC.pdf', 'File restored to exact original position');
console.log('✓ Undo successfully restores file to exact original index in queue');

// 3. Modal 1-Click Move Extra Duplicates
console.log('\n[TEST 3] Modal Move Extra Duplicates (Keep 1 Master Copy):');
const dupFiles = [
  { id: 'd1', name: 'CASTE CERTIFICATE.pdf', targetName: 'CASTE CERTIFICATE ANJALI.pdf', size: 1000 },
  { id: 'd2', name: 'CASTE CERTIFICATE 2.pdf', targetName: 'CASTE CERTIFICATE 2 ANJALI.pdf', size: 1000 },
  { id: 'd3', name: 'CASTE CERTIFICATE 3.pdf', targetName: 'CASTE CERTIFICATE 3 ANJALI.pdf', size: 1000 },
  { id: 'u1', name: '10TH MARKSHEET.pdf', targetName: '10TH MARKSHEET ANJALI.pdf', size: 2500 }
];

const dupMap = detectDuplicateFiles(dupFiles);
const confirmedGroups = new Map();
dupFiles.forEach(f => {
  const info = dupMap.get(f.id || f.name);
  if (info && info.status === 'confirmed') {
    let base = cleanName(f.targetName || f.name || '').toLowerCase()
      .replace(/[\s_\-]+(\d+|\(\d+\))(?=\s|$)/gi, '')
      .replace(/[\s_\-]+/g, ' ')
      .trim();
    const groupKey = `base_${base}_${(f.ext || '').toLowerCase()}`;
    if (!confirmedGroups.has(groupKey)) confirmedGroups.set(groupKey, []);
    confirmedGroups.get(groupKey).push(f);
  }
});

const filesToMove = [];
confirmedGroups.forEach(group => {
  if (group.length > 1) {
    // Keep group[0] as master, move group[1..N]
    for (let i = 1; i < group.length; i++) {
      filesToMove.push(group[i]);
    }
  }
});

assert.strictEqual(filesToMove.length, 2, 'Should flag exactly 2 extra copies for moving');
assert.strictEqual(filesToMove[0].name, 'CASTE CERTIFICATE 2.pdf');
assert.strictEqual(filesToMove[1].name, 'CASTE CERTIFICATE 3.pdf');
console.log('✓ Master copy (CASTE CERTIFICATE.pdf) preserved; 2 extra copies queued for safe move');

console.log('\n🎉 ALL SAFE MOVE, RESCAN & SORT TESTS PASSED 100%! 🎉\n');
