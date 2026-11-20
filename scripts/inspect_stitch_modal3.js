import fs from 'fs';

const html = fs.readFileSync('_design_ref/stitch_docmitra/system_rules_settings_modal/code.html', 'utf8');
const bodyStart = html.indexOf('<body');
console.log(html.substring(bodyStart, bodyStart + 4000));
