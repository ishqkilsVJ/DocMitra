/**
 * ClerkMaster Hardware-Lock & Licensing Service
 * Validates machine hardware fingerprint on startup and manages license activation.
 */

class LicensingService {
  constructor() {
    this.isLicensed = false;
    this.systemKey = '';
    this.customer = '';
    this.validity = '';
  }

  async checkLicense() {
    const overlay = document.getElementById('activationLockOverlay');
    const sysKeyDisplay = document.getElementById('activationSystemKeyDisplay');
    const copyBtn = document.getElementById('copySystemKeyBtn');
    const submitBtn = document.getElementById('submitActivationBtn');
    const custInput = document.getElementById('activateCustomerInput');
    const keyInput = document.getElementById('activateLicenseKeyInput');
    const alertBox = document.getElementById('activationAlertBox');

    // Wire up Copy System Key button
    if (copyBtn) {
      copyBtn.onclick = () => {
        if (this.systemKey) {
          navigator.clipboard.writeText(this.systemKey);
          if (typeof window.showToast === 'function') {
            window.showToast('📋 System Key copied to clipboard!', 'success');
          }
        }
      };
    }

    // Wire up Submit Activation button
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const cust = custInput ? custInput.value.trim() : '';
        const lic = keyInput ? keyInput.value.trim() : '';

        if (!cust) {
          this.showAlert('Please enter customer / college name.', 'error');
          return;
        }
        if (!lic || !lic.startsWith('CM-LIC-')) {
          this.showAlert('Please enter a valid License Key (starts with CM-LIC-).', 'error');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying hardware signature...';

        try {
          const resp = await fetch('/api/activate-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer: cust, licenseKey: lic })
          });
          const data = await resp.json();

          if (data && data.success) {
            this.isLicensed = true;
            this.showAlert('🎉 License verified! Unlocking ClerkMaster...', 'success');
            setTimeout(() => {
              if (overlay) overlay.style.display = 'none';
              if (typeof window.showToast === 'function') {
                window.showToast(`🎉 ClerkMaster Activated for ${cust}!`, 'success');
              }
            }, 1000);
          } else {
            this.showAlert(data.error || 'Invalid License Key for this machine.', 'error');
          }
        } catch (err) {
          this.showAlert('Network / server error while activating.', 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '⚡ Activate & Unlock ClerkMaster';
        }
      };
    }

    try {
      const resp = await fetch('/api/license-status');
      const data = await resp.json();

      this.systemKey = data.systemKey || '';
      this.isLicensed = Boolean(data.licensed);
      this.customer = data.customer || '';
      this.validity = data.validity || '';

      if (sysKeyDisplay) {
        sysKeyDisplay.textContent = this.systemKey || 'UNKNOWN-HARDWARE';
      }

      if (this.isLicensed) {
        if (overlay) overlay.style.display = 'none';
        console.log(`[LICENSE] Active: ${this.customer} (${this.validity})`);
      } else {
        if (overlay) overlay.style.display = 'flex';
        console.warn(`[LICENSE] Unregistered machine: ${this.systemKey}`);
      }
    } catch (err) {
      console.warn('[LICENSE] Could not query license status:', err);
      // Fallback: don't block in pure static dev mode if API isn't reached
    }
  }

  showAlert(msg, type) {
    const box = document.getElementById('activationAlertBox');
    if (!box) return;
    box.textContent = msg;
    box.style.display = 'block';
    if (type === 'success') {
      box.style.background = '#064e3b';
      box.style.color = '#6ee7b7';
      box.style.border = '1px solid #059669';
    } else {
      box.style.background = '#450a0a';
      box.style.color = '#fca5a5';
      box.style.border = '1px solid #dc2626';
    }
  }
}

export const licensingService = new LicensingService();
