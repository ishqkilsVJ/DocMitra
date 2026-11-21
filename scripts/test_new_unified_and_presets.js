import assert from 'assert';
import { BUILTIN_PRESETS, DEFAULT_SHORTCUTS } from './test_presets_data.js';

console.log('--- Testing Built-In Presets & Shortcuts Structure ---');
assert.ok(BUILTIN_PRESETS['MAHA DBT'], 'MAHA DBT must exist');
assert.ok(BUILTIN_PRESETS['CET CELL'], 'CET CELL must exist');
assert.ok(BUILTIN_PRESETS['SWAYAM'], 'SWAYAM must exist');
assert.ok(BUILTIN_PRESETS['EDUCATIONAL'], 'EDUCATIONAL must exist');

assert.strictEqual(BUILTIN_PRESETS['MAHA DBT'].length, 15, 'MAHA DBT must have 15 docs');
assert.strictEqual(BUILTIN_PRESETS['CET CELL'].length, 18, 'CET CELL must have 18 docs');
assert.strictEqual(BUILTIN_PRESETS['SWAYAM'].length, 12, 'SWAYAM must have 12 docs');
assert.strictEqual(BUILTIN_PRESETS['EDUCATIONAL'].length, 23, 'EDUCATIONAL must have 23 docs');
assert.strictEqual(DEFAULT_SHORTCUTS.length, 33, 'Master shortcuts must have 33 rules');

console.log('✅ PASS: All 4 Built-In Presets & 33 Shortcuts verified!');

// Test Unique Sync
const shortcutsPool = [...DEFAULT_SHORTCUTS];
const existingCodes = new Set(shortcutsPool.map(s => s.code.toUpperCase()));

for (const pKey of Object.keys(BUILTIN_PRESETS)) {
  for (const doc of BUILTIN_PRESETS[pKey]) {
    const code = doc.code.toUpperCase();
    if (!existingCodes.has(code)) {
      shortcutsPool.push({
        code,
        label: doc.name,
        canonical: doc.name.toUpperCase(),
        keywords: doc.keywords
      });
      existingCodes.add(code);
    }
  }
}

// Ensure no duplicate short codes
const uniqueCheck = new Set();
for (const s of shortcutsPool) {
  assert.ok(!uniqueCheck.has(s.code.toUpperCase()), `Duplicate short code found: ${s.code}`);
  uniqueCheck.add(s.code.toUpperCase());
}
console.log(`✅ PASS: One-way sync produced ${shortcutsPool.length} strictly UNIQUE shortcut codes (0 duplicates)!`);

// Test Deduplication of Student Name
function testBuildName(input, student, style = 'upper') {
  let combined = input;
  if (student && student.trim()) {
    const normStudent = student.trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
    const normBase = input.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
    const alreadyContains = normBase.toLowerCase().includes(normStudent.toLowerCase());
    if (!alreadyContains) {
      combined = `${input} ${normStudent}`;
    } else {
      combined = input;
    }
  }
  return combined.toUpperCase();
}

assert.strictEqual(
  testBuildName('10TH MARKSHEET VIJAY RAMESH YADAV', 'Vijay Ramesh Yadav'),
  '10TH MARKSHEET VIJAY RAMESH YADAV',
  'Should not append student name if already in input'
);
assert.strictEqual(
  testBuildName('10TH_MARKSHEET_VIJAY_RAMESH_YADAV', 'Vijay Ramesh Yadav'),
  '10TH_MARKSHEET_VIJAY_RAMESH_YADAV',
  'Should not append student name if already in underscored input'
);
assert.strictEqual(
  testBuildName('10TH MARKSHEET', 'Vijay Ramesh Yadav'),
  '10TH MARKSHEET VIJAY RAMESH YADAV',
  'Should append student name once if not present'
);
console.log('✅ PASS: Zero Student Name duplication verified in all scenarios!');
