/* ==========================================================================
   Student Document Renamer — Report & Export Engine (Excel & A4 Landscape PDF)
   (Client-side, Offline, UTF-8 BOM CSV, and Print-Optimized A4 Landscape)
   ========================================================================== */

/**
 * Trigger immediate download of a CSV file in browser with UTF-8 BOM
 * @param {string} filename
 * @param {string} csvContent
 */
export function downloadCSV(filename, csvContent) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a string for safe CSV output
 */
export function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate CSV for Batch Student Audit Matrix
 * @param {Array<Object>} batchResults - Array of evaluated student records
 * @param {Array<Object>} rules - Checklist rules
 * @param {string} checklistName - Name of checklist
 * @returns {string} CSV text
 */
export function generateBatchAuditCSV(batchResults, rules, checklistName = 'Checklist') {
  const headers = [
    'Sr No',
    'Student Name',
    'Folder Name',
    ...rules.map(r => r.name),
    'Verified Count',
    'Missing Count',
    'Total Rules',
    'Completion %',
    'Readiness Status',
    'Missing Documents'
  ];

  const rows = [headers.map(escapeCSV).join(',')];

  batchResults.forEach((item, idx) => {
    const evMap = {};
    (item.summary.evaluations || []).forEach(ev => {
      let statusStr = 'MISSING';
      if (ev.status === 'green') {
        statusStr = ev.isLinked ? 'LINKED' : 'VERIFIED';
      }
      evMap[ev.rule.name] = statusStr;
    });

    const ruleStatuses = rules.map(r => evMap[r.name] || 'MISSING');

    const row = [
      idx + 1,
      item.studentName || item.folderName,
      item.folderName,
      ...ruleStatuses,
      item.summary.foundCount,
      item.summary.missingCount,
      item.summary.totalRequired,
      `${item.summary.percentComplete}%`,
      item.summary.isReady ? 'READY FOR SUBMISSION' : 'ACTION NEEDED',
      (item.summary.missingList || []).join('; ')
    ];

    rows.push(row.map(escapeCSV).join(','));
  });

  return rows.join('\r\n');
}

/**
 * Generate CSV for Follow-up Desk (Promised Submissions List for CR / Teacher)
 * @param {Array<Object>} followUpList
 * @returns {string} CSV text
 */
export function generateFollowUpCSV(followUpList) {
  const headers = [
    'Sr No',
    'Student Name',
    'Folder Name',
    'Missing Document',
    'Promised Due Date',
    'Urgency Status',
    'Clerk Note / Phone',
    'Current Status'
  ];

  const rows = [headers.map(escapeCSV).join(',')];

  followUpList.forEach((item, idx) => {
    const row = [
      idx + 1,
      item.studentName || item.folderName,
      item.folderName,
      item.documentName,
      item.promisedDate,
      item.status === 'resolved' ? 'RESOLVED' : (item.urgency || 'PENDING'),
      item.note || '',
      item.status === 'resolved' ? 'RECEIVED' : 'PENDING'
    ];

    rows.push(row.map(escapeCSV).join(','));
  });

  return rows.join('\r\n');
}

/**
 * Open Print-Ready A4 Landscape PDF Report in a clean popup window
 * @param {Object} data - { title, subtitle, batchName, checklistName, rules, results, stats }
 */
