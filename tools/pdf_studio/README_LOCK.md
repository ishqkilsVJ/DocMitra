# 🔒 LOCKED TOOL: PDF Studio (`tools/pdf_studio/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & MODULAR MIGRATION COMPLETE**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for PDF Studio.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`).
- **Style Isolation:** All styles in `pdf_studio.css` are strictly scoped under the `.pdf-studio-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `pdf_studio.py` | Python Backend | Disk-level PDF operations: Compression (<256 KB MahaDBT), Multi-Document Merge, Page Extraction / Splitting, Lossless Rotation, PDF to Image, and Image to PDF compilation (`pypdf` + `PIL`) |
| `pdf_studio.html` | UI Component | Scoped Bento workstation markup with PDF tool ribbon, instant drag & drop dropzone, execution queue, and sticky execution dock (0 dummy data, 0 Marathi characters) |
| `pdf_studio.css` | Scoped Stylesheet | Strict `.pdf-studio-scope` styling rules (scrollbars, tool ribbon transitions, docket cards, dropzone states, and pulse indicators) |
| `pdf_studio_ui.js` | UI Manager | Interactive tool switcher (Compress, Merge, Split, PDF to JPG, Rotate, Clean & Enhance), directory picker, file drag & drop intake, first-page thumbnail rendering, oversized file filter, and batch execution |
| `pdf_studio_logic.js`| Business Logic | Pure client-side ISO-32000 A4 PDF compilation (0 external dependencies), watermark-filtered image extraction, JPEG dimension parser, size-suffixing (`formatSizeSuffixFilename`), and subfolder routing |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features
- [x] **Pure JS ISO-32000 PDF Compilation:** Compiles valid ISO-32000 compliant A4 PDFs with perfect xref tables, catalog, and image XObjects directly from binary JPEG streams with zero external dependencies.
- [x] **Watermark-Filtered Document Image Extraction:** Automatically detects and filters out ribbon watermark banners (e.g., CamScanner, scanner app footers) while preserving full-resolution document pages.
- [x] **Targeted Size-Suffix Naming:** Generates canonical filenames with size suffixes (`10TH MARKSHEET 187 KB.pdf`) ensuring repeated operations never stack redundant suffixes.
- [x] **Multi-Document Merge & Dossier Compilation:** Merges multiple PDFs into unified admission dossiers with proper orientation and page hierarchy.
- [x] **Page Extraction & Splitting:** Splits multi-page admission documents into separate 1-page PDF documents.
- [x] **Lossless 90° / 180° / 270° Rotation:** Per-file and batch page rotation via client-side recompilation and backend Python engine.
- [x] **Subfolder Routing:** Dedicated output subfolders (`Compressed_PDF`, `Merged_PDF`, `Split_PDF`, `Converted_JPG`, `Rotated_PDF`).
- [x] **Clean Empty State:** Zero hardcoded student cards or dummy records in DOM templates; clean professional empty state.
- [x] **Scoped CSS & Namespace Isolation:** 100% scoped under `.pdf-studio-scope` preventing style collisions across tools.

---

## 4. Unlock Protocol (How to Work on this Tool)
When future work on this tool is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > *"Confirm tool unlock: Type `UNLOCK PDF STUDIO` to modify files inside `tools/pdf_studio/`."*
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
