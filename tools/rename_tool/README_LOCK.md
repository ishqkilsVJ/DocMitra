# 🔒 LOCKED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & VERIFIED (4 UI/Preview Fixes, Non-OCR Filename Matching 30%+, Clean Single-Line Queue, and Universal Preview Asset Resolver Verified 100%)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for the Bulk Renamer.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`) and shared app services (`storage-service.js`, `analytics-service.js`, `followup-service.js`).
- **Style Isolation:** All styles in `rename_tool.css` are strictly scoped under the `.rename-tool-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `rename_tool.py` | Python Backend | Safe atomic rename, disk-level per-file rotation (`pypdf` + `PIL`), physical file import with duplicate numbering, Windows case-only temporary swap, Windows reserved names guard, collision avoidance, directory scanner |
| `rename_tool.html` | UI Component | Scoped 3-column Bento workstation markup with clean bottom toolbar, Cross-Check preview modal, collapsible Missing Documents with single indicator (0 dummy data, 0 Marathi characters) |
| `rename_tool.css` | Scoped Stylesheet | Strict `.rename-tool-scope` styling rules (pan-scroll, inspection stage, confidence badges, pulse animations) |
| `rename_tool_ui.js` | UI Manager | Clean single-line queue display, robust universal preview resolver (Tauri/Blob/API), filename-based matching (30%+), 2-column Cross-Check modal, per-file rotation preview & transform, working physical import, view bindings, checklist, and event handling |
| `rename_tool_logic.js`| Business Logic | Pure naming rules, 21-shortcut matcher, `matchFilenameSmart` engine (30%+ threshold), strict casing, multi-level undo, single-extension normalization, duplicate numbering with student name, CSV audit export |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features
- [x] **Universal Preview Rendering (.jpg, .jpeg, .png, .pdf):** Robust URL and asset conversion (`resolveFilePreviewUrl`) supporting Tauri asset protocol (`convertFileSrc`), direct `URL.createObjectURL(fileObj)`, dynamic local server endpoints, and PDF.js canvas arrayBuffer/multi-source script fallbacks. Zero broken image icons or blank canvases.
- [x] **Removed "New Document Found" Banner & "+ Add Document" Button:** Clean center preview viewport with banner removed.
- [x] **Removed Redundant Matched/Unmatched Pill Above Hero Card:** Kept Hero Card top area uncluttered with editing state and confidence badge only.
- [x] **Deduplicated MISSING DOCUMENTS Header:** Single clean indicator `X Missing Documents Found` with functioning expand/collapse chevron arrow.
- [x] **Filename-Based Smart Matching Only (OCR Extraction Removed):** Removed slow/unreliable OCR extraction from scan flow; performs multi-signal filename token matching with a 30%+ threshold for suggestion and 80%+ for confident match.
- [x] **Clean Single-Line Queue Display:** Each upcoming queue row displays number badge, clean original filename (without extension), and side confidence badge with zero triple name repetition.
- [x] **Preserved Core Foundations:** Casing rules (`UPPER`, `Title`, `lower`), duplicate auto-numbering (`1, 2, 3`), and queue lifecycle remain 100% intact.
  - Functional Import Document disk copy with OCR detection.
  - 21-shortcut matcher with word-boundary protection.
  - 100% English professional administrative workstation UI (zero Marathi text, zero dummy data).

---

## 4. Master Verification Suite
- **Suite:** `node scripts/test_rename_tool_master_suite.js` (13/13 Test Cases Passed 100%)
- **Engine Tests:** `node scripts/test_smart_auto_rename.js` (100% Passed)
- **Disk Backend:** `python scripts/test_python_disk_ops.py` (100% Passed)
- **Visual Geometry:** `node scripts/verify_visual_alignment.cjs` (100% Passed)

---

## 5. Unlock Protocol (How to Work on this Tool)
When future work on this tool is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > "Confirm tool unlock: Type `UNLOCK RENAME TOOL` to modify files inside `tools/rename_tool/`."
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
