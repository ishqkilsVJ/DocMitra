/**
 * DocMitra Image & Photo Studio UI Binding & Adapter
 * Connects the Google Stitch Image Studio screen to pure logic in src/modules/image-studio.js
 * and src/modules/pdf-studio.js.
 * STRICT RULES:
 * 1. Zero dynamic innerHTML (safe DOM creation methods only).
 * 2. Never suppress or override window.alert.
 * 3. 100% offline, privacy-first local processing.
 */

import { toast } from './toast.js';
import { selectNativeFolder } from '../services/native-bridge-service.js';
import {
  IMAGE_PRESETS,
  compressImageToTarget,
  applyDocumentScanFilter,
  drawRotated,
  convertImageFormat,
  formatBytes,
  calculateSavings
} from '../modules/image-studio.js';
import { createPdfFromJpegs, getSubfolderName } from '../modules/pdf-studio.js';

export class ImageStudioUIManager {
  constructor() {
    this.activeTool = 'compress_photo_sign'; // 'compress_photo_sign' | 'passport_crop' | 'sign_clean_invert' | 'image_to_pdf' | 'magic_color' | 'resize_convert'
    this.files = []; // Array of { id, name, path, size, fileOrBlob, url, width, height, status }
    this.isProcessing = false;
  }

  init() {
    this._bindRibbonTools();
    this._bindActions();
    this._bindDropzone();
    this.renderQueue();
    console.info('[DocMitra Image Studio] Image Studio UI manager initialized.');
  }

