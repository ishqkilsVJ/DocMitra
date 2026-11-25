/**
 * cypress/e2e/rename_tool/01_logic_and_matching.cy.js
 * DocMitra Bulk Renamer — Phase 2: Pure Logic & Algorithm Unit Tests
 *
 * Verifies core business logic:
 * 1. matchFilenameSmart (100% and 95% standard admission matching)
 * 2. Levenshtein distance & string similarity (spelling typo tolerance)
 * 3. Zero Student Name duplication in buildName
 * 4. Duplicate destination auto-suffixing (uniqueDestination)
 * 5. Indian academic/admin synonyms (generateSmartKeywords)
 * 6. Windows illegal filename validation (validateFilename)
 */

import {
  matchFilenameSmart,
  levenshteinDistance,
  stringSimilarity,
  buildName,
  uniqueDestination,
  generateSmartKeywords,
  cleanName,
  applyCase,
  validateFilename
} from '../../../tools/rename_tool/rename_tool_logic.js';

describe('DocMitra Rename Tool — Phase 2: Pure Logic & Algorithm Tests', () => {

  // =========================================================================
  // 1. Smart Scan Algorithm Tests (matchFilenameSmart)
  // =========================================================================
  describe('1. Smart Scan Matching Engine (matchFilenameSmart)', () => {
    it('TC-LOGIC-01: Matches 10th marksheet with high confidence (>=90%)', () => {
      const match = matchFilenameSmart('10th_marksheet.pdf', 'Vijay Yadav');
      expect(match).to.exist;
      expect(match.confidence).to.be.at.least(90);
      expect(match.docType.toUpperCase()).to.contain('10TH');
    });

    it('TC-LOGIC-02: Matches Aadhaar Card variations (adhar_card.pdf, uid.jpg)', () => {
      const match1 = matchFilenameSmart('adhar_card.pdf', 'Vijay Yadav');
      expect(match1).to.exist;
      expect(match1.confidence).to.be.at.least(85);
      expect(match1.docType.toUpperCase()).to.contain('AADHAAR');

      const match2 = matchFilenameSmart('aadhar_front.jpg', 'Vijay Yadav');
      expect(match2).to.exist;
      expect(match2.confidence).to.be.at.least(85);
      expect(match2.docType.toUpperCase()).to.contain('AADHAAR');
    });

    it('TC-LOGIC-03: Matches Photo and Signature files accurately', () => {
      const matchPhoto = matchFilenameSmart('student_photo.jpg', 'Vijay Yadav');
      expect(matchPhoto).to.exist;
      expect(matchPhoto.confidence).to.be.at.least(85);
      expect(matchPhoto.docType.toUpperCase()).to.contain('PHOTO');

      const matchSign = matchFilenameSmart('sign_scan.png', 'Vijay Yadav');
      expect(matchSign).to.exist;
      expect(matchSign.confidence).to.be.at.least(85);
      expect(matchSign.docType.toUpperCase()).to.contain('SIGNATURE');
    });

    it('TC-LOGIC-04: Returns unmatched / below-threshold for random noise files', () => {
      const match = matchFilenameSmart('random_unknown_invoice_99812.pdf', 'Vijay Yadav');
      expect(match.confidence).to.be.lessThan(50);
      expect(match.isConfident).to.be.false;
      expect(match.docType).to.be.null;
    });
  });

  // =========================================================================
  // 2. Levenshtein Distance & Fuzzy Typo Tolerance
  // =========================================================================
  describe('2. Levenshtein Distance & String Similarity', () => {
    it('TC-LOGIC-05: Computes exact 0 distance and 1.0 similarity for identical strings', () => {
      const dist = levenshteinDistance('MARKSHEET', 'MARKSHEET');
      const sim = stringSimilarity('MARKSHEET', 'MARKSHEET');
      expect(dist).to.equal(0);
      expect(sim).to.equal(1.0);
    });

    it('TC-LOGIC-06: Identifies small scanner typos with high similarity', () => {
      // 1-letter omission
      const dist = levenshteinDistance('markshets', 'marksheet');
      const sim = stringSimilarity('markshets', 'marksheet');
      expect(dist).to.be.at.most(2);
      expect(sim).to.be.at.least(0.75);

      // 1-letter substitution in longer token
      const sim2 = stringSimilarity('marksheet_scan', 'marksheet_scam');
      expect(sim2).to.be.at.least(0.90);
    });

    it('TC-LOGIC-07: Discriminates completely distinct document names (<0.40)', () => {
      const sim = stringSimilarity('PHOTO', 'INCOME CERTIFICATE');
      expect(sim).to.be.lessThan(0.40);
    });
  });

  // =========================================================================
  // 3. Zero Student Name Duplication in Formula Building (buildName)
  // =========================================================================
  describe('3. Zero Student Name Duplication (buildName)', () => {
    it('TC-LOGIC-08: Strictly prevents duplicate student name when filename already contains student', () => {
      const input = '10TH MARKSHEET VIJAY RAMESH YADAV';
      const student = 'Vijay Ramesh Yadav';
      const result = buildName(input, student, null, 'upper');

      // The student name should appear only ONCE in the target string
      const matches = result.match(/VIJAY RAMESH YADAV/g);
      expect(matches).to.exist;
      expect(matches.length).to.equal(1);
      expect(result).to.equal('10TH MARKSHEET VIJAY RAMESH YADAV');
    });

    it('TC-LOGIC-09: Supports upper, title, and lower casing rules cleanly', () => {
      const upper = applyCase('10th marksheet vijay yadav', 'upper');
      expect(upper).to.equal('10TH MARKSHEET VIJAY YADAV');

      const title = applyCase('10th marksheet vijay yadav', 'title');
      expect(title).to.equal('10th Marksheet Vijay Yadav');

      const lower = applyCase('10TH MARKSHEET VIJAY YADAV', 'lower');
      expect(lower).to.equal('10th marksheet vijay yadav');
    });
  });

  // =========================================================================
  // 4. Duplicate Destination Auto-Suffixing (uniqueDestination)
  // =========================================================================
  describe('4. Duplicate Destination Suffixing (uniqueDestination)', () => {
    it('TC-LOGIC-10: Retains desired name if no collision exists', () => {
      const used = new Set();
      const dest = uniqueDestination('10TH MARKSHEET.pdf', 'old.pdf', used, 'Vijay Yadav');
      expect(dest).to.equal('10TH MARKSHEET.pdf');
    });

    it('TC-LOGIC-11: Appends numerical suffix (2, 3) before student name when collision occurs', () => {
      const used = new Set(['10TH MARKSHEET VIJAY YADAV.pdf']);
      const dest1 = uniqueDestination('10TH MARKSHEET VIJAY YADAV.pdf', 'old2.pdf', used, 'VIJAY YADAV');
      expect(dest1).to.equal('10TH MARKSHEET 2 VIJAY YADAV.pdf');

      used.add(dest1);
      const dest2 = uniqueDestination('10TH MARKSHEET VIJAY YADAV.pdf', 'old3.pdf', used, 'VIJAY YADAV');
      expect(dest2).to.equal('10TH MARKSHEET 3 VIJAY YADAV.pdf');
    });
  });

  // =========================================================================
  // 5. Smart Keyword Generator for Indian Academic Admission Synonyms
  // =========================================================================
  describe('5. Indian Academic Synonyms Generator (generateSmartKeywords)', () => {
    it('TC-LOGIC-12: Generates ssc and 10th aliases for 10th Marksheet', () => {
      const keywords = generateSmartKeywords('10th Marksheet', ['10M']);
      expect(keywords).to.be.a('string');
      expect(keywords.toLowerCase()).to.contain('ssc');
      expect(keywords.toLowerCase()).to.contain('10th');
    });

    it('TC-LOGIC-13: Generates hsc and 12th aliases for 12th Marksheet', () => {
      const keywords = generateSmartKeywords('12th Marksheet', ['12M']);
      expect(keywords).to.be.a('string');
      expect(keywords.toLowerCase()).to.contain('hsc');
      expect(keywords.toLowerCase()).to.contain('12th');
    });

    it('TC-LOGIC-14: Generates leaving certificate aliases for LC', () => {
      const keywords = generateSmartKeywords('Leaving Certificate', ['LC']);
      expect(keywords).to.be.a('string');
      expect(keywords.toLowerCase()).to.contain('leaving certificate');
      expect(keywords.toLowerCase()).to.contain('lc');
    });
  });

  // =========================================================================
  // 6. Windows Illegal Filename Validation (validateFilename)
  // =========================================================================
  describe('6. Windows Filename Safety Validation (validateFilename)', () => {
    it('TC-LOGIC-15: Rejects illegal Windows characters (\\ / : * ? " < > |)', () => {
      const invalidNames = [
        '10th/marksheet.pdf',
        'caste:validity.pdf',
        'photo*scan.jpg',
        'aadhaar?card.pdf',
        'income|cert.pdf'
      ];
      invalidNames.forEach((name) => {
        const errorMsg = validateFilename(name);
        expect(errorMsg).to.be.a('string').and.not.be.empty;
      });
    });

    it('TC-LOGIC-16: Accepts valid Windows filenames with spaces, dashes, and parentheses', () => {
      const validNames = [
        '10TH MARKSHEET VIJAY RAMESH YADAV.pdf',
        'AADHAAR CARD (FRONT & BACK).pdf',
        'PHOTO - VIJAY YADAV.jpg'
      ];
      validNames.forEach((name) => {
        const errorMsg = validateFilename(name);
        expect(errorMsg).to.equal('');
      });
    });
  });

});
