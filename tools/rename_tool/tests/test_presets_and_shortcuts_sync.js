import assert from 'assert';
import {
  CANONICAL_NAMES,
  DEFAULT_CHECKLISTS_DATA,
  DEFAULT_SHORTCUT_DICTIONARY,
  matchDocument,
  buildName,
  uniqueDestination
} from '../rename_tool_logic.js';
import {
  BUILTIN_PRESETS,
  DEFAULT_SHORTCUTS,
  MASTER_DOCUMENTS_MAP,
  getShortcutBadgeColor,
  RenamerUIManager
} from '../rename_tool_ui.js';

console.log('=== 🚀 TEST: 4 BUILT-IN PRESETS & MASTER SHORTCUTS ZERO DUPLICATE SYNC ===');

// 1. Verify 4 Built-In Presets Exist
console.log('\n[1] Verifying 4 Built-In Presets exist...');
assert(BUILTIN_PRESETS['MAHA DBT'], 'MAHA DBT preset must exist');
assert(BUILTIN_PRESETS['SWAYAM DEENDAYAL YOJANA'], 'SWAYAM DEENDAYAL YOJANA preset must exist');
assert(BUILTIN_PRESETS['CET CELL'], 'CET CELL preset must exist');
assert(BUILTIN_PRESETS['EDUCATIONAL DOCUMENTS'], 'EDUCATIONAL DOCUMENTS preset must exist');
console.log('  ✓ All 4 presets exist with exact official names.');

// 2. Verify Document Counts
console.log('\n[2] Verifying Preset Document Counts...');
console.log(`  • MAHA DBT: ${BUILTIN_PRESETS['MAHA DBT'].length} documents (expected: 28)`);
assert.strictEqual(BUILTIN_PRESETS['MAHA DBT'].length, 28, 'MAHA DBT must contain 28 documents');

console.log(`  • SWAYAM DEENDAYAL YOJANA: ${BUILTIN_PRESETS['SWAYAM DEENDAYAL YOJANA'].length} documents (expected: 22)`);
assert.strictEqual(BUILTIN_PRESETS['SWAYAM DEENDAYAL YOJANA'].length, 22, 'SWAYAM DEENDAYAL YOJANA must contain 22 documents');

console.log(`  • CET CELL: ${BUILTIN_PRESETS['CET CELL'].length} documents (expected: 26)`);
assert.strictEqual(BUILTIN_PRESETS['CET CELL'].length, 26, 'CET CELL must contain 26 documents');

console.log(`  • EDUCATIONAL DOCUMENTS: ${BUILTIN_PRESETS['EDUCATIONAL DOCUMENTS'].length} documents (expected: 53)`);
assert.strictEqual(BUILTIN_PRESETS['EDUCATIONAL DOCUMENTS'].length, 53, 'EDUCATIONAL DOCUMENTS must contain 53 documents');
console.log('  ✓ All document counts match requirements 100%.');

// 3. Verify Preset 4 contains EVERY document from Presets 1, 2, and 3
console.log('\n[3] Verifying Preset 4 superset property...');
const eduCodes = new Set(BUILTIN_PRESETS['EDUCATIONAL DOCUMENTS'].map(d => d.code));
for (const pName of ['MAHA DBT', 'SWAYAM DEENDAYAL YOJANA', 'CET CELL']) {
  for (const doc of BUILTIN_PRESETS[pName]) {
    assert(eduCodes.has(doc.code), `Document ${doc.code} (${doc.name}) from ${pName} must be present in EDUCATIONAL DOCUMENTS`);
  }
}
console.log('  ✓ EDUCATIONAL DOCUMENTS contains every document from Presets 1, 2, and 3.');

// 4. Verify Single Source of Truth & Zero Duplication in Master Shortcuts
console.log('\n[4] Verifying Zero Duplication in Shortcuts & Rename Rules...');
const seenCodes = new Set();
const seenCanonicals = new Set();
for (const s of DEFAULT_SHORTCUTS) {
  assert(!seenCodes.has(s.code), `Duplicate shortCode detected in DEFAULT_SHORTCUTS: ${s.code}`);
  seenCodes.add(s.code);
}
assert.strictEqual(DEFAULT_SHORTCUTS.length, 53, 'Master shortcuts list must have exactly 53 unique documents');
console.log(`  ✓ Master shortcuts list has exactly ${DEFAULT_SHORTCUTS.length} unique rules with ZERO duplicates.`);

