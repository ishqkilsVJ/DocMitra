import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');

function inspectView(viewId, nextViewId) {
  const start = html.indexOf('id="' + viewId + '"');
  const end = nextViewId ? html.indexOf('id="' + nextViewId + '"') : html.length;
  const chunk = html.substring(start, end);

  const ids = chunk.match(/id="([^"]+)"/g) || [];
  const btns = chunk.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
  return { ids, btns: btns.map(b => b.slice(0, 100).replace(/\n/g, ' ')) };
}

console.log('PRINT STUDIO:', inspectView('view-print-studio', 'view-follow-up'));
console.log('FOLLOW-UP DESK:', inspectView('view-follow-up', 'settings-modal-overlay'));
