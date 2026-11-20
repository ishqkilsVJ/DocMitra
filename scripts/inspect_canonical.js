import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const start = html.indexOf('id="settings-section-canonical"');
const end = html.indexOf('</aside>', start);
console.log(html.substring(start, end).slice(0, 3000));
