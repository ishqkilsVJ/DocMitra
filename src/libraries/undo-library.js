/* ==========================================================================
   Student Document Renamer — पूर्ववत इतिहास व्यवस्थापक (Multi-Level Undo Stack)
   ========================================================================== */

class UndoManager {
  constructor(maxHistory = 10) {
    this.history = [];
    this.maxHistory = maxHistory;
  }

  /**
   * नवीन रीनेम बॅच इतिहासात नोंदवणे
   * @param {FileSystemDirectoryHandle} dir
   * @param {Array<{old: string, next: string, file: File}>} plan
   */
  pushBatch(dir, plan) {
    if (!plan || !plan.length) return;
    this.history.push({
      dir,
      dirName: dir.name,
      plan: [...plan],
      timestamp: new Date().toISOString()
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * सर्वात अलीकडील बॅच मिळवणे
   */
  peek() {
    return this.history[this.history.length - 1] || null;
  }

  /**
   * सर्वात अलीकडील बॅच काढून घेणे
   */
  pop() {
    return this.history.pop() || null;
  }

  canUndo() {
    return this.history.length > 0;
  }

  clear() {
    this.history = [];
  }
}

export const undoManager = new UndoManager();
