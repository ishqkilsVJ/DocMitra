# 🔒 LOCKED: DocMitra Admin & License Control Center (`DocMitra-Admin/`)

> [!IMPORTANT]
> **STRICTLY LOCKED & VERIFIED (ADMIN-CP-002)**  
> All core files, cryptographic offline keygen, desktop wrapper, and build scripts inside `DocMitra-Admin/` are locked and verified.  
> To modify this module, the user must explicitly confirm unlock: `UNLOCK DOCMITRA_ADMIN`.

---

## 🚩 Checkpoint Registry (`DocMitra-Admin`)

| Checkpoint ID | Date & Time (IST) | Git Commit / Target | 1-Line Clean Working Summary | Rollback Status |
| :---: | :---: | :---: | :--- | :---: |
| **`ADMIN-CP-002`** | 2026-11-25 09:48 AM | Universal Key & Request Decoder | Fixed Request Code auto-decoding in Admin Center (handles pasted request code in HWID box), aligned keygen to modern `DM-ACT-` format, implemented universal key verification in client supporting both `DM-ACT-` and `DM-LIC-` formats (tolerating `8` vs `B`), and recompiled standalone `DocMitra-Admin.exe` (73.94 MB) with 100% Dual-MCP QA pass. | Active Production |
| **`ADMIN-CP-001`** | 2026-11-25 08:50 AM | Baseline Release v1.4.4 | Standalone Bento Admin Center, Dual-Mode Native Window (pywebview + Edge app fallback), 100% Offline HMAC-SHA256 Mobile Keygen (`admin_keygen.html` & `mobile_keygen.html`), PyInstaller standalone `DocMitra-Admin.exe` (73.9 MB) with 4/4 automated tests passed and Dual-MCP verified. | Archived Baseline |

---

## 🔐 Cryptographic Architecture Summary
- **Signing Secret:** `DOCMITRA_ULTRA_SECURE_HMAC_KEY_2026_PROD`
- **Master Emergency 2FA PIN:** `998877`
- **TOTP Base32 Key:** `INGS 2QKE JVEU 4LKN IFJV IRKS FUZD AMRW`
- **Hardware Lock Prefix:** `DM-HW-XXXX-XXXX-XXXX` (Motherboard/BIOS GUID) & `DM-SYS-XXXX`
- **Activation Key Format:** Universal Support (`DM-ACT-<MODULES>-<EXPIRY>-XXXX-XXXX-XXXX-XXXX` & `DM-LIC-XXXX-XXXX-XXXX-XXXX`)
- **Offline Keygen Companion:** `DocMitra-Admin/admin_keygen.html` (Web Crypto API)
- **Local Port:** `3050` (auto-incrementing if busy)
