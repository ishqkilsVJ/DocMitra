# 📋 Master Product Requirements Document (PRD): Bulk Document Renamer

> **Module:** `tools/rename_tool/` (DocMitra Administrative Bento Workstation)  
> **Status:** Architecture Locked & Governed by `RENAME_TOOL_AGENT.md`  
> **Testing Scope:** 100% Exhaustive Frontend & Backend Verification

---

## 1. Executive Summary & Purpose
The Bulk Document Renamer is DocMitra’s flagship administrative workstation designed for zero-error, high-speed renaming of student admission documents (MahaDBT, CET Cell, Swayam, Educational). It guarantees 100% offline air-gapped operation, zero student name duplication, native desktop filesystem safety, and sub-second batch execution with instant undo.

---

## 2. Frontend Architectural Inventory & Requirements

### 2.1 Top Folder Ribbon & Navigation
- **Previous / Next Student Folder:** `btnPrevFolder` (Ctrl+Left) and `btnNextFolder` (Ctrl+Right) navigate sibling student folders in the intake directory.
- **Windows Explorer Launcher:** `btnOpenInExplorer` opens the active folder in native Windows Explorer.
- **Folder Path & In-Place Student Rename:** Displays folder path and allows clicking/editing student name directly in the ribbon.
- **Telemetry Counter:** Displays `telemetryTotalFiles`, `telemetryReadyFiles` (with completion percentage), and `telemetryUnmatchedFiles`.
- **Global Ribbon Casing:** 1-click toggles for `UPPER`, `Title`, and `lower` case affecting active and upcoming files.
- **Action Buttons:** `btnRenameSettings` (dedicated settings modal), `btnClearWorkspace` (reset), `btnAddFiles` (append), `btnSelectFolder` (F2 folder picker).

### 2.2 Column 1: Intake Queue (`col-queue`)
- **Single Unified List:** Continuous 1-to-N list of all loaded documents (active, ready, and completed).
- **Status & Confidence Badges:** Compact 5-7 char badges (`🟢 95% 10M`, `🟡 85% CST`, `🔴 UNMATCH`, `✓ CST`).
- **Interactive File Cards:** Displays original filename, target rename filename, and index. Click to inspect; auto-scrolls smoothly.
- **Empty State:** Shows clean administrative guidance with `btnEmptySelectFolder` and `btnEmptyAddFiles` (zero dummy data).

### 2.3 Column 2: Document Inspection Stage & Preview (`col-preview`)
- **Editing Pill:** Displays "Editing X of Y" with dynamic confidence badge and clear dismiss trigger.
- **Original Filename Stage:** Read-only label of current file's clean base name without extension.
- **`inputRenameTarget`:** Central rename input box supporting real-time typing, debounce, Enter to confirm, Tab to keep/advance, and live formula evaluation.
- **Native Offline Multi-Page PDF Viewer:**
  - Page navigation (`btnPdfPrevPage`, `btnPdfNextPage`, page counter "Page X of Y").
  - Zoom & Fit controls (`Fit to Page`, zoom slider).
  - Target buffer & DPI telemetry.
  - Per-file 90° CW and CCW rotation controls.
- **High-Fidelity Image Viewer:** Pan, zoom, and rotate for JPG, PNG, WEBP.
- **Missing Documents Checklist (`#missingDocsHeader`, `#missingDocsList`):**
  - Collapsible drawer with toggle chevron.
  - Header Preset Switcher dropdown (`#presetSelectorDropdown`) switching active preset live on the workstation.
  - Interactive chips showing present vs missing required admission documents.

### 2.4 Column 3: Smart Suggestions & Utilities (`col-utility`)
- **Smart Suggestions Panel (`#coreShortcutsContainer`):** Top 5 real-time matching suggestions updating on every keystroke in `Rename To`. 1-click chip application instantly sets target name.
- **Bottom Action Toolbar:**
  - `btnUndoRename` (Ctrl+Z): Reverts last rename action.
  - `btnKeepOriginal` (Tab): Keeps current original filename and advances to next file.
  - `btnExportAudit` (F9): Generates and exports full CSV audit report.
  - `btnRenameMatched` (F4): Opens the Powerhouse Cross-Check Modal for batch execution.

