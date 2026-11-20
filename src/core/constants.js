/* ==========================================================================
   Student Document Renamer — मूलभूत स्थिरांक (System Constants)
   ========================================================================== */

export const SUPPORTED_EXTENSIONS = [
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tif', '.tiff',
  '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt', '.rtf', '.odt', '.dwg'
];

export const CANONICAL_NAMES = {
  "AADHAAR CARD": "Aadhaar Card",
  "AADHAR CARD": "Aadhaar Card",
  "PAN CARD": "PAN Card",
  "PHOTO": "Photo",
  "10TH MARKSHEET": "10th Marksheet",
  "10TH PASSING CERTIFICATE": "10th Passing",
  "11TH MARKSHEET": "11th Marksheet",
  "11TH PASSING CERTIFICATE": "11th Passing",
  "10TH LC": "10TH LC",
  "10TH MARKSHEET AND PASSING": "10th Marksheet and Passing",
  "APAAR ID": "APAAR ID",
  "ABC ID": "ABC ID",
  "DEGREE CERTIFICATE": "Degree Certificate",
  "REGISTRATION CERTIFICATE": "Registration Certificate",
  "RATION CARD": "Ration Card",
  "12TH MARKSHEET": "12th Marksheet",
  "12TH PASSING CERTIFICATE": "12th Passing",
  "12TH LC": "12TH LC",
  "12TH MARKSHEET AND PASSING": "12th Marksheet and Passing",
  "CASTE CERTIFICATE": "Caste Certificate",
  "VALIDITY CERTIFICATE": "Validity Certificate",
  "DOMICILE CERTIFICATE": "Domicile Certificate",
  "NATIONALITY CERTIFICATE": "Nationality Certificate",
  "PASSBOOK BANK": "Bank Passbook",
  "INCOME CERTIFICATE": "Income Certificate",
  "SELF DECLARATION": "Self Declaration",
  "PARENT DECLARATION": "Parent Declaration",
  "BIRTH CERTIFICATE": "Birth Certificate",
  "BONAFIDE CERTIFICATE": "Bonafide Certificate",
  "GAP CERTIFICATE": "Gap Certificate",
  "ATTEMPT CERTIFICATE": "Attempt Certificate",
  "CAP ALLOTMENT LETTER": "CAP Allotment Letter"
};

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
  "domocile": "domicile",
  "pasbook": "passbook",
  "pasbok": "passbook",
  "incom": "income",
  "incme": "income",
  "certifcte": "certificate",
  "certifcate": "certificate",
  "certificte": "certificate",
  "certficate": "certificate",
  "certifitcate": "certificate",
  "atempt": "attempt",
  "attmpt": "attempt",
  "phot": "photo"
};

export const DEFAULT_LINKED_RULES = [
  {
    id: "12th-marksheet-passing-link",
    part1: "12TH MARKSHEET",
    part2: "12TH PASSING CERTIFICATE",
    combined: "12TH MARKSHEET AND PASSING",
    type: "combined"
  },
  {
    id: "10th-marksheet-passing-link",
    part1: "10TH MARKSHEET",
    part2: "10TH PASSING CERTIFICATE",
    combined: "10TH MARKSHEET AND PASSING",
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

export const CHECKLIST_VERSION = '2026.11.passing_canonical_v2';

export const DEFAULT_CHECKLISTS_DATA = {
  "MAHA DBT FORM": [
    ["AADHAAR CARD", ["aadhaar card"]],
    ["PHOTO", ["photo"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["VALIDITY CERTIFICATE", ["validity certificate"]],
    ["INCOME CERTIFICATE", ["income certificate"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["PASSBOOK BANK", ["passbook bank", "bank passbook"]]
  ],
  "MH CET FORM": [
    ["PHOTO", ["photo"]],
    ["AADHAAR CARD", ["aadhaar card"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["VALIDITY CERTIFICATE", ["validity certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["NATIONALITY CERTIFICATE", ["nationality certificate"]],
    ["INCOME CERTIFICATE", ["income certificate"]],
    ["ATTEMPT CERTIFICATE", ["attempt certificate"]]
  ],
  "SWAYAM FORM": [
    ["PHOTO", ["photo"]],
    ["AADHAAR CARD", ["aadhaar card"]],
    ["10TH MARKSHEET", ["10th marksheet"]],
    ["12TH MARKSHEET", ["12th marksheet"]],
    ["12TH LC", ["12th lc"]],
    ["CASTE CERTIFICATE", ["caste certificate"]],
    ["DOMICILE CERTIFICATE", ["domicile certificate"]],
    ["SELF DECLARATION", ["self declaration"]],
    ["PARENT DECLARATION", ["parent declaration"]],
    ["PASSBOOK BANK", ["passbook bank", "bank passbook"]],
    ["BONAFIDE CERTIFICATE", ["bonafide certificate"]]
  ]
};

export const DEFAULT_PRINT_PRESETS = {
  "MAHA DBT FORM": [
    "AADHAAR CARD",
    "PHOTO",
    "10TH MARKSHEET",
    "10TH PASSING CERTIFICATE",
    "12TH MARKSHEET",
    "12TH PASSING CERTIFICATE",
    "12TH LC",
    "CASTE CERTIFICATE",
    "VALIDITY CERTIFICATE",
    "INCOME CERTIFICATE",
    "NATIONALITY CERTIFICATE",
    "DOMICILE CERTIFICATE",
    "PASSBOOK BANK"
  ],
  "MH CET FORM": [
    "PHOTO",
    "AADHAAR CARD",
    "10TH MARKSHEET",
    "10TH PASSING CERTIFICATE",
    "12TH MARKSHEET",
    "12TH PASSING CERTIFICATE",
    "12TH LC",
    "CASTE CERTIFICATE",
    "VALIDITY CERTIFICATE",
    "DOMICILE CERTIFICATE",
    "NATIONALITY CERTIFICATE",
    "INCOME CERTIFICATE",
    "ATTEMPT CERTIFICATE"
  ],
  "SWAYAM / DEEN DAYAL SCHEME": [
    "PHOTO",
    "AADHAAR CARD",
    "10TH MARKSHEET",
    "11TH MARKSHEET",
    "12TH MARKSHEET",
    "12TH LC",
    "CASTE CERTIFICATE",
    "VALIDITY CERTIFICATE",
    "DOMICILE CERTIFICATE",
    "SELF DECLARATION",
    "PARENT DECLARATION",
    "PASSBOOK BANK",
    "BONAFIDE CERTIFICATE"
  ]
};

export const DB_CONFIG = {
  name: 'BulkStudentRenamerSettingsDB',
  version: 1,
  store: 'settings',
  key: 'current'
};
