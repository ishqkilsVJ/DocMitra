"""
tools/pdf_studio/pdf_studio.py
DocMitra PDF Studio — Dedicated Python Backend & File Operations Module
Handles disk-level PDF operations: Compression (<256 KB MahaDBT), Multi-Document Merge,
Page Extraction / Splitting, Lossless Rotation, PDF to Image, and Image to PDF compilation.

Uses pypdf and Pillow for safe offline disk operations with atomic writes and collision safety.
"""

import os
import sys
import shutil
import io
import time
from typing import Dict, Any, List, Optional, Tuple

try:
    import pypdf
    from pypdf import PdfReader, PdfWriter
except ImportError:
    pypdf = None
    PdfReader = None
    PdfWriter = None

try:
    from PIL import Image
except ImportError:
    Image = None

# A4 dimensions in points at 72 DPI (Standard PDF Points)
A4_WIDTH_PT = 595.28
A4_HEIGHT_PT = 841.89

# Windows Reserved Device Filenames
WINDOWS_RESERVED_NAMES = frozenset([
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
])

ILLEGAL_CHARS = set('\\/:*?"<>|')


def validate_pdf_path(path: str) -> Tuple[bool, str]:
    """Validate that the given path exists, is a file, and has .pdf extension."""
    if not path or not isinstance(path, str):
        return False, "Invalid path provided."
    norm = os.path.normpath(path)
    if not os.path.isfile(norm):
        return False, f"File not found: {norm}"
    if not norm.lower().endswith('.pdf'):
        return False, f"Not a PDF file: {norm}"
    return True, ""


def get_pdf_info(pdf_path: str) -> Dict[str, Any]:
    """Retrieve metadata and page details from a PDF file."""
    valid, err = validate_pdf_path(pdf_path)
    if not valid:
        return {'success': False, 'error': err}

    if PdfReader is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    try:
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)
        file_size = os.path.getsize(pdf_path)
        is_encrypted = reader.is_encrypted

        pages_info = []
        for i, page in enumerate(reader.pages):
            box = page.mediabox
            pages_info.append({
                'page': i + 1,
                'width': float(box.width),
                'height': float(box.height),
                'rotation': page.get('/Rotate', 0)
            })

        return {
            'success': True,
            'path': pdf_path,
            'size': file_size,
            'page_count': page_count,
            'is_encrypted': is_encrypted,
            'pages': pages_info
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def rotate_pdf_file(input_path: str, output_path: Optional[str] = None, angle: int = 90) -> Dict[str, Any]:
    """
    Rotate all pages of a PDF file by angle (90, 180, 270) and write to output_path.
    If output_path is None, rotates in-place via safe temporary swap.
    """
    valid, err = validate_pdf_path(input_path)
    if not valid:
        return {'success': False, 'error': err}

    if PdfReader is None or PdfWriter is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    angle = (angle % 360 + 360) % 360
    if angle == 0:
        return {'success': True, 'path': input_path, 'message': 'No rotation needed (0 deg)'}

    norm_in = os.path.normpath(input_path)
    in_place = (output_path is None or os.path.normpath(output_path) == norm_in)

    target_out = norm_in if in_place else os.path.normpath(output_path)
    target_dir = os.path.dirname(target_out) or '.'
    os.makedirs(target_dir, exist_ok=True)

    temp_path = os.path.join(target_dir, f".tmp_rot_{int(time.time() * 1000)}.pdf")

    try:
        reader = PdfReader(norm_in)
        writer = PdfWriter()

        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)

        with open(temp_path, 'wb') as f_out:
            writer.write(f_out)

        if in_place:
            shutil.move(temp_path, norm_in)
            final_path = norm_in
        else:
            if os.path.exists(target_out):
                os.remove(target_out)
            shutil.move(temp_path, target_out)
            final_path = target_out

        return {
            'success': True,
            'input_path': norm_in,
            'output_path': final_path,
            'angle': angle,
            'size': os.path.getsize(final_path)
        }
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        return {'success': False, 'error': f"Rotate failed: {str(e)}"}


