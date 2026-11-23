# 🗺️ Rename Tool फाईल मॅप (`RENAME_TOOL_FILE_MAP.md`)

> **Rename Tool शी संबंधित सर्व फाईल्स, त्यांची भूमिका आणि आर्किटेक्चरल सीमा (Architectural File Map)**  
> **टूल डिरेक्टरी:** [`tools/rename_tool/`](file:///e:/DocMitra/tools/rename_tool/)

---

## 📁 1. स्वयंपूर्ण टूल फोल्डर रचना (Self-Contained Tool Directory)

Rename Tool हा संपूर्णपणे "One Folder Per Tool" तत्त्वानुसार स्वयंपूर्ण बनवला गेला आहे:

```
tools/rename_tool/
├── rename_tool.html          # Bento UI चा मुख्य स्ट्रक्चरल लेआउट आणि DOM घटक
├── rename_tool.css           # डार्क स्लेट आणि एमराल्ड थीम, 3-कॉलम Bento स्टाइलिंग
├── rename_tool_ui.js         # इव्हेंट लिसनर्स, शॉर्टकट्स, सर्क्युलर लूप, कॅन्व्हास प्रिव्ह्यू
├── rename_tool_logic.js      # नाव एक्सट्रॅक्शन, लेव्हनस्टाइन अल्गोरिदम, प्रीसेट्स, केसिंग
├── rename_tool.py            # Python 2-फेज सुरक्षित ॲटोमिक रीनेमिंग फॉलबॅक इंजिन
├── README_LOCK.md            # टूल लॉक आणि फ्रीझ सिक्युरिटी स्टेटस फाईल
└── tests/                    # टूलच्या अंतर्गत समर्पित युनिट आणि इंटिग्रेशन टेस्ट्स
    ├── test_presets_and_shortcuts_sync.js
    ├── test_qa_edge_cases.js
    ├── test_settings_search_filter.js
    └── stress_test_100.js
```

---

## 🌐 2. बाह्य आणि शेअर्ड इंटिग्रेशन पाथ्स (Shared Integration Points)

खालील फाईल्स ॲप-शेल किंवा सिस्टिम-ब्रिज असून, त्यामध्ये Rename Tool चे हुक्स जोडलेले आहेत:

| फाईल पाथ (File Path) | भूमिका (Role) | सीमा आणि संरक्षण (Boundary Guard) |
| :--- | :--- | :--- |
| `app/index.html` | मुख्य ॲप्लिकेशन शेल | केवळ टूल लोड करण्यासाठीचा कंटेनर; कोणतीही बिझनेस लॉजिक नाही. |
| `src/ui/index.js` | UI नेव्हिगेशन राउटर | टूल उघडण्यासाठीचा राउट ट्रिगर. |
| `src-tauri/src/lib.rs` | Tauri Rust Backend | `rename_native_file` आणि `rename_native_folder` चे हाय-स्पीड सिस्टिम कॉल्स. |
| `scripts/test_python_disk_ops.py` | डिस्क लेव्हल टेस्ट स्क्रिप्ट | Windows डिस्कवरील रीनेम, कोलिजन आणि रीड-ओन्ली ऑपरेशन्सची खात्री. |

---

## 🛡️ 3. फाइल-लेव्हल संरक्षण नियम (File-Level Rules)

- `tools/rename_tool/` मधील कोणतीही फाईल इतर कोणत्याही टूलवर काम करताना उघडून संपादित केली जाणार नाही.
- शेअर्ड फाईल्स (`src-tauri/src/lib.rs` किंवा `app/index.html`) मध्ये बदल करताना Rename Tool वर परिणाम होणार नाही याची खात्री Mandatory Impact Analysis द्वारे केली जाईल.
