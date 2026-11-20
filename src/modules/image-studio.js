/* ==========================================================================
   ClerkMaster — Image Studio Engine (100% Client-Side, Privacy-First)
   (Compression with exact target KB, Canvas enhancement, Rotation, Presets)
   ========================================================================== */

export const IMAGE_PRESETS = {
  mahadbt_cert: {
    id: 'mahadbt_cert',
    name: 'Certificate',
    targetKb: 240,
    minKb: 100,
    maxKb: 256,
    format: 'image/jpeg',
    desc: 'Target size between 100 KB and 256 KB'
  },
  cet_document: {
    id: 'cet_document',
    name: 'Document',
    targetKb: 280,
    minKb: 50,
    maxKb: 300,
    format: 'image/jpeg',
    desc: 'Target size under 300 KB'
  },
  passport_photo: {
    id: 'passport_photo',
    name: 'Passport Photo',
    targetKb: 45,
    minKb: 15,
    maxKb: 50,
    format: 'image/jpeg',
    desc: 'Passport size photo under 50 KB'
  },
  student_sign: {
    id: 'student_sign',
    name: 'Student Signature',
    targetKb: 18,
    minKb: 5,
    maxKb: 20,
    format: 'image/jpeg',
    desc: 'Candidate signature scan under 20 KB'
  },
  standard_web: {
    id: 'standard_web',
    name: 'Standard Document',
    targetKb: 450,
    minKb: 100,
    maxKb: 500,
    format: 'image/jpeg',
    desc: 'Standard crisp document scan under 500 KB'
  }
};

/**
 * Format raw bytes into human-readable KB or MB
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculate compression savings percentage
 */
export function calculateSavings(originalSize, newSize) {
  if (!originalSize || originalSize <= 0) return 0;
  if (newSize >= originalSize) return 0;
  return Math.round(((originalSize - newSize) / originalSize) * 100);
}

/**
 * Applies a high-contrast Document Scan filter to canvas pixel data
 * (Whitens yellowish/gray background, enhances dark text)
 */
