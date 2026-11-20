import fs from 'fs';

let html = fs.readFileSync('app/index.html', 'utf8');

// 1. Add id="btnBrowsePdfDir" and id="btnAddPdfFiles"
html = html.replace(
  '<button class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-surface-container-high font-label-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer" type="button"><span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span><span>Browse Directory</span></button>',
  '<button id="btnBrowsePdfDir" class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-surface-container-high font-label-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer" type="button"><span class="material-symbols-outlined text-[16px] text-primary">drive_folder_upload</span><span>Browse Directory</span></button>'
);

html = html.replace(
  '<button class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-surface-container-high font-label-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer" type="button"><span class="material-symbols-outlined text-[16px] text-primary">add_circle</span><span>Add Files</span></button>',
  '<button id="btnAddPdfFiles" class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-surface-container-high font-label-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer" type="button"><span class="material-symbols-outlined text-[16px] text-primary">add_circle</span><span>Add Files</span></button>'
);

// 2. Add id="pdfQueueCount" and id="pdfQueueStats"
html = html.replace(
  '<span class="bg-primary-container text-on-primary font-mono-code text-[11px] px-2 py-0.5 rounded-full font-bold">8 Files Loaded</span>',
  '<span id="pdfQueueCount" class="bg-primary-container text-on-primary font-mono-code text-[11px] px-2 py-0.5 rounded-full font-bold">0 Files Loaded</span>'
);

html = html.replace(
  '<span class="font-mono-code text-[12px] text-outline">Total: 8.94 MB → Projected: ~1.72 MB</span>',
  '<span id="pdfQueueStats" class="font-mono-code text-[12px] text-outline">Total: 0 MB → Projected: 0 MB</span>'
);

// 3. Add id="pdfCardsGrid"
html = html.replace(
  '<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">',
  '<div id="pdfCardsGrid" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">'
);

// 4. Add bottom button IDs
html = html.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>\n<span>Rotate All 90°</span>\n</button>',
  '<button id="btnRotateAllPdf" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>\n<span>Rotate All 90°</span>\n</button>'
);

html = html.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">cleaning_services</span>\n<span>Clear Queue</span>\n</button>',
  '<button id="btnClearPdfQueue" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">cleaning_services</span>\n<span>Clear Queue</span>\n</button>'
);

html = html.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">filter_alt</span>\n<span>Filter Oversized (>256KB)</span>\n</button>',
  '<button id="btnFilterOversizedPdf" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">filter_alt</span>\n<span>Filter Oversized (>256KB)</span>\n</button>'
);

fs.writeFileSync('app/index.html', html, 'utf8');
console.log('PDF Studio IDs added successfully.');
