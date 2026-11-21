# DocMitra — Bulk Document Renamer Isolation & Lock Report

**Execution Date:** 21 November 2026  
**Architecture Status:** ✅ ISOLATED & LOCKED (90% Working + Ready for Final 10%)  
**Methodology:** Zero-Risk Shadow / Mirror Migration ("100-Document Backup" Safety Protocol)

---

## 1. Executive Summary

The 90%-complete Bulk Document Renamer has been cleanly isolated into its own self-contained, locked directory (`tools/rename_tool/`). All scattered Python, JavaScript, CSS, and HTML artifacts have been consolidated, while non-destructive forwarder shims ensure zero broken references across the DocMitra codebase. All obsolete prototype files, inspection scripts, and initial Google Stitch exports have been quarantined safely into `_backup_archive/old_rename_tool_backup/`.

The main application shell (`src/ui/index.js`, `app/index.html`, `server.py`) now mounts and executes the Rename Tool solely from `tools/rename_tool/`. Comprehensive automated verification (12 test suites, visual screenshots, and live Windows native API execution) confirmed 100% functional and visual integrity with zero regressions in PDF Studio, Image Studio, Print Studio, or Follow-up Desk.

---

## 2. Directory Tree Structure: `tools/rename_tool/`

```
tools/rename_tool/
├── rename_tool.py             # (202 lines) Safe atomic rename, Windows case temp swap, reserved names guard, folder scanner
├── rename_tool.html           # (146 lines) Scoped 3-column Bento workstation markup (0 dummy data, 0 Marathi characters)
├── rename_tool.css            # (72 lines) Strictly scoped stylesheet (prefixed under .rename-tool-scope)
├── rename_tool_ui.js          # (2,415 lines) UI Manager: live shortcut narrowing, preview, checklist, telemetry, event handling
├── rename_tool_logic.js       # (690 lines) Pure business logic: naming rules, 21-shortcut matcher, 4 casing modes, undo, CSV audit
└── README_LOCK.md             # Governance: Tool boundaries, 90% verified state, and strict unlock protocol
```

### Common Utilities (`shared/`)
To support the "One Folder Per Tool" architecture, shared non-domain utilities are now cleanly exposed via `shared/`:
- `shared/toast.js` — Non-blocking administrative toast notifications.
- `shared/native-bridge.js` — Desktop file dialogs (Tauri / Python) and native file operations.

---

## 3. Files Quarantined to `_backup_archive/`

The following scattered and prototype files were safely moved into `_backup_archive/old_rename_tool_backup/`:

| Quarantined File | Original Location | Purpose / Why Quarantined |
| :--- | :--- | :--- |
| `src_ui_renamer-ui.js` | `src/ui/renamer-ui.js` | Original pre-isolation UI binding file (replaced with forwarder shim) |
| `src_libraries_rename-library.js` | `src/libraries/rename-library.js` | Original pre-isolation rename library (replaced with forwarder shim) |
| `stitch_bulk_document_renamer_new_final/` | `_design_ref/stitch_docmitra/bulk_document_renamer_new_final/` | Raw Google Stitch HTML (`code.html`) and reference mockup image (`screen.png`) |
| `inspect_renamer_details.js` | `scripts/inspect_renamer_details.js` | Obsolete milestone debugging script |
| `test_compact_renamer_refactor.js` | `scripts/test_compact_renamer_refactor.js` | Outdated test asserting old blurred skeleton overlay (replaced in milestone 6) |

---

## 4. Verification Record

### 4.1 Automated Test Execution Summary (100% Pass Rate)

