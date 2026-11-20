import fs from 'fs';

const html = fs.readFileSync('_design_ref/stitch_docmitra/system_rules_settings_modal/code.html', 'utf8');

const subnavMatches = html.match(/data-target-section="([^"]+)"/g) || [];
console.log('STITCH MODAL SUBNAV TARGETS:', subnavMatches);

const sectionMatches = html.match(/id="(settings-section-[^"]+)"/g) || [];
console.log('STITCH MODAL SECTIONS:', sectionMatches);
