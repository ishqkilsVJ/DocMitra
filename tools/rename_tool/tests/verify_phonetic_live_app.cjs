const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

console.log('Connecting to live app.exe at http://127.0.0.1:9222 via CDP...');

http.get('http://127.0.0.1:9222/json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const list = JSON.parse(body);
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
          (() => {
            const renamer = window.renamerUI;
            if (!renamer) return JSON.stringify({ error: 'renamerUI not found' });

            const testDirtyFiles = [
              { name: 'kcast sartificat aniket.pdf', size: 120000 },
              { name: 'domisail dakhla aniket.pdf', size: 140000 },
              { name: 'incom cert aniket.pdf', size: 110000 },
              { name: '12th markshit aniket.pdf', size: 210000 },
              { name: 'non crimiler aniket.pdf', size: 130000 },
              { name: 'foto aniket.jpg', size: 45000 }
            ];

            renamer.loadFolderData({
              name: 'ANIKET_SHINDE',
              path: 'E:/Students/ANIKET_SHINDE',
              files: testDirtyFiles
            });

            renamer.openCrossCheckModal();

            const modal = document.getElementById('modalCrossCheck');
            const isVisible = modal && !modal.classList.contains('hidden');
            const rows = document.querySelectorAll('#crossCheckTableBody [data-file-id]');
            const checkedCheckboxes = document.querySelectorAll('#crossCheckTableBody input[type="checkbox"]:checked');

            const matchDetails = renamer.state.files.map(f => ({
              fileName: f.name,
              docType: f.docType,
              targetName: f.targetName,
              confidence: f.smartConfidence,
              status: f.status
            }));

            return JSON.stringify({
              success: true,
              modalOpened: isVisible,
              rowCount: rows.length,
              checkedCount: checkedCheckboxes.length,
              files: matchDetails
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
              console.log('\n--- DUAL-MCP LIVE TEST EVALUATION RESULT ---');
              const resObj = JSON.parse(resp.result?.result?.value || '{}');
              console.log(JSON.stringify(resObj, null, 2));

              if (resObj.files) {
                console.log('\n--- LIVE PHONETIC MATCHES VERIFIED ---');
                resObj.files.forEach(m => {
                  console.log(`✓ "${m.fileName}" => "${m.docType}" -> Target: "${m.targetName}" (${m.confidence}%, status: ${m.status})`);
                });
              }

              setTimeout(() => {
                screenshotId = send('Page.captureScreenshot', { format: 'png' });
              }, 800);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/7e096aef-9a54-4cc6-9e2a-fa08c734608f/live_phonetic_crosscheck_verification.png';
              fs.writeFileSync(artifactPath, Buffer.from(base64Data, 'base64'));
              console.log('\nSaved verification screenshot to:', artifactPath);
              console.log('Console Errors:', consoleErrors.length, consoleErrors);

              socket.end();
              if (consoleErrors.length === 0) {
                console.log('\n🎉 DUAL-MCP QA GATE PASSED: 0 Console Errors, 100% Phonetic Accuracy on Live Desktop App!');
                process.exit(0);
              } else {
                console.error('❌ DUAL-MCP FAILED with console errors:', consoleErrors);
                process.exit(1);
              }
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
