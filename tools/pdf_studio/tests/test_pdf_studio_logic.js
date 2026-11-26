import assert from 'assert';
import {
  formatSizeSuffixFilename,
  getSubfolderName,
  parsePageRanges,
  getConvertedFilename
} from '../pdf_studio_logic.js';

console.log('=== RUNNING PDF STUDIO LOGIC UNIT TESTS ===');

// 1. Test formatSizeSuffixFilename
assert.strictEqual(
  formatSizeSuffixFilename('Pramod.pdf', 191488),
  'Pramod 187 KB.pdf',
  'formatSizeSuffixFilename should append KB'
);
assert.strictEqual(
  formatSizeSuffixFilename('Pramod 200 KB.pdf', 153600),
  'Pramod 150 KB.pdf',
  'formatSizeSuffixFilename should replace existing KB cleanly'
);
assert.strictEqual(
  formatSizeSuffixFilename('Marksheet_Scan.pdf', 52428800),
  'Marksheet_Scan 50 MB.pdf',
  'formatSizeSuffixFilename should format large files as MB'
);
console.log('✓ formatSizeSuffixFilename verified.');

// 2. Test getSubfolderName
assert.strictEqual(getSubfolderName('compress_pdf'), 'Compressed_PDF');
assert.strictEqual(getSubfolderName('merge_pdf'), 'Merged_PDF');
assert.strictEqual(getSubfolderName('split_pdf'), 'Split_PDF');
assert.strictEqual(getSubfolderName('pdf_to_jpg'), 'Converted_JPG');
assert.strictEqual(getSubfolderName('jpg_to_pdf'), 'Converted_PDF');
assert.strictEqual(getSubfolderName('rotate_pdf'), 'Rotated_PDF');
assert.strictEqual(getSubfolderName('clean_pdf'), 'Enhanced_PDF');
console.log('✓ getSubfolderName verified.');

// 3. Test parsePageRanges
assert.deepStrictEqual(parsePageRanges('All', 5), [0, 1, 2, 3, 4]);
assert.deepStrictEqual(parsePageRanges('', 4), [0, 1, 2, 3]);
assert.deepStrictEqual(parsePageRanges('1-3, 5', 6), [0, 1, 2, 4]);
assert.deepStrictEqual(parsePageRanges('2, 4-6', 7), [1, 3, 4, 5]);
assert.deepStrictEqual(parsePageRanges('3-1', 5), [0, 1, 2]); // Inverted range handled
console.log('✓ parsePageRanges verified.');

// 4. Test getConvertedFilename
assert.strictEqual(getConvertedFilename('Student_Doc.pdf', 'jpg'), 'Student_Doc.jpg');
assert.strictEqual(getConvertedFilename('Marksheet.jpg', '.pdf'), 'Marksheet.pdf');
console.log('✓ getConvertedFilename verified.');

console.log('\n>>> ALL PDF STUDIO LOGIC TESTS PASSED 100%! <<<\n');
