/**
 * ClerkMaster Auto-Update Service
 * Seamlessly checks GitHub Releases for new software updates, displays changelogs,
 * and allows 1-click in-app update & reload without manual installer download.
 */

import { dispatchError } from './error-code-service.js';

export const CURRENT_VERSION = '1.4.2';
export const GITHUB_REPO = 'ishqkilsVJ/ClerkMaster';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_PAT = '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';

class UpdaterService {
  constructor() {
    this.latestRelease = null;
    this.updateAvailable = false;
    this.badgeEl = null;
    this.modalEl = null;
  }

  init() {
    this.badgeEl = document.getElementById('updateBadge');
    this.modalEl = document.getElementById('updateModal');
    
    // Wire up Topbar Button
    const topbarBtn = document.getElementById('checkUpdatesTopbarBtn');
    if (topbarBtn) {
      topbarBtn.addEventListener('click', () => {
        this.openModal();
        this.checkForUpdates(true);
      });
    }

    // Modal Close Button
    const closeBtn = document.getElementById('closeUpdateModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Recheck Button
    const recheckBtn = document.getElementById('recheckUpdateBtn');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', () => this.checkForUpdates(true));
    }

    // Apply Update Button
    const applyBtn = document.getElementById('applyUpdateBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyInAppUpdate());
    }

    // Outside click closes modal
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) this.closeModal();
      });
    }

    // Background check on startup after 2.5 seconds (non-intrusive)
    setTimeout(() => {
      this.checkForUpdates(false);
    }, 2500);
  }

  openModal() {
    if (this.modalEl) {
      this.modalEl.style.display = 'flex';
    }
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
  }

  async checkForUpdates(isUserInitiated = false) {
    const statusText = document.getElementById('updateStatusText');
    const statusBox = document.getElementById('updateStatusContainer');
    const changelogSection = document.getElementById('updateChangelogSection');
    const changelogText = document.getElementById('updateChangelogText');
    const applyBtn = document.getElementById('applyUpdateBtn');
    const currentVerEl = document.getElementById('updateCurrentVersionText');

    if (currentVerEl) {
      currentVerEl.textContent = `Installed Version: v${CURRENT_VERSION}`;
    }

    if (isUserInitiated && statusText) {
      statusText.innerHTML = '🔍 Checking GitHub for new updates...';
      if (statusBox) statusBox.style.borderColor = 'var(--line)';
      if (changelogSection) changelogSection.style.display = 'none';
      if (applyBtn) applyBtn.style.display = 'none';
      const dlExeBtn = document.getElementById('directDownloadExeBtn');
      if (dlExeBtn) dlExeBtn.style.display = 'none';
    }

    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isUserInitiated && statusText) {
        statusText.innerHTML = '📡 <strong>You are currently offline.</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">Connect to the internet to check for ClerkMaster updates.</span>';
        if (statusBox) statusBox.style.borderColor = '#f59e0b';
      }
      return;
    }

    try {
      let resp = await fetch(GITHUB_API_URL, {
        headers: GITHUB_PAT ? {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_PAT}`
        } : { 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store'
      });

      if (resp.status === 401) {
        resp = await fetch(GITHUB_API_URL, {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          cache: 'no-store'
        });
      }

      if (resp.status === 404) {
        if (isUserInitiated && statusText) {
          statusText.innerHTML = `✅ <strong>ClerkMaster is up to date!</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">Installed version v${CURRENT_VERSION} is the latest available release.</span>`;
          if (statusBox) statusBox.style.borderColor = '#10b981';
        }
        this.clearBadge();
        return;
      }

      if (!resp.ok) {
        throw new Error(`GitHub API returned status ${resp.status}`);
      }

      const data = await resp.json();
      this.latestRelease = data;

      const remoteTag = (data.tag_name || data.name || '').replace(/^v/i, '').trim();
      const hasUpdate = this.isNewerVersion(CURRENT_VERSION, remoteTag);
      const updateAsset = (data.assets || []).find(a => a.name && a.name.toLowerCase().includes('update') && a.name.endsWith('.zip'));
      this.updateAssetUrl = updateAsset ? updateAsset.browser_download_url : '';

      if (hasUpdate) {
        this.updateAvailable = true;
        this.setBadge(1);

        if (statusText) {
          statusText.innerHTML = `🎉 <strong>New Update Available: v${remoteTag}!</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">A newer, improved version of ClerkMaster is ready to install.</span>`;
          if (statusBox) statusBox.style.borderColor = '#3b82f6';
        }

        if (changelogSection && changelogText) {
          const notes = data.body || 'Performance improvements, zero-prompt permissions, and new executive dashboard.';
          changelogText.textContent = notes;
          changelogSection.style.display = 'block';
        }

        if (applyBtn) {
          applyBtn.style.display = 'inline-flex';
          applyBtn.style.background = '#059669';
          applyBtn.style.color = '#fff';
          applyBtn.style.fontWeight = '800';
          const dlExeBtn = document.getElementById('directDownloadExeBtn');
        const setupAsset = (data.assets || []).find(a => a.name && a.name.endsWith('.exe'));
        if (dlExeBtn) {
          if (setupAsset && setupAsset.browser_download_url) {
            dlExeBtn.href = '/api/download-installer';
          }
          dlExeBtn.style.display = 'inline-flex';
        }

        applyBtn.textContent = `⚡ 1-Click Update (आत्ताच अपडेट करा)`;
        }

        // Show friendly toast on startup if update is detected
        if (!isUserInitiated && typeof window.showToast === 'function') {
          window.showToast(`🚀 New ClerkMaster Update v${remoteTag} is ready! Click Updates to apply.`, 'info');
        }
      } else {
        this.updateAvailable = false;
        this.clearBadge();
        if (isUserInitiated && statusText) {
          statusText.innerHTML = `✅ <strong>You are using the latest version (v${CURRENT_VERSION})!</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">Your software has all the latest tools and bug fixes.</span>`;
          if (statusBox) statusBox.style.borderColor = '#10b981';
        }
      }
    } catch (err) {
      console.warn('[UPDATER] Update check failed:', err);
      if (isUserInitiated) dispatchError('CM-502', err.message || 'Unable to check GitHub updates.');
      if (isUserInitiated && statusText) {
        statusText.innerHTML = `⚠️ <strong>Unable to check updates right now.</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">${err.message || 'Please check your internet connection.'}</span>`;
        if (statusBox) statusBox.style.borderColor = '#ef4444';
      }
    }
  }

  setBadge(count) {
    if (this.badgeEl) {
      this.badgeEl.textContent = String(count || 1);
      this.badgeEl.style.display = 'inline-block';
    }
  }

  clearBadge() {
    if (this.badgeEl) {
      this.badgeEl.style.display = 'none';
    }
  }

  async applyInAppUpdate() {
    const applyBtn = document.getElementById('applyUpdateBtn');
    const statusText = document.getElementById('updateStatusText');
    const targetVer = (this.latestRelease?.tag_name || '1.3.0').replace(/^v/i, '');

    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = '⏳ Applying Update & Restarting...';
    }

    if (statusText) {
      statusText.innerHTML = `📥 <strong>Applying v${targetVer} update files...</strong><br><span style="font-size:12px; font-weight:normal; color:var(--muted);">Updating documents preview engine, about modal, and offline modules...</span>`;
    }

    try {
      const resp = await fetch('http://localhost:3000/api/apply-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: targetVer,
          assetUrl: this.updateAssetUrl || ''
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (data && data.success) {
        this.clearBadge();
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 ClerkMaster successfully updated to v${targetVer}! Reloading...`, 'success');
        }
        setTimeout(() => {
          window.location.href = '/app/index.html?v=' + Date.now();
        }, 1200);
      } else {
        throw new Error(data.error || 'Update extraction failed');
      }
    } catch (e) {
      console.error('[UPDATER] In-app update failed:', e);
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = `⚡ Retry Update (पुन्हा प्रयत्न करा)`;
      }
      if (statusText) {
        statusText.innerHTML = `⚠️ <strong>Update Failed:</strong> ${e.message}<br><span style="font-size:12px; font-weight:normal; color:var(--muted);">Please ensure server is running and check internet connection.</span>`;
      }
    }
  }

  isNewerVersion(current, remote) {
    if (!remote) return false;
    const cParts = current.split('.').map(n => parseInt(n, 10) || 0);
    const rParts = remote.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
      const c = cParts[i] || 0;
      const r = rParts[i] || 0;
      if (r > c) return true;
      if (r < c) return false;
    }
    return false;
  }
}

export const updaterService = new UpdaterService();
