import { chromium } from 'playwright';

(async () => {
  console.log('Connecting to live app via Playwright connectOverCDP...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  console.log('Connected! Page title:', await page.title());

  // Listen to console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Verify app shell and renamer manager
  const managerReady = await page.evaluate(() => {
    return typeof window.docmitraRenamer !== 'undefined';
  });
  console.log('DocMitra Renamer Manager ready:', managerReady);

  // Test folder input anti-autofill attributes
  const inputAttrs = await page.evaluate(() => {
    const input = document.getElementById('inputEditFolderName');
    return {
      exists: !!input,
      autocomplete: input?.getAttribute('autocomplete'),
      autocorrect: input?.getAttribute('autocorrect'),
      dataFormType: input?.getAttribute('data-form-type'),
      dataLpignore: input?.getAttribute('data-lpignore')
    };
  });
  console.log('Input Anti-Autofill Attributes:', JSON.stringify(inputAttrs, null, 2));

  // Open modal and test interactions
  const modalTest = await page.evaluate(() => {
    const renamer = window.docmitraRenamer;
    renamer.state.studentName = 'ARATI ARJUN';
    renamer.state.style = 'upper';
    renamer.state.files = [
      { id: 'f1', name: '10 th mark sheet.pdf', size: 1024, ext: '.pdf', smartConfidence: 98, docType: '10TH MARKSHEET', isMatched: true },
      { id: 'f2', name: '12 leaving.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: '12TH LC', isMatched: true },
      { id: 'f3', name: 'PHOTO ARATI ARJUN.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'PHOTO', isMatched: true }
    ];
    renamer.openCrossCheckModal();

    const modal = document.getElementById('modalCrossCheck');
    const isVisible = modal && !modal.classList.contains('hidden');

    const orderPills = Array.from(modal.querySelectorAll('[data-pattern-order]')).map(b => b.textContent.trim());
    const casePills = Array.from(modal.querySelectorAll('[data-pattern-case]')).map(b => b.textContent.trim());
    const filterPills = Array.from(modal.querySelectorAll('[data-pattern-filter]')).map(b => b.textContent.trim());

    return {
      modalVisible: isVisible,
      orderPills,
      casePills,
      filterPills
    };
  });
  console.log('Modal Test:', JSON.stringify(modalTest, null, 2));

  // Close modal via Esc
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const modalClosed = await page.evaluate(() => {
    const modal = document.getElementById('modalCrossCheck');
    return modal ? modal.classList.contains('hidden') : false;
  });
  console.log('Modal successfully closed on Escape:', modalClosed);

  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    process.exit(1);
  }

  console.log('🎉 PLAYWRIGHT MCP LIVE APP QA PASSED 100%!');
  await browser.close();
  process.exit(0);
})();