### 2.5 Modals & Dialogs
- **1. Dedicated Rename Tool Settings Modal (`#modalRenameSettings`):**
  - *Presets Tab:* Create new preset (`btnNewPreset`), duplicate preset (`btnCopyPreset`), rename preset, delete custom preset, and add document to preset (`btnAddDocToPreset`). In-table row editing.
  - *Shortcuts Tab:* View 33 master shortcuts, add new shortcut (`btnAddNewShortcut`), edit and delete shortcuts.
- **2. Add Document Modal (`#modalAddDocument`):**
  - Fields for Document Name, Short Code, Keywords, and Required toggle. Save and Cancel actions.
- **3. Powerhouse Cross-Check Modal (`#modalCrossCheck`):**
  - *Top Power Pattern Bar:* Reactive controls for Order (`doc_student`, `student_doc`), Separator (Space, `_`, `-`), Student Name Toggle (ON/OFF), Casing (`UPPER`, `Title`, `lower`), and File Filter (`all`, `pdf`, `images`).
  - *Power Utilities Strip:* Bulk Find & Replace, One-Click Scanner Junk Cleaner, Portal-Safe Alphanumeric Cleaner, Reset Rules.
  - *Two-Tier Table Layout:* Top tier for active changed files with Live Word Diff (deleted words red strikethrough, added words bold emerald, student name purple pill); collapsible bottom drawer for identical unchanged files.
  - *Selective Checkboxes:* Check/uncheck individual rows with reactive `Confirm & Rename (N)` counter.
  - *In-Modal Keyboard Navigation:* ArrowUp/Down for row focus, Space to toggle checkbox, Enter to confirm batch.
- **4. Floating Undo Toast Banner (`#floatingUndoToast`):** 7-second emerald toast with 1-click instant undo (`#btnUndoFloating`) after batch rename.

---

## 3. Backend & IPC Requirements (`rename_tool.py` & Native Bridge)

### 3.1 Filename Validation & Windows OS Guardrails
- **Windows Reserved Device Names Guard:** Rejects `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9` with clear error messages.
- **Illegal Characters Validation:** Rejects `\ / : * ? " < > |` and ASCII control chars (< 32).
- **Trailing Period & Whitespace Guard:** Strips or rejects illegal trailing spaces/dots.
- **OS Junk Filter (`is_junk_file`):** Automatically ignores `Thumbs.db`, `.DS_Store`, `desktop.ini`, `~$` locks, and `.tmp` files.

### 3.2 Atomic Disk Operations & Collision Safety
- **Safe Atomic Rename (`safe_rename_file`):** Renames files in-place on disk with zero external prompts.
- **Windows Case-Only Swap:** Safely handles renaming `doc.pdf` to `DOC.pdf` using an intermediate atomic temporary file (`__tmp_...`).
- **Sequential Duplicate Numbering (`unique_destination`):** Resolves naming collisions by inserting auto-incremented counters (` 1`, ` 2`) before the file extension (and before the student name if present). Never crashes with "file already exists".
- **Batch Atomic Renaming (`batch_rename_files`):** Sequentially executes batch renames with individual status reporting.

### 3.3 Disk-Level Rotation & File Import
- **Native PDF Rotation (`rotate_pdf_on_disk`):** Uses `pypdf` to rotate pages by 90°, 180°, 270°. Handles blank-password encrypted PDFs, lifts Windows read-only attributes (`stat.S_IWRITE`), and cleans temporary swap files in `finally`.
- **Native Image Rotation (`rotate_image_on_disk`):** Uses `PIL` with EXIF orientation transposition and high-quality 95% JPEG output.
- **Physical File Import (`import_file_to_folder`):** Copies external files into student folders with collision avoidance and URL generation.

### 3.4 Directory Scanning & OCR Engine
- **Directory Scanner (`scan_student_folder`):** Scans directories recursively or flat, extracts file sizes and modification times, and filters OS junk.
- **Sibling Folder Switcher (`get_sibling_folders`):** Discovers adjacent student folders for rapid ribbon switching.
- **Offline OCR (`ocr_extract_text`):** Integrates local Tesseract OCR for text extraction from scanned images.

---

## 4. Quality & Non-Functional Requirements
- **100% Professional English in Production UI:** Zero Marathi characters in production HTML/DOM.
- **Zero Token Waste:** Targeted context reads only; no unnecessary reads of 4,000+ line files.
- **Strict Boundary Isolation:** Zero modifications to `tools/pdf_studio/` or Dashboard modules.
- **Immediate Software Update:** Compile `app/assets/js/app.js` with `node build-ui.js` and deploy `C:\Users\USER\AppData\Local\DocMitra\app.exe` upon verified changes.
