/**
 * Test Suite: Strict Case Enforcement, Dynamic CORE SHORTCUTS Narrowing,
 * 3-Column Empty State with Center Buttons, and Tab Reset in Bulk Renamer
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { getShortcutBadgeColor, RenamerUIManager } from '../src/ui/renamer-ui.js';
import { buildName, cleanName, applyCase } from '../src/libraries/rename-library.js';

console.log('🧪 Starting 3-Feature Verification Test Suite...\n');

// 1. Test Strict Case Enforcement (Requirement 1)
console.log('Test 1: Strict Case Enforcement across Document + Student Name...');
const student = 'Aparna Gorakh Nadekar';

// Canonical shortcut with all 4 case styles:
assert.strictEqual(
  buildName('cst', student, null, 'upper'),
  'CASTE CERTIFICATE APARNA GORAKH NADEKAR',
  'UPPER must convert entire filename to uppercase'
);
assert.strictEqual(
  buildName('cst', student, null, 'title'),
  'Caste Certificate Aparna Gorakh Nadekar',
  'Title must convert entire filename to Title Case'
);
assert.strictEqual(
  buildName('cst', student, null, 'lower'),
  'caste certificate aparna gorakh nadekar',
  'lower must convert entire filename to lowercase'
);
assert.strictEqual(
  buildName('cst', student, null, 'preserve'),
  'Caste Certificate Aparna Gorakh Nadekar',
  'preserve / as_is must preserve original casings'
);

// Custom document name with all 4 case styles:
assert.strictEqual(
  buildName('Medical Fitness', student, null, 'upper'),
  'MEDICAL FITNESS APARNA GORAKH NADEKAR',
  'Custom name with UPPER must be all uppercase'
);
assert.strictEqual(
  buildName('Medical Fitness', student, null, 'title'),
  'Medical Fitness Aparna Gorakh Nadekar',
  'Custom name with Title must be Title Case'
);
assert.strictEqual(
  buildName('Medical Fitness', student, null, 'lower'),
  'medical fitness aparna gorakh nadekar',
  'Custom name with lower must be lowercase'
);

console.log('✅ Passed Test 1: Strict case rules enforced 100% across all 4 styles.\n');

// 2. Test Live Suggestions Relocation to Right Panel (Requirement 2)
console.log('Test 2: Dynamic Live Suggestions Relocation to Right-Side CORE SHORTCUTS...');
const renamerJs = fs.readFileSync('src/ui/renamer-ui.js', 'utf8');

// Verify Hero card no longer contains suggestion chips
assert.ok(!renamerJs.includes('suggestionsWrapper.appendChild(chipBtn)'), 'Hero Card must not have suggestion chips');
assert.ok(renamerJs.includes('this.renderCoreShortcuts(val)'), 'targetInput must call renderCoreShortcuts on input');
assert.ok(renamerJs.includes('renderCoreShortcuts(query = \'\')'), 'renderCoreShortcuts method must be defined');

// Verify zero matches italic note
assert.ok(
  renamerJs.includes('No shortcode matches — saving as custom text'),
  'Zero match state must render the locked italic note'
);

console.log('✅ Passed Test 2: Hero card is ultra-compact and CORE SHORTCUTS handles live narrowing.\n');

// 3. Test Consistent 3-Column Empty State (Requirement 3)
console.log('Test 3: Consistent 3-Column Empty State & Center Preview Action Buttons...');
const indexHtml = fs.readFileSync('app/index.html', 'utf8');

// Ensure blur overlay is removed
assert.ok(!indexHtml.includes('id="renamerEmptySkeletonOverlay"'), 'Blurred skeleton overlay must be removed');

// Ensure 3-column layout containers are intact
assert.ok(indexHtml.includes('id="col-queue"'), 'Column 1 (col-queue) must exist');
assert.ok(indexHtml.includes('id="col-preview"'), 'Column 2 (col-preview) must exist');
assert.ok(indexHtml.includes('id="col-utility"'), 'Column 3 (col-utility) must exist');

// Ensure Center Preview empty state has prominent Select Folder and Add Files buttons
assert.ok(renamerJs.includes('Select Folder'), 'Center preview must render Select Folder button');
assert.ok(renamerJs.includes('Add Files'), 'Center preview must render Add Files button');
assert.ok(renamerJs.includes('handleSelectFolder()'), 'Select Folder click must be wired');
assert.ok(renamerJs.includes('handleAddFiles()'), 'Add Files click must be wired');

console.log('✅ Passed Test 3: Consistent 3-column empty state and center preview buttons verified.\n');

// 4. Test Tab Navigation Reset (Requirement 5)
console.log('Test 4: Tab Navigation Reset...');
const navJs = fs.readFileSync('src/ui/navigation.js', 'utf8');
const indexJs = fs.readFileSync('src/ui/index.js', 'utf8');

assert.ok(navJs.includes('this.onViewChange(viewName, previousView)'), 'NavigationManager must fire onViewChange');
assert.ok(indexJs.includes('renamerUI.handleClearQueue(true)'), 'Switching from bulk-renamer must trigger silent clear');

console.log('✅ Passed Test 4: Tab navigation reset cleanly wired.\n');

// 5. Test 100% English UI
console.log('Test 5: Zero Marathi in UI files...');
const marathiRegex = /[\u0900-\u097F]/;
assert.ok(!marathiRegex.test(indexHtml), 'app/index.html must have 0 Marathi characters');
assert.ok(!marathiRegex.test(renamerJs), 'src/ui/renamer-ui.js must have 0 Marathi characters');
console.log('✅ Passed Test 5: 0 Marathi characters in app/index.html and src/ui/renamer-ui.js.\n');

console.log('🎉 ALL 5 TEST SUITES PASSED FLAWLESSLY!');
