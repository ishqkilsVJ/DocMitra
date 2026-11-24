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
            const btnBulkRename = document.getElementById('btnRenameMatched');
            if (btnBulkRename) {
              btnBulkRename.click();
            }
            const modal = document.getElementById('modalCrossCheck');
            const isVisible = modal && !modal.classList.contains('hidden');
            const rowCount = document.querySelectorAll('#crossCheckTableBody [data-file-id]').length;
            return JSON.stringify({
              modalOpened: isVisible,
              rowCount
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
              console.log('BULK RENAME CLICK RESULT:', resp.result?.result?.value);
              setTimeout(() => {
                screenshotId = send('Page.captureScreenshot', { format: 'png' });
              }, 400);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/bulk_rename_opened_screenshot.png';
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
