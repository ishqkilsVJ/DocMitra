/**
 * DocMitra UI Toast Notification System
 * Non-blocking, administrative bento styled notification system.
 * STRICT RULE: Uses safe DOM creation methods only (no innerHTML).
 */

class ToastManager {
  constructor() {
    this.container = null;
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
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    this.container = el;
  }

  /**
   * Display a clean, non-blocking toast
   * @param {string} title
   * @param {string} [subtitle="Ready to connect"]
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {number} [duration=3000]
   */
  show(title, subtitle = 'Ready to connect', type = 'info', duration = 3000) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    // Status icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined text-[20px] shrink-0';
    if (type === 'success') {
      iconSpan.textContent = 'check_circle';
      iconSpan.classList.add('text-emerald-400');
    } else if (type === 'warning') {
      iconSpan.textContent = 'warning';
      iconSpan.classList.add('text-amber-400');
    } else if (type === 'error') {
      iconSpan.textContent = 'error';
      iconSpan.classList.add('text-red-400');
    } else {
      iconSpan.textContent = 'info';
      iconSpan.classList.add('text-blue-400');
    }
    toast.appendChild(iconSpan);

    // Text Container
    const textCol = document.createElement('div');
    textCol.className = 'flex flex-col min-w-0';

    const titleEl = document.createElement('span');
    titleEl.className = 'font-bold font-headline text-white text-[13px] leading-tight truncate';
    titleEl.textContent = title;
    textCol.appendChild(titleEl);

    if (subtitle) {
      const subEl = document.createElement('span');
      subEl.className = 'font-mono text-[11px] text-slate-300 mt-0.5 leading-tight';
      subEl.textContent = subtitle;
      textCol.appendChild(subEl);
    }

    toast.appendChild(textCol);

    // Dismiss Button
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'ml-auto text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center';
    dismissBtn.setAttribute('aria-label', 'Dismiss notification');
    const dismissIcon = document.createElement('span');
    dismissIcon.className = 'material-symbols-outlined text-[16px]';
    dismissIcon.textContent = 'close';
    dismissBtn.appendChild(dismissIcon);

    const removeToast = () => {
      toast.classList.add('toast-leaving');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeToast();
    });
    toast.appendChild(dismissBtn);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }
}

export const toast = new ToastManager();

export function showToast(title, type = 'info') {
  toast.show(title, '', type);
}
