// tools/rename_tool/tests/stress_test_1500_virtual_files.js
import assert from 'assert';
import {
  matchFilenameSmart,
  buildName,
  uniqueDestination,
  computeOldNameErrorPercent,
  cleanName,
  ext
} from '../rename_tool_logic.js';

console.log('--- 🧪 STARTING 1,500+ VIRTUAL FILES STRESS & FUZZING TEST SUITE ---');

const INDIAN_STUDENT_NAMES = [
  'Hasina Vishnu Gavit',
  'Dipesh Rajesh Vasave',
  'Pooja_S_Patil',
  'Aarti Ramesh Yadav',
  'Vijay Yadav',
  'Sunita',
  'Rahul  D.  Sharma',
  'Ketan-V-Patil',
  'Pranali Sanjay Deshmukh',
  'Omkar Ashok Shinde',
  'Meena Kumari Valvi',
  'Chetan B. Padvi'
];

const EXTENSIONS = ['.pdf', '.jpg', '.png', '.jpeg'];

const DIRTY_PATTERNS = [
  { base: '12th_pass', expectedDoc: '12TH PASSING' },
  { base: '12l', expectedDoc: '12TH LC' },
  { base: '12th_pasing', expectedDoc: '12TH PASSING' },
  { base: 'markshit_10', expectedDoc: '10TH MARKSHEET' },
  { base: '10th_marksheet(1)', expectedDoc: '10TH MARKSHEET' },
  { base: '10m', expectedDoc: '10TH MARKSHEET' },
  { base: 'ssc_mark', expectedDoc: '10TH MARKSHEET' },
  { base: 'adhar_front', expectedDoc: 'AADHAAR CARD' },
  { base: 'aadhar_card_scan', expectedDoc: 'AADHAAR CARD' },
  { base: 'adr', expectedDoc: 'AADHAAR CARD' },
  { base: 'cast_cert(1)', expectedDoc: 'CASTE CERTIFICATE' },
  { base: 'cst_2026', expectedDoc: 'CASTE CERTIFICATE' },
  { base: 'jati_dakhla', expectedDoc: 'CASTE CERTIFICATE' },
  { base: 'validity_cert', expectedDoc: 'CASTE VALIDITY CERTIFICATE' },
  { base: 'val_padtalni', expectedDoc: 'CASTE VALIDITY CERTIFICATE' },
  { base: 'lc_2025', expectedDoc: '12TH LC' },
  { base: 'leaving_certificate_tc', expectedDoc: '12TH LC' },
  { base: 'photo_new', expectedDoc: 'PHOTO' },
  { base: 'passport_pic', expectedDoc: 'PHOTO' },
  { base: 'pic', expectedDoc: 'PHOTO' },
  { base: 'sign_student', expectedDoc: 'SIGNATURE' },
  { base: 'sahi', expectedDoc: 'SIGNATURE' },
  { base: 'sig', expectedDoc: 'SIGNATURE' },
  { base: 'income_cert_tehsildar', expectedDoc: 'INCOME CERTIFICATE' },
  { base: 'utpanna_dakhla', expectedDoc: 'INCOME CERTIFICATE' },
  { base: 'inc_2026', expectedDoc: 'INCOME CERTIFICATE' },
  { base: 'domicile_certificate_maha', expectedDoc: 'DOMICILE CERTIFICATE' },
  { base: 'dom_residence', expectedDoc: 'DOMICILE CERTIFICATE' },
  { base: 'ration_card_bpl', expectedDoc: 'RATION CARD' },
  { base: 'bank_passbook_sbi', expectedDoc: 'BANK PASSBOOK' },
  { base: 'bnk_statement', expectedDoc: 'BANK PASSBOOK' }
];

