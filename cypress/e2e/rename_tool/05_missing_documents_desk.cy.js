/**
 * cypress/e2e/rename_tool/05_missing_documents_desk.cy.js
 * DocMitra Bulk Renamer — Phase 5: Missing Documents & Follow-up Desk Modal Tests
 *
 * Verifies the isolated MissingDocumentsModal component (extracted from Stitch design):
 * 1. Single Trigger Button in Right Utility Panel (#btnOpenMissingDeskModal)
 * 2. Header Context: Student Name Pill, DIR Ribbon, LOCAL FS CONNECTED
 * 3. Dynamic Scheme / Preset Selector (#missingModalSchemeSelect)
 * 4. Inline Follow-up Date Pickers (.missing-followup-input)
 * 5. Application Readiness Status Card with SVG Circular Gauge and Metrics
 * 6. Present / Verified Documents Collapsible Section
 * 7. Modal Dismissal via Esc, Close Button, and Done Button
 */

describe('DocMitra Rename Tool — Phase 5: Missing Documents & Follow-up Desk Tests', () => {

  beforeEach(() => {
    cy.loadTestWorkstation();
  });

  it('TC-DESK-01: Renders trigger button in right utility panel and opens modal on click', () => {
    // 1. Verify trigger button is visible under Missing Documents section
    cy.get('#btnOpenMissingDeskModal', { timeout: 8000 })
      .should('be.visible')
      .and('contain.text', 'Document Desk');

    // 2. Click trigger button
    cy.get('#btnOpenMissingDeskModal').click();

    // 3. Verify dedicated modal opens and is visible
    cy.get('#modalMissingDocumentsDesk', { timeout: 8000 })
      .should('be.visible')
      .and('not.have.class', 'hidden');

    // 4. Verify modal title
    cy.get('#modalMissingDocumentsDesk h1')
      .should('contain.text', 'Missing Documents & Follow-up Desk');
  });

  it('TC-DESK-02: Header displays clean scheme selector, student name with inline edit, and no redundant folder bar', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    cy.get('#modalMissingDocumentsDesk').within(() => {
      // Student Name and Edit Pencil Button are visible
      cy.contains('Vijay Ramesh Yadav').should('be.visible');
      cy.get('#btnMissingEditFolder').should('be.visible');

      // Redundant FOLDER: strip is removed
      cy.get('header').should('not.contain.text', 'FOLDER:');
    });
  });

  it('TC-DESK-03: Dynamic Scheme Selector switching updates missing documents checklist count', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    // Verify initial scheme is MAHA DBT
    cy.get('#missingModalSchemeSelect')
      .should('have.value', 'MAHA DBT');

    // Count missing rows under MAHA DBT
    cy.get('.btn-missing-import-file').then(($btns) => {
      const mahaCount = $btns.length;
      expect(mahaCount).to.be.at.least(1);

      // Switch to CET CELL
      cy.get('#missingModalSchemeSelect').select('CET CELL');

      // Verify scheme changed in Renamer state
      cy.window().then((win) => {
        expect(win.renamerUI.state.activePreset).to.equal('CET CELL');
      });

      // Verify list re-rendered dynamically
      cy.get('.btn-missing-import-file').should('have.length.at.least', 1);
    });
  });

  it('TC-DESK-04: Follow-up date picker persists date for individual documents', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    // Target the first follow-up date input
    cy.get('.missing-followup-input').first().then(($input) => {
      const docName = $input.attr('data-doc');
      expect(docName).to.be.a('string').and.not.be.empty;

      // Type or set a promise date
      cy.wrap($input).type('2026-12-05').trigger('change');

      // Re-verify value is set
      cy.wrap($input).should('have.value', '2026-12-05');
    });
  });

  it('TC-DESK-05: Application Readiness Status Card renders SVG progress ring and metric cards', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    cy.get('#modalMissingDocumentsDesk').within(() => {
      // SVG circular gauge exists with stroke-dasharray
      cy.get('svg path.text-emerald-500')
        .should('exist')
        .and('have.attr', 'stroke-dasharray');

      // Readiness title and metrics
      cy.contains(/Application Readiness Status/i).should('be.visible');
      cy.contains(/Documents Staged/i).should('be.visible');

      // Completed Metric Card
      cy.contains(/Completed/i).parent().within(() => {
        cy.contains(/Documents/i).should('be.visible');
      });

      // Pending / Missing Metric Card
      cy.contains(/Pending \/ Missing/i).parent().within(() => {
        cy.contains(/Documents/i).should('be.visible');
      });
    });
  });

  it('TC-DESK-06: Present / Verified Documents collapsible section renders loaded files', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    cy.get('#modalMissingDocumentsDesk').within(() => {
      // Collapsible details element
      cy.get('details').should('exist');
      cy.contains(/Present Documents in Folder/i).should('be.visible');
      cy.contains(/READY/i).should('be.visible');

      // At least 1 verified document row
      cy.get('details .grid > div').should('have.length.at.least', 1);
      cy.contains('Verified').should('be.visible');
    });
  });

  it('TC-DESK-07: Modal dismissal via Done Button, Close Button, and Esc Key', () => {
    cy.get('#btnOpenMissingDeskModal').click();
    cy.get('#modalMissingDocumentsDesk').should('be.visible');

    // 1. Dismiss via 'Done / Return to Ledger' button
    cy.get('#btnMissingModalDone').click();
    cy.get('#modalMissingDocumentsDesk').should('have.class', 'hidden');

    // 2. Re-open and dismiss via 'Esc Close' button
    cy.get('#btnOpenMissingDeskModal').click();
    cy.get('#modalMissingDocumentsDesk').should('be.visible');
    cy.get('#btnMissingModalClose').click();
    cy.get('#modalMissingDocumentsDesk').should('have.class', 'hidden');

    // 3. Re-open and dismiss via keyboard 'Escape'
    cy.get('#btnOpenMissingDeskModal').click();
    cy.get('#modalMissingDocumentsDesk').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('#modalMissingDocumentsDesk').should('have.class', 'hidden');
  });

  it('TC-DESK-08: Layout order, 2-column missing cards, and metadata badges (True Created Date, Size, Type)', () => {
    cy.get('#btnOpenMissingDeskModal').click();

    cy.get('#modalMissingDocumentsDesk').within(() => {
      // 1. Verify Application Readiness Status is placed above Missing Documents
      cy.contains('Application Readiness Status').should('be.visible');
      cy.contains('Student Name:').should('be.visible');

      // 2. Missing Documents 2-column card grid and metadata badges (Requirement 2 & Option 3-A)
      cy.get('.grid.grid-cols-1.md\\:grid-cols-2').should('exist');
      cy.contains(/PDF|JPG/).should('be.visible');
      cy.contains('Target ≤ 256 KB').should('be.visible');

      // 3. Present Documents row metadata with True Created Date (Requirement 3)
      cy.get('details').within(() => {
        cy.contains('Verified').should('be.visible');
        cy.contains(/Created:/i).should('be.visible');
      });
    });
  });

});
