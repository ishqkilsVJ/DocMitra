/**
 * tools/pdf_studio/pdf_studio_logic.js
 * DocMitra PDF Studio — Pure Business Logic & Domain Engine (100% Client-Side, Privacy-First)
 * Handles ISO-32000 A4 PDF compilation, page extraction, watermark-filtering image extraction,
 * lossless document image recompilation rotation, merge, split, and MahaDBT size suffixing.
 *
 * ZERO UI / DOM dependencies. Strictly pure business calculations.
 */

/**
 * Standard A4 Dimensions in PDF points (72 points = 1 inch)
 */
export const PDF_PAGE_SIZES = {
  A4_PORTRAIT: { width: 595.28, height: 841.89, label: 'A4 Portrait' },
  A4_LANDSCAPE: { width: 841.89, height: 595.28, label: 'A4 Landscape' }
};

/**
 * Read width and height from raw JPEG binary stream
 * @param {Uint8Array} bytes
 * @returns {{ width: number, height: number }}
 */
export function getJpegDimensions(bytes) {
  let offset = 2; // Skip 0xFFD8 SOI
  const len = bytes.length;

  while (offset < len) {
    if (bytes[offset] !== 0xFF) break;
    const marker = bytes[offset + 1];
    offset += 2;

    // SOF markers: SOF0 (0xC0) to SOF3 (0xC3), SOF5-SOF7, SOF9-SOF11, SOF13-SOF15
    const isSOF = (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF);

    if (offset + 1 >= len) break;
    const blockLength = (bytes[offset] << 8) | bytes[offset + 1];

    if (isSOF && offset + 6 < len) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return { width, height };
    }

    offset += blockLength;
  }

  // Fallback if parsing marker fails
  return { width: 595, height: 842 };
}

/**
 * Converts one or multiple JPEG Uint8Arrays into a single valid A4 PDF Blob (Pure Vanilla JS, 0 dependencies)
 * @param {Array<{ bytes: Uint8Array, width?: number, height?: number }>} imageList
 * @param {string} orientation - 'portrait' | 'landscape' | 'fit'
 * @param {number} rotation - 0 | 90 | 180 | 270
 * @returns {Blob} Valid ISO 32000 PDF Blob
 */
