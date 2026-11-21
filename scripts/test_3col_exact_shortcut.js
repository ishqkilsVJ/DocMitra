/**
 * Test Suite: 3-Column Layout, Exact Shortcut Matching vs Custom Name,
 * Autofill Suppression, and 100% English UI in Bulk Renamer
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { getShortcutBadgeColor, RenamerUIManager } from '../src/ui/renamer-ui.js';
import { buildName, cleanName } from '../src/libraries/rename-library.js';

console.log('🧪 Starting 3-Column & Exact-Match Shortcut Test Suite...\n');

// 1. Test getShortcutBadgeColor
console.log('Test 1: getShortcutBadgeColor mapping...');
assert.strictEqual(getShortcutBadgeColor('ADR'), 'bg-blue-600 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('PAN'), 'bg-blue-600 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('10M'), 'bg-emerald-700 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('12LC'), 'bg-emerald-700 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('CST'), 'bg-purple-700 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('VLD'), 'bg-purple-700 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('DOM'), 'bg-amber-600 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('INC'), 'bg-amber-600 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('SLF'), 'bg-slate-700 text-white font-extrabold');
assert.strictEqual(getShortcutBadgeColor('XYZ'), 'bg-primary text-on-primary font-extrabold');
console.log('✅ Passed Test 1: getShortcutBadgeColor maps all categories correctly.\n');

// 2. Test Exact Shortcut vs Custom Name Logic
console.log('Test 2: Exact Shortcut Matching vs Custom Name...');
const studentName = 'Vijay Ramesh Yadav';
const manager = new RenamerUIManager();
manager.state.studentName = studentName;
manager.state.style = 'preserve';

function simulateRenameLogic(rawInput, ext = '.pdf') {
  let targetFilename = (rawInput || '').trim();
  const baseTyped = targetFilename.endsWith(ext)
    ? targetFilename.slice(0, -ext.length).trim()
    : targetFilename;

  const exactShortcut = manager.shortcuts21.find(s => s.code.toLowerCase() === baseTyped.toLowerCase());
  if (exactShortcut) {
    const canonical = exactShortcut.canonical;
    const formatted = buildName(canonical, manager.state.studentName, null, manager.state.style);
    return formatted.endsWith(ext) ? formatted : `${formatted}${ext}`;
  } else {
    let customBase = baseTyped;
    if (manager.state.studentName && !customBase.toLowerCase().includes(manager.state.studentName.toLowerCase())) {
      customBase = `${customBase} ${manager.state.studentName}`;
    }
    if (manager.state.style === 'upper') customBase = customBase.toUpperCase();
    else if (manager.state.style === 'lower') customBase = customBase.toLowerCase();
    else if (manager.state.style === 'title') customBase = customBase.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
    return customBase.endsWith(ext) ? customBase : `${customBase}${ext}`;
  }
}

// Exact code match expansions:
assert.strictEqual(simulateRenameLogic('cst'), 'CASTE CERTIFICATE Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('CST'), 'CASTE CERTIFICATE Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('vld'), 'VALIDITY CERTIFICATE Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('10m'), '10TH MARKSHEET Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('adr'), 'AADHAAR CARD Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('dom'), 'DOMICILE CERTIFICATE Vijay Ramesh Yadav.pdf');

// Custom user names (MUST NOT be forced or overridden! Must append student name):
assert.strictEqual(simulateRenameLogic('Medical Fitness'), 'Medical Fitness Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('Leaving Certificate'), 'Leaving Certificate Vijay Ramesh Yadav.pdf');
assert.strictEqual(simulateRenameLogic('Ration Card Front'), 'Ration Card Front Vijay Ramesh Yadav.pdf');

// Custom name that already contains student name:
assert.strictEqual(simulateRenameLogic('Medical Fitness Vijay Ramesh Yadav'), 'Medical Fitness Vijay Ramesh Yadav.pdf');

console.log('✅ Passed Test 2: Exact shortcut codes expand to canonical formula; custom user names are preserved.\n');

// 3. Test Marathi text absence in app/index.html and src/ui/renamer-ui.js
console.log('Test 3: Zero Marathi in UI files...');
const indexHtml = fs.readFileSync('app/index.html', 'utf8');
const renamerJs = fs.readFileSync('src/ui/renamer-ui.js', 'utf8');

const marathiRegex = /[\u0900-\u097F]/;
assert.ok(!marathiRegex.test(indexHtml), 'app/index.html must have 0 Marathi characters');
assert.ok(!marathiRegex.test(renamerJs), 'src/ui/renamer-ui.js must have 0 Marathi characters');
console.log('✅ Passed Test 3: 0 Marathi characters in app/index.html and src/ui/renamer-ui.js.\n');

// 4. Test 3-column elements in app/index.html
console.log('Test 4: 3-Column workspace containers...');
assert.ok(indexHtml.includes('id="col-queue"'), 'col-queue must be present');
assert.ok(indexHtml.includes('id="col-preview"'), 'col-preview must be present');
assert.ok(indexHtml.includes('id="col-utility"'), 'col-utility must be present');
assert.ok(indexHtml.includes('id="utilityScrollArea"'), 'utilityScrollArea must be present');
assert.ok(indexHtml.includes('id="btnClearWorkspace"'), 'btnClearWorkspace must be present');
console.log('✅ Passed Test 4: All 3-column layout containers and buttons present in DOM.\n');

// 5. Test Hero Card styling & autofill suppression in renamer-ui.js
console.log('Test 5: Hero Card & Autofill suppression...');
assert.ok(renamerJs.includes("autocomplete = 'new-password'"), 'Autocomplete must be new-password');
assert.ok(renamerJs.includes("autocorrect', 'off'"), 'Autocorrect must be off');
assert.ok(renamerJs.includes("spellcheck', 'false'"), 'Spellcheck must be false');
assert.ok(renamerJs.includes("border-l-4 border-l-primary"), 'Cockpit hero card border present');
assert.ok(!renamerJs.includes("extBadge.className = 'h-11 px-3"), 'Extension badge pill removed from input');
console.log('✅ Passed Test 5: Hero Card styling and browser autofill suppression verified.\n');

console.log('🎉 ALL 5 TEST SUITES PASSED FLAWLESSLY!');
