"""
tools/rename_tool/rename_tool.py
DocMitra Bulk Document Renamer — Dedicated Python Backend Module
Handles safe atomic renaming, Windows case-only temporary swap, Windows reserved name checks,
duplicate suffix resolution, directory scanning, and folder switcher helpers.
"""

import os
import sys
import time
import urllib.parse
from typing import Dict, Any, List, Optional, Set, Tuple

# Windows Reserved Device Filenames
WINDOWS_RESERVED_NAMES = frozenset([
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
])

# Illegal characters on Windows file systems
ILLEGAL_CHARS = set('\\/:*?"<>|')

# Junk file blacklist (system files, temp caches, office locks)
JUNK_FILENAMES = frozenset(["thumbs.db", "ehthumbs.db", "desktop.ini", ".ds_store"])


def is_junk_file(filename: str) -> bool:
    """Check if a file is an OS junk or temporary lock artifact."""
    if not filename:
        return True
    lower = filename.lower().strip()
    if lower in JUNK_FILENAMES:
        return True
    if lower.startswith('.') or lower.startswith('~$') or lower.endswith('.tmp'):
        return True
    return False


def validate_filename(name: str) -> Tuple[bool, str]:
    """
    Validate a candidate filename for Windows OS compliance.
    Returns (is_valid, error_message).
    """
    if not name or not name.strip():
        return False, "File name cannot be empty."

    trimmed = name.strip()
    if name.endswith('.') or name.endswith(' ') or trimmed.endswith('.'):
        return False, "File name cannot end with a period or space."

    if any(char in ILLEGAL_CHARS or ord(char) < 32 for char in name):
        return False, "File name cannot contain \\ / : * ? \" < > | or control characters."

    if trimmed in ('.', '..'):
        return False, "Invalid file name."

    # Windows reserved device check (e.g. CON.pdf, AUX.jpg, "CON .pdf")
    base_stem = trimmed.upper().split('.')[0].strip()
    if base_stem in WINDOWS_RESERVED_NAMES:
        return False, "This file name is reserved by Windows OS."

    return True, ""


def split_ext(name: str) -> Tuple[str, str]:
    """Split filename into base stem and extension."""
    idx = name.rfind('.')
    if idx > 0:
        return name[:idx], name[idx:]
    return name, ""


def unique_destination(desired_name: str, current_name: str, existing_names: Set[str], student_name: str = '') -> str:
    """
    Generate a non-colliding filename with sequential suffixes (' 1', ' 2', etc.)
    Case-insensitive check against existing_names in the target directory.
    If student_name is attached, number is inserted sequentially before the student name.
    """
    lower_map = {n.lower(): n for n in existing_names if n}

    if desired_name.lower() not in lower_map or desired_name.lower() == (current_name or '').lower():
        return desired_name

    stem, ext = split_ext(desired_name)
    import re
    counter = 1
    s_clean = student_name.strip() if student_name else ''
    if s_clean and stem.lower().endswith(s_clean.lower()):
        doc_part = stem[:-len(s_clean)].strip()
        doc_part = re.sub(r'\s+\d+$', '', doc_part).strip()
        candidate = f"{doc_part} {counter} {s_clean}{ext}"
        while candidate.lower() in lower_map and candidate.lower() != (current_name or '').lower():
            counter += 1
            candidate = f"{doc_part} {counter} {s_clean}{ext}"
        return candidate
    else:
        base = re.sub(r'\s+\d+$', '', stem).strip()
        candidate = f"{base} {counter}{ext}"
        while candidate.lower() in lower_map and candidate.lower() != (current_name or '').lower():
            counter += 1
            candidate = f"{base} {counter}{ext}"
        return candidate


