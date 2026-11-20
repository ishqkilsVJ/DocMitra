/* ==========================================================================
   Student Document Renamer — Rename Business Logic (English Validation)
   ========================================================================== */

import { CANONICAL_NAMES } from '../core/constants.js';
import { matchDocument } from './shortcut-keyword-library.js';
import { evaluateMatch } from './document-matcher.js';
import { uniqueDestination } from './duplicate-name-library.js';
import { renameNativeFile } from '../services/native-bridge-service.js';

export function ext(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i) : '';
}

export function cleanName(name) {
  const e = ext(name);
  return e ? name.slice(0, -e.length) : name;
}

export function group(name, groups) {
  const match = evaluateMatch(name, groups);
  if (match.docType) return match.docType;

  const matched = matchDocument(name, groups);
  if (matched) return matched;

  return null;
}

export function applyCase(source, target, style = 'preserve') {
  if (style === 'upper') return target.toUpperCase();
  if (style === 'lower') return target.toLowerCase();
  if (style === 'title') return target.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source === source.toLowerCase()) return target.toLowerCase();
  return target;
}

export function buildName(input, student, groups, style = 'preserve') {
  const g = group(input, groups);
  if (!g) {
    const clean = cleanName(input);
    if (!student) return clean;
    if (clean.toLowerCase().includes(student.toLowerCase())) return clean;
    return `${clean} ${student}`;
  }
  
  const canonical = CANONICAL_NAMES[g.toUpperCase()] || g;
  const formatted = applyCase(cleanName(input), canonical, style);
  
  if (!student) return formatted;
  if (formatted.toLowerCase().includes(student.toLowerCase())) return formatted;
  return `${formatted} ${student}`;
}

export function validateFilename(name) {
  if (!name || !name.trim()) return 'File name cannot be empty.';
  const trimmed = name.trim();
  if (name.endsWith('.') || name.endsWith(' ') || trimmed.endsWith('.')) {
    return 'File name cannot end with a period or space.';
  }
  if (/[\\/:*?"<>|]/.test(name)) return 'File name cannot contain \\ / : * ? " < > |.';
  if (trimmed === '.' || trimmed === '..') return 'Invalid file name.';
  
  const base = trimmed.toUpperCase().split('.')[0];
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reserved.includes(base)) {
    return 'This file name is reserved by Windows OS.';
  }
  
  return '';
}

export function planRename(files, inputs, student, groups, style, selectedIndices = null) {
  const plan = [];
  const used = new Set(files.map(f => f.name));
  const indices = selectedIndices !== null ? selectedIndices : files.map((_, i) => i);
  
  for (const i of indices) {
    const file = files[i];
    if (!file) continue;
    const typed = (inputs[i] ?? cleanName(file.name)).trim();
    const error = validateFilename(typed);
    if (error) return { error: `${file.name}: ${error}` };
    
    const desired = buildName(typed, student, groups, style) + ext(file.name);
    if (desired === file.name) continue;
    
    const next = uniqueDestination(desired, file.name, used);
    used.add(next);
    plan.push({ old: file.name, next, file, handle: file.handle || null, index: i });
  }
  
  return { plan };
}

export async function executeRename(dir, plan, onProgress = null) {
  const written = [];
  try {
    let completed = 0;
    for (const item of plan) {
      // 1. Native Desktop Rename (0 browser prompt, 1ms atomic rename)
      if (dir && dir.nativePath) {
        const oldPath = item.nativePath || (item.file && item.file.nativePath) || `${dir.nativePath}/${item.old}`;
        const res = await renameNativeFile(oldPath, item.next);
        if (!res.success) {
          throw new Error(res.error || `Failed to rename ${item.old}`);
        }
        written.push(item);
        completed++;
        if (onProgress) {
          const pct = Math.round((completed / plan.length) * 100);
          onProgress(pct, `Renamed ${completed} of ${plan.length} files...`);
        }
        continue;
      }

      // 2. Browser File System Access API Rename fallback
      const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;
      
      if (!isCaseOnly) {
        let finalNext = item.next;
        let handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
        if (handle) {
          // File already exists on disk! Automatically number it: 1, 2, 3...
          const suffix = ext(finalNext);
          const base = cleanName(finalNext).replace(/\s+\d+$/, '');
          let counter = 1;
          finalNext = `${base} ${counter}${suffix}`;
          handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          while (handle) {
            counter++;
            finalNext = `${base} ${counter}${suffix}`;
            handle = await dir.getFileHandle(finalNext, { create: false }).catch(() => null);
          }
          item.next = finalNext;
        }
      }
      
      let sourceHandle = item.handle;
      if (!sourceHandle) {
        sourceHandle = await dir.getFileHandle(item.old, { create: false }).catch(() => null);
      }
      
      let movedSuccessfully = false;
      if (sourceHandle && typeof sourceHandle.move === 'function') {
        try {
          if (isCaseOnly) {
            const tempName = `__tmp_${Date.now()}_${item.next}`;
            await sourceHandle.move(tempName);
            await sourceHandle.move(item.next);
          } else {
            await sourceHandle.move(item.next);
          }
          movedSuccessfully = true;
          written.push(item);
        } catch (moveErr) {
          console.warn('sourceHandle.move() not supported on this handle, falling back to stream copy:', moveErr);
          movedSuccessfully = false;
        }
      }

      if (!movedSuccessfully) {
        const data = await item.file.arrayBuffer();
        let targetHandle;
        
        if (isCaseOnly) {
          const tempName = `__tmp_${Date.now()}_${item.next}`;
          const tempOut = await dir.getFileHandle(tempName, { create: true });
          const tw = await tempOut.createWritable();
          await tw.write(data);
          await tw.close();
          await dir.removeEntry(item.old);
          
          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const w = await targetHandle.createWritable();
          await w.write(data);
          await w.close();
          await dir.removeEntry(tempName);
        } else {
          targetHandle = await dir.getFileHandle(item.next, { create: true });
          const writer = await targetHandle.createWritable();
          await writer.write(data);
          await writer.close();
          await dir.removeEntry(item.old);
        }
        written.push(item);
      }
      
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / plan.length) * 100), `${completed}/${plan.length} files renamed`);
      }
    }
    return written;
  } catch (error) {
    throw error;
  }
}

export async function undoRename(dir, plan, onProgress = null) {
  const reversed = [...plan].reverse();
  let completed = 0;
  
  for (const item of reversed) {
    if (dir && dir.nativePath) {
      const currentPath = `${dir.nativePath}/${item.next}`;
      await renameNativeFile(currentPath, item.old);
      completed++;
      if (onProgress) {
        onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
      }
      continue;
    }

    const isCaseOnly = item.old.toLowerCase() === item.next.toLowerCase() && item.old !== item.next;
    const currentHandle = await dir.getFileHandle(item.next, { create: false }).catch(() => null);
    
    if (currentHandle && typeof currentHandle.move === 'function') {
      if (isCaseOnly) {
        const tempName = `__tmp_undo_${Date.now()}_${item.old}`;
        await currentHandle.move(tempName);
        await currentHandle.move(item.old);
      } else {
        await currentHandle.move(item.old);
      }
    } else if (currentHandle) {
      const data = await (await currentHandle.getFile()).arrayBuffer();
      const oldHandle = await dir.getFileHandle(item.old, { create: true });
      const writer = await oldHandle.createWritable();
      await writer.write(data);
      await writer.close();
      await dir.removeEntry(item.next);
    }
    
    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / reversed.length) * 100), `Undo: ${completed}/${reversed.length}`);
    }
  }
}
