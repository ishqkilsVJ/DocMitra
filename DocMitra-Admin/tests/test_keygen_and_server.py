import unittest
import sys
import os
import time
import json
import urllib.request
import urllib.error

# Ensure DocMitra-Admin is on path
admin_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if admin_dir not in sys.path:
    sys.path.insert(0, admin_dir)

import admin_server

class TestDocMitraAdmin(unittest.TestCase):

    def test_01_totp_auth(self):
        self.assertTrue(admin_server.verify_totp("998877"))
        self.assertFalse(admin_server.verify_totp("000000"))
        self.assertFalse(admin_server.verify_totp("invalid"))

    def test_02_license_keygen(self):
        hwid = "DM-SYS-D83E-714F-3E56-D773"
        cust = "Test Cyber Cafe"
        plan = "TRIAL_15D"
        mods = ["Bulk Renamer", "Missing & Follow-up Desk", "PDF Studio", "Image Studio"]

        key1 = admin_server.generate_license_key(hwid, cust, plan, mods)
        self.assertTrue(key1.startswith("DM-LIC-"))
        parts = key1.split("-")
        self.assertEqual(len(parts), 6) # DM, LIC, 4-char, 4-char, 4-char, 4-char
        for p in parts[2:]:
            self.assertEqual(len(p), 4)

        # Deterministic
        key2 = admin_server.generate_license_key(hwid, cust, plan, mods)
        self.assertEqual(key1, key2)

        # Changes on different HWID
        key3 = admin_server.generate_license_key("DM-SYS-AAAA-BBBB-CCCC-DDDD", cust, plan, mods)
        self.assertNotEqual(key1, key3)

    def test_03_expiry_calculation(self):
        self.assertEqual(admin_server.calculate_expiry("LIFETIME"), "LIFETIME")
        exp7 = admin_server.calculate_expiry("TRIAL_7D")
        self.assertNotEqual(exp7, "LIFETIME")
        self.assertTrue("-" in exp7)

    def test_04_server_apis(self):
        port = admin_server.find_free_port(3060)
        server = admin_server.start_server_in_thread(port)
        time.sleep(0.5)

        base_url = f"http://127.0.0.1:{port}"

        try:
            # 1. GET /
            with urllib.request.urlopen(f"{base_url}/") as resp:
                self.assertEqual(resp.status, 200)
                html = resp.read().decode('utf-8')
                self.assertIn("DocMitra Admin Center", html)

            # 2. GET /mobile_keygen.html
            with urllib.request.urlopen(f"{base_url}/mobile_keygen.html") as resp:
                self.assertEqual(resp.status, 200)
                mobile_html = resp.read().decode('utf-8')
                self.assertIn("DocMitra Mobile Keygen", mobile_html)

            # 3. POST /api/admin/auth
            req = urllib.request.Request(
                f"{base_url}/api/admin/auth",
                data=json.dumps({"code": "998877"}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))

            # 4. POST /api/admin/generate-license
            req = urllib.request.Request(
                f"{base_url}/api/admin/generate-license",
                data=json.dumps({
                    "customerName": "Automated Tester Lab",
                    "hwid": "DM-SYS-1111-2222-3333-4444",
                    "plan": "TRIAL_15D",
                    "modules": ["Bulk Renamer", "PDF Studio"],
                    "notes": "PyTest run"
                }).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))
                lic = res.get("license")
                self.assertIsNotNone(lic)
                lic_id = lic["id"]
                lic_key = lic["licenseKey"]
                self.assertTrue(lic_key.startswith("DM-LIC-"))

            # 5. POST /api/admin/extend-license
            req = urllib.request.Request(
                f"{base_url}/api/admin/extend-license",
                data=json.dumps({"id": lic_id, "days": 7}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))

            # 6. POST /api/admin/reset-hwid
            req = urllib.request.Request(
                f"{base_url}/api/admin/reset-hwid",
                data=json.dumps({"id": lic_id, "newHwid": "DM-SYS-9999-8888-7777-6666"}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))
                updated_key = res["license"]["licenseKey"]
                self.assertNotEqual(lic_key, updated_key)

            # 7. POST /api/admin/revoke-license
            req = urllib.request.Request(
                f"{base_url}/api/admin/revoke-license",
                data=json.dumps({"id": lic_id}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))
                self.assertEqual(res["license"]["status"], "REVOKED")

            # 8. POST /api/admin/delete-customer
            req = urllib.request.Request(
                f"{base_url}/api/admin/delete-customer",
                data=json.dumps({"id": lic_id}).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                self.assertTrue(res.get("success"))

        finally:
            server.shutdown()

if __name__ == '__main__':
    unittest.main()
