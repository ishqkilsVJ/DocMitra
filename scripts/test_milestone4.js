import assert from 'assert';
import {
  IMAGE_PRESETS,
  formatBytes,
  calculateSavings
} from '../src/modules/image-studio.js';
import { getSubfolderName } from '../src/modules/pdf-studio.js';

console.log('=== RUNNING MILESTONE 4 SMOKE TESTS (IMAGE STUDIO) ===');

// 1. Verify MahaDBT & Admission Presets
console.log('[Test 1] Verify admission presets thresholds...');
assert.strictEqual(IMAGE_PRESETS.passport_photo.maxKb, 50, 'Passport photo must be under 50 KB');
assert.strictEqual(IMAGE_PRESETS.student_sign.maxKb, 20, 'Student signature must be under 20 KB');
assert.strictEqual(IMAGE_PRESETS.mahadbt_cert.maxKb, 256, 'MahaDBT Certificate must be <= 256 KB');
console.log('✓ Strict admission photo and signature thresholds verified.');

// 2. formatBytes helper
console.log('[Test 2] formatBytes utility...');
assert.strictEqual(formatBytes(1024), '1 KB');
assert.strictEqual(formatBytes(1024 * 1024), '1 MB');
assert.strictEqual(formatBytes(0), '0 B');
console.log('✓ formatBytes output verified.');

// 3. calculateSavings helper
console.log('[Test 3] calculateSavings percentage...');
const savings = calculateSavings(1000, 250);
assert.strictEqual(savings, 75, 'Savings from 1000 to 250 should be 75%');
console.log('✓ calculateSavings percentage verified.');

// 4. Subfolder names for image operations
console.log('[Test 4] Image subfolder destinations...');
assert.strictEqual(getSubfolderName('compress_jpg'), 'Compressed_JPG');
assert.strictEqual(getSubfolderName('rotate_image'), 'Rotated_JPG');
assert.strictEqual(getSubfolderName('format_convert'), 'Converted_Images');
console.log('✓ Image destination folders verified.');

console.log('\n>>> ALL MILESTONE 4 SMOKE TESTS PASSED! <<<');
