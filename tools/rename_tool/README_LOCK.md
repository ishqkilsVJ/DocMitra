# 🔒 LOCKED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & UPGRADE COMPLETE (Phases 1-4, Automatic Smart Scan, Self-Learning Flow, Cross-Check Modal & 13 Master Tests Verified 100%)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for the Bulk Renamer.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`) and shared app services (`storage-service.js`, `analytics-service.js`, `followup-service.js`).
- **Style Isolation:** All styles in `rename_tool.css` are strictly scoped under the `.rename-tool-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `rename_tool.py` | Python Backend | Safe atomic rename, disk-level per-file rotation (`pypdf` + `PIL`), physical file import with duplicate numbering, Windows case-only temporary swap, Windows reserved names guard, collision avoidance, directory scanner |
| `rename_tool.html` | UI Component | Scoped 3-column Bento workstation markup with clean bottom toolbar, alert bar for unrecognized documents, Add Document self-learning modal, Cross-Check preview modal, collapsible Missing Documents with pulsating badge (0 dummy data, 0 Marathi characters) |
| `rename_tool.css` | Scoped Stylesheet | Strict `.rename-tool-scope` styling rules (pan-scroll, inspection stage, confidence badges, pulse animations) |
| `rename_tool_ui.js` | UI Manager | Clean filename display (no extensions), automatic sequential live streaming smart scan, Add Document self-learning capture, 2-column Cross-Check modal, per-file rotation preview & transform, working physical import, view bindings, checklist, and event handling |
| `rename_tool_logic.js`| Business Logic | Pure naming rules, 21-shortcut matcher, dynamic signature registration (`registerDocumentSignature`), OCR keyword extractor (`extractSignatureKeywords`), strict casing, multi-level undo, single-extension normalization, duplicate numbering with student name, CSV audit export |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features (All 6 Architectural Decisions & 13 Master Tests Complete)
- [x] **Automatic Smart Scan Only (No Manual Scan Button):** Smart Scan triggers automatically the moment files or folder are loaded (`loadFolderData`, `handleAddFiles`). Bottom toolbar and queue headers cleaned of manual scan button clutter.
- [x] **Sequential One-by-One Live Streaming Scan:** Prioritizes File #1 first, streams row-by-row live without UI freeze. Updates queue rows live with clean original filename (no extension), matched document name, confidence badge (`🟢 95% AADHAAR CARD` / `🟡 65% REVIEW` / `🔴 UNMATCHED`), and live-incrementing `Rename Matched (X)` count.
- [x] **Strict `isKept` Protection:** Files marked with `isKept = true` ("Keep Original") are strictly protected; never overwritten, re-matched, or modified during scanning.
- [x] **Confidence Formula Integrity:** Retains the battle-tested `>= 80%` rule (`docScore >= 50` + Student Name matching bonus up to 30 pts) without fragile tampering.
- [x] **"New Document Found" & "Add Document" Self-Learning Flow:** Compact alert bar rendered above Center Preview viewport whenever current active file is unrecognized/unmatched; hidden when matched. Clicking "Add Document" opens modal to input Short Code, Full Name, preview live target name with active casing + student name, extract OCR keywords, and permanently persist into `config/document_presets.json` and memory signatures so future scans recognize it automatically.
- [x] **Duplicate Filename Auto-Numbering in Smart Scan:** Prevents in-memory collisions when assigning names. Identical documents automatically receive non-colliding sequential numbers (`1`, `2`, `3`...) with `studentName` attached (`uniqueDestination()`).
- [x] **High-Speed 2-Column Cross-Check Preview Modal:** Clicking "Rename Matched" opens a 2-column comparison table (`Old Name -> Suggested New Name` with student name highlighted and confidence badge). Includes "Select All / Deselect All" toggle and prominent green "Confirm & Rename (X)" button executing atomic batch rename on disk with multi-level undo intact.
- [x] **Focused Execution Toolbar:** Bottom toolbar streamlined to 5 core actions: `Undo Rename`, `Keep Original & Next`, `Review Unmatched`, `Export Audit`, and prominent emerald `Rename Matched`. Manual scan button, save batch button, and redundant rename all button removed/hidden.
- [x] **Phase 1-4 Core Renamer Foundations:**
  - Extensions hidden in UI while preserved internally.
  - Strict Queue Lifecycle: files remain in upcoming queue until genuinely renamed on disk (`isRenamed === true`).
  - True per-file disk rotation via Python (`pypdf` + `PIL`).
  - Single-extension sanitization (`replace(/(\.[a-zA-Z0-9]+)+$/i, '')`).
  - Dynamic presets with persistent disk storage in `config/document_presets.json`.
  - Collapsible Missing Documents with pulsating indicator.
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
