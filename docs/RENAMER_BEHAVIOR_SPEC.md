# 📜 DocMitra — Bulk Document Renamer Specification (`docs/RENAMER_BEHAVIOR_SPEC.md`)
**Version:** 1.5.0  
**Status:** Approved by User  
**Scope:** Bulk Document Renamer Workstation Shell & Business Logic Wiring  

---

## 1. Top Ribbon & Intake Controls

### 1.1 Intake Action Buttons
- **Layout Order:** Two distinct buttons in the top right ribbon:
  1. **Add Files** (`note_add` icon): Allows selecting individual files from any location (internal or external USB/network drive).
  2. **Select Folder** (`folder_open` icon, shortcut `F2`): Native OS folder picker to choose a student folder or batch parent directory.
- **Add Files Mode:** **In-Place Reference**. External files are added directly to the active queue from their source directory without copying into the local folder, allowing direct in-place atomic renaming.
- **Empty Folder Protection:** If the selected folder has 0 files, DocMitra displays a warning Toast (`"Selected folder is empty"`) and remains on the previous folder.

### 1.2 Folder Navigation in Batch Mode
- **In-Ribbon Folder Switcher:** When a parent directory with multiple student subfolders is loaded, the ribbon shows:
  - `<` (Previous Folder) button (`Ctrl+LeftArrow`)
  - Folder counter pill: `Folder X of Y: <Student_Folder_Name>`
  - `>` (Next Folder) button (`Ctrl+RightArrow`)
- **Directory Path Actions:**
  - Clicking the folder path text opens the folder directly in **Windows Explorer**.
  - Clicking the icon button next to the folder path triggers **Open Folder in Windows Explorer** (Tauri `shell:open`).
- **Background Auto-Watcher:** Automatically detects disk changes (e.g., newly scanned files or deleted files) and refreshes the queue without requiring manual rescan clicks.

### 1.3 Telemetry Strip
- **Simplified Metrics Strip:**
  - `Files:` Total count of valid document files.
  - `Ready:` Count of matched/ready files.
  - `Unmatched:` Count of files requiring operator assignment.
  *(Omitted total size and time-saved metrics to maintain an uncluttered operator workspace).*

---

## 2. File Filtering & Safety

### 2.1 File System Junk Blacklist
- The renamer strictly hides and ignores:
  - `Thumbs.db`, `ehthumbs.db`
  - `desktop.ini`
  - `.DS_Store`
  - Hidden dot-files starting with `.`
  - Microsoft Office temporary lock files starting with `~$`
  - Temporary files ending in `.tmp`
