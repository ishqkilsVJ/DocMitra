import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="view-follow-up"');
const end = html.indexOf('id="settings-modal-overlay"');
const chunk = html.substring(start, end);

console.log(chunk.slice(0, 3000));
