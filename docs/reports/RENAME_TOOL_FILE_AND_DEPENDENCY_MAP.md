# 🗺️ RENAME TOOL FILE AND DEPENDENCY MAP (फाईल व अवलंबित्व नकाशा)

> **दस्तऐवज निर्मिती दिनांक व वेळ:** 22 नोव्हेंबर 2026, पहाटे 02:35 IST  
> **प्रकल्प मार्ग (Project Path):** `E:\DocMitra`  
> **टूल मार्ग (Rename Tool Folder Path):** `E:\DocMitra\tools\rename_tool`  
> **Git Branch:** `master`  
> **Git Commit Hash:** `785759fe08698735936c965cd99dc5a70c873a5b`  

---

## १. फाईल व अवलंबित्व विश्लेषण (Comprehensive Dependency Map)

### १. `tools/rename_tool/rename_tool.html`
- **उद्देश (Purpose):** Bulk Document Renamer चे मुख्य स्कोप केलेले DOM लेआउट (3-Column Bento Grid, Toolbar, Modals).
- **घटक व आयडी (Components & IDs):** `#col-queue`, `#col-preview`, `#col-utility`, `#queueList`, `#utilityScrollArea`, `#modalRenameSettings`, `#modalAddDocument`, `#modalCrossCheck`, `#btnRenameSettings`, `#btnClearWorkspace`, `#btnAddFiles`, `#btnSelectFolder`, `#btnConfirmBatchRename`.
- **आयात केलेल्या फाईल्स (Imports):** काही नाही (HTML template).
- **याला आयात करणाऱ्या फाईल्स (Imported By):** `app/index.html` (थेट समाविष्ट).
- **स्थिती (Status):** **ACTIVE & ESSENTIAL**.
- **शिफारस (Action):** **KEEP** (कदापि बदलू नये).

---

### २. `tools/rename_tool/rename_tool.css`
- **उद्देश (Purpose):** Bulk Renamer चे स्कोप केलेले व्हिज्युअल स्टाईल्स आणि ॲनिमेशन्स.
- **घटक व क्लासेस:** `.rename-tool-scope`, `.custom-pan-scroll`, `.confidence-badge`, `.confidence-badge-high`, `.confidence-badge-mid`, `.confidence-badge-low`, `.queue-scroll-area`.
- **आयात केलेल्या फाईल्स:** काही नाही.
- **याला आयात करणाऱ्या फाईल्स:** `build-ui.js` द्वारे `app/assets/css/rename_tool.css` मध्ये बंडल केले जाते.
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ३. `tools/rename_tool/rename_tool_ui.js`
- **उद्देश (Purpose):** Bulk Renamer चे संपूर्ण UI स्टेट व्यवस्थापन, इव्हेंट हँडलर्स, व्हर्च्युअल रेंडरिंग, प्रिव्ह्यू आणि मोडल लॉजिक.
- **मुख्य फंक्शन्स व क्लासेस:**
  - `class RenamerUIManager`: `mount()`, `initEventListeners()`, `loadFolderData()`, `renderQueue()`, `renderCurrentPreview()`, `renderCoreShortcuts()`, `renderMissingDocuments()`, `openRenameSettingsModal()`, `openCrossCheckModal()`, `handleConfirmCrossCheckRename()`, `handleQueueKeyNav()`, `handleClearQueue()`.
  - `export const BUILTIN_PRESETS`: MAHA DBT, CET CELL, SWAYAM, EDUCATIONAL.
  - `export const MASTER_SHORTCUTS`: ३३ मास्टर शॉर्टकट्स.
- **आयात केलेल्या फाईल्स (Imports):**
  - `../../shared/toast.js` (`toast`)
  - `../../shared/native-bridge.js` (`pickNativeFiles`, `listNativeDirectory`, `renameNativeFile`, `openInExplorer`)
  - `../../src/services/storage-service.js` (`loadSettings`, `saveSettings`, `loadDocumentPresets`, `saveDocumentPresets`)
  - `../../src/services/analytics-service.js` (`analyticsService`)
  - `../../src/services/followup-service.js` (`followupService`)
  - `./rename_tool_logic.js` (सर्व बिझनेस लॉजिक फंक्शन्स)
