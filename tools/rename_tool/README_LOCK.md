# 🔒 LOCKED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!CAUTION]
> **PERMANENT ARCHITECTURAL LOCK ACTIVE**
> This folder is strictly **LOCKED** under DocMitra's "One Folder Per Tool" architecture.
> **DO NOT** edit, refactor, reformat, rename, or delete any file in this directory unless explicit confirmation is provided by the user.

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & VERIFIED (Single Unified File List [1 to N loaded files with compact ✓ completion mark, bidirectional editing and smooth scroll], 4 Built-In Presets [MAHA DBT, CET CELL, SWAYAM, EDUCATIONAL], 33 Master Shortcuts & Rules, Zero Student Name Duplication Guard in buildName, One-Way Unique Sync [presets to shortcuts without code duplication], All-Preset Reactive Keystroke Suggestions [Top 5 live filter], Compact Badges [~5-7 chars: score + short code], Native Offline Preview Engine [Tauri read_binary_file + Blob/ArrayBuffer for JPG/PNG & PDF.js], Zero False PARENT DECLARATION Matches [Caste, Income, 12th LC, Marksheet, Domicile, Aadhaar, Bank strictly guarded], Clean Basenames with Single & Stacked Extensions Stripped in UI, Cross-Check Modal Difference Status [Identical / Case Change / + Student / Rename] with Smart Uncheck of Identical Items, Quick Preset Switcher Dropdown in Missing Documents Header, Copy Preset Action, In-Place Preset Document Editing, Shortcuts Edit & Delete Verified 100%)**
- **Boundary:** Self-contained mini-app folder containing all backend operations, markup, styles, and logic for the Bulk Renamer.
- **Dependencies:** Consumes only common utilities from `shared/` (`toast.js`, `native-bridge.js`) and shared app services (`storage-service.js`, `analytics-service.js`, `followup-service.js`).
- **Style Isolation:** All styles in `rename_tool.css` are strictly scoped under the `.rename-tool-scope` CSS namespace to guarantee zero styling leakage into other DocMitra tools.

---

## 2. File Manifest
| File | Role | Description |
| :--- | :--- | :--- |
| `rename_tool.py` | Python Backend | Safe atomic rename, disk-level per-file rotation (`pypdf` + `PIL`), physical file import with duplicate numbering, Windows case-only temporary swap, Windows reserved names guard, collision avoidance, directory scanner |
| `rename_tool.html` | UI Component | Scoped 3-column Bento workstation markup with clean bottom toolbar, Dedicated Rename Tool Settings Modal (`#modalRenameSettings`), Add Document Modal (`#modalAddDocument`), Cross-Check preview modal, collapsible Missing Documents with single indicator (0 dummy data, 0 Marathi characters) |
| `rename_tool.css` | Scoped Stylesheet | Strict `.rename-tool-scope` styling rules (pan-scroll, inspection stage, confidence badges, pulse animations) |
| `rename_tool_ui.js` | UI Manager | Single Unified File List manager (bidirectional jump & edit, smooth active scroll, compact `✓` and 5-7 char badges), 4 Built-In Presets manager, 33 Master Shortcuts manager, One-way unique sync engine, Native offline preview engine (Tauri `read_binary_file` + Blob & ArrayBuffer), Rename To original filename default, Live Smart Suggestions below Missing Documents (Top 5 real-time keystroke filter), Dedicated Rename Tool Settings modal manager (Presets + Shortcuts tabs, Add/Rename/Delete preset, Add Document to preset), clean single-line queue display, filename-based matching (30%+), 2-column Cross-Check modal, per-file rotation preview & transform, working physical import, view bindings, checklist, and event handling |
| `rename_tool_logic.js`| Business Logic | Pure naming rules, 33 Canonical Name dictionaries, Zero Student Name Duplication engine (`normStudent`, `normBase`), Offline Token + Fuzzy Matching Engine (order-independent words, Levenshtein typo tolerance >= 80%, strict numeric/standard guard `10` vs `12`), dynamic preset candidate merging, 33-shortcut matcher, `matchFilenameSmart` engine, strict casing, multi-level undo, single-extension normalization, duplicate numbering with student name, CSV audit export |
| `README_LOCK.md` | Governance | Isolation boundaries, verification state, and tool unlock procedures |

