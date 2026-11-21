# 🔒 LOCKED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & MASTER PLAN VERIFIED (Phases 1-4 & Live Streaming Smart Scan Complete)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for the Bulk Renamer.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`) and shared app services (`storage-service.js`, `analytics-service.js`, `followup-service.js`).
- **Style Isolation:** All styles in `rename_tool.css` are strictly scoped under the `.rename-tool-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `rename_tool.py` | Python Backend | Safe atomic rename, disk-level per-file rotation (`pypdf` + `PIL`), physical file import with duplicate numbering, Windows case-only temporary swap, Windows reserved names guard, collision avoidance, directory scanner |
| `rename_tool.html` | UI Component | Scoped 3-column Bento workstation markup with clean bottom toolbar, high-visibility Rename All button, collapsible Missing Documents with blinking badge (0 dummy data, 0 Marathi characters) |
| `rename_tool.css` | Scoped Stylesheet | Strict `.rename-tool-scope` styling rules (pan-scroll, inspection stage, badge typography, pulse animations) |
| `rename_tool_ui.js` | UI Manager | Clean filename display (no extensions), sequential one-by-one live streaming smart scan, per-file rotation preview & transform, working physical import, view bindings, checklist, and event handling |
| `rename_tool_logic.js`| Business Logic | Pure naming rules, 21-shortcut matcher, strict casing, multi-level undo, single-extension normalization (`replace(/(\.[a-zA-Z0-9]+)+$/i, '')`), duplicate numbering with student name, CSV audit export |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features (Phases 1-4 & Master Plan Complete)
- [x] **Phase 1 — Bottom Bar Cleanup & High-Visibility "Rename All":** Cleaned shortcut clutter (<kbd> tags removed from view), prominent emerald high-visibility `Rename All` button (`h-11 px-6 bg-emerald-600 text-[15px] font-bold`), clean secondary actions layout (`btnUndoRename`, `btnKeepOriginal`, `btnSmartScanBatch`, `btnRenameMatched`, `btnReviewUnmatched`, `btnSaveBatch`, `btnExportAudit`).
- [x] **Phase 2 — Clean Filename Display & Strict Queue Rules:** Extensions hidden in `Original Filename` and `Upcoming Queue` UI while preserved internally. Auto-handles duplicate filenames with sequential numbering (`1`, `2`, `3`...) with `studentName` attached (`10TH MARKSHEET 1 RAHUL PATIL.pdf`). Strict Queue Lifecycle: files stay in `Upcoming Queue` until `isRenamed === true` on disk; completed files strictly require `f.isRenamed === true`.
- [x] **Phase 3 — True Per-File Rotation (Disk Output) & Single-Extension Safe Code Rename:** Rotation strictly isolated per file (`currentFile.rotation`). Applied physically to output file on disk using `pypdf` for PDFs and `PIL` for images via `server.py` and `rename_tool.py`. Single extension renamer sanitizes input with `/(\.[a-zA-Z0-9]+)+$/i` to eliminate duplicate `.pdf.pdf` or `ADR.PDF...`.
- [x] **Phase 4 — Dynamic Missing Documents & Working Physical Import:** Dynamic document presets loaded from persistent `config/document_presets.json` with full CRUD in Main Settings (code, name, required/optional toggle). Missing Documents section collapsed by default with blinking badge `⚠️ X Missing Documents Found`. Fully working `Import Document` physically copies source file to student folder with duplicate collision numbering and clears missing document record.
- [x] **Sequential One-by-One Live Streaming Smart Scan:** Queue shows all files immediately; File #1 prioritized instantly with spinning scan badge and immediate result display; scans sequentially row-by-row live without UI freeze; live updating `Rename Matched (X)` counter; full `AbortController` cancellation support.
- [x] **File/Folder Intake:** Fast folder scanning with F2 native dialog & in-place file addition.
- [x] **In-Ribbon Folder Switcher:** `< Prev` and `> Next` navigation with `Ctrl+Left` / `Ctrl+Right` hotkeys and folder counter pill.
- [x] **Windows Junk Filtering:** Filters out `thumbs.db`, `desktop.ini`, `~$*`, and `.tmp` files.
- [x] **21-Shortcut Keyword Engine:** Exact-shortcut-first matching with word boundary protection (`Pankaj` does not match `PAN`).
- [x] **Strict Casing:** All 4 casing styles (`UPPER`, `Title`, `lower`, `As Is`) enforced across base document and student name.
- [x] **Safe Atomic File Operations:** Native atomic rename with intermediate temporary files for Windows case-insensitive changes.
- [x] **Duplicate Collision Prevention:** Non-colliding sequential suffixing (` 1`, ` 2`, etc.).
- [x] **Multi-Level Undo:** Undo stack with full restoration of disk state and UI models.
- [x] **3-Column Empty State:** Clean, consistent empty state with center action buttons and zero dummy student data.
- [x] **Zero Marathi Text in Production UI:** 100% English professional administrative workstation UI.

---

## 4. Remaining Scope (Future Considerations)
- Additional localized document synonyms beyond the core 21 shortcuts.
- Advanced custom CSV audit column configuration.
- Operator hotkey customization panel.

---

## 5. Unlock Protocol (How to Work on this Tool)
When future work on this tool is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > "Confirm tool unlock: Type `UNLOCK RENAME TOOL` to modify files inside `tools/rename_tool/`."
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
