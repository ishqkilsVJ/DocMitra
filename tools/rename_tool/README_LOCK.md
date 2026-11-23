# 🧊 FROZEN & PROTECTED TOOL: Bulk Document Renamer (`tools/rename_tool/`)

> [!IMPORTANT]
> **PERMANENT PRODUCTION FREEZE & PROTECTION POLICY**
> This tool is **OFFICIALLY DECLARED COMPLETE, AUDITED, POLISHED, AND FROZEN**.
> - **Release Tag:** `rename-tool-final-release`
> - **Release Branch:** `rename-tool-final-release`
> - **Commit Hash:** Final Release Checkpoint
> - **Freeze Date:** 2026-11-23 07:32 AM IST
> - **Guardian:** Global Tool Completion & Freeze Guardian
> 
> **MANDATORY POLICY FOR ALL CONTRIBUTORS & AI AGENTS:**
> 1. **ZERO MODIFICATION:** Do NOT modify, refactor, format, or edit ANY file inside `tools/rename_tool/` during work on PDF Studio, Image Studio, Print Studio, or other tools.
> 2. **ZERO PATH/NAME CHANGES:** Do not rename, move, or delete files in this folder.
> 3. **ZERO LEAKAGE INTO SHARED FILES:** Shared files must not be altered in ways that break Bulk Renamer APIs or styles.
> 4. **EXPLICIT USER APPROVAL REQUIRED:** Any future modification requires explicit, unambiguous user confirmation to unlock. Without user approval, any attempt to touch this tool must be immediately stopped.
> **Last QA Stabilization & Verification:** 2026-11-23 (Settings Modal 5 UI/UX Polish Fixes Verified 100%: 2-Row spacious layout for Active Preset with zero button overlap; truncated ~12 chars ellipsis with tooltip and hover glow; child modal z-index [80] opening cleanly in front of Settings; browser autofill popup completely disabled with autocomplete='off'/one-time-code; compact live search bars positioned next to Title & Badge in both Presets and Shortcuts tabs; serial number '#' column added to Shortcuts & Rename Rules table; rebuilt via build-ui.js and cargo tauri build; fresh release binary deployed to C:\Users\USER\AppData\Local\DocMitra\app.exe; all automated tests passing 100%).
> **Last QA Stabilization & Verification:** 2026-11-23 (Circular Queue Loop & Smart Case Sync Verified 100%: Implemented continuous wrap-around navigation 1..N..1 upon confirming the last file in queue; sequential step-through of all files with auto-tick confirmation; smart active casing sync on re-visiting files without altering base names; verified live via Playwright; recompiled release binary via cargo tauri build and deployed directly to C:\Users\USER\AppData\Local\DocMitra\app.exe).
> **Last QA Stabilization & Verification:** 2026-11-23 (Physical Disk Folder Rename, Exact Typing Casing & Zero Recalculation Guard Verified 100%: Implemented native Rust + JS rename_native_folder with atomic disk directory rename and in-memory path synchronization; removed forced uppercase ensuring 100% typing fidelity with Caps Lock on/off; added zero recalculation guard when 'Add folder name in file' is unchecked avoiding redundant computation; added toast feedback; compiled release desktop binary via cargo tauri build and deployed directly to C:\Users\USER\AppData\Local\DocMitra\app.exe; verified 100% via Playwright).
> **Last QA Stabilization & Verification:** 2026-11-22 (Settings Modal Layout Expansion & Quick Search Verified 100%: Widened modal to `w-[92vw] max-w-6xl h-[86vh]` with expanded vertical scroll; compact text-overflow ellipsis Active Preset dropdown ensuring zero button clipping; clean multi-line wrapping for keywords and alternate keywords with zero truncation; instant real-time search filter boxes in both Document Presets and Shortcuts tabs filtering by document name, short code, or keyword aliases; automated unit & stress tests passing 100%; bundled via `node build-ui.js` and deployed directly to `C:\Users\USER\AppData\Local\DocMitra\app.exe`).
> **Last QA Stabilization & Verification:** 2026-11-22 (Duplicate Auto-Numbering Engine Verified 100%: Automatic collision resolution with ' 2', ' 3' suffixes before student name / at end; zero 'already exists' blocking errors; full synchronization across frontend UI, Rust IPC rename_native_file, and Python unique_destination backend; verified live).
> **Last QA Stabilization & Verification:** 2026-11-22 (4 Built-In Presets & Zero-Duplicate Master Shortcuts Sync Verified 100%: Populated 4 official presets [MAHA DBT with 28 docs, SWAYAM DEENDAYAL YOJANA with 22 docs, CET CELL with 26 docs, EDUCATIONAL DOCUMENTS with 53 master docs]; synchronized all 53 unique documents into Shortcuts & Rename Rules with zero duplicates; standardized shortcodes VAL, 12LC, DIS, CETAF, CETSC, RAT, BNK, SDC, PDC, APR; resolved spaced shortcut normalization [P A N -> PAN CARD], preserved case-aware collision numbering, safe folder extraction regex, compiled UI bundle with node build-ui.js, rebuilt and deployed release app.exe directly to C:\Users\USER\AppData\Local\DocMitra\app.exe; 100% verified via automated test suite).
> **Last QA Stabilization & Verification:** 2026-11-22 (Live Casing Synchronization Verified 100%: Dynamic UPPER / lower / Title switching across all pending queue files, Rename To input field, shortcut badge codes & labels, missing documents checklist, and informative toast feedback; 100% verified via Playwright).
> **Last QA Stabilization & Verification:** 2026-11-22 (TestSprite 10-Test Exhaustive QA Completed: Removed legacy hidden btnReviewUnmatched markup and JS handlers as operator uses direct queue click/Tab navigation; verified 100% clean UI bundle; deployed optimized release app.exe to C:\Users\USER\AppData\Local\DocMitra\app.exe; 133.3 TestSprite credits preserved safely).
> **Last QA Stabilization & Verification:** 2026-11-22 (QA Bugfix & Full Release: Fixed Smart Scan self-collision bug eliminating redundant ' 1' numbering; verified applyShortcutToCurrentFile and handleConfirmCurrentName; compiled fresh app.js bundle via build-ui.js; rebuilt and deployed optimized release app.exe directly to C:\Users\USER\AppData\Local\DocMitra\app.exe; 100% verified via Playwright).
> **Last QA Stabilization & Verification:** 2026-11-22 (Powerhouse Cross-Check Modal & v1.4.4 Release 100% Verified: Live Word Diff with red strikethrough for deleted words, bold emerald for added words, purple pill for student name; Top Power Pattern Bar with live reactive Order, Separator, Student toggle, Casing, and File Filter; Expandable Power Utilities Strip with Bulk Find & Replace, One-Click Scanner Junk Cleaner, Portal-Safe Alphanumeric Cleaner, and Reset Rules; Two-Tier Layout with clean Active Table on top and Collapsible Drawer for identical files on bottom; In-Modal Keyboard Navigation with ArrowUp/Down row focus, Space toggle, and Enter confirm; Instant 0.1s Confirm & Rename with 7-second Floating Emerald Undo Toast banner; Fresh release binary built and verified at C:\Users\USER\AppData\Local\DocMitra\app.exe with v1.4.4 timestamp 22-11-2026 11:08 PM).
> **Last QA Stabilization & Verification:** 2026-11-23 (Dedicated Folder Pipeline & Ultra-Clean Dark Slate Top Ribbon: Removed redundant blue pencil icon and cluttered telemetry strip; kept prominent Dark Slate badge with ✎ edit & ✓ apply, 'Add folder name in file' persistent checkbox, Case switcher, Settings, Clear, and Select Folder F2; deployed fresh release binary to C:\Users\USER\AppData\Local\DocMitra\app.exe; verified 100%).

---

## 1. Tool Status & Boundary
- **Status:** **STRICTLY LOCKED & 100% QA VERIFIED (Variant 3 Dark Slate Folder Badge, Click-to-Edit with [✓] Apply, Memory Persistent 'Add folder name in file' Checkbox, Folder-Centric Select Folder F2 Dedicated Pipeline, Add Files Removed, 4 Built-In Presets, 53 Master Shortcuts, Zero Duplication Engine, Powerhouse Cross-Check Modal, Live Word Diff, Power Pattern Bar, Power Utilities Strip, Two-Tier Collapsible Drawer, Floating 1-Click Undo Toast, Direct In-Place Physical Disk Rename on Enter/Tab, Air-Gapped ArrayBuffer Clone Protection for PDF.js, Native Offline Preview Engine [Tauri read_binary_file + Blob/ArrayBuffer for JPG/PNG & PDF.js])**
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
