import fs from 'fs';

const html = fs.readFileSync('app/index.html', 'utf8');
const settingsStart = html.indexOf('id="settings-modal-overlay"');
const chunk = html.substring(settingsStart);

const subnavMatches = chunk.match(/data-target-section="([^"]+)"/g) || [];
console.log('SUBNAV TARGETS:', subnavMatches);

const sectionMatches = chunk.match(/id="(settings-section-[^"]+)"/g) || [];
console.log('SECTIONS:', sectionMatches);
