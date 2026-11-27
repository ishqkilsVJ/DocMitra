/**
 * cypress/e2e/rename_tool/00_smoke.cy.js
 * DocMitra Bulk Renamer — Phase 1 Test Infrastructure & Smoke Verification
 */

describe('DocMitra Rename Tool — Phase 1 Smoke & Environment Test', () => {
  beforeEach(() => {
    cy.mockTauriBridge();
  });

  it('TC-SMOKE-01: Application Shell loads cleanly with correct title and brand elements', () => {
    cy.visit('/');
    cy.title().should('contain', 'DocMitra');
    cy.get('body').should('be.visible');
  });

  it('TC-SMOKE-02: Bulk Renamer Workstation initializes with view pane and ribbon controls', () => {
    cy.visit('/');
    // Bulk Renamer view should be present in DOM
    cy.get('#view-bulk-renamer').should('exist');
    // Primary ribbon buttons should be present
    cy.get('#btnSelectFolder').should('exist');
    cy.get('#btnClearWorkspace').should('exist');
    cy.get('#btnRenameSettings').should('exist');
    cy.get('#casingRadiosGroup').should('exist');
  });

  it('TC-SMOKE-03: Preloaded test helper (?test_loaded=1) renders 3 mock files and student info', () => {
    cy.loadTestWorkstation();
    // Verify file queue column contains rendered content
    cy.get('#col-queue').should('be.visible');
    // Verify student info and files array on renamerUI
    cy.window().then((win) => {
      expect(win.renamerUI).to.exist;
      expect(win.renamerUI.state.files).to.have.length(3);
      expect(win.renamerUI.state.studentName).to.equal('Vijay Ramesh Yadav');
      expect(win.renamerUI.state.folder.name).to.equal('Vijay_Ramesh_Yadav');
    });
  });

  it('TC-SMOKE-04: Active file selection and input field synchronization', () => {
    cy.loadTestWorkstation();
    cy.window().then((win) => {
      // First file should be selected as active (index 0)
      expect(win.renamerUI.state.currentIndex).to.equal(0);
      const activeFile = win.renamerUI.state.files[0];
      expect(activeFile.name).to.equal('10th_marksheet.pdf');
    });
    // Input rename target should exist in active card
    cy.get('#inputRenameTarget').should('exist');
  });
});
