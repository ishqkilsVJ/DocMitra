import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
['settings-section-canonical', 'settings-section-keywords', 'settings-section-checklists', 'settings-section-backup', 'settings-section-about'].forEach(id => {
  console.log(id, 'exists:', html.includes('id="' + id + '"'));
});
