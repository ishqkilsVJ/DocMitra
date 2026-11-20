import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const settingsStart = html.indexOf('id="settings-modal-overlay"');
const settingsEnd = html.indexOf('</aside>', settingsStart) + 10;
const chunk = html.substring(settingsStart, settingsStart + 15000);

console.log('SETTINGS CHUNK:\n', chunk.slice(0, 3000));
