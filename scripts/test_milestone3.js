import assert from 'assert';
import {
  createPdfFromJpegs,
  extractJpegsFromPdf,
  getDocumentImagesFromPdf,
  formatSizeSuffixFilename,
  getSubfolderName,
  rotatePdfDocument
} from '../src/modules/pdf-studio.js';

console.log('=== RUNNING MILESTONE 3 SMOKE TESTS (PDF STUDIO) ===');

// 1. Create a minimal valid 1x1 JPEG in binary to test pure JS PDF compilation
// Minimal 1x1 white JPEG:
const minimalJpegBytes = new Uint8Array([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
  0x00, 0xBF, 0x80, 0xFF, 0xD9
]);

console.log('[Test 1] createPdfFromJpegs ISO-32000 Compilation...');
const pdfBlob = createPdfFromJpegs([{ bytes: minimalJpegBytes, width: 1, height: 1 }], 'portrait');
assert.ok(pdfBlob.size > 100, 'Compiled PDF blob must have bytes');
assert.strictEqual(pdfBlob.type, 'application/pdf');

pdfBlob.arrayBuffer().then(buf => {
  const bytes = new Uint8Array(buf);
  const text = new TextDecoder().decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4'), 'PDF must start with %PDF-1.4 header');
  assert.ok(text.includes('/Type /Catalog'), 'PDF must have catalog');
  assert.ok(text.includes('/Type /Pages'), 'PDF must have pages');
  assert.ok(text.includes('/Type /XObject'), 'PDF must have image XObject');
  console.log('✓ Pure JS ISO-32000 PDF compilation verified.');

  // 2. Extract JPEG from PDF
  console.log('[Test 2] extractJpegsFromPdf...');
  const extracted = extractJpegsFromPdf(bytes);
  assert.strictEqual(extracted.length, 1, 'Should extract exactly 1 image');
  assert.strictEqual(extracted[0].bytes[0], 0xFF);
  assert.strictEqual(extracted[0].bytes[1], 0xD8);
  console.log('✓ JPEG extraction from PDF verified.');

  // 3. Size suffix filename formatting
  console.log('[Test 3] formatSizeSuffixFilename...');
  const fn1 = formatSizeSuffixFilename('10TH MARKSHEET.pdf', 191488);
  assert.strictEqual(fn1, '10TH MARKSHEET 187 KB.pdf');

  const fn2 = formatSizeSuffixFilename('10TH MARKSHEET 200 KB.pdf', 153600);
  assert.strictEqual(fn2, '10TH MARKSHEET 150 KB.pdf', 'Repeated size suffixes must not stack');

  const fn3 = formatSizeSuffixFilename('Dossier.pdf', 15 * 1024 * 1024, 'auto');
  assert.strictEqual(fn3, 'Dossier 15 MB.pdf', 'Auto format MB for large files');
  console.log('✓ Size suffix formatting verified.');

  // 4. Subfolder destination names
  console.log('[Test 4] getSubfolderName...');
  assert.strictEqual(getSubfolderName('compress_pdf'), 'Compressed_PDF');
  assert.strictEqual(getSubfolderName('merge_pdf'), 'Merged_PDF');
  assert.strictEqual(getSubfolderName('split_pdf'), 'Split_PDF');
  assert.strictEqual(getSubfolderName('pdf_to_jpg'), 'Converted_JPG');
  assert.strictEqual(getSubfolderName('rotate_pdf'), 'Rotated_PDF');
  console.log('✓ Subfolder directory mappings verified.');

  console.log('\n>>> ALL MILESTONE 3 SMOKE TESTS PASSED! <<<');
});
