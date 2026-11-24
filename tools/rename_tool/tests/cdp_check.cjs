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
          (() => {
            const renamer = window.renamerUI;
            if (renamer) {
              // Inject test files with typos and duplicates
              renamer.state.folder = { name: 'ARATI_ARJUN', path: 'E:/Students/ARATI_ARJUN' };
              renamer.state.studentName = 'ARATI ARJUN';
              renamer.state.files = [
                { id: '1', name: '10 th nark sheet.pdf', targetName: '10TH MARKSHEET ARATI ARJUN.pdf', size: 154200, ext: '.pdf', isMatched: true, smartDocType: '10TH MARKSHEET', smartConfidence: 95 },
                { id: '2', name: '12 leaving.pdf', targetName: '12TH LC ARATI ARJUN.pdf', size: 140000, ext: '.pdf', isMatched: true, smartDocType: '12TH LC', smartConfidence: 95 },
                { id: '3', name: '12th lc 2.pdf', targetName: '12TH LC 2 ARATI ARJUN.pdf', size: 140000, ext: '.pdf', isMatched: true, smartDocType: '12TH LC', smartConfidence: 95 },
                { id: '4', name: 'caste certifikate.pdf', targetName: 'CASTE CERTIFICATE ARATI ARJUN.pdf', size: 180000, ext: '.pdf', isMatched: true, smartDocType: 'CASTE CERTIFICATE', smartConfidence: 95 },
                { id: '5', name: 'caste certificate 2.pdf', targetName: 'CASTE CERTIFICATE 2 ARATI ARJUN.pdf', size: 180000, ext: '.pdf', isMatched: true, smartDocType: 'CASTE CERTIFICATE', smartConfidence: 95 },
                { id: '6', name: 'photo scan.jpg', targetName: 'PHOTO ARATI ARJUN.jpg', size: 95000, ext: '.jpg', isMatched: true, smartDocType: 'PHOTO', smartConfidence: 95 },
                { id: '7', name: 'photo camera.jpg', targetName: 'PHOTO ARATI ARJUN.jpg', size: 95000, ext: '.jpg', isMatched: true, smartDocType: 'PHOTO', smartConfidence: 95 }
              ];
              renamer.renderQueue();
              renamer.renderCurrentPreview();
              renamer.openCrossCheckModal();
            }

            const modal = document.getElementById('modalCrossCheck');
            const isVisible = modal && !modal.classList.contains('hidden');
            const rows = document.querySelectorAll('#crossCheckTableBody [data-file-id]');
            
            // Check for duplicate badges and error badges inside modal rows
            const dupBadges = document.querySelectorAll('#crossCheckTableBody .badge-dup-confirmed, #crossCheckTableBody .badge-dup-probable');
            const errorBadges = document.querySelectorAll('#crossCheckTableBody .badge-wrong-minor, #crossCheckTableBody .badge-wrong-major');
            
            // Also check sidebar queue badges
            const sidebarDupBadges = document.querySelectorAll('#col-queue .badge-dup-confirmed, #col-queue .badge-dup-probable');

            const dupTexts = Array.from(dupBadges).map(el => el.textContent.trim());
            const errTexts = Array.from(errorBadges).map(el => el.textContent.trim());
            const sidebarDupTexts = Array.from(sidebarDupBadges).map(el => el.textContent.trim());

            return JSON.stringify({
              modalOpened: isVisible,
              rowCount: rows.length,
              dupBadgesCountInModal: dupBadges.length,
              dupTextsInModal: dupTexts,
              errorBadgesCountInModal: errorBadges.length,
              errTextsInModal: errTexts,
              sidebarDupBadgesCount: sidebarDupBadges.length,
              sidebarDupTexts: sidebarDupTexts
            });
          })()
        `,
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
              }, 600);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/duplicate_and_error_badge_verification.png';
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
