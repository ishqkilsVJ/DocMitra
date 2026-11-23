import { 
  buildName, 
  cleanName, 
  matchFilenameSmart, 
  evaluateMatch, 
  matchDocument, 
  uniqueDestination,
  applyCase 
} from '../rename_tool_logic.js';
import { BUILTIN_PRESETS, DEFAULT_SHORTCUTS } from '../rename_tool_ui.js';

console.log('===============================================================');
console.log('🚀 DOCMITRA RENAME TOOL - 100+ STUDENTS & 100+ DOCS STRESS TEST');
console.log('===============================================================\n');

// Actual folder name extraction logic used in rename_tool_ui.js:
function extractStudentFromFolder(folderPathOrName) {
  const folderName = folderPathOrName ? folderPathOrName.split(/[\\/]/).pop() : 'Selected Folder';
  let cleanFolderName = folderName
    .replace(/^(?:roll\s*no\.?|student|candidate|sr\.?\s*no\.?)\s*[\d\w]*[\s_\.\-]+/i, '')
    .replace(/^[0-9]+[_\.\s-]+/, '')
    .replace(/\s*[\(\[][^\)\]]*(?:final|new|copy|admission|cet|dbt|\d{4})[^\)\]]*[\)\]]/gi, '')
    .trim();

  let guessedStudent = cleanFolderName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^\d+$/.test(guessedStudent)) {
    guessedStudent = '';
  }
  return guessedStudent;
}

// 1. Generate 105 Diverse Student Names
const firstNames = [
  'Aarav', 'Pankesh', 'Dominic', 'Indira', 'Prakash', 'Dattatraya', 'Shivaji', 'Tanvi', 'Ananya', 'Prathamesh',
  'Vaishnavi', 'Omkar', 'Siddhesh', 'Gauri', 'Aditya', 'Snehal', 'Rushikesh', 'Mayuri', 'Digambar', 'Swapnil',
  'Mohammad', 'Fatima', 'Gurpreet', 'Jaswinder', 'Mary', 'John', 'Krushna', 'Tukaram', 'Dnyaneshwar', 'Eknath'
];
const middleNames = ['Ambadasrao', 'Kashinath', 'Ramchandra', 'Vasant', 'Govind', 'Bhimrao', 'Sadashiv', 'Pandurang', ''];
const lastNames = ['Jadhav', 'Patil', 'Deshmukh', 'Kulkarni', 'Pawar', 'Shinde', 'Chavan', 'More', 'Gaikwad', 'Bhosale'];

const studentNames = [];
for (let i = 0; i < 105; i++) {
  const fn = firstNames[i % firstNames.length];
  const mn = middleNames[i % middleNames.length];
  const ln = lastNames[i % lastNames.length];
  if (i === 0) studentNames.push('PANKESH');
  else if (i === 1) studentNames.push('DOMINIC');
  else if (i === 2) studentNames.push('INDIRA');
  else if (i === 3) studentNames.push('PRAKASH');
  else if (i % 7 === 0) studentNames.push(`${fn} ${ln}`);
  else if (i % 5 === 0) studentNames.push(`${fn} ${mn} ${ln}`.replace(/\s+/g, ' ').trim());
  else if (i % 4 === 0) studentNames.push(`${fn[0]}. ${mn ? mn[0] + '.' : ''} ${ln}`.trim());
  else if (i % 3 === 0) studentNames.push(`${fn.toUpperCase()} ${ln.toUpperCase()}`);
  else studentNames.push(`${fn.toLowerCase()} ${ln.toLowerCase()}`);
}

// 2. Generate 110 Varied Document Names (Scanner, noisy, duplicates, messy)
const baseDocTemplates = [
  'SCAN_20261122_0001.pdf', 'scan0002.jpg', 'IMG_20241120_142210.jpeg', 'doc (1).pdf', 'New Document(2).pdf',
  'aadhar_card_front.pdf', 'AADHAAR CARD BACK.PDF', 'pan_card.pdf', 'pancard_new.pdf', 'income_certificate_2023_24.pdf',
  'caste_certificate.pdf', 'caste_validity_final.pdf', 'non_creamy_layer_cert.pdf', 'domicile_certificate_maha.pdf',
  'ration_card_page1.pdf', '10th_marksheet_board.pdf', '12th_hsc_passing_cert.pdf', 'leaving_certificate_tc.pdf',
  'bank_passbook_sbi.pdf', 'passport_size_photo.jpg', 'signature_specimen.png', 'undertaking_form.pdf',
  'allotment_letter_cap_round_1.pdf', 'fee_receipt_term_1.pdf', 'gap_affidavit_100rs.pdf', 'father_death_certificate.pdf',
  'disability_certificate_pwd.pdf', '7_12_extract_satbara.pdf', '8_a_extract.pdf', 'samaksh_panchnama.pdf'
];