def safe_rename_file(old_path: str, new_name: str, student_name: str = '') -> Dict[str, Any]:
    """
    Perform a safe atomic rename of a single file on disk.
    Handles:
    1. Validation against illegal chars and Windows reserved names.
    2. Windows case-only rename via a safe temporary file (__tmp_...).
    3. Auto-increment duplicate non-colliding sequential numbers (never fails with 'already exists').
    4. Exact same name no-op.
    """
    if not old_path or not os.path.isfile(old_path):
        return {'success': False, 'error': 'Source file not found on disk'}

    valid, err_msg = validate_filename(new_name)
    if not valid:
        return {'success': False, 'error': err_msg}

    parent = os.path.dirname(old_path)
    new_path = os.path.join(parent, new_name)

    # Identical path - no-op success
    if os.path.normpath(old_path) == os.path.normpath(new_path):
        return {
            'success': True,
            'oldPath': old_path.replace('\\', '/'),
            'path': new_path.replace('\\', '/'),
            'name': new_name
        }

    # Windows case-only rename: Windows filesystem is case-insensitive, so renaming
    # "DOC.pdf" to "doc.pdf" directly fails or no-ops without an intermediate temp name.
    if os.path.normpath(old_path).lower() == os.path.normpath(new_path).lower():
        temp_name = f"__tmp_{int(time.time() * 1000)}_{os.getpid()}_{new_name}"
        temp_path = os.path.join(parent, temp_name)
        try:
            os.rename(old_path, temp_path)
        except Exception as e:
            return {'success': False, 'error': f"Case-change temporary rename failed: {str(e)}"}

        try:
            os.rename(temp_path, new_path)
            return {
                'success': True,
                'oldPath': old_path.replace('\\', '/'),
                'path': new_path.replace('\\', '/'),
                'name': new_name
            }
        except Exception as e:
            # Safe rollback: never leave document stranded as temporary file
            try:
                os.rename(temp_path, old_path)
            except Exception:
                pass
            return {'success': False, 'error': f"Case-change rename failed: {str(e)}"}

    # Collision guard & auto-increment: never block with "already exists"
    if os.path.exists(new_path) and os.path.normpath(old_path).lower() != os.path.normpath(new_path).lower():
        try:
            existing_in_dir = set(os.listdir(parent))
        except Exception:
            existing_in_dir = set()
        new_name = unique_destination(new_name, os.path.basename(old_path), existing_in_dir, student_name)
        new_path = os.path.join(parent, new_name)

    try:
        os.rename(old_path, new_path)
        return {
            'success': True,
            'oldPath': old_path.replace('\\', '/'),
            'path': new_path.replace('\\', '/'),
            'name': new_name
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def batch_rename_files(renames: List[Dict[str, str]]) -> Dict[str, Any]:
    """Execute batch atomic renames sequentially."""
    results = []
    for item in renames:
        old_path = item.get('oldPath') or item.get('old_path') or item.get('path') or ''
        new_name = item.get('newName') or item.get('new_name') or item.get('targetName') or ''
        res = safe_rename_file(old_path, new_name)
        results.append(res)
    return {'success': True, 'results': results}


def scan_student_folder(dir_path: str) -> Dict[str, Any]:
    """
    Scan a student folder and return its files and subfolders,
    filtering out Windows junk/hidden lock files.
    """
    if not dir_path or not os.path.isdir(dir_path):
        return {'success': False, 'error': f"Directory '{dir_path}' not found"}

    norm_dir = os.path.normpath(dir_path)
    subfolders = []
    files = []

    try:
        for entry in os.scandir(norm_dir):
            if entry.name.startswith('.'):
                continue
            if is_junk_file(entry.name):
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
                        'mtime': stat.st_mtime * 1000.0,
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


def get_sibling_folders(current_folder_path: str) -> List[Dict[str, str]]:
    """
    List sibling student folders in the parent directory for ribbon switcher navigation.
    """
    if not current_folder_path or not os.path.isdir(current_folder_path):
        return []

    parent = os.path.dirname(os.path.normpath(current_folder_path))
    if not parent or not os.path.isdir(parent):
        return []

    siblings = []
    try:
        for entry in os.scandir(parent):
            if entry.is_dir(follow_symlinks=False) and not entry.name.startswith('.') and not is_junk_file(entry.name):
                siblings.append({
                    'name': entry.name,
                    'path': os.path.normpath(entry.path).replace('\\', '/')
                })
    except Exception:
        pass

    siblings.sort(key=lambda x: x['name'].lower())
    return siblings


def ocr_extract_text(file_path: str = '', base64_image: str = '') -> Dict[str, Any]:
    """
    Perform local offline OCR on an image file or base64 image data using Tesseract.
    Returns: {'success': True, 'text': extracted_text} or {'success': False, 'error': ...}
    """
    try:
        import pytesseract
        from PIL import Image
        import io
        import base64

        tess_candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            r"C:\Users\USER\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
        ]
        for c in tess_candidates:
            if os.path.exists(c):
                pytesseract.pytesseract.tesseract_cmd = c
                break

        img = None
        if base64_image:
            if ',' in base64_image:
                base64_image = base64_image.split(',', 1)[1]
            img_bytes = base64.b64decode(base64_image)
            img = Image.open(io.BytesIO(img_bytes))
        elif file_path and os.path.isfile(file_path):
            img = Image.open(file_path)
        else:
            return {'success': False, 'error': 'No valid image file or data provided'}

        if img.mode != 'RGB':
            img = img.convert('RGB')

        text = pytesseract.image_to_string(img, config='--oem 3 --psm 6')
        return {
            'success': True,
            'text': text.strip()
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}
