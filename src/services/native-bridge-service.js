/**
 * ClerkMaster — Native Desktop Bridge Service
 * Connects the web UI directly to the local Python desktop engine
 * providing zero-prompt OS-level file operations, native folder pickers,
 * and multi-format document preview extraction.
 */

const BACKEND_BASE = 'http://localhost:3000';

export async function isNativeAvailable() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/license-status`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Triggers authentic Windows Explorer Folder Picker with fallback to native browser File System API
 */
export async function selectNativeFolder() {
  // 1. Try Python local desktop bridge
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const res = await fetch(`${BACKEND_BASE}/api/native-select-folder`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success || data.cancelled) return data;
    }
  } catch (err) {
    console.warn('[NativeBridge] Backend folder picker failed or unavailable, falling back:', err);
  }

  // 2. Direct Chromium / WebView2 File System API
  if (typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function') {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = [];
      const subfolders = [];
      for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          file.handle = handle;
          file.url = URL.createObjectURL(file);
          files.push({
            name: file.name,
            path: file.name,
            size: file.size,
            ext: ('.' + file.name.split('.').pop()).toLowerCase(),
            url: file.url,
            fileObj: file
          });
        } else if (handle.kind === 'directory') {
          subfolders.push({
            name: handle.name,
            path: handle.name,
            handle
          });
        }
      }
      return {
        success: true,
        path: dirHandle.name,
        name: dirHandle.name,
        subfolders,
        files
      };
    } catch (pickerErr) {
      if (pickerErr.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
    }
  }

  // 3. Fallback: Hidden HTML webkitdirectory input
  return new Promise((resolve) => {
    let input = document.getElementById('hiddenFallbackFolderInput');
    if (!input) {
      input = document.createElement('input');
      input.id = 'hiddenFallbackFolderInput';
      input.type = 'file';
      input.webkitdirectory = true;
      input.style.display = 'none';
      document.body.appendChild(input);
    }
    input.onchange = (e) => {
      const fileList = Array.from(e.target.files || []);
      if (fileList.length === 0) return resolve({ success: false, cancelled: true });
      const folderName = fileList[0].webkitRelativePath ? fileList[0].webkitRelativePath.split('/')[0] : 'Selected Folder';
      const mapped = fileList.map(f => ({
        name: f.name,
        path: f.webkitRelativePath || f.name,
        size: f.size,
        ext: ('.' + f.name.split('.').pop()).toLowerCase(),
        url: URL.createObjectURL(f),
        fileObj: f
      }));
      resolve({
        success: true,
        name: folderName,
        path: folderName,
        files: mapped
      });
    };
    input.click();
  });
}

/**
 * Lists all subfolders and files in a directory using Python's fast os.scandir
 */
export async function listNativeDirectory(dirPath) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/list-directory?path=${encodeURIComponent(dirPath)}`);
    if (!res.ok) return { success: false, errorCode: 'CM-104', error: `Server error: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, errorCode: 'CM-104', error: err.message };
  }
}

/**
 * Atomically renames a file on disk via Python os.rename
 */
export async function renameNativeFile(oldPath, newName) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newName })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Batch renames multiple files on disk atomically
 */
export async function batchRenameNativeFiles(renames) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-batch-rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renames })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Extracts rich document preview for Word, Excel, CSV, or CAD files
 */
export async function getDocPreview(filePath) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/preview-doc?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return { success: false, error: `Preview server error: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Converts a native file descriptor to a standard browser File/Blob object
 */
export async function createNativeFileObject(nativeItem) {
  try {
    const resp = await fetch(nativeItem.url);
    const blob = await resp.blob();
    const file = new File([blob], nativeItem.name, {
      type: blob.type || 'application/octet-stream',
      lastModified: nativeItem.mtime ? nativeItem.mtime * 1000 : Date.now()
    });
    file.nativePath = nativeItem.path;
    file.url = nativeItem.url;
    return file;
  } catch (err) {
    console.warn(`[NATIVE] Could not wrap file '${nativeItem.name}':`, err);
    return {
      name: nativeItem.name,
      size: nativeItem.size,
      nativePath: nativeItem.path,
      url: nativeItem.url,
      type: 'application/octet-stream'
    };
  }
}

/**
 * Triggers authentic Windows OpenFileDialog for native multi-file selection with browser fallback
 */
export async function selectNativeFiles(filter = 'All Files (*.*)|*.*', title = 'Select Files') {
  // 1. Try Python local desktop bridge
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-select-files?filter=${encodeURIComponent(filter)}&title=${encodeURIComponent(title)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success || data.cancelled) return data;
    }
  } catch (err) {
    console.warn('[NativeBridge] Backend file picker failed or unavailable, falling back:', err);
  }

  // 2. Direct Chromium / WebView2 File System API
  if (typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function') {
    try {
      const handles = await window.showOpenFilePicker({ multiple: true });
      const files = [];
      for (const h of handles) {
        const file = await h.getFile();
        file.handle = h;
        files.push({
          name: file.name,
          path: file.name,
          size: file.size,
          ext: ('.' + file.name.split('.').pop()).toLowerCase(),
          url: URL.createObjectURL(file),
          fileObj: file
        });
      }
      return { success: true, files };
    } catch (pickerErr) {
      if (pickerErr.name === 'AbortError') return { success: false, cancelled: true };
    }
  }

  // 3. Fallback: Hidden multi-file HTML input
  return new Promise((resolve) => {
    let input = document.getElementById('hiddenFallbackFilesInput');
    if (!input) {
      input = document.createElement('input');
      input.id = 'hiddenFallbackFilesInput';
      input.type = 'file';
      input.multiple = true;
      input.style.display = 'none';
      document.body.appendChild(input);
    }
    input.onchange = (e) => {
      const fileList = Array.from(e.target.files || []);
      if (fileList.length === 0) return resolve({ success: false, cancelled: true });
      const mapped = fileList.map(f => ({
        name: f.name,
        path: f.name,
        size: f.size,
        ext: ('.' + f.name.split('.').pop()).toLowerCase(),
        url: URL.createObjectURL(f),
        fileObj: f
      }));
      resolve({ success: true, files: mapped });
    };
    input.click();
  });
}

/**
 * Reveals a directory natively in Windows Explorer
 */
export async function openFolderInExplorer(folderPath) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/open-folder?path=${encodeURIComponent(folderPath)}`);
    if (!res.ok) return { success: false, error: `Failed to open Explorer: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

