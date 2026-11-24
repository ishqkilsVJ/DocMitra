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

            // 1. Verify existence of footer and modal buttons
            const btnMoveDup = document.getElementById('btnMoveToDuplicates');
            const btnSortQueue = document.getElementById('btnSortQueue');
            const btnRescan = document.getElementById('btnRescanFiles');
            const sortQueueLabel = document.getElementById('sortQueueLabel');

            // 2. Inject test files (with duplicates, typos, and numbering)
            renamer.state.folder = { name: 'ANJALI_SANTOSH_GAVIT', path: 'E:/Students/ANJALI_SANTOSH_GAVIT' };
            renamer.state.studentName = 'ANJALI SANTOSH GAVIT';
            renamer.state.files = [
              { id: '1', name: '12TH LC.pdf', targetName: '12TH LC ANJALI SANTOSH GAVIT.pdf', size: 140000, ext: '.pdf', isMatched: true, smartDocType: '12TH LC', smartConfidence: 100 },
              { id: '2', name: '10TH MARKSHEET.pdf', targetName: '10TH MARKSHEET ANJALI SANTOSH GAVIT.pdf', size: 154200, ext: '.pdf', isMatched: true, smartDocType: '10TH MARKSHEET', smartConfidence: 100 },
              { id: '3', name: '12TH LC 2.pdf', targetName: '12TH LC 2 ANJALI SANTOSH GAVIT.pdf', size: 140000, ext: '.pdf', isMatched: true, smartDocType: '12TH LC', smartConfidence: 95 },
              { id: '4', name: 'CASTE CERTIFICATE.pdf', targetName: 'CASTE CERTIFICATE ANJALI SANTOSH GAVIT.pdf', size: 180000, ext: '.pdf', isMatched: true, smartDocType: 'CASTE CERTIFICATE', smartConfidence: 100 },
              { id: '5', name: 'CASTE CERTIFICATE 2.pdf', targetName: 'CASTE CERTIFICATE 2 ANJALI SANTOSH GAVIT.pdf', size: 180000, ext: '.pdf', isMatched: true, smartDocType: 'CASTE CERTIFICATE', smartConfidence: 95 },
              { id: '6', name: 'AADHAAR CARD.pdf', targetName: 'AADHAAR CARD ANJALI SANTOSH GAVIT.pdf', size: 120000, ext: '.pdf', isMatched: true, smartDocType: 'AADHAAR CARD', smartConfidence: 100 }
            ];

            renamer.renderQueue();
            renamer.renderCurrentPreview();

            // 3. Test Natural Sort
            renamer.handleSortDocuments('asc');
            const firstSortedAsc = renamer.state.files[0]?.targetName;
            renamer.handleSortDocuments('desc');
            const firstSortedDesc = renamer.state.files[0]?.targetName;
            renamer.handleSortDocuments('asc'); // Back to asc

            // 4. Test Safe Move & Undo
            const countBeforeMove = renamer.state.files.length;
            const fileToMove = renamer.state.files[0];
            await renamer.handleMoveFileToDuplicates(fileToMove);
            const countAfterMove = renamer.state.files.length;
            await renamer.handleUndoSafeMove();
            const countAfterUndo = renamer.state.files.length;

            // 5. Test Fresh Re-Scan (resetting isRenamed states)
            renamer.state.files[0].isRenamed = true;
            renamer.state.files[0].status = 'done';
            renamer.updateTelemetry();
            await renamer.handleRescanFiles();
            const countDoneAfterRescan = renamer.state.files.filter(f => f.isRenamed).length;

            // 6. Test Cross-Check Modal
            renamer.openCrossCheckModal();
            const modal = document.getElementById('modalCrossCheck');
            const isModalOpen = modal && !modal.classList.contains('hidden');
            const btnModalMoveDup = document.getElementById('btnModalMoveDuplicates');
            const modalMoveDupLabel = document.getElementById('modalMoveDuplicatesLabel');
            const btnModalSort = document.getElementById('btnModalSort');
            const modalSortLabel = document.getElementById('modalSortLabel');

            return JSON.stringify({
              buttonsExist: !!(btnMoveDup && btnSortQueue && btnRescan),
              sortAscFirst: firstSortedAsc,
              sortDescFirst: firstSortedDesc,
              countBeforeMove,
              countAfterMove,
              countAfterUndo,
              countDoneAfterRescan,
              isModalOpen,
              modalMoveDupVisible: btnModalMoveDup && !btnModalMoveDup.classList.contains('hidden'),
              modalMoveDupText: modalMoveDupLabel?.textContent,
              modalSortText: modalSortLabel?.textContent
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
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/safe_move_and_sort_verification.png';
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
