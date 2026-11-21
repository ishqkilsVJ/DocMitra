# 📋 दस्तऐवज नाव बदल साधन (Bulk Document Renamer) — मास्टर अंमलबजावणी व ऑडिट आराखडा

**दस्तऐवज संदर्भ:** `docs/RENAME_TOOL_MASTER_PLAN.md`  
**प्रकल्प:** DocMitra (महाराष्ट्र ॲडमिशन आणि महसूल डेस्क वर्कस्टेशन)  
**ऑडिट प्रकार:** रीड-ओन्ली सखोल आर्किटेक्चरल तपासणी, रूट कॉज विश्लेषण आणि ४-टप्प्यांचा मास्टर प्लॅन  
**स्थिती:** ऑपरेटर पुनरावलोकन व मंजुरीसाठी सादर (Pending User Approval)  
**सुरक्षा नियम:** `AGENTS.md` Rule 1, 2, 3 आणि 4 चे १००% पालन (कोणताही ॲप्लिकेशन कोड बदललेला नाही; `tools/rename_tool/` लॉक कायम आहे).

---

## 📑 अनुक्रमणिका
1. [कार्यक्षेत्र आणि सीमा (Scope & Architectural Boundaries)](#1-कार्यक्षेत्र-आणि-सीमा-scope--architectural-boundaries)
2. [सध्याचे वर्तन आणि मूळ कारण विश्लेषण (Current Behavior & Root Cause Audit)](#2-सध्याचे-वर्तन-आणि-मूळ-कारण-विश्लेषण-current-behavior--root-cause-audit)
   - [टप्पा १: तळाचा बार क्लिनअप व 'Rename All' बटण प्रायॉरिटी](#टप्पा-१-तळाचा-बार-क्लिनअप-व-rename-all-बटण-प्रायॉरिटी)
   - [टप्पा २: एक्स्टेन्शन-मुक्त UI, कडक क्यू लाइफसायकल व सेफ डुप्लिकेट्स](#टप्पा-२-एक्स्टेन्शन-मुक्त-ui-कडक-क्यू-लाइफसायकल-व-सेफ-डुप्लिकेट्स)
   - [टप्पा ३: पर-फाइल रोटेशन (डिस्क आउटपुट) आणि सिंगल-एक्स्टेन्शन कोड रीनेम फिक्स](#टप्पा-३-पर-फाइल-रोटेशन-डिस्क-आउटपुट-आणि-सिंगल-एक्स्टेन्शन-कोड-रीनेम-फिक्स)
   - [टप्पा ४: डायनॅमिक प्रिसिट्स, कायमस्वरूपी स्टोरेज, कोलॅप्सिबल विभाग आणि खरा इंपोर्ट](#टप्पा-४-डायनॅमिक-प्रिसिट्स-कायमस्वरूपी-स्टोरेज-कोलॅप्सिबल-विभाग-आणि-खरा-इंपोर्ट)
   - [अतिरिक्त वैशिष्ट्य: सिक्वेन्शियल वन-बाय-वन लाइव्ह स्मार्ट स्कॅन](#अतिरिक्त-वैशिष्ट्य-सिक्वेन्शियल-वन-बाय-वन-लाइव्ह-स्मार्ट-स्कॅन)
3. [टप्प्याटप्प्याने अंमलबजावणी आराखडा (4-Phase Implementation Plan)](#3-टप्प्याटप्प्याने-अंमलबजावणी-आराखडा-4-phase-implementation-plan)
   - [Phase 1: Bottom Bar Cleanup & High-Visibility 'Rename All'](#phase-1-bottom-bar-cleanup--high-visibility-rename-all)
   - [Phase 2: Extension-Free UI, Strict Queue Lifecycle & Duplicate Numbering](#phase-2-extension-free-ui-strict-queue-lifecycle--duplicate-numbering)
   - [Phase 3: True Per-File Disk Rotation & Single-Extension Safe Renamer](#phase-3-true-per-file-disk-rotation--single-extension-safe-renamer)
   - [Phase 4: Dynamic Settings Presets, Collapsible Missing Docs & Functional Import](#phase-4-dynamic-settings-presets-collapsible-missing-docs--functional-import)
   - [Sequential One-by-One Live Streaming Smart Scan डिझाइन](#sequential-one-by-one-live-streaming-smart-scan-डिझाइन)
4. [चाचणी आराखडा (End-to-End Test Plan)](#4-चाचणी-आराखडा-end-to-end-test-plan)
5. [मंजूरी आणि स्पष्टीकरणासाठी प्रश्न (Pending Decisions & Approval Questions)](#5-मंजूरी-आणि-स्पष्टीकरणासाठी-प्रश्न-pending-decisions--approval-questions)

---

## 1. कार्यक्षेत्र आणि सीमा (Scope & Architectural Boundaries)

1. **कडक कार्यक्षेत्र मर्यादा (Strict Scope Boundaries):**
   - हे कार्य **फक्त आणि फक्त** रीनेम टूल (`tools/rename_tool/`) आणि मुख्य सेटिंग्जमधील डॉक्युमेंट प्रिसिट कॉन्फिगरेशन (`src/ui/settings-ui.js`, `src/services/storage-service.js`, `server.py`) यापुरतेच मर्यादित आहे.
   - **Dashboard, PDF Studio, Image Studio, Print Studio, किंवा Follow-up Desk** या कोणत्याही घटकास अजिबात स्पर्श केला जाणार नाही आणि कोणताही बदल नियोजित केला जाणार नाही.
2. **सध्याच्या कार्यरत लॉजिकचा १००% पुनर्वापर:**
   - अस्तित्वात असलेले सर्व २१ शॉर्टकट्स (`ADR`, `10M`, `DOM`, `CST`, इ.), OCR कॉन्फिडन्स इंजिन, स्टुडंट रोस्टर डिटेक्शन, केसिंग स्टाईल्स (`UPPER`, `Title`, `lower`, `preserve`) आणि डुप्लिकेट नंबरिंग सूत्रे हे सर्व अबाधित ठेवले जातील; कोणताही नवीन नियम किंवा श्रेणी मनमानीपणे जोडली जाणार नाही.
3. **सुरक्षितता आणि लॉक धोरण (`AGENTS.md` Rule 1 & Rule 2):**
   - या ऑडिट टप्प्यात कोणताही प्रॉडक्शन कोड बदललेला नाही. प्रत्यक्ष बदलांसाठी ऑपरेटरची स्पष्ट मान्यता (`UNLOCK RENAME TOOL`) आवश्यक राहील.

---

## 2. सध्याचे वर्तन आणि मूळ कारण विश्लेषण (Current Behavior & Root Cause Audit)

### टप्पा १: तळाचा बार क्लिनअप व 'Rename All' बटण प्रायॉरिटी
* **तपासलेल्या फाईल्स व कोड संदर्भ:**
  - [tools/rename_tool/rename_tool.html](file:///e:/DocMitra/tools/rename_tool/rename_tool.html#L154-L200) (तळातील `<footer>` स्ट्रिप)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L203-L248) (इव्हेंट बाइंडिंग्स)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L2449-L2471) (`handleSaveBatch`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L2472-L2530) (`handleExportAudit`)
* **सध्याचे वर्तन:**
  - तळातील फुटरमध्ये सध्या ८ वेगवेगळी बटणे एकाच ओळीत दाटीवाटीने बसवली आहेत: `btnUndoRename`, `btnKeepOriginal`, `btnSmartScanBatch`, `btnRenameMatched`, `btnReviewUnmatched`, `btnSaveBatch`, `btnExportAudit`, आणि `btnRenameAll`.
  - प्रत्येक बटणावर कीबोर्ड शॉर्टकट लेबल्स (`<kbd>Ctrl+Z</kbd>`, `<kbd>Tab</kbd>`, `<kbd>F4</kbd>`, `<kbd>Ctrl+S</kbd>`, `<kbd>F9</kbd>`, `<kbd>F8</kbd>`) दाखवले आहेत, ज्यामुळे तळाची पट्टी गोंधळाची वाटते.
  - सर्वात महत्त्वाचे मुख्य क्रिया बटण असलेले `btnRenameAll` (सर्व फाइल्स रीनेम करणे) हे उजव्या कोपऱ्यात इतर बटणांच्या गर्दीत लहान आकारात अडकले आहे.
  - `btnSaveBatch` केवळ `localStorage` मध्ये एक स्नॅपशॉट लिहितो (L2468), तर `btnExportAudit` केवळ एक टेक्स्ट/CSV ऑडिट रिपोर्ट डाऊनलोड करतो. ही दुय्यम कामे मुख्य वर्कफ्लोच्या आड येत आहेत.
* **मूळ कारण (Root Cause):**
  - फुटर लेआउट हा `flex-nowrap justify-between overflow-x-auto min-h-[52px]` प्रकारात बनवला असून सर्व ऑपरेशन्स एकाच लेव्हलवर दाखवल्याने व्हिज्युअल प्रायॉरिटी नष्ट झाली आहे.
  - 3-कॉलम वर्कस्टेशन कंटेनर (`#workspace-columns-container`) वर ५२ पिक्सेलची जागा फुटरमुळे व्यापली जाते.

---

### टप्पा २: एक्स्टेन्शन-मुक्त UI, कडक क्यू लाइफसायकल व सेफ डुप्लिकेट्स
* **तपासलेल्या फाईल्स व कोड संदर्भ:**
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1238) (`origVal.textContent = currentFile.name`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1401) (`const upcomingFiles = this.state.files.filter((_, i) => i > this.state.currentIndex && !_.isRenamed && !_.isKept)`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1429) (`item.title = "Original: ${f.name} (Click to jump & edit)"`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1475) (`const completedFiles = this.state.files.filter(f => f.isRenamed || f.isKept)`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L2141-L2165) (`handleKeepOriginal`)
  - [tools/rename_tool/rename_tool_logic.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_logic.js#L709-L745) (`uniqueDestination`)
  - [tools/rename_tool/rename_tool_logic.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_logic.js#L1103) (`item.file.name = item.next` — `res.name` ऐवजी इनपुटचे नाव सेट करणे)
  - [tools/rename_tool/rename_tool.py](file:///e:/DocMitra/tools/rename_tool/rename_tool.py#L181-L189) (`batch_rename_files` — `student_name` ड्रॉप होणे)
  - [src/services/native-bridge-service.js](file:///e:/DocMitra/src/services/native-bridge-service.js#L289) (`body: JSON.stringify({ oldPath, newName })` — `studentName` ड्रॉप होणे)
  - [server.py](file:///e:/DocMitra/server.py#L297) व [L339](file:///e:/DocMitra/server.py#L339) (`rename_native_file` कॉल्स — `studentName` ड्रॉप होणे)
* **सध्याचे वर्तन:**
  1. *एक्स्टेन्शन दिसणे:* Active Hero कार्डमध्ये `Original:` लेबलच्या समोर संपूर्ण नाव एक्स्टेन्शनसह (उदा. `Student_Marksheet.pdf`) दिसते. तसेच `Upcoming Queue` मधील आयटम टूलटिपमध्येही मूळ एक्स्टेन्शन दिसते.
  2. *क्यू गायब होणे (Queue Disappearance Bug):*
     - लाइन १४०१ मध्ये `i > this.state.currentIndex` अट असल्यामुळे, ऑपरेटरने क्यूमधील ३ ऱ्या फाइलवर क्लिक केल्यास इंडेक्स ०, १ आणि २ वरील फाइल्स अद्याप रीनेम झालेल्या नसतानाही क्यूमधून पूर्ण गायब होतात!
     - लाइन २१४६ मध्ये `handleKeepOriginal()` फाइलवर `isKept = true` सेट करते, ज्यामुळे लाइन १४७५ नुसार ती फाइल डिस्कवर नाव बदलले नसतानाही थेट `Completed Files` मध्ये गणली जाते!
  3. *डुप्लिकेट हँडलिंग व स्टुडंट नेम गहाळ होणे:*
     - पायथन बॅकएंडमधील `safe_rename_file(old_path, new_name, student_name)` मध्ये `student_name` स्वीकारण्याची सोय आहे. परंतु `batch_rename_files` (L187), `native-bridge-service.js` (L289) आणि `server.py` (L297, L339) हे तिघेही `studentName` पुढे पाठवतच नाहीत!
     - परिणामी, डुप्लिकेट आल्यास पायथन बॅकएंड विद्यार्थ्याचे नाव न मिळाल्यामुळे `10TH MARKSHEET 1.pdf` असे नाव तयार करतो, जे प्रोजेक्टच्या `10TH MARKSHEET 1 RAHUL PATIL.pdf` या नियमाशी विसंगत ठरते.
     - तसेच बॅच रीनेम झाल्यावर `rename_tool_logic.js` च्या लाइन ११०३ वर `item.file.name = item.next` सेट केले जाते, ज्यामुळे जर बॅकएंडने फाइलला `res.name` (ऑटो-इन्क्रिमेंटेड नाव) दिले असेल, तरी UI मध्ये जुने इनपुट नावच राहून UI व डिस्कमधील ताळमेळ बिघडतो.
* **मूळ कारण (Root Cause):**
  - व्हिज्युअल घटकांवर `cleanName()` चा वापर न होणे.
  - क्यूच्या फिल्टरिंग लॉजिकमध्ये कर्सर इंडेक्स (`i > currentIndex`) आणि डिस्क वरील खरे यश (`isRenamed === true`) यांची गल्लत होणे.
  - फ्रंटएंड आणि बॅकएंड एपीआय कॉल्सदरम्यान `studentName` पॅरामीटर ड्रॉप होणे.

---

### टप्पा ३: पर-फाइल रोटेशन (डिस्क आउटपुट) आणि सिंगल-एक्स्टेन्शन कोड रीनेम फिक्स
* **तपासलेल्या फाईल्स व कोड संदर्भ:**
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L104) (`rotation: 0` इन `this.state`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L449-L454) (`btnRotate.addEventListener`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L585) (`stage.style.transform = ... rotate(...)`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1334-L1368) (`targetInput input event`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L2027-L2049) (`handleConfirmCurrentName`)
  - [tools/rename_tool/rename_tool_logic.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_logic.js#L628-L638) (`cleanName` आणि `ext`)
  - [src/modules/pdf-studio.js](file:///e:/DocMitra/src/modules/pdf-studio.js#L343-L386) (`rotatePdfDocument`)
* **सध्याचे वर्तन:**
  1. *ग्लोबल रोटेशन समस्या:* रोटेशन स्टेट ही प्रत्येक फाइलच्या ऑब्जेक्टवर (`f.rotation`) न ठेवता संपूर्ण टूलच्या ग्लोबल स्टेटवर (`this.state.rotation`) ठेवली आहे. यामुळे फाइल १ रोटेट केली की फाइल २, ३ सर्वांवर तोच अँगल जबरदस्तीने लागू होतो.
  2. *केवळ बनावट CSS रोटेशन (Preview Only):* रोटेशन हे केवळ `stage.style.transform` फिरवते. पायथन बॅकएंड किंवा डिस्कवर फाइल प्रत्यक्षात रोटेट होतच नाही. सेव्ह केल्यानंतर डिस्कवरील मूळ PDF किंवा JPG फाइल पूर्वीसारखीच उलटी राहते!
  3. *डबल एक्स्टेन्शन बग (उदा. `ADR.pdf.pdf`):*
     - लाइन २०२७ मधील `targetFilename.endsWith(currentExt)` ही तपासणी केस-सेन्सिटिव्ह आहे. जर फाइल `.PDF` असेल आणि `currentExt` `.pdf` असेल तर हे `false` येते.
     - त्यामुळे `baseTyped` मध्ये एक्स्टेन्शन राहून जाते (`ADR.PDF`).
     - लाइन २०३२ मधील `exactShortcut` चेक करताना `s.code.toLowerCase() === baseTyped.toLowerCase()` हे `'adr' === 'adr.pdf'` असल्यामुळे फेल होते!
     - परिणामी, सिस्टीम त्याला शॉर्टकट न मानता 'कस्टम नाव' मानते आणि पुढे पुन्हा स्टुडंट नेम व एक्स्टेन्शन जोडते, ज्यामुळे `ADR.PDF RAHUL PATIL.pdf` किंवा `.pdf.pdf` असा भयानक गोंधळ निर्माण होतो.
* **मूळ कारण (Root Cause):**
  - फाइल डेटा मॉडेलमध्ये स्वतंत्र `rotation: 0` प्रॉपर्टी नसणे.
  - बॅकएंडला रोटेशन अँगल न पाठवणे आणि डिस्कवर फाइल राइट न करणे.
  - केस-सेन्सिटिव्ह `endsWith` मुळे कोड इनपुटचे चुकीचे विश्लेषण होणे.

---

### टप्पा ४: डायनॅमिक प्रिसिट्स, कायमस्वरूपी स्टोरेज, कोलॅप्सिबल विभाग आणि खरा इंपोर्ट
* **तपासलेल्या फाईल्स व कोड संदर्भ:**
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1593) (`DEFAULT_CHECKLISTS_DATA["MAHA DBT FORM"]`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1611-L1685) (मिसिंग डॉक्स रेंडरिंग)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1686-L1751) (ड्यू-डेट पिकर मेनू)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L1789-L1826) (`btnImport.onclick`)
  - [src/ui/settings-ui.js](file:///e:/DocMitra/src/ui/settings-ui.js#L307-L365) (`renderChecklists`)
  - [src/services/storage-service.js](file:///e:/DocMitra/src/services/storage-service.js#L89-L128) (`loadSettings`)
  - [server.py](file:///e:/DocMitra/server.py) (फाइल कॉपी/मूव्ह एंडपॉईंट नसणे)
* **सध्याचे वर्तन:**
  1. *हार्डकोडेड प्रिसिट्स व तुटलेले लिंकेज:* `rename_tool_ui.js` थेट `DEFAULT_CHECKLISTS_DATA["MAHA DBT FORM"]` वाचतो. मुख्य सेटिंग्जमधील प्रिसिट्सचा रीनेम टूलशी कोणताही थेट संबंध नाही. सेटिंग्जमध्ये कोड (`10M`), ॲड/एडिट/डिलीट आणि Required/Optional चे पर्याय नाहीत.
  2. *ब्राउझर स्टोरेजचा धोका:* सध्या सर्व सेटिंग्ज `localStorage` मध्ये सेव्ह होतात. ब्राउझर कॅश क्लिअर होताच किंवा पोर्ट बदलताच सर्व डेटा फॅक्टरी डीफॉल्टवर रीसेट होतो.
  3. *मिसिंग डॉक्स विभाग नेहमी उघडा राहणे:* १०-१२ कागदपत्रे नसतील तर कॉलम ३ मधील संपूर्ण जागा मिसिंग लिस्ट व्यापून टाकते.
  4. *आभासी 'Import Document' बटण (Fake Import):*
     - युझरने 'Import' बटण दाबून बाहेरची फाइल निवडल्यास, कोड केवळ जावास्क्रिप्टच्या इन-मेमरी अरेमध्ये एक काल्पनिक ऑब्जेक्ट जोडतो (L1801-L1818).
     - ती फाइल प्रत्यक्षात स्टुडंट फोल्डरमध्ये डिस्कवर कॉपी किंवा मूव्ह होत नाही! त्यामुळे नंतर जेव्हा युझर प्रिव्ह्यू पाहण्याचा किंवा रीनेम करण्याचा प्रयत्न करतो तेव्हा फाइल न सापडल्याने एरर येतो.
* **मूळ कारण (Root Cause):**
  - सेंट्रलाइज्ड JSON फाइल स्टोरेजचा अभाव.
  - बॅकएंडमध्ये डिस्कवर सेफ फाइल कॉपी/मूव्ह करण्यासाठी कोणतीही सुविधा नसणे.

---

### अतिरिक्त वैशिष्ट्य: सिक्वेन्शियल वन-बाय-वन लाइव्ह स्मार्ट स्कॅन
* **तपासलेल्या फाईल्स व कोड संदर्भ:**
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L2312-L2383) (`handleSmartScanBatch`)
  - [tools/rename_tool/rename_tool_ui.js](file:///e:/DocMitra/tools/rename_tool/rename_tool_ui.js#L909-L913) (`loadFolderData`)
* **सध्याचे वर्तन:**
  - जेव्हा स्मार्ट स्कॅन चालवला जातो, तेव्हा बॅकएंडला एकाच लूपमध्ये सर्व फाइल्सचे OCR केले जाते.
  - या लूपदरम्यान DOM अपडेट होत नाही आणि संपूर्ण बॅच स्कॅन होईपर्यंत स्क्रीन स्तब्ध राहते.
  - सर्व फायली संपल्यावरच शेवटी संपूर्ण क्यू एकदम रिफ्रेश होते. फाइल #१ चे निकाल पाहण्यासाठी युझरला सर्व फायली पूर्ण होईपर्यंत थांबावे लागते.
  - नवीन फाइल जोडल्यास किंवा ऑपरेटरने पुन्हा 'Scan' दाबल्यास चालू स्कॅन रद्द करण्यासाठी कोणतेही कॅन्सलेशन टोकन (`AbortController`) उपलब्ध नाही.
* **मूळ कारण (Root Cause):**
  - असिंक्रोनस रो-लेव्हल रेंडरिंगचा अभाव आणि लूपच्या आत DOM अपडेट न करणे.

---

## 3. टप्प्याटप्प्याने अंमलबजावणी आराखडा (4-Phase Implementation Plan)

### Phase 1: Bottom Bar Cleanup & High-Visibility 'Rename All'

1. **तळातील अनावश्यक घटकांची पूर्ण स्वच्छता:**
   - [tools/rename_tool/rename_tool.html](file:///e:/DocMitra/tools/rename_tool/rename_tool.html#L154-L200) मधील सर्व कीबोर्ड शॉर्टकट लेबल्स (`<kbd>` टॅग्स जसे की `Ctrl+Z`, `Tab`, `F4`, `Ctrl+S`, `F9`, `F8`) कायमचे काढून टाकणे.
   - कीबोर्ड शॉर्टकट्स (उदा. `Ctrl+Z`, `Tab`, `F8`) हे बॅकग्राउंडला नेहमीप्रमाणे कार्यरत राहतील, परंतु त्यांचा व्हिज्युअल कचरा बटणांवर दिसणार नाही.
2. **क्रियांचा प्राधान्यक्रम आणि मांडणी:**
   - तळाच्या बारची पुनर्रचना:
     - **डावी बाजू (सुरक्षा/पूर्ववत):** `Undo Rename` (पूर्वी केलेले नाव बदल मागे घेणे) आणि `Keep Original & Next` (फाइल मूळ नावासह पुढे जाणे).
     - **मध्य बाजू (OCR माहिती):** `Smart Scan` आणि `Rename Matched (X)` (केवळ उच्च अचूकता असलेल्या फाइल्स रीनेम करणे).
     - **उजवी बाजू (मुख्य मास्टर ॲक्शन):** **`Rename All`** बटण हे हिरव्या/प्रायमरी रंगात मोठे, ठळक आणि लक्षवेधी बनवणे (`h-11 px-7 text-[15px] font-bold shadow-lg rounded-xl`).
   - दुय्यम बटणे (`Save Batch` आणि `Export Audit Report`): ही बटणे मुख्य वर्कफ्लोच्या आड येऊ नयेत म्हणून त्यांना वरील हेडर/रिबनमध्ये ३-डॉट मेनू किंवा लहान आयकॉनच्या रूपात ठेवणे.
3. **व्हर्टिकल स्पेसचे पुनर्संतुलन:**
   - फुटरची अनावश्यक उंची कमी करून ती मोकळी झालेली जागा ३-कॉलम वर्कस्टेशन ग्रिडला (`col-queue`, `col-preview`, `col-utility`) देणे.

---

### Phase 2: Extension-Free UI, Strict Queue Lifecycle & Duplicate Numbering

1. **UI मधून एक्स्टेन्शन पूर्णपणे लपवणे:**
   - Active Hero कार्डमधील `Original:` लेबलमध्ये `cleanName(currentFile.name)` वापरून `.pdf`/`.jpg` लपवणे.
   - `Upcoming Queue` मधील सर्व पंक्ती आणि टूलटिप्समधून एक्स्टेन्शन काढून केवळ बेस डॉक्युमेंट नाव दाखवणे.
   - फाइलचा खरा एक्स्टेन्शन (उदा. `.pdf`, `.jpg`) हा मॉडेलमधील `f.ext` मध्ये अंतर्गत सुरक्षित राहील आणि सेव्ह करताना आपोआप जोडला जाईल.
2. **कडक क्यू लाइफसायकल (Strict Queue Lifecycle Rules):**
   - **नियम १:** फाईल जोपर्यंत डिस्कवर प्रत्यक्ष रित्या रीनेम होत नाही, तोपर्यंत ती कोणत्याही परिस्थितीत `Upcoming Queue` मधून हटणार नाही.
   - **नियम २:** ऑपरेटरने फाइलवर क्लिक केले, सिलेक्ट केले, किंवा स्किप केले तरीही क्यू काउंट कमी होणार नाही आणि फाइल अदृश्य होणार नाही.
   - **नियम ३:** `upcomingFiles` चे अचूक सूत्र:
     ```javascript
     // चालू ॲक्टिव्ह फाइल वगळता उर्वरित सर्व प्रलंबित फाइल्स क्यूमध्ये राहतील
     const upcomingFiles = this.state.files.filter((f, idx) => idx !== this.state.currentIndex && !f.isRenamed);
     ```
   - **नियम ४:** `Completed Files` विभागात केवळ आणि केवळ `f.isRenamed === true` असलेल्या (डिस्कवर यशस्वी झालेल्या) फाइल्सच दाखवल्या जातील.
3. **सेफ ऑटो-इन्क्रिमेंटिंग डुप्लिकेट सूत्र (Collision Avoidance):**
   - फ्रंटएंड आणि बॅकएंड यांच्यात `studentName` चे अखंड लिंकेज स्थापित करणे:
     - `native-bridge-service.js` च्या `renameNativeFile` आणि `batchRenameNativeFiles` मध्ये `studentName` पाठवणे.
     - `server.py` मधील `/api/native-rename` आणि `/api/native-batch-rename` एंडपॉईंट्समध्ये `body.get('studentName', '')` वाचून `safe_rename_file` ला देणे.
   - डुप्लिकेट आल्यास प्रमाणित नामकरण:
     - विद्यार्थ्याचे नाव असल्यास: `10TH MARKSHEET 1 RAHUL PATIL.pdf`, `10TH MARKSHEET 2 RAHUL PATIL.pdf`.
     - विद्यार्थ्याचे नाव नसल्यास: `10TH MARKSHEET 1.pdf`, `10TH MARKSHEET 2.pdf`.
   - `executeRename` (लाइन ११०३) मध्ये डिस्कवरून परत आलेले खरे नाव (`res.name`) फाइल ऑब्जेक्टवर सेट करणे, जेणेकरून UI आणि डिस्क १००% समक्रमित राहतील.

---

### Phase 3: True Per-File Disk Rotation & Single-Extension Safe Renamer

1. **स्वतंत्र पर-फाइल रोटेशन मॉडेल:**
   - ग्लोबल रोटेशन रद्द करून प्रत्येक फाइलच्या डेटा स्ट्रक्चरमध्ये स्वतंत्र `f.rotation = 0` (०°, ९०°, १८०°, २७०°) ठेवणे.
   - फाइल १ चे रोटेशन बदलल्यास केवळ फाइल १ चा अँगल बदलेल; फाइल २ वर जाताच तिचे स्वतःचे मूळ रोटेशन प्रिव्ह्यूमध्ये लोड होईल.
2. **डिस्कवर प्रत्यक्ष रोटेशन सेव्ह करणे (True Disk Output):**
   - **इमेजेससाठी (JPG/PNG/WEBP):** बॅकएंडमध्ये आधीपासून उपलब्ध असलेल्या Python Pillow द्वारे `img.rotate(-angle, expand=True).save(file_path)` करणे.
   - **PDF साठी (Lossless Vector & Scanned Pages):** 
     - **मार्ग अ (पायथन बॅकएंड शिफारस):** `pip install pypdf` करून बॅकएंडमध्ये `pypdf.PdfWriter` द्वारे पानांचे रोटेशन डिस्कवर सेव्ह करणे.
     - **मार्ग ब (इन-प्रोजेक्ट पर्याय):** `src/modules/pdf-studio.js` मधील `rotatePdfDocument(pdfBytes, angle)` चा पुनर्वापर करून रोटेट झालेली बायनरी डिस्कवर राइट करणे.
   - **फाइल लेव्हल पडताळणी:** फाइल सेव्ह झाल्यावर बॅकएंडने फाइलची नवी रुंदी आणि उंची वाचून ९०°/२७०° रोटेशनची पुष्टी करणे.
3. **सिंगल-एक्स्टेन्शन कोड रीनेम फिक्स (उदा. `ADR`):**
   - इनपुट बॉक्समधील सर्व एक्स्टेन्शन्स केस-इन्सेंसिटिव्ह पद्धतीने स्वच्छ करण्यासाठी खालील प्रमाणित रेग्युलर एक्स्प्रेशन वापरणे:
     ```javascript
     const baseStem = rawInput.replace(/(\.[a-zA-Z0-9]+)+$/i, '').trim();
     ```
   - इनपुटमध्ये `ADR` किंवा `10M` टाईप केल्यास, प्रणाली आधी `baseStem` ची शॉर्टकट कोडशी तुलना करेल. कोड मॅच झाल्यास त्याचे कॅनॉनिकल नाव आणि विद्यार्थ्याचे नाव जोडून मूळ एक्स्टेन्शन **फक्त एकदाच आणि शेवटी** लावले जाईल:
     ```javascript
     const finalDiskName = `${formattedBase}${currentFile.ext}`;
     ```
   - यामुळे `.pdf.pdf` किंवा `ADR.PDF RAHUL PATIL.pdf` चा दोष पूर्णपणे नष्ट होईल.

---

### Phase 4: Dynamic Settings Presets, Collapsible Missing Docs & Functional Import

1. **मुख्य सेटिंग्जमध्ये डायनॅमिक प्रिसिट मॅनेजर:**
   - `src/ui/settings-ui.js` मध्ये पूर्ण कार्यक्षम CRUD इंटरफेस जोडणे:
     - **Add Document:** डॉक्युमेंट कोड (उदा. `10M`), कॅनॉनिकल नाव, प्रवर्ग (Form Name) आणि Required/Optional टॉगल.
     - **Edit Document:** अस्तित्वात असलेले नियम संपादन करणे.
     - **Delete Document:** अनावश्यक नियम काढून टाकणे.
     - **Required / Optional Toggle:** कागदपत्र अनिवार्य की ऐच्छिक हे ठरवणे.
2. **कायमस्वरूपी स्थानिक फाइल स्टोरेज (Persistent Local Storage):**
   - **तांत्रिक शिफारस:** ब्राउझरचे `localStorage` असुरक्षित आहे.
   - **उपाय:** सर्व प्रिसिट्स स्थानिक डिस्कवरील `config/document_presets.json` या फाइलमध्ये सेव्ह केले जातील. `server.py` मध्ये `/api/load-document-presets` आणि `/api/save-document-presets` हे एंडपॉईंट्स ही फाइल सुरक्षितपणे वाचतील आणि लिहितील. यामुळे विंडोज रीस्टार्ट झाले तरी सेटिंग्ज कधीही रीसेट होणार नाहीत.
3. **कोलॅप्सिबल मिसिंग डॉक्युमेंट्स विभाग:**
   - डीफॉल्टनुसार हा विभाग बंद (Collapsed) स्थितीत राहील.
   - आवश्यक कागदपत्रे अपूर्ण असल्यास हेडरवर स्पष्ट ब्लिंकिंग इंडिकेटर दिसेल: `⚠️ 3 Missing Documents Found`.
   - त्यावर क्लिक करताच यादी खाली उघडेल, ज्यामध्ये प्रत्येक कागदपत्राचा कोड (`10M`), नाव आणि पूर्वीपासून कार्यरत असलेला ड्यू-डेट पिकर (Today, Tomorrow, Monday, Custom Date) उपलब्ध राहील.
4. **प्रत्यक्ष कार्यक्षम 'Import Document' वर्कफ्लो:**
   - 'Import' बटण दाबल्यावर युझरने कोणत्याही बाह्य फोल्डरमधून (उदा. Downloads) फाइल निवडल्यास:
     1. फाइलचा प्रकार व कोड ओळखून चालू विद्यार्थ्याच्या नावाशी मॅच करणे.
     2. सेफ डुप्लिकेट नंबरिंग वापरून नवीन फाइलनेम तयार करणे.
     3. **डिस्क मूव्ह/कॉपी:** बॅकएंड एंडपॉईंट `/api/native-import-file` द्वारे ती फाइल प्रत्यक्ष विद्यार्थ्याच्या फोल्डरमध्ये सुरक्षितपणे कॉपी/मूव्ह करणे.
     4. जर दस्तऐवज ओळखता आला नाही, तर फाइल परस्पर न हलवता `Needs Review` असा स्पष्ट फ्लॅग दाखवणे.
     5. आयात यशस्वी होताच ती फाइल मिसिंग लिस्टमधून आपोआप निघून जाईल आणि चालू क्यूमध्ये समाविष्ट होईल.

---

### Sequential One-by-One Live Streaming Smart Scan डिझाइन

1. **तातडीने क्यू लोड आणि फाईल #१ ला प्राधान्य:**
   - फोल्डर किंवा फाइल्स निवडताच क्षणाचाही विलंब न लावता संपूर्ण यादी स्क्रीनवर लोड होईल.
   - प्रणाली तात्काळ File #1 चे स्कॅनिंग सुरू करेल; त्यावर ॲनिमेटेड स्पिनर दिसेल आणि फाइल #२ वर जाण्यापूर्वी फाइल #१ चा निकाल (मॅच झालेले नाव / स्कोअर बॅज / `Unmatched`) त्वरित स्क्रीनवर झळकेल.
2. **१-बाय-१ लाइव्ह स्ट्रीमिंग रिझल्ट्स:**
   - संपूर्ण बॅच एकदम स्कॅन न करता क्रमाने (File 1 -> File 2 -> File 3...) स्कॅन होईल.
   - प्रत्येक फाइलचे स्कॅनिंग पूर्ण होताच तिच्या पंक्तीमधील बॅज (उदा. 🟢 ९५% AADHAAR CARD किंवा 🔴 UNMATCHED) लगेच अपडेट होईल.
   - तळातील `Rename Matched (X)` चा आकडा प्रत्येक फाइलनुसार लाईव्ह वाढताना दिसेल.
   - UI कधीही फ्रीझ होणार नाही याची खात्री करण्यासाठी प्रत्येक फाइलनंतर `await new Promise(r => setTimeout(r, 40))` द्वारे ब्राउझरला रेंडरिंगसाठी वेळ दिला जाईल.
3. **कॅन्सलेशन आणि ऑटो-स्कॅन सुसंगतता:**
   - संपूर्ण स्कॅनिंग सायकल `AbortController` द्वारे नियंत्रित केली जाईल.
   - ऑपरेटरने मधेच नवीन फाइल्स टाकल्यास, फोल्डर बदलल्यास किंवा 'Scan' बटण पुन्हा दाबल्यास जुना स्कॅन तात्काळ थांबवला जाईल आणि नवीन क्रमाने File #1 पासून पुन्हा सुरू होईल.

---

## 4. चाचणी आराखडा (End-to-End Test Plan)

| चाचणी क्र. | टप्पा | चाचणीचे नाव | पद्धत व पडताळणी पायऱ्या | अपेक्षित निकाल |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Phase 1 | तळाचा बार व लेबल्स | UI मधील सर्व बटणे तपासणे. | कोणतेही `<kbd>` लेबल्स दिसणार नाहीत. `Rename All` बटण मोठे व ठळक दिसेल. कीबोर्ड शॉर्टकट्स पूर्ववत काम करतील. |
| **TC-02** | Phase 2 | एक्स्टेन्शन-मुक्त दृश्य | `Original:` लेबल आणि `Upcoming Queue` तपासणे. | UI मध्ये `.pdf` किंवा `.jpg` कुठेही दिसणार नाही; सेव्ह करताना मूळ एक्स्टेन्शन सुरक्षित राहील. |
| **TC-03** | Phase 2 | कडक क्यू लाइफसायकल | फाइल्सवर क्लिक करणे, स्किप करणे व इंडेक्स बदलणे. | फाइल्स क्यूमधून अदृश्य होणार नाहीत. केवळ डिस्कवर नाव बदल यशस्वी झाल्यावरच फाईल `Completed` मध्ये जाईल. |
| **TC-04** | Phase 2 | ऑटो-इन्क्रिमेंट डुप्लिकेट | एकाच नावाची दोन कागदपत्रे रीनेम करणे. | दुसरी फाईल `... 1 RAHUL PATIL.pdf` बनेल; जुनी फाइल ओव्हरराइट होणार नाही आणि "Already exists" एरर येणार नाही. |
| **TC-05** | Phase 3 | पर-फाइल रोटेशन | फाईल १ ९०° फिरवणे व फाईल २ वर जाणे. | फाईल २ ०° वर राहील आणि फाईल १ चे रोटेशन ९०° वर सुरक्षित राहील. |
| **TC-06** | Phase 3 | डिस्क रोटेशन पडताळणी | रोटेट केलेली फाईल डिस्कवर सेव्ह करून तिची रुंदी/उंची तपासणे. | डिस्कवरील आउटपुट फाईल खरोखर ९०° फिरलेली असेल (Dimensions Swapped). |
| **TC-07** | Phase 3 | सिंगल एक्स्टेन्शन कोड रीनेम | इनपुटमध्ये `ADR` किंवा `10M` टाकून Enter दाबणे. | डिस्कवर `.pdf.pdf` न होता केवळ `.pdf` असे एकच एक्स्टेन्शन तयार होईल. |
| **TC-08** | Phase 4 | प्रिसिट्स मॅनेजर व स्टोरेज | मुख्य सेटिंग्जमध्ये नवीन डॉक्युमेंट जोडून ॲप रीस्टार्ट करणे. | `config/document_presets.json` मधून नियम कायमस्वरूपी लोड होतील; कॅश क्लिअर झाली तरी डेटा उडणार नाही. |
| **TC-09** | Phase 4 | कोलॅप्सिबल मिसिंग डॉक्स | अपूर्ण कागदपत्रे असलेले फोल्डर लोड करणे. | विभाग सुरुवातीला बंद राहील व ब्लिंकिंग बॅज दाखवेल; क्लिक केल्यावर पूर्ण यादी व ड्यू-डेट पिकर उघडेल. |
| **TC-10** | Phase 4 | प्रत्यक्ष इंपोर्ट डिस्क मूव्ह | 'Import' बटणाने बाहेरची फाईल निवडणे. | फाईल प्रत्यक्ष विद्यार्थ्याच्या फोल्डरमध्ये कॉपी/मूव्ह होईल आणि मिसिंग लिस्टमधून तात्काळ निघून जाईल. |
| **TC-11** | Smart Scan| सिक्वेन्शियल १-बाय-१ स्कॅन | ५-१० फायलींचे फोल्डर लोड करून स्कॅन पाहणे. | फाईल #१ तात्काळ स्कॅन होईल, रो-बाय-रो बॅज लाईव्ह अपडेट होतील आणि UI अजिबात फ्रीझ होणार नाही. |

---

## 5. मंजूरी आणि स्पष्टीकरणासाठी प्रश्न (Pending Decisions & Approval Questions)

अंमलबजावणी सुरू करण्यापूर्वी ऑपरेटर / युझरकडून खालील मुद्द्यांवर स्पष्टीकरण आवश्यक आहे:

1. **तळातील Save Batch आणि Export Audit बटणांची जागा:**  
   तळाचा बार पूर्णपणे स्वच्छ ठेवण्यासाठी `Save Batch` आणि `Export Audit Report` ही दोन बटणे तळावरून काढून वरील फोल्डर रिबनमध्ये (किंवा ३-डॉट मेनूमध्ये) हलवायची का, की तळालाच लहान आकारात ठेवायची?
2. **पीडीएफ रोटेशनसाठी तंत्रज्ञानाची निवड:**  
   इमेजेसचे रोटेशन Python Pillow द्वारे सहज होते. पीडीएफसाठी पायथन बॅकएंडमध्ये हलके `pypdf` लायब्ररी स्थापित करून वापरायचे की फ्रंटएंड मधील `pdf-lib` / `rotatePdfDocument` द्वारे फिरवून डिस्कवर सेव्ह करायचे? *(शिफारस: Python `pypdf` — वेगवान, लॉसलेस आणि थेट डिस्कवर प्रक्रिया होते).*
3. **'Import Document' फाइल ट्रान्सफर पद्धत:**  
   जेव्हा ऑपरेटर बाहेरून कागदपत्र इंपोर्ट करेल, तेव्हा मूळ फाईल स्टुडंट फोल्डरमध्ये **'Copy'** (प्रत बनवणे) करायची की **'Move'** (हलवणे/कट-पेस्ट) करायची? *(शिफारस: Copy करणे सुरक्षित राहील, जेणेकरून मूळ दस्तऐवज सुरक्षित राहतो).*
4. **स्थानिक प्रिसिट्स फाइल स्टोरेज मार्ग:**  
   मेन सेटिंग्जमधील प्रिसिट्स कायमस्वरूपी साठवण्यासाठी `config/document_presets.json` हा मार्ग आणि पायथन API एंडपॉईंट्स वापरण्याची शिफारस मान्य आहे का?
5. **प्रथम कोणता टप्पा अनलॉक करायचा?**  
   तुमच्या मंजुरीनंतर प्रथम **Phase 1** (तळाचा बार क्लिनअप) पासून सुरुवात करायची की **Phase 2** (क्यू व एक्स्टेन्शन फिक्स)?