// 5. Verify Standardization of Required Codes
console.log('\n[5] Verifying Standardized Short Codes...');
const requiredCodes = [
  'VAL',  // Caste Validity Certificate
  '12LC', // 12th LC
  'DIS',  // Disability Certificate
  'CETAF',// CET Application Form
  'CETSC',// CET Score Card
  'SRF',  // Status Retention Form
  'EWS',  // EWS Certificate
  'MIG',  // Migration Certificate
  'MED',  // Medical Fitness Certificate
  'BRT',  // Birth Certificate
  'RAT',  // Ration Card
  'BNK',  // Bank Passbook
  'APR',  // APAAR ID
  'SDC',  // Self Declaration
  'PDC',  // Parent Declaration
  'NHC',  // Non Hostel Declaration
  'DTH',  // Death Certificate
  'MIN',  // Minority Certificate
  'PAN',  // PAN Card
  'VOT',  // Voter ID
  'DL',   // Driving License
  '11M',  // 11th Marksheet
  '1YM',  // 1st Year Marksheet
  '2YM',  // 2nd Year Marksheet
  '3YM',  // 3rd Year Marksheet
  '4YM',  // 4th Year Marksheet
  'DPC',  // Passing Certificate
  'DEG',  // Degree Certificate
  'REG',  // Registration Certificate
  'INT',  // Internship Certificate
  'CHR',  // Character Certificate
  'GAZ'   // Gazette Certificate
];

for (const code of requiredCodes) {
  const doc = MASTER_DOCUMENTS_MAP.get(code);
  assert(doc, `Required standardized code ${code} must exist in master map`);
  assert(doc.canonical, `Code ${code} must have canonical name`);
  assert(Array.isArray(doc.keywords) && doc.keywords.length > 0, `Code ${code} must have keywords`);
  console.log(`  • ${code} => ${doc.canonical} (${doc.keywords.slice(0, 3).join(', ')}...)`);
}
console.log('  ✓ All required standardized codes verified.');

// 6. Verify Sync Simulation with RenamerUIManager
console.log('\n[6] Testing RenamerUIManager preset sync & deduplication...');
const fakeStorage = {};
global.localStorage = {
  getItem: (k) => fakeStorage[k] || null,
  setItem: (k, v) => { fakeStorage[k] = String(v); },
  removeItem: (k) => { delete fakeStorage[k]; },
  clear: () => { for (const k in fakeStorage) delete fakeStorage[k]; }
};

const mgr = new RenamerUIManager();
mgr.loadPresetsAndSettings();

// Check presets loaded
assert(mgr.state.documentPresets['MAHA DBT'], 'MAHA DBT must be in manager state');
assert(mgr.state.documentPresets['SWAYAM DEENDAYAL YOJANA'], 'SWAYAM DEENDAYAL YOJANA must be in manager state');
assert(mgr.state.documentPresets['CET CELL'], 'CET CELL must be in manager state');
assert(mgr.state.documentPresets['EDUCATIONAL DOCUMENTS'], 'EDUCATIONAL DOCUMENTS must be in manager state');

// Run sync multiple times to verify idempotence
mgr.syncPresetsToShortcuts();
mgr.syncPresetsToShortcuts();
mgr.syncPresetsToShortcuts();

const finalShortcuts = mgr.shortcuts21;
const finalCodeSet = new Set();
for (const sc of finalShortcuts) {
  assert(!finalCodeSet.has(sc.code), `Duplicate detected after repeated sync: ${sc.code}`);
  finalCodeSet.add(sc.code);
}
assert.strictEqual(finalShortcuts.length, 53, `Shortcuts must remain exactly 53 rules (got ${finalShortcuts.length})`);
console.log(`  ✓ Repeated synchronization is 100% idempotent with ZERO duplicates.`);

// 7. Verify Spaced Input & Shortcut Normalization
console.log('\n[7] Testing Spaced Shortcut Normalization...');
const testSpaced = [
  { input: 'P A N', expected: 'PAN CARD' },
  { input: 'C S T', expected: 'CASTE CERTIFICATE' },
  { input: 'D O M', expected: 'DOMICILE CERTIFICATE' },
  { input: 'V A L', expected: 'CASTE VALIDITY CERTIFICATE' },
  { input: '1 0 M', expected: '10TH MARKSHEET' },
  { input: '1 2 L C', expected: '12TH LC' }
];

for (const ts of testSpaced) {
  const match = matchDocument(ts.input);
  assert.strictEqual(match, ts.expected, `Spaced input "${ts.input}" must resolve to ${ts.expected} (got: ${match})`);
  console.log(`  • "${ts.input}" -> ${match} [PASS]`);
}

// 8. Verify Duplicate Destination Numbering with Preserved Casing
console.log('\n[8] Testing Duplicate Numbering Casing Preservation...');
const usedSet = new Set(['PAN CARD PANKESH.pdf', 'PAN CARD 1 PANKESH.pdf']);
const nextDest = uniqueDestination('PAN CARD PANKESH.pdf', '', usedSet, 'PANKESH');
assert.strictEqual(nextDest, 'PAN CARD 2 PANKESH.pdf', `Duplicate numbering must preserve UPPER casing: got ${nextDest}`);
console.log(`  • Collision resolution: ${nextDest} [PASS]`);

console.log('\n===============================================================');
console.log('🎉 ALL 8/8 PRESETS & SHORTCUTS SYNC SUITE TESTS PASSED 100%!');
console.log('===============================================================');
