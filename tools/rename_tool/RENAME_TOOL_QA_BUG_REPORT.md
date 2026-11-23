# 📋 DocMitra Bulk Rename Tool - सखोल QA, स्ट्रेस टेस्ट आणि बग रिपोर्ट
**तारीख:** २२ नोव्हेंबर २०२६  
**चाचणी साधने:** Playwright MCP, Chrome DevTools MCP, Node.js Test Suite  
**टूल मार्ग (Scope):** `tools/rename_tool/` (Strict Single-Tool Boundary)  
**चाचणी स्थिती:** पूर्ण (Zero Source Code Modified - Approval Pending)

---

## 📊 कार्यकारी सारांश (Executive Summary)

DocMitra च्या Bulk Rename Tool चे Playwright आणि Chrome DevTools द्वारे सखोल परीक्षण (Stress Testing, CRUD Audit, Substring Collision Hunt, Viewport Responsiveness, आणि Console Runtime Monitoring) करण्यात आले.

या चाचणीमध्ये एकूण **१० प्रमुख त्रुटी व बग्स (Errors & Bugs)** शोधण्यात आले आहेत:
- 🔴 **Critical / Crash Bugs (गंभीर त्रुटी):** ३
- 🟡 **Medium / Business Logic Bugs (लॉजिक व डेटा त्रुटी):** ४
- 🔵 **UI & Viewport Responsiveness Issues (लेआउट त्रुटी):** ३

---

## 🔴 भाग १: गंभीर त्रुटी (Critical / Crash Bugs)

### १. `TypeError: this.handleConfirmCurrentName is not a function` (कीबोर्ड क्रॅश)
- **स्थान:** `tools/rename_tool/rename_tool_ui.js` (Lines 1613, 1618, 1636, 1641)
- **लक्षण:** ऑपरेटर जेव्हा "Rename To" इनपुट फील्डमध्ये डॉक्युमेंटचे नाव टाइप करतो किंवा एडिट करतो आणि कीबोर्डवर `Enter` किंवा `Tab` की दाबतो, तेव्हा संपूर्ण UI फ्रीझ/क्रॅश होते आणि कन्सोलमध्ये खालील एरर येतो:
  ```text
  Uncaught TypeError: this.handleConfirmCurrentName is not a function
      at HTMLInputElement.<anonymous> (rename_tool_ui.js:1613)
  ```
- **मूळ कारण (Root Cause):** `rename_tool_ui.js` मध्ये इव्हेंट लिसनर्स `this.handleConfirmCurrentName()` ला कॉल करतात, परंतु संपूर्ण `RenamerUIManager` क्लासमध्ये ही पद्धत (method) कुठेही अस्तित्वात नाही!
- **प्रभाव:** जलद डेटा एंट्री दरम्यान ऑपरेटर कीबोर्ड वापरून नाव सेव्ह करू शकत नाही; माउसने बाहेर क्लिक करावे लागते.

---

### २. `DataCloneError: An ArrayBuffer is detached and could not be cloned` (PDF प्रिव्ह्यू एरर)
- **स्थान:** `tools/rename_tool/rename_tool_ui.js` (Line 4015, `_renderPdfPage` & `renderFromBytes`)
- **लक्षण:** जेव्हा ऑपरेटर प्रिव्ह्यू पॅनेलमध्ये डॉक्युमेंट झूम इन/आऊट करतो किंवा ९० अंश फिरवतो (Rotate), तेव्हा कन्सोलमध्ये वारंवार खालील वॉर्निंग/एरर येतो:
  ```text
  PDF render error: DataCloneError: Failed to execute 'postMessage' on 'Worker': An ArrayBuffer is detached and could not be cloned.
      at MessageHandler.sendWithPromise (pdf.min.js:22:162205)
  ```
- **मूळ कारण (Root Cause):** `window.pdfjsLib.getDocument({ data: bytes })` कॉल करताना मूळ `Uint8Array` चा अंडरलाईंग `ArrayBuffer` वेब वर्करकडे ट्रान्सफर (detach) होतो. जेव्हा युझर पुन्हा झूम किंवा रोटेट करतो, तेव्हा तोच detached बफर पाठवला गेल्याने `DataCloneError` येतो.
- **उपाय:** `data: bytes.slice()` किंवा बफर क्लोन करून पाठवणे आवश्यक आहे.

---