  _bindRibbonTools() {
    const toolBtns = document.querySelectorAll('#view-image-studio .tool-ribbon-btn');
    const toolMap = [
      'compress_photo_sign',
      'passport_crop',
      'sign_clean_invert',
      'image_to_pdf',
      'magic_color',
      'resize_convert'
    ];

    toolBtns.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tool = toolMap[idx] || 'compress_photo_sign';
        this.setTool(tool, btn);
      });
    });
  }

  setTool(toolName, activeBtn = null) {
    this.activeTool = toolName;

    const toolBtns = document.querySelectorAll('#view-image-studio .tool-ribbon-btn');
    toolBtns.forEach(b => {
      b.classList.remove('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-sm');
      b.classList.add('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-on-surface');
      const badge = b.querySelector('.bg-primary\\/60');
      if (badge) badge.remove();
    });

    if (activeBtn) {
      activeBtn.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-low', 'hover:text-on-surface');
      activeBtn.classList.add('bg-primary-container', 'text-on-primary', 'font-semibold', 'shadow-sm');

      const badge = document.createElement('span');
      badge.className = 'bg-primary/60 text-on-primary text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold uppercase tracking-tight';
      badge.textContent = 'Active';
      activeBtn.appendChild(badge);
    }

    this._updateProcessButtonLabel();
    toast.show('Tool Selected', this._getToolDisplayName(toolName), 'info');
  }

  _getToolDisplayName(tool) {
    switch (tool) {
      case 'compress_photo_sign': return 'Compress Photo (<50KB) & Sign (<20KB)';
      case 'passport_crop': return 'Passport Crop (3.5 × 4.5 cm)';
      case 'sign_clean_invert': return 'Signature Clean & Invert';
      case 'image_to_pdf': return 'Image to PDF (A4)';
      case 'magic_color': return 'CamScanner Magic Color';
      case 'resize_convert': return 'Resize & Convert (JPG/PNG)';
      default: return 'Image Processing';
    }
  }

  _updateProcessButtonLabel() {
    const btn = document.getElementById('startImageProcessBtn');
    if (!btn) return;

    const span = btn.querySelector('span:nth-of-type(2)');
    if (span) {
      const count = this.files.length;
      let action = 'Start Process';
      if (this.activeTool === 'compress_photo_sign') action = 'Compress';
      else if (this.activeTool === 'passport_crop') action = 'Passport Crop';
      else if (this.activeTool === 'sign_clean_invert') action = 'Clean Signature';
      else if (this.activeTool === 'image_to_pdf') action = 'Convert to PDF';
      else if (this.activeTool === 'magic_color') action = 'Apply Magic Color';
      else if (this.activeTool === 'resize_convert') action = 'Convert Format';

      span.textContent = `${action} (${count} Files)`;
    }
  }

  _bindActions() {
    // Browse Directory
    const btnBrowse = document.getElementById('btnBrowseImageDir');
    if (btnBrowse) {
      btnBrowse.addEventListener('click', () => this.handleBrowseFolder());
    }

    // Add Photos
    const btnAdd = document.getElementById('btnAddImageFiles');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.handleAddFiles());
    }

    // Rotate All
    const btnRotateAll = document.getElementById('btnRotateAllImages');
    if (btnRotateAll) {
      btnRotateAll.addEventListener('click', () => this.handleRotateAll());
    }

    // Clear Queue
    const btnClear = document.getElementById('btnClearImageQueue');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClearQueue());
    }

    // Filter Oversized
    const btnFilter = document.getElementById('btnFilterOversizedImages');
    if (btnFilter) {
      btnFilter.addEventListener('click', () => this.handleFilterOversized());
    }

    // Start Process Button
    const btnStart = document.getElementById('startImageProcessBtn');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.handleStartProcess());
    }
  }

  _bindDropzone() {
    const view = document.getElementById('view-image-studio');
    if (!view) return;

    view.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    view.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dropped = Array.from(e.dataTransfer?.files || []).filter(f => /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name));
      if (dropped.length === 0) {
        toast.show('Invalid Files', 'Please drop image files (JPG, PNG, WebP) only.', 'warning');
        return;
      }

      await this.loadDroppedFiles(dropped);
    });
  }

  async handleBrowseFolder() {
    toast.show('Opening Folder Picker', 'Navigating Windows Explorer...', 'info');
    try {
      const res = await selectNativeFolder();
      if (!res.success) {
        if (!res.cancelled) {
          toast.show('Folder Select Error', res.error || 'Failed to select folder', 'error');
        }
        return;
      }

      const imgFiles = (res.files || []).filter(f => /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name));
      if (imgFiles.length === 0) {
        toast.show('No Images Found', 'Selected directory contains 0 image files.', 'warning');
        return;
      }

      await this.loadNativeFiles(imgFiles);
      toast.show('Images Loaded', `${imgFiles.length} photos added to execution queue.`, 'success');
    } catch (err) {
      toast.show('Folder Error', err.message, 'error');
    }
  }

  async handleAddFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.jpg,.jpeg,.png,.webp,.bmp';
    input.multiple = true;
    input.style.display = 'none';

    input.addEventListener('change', async (e) => {
      const fileList = Array.from(e.target.files || []);
      if (fileList.length > 0) {
        await this.loadDroppedFiles(fileList);
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  }

  async loadNativeFiles(fileList) {
    for (const f of fileList) {
      const url = f.url || (f.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(f.path)}` : null);
      this.files.push({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: f.name,
        path: f.path,
        size: f.size || 0,
        url: url,
        fileOrBlob: null,
        width: 0,
        height: 0,
        status: 'ready'
      });
    }

    this.renderQueue();
  }

  async loadDroppedFiles(fileList) {
    for (const f of fileList) {
      const url = URL.createObjectURL(f);
      this.files.push({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: f.name,
        path: f.name,
        size: f.size,
        url: url,
        fileOrBlob: f,
        width: 0,
        height: 0,
        status: 'ready'
      });
    }

    this.renderQueue();
    toast.show('Images Added', `${fileList.length} photos added to queue.`, 'success');
  }

  renderQueue() {
    const grid = document.getElementById('imageCardsGrid');
    if (!grid) return;

    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    if (this.files.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/80 flex flex-col items-center gap-2';

      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[40px] text-primary opacity-60';
      icon.textContent = 'image';
      emptyCard.appendChild(icon);

      const title = document.createElement('div');
      title.className = 'font-headline-sm font-bold text-on-surface';
      title.textContent = 'No Images in Studio Queue';
      emptyCard.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'text-body-sm text-secondary';
      desc.textContent = 'Drag & drop student photos or signatures here or click "Browse Directory".';
      emptyCard.appendChild(desc);

      grid.appendChild(emptyCard);
      this._updateProcessButtonLabel();
      return;
    }

    this.files.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow group relative';

      // Card Header Actions (Rotate / Remove)
      const actionCluster = document.createElement('div');
      actionCluster.className = 'absolute top-1.5 right-1.5 z-10 flex items-center gap-1';

      const btnRotate = document.createElement('button');
      btnRotate.type = 'button';
      btnRotate.className = 'w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-primary transition-colors shadow-xs cursor-pointer';
      btnRotate.title = 'Rotate 90°';
      const rotIcon = document.createElement('span');
      rotIcon.className = 'material-symbols-outlined text-[13px]';
      rotIcon.textContent = 'rotate_right';
      btnRotate.appendChild(rotIcon);

      btnRotate.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rotateSingleFile(idx);
      });
      actionCluster.appendChild(btnRotate);

      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-error transition-colors shadow-xs cursor-pointer';
      btnRemove.title = 'Remove';
      const remIcon = document.createElement('span');
      remIcon.className = 'material-symbols-outlined text-[13px]';
      remIcon.textContent = 'close';
      btnRemove.appendChild(remIcon);

      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFile(idx);
      });
      actionCluster.appendChild(btnRemove);
      card.appendChild(actionCluster);

      // Card Image Thumbnail
      const thumbBox = document.createElement('div');
      thumbBox.className = 'relative w-full h-24 rounded-lg bg-surface-container-low overflow-hidden mb-2 border border-surface-container-high/60 flex items-center justify-center';

      if (file.url) {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        img.className = 'w-full h-full object-contain';
        thumbBox.appendChild(img);
      }
      card.appendChild(thumbBox);

      // Filename
      const title = document.createElement('div');
      title.className = 'font-headline-sm text-[12px] font-bold text-on-surface truncate mb-1';
      title.title = file.name;
      title.textContent = file.name;
      card.appendChild(title);

      // Target size indicator based on filename/type
      const isSign = /sign|signature|स्वाक्षरी/i.test(file.name);
      const isPhoto = /photo|pic|passport|फोटो/i.test(file.name);
      const targetKb = isSign ? 20 : (isPhoto ? 50 : 256);

      const sizeBox = document.createElement('div');
      sizeBox.className = 'bg-surface-container-low border border-surface-container-high/60 rounded-lg p-1.5 flex flex-col gap-0.5 font-mono-code text-[10px]';

      const oldRow = document.createElement('div');
      oldRow.className = 'flex items-center justify-between text-outline';
      const curKb = Math.round(file.size / 1024);
      oldRow.appendChild(document.createTextNode(`Size: ${curKb} KB`));

      const typeBadge = document.createElement('span');
      typeBadge.className = isSign ? 'text-amber-700 font-bold' : 'text-primary font-bold';
      typeBadge.textContent = isSign ? 'Sign' : (isPhoto ? 'Photo' : 'Doc');
      oldRow.appendChild(typeBadge);
      sizeBox.appendChild(oldRow);

      const newRow = document.createElement('div');
      newRow.className = 'flex items-center justify-between font-bold text-on-surface';
      newRow.appendChild(document.createTextNode('Target:'));

      const targetVal = document.createElement('span');
      targetVal.className = 'text-primary font-bold';
      targetVal.textContent = `< ${targetKb} KB`;
      newRow.appendChild(targetVal);
      sizeBox.appendChild(newRow);

      card.appendChild(sizeBox);
      grid.appendChild(card);
    });

    this._updateProcessButtonLabel();
  }

  rotateSingleFile(idx) {
    const file = this.files[idx];
    if (!file || !file.url) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = drawRotated(img, 90);
      canvas.toBlob((blob) => {
        file.url = URL.createObjectURL(blob);
        file.size = blob.size;
        file.fileOrBlob = blob;
        this.renderQueue();
        toast.show('Image Rotated', `${file.name} rotated 90° clockwise.`, 'info');
      }, 'image/jpeg', 0.92);
    };
    img.src = file.url;
  }

  removeFile(idx) {
    this.files.splice(idx, 1);
    this.renderQueue();
  }

  handleRotateAll() {
    this.files.forEach((_, idx) => this.rotateSingleFile(idx));
  }

  handleClearQueue() {
    this.files = [];
    this.renderQueue();
    toast.show('Queue Cleared', 'Image workstation reset.', 'info');
  }

  handleFilterOversized() {
    const initial = this.files.length;
    this.files = this.files.filter(f => f.size > 50 * 1024);
    this.renderQueue();
    toast.show('Filter Applied', `Kept ${this.files.length} oversized files (>50 KB) from ${initial}.`, 'info');
  }

  async handleStartProcess() {
    if (this.files.length === 0) {
      toast.show('No Images', 'Please add image files to process.', 'warning');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;

    const op = this.activeTool;
    toast.show('Processing Images', `Executing ${this._getToolDisplayName(op)} on ${this.files.length} files...`, 'info');

    try {
      let count = 0;
      for (const f of this.files) {
        // Fetch blob if needed
        let blob = f.fileOrBlob;
        if (!blob && f.url) {
          const resp = await fetch(f.url);
          blob = await resp.blob();
        }
        if (!blob) continue;

        if (op === 'compress_photo_sign') {
          const isSign = /sign|signature|स्वाक्षरी/i.test(f.name);
          const targetKb = isSign ? 18 : 45; // Strict <20 KB for sign, <50 KB for photo
          const res = await compressImageToTarget(blob, targetKb);
          this._downloadBlob(res.blob, `Compressed_${f.name}`);
          count++;
        } else if (op === 'passport_crop') {
          // Crop to 3.5 x 4.5 cm (aspect ratio 7:9 / 350x450 px)
          const croppedBlob = await this._cropPassport(blob);
          const res = await compressImageToTarget(croppedBlob, 48); // <50 KB
          this._downloadBlob(res.blob, `Passport_${f.name}`);
          count++;
        } else if (op === 'sign_clean_invert') {
          // Enhance ink and whiten background
          const res = await compressImageToTarget(blob, 18, { filterMode: 'sharp_contrast' });
          this._downloadBlob(res.blob, `Clean_Sign_${f.name}`);
          count++;
        } else if (op === 'image_to_pdf') {
          // Convert image to A4 PDF
          const buf = await blob.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const pdfBlob = createPdfFromJpegs([{ bytes, width: 0, height: 0 }], 'portrait');
          const pdfName = f.name.replace(/\.[a-zA-Z0-9]+$/, '') + '.pdf';
          this._downloadBlob(pdfBlob, pdfName);
          count++;
        } else if (op === 'magic_color') {
          // Apply CamScanner Magic Color
          const res = await compressImageToTarget(blob, 240, { filterMode: 'enhanced' });
          this._downloadBlob(res.blob, `Magic_${f.name}`);
          count++;
        } else {
          // Resize & Convert
          const res = await convertImageFormat(blob, 'image/jpeg');
          this._downloadBlob(res.blob, `Converted_${f.name.replace(/\.[a-zA-Z0-9]+$/, '.jpg')}`);
          count++;
        }
      }

      toast.show('Process Complete!', `Successfully processed and saved ${count} files.`, 'success');
    } catch (err) {
      toast.show('Processing Error', err.message, 'error');
    } finally {
      this.isProcessing = false;
    }
  }

  async _cropPassport(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = 350;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');

        // Center crop to 7:9 ratio
        const srcAspect = img.width / img.height;
        const targetAspect = 350 / 450;
        let sx, sy, sWidth, sHeight;

        if (srcAspect > targetAspect) {
          sHeight = img.height;
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = img.width / targetAspect;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 350, 450);
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for passport cropping'));
      };
      img.src = url;
    });
  }

  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

export function initImageStudioUI() {
  const manager = new ImageStudioUIManager();
  manager.init();
  return manager;
}
