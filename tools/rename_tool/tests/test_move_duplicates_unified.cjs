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

            // 1. Inject duplicate scenario: 2(1) to 2(9) plus 1 normal file
            renamer.state.folder = { name: 'HASINA_VISHNU_GAVIT', path: 'E:/Students/HASINA_VISHNU_GAVIT' };
            renamer.state.studentName = 'HASINA VISHNU GAVIT';
            renamer.state.files = [
              { id: '1', name: '2 (1).pdf', targetName: '2 (1) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '2', name: '2 (2).pdf', targetName: '2 (2) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '3', name: '2 (3).pdf', targetName: '2 (3) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '4', name: '2 (4).pdf', targetName: '2 (4) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '5', name: '2 (5).pdf', targetName: '2 (5) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '6', name: '2 (6).pdf', targetName: '2 (6) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '7', name: '2 (7).pdf', targetName: '2 (7) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '8', name: '2 (8).pdf', targetName: '2 (8) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '9', name: '2 (9).pdf', targetName: '2 (9) HASINA VISHNU GAVIT.pdf', size: 286000, ext: '.pdf', isMatched: false, smartDocType: null, status: 'unmatched' },
              { id: '10', name: 'AADHAAR CARD.pdf', targetName: 'AADHAAR CARD HASINA VISHNU GAVIT.pdf', size: 150000, ext: '.pdf', isMatched: true, smartDocType: 'AADHAAR CARD', status: 'matched' }
            ];

            renamer.updateTelemetry();
            renamer.renderQueue();
            renamer.renderCurrentPreview();

            // Check extra duplicates detected
            const extraDupsBefore = renamer.getExtraDuplicateFiles();
            const btnMoveDup = document.getElementById('btnMoveToDuplicates');
            const moveDupLabel = document.getElementById('moveDuplicatesLabel');
            const labelBefore = moveDupLabel ? moveDupLabel.textContent.trim() : '';
            const isRoseStyledBefore = btnMoveDup ? btnMoveDup.classList.contains('bg-rose-950/80') : false;

            // Execute Move All Duplicates
            await renamer.handleMoveAllDuplicates();

            const countAfterMove = renamer.state.files.length;
            const extraDupsAfterMove = renamer.getExtraDuplicateFiles();
            const labelAfterMove = moveDupLabel ? moveDupLabel.textContent.trim() : '';
            const isSlateStyledAfterMove = btnMoveDup ? btnMoveDup.classList.contains('bg-slate-800') : false;

            // Test Undo Batch Move
            await renamer.handleUndoSafeMove();

            const countAfterUndo = renamer.state.files.length;
            const extraDupsAfterUndo = renamer.getExtraDuplicateFiles();
            const labelAfterUndo = moveDupLabel ? moveDupLabel.textContent.trim() : '';
            const isRoseStyledAfterUndo = btnMoveDup ? btnMoveDup.classList.contains('bg-rose-950/80') : false;

            // Re-execute move so visual state shows the clean result with remaining 2 files
            await renamer.handleMoveAllDuplicates();

            return JSON.stringify({
              totalInitialFiles: 10,
              extraDuplicatesCount: extraDupsBefore.length,
              labelBefore: labelBefore,
              isRoseStyledBefore: isRoseStyledBefore,
              countAfterMove: countAfterMove,
              extraDupsAfterMoveCount: extraDupsAfterMove.length,
              labelAfterMove: labelAfterMove,
              isSlateStyledAfterMove: isSlateStyledAfterMove,
              countAfterUndo: countAfterUndo,
              extraDupsAfterUndoCount: extraDupsAfterUndo.length,
              labelAfterUndo: labelAfterUndo,
              isRoseStyledAfterUndo: isRoseStyledAfterUndo,
              finalRemainingCount: renamer.state.files.length
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
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/move_duplicates_unified_verification.png';
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