### ३. Settings मधील Factory Default Presets गहाळ असणे (`CET CELL` व `EDUCATIONAL` Missing)
- **स्थान:** `tools/rename_tool/rename_tool_ui.js` (Lines 2822-2840, `loadPresetsAndSettings()`)
- **लक्षण:** `localStorage` मध्ये आधीचा डेटा नसताना किंवा नवीन सिस्टीमवर Settings Modal उघडल्यास `#selectActivePreset` ड्रॉपडाउनमध्ये फक्त `MAHA DBT` आणि `SWAYAM` दिसतात. `CET CELL` आणि `EDUCATIONAL` प्रीसेट्स गायब असतात.
- **मूळ कारण (Root Cause):** `loadPresetsAndSettings()` मधील फॉलबॅक ऑब्जेक्ट हार्डकोडेड फक्त दोनच प्रीसेट्स ठेवतो, तर `BUILTIN_PRESETS` कॉन्स्टंटमध्ये चारही प्रीसेट्स उपलब्ध आहेत.
- **पुष्टी:** Playwright च्या थेट DOM परीक्षणात `#selectActivePreset` मध्ये फक्त २ पर्याय आढळले.

---

## 🟡 भाग २: लॉजिक व डेटा त्रुटी (Medium & Logic Bugs)

### ४. "PANKESH + PAN" सबस्ट्रिंग कोलिजन आणि स्पेस शॉर्टकट समस्या
- **स्थान:** `tools/rename_tool/rename_tool_logic.js` (Line 677, `buildName`) आणि `rename_tool_ui.js`
- **परीक्षण तपशील:**
  - जेव्हा विद्यार्थ्याचे नाव `PANKESH` असते आणि इनपुट `PAN` असते:
    - लॉजिकमधील `normBase.toLowerCase().includes(normStudent.toLowerCase())` तपासणी `pan.includes("pankesh")` फॉल्स देते. त्यामुळे `buildName` बरोबर `PAN CARD PANKESH` बनवतो.
    - **परंतु युझरला प्रत्यक्षात अडचण का येते?**
      1. कीबोर्डने `PAN` टाइप करून `Enter` दाबल्यास **बग क्र. १** मुळे सिस्टीम क्रॅश होते!
      2. जर ऑपरेटरने स्कॅनरच्या सवयीनुसार `P A N` (मध्यभागी स्पेसेस) टाइप केले, तर शॉर्टकट मॅच `s.code.toLowerCase() === trimmedVal.toLowerCase()` फेल होतो आणि डॉक्युमेंटचे नाव `PAN CARD` ऐवजी चुकीचे `P A N PANKESH.pdf` बनते!
      3. जर विद्यार्थ्याच्या नावातच डॉक्युमेंटचे नाव आले (उदा. नाव `Pankesh` आणि इनपुट `Pankesh`), तर `alreadyContains` ट्रु होऊन डॉक्युमेंटचा प्रकार गायब होतो आणि फक्त `PANKESH.pdf` सेव्ह होते!

---

### ५. डुप्लिकेट फाईल नंबरिंग दरम्यान केसिंग (UPPER/Title) ब्रेक होणे
- **स्थान:** `tools/rename_tool/rename_tool_logic.js` (Lines 743-745, `uniqueDestination`) आणि `rename_tool.py` (Line 183)
- **लक्षण:** समजा विद्यार्थ्याचे नाव `Pankesh` (Title Case) आहे आणि एक्टिव्ह केसिंग `UPPER` निवडलेले आहे:
  - पहिली फाईल बरोबर `PAN CARD PANKESH.pdf` बनते.
  - परंतु जर त्याच नावाची दुसरी फाईल आली (Duplicate Collision), तर `uniqueDestination()` ती फाईल `PAN CARD 1 Pankesh.pdf` अशी बनवते!
- **मूळ कारण (Root Cause):** `uniqueDestination()` फंक्शन डुप्लिकेट नंबर जोडताना मूळ रॉ `studentName` थेट जोडते आणि निवडलेल्या `style` (upper/title/lower) ला बायपास करते.

---

### ६. शॉर्ट कोड कीवर्ड डिसकनेक्ट (उदा. Caste Certificate साठी `CAS` vs `CST`)
- **स्थान:** `tools/rename_tool/rename_tool_logic.js` & `rename_tool_ui.js`
- **लक्षण:** Caste Certificate चा शॉर्ट कोड `CST` आहे. अनेक ऑपरेटर्स सवयीने `CAS` टाइप करतात. परंतु कीबोर्ड शॉर्टकट मॅचर फक्त अचूक `s.code` तपासतो, पर्यायी कीवर्ड्स तपासत नाही. त्यामुळे `CAS` टाइप केल्यावर जात प्रमाणपत्र मॅच न होता `CAS [STUDENT].pdf` असा कच्चा मजकूर राहतो.

---

### ७. CSV Audit Export मध्ये ॲक्टिव्ह प्रीसेट दुर्लक्षित होणे
- **स्थान:** `tools/rename_tool/rename_tool_ui.js` (Line 2307, `handleExportAudit`)
- **लक्षण:** ऑपरेटरने `CET CELL` किंवा `SWAYAM` प्रीसेट निवडलेला असला तरी, CSV Audit रिपोर्ट नेहमी हार्डकोडेड फॉलबॅक `MAHA DBT FORM` वरूनच डेटा तपासतो.

