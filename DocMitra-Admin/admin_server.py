"""
DocMitra Admin Center v1.4.4
Standalone Isolated Executive Partner & License Control Center.
Includes:
 - Dual-Mode Native Desktop Window (pywebview) + Localhost Fallback
 - RFC 6238 TOTP 2FA + Emergency Master PIN (998877)
 - HMAC-SHA256 Cryptographic License Keygen (DM-LIC-XXXX-XXXX-XXXX-XXXX)
 - Tester Management (7D, 15D, 30D, Lifetime) bound to HWID (DM-SYS-XXXX)
 - One-click License Extension (+7 Days), HWID Reset, Kill-Switch Revocation
 - Google Stitch Administrative Bento Workstation UI
 - LAN Mobile Keygen Companion & QR Code
 - Audit Trail Logging & Executive Ledger (4 Partners + Expenses)
"""

import http.server
import socketserver
import urllib.parse
import os
import sys
import json
import time
import struct
import hmac
import hashlib
import base64
import threading
import io
import socket
import webbrowser
from datetime import datetime, timedelta

try:
    import qrcode
except ImportError:
    qrcode = None

try:
    import webview
except ImportError:
    webview = None

# PyInstaller safety redirects for --noconsole mode
if sys.stdout is None:
    try:
        sys.stdout = open(os.devnull, 'w')
    except Exception:
        pass
if sys.stderr is None:
    try:
        sys.stderr = open(os.devnull, 'w')
    except Exception:
        pass

ADMIN_VERSION = "v1.4.4"
DEFAULT_PORT = 3050

# Security Configuration
TOTP_SECRET = "INGS2QKEJVEU4LKNIFJVIRKSFUZDAMRW"
TOTP_SECRET_DISPLAY = "INGS 2QKE JVEU 4LKN IFJV IRKS FUZD AMRW"
MASTER_RECOVERY_PIN = "998877"
LICENSE_SIGNING_SECRET = "DOCMITRA_ULTRA_SECURE_HMAC_KEY_2026_PROD"

# Robust Paths
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(BASE_DIR, "admin_data.json")
MOBILE_KEYGEN_FILE = os.path.join(BASE_DIR, "mobile_keygen.html")

DATA_LOCK = threading.Lock()

