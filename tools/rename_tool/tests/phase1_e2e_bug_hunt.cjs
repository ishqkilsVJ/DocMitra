const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

http.get('http://127.0.0.1:9222/json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    let list;
    try {
      list = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse CDP JSON:', e);
      process.exit(1);
    }
    const page = list.find(p => p.type === 'page');
    if (!page) {
      console.error('No page found on port 9222');
      process.exit(1);
    }

    const wsUrl = new URL(page.webSocketDebuggerUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: wsUrl.hostname,
      port: wsUrl.port,
      path: wsUrl.pathname,
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13'
      }
    });

    req.on('upgrade', (res, socket, head) => {
      let nextId = 1;
      function send(method, params = {}) {
        const id = nextId++;
        const json = JSON.stringify({ id, method, params });
        const len = Buffer.byteLength(json);
        let header;
        if (len < 126) header = Buffer.from([0x81, 0x80 | len]);
        else if (len < 65536) {
          header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(len, 2);
        } else {
          header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), 2);
        }
        const mask = crypto.randomBytes(4);
        const payload = Buffer.from(json);
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
        socket.write(Buffer.concat([header, mask, payload]));
        return id;
      }

      send('Console.enable');
      send('Runtime.enable');

      const consoleErrors = [];

      const evalId = send('Runtime.evaluate', {
        expression: `
          (async () => {
            let renamer = window.docmitraRenamer || window.renamerUI;
            let attempts = 0;
            while (!renamer && attempts < 25) {
              await new Promise(r => setTimeout(r, 200));
              renamer = window.docmitraRenamer || window.renamerUI;
              attempts++;
            }
            if (!renamer) return JSON.stringify({ error: 'window.docmitraRenamer/window.renamerUI not found after wait' });

            const results = {
              tc1: { name: 'Circular Queue Loop & Manual Edit Casing', pass: false, details: [] },
              tc2: { name: 'Shortcode Expansion & Illegal Characters', pass: false, details: [] },
              tc3: { name: 'Serial Numbers, Re-Scan F5 & Natural Sort', pass: false, details: [] },
              tc4: { name: 'Console Errors & Uncaught Exceptions', pass: false, details: [] }
            };

            window.__DOCMITRA_TEST_MODE__ = true;
            // Setup fresh test state
            renamer.state.folder = { name: 'VIJAY_RAMESH_YADAV', path: 'E:/Students/VIJAY_RAMESH_YADAV' };
            renamer.state.studentName = 'VIJAY RAMESH YADAV';
            renamer.state.style = 'upper';
            renamer.state.files = [
              { id: 'f1', name: '10th_marksheet.pdf', targetName: '10TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 154000, ext: '.pdf', isMatched: true, smartDocType: '10TH MARKSHEET', isRenamed: false, status: 'ready' },
              { id: 'f2', name: 'aadhaar_front.jpg', targetName: 'AADHAAR CARD VIJAY RAMESH YADAV.jpg', size: 180000, ext: '.jpg', isMatched: true, smartDocType: 'AADHAAR CARD', isRenamed: false, status: 'ready' },
              { id: 'f3', name: '12th_marksheet.pdf', targetName: '12TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 165000, ext: '.pdf', isMatched: true, smartDocType: '12TH MARKSHEET', isRenamed: false, status: 'ready' }
            ];
            renamer.state.currentIndex = 0;
            renamer.updateTelemetry();
            renamer.renderQueue();
            renamer.renderCurrentPreview();

            // =========================================================================
            // TEST CASE 1: Circular Queue Loop & User Edit State Preservation
            // =========================================================================
            try {
              const input = document.getElementById('inputRenameTarget');
              if (!input) throw new Error('#inputRenameTarget not found in DOM');

              // 1.1 Manual edit on File 0
              input.value = 'SPECIAL BONAFIDE CERTIFICATE';
              input.dispatchEvent(new Event('input', { bubbles: true }));

              // Simulate Enter key to confirm and advance
              input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

              // Check if advanced to File 1
              const advancedToIdx1 = (renamer.state.currentIndex === 1);
              results.tc1.details.push('Advancement to index 1: ' + (advancedToIdx1 ? 'PASS' : 'FAIL (idx=' + renamer.state.currentIndex + ')'));

              // Check if File 0 marked renamed
              const file0Confirmed = renamer.state.files[0].isRenamed === true;
              results.tc1.details.push('File 0 marked confirmed: ' + (file0Confirmed ? 'PASS' : 'FAIL'));

              // 1.2 Advance from File 1 -> File 2
              renamer.renderCurrentPreview();
              const input1 = document.getElementById('inputRenameTarget');
              input1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

              // 1.3 Advance from File 2 -> Wrap around to File 0
              renamer.renderCurrentPreview();
              const input2 = document.getElementById('inputRenameTarget');
              input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

              const wrappedTo0 = (renamer.state.currentIndex === 0);
              results.tc1.details.push('Wrap-around circular loop (1..N..1): ' + (wrappedTo0 ? 'PASS' : 'FAIL (idx=' + renamer.state.currentIndex + ')'));

              // 1.4 Test Shift+Tab backward navigation
              renamer.handleNavigateBackward();
              const navigatedBackTo2 = (renamer.state.currentIndex === 2);
              results.tc1.details.push('Backward navigation (Shift+Tab): ' + (navigatedBackTo2 ? 'PASS' : 'FAIL (idx=' + renamer.state.currentIndex + ')'));

              // Return to File 0
              renamer.state.currentIndex = 0;
              renamer.renderCurrentPreview();

              // 1.5 Verify custom manual edit preservation across Casing toggles
              const radioLower = document.querySelector('input[name="casingStyleRadio"][value="lower"]');
              if (radioLower) {
                radioLower.checked = true;
                radioLower.dispatchEvent(new Event('change', { bubbles: true }));
              }

              const file0CustomVal = renamer.state.files[0].userEditedName || cleanName(renamer.state.files[0].targetName || '');
              const preservedLower = file0CustomVal.toLowerCase().includes('special bonafide');
              results.tc1.details.push('Custom manual edit preserved on lowercase toggle: ' + (preservedLower ? 'PASS ("' + file0CustomVal + '")' : 'FAIL'));

              const radioUpper = document.querySelector('input[name="casingStyleRadio"][value="upper"]');
              if (radioUpper) {
                radioUpper.checked = true;
                radioUpper.dispatchEvent(new Event('change', { bubbles: true }));
              }
              const preservedUpper = (renamer.state.files[0].userEditedName || '').toUpperCase().includes('SPECIAL BONAFIDE');
              results.tc1.details.push('Custom manual edit preserved on uppercase toggle: ' + (preservedUpper ? 'PASS' : 'FAIL'));

              results.tc1.pass = advancedToIdx1 && file0Confirmed && wrappedTo0 && navigatedBackTo2 && preservedLower && preservedUpper;
            } catch (err) {
              results.tc1.details.push('Exception in TC1: ' + err.message);
              results.tc1.pass = false;
            }

            // =========================================================================
            // TEST CASE 2: Shortcode & Illegal Characters Blocking
            // =========================================================================
            try {
              renamer.state.currentIndex = 1;
              renamer.renderCurrentPreview();
              const input = document.getElementById('inputRenameTarget');

              // 2.1 Test shortcode expansion: Type "PIC" and press Enter
              input.value = 'PIC';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

              const file1Target = renamer.state.files[1].targetName || '';
              const expandedPic = file1Target.includes('PHOTO') && file1Target.includes('VIJAY RAMESH YADAV');
              results.tc2.details.push('Shortcode "PIC" expands to canonical "PHOTO <STUDENT>": ' + (expandedPic ? 'PASS ("' + file1Target + '")' : 'FAIL ("' + file1Target + '")'));

              // 2.2 Test illegal Windows characters blocking (\ / : * ? " < > |)
              renamer.state.currentIndex = 1;
              renamer.renderCurrentPreview();
              const inputAfter = document.getElementById('inputRenameTarget');
              const initialVal = inputAfter.value;

              let blockedCount = 0;
              const illegalChars = ['\\\\', '/', ':', '*', '?', '"', '<', '>', '|'];
              illegalChars.forEach(char => {
                const evt = new KeyboardEvent('keydown', { key: char, cancelable: true, bubbles: true });
                inputAfter.dispatchEvent(evt);
                if (evt.defaultPrevented) blockedCount++;
              });

              const allIllegalBlocked = (blockedCount === illegalChars.length);
              results.tc2.details.push('Illegal character keydown defaultPrevented: ' + (allIllegalBlocked ? 'PASS (9/9 blocked)' : 'FAIL (' + blockedCount + '/9 blocked)'));

              results.tc2.pass = expandedPic && allIllegalBlocked;
            } catch (err) {
              results.tc2.details.push('Exception in TC2: ' + err.message);
              results.tc2.pass = false;
            }

            // =========================================================================
            // TEST CASE 3: Serial Numbers, Re-Scan (F5) & Natural Sort (A–Z / Z–A)
            // =========================================================================
            try {
              // 3.1 Verify Left-Side Serial Numbers on completed rows
              renamer.renderQueue();
              const queueRows = document.querySelectorAll('#queue-container [data-index]');
              let serialsCorrect = true;
              let checkmarksCorrect = true;

              queueRows.forEach((row, i) => {
                const serialEl = row.querySelector('.serial-badge, span.font-mono-code, div.font-mono-code');
                const serialText = serialEl ? serialEl.textContent.trim() : '';
                if (serialText !== String(i + 1)) {
                  serialsCorrect = false;
                }
                // Check right-end checkmark for completed row 0
                if (i === 0) {
                  const checkmark = row.querySelector('.material-symbols-outlined, span.text-emerald-500, span.text-emerald-600');
                  if (!checkmark || !row.textContent.includes('✓')) {
                    checkmarksCorrect = false;
                  }
                }
              });

              results.tc3.details.push('Left serial number (1, 2, 3...) preserved on all rows: ' + (serialsCorrect ? 'PASS' : 'FAIL'));
              results.tc3.details.push('Completed row has right checkmark and left serial number: ' + (checkmarksCorrect ? 'PASS' : 'FAIL'));

              // 3.2 Test Re-Scan (F5) resets completed count to 0 Done
              await renamer.handleRescanFiles();
              const doneCountAfterRescan = renamer.state.files.filter(f => f.isRenamed).length;
              const rescanResetToZero = (doneCountAfterRescan === 0);
              results.tc3.details.push('Re-Scan (F5) resets queue to 0 Done: ' + (rescanResetToZero ? 'PASS' : 'FAIL (done=' + doneCountAfterRescan + ')'));

              // 3.3 Test Natural Alphanumeric Sort (A–Z / Z–A)
              renamer.state.files = [
                { id: 's1', name: '12th_marksheet.pdf', targetName: '12TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 1000, ext: '.pdf' },
                { id: 's2', name: '10th_marksheet.pdf', targetName: '10TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 1000, ext: '.pdf' },
                { id: 's3', name: '2_leaving.pdf', targetName: '2 LEAVING VIJAY RAMESH YADAV.pdf', size: 1000, ext: '.pdf' },
                { id: 's4', name: '1_aadhaar.pdf', targetName: '1 AADHAAR VIJAY RAMESH YADAV.pdf', size: 1000, ext: '.pdf' }
              ];

              renamer._sortOrder = 'desc'; // Next toggle will be 'asc'
              renamer.handleSortDocuments();
              const ascNames = renamer.state.files.map(f => f.name);
              // Expected natural sort order: 1_aadhaar, 2_leaving, 10th_marksheet, 12th_marksheet
              const naturalAscCorrect = (ascNames[0] === '1_aadhaar.pdf' && ascNames[1] === '2_leaving.pdf' && ascNames[2] === '10th_marksheet.pdf' && ascNames[3] === '12th_marksheet.pdf');
              results.tc3.details.push('Natural sort A–Z (1, 2, 10TH before 12TH): ' + (naturalAscCorrect ? 'PASS' : 'FAIL (' + ascNames.join(', ') + ')'));

              renamer.handleSortDocuments();
              const descNames = renamer.state.files.map(f => f.name);
              const naturalDescCorrect = (descNames[0] === '12th_marksheet.pdf' && descNames[1] === '10th_marksheet.pdf' && descNames[2] === '2_leaving.pdf' && descNames[3] === '1_aadhaar.pdf');
              results.tc3.details.push('Natural sort Z–A reverse ordering: ' + (naturalDescCorrect ? 'PASS' : 'FAIL (' + descNames.join(', ') + ')'));

              results.tc3.pass = serialsCorrect && checkmarksCorrect && rescanResetToZero && naturalAscCorrect && naturalDescCorrect;
            } catch (err) {
              results.tc3.details.push('Exception in TC3: ' + err.message);
              results.tc3.pass = false;
            }

            // Restore clean workstation visual state
            renamer.state.files = [
              { id: 'f1', name: '10th_marksheet.pdf', targetName: '10TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 154000, ext: '.pdf', isMatched: true, smartDocType: '10TH MARKSHEET', isRenamed: true, status: 'done' },
              { id: 'f2', name: 'aadhaar_front.jpg', targetName: 'PHOTO VIJAY RAMESH YADAV.jpg', size: 180000, ext: '.jpg', isMatched: true, smartDocType: 'PHOTO', isRenamed: true, status: 'done' },
              { id: 'f3', name: '12th_marksheet.pdf', targetName: '12TH MARKSHEET VIJAY RAMESH YADAV.pdf', size: 165000, ext: '.pdf', isMatched: true, smartDocType: '12TH MARKSHEET', isRenamed: false, status: 'ready' }
            ];
            renamer.state.currentIndex = 2;
            renamer.updateTelemetry();
            renamer.renderQueue();
            renamer.renderCurrentPreview();

            return JSON.stringify(results);
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });

      let screenshotId = null;
      let buf = Buffer.alloc(0);

      socket.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        while (buf.length >= 2) {
          const payloadLen = buf[1] & 0x7f;
          let offset = 2;
          let len = payloadLen;
          if (payloadLen === 126) {
            if (buf.length < 4) break;
            len = buf.readUInt16BE(2); offset = 4;
          } else if (payloadLen === 127) {
            if (buf.length < 10) break;
            len = Number(buf.readBigUInt64BE(2)); offset = 10;
          }
          if (buf.length < offset + len) break;
          const payload = buf.slice(offset, offset + len);
          buf = buf.slice(offset + len);

          try {
            const resp = JSON.parse(payload.toString('utf8'));
            if (resp.method === 'Console.messageAdded' && resp.params?.message?.level === 'error') {
              consoleErrors.push(resp.params.message.text);
            }
            if (resp.method === 'Runtime.exceptionThrown') {
              consoleErrors.push(resp.params.exceptionDetails?.text || 'Exception');
            }

            if (resp.id === evalId) {
              console.log('--- PHASE 1 TESTSPRITE E2E RESULTS ---');
              const resObj = JSON.parse(resp.result?.result?.value || '{}');
              resObj.tc4 = {
                name: 'Console Errors & Uncaught Exceptions',
                pass: consoleErrors.length === 0,
                details: consoleErrors.length === 0 ? ['0 console errors', '0 uncaught exceptions'] : consoleErrors
              };
              console.log(JSON.stringify(resObj, null, 2));

              setTimeout(() => {
                screenshotId = send('Page.captureScreenshot', { format: 'png' });
              }, 700);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/phase1_testsprite_verification.png';
              fs.writeFileSync(artifactPath, Buffer.from(base64Data, 'base64'));
              console.log('Saved screenshot to:', artifactPath);
              console.log('Total Console Errors:', consoleErrors.length);
              socket.end();
              process.exit(0);
            }
          } catch (e) {
            console.error('Data error:', e);
          }
        }
      });
    });
    req.end();
  });
});