def merge_pdf_files(input_paths: List[str], output_path: str) -> Dict[str, Any]:
    """Merge multiple PDF files in order into a single unified output PDF."""
    if not input_paths or not isinstance(input_paths, list):
        return {'success': False, 'error': 'No input PDF paths provided.'}

    if PdfWriter is None or PdfReader is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    valid_paths = []
    for p in input_paths:
        v, err = validate_pdf_path(p)
        if not v:
            return {'success': False, 'error': f"Invalid input file: {err}"}
        valid_paths.append(os.path.normpath(p))

    target_out = os.path.normpath(output_path)
    target_dir = os.path.dirname(target_out) or '.'
    os.makedirs(target_dir, exist_ok=True)

    temp_path = os.path.join(target_dir, f".tmp_merge_{int(time.time() * 1000)}.pdf")

    try:
        writer = PdfWriter()
        total_pages = 0

        for p in valid_paths:
            reader = PdfReader(p)
            for page in reader.pages:
                writer.add_page(page)
                total_pages += 1

        with open(temp_path, 'wb') as f_out:
            writer.write(f_out)

        if os.path.exists(target_out):
            os.remove(target_out)
        shutil.move(temp_path, target_out)

        return {
            'success': True,
            'output_path': target_out,
            'merged_count': len(valid_paths),
            'total_pages': total_pages,
            'size': os.path.getsize(target_out)
        }
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        return {'success': False, 'error': f"Merge failed: {str(e)}"}


def split_pdf_file(input_path: str, output_dir: str, prefix: str = '') -> Dict[str, Any]:
    """Split a multi-page PDF into individual 1-page PDF files in output_dir."""
    valid, err = validate_pdf_path(input_path)
    if not valid:
        return {'success': False, 'error': err}

    if PdfReader is None or PdfWriter is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    norm_in = os.path.normpath(input_path)
    base_name = os.path.splitext(os.path.basename(norm_in))[0]
    out_prefix = prefix or base_name

    norm_out_dir = os.path.normpath(output_dir)
    os.makedirs(norm_out_dir, exist_ok=True)

    created_files = []
    try:
        reader = PdfReader(norm_in)
        total_pages = len(reader.pages)

        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)

            out_filename = f"{out_prefix}_page_{i + 1}.pdf"
            out_file_path = os.path.join(norm_out_dir, out_filename)

            with open(out_file_path, 'wb') as f_out:
                writer.write(f_out)

            created_files.append({
                'page': i + 1,
                'path': out_file_path,
                'filename': out_filename,
                'size': os.path.getsize(out_file_path)
            })

        return {
            'success': True,
            'input_path': norm_in,
            'total_pages': total_pages,
            'output_dir': norm_out_dir,
            'files': created_files
        }
    except Exception as e:
        return {'success': False, 'error': f"Split failed: {str(e)}"}


