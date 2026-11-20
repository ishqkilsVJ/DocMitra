/* ==========================================================================
   Student Document Renamer — Export/Import Service (English)
   ========================================================================== */

export function exportSettingsToFile(state) {
  const payload = {
    format: 'BulkStudentRenamerSettings',
    version: 1,
    exportedAt: new Date().toISOString(),
    groups: state.groups,
    profiles: state.profiles,
    checklists: state.checklists,
    spelling: state.spelling,
    style: state.style
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-renamer-settings-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importSettingsFromFile(file, state) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No backup file selected.'));
    
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error('Backup file exceeds maximum allowed size (5 MB).'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON data.');
        }
        if (data.format !== 'BulkStudentRenamerSettings') {
          throw new Error('Invalid settings backup format. Expected BulkStudentRenamerSettings.');
        }

        if (data.groups && typeof data.groups === 'object') {
          state.groups = JSON.parse(JSON.stringify(data.groups));
        }
        if (data.profiles && typeof data.profiles === 'object') {
          state.profiles = JSON.parse(JSON.stringify(data.profiles));
        }
        if (data.checklists && typeof data.checklists === 'object') {
          state.checklists = JSON.parse(JSON.stringify(data.checklists));
        }
        if (data.spelling && typeof data.spelling === 'object') {
          state.spelling = JSON.parse(JSON.stringify(data.spelling));
        }
        if (['preserve', 'upper', 'lower', 'title'].includes(data.style)) {
          state.style = data.style;
        }

        state.active = Object.keys(state.profiles || {})[0] || 'Default';
        resolve(state);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsText(file);
  });
}
