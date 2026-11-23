import assert from 'node:assert';
import { BUILTIN_PRESETS, DEFAULT_SHORTCUTS } from '../rename_tool_ui.js';

console.log('=== 🧪 TEST: SETTINGS MODAL SEARCH FILTER & KEYWORD WRAPPING ===');

// 1. Verify preset filtering logic
const educationalDocs = BUILTIN_PRESETS["EDUCATIONAL DOCUMENTS"];
assert(educationalDocs && educationalDocs.length === 53, 'Educational docs preset must have 53 docs');

function filterDocs(docs, query) {
  const q = (query || '').trim().toLowerCase();
  return q ? docs.filter(doc => {
    const name = (doc.name || '').toLowerCase();
    const code = (doc.code || '').toLowerCase();
    const kw = (Array.isArray(doc.keywords) ? doc.keywords.join(' ') : (doc.keywords || '')).toLowerCase();
    return name.includes(q) || code.includes(q) || kw.includes(q);
  }) : docs;
}

function filterShortcuts(shortcuts, query) {
  const sq = (query || '').trim().toLowerCase();
  return sq ? shortcuts.filter(s => {
    const code = (s.code || '').toLowerCase();
    const canonical = (s.canonical || s.label || '').toLowerCase();
    const kw = (Array.isArray(s.keywords) ? s.keywords.join(' ') : (s.keywords || '')).toLowerCase();
    return code.includes(sq) || canonical.includes(sq) || kw.includes(sq);
  }) : shortcuts;
}

// Test 1: Search by shortCode
const resultsByCode = filterDocs(educationalDocs, '10mp');
assert.strictEqual(resultsByCode.length, 1);
assert.strictEqual(resultsByCode[0].code, '10MP');
console.log('  ✓ Filter preset docs by short code "10mp": Found 1 (10MP)');

// Test 2: Search by document name
const resultsByName = filterDocs(educationalDocs, 'marksheet');
assert(resultsByName.length >= 8, `Expected >= 8 marksheet docs, got ${resultsByName.length}`);
console.log(`  ✓ Filter preset docs by name "marksheet": Found ${resultsByName.length}`);

// Test 3: Search by keyword alias
const resultsByKw = filterDocs(educationalDocs, 'utpanna');
assert.strictEqual(resultsByKw.length, 1);
assert.strictEqual(resultsByKw[0].name, 'INCOME CERTIFICATE');
console.log('  ✓ Filter preset docs by keyword "utpanna": Found INCOME CERTIFICATE');

// Test 4: Shortcut filter by short code
const scByCode = filterShortcuts(DEFAULT_SHORTCUTS, 'cst');
assert.strictEqual(scByCode.length, 1);
assert.strictEqual(scByCode[0].code, 'CST');
console.log('  ✓ Filter shortcuts by code "cst": Found CST');

// Test 5: Shortcut filter by keyword alias
const scByKw = filterShortcuts(DEFAULT_SHORTCUTS, 'janma dakhla');
assert.strictEqual(scByKw.length, 1);
assert.strictEqual(scByKw[0].canonical, 'BIRTH CERTIFICATE');
console.log('  ✓ Filter shortcuts by keyword "janma dakhla": Found BIRTH CERTIFICATE');

// Test 6: Empty search query returns all
assert.strictEqual(filterDocs(educationalDocs, '').length, 53);
assert.strictEqual(filterShortcuts(DEFAULT_SHORTCUTS, '').length, 53);
console.log('  ✓ Empty search query returns full catalog without dropping any items');

console.log('🎉 ALL SETTINGS SEARCH FILTER TESTS PASSED 100%!');
