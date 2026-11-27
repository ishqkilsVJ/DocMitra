// ***********************************************************
// DocMitra Cypress E2E Support File
// ***********************************************************

import './commands.js';

// Prevent Cypress from failing test on benign uncaught CDN / font exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});