---

## 🔵 भाग ३: UI & Viewport Responsiveness त्रुटी (Layout Issues)

### ८. १२८० पिक्सेलपेक्षा लहान स्क्रीन्सवर डॉक्युमेंट प्रिव्ह्यू गायब होणे (Height 0px)
- **स्थान:** `tools/rename_tool/rename_tool.html` (`#workspace-columns-container` आणि `#col-preview`)
- **परीक्षण:** Playwright द्वारे 1920x1080, 1280x800, 1024x768 आणि 800x600 वर चाचणी घेतली.
- **दोष:** Tailwind CSS चे `xl:flex-row` फक्त १२८०px आणि त्यापेक्षा मोठ्या स्क्रीनवर लागू होते. लॅपटॉप किंवा कमी रिझोल्यूशन (उदा. 1024x768 किंवा 800x600) वर लेआउट `flex-col` होतो, ज्यामुळे:
  - `#col-queue` पूर्ण जागा घेतो.
  - **`#col-preview` ची उंची थेट `0px` होते!** संपूर्ण डॉक्युमेंट प्रिव्ह्यू अदृश्य होतो!

---

### ९. ८०० पिक्सेल रुंदीवर मुख्य ॲक्शन बटण स्क्रीनबाहेर जाणे (Horizontal Overflow)
- **स्थान:** `tools/rename_tool/rename_tool.html` (Footer Action Bar)
- **दोष:** ८००x६०० व्ह्यूपोर्टवर `#btnRenameMatched` बटण `left: 684px` आणि `width: 209px` (एकूण ८९३px) वर पोहोचते, जे ८००px च्या स्क्रीन मर्यादेबाहेर कापले (clipped) जाते.

---

### १०. फोल्डर नावातून विद्यार्थी नाव काढताना (Folder Extraction) कचरा मजकूर राहणे
- **स्थान:** `tools/rename_tool/rename_tool_ui.js` (Lines 1105-1106)
- **परीक्षण (१०५ विद्यार्थ्यांच्या स्ट्रेस टेस्टचे निकाल):**
  - `D:\Students\101 - AARAV PATIL\doc.pdf` => `AARAV PATIL` (यशस्वी)
  - `D:\Scans\Roll No 45 Snehal Pawar\doc.pdf` => `Roll No 45 Snehal Pawar` (अडचण: "Roll No 45" उपसर्ग तसाच राहतो)
  - `E:\Work\KULKARNI GAURI (FINAL)\doc.pdf` => `KULKARNI GAURI (FINAL)` (अडचण: "(FINAL)" किंवा "(NEW)" प्रत्यय तसाच राहतो)
  - `D:\Data\12345678\doc.pdf` => `12345678` (अडचण: फक्त आकडे असलेले फोल्डर थेट विद्यार्थ्याचे नाव म्हणून सेट होते)

---

## 🚀 १०५ विद्यार्थी आणि ११० डॉक्युमेंट्सचा स्ट्रेस टेस्ट परफॉर्मन्स रिपोर्ट

| मेट्रिक | नोंदवलेले मूल्य | स्थिती |
| :--- | :--- | :--- |
| **एकूण मॅच आणि बिल्ड ऑपरेशन्स** | १,५७५ सायकल्स | ✅ पूर्ण |
| **एकूण लागलेला वेळ** | ५८७ ms | ✅ अत्यंत जलद (०.३७ ms / ऑपरेशन) |
| **यशस्वी डॉक्युमेंट मॅचेस** | १,३२५ | ✅ ८४.१% अचूकता |
| **उच्च आत्मविश्वास मॅचेस (>=७०%)** | १,१२८ | ✅ ७१.६% अचूकता |
| **लॉजिक क्रॅशेस / अनहँडल्ड एक्सेप्शन्स** | ० (शून्य) | ✅ स्थिर |

---

## 🔒 पुढील पायरी आणि मंजुरी (Awaiting User Approval)

**महत्त्वाचे:** `AGENTS.md` आणि `RENAME_TOOL_AGENT.md` च्या नियमांनुसार, मी अद्याप कोणत्याही सोर्स कोड फाईलमध्ये कोणताही बदल केलेला नाही.

वरील १० पैकी सर्व किंवा विशिष्ट बग्स दुरुस्त करण्यासाठी आपली **स्पष्ट मंजुरी (Approval)** आवश्यक आहे. आपण परवानगी दिल्यावर:
1. `tools/rename_tool/README_LOCK.md` अधिकृतपणे अनलॉक केला जाईल.
2. हे सर्व बग्स एकाच स्वच्छ फेरीत दुरुस्त केले जातील.
3. पुन्हा स्वयंचलित चाचण्या घेऊन `node build-ui.js` द्वारे सॉफ्टवेअर अपडेट केले जाईल.
4. टूल पुन्हा स्वयंचलितपणे री-लॉक केले जाईल.
