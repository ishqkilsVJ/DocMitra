import fs from 'fs';

let html = fs.readFileSync('app/index.html', 'utf8');

const fuStart = html.indexOf('id="view-follow-up"');
const fuEnd = html.indexOf('id="settings-modal-overlay"');
let chunk = html.substring(fuStart, fuEnd);

// Search input
chunk = chunk.replace(
  '<input class="w-full h-8 pl-8 pr-3 text-body-sm font-body-sm rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Search student or phone..." type="text"/>',
  '<input id="inputFollowupSearch" class="w-full h-8 pl-8 pr-3 text-body-sm font-body-sm rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Search student or phone..." type="text"/>'
);

// Open Batch Directory button
chunk = chunk.replace(
  '<button class="h-8 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm font-bold"><span class="material-symbols-outlined text-[16px]">folder_open</span><span>Open Batch Directory</span></button>',
  '<button id="btnOpenBatchDirFollowup" class="h-8 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-sm font-bold cursor-pointer"><span class="material-symbols-outlined text-[16px]">folder_open</span><span>Open Batch Directory</span></button>'
);

// Table body
chunk = chunk.replace(
  '<tbody class="divide-y divide-surface-container text-body-sm font-body-sm">',
  '<tbody id="followupTableBody" class="divide-y divide-surface-container text-body-sm font-body-sm">'
);

const updatedHtml = html.substring(0, fuStart) + chunk + html.substring(fuEnd);
fs.writeFileSync('app/index.html', updatedHtml, 'utf8');
console.log('Follow-up Desk IDs added successfully.');
