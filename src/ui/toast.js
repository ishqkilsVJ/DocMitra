/**
 * DocMitra Suite — Unified Suite-Wide Toast Notification System
 * Bottom Black Action Bar Mounted Notification Manager (Choice 1-A)
 * 
 * Rules:
 * 1. Strict Bottom Black Action Bar Mount: Mounts cleanly inside the active view's center `.bottom-toast-slot`.
 * 2. Anti-Stacking & Single Active Toast: Exactly 1 visible toast at a time. New notifications cleanly replace the active one.
 * 3. Smart Counter & In-Place Update: Rapid repetitive actions update the active toast with '×N' counter badge.
 * 4. Auto-Adjustable Width & Non-Disruptive: Automatically flexes up to 460px with text truncation, never squishing footer buttons.
 * 5. Snappy Auto-Dismiss: 2.2s for info/success, 3.2s for warning/error, leaving slot completely empty and clean when idle. Actionable Undo persists.
 */

class UnifiedToastManager {
  constructor() {
    this.activeToast = null;
    this.maxVisible = 1;
  }

  _getActiveSlot() {
    if (typeof document === 'undefined') return null;

    // 1. Target .bottom-toast-slot inside currently visible view pane
    const activeView = document.querySelector('.view-pane:not(.hidden)');
    if (activeView) {
      const slot = activeView.querySelector('.bottom-toast-slot');
      if (slot) return slot;
    }

    // 2. Global bottom toast slot
    const anySlot = document.querySelector('.bottom-toast-slot');
    if (anySlot) return anySlot;

    // 3. Floating fallback if no bottom action bar exists (e.g. Fullscreen modal)
    let fallback = document.getElementById('toast-fallback-container');
    if (!fallback) {
      fallback = document.createElement('div');
      fallback.id = 'toast-fallback-container';
      fallback.className = 'fixed bottom-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none select-none flex items-center justify-center';
      document.body.appendChild(fallback);
    }
    return fallback;
  }

  success(title, subtitle = '', duration = null) {
    this.show(title, subtitle, 'success', duration);
  }

  error(title, subtitle = '', duration = null) {
    this.show(title, subtitle, 'error', duration);
  }

  warning(title, subtitle = '', duration = null) {
    this.show(title, subtitle, 'warning', duration);
  }

  info(title, subtitle = '', duration = null) {
    this.show(title, subtitle, 'info', duration);
  }

  /**
   * Display a clean, non-blocking toast inside the bottom action bar
   */
  show(title, subtitle = '', type = 'info', duration = null, action = null) {
    const slot = this._getActiveSlot();
    if (!slot) return;

    const cleanTitle = (title || '').trim();
    const cleanSub = (subtitle || '').trim();
    const key = `${type}:${cleanTitle}`;

    // 1. Context-Aware Smart Duration
    let autoDuration = duration;
    if (autoDuration === null || autoDuration === undefined) {
      if (action && typeof action.onClick === 'function') {
        autoDuration = 0; // Actionable Undo toasts persist until clicked or dismissed
      } else if (type === 'warning' || type === 'error') {
        autoDuration = 3200; // 3.2s for warnings/errors
      } else {
        autoDuration = 2200; // 2.2s snappy auto-dismiss for info/success
      }
    }

    // 2. Smart Grouping & In-Place Counter
    if (this.activeToast && this.activeToast.key === key && !action && !this.activeToast.action) {
      this.activeToast.count += 1;
      this._updateInPlace(this.activeToast, cleanTitle, cleanSub, autoDuration);
      return;
    }

    // 3. Anti-Stacking Enforcement (Smoothly replace any existing toast)
    if (this.activeToast) {
      this._removeToast(this.activeToast, true);
    }

    // 4. Create New Toast Pill inside Bottom Bar Slot
    this._createToastCard(cleanTitle, cleanSub, type, autoDuration, action, key, slot);
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
    toastObj.el.classList.add('scale-105');
    setTimeout(() => {
      if (toastObj.el) toastObj.el.classList.remove('scale-105');
    }, 150);

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

  _createToastCard(title, subtitle, type, duration, action, key, slot) {
    // Clear slot
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild);
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/95 border border-slate-700/80 text-[11px] text-slate-200 shadow-sm max-w-full truncate pointer-events-auto transition-all duration-200 select-none';

    // Status Icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined text-[15px] shrink-0';
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

    // Title
    const titleEl = document.createElement('span');
    titleEl.className = 'font-bold text-white text-[11px] shrink-0';
    titleEl.textContent = title;
    toastEl.appendChild(titleEl);

    // Counter Badge (initially hidden)
    const counterEl = document.createElement('span');
    counterEl.className = 'px-1 py-0.2 bg-blue-500/30 text-blue-300 font-mono text-[9px] rounded font-bold hidden shrink-0';
    counterEl.textContent = '×1';
    toastEl.appendChild(counterEl);

    // Subtitle (if any)
    let subtitleEl = null;
    if (subtitle) {
      subtitleEl = document.createElement('span');
      subtitleEl.className = 'text-slate-300 text-[10px] truncate max-w-[220px] font-mono shrink-1';
      subtitleEl.textContent = subtitle;
      toastEl.appendChild(subtitleEl);
    }

    // Optional Inline Action Button (e.g., 'Undo')
    if (action && typeof action.onClick === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'ml-1.5 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-0.5 cursor-pointer active:scale-95 shadow-xs transition-all shrink-0';
      actionBtn.innerHTML = `
        <span class="material-symbols-outlined text-[12px]">undo</span>
        <span>${action.label || 'Undo'}</span>
      `;
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeToast(toastObj, true);
        action.onClick();
      });
      toastEl.appendChild(actionBtn);
    }

    // Dismiss Button (×)
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'text-slate-400 hover:text-white ml-1 p-0.5 leading-none rounded hover:bg-slate-700/60 cursor-pointer flex items-center justify-center shrink-0';
    dismissBtn.setAttribute('aria-label', 'Dismiss notification');
    dismissBtn.innerHTML = '<span class="material-symbols-outlined text-[13px]">close</span>';
    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeToast(toastObj);
    });
    toastEl.appendChild(dismissBtn);

    const toastObj = {
      key,
      el: toastEl,
      slot,
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

    slot.appendChild(toastEl);
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

    toastObj.el.style.opacity = '0';
    toastObj.el.style.transform = 'scale(0.95)';
    setTimeout(() => {
      if (toastObj.el && toastObj.el.parentNode) {
        toastObj.el.parentNode.removeChild(toastObj.el);
      }
    }, 150);
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
