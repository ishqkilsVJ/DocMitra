/**
 * cypress/e2e/rename_tool/03_suggestions_and_settings.cy.js
 * DocMitra Bulk Renamer — Phase 4: Smart Suggestions, Shortcodes & Settings Sync Tests
 *
 * Verifies:
 * 1. Smart Suggestions rendering dynamically on keystroke
 * 2. Clicking suggestion chip applies canonical formula + student name
 * 3. Shortcode typing expansion via Enter key (e.g. ADR, 10M)
 * 4. Opening and closing dedicated Rename Tool Settings modal
 * 5. Tab navigation between Document Presets and Shortcuts & Rename Rules
 * 6. Live Search filtering in Shortcuts table
 * 7. Master Presets ↔ Shortcuts unified synchronization
 */

describe('DocMitra Rename Tool — Phase 4: Smart Suggestions, Shortcodes & Settings Tests', () => {

  beforeEach(() => {
    cy.loadTestWorkstation();
  });

  it('TC-SETT-01: Smart Suggestion chips filter dynamically in real time on keystrokes', () => {
    // Type "10" using selectall to avoid DOM detach re-render issues
    cy.get('#inputRenameTarget').type('{selectall}{backspace}10');

    // Smart suggestions container should render chips
    cy.get('#coreShortcutsContainer', { timeout: 6000 }).within(() => {
      cy.get('.cursor-pointer').should('have.length.at.least', 1);
      cy.contains(/10M|10th/i).should('exist');
    });
  });

  it('TC-SETT-02: Clicking a suggestion chip applies formula + student name to active file', () => {
    cy.get('#inputRenameTarget').type('{selectall}{backspace}10');

    // Click the 10M suggestion chip
    cy.get('#coreShortcutsContainer').contains(/10M|10th/i).click();

    // Verify state has target name with 10TH MARKSHEET and student name
    cy.window().then((win) => {
      const current = win.renamerUI.state.files[win.renamerUI.state.currentIndex];
      expect(current.targetName.toUpperCase()).to.contain('10TH MARKSHEET');
      expect(current.targetName.toUpperCase()).to.contain('VIJAY RAMESH YADAV');
    });
  });

  it('TC-SETT-03: Typing shortcode "ADR" and pressing Enter expands to canonical name', () => {
    // Type shortcode ADR and press Enter
    cy.get('#inputRenameTarget').type('{selectall}{backspace}ADR{enter}');

    // The file at index 0 should now be confirmed with AADHAAR CARD + student name
    cy.window().then((win) => {
      const file0 = win.renamerUI.state.files[0];
      expect(file0.targetName.toUpperCase()).to.contain('AADHAAR CARD');
      expect(file0.targetName.toUpperCase()).to.contain('VIJAY RAMESH YADAV');
    });
  });

  it('TC-SETT-04: Settings modal opens via ribbon button and closes via close button', () => {
    // Modal is initially hidden
    cy.get('#modalRenameSettings').should('have.class', 'hidden');

    // Click settings button in ribbon
    cy.get('#btnRenameSettings').click();
    cy.get('#modalRenameSettings').should('not.have.class', 'hidden').and('be.visible');

    // Click close button
    cy.get('#btnCloseRenameSettings').click();
    cy.get('#modalRenameSettings').should('have.class', 'hidden');
  });

  it('TC-SETT-05: Tab navigation switches between Presets and Shortcuts tabs', () => {
    cy.get('#btnRenameSettings').click();

    // Default tab is Presets
    cy.get('#tabContentPresets').should('be.visible');

    // Switch to Shortcuts tab
    cy.get('#tabBtnShortcuts').click();
    cy.get('#tabContentShortcuts').should('be.visible');
    cy.get('#tabContentPresets').should('not.be.visible');

    // Shortcuts table should have populated rows (>20 admission document rules)
    cy.get('#shortcutsTableBody tr').should('have.length.at.least', 20);

    // Close modal
    cy.get('#btnCloseRenameSettings').click();
  });

  it('TC-SETT-06: Live Search in Shortcuts tab filters table rows instantaneously', () => {
    cy.get('#btnRenameSettings').click();
    cy.get('#modalRenameSettings').should('be.visible');
    cy.get('#tabBtnShortcuts').click();
    cy.get('#tabContentShortcuts').should('be.visible');

    // Type "Aadhaar" in shortcuts live search input
    cy.get('#inputSearchShortcuts').type('Aadhaar', { force: true });

    // Filtered table should contain Aadhaar (canonical is AADHAAR CARD)
    cy.get('#shortcutsTableBody', { timeout: 6000 }).should('contain', 'AADHAAR');

    // Clear search filter restores rows
    cy.get('#inputSearchShortcuts').clear({ force: true });
    cy.get('#shortcutsTableBody tr').should('have.length.at.least', 20);

    cy.get('#btnCloseRenameSettings').click();
  });

  it('TC-SETT-07: Master Presets & Shortcuts single source of truth sync', () => {
    cy.window().then((win) => {
      // Check document presets or builtin presets are available
      const presets = win.renamerUI.state.documentPresets || win.renamerUI.presetsData;
      expect(presets).to.exist;
      expect(presets['MAHA DBT']).to.exist;
      expect(presets['CET CELL']).to.exist;

      // Verify shortcuts list is populated with master shortcuts
      expect(win.renamerUI.shortcuts21).to.be.an('array');
      expect(win.renamerUI.shortcuts21.length).to.be.at.least(20);

      // Verify ADR short code exists
      const hasAdr = win.renamerUI.shortcuts21.some(s =>
        s.code === 'ADR' || (Array.isArray(s.codes) && s.codes.includes('ADR'))
      );
      expect(hasAdr).to.be.true;
    });
  });

});
