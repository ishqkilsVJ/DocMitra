import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const pos = html.indexOf('id="settings-section-canonical"');
const parentStart = html.lastIndexOf('<div', pos);
const parentEnd = html.indexOf('<!-- Modal Bottom Action Bar', pos);

console.log('CONTAINER:\n', html.substring(parentStart, parentEnd));