- **Supported Documents:** All real admission documents (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.docx`, `.doc`, etc.) are displayed.

---

## 3. Active Queue & Card Layout

### 3.1 Base Name Only in Edit Field
- The "Rename To:" text input displays **ONLY the filename without extension** (e.g. `vijay yadav` or `12TH MARKSHEET Vijay Ramesh Yadav`).
- The file extension (e.g. `.pdf`, `.jpg`) is displayed as a **locked pill badge** on the right side of the input box so the operator can never accidentally corrupt or erase it.

### 3.2 Real-Time Keystroke Filtering
- Live keystroke intercept blocks illegal Windows filename characters (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with a brief tooltip warning.

### 3.3 Status & Metadata
- **Binary Status Tag:** Displays clean binary indicator: Green `Matched` or Red `Unmatched`.
- **Original Filename Click:** Clicking the `Original: <filename>` label instantly resets the input box back to the clean original name.

---

## 4. Keyboard Speed & Execution Workflow

### 4.1 Tab-Driven Atomic Execution
- A file is renamed on disk **immediately and atomically when `Tab` or `Enter` is pressed**.
- Unprocessed files (where Tab was not pressed or no match occurred) remain completely unchanged with their original names on disk.
- Switching folders leaves untouched files safe with zero accidental batch renames.

### 4.2 Enter Key
- Pressing `Enter` inside the edit box is **identical to Tab**: it validates the name, performs the atomic rename on disk, and advances to the next pending file.

### 4.3 Shift+Tab Navigation
- Pressing `Shift+Tab` navigates backwards to the **previous file card** in the queue, focusing its text input.

### 4.4 Queue Auto-Scroll
- **Pin Active Card to Top:** When focus advances, the queue container scrolls so the newly active card is pinned to the top of the queue viewport.

### 4.5 Upcoming & Completed Queue Interactions
- **Upcoming Queue:** Clicking any upcoming file card immediately loads it into the Active Card, renders its preview on the canvas, and focuses the edit box.
- **Completed Files:** Clicking any completed file (with green checkmark) re-opens it in the Active Card so the operator can re-rename it if needed.

---

## 5. 21-Shortcut Keyword Engine

### 5.1 One-Click Instant Rename
- Clicking any of the 21 shortcut buttons (`10M`, `12M`, `12LC`, `ADR`, `PAN`, `DOM`, `INC`, etc.) triggers an **instant atomic rename on disk** and immediately advances to the next file.

### 5.2 21 Canonical Shortcuts Reference Table
| Code | Output Name | Description |
| :--- | :--- | :--- |
| `ADR` | `AADHAAR CARD` | Aadhaar Card (both sides) |
| `PAN` | `PAN CARD` | PAN Card |
| `PIC` | `PHOTO` | Student Passport Photo |
| `10M` | `10TH MARKSHEET` | SSC / 10th Marksheet |
| `10P` | `10TH PASSING CERTIFICATE` | 10th Passing Certificate |
| `12M` | `12TH MARKSHEET` | HSC / 12th Marksheet |
| `12P` | `12TH PASSING CERTIFICATE` | 12th Passing Certificate |
| `12LC` | `12TH LC` | 12th Junior College Leaving Certificate |
| `12MP` | `12TH MARKSHEET AND PASSING` | Combined 12th Mark & Passing |
| `CST` | `CASTE CERTIFICATE` | Caste / Tribe Certificate |
| `VLD` | `VALIDITY CERTIFICATE` | Caste / Tribe Validity Certificate |
| `DOM` | `DOMICILE CERTIFICATE` | Maharashtra State Domicile Certificate |
| `NAT` | `NATIONALITY CERTIFICATE` | Indian Nationality Certificate |
| `INC` | `INCOME CERTIFICATE` | Tahsildar Income Certificate |
| `BNK` | `PASSBOOK BANK` | Bank Passbook First Page / Cancelled Cheque |
| `ATM` | `ATTEMPT CERTIFICATE` | Attempt Certificate |
| `BRT` | `BIRTH CERTIFICATE` | Birth Certificate / Nagar Palika |
| `BNF` | `BONAFIDE CERTIFICATE` | College / School Bonafide Certificate |
| `GAP` | `GAP CERTIFICATE` | Educational Gap Affidavit / Certificate |
| `SLF` | `SELF DECLARATION` | Student Self Declaration |
| `PAR` | `PARENT DECLARATION` | Parent Declaration |
| `CAP` | `CAP ALLOTMENT LETTER` | State CET Cell CAP Allotment Letter |

---

## 6. Architecture & Implementation Mapping

| Stitch UI Element | Approved Behavior | Implementation Location |
| :--- | :--- | :--- |
| `btnSelectFolder` | Native folder picker (F2), batch subfolder detection | `src/ui/renamer-ui.js:handleSelectFolder` |
| `btnAddFiles` | In-place external file append | `src/ui/renamer-ui.js:handleAddFiles` |
| `btnPrevFolder` / `btnNextFolder` | In-ribbon folder switcher with `Ctrl+Left/Right` | `src/ui/renamer-ui.js:navigateFolder` |
| Folder Path & Explorer Icon | Reveals path in native Windows Explorer | `src/ui/renamer-ui.js:openFolderInExplorer` |
| Telemetry Strip | Files, Ready, Unmatched simplified metrics | `src/ui/renamer-ui.js:updateTelemetry` |
| `inputRenameTarget` | Base name only, locked `.ext` badge, live illegal char blocker | `src/ui/renamer-ui.js:renderQueue` |
| `Tab` / `Enter` Keys | Immediate atomic rename + auto-advance | `src/ui/renamer-ui.js:handleConfirmCurrentName` |
| `Shift+Tab` Key | Backward navigation to previous card | `src/ui/renamer-ui.js:_bindKeyboardShortcuts` |
| Preset Shortcut Buttons | One-click instant rename on disk + advance | `src/ui/renamer-ui.js:applyShortcutToCurrent` |
| Upcoming Queue Cards | Click to jump to active card & focus | `src/ui/renamer-ui.js:renderQueue` |
| Completed Queue Cards | Click to re-open in active card for re-renaming | `src/ui/renamer-ui.js:renderQueue` |
| Original Filename Label | Click to reset input to original base name | `src/ui/renamer-ui.js:renderQueue` |