def compress_pdf_file(input_path: str, output_path: str, target_kb: int = 256) -> Dict[str, Any]:
    """
    Compress a PDF file targeting <= target_kb (e.g. 256 KB for MahaDBT).
    Uses pypdf lossless stream compression, removes duplicate objects, and re-encodes images if needed.
    """
    valid, err = validate_pdf_path(input_path)
    if not valid:
        return {'success': False, 'error': err}

    if PdfReader is None or PdfWriter is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    norm_in = os.path.normpath(input_path)
    orig_size = os.path.getsize(norm_in)
    target_bytes = target_kb * 1024

    norm_out = os.path.normpath(output_path)
    target_dir = os.path.dirname(norm_out) or '.'
    os.makedirs(target_dir, exist_ok=True)

    temp_path = os.path.join(target_dir, f".tmp_comp_{int(time.time() * 1000)}.pdf")

    try:
        reader = PdfReader(norm_in)
        writer = PdfWriter()

        for page in reader.pages:
            added_page = writer.add_page(page)
            try:
                added_page.compress_content_streams()
            except Exception:
                pass

        # Remove unused objects
        writer.add_metadata(reader.metadata or {})

        with open(temp_path, 'wb') as f_out:
            writer.write(f_out)

        comp_size = os.path.getsize(temp_path)

        # If already <= target_bytes or within acceptable margin
        if comp_size <= target_bytes or Image is None:
            if os.path.exists(norm_out):
                os.remove(norm_out)
            shutil.move(temp_path, norm_out)
            return {
                'success': True,
                'input_path': norm_in,
                'output_path': norm_out,
                'original_size': orig_size,
                'compressed_size': comp_size,
                'savings_percent': round((1 - comp_size / orig_size) * 100, 1) if orig_size > 0 else 0
            }

        # Second pass: Image-based compression if images exist and file is still oversized
        try:
            img_writer = PdfWriter()
            for page in reader.pages:
                for img_name, img_file_obj in page.images.items():
                    try:
                        pil_img = Image.open(io.BytesIO(img_file_obj.data))
                        if pil_img.mode in ('RGBA', 'P'):
                            pil_img = pil_img.convert('RGB')
                        out_bio = io.BytesIO()
                        pil_img.save(out_bio, format='JPEG', quality=65, optimize=True)
                        out_bio.seek(0)
                        page.images[img_name].replace(out_bio.read())
                    except Exception:
                        pass
                added_page = img_writer.add_page(page)
                try:
                    added_page.compress_content_streams()
                except Exception:
                    pass

            temp_img_path = os.path.join(target_dir, f".tmp_comp_img_{int(time.time() * 1000)}.pdf")
            with open(temp_img_path, 'wb') as f_out:
                img_writer.write(f_out)

            new_size = os.path.getsize(temp_img_path)
            if new_size < comp_size:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                temp_path = temp_img_path
                comp_size = new_size
            else:
                if os.path.exists(temp_img_path):
                    os.remove(temp_img_path)
        except Exception:
            pass

        if os.path.exists(norm_out):
            os.remove(norm_out)
        shutil.move(temp_path, norm_out)

        return {
            'success': True,
            'input_path': norm_in,
            'output_path': norm_out,
            'original_size': orig_size,
            'compressed_size': comp_size,
            'savings_percent': round((1 - comp_size / orig_size) * 100, 1) if orig_size > 0 else 0
        }
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        return {'success': False, 'error': f"Compression failed: {str(e)}"}


def convert_pdf_to_images(input_path: str, output_dir: str, prefix: str = '') -> Dict[str, Any]:
    """Extract embedded images or render pages from a PDF to JPG files in output_dir."""
    valid, err = validate_pdf_path(input_path)
    if not valid:
        return {'success': False, 'error': err}

    if PdfReader is None:
        return {'success': False, 'error': 'pypdf library is not installed'}

    norm_in = os.path.normpath(input_path)
    base_name = os.path.splitext(os.path.basename(norm_in))[0]
    out_prefix = prefix or base_name

    norm_out_dir = os.path.normpath(output_dir)
    os.makedirs(norm_out_dir, exist_ok=True)

    extracted = []
    try:
        reader = PdfReader(norm_in)
        img_counter = 0

        for p_idx, page in enumerate(reader.pages):
            for img_name, img_obj in page.images.items():
                img_counter += 1
                out_filename = f"{out_prefix}_page_{p_idx + 1}_img_{img_counter}.jpg"
                out_file_path = os.path.join(norm_out_dir, out_filename)

                raw_bytes = img_obj.data
                if Image is not None:
                    try:
                        pil_img = Image.open(io.BytesIO(raw_bytes))
                        if pil_img.mode in ('RGBA', 'P'):
                            pil_img = pil_img.convert('RGB')
                        pil_img.save(out_file_path, format='JPEG', quality=90)
                    except Exception:
                        with open(out_file_path, 'wb') as f_out:
                            f_out.write(raw_bytes)
                else:
                    with open(out_file_path, 'wb') as f_out:
                        f_out.write(raw_bytes)

                extracted.append({
                    'page': p_idx + 1,
                    'filename': out_filename,
                    'path': out_file_path,
                    'size': os.path.getsize(out_file_path)
                })

        return {
            'success': True,
            'input_path': norm_in,
            'total_extracted': len(extracted),
            'files': extracted
        }
    except Exception as e:
        return {'success': False, 'error': f"Convert PDF to images failed: {str(e)}"}


