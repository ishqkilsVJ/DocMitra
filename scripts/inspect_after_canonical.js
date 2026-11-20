import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const pos = html.indexOf('id="canonicalRuleRows"');
const end = html.indexOf('id="toast-container"');
console.log(html.substring(pos, end));