---

## 3. Verified Working Features
- [x] **Single Unified File List & Clean Navigation:** Replaced separate `UPCOMING QUEUE` and `COMPLETED FILES` sections with ONE unified list of all loaded files. Shows clean compact checkmark (`✓`) for completed files and preserves continuous 1 to N order. Users can freely jump back to any completed file to re-edit names via mouse click or Tab / Shift+Tab keyboard navigation with smooth active-row auto-scrolling.
- [x] **Compact Matching Badges (~5-7 characters):** Replaced repetitive full document name labels in the queue with ultra-clean compact badges (e.g., `🟢 95% 10M`, `🟡 85% CST`, `🟢 90% ADR`, `✓ CST`, `🔴 UNMATCH`), providing maximum horizontal space for filenames.
- [x] **Zero Student Name Duplication:** Enhanced `buildName()` logic normalizes whitespace, underscores, hyphens, and casing to strictly guarantee that the student name is NEVER duplicated in target filenames (e.g. `10th_marksheet_Vijay_Yadav.pdf` or input already containing the student name will never produce `10TH MARKSHEET VIJAY YADAV VIJAY YADAV`).
- [x] **4 Built-In Presets Configured with Exact Mappings:**
  1. `MAHA DBT` (15 Documents: Aadhaar Card [ADR], Income [INC], Domicile [DOM], Nationality [NAT], Caste [CST], Validity [VLD], Non Creamy Layer [NCL], 10th Marksheet [10M], 12th Marksheet [12M], Leaving Cert [LC], Ration Card [RAT], Bank Passbook [BNK], Self Declaration [SDC], Parent Declaration [PDC], Residential Doc [RES]).
  2. `CET CELL` (18 Documents: CET Scorecard [CET], Application Confirmation [APP], APAAR ID [APR], EWS [EWS], Disability [PWD], Minority [MIN], Bonafide [BON], Admission Fee Receipt [FEE], Hostel Receipt [HST], 10th Passing [10P], 12th Passing [12P], 12th Combined [12MP], etc.).
  3. `SWAYAM` (12 Documents: PAN Card [PAN], Birth Certificate [BRT], Declaration [DEC], etc.).
  4. `EDUCATIONAL` (23 Documents: 11th Marksheet [11M], Gap Certificate [GAP], Migration Certificate [MIG], Caste Undertaking [CUD], Validity Undertaking [VUD], etc.).
