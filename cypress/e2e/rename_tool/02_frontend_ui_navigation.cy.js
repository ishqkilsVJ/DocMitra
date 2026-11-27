/**
 * cypress/e2e/rename_tool/02_frontend_ui_navigation.cy.js
 * DocMitra Bulk Renamer — Phase 3: Frontend UI, Queue & Navigation Tests
 *
 * Verifies interactive UI components:
 * 1. Unified Queue Rendering and active item highlighting
 * 2. Click-to-Jump & Active File selection across queue rows
 * 3. Live Casing Switcher (UPPER, Title, lower)
 * 4. Key Navigation & Circular Queue Loop (1..N..1) via Enter / Tab
 * 5. Per-File 90° Rotation Toggle
 * 6. Extension handling in input field (extension hidden)
 * 7. Clear Workspace reset button
 */

describe('DocMitra Rename Tool — Phase 3: Frontend UI, Queue & Navigation Tests', () => {

  beforeEach(() => {
    cy.loadTestWorkstation();
  });

  it('TC-UI-01: Renders unified queue with 3 files and active item highlighting', () => {
    // 3 queue rows with data-index
    cy.get('#col-queue').find('article[data-index]').should('have.length', 3);

    // First file (data-index="0") should have active-queue-item class
    cy.get('article[data-index="0"]').should('have.class', 'active-queue-item');

    // Filenames in queue rows should strip physical file extension (.pdf/.jpg)
    cy.get('article[data-index="0"]').find('.font-mono-code').first().invoke('text').then((text) => {
      expect(text).to.not.match(/\.pdf$/i);
    });
  });

  it('TC-UI-02: Click-to-Jump selects target file and updates active card', () => {
    // Click on second file (data-index="1", adhar_card.pdf)
    cy.get('article[data-index="1"]').click();

    // Active row shifts to data-index="1"
    cy.get('article[data-index="1"]').should('have.class', 'active-queue-item');
    cy.get('article[data-index="0"]').should('not.have.class', 'active-queue-item');

    // Internal state should be at index 1
    cy.window().then((win) => {
      expect(win.renamerUI.state.currentIndex).to.equal(1);
      const activeFile = win.renamerUI.state.files[1];
      expect(activeFile.name).to.equal('adhar_card.pdf');
    });

    // Target input should update
    cy.get('#inputRenameTarget').should('be.visible');
  });

  it('TC-UI-03: Casing switcher toggles between UPPER, Title, and lower styles', () => {
    // Click Title Case radio
    cy.get('#casingRadiosGroup label').contains(/title/i).click();
    cy.window().then((win) => {
      expect(win.renamerUI.state.style).to.equal('title');
    });

    // Click lower case radio
    cy.get('#casingRadiosGroup label').contains(/lower/i).click();
    cy.window().then((win) => {
      expect(win.renamerUI.state.style).to.equal('lower');
    });

    // Click UPPER case radio
    cy.get('#casingRadiosGroup label').contains(/upper/i).click();
    cy.window().then((win) => {
      expect(win.renamerUI.state.style).to.equal('upper');
    });
  });

  it('TC-UI-04: Enter key confirms and advances queue in a circular loop (1..N..1)', () => {
    // Initially at index 0
    cy.window().then((win) => {
      expect(win.renamerUI.state.currentIndex).to.equal(0);
    });

    // Press Enter in input field -> advances to index 1
    cy.get('#inputRenameTarget').type('{enter}');
    cy.window().then((win) => {
      expect(win.renamerUI.state.currentIndex).to.equal(1);
    });

    // Press Enter again -> advances to index 2
    cy.get('#inputRenameTarget').type('{enter}');
    cy.window().then((win) => {
      expect(win.renamerUI.state.currentIndex).to.equal(2);
    });

    // Press Enter on the last item -> wraps around back to index 0 (1..N..1)
    cy.get('#inputRenameTarget').type('{enter}');
    cy.window().then((win) => {
      expect(win.renamerUI.state.currentIndex).to.equal(0);
    });
  });

  it('TC-UI-05: Per-File 90° rotation button increments angle by 90 degrees', () => {
    // Rotation starts at 0
    cy.window().then((win) => {
      expect(win.renamerUI.state.rotation || 0).to.equal(0);
    });

    // Click Rotate 90 Clockwise button
    cy.get('#col-preview button[title*="Rotate"]').click();
    cy.window().then((win) => {
      expect(win.renamerUI.state.rotation).to.equal(90);
    });

    // Click again -> 180
    cy.get('#col-preview button[title*="Rotate"]').click();
    cy.window().then((win) => {
      expect(win.renamerUI.state.rotation).to.equal(180);
    });
  });

  it('TC-UI-06: Extension handling hides extension in input field', () => {
    cy.get('#inputRenameTarget').invoke('val').then((val) => {
      // Input text should NOT end with .pdf or .jpg
      expect(val).to.not.match(/\.pdf$/i);
      expect(val).to.not.match(/\.jpg$/i);
    });
  });

  it('TC-UI-07: Workspace reset (Clear button) resets queue to empty standby state', () => {
    cy.get('#btnClearWorkspace').click();

    // Queue in state should be empty
    cy.window().then((win) => {
      expect(win.renamerUI.state.files).to.have.length(0);
    });

    // col-queue should display standby empty state frame
    cy.get('#col-queue').contains(/standby|no intake folder/i).should('be.visible');
  });

});
