// tools/rename_tool/tests/test_preset_edit_and_rescan.js
import assert from 'assert';
import {
  matchFilenameSmart,
  buildName,
  updateCanonicalName,
  removeCanonicalName,
  syncCanonicalNames,
  updateDocumentPattern,
  CANONICAL_NAMES,
  DOCUMENT_PATTERNS
} from '../rename_tool_logic.js';

console.log('--- 🧪 STARTING PRESET EDIT & DYNAMIC RESCAN TEST SUITE ---');

let passed = 0;
let failed = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

// TC-1: Edit 12TH PASSING CERTIFICATE to 12TH PASSING and verify matching & buildName
run('12TH PASSING CERTIFICATE edited to 12TH PASSING reflects in matchFilenameSmart and buildName', () => {
  const updatedPresets = [
    {
      name: '12TH PASSING',
      code: '12P',
      keywords: ['12th passing', 'hsc passing', '12 passing', '12p']
    },
    {
      name: '10TH MARKSHEET',
      code: '10M',
      keywords: ['10th marksheet', 'ssc marksheet', '10m']
    }
  ];

  // Sync to runtime engine as UI does
  syncCanonicalNames(updatedPresets);
  updateDocumentPattern('12P', '12TH PASSING', ['12th passing', 'hsc passing', '12 passing', '12p']);
  updateCanonicalName('12TH PASSING', '12TH PASSING');

  // Verify matchFilenameSmart matches 12TH PASSING immediately
  const matchResult = matchFilenameSmart('12th passing.pdf', 'Hasina Vishnu Gavit', null, updatedPresets);
  assert.strictEqual(matchResult.docType, '12TH PASSING', `Expected '12TH PASSING', got '${matchResult.docType}'`);
  assert.strictEqual(matchResult.code, '12P');
  assert.ok(matchResult.confidence >= 90);

  // Verify buildName produces clean output without the stale 'CERTIFICATE'
  const suggestedUpper = buildName(matchResult.docType, 'Hasina Vishnu Gavit', null, 'upper');
  assert.strictEqual(suggestedUpper, '12TH PASSING HASINA VISHNU GAVIT');

  const suggestedTitle = buildName(matchResult.docType, 'Hasina Vishnu Gavit', null, 'title');
  assert.strictEqual(suggestedTitle, '12th Passing Hasina Vishnu Gavit');

  const suggestedLower = buildName(matchResult.docType, 'Hasina Vishnu Gavit', null, 'lower');
  assert.strictEqual(suggestedLower, '12th passing hasina vishnu gavit');
});

// TC-2: Verify short code 12P expands to 12TH PASSING
run('Shortcode 12P resolves to 12TH PASSING instead of stale CERTIFICATE', () => {
  const updatedPresets = [
    {
      name: '12TH PASSING',
      code: '12P',
      keywords: ['12th passing', 'hsc passing', '12p']
    }
  ];

  const matchShort = matchFilenameSmart('12p.jpg', 'Dipesh Rajesh Vasave', null, updatedPresets);
  assert.strictEqual(matchShort.docType, '12TH PASSING');
  assert.strictEqual(matchShort.code, '12P');

  const suggested = buildName(matchShort.docType, 'Dipesh Rajesh Vasave', null, 'upper');
  assert.strictEqual(suggested, '12TH PASSING DIPESH RAJESH VASAVE');
});

// TC-3: Verify custom document addition (e.g. MEDICAL FITNESS)
run('Custom document addition immediately matches and generates correct formula', () => {
  const customPresets = [
    {
      name: 'MEDICAL FITNESS',
      code: 'MED',
      keywords: ['medical fitness', 'fitness cert', 'fitness']
    }
  ];

  syncCanonicalNames(customPresets);
  updateCanonicalName('MEDICAL FITNESS', 'MEDICAL FITNESS');

  const matchCustom = matchFilenameSmart('fitness_medical.pdf', 'Pooja S Patil', null, customPresets);
  assert.strictEqual(matchCustom.docType, 'MEDICAL FITNESS');

  const suggested = buildName(matchCustom.docType, 'Pooja S Patil', null, 'upper');
  assert.strictEqual(suggested, 'MEDICAL FITNESS POOJA S PATIL');
});

// TC-4: Verify unlinked/deleted document is removed and does not falsely match
run('Deleted document removal purges stale patterns', () => {
  removeCanonicalName('OBSOLETE_DOC');
  assert.strictEqual(CANONICAL_NAMES['OBSOLETE_DOC'], undefined);
});

console.log('-----------------------------------------------------------');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
if (failed > 0) process.exit(1);
console.log('🎉 PRESET EDIT & DYNAMIC RESCAN TEST SUITE PASSED 100%!');
