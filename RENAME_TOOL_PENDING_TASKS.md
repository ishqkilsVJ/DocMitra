# 📋 Rename Tool प्रलंबित कामे व कार्यसूची अहवाल (`RENAME_TOOL_PENDING_TASKS.md`)

> **DocMitra Suite — Bulk Document Renamer Tasks & Roadmap**  
> **शेवटचे अद्यतन:** 2026-11-25 06:22 AM IST  
> **सध्याची आवृत्ती:** v1.4.4 (Production Ready)  
> **मास्टर चेकपॉइंट:** `CP-019` (Stitch Missing Documents & Follow-up Desk Modal Integrated)

---

## 🎯 1. सध्याच्या आवृत्तीतील पूर्ण झालेली कामे (Completed Milestones)

| क्र. | घटक / फिचर | स्थिती | चेकपॉइंट | तपशील |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **3-Layer Indian Phonetic & Fuzzy Matcher** | ✅ पूर्ण (100%) | `CP-017` | `normalizeIndianText` + Double Metaphone + Hybrid Scoring (Exact 100%, Phonetic 85-90%, Overlap 60-80%). |
| **2** | **Settings Redesign (Sample 1)** | ✅ पूर्ण (100%) | `CP-018` | 42px Uniform Rows, `+X more` Keyword Popover, आणि सिंगल टॉप ॲक्शन बटन (`+ Add Document / Shortcut`). |
| **3** | **Missing Documents & Follow-up Desk** | ✅ पूर्ण (100%) | `CP-019` | Stitch डिझाइनमधून केंद्रस्थ मोडल (`missing_documents_modal.js`), SVG Circular Progress Gauge, Follow-up Date Picker, `📥 Import File` ऑटो-रीनेम हुक, आणि साइडबार ट्रिगर बटन. |
| **4** | **Dual-MCP Automated QA Verification** | ✅ पूर्ण (100%) | `CP-019` | Playwright MCP व Chrome DevTools MCP द्वारे ० कन्सोल एरर्ससह सत्यापित. |

---

## ⏳ 2. सध्याचे प्रलंबित कार्य (Current Pending Task)

| क्र. | प्रलंबित कार्य (Task) | प्राधान्य | स्थिती | तपशील |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Cypress E2E Suite for Missing Documents Desk** (`05_missing_documents_desk.cy.js`) | 🔴 उच्च (High) | 🔄 प्रगतीपथावर (In Progress) | नवीन 'Missing Documents & Follow-up Desk' मोडलसाठी स्वयंचलित Cypress चाचणी स्क्रिप्ट लिहिणे: <br>• ट्रिगर बटन क्लिक व मोडल ओपनिंग <br>• विद्यार्थ्याचे नाव पिल व DIR रिबन अचूकता <br>• ॲक्टिव्ह स्कीम स्विचिंग (`MAHA DBT` ➔ `CET CELL`) <br>• फॉलो-अप तारीख निवड व सेव्हिंग <br>• SVG सर्कुलर रिंग प्रोग्रेस डायनॅमिक अपडेट्स <br>• `Esc Close` व `Esc / Enter` कीबोर्ड शॉर्टकट द्वारे क्लोजिंग. |

---

## 🚀 3. भविष्यातील आवृत्ती (v2.0) साठी केवळ प्रस्ताव (Future Roadmap)

1. **मल्टी-फोल्डर बॅचिंग (Multi-Folder Concurrent Batching):** एकाच वेळी अनेक विद्यार्थ्यांची फोल्डर्स एकाच रांगेत लावून सलग प्रोसेस करणे.
2. **ऑप्टिकल कॅरेक्टर रेकग्निशन (OCR Engine Fallback):** अत्यंत अंधुक किंवा स्कॅनरमधील खराब कागदपत्रांसाठी अंतर्गत OCR फॉलबॅक.
3. **क्लाऊड बॅकअप सिंक (Optional Cloud Sync):** रीनेम झालेली कागदपत्रे युझरच्या खाजगी Google Drive वर थेट सिंक करण्याचा पर्यायी पर्याय.
