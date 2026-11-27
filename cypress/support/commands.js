// ***********************************************************
// DocMitra Cypress Custom Commands
// ***********************************************************

/**
 * Stubs window.__TAURI__ and window.__TAURI_INTERNALS__ so that
 * native bridge calls resolve safely with mock data in browser tests.
 */
Cypress.Commands.add('mockTauriBridge', () => {
  cy.window().then((win) => {
    if (!win.__TAURI__) {
      win.__TAURI__ = {
        core: {
          invoke: (cmd, args) => {
            console.log(`[Cypress Mock Tauri] invoke: ${cmd}`, args);
            if (cmd === 'list_native_directory') {
              return Promise.resolve({
                success: true,
                folder_name: 'Vijay_Ramesh_Yadav',
                folder_path: 'E:/Students/Vijay_Ramesh_Yadav',
                files: [
                  { name: '10th_marksheet.pdf', size: 184320, ext: '.pdf', id: 'file-0' },
                  { name: 'adhar_card.pdf', size: 215040, ext: '.pdf', id: 'file-1' },
                  { name: 'photo_scan.jpg', size: 95400, ext: '.jpg', id: 'file-2' }
                ]
              });
            }
            if (cmd === 'rename_native_file' || cmd === 'move_native_file') {
              return Promise.resolve({ success: true });
            }
            return Promise.resolve({ success: true });
          }
        }
      };
    }
  });
});

/**
 * Navigates to Bulk Renamer with pre-populated test data in simulated test mode
 */
Cypress.Commands.add('loadTestWorkstation', () => {
  cy.visit('/?test_loaded=1&test_mode=1');
  cy.mockTauriBridge();
  // Ensure the state has loaded 3 files and each file has a clean unique id
  cy.window({ timeout: 10000 }).should((win) => {
    expect(win.renamerUI, 'renamerUI exists').to.exist;
    expect(win.renamerUI.state, 'renamerUI.state exists').to.exist;
    expect(win.renamerUI.state.files, 'files loaded').to.have.length(3);
    win.renamerUI.state.files.forEach((f, idx) => {
      if (!f.id) f.id = `file-${idx}`;
    });
  });
  cy.get('#col-queue', { timeout: 10000 }).should('be.visible');
});
