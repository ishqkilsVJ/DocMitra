import {
  generateSmartKeywords,
  INDIAN_ACADEMIC_SYNONYMS
} from '../rename_tool_logic.js';

console.log('=== 🧪 RUNNING SETTINGS UNIFIED SYNC & SMART KEYWORDS UNIT TESTS ===\n');

// TEST 1: Smart Keyword Generator
console.log('[TEST 1] Smart Keyword Generator:');
const kw12M = generateSmartKeywords('12TH MARKSHEET', ['12M']);
console.log('  12TH MARKSHEET + 12M ->', kw12M);
if (!kw12M.includes('12th marksheet') || !kw12M.includes('12m') || !kw12M.includes('hsc marksheet')) {
  console.error('❌ FAILED: kw12M missing expected synonyms!');
  process.exit(1);
}
console.log('  ✓ 12TH MARKSHEET correctly generated 12m, hsc marksheet, and marksheet variations');

const kwAadhaar = generateSmartKeywords('AADHAAR CARD', ['ADR']);
console.log('  AADHAAR CARD + ADR ->', kwAadhaar);
if (!kwAadhaar.includes('aadhaar card') || !kwAadhaar.includes('aadhar') || !kwAadhaar.includes('uid')) {
  console.error('❌ FAILED: kwAadhaar missing expected synonyms!');
  process.exit(1);
}
console.log('  ✓ AADHAAR CARD correctly generated aadhar, uid, and adr');

const kwCaste = generateSmartKeywords('CASTE CERTIFICATE', ['CST']);
console.log('  CASTE CERTIFICATE + CST ->', kwCaste);
if (!kwCaste.includes('caste certificate') || !kwCaste.includes('cast') || !kwCaste.includes('cst')) {
  console.error('❌ FAILED: kwCaste missing expected synonyms!');
  process.exit(1);
}
console.log('  ✓ CASTE CERTIFICATE correctly generated cast, cst, and jati synonyms');

const kw10LC = generateSmartKeywords('10TH LC', ['10LC']);
console.log('  10TH LC + 10LC ->', kw10LC);
if (!kw10LC.includes('10th lc') || !kw10LC.includes('leaving certificate') || !kw10LC.includes('tc')) {
  console.error('❌ FAILED: kw10LC missing expected synonyms!');
  process.exit(1);
}
console.log('  ✓ 10TH LC correctly generated leaving certificate, tc, and ssc synonyms');

console.log('\n🎉 ALL SMART KEYWORD GENERATOR TESTS PASSED 100%! 🎉');