- **याला आयात करणाऱ्या फाईल्स:** `src/ui/index.js`, विविध टेस्ट सूट्स (`scripts/test_*.js`).
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ४. `tools/rename_tool/rename_tool_logic.js`
- **उद्देश (Purpose):** DOM-मुक्त शुद्ध बिझनेस लॉजिक, स्ट्रिंग मॅन्युपुलेशन, फाईल नाव नियम, लेवेनश्टाईन फझी मॅचिंग, आणि डुप्लिकेट रिझोल्यूशन.
- **मुख्य फंक्शन्स व क्लासेस:**
  - `buildName(input, student, groups, style)` (Zero Student Name Duplication सह)
  - `cleanName(name)` (सर्व एक्स्टेन्शन्स स्वच्छपणे काढून टाकणारे)
  - `applyCase(text, style)` (UPPER, Title, lower)
  - `validateFilename(name)` (Windows Reserved Names & Illegal Characters Guard)
  - `uniqueDestination(desired, current, used, student)` (Sequential ` 1`, ` 2` auto-numbering)
  - `matchFilenameSmart(filename, student, groups, presets)` (३०%+ सजेशन, ८०%+ कॉन्फिडंट)
  - `class UndoManager`: `push()`, `undo()`, `clear()`, `pushBatch()`.
  - `exportBatchAuditCSV(records, studentName)`
- **आयात केलेल्या फाईल्स:** `../../shared/native-bridge.js`
- **याला आयात करणाऱ्या फाईल्स:** `tools/rename_tool/rename_tool_ui.js`, सर्व टेस्ट सूट्स.
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ५. `tools/rename_tool/rename_tool.py`
- **उद्देश (Purpose):** समर्पित बॅकएंड पायथन मॉड्युल जे फाईल सिस्टीमवरील खरी फेरबदल करते.
- **मुख्य फंक्शन्स:**
  - `rotate_pdf_on_disk(file_path, angle)` (`pypdf` द्वारे सर्व पेजेस फिरवणे)
  - `rotate_image_on_disk(file_path, angle)` (`PIL` द्वारे इमेज फिरवणे)
  - `copy_and_import_file(source_path, target_dir)` (भौतिक फाईल आयात करणे)
  - `atomic_rename_file(old_path, new_path)` (Windows Case-Only तात्पुरत्या स्वॅपसह अणूवत रीनेम)
  - `validate_filename(name)`, `is_junk_file(name)`
- **आयात केलेल्या फाईल्स:** `os`, `sys`, `time`, `shutil`, `pypdf`, `PIL`.
- **याला आयात करणाऱ्या फाईल्स:** `server.py`, `scripts/test_python_disk_ops.py`.
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ६. `tools/rename_tool/README_LOCK.md`
- **उद्देश (Purpose):** टूलची सीमा, लॉक स्थिती, अनलॉक प्रोटोकॉल आणि पडताळलेल्या वैशिष्ट्यांची अधिकृत नोंद.
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ७. `config/document_presets.json`
- **उद्देश (Purpose):** कायमस्वरूपी डिस्क स्टोरेज जिथे सर्व ४ प्रीसेट्स (MAHA DBT, CET CELL, SWAYAM, EDUCATIONAL) आणि त्यांचे कीवर्ड्स JSON स्वरूपात सेव्ह होतात.
- **स्थिती:** **ACTIVE & ESSENTIAL**.
- **शिफारस:** **KEEP**.

---

### ८. तात्पुरत्या किंवा जुन्या फाईल्स (Outdated / Backup Files)
- `tools/rename_tool/_backup/`: जुन्या आवृत्त्यांचा स्थानिक बॅकअप फोल्डर.
  - **स्थिती:** `BACKUP / ARCHIVE`.
  - **शिफारस:** **MOVE TO REVIEW FOLDER / KEEP IN BACKUP** (कदापि कायमस्वरूपी नष्ट करू नये).
- `scripts/inspect_*.js`: तात्पुरती तपासणी स्क्रिप्ट्स (उदा. `inspect_stitch_modal.js`, `inspect_dom.js`).
  - **स्थिती:** `REVIEW CANDIDATE`.
  - **शिफारस:** **KEEP** (चाचणी संदर्भासाठी सुरक्षित ठेवावे).