const docFiles = [];
for (let i = 0; i < 110; i++) {
  const base = baseDocTemplates[i % baseDocTemplates.length];
  if (i < 30) docFiles.push(base);
  else if (i < 60) docFiles.push(`SCAN_${i}_${base}`);
  else if (i < 80) docFiles.push(`COPY_OF_${base.toUpperCase()}`);
  else if (i < 100) docFiles.push(`student_upload_${i}_${base.toLowerCase()}`);
  else docFiles.push(`Doc-with special & characters #@! ${i} - ${base}`);
}

console.log(`Generated ${studentNames.length} Students & ${docFiles.length} Document filenames for stress testing.\n`);

// 3. Performance & Correctness Benchmark
const startTime = Date.now();
let totalMatches = 0;
let highConfidenceMatches = 0;
let errors = [];

for (let sIdx = 0; sIdx < studentNames.length; sIdx++) {
  const student = studentNames[sIdx];
  const testFilesForStudent = docFiles.slice(sIdx % 20, (sIdx % 20) + 15);

  for (const filename of testFilesForStudent) {
    try {
      const match = matchFilenameSmart(filename, student);
      if (match && match.canonical) {
        totalMatches++;
        if (match.confidence >= 70) highConfidenceMatches++;
      }
      
      const builtUpper = buildName(match?.canonical || 'DOCUMENT', student, null, 'upper');
      const builtTitle = buildName(match?.canonical || 'DOCUMENT', student, null, 'title');
      
      if (!builtUpper || !builtTitle) {
        errors.push(`Empty builtName for student: "${student}", file: "${filename}"`);
      }
    } catch (err) {
      errors.push(`Exception on student "${student}" with file "${filename}": ${err.message}`);
    }
  }
}

const elapsedMs = Date.now() - startTime;
console.log('--- 📊 BENCHMARK RESULTS ---');
console.log(`Total Match & Build Cycles: ${studentNames.length * 15}`);
console.log(`Execution Time: ${elapsedMs} ms (${(elapsedMs / (studentNames.length * 15)).toFixed(2)} ms/operation)`);
console.log(`Total Matches Identified: ${totalMatches}`);
console.log(`High Confidence Matches (>=70%): ${highConfidenceMatches}`);
console.log(`Exceptions/Crashes: ${errors.length}`);
if (errors.length > 0) {
  console.log('Sample Errors:', errors.slice(0, 5));
}

// 4. Test Folder Extraction on Diverse Paths
console.log('\n--- 📂 FOLDER EXTRACTION TEST (10 Paths) ---');
const testPaths = [
  'D:\\Students\\PANKESH_JADHAV\\scan.pdf',
  'C:/Users/Admin/Desktop/CET_2026/101 - AARAV PATIL/aadhar.pdf',
  '/home/docmitra/data/DESHMUKH_TANVI_1234/doc.pdf',
  'E:\\Admissions\\2026-27\\RAMESH SHINDE\\marksheet.pdf',
  'D:\\Scans\\Roll No 45 Snehal Pawar\\pan.pdf',
  'E:\\Govt_Forms\\D. A. Patil\\tc.pdf',
  'D:\\MahaDBT\\Pending\\Omkar_Gaikwad\\photo.jpg',
  'C:\\TEMP\\FOLDER_WITHOUT_NAME\\scan.pdf',
  'D:\\Data\\12345678\\file.pdf',
  'E:\\Work\\KULKARNI GAURI (FINAL)\\undertaking.pdf'
];

for (const p of testPaths) {
  const extracted = extractStudentFromFolder(p.substring(0, p.lastIndexOf('\\') !== -1 ? p.lastIndexOf('\\') : p.lastIndexOf('/')));
  console.log(`Path: "${p}" => Extracted: "${extracted}"`);
}
