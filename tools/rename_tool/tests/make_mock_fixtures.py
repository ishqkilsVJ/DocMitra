import os
import stat
from PIL import Image

fixture_dir = os.path.join(os.path.dirname(__file__), 'fixtures', 'mock_student_suite')
os.makedirs(fixture_dir, exist_ok=True)

# 1. Create simple valid JPG/PNG images
img = Image.new('RGB', (400, 300), color=(73, 109, 137))
img.save(os.path.join(fixture_dir, 'aadhaar_front.jpg'))
img.save(os.path.join(fixture_dir, 'pan_card.JPG'))
img.save(os.path.join(fixture_dir, 'photo.jpg'))
img.save(os.path.join(fixture_dir, 'caste_certificate.png'))
img.save(os.path.join(fixture_dir, 'IMG-20240101-WA0001.jpg'))

# 2. Create minimal valid 1-page and multi-page PDFs
def make_pdf(pages=1):
    content = b'%PDF-1.4\n'
    objs = []
    
    # Catalog
    objs.append(b'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
    
    # Pages
    page_refs = ' '.join([f'{i+3} 0 R' for i in range(pages)])
    objs.append(f'2 0 obj\n<< /Type /Pages /Kids [{page_refs}] /Count {pages} >>\nendobj\n'.encode())
    
    # Individual pages
    for i in range(pages):
        obj_num = i + 3
        objs.append(f'{obj_num} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {obj_num + pages} 0 R >>\nendobj\n'.encode())
        
    # Contents streams
    for i in range(pages):
        obj_num = i + 3 + pages
        stream = f'BT /F1 24 Tf 100 700 Td (Page {i+1} Sample Document) Tj ET'.encode()
        objs.append(f'{obj_num} 0 obj\n<< /Length {len(stream)} >>\nstream\n'.encode() + stream + b'\nendstream\nendobj\n')
        
    xref_offset = len(content)
    offsets = [0]
    curr = len(content)
    for obj in objs:
        offsets.append(curr)
        curr += len(obj)
        
    xref = f'xref\n0 {len(objs)+1}\n0000000000 65535 f \n'.encode()
    for off in offsets[1:]:
        xref += f'{off:010d} 00000 n \n'.encode()
        
    trailer = f'trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{curr}\n%%EOF\n'.encode()
    return content + b''.join(objs) + xref + trailer

with open(os.path.join(fixture_dir, '10th_marksheet.PDF'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, '10th_passing.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, '12th_marksheet.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, '12th_lc.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, 'caste_validity.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, 'income_cert.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, 'domicile_certificate.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, 'KAST_CERTIFICATE.pdf'), 'wb') as f:
    f.write(make_pdf(1))
with open(os.path.join(fixture_dir, 'multi_page_sample.pdf'), 'wb') as f:
    f.write(make_pdf(3))

# 3. Create hidden metadata file
with open(os.path.join(fixture_dir, '.docmitra_id.json'), 'w') as f:
    f.write('{"folder_id": "mock-test-123", "version": 1}')

# 4. Create locked / Read-Only file
locked_file = os.path.join(fixture_dir, 'locked_sample.pdf')
with open(locked_file, 'wb') as f:
    f.write(make_pdf(1))
os.chmod(locked_file, stat.S_IREAD)

print('CREATED_FIXTURES_SUCCESS', len(os.listdir(fixture_dir)))
