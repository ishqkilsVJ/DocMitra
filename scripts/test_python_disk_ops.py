"""
scripts/test_python_disk_ops.py
Tests physical disk rotation (pypdf, PIL) and safe physical file import in rename_tool.py.
"""

import os
import sys
import shutil
from pypdf import PdfWriter, PdfReader
from PIL import Image

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.rename_tool.rename_tool import rotate_file_on_disk, import_file_to_folder

test_dir = os.path.join('_test_tmp', 'disk_ops_test')
os.makedirs(test_dir, exist_ok=True)

# 1. Test PDF rotation
pdf_path = os.path.join(test_dir, 'test_doc.pdf')
writer = PdfWriter()
writer.add_blank_page(width=400, height=600)
with open(pdf_path, 'wb') as f:
    writer.write(f)

res_pdf = rotate_file_on_disk(pdf_path, 90)
assert res_pdf.get('success') is True, f"PDF rotate failed: {res_pdf}"
reader = PdfReader(pdf_path)
page = reader.pages[0]
assert page.rotation == 90, f"Expected page.rotation == 90, got {page.rotation}"
print("✓ Python PDF 90-degree disk rotation verified successfully.")

# 2. Test Image rotation
img_path = os.path.join(test_dir, 'test_img.jpg')
img = Image.new('RGB', (300, 500), color='blue')
img.save(img_path)

res_img = rotate_file_on_disk(img_path, 90)
assert res_img.get('success') is True, f"Image rotate failed: {res_img}"
with Image.open(img_path) as check_img:
    assert check_img.size == (500, 300), f"Image dimensions not swapped on disk: {check_img.size}"
print("✓ Python Image 90-degree disk rotation verified successfully (dimensions swapped: 300x500 -> 500x300).")

# 3. Test File Import to Student Folder
src_file = os.path.join(test_dir, 'source_outside.pdf')
with open(src_file, 'w') as f:
    f.write('dummy content')

student_folder = os.path.join(test_dir, 'student_folder')
os.makedirs(student_folder, exist_ok=True)

res_import = import_file_to_folder(src_file, student_folder, 'AADHAAR CARD RAHUL PATIL.pdf', 'RAHUL PATIL')
assert res_import.get('success') is True, f"Import failed: {res_import}"
assert os.path.isfile(res_import.get('path')), "Imported file must genuinely exist on disk"
assert os.path.basename(res_import.get('path')) == 'AADHAAR CARD RAHUL PATIL.pdf'

# Duplicate import test (should auto-increment)
res_import2 = import_file_to_folder(src_file, student_folder, 'AADHAAR CARD RAHUL PATIL.pdf', 'RAHUL PATIL')
assert res_import2.get('success') is True
assert 'AADHAAR CARD 1 RAHUL PATIL.pdf' in res_import2.get('name'), f"Unexpected duplicate name: {res_import2.get('name')}"
print("✓ Python File Import and duplicate sequential auto-numbering verified successfully.")

# 4. Test Numbered Document Duplicate (FORM 16)
from tools.rename_tool.rename_tool import unique_destination, safe_rename_file
import stat

form16_dup = unique_destination('FORM 16 RAHUL PATIL.pdf', '', {'form 16 rahul patil.pdf'}, 'RAHUL PATIL')
assert form16_dup == 'FORM 16 1 RAHUL PATIL.pdf', f"Expected 'FORM 16 1 RAHUL PATIL.pdf', got '{form16_dup}'"
form16_dup2 = unique_destination('FORM 16.pdf', '', {'form 16.pdf'}, '')
assert form16_dup2 == 'FORM 16 1.pdf', f"Expected 'FORM 16 1.pdf', got '{form16_dup2}'"
print("✓ Document names ending in digits (FORM 16) preserved during duplicate resolution.")

# 5. Test Read-Only PDF and Image Rotation and Renaming on Windows
ro_pdf = os.path.join(test_dir, 'readonly_doc.pdf')
w_ro = PdfWriter()
w_ro.add_blank_page(width=200, height=300)
with open(ro_pdf, 'wb') as f:
    w_ro.write(f)
os.chmod(ro_pdf, stat.S_IREAD)

res_ro_rot = rotate_file_on_disk(ro_pdf, 90)
assert res_ro_rot.get('success') is True, f"Rotate on read-only failed: {res_ro_rot}"
ro_reader = PdfReader(ro_pdf)
assert ro_reader.pages[0].rotation == 90
print("✓ Python Read-Only PDF 90-degree disk rotation verified successfully with zero junk temp files.")

ro_img = os.path.join(test_dir, 'readonly_img.jpg')
img_ro = Image.new('RGB', (100, 200), color='purple')
img_ro.save(ro_img)
os.chmod(ro_img, stat.S_IREAD)

res_ro_img = rotate_file_on_disk(ro_img, 90)
assert res_ro_img.get('success') is True, f"Rotate image on read-only failed: {res_ro_img}"
with Image.open(ro_img) as c_ro:
    assert c_ro.size == (200, 100)
print("✓ Python Read-Only Image 90-degree disk rotation verified successfully with zero junk temp files.")

# Safe rename with rotation on read-only file
os.chmod(ro_pdf, stat.S_IREAD)
res_ro_ren = safe_rename_file(ro_pdf, 'RENAMED_RO_DOC.pdf', rotation=90)
assert res_ro_ren.get('success') is True, f"Safe rename with rotation on read-only failed: {res_ro_ren}"
assert os.path.isfile(os.path.join(test_dir, 'RENAMED_RO_DOC.pdf'))
print("✓ Python Safe Rename with rotation on read-only file verified successfully.")

# Cleanup writable before rmtree
for root, dirs, files in os.walk(os.path.dirname(test_dir)):
    for fname in files:
        try: os.chmod(os.path.join(root, fname), stat.S_IWRITE)
        except Exception: pass

shutil.rmtree(os.path.dirname(test_dir), ignore_errors=True)
print("ALL_PYTHON_DISK_OPS_PASSED")
