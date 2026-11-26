# 🐛 बल्क रीनेमर - त्रुटी व मूळ कारण विश्लेषण अहवाल (Bug & Root Cause Analysis)

> **दस्तऐवज:** `RENAME_TOOL_BUG_AND_ROOT_CAUSE_REPORT.md`  
> **प्रकल्प:** DocMitra Desktop Application (v1.4.4)  
> **घटक:** बल्क डॉक्युमेंट रीनेमर (`tools/rename_tool/`)  
> **तपासणी तारीख:** २४ नोव्हेंबर २०२६  
> **धोरण:** वापरकर्त्याच्या पूर्वपरवानगीशिवाय कोणत्याही कोडमध्ये बदल न करणे (No Automatic Code Modification Before Approval)  
> **भाषा:** मराठी (Marathi)

---

## 🛑 १. महत्त्वाचे धोरण स्पष्टीकरण (Mandatory Policy Note)

वापरकर्त्याच्या स्पष्ट सूचनेनुसार: **"Do not modify code automatically after a failure. First prepare the reports and fix plan. Wait for my approval before applying fixes."**  
या नियमाचे १००% काटेकोर पालन करून कोणत्याही फाईलमध्ये परस्पर बदल करण्यात आलेला नाही. खाली तिन्ही अयशस्वी चाचण्यांचे ७ मुद्यांनुसार सविस्तर विश्लेषण आणि दुरुस्ती योजना (Fix Plan) मांडली आहे. वापरकर्त्याने मंजुरी दिल्यानंतरच हे दुरुस्त केले जाईल.

---

## 🔍 २. अयशस्वी चाचणी १: `test_rename_tool_33_e2e_matrix.js` (Test 31)

### १. काय test केले:
- ॲप्लिकेशनच्या कायमस्वरूपी डेटाबेस फाईल (`config/document_presets.json`) मधून प्रीसेट्स योग्यरित्या लोड होतात की नाही आणि 'MAHA DBT' व 'SWAYAM' प्रीसेट्स अस्तित्वात आहेत की नाही याची पडताळणी केली.

### २. काय अपेक्षित होते:
- टेस्ट स्क्रिप्टच्या ओळ ४४३ नुसार `data.forms['SWAYAM']` हे सत्य (True/Truthy) असावे, म्हणजेच 'SWAYAM' या नावाने की (Key) सापडणे अपेक्षित होते.

### ३. प्रत्यक्षात काय झाले:
- चाचणी नापास झाली आणि एरर आला: `AssertionError [ERR_ASSERTION]: SWAYAM preset must persist`.

### ४. Error कुठे आहे:
- **फाईल:** `scripts/test_rename_tool_33_e2e_matrix.js`
- **ओळ क्रमांक:** ४४३
- **कोड:** `assert.ok(data.forms['SWAYAM'], 'SWAYAM preset must persist');`

### ५. Root cause काय आहे:
- हा ॲप्लिकेशनमधील किंवा लॉजिकमधील बग **नाही**. 
- चेकपॉईंट **CP-006** मध्ये महाराष्ट्र शासन व केंद्र सरकारच्या अधिकृत स्कॉलरशिप पोर्टलनुसार 'SWAYAM' या जुन्या संक्षिप्त नावाचा विस्तार करून त्याचे अधिकृत पूर्ण नाव **`'SWAYAM DEENDAYAL YOJANA'`** असे ठेवण्यात आले.
- प्रत्यक्ष `config/document_presets.json` मध्ये की खालीलप्रमाणे योग्य आहे:
  `"SWAYAM DEENDAYAL YOJANA": [ ... ]`
- परंतु जुन्या चाचणी स्क्रिप्टमध्ये अजूनही जुने संक्षिप्त नाव `'SWAYAM'` शोधले जात असल्यामुळे ॲसर्शन अयशस्वी झाले.

### ६. Fix काय आवश्यक आहे:
- `scripts/test_rename_tool_33_e2e_matrix.js` च्या ओळ ४४३ वर जुन्या नावाऐवजी अधिकृत पूर्ण नाव किंवा दोन्ही नावे स्वीकारणारी सुरक्षित अट घालणे:
  ```javascript
  assert.ok(data.forms['SWAYAM DEENDAYAL YOJANA'] || data.forms['SWAYAM'], 'SWAYAM preset must persist');
  ```

