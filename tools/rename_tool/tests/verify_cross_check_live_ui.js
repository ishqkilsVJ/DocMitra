/**
 * Live Cross-Check Modal UI Verification via CDP (WebSocket)
 */
import fs from 'node:fs';

const res = await fetch('http://127.0.0.1:9222/json');
const targets = await res.json();
const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('tauri.localhost'));
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

function sendCdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

console.log('=== 🧪 LIVE VERIFICATION: Cross-Check Modal UI & Buttons in Desktop App ===');

// 1. Populate sample files & open modal
const modalCheck = await sendCdp('Runtime.evaluate', {
  expression: `(() => {
    const ui = window.renamerUI;
    if (!ui) return { error: 'No renamerUI' };

    // Inject 3 sample files matching user screenshot
    ui.state.studentName = 'BIRHADE ARTI ARUN';
    ui.state.files = [
      { id: 'f1', name: 'PHOTO 2 BIRHADE ARTI ARUN.pdf', path: 'D:/test/f1.pdf', smartSuggestedName: 'PHOTO BIRHADE ARTI ARUN', smartConfidence: 95 },
      { id: 'f2', name: 'PHOTO 3 BIRHADE ARTI ARUN.jpg', path: 'D:/test/f2.jpg', smartSuggestedName: 'PHOTO BIRHADE ARTI ARUN', smartConfidence: 95 },
      { id: 'f3', name: 'vot.pdf', path: 'D:/test/f3.pdf', smartSuggestedName: 'VOTER ID BIRHADE ARTI ARUN', smartConfidence: 95 }
    ];

    ui.openCrossCheckModal();

    const modal = document.getElementById('modalCrossCheck');
    const orderBtn1 = modal.querySelector('[data-pattern-order="doc_student"]');
    const orderBtn2 = modal.querySelector('[data-pattern-order="student_doc"]');
    const studentBtn = document.getElementById('btnToggleCrossCheckStudent');
    const cancelBtn = document.getElementById('btnCancelCrossCheck');
    const confirmBtn = document.getElementById('btnConfirmBatchRename');

    const activePill = modal.querySelector('.pattern-pill.active');
    const activeColor = activePill ? window.getComputedStyle(activePill).backgroundColor : null;

    const rows = Array.from(modal.querySelectorAll('#crossCheckTableBody tr'));
    const rowDetails = rows.map(r => {
      const tdOld = r.children[1];
      const tdNew = r.children[3];
      const tdConf = r.children[4];
      return {
        oldHtml: tdOld ? tdOld.innerHTML : '',
        newHtml: tdNew ? tdNew.innerHTML : '',
        confText: tdConf ? tdConf.textContent.trim() : ''
      };
    });

    return {
      isOpen: modal && !modal.classList.contains('hidden'),
      orderBtn1Text: orderBtn1 ? orderBtn1.textContent.trim() : '',
      orderBtn2Text: orderBtn2 ? orderBtn2.textContent.trim() : '',
      activeBgColor: activeColor,
      studentBtnClass: studentBtn ? studentBtn.className : '',
      cancelBtnClass: cancelBtn ? cancelBtn.className : '',
      confirmBtnClass: confirmBtn ? confirmBtn.className : '',
      rowCount: rows.length,
      rowDetails
    };
  })()`,
  returnByValue: true
});

const resVal = modalCheck.result.value;
console.log('  • Modal Open Status:', resVal.isOpen ? 'OPEN (PASS)' : 'FAIL');
console.log('  • Order Button 1 Text:', `"${resVal.orderBtn1Text}"`, resVal.orderBtn1Text === 'Doc + Student' ? '✅ CLEAN' : '❌ HAS BRACKETS');
console.log('  • Order Button 2 Text:', `"${resVal.orderBtn2Text}"`, resVal.orderBtn2Text === 'Student + Doc' ? '✅ CLEAN' : '❌ HAS BRACKETS');
console.log('  • Active Button Color:', resVal.activeBgColor, resVal.activeBgColor === 'rgb(0, 55, 176)' ? '✅ ROYAL BLUE (PASS)' : '❌ WRONG COLOR');
console.log('  • Student Toggle Theme:', resVal.studentBtnClass.includes('text-primary') ? '✅ ROYAL BLUE THEMED' : '❌ NOT THEMED');
console.log('  • Rows Rendered in Modal:', resVal.rowCount);
resVal.rowDetails.forEach((r, idx) => {
  console.log(`    Row ${idx + 1}: Confidence: "${r.confText}"`);
});

// 2. Capture screenshot of open modal
const shot = await sendCdp('Page.captureScreenshot', { format: 'png' });
const shotPath = 'C:\\Users\\USER\\AppData\\Local\\DocMitra\\cross_check_modal_verified.png';
fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
console.log(`  • Modal Live Screenshot Saved: ${shotPath} (${shot.data.length} bytes)`);

// 3. Cleanly close modal
await sendCdp('Runtime.evaluate', {
  expression: `(() => {
    if (window.renamerUI) {
      window.renamerUI.closeCrossCheckModal();
      window.renamerUI.state.files = [];
      window.renamerUI.state.studentName = '';
      window.renamerUI.renderFileList();
    }
  })()`
});
console.log('  • Modal cleanly closed post-verification.');

ws.close();
console.log('🎉 LIVE MODAL UI & BUTTON VERIFICATION COMPLETE!');
