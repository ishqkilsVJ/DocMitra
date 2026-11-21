# 📦 RENAME TOOL FEATURE INVENTORY (वैशिष्ट्य यादी व स्थिती अहवाल)

> **दस्तऐवज निर्मिती दिनांक व वेळ:** 22 नोव्हेंबर 2026, पहाटे 02:35 IST  
> **प्रकल्प मार्ग (Project Path):** `E:\DocMitra`  
> **टूल मार्ग (Rename Tool Folder Path):** `E:\DocMitra\tools\rename_tool`  
> **Git Branch:** `master`  
> **Git Commit Hash:** `785759fe08698735936c965cd99dc5a70c873a5b`  

---

## १. सर्वसमावेशक वैशिष्ट्य सूची व स्थिती मॅट्रिक्स (Feature Matrix)

| क्र. | वैशिष्ट्य नाव (Feature) | संबंधित फाईल व फंक्शन | API / Endpoint | सध्याचे वर्तन (Current Behavior) | अपेक्षित वर्तन (Expected Behavior) | स्थिती (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| १ | **Add Files** | `rename_tool_ui.js` -> `handleAddFiles()` | `pick_native_files` (Tauri) / Input Fallback | एकाधिक फाईल्स निवडल्यास त्या थेट रांगेत जोडल्या जातात | फाईल्स रांगेत सुरक्षित जमा होणे | **WORKING** |
| २ | **Select Folder** | `rename_tool_ui.js` -> `handleSelectFolder()` | `list_native_directory` (Tauri) / Directory Picker | संपूर्ण फोल्डर स्कॅन करून सर्व वैध फाईल्स लोड केल्या जातात | फोल्डर पाथ व फाईल्स अचूक लोड होणे | **WORKING** |
| ३ | **Change Folder** | `rename_tool_ui.js` -> `handlePrevFolder()`, `handleNextFolder()` | Tauri IPC / Native Filesystem | पुढील किंवा मागील विद्यार्थी फोल्डरवर त्वरित नेव्हिगेट होते | फोल्डर इंडेक्स आणि काउंटर बदलणे | **WORKING** |
| ४ | **Original Filename Display** | `rename_tool_ui.js` -> `cleanName()` | इन-मेमरी | मूळ फाईलचे नाव एक्स्टेन्शनशिवाय स्वच्छ दिसते | UI मध्ये दुबार एक्स्टेन्शन न दिसणे | **WORKING** |
| ५ | **Active File Selection** | `rename_tool_ui.js` -> `selectFile(index)` | इन-मेमरी स्टेट मॅनेजर | निवडलेली फाईल निळ्या रंगात हायलाइट होते आणि प्रिव्ह्यू लोड होतो | इतर फाईल्सचे स्टेट न बदलता सक्रिय फाईल निवडणे | **WORKING** |
| ६ | **Single Unified File List** | `rename_tool_ui.js` -> `renderQueue()` | व्हर्च्युअल DOM रेंडरर | सर्व फाईल्स एकाच सलग १ ते N यादीत दिसतात | पूर्ण झालेल्या फाईल्सवर `✓` आणि कॉम्पॅक्ट बॅज दिसणे | **WORKING** |
| ७ | **Student Roster** | `rename_tool_ui.js` -> `handleSelectRosterStudent()` | LocalStorage / Roster Service | रोस्टरमधून निवडलेले नाव आपोआप लक्ष्य नावात जोडले जाते | नावाचे अचूक एकत्रीकरण | **WORKING** |
| ८ | **Document Code Input** | `rename_tool_ui.js` -> `targetInput` Event Handler | इन-मेमरी ट्रान्सलेटर | `ADR`, `10M` इत्यादी टाइप करताच क्षणात पूर्ण नाव बनते | जलद कीवर्ड मॅपिंग | **WORKING** |
| ९ | **Smart Suggestions** | `rename_tool_ui.js` -> `renderCoreShortcuts(query)` | इन-मेमरी फिल्टर | प्रत्येक अक्षरावर रिअल-टाइम टॉप ५ योग्य पर्याय दिसतात | अचूक आणि जलद पर्याय सुचवणे | **WORKING** |
| १० | **Fuzzy Typo Matching** | `rename_tool_logic.js` -> `matchFilenameSmart()` | Levenshtein अल्गोरिदम | `pasing` किंवा `marskheet` सारख्या स्पेलिंग चुका आपोआप सुधारल्या जातात | >= ८०% साम्य असल्यास अचूक ओळख | **WORKING** |
| ११ | **Strict Numeric Guard** | `rename_tool_logic.js` -> `matchFilenameSmart()` | व्हॅलिडेशन इंजिन | `10th` आणि `12th` मधील फरक काटेकोरपणे राखला जातो | १० वी आणि १२ वी मध्ये कधीही गल्लत न होणे | **WORKING** |
| १२ | **Native Offline Preview** | `rename_tool_ui.js` -> `renderCurrentPreview()` | `read_binary_file` (Rust Tauri) | JPG, PNG, PDF थेट बायनरी वाचून ऑफलाइन प्रिव्ह्यू होतो | इंटरनेटशिवाय १००% प्रिव्ह्यू दिसणे | **WORKING** |
| १३ | **Per-File Rotation** | `rename_tool_ui.js` -> `handleRotate(angle)` | CSS Transform + Python Backend | केवळ सक्रिय फाईल ९०°, १८०°, २७०° फिरते | इतर फाईल्सचे रोटेशन सुरक्षित राहणे | **WORKING** |
| १४ | **True Disk Rotation** | `rename_tool.py` -> `rotate_pdf_on_disk()`, `rotate_image_on_disk()` | `pypdf` + `PIL` | डिस्कवरील प्रत्यक्ष फाईल कायमस्वरूपी योग्य अंशात सेव्ह होते | डिस्क स्तरावर खरी फेरबदल होणे | **WORKING** |
| १५ | **Zero Student Duplication** | `rename_tool_logic.js` -> `buildName()` | सेफ स्ट्रिंग नॉर्मलायझर | फाईल नावात विद्यार्थ्याचे नाव आधीच असल्यास दुबार नाव जोडले जात नाही | अचूक एकेरी नाव राहणे | **WORKING** |
| १६ | **Duplicate Auto-Numbering** | `rename_tool_logic.js` -> `uniqueDestination()` | कोलिजन रिझॉल्व्हर | एकाच नावाच्या अनेक फाईल्स आल्यास ` 1`, ` 2` असा क्रम लागतो | फाईल ओव्हरराइट न होता सुरक्षित नंबरिंग | **WORKING** |
| १७ | **Single Extension Guard** | `rename_tool_logic.js` -> `cleanName()` | रेगुलर एक्स्प्रेशन | `.pdf.pdf` किंवा `.jpg.jpg` अशी दुबार एक्स्टेन्शन्स पूर्णपणे रोखली जातात | अचूक एकेरी एक्स्टेन्शन | **WORKING** |
| १८ | **Cross-Check Preview Modal** | `rename_tool_ui.js` -> `openCrossCheckModal()` | मोडल रेंडरर | 'Rename Matched' दाबल्यास जुने नाव विरुद्ध नवीन नाव तुलना दिसते | बॅच रीनेमपूर्वी पडताळणी मोडल उघडणे | **WORKING** |
| १९ | **Atomic Batch Rename** | `rename_tool_ui.js` -> `handleConfirmCrossCheckRename()` | `rename_native_file` / Python API | निवडलेल्या सर्व फाईल्स डिस्कवर एकाच वेळी रीनेम होतात | अणुप्रमाणे (Atomic) सुरक्षित रीनेम | **WORKING** |
| २० | **Strict Queue Lifecycle** | `rename_tool_ui.js` -> `executeBatchPlan()` | स्टेट मॅनेजर | डिस्कवर यश मिळाल्यावरच फाईल पूर्ण मानली जाते | अयशस्वी फाईल रांगेतच शिल्लक राहणे | **WORKING** |
| २१ | **Multi-Level Undo** | `rename_tool_logic.js` -> `UndoManager` | इन-मेमरी स्टॅक | 'Undo Rename' (Ctrl+Z) दाबल्यास फाईल्सचे जुने नाव पूर्ववत होते | आधीचे नाव अचूक पुनर्स्थापित होणे | **WORKING** |
| २२ | **Collapsible Missing Docs** | `rename_tool_ui.js` -> `renderMissingDocuments()` | DOM अकॉर्डियन | अपूर्ण कागदपत्रांची यादी पल्सिंग बॅजसह उघडता/बंद करता येते | कॉम्पॅक्ट आणि लक्षवेधी मांडणी | **WORKING** |
| २३ | **Quick Preset Switcher** | `rename_tool_ui.js` -> `renderMissingDocuments()` | सिलेक्ट ड्रॉपडाऊन | कामाच्या दरम्यान थेट MAHA DBT, CET, SWAYAM स्विच करता येते | रिअल-टाइम प्रीसेट बदलणे | **WORKING** |
| २४ | **Rename Settings Modal** | `rename_tool_ui.js` -> `openRenameSettingsModal()` | मोडल मॅनेजर | प्रीसेट्स आणि ३३ शॉर्टकट्स पूर्णपणे व्यवस्थापित (Add/Edit/Delete) करता येतात | संपूर्ण CRUD क्षमता | **WORKING** |
| २५ | **Bidirectional Tab Nav** | `rename_tool_ui.js` -> `handleQueueKeyNav()` | कीबोर्ड इव्हेंट हँडलर | `Tab` ने पुढील आणि `Shift+Tab` ने मागील फाईलवर जाऊन रीनेम करता येते | गुळगुळीत कीबोर्ड नेव्हिगेशन | **WORKING** |
| २६ | **Windows Reserved Names** | `rename_tool_logic.js` -> `validateFilename()` | ओएस व्हॅलिडेशन | `CON`, `PRN`, `AUX`, `NUL` अशी नावे वापरण्यास प्रतिबंध | सिस्टीम क्रॅश न होऊ देणे | **WORKING** |
| २७ | **Illegal Characters Block** | `rename_tool_logic.js` -> `validateFilename()` | ओएस व्हॅलिडेशन | `\ / : * ? " < > |` अक्षरे सुरक्षितपणे ब्लॉक केली जातात | वैध फाईल नाव सुनिश्चित करणे | **WORKING** |
| २८ | **Audit CSV Export** | `rename_tool_logic.js` -> `exportBatchAuditCSV()` | CSV जनरेटर | संपूर्ण बॅचच्या रीनेमिंगचा अहवाल टाइमस्टॅम्पसह डाऊनलोड होतो | प्रशासकीय ऑडिटसाठी नोंद | **WORKING** |
| २९ | **Persistent Presets** | `src/services/storage-service.js` | `config/document_presets.json` | ॲप रीस्टार्ट झाल्यानंतरही बदललेले प्रीसेट्स जतन राहतात | कायमस्वरूपी स्टोरेज सातत्य | **WORKING** |
| ३० | **Reset Workspace** | `rename_tool_ui.js` -> `handleClearQueue()` | स्टेट रीसेटर | एका क्लिकवर संपूर्ण रांग आणि प्रिव्ह्यू स्वच्छ होतो | फ्रेश स्थितीवर परतणे | **WORKING** |

---

## २. निष्कर्ष (Conclusion)

सर्व ३० मुख्य आणि सूक्ष्म वैशिष्ट्ये प्रत्यक्ष तपासणीमध्ये **WORKING (१००% कार्यरत)** स्थितीत आढळली आहेत. कोणत्याही महत्त्वाच्या वैशिष्ट्यामध्ये त्रुटी किंवा अडथळा (BLOCKED) आढळलेला नाही.
