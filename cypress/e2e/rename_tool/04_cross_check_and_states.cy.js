/**
 * cypress/e2e/rename_tool/04_cross_check_and_states.cy.js
 * DocMitra Bulk Renamer — Phase 5: Cross-Check Modal, Bulk Rename & State Management Tests
 *
 * Verifies:
 * 1. Bulk Rename button opens Sample 5 Cross-Check modal
 * 2. High-density row rendering with Old Name -> Suggested Name
 * 3. File type filter pills (All | PDF | Images) in modal header
 * 4. Cancel (Esc) closes modal cleanly with zero state mutation
 * 5. Select All / Deselect All checkbox and Confirm button enablement
 * 6. Simulated Batch Rename execution & modal closure
 * 7. Floating Undo Toast banner and completion state
 */

describe('DocMitra Rename Tool — Phase 5: Cross-Check Modal, Bulk Rename & State Tests', () => {

  beforeEach(() => {
    cy.loadTestWorkstation();
  });

  it('TC-CC-01: Bulk Rename button opens Sample 5 Cross-Check modal', () => {
    // Modal is initially hidden
    cy.get('#modalCrossCheck').should('have.class', 'hidden');

    // Click Bulk Rename button in bottom toolbar
    cy.get('#btnRenameMatched').click();

    // Modal should become visible
    cy.get('#modalCrossCheck').should('not.have.class', 'hidden').and('be.visible');

    // Student name in sub-header should match active student
    cy.get('#crossCheckStudentLabel').should('contain', 'Vijay Ramesh Yadav');
  });

  it('TC-CC-02: Cross-Check table renders rows with old name, arrow, and suggested name', () => {
    cy.get('#btnRenameMatched').click();

    // Table body should contain rows for the loaded files
    cy.get('#crossCheckTableBody').children().should('have.length.at.least', 3);

    // First row should show old name and suggested new name
    cy.get('#crossCheckTableBody').children().first().within(() => {
      cy.contains(/10th_marksheet|MARKSHEET/i).should('exist');
    });

    // Close modal
    cy.get('#btnCancelCrossCheck').click();
  });

  it('TC-CC-03: Header filter pills (All | PDF | Images) filter modal rows', () => {
    cy.get('#btnRenameMatched').click();

    // Click Images filter pill
    cy.get('#modalCrossCheck button[data-pattern-filter="images"]').click();

    // Only photo_scan.jpg should be visible
    cy.get('#crossCheckTableBody').children().filter(':visible').should('have.length', 1);
    cy.get('#crossCheckTableBody').contains(/photo/i).should('be.visible');

    // Click PDF filter pill
    cy.get('#modalCrossCheck button[data-pattern-filter="pdf"]').click();
    cy.get('#crossCheckTableBody').children().filter(':visible').should('have.length', 2);

    // Click All filter pill restores all 3 rows
    cy.get('#modalCrossCheck button[data-pattern-filter="all"]').click();
    cy.get('#crossCheckTableBody').children().filter(':visible').should('have.length', 3);

    cy.get('#btnCancelCrossCheck').click();
  });

  it('TC-CC-04: Cancel button closes modal with zero side effects', () => {
    cy.get('#btnRenameMatched').click();
    cy.get('#modalCrossCheck').should('be.visible');

    // Click Cancel (Esc)
    cy.get('#btnCancelCrossCheck').click();
    cy.get('#modalCrossCheck').should('have.class', 'hidden');

    // All files in state should remain pending
    cy.window().then((win) => {
      expect(win.renamerUI.state.files).to.have.length(3);
      win.renamerUI.state.files.forEach((f) => {
        expect(f.isRenamed).to.be.false;
      });
    });
  });

  it('TC-CC-05: Select All / Deselect All checkbox controls Confirm button state', () => {
    cy.get('#btnRenameMatched').click();
    cy.get('#modalCrossCheck').should('be.visible');

    // Initially Confirm button is enabled because rows are selected
    cy.get('#btnConfirmBatchRename').should('not.be.disabled');

    // Deselect all rows via uncheck
    cy.get('#chkCrossCheckSelectAll').uncheck();

    // Confirm button should now be disabled
    cy.get('#btnConfirmBatchRename').should('be.disabled');

    // Re-check Select All
    cy.get('#chkCrossCheckSelectAll').check();
    cy.get('#btnConfirmBatchRename').should('not.be.disabled');

    cy.get('#btnCancelCrossCheck').click();
  });

  it('TC-CC-06: Confirm Batch Rename executes simulated rename and closes modal', () => {
    cy.get('#btnRenameMatched').click();
    cy.get('#modalCrossCheck').should('be.visible');

    // Ensure Select All is checked
    cy.get('#chkCrossCheckSelectAll').check();

    // Click Confirm & Rename button
    cy.get('#btnConfirmBatchRename').click();

    // Modal should close
    cy.get('#modalCrossCheck', { timeout: 8000 }).should('have.class', 'hidden');

    // Floating undo toast banner should appear
    cy.get('#toastFloatingUndo', { timeout: 8000 }).should('be.visible');
  });

  it('TC-CC-07: Floating Undo Toast and completed queue reflection', () => {
    cy.get('#btnRenameMatched').click();
    cy.get('#chkCrossCheckSelectAll').check();
    cy.get('#btnConfirmBatchRename').click();

    // Floating undo toast banner should be visible
    cy.get('#toastFloatingUndo').should('be.visible');
    cy.get('#floatingUndoMessage').should('contain', 'Successfully renamed');

    // Files in state should be marked as isRenamed: true
    cy.window().then((win) => {
      const renamedCount = win.renamerUI.state.files.filter(f => f.isRenamed).length;
      expect(renamedCount).to.be.at.least(1);
    });
  });

});
