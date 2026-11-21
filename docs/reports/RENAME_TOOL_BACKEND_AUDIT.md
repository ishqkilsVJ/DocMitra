# ⚙️ RENAME TOOL BACKEND AUDIT (बॅकएंड व लॉजिक सखोल लेखापरीक्षण अहवाल)

> **दस्तऐवज निर्मिती दिनांक व वेळ:** 22 नोव्हेंबर 2026, पहाटे 02:35 IST  
> **प्रकल्प मार्ग (Project Path):** `E:\DocMitra`  
> **टूल मार्ग (Rename Tool Folder Path):** `E:\DocMitra\tools\rename_tool`  
> **Git Branch:** `master`  
> **Git Commit Hash:** `785759fe08698735936c965cd99dc5a70c873a5b`  

---

## १. बॅकएंड आर्किटेक्चर विहंगावलोकन (Backend Architecture Overview)

DocMitra च्या Bulk Renamer चे बॅकएंड द्विमितीय (Dual Engine) रचनेवर चालते:
1. **JavaScript Business Engine (`rename_tool_logic.js`):** DOM-मुक्त शुद्ध अल्गोरिदम, लेवेनश्टाईन डिस्टन्स, टोकन मॅचिंग, केसिंग, आणि अनडू स्टॅक.
2. **Dedicated Python Engine (`rename_tool.py`):** स्थानिक ऑपरेटिंग सिस्टीम फाइल्सवर प्रत्यक्ष प्रक्रिया करणारे इंजिन (Safe Atomic Rename, Disk-level Rotation using `pypdf` & `PIL`, Duplicate Collision Avoidance, आणि File Import).
3. **Rust Tauri Native Bridge (`src-tauri/src/lib.rs`):** हाय-स्पीड डिस्क I/O, नेटिव्ह फाइल डायलॉग आणि `read_binary_file` ऑफलाइन प्रिव्ह्यू बाईट्स ट्रान्सफर.

---

## २. बॅकएंड घटकनिहाय सखोल तपासणी (Detailed Logic Inspection)

### अ. Zero Student Name Duplication Engine (`buildName`)
- **पडताळणी:** जेव्हा वापरकर्ता विद्यार्थ्याचे नाव देतो आणि मूळ फाईलमध्ये आधीपासूनच ते नाव असते:
  - उदा. मूळ फाईल: `10th_marksheet_Vijay_Yadav.pdf`, विद्यार्थी नाव: `Vijay Yadav`.
  - **जुनी समस्या:** पूर्वी `10TH MARKSHEET VIJAY YADAV VIJAY YADAV` असे नाव तयार होत असे.
  - **नवीन तर्क:** `normStudent` आणि `normBase` हे व्हाईटस्पेस, अंडरस्कोअर आणि केसिंग सामान्य (normalize) करतात. जर बेस नावात आधीच विद्यार्थ्याचे नाव असेल, तर ते दुबार जोडले जात नाही.
- **चाचणी निकाल:** `test_unified_list_and_4presets_e2e.js` आणि `test_new_unified_and_presets.js` मध्ये १००% यशस्वी.

### ब. Duplicate Collision Avoidance & Auto-Incrementing (`uniqueDestination`)
- **पडताळणी:** एकाच फोल्डरमध्ये एकाच नावाच्या अनेक फाईल्स (उदा. दोन गुणपत्रिका किंवा दोन रेशन कार्ड) असल्यास काय होते?
  - **तर्क:** फाईल ओव्हरराइट न करता आपोआप ` 1`, ` 2` असा अनुक्रम जोडला जातो.
  - जर विद्यार्थ्याचे नाव जोडलेले असेल, तर क्रमांक विद्यार्थ्याच्या नावाच्या आधी सुरक्षितपणे घातला जातो:
    - फाईल १: `10TH MARKSHEET Aarti Kadam.pdf`
    - फाईल २: `10TH MARKSHEET 1 Aarti Kadam.pdf`
    - फाईल ३: `10TH MARKSHEET 2 Aarti Kadam.pdf`
  - जर फाईलचे नाव अंकाने संपत असेल (उदा. `FORM 16`), तर ते सुरक्षित राखून `FORM 16 1` केले जाते (`FORM 17` होत नाही).
- **चाचणी निकाल:** `python scripts/test_python_disk_ops.py` आणि TC-04 मध्ये १००% उत्तीर्ण.

### क. Windows Reserved Names & Path Validation (`validateFilename`)
- **पडताळणी:** विंडोज ऑपरेटिंग सिस्टीममध्ये राखीव असलेली डिव्हाइस नावे (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`) आणि बेकायदेशीर चिन्हे (`\ / : * ? " < > |`) फाईल नावात दिल्यास सिस्टीम क्रॅश होऊ शकते.
- **तर्क:** `tools/rename_tool/rename_tool_logic.js` आणि `tools/rename_tool/rename_tool.py` या दोन्ही स्तरांवर ही नावे तात्काळ ब्लॉक केली जातात आणि वापरकर्त्याला स्पष्ट इशारा दिला जातो.
- **चाचणी निकाल:** चाचणी क्र. ३० मध्ये सर्व राखीव नावे व अवैध चिन्हे यशस्वीरित्या ब्लॉक झाली.

### ड. True Disk Rotation (भौतिक डिस्क स्तरावर रोटेशन)
- **पडताळणी:** केवळ UI मध्ये इमेज फिरवून चालत नाही; सेव्ह केलेली फाईल दुसऱ्या कॉम्प्युटरवर उघडल्यावरही योग्य दिशेतच (Right Orientation) दिसायला हवी.
- **तर्क:**
  - PDF साठी: `pypdf.PdfReader` आणि `PdfWriter` द्वारे सर्व पानांचे rotation angle (९०, १८०, २७० अंश) कायमस्वरूपी अपडेट केले जाते.
  - इमेजसाठी: `PIL.Image.rotate(..., expand=True)` द्वारे पिक्सेल डायमेन्शन्स (उदा. ३००x५०० -> ५००x३००) स्वॅप करून भौतिक फाईल सेव्ह केली जाते.
- **चाचणी निकाल:** `test_python_disk_ops.py` मध्ये भौतिक फाईल रोटेशन यशस्वीरित्या प्रमाणित झाले.

### इ. Persistent Data Storage (`config/document_presets.json`)
- **पडताळणी:** वापरकर्त्याने ॲप बंद करून पुन्हा चालू केल्यास प्रीसेट्स आणि शॉर्टकट्स कायम राहतात का?
- **तर्क:** `src/services/storage-service.js` हे बॅकएंड एंडपॉइंट्स (`/api/load-document-presets` आणि `/api/save-document-presets`) द्वारे `config/document_presets.json` मध्ये थेट वाचन आणि लेखन करते. तसेच ब्राऊझर लोकल स्टोरेजचा बॅकअप देखील राखला जातो.
- **चाचणी निकाल:** रीस्टार्ट चाचणी (Test 31) १००% उत्तीर्ण.

---

## ३. अंतिम बॅकएंड स्थिती (Backend Status)
बॅकएंड अतिशय मजबूत, फॉल्ट-टॉलरंट, डेटा-सुरक्षित आणि प्रत्यक्ष डिस्क ऑपरेशन्ससाठी १००% विश्वासार्ह आहे.