| Test Suite | File | Results |
| :--- | :--- | :--- |
| **Isolated Tool Suite** | `scripts/test_isolated_rename_tool.js` | ✅ **8 / 8 Passed** (Logic, Casing, Shortcuts, Reserved Names, Typo Autocorrect, Undo, Markup, Python backend) |
| **3-Feature Suite** | `scripts/test_3col_exact_shortcut.js` | ✅ **5 / 5 Passed** (Strict casing, live shortcut narrowing, 3-col empty state, tab reset, 0 Marathi) |
| **Micro-Features** | `scripts/test_micro_features.js` | ✅ **3 / 3 Passed** (Top-3 typeahead chips, multi-page PDF stepper, Ctrl+wheel zoom) |
| **Approved Features** | `scripts/test_approved_features.js` | ✅ **5 / 5 Passed** (Follow-up registration, direct import, 4 case radios, missing doc deduction) |
| **Reviewer Fixes** | `scripts/test_reviewer_fixes.js` | ✅ **4 / 4 Passed** (Execute/undo URL sync, path restore, batch folder detection, collision prevention) |
| **Renamer Spec** | `scripts/test_renamer_spec.js` | ✅ **3 / 3 Passed** (Junk blacklist, base name input field, illegal character blocking) |
| **Comprehensive E2E** | `scripts/test_renamer_end_to_end.js` | ✅ **8 / 8 Passed** (Typing, spelling fix, word boundary, unique suffixing, reserved names, checklist, audit CSV, undo) |
| **Milestone 2 Smoke** | `scripts/test_milestone2.js` | ✅ **5 / 5 Passed** (Filename validation, 21 shortcuts, unique destination, undo, spelling) |
| **PDF Studio** | `scripts/test_milestone3.js` | ✅ **4 / 4 Passed** (Zero regression in PDF Studio) |
| **Image Studio** | `scripts/test_milestone4.js` | ✅ **4 / 4 Passed** (Zero regression in Image Studio) |
| **Print & Follow-up** | `scripts/test_milestone5.js` | ✅ **3 / 3 Passed** (Zero regression in Print Studio & Follow-up Desk) |
| **Visual Geometry** | `scripts/verify_visual_alignment.cjs` | ✅ **5 / 5 Passed** (3-col Bento proportions 28%/flex-1/24%, ribbon cluster, toolbar, CSS scoping) |

### 4.2 Visual Alignment & Screenshot Inspection

Headless Chromium screenshots were rendered at `1440x900` resolution against the live server:
1. **Empty/Cleared State:** [`docs/screenshot_renamer_empty.png`](file:///E:/DocMitra/docs/screenshot_renamer_empty.png) (58,134 bytes)
   - Confirms sharp 3-column Bento layout with zero layout shifts.
   - Column 1: Clean "No Intake Folder Selected" card with `Select Folder (F2)` and `Add Files` buttons.
   - Column 2: Centered "No Document Loaded for Preview" with DPI/buffer telemetry.
   - Column 3: Utility panel with zero fake dummy student data.
2. **Loaded State:** [`docs/screenshot_renamer_loaded.png`](file:///E:/DocMitra/docs/screenshot_renamer_loaded.png) (89,463 bytes)
   - Confirms ultra-compact Hero Card with locked extension badge (`.pdf`).
   - Confirms live `CORE SHORTCUTS` category-coded chips in Column 3.
   - Confirms admission checklist with Missing document indicators and follow-up registration.

### 4.3 Native Python Backend Verification

- Verified live `server.py` delegate to `tools.rename_tool.rename_tool.safe_rename_file`.
- Tested real disk atomic rename via `POST /api/native-rename` (`test_tmp_rename.txt` -> `test_tmp_renamed.txt`).
- Tested Windows case-only temporary swap via `POST /api/native-rename` (`test_case.txt` -> `TEST_CASE.txt`) with safe temporary swap rollback guard.
- Tested Windows reserved name guard against stem spacing variants (`"CON .pdf"`, `"AUX .txt"`) and ASCII control characters (`\x00`–`\x1f`).
- Delegated `/api/native-batch-rename` to `batch_rename_files` with flexible parameter mapping.

---

## 5. Architectural Governance (`AGENTS.md`)

Permanent non-negotiable rules were established in [`AGENTS.md`](file:///E:/DocMitra/AGENTS.md):
1. **One Folder Per Tool:** All future tool development (PDF Studio, Image Studio, Print Studio, Follow-up Desk) must occur inside `tools/<tool_name>/`.
2. **Rename Tool Locked:** AI agents working on any other tool must never modify `tools/rename_tool/`. Future modifications require explicit user confirmation (`UNLOCK RENAME TOOL`).
3. **Backup-First Principle:** Working files must never be deleted before verifying shadow replacements.

---

## 6. Zero Regressions Confirmation

- **PDF Studio:** 100% operational; no changes to `src/modules/pdf-studio.js` or `src/ui/pdf-studio-ui.js`.
- **Image Studio:** 100% operational; no changes to `src/modules/image-studio.js` or `src/ui/image-studio-ui.js`.
- **Print Studio:** 100% operational; no changes to `src/modules/print-studio.js` or `src/ui/print-studio-ui.js`.
- **Follow-up Desk:** 100% operational; no changes to `src/services/followup-service.js` or `src/ui/followup-ui.js`.
- **Global Navigation Bar:** 100% operational; no layout shifts or broken tabs.
