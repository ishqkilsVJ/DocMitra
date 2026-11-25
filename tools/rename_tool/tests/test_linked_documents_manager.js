import { strict as assert } from 'assert';
import { RenamerUIManager } from '../rename_tool_ui.js';

console.log('===============================================================');
console.log('🧪 RUNNING: Linked Documents Manager & Bi-Directional Tests');
console.log('===============================================================');

// Mock DOM & localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

global.document = {
  getElementById: (id) => null
};

const ui = new RenamerUIManager();
ui.state = {
  files: [],
  documentPresets: {
    'MAHA DBT': [
      { name: '10TH MARKSHEET' },
      { name: '10TH PASSING CERTIFICATE' },
      { name: 'DOMICILE CERTIFICATE' },
      { name: 'NATIONALITY CERTIFICATE' }
    ],
    'CET CELL': [
      { name: '10TH MARKSHEET AND PASSING CERTIFICATE' },
      { name: 'DOMICILE AND NATIONALITY CERTIFICATE' }
    ]
  },
  activePreset: 'MAHA DBT',
  customShortcuts: []
};

// 1. Test Default Rules
const defaults = ui.getLinkedRules();
console.log('\n[TEST 1] Testing Default Indian Admission Linked Rules...');
assert(defaults.length >= 3, 'Should have at least 3 default linked rules');
assert(defaults.some(r => r.combined.includes('10TH MARKSHEET AND PASSING CERTIFICATE')), '10th mark+pass rule exists');
assert(defaults.some(r => r.combined.includes('12TH MARKSHEET AND PASSING CERTIFICATE')), '12th mark+pass rule exists');
assert(defaults.some(r => r.combined.includes('DOMICILE AND NATIONALITY CERTIFICATE')), 'Domicile+Nationality rule exists');
console.log('✓ Test 1 Passed: Default linked rules loaded correctly');

// 2. Test Case A: Combined Document satisfies Part 1 and Part 2
console.log('\n[TEST 2] Testing Case A: Combined doc satisfies Part 1 & Part 2...');
const folderWithCombined = new Set(['10TH MARKSHEET AND PASSING CERTIFICATE', 'AADHAAR CARD']);
assert.equal(ui.isChecklistRuleSatisfied('10TH MARKSHEET', folderWithCombined), true, '10th Marksheet satisfied via combined');
assert.equal(ui.isChecklistRuleSatisfied('10TH PASSING CERTIFICATE', folderWithCombined), true, '10th Passing satisfied via combined');
assert.equal(ui.isChecklistRuleSatisfied('DOMICILE CERTIFICATE', folderWithCombined), false, 'Domicile not satisfied');
console.log('✓ Test 2 Passed: Case A Combined document satisfies both separate components');

// 3. Test Case B: Both separate documents satisfy Combined requirement
console.log('\n[TEST 3] Testing Case B: Both separate docs satisfy Combined doc...');
const folderWithBothParts = new Set(['DOMICILE CERTIFICATE', 'NATIONALITY CERTIFICATE']);
assert.equal(ui.isChecklistRuleSatisfied('DOMICILE AND NATIONALITY CERTIFICATE', folderWithBothParts), true, 'Combined satisfied when both separate docs present');
console.log('✓ Test 3 Passed: Case B Both separate components satisfy Combined requirement');

// 4. Test Case C: Only One Part is present
console.log('\n[TEST 4] Testing Case C: Only one component doc present...');
const folderWithOnePart = new Set(['DOMICILE CERTIFICATE']);
assert.equal(ui.isChecklistRuleSatisfied('DOMICILE CERTIFICATE', folderWithOnePart), true, 'Domicile is present');
assert.equal(ui.isChecklistRuleSatisfied('NATIONALITY CERTIFICATE', folderWithOnePart), false, 'Nationality is pending/missing');
assert.equal(ui.isChecklistRuleSatisfied('DOMICILE AND NATIONALITY CERTIFICATE', folderWithOnePart), false, 'Combined is not satisfied with only 1 part');
console.log('✓ Test 4 Passed: Case C Partial satisfaction keeps missing part pending');

// 5. Test Master Canonical Document List
console.log('\n[TEST 5] Testing Master Canonical Documents List...');
const canonicals = ui.getMasterCanonicalDocuments();
assert(Array.isArray(canonicals) && canonicals.length > 10, 'Canonical documents array populated');
assert(canonicals.includes('10TH MARKSHEET'), 'Includes 10th mark');
assert(canonicals.includes('DOMICILE AND NATIONALITY CERTIFICATE'), 'Includes combined docs');
console.log(`✓ Test 5 Passed: Master canonical list generated ${canonicals.length} deduplicated documents`);

console.log('\n===============================================================');
console.log('🎉 100% SUCCESS: All Linked Documents Manager Tests Passed!');
console.log('===============================================================');
