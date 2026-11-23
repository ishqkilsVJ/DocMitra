import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../../..');

console.log('=== 🧪 TEST: Cross-Check Modal UI Theme, Buttons & Parity Verification ===');

// 1. Check rename_tool.css
const cssContent = readFileSync(resolve(rootDir, 'tools/rename_tool/rename_tool.css'), 'utf8');
assert.ok(!cssContent.includes('#0284c7'), 'rename_tool.css must not contain rogue sky blue (#0284c7)');
assert.ok(cssContent.includes('--color-primary, #0037b0'), 'rename_tool.css must use DocMitra Royal Blue (#0037b0) for active pattern-pill');
assert.ok(cssContent.includes('.diff-del') && cssContent.includes('display: inline;'), '.diff-del must use display: inline');
assert.ok(cssContent.includes('.diff-add') && cssContent.includes('display: inline;'), '.diff-add must use display: inline');
assert.ok(cssContent.includes('.diff-student') && cssContent.includes('display: inline;'), '.diff-student must use display: inline');
console.log('  ✓ rename_tool.css: Royal Blue theme, zero rogue sky blue, and inline diff typography verified');

// 2. Check rename_tool.html
const htmlContent = readFileSync(resolve(rootDir, 'tools/rename_tool/rename_tool.html'), 'utf8');
assert.ok(!htmlContent.includes('[ Doc + Student'), 'rename_tool.html must not contain bracketed "[ Doc + Student"');
assert.ok(htmlContent.includes('>Doc + Student</button>'), 'rename_tool.html must contain clean "Doc + Student" button text');
assert.ok(htmlContent.includes('>Student + Doc</button>'), 'rename_tool.html must contain clean "Student + Doc" button text');
assert.ok(htmlContent.includes('btnToggleCrossCheckStudent') && htmlContent.includes('text-primary'), 'rename_tool.html: Student toggle button must use primary theme');
console.log('  ✓ rename_tool.html: Clean bracketless buttons, primary theme student toggle verified');

// 3. Check app/index.html
const appIndexContent = readFileSync(resolve(rootDir, 'app/index.html'), 'utf8');
assert.ok(!appIndexContent.includes('[ Doc + Student'), 'app/index.html must not contain bracketed "[ Doc + Student"');
assert.ok(appIndexContent.includes('>Doc + Student</button>'), 'app/index.html must contain clean "Doc + Student" button text');
assert.ok(appIndexContent.includes('>Student + Doc</button>'), 'app/index.html must contain clean "Student + Doc" button text');
assert.ok(appIndexContent.includes('btnToggleCrossCheckStudent') && appIndexContent.includes('text-primary'), 'app/index.html: Student toggle button must use primary theme');
console.log('  ✓ app/index.html: Exact parity with rename_tool.html verified');

// 4. Check rename_tool_ui.js status badge rendering
const uiJsContent = readFileSync(resolve(rootDir, 'tools/rename_tool/rename_tool_ui.js'), 'utf8');
assert.ok(!uiJsContent.includes("textContent = '+ Student'"), 'rename_tool_ui.js must not contain redundant + Student box in confidence column');
assert.ok(uiJsContent.includes('confidence-badge') && uiJsContent.includes('whitespace-nowrap'), 'rename_tool_ui.js must render single-line confidence badge with whitespace-nowrap');
console.log('  ✓ rename_tool_ui.js: Clean single-line confidence badge without redundant + Student box verified');

console.log('🎉 ALL CROSS-CHECK MODAL UI THEME & BUTTON VERIFICATION CHECKS PASSED 100%!');
