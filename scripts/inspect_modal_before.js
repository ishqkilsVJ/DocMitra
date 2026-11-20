import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const pos = html.indexOf('id="settings-section-canonical"');
console.log(html.substring(pos - 400, pos));
