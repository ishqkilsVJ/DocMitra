/**
 * DocMitra UI Placeholder Action Wire-up
 * Hooks all functional buttons (Rename, Folder Select, Merge, Print, Save, etc.)
 * into non-blocking Toast notifications ("Ready to connect").
 * STRICT RULE: No business logic, safe DOM methods only.
 */

import { toast } from './toast.js';

export function wirePlaceholderActions() {
  // Common action buttons with specific IDs or selectors (Renamer and PDF Studio buttons are wired with active logic)
  const actionSelectors = [
    // Image Studio (wired in Milestone 4)
    '#startImageProcessBtn',
    '#btnAutoCropPassport',
    '#btnClearImageQueue',
    '#btnFilterOversized',
    // Print Studio (wired in Milestone 5)
    '#btnPrintDocuments',
    '#btnCancelPrint',
    '#btnPrinterSelect',
    // Follow-up Desk (wired in Milestone 5)
    '#btnSendWhatsApp',
    '#btnCopyMarathiNotice',
    '#btnSendBatchSms',
    '#btnExportFollowup',
    // Generic placeholder triggers
    '[data-action="placeholder"]'
  ];

  actionSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Prevent navigation if it's an anchor
        if (btn.tagName === 'A' && btn.getAttribute('href') === '#') {
          e.preventDefault();
        }
        const actionLabel = btn.getAttribute('data-action-label') || 
                            btn.getAttribute('title') || 
                            btn.innerText.trim().split('\n')[0] || 
                            'Action';
        toast.show(actionLabel, 'Ready to connect', 'info');
      });
    });
  });

  // Wire interactive sidebar tool items in PDF and Image studios
  document.querySelectorAll('.tool-ribbon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const toolName = btn.querySelector('.font-label-md')?.textContent?.trim() || 'Tool Selected';
      toast.show(toolName, 'Ready to connect', 'info');
    });
  });

  // Wire Print Studio Page and Zoom Controls
  const zoomDisplay = document.getElementById('zoomDisplay');
  const pageDisplay = document.getElementById('pageDisplay');
  let zoomLevel = 100;
  let currentPage = 1;
  const totalPages = 11;

  const btnZoomIn = document.getElementById('btnZoomIn');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (zoomLevel < 200) {
        zoomLevel += 10;
        if (zoomDisplay) zoomDisplay.textContent = `${zoomLevel}%`;
        const previewStage = document.getElementById('printPreviewStage');
        if (previewStage) previewStage.style.transform = `scale(${zoomLevel / 100})`;
      }
    });
  }

  const btnZoomOut = document.getElementById('btnZoomOut');
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (zoomLevel > 50) {
        zoomLevel -= 10;
        if (zoomDisplay) zoomDisplay.textContent = `${zoomLevel}%`;
        const previewStage = document.getElementById('printPreviewStage');
        if (previewStage) previewStage.style.transform = `scale(${zoomLevel / 100})`;
      }
    });
  }

  const btnZoomReset = document.getElementById('btnZoomReset');
  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', () => {
      zoomLevel = 100;
      if (zoomDisplay) zoomDisplay.textContent = '100%';
      const previewStage = document.getElementById('printPreviewStage');
      if (previewStage) previewStage.style.transform = 'scale(1)';
    });
  }

  const btnPrevPage = document.getElementById('btnPrevPage');
  if (btnPrevPage) {
    btnPrevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        if (pageDisplay) pageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
      }
    });
  }

  const btnNextPage = document.getElementById('btnNextPage');
  if (btnNextPage) {
    btnNextPage.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        if (pageDisplay) pageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
      }
    });
  }

  // Follow-up Ledger Select All Checkbox
  const selectAll = document.getElementById('selectAllCheckbox');
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const rowChecks = document.querySelectorAll('.student-checkbox');
      rowChecks.forEach(cb => {
        cb.checked = selectAll.checked;
      });
      toast.show(
        selectAll.checked ? 'Selected All Candidates' : 'Deselected Candidates',
        'Ready to connect batch dispatcher',
        'info'
      );
    });
  }

  // Pan scroller grab interaction for document inspection viewports
  document.querySelectorAll('.pan-grab-active').forEach(slider => {
    let isDown = false;
    let startY;
    let scrollTop;

    slider.addEventListener('mousedown', (e) => {
      if (e.target.closest('input, button, select, a, textarea')) return;
      isDown = true;
      slider.classList.add('is-dragging');
      startY = e.pageY - slider.offsetTop;
      scrollTop = slider.scrollTop;
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.classList.remove('is-dragging');
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.classList.remove('is-dragging');
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - slider.offsetTop;
      const walk = (y - startY) * 1.5;
      slider.scrollTop = scrollTop - walk;
    });
  });
}
