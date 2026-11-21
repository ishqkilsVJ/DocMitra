"""
DocMitra Local Host Server with Native Windows Explorer Opener
Provides static file serving and /api/open-folder endpoint for native "Show in folder"
"""

import http.server
import socketserver
import subprocess
import urllib
import urllib.parse
import urllib.request
import zipfile
import io
import shutil
import os
import sys
import json
import hmac
import hashlib
import time

# Safe stdout/stderr for PyInstaller --noconsole GUI mode
try:
    log_dir = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "DocMitra")
    os.makedirs(log_dir, exist_ok=True)
    log_file = open(os.path.join(log_dir, "server.log"), "a", encoding="utf-8", buffering=1)
    sys.stdout = log_file
    sys.stderr = log_file
except Exception:
    if sys.stdout is None: sys.stdout = open(os.devnull, "w")
    if sys.stderr is None: sys.stderr = open(os.devnull, "w")

PORT = 3000

MIME_MAP = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.dwg': 'application/acad',
}

LAST_ACCESSED_DIRS = []

def track_accessed_dir(d):
    global LAST_ACCESSED_DIRS
    if not d:
        return
    norm = os.path.normpath(d)
    if os.path.isdir(norm):
        if norm in LAST_ACCESSED_DIRS:
            LAST_ACCESSED_DIRS.remove(norm)
        LAST_ACCESSED_DIRS.insert(0, norm)
        if len(LAST_ACCESSED_DIRS) > 30:
            LAST_ACCESSED_DIRS.pop()

