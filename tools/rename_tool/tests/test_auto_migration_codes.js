import assert from 'assert';
import { RenamerUIManager, DEFAULT_SHORTCUTS } from '../rename_tool_ui.js';

console.log('🧪 TESTING AUTO-MIGRATION OF LEGACY SHORT CODES (_2 -> 2)...');

// Mock localStorage
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

// Seed legacy data with underscore suffixes
const legacyPresets = {
  'MAHA DBT': [
    { name: 'PHOTO', code: 'PIC', codes: ['PIC'], keywords: ['photo'] },
    { name: 'SIGNATURE', code: 'PIC_2', codes: ['PIC_2'], keywords: ['sign'] },
    { name: 'THUMB', code: 'PIC_3', codes: ['PIC_3'], keywords: ['thumb'] },
    { name: 'COLLEGE ID', code: 'ID_9', codes: ['ID_9'], keywords: ['id'] }
  ]
};
const legacyCustomShortcuts = [
  { code: 'DOC_2', codes: ['DOC_2'], canonical: 'CUSTOM DOC 2' }
];

store.set('docmitra_rename_presets', JSON.stringify(legacyPresets));
store.set('docmitra_custom_shortcuts', JSON.stringify(legacyCustomShortcuts));

const ui = new RenamerUIManager();
ui.loadPresetsAndSettings();

// Verify Presets migration
const mahaDocs = ui.state.documentPresets['MAHA DBT'];
const signDoc = mahaDocs.find(d => d.name === 'SIGNATURE');
const thumbDoc = mahaDocs.find(d => d.name === 'THUMB');
const idDoc = mahaDocs.find(d => d.name === 'COLLEGE ID');

assert.strictEqual(signDoc.code, 'PIC2', 'SIGNATURE code PIC_2 must be migrated to PIC2');
assert.strictEqual(signDoc.codes[0], 'PIC2', 'SIGNATURE codes[0] must be migrated to PIC2');
assert.strictEqual(thumbDoc.code, 'PIC3', 'THUMB code PIC_3 must be migrated to PIC3');
assert.strictEqual(idDoc.code, 'ID9', 'COLLEGE ID code ID_9 must be migrated to ID9');
console.log('  ✓ Presets auto-migration verified: PIC_2 -> PIC2, PIC_3 -> PIC3, ID_9 -> ID9');

// Verify Custom Shortcuts migration
const customDoc = ui.state.customShortcuts.find(cs => cs.canonical === 'CUSTOM DOC 2');
assert.strictEqual(customDoc.code, 'DOC2', 'Custom shortcut code DOC_2 must be migrated to DOC2');
assert.strictEqual(customDoc.codes[0], 'DOC2', 'Custom shortcut codes[0] must be migrated to DOC2');
console.log('  ✓ Custom shortcuts auto-migration verified: DOC_2 -> DOC2');

// Verify LocalStorage persistence of migrated codes
const persistedPresets = JSON.parse(store.get('docmitra_rename_presets'));
const persistedSign = persistedPresets['MAHA DBT'].find(d => d.name === 'SIGNATURE');
assert.strictEqual(persistedSign.code, 'PIC2', 'Migrated code must be persisted to localStorage');
console.log('  ✓ Migrated codes safely persisted to localStorage');

console.log('🎉 AUTO-MIGRATION OF LEGACY SHORT CODES PASSED 100%!\n');