export function generate1500Dataset() {
  const files = [];
  const presetDocs = [
    { name: '12TH PASSING', code: '12P', keywords: ['12th passing', 'hsc passing', '12 passing', '12p', '12th pass', '12th pasing'] },
    { name: '10TH MARKSHEET', code: '10M', keywords: ['10th marksheet', 'ssc marksheet', '10m', 'markshit', '10th mark'] },
    { name: '12TH MARKSHEET', code: '12M', keywords: ['12th marksheet', 'hsc marksheet', '12m', '12th mark'] },
    { name: '12TH LC', code: '12LC', keywords: ['12th lc', '12lc', '12l', 'leaving', 'tc'] },
    { name: '10TH LC', code: '10LC', keywords: ['10th lc', '10lc', '10l'] },
    { name: 'AADHAAR CARD', code: 'ADR', keywords: ['aadhaar', 'adhar', 'aadhar', 'adr', 'uid'] },
    { name: 'CASTE CERTIFICATE', code: 'CST', keywords: ['caste', 'cast', 'cst', 'jati'] },
    { name: 'CASTE VALIDITY CERTIFICATE', code: 'VAL', keywords: ['validity', 'val', 'cvc', 'padtalni'] },
    { name: 'INCOME CERTIFICATE', code: 'INC', keywords: ['income', 'inc', 'utpanna'] },
    { name: 'DOMICILE CERTIFICATE', code: 'DOM', keywords: ['domicile', 'dom', 'rahavasi'] },
    { name: 'RATION CARD', code: 'RAT', keywords: ['ration', 'rat', 'rc'] },
    { name: 'BANK PASSBOOK', code: 'BNK', keywords: ['bank', 'passbook', 'bnk'] },
    { name: 'PHOTO', code: 'PIC', keywords: ['photo', 'pic', 'photograph'] },
    { name: 'SIGNATURE', code: 'SIG', keywords: ['signature', 'sign', 'sig', 'sahi'] }
  ];

  let idCounter = 1;

  // 1. Generate 1,200 randomized dirty & misspelled files across Indian students
  for (let i = 0; i < 1200; i++) {
    const student = INDIAN_STUDENT_NAMES[i % INDIAN_STUDENT_NAMES.length];
    const pattern = DIRTY_PATTERNS[i % DIRTY_PATTERNS.length];
    const extension = EXTENSIONS[i % EXTENSIONS.length];
    const noiseNum = (i % 7 === 0) ? `_${(i % 100)}` : '';
    const messyName = `${pattern.base}${noiseNum}_${student.replace(/\s+/g, '_')}${extension}`;
    files.push({
      id: `file_${idCounter++}`,
      name: messyName,
      path: `E:/Admissions/FYJC/${messyName}`,
      size: 50000 + (i * 123) % 400000,
      ext: extension,
      expectedDoc: pattern.expectedDoc,
      student: student
    });
  }

  // 2. Generate 220 exact duplicate collisions (same target name resolution)
  for (let i = 0; i < 220; i++) {
    const targetType = (i % 4 === 0) ? 'AADHAAR CARD' : (i % 4 === 1 ? '10TH MARKSHEET' : (i % 4 === 2 ? 'PHOTO' : 'CASTE CERTIFICATE'));
    const student = 'Hasina Vishnu Gavit';
    const extension = EXTENSIONS[i % EXTENSIONS.length];
    const copySuffix = `_copy_${Math.floor(i / 4) + 1}`;
    const dupName = `${targetType.toLowerCase().replace(/\s+/g, '_')}${copySuffix}${extension}`;
    files.push({
      id: `file_${idCounter++}`,
      name: dupName,
      path: `E:/Admissions/FYJC/${dupName}`,
      size: 120000,
      ext: extension,
      expectedDoc: targetType,
      student: student,
      isDuplicateLot: true
    });
  }

  // 3. Generate 100 minor difference cases (already renamed files with slight variations)
  for (let i = 0; i < 100; i++) {
    const student = 'Hasina Vishnu Gavit';
    const extension = EXTENSIONS[i % EXTENSIONS.length];
    const baseNames = [
      '10TH MARKSHEET HASINA GAVIT',
      'AADHAAR CARD HASINA VISHNU GAVIT',
      '12TH PASSING HASINA GAVIT',
      'DOMICILE CERTIFICATE HASINA GAVIT',
      'CASTE CERTIFICATE HASINA GAVIT'
    ];
    const base = baseNames[i % baseNames.length];
    const variation = (i % 3 === 0) ? `${base} (1)${extension}` : (i % 3 === 1 ? `${base.toLowerCase()}${extension}` : `${base}${extension}`);
    files.push({
      id: `file_${idCounter++}`,
      name: variation,
      path: `E:/Admissions/FYJC/${variation}`,
      size: 180000,
      ext: extension,
      student: student,
      isMinorDifference: true
    });
  }

  return { files, presetDocs };
}

// RUN BENCHMARK
const startTime = Date.now();
const { files, presetDocs } = generate1500Dataset();
console.log(`Generated dataset: ${files.length} virtual files in ${Date.now() - startTime}ms.`);

// Verify 1: Matching speed & accuracy across all 1,520 files
const usedDestinations = new Set();
let matchSuccessCount = 0;
let collisionCount = 0;
const targetNames = [];

const matchStart = Date.now();
for (const f of files) {
  const match = matchFilenameSmart(f.name, f.student, null, presetDocs);
  if (match && match.confidence >= 30) {
    matchSuccessCount++;
  }
  const docBase = match?.docType || cleanName(f.name);
  const formula = buildName(docBase, f.student, null, 'upper');
  const desired = formula.endsWith(f.ext) ? formula : `${formula}${f.ext}`;
  const unique = uniqueDestination(desired, f.name, usedDestinations, f.student);
  
  if (usedDestinations.has(unique)) {
    collisionCount++;
  }
  usedDestinations.add(unique);
  targetNames.push(unique);
}
const matchDuration = Date.now() - matchStart;

console.log(`Matched ${matchSuccessCount}/${files.length} files in ${matchDuration}ms (~${(matchDuration / files.length).toFixed(2)}ms per file).`);
assert.strictEqual(collisionCount, 0, 'Collision count must be ZERO (all 1,520 filenames must be unique)');
assert.strictEqual(usedDestinations.size, files.length, `Target name set size must equal ${files.length}`);
assert.ok(matchSuccessCount >= 1480, `Expected at least 1,480 matches, got ${matchSuccessCount}`);
assert.ok(matchDuration < 4000, `Expected total match time < 4000ms, took ${matchDuration}ms`);

console.log('✅ 1,500+ Virtual Files Stress Test PASSED with 100% Unique Destinations & Zero Collisions!');
