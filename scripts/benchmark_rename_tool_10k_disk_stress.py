import os
import sys
import time
import shutil
import stat
import tracemalloc

# Add project root and rename_tool to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tools.rename_tool.rename_tool import safe_rename_file, scan_student_folder

print("======================================================================")
print("🚀 DOCMITRA BULK RENAMER: 10,000-FILE PHYSICAL DISK STRESS BENCHMARK")
print("======================================================================\n")

tracemalloc.start()
t_total_start = time.perf_counter()

BENCH_DIR = os.path.abspath("_temp_10k_stress_disk")
if os.path.exists(BENCH_DIR):
    shutil.rmtree(BENCH_DIR)
os.makedirs(BENCH_DIR, exist_ok=True)

# 1. Generate 10,000 Physical Files on Disk
print(f"[Phase 1] Generating 10,000 physical files on disk in: {BENCH_DIR}...")
t_gen_start = time.perf_counter()

sample_names = [
    "10th_marksheet_board.pdf",
    "12th_marksheet_hsc.pdf",
    "CAS_caste_certificate.pdf",
    "in_income_cert.pdf",
    "domicile_certificate.pdf",
    "12L_leaving_certificate.pdf",
    "aadhaar_card_uidai.pdf",
    "bank_passbook_sbi.pdf",
    "cet_scorecard.pdf",
    "non_creamy_layer.pdf"
]

files_created = []
# Create 10,000 files with small 256-byte payload
payload = b"%PDF-1.4 Benchmark dummy file header for stress testing\n" + (b"0" * 200)

for i in range(10000):
    base = sample_names[i % len(sample_names)].replace(".pdf", "")
    filename = f"{base}_seq_{i:05d}.pdf"
    filepath = os.path.join(BENCH_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(payload)
    files_created.append(filepath)

t_gen_end = time.perf_counter()
gen_duration = t_gen_end - t_gen_start
print(f"  ✓ 10,000 physical files created on disk in {gen_duration:.2f} s ({10000 / gen_duration:.0f} files/sec)")

# 2. Benchmark Directory Scanning Speed
print("\n[Phase 2] Benchmarking Directory Scanning on 10,000 Files...")
t_scan_start = time.perf_counter()
scan_res = scan_student_folder(BENCH_DIR)
scanned_files = scan_res.get('files', [])
t_scan_end = time.perf_counter()

scan_duration = t_scan_end - t_scan_start
scan_throughput = len(scanned_files) / scan_duration

print(f"  ✓ Scanned {len(scanned_files)} files in {scan_duration:.3f} s ({scan_throughput:.0f} files/sec)")
assert len(scanned_files) == 10000, f"Expected 10,000 scanned files, got {len(scanned_files)}"

# 3. Benchmark High-Volume Atomic Disk Renaming (with Collisions & Auto-Numbering)
print("\n[Phase 3] Benchmarking 10,000 Atomic Disk Renames...")
t_rename_start = time.perf_counter()

student_name = "VIJAY RAMESH YADAV"
renamed_count = 0
failed_count = 0

for i, old_path in enumerate(files_created):
    # To test collision auto-numbering, every 10th file targets the exact same base document name!
    group_idx = i % 10
    doc_type = sample_names[group_idx].replace(".pdf", "").replace("_", " ").upper()
    target_filename = f"{doc_type} {student_name}.pdf"
    
    res = safe_rename_file(old_path, target_filename)
    if res.get("success"):
        renamed_count += 1
    else:
        failed_count += 1

t_rename_end = time.perf_counter()
rename_duration = t_rename_end - t_rename_start
rename_throughput = renamed_count / rename_duration

print(f"  ✓ Completed {renamed_count} atomic renames in {rename_duration:.2f} s ({rename_throughput:.0f} renames/sec)")
print(f"  ✓ Failed Renames: {failed_count}")
assert failed_count == 0, f"Expected 0 failed renames, got {failed_count}"
assert renamed_count == 10000, f"Expected 10,000 successful renames, got {renamed_count}"

# 4. Verify 0-Data Loss on Disk
print("\n[Phase 4] Verifying 0-Data Loss & Integrity on Disk...")
final_files = os.listdir(BENCH_DIR)
assert len(final_files) == 10000, f"Expected exactly 10,000 files on disk, found {len(final_files)}"

zero_byte_count = 0
corrupted_ext_count = 0

for fn in final_files:
    fp = os.path.join(BENCH_DIR, fn)
    size = os.path.getsize(fp)
    if size == 0:
        zero_byte_count += 1
    if not fn.endswith(".pdf"):
        corrupted_ext_count += 1

print(f"  ✓ Files with size > 0 bytes: {10000 - zero_byte_count} / 10000")
print(f"  ✓ Corrupted extensions: {corrupted_ext_count}")
assert zero_byte_count == 0, "No file should have zero bytes"
assert corrupted_ext_count == 0, "All files must preserve valid extensions"

# 5. Memory Profiling via tracemalloc
current_mem, peak_mem = tracemalloc.get_traced_memory()
tracemalloc.stop()

print("\n[Python Memory Footprint]")
print(f"  • Current Memory: {current_mem / 1024 / 1024:.2f} MB")
print(f"  • Peak Memory: {peak_mem / 1024 / 1024:.2f} MB")
assert (peak_mem / 1024 / 1024) < 150, "Peak memory must be under 150 MB"

# 6. Cleanup Temporary Stress Test Files
print("\n[Phase 5] Cleaning Up Temporary Test Directory...")
shutil.rmtree(BENCH_DIR)
assert not os.path.exists(BENCH_DIR), "Test directory must be cleanly removed"
print("  ✓ Cleaned up 10,000 test files. 0 disk junk retained.")

t_total_end = time.perf_counter()
print("\n======================================================================")
print(f"🎉 10,000-FILE PHYSICAL DISK BENCHMARK PASSED 100% IN {t_total_end - t_total_start:.2f} SECONDS!")
print("======================================================================")
