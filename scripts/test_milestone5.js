import assert from 'assert';
import { identifyDocType, extractStudentName, sortDocsByPreset } from '../src/modules/print-studio.js';
import { DEFAULT_PRINT_PRESETS } from '../src/core/constants.js';
import {
  loadFollowUps,
  saveFollowUps,
  addOrUpdateFollowUp,
  resolveFollowUp,
  getFollowUpStats,
  getDateUrgency,
  formatFriendlyDate
} from '../src/services/followup-service.js';

console.log('=== RUNNING MILESTONE 5 SMOKE TESTS (PRINT & FOLLOWUP) ===');

// 1. Identify Document Type & Extract Student Name
console.log('[Test 1] Print Studio name parsing & identification...');
const docType1 = identifyDocType('10TH MARKSHEET Vijay Yadav.pdf');
assert.strictEqual(docType1, '10TH MARKSHEET');

const docType2 = identifyDocType('DOMICILE CERTIFICATE Aarti Patil.pdf');
assert.strictEqual(docType2, 'DOMICILE CERTIFICATE');

const student1 = extractStudentName('10TH MARKSHEET Vijay Ramesh Yadav.pdf');
assert.ok(student1.includes('Vijay') && student1.includes('Yadav'), 'Student name should be extracted');
console.log('✓ Print Studio document identification and name extraction verified.');

// 2. Sort Documents by MahaDBT Print Preset
console.log('[Test 2] Sort documents by sequence preset...');
const sampleDocs = [
  { name: 'DOMICILE CERTIFICATE.pdf', docType: 'DOMICILE CERTIFICATE' },
  { name: '10TH MARKSHEET.pdf', docType: '10TH MARKSHEET' },
  { name: 'AADHAAR CARD.pdf', docType: 'AADHAAR CARD' },
  { name: '12TH MARKSHEET.pdf', docType: '12TH MARKSHEET' }
];

const sorted = sortDocsByPreset(sampleDocs, DEFAULT_PRINT_PRESETS['MAHA DBT FORM']);
assert.strictEqual(sorted[0].docType, 'AADHAAR CARD', 'Aadhaar card should be first per MahaDBT sequence');
assert.strictEqual(sorted[1].docType, '10TH MARKSHEET', '10th marksheet should be second');
assert.strictEqual(sorted[2].docType, '12TH MARKSHEET', '12th marksheet should be third');
assert.strictEqual(sorted[3].docType, 'DOMICILE CERTIFICATE', 'Domicile certificate should be fourth');
console.log('✓ Print Studio preset sequencing verified.');

// 3. Follow-up Desk Operations
console.log('[Test 3] Follow-up service operations...');
saveFollowUps([]);
const item = addOrUpdateFollowUp({
  folderName: 'Gavit_Amisha',
  studentName: 'Gavit Amisha Kashiram',
  documentName: 'CASTE VALIDITY CERTIFICATE',
  promisedDate: '2026-11-25',
  note: 'Awaiting committee hearing'
});

assert.strictEqual(item.studentName, 'Gavit Amisha Kashiram');
assert.strictEqual(item.status, 'pending');

const stats = getFollowUpStats('2026-11-24');
assert.strictEqual(stats.totalPending, 1);
assert.strictEqual(stats.upcomingCount, 1);

const urgency = getDateUrgency('2026-11-20', '2026-11-24');
assert.strictEqual(urgency, 'overdue');

const formattedDate = formatFriendlyDate('2026-11-25');
assert.ok(formattedDate.includes('Nov') || formattedDate.includes('25'));

// Resolve item
const resolved = resolveFollowUp('Gavit_Amisha', 'CASTE VALIDITY CERTIFICATE');
assert.strictEqual(resolved, true);
const afterResolve = loadFollowUps();
assert.strictEqual(afterResolve[0].status, 'resolved');
console.log('✓ Follow-up Desk state management, urgency calculation, and resolution verified.');

console.log('\n>>> ALL MILESTONE 5 SMOKE TESTS PASSED! <<<');
