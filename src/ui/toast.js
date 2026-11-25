/**
 * DocMitra Suite — Unified Suite-Wide Toast Notification System
 * Non-blocking, high-contrast, top-right placed notification manager.
 * 
 * Rules:
 * 1. Anti-Stacking: Max 1 visible toast at a time.
 * 2. Smart Grouping & Counter: Rapid repetitive actions update active toast in-place with '×N' badge.
 * 3. Snappy Auto-Dismiss: 1.8s for standard info/success, 3s for warning/error. Actionable Undo toasts persist until clicked/dismissed.
 * 4. Safe Top-Right Placement: Positioned below top administrative ribbon, never blocking bottom footer buttons.
 */

class UnifiedToastManager {
  constructor() {
    this.container = null;
    this.activeToast = null; // Single active toast instance
    this.maxVisible = 1;
    this._pulseTimeout = null;

    if (typeof document !== 'undefined') {
      this._ensureContainer();
    }
  }

  _ensureContainer() {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'fixed top-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px] select-none';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    } else {
      // Ensure top-right non-blocking classes are enforced
      if (el.classList.contains('bottom-12') || el.classList.contains('bottom-6')) {
        el.className = 'fixed top-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px] select-none';
      }
    }
    this.container = el;
  }

  /**
   * Display a clean, non-blocking toast
   * @param {string} title
   * @param {string} [subtitle=""]
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {number|null} [duration=null]
   * @param {{ label?: string, onClick: Function }|null} [action=null]
   */
  show(title, subtitle = '', type = 'info', duration = null, action = null) {
    this._ensureContainer();
    if (!this.container) return;

    const cleanTitle = (title || '').trim();
    const cleanSub = (subtitle || '').trim();
    const key = `${type}:${cleanTitle}`;

    // 1. Context-Aware Smart Duration
    let autoDuration = duration;
    if (autoDuration === null || autoDuration === undefined) {
      if (action && typeof action.onClick === 'function') {
        autoDuration = 0; // Actionable Undo toasts persist until clicked or dismissed (Option 3-C)
      } else if (type === 'warning' || type === 'error') {
        autoDuration = 3000; // 3.0s for warnings/errors
      } else {
        autoDuration = 1800; // 1.8s snappy auto-dismiss for info/success
      }
    }

    // 2. Smart Grouping & In-Place Counter
    if (this.activeToast && this.activeToast.key === key && !action && !this.activeToast.action) {
      this.activeToast.count += 1;
      this._updateInPlace(this.activeToast, cleanTitle, cleanSub, autoDuration);
      return;
    }

    // 3. Anti-Stacking Enforcement (Cleanly dismiss existing toast)
    if (this.activeToast) {
      this._removeToast(this.activeToast, true);
    }

    // 4. Create New Toast
    this._createToastCard(cleanTitle, cleanSub, type, autoDuration, action, key);
  }

  _updateInPlace(toastObj, title, subtitle, duration) {
    if (!toastObj || !toastObj.el) return;

    // Update Counter Badge
    if (toastObj.counterEl) {
      toastObj.counterEl.textContent = `×${toastObj.count}`;
      toastObj.counterEl.classList.remove('hidden');
    }

    // Update Subtitle
    if (toastObj.subtitleEl && subtitle) {
      toastObj.subtitleEl.textContent = subtitle;
    }

    // Micro-Pulse Animation
    toastObj.el.classList.remove('toast-pulse');
    void toastObj.el.offsetWidth; // trigger reflow
    toastObj.el.classList.add('toast-pulse');

    // Reset Auto-Dismiss Timer
    if (toastObj.timer) {
      clearTimeout(toastObj.timer);
      toastObj.timer = null;
    }
    if (duration > 0) {
      toastObj.timer = setTimeout(() => {
        this._removeToast(toastObj);
      }, duration);
    }
  }

  _createToastCard(title, subtitle, type, duration, action, key) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${type}`;

    // Semantic Status Icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined text-[20px] shrink-0';
    if (type === 'success') {
      iconSpan.textContent = 'check_circle';
      iconSpan.className += ' text-emerald-400';
    } else if (type === 'warning') {
      iconSpan.textContent = 'warning';
      iconSpan.className += ' text-amber-400';
    } else if (type === 'error') {
      iconSpan.textContent = 'error';
      iconSpan.className += ' text-rose-400';
    } else {
      iconSpan.textContent = 'info';
      iconSpan.className += ' text-blue-400';
    }
    toastEl.appendChild(iconSpan);

    // Text & Counter Container
    const textCol = document.createElement('div');
    textCol.className = 'flex flex-col min-w-0 flex-1';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex items-center gap-1.5 flex-wrap';

    const titleEl = document.createElement('span');
    titleEl.className = 'font-bold font-headline text-white text-[13px] leading-tight truncate';
    titleEl.textContent = title;
    titleRow.appendChild(titleEl);

    // Counter Badge (initially hidden, shown when count > 1)
    const counterEl = document.createElement('span');
    counterEl.className = 'toast-counter-badge hidden';
    counterEl.textContent = '×1';
    titleRow.appendChild(counterEl);
    textCol.appendChild(titleRow);

    let subtitleEl = null;
    if (subtitle) {
      subtitleEl = document.createElement('span');
      subtitleEl.className = 'font-mono text-[11px] text-slate-300 mt-0.5 leading-tight truncate max-w-[280px]';
      subtitleEl.textContent = subtitle;
      textCol.appendChild(subtitleEl);
    }

    toastEl.appendChild(textCol);

    // Optional Inline Action Button (e.g., 'Undo')
    if (action && typeof action.onClick === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'ml-auto mr-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0';
      actionBtn.innerHTML = `
        <span class="material-symbols-outlined text-[14px]">undo</span>
        <span>${action.label || 'Undo'}</span>
      `;
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeToast(toastObj);
        action.onClick();
      });
      toastEl.appendChild(actionBtn);
    }

    // Dismiss Button (×)
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center shrink-0 cursor-pointer rounded hover:bg-slate-800/60';
    dismissBtn.setAttribute('aria-label', 'Dismiss notification');
    const dismissIcon = document.createElement('span');
    dismissIcon.className = 'material-symbols-outlined text-[16px]';
    dismissIcon.textContent = 'close';
    dismissBtn.appendChild(dismissIcon);

    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeToast(toastObj);
    });
    toastEl.appendChild(dismissBtn);

    const toastObj = {
      key,
      el: toastEl,
      counterEl,
      subtitleEl,
      count: 1,
      timer: null,
      action
    };

    if (duration > 0) {
      toastObj.timer = setTimeout(() => {
        this._removeToast(toastObj);
      }, duration);
    }

    this.container.appendChild(toastEl);
    this.activeToast = toastObj;
  }

  _removeToast(toastObj, immediate = false) {
    if (!toastObj || !toastObj.el) return;

    if (toastObj.timer) {
      clearTimeout(toastObj.timer);
      toastObj.timer = null;
    }

    if (this.activeToast === toastObj) {
      this.activeToast = null;
    }

    if (immediate) {
      if (toastObj.el.parentNode) {
        toastObj.el.parentNode.removeChild(toastObj.el);
      }
      return;
    }

    toastObj.el.classList.add('toast-leaving');
    setTimeout(() => {
      if (toastObj.el && toastObj.el.parentNode) {
        toastObj.el.parentNode.removeChild(toastObj.el);
      }
    }, 180);
  }
}

export const toast = new UnifiedToastManager();

export function showToast(title, type = 'info', subtitle = '', duration = null, action = null) {
  toast.show(title, subtitle, type, duration, action);
}

// Global Window Registration for DocMitra Suite
if (typeof window !== 'undefined') {
  window.DocMitraToast = toast;
  window.showToast = showToast;
}