### ७. Fix नंतर कोणता re-test करायचा आहे:
- `node scripts/test_rename_tool_33_e2e_matrix.js` ही ३३-पॉइंट एंड-टू-एंड चाचणी पुन्हा चालवून ३३ पैकी ३३ चाचण्या १००% पास होतात की नाही हे तपासणे.

---

## 🔍 ३. अयशस्वी चाचणी २: `test_unified_list_and_4presets_e2e.js` (Check 1)

### १. काय test केले:
- ॲपमधील ४ अंगभूत प्रीसेट्स (Built-In Presets) आणि त्यांचे मॅपिंग योग्य आहे की नाही हे तपासले गेले.

### २. काय अपेक्षित होते:
- `BUILTIN_PRESETS['SWAYAM']` अस्तित्वात असावा (`assert.ok(BUILTIN_PRESETS['SWAYAM'], 'SWAYAM must exist');`).

### ३. प्रत्यक्षात काय झाले:
- चाचणी सुरुवातीलाच थांबली आणि एरर आला: `AssertionError [ERR_ASSERTION]: SWAYAM must exist`.

### ४. Error कुठे आहे:
- **फाईल:** `scripts/test_unified_list_and_4presets_e2e.js`
- **ओळ क्रमांक:** १८
- **कोड:** `assert.ok(BUILTIN_PRESETS['SWAYAM'], 'SWAYAM must exist');`

### ५. Root cause काय आहे:
- `rename_tool_ui.js` मध्ये चेकपॉईंट **CP-006** नुसार `BUILTIN_PRESETS` च्या अधिकृत कीज्:
  १) `'MAHA DBT'` (२८ डॉक्स)
  २) `'SWAYAM DEENDAYAL YOJANA'` (२२ डॉक्स)
  ३) `'CET CELL'` (२६ डॉक्स)
  ४) `'EDUCATIONAL DOCUMENTS'` (५३ डॉक्स)
- टेस्ट स्क्रिप्ट ही जुन्या मसुद्यावर (१२ डॉक्सच्या जुन्या संक्षिप्त नावावर) लिहिलेली असल्यामुळे विसंगती निर्माण झाली.

### ६. Fix काय आवश्यक आहे:
- `scripts/test_unified_list_and_4presets_e2e.js` मधील ओळी १८ ते २३ अद्ययावत करून अधिकृत नावे व अचूक डॉक्युमेंट संख्या तपासणे:
  ```javascript
  assert.ok(BUILTIN_PRESETS['SWAYAM DEENDAYAL YOJANA'] || BUILTIN_PRESETS['SWAYAM'], 'SWAYAM preset must exist');
  assert.ok(BUILTIN_PRESETS['EDUCATIONAL DOCUMENTS'] || BUILTIN_PRESETS['EDUCATIONAL'], 'EDUCATIONAL must exist');
  ```

### ७. Fix नंतर कोणता re-test करायचा आहे:
- `node scripts/test_unified_list_and_4presets_e2e.js` ही चाचणी पुन्हा चालवणे.

---

## 🔍 ४. अयशस्वी चाचणी ३: `test_rename_settings_and_fuzzy.js` (Test 6)

### १. काय test केले:
- डिफॉल्ट प्रीसेट्समध्ये 'MAHA DBT' मधील डॉक्युमेंट्सची संख्या तपासली गेली.

### २. काय अपेक्षित होते:
- जुन्या चाचणीनुसार `assert.strictEqual(mahaDbt.length, 13)` म्हणजेच MAHA DBT मध्ये १३ डॉक्स असणे अपेक्षित होते.

### ३. प्रत्यक्षात काय झाले:
- चाचणी नापास झाली: `Expected values to be strictly equal: 28 !== 13`.

### ४. Error कुठे आहे:
- **फाईल:** `scripts/test_rename_settings_and_fuzzy.js`
- **ओळ क्रमांक:** ४८
- **कोड:** `assert.strictEqual(mahaDbt.length, 13);`