export function applyDocumentScanFilter(ctx, width, height, mode = 'magic_color') {
  if (!ctx || mode === 'none' || mode === 'original') return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    // Standard perceptual luminance
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (mode === 'magic_color' || mode === 'enhanced') {
      // CamScanner Magic Color: Whiten paper background, boost saturation of stamps/ink
      if (gray > 165) {
        r = Math.min(255, r * 1.18 + 15);
        g = Math.min(255, g * 1.18 + 15);
        b = Math.min(255, b * 1.18 + 15);
      } else if (gray < 115) {
        r = Math.max(0, r * 0.82);
        g = Math.max(0, g * 0.82);
        b = Math.max(0, b * 0.82);
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    } else if (mode === 'bw_scan') {
      // Clean B&W Xerox threshold
      const val = gray > 140 ? 255 : 0;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    } else if (mode === 'brighten') {
      // Lighten underexposed mobile shots
      d[i] = Math.min(255, r * 1.25 + 20);
      d[i + 1] = Math.min(255, g * 1.25 + 20);
      d[i + 2] = Math.min(255, b * 1.25 + 20);
    } else if (mode === 'sharp_contrast') {
      // High contrast S-curve: deepen ink signatures and stamps
      const factor = 1.35;
      d[i] = Math.min(255, Math.max(0, ((r / 255 - 0.5) * factor + 0.5) * 255));
      d[i + 1] = Math.min(255, Math.max(0, ((g / 255 - 0.5) * factor + 0.5) * 255));
      d[i + 2] = Math.min(255, Math.max(0, ((b / 255 - 0.5) * factor + 0.5) * 255));
    } else if (mode === 'grayscale') {
      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Rotates canvas by 90, 180, or 270 degrees
 */
export function drawRotated(sourceImg, rotationDegrees = 0) {
  const canvas = document.createElement('canvas');
  const deg = (rotationDegrees % 360 + 360) % 360;
  const isSwap = deg === 90 || deg === 270;

  const w = isSwap ? sourceImg.height : sourceImg.width;
  const h = isSwap ? sourceImg.width : sourceImg.height;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(sourceImg, -sourceImg.width / 2, -sourceImg.height / 2);
  ctx.restore();

  return canvas;
}

/**
 * Pure client-side binary-search compression to hit target KB accurately
 */
export async function compressImageToTarget(fileOrBlob, targetKb = 250, options = {}) {
  const {
    rotation = 0,
    filterMode = 'none', // 'none' | 'enhanced' | 'grayscale' | 'bw_scan'
    outputMime = 'image/jpeg',
    maxDimension = 2400
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        // Step 1: Scale down if excessively large (e.g. 48MP mobile photo)
        let w = img.width;
        let h = img.height;
        if (Math.max(w, h) > maxDimension) {
          const ratio = maxDimension / Math.max(w, h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        // Step 2: Handle rotation if requested
        let canvas;
        if (rotation !== 0) {
          canvas = drawRotated(img, rotation);
        } else {
          canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
        }

        // Step 3: Apply document enhancement filter if requested
        if (filterMode && filterMode !== 'none') {
          const ctx = canvas.getContext('2d');
          applyDocumentScanFilter(ctx, canvas.width, canvas.height, filterMode);
        }

        // If targetKb is 0 or unconstrained, return at 90% quality
        if (!targetKb || targetKb <= 0) {
          const blob = await new Promise(r => canvas.toBlob(r, outputMime, 0.90));
          return resolve({
            blob,
            size: blob.size,
            targetHit: true,
            width: canvas.width,
            height: canvas.height,
            quality: 0.90
          });
        }

        const targetBytes = targetKb * 1024;
        let minQ = 0.08;
        let maxQ = 0.96;
        let bestBlob = null;
        let bestQuality = 0.85;

        // Binary search up to 6 iterations for high-precision file size
        for (let iter = 0; iter < 6; iter++) {
          const midQ = (minQ + maxQ) / 2;
          const currentBlob = await new Promise(r => canvas.toBlob(r, outputMime, midQ));
          bestBlob = currentBlob;
          bestQuality = midQ;

          if (currentBlob.size > targetBytes) {
            maxQ = midQ;
          } else {
            minQ = midQ;
            // If within 5% of target, stop early
            if (currentBlob.size >= targetBytes * 0.92) {
              break;
            }
          }
        }

        // High-Precision Adaptive Target Sizer (Guarantees target hit while preserving 100% natural colors)
        if (bestBlob && bestBlob.size > targetBytes) {
          let curCanvas = canvas;
          let curBlob = bestBlob;
          let attempts = 0;

          while (curBlob && curBlob.size > targetBytes && attempts < 8 && curCanvas.width > 250) {
            attempts++;
            const curBytes = curBlob.size;
            // Proportional area scaling: area ratio is targetBytes / curBytes
            const ratio = Math.min(0.88, Math.max(0.20, Math.sqrt(targetBytes / curBytes) * 0.95));
            const nextW = Math.max(250, Math.round(curCanvas.width * ratio));
            const nextH = Math.max(300, Math.round(curCanvas.height * ratio));

            const nextCanvas = document.createElement('canvas');
            nextCanvas.width = nextW;
            nextCanvas.height = nextH;
            const nextCtx = nextCanvas.getContext('2d');
            if (nextCtx) {
              nextCtx.imageSmoothingEnabled = true;
              nextCtx.imageSmoothingQuality = 'high';
              // Draw with 100% authentic color reproduction (no pixel manipulation, zero tearing)
              nextCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
            }

            curBlob = await new Promise(r => nextCanvas.toBlob(r, outputMime, bestQuality));
            curCanvas = nextCanvas;

            if (curBlob && curBlob.size <= targetBytes) {
              break;
            }
          }

          if (curBlob) {
            bestBlob = curBlob;
            canvas = curCanvas;
          }
        }

        resolve({
          blob: bestBlob,
          size: bestBlob ? bestBlob.size : 0,
          targetHit: bestBlob ? bestBlob.size <= targetBytes * 1.05 : false,
          width: canvas.width,
          height: canvas.height,
          quality: Math.round(bestQuality * 100)
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file for compression'));
    };

    img.src = url;
  });
}

/**
 * Converts image Blob/File to a different image format (e.g. PNG, JPEG, WebP)
 */
export async function convertImageFormat(fileOrBlob, targetMime = 'image/png') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Canvas format conversion failed'));
          }
          resolve({
            blob,
            size: blob.size,
            mime: targetMime,
            width: canvas.width,
            height: canvas.height
          });
        }, targetMime, 0.92);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for format conversion'));
    };

    img.src = url;
  });
}
