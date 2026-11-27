/**
 * tools/rename_tool/rename_tool_logic.js
 * DocMitra Bulk Document Renamer — Pure Business Logic Module
 *
 * Encapsulates:
 * 1. Naming & Case Enforcement (UPPER, Title, lower, As Is)
 * 2. 21-Shortcut Keyword & Canonical Name Resolution
 * 3. Document Pattern Matching & Word-Boundary Safety
 * 4. Duplicate Filename Auto-Suffixing (Sequential ' 1', ' 2'...)
 * 5. Windows Filename Validation & Reserved Names Protection
 * 6. Multi-Level Undo Manager
 * 7. Scanner Misspelling Typo Auto-Correction
 * 8. Checklist & Multi-Document Linking Engine
 * 9. Batch Audit CSV Report Generation
 * 10. Atomic Rename & Rollback Orchestration
 *
 * STRICT RULE: Pure logic only. Zero DOM dependencies, zero Marathi text.
 */

import { renameNativeFile } from '../../shared/native-bridge.js';

/* ==========================================================================
   1. Canonical Naming & Default Rules Constants
   ========================================================================== */

export const CANONICAL_NAMES = {
  "PHOTO": "Photo",
  "SIGNATURE": "Signature",
  "AADHAAR CARD": "Aadhaar Card",
  "AADHAR CARD": "Aadhaar Card",
  "10TH MARKSHEET": "10th Marksheet",
  "10TH PASSING CERTIFICATE": "10th Passing Certificate",
  "10TH MARKSHEET AND PASSING CERTIFICATE": "10th Marksheet and Passing Certificate",
  "10TH MARKSHEET AND PASSING": "10th Marksheet and Passing Certificate",
  "12TH MARKSHEET": "12th Marksheet",
  "12TH PASSING CERTIFICATE": "12th Passing Certificate",
  "12TH MARKSHEET AND PASSING CERTIFICATE": "12th Marksheet and Passing Certificate",
  "12TH MARKSHEET AND PASSING": "12th Marksheet and Passing Certificate",
  "12TH LC": "12th LC",
  "LEAVING CERTIFICATE": "12th LC",
  "PREVIOUS YEAR MARKSHEET": "Previous Year Marksheet",
  "CASTE CERTIFICATE": "Caste Certificate",
  "CASTE VALIDITY CERTIFICATE": "Caste Validity Certificate",
  "VALIDITY CERTIFICATE": "Caste Validity Certificate",
  "NON CREAMY LAYER CERTIFICATE": "Non Creamy Layer Certificate",
  "INCOME CERTIFICATE": "Income Certificate",
  "DOMICILE CERTIFICATE": "Domicile Certificate",
  "NATIONALITY CERTIFICATE": "Nationality Certificate",
  "DOMICILE AND NATIONALITY CERTIFICATE": "Domicile and Nationality Certificate",
  "RATION CARD": "Ration Card",
  "BANK PASSBOOK": "Bank Passbook",
  "PASSBOOK BANK": "Bank Passbook",
  "CAP ALLOTMENT LETTER": "CAP Allotment Letter",
  "BONAFIDE CERTIFICATE": "Bonafide Certificate",
  "FEE RECEIPT": "Fee Receipt",
  "ADMISSION FEE RECEIPT": "Fee Receipt",
  "ATTENDANCE CERTIFICATE": "Attendance Certificate",
  "HOSTEL CERTIFICATE": "Hostel Certificate",
  "HOSTEL RECEIPT / BONAFIDE": "Hostel Certificate",
  "GAP CERTIFICATE": "Gap Certificate",
  "SELF DECLARATION": "Self Declaration",
  "PARENT DECLARATION": "Parent Declaration",
  "DEATH CERTIFICATE": "Death Certificate",
  "NON HOSTEL DECLARATION": "Non Hostel Declaration",
  "DISABILITY CERTIFICATE": "Disability Certificate",
  "APAAR ID": "APAAR ID",
  "ABC ID": "APAAR ID",
  "CET APPLICATION FORM": "CET Application Form",
  "CET APPLICATION CONFIRMATION": "CET Application Form",
  "CET SCORE CARD": "CET Score Card",
  "CET SCORECARD": "CET Score Card",
  "STATUS RETENTION FORM": "Status Retention Form",
  "EWS CERTIFICATE": "EWS Certificate",
  "MIGRATION CERTIFICATE": "Migration Certificate",
  "MEDICAL FITNESS CERTIFICATE": "Medical Fitness Certificate",
  "BIRTH CERTIFICATE": "Birth Certificate",
  "PAN CARD": "PAN Card",
  "VOTER ID": "Voter ID",
  "DRIVING LICENSE": "Driving License",
  "11TH MARKSHEET": "11th Marksheet",
  "11TH PASSING CERTIFICATE": "11th Passing Certificate",
  "10TH LC": "10th LC",
  "1ST YEAR MARKSHEET": "1st Year Marksheet",
  "2ND YEAR MARKSHEET": "2nd Year Marksheet",
  "3RD YEAR MARKSHEET": "3rd Year Marksheet",
  "4TH YEAR MARKSHEET": "4th Year Marksheet",
  "PASSING CERTIFICATE": "Passing Certificate",
  "DEGREE CERTIFICATE": "Degree Certificate",
  "REGISTRATION CERTIFICATE": "Registration Certificate",
  "INTERNSHIP CERTIFICATE": "Internship Certificate",
  "CHARACTER CERTIFICATE": "Character Certificate",
  "GAZETTE CERTIFICATE": "Gazette Certificate",
  "MINORITY CERTIFICATE": "Minority Certificate",
  "MINORITY DECLARATION": "Minority Certificate",
  "RESIDENTIAL DOCUMENT": "Residential Document",
  "ATTEMPT CERTIFICATE": "Attempt Certificate",
  "12TH PASSING": "12th Passing Certificate",
  "10TH PASSING": "10th Passing Certificate",
  "CET CELL FORM": "CET Application Form",
  "DOMICILE AND NATIONALITY": "Domicile and Nationality Certificate",
  "NATIONALITY AND DOMICILE": "Domicile and Nationality Certificate",
  "NATIONALITY AND DOMOCILE": "Domicile and Nationality Certificate",
  "NATIONALITY DOMICILE": "Domicile and Nationality Certificate",
  "DOMICILE NATIONALITY": "Domicile and Nationality Certificate"
};

export function getCanonicalDocumentUpper(name) {
  if (!name || typeof name !== 'string') return '';
  const upper = name.trim().toUpperCase();
  if (CANONICAL_NAMES[upper]) {
    return CANONICAL_NAMES[upper].toUpperCase();
  }
  return upper;
}

export function updateCanonicalName(key, canonical) {
  if (!key) return;
  const upper = key.trim().toUpperCase();
  CANONICAL_NAMES[upper] = canonical || key;
}

export function removeCanonicalName(key) {
  if (!key) return;
  const upper = key.trim().toUpperCase();
  delete CANONICAL_NAMES[upper];
}

export function syncCanonicalNames(docList) {
  if (!docList || !Array.isArray(docList)) return;
  for (const item of docList) {
    if (!item) continue;
    const name = (typeof item === 'string' ? item : (item.name || item.canonical || '')).trim();
    if (!name) continue;
    CANONICAL_NAMES[name.toUpperCase()] = name;
  }
}

export const DEFAULT_SPELLING_RULES = {
  "marskheet": "marksheet",
  "markshet": "marksheet",
  "markshit": "marksheet",
  "pasing": "passing",
  "pasingg": "passing",
  "aadhhar": "aadhaar",
  "adhar": "aadhaar",
  "aadhar": "aadhaar",
  "bonafied": "bonafide",
  "bonafidee": "bonafide",
  "bonafaid": "bonafide",
  "domocile": "domicile",
  "domisail": "domicile",
  "pasbook": "passbook",
  "pasbok": "passbook",
  "incom": "income",
  "incme": "income",
  "kcast": "caste",
  "kast": "caste",
  "sartificat": "certificate",
  "sartifiket": "certificate",
  "sartifakit": "certificate",
  "certifcte": "certificate",
  "certifcate": "certificate",
  "certificte": "certificate",
  "certficate": "certificate",
  "certifitcate": "certificate",
  "atempt": "attempt",
  "attmpt": "attempt",
  "phot": "photo",
  "foto": "photo",
  "woter": "voter"
};

export const DEFAULT_LINKED_RULES = [
  {
    id: "10th-marksheet-passing-link",
    part1: "10TH MARKSHEET",
    part2: "10TH PASSING CERTIFICATE",
    combined: "10TH MARKSHEET AND PASSING CERTIFICATE",
    type: "combined"
  },
  {
    id: "12th-marksheet-passing-link",
    part1: "12TH MARKSHEET",
    part2: "12TH PASSING CERTIFICATE",
    combined: "12TH MARKSHEET AND PASSING CERTIFICATE",
    type: "combined"
  },
  {
    id: "domicile-nationality-link",
    part1: "DOMICILE CERTIFICATE",
    part2: "NATIONALITY CERTIFICATE",
    combined: "DOMICILE AND NATIONALITY CERTIFICATE",
    type: "combined"
  },
  {
    id: "lc-tc-alias",
    part1: "12TH LC",
    part2: "12TH TC",
    combined: "12TH LC",
    type: "alias"
  }
];

