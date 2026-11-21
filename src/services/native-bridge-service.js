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
 * Triggers authentic Windows Explorer Folder Picker with ZERO browser sandbox prompts
 */
export async function selectNativeFolder() {
  try {
    const controller = new AbortController();
    // 5-minute safety timeout allows user to navigate any disk/USB without premature timeout
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    const res = await fetch(`${BACKEND_BASE}/api/native-select-folder`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return { success: false, errorCode: 'CM-103', error: `Server error: ${res.status}` };
    return await res.json();
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      errorCode: isTimeout ? 'CM-106' : 'CM-103',
      error: isTimeout ? 'Folder picker dialog timed out after 5 minutes.' : err.message
    };
  }
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
 * Triggers authentic Windows OpenFileDialog for native multi-file selection
 */
export async function selectNativeFiles(filter = 'PDF Files (*.pdf)|*.pdf|All Files (*.*)|*.*', title = 'Select Files') {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/native-select-files?filter=${encodeURIComponent(filter)}&title=${encodeURIComponent(title)}`);
    if (!res.ok) return { success: false, errorCode: 'CM-106', error: `Server error: ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, errorCode: 'CM-106', error: err.message };
  }
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

