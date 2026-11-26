# 🧹 Bulk Renamer: Cleanup & Dead-Code Audit Summary (Phase 1)

> **Module:** Bulk Document Renamer (`tools/rename_tool/`, `src/core/`, `src-tauri/`)  
> **Protocol Phase:** Phase 1 of 4 (Strict Feature Freeze & Verification)  
> **Date:** 2026-11-26  
> **Status:** COMPLETED & VERIFIED

---

## 1. Archived Duplicate & Temporary Files (Choice 1-A)
- **Root Markdown Reports (17 files):** Safely archived duplicates from root workspace to `_archive/legacy_reports/` (master canonical copies preserved in `tools/rename_tool/docs/`):
  - `DOCMITRA_RENAME_TOOL_AUDIT_REPORT.pdf`
  - `RENAME_TOOL_AGENT.md`
  - `RENAME_TOOL_BACKEND_TEST_REPORT.md`
  - `RENAME_TOOL_BUG_AND_ERROR_REPORT.md`
  - `RENAME_TOOL_BUG_AND_ROOT_CAUSE_REPORT.md`
  - `RENAME_TOOL_CLEANUP_CANDIDATES.md`
  - `RENAME_TOOL_COVERAGE_GAPS.md`
  - `RENAME_TOOL_E2E_TEST_REPORT.md`
  - `RENAME_TOOL_FEATURE_INVENTORY.md`
  - `RENAME_TOOL_FILE_MAP.md`
  - `RENAME_TOOL_FINAL_STATUS.md`
  - `RENAME_TOOL_FINAL_TEST_STATUS.md`
  - `RENAME_TOOL_FRONTEND_TEST_REPORT.md`
  - `RENAME_TOOL_PROTECTION_REPORT.md`
  - `RENAME_TOOL_REQUIREMENTS_TRACEABILITY.md`
  - `RENAME_TOOL_TEST_COVERAGE_REPORT.md`
  - `RENAME_TOOL_TEST_REPORT.md`
- **Backup & Cache Clutter:**
  - `tools/rename_tool/_backup/` (.bak files) archived to `_archive/rename_tool_backups/` and directory removed.
  - `tools/rename_tool/__pycache__/` removed.
  - `tools/rename_tool/test_preview_bento_redesign.js` relocated to `tools/rename_tool/tests/`.

---

## 2. Hidden Metadata & Dot-Files Filter (Strict Guard)
- **Rust Native Bridge (`src-tauri/src/lib.rs`):**
  - Updated `pick_native_files()` and `list_native_directory()` to strictly ignore dot-files (`.startsWith('.')`), hidden metadata files (`.contains(".docmitra_id")`), system files (`Thumbs.db`, `desktop.ini`), and `Duplicate Files` folder.
- **JavaScript UI & File Library (`rename_tool_ui.js` & `file-library.js`):**
  - Updated `isJunkFile()` in `rename_tool_ui.js` to strictly reject `.docmitra_id` files.
  - Updated `readFiles()` in `src/libraries/file-library.js` to reject dot-files and `.docmitra_id`.

---

## 3. Zero `localhost` Port Leak Elimination
- Removed hardcoded `http://localhost:3000` URLs in `src-tauri/src/lib.rs` (`url = String::new()`), ensuring pure air-gapped local asset loading via Tauri `convertFileSrc`.
- Replaced hardcoded localhost URL assignment during Undo in `rename_tool_ui.js` with `resolveFilePreviewUrl(f)`.

---

## 4. UI Bundle Integrity
- Compiled via `node build-ui.js`:
  - 31 modules transformed.
  - Output bundle: `app/assets/js/app.js` (495.87 kB).
  - 0 bundle errors, 0 syntax warnings.