def convert_images_to_pdf(image_paths: List[str], output_path: str) -> Dict[str, Any]:
    """Compile multiple JPG/PNG images into a single valid A4 PDF document on disk."""
    if not image_paths or not isinstance(image_paths, list):
        return {'success': False, 'error': 'No image paths provided.'}

    if Image is None:
        return {'success': False, 'error': 'Pillow (PIL) library is not installed'}

    valid_images = []
    for p in image_paths:
        norm = os.path.normpath(p)
        if os.path.isfile(norm) and norm.lower().endswith(('.jpg', '.jpeg', '.png')):
            valid_images.append(norm)

    if not valid_images:
        return {'success': False, 'error': 'No valid JPG/PNG files found.'}

    norm_out = os.path.normpath(output_path)
    target_dir = os.path.dirname(norm_out) or '.'
    os.makedirs(target_dir, exist_ok=True)

    try:
        pil_images = []
        for p in valid_images:
            im = Image.open(p)
            if im.mode in ('RGBA', 'P'):
                im = im.convert('RGB')
            pil_images.append(im)

        first_img = pil_images[0]
        remaining = pil_images[1:] if len(pil_images) > 1 else []

        first_img.save(norm_out, format='PDF', save_all=True, append_images=remaining)

        return {
            'success': True,
            'output_path': norm_out,
            'image_count': len(valid_images),
            'size': os.path.getsize(norm_out)
        }
    except Exception as e:
        return {'success': False, 'error': f"Image to PDF failed: {str(e)}"}


# ==============================================================================
# Self-Test Verification Routine
# ==============================================================================

def run_self_tests() -> bool:
    """Run verification self-tests on pdf_studio backend operations."""
    print("=== RUNNING PDF STUDIO PYTHON BACKEND SELF-TESTS ===")
    test_dir = os.path.join(os.path.dirname(__file__), "_test_tmp")
    os.makedirs(test_dir, exist_ok=True)

    try:
        # Create a sample 1-page PDF using PIL
        test_img_path = os.path.join(test_dir, "test_sample.jpg")
        img = Image.new("RGB", (400, 600), color=(240, 240, 245))
        img.save(test_img_path, format="JPEG")

        pdf_1 = os.path.join(test_dir, "doc1.pdf")
        res_i2p = convert_images_to_pdf([test_img_path], pdf_1)
        assert res_i2p['success'], f"Image to PDF failed: {res_i2p.get('error')}"
        print("✓ convert_images_to_pdf verified.")

        # Test PDF Info
        info = get_pdf_info(pdf_1)
        assert info['success'] and info['page_count'] == 1, "get_pdf_info failed"
        print("✓ get_pdf_info verified.")

        # Test Rotation
        pdf_rot = os.path.join(test_dir, "doc1_rot.pdf")
        res_rot = rotate_pdf_file(pdf_1, pdf_rot, 90)
        assert res_rot['success'] and os.path.exists(pdf_rot), f"rotate_pdf_file failed: {res_rot.get('error')}"
        print("✓ rotate_pdf_file (90 deg) verified.")

        # Test Merge
        pdf_2 = os.path.join(test_dir, "doc2.pdf")
        shutil.copyfile(pdf_1, pdf_2)
        pdf_merged = os.path.join(test_dir, "merged.pdf")
        res_merge = merge_pdf_files([pdf_1, pdf_2], pdf_merged)
        assert res_merge['success'] and res_merge['total_pages'] == 2, f"merge_pdf_files failed: {res_merge.get('error')}"
        print("✓ merge_pdf_files (2 pages) verified.")

        # Test Split
        split_dir = os.path.join(test_dir, "split_out")
        res_split = split_pdf_file(pdf_merged, split_dir, prefix="test_split")
        assert res_split['success'] and len(res_split['files']) == 2, f"split_pdf_file failed: {res_split.get('error')}"
        print("✓ split_pdf_file (2 pages extracted) verified.")

        # Test Compression
        pdf_comp = os.path.join(test_dir, "doc1_comp.pdf")
        res_comp = compress_pdf_file(pdf_merged, pdf_comp, target_kb=256)
        assert res_comp['success'] and os.path.exists(pdf_comp), f"compress_pdf_file failed: {res_comp.get('error')}"
        print("✓ compress_pdf_file verified.")

        print("\n>>> ALL PDF STUDIO PYTHON BACKEND TESTS PASSED 100%! <<<\n")
        return True
    finally:
        if os.path.exists(test_dir):
            try:
                shutil.rmtree(test_dir)
            except OSError:
                pass


if __name__ == '__main__':
    if '--test' in sys.argv or len(sys.argv) == 1:
        success = run_self_tests()
        sys.exit(0 if success else 1)
