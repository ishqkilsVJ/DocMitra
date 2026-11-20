/* ==========================================================================
   Student Document Renamer — Error Codes & Messages (English UI)
   ========================================================================== */

export const ERROR_CODES = {
  FILE_NOT_FOUND: 'ERR_FILE_NOT_FOUND',
  DESTINATION_EXISTS: 'ERR_DESTINATION_EXISTS',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',
  EMPTY_FILENAME: 'ERR_EMPTY_FILENAME',
  INVALID_CHARACTERS: 'ERR_INVALID_CHARACTERS',
  RESERVED_FILENAME: 'ERR_RESERVED_FILENAME',
  MEMORY_LIMIT: 'ERR_MEMORY_LIMIT',
  
  INVALID_BACKUP_FORMAT: 'ERR_INVALID_BACKUP_FORMAT',
  STORAGE_UNAVAILABLE: 'ERR_STORAGE_UNAVAILABLE',
  CORRUPTED_JSON: 'ERR_CORRUPTED_JSON',
  
  NO_FILES_SELECTED: 'ERR_NO_FILES_SELECTED',
  NO_CHANGES_DETECTED: 'ERR_NO_CHANGES_DETECTED',
  UNDO_UNAVAILABLE: 'ERR_UNDO_UNAVAILABLE'
};

export function getErrorMessage(code, detail = '') {
  const map = {
    [ERROR_CODES.DESTINATION_EXISTS]: `Destination file already exists: ${detail}`,
    [ERROR_CODES.PERMISSION_DENIED]: `Folder read/write permission was denied: ${detail}`,
    [ERROR_CODES.EMPTY_FILENAME]: 'File name cannot be empty.',
    [ERROR_CODES.INVALID_CHARACTERS]: 'File name cannot contain \\ / : * ? " < > |.',
    [ERROR_CODES.RESERVED_FILENAME]: 'This file name is reserved by Windows OS.',
    [ERROR_CODES.INVALID_BACKUP_FORMAT]: 'Invalid or unsupported settings backup file.',
    [ERROR_CODES.NO_CHANGES_DETECTED]: 'No changes detected in file names.'
  };
  return map[code] || detail || 'An unexpected error occurred.';
}
