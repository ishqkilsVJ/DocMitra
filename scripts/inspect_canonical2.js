import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const pos = html.indexOf('id="settings-section-canonical"');
console.log('Pos:', pos);
if (pos !== -1) {
  console.log(html.substring(pos, pos + 3000));
}