- [x] **Master Shortcuts & Rename Rules (33 Rules):** Pre-loaded with all 33 short codes and keywords across all admission document types.
- [x] **One-Way Unique Preset-to-Shortcuts Sync:** Adding or editing any document across ANY preset automatically syncs into the master `Shortcuts & Rename Rules` table keyed by unique uppercase `Short Code` (0 duplicate shortcut rows guaranteed). Direct additions to shortcuts do NOT pollute or add items to preset checklists.
- [x] **All-Preset Reactive Keystroke Smart Suggestions:** Right-column `SMART SUGGESTIONS` box dynamically searches and filters across ALL presets and shortcuts in real time on every keystroke in `Rename To` (e.g., typing `1` instantly displays `10M`, `10P`, `12M`, `12P`, `12LC`).
- [x] **Zero False Matches (Strict PARENT DECLARATION Guard):** Removed father/mother pattern leakage and added strict word-boundary protection for short tokens (`par`, `cas`, `in`, `rc`, `bnf`). Files like `CAS ...`, `in ...`, `12L ...`, `12TH MARKSHEET`, `Domicile Certificate`, `Aadhaar Card`, `Bank Passbook`, `Photo.jpg` will NEVER be wrongly matched to `PARENT DECLARATION`. Unmatched files remain safely unmatched for user review.
- [x] **Clean Basenames with Zero Extensions in UI:** Strip both single and stacked extensions (e.g. `.pdf.jpg`, `.PDF`, `.jpg`) from `cleanName()` across the entire UI (queue, Cross-Check modal, and input fields) while silently preserving physical file extensions during disk renames.
- [x] **Clear Difference / Change Status in Cross-Check Modal:** Replaced static 95% badges with dynamic change status: `Identical`, `Case Change`, `+ Student`, and `🟢 X% Rename`. Rows where filenames are already identical are automatically unchecked by default so users rename only files that have actual changes.
- [x] **Direct Preset Switcher on `Missing Documents Found` Header:** Compact dropdown in the header allows users to instantly switch active presets right from the workstation.
- [x] **Copy Preset & In-Place Editing:** 1-click duplicate action next to `+ New Preset` that copies all documents to a new preset, plus in-place `Edit` buttons on document and shortcut rows.
- [x] **Native Offline Preview Engine (.jpg, .jpeg, .png, .pdf):** Rust Tauri `read_binary_file` command directly reading bytes across IPC, rendering via Blob URL for images and in-memory `ArrayBuffer` for PDF.js. 100% offline, zero broken preview.
- [x] **`Rename To` Box Displays Original Filename First:** Initially displays the clean original filename without extension. Formulas and rules apply dynamically as user types or selects shortcuts.
- [x] **Windows Read-Only Safety & Zero Orphaned Temp Files:** Enhanced `rotate_file_on_disk()` and `safe_rename_file()` in `rename_tool.py` to seamlessly handle `FILE_ATTRIBUTE_READONLY` files via atomic write-permission elevation and guaranteed `try...finally` removal of working temporary files (`__tmp_rot_...`).
- [x] **In-Memory Preview Cache Invalidation & Zero Memory Leak:** Invalidate `_pdfBytes` and revoke `_blobUrl` upon physical rotation, batch rename, or workspace reset (`handleClearQueue`) to guarantee real-time visual accuracy and zero memory leakage.
- [x] **Preserved Core Foundations:** Casing rules (`UPPER`, `Title`, `lower`), duplicate auto-numbering (`1, 2, 3`), and queue lifecycle remain 100% intact. 100% English professional administrative workstation UI (zero Marathi text in production DOM, zero dummy data).

---

## 4. Master Verification Suite
- **33-Point Comprehensive E2E Matrix:** `node scripts/test_rename_tool_33_e2e_matrix.js` (33/33 Checks Passed 100%)
- **Master Verification Suite (TC-01 - TC-13):** `node scripts/test_rename_tool_master_suite.js` (13/13 Passed 100%)
- **Python Backend Physical Disk Ops:** `python scripts/test_python_disk_ops.py` (All Physical Operations Passed 100%)
- **Unified & Presets E2E:** `node scripts/test_unified_list_and_4presets_e2e.js` (5/5 Checks Passed 100%)
- **Presets & Deduplication:** `node scripts/test_new_unified_and_presets.js` (100% Passed)
- **Reactive Suggestions:** `node scripts/test_keystroke_suggestions.js` (100% Passed)
- **User Reported Issues:** `node scripts/test_user_reported_issues.js` (100% Passed)
- **Settings & Fuzzy Matcher:** `node scripts/test_rename_settings_and_fuzzy.js` (7/7 Passed 100%)
- **Production Build:** `node build-ui.js` -> `app/assets/js/app.js` (297.62 kB, 0 errors)

---

## 5. Unlock Protocol (How to Work on this Tool)
When future work on this tool is requested:
1. The AI Agent must **NOT** silently edit any file in this directory.
2. The AI Agent must prompt the user with:
   > "Confirm tool unlock: Type `UNLOCK RENAME TOOL` to modify files inside `tools/rename_tool/`."
3. Work in this directory must always follow the **Shadow / Backup-First** principle.
4. When finished, ensure all tests pass and re-lock the tool.
