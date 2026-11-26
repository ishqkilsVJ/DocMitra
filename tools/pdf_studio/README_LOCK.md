# 🔒 LOCKED TOOL: PDF Studio (`tools/pdf_studio/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & SEALED (CP-045: Stitch Sample 4 Compress PDF Upgrade Complete)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for PDF Studio.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`).
- **Style Isolation:** All styles in `pdf_studio.css` are strictly scoped under the `.pdf-studio-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `pdf_studio.py` | Python Backend | Disk-level PDF operations: Compression (<256 KB MahaDBT), Multi-Document Merge, Page Extraction / Splitting, Lossless Rotation, PDF to Image, and Image to PDF compilation (`pypdf` + `PIL`) |
| `pdf_studio.html` | UI Component | Scoped Bento workstation markup with Dark Slate Folder Pill, Bento summary cards, PDF tool ribbon, queue grid, Bento preview modal, and execution dock (0 dummy data, 0 Marathi characters) |
| `pdf_studio.css` | Scoped Stylesheet | Strict `.pdf-studio-scope` styling rules (scrollbars, tool ribbon transitions, docket cards, dropzone states, drag-to-reorder, and Bento preview viewport) |
| `pdf_studio_ui.js` | UI Manager | Zero-Port Native IPC UI manager: tool switcher, native directory picker, direct disk subfolder writer, PDF.js thumbnail & modal preview, custom Bento dropdowns, hotkey listener, and batch execution |
| `pdf_studio_logic.js`| Business Logic | Pure client-side ISO-32000 A4 PDF compilation, watermark-filtered image extraction, vector PDF.js canvas fallback engine, selective page range parser, size-suffixing, and subfolder routing |
| `PDF_TOOL_AGENT.md`  | Dedicated Rulebook | Mandatory governance for PDF Studio agent: Unlock->Work->Re-Lock, /grill-me, zero-leakage, dual-MCP verification, zero-port native IPC bridge |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features
- [x] **Zero-Port Native IPC Bridge:** Direct disk file read (`invoke('read_binary_file')`) and direct disk subfolder write (`invoke('write_binary_file')`) with 0 localhost:3000 dependency.
- [x] **Direct Source Subfolder Routing (Zero-Overwrite):** Saves directly into `<source>/<Subfolder>/` (`Compressed_PDF`, `Merged_PDF`, `Split_PDF`, `Converted_JPG`, `Converted_PDF`, `Rotated_PDF`, `Enhanced_PDF`) with automatic collision numbering and Windows `:Zone.Identifier` auto-unlocking.
- [x] **Dark Slate Folder Pill & Bento Summary Cards:** High-contrast folder pill with amber icon + real-time metrics cards (`LOADED FILES`, `CURRENT SIZE`, `PROJECTED OUTPUT`, `NATIVE ENGINE`).
- [x] **Interactive Bento Preview Viewport (Modal):** High-DPI canvas preview with Zoom (`In / Out / Fit / Reset`), Multi-Page Navigation (`Prev / Next`), and 3-Way Rotation Group (`↺ -90°`, `↻ +90°`, `⇅ 180° Flip`).
- [x] **Custom Bento Dropdowns (Zero Native `<select>`):** Sleek floating Dark Slate dropdowns for Compress Target (`< 256 KB MahaDBT`, `< 200 KB CET`, `< 500 KB`, `Custom KB`) and PDF to JPG DPI (`150 DPI Fast`, `300 DPI High Quality`, `72 DPI Web`).
- [x] **Vector / Computer-Generated PDF Engine:** Automatic high-res `PDF.js` canvas fallback (`renderPdfPagesToJpegs`) ensuring 100% compression and JPG conversion success for vector/text PDFs without embedded JPEGs.
- [x] **JPG to PDF Compilation Tool:** Integrated 7th ribbon tool allowing compilation of multiple `.jpg`, `.jpeg`, `.png`, `.webp` documents into clean A4 PDF dossiers.
- [x] **Merge Drag-to-Reorder:** HTML5 drag-and-drop on docket cards allowing operators to visually reorder pages before merging.
- [x] **Selective Page Range Split:** Supports parsing ranges (`1-3, 5` or `All`) extracting only requested pages into `Split_PDF/`.
- [x] **1-Click Open Output Folder:** Instant Windows Explorer launcher (`#btnOpenOutputFolder`) upon batch completion.
- [x] **Complete Keyboard Navigation:** Global hotkeys (`F2`, `F8`, `Alt+M/S/J/P/R`, `Esc`, `PageUp/Down`, `Ctrl +/-/0`, `R`).
- [x] **100% Dual-MCP Verified:** Playwright MCP E2E test passed + Chrome DevTools MCP 0 console errors on live desktop release app.exe.

---

## 4. Unlock Protocol (How to Work on this Tool)
When future work on this tool is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > *"Confirm tool unlock: Type `UNLOCK PDF STUDIO` to modify files inside `tools/pdf_studio/`."*
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
