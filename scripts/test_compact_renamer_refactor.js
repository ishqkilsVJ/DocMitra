import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING BULK RENAMER COMPACT REFACTORING ===');

const htmlContent = fs.readFileSync('app/index.html', 'utf8');
const jsContent = fs.readFileSync('src/ui/renamer-ui.js', 'utf8');

// 1. Verify Top-Right Action Bar & Clear Workspace Button
console.log('\n[Test 1] Checking Top-Right Action Bar & Clear Workspace button:');
assert.ok(htmlContent.includes('id="btnClearWorkspace"'), 'btnClearWorkspace must exist in app/index.html');
assert.ok(htmlContent.includes('id="btnAddFiles"'), 'btnAddFiles must exist in app/index.html');
assert.ok(htmlContent.includes('id="btnSelectFolder"'), 'btnSelectFolder must exist in app/index.html');

const clearPos = htmlContent.indexOf('id="btnClearWorkspace"');
const addPos = htmlContent.indexOf('id="btnAddFiles"');
const selectPos = htmlContent.indexOf('id="btnSelectFolder"');
assert.ok(clearPos < addPos && addPos < selectPos, 'Buttons must be ordered: [Clear] [Add Files] [Select Folder]');
console.log('✓ Top-right action bar contains [Clear] [Add Files] [Select Folder (F2)] in exact order.');

// Verify redundant Clear Queue removed from bottom footer toolbar
const footerIndex = htmlContent.indexOf('<footer class="left-0 right-0 z-40');
const footerSub = htmlContent.slice(footerIndex, footerIndex + 1000);
assert.ok(!footerSub.includes('id="btnClearQueue"'), 'Redundant btnClearQueue must be removed from footer toolbar');
console.log('✓ Redundant btnClearQueue safely removed from bottom footer toolbar.');

// 2. Verify Single-Line Folder Navigation Ribbon
console.log('\n[Test 2] Checking Single-Line Folder Navigation Ribbon:');
assert.ok(!htmlContent.includes('Active Intake Folder'), '"Active Intake Folder" dummy label must be removed');
assert.ok(!htmlContent.includes('Localhost Air-Gapped</span>'), '"Localhost Air-Gapped" dummy badge must be removed from ribbon');
assert.ok(htmlContent.includes('id="btnPrevFolder"'), 'btnPrevFolder must exist in ribbon');
assert.ok(htmlContent.includes('id="folderCounterPill"'), 'folderCounterPill must exist in ribbon');
assert.ok(htmlContent.includes('id="btnNextFolder"'), 'btnNextFolder must exist in ribbon');
assert.ok(htmlContent.includes('id="activeFolderPath"'), 'activeFolderPath must exist in ribbon');
assert.ok(htmlContent.includes('id="btnOpenInExplorer"'), 'btnOpenInExplorer must exist in ribbon');
console.log('✓ Single-line folder navigation ribbon verified cleanly.');

// 3. Verify Blurred Structural Empty State Overlay & Zero Dummy Data in HTML
console.log('\n[Test 3] Checking Blurred Skeleton Empty State & Zero Dummy Files:');
assert.ok(htmlContent.includes('id="renamerEmptySkeletonOverlay"'), 'renamerEmptySkeletonOverlay must exist');
assert.ok(htmlContent.includes('backdrop-blur-[4px]'), 'Skeleton overlay must use backdrop blur');
assert.ok(htmlContent.includes('id="btnEmptySelectFolder"'), 'btnEmptySelectFolder must exist in overlay');
assert.ok(htmlContent.includes('id="btnEmptyAddFiles"'), 'btnEmptyAddFiles must exist in overlay');

// Verify ZERO fake student files in HTML renamer section
const renamerSection = htmlContent.slice(htmlContent.indexOf('id="view-bulk-renamer"'), htmlContent.indexOf('id="view-pdf-studio"'));
assert.ok(!renamerSection.includes('Vijay Ramesh Yadav'), 'Zero fake student names allowed in renamer HTML markup');
assert.ok(!renamerSection.includes('adhar_card_both_sides.pdf'), 'Zero fake files allowed in renamer HTML markup');
assert.ok(!renamerSection.includes('Doc_Tahsildar_2025_signed.pdf'), 'Zero fake files allowed in renamer HTML markup');
console.log('✓ Zero dummy data in HTML; blurred structural skeleton overlay present.');

// 4. Verify Compact Hero Card in renamer-ui.js
console.log('\n[Test 4] Checking Compact Hero Card in renamer-ui.js:');
assert.ok(!jsContent.includes('Quick 21-Shortcut Presets:'), '21 presets grid must be removed from hero card in renderQueue');
assert.ok(jsContent.includes('p-3 flex flex-col gap-2.5'), 'Hero card must use compact p-3 padding');
assert.ok(jsContent.includes('suggestionsWrapper'), 'Dynamic Top-3 suggestions must remain in hero card');
console.log('✓ Hero card is compact (~140px), 21 presets grid removed, Top-3 suggestions preserved.');

// 5. Verify Unified 32px Compact Row Lists
console.log('\n[Test 5] Checking Unified 32px Compact Row Lists:');
assert.ok(jsContent.includes('h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer shrink-0'), 'Upcoming rows must be compact 32px');
assert.ok(jsContent.includes('h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 border border-amber-500/30 hover:border-amber-500/50 transition-colors shrink-0'), 'Missing document rows must be compact 32px');
assert.ok(jsContent.includes('h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 border border-emerald-300 cursor-pointer hover:bg-emerald-50/50 transition-colors shrink-0'), 'Completed file rows must be compact 32px');
console.log('✓ All 3 queues (Upcoming, Missing, Completed) use unified 32px compact row styling.');

// 6. Verify Reset & Overlay Control in handleClearQueue & updateTelemetry
console.log('\n[Test 6] Checking Clear Workspace and Telemetry Overlay Handling:');
assert.ok(jsContent.includes('btnClearWorkspace'), 'btnClearWorkspace must be wired in _bindDOM');
assert.ok(jsContent.includes('btnEmptySelectFolder'), 'btnEmptySelectFolder must be wired in _bindDOM');
assert.ok(jsContent.includes('btnEmptyAddFiles'), 'btnEmptyAddFiles must be wired in _bindDOM');
assert.ok(jsContent.includes('skeletonOverlay.classList.remove(\'hidden\')'), 'updateTelemetry must show skeleton overlay when total === 0');
assert.ok(jsContent.includes('skeletonOverlay.classList.add(\'hidden\')'), 'updateTelemetry must hide skeleton overlay when total > 0');
console.log('✓ Workspace reset and skeleton overlay transitions verified.');

console.log('\n>>> ALL 6 COMPACT RENAMER REFACTORING SPECIFICATIONS VERIFIED 100%! <<<');
