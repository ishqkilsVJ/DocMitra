# 🛡️ DocMitra Admin Center (`v1.4.4`)
**Strict Standalone Isolation Folder: `E:\DocMitra\DocMitra-Admin\`**

This directory is **100% self-contained and isolated** from the main DocMitra client software (`tools/rename_tool/`, `src/`, `src-tauri/`, `app/`). No files, styles, or dependencies from this directory are ever distributed to end-users or included in client builds.

---

## 📂 Files in this Directory

| File | Purpose | Description |
|---|---|---|
| **`admin_server.py`** | Core Admin Backend + GUI | Python HTTP server + Native PyWebView window on port `3050`. |
| **`mobile_keygen.html`** | Standalone Mobile Keygen Companion | Web Crypto HMAC-SHA256 offline key generator for mobile phones. |
| **`admin_data.json`** | Unified Local JSON Database | Stores licenses, active tester trials, audit trail, partners & expenses. |
| **`DocMitra-Admin.spec`** | PyInstaller Specification | Builds single-file standalone `DocMitra-Admin.exe`. |
| **`build_admin_exe.bat`** | One-Click Compiler Script | Compiles `DocMitra-Admin.exe` via PyInstaller. |
| **`start_admin.bat`** | Quick Launcher | Directly runs `python admin_server.py`. |
| **`tests/`** | Automated Test Suite | Unit tests for HMAC keygen, expiry calculation, and REST APIs. |

---

## 🔐 Security & Access Credentials

- **2FA Method:** RFC 6238 TOTP (Google Authenticator / Microsoft Authenticator)
- **Setup Key (Base32):** `INGS 2QKE JVEU 4LKN IFJV IRKS FUZD AMRW`
- **Master Emergency PIN:** `998877`
- **Cryptographic Signing Secret:** `DOCMITRA_ULTRA_SECURE_HMAC_KEY_2026_PROD`
- **License Key Format:** `DM-LIC-XXXX-XXXX-XXXX-XXXX`
- **Hardware ID (HWID) Format:** `DM-SYS-XXXX-...`
- **Default Port:** `3050` (auto-increments if port is busy)

---

## 🚀 How to Run & Use

### 1. Launching from Python (Development):
```powershell
cd E:\DocMitra\DocMitra-Admin
python admin_server.py
```
*Or double click `start_admin.bat`.*

### 2. Compiling Standalone `DocMitra-Admin.exe`:
```powershell
cd E:\DocMitra\DocMitra-Admin
.\build_admin_exe.bat
```
This generates `DocMitra-Admin.exe` in `E:\DocMitra\DocMitra-Admin\`.

---

## 📱 Mobile Keygen Companion

1. Connect your mobile phone to the **same WiFi network** as your PC.
2. In the Admin Dashboard header, click the **Mobile QR** button.
3. Scan the QR code with your phone's camera.
4. Enter Master PIN (`998877`) on your phone.
5. Generate DocMitra keys directly on your phone with one-click WhatsApp sharing!