# -------------------------------------------------------------
# Networking Helpers
# -------------------------------------------------------------
def get_local_ip():
    """Detect LAN IP address of current machine for Mobile Keygen QR code."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        # Does not send real packets, just determines routing table IP
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def find_free_port(start_port=3050, max_tries=50):
    for p in range(start_port, start_port + max_tries):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(('0.0.0.0', p))
            sock.close()
            return p
        except OSError:
            continue
    return start_port

def get_qr_data_uri(text):
    """Generates a Base64 Data URI PNG for a given text using qrcode library."""
    if not qrcode:
        return ""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=6,
            border=2,
        )
        qr.add_data(text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0037b0", back_color="#ffffff")
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{b64}"
    except Exception as e:
        return ""

# -------------------------------------------------------------
# Cryptography & 2FA Helpers
# -------------------------------------------------------------
def verify_totp(user_code, secret_b32=TOTP_SECRET):
    """Verifies RFC 6238 TOTP with +/- 1 time step tolerance, or Master PIN."""
    user_code = str(user_code).strip()
    if user_code == MASTER_RECOVERY_PIN:
        return True
    try:
        key = base64.b32decode(secret_b32.upper())
        current_step = int(time.time() // 30)
        for offset in (-1, 0, 1):
            step = current_step + offset
            msg = struct.pack(">Q", step)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            o = h[19] & 15
            token = (struct.unpack(">I", h[o:o+4])[0] & 0x7fffffff) % 1000000
            if f"{token:06d}" == user_code:
                return True
    except Exception:
        pass
    return False

def generate_license_key(hwid, customer_name, plan, modules_list):
    """
    Computes HMAC-SHA256 signature and formats DocMitra license key:
    DM-LIC-XXXX-XXXX-XXXX-XXXX
    """
    hwid = str(hwid).strip().upper()
    customer_name = str(customer_name).strip()
    plan = str(plan).strip().upper()
    modules_str = ",".join(modules_list) if isinstance(modules_list, list) else str(modules_list)
    
    payload = f"{hwid}:{customer_name}:{plan}:{modules_str}"
    sig = hmac.new(LICENSE_SIGNING_SECRET.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:16].upper()
    return f"DM-LIC-{sig[0:4]}-{sig[4:8]}-{sig[8:12]}-{sig[12:16]}"

def generate_activation_key_dm_act(hwid, customer_name, mod_code, expiry):
    """
    Computes HMAC-SHA256 signature and formats modern DocMitra activation key:
    DM-ACT-<MOD>-<EXPIRY>-XXXX-XXXX-XXXX-XXXX
    """
    hwid = str(hwid).strip().upper()
    customer_name = str(customer_name).strip()
    mod_code = str(mod_code).strip().upper()
    expiry = str(expiry).strip().upper()
    payload = f"{hwid}:{customer_name}:{mod_code}:{expiry}"
    sig = hmac.new(LICENSE_SIGNING_SECRET.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()[:16].upper()
    return f"DM-ACT-{mod_code}-{expiry}-{sig[0:4]}-{sig[4:8]}-{sig[8:12]}-{sig[12:16]}"

def calculate_expiry_date_str(plan):
    """Calculates YYYYMMDD string or LIFETIME for DM-ACT- format."""
    now = datetime.now()
    if plan == "TRIAL_7D":
        return (now + timedelta(days=7)).strftime("%Y%m%d")
    elif plan == "TRIAL_15D":
        return (now + timedelta(days=15)).strftime("%Y%m%d")
    elif plan == "TRIAL_30D":
        return (now + timedelta(days=30)).strftime("%Y%m%d")
    elif plan == "LIFETIME":
        return "LIFETIME"
    return (now + timedelta(days=15)).strftime("%Y%m%d")

def get_module_code_from_list(modules_list):
    """Converts modules list to compact code (e.g. ALL, RF, RFP, RFPI, etc.)."""
    if isinstance(modules_list, str):
        modules_list = [m.strip() for m in modules_list.split(',')]
    r = any('Rename' in m for m in modules_list)
    f = any('Desk' in m or 'Follow' in m for m in modules_list)
    p = any('PDF' in m for m in modules_list)
    i = any('Image' in m for m in modules_list)
    s = any('Print' in m for m in modules_list)
    if r and f and p and i and s:
        return 'ALL'
    code = ''
    if r: code += 'R'
    if f: code += 'F'
    if p: code += 'P'
    if i: code += 'I'
    if s: code += 'S'
    return code if code else 'R'

def parse_request_code_server(raw_str):
    """Safely decodes DM-REQ- base64 JSON payload if present."""
    if not raw_str:
        return None
    raw_str = raw_str.strip()
    b64 = raw_str
    if raw_str.startswith('DM-REQ-'):
        b64 = raw_str[7:].strip()
    try:
        missing_padding = len(b64) % 4
        if missing_padding:
            b64 += '=' * (4 - missing_padding)
        decoded = base64.b64decode(b64).decode('utf-8')
        obj = json.loads(decoded)
        if isinstance(obj, dict) and ('h' in obj or 'u' in obj):
            return {
                'hwid': obj.get('h', '').strip(),
                'userName': obj.get('u', '').strip(),
                'contact': obj.get('p', '').strip(),
                'timestamp': obj.get('t', 0)
            }
    except Exception:
        pass
    return None

def calculate_expiry(plan):
    """Calculates ISO expiration datetime string based on selected plan."""
    now = datetime.now()
    if plan == "TRIAL_7D":
        return (now + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
    elif plan == "TRIAL_15D":
        return (now + timedelta(days=15)).strftime("%Y-%m-%d %H:%M:%S")
    elif plan == "TRIAL_30D":
        return (now + timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    elif plan == "LIFETIME":
        return "LIFETIME"
    return "LIFETIME"

# -------------------------------------------------------------
# Data Store Management
# -------------------------------------------------------------
def get_initial_data():
    now = datetime.now()
    return {
        "monthlyTarget": {
            "targetLicenses": 25,
            "targetRevenue": 60000,
            "currentMonth": now.strftime("%B %Y")
        },
        "partners": [
            {"id": 1, "name": "Partner 1 (Lead / Founder)", "role": "Software Architecture & Tech Lead", "sharePercent": 25, "investment": 0, "paidAmount": 0},
            {"id": 2, "name": "Partner 2 (Media & Marketing)", "role": "Instagram / Social Media Ads", "sharePercent": 25, "investment": 0, "paidAmount": 0},
            {"id": 3, "name": "Partner 3 (Operations Admin)", "role": "Customer Verification & Operations", "sharePercent": 25, "investment": 0, "paidAmount": 0},
            {"id": 4, "name": "Partner 4 (Sales & Distribution)", "role": "College & Cyber Cafe Onboarding", "sharePercent": 25, "investment": 0, "paidAmount": 0}
        ],
        "licenses": [],
        "customers": [],
        "expenses": [],
        "auditLogs": []
    }

def load_data():
    with DATA_LOCK:
        if not os.path.exists(DATA_FILE):
            data = get_initial_data()
            save_data(data)
            return data
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Ensure schema backward compatibility
            if "licenses" not in data and "customers" in data:
                data["licenses"] = data["customers"]
            elif "licenses" in data and "customers" not in data:
                data["customers"] = data["licenses"]
            if "auditLogs" not in data:
                data["auditLogs"] = []
            return data
        except Exception:
            return get_initial_data()

def save_data(data):
    with DATA_LOCK:
        # Keep customers and licenses arrays synced
        if "licenses" in data:
            data["customers"] = data["licenses"]
        elif "customers" in data:
            data["licenses"] = data["customers"]
        try:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[Error saving data] {e}")

def add_audit_log(data, action, customer_name, hwid, details):
    if "auditLogs" not in data:
        data["auditLogs"] = []
    log_entry = {
        "id": f"LOG-{int(time.time()*1000)}",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "action": action,
        "customerName": customer_name,
        "hwid": hwid,
        "details": details
    }
    data["auditLogs"].insert(0, log_entry)
    # keep max 200 logs
    if len(data["auditLogs"]) > 200:
        data["auditLogs"] = data["auditLogs"][:200]

def compute_metrics(data):
    now = datetime.now()
    licenses = data.get("licenses", [])
    
    total_issued = len(licenses)
    active_testers = 0
    unique_hwids = set()
    revoked_or_expired = 0
    active_licenses = 0
    
    for lic in licenses:
        hwid = lic.get("hwid", "").strip().upper()
        if hwid:
            unique_hwids.add(hwid)
            
        status = lic.get("status", "ACTIVE").upper()
        plan = lic.get("plan", "").upper()
        expires_at = lic.get("expiresAt", "")
        
        # Check automatic expiry
        is_expired = False
        if status != "REVOKED" and expires_at and expires_at != "LIFETIME":
            try:
                exp_dt = datetime.strptime(expires_at, "%Y-%m-%d %H:%M:%S")
                if now > exp_dt:
                    is_expired = True
            except Exception:
                pass
                
        effective_status = "REVOKED" if status == "REVOKED" else ("EXPIRED" if is_expired else status)
        lic["effectiveStatus"] = effective_status
        
        if effective_status == "ACTIVE":
            active_licenses += 1
            if plan.startswith("TRIAL_"):
                active_testers += 1
        elif effective_status in ("REVOKED", "EXPIRED"):
            revoked_or_expired += 1

    expenses = data.get("expenses", [])
    total_expenses = sum(float(e.get("amount", 0)) for e in expenses)

    return {
        "totalIssued": total_issued,
        "activeLicenses": active_licenses,
        "activeTesters": active_testers,
        "hwidLockedCount": len(unique_hwids),
        "revokedOrExpired": revoked_or_expired,
        "totalExpenses": total_expenses,
        "monthlyTarget": data.get("monthlyTarget", {}),
        "partners": data.get("partners", []),
        "auditLogs": data.get("auditLogs", [])[:30]
    }

# -------------------------------------------------------------
# Google Stitch Bento Dashboard HTML UI
# -------------------------------------------------------------
def get_dashboard_html():
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>DocMitra Admin Center {ADMIN_VERSION}</title>
  
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet"/>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          colors: {{
            surface: '#f8f9ff',
            'surface-dim': '#cbdbf5',
            'surface-container-lowest': '#ffffff',
            'surface-container-low': '#eff4ff',
            'surface-container': '#e5eeff',
            'surface-container-high': '#dce9ff',
            'on-surface': '#0b1c30',
            'on-surface-variant': '#434655',
            'inverse-surface': '#213145',
            'inverse-on-surface': '#eaf1ff',
            outline: '#747686',
            'outline-variant': '#c4c5d7',
            primary: '#0037b0',
            'primary-container': '#1d4ed8',
            'on-primary': '#ffffff',
            secondary: '#565e74',
            tertiary: '#004f35',
            'tertiary-container': '#006948',
            error: '#ba1a1a',
          }},
          fontFamily: {{
            sans: ['Inter', 'sans-serif'],
            display: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }}
        }}
      }}
    }};
  </script>
  <style>
    body {{ background-color: #f8f9ff; color: #0b1c30; font-family: 'Inter', sans-serif; }}
    .bento-card {{
      background: #ffffff;
      border: 1px solid rgba(196, 197, 215, 0.4);
      box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
      border-radius: 0.75rem;
    }}
    .material-symbols-outlined {{
      font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24;
    }}
    /* Custom subtle scrollbar */
    ::-webkit-scrollbar {{ width: 6px; height: 6px; }}
    ::-webkit-scrollbar-track {{ background: transparent; }}
    ::-webkit-scrollbar-thumb {{ background: #c4c5d7; border-radius: 3px; }}
    ::-webkit-scrollbar-thumb:hover {{ background: #747686; }}
  </style>
</head>
<body class="bg-surface text-on-surface min-h-screen flex flex-col antialiased selection:bg-blue-100">

  <!-- Floating Toast System -->
  <div id="toastContainer" class="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

  <!-- AUTH MODAL OVERLAY (Shown if not authenticated) -->
  <div id="authOverlay" class="fixed inset-0 z-50 bg-[#0b1c30]/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="w-full max-w-md bento-card p-7 flex flex-col shadow-2xl">
      <div class="flex items-center gap-3.5 mb-6">
        <div class="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#0037b0] flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-[28px]">shield_person</span>
        </div>
        <div>
          <h1 class="font-display font-bold text-xl text-[#0b1c30] tracking-tight">DocMitra Admin Center</h1>
          <p class="text-xs text-[#434655]">Master 2FA &amp; Security Authentication</p>
        </div>
      </div>

      <div class="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-5 text-xs text-[#0037b0] flex items-start gap-2.5">
        <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified_user</span>
        <span>RFC 6238 TOTP Protected. Enter Authenticator code or Master Emergency PIN (<strong class="font-mono font-bold">998877</strong>).</span>
      </div>

      <div class="mb-5">
        <label class="block text-xs font-bold text-[#434655] uppercase tracking-wider mb-2">Authenticator PIN / Code</label>
        <input type="password" id="authPinInput" placeholder="••••••" maxlength="10" class="w-full text-center font-mono font-bold text-2xl tracking-[0.3em] py-3.5 bg-[#f8f9ff] border border-[#c4c5d7]/60 rounded-xl focus:border-[#0037b0] focus:ring-2 focus:ring-blue-100 outline-none transition-all">
        <div id="authErrMsg" class="text-xs font-semibold text-rose-600 mt-2 text-center hidden flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-[14px]">error</span> Invalid Master PIN or TOTP Code.
        </div>
      </div>

      <button onclick="submitAuth()" class="w-full py-3.5 bg-[#0037b0] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2">
        <span>Verify &amp; Unlock Admin Center</span>
        <span class="material-symbols-outlined text-[18px]">lock_open</span>
      </button>

      <div class="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#434655]">
        <span>TOTP Secret: <code class="font-mono bg-slate-100 px-1 py-0.5 rounded">{TOTP_SECRET_DISPLAY}</code></span>
      </div>
    </div>
  </div>

  <!-- APP TOP HEADER -->
  <header class="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      
      <!-- Brand & Title -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-[#0037b0] text-white flex items-center justify-center shadow-xs">
          <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-display font-bold text-base text-[#0b1c30] tracking-tight">DocMitra Admin Center</span>
            <span class="px-2 py-0.5 rounded-full bg-blue-50 text-[#0037b0] text-[10px] font-mono font-bold border border-blue-200">{ADMIN_VERSION}</span>
          </div>
          <p class="text-[11px] text-[#434655]">Standalone Isolated License &amp; Tester Management</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <nav class="hidden md:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs font-semibold">
        <button onclick="switchTab('licenses')" id="tabBtnLicenses" class="px-3.5 py-1.5 rounded-lg bg-white text-[#0037b0] shadow-xs flex items-center gap-1.5 transition-all">
          <span class="material-symbols-outlined text-[16px]">vpn_key</span>
          <span>Licenses &amp; Testers</span>
        </button>
        <button onclick="switchTab('audit')" id="tabBtnAudit" class="px-3.5 py-1.5 rounded-lg text-[#434655] hover:text-[#0b1c30] flex items-center gap-1.5 transition-all">
          <span class="material-symbols-outlined text-[16px]">history</span>
          <span>Audit Trail</span>
        </button>
        <button onclick="switchTab('ledger')" id="tabBtnLedger" class="px-3.5 py-1.5 rounded-lg text-[#434655] hover:text-[#0b1c30] flex items-center gap-1.5 transition-all">
          <span class="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          <span>Executive Ledger</span>
        </button>
      </nav>

      <!-- Right Control Pills -->
      <div class="flex items-center gap-2.5">
        <!-- Air-gapped badge -->
        <div class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Local Air-Gapped</span>
        </div>

        <!-- LAN QR Modal Button -->
        <button onclick="openQrModal()" class="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-semibold text-[#0b1c30] flex items-center gap-1.5 transition-colors" title="Mobile Keygen via LAN WiFi">
          <span class="material-symbols-outlined text-[16px] text-[#0037b0]">qr_code_2</span>
          <span class="hidden sm:inline">Mobile QR</span>
        </button>

        <!-- Port badge -->
        <span class="font-mono text-[11px] px-2 py-1 rounded-lg bg-slate-100 text-[#434655] border border-slate-200" id="portDisplay">PORT: 3050</span>

        <!-- Logout / Lock -->
        <button onclick="lockAdmin()" class="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-rose-50 hover:text-rose-600 text-[#434655] flex items-center justify-center transition-colors" title="Lock Admin Session">
          <span class="material-symbols-outlined text-[18px]">lock</span>
        </button>
      </div>

    </div>
  </header>

  <!-- MAIN WRAPPER -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

    <!-- TAB 1: LICENSES & TESTER MANAGEMENT -->
    <div id="tabLicensesContent" class="space-y-6">
      
      <!-- TOP BENTO KPI CARDS (4 Cards) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- KPI 1 -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-[#434655]">
            <span class="text-xs font-semibold uppercase tracking-wider">Total Issued</span>
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-[#0037b0] flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px]">workspace_premium</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="font-display font-bold text-2xl text-[#0b1c30]" id="kpiTotalIssued">0</span>
            <p class="text-[11px] text-[#434655] mt-0.5">Lifetime + Tester Trials</p>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-[#434655]">
            <span class="text-xs font-semibold uppercase tracking-wider">Active Testers</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px]">science</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="font-display font-bold text-2xl text-emerald-700" id="kpiActiveTesters">0</span>
            <p class="text-[11px] text-[#434655] mt-0.5">Currently valid trials</p>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-[#434655]">
            <span class="text-xs font-semibold uppercase tracking-wider">HWID Bound</span>
            <div class="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px]">devices</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="font-display font-bold text-2xl text-indigo-700" id="kpiHwidCount">0</span>
            <p class="text-[11px] text-[#434655] mt-0.5">Unique locked machines</p>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="bento-card p-4 flex flex-col justify-between">
          <div class="flex items-center justify-between text-[#434655]">
            <span class="text-xs font-semibold uppercase tracking-wider">Revoked / Lapsed</span>
            <div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <span class="material-symbols-outlined text-[16px]">gpp_bad</span>
            </div>
          </div>
          <div class="mt-3">
            <span class="font-display font-bold text-2xl text-rose-700" id="kpiRevokedExpired">0</span>
            <p class="text-[11px] text-[#434655] mt-0.5">Kill-switch or expired</p>
          </div>
        </div>
      </div>

      <!-- MAIN 12-COLUMN DUAL WORKSTATION GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT 4-COLS: QUICK LICENSE & TESTER KEY GENERATOR -->
        <div class="lg:col-span-4 bento-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0037b0] text-[20px]">key</span>
              <h2 class="font-display font-bold text-sm text-[#0b1c30]">Quick License Generator</h2>
            </div>
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">HMAC-SHA256</span>
          </div>

          <!-- Request Code Input Box -->
          <div class="bg-blue-50/70 p-3 rounded-lg border border-blue-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-[#0037b0] flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">input</span>
                <span>Paste Client Request Code</span>
              </label>
              <button type="button" onclick="pasteAdminRequestCode()" class="text-[10px] font-bold text-[#0037b0] hover:underline flex items-center gap-0.5 cursor-pointer">
                <span class="material-symbols-outlined text-[13px]">content_paste</span>
                <span>Paste</span>
              </button>
            </div>
            <textarea id="genReqCodeInput" rows="2" placeholder="Paste DM-REQ-eyJo... to auto-decode Name &amp; HWID" oninput="handleAdminReqCode(this.value)" class="w-full text-[11px] font-mono p-2 bg-white border border-blue-200 rounded-lg outline-none focus:border-[#0037b0]"></textarea>
            <div id="reqDecodedNotice" class="text-[10px] text-emerald-700 font-semibold hidden flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">check_circle</span>
              <span id="reqDecodedNoticeText">Decoded User: -</span>
            </div>
          </div>

          <!-- Customer / Tester Name -->
          <div>
            <label class="block text-xs font-semibold text-[#434655] mb-1">Customer / Tester Name *</label>
            <input type="text" id="genCustName" placeholder="e.g. Rajesh Patil (Cyber Cafe Nagpur)" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] focus:ring-1 focus:ring-blue-100 outline-none">
          </div>

          <!-- Machine Hardware ID (HWID) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-[#434655]">Hardware ID (HWID) *</label>
              <span class="font-mono text-[10px] text-slate-400">DM-SYS-XXXX</span>
            </div>
            <input type="text" id="genHwid" placeholder="DM-SYS-D83E-714F-3E56-D773" oninput="formatHwidField(this)" class="w-full font-mono text-xs uppercase px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] focus:ring-1 focus:ring-blue-100 outline-none">
          </div>

          <!-- Validity Plan -->
          <div>
            <label class="block text-xs font-semibold text-[#434655] mb-1">License Tier / Validity *</label>
            <select id="genPlan" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] focus:ring-1 focus:ring-blue-100 outline-none font-medium">
              <option value="TRIAL_15D">🧪 15 Days Tester Trial (Standard)</option>
              <option value="TRIAL_7D">⚡ 7 Days Quick Tester Trial</option>
              <option value="TRIAL_30D">📅 30 Days Extended Tester Trial</option>
              <option value="LIFETIME">🌟 Lifetime Pro License</option>
            </select>
          </div>

          <!-- Module Permissions (Checkboxes) -->
          <div class="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <label class="block text-[11px] font-bold text-[#0037b0] uppercase tracking-wider mb-2">Permitted Modules</label>
            <div class="grid grid-cols-2 gap-2 text-xs text-[#0b1c30]">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="genModRename" checked class="w-3.5 h-3.5 rounded text-[#0037b0]">
                <span>Bulk Renamer</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="genModDesk" checked class="w-3.5 h-3.5 rounded text-[#0037b0]">
                <span>Missing Desk</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="genModPdf" checked class="w-3.5 h-3.5 rounded text-[#0037b0]">
                <span>PDF Studio</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="genModImage" checked class="w-3.5 h-3.5 rounded text-[#0037b0]">
                <span>Image Studio</span>
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-semibold text-[#434655] mb-1">Notes / Tag (Optional)</label>
            <input type="text" id="genNotes" placeholder="e.g. Beta testing Nagpur district" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] focus:ring-1 focus:ring-blue-100 outline-none">
          </div>

          <!-- Generate Action Button -->
          <button onclick="requestGenerateLicense()" class="w-full py-2.5 bg-[#0037b0] hover:bg-[#1d4ed8] active:scale-[0.99] text-white font-semibold rounded-lg text-xs shadow-sm transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            <span>Issue &amp; Register License Key</span>
          </button>

          <!-- Generated Key Result Card -->
          <div id="genResultBox" class="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg hidden space-y-2.5">
            <div class="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                <span>Hardware License Key Issued!</span>
              </span>
              <span id="genResultBadge" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">15D</span>
            </div>

            <div id="genResultKey" class="font-mono font-bold text-xs text-[#0b1c30] bg-white p-2.5 rounded border border-emerald-300 text-center select-all tracking-wider">
              DM-LIC-XXXX-XXXX-XXXX-XXXX
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="copyGeneratedKey()" class="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-[#0b1c30] flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[14px]">content_copy</span>
                <span>Copy Key</span>
              </button>
              <button onclick="shareGeneratedKeyWhatsApp()" class="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[14px]">chat</span>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT 8-COLS: ACTIVE LICENSES & TESTER MANAGEMENT TABLE -->
        <div class="lg:col-span-8 bento-card p-5 space-y-4">
          
          <!-- Search & Filter Controls -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-sm">
              <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-[#747686]">search</span>
              <input type="text" id="tableSearchInput" oninput="applyTableFilter()" placeholder="Search customer, HWID, or key..." class="w-full text-xs pl-8 pr-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] outline-none">
            </div>

            <!-- Filter Pills -->
            <div class="flex items-center gap-1 text-[11px] font-semibold overflow-x-auto pb-1 sm:pb-0">
              <button onclick="setFilter('ALL')" id="filterBtnALL" class="px-2.5 py-1 rounded-md bg-[#0037b0] text-white transition-colors">All</button>
              <button onclick="setFilter('ACTIVE')" id="filterBtnACTIVE" class="px-2.5 py-1 rounded-md bg-slate-100 text-[#434655] hover:bg-slate-200 transition-colors">Active</button>
              <button onclick="setFilter('TESTER')" id="filterBtnTESTER" class="px-2.5 py-1 rounded-md bg-slate-100 text-[#434655] hover:bg-slate-200 transition-colors">Tester Trials</button>
              <button onclick="setFilter('EXPIRED')" id="filterBtnEXPIRED" class="px-2.5 py-1 rounded-md bg-slate-100 text-[#434655] hover:bg-slate-200 transition-colors">Expired</button>
              <button onclick="setFilter('REVOKED')" id="filterBtnREVOKED" class="px-2.5 py-1 rounded-md bg-slate-100 text-[#434655] hover:bg-slate-200 transition-colors">Revoked</button>
            </div>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto rounded-lg border border-outline-variant/40">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-surface-container-low text-[#434655] font-semibold border-b border-outline-variant/40">
                  <th class="p-3">Status</th>
                  <th class="p-3">Customer / Tester</th>
                  <th class="p-3">HWID (Machine Lock)</th>
                  <th class="p-3">Plan &amp; Expiry</th>
                  <th class="p-3">License Key</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="licensesTableBody" class="divide-y divide-slate-100 bg-white">
                <tr>
                  <td colspan="6" class="p-6 text-center text-slate-400">Loading licenses...</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Bottom Bar -->
          <div class="flex items-center justify-between text-[11px] text-[#434655] pt-2">
            <span id="tableShowingCount">Showing 0 licenses</span>
            <button onclick="exportJsonBackup()" class="flex items-center gap-1 text-[#0037b0] hover:underline font-semibold">
              <span class="material-symbols-outlined text-[14px]">download</span>
              <span>Export admin_data.json Backup</span>
            </button>
          </div>

        </div>

      </div>

    </div>

    <!-- TAB 2: AUDIT TRAIL LOGS -->
    <div id="tabAuditContent" class="space-y-4 hidden">
      <div class="bento-card p-5">
        <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#0037b0] text-[22px]">history_toggle_off</span>
            <div>
              <h2 class="font-display font-bold text-sm text-[#0b1c30]">Security Audit Trail</h2>
              <p class="text-[11px] text-[#434655]">Real-time immutable log of key generations, extensions, HWID resets, and revocations</p>
            </div>
          </div>
          <button onclick="loadDashboard()" class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-[#434655]">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>

        <div class="overflow-x-auto rounded-lg border border-outline-variant/40">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-surface-container-low text-[#434655] font-semibold border-b border-outline-variant/40">
                <th class="p-3">Timestamp</th>
                <th class="p-3">Action</th>
                <th class="p-3">Customer</th>
                <th class="p-3">HWID</th>
                <th class="p-3">Event Details</th>
              </tr>
            </thead>
            <tbody id="auditTableBody" class="divide-y divide-slate-100 bg-white font-mono text-[11px]">
              <tr>
                <td colspan="5" class="p-6 text-center text-slate-400">No audit events recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: EXECUTIVE LEDGER & 4-PARTNER PROFIT SPLIT -->
    <div id="tabLedgerContent" class="space-y-6 hidden">
      <!-- Target & Partner Split -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- 4 Partners Breakdown -->
        <div class="bento-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#0037b0] text-[20px]">groups</span>
              <h2 class="font-display font-bold text-sm text-[#0b1c30]">4-Partner Enterprise Share (25% Each)</h2>
            </div>
          </div>
          <div id="partnerListContainer" class="space-y-2.5">
            <!-- Rendered via JS -->
          </div>
        </div>

        <!-- Expense Ledger Card -->
        <div class="bento-card p-5 space-y-4">
          <div class="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-rose-600 text-[20px]">receipt_long</span>
              <h2 class="font-display font-bold text-sm text-[#0b1c30]">Expense Ledger</h2>
            </div>
            <button onclick="openAddExpenseModal()" class="px-2.5 py-1 bg-blue-50 text-[#0037b0] border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">add</span>
              <span>Add Expense</span>
            </button>
          </div>

          <div class="overflow-x-auto rounded-lg border border-outline-variant/40 max-h-72 overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-surface-container-low text-[#434655] font-semibold border-b border-outline-variant/40 sticky top-0">
                  <th class="p-2.5">Date</th>
                  <th class="p-2.5">Title</th>
                  <th class="p-2.5">Spent By</th>
                  <th class="p-2.5 text-right">Amount</th>
                  <th class="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody id="expenseTableBody" class="divide-y divide-slate-100 bg-white">
                <!-- Rendered via JS -->
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

  </main>

  <!-- MODAL: LAN MOBILE QR CODE -->
  <div id="qrModal" class="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="w-full max-w-sm bento-card p-6 flex flex-col items-center text-center shadow-xl">
      <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#0037b0] flex items-center justify-center mb-3">
        <span class="material-symbols-outlined text-[24px]">qr_code_scanner</span>
      </div>
      <h3 class="font-display font-bold text-base text-[#0b1c30]">Mobile Keygen via LAN</h3>
      <p class="text-xs text-[#434655] mt-1 mb-4">Scan with your phone connected to the same WiFi network to generate keys on mobile.</p>

      <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-3">
        <img id="qrImage" src="" alt="LAN QR Code" class="w-48 h-48 object-contain">
      </div>

      <div class="w-full bg-[#f8f9ff] border border-slate-200 rounded-lg p-2 text-xs font-mono text-[#0037b0] break-all select-all mb-4" id="lanUrlDisplay">
        http://...
      </div>

      <button onclick="closeQrModal()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] font-semibold rounded-lg text-xs">
        Close
      </button>
    </div>
  </div>

  <!-- MODAL: RESET HWID -->
  <div id="resetHwidModal" class="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="w-full max-w-md bento-card p-6 flex flex-col shadow-xl">
      <div class="flex items-center gap-2.5 mb-4">
        <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-[20px]">swap_horiz</span>
        </div>
        <div>
          <h3 class="font-display font-bold text-sm text-[#0b1c30]">Reset Hardware Machine Lock (HWID)</h3>
          <p class="text-[11px] text-[#434655]" id="resetModalSubtext">Tester switched machine or reinstalled Windows</p>
        </div>
      </div>

      <input type="hidden" id="resetModalLicId">

      <div class="space-y-3 mb-5">
        <div>
          <label class="block text-xs font-semibold text-[#434655] mb-1">New Machine Hardware ID (HWID) *</label>
          <input type="text" id="resetModalNewHwid" placeholder="DM-SYS-XXXX-XXXX-XXXX-XXXX" oninput="formatHwidField(this)" class="w-full font-mono text-xs uppercase px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg focus:border-[#0037b0] outline-none">
        </div>
        <p class="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          ⚠️ Resetting the HWID will cryptographically re-sign the license key. The tester must activate DocMitra using the newly re-signed key.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button onclick="closeResetHwidModal()" class="py-2 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] font-semibold rounded-lg text-xs">
          Cancel
        </button>
        <button onclick="submitResetHwid()" class="py-2 bg-[#0037b0] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs">
          Confirm &amp; Re-Sign Key
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: ADD EXPENSE -->
  <div id="addExpenseModal" class="fixed inset-0 z-50 bg-[#0b1c30]/70 backdrop-blur-xs hidden flex items-center justify-center p-4">
    <div class="w-full max-w-md bento-card p-6 flex flex-col shadow-xl space-y-3">
      <h3 class="font-display font-bold text-sm text-[#0b1c30]">Record New Business Expense</h3>
      
      <div>
        <label class="block text-xs font-semibold text-[#434655] mb-1">Title / Purpose *</label>
        <input type="text" id="expTitle" placeholder="e.g. Domain renewal, server hosting" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg outline-none">
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs font-semibold text-[#434655] mb-1">Amount (₹) *</label>
          <input type="number" id="expAmount" placeholder="5000" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#434655] mb-1">Spent By *</label>
          <select id="expSpentBy" class="w-full text-xs px-3 py-2 bg-[#f8f9ff] border border-outline-variant/60 rounded-lg outline-none">
            <option value="Partner 1 (Lead / Founder)">Partner 1 (Lead / Founder)</option>
            <option value="Partner 2 (Media & Marketing)">Partner 2 (Media & Marketing)</option>
            <option value="Partner 3 (Operations Admin)">Partner 3 (Operations Admin)</option>
            <option value="Partner 4 (Sales & Distribution)">Partner 4 (Sales & Distribution)</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2">
        <button onclick="closeAddExpenseModal()" class="py-2 bg-slate-100 hover:bg-slate-200 text-[#0b1c30] font-semibold rounded-lg text-xs">
          Cancel
        </button>
        <button onclick="submitAddExpense()" class="py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs">
          Save Expense
        </button>
      </div>
    </div>
  </div>

  <!-- APP FOOTER -->
  <footer class="mt-auto bg-surface-container-lowest border-t border-outline-variant/30 py-3 px-6 text-xs text-[#434655]">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-[#0b1c30]">DocMitra Admin Center</span>
        <span>•</span>
        <span>Strictly Isolated Management Suite</span>
      </div>
      <div class="flex items-center gap-3 font-mono text-[11px]">
        <span>HMAC: SHA-256</span>
        <span>•</span>
        <span>Target: 25 Licenses</span>
        <span>•</span>
        <span class="text-emerald-700 font-bold">100% AIR-GAPPED</span>
      </div>
    </div>
  </footer>

  <!-- CORE DASHBOARD CLIENT LOGIC -->
  <script>
    let appData = {{ licenses: [], expenses: [], partners: [], summary: {{}} }};
    let currentFilter = 'ALL';
    let currentTab = 'licenses';
    let isAuthenticated = false;

    // Toast Function
    function showToast(msg, type = 'success') {{
      const c = document.getElementById('toastContainer');
      const el = document.createElement('div');
      const bg = type === 'error' ? 'bg-rose-700 text-white' : 'bg-[#0b1c30] text-white';
      const icon = type === 'error' ? 'error' : 'check_circle';
      el.className = `${{bg}} px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 pointer-events-auto transition-all transform duration-200`;
      el.innerHTML = `<span class="material-symbols-outlined text-[16px]">${{icon}}</span><span>${{msg}}</span>`;
      c.appendChild(el);
      setTimeout(() => {{
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }}, 3000);
    }}

    // Auth Handling
    async function submitAuth() {{
      const pin = document.getElementById('authPinInput').value.trim();
      try {{
        const resp = await fetch('/api/admin/auth', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ code: pin }})
        }});
        const res = await resp.json();
        if (res.success) {{
          isAuthenticated = true;
          sessionStorage.setItem('dm_admin_token', 'AUTH_OK');
          document.getElementById('authOverlay').classList.add('hidden');
          showToast('Admin Center Unlocked! ⚡');
          loadDashboard();
        }} else {{
          document.getElementById('authErrMsg').classList.remove('hidden');
        }}
      }} catch (err) {{
        console.error(err);
        showToast('Server connection failed', 'error');
      }}
    }}

    function lockAdmin() {{
      sessionStorage.removeItem('dm_admin_token');
      document.getElementById('authPinInput').value = '';
      document.getElementById('authOverlay').classList.remove('hidden');
    }}

    document.getElementById('authPinInput').addEventListener('keydown', (e) => {{
      if (e.key === 'Enter') submitAuth();
    }});

    // Tab Navigation
    function switchTab(tab) {{
      currentTab = tab;
      ['licenses', 'audit', 'ledger'].forEach(t => {{
        const btn = document.getElementById('tabBtn' + capitalize(t));
        const content = document.getElementById('tab' + capitalize(t) + 'Content');
        if (t === tab) {{
          btn.className = 'px-3.5 py-1.5 rounded-lg bg-white text-[#0037b0] shadow-xs flex items-center gap-1.5 transition-all';
          content.classList.remove('hidden');
        }} else {{
          btn.className = 'px-3.5 py-1.5 rounded-lg text-[#434655] hover:text-[#0b1c30] flex items-center gap-1.5 transition-all';
          content.classList.add('hidden');
        }}
      }});
    }}

    function capitalize(s) {{ return s.charAt(0).toUpperCase() + s.slice(1); }}

    // Parse DM-REQ- Base64 JSON Payload
    function parseAdminReqPayload(raw) {{
      if (!raw) return null;
      raw = raw.trim();
      let b64 = raw;
      if (raw.startsWith('DM-REQ-')) {{
        b64 = raw.substring(7).trim();
      }}
      try {{
        // Add padding if missing
        const padLen = (4 - (b64.length % 4)) % 4;
        if (padLen > 0) b64 += '='.repeat(padLen);
        const jsonStr = atob(b64);
        const obj = JSON.parse(jsonStr);
        if (obj && (obj.h || obj.u)) {{
          return {{
            hwid: (obj.h || '').trim(),
            userName: (obj.u || '').trim(),
            contact: (obj.p || '').trim(),
            timestamp: obj.t || 0
          }};
        }}
      }} catch (e) {{
        // Not a valid base64 JSON
      }}
      return null;
    }}

    // Handle Client Request Code Input
    function handleAdminReqCode(raw) {{
      const parsed = parseAdminReqPayload(raw);
      const noticeBox = document.getElementById('reqDecodedNotice');
      const noticeText = document.getElementById('reqDecodedNoticeText');
      if (parsed) {{
        if (parsed.userName) {{
          document.getElementById('genCustName').value = parsed.userName;
        }}
        if (parsed.hwid) {{
          document.getElementById('genHwid').value = parsed.hwid;
        }}
        if (noticeBox && noticeText) {{
          noticeText.textContent = `✓ Decoded: ${{parsed.userName || 'User'}} | HWID: ${{parsed.hwid}}`;
          noticeBox.classList.remove('hidden');
        }}
        showToast('Client Request Code Decoded! ⚡');
      }} else {{
        if (noticeBox) noticeBox.classList.add('hidden');
      }}
    }}

    // Paste Client Request Code from Clipboard
    async function pasteAdminRequestCode() {{
      try {{
        const text = await navigator.clipboard.readText();
        if (text) {{
          document.getElementById('genReqCodeInput').value = text.trim();
          handleAdminReqCode(text.trim());
        }}
      }} catch (e) {{
        alert('Please paste request code using Ctrl+V');
      }}
    }}

    // Auto-Format HWID Field (with auto-detect if user pastes Request Code here!)
    function formatHwidField(input) {{
      const raw = input.value.trim();
      if (raw.includes('DM-REQ-') || raw.startsWith('eyJo') || raw.startsWith('EYJO')) {{
        const parsed = parseAdminReqPayload(raw);
        if (parsed) {{
          const reqBox = document.getElementById('genReqCodeInput');
          if (reqBox) reqBox.value = raw;
          handleAdminReqCode(raw);
          return;
        }}
      }}
      let v = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (v.startsWith('DM-HW-') || v.startsWith('DM-SYS-')) {{
        // Keep valid prefix
      }} else if (!v.startsWith('DM-SYS-') && v.startsWith('DM')) {{
        // typing prefix
      }} else if (!v.startsWith('DM-SYS-') && v.length >= 2) {{
        v = 'DM-SYS-' + v.replace(/^DM-SYS-?/, '');
      }}
      input.value = v;
    }}

    // Load Dashboard Data
    async function loadDashboard() {{
      try {{
        const resp = await fetch('/api/admin/dashboard');
        const data = await resp.json();
        appData = data;
        renderKpis(data.metrics);
        renderLicensesTable(data.licenses);
        renderAuditTable(data.metrics.auditLogs || []);
        renderPartners(data.metrics.partners || []);
        renderExpenses(data.expenses || []);
        if (data.port) document.getElementById('portDisplay').textContent = `PORT: ${{data.port}}`;
      }} catch (err) {{
        console.error('Failed to load dashboard data:', err);
      }}
    }}

    // Render KPI Summary Cards
    function renderKpis(m) {{
      if (!m) return;
      document.getElementById('kpiTotalIssued').textContent = m.totalIssued || 0;
      document.getElementById('kpiActiveTesters').textContent = m.activeTesters || 0;
      document.getElementById('kpiHwidCount').textContent = m.hwidLockedCount || 0;
      document.getElementById('kpiRevokedExpired').textContent = m.revokedOrExpired || 0;
    }}

    // Filter Handling
    function setFilter(f) {{
      currentFilter = f;
      ['ALL', 'ACTIVE', 'TESTER', 'EXPIRED', 'REVOKED'].forEach(k => {{
        const btn = document.getElementById('filterBtn' + k);
        if (k === f) {{
          btn.className = 'px-2.5 py-1 rounded-md bg-[#0037b0] text-white transition-colors';
        }} else {{
          btn.className = 'px-2.5 py-1 rounded-md bg-slate-100 text-[#434655] hover:bg-slate-200 transition-colors';
        }}
      }});
      applyTableFilter();
    }}

    function applyTableFilter() {{
      const search = document.getElementById('tableSearchInput').value.toLowerCase().trim();
      const list = (appData.licenses || []).filter(lic => {{
        // Match Filter
        const status = lic.effectiveStatus || lic.status || 'ACTIVE';
        const plan = lic.plan || '';
        if (currentFilter === 'ACTIVE' && status !== 'ACTIVE') return false;
        if (currentFilter === 'TESTER' && (!plan.startsWith('TRIAL_') || status !== 'ACTIVE')) return false;
        if (currentFilter === 'EXPIRED' && status !== 'EXPIRED') return false;
        if (currentFilter === 'REVOKED' && status !== 'REVOKED') return false;

        // Match Search
        if (search) {{
          const str = `${{lic.customerName || ''}} ${{lic.hwid || ''}} ${{lic.licenseKey || ''}} ${{lic.notes || ''}}`.toLowerCase();
          return str.includes(search);
        }}
        return true;
      }});
      renderLicensesTable(list);
    }}

    // Render Licenses Table
    function renderLicensesTable(list) {{
      const tbody = document.getElementById('licensesTableBody');
      document.getElementById('tableShowingCount').textContent = `Showing ${{list.length}} of ${{(appData.licenses || []).length}} licenses`;

      if (!list || list.length === 0) {{
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No matching licenses found.</td></tr>`;
        return;
      }}

      tbody.innerHTML = list.map(lic => {{
        const status = lic.effectiveStatus || lic.status || 'ACTIVE';
        let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        let dotClass = 'bg-emerald-500';
        let statusLabel = 'ACTIVE';

        if (status === 'REVOKED') {{
          badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
          dotClass = 'bg-rose-500';
          statusLabel = 'REVOKED';
        }} else if (status === 'EXPIRED') {{
          badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
          dotClass = 'bg-amber-500';
          statusLabel = 'EXPIRED';
        }}

        const modulesStr = Array.isArray(lic.modules) ? lic.modules.join(', ') : (lic.modules || 'All Modules');
        const planLabel = lic.planTitle || lic.plan || 'License';
        const expiryLabel = lic.expiresAt === 'LIFETIME' ? '🌟 Lifetime' : `⏳ ${{lic.expiresAt || '-'}}`;

        return `
          <tr class="hover:bg-slate-50/70 transition-colors">
            <td class="p-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${{badgeClass}}">
                <span class="w-1.5 h-1.5 rounded-full ${{dotClass}}"></span>
                <span>${{statusLabel}}</span>
              </span>
            </td>
            <td class="p-3">
              <div class="font-semibold text-[#0b1c30]">${{lic.customerName || '-'}}</div>
              <div class="text-[10px] text-slate-400">${{lic.notes || 'DocMitra Suite'}}</div>
            </td>
            <td class="p-3 font-mono text-[11px] text-[#434655] whitespace-nowrap">
              <div class="flex items-center gap-1">
                <span>${{lic.hwid || '-'}}</span>
                <button onclick="navigator.clipboard.writeText('${{lic.hwid}}'); showToast('Copied HWID! 📋')" class="text-slate-400 hover:text-[#0037b0]" title="Copy HWID">
                  <span class="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
            </td>
            <td class="p-3 whitespace-nowrap">
              <div class="font-medium text-[#0b1c30] text-[11px]">${{planLabel}}</div>
              <div class="text-[10px] text-slate-500 font-mono">${{expiryLabel}}</div>
            </td>
            <td class="p-3 font-mono text-[11px] text-[#0037b0] font-bold whitespace-nowrap">
              <div class="flex items-center gap-1 bg-blue-50/60 px-2 py-1 rounded border border-blue-100">
                <span>${{lic.licenseKey || '-'}}</span>
                <button onclick="navigator.clipboard.writeText('${{lic.licenseKey}}'); showToast('Copied License Key! 📋')" class="text-slate-400 hover:text-[#0037b0]" title="Copy Key">
                  <span class="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              </div>
            </td>
            <td class="p-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-1">
                <!-- +7 Days -->
                <button onclick="extendLicense('${{lic.id}}')" class="p-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded" title="Extend +7 Days">
                  +7D
                </button>
                <!-- Reset HWID -->
                <button onclick="openResetHwidModal('${{lic.id}}', '${{lic.customerName}}', '${{lic.hwid}}')" class="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded" title="Reset Machine HWID">
                  <span class="material-symbols-outlined text-[14px]">swap_horiz</span>
                </button>
                <!-- Revoke / Unlock Toggle -->
                <button onclick="toggleRevokeLicense('${{lic.id}}', '${{status}}')" class="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded" title="${{status === 'REVOKED' ? 'Unlock / Reactivate' : 'Revoke Kill-Switch'}}">
                  <span class="material-symbols-outlined text-[14px]">${{status === 'REVOKED' ? 'lock_open' : 'block'}}</span>
                </button>
                <!-- WhatsApp Share -->
                <button onclick="shareRowWhatsApp('${{lic.customerName}}', '${{lic.hwid}}', '${{planLabel}}', '${{lic.licenseKey}}', '${{modulesStr}}')" class="p-1.5 text-emerald-700 hover:text-emerald-900" title="WhatsApp Invite">
                  <span class="material-symbols-outlined text-[16px]">chat</span>
                </button>
                <!-- Delete -->
                <button onclick="deleteLicense('${{lic.id}}')" class="p-1.5 text-slate-400 hover:text-rose-600" title="Delete Record">
                  <span class="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            </td>
          </tr>
        `;
      }}).join('');
    }}

    // Render Audit Table
    function renderAuditTable(logs) {{
      const tbody = document.getElementById('auditTableBody');
      if (!logs || logs.length === 0) {{
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">No audit events recorded yet.</td></tr>`;
        return;
      }}
      tbody.innerHTML = logs.map(l => {{
        let badgeColor = 'bg-blue-50 text-blue-700';
        if (l.action === 'REVOKED') badgeColor = 'bg-rose-50 text-rose-700';
        if (l.action === 'EXTENDED_7D') badgeColor = 'bg-emerald-50 text-emerald-700';
        if (l.action === 'HWID_RESET') badgeColor = 'bg-indigo-50 text-indigo-700';

        return `
          <tr class="hover:bg-slate-50">
            <td class="p-3 text-slate-500 whitespace-nowrap">${{l.timestamp || '-'}}</td>
            <td class="p-3 whitespace-nowrap">
              <span class="px-2 py-0.5 rounded font-bold text-[10px] ${{badgeColor}}">${{l.action}}</span>
            </td>
            <td class="p-3 text-[#0b1c30] font-sans font-medium">${{l.customerName || '-'}}</td>
            <td class="p-3 text-slate-500 font-mono">${{l.hwid || '-'}}</td>
            <td class="p-3 text-slate-700 font-sans">${{l.details || '-'}}</td>
          </tr>
        `;
      }}).join('');
    }}

    // Render Partners
    function renderPartners(partners) {{
      const c = document.getElementById('partnerListContainer');
      c.innerHTML = partners.map(p => `
        <div class="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs">
          <div>
            <div class="font-bold text-[#0b1c30]">${{p.name}}</div>
            <div class="text-[11px] text-[#434655]">${{p.role}}</div>
          </div>
          <div class="text-right">
            <span class="px-2 py-0.5 rounded-full bg-blue-100 text-[#0037b0] font-bold text-[11px]">${{p.sharePercent}}%</span>
          </div>
        </div>
      `).join('');
    }}

    // Render Expenses
    function renderExpenses(expenses) {{
      const tbody = document.getElementById('expenseTableBody');
      if (!expenses || expenses.length === 0) {{
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No expenses recorded yet.</td></tr>`;
        return;
      }}
      tbody.innerHTML = expenses.map(e => `
        <tr class="hover:bg-slate-50">
          <td class="p-2.5 text-slate-500">${{e.date}}</td>
          <td class="p-2.5 font-medium text-[#0b1c30]">${{e.title}}</td>
          <td class="p-2.5 text-slate-600">${{e.spentBy}}</td>
          <td class="p-2.5 text-right font-mono font-bold text-rose-700">₹${{Number(e.amount).toLocaleString('en-IN')}}</td>
          <td class="p-2.5 text-right">
            <button onclick="deleteExpense('${{e.id}}')" class="text-slate-400 hover:text-rose-600">
              <span class="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </td>
        </tr>
      `).join('');
    }}

    // Key Generation Request
    async function requestGenerateLicense() {{
      let cust = document.getElementById('genCustName').value.trim();
      let hwid = document.getElementById('genHwid').value.trim().toUpperCase();
      const plan = document.getElementById('genPlan').value;
      const notes = document.getElementById('genNotes').value.trim();

      // Intercept accidental paste of Request Code into HWID field
      if (hwid.includes('DM-REQ-') || hwid.startsWith('EYJO')) {{
        const parsed = parseAdminReqPayload(hwid);
        if (parsed) {{
          if (parsed.userName && (!cust || cust === 'vj yadav')) cust = parsed.userName;
          if (parsed.hwid) hwid = parsed.hwid;
          document.getElementById('genCustName').value = cust;
          document.getElementById('genHwid').value = hwid;
        }}
      }}

      if (!cust) {{ alert('Please enter Customer / Tester Name'); return; }}
      if (!hwid) {{ alert('Please enter Machine HWID (DM-HW-XXXX or DM-SYS-XXXX)'); return; }}

      const modules = [];
      if (document.getElementById('genModRename').checked) modules.push('Bulk Renamer');
      if (document.getElementById('genModDesk').checked) modules.push('Missing & Follow-up Desk');
      if (document.getElementById('genModPdf').checked) modules.push('PDF Studio');
      if (document.getElementById('genModImage').checked) modules.push('Image Studio');

      try {{
        const resp = await fetch('/api/admin/generate-license', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ customerName: cust, hwid, plan, modules, notes }})
        }});
        const res = await resp.json();
        if (res.success) {{
          document.getElementById('genResultKey').textContent = res.license.licenseKey;
          document.getElementById('genResultBadge').textContent = res.license.planTitle;
          document.getElementById('genResultBox').classList.remove('hidden');
          showToast('Activation Key Issued & Registered! ⚡');
          loadDashboard();
        }} else {{
          alert(res.error || 'Failed to issue license');
        }}
      }} catch (err) {{
        console.error(err);
        showToast('Server request failed', 'error');
      }}
    }}

    function copyGeneratedKey() {{
      const k = document.getElementById('genResultKey').textContent.trim();
      navigator.clipboard.writeText(k);
      showToast('Copied License Key! 📋');
    }}

    function shareGeneratedKeyWhatsApp() {{
      const cust = document.getElementById('genCustName').value.trim();
      const hwid = document.getElementById('genHwid').value.trim().toUpperCase();
      const plan = document.getElementById('genResultBadge').textContent.trim();
      const key = document.getElementById('genResultKey').textContent.trim();
      shareRowWhatsApp(cust, hwid, plan, key, 'Bulk Renamer, Missing Desk, PDF Studio, Image Studio');
    }}

    function shareRowWhatsApp(cust, hwid, plan, key, modules) {{
      const text = `नमस्कार ${{cust}} जी,\n\nतुमच्या DocMitra Offline Suite चे अधिकृत License Key खालीलप्रमाणे आहे:\n\n🔑 *License Key:* \`${{key}}\`\n💻 *Machine ID (HWID):* \`${{hwid}}\`\n📅 *Plan:* ${{plan}}\n📦 *Permitted Modules:* ${{modules}}\n\n⚙️ *Activation Instructions:*\n1. DocMitra ॲप उघडा.\n2. Activation विंडोमध्ये वरील की Paste करा.\n3. Activate बटण दाबा.\n\nधन्यवाद!\n— DocMitra Admin Team`;
      const url = `https://api.whatsapp.com/send?text=${{encodeURIComponent(text)}}`;
      window.open(url, '_blank');
    }}

    // One-Click Actions: Extend +7 Days
    async function extendLicense(id) {{
      try {{
        const resp = await fetch('/api/admin/extend-license', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ id, days: 7 }})
        }});
        const res = await resp.json();
        if (res.success) {{
          showToast('Extended license by +7 Days! ⚡');
          loadDashboard();
        }}
      }} catch (err) {{
        showToast('Extension failed', 'error');
      }}
    }}

    // One-Click Actions: Revoke Toggle
    async function toggleRevokeLicense(id, currentStatus) {{
      const action = currentStatus === 'REVOKED' ? 'reactivate' : 'revoke';
      if (!confirm(`Are you sure you want to ${{action}} this license key?`)) return;

      try {{
        const resp = await fetch('/api/admin/revoke-license', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ id }})
        }});
        const res = await resp.json();
        if (res.success) {{
          showToast(`License ${{action}}d successfully!`);
          loadDashboard();
        }}
      }} catch (err) {{
        showToast('Revoke action failed', 'error');
      }}
    }}

    // One-Click Actions: Delete License
    async function deleteLicense(id) {{
      if (!confirm('Are you sure you want to delete this license record?')) return;
      try {{
        const resp = await fetch('/api/admin/delete-customer', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ id }})
        }});
        const res = await resp.json();
        if (res.success) {{
          showToast('License record deleted.');
          loadDashboard();
        }}
      }} catch (err) {{
        showToast('Delete failed', 'error');
      }}
    }}

    // Reset HWID Modal
    function openResetHwidModal(id, name, oldHwid) {{
      document.getElementById('resetModalLicId').value = id;
      document.getElementById('resetModalSubtext').textContent = `Customer: ${{name}} (Current: ${{oldHwid}})`;
      document.getElementById('resetModalNewHwid').value = '';
      document.getElementById('resetHwidModal').classList.remove('hidden');
    }}
    function closeResetHwidModal() {{
      document.getElementById('resetHwidModal').classList.add('hidden');
    }}
    async function submitResetHwid() {{
      const id = document.getElementById('resetModalLicId').value;
      let newHwid = document.getElementById('resetModalNewHwid').value.trim().toUpperCase();
      if (!newHwid) {{ alert('Please enter new Machine HWID'); return; }}
      if (!newHwid.startsWith('DM-SYS-')) newHwid = 'DM-SYS-' + newHwid;

      try {{
        const resp = await fetch('/api/admin/reset-hwid', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ id, newHwid }})
        }});
        const res = await resp.json();
        if (res.success) {{
          closeResetHwidModal();
          showToast('Machine HWID Reset & Key Re-Signed! ⚡');
          loadDashboard();
        }}
      }} catch (err) {{
        showToast('Reset failed', 'error');
      }}
    }}

    // Expense Modal
    function openAddExpenseModal() {{
      document.getElementById('addExpenseModal').classList.remove('hidden');
    }}
    function closeAddExpenseModal() {{
      document.getElementById('addExpenseModal').classList.add('hidden');
    }}
    async function submitAddExpense() {{
      const title = document.getElementById('expTitle').value.trim();
      const amount = parseFloat(document.getElementById('expAmount').value) || 0;
      const spentBy = document.getElementById('expSpentBy').value;

      if (!title || amount <= 0) {{ alert('Enter valid title and amount'); return; }}

      try {{
        const resp = await fetch('/api/admin/add-expense', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ title, amount, spentBy, category: 'Operational' }})
        }});
        const res = await resp.json();
        if (res.success) {{
          closeAddExpenseModal();
          showToast('Expense recorded! 💵');
          loadDashboard();
        }}
      }} catch (err) {{
        showToast('Failed to add expense', 'error');
      }}
    }}
    async function deleteExpense(id) {{
      if (!confirm('Delete this expense entry?')) return;
      try {{
        const resp = await fetch('/api/admin/delete-expense', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ id }})
        }});
        loadDashboard();
      }} catch (err) {{}}
    }}

    // LAN QR Modal
    async function openQrModal() {{
      try {{
        const resp = await fetch('/api/admin/dashboard');
        const data = await resp.json();
        const lanIp = data.lanIp || '127.0.0.1';
        const port = data.port || 3050;
        const mobileUrl = `http://${{lanIp}}:${{port}}/mobile_keygen.html`;

        document.getElementById('lanUrlDisplay').textContent = mobileUrl;
        document.getElementById('qrImage').src = `/qr?url=${{encodeURIComponent(mobileUrl)}}`;
        document.getElementById('qrModal').classList.remove('hidden');
      }} catch (e) {{}}
    }}
    function closeQrModal() {{
      document.getElementById('qrModal').classList.add('hidden');
    }}

    // Export Backup
    function exportJsonBackup() {{
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", `docmitra_admin_backup_${{new Date().toISOString().slice(0,10)}}.json`);
      document.body.appendChild(dl);
      dl.click();
      dl.remove();
    }}

    // Initialize
    window.addEventListener('DOMContentLoaded', () => {{
      if (sessionStorage.getItem('dm_admin_token') === 'AUTH_OK') {{
        document.getElementById('authOverlay').classList.add('hidden');
        isAuthenticated = true;
      }}
      loadDashboard();
    }});
  </script>
</body>
</html>
"""

