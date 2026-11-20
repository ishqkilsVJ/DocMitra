import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');

function extractIds(sectionId) {
  const start = html.indexOf('id="' + sectionId + '"');
  if (start === -1) return [];
  // Find next section closing or next section
  const nextSec = html.indexOf('<section id="view-', start + 10);
  const end = nextSec > start ? nextSec : html.indexOf('</section>', start);
  const chunk = html.substring(start, end > start ? end : start + 30000);
  const ids = [];
  const re = /id="([^"]+)"/g;
  let m;
  while ((m = re.exec(chunk)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

console.log('Renamer IDs:', JSON.stringify(extractIds('view-bulk-renamer'), null, 2));
console.log('Settings IDs:', JSON.stringify(extractIds('settings-modal-overlay'), null, 2));