export const DEFAULT_CHECKLISTS_DATA = {
  "MAHA DBT": [
    ["PHOTO", ["photo", "pic", "passport photo", "photograph"]],
    ["SIGNATURE", ["signature", "sign", "student sign"]],
    ["AADHAAR CARD", ["aadhaar card", "aadhar", "adhar", "uid"]],
    ["10TH MARKSHEET", ["10th marksheet", "ssc marksheet", "10 mark sheet", "10th mark"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "ssc passing", "10 passing", "10 pasing"]],
    ["10TH MARKSHEET AND PASSING CERTIFICATE", ["10th marksheet and passing certificate", "10th combined", "ssc marksheet passing"]],
    ["12TH MARKSHEET", ["12th marksheet", "hsc marksheet", "12 mark sheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "hsc passing", "12 passing", "12 pasing"]],
    ["12TH MARKSHEET AND PASSING CERTIFICATE", ["12th marksheet and passing certificate", "12th combined", "hsc marksheet passing"]],
    ["12TH LC", ["12th lc", "12 lc", "12 l", "leaving certificate", "school leaving", "tc", "transfer certificate"]],
    ["PREVIOUS YEAR MARKSHEET", ["previous year marksheet", "last exam marksheet", "prev marksheet"]],
    ["CASTE CERTIFICATE", ["caste certificate", "cast", "jati pramanpatra"]],
    ["CASTE VALIDITY CERTIFICATE", ["caste validity certificate", "validity", "cvc", "tribe validity"]],
    ["NON CREAMY LAYER CERTIFICATE", ["non creamy layer", "ncl", "non criminal", "non-creamy"]],
    ["INCOME CERTIFICATE", ["income certificate", "utpanna dakhla", "tahsildar income", "form 16"]],
    ["DOMICILE AND NATIONALITY CERTIFICATE", ["domicile and nationality certificate", "domicile nationality", "nationality domicile", "domicile and nationality", "domnat", "natdom", "dn"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate", "adhiwas", "maharashtra domicile"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate", "rashtriyatva", "nationality proof"]],
    ["RATION CARD", ["ration card", "shidha patrika"]],
    ["BANK PASSBOOK", ["bank passbook", "passbook", "bank account", "npci seeded"]],
    ["CAP ALLOTMENT LETTER", ["cap allotment letter", "admission confirmation letter", "allotment"]],
    ["BONAFIDE CERTIFICATE", ["bonafide certificate", "bonafide", "college bonafide"]],
    ["FEE RECEIPT", ["fee receipt", "admission fee receipt", "tuition fee"]],
    ["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
    ["HOSTEL CERTIFICATE", ["hostel certificate", "rent agreement", "private hostel proof"]],
    ["GAP CERTIFICATE", ["gap certificate", "educational gap", "gap affidavit"]],
    ["SELF DECLARATION", ["self declaration", "swayam ghoshnapatra", "declaration"]],
    ["PARENT DECLARATION", ["parent declaration", "hamipatra", "father declaration"]],
    ["DEATH CERTIFICATE", ["death certificate", "father death certificate", "mrutyu pramanpatra"]]
  ],
  "SWAYAM DEENDAYAL YOJANA": [
    ["PHOTO", ["photo", "pic", "passport photo", "photograph"]],
    ["SIGNATURE", ["signature", "sign", "student sign"]],
    ["AADHAAR CARD", ["aadhaar card", "aadhar", "adhar", "uid"]],
    ["10TH MARKSHEET", ["10th marksheet", "ssc marksheet", "10 mark sheet", "10th mark"]],
    ["10TH MARKSHEET AND PASSING CERTIFICATE", ["10th marksheet and passing certificate", "10th combined", "ssc marksheet passing"]],
    ["12TH MARKSHEET", ["12th marksheet", "hsc marksheet", "12 mark sheet"]],
    ["12TH MARKSHEET AND PASSING CERTIFICATE", ["12th marksheet and passing certificate", "12th combined", "hsc marksheet passing"]],
    ["12TH LC", ["12th lc", "12 lc", "12 l", "leaving certificate", "school leaving", "tc", "transfer certificate"]],
    ["PREVIOUS YEAR MARKSHEET", ["previous year marksheet", "last exam marksheet", "prev marksheet"]],
    ["CASTE CERTIFICATE", ["caste certificate", "cast", "jati pramanpatra"]],
    ["CASTE VALIDITY CERTIFICATE", ["caste validity certificate", "validity", "cvc", "tribe validity"]],
    ["DOMICILE AND NATIONALITY CERTIFICATE", ["domicile and nationality certificate", "domicile nationality", "nationality domicile", "domicile and nationality", "domnat", "natdom", "dn"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate", "adhiwas", "maharashtra domicile"]],
    ["INCOME CERTIFICATE", ["income certificate", "utpanna dakhla", "tahsildar income", "form 16"]],
    ["BANK PASSBOOK", ["bank passbook", "passbook", "bank account", "npci seeded"]],
    ["BONAFIDE CERTIFICATE", ["bonafide certificate", "bonafide", "college bonafide"]],
    ["CAP ALLOTMENT LETTER", ["cap allotment letter", "admission confirmation letter", "allotment"]],
    ["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
    ["HOSTEL CERTIFICATE", ["hostel certificate", "rent agreement", "private hostel proof"]],
    ["NON HOSTEL DECLARATION", ["non hostel declaration", "government hostel non allotment", "warden letter"]],
    ["SELF DECLARATION", ["self declaration", "swayam ghoshnapatra", "declaration"]],
    ["PARENT DECLARATION", ["parent declaration", "hamipatra", "father declaration"]],
    ["DISABILITY CERTIFICATE", ["disability certificate", "divyang", "pwd certificate", "udid"]]
  ],
  "CET CELL": [
    ["PHOTO", ["photo", "pic", "passport photo", "photograph"]],
    ["SIGNATURE", ["signature", "sign", "student sign"]],
    ["AADHAAR CARD", ["aadhaar card", "aadhar", "adhar", "uid"]],
    ["APAAR ID", ["apaar id", "abc id", "academic bank of credits"]],
    ["CET APPLICATION FORM", ["cet application form", "cet application confirmation", "cap registration form"]],
    ["CET SCORE CARD", ["cet score card", "cet result", "scorecard", "neet score card"]],
    ["CAP ALLOTMENT LETTER", ["cap allotment letter", "admission confirmation letter", "allotment"]],
    ["STATUS RETENTION FORM", ["status retention form", "retention form", "cet retention"]],
    ["10TH MARKSHEET", ["10th marksheet", "ssc marksheet", "10 mark sheet", "10th mark"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "ssc passing", "10 passing", "10 pasing"]],
    ["10TH MARKSHEET AND PASSING CERTIFICATE", ["10th marksheet and passing certificate", "10th combined", "ssc marksheet passing"]],
    ["12TH MARKSHEET", ["12th marksheet", "hsc marksheet", "12 mark sheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "hsc passing", "12 passing", "12 pasing"]],
    ["12TH MARKSHEET AND PASSING CERTIFICATE", ["12th marksheet and passing certificate", "12th combined", "hsc marksheet passing"]],
    ["12TH LC", ["12th lc", "12 lc", "12 l", "leaving certificate", "school leaving", "tc", "transfer certificate"]],
    ["DOMICILE AND NATIONALITY CERTIFICATE", ["domicile and nationality certificate", "domicile nationality", "nationality domicile", "domicile and nationality", "domnat", "natdom", "dn"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate", "adhiwas", "maharashtra domicile"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate", "rashtriyatva", "nationality proof"]],
    ["CASTE CERTIFICATE", ["caste certificate", "cast", "jati pramanpatra"]],
    ["CASTE VALIDITY CERTIFICATE", ["caste validity certificate", "validity", "cvc", "tribe validity"]],
    ["NON CREAMY LAYER CERTIFICATE", ["non creamy layer", "ncl", "non criminal", "non-creamy"]],
    ["EWS CERTIFICATE", ["ews certificate", "economically weaker section"]],
    ["INCOME CERTIFICATE", ["income certificate", "utpanna dakhla", "tahsildar income", "form 16"]],
    ["GAP CERTIFICATE", ["gap certificate", "educational gap", "gap affidavit"]],
    ["MIGRATION CERTIFICATE", ["migration certificate", "migration"]],
    ["MEDICAL FITNESS CERTIFICATE", ["medical fitness certificate", "fitness certificate", "health certificate"]],
    ["BIRTH CERTIFICATE", ["birth certificate", "janma dakhla", "dob proof"]]
  ],
  "EDUCATIONAL DOCUMENTS": [
    ["PHOTO", ["photo", "pic", "passport photo", "photograph"]],
    ["SIGNATURE", ["signature", "sign", "student sign"]],
    ["AADHAAR CARD", ["aadhaar card", "aadhar", "adhar", "uid"]],
    ["10TH MARKSHEET", ["10th marksheet", "ssc marksheet", "10 mark sheet", "10th mark"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "ssc passing", "10 passing", "10 pasing"]],
    ["10TH MARKSHEET AND PASSING CERTIFICATE", ["10th marksheet and passing certificate", "10th combined", "ssc marksheet passing"]],
    ["12TH MARKSHEET", ["12th marksheet", "hsc marksheet", "12 mark sheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "hsc passing", "12 passing", "12 pasing"]],
    ["12TH MARKSHEET AND PASSING CERTIFICATE", ["12th marksheet and passing certificate", "12th combined", "hsc marksheet passing"]],
    ["12TH LC", ["12th lc", "12 lc", "12 l", "leaving certificate", "school leaving", "tc", "transfer certificate"]],
    ["PREVIOUS YEAR MARKSHEET", ["previous year marksheet", "last exam marksheet", "prev marksheet"]],
    ["CASTE CERTIFICATE", ["caste certificate", "cast", "jati pramanpatra"]],
    ["CASTE VALIDITY CERTIFICATE", ["caste validity certificate", "validity", "cvc", "tribe validity"]],
    ["NON CREAMY LAYER CERTIFICATE", ["non creamy layer", "ncl", "non criminal", "non-creamy"]],
    ["INCOME CERTIFICATE", ["income certificate", "utpanna dakhla", "tahsildar income", "form 16"]],
    ["DOMICILE AND NATIONALITY CERTIFICATE", ["domicile and nationality certificate", "domicile nationality", "nationality domicile", "domicile and nationality", "domnat", "natdom", "dn"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate", "adhiwas", "maharashtra domicile"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate", "rashtriyatva", "nationality proof"]],
    ["RATION CARD", ["ration card", "shidha patrika"]],
    ["BANK PASSBOOK", ["bank passbook", "passbook", "bank account", "npci seeded"]],
    ["CAP ALLOTMENT LETTER", ["cap allotment letter", "admission confirmation letter", "allotment"]],
    ["BONAFIDE CERTIFICATE", ["bonafide certificate", "bonafide", "college bonafide"]],
    ["FEE RECEIPT", ["fee receipt", "admission fee receipt", "tuition fee"]],
    ["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
    ["HOSTEL CERTIFICATE", ["hostel certificate", "rent agreement", "private hostel proof"]],
    ["GAP CERTIFICATE", ["gap certificate", "educational gap", "gap affidavit"]],
    ["SELF DECLARATION", ["self declaration", "swayam ghoshnapatra", "declaration"]],
    ["PARENT DECLARATION", ["parent declaration", "hamipatra", "father declaration"]],
    ["DEATH CERTIFICATE", ["death certificate", "father death certificate", "mrutyu pramanpatra"]],
    ["NON HOSTEL DECLARATION", ["non hostel declaration", "government hostel non allotment", "warden letter"]],
    ["DISABILITY CERTIFICATE", ["disability certificate", "divyang", "pwd certificate", "udid"]],
    ["APAAR ID", ["apaar id", "abc id", "academic bank of credits"]],
    ["CET APPLICATION FORM", ["cet application form", "cet application confirmation", "cap registration form"]],
    ["CET SCORE CARD", ["cet score card", "cet result", "scorecard", "neet score card"]],
    ["STATUS RETENTION FORM", ["status retention form", "retention form", "cet retention"]],
    ["EWS CERTIFICATE", ["ews certificate", "economically weaker section"]],
    ["MIGRATION CERTIFICATE", ["migration certificate", "migration"]],
    ["MEDICAL FITNESS CERTIFICATE", ["medical fitness certificate", "fitness certificate", "health certificate"]],
    ["BIRTH CERTIFICATE", ["birth certificate", "janma dakhla", "dob proof"]],
    ["PAN CARD", ["pan card", "permanent account number"]],
    ["VOTER ID", ["voter id", "election card", "epic"]],
    ["DRIVING LICENSE", ["driving license", "dl", "licence"]],
    ["11TH MARKSHEET", ["11th marksheet", "11th mark"]],
    ["1ST YEAR MARKSHEET", ["1st year marksheet", "first year marksheet", "fy marksheet", "sem 1", "sem 2"]],
    ["2ND YEAR MARKSHEET", ["2nd year marksheet", "second year marksheet", "sy marksheet", "sem 3", "sem 4"]],
    ["3RD YEAR MARKSHEET", ["3rd year marksheet", "third year marksheet", "ty marksheet", "sem 5", "sem 6"]],
    ["4TH YEAR MARKSHEET", ["4th year marksheet", "fourth year marksheet", "final year marksheet"]],
    ["PASSING CERTIFICATE", ["passing certificate", "degree passing", "diploma passing", "provisional certificate"]],
    ["DEGREE CERTIFICATE", ["degree certificate", "convocation certificate", "diploma certificate"]],
    ["REGISTRATION CERTIFICATE", ["registration certificate", "council registration", "mnc registration", "nursing registration"]],
    ["INTERNSHIP CERTIFICATE", ["internship certificate", "internship completion", "clinical experience"]],
    ["CHARACTER CERTIFICATE", ["character certificate", "conduct certificate", "charitra dakhla"]],
    ["GAZETTE CERTIFICATE", ["gazette certificate", "name change gazette", "rajpatra", "marriage certificate"]],
    ["MINORITY CERTIFICATE", ["minority certificate", "minority declaration", "alpsankhyank pramanpatra", "minority proof"]]
  ]
};
// Backward-compatibility aliases
DEFAULT_CHECKLISTS_DATA["MAHA DBT FORM"] = DEFAULT_CHECKLISTS_DATA["MAHA DBT"];
DEFAULT_CHECKLISTS_DATA["SWAYAM"] = DEFAULT_CHECKLISTS_DATA["SWAYAM DEENDAYAL YOJANA"];
DEFAULT_CHECKLISTS_DATA["SWAYAM FORM"] = DEFAULT_CHECKLISTS_DATA["SWAYAM DEENDAYAL YOJANA"];
DEFAULT_CHECKLISTS_DATA["EDUCATIONAL"] = DEFAULT_CHECKLISTS_DATA["EDUCATIONAL DOCUMENTS"];

/* ==========================================================================
   2. Shortcut Keyword Dictionary & Matching
   ========================================================================== */

export const DEFAULT_SHORTCUT_DICTIONARY = [
  { id: "photo", displayName: "PHOTO", primaryShortcut: "PIC", alternateShortcuts: ["PHO"], alternateKeywords: ["photo", "pic", "passport photo", "photograph"], outputName: "PHOTO" },
  { id: "signature", displayName: "Signature", primaryShortcut: "SIG", alternateShortcuts: ["SIGN"], alternateKeywords: ["signature", "sign", "student sign"], outputName: "SIGNATURE" },
  { id: "aadhaar-card", displayName: "Aadhaar Card", primaryShortcut: "ADR", alternateShortcuts: ["ADH", "UID"], alternateKeywords: ["aadhaar card", "aadhar", "adhar", "uid"], outputName: "AADHAAR CARD" },
  { id: "10th-marksheet", displayName: "10th Marksheet", primaryShortcut: "10M", alternateKeywords: ["10th marksheet", "ssc marksheet", "10 mark sheet", "10th mark"], outputName: "10TH MARKSHEET" },
  { id: "10th-passing", displayName: "10th Passing Certificate", primaryShortcut: "10P", alternateKeywords: ["10th passing certificate", "ssc passing", "10 passing", "10 pasing"], outputName: "10TH PASSING CERTIFICATE" },
  { id: "10th-marksheet-passing", displayName: "10th Marksheet & Passing", primaryShortcut: "10MP", alternateKeywords: ["10th marksheet and passing certificate", "10th combined", "ssc marksheet passing"], outputName: "10TH MARKSHEET AND PASSING CERTIFICATE" },
  { id: "12th-marksheet", displayName: "12th Marksheet", primaryShortcut: "12M", alternateKeywords: ["12th marksheet", "hsc marksheet", "12 mark sheet"], outputName: "12TH MARKSHEET" },
  { id: "12th-passing", displayName: "12th Passing Certificate", primaryShortcut: "12P", alternateKeywords: ["12th passing certificate", "hsc passing", "12 passing", "12 pasing"], outputName: "12TH PASSING CERTIFICATE" },
  { id: "12th-marksheet-passing", displayName: "12th Marksheet & Passing", primaryShortcut: "12MP", alternateKeywords: ["12th marksheet and passing certificate", "12th combined", "hsc marksheet passing"], outputName: "12TH MARKSHEET AND PASSING CERTIFICATE" },
  { id: "12th-lc", displayName: "12th LC", primaryShortcut: "12LC", alternateKeywords: ["12th lc", "12 lc", "12 l", "leaving certificate", "school leaving", "tc", "transfer certificate"], outputName: "12TH LC" },
  { id: "previous-year-marksheet", displayName: "Previous Year Marksheet", primaryShortcut: "PYM", alternateKeywords: ["previous year marksheet", "last exam marksheet", "prev marksheet"], outputName: "PREVIOUS YEAR MARKSHEET" },
  { id: "caste-certificate", displayName: "Caste Certificate", primaryShortcut: "CST", alternateShortcuts: ["CAST", "JATI"], alternateKeywords: ["caste certificate", "cast", "jati pramanpatra"], outputName: "CASTE CERTIFICATE" },
  { id: "caste-validity", displayName: "Caste Validity Certificate", primaryShortcut: "VAL", alternateShortcuts: ["VLD", "CVC"], alternateKeywords: ["caste validity certificate", "validity", "cvc", "vld", "tribe validity"], outputName: "CASTE VALIDITY CERTIFICATE" },
  { id: "non-creamy-layer", displayName: "Non Creamy Layer Certificate", primaryShortcut: "NCL", alternateKeywords: ["non creamy layer", "ncl", "non criminal", "non-creamy"], outputName: "NON CREAMY LAYER CERTIFICATE" },
  { id: "income-certificate", displayName: "Income Certificate", primaryShortcut: "INC", alternateKeywords: ["income certificate", "utpanna dakhla", "tahsildar income", "form 16"], outputName: "INCOME CERTIFICATE" },
  { id: "domicile-certificate", displayName: "Domicile Certificate", primaryShortcut: "DOM", alternateKeywords: ["domicile certificate", "adhiwas", "maharashtra domicile"], outputName: "DOMICILE CERTIFICATE" },
  { id: "nationality-certificate", displayName: "Nationality Certificate", primaryShortcut: "NAT", alternateKeywords: ["nationality certificate", "rashtriyatva", "nationality proof"], outputName: "NATIONALITY CERTIFICATE" },
  { id: "domicile-nationality-certificate", displayName: "Domicile & Nationality", primaryShortcut: "DOMNAT", alternateKeywords: ["domicile and nationality certificate", "domicile nationality", "nationality domicile", "domicile and nationality", "dn", "natdom"], outputName: "DOMICILE AND NATIONALITY CERTIFICATE" },
  { id: "ration-card", displayName: "Ration Card", primaryShortcut: "RAT", alternateKeywords: ["ration card", "shidha patrika"], outputName: "RATION CARD" },
  { id: "bank-passbook", displayName: "Bank Passbook", primaryShortcut: "BNK", alternateKeywords: ["bank passbook", "passbook", "bank account", "npci seeded"], outputName: "BANK PASSBOOK" },
  { id: "cap-allotment", displayName: "CAP Allotment Letter", primaryShortcut: "CAP", alternateKeywords: ["cap allotment letter", "admission confirmation letter", "allotment"], outputName: "CAP ALLOTMENT LETTER" },
  { id: "bonafide-certificate", displayName: "Bonafide Certificate", primaryShortcut: "BON", alternateKeywords: ["bonafide certificate", "bonafide", "college bonafide"], outputName: "BONAFIDE CERTIFICATE" },
  { id: "fee-receipt", displayName: "Fee Receipt", primaryShortcut: "FEE", alternateKeywords: ["fee receipt", "admission fee receipt", "tuition fee"], outputName: "FEE RECEIPT" },
  { id: "attendance-certificate", displayName: "Attendance Certificate", primaryShortcut: "ATT", alternateKeywords: ["attendance certificate", "college attendance"], outputName: "ATTENDANCE CERTIFICATE" },
  { id: "hostel-certificate", displayName: "Hostel Certificate", primaryShortcut: "HST", alternateKeywords: ["hostel certificate", "rent agreement", "private hostel proof"], outputName: "HOSTEL CERTIFICATE" },
  { id: "gap-certificate", displayName: "Gap Certificate", primaryShortcut: "GAP", alternateKeywords: ["gap certificate", "educational gap", "gap affidavit"], outputName: "GAP CERTIFICATE" },
  { id: "self-declaration", displayName: "Self Declaration", primaryShortcut: "SDC", alternateKeywords: ["self declaration", "swayam ghoshnapatra", "declaration"], outputName: "SELF DECLARATION" },
  { id: "parent-declaration", displayName: "Parent Declaration", primaryShortcut: "PDC", alternateKeywords: ["parent declaration", "hamipatra", "father declaration"], outputName: "PARENT DECLARATION" },
  { id: "death-certificate", displayName: "Death Certificate", primaryShortcut: "DTH", alternateKeywords: ["death certificate", "father death certificate", "mrutyu pramanpatra"], outputName: "DEATH CERTIFICATE" },
  { id: "non-hostel-declaration", displayName: "Non Hostel Declaration", primaryShortcut: "NHC", alternateKeywords: ["non hostel declaration", "government hostel non allotment", "warden letter"], outputName: "NON HOSTEL DECLARATION" },
  { id: "disability-certificate", displayName: "Disability Certificate", primaryShortcut: "DIS", alternateKeywords: ["disability certificate", "divyang", "pwd certificate", "udid"], outputName: "DISABILITY CERTIFICATE" },
  { id: "apaar-id", displayName: "APAAR ID", primaryShortcut: "APR", alternateKeywords: ["apaar id", "abc id", "academic bank of credits"], outputName: "APAAR ID" },
  { id: "cet-application-form", displayName: "CET Application Form", primaryShortcut: "CETAF", alternateKeywords: ["cet application form", "cet application confirmation", "cap registration form"], outputName: "CET APPLICATION FORM" },
  { id: "cet-score-card", displayName: "CET Score Card", primaryShortcut: "CETSC", alternateKeywords: ["cet score card", "cet result", "scorecard", "neet score card"], outputName: "CET SCORE CARD" },
  { id: "status-retention-form", displayName: "Status Retention Form", primaryShortcut: "SRF", alternateKeywords: ["status retention form", "retention form", "cet retention"], outputName: "STATUS RETENTION FORM" },
  { id: "ews-certificate", displayName: "EWS Certificate", primaryShortcut: "EWS", alternateKeywords: ["ews certificate", "economically weaker section"], outputName: "EWS CERTIFICATE" },
  { id: "migration-certificate", displayName: "Migration Certificate", primaryShortcut: "MIG", alternateKeywords: ["migration certificate", "migration"], outputName: "MIGRATION CERTIFICATE" },
  { id: "medical-fitness", displayName: "Medical Fitness Certificate", primaryShortcut: "MED", alternateKeywords: ["medical fitness certificate", "fitness certificate", "health certificate"], outputName: "MEDICAL FITNESS CERTIFICATE" },
  { id: "birth-certificate", displayName: "Birth Certificate", primaryShortcut: "BRT", alternateKeywords: ["birth certificate", "janma dakhla", "dob proof"], outputName: "BIRTH CERTIFICATE" },
  { id: "pan-card", displayName: "PAN Card", primaryShortcut: "PAN", alternateKeywords: ["pan card", "permanent account number"], outputName: "PAN CARD" },
  { id: "voter-id", displayName: "Voter ID", primaryShortcut: "VOT", alternateKeywords: ["voter id", "election card", "epic"], outputName: "VOTER ID" },
  { id: "driving-license", displayName: "Driving License", primaryShortcut: "DL", alternateKeywords: ["driving license", "dl", "licence"], outputName: "DRIVING LICENSE" },
  { id: "11th-marksheet", displayName: "11th Marksheet", primaryShortcut: "11M", alternateKeywords: ["11th marksheet", "11th mark"], outputName: "11TH MARKSHEET" },
  { id: "1st-year-marksheet", displayName: "1st Year Marksheet", primaryShortcut: "1YM", alternateKeywords: ["1st year marksheet", "first year marksheet", "fy marksheet", "sem 1", "sem 2"], outputName: "1ST YEAR MARKSHEET" },
  { id: "2nd-year-marksheet", displayName: "2nd Year Marksheet", primaryShortcut: "2YM", alternateKeywords: ["2nd year marksheet", "second year marksheet", "sy marksheet", "sem 3", "sem 4"], outputName: "2ND YEAR MARKSHEET" },
  { id: "3rd-year-marksheet", displayName: "3rd Year Marksheet", primaryShortcut: "3YM", alternateKeywords: ["3rd year marksheet", "third year marksheet", "ty marksheet", "sem 5", "sem 6"], outputName: "3RD YEAR MARKSHEET" },
  { id: "4th-year-marksheet", displayName: "4th Year Marksheet", primaryShortcut: "4YM", alternateKeywords: ["4th year marksheet", "fourth year marksheet", "final year marksheet"], outputName: "4TH YEAR MARKSHEET" },
  { id: "passing-certificate", displayName: "Passing Certificate", primaryShortcut: "DPC", alternateKeywords: ["passing certificate", "degree passing", "diploma passing", "provisional certificate"], outputName: "PASSING CERTIFICATE" },
  { id: "degree-certificate", displayName: "Degree Certificate", primaryShortcut: "DEG", alternateKeywords: ["degree certificate", "convocation certificate", "diploma certificate"], outputName: "DEGREE CERTIFICATE" },
  { id: "registration-certificate", displayName: "Registration Certificate", primaryShortcut: "REG", alternateKeywords: ["registration certificate", "council registration", "mnc registration", "nursing registration"], outputName: "REGISTRATION CERTIFICATE" },
  { id: "internship-certificate", displayName: "Internship Certificate", primaryShortcut: "INT", alternateKeywords: ["internship certificate", "internship completion", "clinical experience"], outputName: "INTERNSHIP CERTIFICATE" },
  { id: "character-certificate", displayName: "Character Certificate", primaryShortcut: "CHR", alternateKeywords: ["character certificate", "conduct certificate", "charitra dakhla"], outputName: "CHARACTER CERTIFICATE" },
  { id: "gazette-certificate", displayName: "Gazette Certificate", primaryShortcut: "GAZ", alternateKeywords: ["gazette certificate", "name change gazette", "rajpatra", "marriage certificate"], outputName: "GAZETTE CERTIFICATE" },
  { id: "minority-certificate", displayName: "Minority Certificate", primaryShortcut: "MIN", alternateKeywords: ["minority certificate", "minority declaration", "alpsankhyank pramanpatra", "minority proof"], outputName: "MINORITY CERTIFICATE" }
];

export function exportDictionaryToGroups(dictionary = DEFAULT_SHORTCUT_DICTIONARY) {
  const groups = {};
  for (const item of dictionary) {
    const keywords = [item.primaryShortcut.toLowerCase()];
    if (item.alternateKeywords && Array.isArray(item.alternateKeywords)) {
      for (const kw of item.alternateKeywords) {
        if (kw && typeof kw === 'string') {
          keywords.push(kw.trim().toLowerCase());
        }
      }
    }
    groups[item.outputName] = keywords;
  }
  return groups;
}

export function getActiveShortcutDictionary(groups = null) {
  if (!groups) return DEFAULT_SHORTCUT_DICTIONARY;
  return DEFAULT_SHORTCUT_DICTIONARY.map(item => {
    const customList = groups[item.outputName];
    if (customList && Array.isArray(customList) && customList.length > 0) {
      return {
        ...item,
        primaryShortcut: customList[0].toUpperCase(),
        alternateKeywords: customList.slice(1)
      };
    }
    return item;
  });
}

export function findKeywordConflict(keyword, targetRuleName, groups) {
  const cleanKeyword = (keyword || '').toLowerCase().trim();
  if (!cleanKeyword) return null;
  const activeDict = getActiveShortcutDictionary(groups);
  for (const item of activeDict) {
    if (item.outputName === targetRuleName) continue;
    if (item.primaryShortcut.toLowerCase() === cleanKeyword) {
      return { conflictingRule: item.outputName, keyword: item.primaryShortcut };
    }
    if (item.alternateKeywords && item.alternateKeywords.map(k => k.toLowerCase()).includes(cleanKeyword)) {
      return { conflictingRule: item.outputName, keyword: cleanKeyword };
    }
  }
  return null;
}

export const INDIAN_ACADEMIC_SYNONYMS = {
  // Academic levels
  '10th': ['ssc', '10', 'matric', 'matriculation', '10th class', 'class 10'],
  'ssc': ['10th', '10', 'matric', 'matriculation'],
  '12th': ['hsc', '12', 'inter', 'intermediate', '12th class', 'class 12'],
  'hsc': ['12th', '12', 'inter', 'intermediate'],
  '11th': ['11', 'fyjc'],
  'marksheet': ['mark sheet', 'marks', 'mark', 'result', 'score card', 'grade card'],
  'passing': ['passing certificate', 'pass cert', 'passing cert', 'pass certificate', 'sanad', 'board cert'],
  'lc': ['leaving certificate', 'school leaving', 'tc', 'transfer certificate', 'college leaving', 'leaving'],
  'tc': ['transfer certificate', 'leaving certificate', 'lc', 'school leaving'],
  // Caste & Validity
  'caste': ['cast', 'jati', 'samaj', 'jati pramanpatra'],
  'validity': ['caste validity', 'cvc', 'validity certificate', 'padtalani', 'padtalani pramanpatra'],
  'non creamy': ['ncl', 'non creamy layer', 'non criminal', 'non-creamy', 'unnath va pragat'],
  'ncl': ['non creamy layer', 'non creamy', 'non criminal'],
  // Income & Domicile
  'income': ['utpanna', 'utpanna dakhla', 'tahsildar income', 'form 16', 'salary slip', 'income cert'],
  'domicile': ['adhivas', 'rehivasi', 'domicile cert', 'residence', 'residence certificate', 'maharashtra domicile'],
  'nationality': ['rashtriyatva', 'indian nationality', 'nationality cert', 'citizenship'],
  // Identity & Bio
  'aadhaar': ['aadhar', 'aadhar card', 'adhar', 'adhaar', 'uid', 'uidai', 'adhar card'],
  'pan': ['pan card', 'pancard', 'income tax pan'],
  'voter': ['voter card', 'voting card', 'epic', 'election card', 'matdar card'],
  'driving': ['driving license', 'license', 'dl', 'vehicle license'],
  'photo': ['photo', 'photograph', 'passport photo', 'pass photo', 'pic', 'profile photo'],
  'signature': ['sign', 'signature', 'student signature', 'st sign', 'sig'],
  // Bonafide, Declarations, Welfare
  'bonafide': ['bonafide certificate', 'bona fide', 'college bonafide'],
  'gap': ['gap certificate', 'gap affidavit', 'shikshanit khand'],
  'self declaration': ['self declaration', 'self declaration certificate', 'swayam ghoshana', 'sdc'],
  'parent declaration': ['parent declaration', 'parents declaration', 'palak ghoshana', 'pdc'],
  'death': ['death certificate', 'mrutyu dakhla'],
  'disability': ['disability certificate', 'handicapped', 'divyang', 'pwd certificate', 'apang', 'pwd'],
  'ews': ['economically weaker section', 'ews certificate', 'arthik durbal ghatak'],
  'migration': ['migration certificate', 'migration cert'],
  'medical': ['medical fitness', 'fitness certificate', 'arogya dakhla'],
  'birth': ['birth certificate', 'janam dakhla', 'janma pramanpatra'],
  'ration': ['ration card', 'rationcard', 'ration book', 'rasan kard'],
  'bank': ['bank passbook', 'passbook', 'account statement', 'bank statement'],
  // CET / Higher Ed
  'cetaf': ['cet application form', 'application form', 'cet form'],
  'cetsc': ['cet score card', 'cet result', 'cet marksheet', 'mht cet score card'],
  'cap': ['cap allotment', 'allotment letter', 'cap round allotment'],
  'srf': ['scrutiny form', 'fc verification', 'document verification receipt'],
  'fee': ['fee receipt', 'fees', 'receipt', 'admission fee receipt'],
  'attendance': ['attendance certificate', 'attendance report'],
  'hostel': ['hostel certificate', 'hostel receipt', 'vasatigruh dakhla']
};

// Choice 1-A: Generic Administrative Stop-Words that must NEVER match as standalone keywords
export const GENERIC_STOP_KEYWORDS = new Set([
  'certificate', 'pramanpatra', 'dakhla', 'sanad', 'patrika', 'card', 'kard',
  'doc', 'document', 'paper', 'form', 'letter', 'receipt', 'praman', 'patra'
]);

export function generateSmartKeywords(docName, shortCodes = []) {
  if (!docName || typeof docName !== 'string') return '';
  const raw = docName.toLowerCase().trim().replace(/[^a-z0-9\s_-]/g, ' ');
  const words = raw.split(/[\s_-]+/).filter(w => w.length > 0);
  if (words.length === 0) return '';

  const results = new Set();

  // 1. Full clean base name
  const cleanBase = words.join(' ');
  results.add(cleanBase);

  // 2. Add short codes (lowercase)
  if (Array.isArray(shortCodes)) {
    for (const sc of shortCodes) {
      if (sc && typeof sc === 'string') {
        const c = sc.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (c.length >= 2 && !GENERIC_STOP_KEYWORDS.has(c)) results.add(c);
      }
    }
  }

  // 3. Document-specific phrase synonyms (e.g. LC -> leaving certificate, tc, transfer certificate)
  for (const [key, synList] of Object.entries(INDIAN_ACADEMIC_SYNONYMS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(cleanBase)) {
      for (const syn of synList) {
        results.add(cleanBase.replace(regex, syn));
        if (words.length <= 4) {
          const synClean = syn.trim().toLowerCase();
          if (!GENERIC_STOP_KEYWORDS.has(synClean)) {
            results.add(syn);
          }
        }
      }
    }
  }

  // 4. Number + TH permutations (e.g. 10th / 10, 12th / 12)
  if (cleanBase.includes('10th')) {
    results.add(cleanBase.replace(/\b10th\b/g, '10'));
    results.add(cleanBase.replace(/\b10th\b/g, 'ssc'));
  } else if (cleanBase.includes('10')) {
    results.add(cleanBase.replace(/\b10\b/g, '10th'));
    results.add(cleanBase.replace(/\b10\b/g, 'ssc'));
  }

  if (cleanBase.includes('12th')) {
    results.add(cleanBase.replace(/\b12th\b/g, '12'));
    results.add(cleanBase.replace(/\b12th\b/g, 'hsc'));
  } else if (cleanBase.includes('12')) {
    results.add(cleanBase.replace(/\b12\b/g, '12th'));
    results.add(cleanBase.replace(/\b12\b/g, 'hsc'));
  }

  // Marksheet variations (e.g. "12th marksheet" -> "12th mark", "12 mark", "hsc mark", "marksheet 12th")
  if (cleanBase.includes('marksheet')) {
    results.add(cleanBase.replace(/\bmarksheet\b/g, 'mark'));
    results.add(cleanBase.replace(/\bmarksheet\b/g, 'mark sheet'));
    if (words.length >= 2) {
      results.add(`${words[words.length - 1]} ${words.slice(0, -1).join(' ')}`);
    }
  }

  // Passing certificate variations
  if (cleanBase.includes('passing certificate')) {
    results.add(cleanBase.replace(/\bpassing certificate\b/g, 'passing'));
    results.add(cleanBase.replace(/\bpassing certificate\b/g, 'pass cert'));
  }

  // 5. Common Indian phonetic spelling variations & typos (Decision 4-A: Balanced Smart Pool)
  if (cleanBase.includes('caste')) {
    results.add('kcast');
    results.add('kast');
    results.add('cst');
  }
  if (cleanBase.includes('certificate')) {
    results.add(cleanBase.replace(/\bcertificate\b/g, 'sartificat'));
    results.add(cleanBase.replace(/\bcertificate\b/g, 'certi'));
    results.add(cleanBase.replace(/\bcertificate\b/g, 'dakhla'));
  }
  if (cleanBase.includes('domicile')) {
    results.add('domisail');
    results.add('domicil');
    results.add('rehivasi');
  }
  if (cleanBase.includes('income')) {
    results.add('incom');
    results.add('utpanna');
    results.add('utpanna dakhla');
  }
  if (cleanBase.includes('non creamy')) {
    results.add('non crimiler');
    results.add('non criminal');
  }
  if (cleanBase.includes('marksheet')) {
    results.add(cleanBase.replace(/\bmarksheet\b/g, 'markshit'));
  }
  if (cleanBase.includes('aadhaar')) {
    results.add('adhar');
    results.add('aadhar');
    results.add('adhaar');
  }
  if (cleanBase.includes('photo')) {
    results.add('foto');
  }
  if (cleanBase.includes('bonafide')) {
    results.add('bonafaid');
    results.add('bonfide');
  }

  // 6. Individual meaningful words (Strictly excluding generic stop-words)
  for (const w of words) {
    if (w.length >= 3 && !['and', 'for', 'the', 'from', 'with'].includes(w) && !GENERIC_STOP_KEYWORDS.has(w)) {
      results.add(w);
    }
  }

  // Clean, trim, unique and format as comma-separated string
  const cleanTokens = Array.from(results)
    .map(s => s.trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, '').replace(/\s+/g, ' '))
    .filter(s => s.length >= 2 && !GENERIC_STOP_KEYWORDS.has(s));

  return Array.from(new Set(cleanTokens)).slice(0, 25).join(', ');
}

export function matchDocument(input, groups = null) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.toLowerCase().trim();
  if (!clean) return null;
  const compact = clean.replace(/\s+/g, '');

  const activeDict = getActiveShortcutDictionary(groups);

  // Exact match against primary shortcut
  for (const item of activeDict) {
    const sc = item.primaryShortcut.toLowerCase();
    if (clean === sc || (compact.length >= 2 && compact.length <= 6 && compact === sc)) {
      return item.outputName;
    }
  }

  // Exact match against alternate keywords
  for (const item of activeDict) {
    if (item.alternateKeywords) {
      for (const alt of item.alternateKeywords) {
        const altClean = alt.toLowerCase().trim();
        const altCompact = altClean.replace(/\s+/g, '');
        if (clean === altClean || (compact.length >= 2 && compact === altCompact)) {
          return item.outputName;
        }
      }
    }
  }

  // Word-boundary match
  for (const item of activeDict) {
    const sc = item.primaryShortcut.toLowerCase();
    const pattern = new RegExp(`(^|[^a-z0-9])${sc}([^a-z0-9]|$)`, 'i');
    if (pattern.test(clean) || (compact.length >= 2 && compact.length <= 6 && pattern.test(compact))) {
      return item.outputName;
    }
    if (item.alternateKeywords) {
      for (const alt of item.alternateKeywords) {
        const altClean = alt.toLowerCase().trim();
        const altPattern = new RegExp(`(^|[^a-z0-9])${altClean}([^a-z0-9]|$)`, 'i');
        if (altPattern.test(clean)) {
          return item.outputName;
        }
      }
    }
  }

  return null;
}

export function getMatchingSuggestions(query = '', groups = null, limit = 5) {
  const activeDict = getActiveShortcutDictionary(groups);
  const q = (query || '').toLowerCase().trim();

  if (!q) {
    return activeDict.slice(0, limit);
  }

  const exact = [];
  const prefix = [];
  const contains = [];

  for (const item of activeDict) {
    const code = item.primaryShortcut.toLowerCase();
    const name = item.displayName.toLowerCase();
    const out = item.outputName.toLowerCase();

    if (code === q) {
      exact.push(item);
    } else if (code.startsWith(q) || name.startsWith(q)) {
      prefix.push(item);
    } else if (code.includes(q) || name.includes(q) || out.includes(q)) {
      contains.push(item);
    }
  }

  return [...exact, ...prefix, ...contains].slice(0, limit);
}

/* ==========================================================================
   3. Document Pattern Matching Engine
   ========================================================================== */

export const DOCUMENT_PATTERNS = [
  {
    id: "12th-marksheet-passing-combined",
    outputName: "12TH MARKSHEET AND PASSING CERTIFICATE",
    shortcut: "12MP",
    patterns: [
      /\b12mp\b/i,
      /\b12tmp\b/i,
      /\b12(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
      /\b12(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
      /\b12(th)?\s*combined\b/i
    ]
  },
  {
    id: "10th-marksheet-passing-combined",
    outputName: "10TH MARKSHEET AND PASSING CERTIFICATE",
    shortcut: "10MP",
    patterns: [
      /\b10mp\b/i,
      /\b10tmp\b/i,
      /\b10(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
      /\b10(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
      /\b10(th)?\s*combined\b/i
    ]
  },
  {
    id: "12th-lc",
    outputName: "12TH LC",
    shortcut: "12LC",
    patterns: [
      /\b12lc\b/i,
      /\b12(th)?\s*lc\b/i,
      /\b12(th)?\s*leaving\b/i,
      /\b12(th)?\s*tc\b/i,
      /\bhsc\s*lc\b/i,
      /\bhsc\s*leaving\b/i
    ]
  },
  {
    id: "12th-marksheet",
    outputName: "12TH MARKSHEET",
    shortcut: "12M",
    patterns: [
      /\b12m\b/i,
      /\b12(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
      /\bhsc\s*(mark|marksheet|mark-sheet)\b/i
    ]
  },
  {
    id: "12th-passing",
    outputName: "12TH PASSING CERTIFICATE",
    shortcut: "12P",
    patterns: [
      /\b12p\b/i,
      /\b12(th)?\s*(pass|passing|board|sanad)\b/i,
      /\bhsc\s*(pass|passing|board|sanad)\b/i
    ]
  },
  {
    id: "10th-lc",
    outputName: "10TH LC",
    shortcut: "10LC",
    patterns: [
      /\b10lc\b/i,
      /\b10(th)?\s*lc\b/i,
      /\b10(th)?\s*leaving\b/i,
      /\b10(th)?\s*tc\b/i,
      /\bssc\s*lc\b/i,
      /\bssc\s*leaving\b/i
    ]
  },
  {
    id: "10th-marksheet",
    outputName: "10TH MARKSHEET",
    shortcut: "10M",
    patterns: [
      /\b10m\b/i,
      /\b10(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
      /\bssc\s*(mark|marksheet|mark-sheet)\b/i
    ]
  },
  {
    id: "10th-passing",
    outputName: "10TH PASSING CERTIFICATE",
    shortcut: "10P",
    patterns: [
      /\b10p\b/i,
      /\b10(th)?\s*(pass|passing|board|sanad)\b/i,
      /\bssc\s*(pass|passing|board|sanad)\b/i
    ]
  },
  {
    id: "aadhaar-card",
    outputName: "AADHAAR CARD",
    shortcut: "ADR",
    patterns: [
      /\badr\b/i,
      /\baadhar\b/i,
      /\baadhaar\b/i,
      /\badhar\b/i,
      /\buidai\b/i,
      /\be-?aadhaar\b/i
    ]
  },
  {
    id: "pan-card",
    outputName: "PAN CARD",
    shortcut: "PAN",
    patterns: [
      /\bpan\b/i,
      /\bpancard\b/i,
      /\bnsdl\b/i,
      /\butiitsl\b/i
    ]
  },
  {
    id: "photo",
    outputName: "PHOTO",
    shortcut: "PIC",
    patterns: [
      /\bpic\b/i,
      /\bphoto\b/i,
      /\bphotograph\b/i,
      /\bpassport_?size\b/i,
      /\bimage\b/i
    ]
  },
  {
    id: "signature",
    outputName: "SIGNATURE",
    shortcut: "SIG",
    patterns: [
      /\bsig\b/i,
      /\bsign\b/i,
      /\bsignature\b/i,
      /\bstudent\s*sign\b/i,
      /\bsahi\b/i
    ]
  },
  {
    id: "caste-validity",
    outputName: "CASTE VALIDITY CERTIFICATE",
    shortcut: "VAL",
    patterns: [
      /\bval\b/i,
      /\bvld\b/i,
      /\bvalidity\b/i,
      /\bvaliditi\b/i,
      /\b(caste?|cast|kast)\s*validit/i,
      /\bcvc\b/i,
      /\btribe\s*validity\b/i,
      /\bpadtalni\b/i
    ]
  },
  {
    id: "caste-certificate",
    outputName: "CASTE CERTIFICATE",
    shortcut: "CST",
    patterns: [
      /\bcst\b/i,
      /\bcas\b/i,
      /\bcaste\b(?!.*validit)/i,
      /\bcast\b(?!.*validit)/i,
      /\bjati\b(?!.*validit)/i,
      /\bjati\s*pramanpatra\b/i,
      /\bcategory\b/i
    ]
  },
  {
    id: "non-creamy-layer",
    outputName: "NON CREAMY LAYER CERTIFICATE",
    shortcut: "NCL",
    patterns: [
      /\bncl\b/i,
      /\bnon\s*creamy\b/i,
      /\bnon\s*criminal\b/i,
      /\bnon-creamy\b/i,
      /\bcreamy\s*layer\b/i
    ]
  },
  {
    id: "income-certificate",
    outputName: "INCOME CERTIFICATE",
    shortcut: "INC",
    patterns: [
      /\binc\b/i,
      /\bincome\b/i,
      /\butpann\b/i,
      /\butpanna\s*dakhla\b/i,
      /\btahsildar\s*income\b/i,
      /\bform\s*16\b/i,
      /\btahsildar\b/i
    ]
  },
  {
    id: "domicile-nationality-certificate",
    outputName: "DOMICILE AND NATIONALITY CERTIFICATE",
    shortcut: "DOMNAT",
    patterns: [
      /\bdomnat\b/i,
      /\bnatdom\b/i,
      /\bdomicile\s*(and|&)\s*nationality\b/i,
      /\bnationality\s*(and|&)\s*domicile\b/i,
      /\bage\s*nationality\s*(and|&)\s*domicile\b/i
    ]
  },
  {
    id: "domicile-certificate",
    outputName: "DOMICILE CERTIFICATE",
    shortcut: "DOM",
    patterns: [
      /\bdom\b/i,
      /\bdomicile\b/i,
      /\badhivasa?\b/i,
      /\bmaharashtra\s*domicile\b/i,
      /\bnivas\b/i
    ]
  },
  {
    id: "nationality-certificate",
    outputName: "NATIONALITY CERTIFICATE",
    shortcut: "NAT",
    patterns: [
      /\bnat\b/i,
      /\bnationality\b/i,
      /\brashtriyatva\b/i,
      /\bnationality\s*proof\b/i
    ]
  },
  {
    id: "ration-card",
    outputName: "RATION CARD",
    shortcut: "RAT",
    patterns: [
      /\brat\b/i,
      /\bration\b/i,
      /\bration\s*card\b/i,
      /\bshidha\s*patrika\b/i,
      /\bshidori\b/i
    ]
  },
  {
    id: "bank-passbook",
    outputName: "BANK PASSBOOK",
    shortcut: "BNK",
    patterns: [
      /\bbnk\b/i,
      /\bpassbook\b/i,
      /\bbank\s*passbook\b/i,
      /\bbank\s*account\b/i,
      /\bnpci\s*seeded\b/i,
      /\bbank\b/i,
      /\bstatement\b/i,
      /\bcheque\b/i
    ]
  },
  {
    id: "cap-allotment",
    outputName: "CAP ALLOTMENT LETTER",
    shortcut: "CAP",
    patterns: [
      /\bcap\b/i,
      /\ballotment\b/i,
      /\bcap\s*allotment\b/i,
      /\badmission\s*confirmation\b/i
    ]
  },
  {
    id: "bonafide-certificate",
    outputName: "BONAFIDE CERTIFICATE",
    shortcut: "BON",
    patterns: [
      /\bbon\b/i,
      /\bbnf\b/i,
      /\bbonafide\b/i,
      /\bcollege\s*bonafide\b/i,
      /\bbonafied\b/i
    ]
  },
  {
    id: "fee-receipt",
    outputName: "FEE RECEIPT",
    shortcut: "FEE",
    patterns: [
      /\bfee\b/i,
      /\bfee\s*receipt\b/i,
      /\badmission\s*fee\b/i,
      /\btuition\s*fee\b/i
    ]
  },
  {
    id: "attendance-certificate",
    outputName: "ATTENDANCE CERTIFICATE",
    shortcut: "ATT",
    patterns: [
      /\batt\b/i,
      /\battendance\b/i,
      /\bcollege\s*attendance\b/i
    ]
  },
  {
    id: "hostel-certificate",
    outputName: "HOSTEL CERTIFICATE",
    shortcut: "HST",
    patterns: [
      /\bhst\b/i,
      /\bhostel\b/i,
      /\bhostel\s*certificate\b/i,
      /\brent\s*agreement\b/i,
      /\bprivate\s*hostel\b/i
    ]
  },
  {
    id: "gap-certificate",
    outputName: "GAP CERTIFICATE",
    shortcut: "GAP",
    patterns: [
      /\bgap\b/i,
      /\bgap\s*affidavit\b/i,
      /\beducational\s*gap\b/i,
      /\bgap\s*cert\b/i
    ]
  },
  {
    id: "self-declaration",
    outputName: "SELF DECLARATION",
    shortcut: "SDC",
    patterns: [
      /\bsdc\b/i,
      /\bslf\b/i,
      /\bself\s*declaration\b/i,
      /\bswayam\s*ghoshnapatra\b/i,
      /\bdeclaration\b/i
    ]
  },
  {
    id: "parent-declaration",
    outputName: "PARENT DECLARATION",
    shortcut: "PDC",
    patterns: [
      /\bpdc\b/i,
      /\bpar\b/i,
      /\bparent\s*(declaration|undertaking|form)\b/i,
      /\bhamipatra\b/i,
      /\bfather\s*declaration\b/i,
      /\bpalak\s*(ghoshana|pratigya|pratigyapatra|declaration|undertaking)\b/i
    ]
  },
  {
    id: "death-certificate",
    outputName: "DEATH CERTIFICATE",
    shortcut: "DTH",
    patterns: [
      /\bdth\b/i,
      /\bdeath\b/i,
      /\bdeath\s*certificate\b/i,
      /\bfather\s*death\b/i,
      /\bmrutyu\s*pramanpatra\b/i
    ]
  },
  {
    id: "non-hostel-declaration",
    outputName: "NON HOSTEL DECLARATION",
    shortcut: "NHC",
    patterns: [
      /\bnhc\b/i,
      /\bnon\s*hostel\b/i,
      /\bgovernment\s*hostel\s*non\b/i,
      /\bwarden\s*letter\b/i
    ]
  },
  {
    id: "disability-certificate",
    outputName: "DISABILITY CERTIFICATE",
    shortcut: "DIS",
    patterns: [
      /\bdis\b/i,
      /\bpwd\b/i,
      /\bdisability\b/i,
      /\bdivyang\b/i,
      /\bpwd\s*certificate\b/i,
      /\budid\b/i
    ]
  },
  {
    id: "apaar-id",
    outputName: "APAAR ID",
    shortcut: "APR",
    patterns: [
      /\bapr\b/i,
      /\bapaar\b/i,
      /\bapaar\s*id\b/i,
      /\babc\s*id\b/i,
      /\bacademic\s*bank\b/i
    ]
  },
  {
    id: "cet-application-form",
    outputName: "CET APPLICATION FORM",
    shortcut: "CETAF",
    patterns: [
      /\bcetaf\b/i,
      /\bcet\s*application\b/i,
      /\bcet\s*form\b/i,
      /\bcap\s*registration\b/i
    ]
  },
  {
    id: "cet-score-card",
    outputName: "CET SCORE CARD",
    shortcut: "CETSC",
    patterns: [
      /\bcetsc\b/i,
      /\bcet\s*score\b/i,
      /\bcet\s*result\b/i,
      /\bneet\s*score\b/i,
      /\bscorecard\b/i
    ]
  },
  {
    id: "status-retention-form",
    outputName: "STATUS RETENTION FORM",
    shortcut: "SRF",
    patterns: [
      /\bsrf\b/i,
      /\bstatus\s*retention\b/i,
      /\bretention\s*form\b/i,
      /\bcet\s*retention\b/i
    ]
  },
  {
    id: "ews-certificate",
    outputName: "EWS CERTIFICATE",
    shortcut: "EWS",
    patterns: [
      /\bews\b/i,
      /\beconomically\s*weaker\b/i,
      /\bews\s*certificate\b/i
    ]
  },
  {
    id: "migration-certificate",
    outputName: "MIGRATION CERTIFICATE",
    shortcut: "MIG",
    patterns: [
      /\bmig\b/i,
      /\bmigration\b/i,
      /\bmigration\s*certificate\b/i
    ]
  },
  {
    id: "medical-fitness",
    outputName: "MEDICAL FITNESS CERTIFICATE",
    shortcut: "MED",
    patterns: [
      /\bmed\b/i,
      /\bfitness\b/i,
      /\bmedical\s*fitness\b/i,
      /\bhealth\s*certificate\b/i
    ]
  },
  {
    id: "attempt-certificate",
    outputName: "ATTEMPT CERTIFICATE",
    shortcut: "ATM",
    patterns: [
      /\batm\b/i,
      /\battempt\b/i,
      /\bprayatna\b/i
    ]
  },
  {
    id: "birth-certificate",
    outputName: "BIRTH CERTIFICATE",
    shortcut: "BRT",
    patterns: [
      /\bbrt\b/i,
      /\bbirth\b/i,
      /\bjanma\b/i,
      /\bjanma\s*dakhla\b/i,
      /\bdob\s*proof\b/i,
      /\bdob\b/i
    ]
  },
  {
    id: "voter-id",
    outputName: "VOTER ID",
    shortcut: "VOT",
    patterns: [
      /\bvot\b/i,
      /\bvoter\b/i,
      /\belection\s*card\b/i,
      /\bepic\b/i
    ]
  },
  {
    id: "driving-license",
    outputName: "DRIVING LICENSE",
    shortcut: "DL",
    patterns: [
      /\bdl\b/i,
      /\bdriving\s*licen[sc]e\b/i,
      /\blicen[sc]e\b/i
    ]
  },
  {
    id: "11th-marksheet",
    outputName: "11TH MARKSHEET",
    shortcut: "11M",
    patterns: [
      /\b11m\b/i,
      /\b11(th)?\s*(mark|marksheet|mark-sheet)\b/i
    ]
  },
  {
    id: "1st-year-marksheet",
    outputName: "1ST YEAR MARKSHEET",
    shortcut: "1YM",
    patterns: [
      /\b1ym\b/i,
      /\b1st\s*year\b/i,
      /\bfirst\s*year\s*mark/i,
      /\bfy\s*marksheet\b/i,
      /\bsem\s*1\b/i,
      /\bsem\s*2\b/i
    ]
  },
  {
    id: "2nd-year-marksheet",
    outputName: "2ND YEAR MARKSHEET",
    shortcut: "2YM",
    patterns: [
      /\b2ym\b/i,
      /\b2nd\s*year\b/i,
      /\bsecond\s*year\s*mark/i,
      /\bsy\s*marksheet\b/i,
      /\bsem\s*3\b/i,
      /\bsem\s*4\b/i
    ]
  },
  {
    id: "3rd-year-marksheet",
    outputName: "3RD YEAR MARKSHEET",
    shortcut: "3YM",
    patterns: [
      /\b3ym\b/i,
      /\b3rd\s*year\b/i,
      /\bthird\s*year\s*mark/i,
      /\bty\s*marksheet\b/i,
      /\bsem\s*5\b/i,
      /\bsem\s*6\b/i
    ]
  },
  {
    id: "4th-year-marksheet",
    outputName: "4TH YEAR MARKSHEET",
    shortcut: "4YM",
    patterns: [
      /\b4ym\b/i,
      /\b4th\s*year\b/i,
      /\bfourth\s*year\s*mark/i,
      /\bfinal\s*year\s*marksheet\b/i
    ]
  },
  {
    id: "passing-certificate",
    outputName: "PASSING CERTIFICATE",
    shortcut: "DPC",
    patterns: [
      /\bdpc\b/i,
      /\bdegree\s*passing\b/i,
      /\bdiploma\s*passing\b/i,
      /\bprovisional\s*certificate\b/i
    ]
  },
  {
    id: "degree-certificate",
    outputName: "DEGREE CERTIFICATE",
    shortcut: "DEG",
    patterns: [
      /\bdeg\b/i,
      /\bdegree\b/i,
      /\bconvocation\b/i,
      /\bdiploma\s*certificate\b/i
    ]
  },
  {
    id: "registration-certificate",
    outputName: "REGISTRATION CERTIFICATE",
    shortcut: "REG",
    patterns: [
      /\breg\b/i,
      /\bcouncil\s*registration\b/i,
      /\bmnc\s*registration\b/i,
      /\bnursing\s*registration\b/i
    ]
  },
  {
    id: "internship-certificate",
    outputName: "INTERNSHIP CERTIFICATE",
    shortcut: "INT",
    patterns: [
      /\bint\b/i,
      /\binternship\b/i,
      /\bclinical\s*experience\b/i
    ]
  },
  {
    id: "character-certificate",
    outputName: "CHARACTER CERTIFICATE",
    shortcut: "CHR",
    patterns: [
      /\bchr\b/i,
      /\bcharacter\b/i,
      /\bconduct\s*certificate\b/i,
      /\bcharitra\s*dakhla\b/i
    ]
  },
  {
    id: "gazette-certificate",
    outputName: "GAZETTE CERTIFICATE",
    shortcut: "GAZ",
    patterns: [
      /\bgaz\b/i,
      /\bgazette\b/i,
      /\bname\s*change\s*gazette\b/i,
      /\brajpatra\b/i,
      /\bmarriage\s*certificate\b/i
    ]
  },
  {
    id: "minority-certificate",
    outputName: "MINORITY CERTIFICATE",
    shortcut: "MIN",
    patterns: [
      /\bmin\b/i,
      /\bminority\b/i,
      /\balpsankhyank\b/i,
      /\bminority\s*declaration\b/i
    ]
  }
];

export function updateDocumentPattern(code, newOutputName, keywords = null) {
  if (!code || !newOutputName) return;
  const cleanCode = code.toUpperCase().trim();
  const pat = DOCUMENT_PATTERNS.find(p => p.shortcut && p.shortcut.toUpperCase() === cleanCode);
  if (pat) {
    pat.outputName = newOutputName.toUpperCase().trim();
    if (keywords && Array.isArray(keywords)) {
      for (const kw of keywords) {
        const kwClean = kw.trim().toLowerCase();
        if (kwClean.length >= 2) {
          const regex = new RegExp(`\\b${kwClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
          if (!pat.patterns.some(p => p.toString() === regex.toString())) {
            pat.patterns.unshift(regex);
          }
        }
      }
    }
  }
}

export function removeDocumentPattern(code) {
  if (!code) return;
  const cleanCode = code.toUpperCase().trim();
  const idx = DOCUMENT_PATTERNS.findIndex(p => p.shortcut && p.shortcut.toUpperCase() === cleanCode);
  if (idx !== -1) {
    DOCUMENT_PATTERNS.splice(idx, 1);
  }
}

export function evaluateMatch(text, groups = null) {
  if (!text || typeof text !== 'string') {
    return { docType: null, confidence: 0, matchedPattern: null };
  }

  const clean = text.replace(/[_\-\.]+/g, ' ').trim();
  const lower = clean.toLowerCase();
  const compact = lower.replace(/\s+/g, '');

  // Custom groups override
  if (groups) {
    for (const [outputName, keywords] of Object.entries(groups)) {
      for (const kw of keywords) {
        const kwClean = kw.toLowerCase().trim();
        const pattern = new RegExp(`(^|[^a-z0-9])${kwClean}([^a-z0-9]|$)`, 'i');
        if (pattern.test(lower) || (compact.length >= 2 && compact.length <= 6 && (pattern.test(compact) || compact === kwClean))) {
          return { docType: outputName, confidence: 95, matchedPattern: kw };
        }
      }
    }
  }

  // Precedence patterns
  for (const entry of DOCUMENT_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(lower) || (compact.length >= 2 && compact.length <= 6 && pattern.test(compact))) {
        return {
          docType: entry.outputName,
          confidence: 90,
          matchedPattern: pattern.toString()
        };
      }
    }
  }

  return { docType: null, confidence: 0, matchedPattern: null };
}

/* ==========================================================================
   4. Filename Operations, Casing, and Construction
   ========================================================================== */

export function ext(name) {
  if (!name) return '';
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i) : '';
}

export function cleanName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
}

export function group(name, groups) {
  const match = evaluateMatch(name, groups);
  if (match && match.docType) return match.docType;

  const matched = matchDocument(name, groups);
  if (matched) return matched;

  return null;
}

export function applyCase(textOrSource, targetOrStyle = 'preserve', optionalStyle = null) {
  let text = textOrSource;
  let style = targetOrStyle;
  if (optionalStyle !== null) {
    text = targetOrStyle;
    style = optionalStyle;
  }
  if (!text) return '';
  if (style === 'upper') return text.toUpperCase();
  if (style === 'lower') return text.toLowerCase();
  if (style === 'title') {
    return text.toLowerCase().replace(/(^|[\s\-_])\S/g, c => c.toUpperCase());
  }
  return text; // 'preserve' or 'as_is'
}

export function buildName(input, student, groups, style = 'preserve') {
  let baseDoc = '';
  const trimmed = (input || '').trim();
  const upper = trimmed.toUpperCase();

  if (CANONICAL_NAMES[upper]) {
    baseDoc = CANONICAL_NAMES[upper];
  } else {
    const g = group(input, groups);
    if (!g) {
      baseDoc = cleanName(input);
    } else {
      baseDoc = CANONICAL_NAMES[g.toUpperCase()] || g;
    }
  }

  let combined = baseDoc;
  if (student && student.trim()) {
    const normStudent = student.trim().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
    const normBase = baseDoc.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');

    // Check if baseDoc is exactly identical to student name (e.g. user typed student's name into doc input)
    if (normBase.toLowerCase() === normStudent.toLowerCase()) {
      combined = baseDoc;
    } else {
      // Word-boundary check so substring collision doesn't falsely suppress student name
      // e.g. student "RAM" inside "PROGRAM" or "PAN" inside "PANKESH" will NOT be falsely suppressed
      const escapedStudent = normStudent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordBoundaryRegex = new RegExp(`(^|\\s)${escapedStudent}(\\s|$)`, 'i');
      const alreadyContains = wordBoundaryRegex.test(normBase);
      if (!alreadyContains) {
        combined = `${baseDoc} ${normStudent}`;
      } else {
        combined = baseDoc;
      }
    }
  }

  return applyCase(combined, style);
}

export function validateFilename(name) {
  if (!name || !name.trim()) return 'File name cannot be empty.';
  const trimmed = name.trim();
  if (name.endsWith('.') || name.endsWith(' ') || trimmed.endsWith('.')) {
    return 'File name cannot end with a period or space.';
  }
  if (/[\x00-\x1f\\/:*?"<>|]/.test(name)) return 'File name cannot contain \\ / : * ? " < > | or control characters.';
  if (trimmed === '.' || trimmed === '..') return 'Invalid file name.';

  const base = trimmed.toUpperCase().split('.')[0].trim();
  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  if (reserved.includes(base)) {
    return 'This file name is reserved by Windows OS.';
  }

  return '';
}

/* ==========================================================================
   5. Duplicate Name Handling (Non-colliding Suffixing)
   ========================================================================== */

export function uniqueDestination(desired, currentName, usedNames, studentName = '') {
  const usedLower = new Map();
  if (usedNames) {
    for (const name of usedNames) {
      if (name) usedLower.set(name.toLowerCase(), name);
    }
  }

  if (!usedLower.has(desired.toLowerCase())) {
    return desired;
  }

  const suffix = ext(desired);
  const base = cleanName(desired);
  let stem = base;
  let counter = 2; // Collision suffix starts from ' 2' for the second colliding file
  let studentSuffix = '';

  const sClean = (studentName || '').trim();
  if (sClean) {
    const sLower = sClean.toLowerCase();
    const baseLower = base.toLowerCase();
    if (baseLower.endsWith(sLower)) {
      const idx = baseLower.lastIndexOf(sLower);
      const docPart = base.slice(0, idx).trim();
      const actualStudent = base.slice(idx).trim();
      if (docPart) {
        stem = docPart;
        studentSuffix = ` ${actualStudent}`;
      }
    }
  }

  const match = stem.match(/^(.*?)\s+(\d+)$/);
  if (match) {
    const prefix = match[1].trim();
    const num = parseInt(match[2], 10);
    const baseCheck = `${prefix}${studentSuffix}${suffix}`.toLowerCase();
    if (usedLower.has(baseCheck)) {
      stem = prefix;
      counter = num + 1;
    }
  }

  let candidate = `${stem} ${counter}${studentSuffix}${suffix}`;
  while (usedLower.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${stem} ${counter}${studentSuffix}${suffix}`;
  }
  return candidate;
}

/* ==========================================================================
   6. Multi-Level Undo Manager
   ========================================================================== */

export class UndoManager {
  constructor(maxHistory = 10) {
    this.history = [];
    this.maxHistory = maxHistory;
  }

  pushBatch(dir, plan) {
    if (!plan || !plan.length) return;
    this.history.push({
      dir,
      dirName: dir ? dir.name : '',
      plan: [...plan],
      timestamp: new Date().toISOString()
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  peek() {
    return this.history[this.history.length - 1] || null;
  }

  pop() {
    return this.history.pop() || null;
  }

  canUndo() {
    return this.history.length > 0;
  }

  clear() {
    this.history = [];
  }
}

export const undoManager = new UndoManager();

/* ==========================================================================
   7. Spelling Auto-Correction Library
   ========================================================================== */

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function preserveCase(found, replacement) {
  if (found === found.toUpperCase()) return replacement.toUpperCase();
  if (found === found.toLowerCase()) return replacement.toLowerCase();
  if (found[0] === found[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}

export function correctSpelling(text, rules) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [wrong, right] of Object.entries(rules || {})) {
    if (!wrong) continue;
    const re = new RegExp(`(^|[^a-zA-Z0-9])(${esc(wrong)})([^a-zA-Z0-9]|$)`, 'gi');
    out = out.replace(re, (match, prefix, found, suffix) => {
      return prefix + preserveCase(found, right) + suffix;
    });
  }
  return out;
}

export function issuesFor(dirName, files, rules) {
  const out = [];

  if (dirName) {
    const folderFixed = correctSpelling(dirName, rules);
    if (folderFixed !== dirName) {
      out.push({ type: 'folder', old: dirName, corrected: folderFixed });
    }
  }

  files.forEach((file, index) => {
    const lastDot = file.name.lastIndexOf('.');
    const base = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
    const extension = lastDot > 0 ? file.name.slice(lastDot) : '';

    const fixedBase = correctSpelling(base, rules);
    if (base !== fixedBase) {
      out.push({
        type: 'file',
        fileIndex: index,
        old: file.name,
        corrected: fixedBase + extension
      });
    }
  });

  return out;
}

/* ==========================================================================
   8. Checklist & Document Linking Engine
   ========================================================================== */

export function makeChecklist(raw) {
  return Object.fromEntries(
    Object.entries(raw).map(([name, rows]) => [
      name,
      rows.map(x =>
        Array.isArray(x)
          ? {
            name: x[0],
            keywords: x[1],
            short: x[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, '').slice(0, 18)
          }
          : x
      )
    ])
  );
}

function fileMatchesKeyword(fileName, keyword, ruleName = '') {
  const lowerName = fileName.toLowerCase();
  const q = keyword.toLowerCase().trim();

  // Safety: Caste certificate must NOT match validity-only files
  if (ruleName === 'CASTE CERTIFICATE' && (lowerName.includes('validity') || lowerName.includes('vld'))) {
    if (!lowerName.includes('caste certificate') && !lowerName.includes('cast certificate')) {
      return false;
    }
  }

  if (!q.includes(' ')) {
    return new RegExp(`(^|[^a-z0-9])${q}([^a-z0-9]|$)`, 'i').test(lowerName);
  }

  return lowerName.includes(q);
}

export function evaluateChecklistRule(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  const rawRuleName = (rule.name || rule).trim().toUpperCase();
  const normalizedRuleName = getCanonicalDocumentUpper(rawRuleName);
  const activeLinks = Array.isArray(linkedRules) ? linkedRules : DEFAULT_LINKED_RULES;

  // 1. Combined document link
  for (const link of activeLinks) {
    const linkP1 = getCanonicalDocumentUpper(link.part1);
    const linkP2 = getCanonicalDocumentUpper(link.part2);
    const linkComb = getCanonicalDocumentUpper(link.combined);

    if (link.type === 'combined' && (linkP1 === normalizedRuleName || linkP2 === normalizedRuleName)) {
      const combinedClean = linkComb.toLowerCase();
      const matched = fileNames.find(fn => {
        const lower = fn.toLowerCase();
        const canonLower = getCanonicalDocumentUpper(fn).toLowerCase();
        return lower.includes(combinedClean) ||
          canonLower.includes(combinedClean) ||
          (lower.includes('12th') && lower.includes('marksheet') && lower.includes('passing')) ||
          (lower.includes('10th') && lower.includes('marksheet') && lower.includes('passing')) ||
          (lower.includes('domicile') && lower.includes('nationality')) ||
          (lower.includes('12mp') || lower.includes('10mp') || lower.includes('domnat'));
      });
      if (matched) {
        return {
          status: 'green',
          matchedFile: matched,
          isLinked: true,
          linkedReason: `Fulfilled via combined file "${link.combined}"`
        };
      }
    }
  }

  // 2. Alias document link
  for (const link of activeLinks) {
    const linkP1 = getCanonicalDocumentUpper(link.part1);
    const linkP2 = getCanonicalDocumentUpper(link.part2);
    if (link.type === 'alias' && linkP1 === normalizedRuleName) {
      const aliasClean = linkP2.toLowerCase();
      const matched = fileNames.find(fn => {
        const lower = fn.toLowerCase();
        const canonLower = getCanonicalDocumentUpper(fn).toLowerCase();
        return lower.includes(aliasClean) || canonLower.includes(aliasClean);
      });
      if (matched) {
        return {
          status: 'green',
          matchedFile: matched,
          isLinked: true,
          linkedReason: `Fulfilled via alias "${link.part2}"`
        };
      }
    }
  }

  // 3. Direct keyword matching
  const keywords = Array.isArray(rule.keywords) ? rule.keywords : [rawRuleName];
  for (const kw of keywords) {
    const matched = fileNames.find(fn => fileMatchesKeyword(fn, kw, normalizedRuleName));
    if (matched) {
      return { status: 'green', matchedFile: matched, isLinked: false };
    }
  }

  return { status: 'red', matchedFile: null, isLinked: false };
}

export function getChecklistStatus(fileNames, rule, linkedRules = DEFAULT_LINKED_RULES) {
  const res = evaluateChecklistRule(fileNames, rule, linkedRules);
  return res.status;
}

export function evaluateChecklistSummary(fileNames, rules = [], linkedRules = DEFAULT_LINKED_RULES) {
  const evaluations = rules.map(rule => ({
    rule,
    ...evaluateChecklistRule(fileNames, rule, linkedRules)
  }));

  const foundCount = evaluations.filter(e => e.status === 'green').length;
  const missingCount = evaluations.filter(e => e.status === 'red').length;
  const totalRequired = rules.length;
  const percentComplete = totalRequired > 0 ? Math.round((foundCount / totalRequired) * 100) : 100;
  const isReady = missingCount === 0;

  const missingList = evaluations
    .filter(e => e.status === 'red')
    .map(e => e.rule.name);

  return {
    evaluations,
    foundCount,
    missingCount,
    totalRequired,
    percentComplete,
    isReady,
    missingList
  };
}

export async function allFileNames(handle, path = '') {
  const out = [];
  try {
    for await (const entry of handle.values()) {
      if (entry.kind === 'file') {
        out.push(path ? `${path}/${entry.name}` : entry.name);
      } else if (entry.kind === 'directory') {
        const sub = await allFileNames(entry, path ? `${path}/${entry.name}` : entry.name);
        out.push(...sub);
      }
    }
  } catch (err) {
    console.warn('[rename_tool_logic] allFileNames error:', err);
  }
  return out;
}

/* ==========================================================================
   9. Batch Audit CSV Report Export
   ========================================================================== */

export function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateBatchAuditCSV(batchResults, rules, checklistName = 'Checklist') {
  const headers = [
    'Sr No',
    'Student Name',
    'Folder Name',
    ...rules.map(r => r.name),
    'Verified Count',
    'Missing Count',
    'Total Rules',
    'Completion %',
    'Readiness Status',
    'Missing Documents'
  ];

  const rows = [headers.map(escapeCSV).join(',')];

  batchResults.forEach((item, idx) => {
    const evMap = {};
    if (item.summary && Array.isArray(item.summary.evaluations)) {
      item.summary.evaluations.forEach(ev => {
        evMap[ev.rule.name] = ev.status === 'green' ? (ev.isLinked ? 'LINKED' : 'PRESENT') : 'MISSING';
      });
    }

    const row = [
      idx + 1,
      item.studentName || 'Unknown Student',
      item.folderName || '',
      ...rules.map(r => evMap[r.name] || 'MISSING'),
      item.summary?.foundCount || 0,
      item.summary?.missingCount || 0,
      item.summary?.totalRequired || rules.length,
      `${item.summary?.percentComplete || 0}%`,
      item.summary?.isReady ? 'READY FOR SUBMISSION' : 'INCOMPLETE',
      (item.summary?.missingList || []).join('; ')
    ];
    rows.push(row.map(escapeCSV).join(','));
  });

  return rows.join('\r\n');
}

/* ==========================================================================
   10. Rename Plan and Execution
   ========================================================================== */

export function planRename(files, inputs, student, groups, style, selectedIndices = null) {
  const plan = [];
  const used = new Set(files.map(f => f.name));
  const indices = selectedIndices !== null ? selectedIndices : files.map((_, i) => i);

  for (const i of indices) {
    const file = files[i];
    if (!file) continue;
    const typed = (inputs[i] ?? cleanName(file.name)).trim();
    const error = validateFilename(typed);
    if (error) return { error: `${file.name}: ${error}` };

    const desired = buildName(typed, student, groups, style) + ext(file.name);
    if (desired === file.name) continue;

    const next = uniqueDestination(desired, file.name, used);
    used.add(next);
    plan.push({ old: file.name, next, file, handle: file.handle || null, index: i });
  }

  return { plan };
}

export async function executeRename(dir, plan, onProgress = null) {
  const written = [];
  try {
    let completed = 0;
    for (const item of plan) {
      // 1. Native Desktop Rename (0 browser prompt, atomic rename)
      const dirPath = dir ? (dir.nativePath || dir.path || '') : '';
      const oldPath = item.nativePath || (item.file && (item.file.path || item.file.nativePath)) || (dirPath ? `${dirPath}/${item.old}` : null);
      if (oldPath) {
        const studentName = item.studentName || (item.file && item.file.studentName) || '';
        const rotation = item.rotation || (item.file && item.file.rotation) || 0;
        const isTestMode = typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('test_mode=1');
        let res;
        if (isTestMode) {
          const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : (oldPath.includes('\\') ? oldPath.substring(0, oldPath.lastIndexOf('\\')) : '');
          const newPath = parentDir ? `${parentDir}/${item.next}` : item.next;
          res = { success: true, name: item.next, path: newPath, newPath };
        } else {
          res = await renameNativeFile(oldPath, item.next, studentName, rotation);
        }
        if (!res.success) {
          throw new Error(res.error || `Failed to rename ${item.old}`);
        }
        const actualName = res.name || item.next;
        item.next = actualName;
        if (item.file) {
          const newPath = res.path || res.newPath;
          if (newPath) {
            item.file.path = newPath;
            item.file.nativePath = newPath;
            const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
              ? window.location.origin : 'http://localhost:3000';
            item.file.url = `${origin}/api/serve-file?path=${encodeURIComponent(newPath)}`;
          }
          item.file.name = actualName;
          item.file.targetName = actualName;
          item.file.isRenamed = true;
          item.file.status = 'renamed';
          item.file.rotation = 0; // rotation applied to disk
          item.file._pdfBytes = null;
          if (item.file._blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
            try { URL.revokeObjectURL(item.file._blobUrl); } catch (_) { }
            item.file._blobUrl = null;
          }
        }
        written.push(item);
        completed++;
        if (onProgress) {
          const pct = Math.round((completed / plan.length) * 100);
          onProgress(pct, `Renamed ${completed} of ${plan.length} files...`);
        }
        continue;
      }

      // 2. Browser File System Access API Rename fallback
      const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;

      if (!isCaseOnly) {
        let finalNext = item.next;
        let handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
        if (handle) {
          const suffix = ext(finalNext);
          const base = cleanName(finalNext).replace(/\s+\d+$/, '');
          let counter = 1;
          finalNext = `${base} ${counter}${suffix}`;
          handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          while (handle) {
            counter++;
            finalNext = `${base} ${counter}${suffix}`;
            handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          }
          item.next = finalNext;
        }
      }

      let sourceHandle = item.handle;
      if (!sourceHandle) {
        sourceHandle = await dir.getFileHandle(item.old, { create: false }).catch(() => null);
      }

      let movedSuccessfully = false;
      if (sourceHandle && typeof sourceHandle.move === 'function') {
        try {
          if (isCaseOnly) {
            const tempName = `__tmp_${Date.now()}_${item.next}`;
            await sourceHandle.move(tempName);
            await sourceHandle.move(item.next);
          } else {
            await sourceHandle.move(item.next);
          }
          movedSuccessfully = true;
          written.push(item);
        } catch (moveErr) {
          console.warn('sourceHandle.move() not supported on this handle, falling back to stream copy:', moveErr);
          movedSuccessfully = false;
        }
      }

      if (!movedSuccessfully) {
        const data = await item.file.arrayBuffer();
        let targetHandle;

        if (isCaseOnly) {
          const tempName = `__tmp_${Date.now()}_${item.next}`;
          const tempOut = await dir.getFileHandle(tempName, { create: true });
          const tw = await tempOut.createWritable();
          await tw.write(data);
          await tw.close();
          await dir.removeEntry(item.old);

          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const w = await targetHandle.createWritable();
          await w.write(data);
          await w.close();
          await dir.removeEntry(tempName);
        } else {
          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const writer = await targetHandle.createWritable();
          await writer.write(data);
          await writer.close();
          await dir.removeEntry(item.old);
        }
        written.push(item);
      }

      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / plan.length) * 100), `${completed}/${plan.length} files renamed`);
      }
    }
    return written;
  } catch (error) {
    throw error;
  }
}

export async function undoRename(dir, plan, onProgress = null) {
  const reversed = [...plan].reverse();
  let completed = 0;

  for (const item of reversed) {
    const dirPath = dir ? (dir.nativePath || dir.path || '') : '';
    const currentPath = (item.file && (item.file.path || item.file.nativePath)) ||
      (dirPath ? `${dirPath}/${item.next}` : null) ||
      (item.nativePath ? item.nativePath.replace(/[^\\\/]+$/, item.next) : null);

    if (currentPath) {
      const isTestMode = typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('test_mode=1');
      let res;
      if (isTestMode) {
        const parentDir = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : (currentPath.includes('\\') ? currentPath.substring(0, currentPath.lastIndexOf('\\')) : '');
        const restoredPath = parentDir ? `${parentDir}/${item.old}` : item.old;
        res = { success: true, name: item.old, path: restoredPath, newPath: restoredPath };
      } else {
        res = await renameNativeFile(currentPath, item.old);
      }
      if (res && res.success) {
        const restoredPath = res.path || (item.nativePath || (dirPath ? `${dirPath}/${item.old}` : currentPath.replace(/[^\\\/]+$/, item.old)));
        if (item.file) {
          item.file.path = restoredPath;
          item.file.nativePath = restoredPath;
          item.file.name = item.old;
          item.file.targetName = item.old;
          const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:') && !window.location.origin.includes('tauri'))
            ? window.location.origin : 'http://localhost:3000';
          item.file.url = `${origin}/api/serve-file?path=${encodeURIComponent(restoredPath)}`;
          item.file.isRenamed = false;
          item.file.status = 'pending';
        }
      }
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
      }
      continue;
    }

    const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;
    const currentHandle = await dir.getFileHandle(item.next, { create: false }).catch(() => null);

    if (currentHandle && typeof currentHandle.move === 'function') {
      if (isCaseOnly) {
        const tempName = `__tmp_undo_${Date.now()}_${item.old}`;
        await currentHandle.move(tempName);
        await currentHandle.move(item.old);
      } else {
        await currentHandle.move(item.old);
      }
    } else if (currentHandle) {
      const data = await (await currentHandle.getFile()).arrayBuffer();
      const oldHandle = await dir.getFileHandle(item.old, { create: true });
      const writer = await oldHandle.createWritable();
      await writer.write(data);
      await writer.close();
      await dir.removeEntry(item.next);
    }

    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
    }
  }
}

/* ==========================================================================
   10. Smart Auto-Rename OCR Detection & Multi-Signal Scoring Engine
   ========================================================================== */

export const SMART_DOC_SIGNATURES = [
  {
    canonical: 'AADHAAR CARD',
    code: 'ADR',
    patterns: [
      /\bunique identification authority\b/i,
      /\buidai\b/i,
      /\baadhaar\b/i,
      /\badhar\b/i,
      /\bmera aadhaar\b/i,
      /\bidentification authority of india\b/i,
      /\b\d{4}\s\d{4}\s\d{4}\b/,
      /\bvid\s*:\s*\d{4}\b/i
    ],
    primaryKeywords: ['aadhaar', 'uidai', 'unique identification', 'आधार', 'enrollment'],
    secondaryKeywords: ['male', 'female', 'dob', 'year of birth', 'father', 'address']
  },
  {
    canonical: '10TH MARKSHEET',
    code: '10M',
    patterns: [
      /\bsecondary school certificate\b/i,
      /\bs\.s\.c\b/i,
      /\bssc examination\b/i,
      /\bboard of secondary\b/i,
      /\b10th marksheet\b/i,
      /\bstd\.?\s*10\b/i,
      /\bstandard x\b/i,
      /\bmatriculation\b/i
    ],
    primaryKeywords: ['secondary school', 's.s.c', 'ssc', 'xth', '10th', 'matric'],
    secondaryKeywords: ['statement of marks', 'candidate name', 'seat no', 'centre no', 'pass']
  },
  {
    canonical: '12TH MARKSHEET',
    code: '12M',
    patterns: [
      /\bhigher secondary certificate\b/i,
      /\bh\.s\.c\b/i,
      /\bhsc examination\b/i,
      /\bboard of higher secondary\b/i,
      /\b12th marksheet\b/i,
      /\bstd\.?\s*12\b/i,
      /\bstandard xii\b/i,
      /\bintermediate\b/i
    ],
    primaryKeywords: ['higher secondary', 'h.s.c', 'hsc', 'xiith', '12th', 'science', 'commerce', 'arts'],
    secondaryKeywords: ['statement of marks', 'candidate name', 'seat no', 'centre no', 'stream', 'pass']
  },
  {
    canonical: '12TH LEAVING CERTIFICATE',
    code: '12LC',
    patterns: [
      /\bleaving certificate\b/i,
      /\btransfer certificate\b/i,
      /\bcollege leaving\b/i,
      /\bschool leaving\b/i,
      /\bconduct\s*:\s*good\b/i,
      /\bdate of leaving\b/i,
      /\bdate of birth\b/i
    ],
    primaryKeywords: ['leaving certificate', 'transfer certificate', 'tc', 'school leaving', 'college leaving'],
    secondaryKeywords: ['date of birth', 'conduct', 'progress', 'religion', 'caste', 'nationality']
  },
  {
    canonical: 'CASTE CERTIFICATE',
    code: 'CST',
    patterns: [
      /\bcaste certificate\b/i,
      /\bform of caste\b/i,
      /\bbelong to\s+\w+\s+caste\b/i,
      /\bbackward class\b/i,
      /\bscheduled caste\b/i,
      /\bscheduled tribe\b/i,
      /\bother backward class\b/i,
      /\bobc\b/i,
      /\bvjnt\b/i,
      /\bnt-[a-d]\b/i,
      /\bsebc\b/i,
      /\bजात प्रमाणपत्र\b/i
    ],
    primaryKeywords: ['caste certificate', 'backward class', 'sub divisional officer', 'competent authority', 'caste'],
    secondaryKeywords: ['ordinance', 'constitution', 'tahasildar', 'deputy collector']
  },
  {
    canonical: 'CASTE VALIDITY CERTIFICATE',
    code: 'VLD',
    patterns: [
      /\bcaste validity\b/i,
      /\bvalidity certificate\b/i,
      /\bscrutiny committee\b/i,
      /\bverification of caste\b/i,
      /\bvalidity of caste\b/i,
      /\bजात वैधता प्रमाणपत्र\b/i
    ],
    primaryKeywords: ['caste validity', 'validity certificate', 'scrutiny committee', 'caste certificate scrutiny'],
    secondaryKeywords: ['district caste', 'certificate of validity', 'verified']
  },
  {
    canonical: 'INCOME CERTIFICATE',
    code: 'INC',
    patterns: [
      /\bincome certificate\b/i,
      /\bannual family income\b/i,
      /\bannual income\b/i,
      /\bउत्पन्नाचा दाखला\b/i,
      /\bउत्पन्न प्रमाणपत्र\b/i,
      /\bfinancial year\b/i
    ],
    primaryKeywords: ['income certificate', 'annual income', 'tahsildar', 'taluka executive magistrate'],
    secondaryKeywords: ['rupees', 'lakhs', 'financial year', 'head of family']
  },
  {
    canonical: 'DOMICILE AND NATIONALITY CERTIFICATE',
    code: 'DOMNAT',
    patterns: [
      /\bdomicile\s*(and|&)\s*nationality\b/i,
      /\bnationality\s*(and|&)\s*domicile\b/i,
      /\bage,?\s*nationality\s*(and|&)\s*domicile\b/i,
      /\bअधिवास\s*(आणि|व)\s*राष्ट्रीयत्व\b/i
    ],
    primaryKeywords: ['domicile and nationality', 'nationality and domicile', 'age nationality and domicile', 'domnat'],
    secondaryKeywords: ['executive magistrate', 'tahsildar', 'state of maharashtra', 'ordinary resident']
  },
  {
    canonical: 'DOMICILE CERTIFICATE',
    code: 'DOM',
    patterns: [
      /\bdomicile certificate\b/i,
      /\bage,?\s*nationality\s*(and|&)\s*domicile\b/i,
      /\bage and domicile\b/i,
      /\bresident of\s+state of maharashtra\b/i,
      /\bstate of maharashtra\b/i,
      /\bअधिवास प्रमाणपत्र\b/i
    ],
    primaryKeywords: ['domicile', 'age and nationality', 'state of maharashtra', 'ordinary resident'],
    secondaryKeywords: ['executive magistrate', 'tahsildar', 'mumbai', 'pune', 'nagpur', 'district']
  },
  {
    canonical: 'NON CREAMY LAYER CERTIFICATE',
    code: 'NCL',
    patterns: [
      /\bnon[-\s]creamy layer\b/i,
      /\bdoes not belong to the persons\/sections \(creamy layer\)\b/i,
      /\bcreamy layer\b/i
    ],
    primaryKeywords: ['non creamy layer', 'creamy layer', 'other backward classes'],
    secondaryKeywords: ['annual income', 'sub divisional officer', 'valid upto']
  },
  {
    canonical: 'RATION CARD',
    code: 'RAT',
    patterns: [
      /\bration card\b/i,
      /\bfood (and|&) civil supplies\b/i,
      /\bconsumer affairs\b/i,
      /\bcard no\b/i
    ],
    primaryKeywords: ['ration card', 'food civil supplies', 'fair price'],
    secondaryKeywords: ['head of family', 'gas connection', 'bpl', 'apl']
  },
  {
    canonical: 'BANK PASSBOOK',
    code: 'BNK',
    patterns: [
      /\bpassbook\b/i,
      /\baccount (number|no)\b/i,
      /\bifsc\s*code\b/i,
      /\bbranch\b/i,
      /\bstate bank of india\b/i,
      /\bbank of maharashtra\b/i,
      /\bbank of baroda\b/i
    ],
    primaryKeywords: ['passbook', 'ifsc', 'account number', 'bank'],
    secondaryKeywords: ['savings', 'branch', 'micr', 'cif']
  },
  {
    canonical: 'GAP CERTIFICATE',
    code: 'GAP',
    patterns: [
      /\bgap certificate\b/i,
      /\baffidavit for gap\b/i,
      /\bgap in education\b/i,
      /\beducational gap\b/i
    ],
    primaryKeywords: ['gap certificate', 'affidavit', 'educational gap'],
    secondaryKeywords: ['notary', 'stamp paper', 'solemnly affirm']
  }
];

export function evaluateSmartOcrDocument(text, studentName = '') {
  if (!text || typeof text !== 'string') {
    return {
      docType: null,
      canonical: null,
      code: null,
      confidence: 0,
      studentNameMatchRatio: 0,
      isConfident: false,
      reason: 'No text extracted'
    };
  }

  const cleanText = text.replace(/\s+/g, ' ');
  let bestMatch = null;
  let highestDocScore = 0;

  for (const sig of SMART_DOC_SIGNATURES) {
    let score = 0;
    const matchedKeywords = [];

    // 1. Strong Regex Patterns (up to 35 pts)
    for (const pat of sig.patterns) {
      if (pat.test(cleanText)) {
        score += 35;
        break;
      }
    }

    // 2. Primary Keywords (up to 25 pts)
    let primCount = 0;
    for (const kw of sig.primaryKeywords) {
      if (cleanText.toLowerCase().includes(kw.toLowerCase())) {
        primCount++;
        matchedKeywords.push(kw);
      }
    }
    score += Math.min(25, primCount * 15);

    // 3. Secondary Keywords (up to 10 pts)
    let secCount = 0;
    for (const kw of sig.secondaryKeywords) {
      if (cleanText.toLowerCase().includes(kw.toLowerCase())) {
        secCount++;
      }
    }
    score += Math.min(10, secCount * 5);

    if (score > highestDocScore) {
      highestDocScore = score;
      bestMatch = {
        sig,
        score,
        matchedKeywords
      };
    }
  }

  // Student Name Matching (up to 30 pts)
  let nameMatchRatio = 0;
  if (studentName && studentName.trim()) {
    const tokens = studentName.trim().toUpperCase().split(/\s+/).filter(t => t.length > 2);
    if (tokens.length > 0) {
      let matchedTokens = 0;
      const upperText = cleanText.toUpperCase();
      for (const tok of tokens) {
        if (upperText.includes(tok)) {
          matchedTokens++;
        }
      }
      nameMatchRatio = Math.round((matchedTokens / tokens.length) * 100);
    }
  }

  const docScore = bestMatch ? Math.min(70, bestMatch.score) : 0;
  const nameBonus = Math.round((nameMatchRatio / 100) * 30);
  const totalConfidence = Math.min(100, docScore + nameBonus);

  return {
    docType: bestMatch && docScore >= 35 ? bestMatch.sig.canonical : null,
    canonical: bestMatch && docScore >= 35 ? bestMatch.sig.canonical : null,
    code: bestMatch && docScore >= 35 ? bestMatch.sig.code : null,
    confidence: bestMatch && docScore >= 35 ? totalConfidence : Math.min(45, totalConfidence),
    docScore,
    nameMatchRatio,
    isConfident: totalConfidence >= 80 && docScore >= 50,
    matchedKeywords: bestMatch ? bestMatch.matchedKeywords : []
  };
}

/**
 * Register a new document type dynamically into in-memory signatures and canonical names
 */
export function registerDocumentSignature({ canonical, code = '', primaryKeywords = [], secondaryKeywords = [] }) {
  if (!canonical || typeof canonical !== 'string') return null;
  const upperCanonical = canonical.trim().toUpperCase();
  const upperCode = (code || '').trim().toUpperCase() || upperCanonical.slice(0, 3);

  CANONICAL_NAMES[upperCanonical] = upperCanonical;

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`\\b${escapeRegex(upperCanonical)}\\b`, 'i')
  ];
  if (upperCode && upperCode.length >= 2) {
    patterns.push(new RegExp(`\\b${escapeRegex(upperCode)}\\b`, 'i'));
  }
  for (const kw of primaryKeywords) {
    if (kw && kw.trim().length >= 3) {
      patterns.push(new RegExp(`\\b${escapeRegex(kw.trim())}\\b`, 'i'));
    }
  }

  const prim = [upperCanonical.toLowerCase()];
  for (const kw of primaryKeywords) {
    if (kw && typeof kw === 'string' && kw.trim().length >= 3) {
      const k = kw.trim().toLowerCase();
      if (!prim.includes(k)) prim.push(k);
    }
  }

  const sec = [];
  for (const kw of secondaryKeywords) {
    if (kw && typeof kw === 'string' && kw.trim().length >= 3) {
      const k = kw.trim().toLowerCase();
      if (!prim.includes(k) && !sec.includes(k)) sec.push(k);
    }
  }

  const sig = {
    canonical: upperCanonical,
    code: upperCode,
    patterns,
    primaryKeywords: prim,
    secondaryKeywords: sec
  };

  const existingIdx = SMART_DOC_SIGNATURES.findIndex(s => s.canonical === upperCanonical);
  if (existingIdx !== -1) {
    SMART_DOC_SIGNATURES[existingIdx] = sig;
  } else {
    SMART_DOC_SIGNATURES.push(sig);
  }

  return sig;
}

/**
 * Extract candidate OCR signature keywords from document text
 */
export function extractSignatureKeywords(text, docName = '') {
  if (!text || typeof text !== 'string') return { primary: [], secondary: [] };

  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'had',
    'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just',
    'should', 'now', 'page', 'date', 'number', 'govt', 'government', 'state',
    'signature', 'verified', 'copy', 'true', 'name', 'sign', 'photo', 'form'
  ]);

  const clean = text.replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase();
  const tokens = clean.split(/\s+/).filter(t => t.length >= 4 && !stopWords.has(t));
  const counts = new Map();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  const primary = sorted.slice(0, 6);
  const secondary = sorted.slice(6, 14);

  return { primary, secondary };
}

/**
 * Computes Levenshtein distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a || !a.length) return (b || '').length;
  if (!b || !b.length) return a.length;

  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const d = [];

  for (let i = 0; i <= s1.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[s1.length][s2.length];
}

/**
 * Calculates string similarity between 0.0 and 1.0 using Levenshtein distance
 */
export function stringSimilarity(a, b) {
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Extracts clean words/tokens from a filename or text
 */
export function extractCleanTokens(str) {
  if (!str || typeof str !== 'string') return [];
  const withoutExt = str.replace(/\.[a-zA-Z0-9]+$/i, '');
  const normalized = withoutExt.replace(/[^a-zA-Z0-9]+/g, ' ').toLowerCase();
  return normalized.split(/\s+/).filter(t => t.length > 0);
}

/**
 * Strict Numeric / Standard Group Classifier
 * Standards: 10th (ssc), 11th (xi), 12th (hsc), 1st, 2nd, 3rd, 4th
 */
const NUMERIC_STANDARDS = [
  { id: '10', tags: ['10', '10th', 'ssc', 'tenth', 'x', 'dahavi', 'dahawi'] },
  { id: '11', tags: ['11', '11th', 'xi', 'eleventh'] },
  { id: '12', tags: ['12', '12th', 'hsc', 'twelfth', 'xii', 'baravi', 'barawi'] },
  { id: '1st', tags: ['1st', 'first', 'fy', 'sem1', 'sem-1'] },
  { id: '2nd', tags: ['2nd', 'second', 'sy', 'sem2', 'sem-2'] },
  { id: '3rd', tags: ['3rd', 'third', 'ty', 'sem3', 'sem-3'] },
  { id: '4th', tags: ['4th', 'fourth', 'sem4', 'sem-4'] }
];

export function getNumericStandard(token) {
  const tok = (token || '').toLowerCase();
  for (const item of NUMERIC_STANDARDS) {
    if (item.tags.includes(tok)) return item.id;
  }
  return null;
}

export function extractNumericStandards(tokens) {
  const set = new Set();
  for (const t of tokens) {
    const std = getNumericStandard(t);
    if (std) set.add(std);
  }
  return set;
}

export function hasNumericConflict(fileStandards, targetStandards) {
  if (targetStandards && targetStandards.size > 0) {
    for (const fs of fileStandards) {
      if (!targetStandards.has(fs)) {
        return true; // Conflicting standard detected!
      }
    }
  }
  return false;
}

/**
 * Layer 1: Indian English Pre-Normalizer
 * Normalizes common Indian typing typos, phonetic replacements, regional words and academic terms.
 */
export function normalizeIndianText(text) {
  if (!text || typeof text !== 'string') return '';
  let s = text.toLowerCase().trim();

  // Strip file extension if present
  s = s.replace(/(\.[a-zA-Z0-9]+)+$/i, '');

  // 1. Strip leading silent/extra consonants in common Indian typos
  s = s.replace(/\bkc([aeiou])/gi, 'k$1');   // kcast -> kast
  s = s.replace(/\bkn([aeiou])/gi, 'n$1');
  s = s.replace(/\bps([aeiou])/gi, 's$1');

  // 2. Normalize phonetic equivalents common in Marathi/Hindi-to-English typing
  s = s.replace(/w/gi, 'v');                 // woter -> voter
  s = s.replace(/ph/gi, 'f');                // foto -> photo, passphoto -> passfoto
  s = s.replace(/sh/gi, 's');                // marksit / marksheet -> marksit
  s = s.replace(/ee+/gi, 'i');               // marksheet -> marksit, bonafidee -> bonafid
  s = s.replace(/oo+/gi, 'u');               // book -> buk, school -> skul

  // 3. Indian administrative synonyms & typos (Full Equivalence per user decision 2-A)
  s = s.replace(/\b(sartificat|sartifiket|sartifakit|sartificet|certi|cert|dakhla|pramanpatra|praman\s*patra)\b/gi, 'certificate');
  s = s.replace(/\b(domisail|domicile|domicil|adivas|adhiwas|rehivasi|rahavasi)\b/gi, 'domicile');
  s = s.replace(/\b(incom|incm|utpanna|utpann)\b/gi, 'income');
  s = s.replace(/\b(bonafaid|bonafied|bonfide|bona\s*fide)\b/gi, 'bonafide');
  s = s.replace(/\b(non\s*crimiler|non\s*criminal|noncreamy|non\s*creamy|ncl)\b/gi, 'non creamy layer');
  s = s.replace(/\b(markshit|markshet|marskheet|mark\s*sheet|scorecard|score\s*card)\b/gi, 'marksheet');
  s = s.replace(/\b(pasing|pass\s*cert|sanad)\b/gi, 'passing');
  s = s.replace(/\b(adhar|aadhar|aadhhar|adhaar|uid|uidai)\b/gi, 'aadhaar');
  s = s.replace(/\b(rasan|rashan|shidha|patrika)\b/gi, 'ration');
  s = s.replace(/\b(skool|clg|college)\b/gi, 'school');
  s = s.replace(/\b(lc|tc|leaving|transfer)\b/gi, 'leaving certificate');
  s = s.replace(/\b(foto|pic|image|photograph)\b/gi, 'photo');
  s = s.replace(/\b(signatur|sahi|signature|st\s*sign)\b/gi, 'signature');
  s = s.replace(/\b(validiti|validty)\b/gi, 'validity');

  // 4. Academic numbers / terms to canonical tokens
  s = s.replace(/\b(dahavi|dahawi|ssc|tenth)\b/gi, '10th');
  s = s.replace(/\b(baravi|barawi|hsc|twelfth)\b/gi, '12th');

  // Normalize delimiters & whitespace
  return s.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Layer 2: Double Metaphone Algorithm (Pure JavaScript, Zero External Dependency, 100% Offline)
 * Computes primary and alternate phonetic codes.
 */
export function doubleMetaphone(input) {
  if (!input || typeof input !== 'string') return ['', ''];
  let word = input.toUpperCase().trim();
  if (!word) return ['', ''];

  let primary = '';
  let secondary = '';
  let current = 0;
  const length = word.length;

  function isVowel(idx) {
    if (idx < 0 || idx >= length) return false;
    return /[AEIOUY]/.test(word[idx]);
  }

  function stringAt(start, len, ...substrings) {
    if (start < 0 || start >= length) return false;
    const sub = word.substr(start, len);
    return substrings.includes(sub);
  }

  // Skip leading silent combinations
  if (stringAt(0, 2, 'GN', 'KN', 'PN', 'WR', 'PS')) {
    current += 1;
  }

  // Initial 'X' sounds like 'S'
  if (word[0] === 'X') {
    primary += 'S';
    secondary += 'S';
    current += 1;
  }

  while (current < length && (primary.length < 8 || secondary.length < 8)) {
    const ch = word[current];

    switch (ch) {
      case 'A':
      case 'E':
      case 'I':
      case 'O':
      case 'U':
      case 'Y':
        if (current === 0) {
          primary += 'A';
          secondary += 'A';
        }
        current += 1;
        break;

      case 'B':
        primary += 'P';
        secondary += 'P';
        current = word[current + 1] === 'B' ? current + 2 : current + 1;
        break;

      case 'C':
        if (stringAt(current, 2, 'CH')) {
          primary += 'X';
          secondary += 'X';
          current += 2;
        } else if (stringAt(current, 2, 'CI', 'CE', 'CY')) {
          primary += 'S';
          secondary += 'S';
          current += 2;
        } else if (stringAt(current, 2, 'CK', 'CG', 'CQ')) {
          primary += 'K';
          secondary += 'K';
          current += 2;
        } else if (stringAt(current, 2, 'CZ')) {
          primary += 'S';
          secondary += 'S';
          current += 2;
        } else {
          primary += 'K';
          secondary += 'K';
          current = word[current + 1] === 'C' ? current + 2 : current + 1;
        }
        break;

      case 'D':
        if (stringAt(current, 2, 'DG')) {
          primary += 'J';
          secondary += 'J';
          current += 2;
        } else if (stringAt(current, 2, 'DT', 'DD')) {
          primary += 'T';
          secondary += 'T';
          current += 2;
        } else {
          primary += 'T';
          secondary += 'T';
          current += 1;
        }
        break;

      case 'F':
        primary += 'F';
        secondary += 'F';
        current = word[current + 1] === 'F' ? current + 2 : current + 1;
        break;

      case 'G':
        if (stringAt(current, 2, 'GH')) {
          if (current > 0 && !isVowel(current - 1)) {
            primary += 'K';
            secondary += 'K';
          }
          current += 2;
        } else if (stringAt(current, 2, 'GN')) {
          primary += 'N';
          secondary += 'KN';
          current += 2;
        } else if (stringAt(current, 2, 'GE', 'GI', 'GY')) {
          primary += 'J';
          secondary += 'K';
          current += 2;
        } else {
          primary += 'K';
          secondary += 'K';
          current = word[current + 1] === 'G' ? current + 2 : current + 1;
        }
        break;

      case 'H':
        if ((current === 0 || !isVowel(current - 1)) && isVowel(current + 1)) {
          primary += 'H';
          secondary += 'H';
          current += 2;
        } else {
          current += 1;
        }
        break;

      case 'J':
        primary += 'J';
        secondary += 'J';
        current = word[current + 1] === 'J' ? current + 2 : current + 1;
        break;

      case 'K':
        primary += 'K';
        secondary += 'K';
        current = word[current + 1] === 'K' ? current + 2 : current + 1;
        break;

      case 'L':
        primary += 'L';
        secondary += 'L';
        current = word[current + 1] === 'L' ? current + 2 : current + 1;
        break;

      case 'M':
        primary += 'M';
        secondary += 'M';
        current = word[current + 1] === 'M' ? current + 2 : current + 1;
        break;

      case 'N':
        primary += 'N';
        secondary += 'N';
        current = word[current + 1] === 'N' ? current + 2 : current + 1;
        break;

      case 'P':
        if (stringAt(current, 2, 'PH')) {
          primary += 'F';
          secondary += 'F';
          current += 2;
        } else {
          primary += 'P';
          secondary += 'P';
          current = stringAt(current + 1, 1, 'P', 'B') ? current + 2 : current + 1;
        }
        break;

      case 'Q':
        primary += 'K';
        secondary += 'K';
        current = word[current + 1] === 'Q' ? current + 2 : current + 1;
        break;

      case 'R':
        primary += 'R';
        secondary += 'R';
        current = word[current + 1] === 'R' ? current + 2 : current + 1;
        break;

      case 'S':
        if (stringAt(current, 2, 'SH')) {
          primary += 'X';
          secondary += 'X';
          current += 2;
        } else if (stringAt(current, 3, 'SIO', 'SIA')) {
          primary += 'S';
          secondary += 'X';
          current += 3;
        } else {
          primary += 'S';
          secondary += 'S';
          current = stringAt(current + 1, 1, 'S', 'Z') ? current + 2 : current + 1;
        }
        break;

      case 'T':
        if (stringAt(current, 4, 'TION')) {
          primary += 'XN';
          secondary += 'XN';
          current += 4;
        } else if (stringAt(current, 3, 'TIA', 'TCH')) {
          primary += 'X';
          secondary += 'X';
          current += 3;
        } else if (stringAt(current, 2, 'TH')) {
          primary += 'T';
          secondary += 'T';
          current += 2;
        } else {
          primary += 'T';
          secondary += 'T';
          current = stringAt(current + 1, 1, 'T', 'D') ? current + 2 : current + 1;
        }
        break;

      case 'V':
        primary += 'F';
        secondary += 'F';
        current = word[current + 1] === 'V' ? current + 2 : current + 1;
        break;

      case 'W':
        if (isVowel(current + 1)) {
          primary += 'F';
          secondary += 'F';
        }
        current += 1;
        break;

      case 'X':
        primary += 'KS';
        secondary += 'KS';
        current = stringAt(current + 1, 1, 'C', 'X') ? current + 2 : current + 1;
        break;

      case 'Z':
        primary += 'S';
        secondary += 'S';
        current = stringAt(current + 1, 1, 'Z') ? current + 2 : current + 1;
        break;

      default:
        current += 1;
        break;
    }
  }

  return [primary, secondary];
}

/**
 * Compares two tokens using Double Metaphone phonetic matching.
 * Returns similarity 1.0 (exact phonetic), 0.95 (alternate phonetic), 0.85 (prefix phonetic), or 0.0.
 */
export function phoneticSimilarity(tok1, tok2) {
  if (!tok1 || !tok2) return 0.0;
  const t1 = tok1.toLowerCase().trim();
  const t2 = tok2.toLowerCase().trim();
  if (t1 === t2) return 1.0;

  // Short tokens <= 3 chars or generic system words should NEVER match via fuzzy phonetics
  if (t1.length < 4 || t2.length < 4) return 0.0;
  const GENERIC_WORDS = ['file', 'files', 'doc', 'docs', 'document', 'pdf', 'scan', 'copy', 'page', 'text', 'random', 'order', 'misc'];
  if (GENERIC_WORDS.includes(t1) || GENERIC_WORDS.includes(t2)) return 0.0;

  const [p1, s1] = doubleMetaphone(t1);
  const [p2, s2] = doubleMetaphone(t2);
  if (!p1 || !p2) return 0.0;

  if (p1 === p2) return 1.0;
  if ((s1 && s1 === p2) || (s2 && p1 === s2) || (s1 && s2 && s1 === s2)) return 0.95;
  if (p1.length >= 3 && p2.length >= 3 && (p1.startsWith(p2) || p2.startsWith(p1))) return 0.85;

  return 0.0;
}

/**
 * Filename-Based Smart Matching Engine (Strictly Non-OCR)
 * Features:
 * 1. 3-Layer Indian Phonetic & Fuzzy Matching (Layer 1 Pre-Normalizer, Layer 2 Double Metaphone, Layer 3 Hybrid Scoring)
 * 2. Order-independent token matching (e.g. '12th Marksheet Vijay' = 'Marksheet Vijay 12th')
 * 3. Fuzzy typo tolerance (Levenshtein similarity >= 80% matches 'Marksheetdd', 'Adhar', 'Bonfide')
 * 4. Strict numeric guard (never confuses distinct standards like '10' vs '12' or '1st' vs '2nd')
 * 5. Dynamic Preset Documents integration
 * Thresholds: >= 80% High Confidence (Auto-Selected), 50-79% Needs Review, < 50% Unmatched
 */
export function matchFilenameSmart(filename, studentName = '', groups = null, presetDocuments = null) {
  if (!filename || typeof filename !== 'string') {
    return {
      docType: null,
      canonical: null,
      code: null,
      confidence: 0,
      isConfident: false,
      reason: 'Empty filename'
    };
  }

  const baseOriginal = cleanName(filename).trim();
  if (!baseOriginal) {
    return {
      docType: null,
      canonical: null,
      code: null,
      confidence: 0,
      isConfident: false,
      reason: 'Empty basename'
    };
  }

  // Layer 1: Indian English Pre-Normalization
  const indianNormalized = normalizeIndianText(baseOriginal);
  const spellingFixed = correctSpelling(baseOriginal, DEFAULT_SPELLING_RULES);
  const normalized = spellingFixed.replace(/[_\-\.\+,\(\)\[\]]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const fileTokens = extractCleanTokens(spellingFixed);
  const indianTokens = extractCleanTokens(indianNormalized);
  const combinedFileTokens = Array.from(new Set([...fileTokens, ...indianTokens]));
  const fileStandards = extractNumericStandards(combinedFileTokens);

  // 0. Active User-Configured Preset / Shortcut Documents Match (Primary Source of Truth)
  if (presetDocuments) {
    const pList = Array.isArray(presetDocuments) ? presetDocuments : Object.values(presetDocuments);
    for (const pDoc of pList) {
      if (!pDoc) continue;
      const docName = (typeof pDoc === 'string' ? pDoc : (pDoc.name || pDoc.canonical || (Array.isArray(pDoc) ? pDoc[0] : ''))).trim().toUpperCase();
      if (!docName) continue;
      const docCode = (pDoc.code || (Array.isArray(pDoc) && pDoc[2]) || '').trim().toUpperCase();
      const rawKws = pDoc.keywords || (Array.isArray(pDoc) && pDoc[1]) || [];
      const kws = Array.isArray(rawKws) ? rawKws : (typeof rawKws === 'string' ? rawKws.split(',').map(s => s.trim()) : []);

      const pDocTokens = extractCleanTokens(docName);
      const pDocStandards = extractNumericStandards(pDocTokens);
      if (hasNumericConflict(fileStandards, pDocStandards)) {
        continue;
      }

      // A. Check exact shortcode match as token
      if (docCode) {
        const codePat = new RegExp(`(^|[^a-z0-9])${docCode}([^a-z0-9]|$)`, 'i');
        if (codePat.test(spellingFixed) || codePat.test(baseOriginal) || codePat.test(indianNormalized)) {
          return {
            docType: docName,
            canonical: CANONICAL_NAMES[docName] || docName,
            code: docCode,
            confidence: 95,
            isConfident: true,
            reason: `Preset shortcode match (${docCode})`
          };
        }
      }

      // B. Check exact or clean full document name match
      const docNameClean = docName.toLowerCase();
      const docNameNorm = normalizeIndianText(docNameClean);
      if (normalized === docNameClean || indianNormalized === docNameNorm ||
        normalized.startsWith(docNameClean + ' ') || normalized.endsWith(' ' + docNameClean) || normalized.includes(' ' + docNameClean + ' ') ||
        indianNormalized.startsWith(docNameNorm + ' ') || indianNormalized.endsWith(' ' + docNameNorm) || indianNormalized.includes(' ' + docNameNorm + ' ')) {
        return {
          docType: docName,
          canonical: CANONICAL_NAMES[docName] || docName,
          code: docCode || null,
          confidence: 100,
          isConfident: true,
          reason: 'Exact preset document match'
        };
      }

      // C. Check keywords (including Indian normalized variants)
      for (const kw of kws) {
        const kwClean = kw.toLowerCase().trim();
        if (!kwClean) continue;
        const kwNorm = normalizeIndianText(kwClean);

        // Choice 1-A Strict Stop-Word Isolation: Never match generic stop-words as standalone keyword
        if (GENERIC_STOP_KEYWORDS.has(kwClean) || GENERIC_STOP_KEYWORDS.has(kwNorm)) {
          continue;
        }

        if (kwClean.length <= 3) {
          const kwPat = new RegExp(`(^|[^a-z0-9])${kwClean}([^a-z0-9]|$)`, 'i');
          if (kwPat.test(spellingFixed) || kwPat.test(baseOriginal) || kwPat.test(indianNormalized)) {
            return {
              docType: docName,
              canonical: CANONICAL_NAMES[docName] || docName,
              code: docCode || null,
              confidence: 95,
              isConfident: true,
              reason: `Preset keyword match (${kwClean})`
            };
          }
        } else {
          // Word boundary check for kwClean and kwNorm to prevent false substring collisions
          const kwCleanEsc = kwClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const kwCleanPat = new RegExp(`(^|[^a-z0-9])${kwCleanEsc}([^a-z0-9]|$)`, 'i');
          let matchedKw = false;

          if (kwCleanPat.test(normalized) || kwCleanPat.test(indianNormalized)) {
            matchedKw = true;
          } else if (kwNorm && kwNorm.length >= 4 && !GENERIC_STOP_KEYWORDS.has(kwNorm)) {
            const kwNormEsc = kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const kwNormPat = new RegExp(`(^|[^a-z0-9])${kwNormEsc}([^a-z0-9]|$)`, 'i');
            if (kwNormPat.test(indianNormalized)) {
              matchedKw = true;
            }
          }

          if (matchedKw) {
            return {
              docType: docName,
              canonical: CANONICAL_NAMES[docName] || docName,
              code: docCode || null,
              confidence: 90,
              isConfident: true,
              reason: `Preset keyword match (${kwClean})`
            };
          }
        }
      }
    }
  }

  // 1. Direct Pattern Match (Regex & Groups)
  let directMatch = evaluateMatch(spellingFixed, groups);
  if (!directMatch.docType) {
    directMatch = evaluateMatch(indianNormalized, groups);
  }
  if (!directMatch.docType) {
    directMatch = evaluateMatch(baseOriginal, groups);
  }

  // 2. Exact or Word-Boundary Shortcut Match
  const shortcutDoc = matchDocument(spellingFixed, groups) || matchDocument(indianNormalized, groups) || matchDocument(baseOriginal, groups);

  if (directMatch && directMatch.docType) {
    const upperDoc = directMatch.docType.toUpperCase();
    const canon = CANONICAL_NAMES[upperDoc] || upperDoc;
    const canonUpper = canon.toUpperCase();
    const normUpper = baseOriginal.toUpperCase().replace(/\s+/g, ' ').trim();
    let isExact = false;
    if (studentName && studentName.trim()) {
      const sUpper = studentName.trim().toUpperCase().replace(/\s+/g, ' ');
      if (normUpper === `${canonUpper} ${sUpper}` || normUpper === `${upperDoc} ${sUpper}`) {
        isExact = true;
      }
    }
    if (!isExact && (normUpper === canonUpper || normUpper === upperDoc)) {
      isExact = true;
    }
    return {
      docType: upperDoc,
      canonical: canon,
      code: null,
      confidence: isExact ? 100 : 95,
      isConfident: true,
      reason: isExact ? 'Exact match' : 'Pattern match'
    };
  }

  if (shortcutDoc) {
    const upperDoc = shortcutDoc.toUpperCase();
    const canon = CANONICAL_NAMES[upperDoc] || upperDoc;
    const canonUpper = canon.toUpperCase();
    const normUpper = baseOriginal.toUpperCase().replace(/\s+/g, ' ').trim();
    let isExact = false;
    if (studentName && studentName.trim()) {
      const sUpper = studentName.trim().toUpperCase().replace(/\s+/g, ' ');
      if (normUpper === `${canonUpper} ${sUpper}` || normUpper === `${upperDoc} ${sUpper}`) {
        isExact = true;
      }
    }
    if (!isExact && (normUpper === canonUpper || normUpper === upperDoc)) {
      isExact = true;
    }
    return {
      docType: upperDoc,
      canonical: canon,
      code: null,
      confidence: isExact ? 100 : 90,
      isConfident: true,
      reason: isExact ? 'Exact match' : 'Shortcut match'
    };
  }

  // 3. Profiles Dictionary
  const PROFILES = [
    { type: '12TH LC', code: '12LC', patterns: [/\b12(th)?\s*(lc|tc|leaving|l)\b/i, /\b12l\b/i], tokens: ['12th lc', '12 lc', '12th tc', '12 tc', '12th leaving', '12 leaving', '12lc', '12l', 'leaving certificate', 'school leaving', 'tc', 'transfer certificate', 'skool leaving'], primary: ['lc', 'tc', 'leaving', 'transfer', '12l', '12lc'], qualifier: ['12', '12th', 'hsc'], standard: '12' },
    { type: '12TH MARKSHEET AND PASSING CERTIFICATE', code: '12MP', tokens: ['12mp', '12tmp', '12th passing marksheet', '12 marksheet passing', '12th marksheet and passing', '12th combined', '12th markshit and pasing'], standard: '12', minScore: 90 },
    { type: '10TH MARKSHEET AND PASSING CERTIFICATE', code: '10MP', tokens: ['10mp', '10tmp', '10th passing marksheet', '10 marksheet passing', '10th marksheet and passing', '10th combined', '10th markshit and pasing'], standard: '10', minScore: 90 },
    { type: '12TH MARKSHEET', code: '12M', patterns: [/\b12(th)?\s*(m|mark|marksheet|hsc)\b/i, /\bhsc\s*mark/i], tokens: ['12th marksheet', 'hsc marksheet', '12 marksheet', '12th mark', '12m', 'hsc', '12th markshit', 'baravi markshit'], primary: ['marksheet', 'markshet', 'mark', 'markshit'], qualifier: ['12', '12th', 'hsc', 'baravi'], standard: '12' },
    { type: '10TH MARKSHEET', code: '10M', patterns: [/\b10(th)?\s*(m|mark|marksheet|ssc)\b/i, /\bssc\s*mark/i], tokens: ['10th marksheet', 'ssc marksheet', '10 marksheet', '10th mark', '10m', 'ssc', '10th markshit', 'dahavi markshit'], primary: ['marksheet', 'markshet', 'mark', 'markshit'], qualifier: ['10', '10th', 'ssc', 'dahavi'], standard: '10' },
    { type: '12TH PASSING CERTIFICATE', code: '12P', tokens: ['12th passing', 'hsc passing', '12p', '12th pass', '12th pasing', 'hsc pasing'], primary: ['passing', 'sanad', 'pasing'], qualifier: ['12', '12th', 'hsc'], standard: '12' },
    { type: '10TH PASSING CERTIFICATE', code: '10P', tokens: ['10th passing', 'ssc passing', '10p', '10th pass', '10th pasing', 'ssc pasing'], primary: ['passing', 'sanad', 'pasing'], qualifier: ['10', '10th', 'ssc'], standard: '10' },
    { type: '10TH LC', code: '10LC', patterns: [/\b10(th)?\s*(lc|tc|leaving|l)\b/i, /\b10l\b/i], tokens: ['10th lc', '10 lc', '10th tc', '10 tc', '10th leaving', '10 leaving', '10lc', '10l'], primary: ['lc', 'tc', 'leaving', 'transfer', '10l', '10lc'], qualifier: ['10', '10th', 'ssc'], standard: '10' },
    { type: 'AADHAAR CARD', code: 'ADR', tokens: ['aadhaar', 'adhar', 'aadhar', 'adr', 'uid', 'uidai', 'adhaar', 'adhar card', 'aadhar card'], primary: ['aadhaar', 'adhar', 'aadhar', 'adr'] },
    { type: 'CASTE VALIDITY CERTIFICATE', code: 'VAL', tokens: ['caste validity', 'validity', 'val', 'vld', 'cvc', 'padtalni', 'tribe validity', 'cast validity', 'kast validity', 'cast validiti', 'caste validiti', 'validiti'], primary: ['validity', 'padtalni', 'validiti', 'val', 'cvc'] },
    { type: 'CASTE CERTIFICATE', code: 'CST', patterns: [/\b(cst|cas|caste|kcast|kast)\b/i], tokens: ['caste certificate', 'caste cert', 'cst', 'cas', 'caste', 'jati', 'jati pramanpatra', 'kcast', 'kast', 'sartificat', 'dakhla'], primary: ['caste', 'jati', 'cst', 'cas', 'kcast', 'kast'] },
    { type: 'DOMICILE AND NATIONALITY CERTIFICATE', code: 'DOMNAT', tokens: ['domicile and nationality', 'domicile nationality', 'nationality domicile', 'domicile and nationality certificate', 'domnat', 'natdom', 'dn'], primary: ['domicile and nationality', 'domnat', 'natdom'], minScore: 90 },
    { type: 'DOMICILE CERTIFICATE', code: 'DOM', tokens: ['domicile', 'dom', 'adivasi', 'rahavasi', 'residential certificate', 'residence', 'adhiwas', 'domisail', 'domicil', 'rehivasi', 'dakhla'], primary: ['domicile', 'dom', 'adivasi', 'rahavasi', 'domisail', 'rehivasi'] },
    { type: 'NATIONALITY CERTIFICATE', code: 'NAT', tokens: ['nationality', 'nat', 'rashtriyatva', 'nationality proof'], primary: ['nationality', 'nat', 'rashtriyatva'] },
    { type: 'INCOME CERTIFICATE', code: 'INC', patterns: [/\b(income|inc|utpanna|incom)\b/i, /\bin\s*\(\d+\)/i, /\bin\./i, /\binc\b/i], tokens: ['income certificate', 'income cert', 'inc', 'in', 'utpanna', 'tahsildar', 'utpanna dakhla', 'form 16', 'incom', 'dakhla'], primary: ['income', 'inc', 'utpanna', 'incom'] },
    { type: 'NON CREAMY LAYER CERTIFICATE', code: 'NCL', tokens: ['non creamy', 'creamy layer', 'ncl', 'noncreamy', 'non criminal', 'non crimiler', 'unnath va pragat'], primary: ['ncl', 'non creamy', 'creamy', 'non crimiler'] },
    { type: 'RATION CARD', code: 'RAT', tokens: ['ration card', 'ration', 'rat', 'rc', 'shidha patrika', 'rashan', 'rasan', 'rashan kard'], primary: ['ration', 'rat', 'rashan'] },
    { type: 'PHOTO', code: 'PIC', tokens: ['passport photo', 'photo', 'photograph', 'pic', 'image', 'student photo', 'foto'], primary: ['photo', 'pic', 'photograph', 'foto'] },
    { type: 'SIGNATURE', code: 'SIG', tokens: ['signature', 'sign', 'signatur', 'sahi', 'student sign'], primary: ['signature', 'sign', 'signatur', 'sahi'] },
    { type: 'BANK PASSBOOK', code: 'BNK', tokens: ['bank passbook', 'passbook', 'bank statement', 'account', 'passbook bank', 'npci seeded', 'bank pasbuk', 'pasbuk'], primary: ['passbook', 'bank', 'pasbuk'] },
    { type: 'PAN CARD', code: 'PAN', tokens: ['pan card', 'pancard', 'pan', 'permanent account number', 'pan kard'], primary: ['pan', 'pancard'] },
    { type: 'GAP CERTIFICATE', code: 'GAP', tokens: ['gap certificate', 'gap affidavit', 'gap cert', 'affidavit for gap', 'educational gap', 'gap sartifiket'], primary: ['gap', 'affidavit'] },
    { type: 'BONAFIDE CERTIFICATE', code: 'BON', tokens: ['bonafide certificate', 'bonafide cert', 'bonfide', 'bnf', 'bonafied', 'bon', 'bonafaid'], primary: ['bonafide', 'bonfide', 'bon', 'bonafaid'] },
    { type: 'SELF DECLARATION', code: 'SDC', patterns: [/\bself\s*declaration\b/i, /\bsvayam\s*ghoshana\b/i, /\bsdc\b/i, /\bslf\b/i, /\bself\s*declarashan\b/i], tokens: ['self declaration', 'undertaking', 'declaration form', 'pratigyapatra', 'svayam', 'sdc', 'swayam ghoshnapatra', 'self declarashan'], primary: ['declaration', 'undertaking', 'self', 'sdc'] },
    { type: 'PARENT DECLARATION', code: 'PDC', patterns: [/\bparent\s*(declaration|undertaking|form)\b/i, /\bpalak\s*(ghoshana|pratigya|pratigyapatra|declaration|undertaking)\b/i, /\bpdc\b/i, /\bhamipatra\b/i], tokens: ['parent declaration', 'palak ghoshana', 'palak declaration', 'parent undertaking', 'pdc', 'hamipatra'], primary: ['parent declaration', 'palak ghoshana', 'pdc', 'hamipatra'] },
    { type: 'ATTEMPT CERTIFICATE', code: 'ATM', tokens: ['attempt certificate', 'attempt', 'atm', 'atempt sartificat'], primary: ['attempt', 'atm', 'atempt'] },
    { type: 'BIRTH CERTIFICATE', code: 'BRT', tokens: ['birth certificate', 'janma dakhla', 'brt', 'birth', 'dob proof', 'birth dakhla', 'janam dakhla'], primary: ['birth', 'janma', 'brt', 'janam'] },
    { type: 'CAP ALLOTMENT LETTER', code: 'CAP', tokens: ['allotment letter', 'cap allotment', 'merit list', 'cap letter', 'admission confirmation'], primary: ['allotment', 'cap'] },
    { type: 'FEE RECEIPT', code: 'FEE', patterns: [/\b(fee|fees|tuition)\s*(receipt|reciept|risit|slip|challan|payment)\b/i, /\b(fee|fees)\b/i], tokens: ['fee receipt', 'admission fee receipt', 'tuition fee', 'fee', 'fee risit', 'fees receipt'], primary: ['fee', 'fees'], qualifier: ['receipt', 'reciept', 'risit', 'slip', 'payment'] },
    { type: 'ATTENDANCE CERTIFICATE', code: 'ATT', tokens: ['attendance certificate', 'college attendance', 'attendance'], primary: ['attendance'] },
    { type: 'HOSTEL CERTIFICATE', code: 'HST', tokens: ['hostel certificate', 'rent agreement', 'private hostel proof', 'hostel', 'vasatigruh dakhla'], primary: ['hostel', 'vasatigruh'] },
    { type: 'DEATH CERTIFICATE', code: 'DTH', tokens: ['death certificate', 'father death certificate', 'mrutyu pramanpatra', 'death', 'mrutyu dakhla'], primary: ['death', 'mrutyu'] },
    { type: 'NON HOSTEL DECLARATION', code: 'NHC', tokens: ['non hostel declaration', 'government hostel non allotment', 'warden letter', 'nhc'], primary: ['non hostel', 'nhc'] },
    { type: 'DISABILITY CERTIFICATE', code: 'DIS', tokens: ['disability certificate', 'divyang', 'pwd certificate', 'udid', 'dis', 'pwd', 'divyang cert'], primary: ['disability', 'divyang', 'dis', 'pwd'] },
    { type: 'APAAR ID', code: 'APR', tokens: ['apaar id', 'abc id', 'academic bank of credits', 'apaar', 'apr'], primary: ['apaar', 'apr', 'abc'] },
    { type: 'CET APPLICATION FORM', code: 'CETAF', tokens: ['cet application form', 'cet application confirmation', 'cap registration form', 'cetaf', 'cet aplication form'], primary: ['cetaf', 'cet application', 'aplication'] },
    { type: 'CET SCORE CARD', code: 'CETSC', tokens: ['cet score card', 'cet result', 'scorecard', 'neet score card', 'cetsc', 'cet score kard'], primary: ['cetsc', 'score card', 'scorecard'] },
    { type: 'STATUS RETENTION FORM', code: 'SRF', tokens: ['status retention form', 'retention form', 'cet retention', 'srf'], primary: ['retention', 'srf'] },
    { type: 'EWS CERTIFICATE', code: 'EWS', tokens: ['ews certificate', 'economically weaker section', 'ews', 'ews dakhla'], primary: ['ews'] },
    { type: 'MIGRATION CERTIFICATE', code: 'MIG', tokens: ['migration certificate', 'migration', 'mig', 'migrashan cert'], primary: ['migration', 'mig', 'migrashan'] },
    { type: 'MEDICAL FITNESS CERTIFICATE', code: 'MED', tokens: ['medical fitness certificate', 'fitness certificate', 'health certificate', 'med', 'medical fitnes', 'arogya dakhla'], primary: ['fitness', 'medical', 'med', 'arogya'] },
    { type: 'VOTER ID', code: 'VOT', tokens: ['voter id', 'election card', 'epic', 'vot', 'woter id', 'woter'], primary: ['voter', 'vot', 'woter'] },
    { type: 'DRIVING LICENSE', code: 'DL', tokens: ['driving license', 'dl', 'licence', 'license', 'drivin lisence'], primary: ['driving', 'license', 'dl', 'drivin'] },
    { type: '11TH MARKSHEET', code: '11M', tokens: ['11th marksheet', '11th mark', '11m'], primary: ['11th', '11m'] },
    { type: '1ST YEAR MARKSHEET', code: '1YM', tokens: ['1st year marksheet', 'first year marksheet', 'fy marksheet', 'sem 1', 'sem 2', '1ym', '1st year markshit', 'fy markshit'], primary: ['1st year', 'fy marksheet', '1ym'] },
    { type: '2ND YEAR MARKSHEET', code: '2YM', tokens: ['2nd year marksheet', 'second year marksheet', 'sy marksheet', 'sem 3', 'sem 4', '2ym', '2nd year markshit', 'sy markshit'], primary: ['2nd year', 'sy marksheet', '2ym'] },
    { type: '3RD YEAR MARKSHEET', code: '3YM', tokens: ['3rd year marksheet', 'third year marksheet', 'ty marksheet', 'sem 5', 'sem 6', '3ym', '3rd year markshit', 'ty markshit'], primary: ['3rd year', 'ty marksheet', '3ym'] },
    { type: '4TH YEAR MARKSHEET', code: '4YM', tokens: ['4th year marksheet', 'fourth year marksheet', 'final year marksheet', '4ym'], primary: ['4th year', '4ym'] },
    { type: 'PASSING CERTIFICATE', code: 'DPC', tokens: ['passing certificate', 'degree passing', 'diploma passing', 'provisional certificate', 'dpc'], primary: ['passing', 'dpc'] },
    { type: 'DEGREE CERTIFICATE', code: 'DEG', tokens: ['degree certificate', 'convocation certificate', 'diploma certificate', 'deg', 'digree convocation'], primary: ['degree', 'deg', 'digree'] },
    { type: 'REGISTRATION CERTIFICATE', code: 'REG', tokens: ['registration certificate', 'council registration', 'mnc registration', 'nursing registration', 'reg'], primary: ['registration', 'reg'] },
    { type: 'INTERNSHIP CERTIFICATE', code: 'INT', tokens: ['internship certificate', 'internship completion', 'clinical experience', 'int'], primary: ['internship', 'int'] },
    { type: 'CHARACTER CERTIFICATE', code: 'CHR', tokens: ['character certificate', 'conduct certificate', 'charitra dakhla', 'chr'], primary: ['character', 'chr'] },
    { type: 'GAZETTE CERTIFICATE', code: 'GAZ', tokens: ['gazette certificate', 'name change gazette', 'rajpatra', 'marriage certificate', 'gaz'], primary: ['gazette', 'gaz'] },
    { type: 'MINORITY CERTIFICATE', code: 'MIN', tokens: ['minority certificate', 'minority declaration', 'alpsankhyank pramanpatra', 'minority proof', 'min'], primary: ['minority', 'min'] }
  ];

  // Merge any dynamically configured preset documents
  if (presetDocuments) {
    const list = Array.isArray(presetDocuments) ? presetDocuments : Object.values(presetDocuments);
    for (const item of list) {
      const docName = (typeof item === 'string' ? item : (item.name || (Array.isArray(item) ? item[0] : ''))).toUpperCase();
      if (!docName) continue;
      const docCode = (item.code || (Array.isArray(item) && item[2]) || '').toUpperCase();
      const rawKws = item.keywords || (Array.isArray(item) && item[1]) || [];
      const kws = Array.isArray(rawKws) ? rawKws : (typeof rawKws === 'string' ? rawKws.split(',').map(k => k.trim()) : []);

      const existing = PROFILES.find(p => p.type === docName || (p.code && docCode && p.code.toUpperCase() === docCode));
      if (existing) {
        existing.type = docName;
        existing.code = docCode;
        existing.tokens = [docName.toLowerCase(), ...kws.map(k => k.toLowerCase())];
      } else {
        const itemTokens = extractCleanTokens(docName);
        const itemStandards = extractNumericStandards(itemTokens);
        const std = itemStandards.size > 0 ? Array.from(itemStandards)[0] : null;
        PROFILES.push({
          type: docName,
          code: docCode,
          tokens: [docName.toLowerCase(), ...kws.map(k => k.toLowerCase())],
          primary: itemTokens.filter(t => !['certificate', 'card', 'form', 'letter', 'doc'].includes(t)),
          standard: std
        });
      }
    }
  }

  let bestMatch = null;
  let highestScore = 0;

  for (const prof of PROFILES) {
    // Numeric Guard: if profile specifies standard (e.g. '12' or '10'), verify against filename standards
    const targetStandards = prof.standard ? new Set([prof.standard]) : extractNumericStandards(extractCleanTokens(prof.type));
    if (hasNumericConflict(fileStandards, targetStandards)) {
      continue; // Strictly skip conflicting standard!
    }

    // Safety Guard: Caste Certificate must strictly never match validity-related files
    if (prof.type === 'CASTE CERTIFICATE') {
      const hasValidity = /\b(validity|validiti|padtalni|padtalani|cvc|val)\b/i.test(normalized) ||
        /\b(validity|validiti|padtalni|cvc|val)\b/i.test(indianNormalized) ||
        combinedFileTokens.some(t => ['validity', 'validiti', 'padtalni', 'cvc'].includes(t));
      if (hasValidity) {
        continue;
      }
    }

    let score = 0;

    // A. Direct & Indian Normalized Pattern Test
    if (prof.patterns) {
      for (const pat of prof.patterns) {
        if (pat.test(normalized) || pat.test(indianNormalized)) {
          score = Math.max(score, 90);
          break;
        }
      }
    }

    // B. Substring & Exact Token Test
    if (prof.tokens) {
      for (const tok of prof.tokens) {
        const tokClean = tok.toLowerCase().trim();
        if (!tokClean) continue;
        const tokNorm = normalizeIndianText(tokClean);
        if (tokClean.length <= 3) {
          const wordPat = new RegExp(`(^|[^a-z0-9])${tokClean}([^a-z0-9]|$)`, 'i');
          if (wordPat.test(normalized) || wordPat.test(indianNormalized)) {
            score = Math.max(score, 90);
            break;
          }
        } else if (normalized.includes(tokClean) || indianNormalized.includes(tokClean) || indianNormalized.includes(tokNorm)) {
          score = Math.max(score, 90);
          break;
        }
      }
    }

    // C. Layer 2: Double Metaphone & Token Phonetic Matching
    const reqTokens = extractCleanTokens(prof.type);
    if (reqTokens.length > 0) {
      let matchedCount = 0;
      let totalPhoneticScore = 0;

      for (const rt of reqTokens) {
        const rtStd = getNumericStandard(rt);
        if (rtStd) {
          if (fileStandards.has(rtStd)) {
            matchedCount++;
            totalPhoneticScore += 1.0;
          }
          continue;
        }

        // Ignore common stop words for matching
        if (['and', 'for', 'the', 'of'].includes(rt)) {
          matchedCount++;
          totalPhoneticScore += 1.0;
          continue;
        }

        let bestTokenScore = 0;
        for (const ft of combinedFileTokens) {
          if (ft === rt) {
            bestTokenScore = 1.0;
            break;
          }
          // Layer 1 normalized match
          const ftNorm = normalizeIndianText(ft);
          const rtNorm = normalizeIndianText(rt);
          if (ftNorm === rtNorm || ft === rtNorm || ftNorm === rt) {
            bestTokenScore = Math.max(bestTokenScore, 0.95);
          }
          // Layer 2 Double Metaphone match
          const pSim = phoneticSimilarity(ft, rt);
          if (pSim > bestTokenScore) {
            bestTokenScore = pSim;
          }
          // Levenshtein similarity
          const lSim = stringSimilarity(ft, rt);
          if (lSim > bestTokenScore) {
            bestTokenScore = lSim;
          }
        }

        if (bestTokenScore >= 0.80) {
          matchedCount++;
          totalPhoneticScore += bestTokenScore;
        }
      }

      if (matchedCount === reqTokens.length && reqTokens.length > 0) {
        const avgScore = totalPhoneticScore / reqTokens.length;
        // Decision 1-A: Heavy phonetic matches achieve >= 85% confidence
        const calcScore = avgScore >= 0.98 ? 95 : (avgScore >= 0.85 ? Math.round(85 + (avgScore - 0.85) * 50) : Math.round(80 + (avgScore - 0.80) * 50));
        score = Math.max(score, calcScore);
      } else if (matchedCount >= 1 && reqTokens.length <= 2 && !['card', 'certificate', 'receipt', 'form', 'letter'].includes(reqTokens[0])) {
        const firstTokenMatched = combinedFileTokens.some(ft => {
          return ft === reqTokens[0] || phoneticSimilarity(ft, reqTokens[0]) >= 0.85 || normalizeIndianText(ft) === reqTokens[0];
        });
        if (firstTokenMatched) {
          score = Math.max(score, 85);
        }
      }
    }

    // D. Primary & Qualifier Evaluation with Phonetics
    if (prof.primary && prof.qualifier) {
      const hasPrim = prof.primary.some(p => {
        return combinedFileTokens.some(ft => ft === p || phoneticSimilarity(ft, p) >= 0.85 || normalizeIndianText(ft) === p || stringSimilarity(ft, p) >= 0.80);
      });
      const hasQual = prof.qualifier.some(q => {
        const pat = new RegExp(`(^|[^a-z0-9])${q}([^a-z0-9]|$)`, 'i');
        return pat.test(normalized) || pat.test(indianNormalized);
      });
      if (hasPrim && hasQual) {
        score = Math.max(score, 90);
      } else if (hasPrim && !hasQual && !prof.standard) {
        score = Math.max(score, 50);
      }
    } else if (prof.primary) {
      const hasPrim = prof.primary.some(p => {
        return combinedFileTokens.some(ft => ft === p || phoneticSimilarity(ft, p) >= 0.85 || normalizeIndianText(ft) === p || stringSimilarity(ft, p) >= 0.80);
      });
      if (hasPrim) {
        score = Math.max(score, 85);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = prof;
    }
  }

  // Bonus for student name match in filename
  if (studentName && studentName.trim() && highestScore > 0) {
    const studentTokens = studentName.trim().toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (studentTokens.some(tok => normalized.includes(tok) || indianNormalized.includes(tok))) {
      highestScore = Math.min(100, highestScore + 5);
    }
  }

  // Decision 3-B: Relaxed 50% cutoff
  if (bestMatch && highestScore >= 50) {
    const upperDoc = bestMatch.type.toUpperCase();
    const canon = CANONICAL_NAMES[upperDoc] || upperDoc;
    const canonUpper = canon.toUpperCase();
    const normUpper = baseOriginal.toUpperCase().replace(/\s+/g, ' ').trim();
    let isExact = false;
    if (studentName && studentName.trim()) {
      const sUpper = studentName.trim().toUpperCase().replace(/\s+/g, ' ');
      if (normUpper === `${canonUpper} ${sUpper}` || normUpper === `${upperDoc} ${sUpper}`) {
        isExact = true;
      }
    }
    if (!isExact && (normUpper === canonUpper || normUpper === upperDoc)) {
      isExact = true;
    }
    const finalConf = isExact ? 100 : highestScore;
    return {
      docType: bestMatch.type,
      canonical: canon,
      code: bestMatch.code || null,
      confidence: finalConf,
      isConfident: finalConf >= 80,
      reason: isExact ? 'Exact match' : (finalConf >= 85 ? `Indian Phonetic match (${finalConf}%)` : `Filename token match (${finalConf}%)`)
    };
  }

  return {
    docType: null,
    canonical: null,
    code: null,
    confidence: highestScore,
    isConfident: false,
    reason: 'Below 50% threshold'
  };
}

/* ==========================================================================
   Cross-Check Powerhouse: Live Word Diff, Pattern Bar & Utility Functions
   ========================================================================== */

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Compute inline word diff between oldName and newName.
 * Marks deleted/changed words in red strikethrough, newly added words in bold emerald,
 * and student name in purple pill.
 */
export function computeWordDiff(oldName, newName, studentName = '') {
  const oldClean = cleanName(oldName);
  const newClean = cleanName(newName);
  const isIdentical = (oldClean === newClean);

  if (isIdentical) {
    return {
      oldHtml: escapeHtml(oldClean),
      newHtml: escapeHtml(newClean),
      isIdentical: true,
      changeType: 'identical'
    };
  }

  const isCaseOnly = (oldClean.toLowerCase() === newClean.toLowerCase());
  const sNorm = (studentName || '').replace(/\.[a-zA-Z0-9]+$/i, '').trim();

  // Tokenize into words and delimiters
  const oldTokens = oldClean.split(/(\s+|[_\-]+)/);
  const newTokens = newClean.split(/(\s+|[_\-]+)/);

  // Normalize tokens set for comparison
  const oldWordsLower = new Set(
    oldClean.toLowerCase().split(/[\s_\-]+/).filter(Boolean)
  );
  const newWordsLower = new Set(
    newClean.toLowerCase().split(/[\s_\-]+/).filter(Boolean)
  );
  const studentWordsLower = new Set(
    sNorm ? sNorm.toLowerCase().split(/[\s_\-]+/).filter(Boolean) : []
  );

  // Build oldHtml: words absent from newTokens get diff-del
  const oldHtmlParts = oldTokens.map(tok => {
    if (!tok.trim() || /^[_\-]+$/.test(tok)) {
      return escapeHtml(tok);
    }
    const lower = tok.toLowerCase();
    if (!newWordsLower.has(lower)) {
      return `<span class="diff-del">${escapeHtml(tok)}</span>`;
    }
    return `<span class="text-secondary">${escapeHtml(tok)}</span>`;
  });

  // For newHtml, check if whole student name is a contiguous substring
  let newHtmlParts = [];
  const sLower = sNorm.toLowerCase();
  const remainingNew = newClean;

  if (sNorm && remainingNew.toLowerCase().includes(sLower)) {
    const sIdx = remainingNew.toLowerCase().indexOf(sLower);
    const beforeStr = remainingNew.slice(0, sIdx);
    const studentStr = remainingNew.slice(sIdx, sIdx + sLower.length);
    const afterStr = remainingNew.slice(sIdx + sLower.length);

    const renderSegment = (str) => {
      const tokens = str.split(/(\s+|[_\-]+)/);
      return tokens.map(tok => {
        if (!tok.trim() || /^[_\-]+$/.test(tok)) return escapeHtml(tok);
        const lower = tok.toLowerCase();
        if (!oldWordsLower.has(lower)) {
          return `<span class="diff-add">${escapeHtml(tok)}</span>`;
        }
        return `<span class="text-on-surface font-semibold">${escapeHtml(tok)}</span>`;
      }).join('');
    };

    newHtmlParts.push(renderSegment(beforeStr));
    newHtmlParts.push(`<span class="diff-student">${escapeHtml(studentStr)}</span>`);
    newHtmlParts.push(renderSegment(afterStr));
  } else {
    newHtmlParts = newTokens.map(tok => {
      if (!tok.trim() || /^[_\-]+$/.test(tok)) return escapeHtml(tok);
      const lower = tok.toLowerCase();
      if (studentWordsLower.has(lower)) {
        return `<span class="diff-student">${escapeHtml(tok)}</span>`;
      }
      if (!oldWordsLower.has(lower)) {
        return `<span class="diff-add">${escapeHtml(tok)}</span>`;
      }
      return `<span class="text-on-surface font-semibold">${escapeHtml(tok)}</span>`;
    });
  }

  let changeType = 'rename';
  if (isCaseOnly) {
    changeType = 'casing';
  } else if (sNorm && newClean.toLowerCase().includes(sLower) && !oldClean.toLowerCase().includes(sLower)) {
    changeType = 'student';
  }

  return {
    oldHtml: oldHtmlParts.join(''),
    newHtml: newHtmlParts.join(''),
    isIdentical: false,
    changeType
  };
}

/**
 * Format target filename given pattern bar options:
 * @param {string} docType - e.g. "10TH MARKSHEET 1"
 * @param {string} studentName - e.g. "ANJALI SANTOSH GAVIT"
 * @param {Object} options - { order: 'doc_student' | 'student_doc', separator: ' ' | '_' | '-', includeStudent: boolean, casing: 'upper' | 'title' | 'lower' }
 */
export function formatPatternName(docType, studentName, options = {}) {
  const {
    order = 'doc_student',
    separator = ' ',
    includeStudent = true,
    casing = 'upper'
  } = options;

  const doc = (docType || '').trim();
  const student = (studentName || '').trim();

  let parts = [];
  if (includeStudent && student) {
    if (order === 'student_doc') {
      parts = [student, doc];
    } else {
      parts = [doc, student];
    }
  } else {
    parts = [doc];
  }

  const combined = parts.filter(Boolean).join(separator);
  return applyCase(combined, casing);
}

/**
 * Clean scanner timestamps and junk from a filename:
 * e.g. "SCAN (1)", "IMG_20231122_123456", "WhatsApp Image 2023-11-22 at 12.30.45", "Doc_001 (1)"
 */
export function cleanScannerJunk(name) {
  if (!name) return '';
  let s = cleanName(name);
  s = s.replace(/WhatsApp\s*Image\s*\d{4}[-_]\d{2}[-_]\d{2}\s*(at\s*[\d\.]+)?/gi, '');
  s = s.replace(/(IMG|VID|DOC)[-_]\d{8}[-_]\d{4,6}/gi, '');
  s = s.replace(/\bSCAN\s*\(\d+\)/gi, '');
  s = s.replace(/\bSCAN[-_]?\d+/gi, '');
  s = s.replace(/\(\s*\)/g, '');
  s = s.replace(/[_\-]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * MahaDBT / Portal-Safe cleaner: ensures strictly alphanumeric + standard spaces/hyphens
 */
export function cleanPortalSafe(name) {
  if (!name) return '';
  let s = cleanName(name);
  s = s.replace(/[^a-zA-Z0-9\s\-_]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Calculates spelling error / mistake percentage between original filename and target name.
 * Compares normalized old name vs suggested target name (without file extension) using Levenshtein distance.
 * Returns 0 if names match or if difference is 0%.
 * 
 * Formula:
 * errorPercent = Math.round((editDistance / Math.max(oldLen, newLen)) * 100)
 */
export function computeOldNameErrorPercent(oldName, targetName, studentName = '') {
  if (!oldName || !targetName) return 0;

  // Strip file extensions
  const cleanOld = cleanName(oldName).trim();
  let cleanTarget = cleanName(targetName).trim();

  // If old name does not include student name, but target name does,
  // compare against the document portion so newly added student name isn't counted as an error.
  const sName = (studentName || '').trim();
  if (sName) {
    const sLower = sName.toLowerCase();
    const oldLower = cleanOld.toLowerCase();
    if (!oldLower.includes(sLower)) {
      const escaped = sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanTarget = cleanTarget.replace(new RegExp(`\\s*${escaped}\\s*`, 'i'), ' ').trim();
    }
  }

  // Normalize: lower case, standardize standard tokens (e.g. "10 th" -> "10th", "mark sheet" -> "marksheet"), collapse whitespace
  let normOld = cleanOld.toLowerCase()
    .replace(/(\d+)\s+(th|st|nd|rd)\b/gi, '$1$2')
    .replace(/\bmark\s+sheet\b/gi, 'marksheet')
    .replace(/[\s_\-]+/g, ' ')
    .trim();

  let normTarget = cleanTarget.toLowerCase()
    .replace(/(\d+)\s+(th|st|nd|rd)\b/gi, '$1$2')
    .replace(/\bmark\s+sheet\b/gi, 'marksheet')
    .replace(/[\s_\-]+/g, ' ')
    .trim();

  if (!normOld || !normTarget || normOld === normTarget) {
    return 0;
  }

  const dist = levenshteinDistance(normOld, normTarget);
  const maxLen = Math.max(normOld.length, normTarget.length);
  if (maxLen === 0) return 0;

  const pct = Math.round((dist / maxLen) * 100);
  return Math.min(100, Math.max(0, pct));
}

/**
 * Multi-Layer Smart Duplicate Detection Engine
 * 1. Priority 1 (50% Probable Duplicate): Exact byte size (size > 0) + exact file extension
 * 2. Priority 2 (100% Confirmed Duplicate): Identical SHA-256 hash OR canonical base document suffix collision
 * 
 * Returns Map<fileIdOrName, { status: 'confirmed' | 'probable' | null, reason: string }>
 */
export function detectDuplicateFiles(files) {
  const result = new Map();
  if (!Array.isArray(files) || files.length === 0) return result;

  // Initialize all to null
  files.forEach(f => {
    const key = f.id || f.name;
    result.set(key, { status: null, isMaster: false, reason: '' });
  });

  // Helper to find master index in a group: prefer unnumbered clean file, else index 0
  const findMasterIdx = (group, getNameFn) => {
    let idx = group.findIndex(item => {
      const name = getNameFn(item);
      return !/[\s_\-]+(\d+|\(\d+\))(?=\s|$)/i.test(name);
    });
    return idx >= 0 ? idx : 0;
  };

  // 1. Group by exact file.size + extension
  const sizeExtGroups = new Map();
  files.forEach(f => {
    const size = Number(f.size) || 0;
    const extStr = (f.ext || ext(f.name) || '').toLowerCase();
    if (size > 0 && extStr) {
      const groupKey = `${size}_${extStr}`;
      if (!sizeExtGroups.has(groupKey)) sizeExtGroups.set(groupKey, []);
      sizeExtGroups.get(groupKey).push(f);
    }
  });

  // 2. Mark Size + Ext matches as 'probable' (50% Dup) - Master copy stays clean (status: null)
  sizeExtGroups.forEach((group) => {
    if (group.length >= 2) {
      const masterIdx = findMasterIdx(group, f => cleanName(f.targetName || f.name || ''));
      group.forEach((f, idx) => {
        const key = f.id || f.name;
        if (idx === masterIdx) {
          const current = result.get(key);
          if (current) current.isMaster = true;
        } else {
          const current = result.get(key);
          if (!current || current.status !== 'confirmed') {
            result.set(key, { status: 'probable', isMaster: false, reason: 'Same file size & extension' });
          }
        }
      });
    }
  });

  // 3. Mark 100% Confirmed if SHA-256 hash matches - Master copy stays clean (status: null)
  const hashGroups = new Map();
  files.forEach(f => {
    if (f.sha256) {
      if (!hashGroups.has(f.sha256)) hashGroups.set(f.sha256, []);
      hashGroups.get(f.sha256).push(f);
    }
  });
  hashGroups.forEach((group) => {
    if (group.length >= 2) {
      const masterIdx = findMasterIdx(group, f => cleanName(f.targetName || f.name || ''));
      group.forEach((f, idx) => {
        const key = f.id || f.name;
        if (idx === masterIdx) {
          const current = result.get(key);
          if (current) {
            current.isMaster = true;
            current.status = null; // Master is never marked duplicate
          }
        } else {
          result.set(key, { status: 'confirmed', isMaster: false, reason: 'Identical SHA-256 content hash' });
        }
      });
    }
  });

  // 4. Mark 100% Confirmed if canonical base document collision with numbered suffix (e.g. CASTE CERTIFICATE, CASTE CERTIFICATE 2)
  const baseGroups = new Map();
  files.forEach(f => {
    const activeName = cleanName(f.targetName || f.name || '');
    // Normalize and remove suffix copy numbers like " 2", " 3", "(2)", "_2", "-2"
    let base = activeName.toLowerCase()
      .replace(/[\s_\-]+(\d+|\(\d+\))(?=\s|$)/gi, '')
      .replace(/[\s_\-]+/g, ' ')
      .trim();

    const extStr = (f.ext || ext(f.name) || '').toLowerCase();
    const groupKey = `${base}|${extStr}`;
    if (base.length >= 1) {
      if (!baseGroups.has(groupKey)) baseGroups.set(groupKey, []);
      baseGroups.get(groupKey).push({ file: f, originalName: activeName });
    }
  });

  baseGroups.forEach((items) => {
    if (items.length >= 2) {
      const hasSuffixDiff = items.some(item => /[\s_\-]+(\d+|\(\d+\))(?=\s|$)/i.test(item.originalName));
      const hasSameSize = items.some((item, idx) => {
        return items.some((other, oIdx) => idx !== oIdx && item.file.size > 0 && item.file.size === other.file.size);
      });
      if (hasSuffixDiff || hasSameSize) {
        const masterIdx = findMasterIdx(items, item => item.originalName);
        items.forEach((item, idx) => {
          const key = item.file.id || item.file.name;
          if (idx === masterIdx) {
            const current = result.get(key);
            if (current) {
              current.isMaster = true;
              current.status = null; // Master is never marked duplicate
            }
          } else {
            result.set(key, { status: 'confirmed', isMaster: false, reason: 'Canonical base document collision' });
          }
        });
      }
    }
  });

  return result;
}