export function openLandscapePrintReport({ title, subtitle, batchName, checklistName, rules, results, stats }) {
  const win = window.open('', '_blank', 'width=1200,height=800,menubar=no,toolbar=no');
  if (!win) {
    if (typeof window.showToast === 'function') window.showToast('Please allow popups to open the A4 Landscape Print / PDF Report.', 'warning');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const ruleHeadersHtml = rules.map(r => `<th>${r.short || r.name.slice(0, 14)}</th>`).join('');

  const rowsHtml = results.map((item, idx) => {
    const evMap = {};
    (item.summary.evaluations || []).forEach(ev => {
      evMap[ev.rule.name] = ev;
    });

    const cellsHtml = rules.map(r => {
      const ev = evMap[r.name];
      if (ev && ev.status === 'green') {
        if (ev.isLinked) {
          return '<td class="cellLinked" title="' + (ev.note || '') + '">🔗</td>';
        }
        return '<td class="cellOk">✔</td>';
      }
      return '<td class="cellMissing">✖</td>';
    }).join('');

    const statusBadge = item.summary.isReady
      ? '<span class="badgeReady">READY</span>'
      : '<span class="badgePending">' + item.summary.missingCount + ' PENDING</span>';

    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #64748b;">${String(idx + 1).padStart(2, '0')}</td>
        <td style="font-weight: 700; color: #0f172a;">${item.studentName || item.folderName}</td>
        ${cellsHtml}
        <td style="text-align: center; font-weight: bold;">${item.summary.foundCount}/${item.summary.totalRequired}</td>
        <td style="text-align: center; font-weight: bold;">${item.summary.percentComplete}%</td>
        <td style="text-align: center;">${statusBadge}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — ${batchName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 14px;
      font-size: 10px;
      background: #ffffff;
    }
    .noPrintBar {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .printBtn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    .printBtn:hover { background: #1d4ed8; }
    .reportHeader {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .reportTitle {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .reportSub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .kpiGrid {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
    }
    .kpiBox {
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 5px 12px;
      background: #f8fafc;
    }
    .kpiVal {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      font-family: Consolas, monospace;
    }
    .kpiLbl {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      text-align: center;
      padding: 6px 5px;
      font-weight: 700;
      border: 1px solid #0f172a;
      white-space: nowrap;
    }
    th:nth-child(2) { text-align: left; }
    td {
      padding: 4px 5px;
      border: 1px solid #cbd5e1;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .cellOk { color: #047857; font-weight: 900; text-align: center; }
    .cellLinked { color: #6d28d9; font-weight: 900; text-align: center; }
    .cellMissing { color: #b91c1c; font-weight: 900; text-align: center; }
    .badgeReady {
      background: #d1fae5;
      color: #047857;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
    }
    .badgePending {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
    }
    .legendBar {
      margin-top: 10px;
      display: flex;
      gap: 16px;
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
    }
    .sigBlock {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      .noPrintBar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="noPrintBar">
    <div>
      <strong style="color: #1e40af; font-size: 14px;">🖨️ A4 Landscape PDF Print Preview</strong>
      <div style="color: #475569; font-size: 12px; margin-top: 2px;">In the print dialog, select destination <b>'Save as PDF'</b> with Layout <b>'Landscape'</b>.</div>
    </div>
    <button class="printBtn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="reportHeader">
    <div>
      <h1 class="reportTitle">${title}</h1>
      <div class="reportSub">Batch: <b>${batchName}</b> &nbsp;|&nbsp; Checklist: <b>${checklistName}</b> &nbsp;|&nbsp; Generated on: ${generatedDate}</div>
    </div>
    <div style="text-align: right;">
      <span style="background: #0f172a; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 10px;">OFFICIAL CLERK AUDIT REPORT</span>
    </div>
  </div>

  <div class="kpiGrid">
    <div class="kpiBox"><div class="kpiVal">${stats.totalStudents}</div><div class="kpiLbl">Total Students</div></div>
    <div class="kpiBox" style="border-left: 3px solid #10b981;"><div class="kpiVal textGreen">${stats.readyCount}</div><div class="kpiLbl">100% Ready</div></div>
    <div class="kpiBox" style="border-left: 3px solid #ef4444;"><div class="kpiVal textRed">${stats.pendingCount}</div><div class="kpiLbl">Pending Docs</div></div>
    <div class="kpiBox" style="border-left: 3px solid #3b82f6;"><div class="kpiVal textPrimary">${stats.compliancePercent}%</div><div class="kpiLbl">Overall Compliance</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28px;">#</th>
        <th>Student Folder Name</th>
        ${ruleHeadersHtml}
        <th style="width: 55px;">Verified</th>
        <th style="width: 45px;">%</th>
        <th style="width: 75px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="legendBar">
    <span><b>Legend:</b></span>
    <span style="color: #047857;">✔ = Verified File Present</span>
    <span style="color: #6d28d9;">🔗 = Fulfilled by Combined / Alias Document</span>
    <span style="color: #b91c1c;">✖ = Document Missing</span>
  </div>

  <div class="sigBlock">
    <div>Verified By Clerk: ____________________________</div>
    <div>Class Teacher: ____________________________</div>
    <div>Head of Department / Principal: ____________________________</div>
  </div>
</body>
</html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

/**
 * Open Print-Ready Follow-up Action Sheet for Class Representative (CR) / Teacher
 * @param {Array<Object>} followUpList
 * @param {string} filterLabel
 */
export function openFollowUpPrintSheet(followUpList, filterLabel = 'Due Today & Overdue Submissions') {
  const win = window.open('', '_blank', 'width=1000,height=750,menubar=no,toolbar=no');
  if (!win) {
    if (typeof window.showToast === 'function') window.showToast('Please allow popups to open the Follow-up Action Sheet.', 'warning');
    return;
  }

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const rowsHtml = followUpList.map((item, idx) => {
    return `
      <tr>
        <td style="text-align: center; font-weight: bold; color: #64748b;">${String(idx + 1).padStart(2, '0')}</td>
        <td style="font-weight: 700; color: #0f172a;">${item.studentName || item.folderName}</td>
        <td style="font-weight: 700; color: #4338ca;">${item.documentName}</td>
        <td style="text-align: center; font-weight: bold;">${item.promisedDate}</td>
        <td style="color: #475569;">${item.note || '—'}</td>
        <td style="text-align: center;"><input type="checkbox" style="transform: scale(1.3);"></td>
        <td style="width: 140px;"></td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student Document Follow-up Action Sheet — ${generatedDate}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 14px;
      font-size: 10px;
      background: #ffffff;
    }
    .noPrintBar {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .printBtn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    .reportHeader {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .reportTitle {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0;
    }
    .reportSub { font-size: 11px; color: #64748b; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-weight: 700;
      border: 1px solid #0f172a;
    }
    td { padding: 5px 8px; border: 1px solid #cbd5e1; }
    tr:nth-child(even) { background: #f8fafc; }
    .sigBlock {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
    }
    @media print {
      .noPrintBar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="noPrintBar">
    <div>
      <strong style="color: #1e40af; font-size: 14px;">🖨️ Document Collection Sheet (For CR / Class Teacher)</strong>
      <div style="color: #475569; font-size: 12px; margin-top: 2px;">Hand this printed sheet to the Class Representative to collect promised documents today.</div>
    </div>
    <button class="printBtn" onclick="window.print()">🖨️ Print Sheet</button>
  </div>

  <div class="reportHeader">
    <div>
      <h1 class="reportTitle">STUDENT DOCUMENT COLLECTION & FOLLOW-UP ACTION SHEET</h1>
      <div class="reportSub">Scope: <b>${filterLabel}</b> &nbsp;|&nbsp; Date: <b>${generatedDate}</b> &nbsp;|&nbsp; Total Pending: <b>${followUpList.length} Students</b></div>
    </div>
    <div style="text-align: right;">
      <span style="background: #b45309; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 10px;">ACTION MANDATE</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 28px; text-align: center;">#</th>
        <th>Student Name / Folder</th>
        <th>Missing Document Required</th>
        <th style="width: 100px; text-align: center;">Promised Date</th>
        <th>Note / Mobile</th>
        <th style="width: 60px; text-align: center;">Received</th>
        <th style="width: 140px;">Student Signature</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sigBlock">
    <div>Handed over to Class Representative / Teacher: ____________________________</div>
    <div>Target Collection Time: __________________</div>
    <div>Clerk Signature: ____________________________</div>
  </div>
</body>
</html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
