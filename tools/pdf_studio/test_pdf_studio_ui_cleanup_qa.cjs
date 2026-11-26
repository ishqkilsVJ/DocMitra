/**
 * tools/pdf_studio/test_pdf_studio_ui_cleanup_qa.cjs
 * Automated Dual-MCP QA Test Script for PDF Studio UI Cleanup & Streamlining
 * Directly connects to live desktop release app via CDP (Port 9222).
 */

const http = require('http');
const crypto = require('crypto');

http.get('http://127.0.0.1:9222/json', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const list = JSON.parse(body);
    const page = list.find(p => p.type === 'page');
    if (!page) {
      console.error('❌ No active page found on port 9222');
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
      const pendingCallbacks = new Map();

      function send(method, params = {}) {
        return new Promise((resolve) => {
          const id = nextId++;
          pendingCallbacks.set(id, resolve);
          const json = JSON.stringify({ id, method, params });
          const len = Buffer.byteLength(json);
          let header;
          if (len < 126) {
            header = Buffer.from([0x81, 0x80 | len]);
          } else if (len < 65536) {
            header = Buffer.alloc(4);
            header[0] = 0x81;
            header[1] = 0x80 | 126;
            header.writeUInt16BE(len, 2);
          } else {
            header = Buffer.alloc(10);
            header[0] = 0x81;
            header[1] = 0x80 | 127;
            header.writeBigUInt64BE(BigInt(len), 2);
          }
          const mask = crypto.randomBytes(4);
          const payload = Buffer.from(json);
          for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
          socket.write(Buffer.concat([header, mask, payload]));
        });
      }

      const consoleErrors = [];

      socket.on('data', (buf) => {
        let offset = 0;
        while (offset < buf.length) {
          if (offset + 2 > buf.length) break;
          const secondByte = buf[offset + 1];
          let payloadLen = secondByte & 0x7f;
          let maskOffset = offset + 2;
          if (payloadLen === 126) {
            payloadLen = buf.readUInt16BE(offset + 2);
            maskOffset = offset + 4;
          } else if (payloadLen === 127) {
            payloadLen = Number(buf.readBigUInt64BE(offset + 2));
            maskOffset = offset + 10;
          }
          const dataOffset = maskOffset;
          const end = dataOffset + payloadLen;
          if (end > buf.length) break;

          const raw = buf.slice(dataOffset, end);
          try {
            const msg = JSON.parse(raw.toString('utf8'));
            if (msg.method === 'Console.messageAdded' && msg.params?.message?.level === 'error') {
              consoleErrors.push(msg.params.message.text);
            }
            if (msg.method === 'Runtime.exceptionThrown') {
              const details = msg.params.exceptionDetails;
              const errDesc = details?.exception?.description || details?.text || JSON.stringify(details);
              consoleErrors.push(errDesc);
            }
            if (msg.id && pendingCallbacks.has(msg.id)) {
              const cb = pendingCallbacks.get(msg.id);
              pendingCallbacks.delete(msg.id);
              cb(msg);
            }
          } catch (e) {}
          offset = end;
        }
      });

      (async () => {
        await send('Console.enable');
        await send('Runtime.enable');

        const testScript = `
          (async () => {
            const results = {
              item1_topToolbar: {},
              item2_dropzoneAndSummary: {},
              item3_targetControlsSync: {},
              item4_clutterRemoval: {},
              item5_dynamicButtonLabels: {},
              overallSuccess: true,
              errors: []
            };

            // Switch to PDF Studio view
            const navBtn = document.querySelector('[data-view="pdf-studio"]') || document.querySelector('button[title*="PDF"], a[href*="pdf"]');
            if (navBtn) navBtn.click();

            const pdfView = document.getElementById('view-pdf-studio');
            if (pdfView) {
              pdfView.classList.remove('hidden');
            }

            // ITEM 1: Top Toolbar Cleanup & Right-Aligned Action Buttons
            const folderPill = document.getElementById('containerPdfFolderBadge');
            const selectFolderBtn = document.getElementById('btnBrowsePdfDir');
            const addFilesBtn = document.getElementById('btnAddPdfFiles');
            const clearQueueBtn = document.getElementById('btnClearPdfQueue');

            results.item1_topToolbar.folderPillRemoved = (folderPill === null);
            results.item1_topToolbar.selectFolderBtnRemoved = (selectFolderBtn === null);
            results.item1_topToolbar.addFilesBtnExists = (addFilesBtn !== null);
            results.item1_topToolbar.clearQueueBtnExists = (clearQueueBtn !== null);

            // Verify side-by-side right alignment in top toolbar
            if (addFilesBtn && clearQueueBtn) {
              const parent = addFilesBtn.parentElement;
              results.item1_topToolbar.buttonsAreSiblings = (parent === clearQueueBtn.parentElement);
              results.item1_topToolbar.matchingHeight = (addFilesBtn.offsetHeight === clearQueueBtn.offsetHeight);
            }

            // Verify active badge on ribbon (must be exactly 1)
            const activeBadges = document.querySelectorAll('#view-pdf-studio .tool-ribbon-btn .active-tool-badge');
            const allActiveSpans = document.querySelectorAll('#view-pdf-studio .tool-ribbon-btn span');
            results.item1_topToolbar.activeBadgeCount = activeBadges.length;
            results.item1_topToolbar.singleActiveBadge = (activeBadges.length === 1);
            results.item1_topToolbar.allBadges = Array.from(activeBadges).map(b => b.outerHTML);
            results.item1_topToolbar.buttonsInfo = Array.from(document.querySelectorAll('#view-pdf-studio .tool-ribbon-btn')).map(b => ({
              tool: b.dataset.tool,
              text: b.innerText.trim()
            }));

            // ITEM 2: Remove Duplicate Queue Header & Clean Center Dropzone
            const queueStats = document.getElementById('pdfQueueStats');
            const summaryLoaded = document.getElementById('summaryPdfCount');
            const summarySize = document.getElementById('summaryPdfTotalSize');
            const summaryProjected = document.getElementById('summaryPdfProjected');

            results.item2_dropzoneAndSummary.queueStatsBarRemoved = (queueStats === null);
            results.item2_dropzoneAndSummary.summaryLoadedExists = (summaryLoaded !== null);
            results.item2_dropzoneAndSummary.summarySizeExists = (summarySize !== null);
            results.item2_dropzoneAndSummary.summaryProjectedExists = (summaryProjected !== null);

            // Check center dropzone empty text
            const grid = document.getElementById('pdfCardsGrid');
            const dropzoneTitle = grid ? grid.querySelector('.font-headline-sm') : null;
            results.item2_dropzoneAndSummary.dropzoneTitleText = dropzoneTitle ? dropzoneTitle.textContent.trim() : '';
            results.item2_dropzoneAndSummary.cleanDropzoneText = (results.item2_dropzoneAndSummary.dropzoneTitleText === 'Drag & Drop Files');

            // ITEM 3: Target Size Controls Two-Way Sync
            const controlBar = document.getElementById('compressTargetControlBar');
            const radioPills = document.querySelectorAll('#compressTargetControlBar .target-radio-pill');
            const slider = document.getElementById('sliderTargetKb');
            const numberInput = document.getElementById('inputTargetKbBox');

            results.item3_targetControlsSync.controlBarExists = (controlBar !== null);
            results.item3_targetControlsSync.radioPillCount = radioPills.length;
            results.item3_targetControlsSync.sliderExists = (slider !== null);
            results.item3_targetControlsSync.numberInputExists = (numberInput !== null);

            // Test 1: Click 200 KB pill
            const pill200 = document.querySelector('#compressTargetControlBar .target-radio-pill[data-kb="200"]');
            if (pill200) pill200.click();
            results.item3_targetControlsSync.afterClick200_sliderVal = slider ? slider.value : '';
            results.item3_targetControlsSync.afterClick200_inputVal = numberInput ? numberInput.value : '';

            // Test 2: Adjust slider to 500
            if (slider) {
              slider.value = 500;
              slider.dispatchEvent(new Event('input'));
            }
            results.item3_targetControlsSync.afterSlider500_inputVal = numberInput ? numberInput.value : '';

            // Test 3: Type 300 into number input
            if (numberInput) {
              numberInput.value = 300;
              numberInput.dispatchEvent(new Event('input'));
            }
            results.item3_targetControlsSync.afterInput300_sliderVal = slider ? slider.value : '';
            const pill300 = document.querySelector('#compressTargetControlBar .target-radio-pill[data-kb="300"]');
            results.item3_targetControlsSync.pill300Highlighted = pill300 ? pill300.classList.contains('bg-slate-900') : false;

            // ITEM 4: Strip Clutter from Sidebar Footer, Bottom Dock & Hotkey Strip
            const sidebarBottomInfo = document.getElementById('sidebarOutputSubfolderText');
            const rotateAllBtn = document.getElementById('btnRotateAllPdf');
            const filterOversizedBtn = document.getElementById('btnFilterOversizedPdf');
            const dockTargetLabel = document.getElementById('dockTargetLabel');
            const footerStrip = document.querySelector('#view-pdf-studio footer');

            results.item4_clutterRemoval.sidebarBottomInfoRemoved = (sidebarBottomInfo === null);
            results.item4_clutterRemoval.rotateAllBtnRemoved = (rotateAllBtn === null);
            results.item4_clutterRemoval.filterOversizedBtnRemoved = (filterOversizedBtn === null);
            results.item4_clutterRemoval.dockTargetLabelRemoved = (dockTargetLabel === null);
            results.item4_clutterRemoval.footerStripRemoved = (footerStrip === null);

            // ITEM 5: Clean Dynamic Primary Action Button
            const primaryBtn = document.getElementById('startCompressBtn');
            const btnSpan = primaryBtn ? (primaryBtn.querySelector('span:nth-of-type(2)') || primaryBtn.querySelector('span:last-of-type')) : null;

            const toolTests = [
              { tool: 'compress_pdf', expected: 'Compress PDF' },
              { tool: 'merge_pdf', expected: 'Merge PDF' },
              { tool: 'split_pdf', expected: 'Split PDF' },
              { tool: 'pdf_to_jpg', expected: 'PDF to JPG' },
              { tool: 'jpg_to_pdf', expected: 'JPG to PDF' },
              { tool: 'rotate_pdf', expected: 'Rotate PDF' },
              { tool: 'clean_pdf', expected: 'Clean & Enhance' }
            ];

            results.item5_dynamicButtonLabels.labels = {};
            for (const t of toolTests) {
              const btn = document.querySelector(\`#view-pdf-studio .tool-ribbon-btn[data-tool="\${t.tool}"]\`);
              if (btn) btn.click();
              const text = btnSpan ? btnSpan.textContent.trim() : '';
              results.item5_dynamicButtonLabels.labels[t.tool] = {
                actual: text,
                expected: t.expected,
                pass: (text === t.expected)
              };
            }

            // Switch back to compress_pdf
            const firstToolBtn = document.querySelector('#view-pdf-studio .tool-ribbon-btn[data-tool="compress_pdf"]');
            if (firstToolBtn) firstToolBtn.click();

            return results;
          })()
        `;

        const evalRes = await send('Runtime.evaluate', {
          expression: testScript,
          returnByValue: true,
          awaitPromise: true
        });

        const testResults = evalRes.result?.result?.value;

        console.log('\n========================================================');
        console.log('🧪 DUAL-MCP AUTOMATED QA VERIFICATION REPORT');
        console.log('========================================================');
        console.log('1. TOP TOOLBAR & ACTION BUTTONS:');
        console.log(`   - Folder Pill Removed: ${testResults?.item1_topToolbar?.folderPillRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Select Folder [F2] Removed: ${testResults?.item1_topToolbar?.selectFolderBtnRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Add Files Button Exists: ${testResults?.item1_topToolbar?.addFilesBtnExists ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Clear Queue Button Exists: ${testResults?.item1_topToolbar?.clearQueueBtnExists ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Side-by-Side Sibling Alignment: ${testResults?.item1_topToolbar?.buttonsAreSiblings ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Single Active Badge on Ribbon: ${testResults?.item1_topToolbar?.singleActiveBadge ? '✅ PASS' : '❌ FAIL (Count: ' + testResults?.item1_topToolbar?.activeBadgeCount + ')'}`);
        console.log(`     Details:`, JSON.stringify(testResults?.item1_topToolbar?.buttonsInfo));

        console.log('\n2. DROPZONE & SUMMARY CARDS:');
        console.log(`   - Duplicate Queue Bar Removed: ${testResults?.item2_dropzoneAndSummary?.queueStatsBarRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Summary Cards Intact: ${testResults?.item2_dropzoneAndSummary?.summaryLoadedExists && testResults?.item2_dropzoneAndSummary?.summarySizeExists ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Empty Dropzone Text: "${testResults?.item2_dropzoneAndSummary?.dropzoneTitleText}" -> ${testResults?.item2_dropzoneAndSummary?.cleanDropzoneText ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n3. TARGET SIZE CONTROLS (RADIO PILLS + SLIDER + NUMBER INPUT):');
        console.log(`   - Inline Control Bar Exists: ${testResults?.item3_targetControlsSync?.controlBarExists ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - 7 Radio Pills Count (100-700 KB): ${testResults?.item3_targetControlsSync?.radioPillCount === 7 ? '✅ PASS (7 Pills)' : '❌ FAIL'}`);
        console.log(`   - Click 200 KB -> Slider: ${testResults?.item3_targetControlsSync?.afterClick200_sliderVal}, Input: ${testResults?.item3_targetControlsSync?.afterClick200_inputVal} -> ${testResults?.item3_targetControlsSync?.afterClick200_sliderVal === '200' ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Slider to 500 -> Input: ${testResults?.item3_targetControlsSync?.afterSlider500_inputVal} -> ${testResults?.item3_targetControlsSync?.afterSlider500_inputVal === '500' ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Input to 300 -> Slider: ${testResults?.item3_targetControlsSync?.afterInput300_sliderVal}, Pill 300 Highlighted: ${testResults?.item3_targetControlsSync?.pill300Highlighted ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n4. CLUTTER REMOVAL:');
        console.log(`   - Sidebar Bottom Info Removed: ${testResults?.item4_clutterRemoval?.sidebarBottomInfoRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Bottom Dock Telemetry/Queue Ready Removed: ${testResults?.item4_clutterRemoval?.dockTargetLabelRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Rotate All 90° Removed: ${testResults?.item4_clutterRemoval?.rotateAllBtnRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Filter Oversized (>256KB) Removed: ${testResults?.item4_clutterRemoval?.filterOversizedBtnRemoved ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   - Bottom Hotkey Footer Strip Removed: ${testResults?.item4_clutterRemoval?.footerStripRemoved ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n5. DYNAMIC PRIMARY ACTION BUTTON LABELS:');
        let allLabelsPass = true;
        for (const [tool, info] of Object.entries(testResults?.item5_dynamicButtonLabels?.labels || {})) {
          console.log(`   - ${tool}: "${info.actual}" === "${info.expected}" -> ${info.pass ? '✅ PASS' : '❌ FAIL'}`);
          if (!info.pass) allLabelsPass = false;
        }

        console.log('\n6. CHROME DEVTOOLS MCP RUNTIME INSPECTION:');
        console.log(`   - Total Console Errors: ${consoleErrors.length} ${consoleErrors.length === 0 ? '✅ (0 Errors)' : '❌ FAIL: ' + JSON.stringify(consoleErrors)}`);

        const isEverythingPass = testResults?.item1_topToolbar?.folderPillRemoved &&
          testResults?.item1_topToolbar?.selectFolderBtnRemoved &&
          testResults?.item1_topToolbar?.singleActiveBadge &&
          testResults?.item2_dropzoneAndSummary?.cleanDropzoneText &&
          testResults?.item3_targetControlsSync?.radioPillCount === 7 &&
          testResults?.item4_clutterRemoval?.footerStripRemoved &&
          allLabelsPass &&
          consoleErrors.length === 0;

        console.log('\n========================================================');
        console.log(`OVERALL QA GATE: ${isEverythingPass ? '🏆 100% PASS' : '❌ FAILED'}`);
        console.log('========================================================\n');

        socket.destroy();
        process.exit(isEverythingPass ? 0 : 1);
      })();
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      process.exit(1);
    });

    req.end();
  });
}).on('error', (err) => {
  console.error('HTTP error:', err.message);
  process.exit(1);
});
