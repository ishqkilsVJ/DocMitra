/**
 * tools/pdf_studio/rotation_engine.js
 * DocMitra PDF Studio Physical File Rotation Engine (100% Client-Side & Native Disk Overwrite)
 * Handles physical 90° incremental rotation for PDF documents and JPG/PNG images on disk.
 *
 * STRICT RULE: Contained strictly inside tools/pdf_studio/ (One Folder Per Tool).
 */

import { readBinaryFile, writeBinaryFile } from '../../shared/native-bridge.js';

/**
 * Incrementally rotates all pages in a PDF document by 90, 180, or 270 degrees.
 * Modifies page dictionary /Rotate tags or creates ISO 32000 compliant page dictionary rotation.
 * @param {Uint8Array} pdfBytes
 * @param {number} degrees
 * @returns {Uint8Array}
 */
export function rotatePdfBytes(pdfBytes, degrees = 90) {
  const deg = (degrees % 360 + 360) % 360;
  if (deg === 0) return pdfBytes;

  try {
    let fullStr = '';
    const chunkSize = 65536;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      fullStr += String.fromCharCode.apply(null, pdfBytes.subarray(i, i + chunkSize));
    }

    // Match each page object << ... /Type /Page ... >>
    const pageObjRegex = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Page(?!\w)[\s\S]*?>>\s*endobj)/g;
    let modifiedCount = 0;

    const modified = fullStr.replace(pageObjRegex, (pageObj) => {
      modifiedCount++;
      const match = pageObj.match(/\/Rotate\s+(\d+)/);
      if (match) {
        const curRot = parseInt(match[1], 10) || 0;
        const nextRot = (curRot + deg) % 360;
        return pageObj.replace(/\/Rotate\s+\d+/, `/Rotate ${nextRot}`);
      } else {
        return pageObj.replace(/\/Type\s*\/Page(?!\w)/, `/Type /Page /Rotate ${deg}`);
      }
    });

    if (modifiedCount > 0) {
      const outBuf = new Uint8Array(modified.length);
      for (let i = 0; i < modified.length; i++) {
        outBuf[i] = modified.charCodeAt(i) & 0xFF;
      }
      return outBuf;
    }

    // Fallback: Check if /Pages dictionary has /Rotate or append /Rotate to individual pages
    const pagesDictRegex = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Pages(?!\w)[\s\S]*?>>\s*endobj)/g;
    let pagesModifiedCount = 0;
    const modifiedPages = fullStr.replace(pagesDictRegex, (pagesObj) => {
      pagesModifiedCount++;
      const match = pagesObj.match(/\/Rotate\s+(\d+)/);
      if (match) {
        const curRot = parseInt(match[1], 10) || 0;
        const nextRot = (curRot + deg) % 360;
        return pagesObj.replace(/\/Rotate\s+\d+/, `/Rotate ${nextRot}`);
      } else {
        return pagesObj.replace(/\/Type\s*\/Pages(?!\w)/, `/Type /Pages /Rotate ${deg}`);
      }
    });

    if (pagesModifiedCount > 0) {
      const outBuf = new Uint8Array(modifiedPages.length);
      for (let i = 0; i < modifiedPages.length; i++) {
        outBuf[i] = modifiedPages.charCodeAt(i) & 0xFF;
      }
      return outBuf;
    }
    return pdfBytes;
  } catch (err) {
    console.warn('[PDF Studio RotationEngine] PDF in-place rotation failed:', err);
    return pdfBytes;
  }
}

/**
 * Physically rotates an image (JPG, PNG) by degrees using an offscreen canvas.
 * @param {Uint8Array} imgBytes
 * @param {string} mimeType
 * @param {number} degrees
 * @returns {Promise<Uint8Array>}
 */
export async function rotateImageBytes(imgBytes, mimeType = 'image/jpeg', degrees = 90) {
  const deg = (degrees % 360 + 360) % 360;
  if (deg === 0) return imgBytes;

  if (typeof window === 'undefined' || !window.document) {
    return imgBytes; // Fallback
  }

  const blob = new Blob([imgBytes], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Failed to load image for rotation'));
    img.src = objectUrl;
  });
  URL.revokeObjectURL(objectUrl);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (deg === 90 || deg === 270) {
    canvas.width = img.naturalHeight || img.height;
    canvas.height = img.naturalWidth || img.width;
  } else {
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  const outputMime = mimeType.includes('png') ? 'image/png' : 'image/jpeg';
  const quality = 0.95;

  const rotatedBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), outputMime, quality);
  });

  const arrayBuffer = await rotatedBlob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Rotates a file physically on disk (PDF or Image) and overwrites the file.
 * @param {object} params
 * @param {string} params.filePath
 * @param {string} params.ext
 * @param {Uint8Array} [params.bytes]
 * @param {number} [params.degrees=90]
 * @returns {Promise<{ success: boolean, newBytes?: Uint8Array, error?: string }>}
 */
export async function rotateFilePhysicallyOnDisk({ filePath, ext, bytes, degrees = 90 }) {
  try {
    let sourceBytes = bytes;
    if (!sourceBytes && filePath) {
      sourceBytes = await readBinaryFile(filePath);
    }
    if (!sourceBytes || !sourceBytes.length) {
      return { success: false, error: 'File content could not be read' };
    }

    const cleanExt = (ext || (filePath ? filePath.split('.').pop() : '')).toLowerCase().replace(/^\./, '');
    let newBytes;

    if (cleanExt === 'pdf') {
      newBytes = rotatePdfBytes(sourceBytes, degrees);
    } else if (cleanExt === 'png') {
      newBytes = await rotateImageBytes(sourceBytes, 'image/png', degrees);
    } else if (cleanExt === 'jpg' || cleanExt === 'jpeg') {
      newBytes = await rotateImageBytes(sourceBytes, 'image/jpeg', degrees);
    } else {
      return { success: false, error: `Unsupported file extension: ${cleanExt}` };
    }

    if (!newBytes || !newBytes.length) {
      return { success: false, error: 'Rotation engine returned empty buffer' };
    }

    // Overwrite the original file on disk
    if (filePath) {
      const writeResult = await writeBinaryFile(filePath, newBytes);
      if (!writeResult.success) {
        return { success: false, error: writeResult.error || 'Failed to write rotated file to disk' };
      }

      // Unlock file if Windows :Zone.Identifier or read-only locks present
      if (typeof window !== 'undefined' && window.__TAURI__?.invoke) {
        try {
          await window.__TAURI__.invoke('strip_windows_file_locks', { paths: [filePath] });
        } catch (e) {
          console.warn('[PDF Studio] strip_windows_file_locks warning:', e);
        }
      }
    }

    return { success: true, newBytes };
  } catch (err) {
    console.error('[PDF Studio RotationEngine] Physical rotation failed:', err);
    return { success: false, error: err.message };
  }
}