# -------------------------------------------------------------
# HTTP Request Handler
# -------------------------------------------------------------
class AdminRequestHandler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        # Silence console log spam in desktop mode
        return

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # 0. Favicon Silence
        if parsed.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        # 1. Root Dashboard
        if parsed.path in ('/', '/index.html'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(get_dashboard_html().encode('utf-8'))
            return

        # 2. Mobile Keygen Standalone Page
        if parsed.path in ('/mobile', '/mobile_keygen.html'):
            if os.path.exists(MOBILE_KEYGEN_FILE):
                try:
                    with open(MOBILE_KEYGEN_FILE, 'r', encoding='utf-8') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(content.encode('utf-8'))
                    return
                except Exception:
                    pass
            self.send_response(404)
            self.end_headers()
            return

        # 2b. Offline Admin Keygen Companion Page
        if parsed.path in ('/keygen', '/admin_keygen.html'):
            keygen_file = os.path.join(BASE_DIR, "admin_keygen.html")
            if os.path.exists(keygen_file):
                try:
                    with open(keygen_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(content.encode('utf-8'))
                    return
                except Exception:
                    pass
            self.send_response(404)
            self.end_headers()
            return

        # 3. QR Code Endpoint
        if parsed.path == '/qr':
            qs = urllib.parse.parse_qs(parsed.query)
            target_url = qs.get('url', [''])[0]
            if not target_url:
                target_url = f"http://{get_local_ip()}:{self.server.server_port}/mobile_keygen.html"
            
            if qrcode:
                try:
                    qr = qrcode.QRCode(version=1, box_size=6, border=2)
                    qr.add_data(target_url)
                    qr.make(fit=True)
                    img = qr.make_image(fill_color="#0037b0", back_color="#ffffff")
                    buf = io.BytesIO()
                    img.save(buf, format='PNG')
                    buf.seek(0)
                    self.send_response(200)
                    self.send_header('Content-Type', 'image/png')
                    self.end_headers()
                    self.wfile.write(buf.getvalue())
                    return
                except Exception:
                    pass
            self.send_response(500)
            self.end_headers()
            return

        # 4. API: Dashboard Data
        if parsed.path == '/api/admin/dashboard':
            data = load_data()
            metrics = compute_metrics(data)
            resp = {
                "success": True,
                "version": ADMIN_VERSION,
                "port": self.server.server_port,
                "lanIp": get_local_ip(),
                "metrics": metrics,
                "licenses": data.get("licenses", []),
                "expenses": data.get("expenses", []),
                "partners": data.get("partners", [])
            }
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(resp, ensure_ascii=False).encode('utf-8'))
            return

        # 404 Fallback
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            req_data = json.loads(post_body)
        except Exception:
            req_data = {}

        # 1. API: Auth Verification
        if parsed.path == '/api/admin/auth':
            code = req_data.get('code', '')
            ok = verify_totp(code)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': ok}).encode('utf-8'))
            return

        # 2. API: Generate License
        if parsed.path == '/api/admin/generate-license':
            customer_name = req_data.get('customerName', '').strip()
            hwid = req_data.get('hwid', '').strip().upper()
            plan = req_data.get('plan', 'TRIAL_15D').strip().upper()
            modules = req_data.get('modules', ['Bulk Renamer', 'Missing & Follow-up Desk', 'PDF Studio', 'Image Studio'])
            notes = req_data.get('notes', '').strip()

            # Server-side safety: check if request code base64 was passed in hwid or customer_name
            if 'DM-REQ-' in hwid or hwid.startswith('EYJO'):
                parsed_req = parse_request_code_server(hwid)
                if parsed_req:
                    if parsed_req.get('hwid'):
                        hwid = parsed_req['hwid']
                    if parsed_req.get('userName') and (not customer_name or customer_name == 'vj yadav'):
                        customer_name = parsed_req['userName']

            if not customer_name or not hwid:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'Missing customer name or HWID'}).encode('utf-8'))
                return

            if not hwid.startswith('DM-SYS-') and not hwid.startswith('DM-HW-'):
                hwid = 'DM-SYS-' + hwid

            plan_titles = {
                'TRIAL_7D': '7 Days Tester Trial',
                'TRIAL_15D': '15 Days Tester Trial',
                'TRIAL_30D': '30 Days Tester Trial',
                'LIFETIME': 'Lifetime Pro License'
            }
            plan_title = plan_titles.get(plan, plan)

            mod_code = get_module_code_from_list(modules)
            expiry_date_code = calculate_expiry_date_str(plan)

            # Generate modern DM-ACT- key for client activation
            act_key = generate_activation_key_dm_act(hwid, customer_name, mod_code, expiry_date_code)
            # Also generate legacy DM-LIC- key
            lic_key = generate_license_key(hwid, customer_name, plan, modules)

            expires_at = calculate_expiry(plan)
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            new_license = {
                "id": f"LIC-{int(time.time()*1000)}",
                "customerName": customer_name,
                "hwid": hwid,
                "plan": plan,
                "planTitle": plan_title,
                "modules": modules,
                "moduleCode": mod_code,
                "issuedAt": now_str,
                "expiresAt": expires_at,
                "licenseKey": act_key,
                "legacyKey": lic_key,
                "status": "ACTIVE",
                "notes": notes
            }

            data = load_data()
            if "licenses" not in data:
                data["licenses"] = []
            data["licenses"].insert(0, new_license)
            add_audit_log(data, "KEY_GENERATED", customer_name, hwid, f"Issued {plan_title} ({act_key})")
            save_data(data)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'license': new_license}).encode('utf-8'))
            return

        # 3. API: Extend License (+7 Days)
        if parsed.path == '/api/admin/extend-license':
            lic_id = req_data.get('id', '')
            days = int(req_data.get('days', 7))
            data = load_data()
            updated = None

            for lic in data.get('licenses', []):
                if lic.get('id') == lic_id:
                    exp = lic.get('expiresAt', '')
                    if exp and exp != 'LIFETIME':
                        try:
                            # If expired in past, extend from current moment, else extend from existing expiry
                            cur_exp = datetime.strptime(exp, "%Y-%m-%d %H:%M:%S")
                            base_dt = max(cur_exp, datetime.now())
                            new_exp = (base_dt + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
                            lic['expiresAt'] = new_exp
                            lic['status'] = 'ACTIVE'
                            updated = lic
                            add_audit_log(data, "EXTENDED_7D", lic.get('customerName', ''), lic.get('hwid', ''), f"Extended +{days} days to {new_exp}")
                        except Exception:
                            pass
                    break

            if updated:
                save_data(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'license': updated}).encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'Could not extend license'}).encode('utf-8'))
            return

        # 4. API: Reset HWID
        if parsed.path == '/api/admin/reset-hwid':
            lic_id = req_data.get('id', '')
            new_hwid = req_data.get('newHwid', '').strip().upper()
            if not new_hwid.startswith('DM-SYS-') and not new_hwid.startswith('DM-HW-'):
                new_hwid = 'DM-SYS-' + new_hwid

            data = load_data()
            updated = None

            for lic in data.get('licenses', []):
                if lic.get('id') == lic_id:
                    old_hwid = lic.get('hwid', '')
                    lic['hwid'] = new_hwid
                    # Re-sign key with new HWID
                    mod_code = lic.get('moduleCode') or get_module_code_from_list(lic.get('modules', []))
                    exp_date_code = calculate_expiry_date_str(lic.get('plan', 'TRIAL_15D'))
                    new_act_key = generate_activation_key_dm_act(new_hwid, lic.get('customerName', ''), mod_code, exp_date_code)
                    new_key = generate_license_key(new_hwid, lic.get('customerName', ''), lic.get('plan', ''), lic.get('modules', []))
                    lic['licenseKey'] = new_act_key
                    lic['legacyKey'] = new_key
                    lic['moduleCode'] = mod_code
                    updated = lic
                    add_audit_log(data, "HWID_RESET", lic.get('customerName', ''), new_hwid, f"Reset HWID from {old_hwid} to {new_hwid}. Re-signed key: {new_act_key}")
                    break

            if updated:
                save_data(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'license': updated}).encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'License not found'}).encode('utf-8'))
            return

        # 5. API: Revoke / Unlock License Toggle
        if parsed.path == '/api/admin/revoke-license':
            lic_id = req_data.get('id', '')
            data = load_data()
            updated = None

            for lic in data.get('licenses', []):
                if lic.get('id') == lic_id:
                    cur_status = lic.get('status', 'ACTIVE')
                    new_status = 'ACTIVE' if cur_status == 'REVOKED' else 'REVOKED'
                    lic['status'] = new_status
                    updated = lic
                    action_tag = "UNREVOKED" if new_status == 'ACTIVE' else "REVOKED"
                    add_audit_log(data, action_tag, lic.get('customerName', ''), lic.get('hwid', ''), f"License status toggled to {new_status}")
                    break

            if updated:
                save_data(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'license': updated}).encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'License not found'}).encode('utf-8'))
            return

        # 6. API: Delete License
        if parsed.path == '/api/admin/delete-customer':
            lic_id = req_data.get('id', '')
            data = load_data()
            orig_len = len(data.get('licenses', []))
            data['licenses'] = [lic for lic in data.get('licenses', []) if lic.get('id') != lic_id]
            data['customers'] = data['licenses']
            save_data(data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            return

        # 7. Legacy API: Add Expense
        if parsed.path == '/api/admin/add-expense':
            data = load_data()
            if 'expenses' not in data:
                data['expenses'] = []
            exp = {
                "id": f"EXP-{int(time.time())}",
                "date": datetime.now().strftime("%d-%b-%Y"),
                "category": req_data.get('category', 'Operational'),
                "title": req_data.get('title', 'Expense'),
                "amount": float(req_data.get('amount', 0)),
                "spentBy": req_data.get('spentBy', 'Partner 1 (Lead / Founder)'),
                "receiptNo": req_data.get('receiptNo', ''),
                "notes": req_data.get('notes', '')
            }
            data['expenses'].insert(0, exp)
            save_data(data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'expense': exp}).encode('utf-8'))
            return

        # 8. Legacy API: Delete Expense
        if parsed.path == '/api/admin/delete-expense':
            exp_id = req_data.get('id', '')
            data = load_data()
            data['expenses'] = [e for e in data.get('expenses', []) if e.get('id') != exp_id]
            save_data(data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

# -------------------------------------------------------------
# Server Runner & Desktop App Launchers
# -------------------------------------------------------------
class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def start_server_in_thread(port):
    server = ThreadedHTTPServer(('0.0.0.0', port), AdminRequestHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

def launch_desktop_window(url):
    """
    Tries 1) pywebview native desktop window,
    2) Edge / Chrome in standalone application mode (--app=http://...),
    3) Standard system default browser.
    """
    if webview is not None:
        try:
            window = webview.create_window(
                f"DocMitra Admin Center {ADMIN_VERSION}",
                url,
                width=1380,
                height=880,
                min_size=(1024, 700),
                confirm_close=False
            )
            webview.start(debug=False)
            return True
        except Exception as e:
            print(f"[Notice] PyWebView failed ({e}), falling back to standalone app window...")

    # Fallback to Edge or Chrome standalone --app mode
    import subprocess
    candidates = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe")
    ]
    for exe in candidates:
        if os.path.exists(exe):
            try:
                subprocess.Popen([exe, f"--app={url}", "--window-size=1380,880"])
                return True
            except Exception:
                continue

    # Fallback to default browser
    webbrowser.open(url)
    return True

def main():
    port = find_free_port(DEFAULT_PORT)
    server = start_server_in_thread(port)
    url = f"http://127.0.0.1:{port}"
    
    print(f"=====================================================")
    print(f"  DocMitra Admin Center {ADMIN_VERSION} Running")
    print(f"  Local Desktop URL:  {url}")
    print(f"  Offline Keygen URL: {url}/admin_keygen.html")
    print(f"  LAN Mobile Keygen:  http://{get_local_ip()}:{port}/mobile_keygen.html")
    print(f"  Master PIN:         {MASTER_RECOVERY_PIN}")
    print(f"=====================================================")

    # Check CLI options
    headless = "--headless" in sys.argv or "--server" in sys.argv

    if not headless:
        launch_desktop_window(url)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down DocMitra Admin Center.")
        server.shutdown()

if __name__ == '__main__':
    main()