def pick_native_files(title="Select Files to Process", file_filter="All Files (*.*)|*.*"):
    # 1. Native Tkinter File Dialog (Zero console window, zero powershell popup)
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.lift()
        root.attributes('-topmost', True)
        root.focus_force()
        selected = filedialog.askopenfilenames(parent=root, title=title)
        root.update()
        root.destroy()
        if selected:
            files = []
            for fp in selected:
                norm = os.path.normpath(fp)
                if os.path.isfile(norm):
                    files.append({
                        'path': norm.replace('\\', '/'),
                        'name': os.path.basename(norm),
                        'size': os.path.getsize(norm),
                        'ext': os.path.splitext(norm)[1].lower(),
                        'mtime': os.path.getmtime(norm) * 1000.0,
                        'dir': os.path.dirname(norm).replace('\\', '/'),
                        'url': f'/api/serve-file?path={urllib.parse.quote(norm)}'
                    })
            if files:
                track_accessed_dir(os.path.dirname(files[0]['path']))
                return {'success': True, 'files': files}
            return {'success': False, 'cancelled': True, 'files': []}
        return {'success': False, 'cancelled': True, 'files': []}
    except Exception:
        pass

    # 2. PowerShell Fallback with CREATE_NO_WINDOW and WindowStyle Hidden
    ps_cmd = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "[System.Windows.Forms.Application]::EnableVisualStyles(); "
        "$f = New-Object System.Windows.Forms.OpenFileDialog; "
        f"$f.Title = '{title}'; "
        f"$f.Filter = '{file_filter}'; "
        "$f.Multiselect = $true; "
        "if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { "
        "  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; "
        "  foreach ($file in $f.FileNames) { Write-Output ('FILE:' + $file); } "
        "} else { "
        "  Write-Output 'CANCEL'; "
        "}; "
        "$f.Dispose();"
    )
    try:
        CREATE_NO_WINDOW = 0x08000000
        proc = subprocess.run(
            ['powershell.exe', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-STA', '-Command', ps_cmd],
            capture_output=True,
            text=True,
            timeout=300,
            creationflags=CREATE_NO_WINDOW
        )
        out = proc.stdout.strip()
        files = []
        for line in out.splitlines():
            line = line.strip()
            if line.startswith('FILE:'):
                file_path = line[5:].strip()
                if os.path.isfile(file_path):
                    files.append({
                        'path': os.path.normpath(file_path).replace('\\', '/'),
                        'name': os.path.basename(file_path),
                        'size': os.path.getsize(file_path),
                        'ext': os.path.splitext(file_path)[1].lower(),
                        'mtime': os.path.getmtime(file_path) * 1000.0,
                        'dir': os.path.dirname(os.path.normpath(file_path)).replace('\\', '/'),
                        'url': f'/api/serve-file?path={urllib.parse.quote(os.path.normpath(file_path))}'
                    })
            elif line == 'CANCEL':
                return {'success': False, 'cancelled': True, 'files': []}
        if files:
            folder_of_files = os.path.dirname(files[0]['path'])
            track_accessed_dir(folder_of_files)
            return {'success': True, 'files': files}
        return {'success': False, 'cancelled': True, 'files': []}
    except Exception as e:
        return {'success': False, 'errorCode': 'DM-106', 'error': str(e), 'files': []}

def pick_native_folder(title="Select Folder"):
    # 1. Native Tkinter Folder Dialog (Zero console window, zero powershell popup)
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        root.lift()
        root.attributes('-topmost', True)
        root.focus_force()
        folder = filedialog.askdirectory(parent=root, title=title)
        root.update()
        root.destroy()
        if folder:
            norm = os.path.normpath(folder)
            track_accessed_dir(norm)
            return {'success': True, 'path': norm}
        return {'success': False, 'cancelled': True}
    except Exception:
        pass

    # 2. PowerShell Fallback with CREATE_NO_WINDOW and WindowStyle Hidden
    ps_cmd = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "[System.Windows.Forms.Application]::EnableVisualStyles(); "
        "$f = New-Object System.Windows.Forms.FolderBrowserDialog; "
        f"$f.Description = '{title}'; "
        "$f.ShowNewFolderButton = $true; "
        "if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { "
        "  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; "
        "  Write-Output ('OK:' + $f.SelectedPath); "
        "} else { "
        "  Write-Output 'CANCEL'; "
        "}; "
        "$f.Dispose();"
    )
    try:
        CREATE_NO_WINDOW = 0x08000000
        proc = subprocess.run(
            ['powershell.exe', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-STA', '-Command', ps_cmd],
            capture_output=True,
            text=True,
            timeout=300,
            creationflags=CREATE_NO_WINDOW
        )
        out = proc.stdout.strip()
        for line in out.splitlines():
            line = line.strip()
            if line.startswith('OK:'):
                folder = line[3:].strip()
                if os.path.isdir(folder):
                    track_accessed_dir(folder)
                    return {'success': True, 'path': os.path.normpath(folder)}
            elif line == 'CANCEL':
                return {'success': False, 'cancelled': True}
        if proc.returncode == 0 and not out:
            return {'success': False, 'cancelled': True}
        return {'success': False, 'errorCode': 'DM-106', 'error': proc.stderr.strip() or 'No folder selected'}
    except Exception as e:
        return {'success': False, 'errorCode': 'DM-106', 'error': str(e)}

def list_native_directory(dir_path):
    if not dir_path or not os.path.isdir(dir_path):
        return {'success': False, 'error': f"Directory '{dir_path}' not found"}
    norm_dir = os.path.normpath(dir_path)
    track_accessed_dir(norm_dir)
    subfolders = []
    files = []
    try:
        for entry in os.scandir(norm_dir):
            if entry.name.startswith('.'):
                continue
            if entry.is_dir(follow_symlinks=False):
                subfolders.append({
                    'name': entry.name,
                    'path': os.path.normpath(entry.path).replace('\\', '/')
                })
            elif entry.is_file(follow_symlinks=False):
                ext = os.path.splitext(entry.name)[1].lower()
                try:
                    stat = entry.stat()
                    files.append({
                        'name': entry.name,
                        'path': os.path.normpath(entry.path).replace('\\', '/'),
                        'size': stat.st_size,
                        'ext': ext,
                        'mtime': stat.st_mtime,
                        'url': f'/api/serve-file?path={urllib.parse.quote(os.path.normpath(entry.path))}'
                    })
                except Exception:
                    pass
    except Exception as e:
        return {'success': False, 'error': str(e)}
    subfolders.sort(key=lambda x: x['name'].lower())
    files.sort(key=lambda x: x['name'].lower())
    return {
        'success': True,
        'name': os.path.basename(norm_dir),
        'path': norm_dir.replace('\\', '/'),
        'subfolders': subfolders,
        'files': files
    }

# Dedicated Tool Integrations: Bulk Document Renamer
try:
    from tools.rename_tool.rename_tool import safe_rename_file, batch_rename_files, scan_student_folder
except ImportError:
    safe_rename_file = None
    batch_rename_files = None
    scan_student_folder = None

def rename_native_file(old_path, new_name):
    if safe_rename_file is not None:
        return safe_rename_file(old_path, new_name)
    return {'success': False, 'error': 'tools.rename_tool.rename_tool backend module not loaded'}

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class DocMitraHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def address_string(self):
        return self.client_address[0]

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/native-rename':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                res = rename_native_file(body.get('oldPath', ''), body.get('newName', ''))
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                return

        if parsed.path == '/api/ocr-extract':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                from tools.rename_tool.rename_tool import ocr_extract_text
                res = ocr_extract_text(body.get('filePath', ''), body.get('base64Image', ''))
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(res).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                return

        if parsed.path == '/api/native-batch-rename':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode('utf-8'))
                if batch_rename_files is not None:
                    res = batch_rename_files(body.get('renames', []))
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(res).encode('utf-8'))
                    return
                results = [rename_native_file(item.get('oldPath', ''), item.get('newName', '')) for item in body.get('renames', [])]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'results': results}).encode('utf-8'))
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode('utf-8'))
                return

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/license-status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'status': 'air-gapped', 'license': 'active'}).encode('utf-8'))
            return

        if parsed.path == '/api/native-select-folder':
            result = pick_native_folder()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if not result.get('success'):
                self.wfile.write(json.dumps(result).encode('utf-8'))
                return
            dir_data = list_native_directory(result.get('path'))
            self.wfile.write(json.dumps(dir_data).encode('utf-8'))
            return

        if parsed.path == '/api/native-select-files':
            query = urllib.parse.parse_qs(parsed.query)
            file_filter = query.get('filter', ['All Files (*.*)|*.*'])[0]
            title = query.get('title', ['Select Files'])[0]
            result = pick_native_files(title=title, file_filter=file_filter)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            return

        if parsed.path == '/api/list-directory':
            query = urllib.parse.parse_qs(parsed.query)
            dir_data = list_native_directory(query.get('path', [''])[0])
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(dir_data).encode('utf-8'))
            return

        if parsed.path == '/api/serve-file':
            query = urllib.parse.parse_qs(parsed.query)
            file_path = query.get('path', [''])[0]
            if not file_path or not os.path.isfile(file_path):
                self.send_response(404)
                self.end_headers()
                return
            ext = os.path.splitext(file_path)[1].lower()
            content_type = MIME_MAP.get(ext, 'application/octet-stream')
            try:
                size = os.path.getsize(file_path)
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(size))
                self.end_headers()
                with open(file_path, 'rb') as f:
                    while True:
                        chunk = f.read(65536)
                        if not chunk: break
                        self.wfile.write(chunk)
                return
            except Exception:
                return

        if parsed.path == '/api/open-folder':
            query = urllib.parse.parse_qs(parsed.query)
            folder_path = query.get('path', [''])[0]
            if folder_path and os.path.isdir(folder_path):
                os.startfile(os.path.normpath(folder_path))
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'path': folder_path}).encode('utf-8'))
                return
            self.send_response(400)
            self.end_headers()
            return

        if parsed.path in ('', '/', '/index.html'):
            self.send_response(302)
            self.send_header('Location', '/app/index.html')
            self.end_headers()
            return

        return super().do_GET()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    with socketserver.ThreadingTCPServer(("", port), DocMitraHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f"DocMitra server running at http://localhost:{port}")
        httpd.serve_forever()
