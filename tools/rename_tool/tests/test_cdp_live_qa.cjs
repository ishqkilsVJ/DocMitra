const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

http.get('http://127.0.0.1:9222/json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const list = JSON.parse(body);
    const page = list.find(p => p.type === 'page');
    if (!page) { console.error('No page found'); process.exit(1); }

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
            const renamer = window.renamerUI;
            if (!renamer) return JSON.stringify({ error: 'window.renamerUI not found' });

            // 1. Inject a dataset identical to the user's scenario:
            // Some already renamed/done files, some already perfect, and some completely unmatched files (FDFD, FDFS, etc.)
            renamer.state.folder = { name: 'HASINA_VISHNU_GAVIT', path: 'E:/Students/HASINA_VISHNU_GAVIT' };
            renamer.state.studentName = 'HASINA VISHNU GAVIT';
            renamer.state.files = [
              // 1-3: Already renamed / perfect files
              { id: '1', name: '10TH MARKSHEET HASINA VISHNU GAVIT.pdf', targetName: '10TH MARKSHEET HASINA VISHNU GAVIT.pdf', size: 154200, ext: '.pdf', isMatched: true, smartDocType: '10TH MARKSHEET', smartConfidence: 100, isRenamed: true, status: 'done' },
              { id: '2', name: 'CASTE CERTIFICATE HASINA VISHNU GAVIT.pdf', targetName: 'CASTE CERTIFICATE HASINA VISHNU GAVIT.pdf', size: 180000, ext: '.pdf', isMatched: true, smartDocType: 'CASTE CERTIFICATE', smartConfidence: 100, isRenamed: true, status: 'done' },
              { id: '3', name: 'INCOME CERTIFICATE HASINA VISHNU GAVIT.pdf', targetName: 'INCOME CERTIFICATE HASINA VISHNU GAVIT.pdf', size: 175000, ext: '.pdf', isMatched: true, smartDocType: 'INCOME CERTIFICATE', smartConfidence: 100, isRenamed: true, status: 'done' },
              // 4-6: Completely unmatched files (like user's FDFD, FDFS, FSDF)
              { id: '4', name: 'FDFD.pdf', targetName: 'FDFD HASINA VISHNU GAVIT.pdf', size: 90000, ext: '.pdf', isMatched: false, smartDocType: null, smartConfidence: 0, status: 'unmatched' },
              { id: '5', name: 'FDFS.pdf', targetName: 'FDFS HASINA VISHNU GAVIT.pdf', size: 92000, ext: '.pdf', isMatched: false, smartDocType: null, smartConfidence: 0, status: 'unmatched' },
              { id: '6', name: 'FSDF.jpg', targetName: 'FSDF HASINA VISHNU GAVIT.jpg', size: 65000, ext: '.jpg', isMatched: false, smartDocType: null, smartConfidence: 0, status: 'unmatched' },
              // 7-8: Pending matched files
              { id: '7', name: '12th lc.pdf', targetName: '12TH LC HASINA VISHNU GAVIT.pdf', size: 140000, ext: '.pdf', isMatched: true, smartDocType: '12TH LC', smartConfidence: 95, status: 'matched' },
              { id: '8', name: 'aadhaar card.pdf', targetName: 'AADHAAR CARD HASINA VISHNU GAVIT.pdf', size: 120000, ext: '.pdf', isMatched: true, smartDocType: 'AADHAAR CARD', smartConfidence: 100, status: 'matched' }
            ];

            renamer.updateTelemetry();
            renamer.renderQueue();
            renamer.renderCurrentPreview();

            // Check bottom-right button text
            const btnRenameMatched = document.getElementById('btnRenameMatched');
            const btnSpan = btnRenameMatched ? btnRenameMatched.querySelector('span:not(.material-symbols-outlined)') : null;
            const btnText = btnSpan ? btnSpan.textContent.trim() : '';

            // Open Cross-Check modal
            renamer.openCrossCheckModal();
            const modal = document.getElementById('modalCrossCheck');
            const isModalOpen = modal && !modal.classList.contains('hidden');

            const allRows = document.querySelectorAll('#crossCheckTableBody [data-file-id]');
            const totalCountEl = document.getElementById('crossCheckTotalCount');
            const totalShown = totalCountEl ? totalCountEl.textContent.trim() : '';

            // Check if unmatched files are rendered
            const unmatchedRowFdfd = document.querySelector('#crossCheckTableBody [data-file-id="4"]');
            const unmatchedRowFdfs = document.querySelector('#crossCheckTableBody [data-file-id="5"]');
            const hasUnmatchedBadge = document.querySelectorAll('#crossCheckTableBody .bg-rose-50').length > 0;

            // Check if already perfect files are rendered and unchecked by default
            const perfectRow1 = document.querySelector('#crossCheckTableBody [data-file-id="1"]');
            const cb1 = perfectRow1 ? perfectRow1.querySelector('input[type="checkbox"]') : null;
            const isCb1Unchecked = cb1 ? !cb1.checked : false;

            // Check if pending modified files are checked by default
            const row7 = document.querySelector('#crossCheckTableBody [data-file-id="7"]');
            const cb7 = row7 ? row7.querySelector('input[type="checkbox"]') : null;
            const isCb7Checked = cb7 ? cb7.checked : false;

            return JSON.stringify({
              totalFilesInQueue: renamer.state.files.length,
              btnText: btnText,
              isModalOpen: isModalOpen,
              modalTotalShown: totalShown,
              modalRowCount: allRows.length,
              unmatchedFilesRendered: !!(unmatchedRowFdfd && unmatchedRowFdfs),
              hasUnmatchedBadge: hasUnmatchedBadge,
              perfectFileUncheckedByDefault: isCb1Unchecked,
              modifiedFileCheckedByDefault: isCb7Checked
            });
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
              console.log('--- DUAL-MCP LIVE VERIFICATION RESULT ---');
              console.log(resp.result?.result?.value);
              setTimeout(() => {
                screenshotId = send('Page.captureScreenshot', { format: 'png' });
              }, 700);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/all_files_modal_verification.png';
              fs.writeFileSync(artifactPath, Buffer.from(base64Data, 'base64'));
              console.log('Saved screenshot to:', artifactPath);
              console.log('Console Errors:', consoleErrors.length, consoleErrors);
              socket.end();
              process.exit(consoleErrors.length > 0 ? 1 : 0);
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
    });
    req.end();
  });
});
