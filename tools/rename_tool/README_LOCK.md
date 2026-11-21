# 🔒 LOCKED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **LOCKED & VERIFIED (100% Core Polish Complete)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for the Bulk Renamer.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`) and shared app services (`storage-service.js`, `analytics-service.js`, `followup-service.js`).
- **Style Isolation:** All styles in `rename_tool.css` are strictly scoped under the `.rename-tool-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `rename_tool.py` | Python Backend | Safe atomic rename, Windows case-only temporary swap, Windows reserved names guard, collision avoidance, directory scanner |
| `rename_tool.html` | UI Component | Scoped 3-column Bento workstation markup (0 dummy data, 0 Marathi characters) |
| `rename_tool.css` | Scoped Stylesheet | Strict `.rename-tool-scope` styling rules (pan-scroll, inspection stage, badge typography) |
| `rename_tool_ui.js` | UI Manager | View bindings, live shortcuts narrowing, preview, checklist, telemetry, and event handling |
| `rename_tool_logic.js`| Business Logic | Pure naming rules, 21-shortcut matcher, strict casing, multi-level undo, typo fixes, CSV audit export |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features (100% Core Polish Complete)
- [x] **File/Folder Intake:** Fast folder scanning with F2 native dialog & in-place file addition.
- [x] **In-Ribbon Folder Switcher:** `< Prev` and `> Next` navigation with `Ctrl+Left` / `Ctrl+Right` hotkeys and folder counter pill.
- [x] **Windows Junk Filtering:** Filters out `thumbs.db`, `desktop.ini`, `~$*`, and `.tmp` files.
- [x] **21-Shortcut Keyword Engine:** Exact-shortcut-first matching with word boundary protection (`Pankaj` does not match `PAN`).
- [x] **Clean UI / Zero Clutter:** Removed redundant on-screen shortcut button cards and duplicate fixed footer strip; typing shortcuts still functions instantly without visual clutter.
- [x] **High-Visibility Single Execution Toolbar:** Single, unclipped, non-wrapping bottom action toolbar containing all operations (`Smart Scan F4`, `Rename Matched`, `Review Unmatched`, `Rename All F8`, `Undo Ctrl+Z`, `Keep Original Tab`, `Save Batch Ctrl+S`, `Export Audit F9`) 100% visible in full screen mode.
- [x] **Strict Casing:** All 4 casing styles (`UPPER`, `Title`, `lower`, `As Is`) enforced across base document and student name.
- [x] **Safe Atomic File Operations:** Native atomic rename with intermediate temporary files for Windows case-insensitive changes.
- [x] **Duplicate Collision Prevention:** Non-colliding sequential suffixing (` 1`, ` 2`, etc.).
- [x] **Multi-Level Undo:** Undo stack with full restoration of disk state and UI models.
- [x] **Smart Auto-Rename (OCR & Confidence Engine):** Dual-tier text extraction (PDF.js digital text + Tesseract v5.3.3 scanned OCR), canonical pattern recognition (`AADHAAR CARD`, `10TH MARKSHEET`, `12TH MARKSHEET`, `12LC`, `CST`, `VLD`, `INC`, `DOM`, etc.), multi-signal scoring (0–100%), student name similarity bonus, live confidence badges (🟢 high, 🟡 review, 🔴 unmatched), batch `Rename Matched` (≥80%), and `Review Unmatched` navigation with `F4` hotkey.
- [x] **3-Column Empty State:** Clean, consistent empty state with center action buttons and zero dummy student data.
- [x] **Zero Marathi Text:** 100% English professional administrative workstation UI.

---

## 4. Remaining 10% Scope (Future Polish)
- Additional localized document synonyms beyond the core 21 shortcuts.
- Advanced custom CSV audit column configuration.
- Operator hotkey customization panel.

---

## 5. Unlock Protocol (How to Work on this Tool)
When future work on the remaining 10% polish is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > "Confirm tool unlock: Type `UNLOCK RENAME TOOL` to modify files inside `tools/rename_tool/`."
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
