/**
 * scripts/test_pdf_studio_isolated.js
 * Comprehensive automated verification test suite for DocMitra PDF Studio
 * Verifies modular isolation, pure logic, forwarder shims, scoped markup, scoped CSS, and backend operations.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

import {
  createPdfFromJpegs,
  extractJpegsFromPdf,
  getDocumentImagesFromPdf,
  formatSizeSuffixFilename,
  getSubfolderName,
  rotatePdfDocument,
  getConvertedFilename,
  PDF_PAGE_SIZES,
  getJpegDimensions
} from '../tools/pdf_studio/pdf_studio_logic.js';

import * as shimModule from '../src/modules/pdf-studio.js';
import * as shimUi from '../src/ui/pdf-studio-ui.js';

console.log('=== RUNNING DOCMITRA PDF STUDIO ISOLATED VERIFICATION SUITE ===\n');

// ---------------------------------------------------------------------------
// 1. Pure Logic & ISO-32000 Compilation
// ---------------------------------------------------------------------------
console.log('[Test 1] Pure Logic & ISO-32000 PDF Compilation...');
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

const blob = createPdfFromJpegs([{ bytes: minimalJpegBytes, width: 1, height: 1 }], 'portrait');
assert.ok(blob.size > 100, 'Blob size must be > 100 bytes');
assert.strictEqual(blob.type, 'application/pdf');

const buf = await blob.arrayBuffer();
const bytes = new Uint8Array(buf);
const text = new TextDecoder().decode(bytes);
assert.ok(text.startsWith('%PDF-1.4'), 'Header must be %PDF-1.4');
assert.ok(text.includes('/Type /Catalog'), 'Catalog object must exist');
assert.ok(text.includes('/Type /Pages'), 'Pages object must exist');
assert.ok(text.includes('/Type /XObject'), 'Image XObject must exist');
console.log('✓ ISO-32000 pure JS compilation passed.');

// ---------------------------------------------------------------------------
// 2. Watermark Filtering & Image Extraction
// ---------------------------------------------------------------------------
console.log('[Test 2] Watermark Filtering & Image Extraction...');
const extractedImgs = extractJpegsFromPdf(bytes);
assert.strictEqual(extractedImgs.length, 1, 'Should extract 1 image');
assert.strictEqual(extractedImgs[0].bytes[0], 0xFF);
assert.strictEqual(extractedImgs[0].bytes[1], 0xD8);

const docImgs = getDocumentImagesFromPdf(bytes);
assert.strictEqual(docImgs.length, 1, 'Document images count must be 1');
console.log('✓ Watermark filtering and extraction passed.');

// ---------------------------------------------------------------------------
// 3. Size Suffixing & Subfolder Routing
// ---------------------------------------------------------------------------
console.log('[Test 3] Size Suffixing & Subfolder Routing...');
assert.strictEqual(formatSizeSuffixFilename('Aadhaar.pdf', 184320), 'Aadhaar 180 KB.pdf');
assert.strictEqual(formatSizeSuffixFilename('Aadhaar 200 KB.pdf', 153600), 'Aadhaar 150 KB.pdf', 'No suffix stacking');
assert.strictEqual(formatSizeSuffixFilename('Dossier.pdf', 12 * 1024 * 1024, 'auto'), 'Dossier 12 MB.pdf');

assert.strictEqual(getSubfolderName('compress_pdf'), 'Compressed_PDF');
assert.strictEqual(getSubfolderName('merge_pdf'), 'Merged_PDF');
assert.strictEqual(getSubfolderName('split_pdf'), 'Split_PDF');
assert.strictEqual(getSubfolderName('pdf_to_jpg'), 'Converted_JPG');
assert.strictEqual(getSubfolderName('rotate_pdf'), 'Rotated_PDF');
console.log('✓ Suffixing and subfolder routing passed.');

// ---------------------------------------------------------------------------
// 4. Forwarder Shims Backward Compatibility
// ---------------------------------------------------------------------------
console.log('[Test 4] Forwarder Shims Backward Compatibility...');
assert.strictEqual(typeof shimModule.createPdfFromJpegs, 'function', 'src/modules/pdf-studio.js must export createPdfFromJpegs');
assert.strictEqual(typeof shimModule.formatSizeSuffixFilename, 'function', 'src/modules/pdf-studio.js must export formatSizeSuffixFilename');
assert.strictEqual(typeof shimUi.initPdfStudioUI, 'function', 'src/ui/pdf-studio-ui.js must export initPdfStudioUI');
assert.strictEqual(typeof shimUi.PdfStudioUIManager, 'function', 'src/ui/pdf-studio-ui.js must export PdfStudioUIManager');
console.log('✓ Forwarder shims passed.');

// ---------------------------------------------------------------------------
// 5. Scoped Markup & Clean Empty State (Rule 6)
// ---------------------------------------------------------------------------
console.log('[Test 5] Scoped Markup & Clean Empty State...');
const htmlPath = path.join(ROOT, 'tools/pdf_studio/pdf_studio.html');
const studioHtml = fs.readFileSync(htmlPath, 'utf-8');

assert.ok(studioHtml.includes('class="pdf-studio-scope'), 'pdf_studio.html must contain .pdf-studio-scope');
assert.ok(studioHtml.includes('id="view-pdf-studio"') || studioHtml.includes('id="pdfCardsGrid"'), 'Must contain docket grid');
assert.ok(studioHtml.includes('id="btnBrowsePdfDir"'), 'Must contain btnBrowsePdfDir');
assert.ok(studioHtml.includes('id="btnAddPdfFiles"'), 'Must contain btnAddPdfFiles');
assert.ok(studioHtml.includes('id="startCompressBtn"'), 'Must contain startCompressBtn');

// Zero dummy student data
assert.ok(!studioHtml.includes('Vijay Yadav'), 'DOM template must not contain dummy student Vijay Yadav');
assert.ok(!studioHtml.includes('Aarti Patil'), 'DOM template must not contain dummy student Aarti Patil');
assert.ok(!studioHtml.includes('Rahul Shinde'), 'DOM template must not contain dummy student Rahul Shinde');
assert.ok(!studioHtml.includes('https://lh3.googleusercontent.com'), 'DOM template must not contain mock external images');

// Zero Marathi characters in production HTML
const marathiRegex = /[\u0900-\u097F]/;
assert.ok(!marathiRegex.test(studioHtml), 'pdf_studio.html must have 0 Marathi characters');
console.log('✓ Scoped markup and clean empty state passed.');

// ---------------------------------------------------------------------------
// 6. Scoped CSS Verification
// ---------------------------------------------------------------------------
console.log('[Test 6] Scoped CSS Verification...');
const cssPath = path.join(ROOT, 'tools/pdf_studio/pdf_studio.css');
const studioCss = fs.readFileSync(cssPath, 'utf-8');

// Verify every rule selector is scoped under .pdf-studio-scope
const lines = studioCss.split('\n');
const selectors = lines
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('/*') && !l.startsWith('*') && !l.startsWith('//') && l.endsWith('{') && !l.startsWith('@keyframes') && !l.includes('%'));

selectors.forEach(sel => {
  assert.ok(
    sel.startsWith('.pdf-studio-scope'),
    `CSS selector "${sel}" must start with .pdf-studio-scope`
  );
});
console.log('✓ Scoped CSS namespace validation passed.');

// ---------------------------------------------------------------------------
// 7. Lock Documentation & Governance
// ---------------------------------------------------------------------------
console.log('[Test 7] Lock Documentation & Governance...');
const lockPath = path.join(ROOT, 'tools/pdf_studio/README_LOCK.md');
assert.ok(fs.existsSync(lockPath), 'README_LOCK.md must exist in tools/pdf_studio/');
const lockContent = fs.readFileSync(lockPath, 'utf-8');
assert.ok(lockContent.includes('STRICTLY LOCKED'), 'README_LOCK.md must state tool is STRICTLY LOCKED');
assert.ok(lockContent.includes('UNLOCK PDF STUDIO'), 'README_LOCK.md must document UNLOCK PDF STUDIO protocol');
console.log('✓ Lock documentation passed.');

console.log('\n🎉 ALL PDF STUDIO ISOLATED VERIFICATION TESTS PASSED 100%! 🎉\n');
