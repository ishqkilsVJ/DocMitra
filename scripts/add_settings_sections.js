import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');

// The closing of settings-section-canonical is followed by the closing of the container div
const targetStr = '</div>\n</div>\n<!-- Modal Bottom Action Bar';
const altTargetStr = '</div>\r\n</div>\r\n<!-- Modal Bottom Action Bar';

const newSections = `
    <!-- Section 2: Shortcuts & Keywords Matrix -->
    <div id="settings-section-keywords" class="settings-section hidden flex flex-col gap-space-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[20px]">bolt</span>
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">21-Shortcut Fast Keyword Engine</span>
        </div>
        <span class="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-mono-code text-label-sm font-semibold">21 Active Shortcuts</span>
      </div>
      <div class="rounded-xl overflow-hidden bg-surface-container-low shadow-xs">
        <div class="grid grid-cols-12 bg-surface-container px-space-md py-2.5 font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
          <div class="col-span-2">SHORTCUT</div>
          <div class="col-span-4">DOCUMENT TYPE</div>
          <div class="col-span-4">MATCHING LOGIC</div>
          <div class="col-span-2 text-right">WORD BOUNDARY</div>
        </div>
        <div class="flex flex-col divide-y divide-outline-variant/20" id="shortcutMatrixRows"></div>
      </div>
    </div>

    <!-- Section 3: Checklists & Document Linking -->
    <div id="settings-section-checklists" class="settings-section hidden flex flex-col gap-space-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[20px]">checklist</span>
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">Maharashtra Admission Portal Checklists</span>
        </div>
        <span class="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-mono-code text-label-sm font-semibold">MahaDBT Verified</span>
      </div>
      <div class="rounded-xl overflow-hidden bg-surface-container-low shadow-xs p-4 flex flex-col gap-3" id="checklistContainer">
        <div class="flex items-center gap-2" id="checklistFormTabs"></div>
        <div class="flex flex-col gap-2" id="checklistRulesList"></div>
      </div>
    </div>

    <!-- Section 4: Backup, Export & Import -->
    <div id="settings-section-backup" class="settings-section hidden flex flex-col gap-space-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[20px]">cloud_sync</span>
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">Offline Backup &amp; Configuration Transfer</span>
        </div>
        <span class="px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-mono-code text-label-sm font-semibold">100% Offline</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Export Card -->
        <div class="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-4">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-primary font-bold">
              <span class="material-symbols-outlined text-[22px]">file_download</span>
              <span class="font-headline-sm text-[16px]">Export System Settings</span>
            </div>
            <p class="text-body-sm text-secondary">Download a validated JSON snapshot of all 21 naming rules, shortcuts, checklists, and custom presets.</p>
          </div>
          <button id="btnExportSettingsJSON" type="button" class="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xs cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">download</span>
            <span>Download Backup (.json)</span>
          </button>
        </div>
        <!-- Import Card -->
        <div class="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-4">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-2 text-tertiary font-bold">
              <span class="material-symbols-outlined text-[22px]">file_upload</span>
              <span class="font-headline-sm text-[16px]">Import Configuration</span>
            </div>
            <p class="text-body-sm text-secondary">Restore from a DocMitra backup JSON file with strict schema validation.</p>
          </div>
          <div class="flex items-center gap-2">
            <input type="file" id="inputImportSettingsJSON" accept=".json,application/json" class="hidden">
            <button id="btnTriggerImportJSON" type="button" class="w-full py-2.5 px-4 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/50 font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer">
              <span class="material-symbols-outlined text-[18px] text-tertiary">upload_file</span>
              <span>Select File &amp; Restore</span>
            </button>
          </div>
        </div>
      </div>
      <!-- Storage Status -->
      <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between font-mono-code text-[12px]">
        <div class="flex items-center gap-2 text-secondary">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Storage Engine: <strong>LocalStorage + IndexedDB</strong> (Auto-Hydrated)</span>
        </div>
        <span class="text-primary font-bold">Schema v3_exact_single</span>
      </div>
    </div>

    <!-- Section 5: About Us & Shortcuts Cheat Sheet -->
    <div id="settings-section-about" class="settings-section hidden flex flex-col gap-space-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[20px]">info</span>
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">About DocMitra Administrative Suite</span>
        </div>
        <span class="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-mono-code text-label-sm font-semibold">Desktop Edition v1.4.3</span>
      </div>
      <div class="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <img src="assets/icons/docmitra-logo.svg" alt="DocMitra" class="w-10 h-10 object-contain rounded-lg shadow-sm">
          <div class="flex flex-col">
            <span class="font-headline-sm font-bold text-on-surface text-[18px]">DocMitra Suite</span>
            <span class="text-label-sm text-secondary font-medium">महाराष्ट्र ॲडमिशन व दस्तऐवज कार्यप्रणाली (100% Offline Localhost)</span>
          </div>
        </div>
        <p class="text-body-sm text-on-surface-variant leading-relaxed">
          DocMitra is an offline-first Windows desktop workstation built specifically for college admission departments, school clerks, and cyber cafe document operators across Maharashtra. It enables instant bulk document renaming with MahaDBT-compliant naming conventions, zero-loss PDF compression, image enhancement, and automated admission tracking.
        </p>
        <div class="border-t border-outline-variant/20 pt-4">
          <span class="font-headline-sm text-[13px] font-bold text-on-surface block mb-2">Global Keyboard Shortcuts</span>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono-code text-[11px]">
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">F2</kbd><span>Select Folder</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">F8</kbd><span>Rename All</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">F9</kbd><span>Export Audit</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">Tab</kbd><span>Keep &amp; Next</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">Ctrl+Z</kbd><span>Undo Rename</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">Ctrl+S</kbd><span>Save Batch</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">Ctrl+,</kbd><span>Open Settings</span></div>
            <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between"><kbd class="font-bold text-primary">Esc</kbd><span>Close Modal</span></div>
          </div>
        </div>
      </div>
    </div>
`;

let updatedHtml;
if (html.includes(targetStr)) {
  updatedHtml = html.replace(targetStr, newSections + '\n</div>\n</div>\n<!-- Modal Bottom Action Bar');
} else if (html.includes(altTargetStr)) {
  updatedHtml = html.replace(altTargetStr, newSections + '\r\n</div>\r\n</div>\r\n<!-- Modal Bottom Action Bar');
} else {
  console.error('Target string not found in index.html!');
  process.exit(1);
}

fs.writeFileSync('app/index.html', updatedHtml, 'utf8');
console.log('Successfully injected settings sections into app/index.html');