### ५. Root cause काय आहे:
- ॲपच्या सुरुवातीच्या टप्प्यात MAHA DBT मध्ये केवळ १३ बेसिक डॉक्युमेंट्स होते. 
- नंतर चेकपॉईंट **CP-006** मध्ये वापरकर्त्याच्या गरजेनुसार विद्यार्थ्यांची सर्व २८ अधिकृत कागदपत्रे (उदा. रेशन कार्ड, बँक पासबुक, गॅप सर्टिफिकेट इत्यादी) समाविष्ट करून प्रीसेट परिपूर्ण करण्यात आला.
- प्रत्यक्षात २८ डॉक्स असणे हा ॲपचा मोठा फायदा आहे, परंतु जुनी टेस्ट १३ ची जुनी संख्या तपासत होती.

### ६. Fix काय आवश्यक आहे:
- `scripts/test_rename_settings_and_fuzzy.js` मधील ओळ ४८ अद्ययावत करणे:
  ```javascript
  assert.ok(mahaDbt.length >= 13, 'MAHA DBT must contain at least 13 official docs');
  ```

### ७. Fix नंतर कोणता re-test करायचा आहे:
- `node scripts/test_rename_settings_and_fuzzy.js` चालवून सर्व ७ पैकी ७ चाचण्या पास होतात की नाही हे तपासणे.

---

## 🔍 ५. अयशस्वी चाचणी ४: `test_smart_auto_rename.js` (Check 2)

### १. काय test केले:
- स्मार्ट ऑटो-रीनेम इंजिन आणि HTML UI घटकांची उपस्थिती तपासली गेली.

### २. काय अपेक्षित होते:
- HTML फाईलमध्ये `btnReviewUnmatched` नावाचे बटण अस्तित्वात असणे अपेक्षित होते.

### ३. प्रत्यक्षात काय झाले:
- चाचणी नापास झाली: `AssertionError [ERR_ASSERTION]: btnReviewUnmatched button must be in HTML`.

### ४. Error कुठे आहे:
- **फाईल:** `scripts/test_smart_auto_rename.js`
- **ओळ क्रमांक:** १०१
- **कोड:** `assert.ok(html.includes('id="btnReviewUnmatched"'), 'btnReviewUnmatched button must be in HTML');`

### ५. Root cause काय आहे:
- चेकपॉईंट **CP-006** आणि **CP-009** (README_LOCK.md ओळ ३७) मध्ये नमूद केल्यानुसार: *"Removed legacy hidden btnReviewUnmatched markup and JS handlers as operator uses direct queue click/Tab navigation"*.
- ऑपरेटरच्या सुलभतेसाठी हे लपलेले गोंधळ निर्माण करणारे बटण अधिकृतपणे काढून टाकण्यात आले होते आणि त्याऐवजी एकात्मिक `Cross-Check Modal` आणि थेट रांग नेव्हिगेशन कार्यान्वित केले गेले.
- जुनी चाचणी या आधीच निवृत्त झालेल्या घटकाची उपस्थिती तपासत होती.

### ६. Fix काय आवश्यक आहे:
- `scripts/test_smart_auto_rename.js` मधील ओळ १०१ वरील निवृत्त बटणाची तपासणी काढून त्याऐवजी सक्रिय `modalCrossCheck` किंवा `btnBulkRenameConfirm` ची तपासणी करणे.

### ७. Fix नंतर कोणता re-test करायचा आहे:
- `node scripts/test_smart_auto_rename.js` चालवून चाचणी १००% पास करणे.

---

## 📝 ६. वापरकर्त्याच्या मंजुरीसाठी प्रस्ताव (Approval Request)

वर स्पष्ट केल्याप्रमाणे **प्रॉडक्शन कोडमध्ये कोणतीही त्रुटी नाही**. हे सर्व अपयश केवळ जुन्या चाचणी स्क्रिप्ट्समधील कालबाह्य अटींमुळे (Outdated Assertions) आहेत.
कृपया खालील कृतीस मंजुरी द्यावी:
> **"वरील ४ जुन्या टेस्ट स्क्रिप्ट्समधील असर्टेशन्स अधिकृत CP-014 आर्किटेक्चरनुसार अद्ययावत करावीत का?"**  
> (आपण मंजुरी दिल्यानंतरच या स्क्रिप्ट्स अद्ययावत करून १००% ग्रीन रिझल्ट दाखवला जाईल).
