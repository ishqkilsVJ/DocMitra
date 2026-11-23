# 📦 Rename Tool फिचर इन्व्हेंटरी (`RENAME_TOOL_FEATURE_INVENTORY.md`)

> **सर्व 28 फिचर्सचे संपूर्ण वर्गीकरण आणि परस्पर-कनेक्शन अहवाल (Feature Inventory & Interconnection)**  
> **स्थिती वर्गीकरण:** `WORKING` | `PARTIALLY WORKING` | `NOT WORKING` | `NOT TESTED` | `BLOCKED`

---

## 📋 सर्व 28 फिचर्सची यादी (Feature Catalog)

| क्र. | फिचरचे नाव (Feature Name) | स्तर / घटक (Layer) | स्थिती (Status) | परस्पर-कनेक्शन आणि कार्यपद्धती (Interconnection & Details) |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Native Folder Picker | Frontend + Rust IPC | `WORKING` | Tauri File Dialog द्वारे Windows डायरेक्टरी निवडणे; आपोआप सर्व फाईल्स स्कॅन करणे. |
| **2** | Drag-and-Drop Ingestion | Frontend UI | `WORKING` | फोल्डर किंवा फाईल्स थेट UI वर ड्रॅग करून ड्रॉप करणे; तात्काळ लिस्ट पॉप्युलेट होते. |
| **3** | Non-Recursive File Scan | Logic Engine | `WORKING` | केवळ निवडलेल्या फोल्डरमधील फाईल्स स्कॅन करणे; सब-फोल्डर्सच्या गोंधळाशिवाय क्लिन लोडिंग. |
| **4** | Real Folder Rename on Windows | Tauri Rust IPC | `WORKING` | `rename_native_folder` द्वारे डिस्कवर प्रत्यक्ष विद्यार्थ्याच्या फोल्डरचे नाव अद्ययावत करणे. |
| **5** | Dynamic Folder Name Memory Sync | UI State Management | `WORKING` | फोल्डरचे नाव बदलल्यावर अंतर्गत मेमरीमध्ये सर्व फाईल्सचा रूट पाथ री-लिंक होतो; "File not found" एरर टाळली जाते. |
| **6** | Exact Typing Casing (No Force Upper) | Input Handler | `WORKING` | युझरने ज्याप्रमाणे Caps Lock ऑन किंवा ऑफ ठेवून टाईप केले असेल, हुबेहूब तसेच अक्षरे स्वीकारली जातात. |
| **7** | Folder Name Inclusion Toggle | Logic / Preset | `WORKING` | 'Add folder name in file' चेकबॉक्स. अनचेक असताना फाईलच्या नावावर कोणतीही अनावश्यक प्रक्रिया होत नाही. |
| **8** | Student Name Extraction | NLP / Regex | `WORKING` | जुन्या फाईल नावावरून किंवा फोल्डर नावावरून विद्यार्थ्याचे नाव अचूकपणे ओळखणे. |
| **9** | Document Preset Matching | Fuzzy Match Engine | `WORKING` | आधार कार्ड, पॅन कार्ड, मार्कशीट इत्यादी डॉक्युमेंट प्रकार लेव्हनस्टाइन अल्गोरिदमने मॅच करणे. |
| **10** | 4-Level Fallback Match Engine | Logic Core | `WORKING` | १) तंतोतंत जुळणी, २) टोकन मॅच, ३) फझी मॅच, ४) मॅन्युअल इनपुट फॉलबॅक. |
| **11** | Live High-Fidelity Canvas Preview | PDF.js + Canvas | `WORKING` | डाव्या बाजूला निवडलेल्या डॉक्युमेंटचा थेट क्रिस्प आणि स्पष्ट प्रिव्ह्यू झूम/पॅनसह दिसतो. |
| **12** | 3-Column Bento Layout | CSS / Modern UI | `WORKING` | डावीकडे प्रिव्ह्यू, मध्यभागी फाईल लिस्ट व टायपिंग, उजवीकडे प्रीसेट्स आणि शॉर्टकट पॅनेल. |
| **13** | Keyboard Shortcuts (1-9 & Numpad) | Event Bus | `WORKING` | डॉक्युमेंट प्रकार निवडण्यासाठी 1-9 अंक आणि नंपॅड दाबल्यास तात्काळ डॉक्युमेंट सिलेक्ट होते. |
| **14** | Circular Wrap-Around Navigation | Queue Manager | `WORKING` | शेवटच्या फाईलवर असताना Enter किंवा Tab दाबल्यास आपोआप पहिल्या फाईलवर (1..N..1) अखंड चक्राकार जंप. |
| **15** | Smart Active Casing Sync on Re-visit | Event Handler | `WORKING` | प्रोसेस झालेल्या फाईलवर पुन्हा जाऊन केसिंग बदलल्यास किंवा Tab दाबल्यास केसिंग तात्काळ अद्ययावत होते. |
| **16** | 100% Match Queue Traversal | Queue Manager | `WORKING` | १००% मॅच असलेल्या फाईल्ससुद्धा स्कॅन आणि तपासणीसाठी क्यूमधून व्यवस्थित पार पडतात. |
| **17** | Custom Prefix & Suffix | Formula Engine | `WORKING` | फाईलच्या नावाच्या सुरुवातीला किंवा शेवटी सानुकूल मजकूर जोडण्याची सुविधा. |
| **18** | Auto-Increment Counter / Serial No. | Formula Engine | `WORKING` | एकाच नावाच्या अनेक फाईल्स आल्यास आपोआप _1, _2 किंवा कस्टमायझेशननुसार क्रम लावला जातो. |
| **19** | Casing Conversion Modes | Text Processor | `WORKING` | UPPERCASE, Title Case, lowercase किंवा Original Typing Case मध्ये त्वरित रूपांतरण. |
| **20** | Live Collapsible Ribbon Toolbar | Header UI | `WORKING` | स्क्रीनवरील जागा वाचवण्यासाठी एका क्लिकवर मिनिमाइझ / एक्स्पँड होणारा स्वच्छ रिबन बार. |
| **21** | Dark Slate & Emerald Theme Accent | Styling System | `WORKING` | डोळ्यांना त्रास न देणारा आधुनिक डार्क स्लेट आणि एमराल्ड ग्रीन प्रोफेशनल लुक. |
| **22** | Zero Dummy Data / Real Empty State | DOM Template | `WORKING` | ॲप सुरू होताना कोणताही डमी डेटा दिसत नाही; रिअल रिकामी अवस्था (Empty State) लोड होते. |
| **23** | Two-Phase Collision Pre-check | Rust + Python | `WORKING` | प्रत्यक्षात डिस्कवर फाईलचे नाव बदलण्यापूर्वी डुप्लिकेट नावांची पडताळणी करून सुरक्षितता सुनिश्चित करणे. |
| **24** | Windows Read-Only Flag Clear | Native OS Bridge | `WORKING` | स्कॅनरने फाईल Read-Only केली असल्यास, रीनेम करताना ती लॉक क्लिअर करून सुरक्षित सेव्ह करणे. |
| **25** | Atomic Disk Renaming Execution | Rust / Python | `WORKING` | अखंड (Atomic) पद्धतीने फाईलचे नाव बदलणे; अर्ध्यावर प्रोसेस थांबल्यास डेटा सुरक्षित राहतो. |
| **26** | Audit Log & Progress Indicator | Feedback UI | `WORKING` | किती फाईल्स प्रोसेस झाल्या याचा प्रोग्रेस बार आणि प्रत्येक ॲक्शनचा स्पष्ट स्टेटस रिपोर्ट. |
| **27** | Settings & Preset Search Filter | Sidebar Module | `WORKING` | शेकडो डॉक्युमेंट प्रकारांमधून त्वरित सर्च करून अचूक प्रीसेट निवडणे. |
| **28** | Complete Reset & Clear Queue | State Reset | `WORKING` | एका क्लिकवर संपूर्ण क्यू स्वच्छ करून नवीन फोल्डरसाठी ॲप तयार करणे. |

---

## 🔗 सर्व घटकांचे परस्पर-कनेक्शन (System Interconnection Architecture)

```
[User Input / Drag & Drop] 
        │
        ▼
[Frontend Bento UI] ◄──────► [Live PDF.js Canvas Preview]
        │
        ▼
[Queue Manager & Shortcuts] ──► [Exact Typing Casing & Preset Matcher]
        │
        ▼
[Tauri Rust IPC (`rename_native_file` / `rename_native_folder`)]
        │ (High-Speed Native Execution)
        ▼
[Windows Filesystem: Physical Folder & File Renamed Successfully]
        ▲
        │ (Fallback & Audit Safety)
[Python 2-Phase Engine (`rename_tool.py`)]
```

**निष्कर्ष:** सर्व २८ फिचर्स १००% कार्यरत (`WORKING`) असून एकमेकांशी सुसंगतपणे जोडलेले आहेत.
