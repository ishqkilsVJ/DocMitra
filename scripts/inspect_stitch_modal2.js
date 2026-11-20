import fs from 'fs';

const html = fs.readFileSync('_design_ref/stitch_docmitra/system_rules_settings_modal/code.html', 'utf8');
console.log('Length:', html.length);
console.log(html.slice(0, 3000));
