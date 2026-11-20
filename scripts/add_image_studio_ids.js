import fs from 'fs';

let html = fs.readFileSync('app/index.html', 'utf8');

const imgSectionStart = html.indexOf('id="view-image-studio"');
const imgSectionEnd = html.indexOf('id="view-print-studio"');
let chunk = html.substring(imgSectionStart, imgSectionEnd);

// Replace Browse Directory button
chunk = chunk.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm" type="button">\n<span class="material-symbols-outlined text-[18px] text-primary">folder_open</span>\n<span>Browse Directory</span>',
  '<button id="btnBrowseImageDir" class="px-space-md py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[18px] text-primary">folder_open</span>\n<span>Browse Directory</span>'
);

// Replace Add Photos button
chunk = chunk.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm" type="button">\n<span class="material-symbols-outlined text-[18px]">add_photo_alternate</span>\n<span>Add Photos / Images</span>',
  '<button id="btnAddImageFiles" class="px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[18px]">add_photo_alternate</span>\n<span>Add Photos / Images</span>'
);

// Replace grid container
chunk = chunk.replace(
  '<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">',
  '<div id="imageCardsGrid" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">'
);

// Replace Rotate All button
chunk = chunk.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>\n<span>Rotate All 90°</span>\n</button>',
  '<button id="btnRotateAllImages" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>\n<span>Rotate All 90°</span>\n</button>'
);

// Replace Clear Queue button
chunk = chunk.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">cleaning_services</span>\n<span>Clear Queue</span>\n</button>',
  '<button id="btnClearImageQueue" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">cleaning_services</span>\n<span>Clear Queue</span>\n</button>'
);

// Replace Filter Oversized button
chunk = chunk.replace(
  '<button class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5" type="button">\n<span class="material-symbols-outlined text-[16px]">filter_alt</span>\n<span>Filter Oversized (>256KB)</span>\n</button>',
  '<button id="btnFilterOversizedImages" class="px-space-md py-1.5 rounded-lg bg-on-background/70 hover:bg-on-background text-surface-variant hover:text-inverse-on-surface font-label-md text-label-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer" type="button">\n<span class="material-symbols-outlined text-[16px]">filter_alt</span>\n<span>Filter Oversized (>256KB)</span>\n</button>'
);

const updatedHtml = html.substring(0, imgSectionStart) + chunk + html.substring(imgSectionEnd);
fs.writeFileSync('app/index.html', updatedHtml, 'utf8');
console.log('Image Studio IDs updated successfully.');
