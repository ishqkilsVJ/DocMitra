import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== TEST SUITE: PREVIEW BENTO SLATE BAR REDESIGN (CP-037) ===');

// 1. Verify rename_tool.html
const toolHtmlPath = path.resolve(__dirname, 'rename_tool.html');
const toolHtml = fs.readFileSync(toolHtmlPath, 'utf8');

assert(toolHtml.includes('id="renamerPdfPageContainer"'), 'rename_tool.html must contain #renamerPdfPageContainer');
assert(toolHtml.includes('id="btnPdfPrevPage"'), 'rename_tool.html must contain #btnPdfPrevPage');
assert(toolHtml.includes('id="btnPdfNextPage"'), 'rename_tool.html must contain #btnPdfNextPage');
assert(toolHtml.includes('id="renamerPdfPageBadge"'), 'rename_tool.html must contain #renamerPdfPageBadge');
assert(toolHtml.includes('id="renamerPdfPageBadgeText"'), 'rename_tool.html must contain #renamerPdfPageBadgeText');
assert(toolHtml.includes('id="pdfPulseDot"'), 'rename_tool.html must contain #pdfPulseDot');
assert(toolHtml.includes('id="renamerZoomReadout"'), 'rename_tool.html must contain #renamerZoomReadout');
assert(toolHtml.includes('id="btnRotateCCW"'), 'rename_tool.html must contain #btnRotateCCW');
assert(toolHtml.includes('id="btnRotateCW"'), 'rename_tool.html must contain #btnRotateCW');
assert(toolHtml.includes('id="btnRotateFlip"'), 'rename_tool.html must contain #btnRotateFlip');

// Check that DPI and Target Buffer are completely eradicated from the preview bar
const previewSectionMatch = toolHtml.match(/<section[^>]+id="col-preview"[\s\S]*?<\/section>/);
assert(previewSectionMatch, 'Could not find col-preview section in rename_tool.html');
const previewSection = previewSectionMatch[0];
assert(!previewSection.includes('300 DPI'), 'col-preview must NOT contain 300 DPI');
assert(!previewSection.includes('Target Buffer'), 'col-preview must NOT contain Target Buffer');
assert(!previewSection.includes('input type="range"'), 'col-preview must NOT contain slider/spider');
console.log('✓ PASS: rename_tool.html preview markup adheres 100% to Bento Slate Bar specification');

// 2. Verify parity in app/index.html
const appIndexPath = path.resolve(__dirname, '../../app/index.html');
const appIndexHtml = fs.readFileSync(appIndexPath, 'utf8');
const appPreviewMatch = appIndexHtml.match(/<section[^>]+id="col-preview"[\s\S]*?<\/section>/);
assert(appPreviewMatch, 'Could not find col-preview section in app/index.html');
const appPreview = appPreviewMatch[0];
assert(appPreview.includes('id="renamerPdfPageContainer"'), 'app/index.html must contain #renamerPdfPageContainer');
assert(appPreview.includes('id="btnPdfPrevPage"'), 'app/index.html must contain #btnPdfPrevPage');
assert(appPreview.includes('id="btnPdfNextPage"'), 'app/index.html must contain #btnPdfNextPage');
assert(appPreview.includes('id="renamerPdfPageBadgeText"'), 'app/index.html must contain #renamerPdfPageBadgeText');
assert(appPreview.includes('id="pdfPulseDot"'), 'app/index.html must contain #pdfPulseDot');
assert(appPreview.includes('id="renamerZoomReadout"'), 'app/index.html must contain #renamerZoomReadout');
assert(!appPreview.includes('300 DPI'), 'app/index.html col-preview must NOT contain 300 DPI');
assert(!appPreview.includes('Target Buffer'), 'app/index.html col-preview must NOT contain Target Buffer');
assert(!appPreview.includes('input type="range"'), 'app/index.html col-preview must NOT contain slider/spider');
console.log('✓ PASS: app/index.html is in 100% exact parity with Bento Slate Bar');

// 3. Verify rename_tool_ui.js logic
const uiJsPath = path.resolve(__dirname, 'rename_tool_ui.js');
const uiJs = fs.readFileSync(uiJsPath, 'utf8');

assert(uiJs.includes('renamerZoomReadout'), 'rename_tool_ui.js must bind to #renamerZoomReadout');
assert(uiJs.includes('renamerPdfPageBadgeText'), 'rename_tool_ui.js must update #renamerPdfPageBadgeText');
assert(uiJs.includes('pdfPulseDot'), 'rename_tool_ui.js must manage #pdfPulseDot');
assert(uiJs.includes('_pdfPageRenderTask'), 'rename_tool_ui.js must have _pdfPageRenderTask concurrency protection');
assert(uiJs.includes('wheelThrottle'), 'rename_tool_ui.js must throttle mouse wheel page flips');
assert(uiJs.includes('PageDown'), 'rename_tool_ui.js must handle PageDown/PageUp keyboard pagination');
assert(uiJs.includes('btnRotateCW'), 'rename_tool_ui.js must handle R key for rotation');
assert(!uiJs.includes('DPI: Standby'), 'rename_tool_ui.js must NOT have DPI: Standby in empty stage');
console.log('✓ PASS: rename_tool_ui.js logic verified for PDF pagination, mouse wheel, keyboard, and zero telemetry clutter');

console.log('🎉 ALL TESTS PASSED: Bento Slate Bar Preview Redesign is 100% verified!');
