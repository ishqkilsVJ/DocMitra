/**
 * DocMitra — Native Desktop Bridge Service
 * Seamlessly connects UI to:
 * 1. Tauri 2.0 Rust native API (rfd COM Windows Explorer dialog, instant & zero console window)
 * 2. Modern Chromium / WebView2 File System Access API (showDirectoryPicker / showOpenFilePicker)
 * 3. Local Python desktop engine fallback
 * 4. Standard HTML5 input element fallback
 */

const BACKEND_BASE = 'http://localhost:3000';

function getTauriInvoke() {
  if (typeof window !== 'undefined') {
    if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke;
    if (window.__TAURI_INTERNALS__?.invoke) return window.__TAURI_INTERNALS__.invoke;
  }
  return null;
}

export function isTauriEnvironment() {
  return !!getTauriInvoke();
}

export async function isNativeAvailable() {
  if (isTauriEnvironment()) return true;
  try {
    const res = await fetch(`${BACKEND_BASE}/api/license-status`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Triggers authentic Windows Explorer Folder Picker:
 * Priority 1: Tauri native Rust `rfd` dialog (instant, foreground, zero black window)
 * Priority 2: Direct Chromium / WebView2 showDirectoryPicker
 * Priority 3: Python local backend
 * Priority 4: Hidden webkitdirectory input fallback
 */
export async function selectNativeFolder() {
  const invoke = getTauriInvoke();

  // 1. TAURI RUST NATIVE DIALOG (FASTEST, 0 BLACK CONSOLES)
  if (invoke) {
    try {
      const folderPath = await invoke('pick_native_folder');
      if (!folderPath) {
        return { success: false, cancelled: true };
      }
      // Scan directory immediately using Rust
      const dirData = await invoke('list_native_directory', { path: folderPath });
      return dirData;
    } catch (err) {
      console.warn('[NativeBridge] Tauri pick_native_folder failed, falling back:', err);
    }
  }

  // 2. DIRECT CHROMIUM / WEBVIEW2 FILE SYSTEM ACCESS API
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
      console.warn('[NativeBridge] showDirectoryPicker error, trying backend:', pickerErr);
    }
  }

  // 3. PYTHON BACKEND BRIDGE
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${BACKEND_BASE}/api/native-select-folder`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success || data.cancelled) return data;
    }
  } catch (err) {
    console.warn('[NativeBridge] Backend folder picker failed:', err);
  }

  // 4. HIDDEN HTML WEBKITDIRECTORY INPUT FALLBACK
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
    input.value = '';
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
 * Triggers authentic Windows Multi-File Selection:
 * Priority 1: Tauri native Rust `rfd` dialog
 * Priority 2: Direct Chromium / WebView2 showOpenFilePicker
 * Priority 3: Python local backend
 * Priority 4: Hidden multiple file input
 */
export async function selectNativeFiles(filter = 'All Files (*.*)|*.*', title = 'Select Files') {
  const invoke = getTauriInvoke();

  // 1. TAURI RUST NATIVE DIALOG
  if (invoke) {
    try {
      const res = await invoke('pick_native_files');
      return res;
    } catch (err) {
      console.warn('[NativeBridge] Tauri pick_native_files failed, falling back:', err);
    }
  }

  // 2. DIRECT CHROMIUM / WEBVIEW2 FILE SYSTEM ACCESS API
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
      console.warn('[NativeBridge] showOpenFilePicker error, trying backend:', pickerErr);
    }
  }

  // 3. PYTHON BACKEND BRIDGE
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-select-files?filter=${encodeURIComponent(filter)}&title=${encodeURIComponent(title)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success || data.cancelled) return data;
    }
  } catch (err) {
    console.warn('[NativeBridge] Backend file picker failed:', err);
  }

  // 4. HIDDEN HTML MULTIPLE FILE INPUT FALLBACK
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
    input.value = '';
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
 * Lists all subfolders and files in a directory
 */
export async function listNativeDirectory(dirPath) {
  const invoke = getTauriInvoke();
  if (invoke) {
    try {
      const res = await invoke('list_native_directory', { path: dirPath });
      return res;
    } catch (err) {
      console.warn('[NativeBridge] Tauri list_native_directory failed, trying backend:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/api/list-directory?path=${encodeURIComponent(dirPath)}`);
    if (!res.ok) return { success: false, errorCode: 'DM-104', error: `Server error: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, errorCode: 'DM-104', error: err.message };
  }
}

/**
 * Atomically renames a file on disk
 */
export async function renameNativeFile(oldPath, newName, studentName = '', rotation = 0) {
  const invoke = getTauriInvoke();
  if (invoke) {
    try {
      const res = await invoke('rename_native_file', {
        oldPath,
        old_path: oldPath,
        newName,
        new_name: newName,
        studentName,
        student_name: studentName,
        rotation
      });
      if (res) {
        return {
          success: !!res.success,
          oldPath: res.oldPath || res.old_path || oldPath,
          newPath: res.path || res.newPath || res.new_path,
          path: res.path || res.newPath || res.new_path,
          name: res.newName || res.new_name || newName,
          error: res.error
        };
      }
    } catch (err) {
      console.warn('[NativeBridge] Tauri rename_native_file failed, trying backend:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newName, studentName, rotation })
    });
    const data = await res.json();
    return {
      success: !!data.success,
      oldPath: data.oldPath || oldPath,
      newPath: data.path || data.newPath,
      path: data.path || data.newPath,
      name: data.name || newName,
      error: data.error
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Renames a directory / folder on disk atomically
 */
export async function renameNativeFolder(oldPath, newName) {
  const invoke = getTauriInvoke();
  if (invoke) {
    try {
      const res = await invoke('rename_native_folder', {
        oldPath,
        old_path: oldPath,
        newName,
        new_name: newName
      });
      if (res) {
        return {
          success: !!res.success,
          oldPath: res.oldPath || res.old_path || oldPath,
          newPath: res.path || res.newPath || res.new_path,
          path: res.path || res.newPath || res.new_path,
          name: res.newName || res.new_name || newName,
          error: res.error
        };
      }
    } catch (err) {
      console.warn('[NativeBridge] Tauri rename_native_folder failed, trying fallback:', err);
    }
  }

  return renameNativeFile(oldPath, newName);
}

/**
 * Batch renames multiple files on disk atomically
 */
export async function batchRenameNativeFiles(renames) {
  const results = [];
  for (const item of renames) {
    const r = await renameNativeFile(item.oldPath, item.newName, item.studentName || '', item.rotation || 0);
    results.push(r);
  }
  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, results };
}

/**
 * Rotate an image or PDF file on disk by given angle (90, 180, 270)
 */
export async function rotateNativeFile(filePath, angle) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-rotate-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, angle })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Safely copy an external file into the active student directory
 */
export async function importNativeFile({ sourcePath, targetDir, targetName = '', studentName = '' }) {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-import-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath, targetDir, targetName, studentName })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Reveals a directory natively in Windows Explorer
 */
export async function openFolderInExplorer(folderPath) {
  const invoke = getTauriInvoke();
  if (invoke) {
    try {
      const res = await invoke('open_in_explorer', { path: folderPath });
      return { success: !!res };
    } catch (err) {
      console.warn('[NativeBridge] Tauri open_in_explorer failed:', err);
    }
  }

  try {
    const res = await fetch(`${BACKEND_BASE}/api/open-folder?path=${encodeURIComponent(folderPath)}`);
    if (!res.ok) return { success: false, error: `Failed to open Explorer: ${res.status}` };
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
  if (nativeItem.fileObj) return nativeItem.fileObj;
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
