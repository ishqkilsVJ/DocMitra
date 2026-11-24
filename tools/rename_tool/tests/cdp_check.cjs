const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

http.get('http://127.0.0.1:9222/json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const list = JSON.parse(body);
    const page = list.find(p => p.type === 'page');
    if (!page) { console.error('No page'); process.exit(1); }

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

      const evalId = send('Runtime.evaluate', {
        expression: `
          (() => {
            const renamer = window.docmitraRenamer;
            if (!renamer) return { error: 'no renamer' };
            renamer.state.studentName = 'ARATI ARJUN';
            renamer.state.style = 'upper';
            renamer.state.files = [
              { id: 'f1', name: '10 th mark sheet.pdf', size: 1024, ext: '.pdf', smartConfidence: 98, docType: '10TH MARKSHEET', isMatched: true },
              { id: 'f2', name: '12 leaving.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: '12TH LC', isMatched: true },
              { id: 'f3', name: 'bank.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'BANK PASSBOOK', isMatched: true },
              { id: 'f4', name: 'cast.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'CASTE CERTIFICATE', isMatched: true },
              { id: 'f5', name: 'income ce.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'INCOME CERTIFICATE', isMatched: true },
              { id: 'f6', name: 'photo ahe.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'PHOTO', isMatched: true },
              { id: 'f7', name: 'pic.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'PHOTO', isMatched: true },
              { id: 'f8', name: 'validety.pdf', size: 1024, ext: '.pdf', smartConfidence: 85, docType: 'CASTE VALIDITY CERTIFICATE', isMatched: true },
              { id: 'f9', name: 'PHOTO ARATI ARJUN.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'PHOTO', isMatched: true },
              { id: 'f10', name: 'VOTER ID ARATI ARJUN.pdf', size: 1024, ext: '.pdf', smartConfidence: 95, docType: 'VOTER ID', isMatched: true }
            ];
            renamer.openCrossCheckModal();

            // Initial state check
            const initialSelected = document.getElementById('crossCheckSelectedCount')?.textContent;

            // Click Title case
            const titleBtn = document.querySelector('[data-pattern-case="title"]');
            if (titleBtn) titleBtn.click();

            const afterTitleSelected = document.getElementById('crossCheckSelectedCount')?.textContent;
            const btnConfirm = document.getElementById('btnConfirmBatchRename')?.textContent.trim();

            const tbody = document.getElementById('crossCheckTableBody');
            const rows = tbody ? Array.from(tbody.querySelectorAll('[data-file-id]')).map(r => ({
              id: r.dataset.fileId,
              checked: r.querySelector('input[type="checkbox"]')?.checked,
              text: r.innerText.replace(/\\s+/g, ' ').trim()
            })) : [];

            return JSON.stringify({
              initialSelected,
              afterTitleSelected,
              btnConfirm,
              allChecked: rows.every(r => r.checked),
              rowsSample: rows.slice(8)
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
            if (resp.id === evalId) {
              console.log('DYNAMIC AUTO-CHECK TEST RESULT:', resp.result?.result?.value);
              setTimeout(() => {
                screenshotId = send('Page.captureScreenshot', { format: 'png' });
              }, 400);
            } else if (resp.id === screenshotId) {
              const base64Data = resp.result.data;
              const artifactPath = 'C:/Users/USER/.gemini/antigravity/brain/12ea5c70-446e-4ca0-b1ea-4c628e4aaf83/dynamic_autocheck_screenshot.png';
              fs.writeFileSync(artifactPath, Buffer.from(base64Data, 'base64'));
              console.log('Saved dynamic check screenshot to:', artifactPath);
              socket.end();
              process.exit(0);
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