export function createPdfFromJpegs(imageList = [], orientation = 'portrait', rotation = 0) {
  if (!imageList.length) {
    throw new Error('No images provided for PDF creation.');
  }

  const xref = [];
  let currentOffset = 0;

  const append = (str) => new TextEncoder().encode(str);
  const chunks = [];
  const write = (bytes) => {
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  // 1. PDF Header
  write(append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));

  // 2. Catalog (Obj 1)
  xref.push(currentOffset);
  write(append('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));

  const pageCount = imageList.length;
  const pageObjIds = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(3 + i * 3); // Page objects: 3, 6, 9...
  }

  // 3. Pages Parent (Obj 2)
  xref.push(currentOffset);
  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  write(append(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pageCount} >>\nendobj\n`));

  // Build each page
  for (let i = 0; i < pageCount; i++) {
    const imgData = imageList[i];
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;

    const rawBytes = imgData.bytes;
    let { width: imgW, height: imgH } = imgData.width && imgData.height ? imgData : getJpegDimensions(rawBytes);

    let pageW = PDF_PAGE_SIZES.A4_PORTRAIT.width;
    let pageH = PDF_PAGE_SIZES.A4_PORTRAIT.height;

    if (orientation === 'landscape' || (orientation === 'fit' && imgW > imgH)) {
      pageW = PDF_PAGE_SIZES.A4_LANDSCAPE.width;
      pageH = PDF_PAGE_SIZES.A4_LANDSCAPE.height;
    }

    // Scale image proportionally to fit page with small 18pt margin
    const margin = 18;
    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2;
    const scale = Math.min(availW / imgW, availH / imgH);

    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (pageW - drawW) / 2;
    const drawY = (pageH - drawH) / 2;

    const rotateEntry = rotation ? ` /Rotate ${rotation}` : '';

    // Page Object
    xref.push(currentOffset);
    write(append(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}]${rotateEntry} ` +
      `/Contents ${contentId} 0 R /Resources << /XObject << /Im${i + 1} ${imageId} 0 R >> >> >>\nendobj\n`
    ));

    // Content Stream Object
    const streamContent = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm /Im${i + 1} Do Q\n`;
    const streamLen = streamContent.length;
    xref.push(currentOffset);
    write(append(
      `${contentId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}endstream\nendobj\n`
    ));

    // Image XObject
    xref.push(currentOffset);
    write(append(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${rawBytes.length} >>\nstream\n`
    ));
    write(rawBytes);
    write(append('\nendstream\nendobj\n'));
  }

  // Cross Reference Table
  const startXref = currentOffset;
  const totalObjs = 3 + pageCount * 3;
  write(append(`xref\n0 ${totalObjs}\n0000000000 65535 f \n`));
  for (const off of xref) {
    write(append(`${String(off).padStart(10, '0')} 00000 n \n`));
  }

  // Trailer
  write(append(
    `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
  ));

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Extracts all embedded JPEG images from a PDF file
 * @param {Uint8Array} pdfBytes
 * @returns {Array<{ bytes: Uint8Array, width: number, height: number }>}
 */
export function extractJpegsFromPdf(pdfBytes) {
  const images = [];
  const len = pdfBytes.length;
  let i = 0;

  while (i < len - 3) {
    // Look for JPEG SOI marker: 0xFF, 0xD8, 0xFF
    if (pdfBytes[i] === 0xFF && pdfBytes[i + 1] === 0xD8 && pdfBytes[i + 2] === 0xFF) {
      const start = i;
      i += 2;
      while (i < len - 1) {
        // Look for JPEG EOI marker: 0xFF, 0xD9
        if (pdfBytes[i] === 0xFF && pdfBytes[i + 1] === 0xD9) {
          const end = i + 2;
          const slice = pdfBytes.slice(start, end);
          const dims = getJpegDimensions(slice);
          images.push({
            bytes: slice,
            width: dims.width,
            height: dims.height
          });
          i = end;
          break;
        }
        i++;
      }
    } else {
      i++;
    }
  }

  return images;
}

/**
 * Extracts document images from PDF, strictly filtering out watermark banners (e.g. "Scanned with CamScanner")
 * @param {Uint8Array} pdfBytes
 * @returns {Array<{ bytes: Uint8Array, width: number, height: number }>}
 */
export function getDocumentImagesFromPdf(pdfBytes) {
  const allImages = extractJpegsFromPdf(pdfBytes);
  if (!allImages.length) return [];
  if (allImages.length === 1) return allImages;

  const maxArea = Math.max(...allImages.map(img => (img.width || 0) * (img.height || 0)));
  const maxBytes = Math.max(...allImages.map(img => img.bytes?.length || 0));

  const docImages = allImages.filter(img => {
    const w = img.width || 1;
    const h = img.height || 1;
    const area = w * h;
    const aspect = w / h;
    const bLen = img.bytes?.length || 0;
    // Strictly filter out watermark banners: ribbons (aspect > 3.0 or aspect < 0.33, or h < 220, or w < 220)
    // with area or byte size significantly smaller than the main document page
    const isWatermarkBanner = (
      (aspect > 3.0 || aspect < 0.33 || h < 220 || w < 220) &&
      (area < maxArea * 0.35 || bLen < maxBytes * 0.35)
    );
    return !isWatermarkBanner;
  });

  const candidates = docImages.length ? docImages : allImages;

  // Always sort descending by area and byte size so the main full-page document is index 0
  return candidates.sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    if (areaB !== areaA) return areaB - areaA;
    return (b.bytes?.length || 0) - (a.bytes?.length || 0);
  });
}

/**
 * Converts a PDF to one or multiple JPG items preserving canonical naming.
 * Accepts optional fallback document images (e.g. from PDF.js canvas render for vector PDFs).
 * @param {Uint8Array} pdfBytes
 * @param {string} originalFilename
 * @param {Array<{ bytes: Uint8Array, width?: number, height?: number }>} [fallbackImages=[]]
 * @returns {Array<{ fileName: string, blob: Blob, bytes: Uint8Array, size: number, pageIndex: number, width: number, height: number }>}
 */
export function convertPdfToJpg(pdfBytes, originalFilename = 'Document.pdf', fallbackImages = []) {
  let images = getDocumentImagesFromPdf(pdfBytes);
  if (!images.length && fallbackImages && fallbackImages.length) {
    images = fallbackImages;
  }
  const baseName = originalFilename.replace(/\.pdf$/i, '');

  if (!images.length) {
    return [];
  }

  return images.map((img, idx) => {
    const fileName = images.length === 1 ? `${baseName}.jpg` : `${baseName}_page_${idx + 1}.jpg`;
    const blob = new Blob([img.bytes], { type: 'image/jpeg' });
    return {
      fileName,
      blob,
      bytes: img.bytes,
      size: blob.size,
      pageIndex: idx + 1,
      width: img.width,
      height: img.height
    };
  });
}

/**
 * Splits a multi-page PDF into individual 1-page PDF blobs.
 * Accepts optional page index filter (0-based) and optional fallback images.
 * @param {Uint8Array} pdfBytes
 * @param {string} originalFilename
 * @param {Array<number>} [allowedPageIndices=null] - 0-based page indices
 * @param {Array<{ bytes: Uint8Array, width?: number, height?: number }>} [fallbackImages=[]]
 * @returns {Array<{ fileName: string, blob: Blob, bytes: Uint8Array, size: number, pageIndex: number }>}
 */
export function splitPdfDocument(pdfBytes, originalFilename = 'Document.pdf', allowedPageIndices = null, fallbackImages = []) {
  let images = getDocumentImagesFromPdf(pdfBytes);
  if (!images.length && fallbackImages && fallbackImages.length) {
    images = fallbackImages;
  }
  const baseName = originalFilename.replace(/\.pdf$/i, '');

  if (!images.length) {
    return [];
  }

  const results = [];
  images.forEach((img, idx) => {
    if (allowedPageIndices && !allowedPageIndices.includes(idx)) {
      return;
    }
    const fileName = `${baseName}_page_${idx + 1}.pdf`;
    const blob = createPdfFromJpegs([img], 'portrait');
    results.push({
      fileName,
      blob,
      bytes: img.bytes,
      size: blob.size,
      pageIndex: idx + 1
    });
  });

  return results;
}

/**
 * Extracts specific pages from a PDF and merges them into a clean new PDF Blob (Split & Merge feature)
 * @param {Uint8Array} pdfBytes
 * @param {Array<number>} selectedIndices - 0-based page indices
 * @returns {Blob}
 */
export function extractSelectedPagesAndMerge(pdfBytes, selectedIndices = []) {
  const allImages = getDocumentImagesFromPdf(pdfBytes);
  if (!allImages.length) {
    throw new Error('No pages could be extracted from this PDF.');
  }

  const selectedImages = (selectedIndices.length ? selectedIndices : allImages.map((_, i) => i))
    .filter(idx => idx >= 0 && idx < allImages.length)
    .map(idx => allImages[idx]);

  if (!selectedImages.length) {
    throw new Error('Please select at least one page to merge.');
  }

  return createPdfFromJpegs(selectedImages, 'portrait');
}

/**
 * Merges multiple PDF Uint8Arrays into a single unified multi-page PDF Blob
 * @param {Array<Uint8Array>} pdfByteArrayList
 * @param {string} orientation
 * @returns {Blob}
 */
export function mergePdfDocuments(pdfByteArrayList = [], orientation = 'portrait') {
  const allImages = [];
  for (const pdfBytes of pdfByteArrayList) {
    const imgs = getDocumentImagesFromPdf(pdfBytes);
    allImages.push(...imgs);
  }

  if (!allImages.length) {
    throw new Error('No document images could be extracted to merge PDFs.');
  }

  return createPdfFromJpegs(allImages, orientation);
}

/**
 * Rotates all pages in a PDF by 90, 180, or 270 degrees
 * Uses lossless document image recompilation for scanned PDFs (creates valid PDF, perfect xref, strips watermarks);
 * falls back to in-place dictionary page rotation for pure vector PDFs.
 * @param {Uint8Array} pdfBytes
 * @param {number} degrees
 * @returns {Blob}
 */
export function rotatePdfDocument(pdfBytes, degrees = 90) {
  const deg = (degrees % 360 + 360) % 360;

  if (deg === 0) {
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  // 1. Scanned / image-based PDF (CamScanner, Xerox, Marksheets, etc.):
  // Lossless document image recompilation creates 100% valid ISO 32000 PDF with perfect xref table & rotation
  const images = getDocumentImagesFromPdf(pdfBytes);
  if (images.length > 0) {
    return createPdfFromJpegs(images, 'portrait', deg);
  }

  // 2. In-place dictionary page rotation fallback for pure vector/text PDFs
  try {
    let fullStr = '';
    const chunkSize = 65536;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      fullStr += String.fromCharCode.apply(null, pdfBytes.subarray(i, i + chunkSize));
    }

    const pageObjRegex = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Page(?!\w)[\s\S]*?>>\s*endobj)/g;
    if (pageObjRegex.test(fullStr)) {
      const modified = fullStr.replace(pageObjRegex, (pageObj) => {
        if (/\/Rotate\s+\d+/.test(pageObj)) {
          return pageObj.replace(/\/Rotate\s+\d+/, `/Rotate ${deg}`);
        } else {
          return pageObj.replace(/\/Type\s*\/Page(?!\w)/, `/Type /Page /Rotate ${deg}`);
        }
      });

      const outBuf = new Uint8Array(modified.length);
      for (let i = 0; i < modified.length; i++) {
        outBuf[i] = modified.charCodeAt(i) & 0xFF;
      }
      return new Blob([outBuf], { type: 'application/pdf' });
    }
  } catch (err) {
    console.warn('In-place PDF dictionary rotation skipped:', err);
  }

  throw new Error('No pages found in PDF to rotate.');
}

/**
 * Preserves the exact student filename when converting between formats
 * e.g. "10TH MARKSHEET Vijay Yadav.pdf" -> "10TH MARKSHEET Vijay Yadav.jpg"
 */
export function getConvertedFilename(originalName, targetExt) {
  const cleanExt = targetExt.startsWith('.') ? targetExt : `.${targetExt}`;
  const base = originalName.replace(/\.[a-zA-Z0-9]+$/, '');
  return `${base}${cleanExt}`;
}

/**
 * Appends the actual file size (KB or MB) to the filename before the extension.
 * e.g. "Pramod.pdf" (191488 bytes) -> "Pramod 187 KB.pdf"
 * e.g. "Pramod 200 KB.pdf" (153600 bytes) -> "Pramod 150 KB.pdf" (replaces previous KB cleanly)
 * e.g. "Book_Scan.pdf" (52428800 bytes) -> "Book_Scan 50 MB.pdf"
 *
 * @param {string} originalName - Original filename
 * @param {number} sizeInBytes - Actual size in bytes
 * @param {string} [preferredUnit='auto'] - 'KB', 'MB', or 'auto'
 * @returns {string} Filename with " {size} {KB|MB}" suffix
 */
export function formatSizeSuffixFilename(originalName, sizeInBytes, preferredUnit = 'auto') {
  if (!originalName) return 'document.pdf';
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx !== -1 ? originalName.slice(0, dotIdx) : originalName;
  const ext = dotIdx !== -1 ? originalName.slice(dotIdx) : '';

  // Strip any existing trailing size suffix like " 187 KB", "_187KB", " 50 MB", etc.
  // so repeated compressions never create "Pramod 200 KB 150 KB.pdf"
  const cleanedBase = base.replace(/[\s_-]+\d+\s*(?:KB|MB)$/i, '').trim();

  // If explicitly preferred MB or file is very large (>= 10 MB in auto mode)
  if (preferredUnit === 'MB' || (preferredUnit === 'auto' && sizeInBytes >= 10 * 1024 * 1024)) {
    const mb = Math.max(1, Math.round(Number(sizeInBytes || 0) / (1024 * 1024)));
    return `${cleanedBase} ${mb} MB${ext}`;
  }

  // Standard KB formatting (at least 1 KB)
  const kb = Math.max(1, Math.round(Number(sizeInBytes || 0) / 1024));
  return `${cleanedBase} ${kb} KB${ext}`;
}

/**
 * Returns destination subfolder name based on operation
 * @param {string} operation
 * @returns {string}
 */
export function getSubfolderName(operation) {
  switch (operation) {
    case 'compress_pdf':
      return 'Compressed_PDF';
    case 'hyper_compress':
      return 'Hyper_Compressed_PDF';
    case 'pdf_to_jpg':
      return 'Converted_JPG';
    case 'jpg_to_pdf':
      return 'Converted_PDF';
    case 'merge_pdf':
      return 'Merged_PDF';
    case 'split_pdf':
      return 'Split_PDF';
    case 'rotate_pdf':
      return 'Rotated_PDF';
    case 'clean_pdf':
      return 'Enhanced_PDF';
    case 'compress_jpg':
    case 'bulk_compress':
      return 'Compressed_JPG';
    case 'rotate_image':
      return 'Rotated_JPG';
    case 'clean_image':
      return 'Enhanced_JPG';
    case 'format_convert':
      return 'Converted_Images';
    case 'converted_png':
      return 'Converted_PNG';
    default:
      return 'Processed_Files';
  }
}

/**
 * Parses user-entered page ranges like "1-3, 5, 8-10" into 0-based page indices array.
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {Array<number>} 0-based sorted unique indices
 */
export function parsePageRanges(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim() || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let p = min; p <= max; p++) {
          indices.add(p - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        indices.add(p - 1);
      }
    }
  }

  const result = Array.from(indices).sort((a, b) => a - b);
  return result.length ? result : Array.from({ length: totalPages }, (_, i) => i);
}

/**
 * Universal PDF.js Canvas Fallback: Renders any PDF (including vector / computer-generated)
 * onto an offscreen canvas at the requested DPI and returns JPEG Uint8Arrays.
 * @param {Uint8Array} pdfBytes
 * @param {number} [dpi=150] - 150 (Fast/Standard) | 300 (High Quality) | 72 (Web)
 * @param {number} [quality=0.82]
 * @returns {Promise<Array<{ bytes: Uint8Array, width: number, height: number, pageIndex: number }>>}
 */
export async function renderPdfPagesToJpegs(pdfBytes, dpi = 150, quality = 0.82) {
  if (typeof window === 'undefined' || !window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded');
  }

  const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const numPages = pdf.numPages;
  const scale = (dpi || 150) / 72;
  const images = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64Data = dataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let b = 0; b < binaryStr.length; b++) {
      bytes[b] = binaryStr.charCodeAt(b);
    }

    images.push({
      bytes,
      width: canvas.width,
      height: canvas.height,
      pageIndex: i
    });
  }

  return images;
}
